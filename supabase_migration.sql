-- Drop existing orders table and recreate with correct structure
DROP TABLE IF EXISTS public.orders CASCADE;

-- New orders table (header only, no pin details)
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text DEFAULT 'pending',
  total_price numeric NOT NULL,
  shipping_address jsonb,
  payment_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- New order_items table (line items)
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  pin_id uuid NOT NULL,
  quantity smallint NOT NULL DEFAULT 1,
  price_at_purchase numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_pin_id_fkey FOREIGN KEY (pin_id) REFERENCES public.pins(id)
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can only create their own orders
CREATE POLICY "Users can create own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: System/Edge Functions can update orders (via service role)
CREATE POLICY "Service role can update orders" ON public.orders
  FOR UPDATE USING (true) WITH CHECK (true);

-- RLS Policy: Users can view order items for their orders
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- RLS Policy: System/Edge Functions can insert order items
CREATE POLICY "Service role can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- RLS for pins: public read, only creators/admins can write
ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pins" ON public.pins FOR SELECT USING (true);
CREATE POLICY "Creators can insert pins" ON public.pins
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.creators WHERE creators.id = pins.creator_id
  ) OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Creators can update own pins" ON public.pins
  FOR UPDATE USING (auth.uid() IN (
    SELECT user_id FROM public.creators WHERE creators.id = pins.creator_id
  ) OR auth.jwt() ->> 'role' = 'admin');
