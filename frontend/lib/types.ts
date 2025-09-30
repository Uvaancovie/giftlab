export interface Product {
  id: string;
  sku?: string;
  title: string;
  description?: string;
  price_cents: number;
  currency: string;
  image_url?: string;
  stock?: number;
  is_active: boolean;
  source: string;
}

export interface AmrodProduct {
  amrod_id: string;
  name: string;
  code?: string;
  price_cents: number;
  currency: string;
  brand?: string;
  category?: string;
  image_url?: string;
}

export interface CartItem {
  id: string;
  product_source: string;
  product_ref: string;
  title: string;
  unit_price_cents: number;
  qty: number;
  image_url?: string;
}

export interface Order {
  id: string;
  status: string;
  total_cents: number;
  shipping_cents: number;
  currency: string;
  invoice_number?: string;
  created_at: string;
  paid_at?: string;
}