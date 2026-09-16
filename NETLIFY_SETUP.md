# Netlify deployment

This repository contains two applications, so deploy them as two Netlify sites.

## Storefront site

1. Create a Netlify site from this repository.
2. Set the base directory to the repository root.
3. Use the included root `netlify.toml`; it publishes the static HTML site.
4. Copy the deployed storefront URL for the portal configuration below.

## Creator portal site

1. Create a second Netlify site from the same repository.
2. Set the base directory to `creator-portal`.
3. Netlify will use `creator-portal/netlify.toml` and run `npm run build`.
4. Add these environment variables in the portal site settings:

   - `JWT_SECRET`: a long random secret
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STOREFRONT_URL`: the deployed storefront URL, including `https://`
   - Any Shopify and Stripe variables listed in `creator-portal/.env.example`

The storefront uses `/creator-portal` as the production portal path. To keep the two
Netlify sites behind one public domain, add a Netlify rewrite from `/creator-portal/*`
to the creator portal site URL. Otherwise set `window.POWNCE_CREATOR_PORTAL_URL` to
the creator portal URL before `script.js` loads on the storefront.

## Supabase URL settings

In Supabase Authentication settings, add the deployed storefront URL plus
`/login-signup.html` to the allowed redirect URLs. Also set the site URL to the
deployed storefront URL. This is required for Google OAuth and email confirmation.