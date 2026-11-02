import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import type { Pool as PgPool, PoolConfig } from 'pg';
const { Pool } = pg;
import * as schema from './schema.ts';

declare global {
  var _postgresPool: PgPool | undefined;
}

/**
 * Creates or retrieves the singleton PostgreSQL pool configured for Supabase or direct Postgres.
 * Supports:
 * 1. DATABASE_URL / SUPABASE_DB_URL / POSTGRES_URL (Supabase connection string with automatic SSL)
 * 2. Individual SQL_* environment variables (SQL_HOST, SQL_USER, SQL_PASSWORD, SQL_DB_NAME, SQL_PORT)
 */
export const createPool = (): PgPool => {
  if (!global._postgresPool) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.SUPABASE_DB_URL ||
      process.env.SUPABASE_DATABASE_URL ||
      process.env.POSTGRES_URL;

    let poolConfig: PoolConfig;

    if (connectionString) {
      const isRemoteOrSupabase =
        connectionString.includes('supabase.co') ||
        connectionString.includes('pooler.supabase.com') ||
        connectionString.includes('sslmode=require') ||
        !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');

      poolConfig = {
        connectionString,
        ssl: isRemoteOrSupabase ? { rejectUnauthorized: false } : undefined,
        max: 10,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
      };
    } else {
      const host = process.env.SQL_HOST || '127.0.0.1';
      const isSocket = host.startsWith('/');
      const isSupabase = host.includes('supabase');
      const forceSsl = process.env.SQL_SSL === 'true';
      const ssl = !isSocket && (isSupabase || forceSsl) ? { rejectUnauthorized: false } : undefined;

      poolConfig = {
        host: process.env.SQL_HOST,
        port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
        user: process.env.SQL_USER || process.env.SQL_ADMIN_USER,
        password: process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD,
        database: process.env.SQL_DB_NAME,
        ssl,
        max: 10,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
      };
    }

    global._postgresPool = new Pool(poolConfig);

    global._postgresPool.on('error', (err: Error) => {
      console.error('Unexpected error on idle Supabase/PostgreSQL pool client:', err.message);
    });
  }
  return global._postgresPool;
};

export const pool = createPool();

export const db = drizzle(pool, { schema });

/**
 * Diagnostic helper to test the database connection
 */
export async function testDatabaseConnection(): Promise<{ connected: boolean; message: string; version?: string }> {
  try {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT version();');
      const version = res.rows[0]?.version || 'PostgreSQL';
      return {
        connected: true,
        message: 'Successfully connected to database',
        version,
      };
    } finally {
      client.release();
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      connected: false,
      message: `Database connection test failed: ${msg}`,
    };
  }
}
