import PDFDocument from 'pdfkit';
import { makeTransport } from './email';
import { getSupabaseClient } from './lib/supabase';

function buildPdf(order: any, items: any[]) {
  return new Promise<Buffer>((resolve) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    const title = 'Gift Lab (Pty) Ltd';
    doc.fontSize(18).text(title, { align: 'right' });
    doc.fontSize(10).text('Durban, South Africa', { align: 'right' }).moveDown();
    doc.fontSize(16).text(`Invoice ${order.invoice_number}`).moveDown();

    const sub = items.reduce((s, it) => s + it.unit_price_cents * it.qty, 0);
    doc.fontSize(12).text(`Order: ${order.id}`);
    doc.text(`Date: ${new Date().toLocaleDateString('en-ZA')}`).moveDown();

    items.forEach((it) => doc.text(`${it.title} x${it.qty} — R ${(it.unit_price_cents/100).toFixed(2)}`));
    doc.moveDown();
    doc.text(`Shipping: R ${(order.shipping_cents/100).toFixed(2)}`);
    doc.text(`Total: R ${((sub + order.shipping_cents)/100).toFixed(2)}`, { underline: true });

    doc.end();
  });
}

export async function generateAndSendInvoice(orderId: string) {
  const supabase = getSupabaseClient();
  const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (error || !order) throw error || new Error('Order not found');
  const { data: items, error: e2 } = await supabase.from('order_items').select('*').eq('order_id', orderId);
  if (e2) throw e2;

  // create invoice number if missing
  const number = order.invoice_number ?? `INV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(Math.floor(Math.random()*9999)).padStart(4,'0')}`;
  if (!order.invoice_number) await supabase.from('orders').update({ invoice_number: number }).eq('id', orderId);

  const pdf = await buildPdf({ ...order, invoice_number: number }, items ?? []);
  const path = `invoices/${number}.pdf`;

  const { error: upErr } = await supabase.storage.from('invoices').upload(path, pdf as any, {
    contentType: 'application/pdf',
    upsert: true
  });
  if (upErr) throw upErr;
  const { data: pub } = await supabase.storage.from('invoices').getPublicUrl(path) as any;
  const pdf_url = pub?.publicUrl ?? pub?.public_url ?? '';

  await supabase.from('invoices').upsert({
    order_id: orderId, number, pdf_url, amount_cents: order.total_cents
  }, { onConflict: 'number' });

  // Email (optional — fill real email in your app)
  const to = order.customer_email ?? 'orders@giftlab.co.za';
  const transporter = makeTransport();
  await transporter.sendMail({
    to, from: process.env.FROM_EMAIL!,
    subject: `Your Gift Lab Invoice ${number}`,
    text: `Hi! Thanks for your order. Pay by EFT and reply with POP. Download: ${pdf_url}`,
    attachments: [{ filename: `${number}.pdf`, content: pdf }]
  });

  return { number, pdf_url };
}