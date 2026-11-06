import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Resolve environment variables across Vite client, Vercel NEXT_PUBLIC_, localStorage, and Node server
const getEnvVar = (keys: string[], fallback = ''): string => {
  // 1. Browser localStorage (allows user to configure keys directly in the preview UI)
  if (typeof window !== 'undefined' && window.localStorage) {
    for (const key of keys) {
      try {
        const val = window.localStorage.getItem(key);
        if (val && val.trim().length > 0) return val.trim();
      } catch {}
    }
  }
  // 2. Vite client-side (import.meta.env)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    for (const key of keys) {
      const val = import.meta.env[key];
      if (typeof val === 'string' && val.trim().length > 0) {
        return val.trim();
      }
    }
  }
  // 3. Node.js server-side
  if (typeof process !== 'undefined' && process.env) {
    for (const key of keys) {
      const val = process.env[key];
      if (typeof val === 'string' && val.trim().length > 0) {
        return val.trim();
      }
    }
  }
  return fallback;
};

export const getCurrentSupabaseUrl = (): string => {
  return getEnvVar(
    ['NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL', 'SUPABASE_URL'],
    'https://mcublmqewmyqgbvylkgo.supabase.co'
  );
};

export const getCurrentSupabaseAnonKey = (): string => {
  return getEnvVar(
    [
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'VITE_SUPABASE_ANON_KEY',
      'SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      'ahcm_supabase_anon_key',
    ],
    ''
  );
};

export const isSupabaseConfigured = (): boolean => {
  const key = getCurrentSupabaseAnonKey();
  const url = getCurrentSupabaseUrl();
  return Boolean(
    url &&
    key &&
    key.length > 20 &&
    !key.includes('placeholder') &&
    key !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  );
};

export const SUPABASE_URL = getCurrentSupabaseUrl();
export const SUPABASE_ANON_KEY = getCurrentSupabaseAnonKey();

let _supabaseClient: SupabaseClient | null = null;
let _lastInitializedKey = '';
let _lastInitializedUrl = '';

/**
 * Returns the initialized Supabase client singleton.
 * Uses real key if configured or fallback dummy key to guarantee non-null client object.
 */
export const getSupabaseClient = (): SupabaseClient => {
  const currentUrl = getCurrentSupabaseUrl();
  const currentKey = getCurrentSupabaseAnonKey();

  if (_supabaseClient && _lastInitializedKey === currentKey && _lastInitializedUrl === currentUrl) {
    return _supabaseClient;
  }

  const keyToUse = isSupabaseConfigured() ? currentKey : 'anon-key-placeholder';
  _lastInitializedKey = currentKey;
  _lastInitializedUrl = currentUrl;

  _supabaseClient = createClient(currentUrl, keyToUse, {
    auth: {
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: true,
    },
  });
  return _supabaseClient;
};

// Dynamic client wrapper that always resolves to the active client
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: keyof SupabaseClient) {
    const client = getSupabaseClient();
    const val = (client as any)[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  },
});

export const setSupabaseCredentials = (url?: string, anonKey?: string): void => {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (url) {
      window.localStorage.setItem('NEXT_PUBLIC_SUPABASE_URL', url.trim());
    }
    if (anonKey) {
      window.localStorage.setItem('NEXT_PUBLIC_SUPABASE_ANON_KEY', anonKey.trim());
      window.localStorage.setItem('ahcm_supabase_anon_key', anonKey.trim());
    }
  }
  _supabaseClient = null;
  getSupabaseClient();
};

export const clearSupabaseCustomCredentials = (): void => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    window.localStorage.removeItem('ahcm_supabase_anon_key');
  }
  _supabaseClient = null;
  getSupabaseClient();
};

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
