import type { Handler } from "@netlify/functions";
import {
  fetchPinStatuses,
  formatShipDate,
  storefrontConfigured,
  storefrontRequest,
  toVariantGid,
  variants,
} from "../lib/storefront";

// Builds a Shopify cart from the site's cart and returns Shopify's hosted
// checkout URL. Prices, stock limits, tax and shipping are all enforced by
// Shopify at checkout, so the browser only sends product ids and quantities.
// Preorder windows (custom.preorder_starts_at / preorder_ends_at on the
// Shopify product) are enforced here, since Shopify itself doesn't know them.

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

  if (!storefrontConfigured()) {
    console.error("create-cart: SHOPIFY_SHOP_DOMAIN and a Storefront token are required");
    return json({ error: "Checkout is not configured yet." }, 503);
  }

  const items = parseItems(event.body);
  if (!items) return json({ error: "Invalid cart." }, 400);

  const missing = items.filter((item) => !variants[item.id]).map((item) => item.id);
  if (missing.length) {
    return json({ error: "Some items in your cart aren't available to buy online yet.", missing }, 422);
  }

  const buyerIp =
    event.headers["x-nf-client-connection-ip"] || event.headers["x-forwarded-for"]?.split(",")[0]?.trim();

  try {
    const statuses = await fetchPinStatuses(items.map((item) => item.id), buyerIp);

    const upcoming = items.filter((item) => statuses[item.id]?.preorder?.state === "upcoming").map((i) => i.id);
    if (upcoming.length) {
      return json({ error: "Preorders for some items in your cart haven't opened yet.", unavailable: upcoming }, 409);
    }
    const closed = items.filter((item) => statuses[item.id]?.preorder?.state === "closed").map((i) => i.id);
    if (closed.length) {
      return json({ error: "The preorder window has closed for some items in your cart.", unavailable: closed }, 409);
    }

    const lines = items.map((item) => {
      const shipDate = statuses[item.id]?.preorder?.shipDate;
      return {
        merchandiseId: toVariantGid(variants[item.id]),
        quantity: item.qty,
        // Shows on the Shopify order and the confirmation email.
        ...(shipDate ? { attributes: [{ key: "Preorder", value: `Ships by ${formatShipDate(shipDate)}` }] } : {}),
      };
    });

    const result = await storefrontRequest(CART_CREATE, { input: { lines } }, buyerIp);
    if (!result.ok) {
      console.error("create-cart: Storefront API error", result.status, JSON.stringify(result.errors));
      return json({ error: "Couldn't start checkout. Please try again." }, 502);
    }

    const created = result.data?.cartCreate;
    if (created?.userErrors?.length) {
      console.error("create-cart: userErrors", JSON.stringify(created.userErrors));
      return json({ error: created.userErrors[0].message || "Couldn't start checkout." }, 422);
    }
    if (!created?.cart?.checkoutUrl) {
      return json({ error: "Couldn't start checkout. Please try again." }, 502);
    }

    // Shopify may trim quantities that exceed available stock; the warnings say so.
    return json({
      checkoutUrl: created.cart.checkoutUrl,
      warnings: (created.warnings ?? []).map((w: { message: string }) => w.message),
    });
  } catch (error) {
    console.error("create-cart: request failed", error);
    return json({ error: "Couldn't start checkout. Please try again." }, 502);
  }
};
