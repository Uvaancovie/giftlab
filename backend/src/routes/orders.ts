import { Router } from 'express';
import { getSupabaseClient } from '../lib/supabase';
import { generateAndSendInvoice } from '../invoice';

const r = Router();

// POST /orders -> create order + items, return order id
r.post('/', async (req, res) => {
  try {
    const { user_id, items, shipping_cents = 0 } = req.body ?? {};
    if (!user_id || !Array.isArray(items) || items.length === 0) return res.status(400).json({ ok:false, error: 'user_id and items required' });
    const supabase = getSupabaseClient();
    const total = items.reduce((s:any,it:any)=>s + (it.unit_price_cents*it.qty), 0) + (shipping_cents||0);
    const { data: order, error } = await supabase.from('orders').insert([{ user_id, total_cents: total, shipping_cents, status: 'awaiting_payment' }]).select().single();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    const orderId = order.id;
    const toInsert = items.map((it:any)=>({ order_id: orderId, product_source: it.product_source, product_ref: it.product_ref, title: it.title, unit_price_cents: it.unit_price_cents, qty: it.qty, image_url: it.image_url }));
    const { error: e2 } = await supabase.from('order_items').insert(toInsert);
    if (e2) return res.status(500).json({ ok:false, error: e2.message });

    // generate invoice and send (invoice-first model)
    const out = await generateAndSendInvoice(orderId);
    res.json({ ok: true, orderId, invoice: out });
  } catch (e:any) {
    res.status(500).json({ ok:false, error: e.message });
  }
});

export default r;
