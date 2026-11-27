import variantMap from "../../shopify_variants.json";

// Shared Shopify Storefront API helpers for the Netlify functions.

export const variants = variantMap as Record<string, string>;

export function toVariantGid(value: string) {
  return value.startsWith("gid://") ? value : `gid://shopify/ProductVariant/${value}`;
}

export function storefrontConfigured() {
  return Boolean(
    process.env.SHOPIFY_SHOP_DOMAIN &&
      (process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN || process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN),
  );
}

export async function storefrontRequest(
  query: string,
  variables: Record<string, unknown>,
  buyerIp?: string,
): Promise<{ ok: boolean; status: number; data?: any; errors?: any[] }> {
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
  const privateToken = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
  const publicToken = process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN;
  const apiVersion = process.env.SHOPIFY_API_VERSION || "2026-07";

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (privateToken) {
    headers["Shopify-Storefront-Private-Token"] = privateToken;
    if (buyerIp) headers["Shopify-Storefront-Buyer-IP"] = buyerIp;
  } else {
    headers["X-Shopify-Storefront-Access-Token"] = publicToken as string;
  }

  const response = await fetch(`https://${shopDomain}/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json().catch(() => null);
  return { ok: response.ok && !!payload && !payload.errors?.length, status: response.status, data: payload?.data, errors: payload?.errors };
}

export type PinStatus = {
  price: number | null;
  availableForSale: boolean;
  quantityAvailable: number | null;
  preorder: {
    shipDate: string | null;
    startsAt: string | null;
    endsAt: string | null;
    // upcoming: before startsAt; open: taking preorders; closed: after endsAt
    state: "upcoming" | "open" | "closed";
  } | null;
};

const variantFields = (withQuantity: boolean) => `
  id
  availableForSale
  ${withQuantity ? "quantityAvailable" : ""}
  price { amount }
  product {
    shipDate: metafield(namespace: "custom", key: "preorder_ship_date") { value }
    startsAt: metafield(namespace: "custom", key: "preorder_starts_at") { value }
    endsAt: metafield(namespace: "custom", key: "preorder_ends_at") { value }
  }
`;

// Fetches live price, stock and preorder details for the given site product ids.
// quantityAvailable needs the Storefront inventory scope; without it the query
// is retried without that field and quantityAvailable comes back null.
export async function fetchPinStatuses(productIds: string[], buyerIp?: string): Promise<Record<string, PinStatus>> {
  const mapped = productIds.filter((id) => variants[id]);
  if (!mapped.length) return {};
  const ids = mapped.map((id) => toVariantGid(variants[id]));

  const run = (withQuantity: boolean) =>
    storefrontRequest(
      `query PinStatus($ids: [ID!]!) { nodes(ids: $ids) { ... on ProductVariant { ${variantFields(withQuantity)} } } }`,
      { ids },
      buyerIp,
    );

  let result = await run(true);
  if (!result.ok && JSON.stringify(result.errors ?? "").includes("quantityAvailable")) {
    result = await run(false);
  }
  if (!result.ok) {
    throw new Error(`Storefront status query failed (${result.status}): ${JSON.stringify(result.errors)}`);
  }

  const now = Date.now();
  const statuses: Record<string, PinStatus> = {};
  (result.data?.nodes ?? []).forEach((node: any, index: number) => {
    if (!node) return;
    const shipDate = node.product?.shipDate?.value ?? null;
    const startsAt = node.product?.startsAt?.value ?? null;
    const endsAt = node.product?.endsAt?.value ?? null;
    statuses[mapped[index]] = {
      price: node.price?.amount != null ? Number(node.price.amount) : null,
      availableForSale: Boolean(node.availableForSale),
      quantityAvailable: typeof node.quantityAvailable === "number" ? node.quantityAvailable : null,
      preorder: shipDate || startsAt || endsAt
        ? { shipDate, startsAt, endsAt, state: preorderState(startsAt, endsAt, now) }
        : null,
    };
  });
  return statuses;
}

export function preorderState(startsAt: string | null, endsAt: string | null, now = Date.now()) {
  if (startsAt && new Date(startsAt).getTime() > now) return "upcoming" as const;
  if (endsAt && new Date(endsAt).getTime() <= now) return "closed" as const;
  return "open" as const;
}

// "2027-06-05" -> "June 5, 2027" (dates have no time zone, so format in UTC)
export function formatShipDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
