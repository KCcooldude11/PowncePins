type ShopifyConfig = {
  shopDomain: string;
  accessToken: string;
};

export function getShopifyConfig(): ShopifyConfig | null {
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!shopDomain || !accessToken) {
    return null;
  }

  return { shopDomain, accessToken };
}

async function shopifyGraphql<T>(query: string, variables: Record<string, unknown> = {}) {
  const config = getShopifyConfig();
  if (!config) {
    throw new Error("SHOPIFY_SHOP_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN are required");
  }

  const version = process.env.SHOPIFY_API_VERSION || "2026-07";
  const response = await fetch(`https://${config.shopDomain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": config.accessToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    throw new Error(`Shopify GraphQL request failed: ${JSON.stringify(payload.errors || response.status)}`);
  }

  return payload.data as T;
}

export async function fetchProductsByCreatorId(creatorId: string) {
  const data = await shopifyGraphql<{ products: { edges: Array<{ node: unknown }> } }>(
    `query ProductsByCreator($query: String!) {
      products(first: 100, query: $query) {
        edges {
          node {
            id
            title
            handle
            status
            totalInventory
            featuredImage { url altText }
            variants(first: 50) {
              nodes { id sku price inventoryQuantity }
            }
            metafields(first: 20, namespace: "custom") {
              nodes { namespace key value type }
            }
          }
        }
      }
    }`,
    { query: `metafield:custom.creator_id:${creatorId}` },
  );

  return data.products.edges.map((edge) => edge.node);
}

export async function fetchProductsByIds(productIds: string[]) {
  const config = getShopifyConfig();

  if (!config || productIds.length === 0) {
    return [];
  }

  const query = `
    query($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product {
          id
          title
          handle
          productType
          status
          totalInventory
          variants(first: 10) {
            edges {
              node {
                id
                sku
                inventoryQuantity
                price
              }
            }
          }
          media(first: 10) {
            nodes {
              ... on MediaImage {
                image {
                  url
                }
              }
            }
          }
          metafields(first: 20) {
            edges {
              node {
                namespace
                key
                value
                type
              }
            }
          }
        }
      }
    }
  `;

  const ids = productIds.map((id) => `gid://shopify/Product/${id.replace("gid://shopify/Product/", "")}`);

  const version = process.env.SHOPIFY_API_VERSION || "2026-07";
  const response = await fetch(`https://${config.shopDomain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": config.accessToken,
    },
    body: JSON.stringify({ query, variables: { ids } }),
  });

  if (!response.ok) {
    throw new Error(`Shopify products request failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload?.data?.nodes ?? [];
}

export async function fetchOrdersByProductIds(productIds: string[]) {
  const config = getShopifyConfig();

  if (!config || productIds.length === 0) {
    return [];
  }

  const ids = productIds.map((id) => `gid://shopify/Product/${id.replace("gid://shopify/Product/", "")}`);
  const query = `
    query($productIds: [ID!]!) {
      products(first: 50, query: "id:${ids.join(" OR id:")}") {
        edges {
          node {
            id
            title
            variants(first: 10) {
              edges {
                node {
                  id
                  inventoryQuantity
                }
              }
            }
          }
        }
      }
    }
  `;

  const version = process.env.SHOPIFY_API_VERSION || "2026-07";
  const response = await fetch(`https://${config.shopDomain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": config.accessToken,
    },
    body: JSON.stringify({ query, variables: { productIds: ids } }),
  });

  if (!response.ok) {
    throw new Error(`Shopify orders request failed: ${response.status}`);
  }

  const payload = await response.json();

  return payload?.data?.products?.edges?.map((edge: { node: unknown }) => edge.node) ?? [];
}

export async function fetchInventoryByProductIds(productIds: string[]) {
  const config = getShopifyConfig();

  if (!config || productIds.length === 0) {
    return [];
  }

  const products = await fetchProductsByIds(productIds);
  return products.map((product: any) => ({
    id: product.id,
    title: product.title,
    totalInventory: product.totalInventory ?? 0,
    variants: product.variants?.edges?.map((edge: any) => edge.node) ?? [],
  }));
}

export async function fetchFulfillmentStatusForOrderIds(orderIds: string[]) {
  const config = getShopifyConfig();

  if (!config || orderIds.length === 0) {
    return [];
  }

  const query = `
    query($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Order {
          id
          name
          fulfillmentStatus
          financialStatus
          totalPrice
        }
      }
    }
  `;

  const ids = orderIds.map((id) => `gid://shopify/Order/${id.replace("gid://shopify/Order/", "")}`);

  const version = process.env.SHOPIFY_API_VERSION || "2026-07";
  const response = await fetch(`https://${config.shopDomain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": config.accessToken,
    },
    body: JSON.stringify({ query, variables: { ids } }),
  });

  if (!response.ok) {
    throw new Error(`Shopify fulfillment request failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload?.data?.nodes ?? [];
}
