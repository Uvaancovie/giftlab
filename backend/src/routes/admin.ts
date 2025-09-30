import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { getSupabaseClient } from '../lib/supabase';

const r = Router();
const supabase = () => getSupabaseClient();
// multer in-memory storage (small images); for large files switch to disk storage
const upload = multer({ storage: multer.memoryStorage() });

// naive auth gate placeholder; replace with real admin JWT
function adminOnly(req: any, res: any, next: any) {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_API_KEY) return res.status(401).json({ ok:false, error:'unauthorized' });
  next();
}

r.get('/analytics', adminOnly, async (_req, res) => {
  const supabase = getSupabaseClient();
  const { data: orders } = await supabase.from('orders').select('total_cents,status,created_at');
  const paid = (orders ?? []).filter((o:any)=>o.status==='paid');
  const gmv = paid.reduce((s:any,o:any)=>s+o.total_cents,0);
  const aov = paid.length ? Math.round(gmv/paid.length) : 0;
  res.json({ ok: true, gmv_cents: gmv, aov_cents: aov, orders_count: orders?.length ?? 0, paid_count: paid.length });
});

// Admin: create retail product
// Use `upload.single('image')` to accept an optional file named 'image'
r.post('/products', adminOnly, upload.single('image'), async (req: any, res: any) => {
  try {
    const body = req.body ?? {};
  const allowed = (({ sku, title, description, category, price_cents, currency, image_url, stock, is_active }) => ({ sku, title, description, category, price_cents, currency, image_url, stock, is_active }))(body);
  if (!allowed.title || !allowed.price_cents) return res.status(400).json({ ok: false, error: 'title and price_cents required' });
    // If an image file was uploaded, upload it to Supabase Storage and set image_url
    const supabaseClient = getSupabaseClient();
    if (req.file && req.file.buffer) {
      const fileExt = path.extname(req.file.originalname || '') || '.jpg';
      const safeName = `${Date.now()}-${(req.file.originalname || 'upload').replace(/[^a-zA-Z0-9.-]/g, '_')}`.slice(0, 200) + fileExt;
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'public';
      let upload = await supabaseClient.storage.from(bucket).upload(safeName, req.file.buffer, { contentType: req.file.mimetype });
      // If bucket missing, try to create it and retry once
      if (upload.error) {
        const msg = (upload.error as any)?.message || String(upload.error);
        console.error('Initial Supabase storage upload error', upload.error, { bucket });
        try {
          console.info('Attempting to create storage bucket:', bucket);
          // attempt to create a public bucket
          // createBucket may require project-level privileges (service role key should work)
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const created = await supabaseClient.storage.createBucket(bucket, { public: true }).catch((err:any)=>{ throw err });
          console.info('Bucket create result', created);
        } catch (createErr:any) {
          console.error('Failed to create bucket', createErr);
          const u: any = upload;
          return res.status(500).json({ ok: false, error: 'failed to upload image: bucket missing and could not create' });
        }
        // retry upload
        upload = await supabaseClient.storage.from(bucket).upload(safeName, req.file.buffer, { contentType: req.file.mimetype });
        if (upload.error) {
          const u: any = upload;
          console.error('Supabase storage upload failed after creating bucket', upload.error, { bucket, path: u?.data?.path });
          return res.status(500).json({ ok: false, error: 'failed to upload image' });
        }
      }
      const { data: urlData } = supabaseClient.storage.from(bucket).getPublicUrl((upload as any).data.path);
      allowed.image_url = urlData.publicUrl;
    }

    // Ensure currency has a sensible default and don't send undefined fields to the DB
    if (!allowed.currency) allowed.currency = 'ZAR';
    const cleaned: any = Object.fromEntries(Object.entries(allowed).filter(([, v]) => v !== undefined));
    const { data, error } = await supabaseClient.from('products').insert([cleaned]).select().single();
    if (error) {
      console.error('Failed to insert product', error, { cleaned });
      return res.status(500).json({ ok: false, error: error.message });
    }
    res.json({ ok: true, product: data });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message ?? String(e) });
  }
});

export default r;