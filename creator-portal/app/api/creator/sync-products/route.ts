import { NextResponse } from "next/server";
import { requireCreatorSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { fetchProductsByCreatorId } from "@/lib/shopify";

type ShopifyProduct = {
  id: string;
  title: string;
  handle: string;
  status: string;
  totalInventory: number | null;
  featuredImage?: { url?: string | null } | null;
  variants?: { nodes?: Array<{ price?: string | null }> };
};

export async function POST() {
  const session = await requireCreatorSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("creator_id")
      .eq("creator_id", session.creatorId)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    const products = (await fetchProductsByCreatorId(session.creatorId)) as ShopifyProduct[];
    const rows = products.map((product) => ({
      creator_id: creator.creator_id,
      shopify_product_id: product.id,
      product_title: product.title,
      product_handle: product.handle,
      image_url: product.featuredImage?.url ?? null,
      price: Number(product.variants?.nodes?.[0]?.price || 0),
      inventory_count: product.totalInventory ?? 0,
      status: product.status.toLowerCase(),
      last_synced_at: new Date().toISOString(),
    }));

    if (rows.length > 0) {
      const { error } = await supabase
        .from("creator_products")
        .upsert(rows, { onConflict: "shopify_product_id" });

      if (error) {
        throw error;
      }
    }

    return NextResponse.json({ ok: true, count: rows.length });
  } catch (error) {
    console.error("Product sync failed", error);
    return NextResponse.json({ error: "Product sync failed" }, { status: 502 });
  }
}
