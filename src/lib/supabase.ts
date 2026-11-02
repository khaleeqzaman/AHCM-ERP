import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Resolve environment variables across Vite client and Node server
const getEnvVar = (clientKey: string, serverKey: string): string => {
  // Vite client-side
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[clientKey]) {
    return import.meta.env[clientKey] as string;
  }
  // Node.js server-side
  if (typeof process !== 'undefined' && process.env) {
    return process.env[serverKey] || process.env[clientKey] || '';
  }
  return '';
};

export const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL', 'SUPABASE_URL');
export const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY');
export const SUPABASE_SERVICE_ROLE_KEY = getEnvVar('VITE_SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY');

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && (SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY));
};

let _supabaseClient: SupabaseClient | null = null;

/**
 * Returns the initialized Supabase client singleton, or creates one if credentials are present.
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  if (_supabaseClient) return _supabaseClient;
  if (!isSupabaseConfigured()) return null;

  const keyToUse = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  _supabaseClient = createClient(SUPABASE_URL, keyToUse, {
    auth: {
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: true,
    },
  });
  return _supabaseClient;
};

export const supabase = getSupabaseClient();

/**
 * Database table names in Supabase matching our PostgreSQL schema
 */
export const SUPABASE_TABLES = {
  APP_USERS: 'app_users',
  DEMANDS: 'demands',
  PURCHASES: 'purchases',
  CHART_ACCOUNTS: 'chart_accounts',
  VOUCHERS: 'vouchers',
  CASH_BOOK_ENTRIES: 'cash_book_entries',
  CREDIT_BOOK_ENTRIES: 'credit_book_entries',
  BANKS: 'banks',
  BANK_ACCOUNTS: 'bank_accounts',
  POS_COAL_SALES: 'pos_coal_sales',
  COAL_SELL_RECORDS: 'coal_sell_records',
  BUYERS: 'buyers',
  PARTNERS: 'partners',
  STOCK_ITEMS: 'stock_items',
  STOCK_ENTRIES: 'stock_entries',
  VEHICLES: 'vehicles',
  VEHICLE_CONSUMPTIONS: 'vehicle_consumptions',
  COMPANY_SETTINGS: 'company_settings',
} as const;
