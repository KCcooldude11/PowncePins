# Creator Portal Starter

This Next.js app is a starter for a custom Creator Portal that uses Shopify as a backend data source while keeping the portal fully custom and hosted on your own website.

## Included
- JWT-based creator auth with a secure cookie session
- Protected dashboard route
- API route for creator login
- API route for aggregated creator summary data
- Shopify utilities for product, inventory, and fulfillment data
- Royalty calculation helper
- Stripe payout integration scaffold
- Mock data so the portal works locally before you connect a real database

## Environment variables
Create a `.env.local` file based on `.env.example`:

```bash
JWT_SECRET=replace-with-a-long-random-secret
SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=your-shopify-admin-access-token
STRIPE_SECRET_KEY=your-stripe-secret-key
```

Never commit `.env.local`. The Shopify Admin token and Supabase service-role key are server secrets.

## Connect Supabase and Shopify

The canonical full-site schema is `../supabase_creator_platform.sql`. Run that file in Supabase SQL Editor. Do not run the older portal-only migration as well.

1. Rotate any Shopify token that was pasted into chat or source code, then create a replacement Admin API token with only the required read scopes: products, inventory, orders, and metafields.
2. In Supabase SQL Editor, run `supabase_creator_portal.sql`.
3. Copy your Supabase project URL and service-role key into `.env.local`.
4. Set `SHOPIFY_SHOP_DOMAIN` and the replacement `SHOPIFY_ADMIN_ACCESS_TOKEN`. The current code uses API version `2026-07` through `SHOPIFY_API_VERSION`.
5. Generate a creator password hash locally:

```bash
npm run hash-password -- "use-a-real-password-here"
```

6. Insert the resulting hash into `public.creators` using the example at the bottom of `supabase_creator_portal.sql`.
7. Create Shopify product metafields in namespace `custom` with keys `creator_id`, `royalty_rate`, `drop_start`, and `drop_end`. Set `custom.creator_id` to the same value as `creators.creator_id`.
8. Start the portal and sign in with the inserted creator:

```bash
npm run dev
```

The protected summary route reads creator-scoped data from Supabase and reads matching Shopify products through the Admin GraphQL API. The `/api/creator/sync-products` POST route can persist those live Shopify products into `creator_products`.

## Checkout link boundary

Shopify Checkout Links are pre-created URLs; the Shopify Admin API does not create a new combined checkout session from arbitrary Supabase cart rows. The `/api/checkout` route resolves a configured single-product link from `SHOPIFY_CHECKOUT_LINKS_JSON`. Multi-item carts require either Shopify cart permalinks built from variant IDs or a Shopify Storefront Cart API integration. Keep the existing storefront `checkout_links.json` as the source of truth until that cart decision is made.

## Run locally

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000/login
```

## Important architecture notes
- Use Shopify Admin API as the backend source of truth for orders and product metadata.
- Store creator records in your own database with `creatorId`, `email`, `productIds`, `royaltyRate`, and `stripeConnectAccountId`.
- Keep product metafields for `creatorId`, `royaltyRate`, and drop start/end timestamps.
- Restrict each creator to viewing only their own product and payout data by filtering on `creatorId` and product IDs from your database.
- Replace mock data in `lib/mock-data.ts` with real database and Shopify fetches before production.

## Suggested next steps
1. Add a real Postgres or Supabase database schema for creators, products, drops, payouts, and production status.
2. Replace mock login with secure database-backed authentication.
3. Fetch Shopify orders and product metadata with GraphQL filtered by product IDs tied to each creator.
4. Add a real payout summary page and production tracker.
5. Add charting and tables for sales, royalty totals, and drop countdowns.
