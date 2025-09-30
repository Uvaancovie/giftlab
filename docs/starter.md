Roger that, Mr Covie. We’ll ship **Gift Lab v1** without PayFast — i.e., **“Invoice-first / EFT”** checkout. Users can browse **retail** (your own) + **corporate (Amrod)** products, add to cart, see totals incl. shipping, place order → we generate a **numbered PDF invoice** + email it + store it in Supabase. You can plug PayFast later with zero schema changes.

Below is the lean plan + ready-to-paste snippets for **Next.js App Router + Express + Supabase + Amrod**.

---

# 1) Architecture (fastest to revenue)

* **Next.js 15 (App Router)** on Vercel

  * Pages: Home, Retail catalog, Corporate (Amrod) catalog, Product page, Cart, Checkout (Invoice), Orders, Admin (auth-gated).
  * **Server Actions** for Supabase reads/writes.
* **Express (Node 18+)** on Render/Fly

  * Amrod auth + product sync (hourly cron or manual).
  * Invoice generation (PDFKit) + email (Nodemailer / Resend).
  * Admin reporting endpoints (orders, invoices, finance).
* **Supabase Postgres + Auth + Storage**

  * DB of products, carts, orders, invoices, amrod cache.
  * Storage bucket `invoices/` for PDFs.

### “Ultra-statistical” delivery view

* MVP scope: ~18 endpoints, ~10 tables, ~6 screens.
* Throughput: 10k catalog views/day on Vercel hobby = fine.
* Infra est.: ± **R0–R300/mo** (Vercel hobby, Supabase free, 1 small VM for Express).
* TTM: **6–9 working days** solo (you) if you reuse components.

---

# 2) Environment

**Next.js (.env.local)**

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=https://giftlab.co.za
```

**Express (.env)**

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE=...         # server-only
AMROD_EMAIL=tevin@thegiftlab.co.za
AMROD_PASSWORD=***                # set it
AMROD_CUSTOMER_NUMBER=027208
AMROD_IDENTITY_URL=https://identity.amrod.co.za/VendorLogin
AMROD_PRODUCTS_URL=https://vendorapi.amrod.co.za/api/v1/Products
SMTP_HOST=smtp.gmail.com
SMTP_USER=orders@giftlab.co.za
SMTP_PASS=app_password
FROM_EMAIL="Gift Lab <orders@giftlab.co.za>"
PUBLIC_SITE_URL=https://giftlab.co.za
```

> ⚠️ Rotate your **service-role** key and keep it **server-only**.

---

# 3) Supabase schema (core)

```sql
-- Retail products (your own)
create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  title text not null,
  description text,
  price_cents int not null check (price_cents >= 0),
  currency text not null default 'ZAR',
  image_url text,
  stock int,
  is_active boolean default true,
  source text not null default 'retail' -- 'retail'|'amrod'
);

-- Cached Amrod products (read-only to clients)
create table public.amrod_products (
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

-- Carts
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references public.carts on delete cascade,
  product_source text not null,      -- 'retail'|'amrod'
  product_ref text not null,         -- products.id or amrod_id
  title text not null,
  unit_price_cents int not null,
  qty int not null check (qty > 0),
  image_url text
);

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  status text not null default 'pending', -- pending|awaiting_payment|paid|cancelled
  total_cents int not null,
  shipping_cents int not null default 0,
  currency text not null default 'ZAR',
  invoice_number text unique,
  created_at timestamptz default now(),
  paid_at timestamptz
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders on delete cascade,
  product_source text not null,
  product_ref text not null,
  title text not null,
  unit_price_cents int not null,
  qty int not null,
  image_url text
);

-- Invoices
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders on delete cascade,
  number text unique not null,
  pdf_url text,
  amount_cents int not null,
  issued_at timestamptz default now()
);

-- Admin analytics snapshot (optional materialized view later)
```

**RLS (minimal)**

```sql
alter table carts enable row level security;
create policy "own carts" on carts for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table orders enable row level security;
create policy "own orders" on orders for select
using (auth.uid() = user_id);

alter table invoices enable row level security;
create policy "own invoices" on invoices for select
using (exists(select 1 from orders o where o.id = invoices.order_id and o.user_id = auth.uid()));
```

---

# 4) Amrod integration (Express): login + cache products

> Flow: **VendorLogin** → Bearer token (1h) → **/Products** → upsert into `amrod_products`.
> Clients read from our cache; we never expose Amrod creds to the browser.

**/src/amrod.ts**

