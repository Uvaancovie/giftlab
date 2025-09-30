import { pgTable, text, integer, uuid, boolean, jsonb, timestamp, bigint } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  sku: text('sku').unique(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'),
  createdAt: timestamp('created_at').defaultNow(),
  priceCents: integer('price_cents').notNull(),
  currency: text('currency').notNull().default('ZAR'),
  imageUrl: text('image_url'),
  stock: integer('stock'),
  isActive: boolean('is_active').default(true),
  source: text('source').notNull().default('retail'),
});

export const amrodProducts = pgTable('amrod_products', {
  // Some versions of drizzle don't expose `generatedAlwaysAsIdentity` on bigint
  // builders. Use a normal primary key; Supabase will accept bigserial/identity
  // when the SQL is run. Keep the mode as number for convenience.
  id: bigint('id', { mode: 'number' }).primaryKey(),
  amrodId: text('amrod_id').unique().notNull(),
  name: text('name').notNull(),
  code: text('code'),
  priceCents: integer('price_cents'),
  currency: text('currency').default('ZAR'),
  brand: text('brand'),
  category: text('category'),
  imageUrl: text('image_url'),
  raw: jsonb('raw'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const carts = pgTable('carts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  cartId: uuid('cart_id').references(() => carts.id, { onDelete: 'cascade' }),
  productSource: text('product_source').notNull(),
  productRef: text('product_ref').notNull(),
  title: text('title').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  qty: integer('qty').notNull(),
  imageUrl: text('image_url'),
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  status: text('status').notNull().default('awaiting_payment'),
  totalCents: integer('total_cents').notNull(),
  shippingCents: integer('shipping_cents').notNull().default(0),
  currency: text('currency').notNull().default('ZAR'),
  invoiceNumber: text('invoice_number').unique(),
  createdAt: timestamp('created_at').defaultNow(),
  paidAt: timestamp('paid_at'),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  productSource: text('product_source').notNull(),
  productRef: text('product_ref').notNull(),
  title: text('title').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  qty: integer('qty').notNull(),
  imageUrl: text('image_url'),
});

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  number: text('number').unique().notNull(),
  pdfUrl: text('pdf_url'),
  amountCents: integer('amount_cents').notNull(),
  issuedAt: timestamp('issued_at').defaultNow(),
});