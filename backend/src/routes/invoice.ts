import { Router } from 'express';
import { generateAndSendInvoice } from '../invoice';

const r = Router();

r.post('/', async (req, res) => {
  try {
    const { orderId } = req.body ?? {};
    if (!orderId) return res.status(400).json({ ok: false, error: 'orderId required' });
    const out = await generateAndSendInvoice(orderId);
    res.json({ ok: true, ...out });
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

export default r;