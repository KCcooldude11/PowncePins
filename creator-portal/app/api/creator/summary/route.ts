import { NextResponse } from "next/server";
import { requireCreatorSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { fetchProductsByCreatorId } from "@/lib/shopify";

export async function GET() {
  const session = await requireCreatorSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: "Portal database is not configured" }, { status: 503 });
  }

  const { data: creator, error: creatorError } = await supabase
    .from("creators")
    .select("id, creator_id, name, email, royalty_rate, stripe_connect_account_id")
    .eq("creator_id", session.creatorId)
    .maybeSingle();

  if (creatorError || !creator) {
    return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
  }

  const [{ data: products }, { data: production }, { data: payouts }, { data: royalties }, { data: drops }] = await Promise.all([
    supabase
      .from("creator_products")
      .select("shopify_product_id, product_title, product_handle, image_url, price, inventory_count, status, last_synced_at")
      .eq("creator_id", creator.creator_id)
      .order("product_title"),
    supabase
      .from("production_updates")
      .select("shopify_product_id, stage, status, notes, updated_at")
      .eq("creator_id", creator.creator_id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("payouts")
      .select("stripe_payout_id, amount, status, created_at")
      .eq("creator_id", creator.creator_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("royalties")
      .select("shopify_order_id, shopify_product_id, units_sold, revenue, royalty_amount, status, created_at, order_created_at")
      .eq("creator_id", creator.creator_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("creator_drops")
      .select("shopify_product_id, start_time, end_time, is_active")
      .eq("creator_id", creator.creator_id)
      .order("start_time", { ascending: false }),
  ]);

  let shopifyProducts: unknown[] = [];
  try {
    shopifyProducts = await fetchProductsByCreatorId(session.creatorId);
  } catch {
    // The portal still returns database-backed production and payout data if Shopify is unavailable.
  }

  const displayedProducts = (products?.length ? products : shopifyProducts.map((product: any) => ({
    shopify_product_id: product.id,
    product_title: product.title,
    product_handle: product.handle,
    image_url: product.featuredImage?.url || "",
    price: Number(product.variants?.nodes?.[0]?.price || 0),
    inventory_count: product.totalInventory ?? 0,
    status: String(product.status || "active").toLowerCase(),
  })));

  const royaltyRows = royalties ?? [];
  const grossSales = royaltyRows.reduce((total, row) => total + Number(row.revenue || 0), 0);
  const pendingRoyalty = royaltyRows
    .filter((row) => row.status !== "paid")
    .reduce((total, row) => total + Number(row.royalty_amount || 0), 0);
  const paidRoyalty = royaltyRows
    .filter((row) => row.status === "paid")
    .reduce((total, row) => total + Number(row.royalty_amount || 0), 0);

  return NextResponse.json({
    creator: {
      creatorId: creator.creator_id,
      name: creator.name,
      email: creator.email,
      royaltyRate: Number(creator.royalty_rate),
      stripeConnectAccountId: creator.stripe_connect_account_id,
    },
    products: displayedProducts,
    shopifyProducts,
    orders: [],
    payouts: payouts ?? [],
    production: production ?? [],
    drops: drops ?? [],
    royalties: {
      grossSales,
      pendingRoyalty,
      paidRoyalty,
      royaltyRate: Number(creator.royalty_rate),
    },
    royaltyDetails: royaltyRows,
  });
}