```ts
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);

async function getToken() {
  const res = await fetch(process.env.AMROD_IDENTITY_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Email: process.env.AMROD_EMAIL,
      Password: process.env.AMROD_PASSWORD,
      CustomerNumber: process.env.AMROD_CUSTOMER_NUMBER
    })
  });
  if (!res.ok) throw new Error(`Amrod auth failed ${res.status}`);
  const data = await res.json();
  return data?.token || data?.access_token;
}

export async function syncAmrodProducts(page = 1, size = 200) {
  const token = await getToken();
  const url = `${process.env.AMROD_PRODUCTS_URL}?Page=${page}&PageSize=${size}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }});
  if (!res.ok) throw new Error(`Amrod fetch failed ${res.status}`);
  const payload = await res.json();
  const items = payload?.items ?? payload;

  const rows = items.map((p: any) => ({
    amrod_id: String(p?.id ?? p?.productId ?? p?.Code),
    name: p?.name ?? p?.Description,
    code: p?.code ?? p?.Code,
    price_cents: Math.round(((p?.price ?? p?.SellingPrice) ?? 0) * 100),
    brand: p?.brand,
    category: p?.categoryName,
    image_url: p?.imageUrl ?? p?.ImageUrl,
    raw: p
  }));

  const { error } = await supabase.from("amrod_products")
    .upsert(rows, { onConflict: "amrod_id" });
  if (error) throw error;

  return rows.length;
}
```

**/src/server.ts**

```ts
import express from "express";
import { syncAmrodProducts } from "./amrod.js";

const app = express();
app.use(express.json());

// Protected in real life (header secret or admin JWT)
app.post("/amrod/sync", async (_req, res) => {
  try {
    const count = await syncAmrodProducts(1, 200);
    res.json({ ok: true, count });
  } catch (e:any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(8080, () => console.log("Express up on :8080"));
```

**Cron**: run `/amrod/sync` hourly to keep prices/stock fresh.

---

# 5) Next.js: data access (server actions)

**Retail listing (from `products`)**

```ts
// app/(shop)/retail/actions.ts
"use server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getRetailProducts() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (k)=>cookieStore.get(k)?.value } }
  );
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("title");
  if (error) throw error;
  return data;
}
```

**Corporate listing (from `amrod_products`)**

```ts
// app/(shop)/corporate/actions.ts
"use server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getAmrodProducts() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (k)=>cookieStore.get(k)?.value } }
  );
  const { data, error } = await supabase
    .from("amrod_products")
    .select("amrod_id,name,code,price_cents,image_url,brand,category")
    .order("name")
    .limit(60);
  if (error) throw error;
  return data;
}
```

---

# 6) Cart → Order → Invoice (no PayFast)

**Shipping rule (simple, SA-friendly)**

* **R99 flat** under **R1500**; **free** otherwise.
* You can tune later per-weight/region.

**Create order & request invoice**

```ts
// app/(shop)/checkout/actions.ts
"use server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type CartItem = {
  product_source: "retail"|"amrod";
  product_ref: string;
  title: string;
  unit_price_cents: number;
  qty: number;
  image_url?: string;
};

export async function placeOrder(userId: string, items: CartItem[]) {
  const ship = calcShipping(items);
  const total = items.reduce((s, it)=> s + it.unit_price_cents*it.qty, 0) + ship;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (k)=>cookieStore.get(k)?.value } }
  );

  const { data: order, error } = await supabase.from("orders")
    .insert({ user_id: userId, status: "awaiting_payment", total_cents: total, shipping_cents: ship, currency: "ZAR" })
    .select().single();
  if (error) throw error;

  const rows = items.map(it => ({ order_id: order.id, ...it }));
  const { error: e2 } = await supabase.from("order_items").insert(rows);
  if (e2) throw e2;

  // Ask Express to generate invoice PDF + email
  const resp = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/invoice`, {
    method: "POST",
    body: JSON.stringify({ orderId: order.id }),
    headers: { "Content-Type": "application/json" }
  });
  if (!resp.ok) throw new Error("Invoice generation failed");

  return { orderId: order.id };
}

function calcShipping(items: CartItem[]) {
  const sub = items.reduce((s, it)=> s + it.unit_price_cents*it.qty, 0);
  return sub >= 150000 ? 0 : 9900;
}
```

**Next middleware** `/api/invoice` simply forwards to your **Express** API (or call Express URL directly if separate domain).

---

# 7) Invoice generation (Express, PDFKit + Supabase Storage)

**/src/invoice.ts**

