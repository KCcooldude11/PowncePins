// Supabase Edge Function: create-checkout-session
// Deploy this to: Supabase Dashboard → Edge Functions → create-checkout-session

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    // Initialize Supabase client with user token
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );

    // Initialize Supabase client with service role (for inserts)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Parse request body
    const { items, shippingAddress } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "No items in cart" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate prices by fetching from database
    const pinIds = items.map((item: any) => item.pin_id);
    const { data: pins, error: pinsError } = await supabase
      .from("pins")
      .select("id, price")
      .in("id", pinIds);

    if (pinsError || !pins) {
      return new Response(
        JSON.stringify({ error: "Failed to verify prices" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Create a map of pin prices for validation
    const pinPriceMap = new Map(pins.map((p: any) => [p.id, p.price]));

    // Validate all items and calculate total from database prices only
    let totalPrice = 0;
    const validatedItems = items.map((item: any) => {
      const dbPrice = pinPriceMap.get(item.pin_id);
      if (dbPrice === undefined || dbPrice === null) {
        throw new Error(`Pin ${item.pin_id} not found`);
      }

      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity < 1) {
        throw new Error(`Invalid quantity for pin ${item.pin_id}`);
      }

      const price = Number(dbPrice);
      if (!Number.isFinite(price)) {
        throw new Error(`Invalid database price for pin ${item.pin_id}`);
      }

      totalPrice += price * quantity;
      return {
        pin_id: item.pin_id,
        quantity,
        price_at_purchase: price,
      };
    });

    // Create order (header)
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        total_price: totalPrice,
        status: "pending",
        shipping_address: shippingAddress,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Create order items
    const orderItems = validatedItems.map((item: any) => ({
      order_id: order.id,
      pin_id: item.pin_id,
      quantity: item.quantity,
      price_at_purchase: item.price_at_purchase,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items error:", itemsError);
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      return new Response(
        JSON.stringify({ error: "Failed to create order items" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Return order ID (Stripe integration comes later)
    return new Response(
      JSON.stringify({
        orderId: order.id,
        totalPrice: totalPrice,
        message: "Order created successfully",
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
