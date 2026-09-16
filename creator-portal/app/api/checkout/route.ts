import { NextResponse } from "next/server";
import { z } from "zod";

const CheckoutSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(50).default(1),
});

function getCheckoutLinks() {
  try {
    return JSON.parse(process.env.SHOPIFY_CHECKOUT_LINKS_JSON || "{}");
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const parsed = CheckoutSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });
  }

  const { productId, quantity } = parsed.data;
  const link = getCheckoutLinks()[productId];

  if (!link) {
    return NextResponse.json({ error: "No Shopify Checkout Link configured for this product" }, { status: 404 });
  }

  // Existing Shopify Checkout Links are opaque URLs. Quantity can only be
  // safely applied when the link is a Shopify cart permalink; otherwise keep
  // the configured link unchanged.
  const checkoutUrl = quantity === 1 ? link : buildCartPermalink(link, quantity);
  if (!checkoutUrl) {
    return NextResponse.json({ error: "This checkout link does not support quantity changes" }, { status: 400 });
  }

  return NextResponse.json({ checkoutUrl });
}

function buildCartPermalink(link: string, quantity: number) {
  try {
    const url = new URL(link);
    const cartIndex = url.pathname.indexOf("/cart/");
    if (cartIndex === -1) return null;
    const cartParts = url.pathname.slice(cartIndex + "/cart/".length).split("/");
    if (cartParts.length !== 1 || !cartParts[0].includes(":")) return null;
    const variantId = cartParts[0].split(":")[0];
    if (!/^\d+$/.test(variantId)) return null;
    url.pathname = `${url.pathname.slice(0, cartIndex)}/cart/${variantId}:${quantity}`;
    return url.toString();
  } catch {
    return null;
  }
}
