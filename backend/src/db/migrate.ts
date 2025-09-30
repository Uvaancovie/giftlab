import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './index.js';
import postgres from 'postgres';

async function runMigrations() {
  const connectionString = process.env.SUPABASE_URL!.replace('https://', 'postgresql://') + '?sslmode=require';
  const client = postgres(connectionString, { max: 1 });

  await migrate(db, { migrationsFolder: './drizzle' });
  await client.end();
}

runMigrations().catch(console.error);