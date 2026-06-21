import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { items, shippingAddress } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "No items in cart" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const pinIds = items.map((item: { pin_id: string }) => item.pin_id);
    const { data: pins, error: pinsError } = await supabase
      .from("pins")
      .select("id, price")
      .in("id", pinIds);

    if (pinsError || !pins) {
      return new Response(JSON.stringify({ error: "Failed to verify prices" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const pinPriceMap = new Map(pins.map((pin: { id: string; price: number }) => [pin.id, Number(pin.price)]));

    let totalPrice = 0;
    const validatedItems = items.map((item: { pin_id: string; quantity: number }) => {
      const price = pinPriceMap.get(item.pin_id);

      if (price === undefined || price === null) {
        throw new Error(`Pin ${item.pin_id} not found`);
      }

      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity < 1) {
        throw new Error(`Invalid quantity for pin ${item.pin_id}`);
      }

      totalPrice += price * quantity;

      return {
        pin_id: item.pin_id,
        quantity,
        price_at_purchase: price,
      };
    });

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
      return new Response(JSON.stringify({ error: "Failed to create order" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(
        validatedItems.map((item) => ({
          order_id: order.id,
          pin_id: item.pin_id,
          quantity: item.quantity,
          price_at_purchase: item.price_at_purchase,
        }))
      );

    if (itemsError) {
      console.error("Order items error:", itemsError);
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      return new Response(JSON.stringify({ error: "Failed to create order items" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        totalPrice,
        message: "Order created successfully",
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});