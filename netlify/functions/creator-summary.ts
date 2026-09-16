import { createClient } from "@supabase/supabase-js";
import type { Handler } from "@netlify/functions";

const json = (body: unknown, statusCode = 200) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});

export const handler: Handler = async (event) => {
  try {
    const authorization = event.headers.authorization || event.headers.Authorization || "";
    const accessToken = authorization.replace(/^Bearer\s+/i, "");
    if (!accessToken) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Creator summary is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return json({ error: "Creator portal database is not configured" }, 503);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !authData.user) return json({ error: "Unauthorized" }, 401);

    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("creator_id, name, email, royalty_rate, stripe_connect_account_id")
      .eq("user_id", authData.user.id)
      .maybeSingle();
    if (creatorError) {
      console.error("Creator profile lookup failed", creatorError);
      return json({ error: "Creator profile lookup failed" }, 500);
    }
    if (!creator) return json({ error: "Creator profile not found" }, 404);

    const [{ data: products, error: productsError }, { data: production }, { data: payouts }, { data: royalties }, { data: drops }] = await Promise.all([
      supabase.from("creator_products").select("shopify_product_id, product_title, product_handle, inventory_count, status, last_synced_at").eq("creator_id", creator.creator_id).order("product_title"),
      supabase.from("production_updates").select("shopify_product_id, stage, status, notes, updated_at").eq("creator_id", creator.creator_id).order("updated_at", { ascending: false }),
      supabase.from("payouts").select("stripe_payout_id, amount, status, created_at").eq("creator_id", creator.creator_id).order("created_at", { ascending: false }),
      supabase.from("royalties").select("shopify_order_id, shopify_product_id, units_sold, revenue, royalty_amount, status, created_at, order_created_at").eq("creator_id", creator.creator_id).order("created_at", { ascending: false }),
      supabase.from("creator_drops").select("shopify_product_id, start_time, end_time, is_active").eq("creator_id", creator.creator_id).order("start_time", { ascending: false }),
    ]);
    if (productsError) console.error("Creator products lookup failed", productsError);
    const royaltyDetails = royalties || [];
    return json({
      creator,
      products: products || [],
      production: production || [],
      payouts: payouts || [],
      drops: drops || [],
      royaltyDetails,
      royalties: {
        grossSales: royaltyDetails.reduce((total, row) => total + Number(row.revenue || 0), 0),
        pendingRoyalty: royaltyDetails.filter((row) => row.status !== "paid").reduce((total, row) => total + Number(row.royalty_amount || 0), 0),
        paidRoyalty: royaltyDetails.filter((row) => row.status === "paid").reduce((total, row) => total + Number(row.royalty_amount || 0), 0),
      },
    });
  } catch (error) {
    console.error("Creator summary function failed", error);
    return json({ error: "Creator summary could not be loaded" }, 500);
  }
};