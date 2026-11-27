import type { Handler } from "@netlify/functions";
import {
  fetchPinStatuses,
  formatShipDate,
  storefrontConfigured,
  storefrontRequest,
  toVariantGid,
  variants,
} from "../lib/storefront";
import fees from "../../shopify_fees.json";

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
type ShippingChoice = "together" | "separate";

function parseShipping(body: string | null): ShippingChoice | null {
  try {
    const value = JSON.parse(body || "{}").shipping;
    return value === "together" || value === "separate" ? value : null;
  } catch {
    return null;
  }
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

    // Group lines by when they can ship: in-stock pins now, preorders by
    // their ship date. More than one group means the shopper picks between
    // one shipment (wait for the last preorder) or one shipment per group
    // (a flat fee per extra shipment, since Shopify quotes one shipping rate
    // per order).
    const shipKey = (item: CartItem) => statuses[item.id]?.preorder?.shipDate || "now";
    const groups = [...new Set(items.map(shipKey))].sort((a, b) =>
      a === "now" ? -1 : b === "now" ? 1 : a.localeCompare(b),
    );
    const mixed = groups.length > 1;
    const shipping = mixed ? parseShipping(event.body) : null;
    if (mixed && !shipping) {
      return json({ error: "Choose how you'd like your order shipped." }, 400);
    }
    const lastShipDate = groups.filter((g) => g !== "now").pop();
    const groupLabel = (key: string) => (key === "now" ? "Ships now" : `Ships by ${formatShipDate(key)}`);

    const lines: Array<Record<string, unknown>> = items.map((item) => {
      const key = shipKey(item);
      const attributes: Array<{ key: string; value: string }> = [];
      // Shows on the Shopify order and the confirmation email.
      if (key !== "now") attributes.push({ key: "Preorder", value: groupLabel(key) });
      if (shipping === "together" && lastShipDate) {
        attributes.push({ key: "Shipment", value: `With preorder, by ${formatShipDate(lastShipDate)}` });
      } else if (shipping === "separate") {
        attributes.push({ key: "Shipment", value: `${groups.indexOf(key) + 1} of ${groups.length}: ${groupLabel(key)}` });
      }
      return {
        merchandiseId: toVariantGid(variants[item.id]),
        quantity: item.qty,
        ...(attributes.length ? { attributes } : {}),
      };
    });

    const cartAttributes: Array<{ key: string; value: string }> = [];
    if (shipping === "together" && lastShipDate) {
      cartAttributes.push({ key: "Shipping", value: `Ship together by ${formatShipDate(lastShipDate)}` });
    } else if (shipping === "separate") {
      cartAttributes.push({ key: "Shipping", value: `Ship separately (${groups.length} shipments)` });
      lines.push({ merchandiseId: toVariantGid(fees.separateShipmentFee), quantity: groups.length - 1 });
    }

    const input = { lines, ...(cartAttributes.length ? { attributes: cartAttributes } : {}) };
    const result = await storefrontRequest(CART_CREATE, { input }, buyerIp);
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