```ts
import { createClient } from "@supabase/supabase-js";
import PDFDocument from "pdfkit";
import { Readable } from "stream";
import nodemailer from "nodemailer";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);

export async function generateAndSendInvoice(orderId: string) {
  // 1) load order
  const { data: order, error } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (error || !order) throw error || new Error("Order not found");
  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", orderId);

  // 2) create invoice number
  const number = `INV-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${String(Math.floor(Math.random()*9999)).padStart(4,"0")}`;

  // 3) build PDF in memory
  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (c)=> chunks.push(c));
  const done = new Promise<Buffer>((resolve)=> doc.on("end", ()=> resolve(Buffer.concat(chunks))));

  doc.fontSize(18).text("Gift Lab (Pty) Ltd", { align: "right" });
  doc.fontSize(10).text("Durban, South Africa", { align: "right" }).moveDown();
  doc.fontSize(16).text(`Invoice ${number}`).moveDown();

  const sub = items!.reduce((s, it)=> s + it.unit_price_cents*it.qty, 0);
  doc.fontSize(12).text(`Order: ${orderId}`);
  doc.text(`Date: ${new Date().toLocaleDateString("en-ZA")}`);
  doc.moveDown();
  items!.forEach((it) => {
    doc.text(`${it.title} x${it.qty} — R ${(it.unit_price_cents/100).toFixed(2)}`);
  });
  doc.moveDown();
  doc.text(`Shipping: R ${(order.shipping_cents/100).toFixed(2)}`);
  doc.text(`Total: R ${((sub + order.shipping_cents)/100).toFixed(2)}`, { underline: true });

  doc.end();
  const pdf = await done;

  // 4) upload to Supabase Storage
  const path = `invoices/${number}.pdf`;
  const { data: up, error: upErr } = await supabase.storage
    .from("invoices")
    .upload(path, pdf, { contentType: "application/pdf", upsert: true });
  if (upErr) throw upErr;

  const { data: pub } = await supabase.storage.from("invoices").getPublicUrl(path);
  const pdf_url = pub.publicUrl;

  // 5) record invoice + set order invoice_number
  await supabase.from("invoices").insert({
    order_id: orderId, number, pdf_url, amount_cents: sub + order.shipping_cents
  });
  await supabase.from("orders").update({ invoice_number: number }).eq("id", orderId);

  // 6) email customer (you can pull their email from auth.users via admin RPC)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: 465, secure: true,
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! }
  });
  await transporter.sendMail({
    to: order.customer_email ?? "orders@giftlab.co.za",
    from: process.env.FROM_EMAIL!,
    subject: `Your Gift Lab Invoice ${number}`,
    text: `Hi! Thanks for your order. Pay by EFT and reply with POP. Download: ${pdf_url}`,
    attachments: [{ filename: `${number}.pdf`, content: pdf }]
  });

  return { number, pdf_url };
}
```

**/src/routes/invoice.ts**

```ts
import { Router } from "express";
import { generateAndSendInvoice } from "../invoice.js";
const r = Router();

r.post("/invoice", async (req, res) => {
  try {
    const { orderId } = req.body;
    const out = await generateAndSendInvoice(orderId);
    res.json({ ok: true, ...out });
  } catch (e:any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default r;
```

> Later, when you add PayFast, the **only** change is: after ITN verifies, set `status='paid'`, set `paid_at`, and re-issue a “Paid” tax invoice if needed.

---

# 8) Admin dashboards (Next.js)

* **Products** (retail): CRUD table (title, price, stock, is_active).
* **Amrod catalog**: read-only list, with “Add to retail” (copies into `products` if you want curated corporate).
* **Orders**: table with status, totals, invoice number, download invoice.
* **Finance**: simple aggregates:

  * GMV = sum(order.total_cents)
  * AOV = GMV / #orders
  * Unpaid exposure = sum(awaiting_payment)
  * Paid in last 30d, etc.

Use shadcn/ui for fast tables + cards. Gate with Supabase Auth role claim (e.g., `is_admin` boolean in a `profiles` table).

---

# 9) UX details that move revenue (my opinions)

* **Two catalogs**: tabs **Retail** | **Corporate (Amrod)** with the same card UI; “Add to cart” pulls price from the cache so it’s instant.
* **Address + shipping** captured on checkout page; compute shipping in real time (R99 or free over R1500).
* **CTA after order**: “Download Invoice” + “Email sent — pay by EFT & upload POP.”
* **Finance dashboard** shows **Unpaid invoices > 7 days**; add a one-click **reminder email**.

---

# 10) Security & POPIA basics

* Keep Amrod creds + Supabase service role strictly on the **Express** server.
* Enable **RLS** (done above) and restrict admin routes by server-side check.
* Don’t store card data (no payments for now), so you’re clean of PCI scope.
* Invoices in Supabase Storage: use **signed URLs** for private access if you don’t want them public.

---

# 11) What to build next (when you’re ready)

* **PayFast** plug-in (drop-in): mark order paid on ITN; auto-send “PAID” invoice.
* **Quotation mode** for corporate buyers (quote PDF → convert to order).
* **Amrod live pricing** toggle: check token + product price on “add to cart” for high-value items.

---

If you want, I’ll package this into a **starter repo** (Next + Express + Supabase schema + Amrod sync + invoice service) so Way2FlyDigital can ship Gift Lab in a week.
