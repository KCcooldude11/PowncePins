import type { Handler } from "@netlify/functions";
import { fetchPinStatuses, storefrontConfigured, variants } from "../lib/storefront";

// GET /api/pin-status -> live price, stock and preorder details for every pin
// that is mapped in shopify_variants.json, keyed by the site's product id.
export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  if (!storefrontConfigured()) {
    return { statusCode: 503, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Not configured" }) };
  }

  try {
    const statuses = await fetchPinStatuses(Object.keys(variants));
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        // Short shared cache: stock and windows stay fresh without hitting Shopify on every view.
        "Cache-Control": "public, max-age=30",
        "Netlify-CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
      body: JSON.stringify({ pins: statuses, fetchedAt: new Date().toISOString() }),
    };
  } catch (error) {
    console.error("pin-status:", error);
    return { statusCode: 502, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Couldn't load pin status" }) };
  }
};
