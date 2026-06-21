# Backend Integration Setup

## Status: Ready to Deploy

You now have:
1. ✅ **Database Schema** - Orders + Order Items with RLS
2. ✅ **Edge Function Code** - Checkout handler (server-side validation)
3. ✅ **Frontend Integration** - Checkout form wired to Edge Function

## Next Steps: Deploy Edge Function

### Option A: Quick Deploy (Recommended)

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click **Create a New Function** → Name it `create-checkout-session`
3. Copy the code from `createCheckoutSession.ts` and paste it into the editor
4. Click **Deploy**

### Option B: Using Supabase CLI

```bash
supabase functions deploy create-checkout-session --project-id your_project_id
```

## How It Works

**Frontend → Edge Function → Database**

1. User fills checkout form + clicks "Checkout"
2. Frontend calls: `supabase.functions.invoke('create-checkout-session', { body: { items, shippingAddress } })`
3. Edge Function:
   - Validates user is logged in
   - Verifies prices from database (prevents price tampering)
   - Creates `orders` record
   - Creates `order_items` records
   - Returns order ID
4. Frontend clears cart and confirms order

## Security Features Now In Place

- ✅ Users can only create/view their own orders (RLS policies)
- ✅ Prices validated server-side (can't submit fake totals)
- ✅ Edge Function runs with service role (trusted environment)
- ✅ Cart data never trusted from browser

## Testing the Integration

1. Log in at `login-signup.html`
2. Add items to cart
3. Go to checkout
4. Fill form and submit
5. Should see "Order created successfully" if function is deployed

## Next Phase (Optional)

Once Edge Function is working:
1. Integrate Stripe for payment processing
2. Add webhook to update order status after payment
3. Send confirmation emails

---

**Questions?** Check Supabase docs: https://supabase.com/docs/guides/functions
