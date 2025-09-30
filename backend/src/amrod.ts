import fetch from 'node-fetch';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
function getSupabaseClient() {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE must be set in environment');
  _supabase = createClient(url, key);
  return _supabase;
}

export async function getAmrodToken() {
  const url = process.env.AMROD_IDENTITY_URL!;
  // Try form-urlencoded first (some legacy APIs expect this)
  const params = new URLSearchParams();
  params.append('Email', process.env.AMROD_EMAIL ?? '');
  params.append('Password', process.env.AMROD_PASSWORD ?? '');
  params.append('CustomerNumber', process.env.AMROD_CUSTOMER_NUMBER ?? '');

  let res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  // If form-encoded attempt fails with 400, also try JSON payload as a fallback
  if (!res.ok && res.status === 400) {
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Email: process.env.AMROD_EMAIL,
          Password: process.env.AMROD_PASSWORD,
          CustomerNumber: process.env.AMROD_CUSTOMER_NUMBER,
        }),
      });
    } catch (e) {
      // fall through to error handling below
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(()=>'<no body>');
    throw new Error(`Amrod auth failed ${res.status} - ${text}`);
  }

  const data: any = await res.json().catch(()=>null);
  // token may be in different keys depending on API version
  return data?.token || data?.access_token || data?.Token || data?.accessToken;
}

export async function syncAmrodProducts(page = 1, pageSize = 200) {
  const token = await getAmrodToken();
  const url = `${process.env.AMROD_PRODUCTS_URL}?Page=${page}&PageSize=${pageSize}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Amrod fetch failed ${res.status}`);
  const payload: any = await res.json();
  const list: any[] = payload?.items ?? payload ?? [];

  const rows = list.map((p: any) => ({
    amrod_id: String(p?.id ?? p?.productId ?? p?.Code),
    name: p?.name ?? p?.Description,
    code: p?.code ?? p?.Code ?? null,
    price_cents: Math.round(((p?.price ?? p?.SellingPrice) ?? 0) * 100),
    brand: p?.brand ?? null,
    category: p?.categoryName ?? null,
    image_url: p?.imageUrl ?? p?.ImageUrl ?? null,
    raw: p
  }));

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('amrod_products').upsert(rows, { onConflict: 'amrod_id' });
  if (error) throw error;
  return rows.length;
}