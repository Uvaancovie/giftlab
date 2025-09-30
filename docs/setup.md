<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gift Lab Project Builder</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            max-width: 800px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 2.5em;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-align: center;
        }
        
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
            font-size: 1.1em;
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .feature {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #555;
        }
        
        .feature::before {
            content: '✓';
            display: inline-block;
            width: 20px;
            height: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 50%;
            text-align: center;
            line-height: 20px;
            font-size: 12px;
            flex-shrink: 0;
        }
        
        .btn-container {
            display: flex;
            gap: 15px;
            margin-top: 30px;
            flex-wrap: wrap;
        }
        
        button {
            flex: 1;
            min-width: 200px;
            padding: 15px 30px;
            font-size: 1.1em;
            font-weight: 600;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-secondary {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        
        button:active {
            transform: translateY(0);
        }
        
        .progress {
            display: none;
            margin-top: 20px;
        }
        
        .progress-bar {
            width: 100%;
            height: 6px;
            background: #e0e0e0;
            border-radius: 3px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            border-radius: 3px;
            width: 0;
            transition: width 0.3s ease;
            animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .status {
            margin-top: 10px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
        
        .tech-stack {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 20px;
            justify-content: center;
        }
        
        .tech {
            padding: 5px 12px;
            background: rgba(102, 126, 234, 0.1);
            border: 1px solid rgba(102, 126, 234, 0.3);
            border-radius: 20px;
            font-size: 0.85em;
            color: #667eea;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎁 Gift Lab Project Builder</h1>
        <p class="subtitle">Complete e-commerce solution with Amrod integration</p>
        
        <div class="features">
            <div class="feature">Next.js 15 App Router</div>
            <div class="feature">Express API Server</div>
            <div class="feature">Supabase Integration</div>
            <div class="feature">Amrod Product Sync</div>
            <div class="feature">PDF Invoice Generation</div>
            <div class="feature">Email Notifications</div>
            <div class="feature">Admin Dashboard</div>
            <div class="feature">Shopping Cart</div>
            <div class="feature">Responsive Design</div>
            <div class="feature">TypeScript</div>
            <div class="feature">Tailwind CSS</div>
            <div class="feature">Production Ready</div>
        </div>
        
        <div class="btn-container">
            <button class="btn-primary" onclick="generateFullProject()">
                📦 Download Complete Project
            </button>
            <button class="btn-secondary" onclick="generateDatabaseOnly()">
                🗄️ Database Schema Only
            </button>
        </div>
        
        <div class="progress" id="progress">
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
            </div>
            <div class="status" id="status">Preparing files...</div>
        </div>
        
        <div class="tech-stack">
            <span class="tech">Next.js 15</span>
            <span class="tech">TypeScript</span>
            <span class="tech">Supabase</span>
            <span class="tech">Express</span>
            <span class="tech">Tailwind CSS</span>
            <span class="tech">PDFKit</span>
            <span class="tech">Nodemailer</span>
            <span class="tech">shadcn/ui</span>
        </div>
    </div>

    <script>
        function updateProgress(percent, status) {
            const progress = document.getElementById('progress');
            const fill = document.getElementById('progressFill');
            const statusEl = document.getElementById('status');
            
            progress.style.display = 'block';
            fill.style.width = percent + '%';
            statusEl.textContent = status;
        }

        async function generateFullProject() {
            const zip = new JSZip();
            
            updateProgress(5, 'Creating project structure...');
            
            // Root files
            zip.file('README.md', getReadmeContent());
            zip.file('.gitignore', getGitignoreContent());
            zip.file('package.json', getRootPackageJson());
            
            updateProgress(10, 'Setting up Next.js frontend...');
            
            // Frontend (Next.js)
            const frontend = zip.folder('frontend');
            frontend.file('package.json', getFrontendPackageJson());
            frontend.file('next.config.js', getNextConfig());
            frontend.file('tailwind.config.js', getTailwindConfig());
            frontend.file('tsconfig.json', getTsConfig());
            frontend.file('.env.local.example', getFrontendEnv());
            frontend.file('postcss.config.js', getPostcssConfig());
            
            updateProgress(15, 'Creating frontend components...');
            
            // Frontend app directory structure
            const app = frontend.folder('app');
            app.file('layout.tsx', getLayoutFile());
            app.file('page.tsx', getHomePageFile());
            app.file('globals.css', getGlobalsCss());
            
            // Shop pages
            const shop = app.folder('(shop)');
            shop.file('layout.tsx', getShopLayoutFile());
            
            const retail = shop.folder('retail');
            retail.file('page.tsx', getRetailPageFile());
            retail.file('actions.ts', getRetailActionsFile());
            
            const corporate = shop.folder('corporate');
            corporate.file('page.tsx', getCorporatePageFile());
            corporate.file('actions.ts', getCorporateActionsFile());
            
            const cart = shop.folder('cart');
            cart.file('page.tsx', getCartPageFile());
            cart.file('actions.ts', getCartActionsFile());
            
            const checkout = shop.folder('checkout');
            checkout.file('page.tsx', getCheckoutPageFile());
            checkout.file('actions.ts', getCheckoutActionsFile());
            
            updateProgress(25, 'Adding admin dashboard...');
            
            // Admin pages
            const admin = app.folder('admin');
            admin.file('page.tsx', getAdminDashboardFile());
            admin.file('layout.tsx', getAdminLayoutFile());
            
            const products = admin.folder('products');
            products.file('page.tsx', getAdminProductsFile());
            
            const orders = admin.folder('orders');
            orders.file('page.tsx', getAdminOrdersFile());
            
            // Components
            const components = frontend.folder('components');
            components.file('navbar.tsx', getNavbarComponent());
            components.file('product-card.tsx', getProductCardComponent());
            components.file('cart-provider.tsx', getCartProviderComponent());
            
            const ui = components.folder('ui');
            ui.file('button.tsx', getButtonComponent());
            ui.file('card.tsx', getCardComponent());
            ui.file('input.tsx', getInputComponent());
            ui.file('table.tsx', getTableComponent());
            
            updateProgress(35, 'Creating lib utilities...');
            
            // Lib
            const lib = frontend.folder('lib');
            lib.file('supabase.ts', getSupabaseClientFile());
            lib.file('utils.ts', getUtilsFile());
            lib.file('types.ts', getTypesFile());
            
            updateProgress(45, 'Setting up Express backend...');
            
            // Backend (Express)
            const backend = zip.folder('backend');
            backend.file('package.json', getBackendPackageJson());
            backend.file('tsconfig.json', getBackendTsConfig());
            backend.file('.env.example', getBackendEnv());
            
            const src = backend.folder('src');
            src.file('server.ts', getServerFile());
            src.file('amrod.ts', getAmrodFile());
            src.file('invoice.ts', getInvoiceFile());
            src.file('email.ts', getEmailFile());
            
            const routes = src.folder('routes');
            routes.file('amrod.ts', getAmrodRoutesFile());
            routes.file('invoice.ts', getInvoiceRoutesFile());
            routes.file('admin.ts', getAdminRoutesFile());
            
            updateProgress(60, 'Adding database schema...');
            
            // Database
            const database = zip.folder('database');
            database.file('schema.sql', getDatabaseSchema());
            database.file('seed.sql', getSeedData());
            database.file('migrations.md', getMigrationsGuide());
            
            updateProgress(75, 'Creating deployment configs...');
            
            // Deployment
            const deployment = zip.folder('deployment');
            deployment.file('vercel.json', getVercelConfig());
            deployment.file('render.yaml', getRenderConfig());
            deployment.file('docker-compose.yml', getDockerCompose());
            deployment.file('Dockerfile.backend', getBackendDockerfile());
            
            updateProgress(85, 'Adding documentation...');
            
            // Docs
            const docs = zip.folder('docs');
            docs.file('setup.md', getSetupGuide());
            docs.file('deployment.md', getDeploymentGuide());
            docs.file('amrod-integration.md', getAmrodGuide());
            docs.file('payment-integration.md', getPaymentGuide());
            
            updateProgress(95, 'Finalizing project...');
            
            // Generate the zip file
            const content = await zip.generateAsync({type: 'blob'});
            
            updateProgress(100, 'Download ready!');
            
            // Save the file
            saveAs(content, 'giftlab-project.zip');
            
            setTimeout(() => {
                document.getElementById('progress').style.display = 'none';
            }, 2000);
        }
        
        async function generateDatabaseOnly() {
            const zip = new JSZip();
            
            updateProgress(30, 'Creating database schema...');
            
            zip.file('schema.sql', getDatabaseSchema());
            zip.file('seed.sql', getSeedData());
            zip.file('migrations.md', getMigrationsGuide());
            zip.file('supabase-setup.md', getSupabaseSetupGuide());
            
            updateProgress(100, 'Database files ready!');
            
            const content = await zip.generateAsync({type: 'blob'});
            saveAs(content, 'giftlab-database.zip');
            
            setTimeout(() => {
                document.getElementById('progress').style.display = 'none';
            }, 2000);
        }
        
        // File content generators
        function getReadmeContent() {
            return `# Gift Lab E-commerce Platform

A modern e-commerce platform with Amrod integration, built with Next.js, Express, and Supabase.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (via Supabase)
- npm or yarn

### Installation

1. Clone the repository
2. Set up the database:
   - Create a new Supabase project
   - Run the schema from \`database/schema.sql\`
   - Run seed data from \`database/seed.sql\`

3. Configure environment variables:
   - Copy \`frontend/.env.local.example\` to \`frontend/.env.local\`
   - Copy \`backend/.env.example\` to \`backend/.env\`
   - Fill in your credentials

4. Install dependencies:
   \`\`\`bash
   # Root directory
   npm install

   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   npm install
   \`\`\`

5. Run development servers:
   \`\`\`bash
   # From root directory
   npm run dev
   \`\`\`

## 📦 Features

- **Dual Catalog System**: Retail (own products) + Corporate (Amrod)
- **Invoice Generation**: PDF invoices with email delivery
- **Admin Dashboard**: Product management, order tracking, analytics
- **Shopping Cart**: Persistent cart with Supabase
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Type Safety**: Full TypeScript implementation

## 🏗️ Architecture

- **Frontend**: Next.js 15 with App Router
- **Backend**: Express.js API server
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage for invoices
- **Authentication**: Supabase Auth

## 📱 Key Endpoints

### Frontend Routes
- \`/\` - Homepage
- \`/retail\` - Retail products catalog
- \`/corporate\` - Amrod products catalog
- \`/cart\` - Shopping cart
- \`/checkout\` - Checkout with invoice generation
- \`/admin\` - Admin dashboard

### API Endpoints
- \`POST /amrod/sync\` - Sync Amrod products
- \`POST /invoice\` - Generate invoice
- \`GET /admin/analytics\` - Get sales analytics

## 🚀 Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy

### Backend (Render/Fly.io)
1. Build Docker image
2. Deploy to Render or Fly.io
3. Set environment variables
4. Configure cron job for Amrod sync

## 📈 Revenue Optimization

- **Shipping Strategy**: R99 flat rate under R1500, free above
- **Invoice-First Model**: Generate invoice immediately for EFT payments
- **Amrod Integration**: Hourly sync for fresh pricing
- **Admin Analytics**: Track GMV, AOV, unpaid invoices

## 🔒 Security

- Environment variables for sensitive data
- Row Level Security (RLS) on Supabase
- Admin authentication required
- No credit card data storage (PCI compliance)

## 📝 License

Private - Gift Lab (Pty) Ltd

## 🤝 Support

For support, email tevin@thegiftlab.co.za`;
        }
        
        function getGitignoreContent() {
            return `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output

# Next.js
.next/
out/
build/
dist/

# Production
*.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Environment
.env
.env.local
.env.production
.env.development

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Logs
logs/
*.log

# OS
Thumbs.db`;
        }
        
        function getRootPackageJson() {
            return `{
  "name": "giftlab-monorepo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \\"npm run dev:frontend\\" \\"npm run dev:backend\\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "start": "concurrently \\"npm run start:frontend\\" \\"npm run start:backend\\"",
    "start:frontend": "cd frontend && npm run start",
    "start:backend": "cd backend && npm run start"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}`;
        }
        
        function getFrontendPackageJson() {
            return `{
  "name": "giftlab-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.0.10",
    "zustand": "^4.4.7",
    "lucide-react": "^0.263.1",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.4",
    "@types/react": "^18.2.42",
    "@types/react-dom": "^18.2.17",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.3.6",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-config-next": "14.0.4"
  }
}`;
        }
        
        function getBackendPackageJson() {
            return `{
  "name": "giftlab-backend",
  "version": "1.0.0",
  "private": true,
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "sync:amrod": "tsx src/scripts/sync-amrod.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "@supabase/supabase-js": "^2.39.0",
    "pdfkit": "^0.14.0",
    "nodemailer": "^6.9.7",
    "node-fetch": "^3.3.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "node-cron": "^3.0.3"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.4",
    "@types/cors": "^2.8.17",
    "@types/pdfkit": "^0.13.2",
    "@types/nodemailer": "^6.4.14",
    "@types/node-cron": "^3.0.11",
    "typescript": "^5.3.3",
    "tsx": "^4.6.2",
    "nodemon": "^3.0.2"
  }
}`;
        }
        
        function getNextConfig() {
            return `/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vendorapi.amrod.co.za',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig`;
        }
        
        function getTailwindConfig() {
            return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
    },
  },
  plugins: [],
}`;
        }
        
        function getTsConfig() {
            return `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`;
        }
        
        function getFrontendEnv() {
            return `# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8080`;
        }
        
        function getBackendEnv() {
            return `# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE=your-service-role-key

# Amrod
AMROD_EMAIL=tevin@thegiftlab.co.za
AMROD_PASSWORD=your-amrod-password
AMROD_CUSTOMER_NUMBER=027208
AMROD_IDENTITY_URL=https://identity.amrod.co.za/VendorLogin
AMROD_PRODUCTS_URL=https://vendorapi.amrod.co.za/api/v1/Products

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=orders@giftlab.co.za
SMTP_PASS=your-app-password
FROM_EMAIL=Gift Lab <orders@giftlab.co.za>

# Site
PUBLIC_SITE_URL=https://giftlab.co.za

# Server
PORT=8080
NODE_ENV=development`;
        }
        
        function getPostcssConfig() {
            return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
        }
        
        function getLayoutFile() {
            return `import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { CartProvider } from '@/components/cart-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gift Lab - Premium Corporate & Retail Gifts',
  description: 'Your one-stop shop for corporate and retail gifts in South Africa',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  )
}`;
        }
        
        function getHomePageFile() {
            return `import Link from 'next/link'
import { Navbar } from '@/components/navbar'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white">
          <div className="container mx-auto px-4 py-24">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-bold mb-6">
                Premium Gifts for Every Occasion
              </h1>
              <p className="text-xl mb-8 text-primary-100">
                Browse our extensive catalog of retail and corporate gifts. 
                From custom branded merchandise to unique gift sets.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/retail"
                  className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition"
                >
                  Shop Retail
                </Link>
                <Link
                  href="/corporate"
                  className="bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-900 transition"
                >
                  Corporate Gifts
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Gift Lab?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Quality Assured</h3>
                <p className="text-gray-600">Premium products from trusted suppliers</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text