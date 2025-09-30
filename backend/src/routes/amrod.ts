import { Router } from 'express';
import { syncAmrodProducts } from '../amrod';
import { getSupabaseClient } from '../lib/supabase';

const r = Router();

// Protect in prod with an admin API key header
r.post('/sync', async (req, res) => {
  try {
    const { page = 1, size = 200 } = req.body ?? {};
    const count = await syncAmrodProducts(Number(page), Number(size));
    res.json({ ok: true, synced: count });
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

// GET cached Amrod products
r.get('/products', async (_req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('amrod_products').select('amrod_id,name,code,price_cents,image_url,brand,category').order('name').limit(200);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true, products: data });
  } catch (e:any) {
    res.status(500).json({ ok:false, error: e.message });
  }
});

export default r;