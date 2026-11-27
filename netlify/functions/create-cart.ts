import type { Handler } from "@netlify/functions";
import variantMap from "../../shopify_variants.json";

// Builds a Shopify cart from the site's cart and returns Shopify's hosted
// checkout URL. Prices, stock limits, tax and shipping are all enforced by
// Shopify at checkout, so the browser only sends product ids and quantities.

const MAX_QTY_PER_LINE = 20;
const MAX_LINES = 50;

const json = (body: unknown, statusCode = 200) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});

const CART_CREATE = `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { id checkoutUrl totalQuantity }
      userErrors { field message code }
      warnings { code message }
    }
  }
`;

type CartItem = { id: string; qty: number };

function toVariantGid(value: string) {
  return value.startsWith("gid://") ? value : `gid://shopify/ProductVariant/${value}`;
}

function parseItems(body: string | null): CartItem[] | null {
  try {
    const parsed = JSON.parse(body || "{}");
    if (!Array.isArray(parsed.items) || parsed.items.length === 0 || parsed.items.length > MAX_LINES) return null;
    const items: CartItem[] = [];
    for (const item of parsed.items) {
      const qty = Number(item?.qty);
      if (typeof item?.id !== "string" || !Number.isInteger(qty) || qty < 1) return null;
      items.push({ id: item.id, qty: Math.min(qty, MAX_QTY_PER_LINE) });
    }
    return items;
  } catch {
    return null;
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return json({ error: "Method not allowed" }, 405);

  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
  const privateToken = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
  const publicToken = process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN;
  const apiVersion = process.env.SHOPIFY_API_VERSION || "2026-07";
  if (!shopDomain || (!privateToken && !publicToken)) {
    console.error("create-cart: SHOPIFY_SHOP_DOMAIN and a Storefront token are required");
    return json({ error: "Checkout is not configured yet." }, 503);
  }

  const items = parseItems(event.body);
  if (!items) return json({ error: "Invalid cart." }, 400);

  const variants = variantMap as Record<string, string>;
  const missing = items.filter((item) => !variants[item.id]).map((item) => item.id);
  if (missing.length) {
    return json({ error: "Some items in your cart aren't available to buy online yet.", missing }, 422);
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (privateToken) {
    headers["Shopify-Storefront-Private-Token"] = privateToken;
    const buyerIp = event.headers["x-nf-client-connection-ip"] || event.headers["x-forwarded-for"]?.split(",")[0]?.trim();
    if (buyerIp) headers["Shopify-Storefront-Buyer-IP"] = buyerIp;
  } else {
    headers["X-Shopify-Storefront-Access-Token"] = publicToken as string;
  }

  try {
    const response = await fetch(`https://${shopDomain}/api/${apiVersion}/graphql.json`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: CART_CREATE,
        variables: {
          input: {
            lines: items.map((item) => ({ merchandiseId: toVariantGid(variants[item.id]), quantity: item.qty })),
          },
        },
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || payload.errors?.length) {
      console.error("create-cart: Storefront API error", response.status, JSON.stringify(payload?.errors ?? payload));
      return json({ error: "Couldn't start checkout. Please try again." }, 502);
    }

    const result = payload.data?.cartCreate;
    if (result?.userErrors?.length) {
      console.error("create-cart: userErrors", JSON.stringify(result.userErrors));
      return json({ error: result.userErrors[0].message || "Couldn't start checkout." }, 422);
    }
    if (!result?.cart?.checkoutUrl) {
      return json({ error: "Couldn't start checkout. Please try again." }, 502);
    }

    // Shopify may trim quantities that exceed available stock; the warnings say so.
    return json({
      checkoutUrl: result.cart.checkoutUrl,
      warnings: (result.warnings ?? []).map((w: { message: string }) => w.message),
    });
  } catch (error) {
    console.error("create-cart: request failed", error);
    return json({ error: "Couldn't start checkout. Please try again." }, 502);
  }
};
