# Shopify cart checkout setup

The site's cart now sends every item to Shopify in one go. A Netlify function
(`netlify/functions/create-cart.ts`, served at `/api/cart`) builds a Shopify cart
through the Storefront API and returns Shopify's hosted checkout URL. Shopify
handles price, stock limits, shipping, tax and payment.

## 1. Install the Headless channel (free, works on Basic)

1. Shopify admin → **Settings → Apps and sales channels → Shopify App Store**, search **Headless**, install it.
2. Open **Sales channels → Headless → Create storefront**.
3. Under **Storefront API permissions**, make sure the cart scopes are on
   (`unauthenticated_write_checkouts`, `unauthenticated_read_product_listings`).
4. Copy the **private access token**.
5. Publish every pin product to the **Headless** sales channel (product page → Sales channels). Products not published there can't be added to a cart.

## 2. Netlify environment variables

Site configuration → Environment variables:

| Name | Value |
| --- | --- |
| `SHOPIFY_SHOP_DOMAIN` | `wh4pab-2s.myshopify.com` |
| `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` | the private token from step 1 |
| `SHOPIFY_API_VERSION` | optional, defaults to `2026-07` |

Mark the token as a secret. Never put it in front-end code.

## 3. Map site products to Shopify variants

Edit `shopify_variants.json`. Keys are the site's product ids (`p001`, `p004` ...),
values are the Shopify **variant** id (a number, or a full `gid://shopify/ProductVariant/...`).

Find a variant id: Products → open the pin → click the variant (or the single
"Default" variant) → the number at the end of the URL after `/variants/`.

```json
{
  "p004": "45678901234567"
}
```

Products with no entry (or an empty string) show "aren't available to buy online
yet" in the cart instead of checking out.

## 4. Preorder limits

Shopify stops sales at the inventory count when **Track quantity** is on and
**Continue selling when out of stock** is off. For a preorder, enter the sellable
count (for example 130) as inventory before the pins arrive.

## Testing locally

`python -m http.server` can't run Netlify functions. Use `netlify dev` (after
`netlify link`) so `/api/cart` works locally with your env vars.
