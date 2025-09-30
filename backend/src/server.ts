import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import amrodRoutes from './routes/amrod';
import invoiceRoutes from './routes/invoice';
import adminRoutes from './routes/admin';
import productsRoutes from './routes/products';
import ordersRoutes from './routes/orders';

const app = express();
// Configure CORS to allow origins provided via PUBLIC_SITE_URL (comma-separated)
// and include localhost dev ports. If no PUBLIC_SITE_URL is provided, allow all origins.
const rawOrigins = process.env.PUBLIC_SITE_URL ?? '';
const allowedOrigins = rawOrigins.split(',').map(s => s.trim()).filter(Boolean);
if (!allowedOrigins.length) {
  // allow all in development if none specified
  app.use(cors());
} else {
  app.use(cors({
    origin: (origin, callback) => {
      // allow non-browser requests (e.g., server-to-server) which have no origin
      if (!origin) return callback(null, true);
      // allow explicit origins or localhost variants
      if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','x-admin-key']
  }));
}
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/amrod', amrodRoutes);
app.use('/invoice', invoiceRoutes);
app.use('/admin', adminRoutes);
app.use('/products', productsRoutes);
app.use('/orders', ordersRoutes);

const port = Number(process.env.PORT || 8080);
app.listen(port, () => console.log(`GiftLab API up on :${port}`));