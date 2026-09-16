# Netlify deployment

This repository now runs as one Netlify site. The storefront is static HTML and the
creator dashboard is a static page backed by a Netlify Function.

## Storefront site

1. Create one Netlify site from this repository.
2. Set the base directory to the repository root.
3. Use the included root `netlify.toml`; it publishes the storefront and deploys the function in `netlify/functions`.

## Environment variables

Add these environment variables in the single Netlify site settings:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Any Shopify and Stripe variables listed in `creator-portal/.env.example`

The portal is available at `/creator-portal.html` on the same site. Creator data is
loaded through `/.netlify/functions/creator-summary`, which is exposed as
`/api/creator/summary` by the included rewrite.

## Supabase URL settings

In Supabase Authentication settings, add the deployed storefront URL plus
`/login-signup.html` to the allowed redirect URLs. Also set the site URL to the
deployed storefront URL. This is required for Google OAuth and email confirmation.