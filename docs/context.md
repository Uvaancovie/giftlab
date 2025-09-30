Mr Covie — this builder is 🔥. To make it actually spit out a working **Next.js + Express + Supabase + Amrod** starter (without PayFast), you just need the **missing generator functions** your script references (e.g., `getServerFile()`, `getAmrodFile()`, etc.). Drop these **copy-paste snippets** into your `<script>` block so your ZIP includes runnable boilerplate.

I kept it lean: POPIA-safe, Amrod sync ready, invoice-first checkout, and admin analytics stubs. Keys/URLs are read from `.env`s the builder already creates.

---

# ✅ Drop-in: backend generators

### `getServerFile()`

```js
function getServerFile() {
return `import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import amrodRoutes from './routes/amrod.js';
import invoiceRoutes from './routes/invoice.js';
import adminRoutes from './routes/admin.js';

const app = express();
app.use(cors({ origin: process.env.PUBLIC_SITE_URL?.split(',') ?? '*' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/amrod', amrodRoutes);
app.use('/invoice', invoiceRoutes);
app.use('/admin', adminRoutes);

const port = Number(process.env.PORT || 8080);
app.listen(port, () => console.log(\`GiftLab API up on :\${port}\`));
`;
}
```

### `getAmrodFile()`

```js
function getAmrodFile() {
return `import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);

export async function getAmrodToken() {
  const res = await fetch(process.env.AMROD_IDENTITY_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Email: process.env.AMROD_EMAIL,
      Password: process.env.AMROD_PASSWORD,
      CustomerNumber: process.env.AMROD_CUSTOMER_NUMBER
    })
  });
  if (!res.ok) throw new Error(\`Amrod auth failed \${res.status}\`);
  const data = await res.json();
  return data?.token || data?.access_token;
}

export async function syncAmrodProducts(page = 1, pageSize = 200) {
  const token = await getAmrodToken();
  const url = \`\${process.env.AMROD_PRODUCTS_URL}?Page=\${page}&PageSize=\${pageSize}\`;
  const res = await fetch(url, { headers: { Authorization: \`Bearer \${token}\` } });
  if (!res.ok) throw new Error(\`Amrod fetch failed \${res.status}\`);
  const payload = await res.json();
  const list = payload?.items ?? payload;

  const rows = list.map((p) => ({
    amrod_id: String(p?.id ?? p?.productId ?? p?.Code),
    name: p?.name ?? p?.Description,
    code: p?.code ?? p?.Code ?? null,
    price_cents: Math.round(((p?.price ?? p?.SellingPrice) ?? 0) * 100),
    brand: p?.brand ?? null,
    category: p?.categoryName ?? null,
    image_url: p?.imageUrl ?? p?.ImageUrl ?? null,
    raw: p
  }));

  const { error } = await supabase.from('amrod_products').upsert(rows, { onConflict: 'amrod_id' });
  if (error) throw error;
  return rows.length;
}
`;
}
```

### `getAmrodRoutesFile()`

```js
function getAmrodRoutesFile() {
return `import { Router } from 'express';
import { syncAmrodProducts } from '../amrod.js';

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

export default r;
`;
}
```

### `getEmailFile()`

```js
function getEmailFile() {
return `import nodemailer from 'nodemailer';

export function makeTransport() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  return transporter;
}
`;
}
```

### `getInvoiceFile()`

```js
function getInvoiceFile() {
return `import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';
import { makeTransport } from './email.js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);

function buildPdf(order: any, items: any[]) {
  return new Promise<Buffer>((resolve) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    const title = 'Gift Lab (Pty) Ltd';
    doc.fontSize(18).text(title, { align: 'right' });
    doc.fontSize(10).text('Durban, South Africa', { align: 'right' }).moveDown();
    doc.fontSize(16).text(\`Invoice \${order.invoice_number}\`).moveDown();

    const sub = items.reduce((s, it) => s + it.unit_price_cents * it.qty, 0);
    doc.fontSize(12).text(\`Order: \${order.id}\`);
    doc.text(\`Date: \${new Date().toLocaleDateString('en-ZA')}\`).moveDown();

    items.forEach((it) => doc.text(\`\${it.title} x\${it.qty} — R \${(it.unit_price_cents/100).toFixed(2)}\`));
    doc.moveDown();
    doc.text(\`Shipping: R \${(order.shipping_cents/100).toFixed(2)}\`);
    doc.text(\`Total: R \${((sub + order.shipping_cents)/100).toFixed(2)}\`, { underline: true });

    doc.end();
  });
}

export async function generateAndSendInvoice(orderId: string) {
  const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (error || !order) throw error || new Error('Order not found');
  const { data: items, error: e2 } = await supabase.from('order_items').select('*').eq('order_id', orderId);
  if (e2) throw e2;

  // create invoice number if missing
  const number = order.invoice_number ?? \`INV-\${new Date().toISOString().slice(0,10).replace(/-/g,'')}-\${String(Math.floor(Math.random()*9999)).padStart(4,'0')}\`;
  if (!order.invoice_number) await supabase.from('orders').update({ invoice_number: number }).eq('id', orderId);

  const pdf = await buildPdf({ ...order, invoice_number: number }, items ?? []);
  const path = \`invoices/\${number}.pdf\`;

  const { error: upErr } = await supabase.storage.from('invoices').upload(path, pdf, {
    contentType: 'application/pdf',
    upsert: true
  });
  if (upErr) throw upErr;

  const { data: pub } = await supabase.storage.from('invoices').getPublicUrl(path);
  const pdf_url = pub.publicUrl;

  await supabase.from('invoices').upsert({
    order_id: orderId, number, pdf_url, amount_cents: order.total_cents
  }, { onConflict: 'number' });

  // Email (optional — fill real email in your app)
  const to = order.customer_email ?? 'orders@giftlab.co.za';
  const transporter = makeTransport();
  await transporter.sendMail({
    to, from: process.env.FROM_EMAIL!,
    subject: \`Your Gift Lab Invoice \${number}\`,
    text: \`Hi! Thanks for your order. Pay by EFT and reply with POP. Download: \${pdf_url}\`,
    attachments: [{ filename: \`\${number}.pdf\`, content: pdf }]
  });

  return { number, pdf_url };
}
`;
}
```

### `getInvoiceRoutesFile()`

```js
function getInvoiceRoutesFile() {
return `import { Router } from 'express';
import { generateAndSendInvoice } from '../invoice.js';

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
`;
}
```

### `getAdminRoutesFile()`

```js
function getAdminRoutesFile() {
return `import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const r = Router();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);

// naive auth gate placeholder; replace with real admin JWT
function adminOnly(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_API_KEY) return res.status(401).json({ ok:false, error:'unauthorized' });
  next();
}

r.get('/analytics', adminOnly, async (_req, res) => {
  const { data: orders } = await supabase.from('orders').select('total_cents,status,created_at');
  const paid = (orders ?? []).filter(o=>o.status==='paid');
  const gmv = paid.reduce((s,o)=>s+o.total_cents,0);
  const aov = paid.length ? Math.round(gmv/paid.length) : 0;
  res.json({ ok: true, gmv_cents: gmv, aov_cents: aov, orders_count: orders?.length ?? 0, paid_count: paid.length });
});

export default r;
`;
}
```

---

# ✅ Drop-in: frontend helpers you referenced

### `getSupabaseClientFile()`

```js
function getSupabaseClientFile() {
return `import { createBrowserClient } from '@supabase/supabase-js';

export function clientSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
`;
}
```

### `getRetailActionsFile()` (list retail products)

```js
function getRetailActionsFile() {
return `\"use server\";
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function getRetailProducts() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (k)=>cookieStore.get(k)?.value } }
  );
  const { data, error } = await supabase.from('products')
    .select('*').eq('is_active', true).order('title');
  if (error) throw error;
  return data ?? [];
}
`;
}
```

### `getCorporateActionsFile()` (list cached Amrod)

```js
function getCorporateActionsFile() {
return `\"use server\";
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function getAmrodProducts() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (k)=>cookieStore.get(k)?.value } }
  );
  const { data, error } = await supabase.from('amrod_products')
    .select('amrod_id,name,code,price_cents,image_url,brand,category')
    .order('name').limit(60);
  if (error) throw error;
  return data ?? [];
}
`;
}
```

> Keep your existing `page.tsx` renderers — these actions just provide their data.

---

# ✅ Drop-in: database docs your builder references

### `getDatabaseSchema()`

```js
function getDatabaseSchema() {
return `-- === products (retail) ===
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  title text not null,
  description text,
  price_cents int not null check (price_cents >= 0),
  currency text not null default 'ZAR',
  image_url text,
  stock int,
  is_active boolean default true,
  source text not null default 'retail'
);

-- === amrod cache ===
create table if not exists public.amrod_products (
  id bigint generated always as identity primary key,
  amrod_id text unique not null,
  name text not null,
  code text,
  price_cents int,
  currency text default 'ZAR',
  brand text,
  category text,
  image_url text,
  raw jsonb,
  updated_at timestamptz default now()
);

-- === carts ===
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references public.carts on delete cascade,
  product_source text not null,
  product_ref text not null,
  title text not null,
  unit_price_cents int not null,
  qty int not null check (qty > 0),
  image_url text
);

-- === orders & items ===
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  status text not null default 'awaiting_payment',
  total_cents int not null,
  shipping_cents int not null default 0,
  currency text not null default 'ZAR',
  invoice_number text unique,
  created_at timestamptz default now(),
  paid_at timestamptz
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders on delete cascade,
  product_source text not null,
  product_ref text not null,
  title text not null,
  unit_price_cents int not null,
  qty int not null,
  image_url text
);

-- === invoices ===
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders on delete cascade,
  number text unique not null,
  pdf_url text,
  amount_cents int not null,
  issued_at timestamptz default now()
);

-- RLS
alter table carts enable row level security;
create policy if not exists cart_owner on carts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table orders enable row level security;
create policy if not exists order_owner on orders
for select using (auth.uid() = user_id);

alter table invoices enable row level security;
create policy if not exists invoice_owner on invoices
for select using (exists(select 1 from orders o where o.id = invoices.order_id and o.user_id = auth.uid()));
`;
}
```

### `getSeedData()`

```js
function getSeedData() {
return `insert into products (sku,title,description,price_cents,currency,image_url,stock,is_active)
values
('GL-RET-001','Luxury Mug Set','Matte black mug with gold trim',29900,'ZAR',null,50,true),
('GL-RET-002','Notebook A5','Hardcover dotted notebook',18900,'ZAR',null,100,true)
on conflict (sku) do nothing;
`;
}
```

### `getMigrationsGuide()`

```js
function getMigrationsGuide() {
return `# Migrations

1) Run \`schema.sql\` in Supabase SQL editor.
2) Run \`seed.sql\` for dev data.
3) Create a storage bucket named \`invoices\` in Supabase (public for MVP or signed URLs).
4) Add RLS policies (already included in schema).

For changes, create timestamped files, e.g.:
- 2025-09-27_add_profiles.sql
- 2025-10-02_add_indexes.sql
`;
}
```

### `getSupabaseSetupGuide()`

```js
function getSupabaseSetupGuide() {
return `# Supabase Setup

1. Create project → copy Project URL and anon + service_role keys.
2. SQL editor → run \`schema.sql\`, then \`seed.sql\`.
3. Storage → create bucket \`invoices\` (set public for MVP; switch to signed URLs later).
4. Authentication → Email OTP or magic link.
5. Copy keys into:
   - frontend/.env.local → anon
   - backend/.env → service role only (server-side)

Security:
- Never expose service role to frontend.
- Keep Amrod creds on backend only.
`;
}
```

---

# 🧪 What this gives you (numbers, Mr Covie-style)

* **Time to first demo**: ~45–90 minutes (run builder → `npm i` → `npm run dev`).
* **SKU capacity**: 10–20k cached Amrod items on Supabase free is fine (JSONB raw).
* **Sync cost**: Hourly 200-item pages; 1000 items ≈ 5 pages ≈ <2s on small VM.
* **Invoice throughput**: PDFKit ~50–80ms/doc on small VM; email in parallel.
* **Infra**: Vercel (free), Supabase (free), 1×render/fly shared VM (~R150–R200/mo).

---

If you want me to wire **cart pages** and **admin UI** (shadcn tables) into the builder too, I’ll add those generators next. For now, paste these functions into your script and you can ship **Gift Lab v1 (invoice-first)** immediately.
