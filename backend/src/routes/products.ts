import { Router } from 'express';
import { getSupabaseClient } from '../lib/supabase';

const r = Router();

// GET /products -> list active retail products
r.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const q = (req.query.search as string | undefined) ?? '';
    const page = Math.max(1, Number(req.query.page ?? 1));
    const size = Math.min(100, Number(req.query.size ?? 24));
    const offset = (page - 1) * size;
    const category = (req.query.category as string | undefined) ?? '';
    const priceMin = req.query.price_min ? Number(req.query.price_min) : undefined;
    const priceMax = req.query.price_max ? Number(req.query.price_max) : undefined;

  // Build base query
  let queryBuilder = supabase.from('products').select('*').eq('is_active', true);

  // Sorting
  const sort = (req.query.sort as string | undefined) ?? '';
  if (sort === 'price_asc') queryBuilder = queryBuilder.order('price_cents', { ascending: true });
  else if (sort === 'price_desc') queryBuilder = queryBuilder.order('price_cents', { ascending: false });
  else if (sort === 'newest') queryBuilder = queryBuilder.order('created_at', { ascending: false });
  else queryBuilder = queryBuilder.order('title');

    // Apply search
    if (q && q.trim().length > 0) {
      const term = q.trim();
      const orFilter = `title.ilike.%${term}%,description.ilike.%${term}%,sku.ilike.%${term}%`;
      queryBuilder = supabase.from('products').select('*').or(orFilter).eq('is_active', true).order('title');
    }

    // Apply category filter
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    // Apply price filters (price stored in cents)
    if (typeof priceMin === 'number' && !Number.isNaN(priceMin)) {
      queryBuilder = queryBuilder.gte('price_cents', Math.round(priceMin));
    }
    if (typeof priceMax === 'number' && !Number.isNaN(priceMax)) {
      queryBuilder = queryBuilder.lte('price_cents', Math.round(priceMax));
    }

    const resp = await queryBuilder.range(offset, offset + size - 1);
    if (resp.error) return res.status(500).json({ ok: false, error: resp.error.message || resp.error });
    res.json({ ok: true, products: resp.data });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /products/categories -> list distinct categories
r.get('/categories', async (_req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('products').select('category').not('category', 'is', null);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    const cats = Array.from(new Set((data ?? []).map((r:any)=>r.category).filter(Boolean)));
    res.json({ ok: true, categories: cats });
  } catch (e:any) {
    res.status(500).json({ ok: false, error: e?.message ?? String(e) });
  }
});

// GET /products/:id -> single product
r.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const id = req.params.id;
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    if (!data) return res.status(404).json({ ok: false, error: 'not found' });
    res.json({ ok: true, product: data });
  } catch (e:any) {
    res.status(500).json({ ok: false, error: e?.message ?? String(e) });
  }
});

export default r;
