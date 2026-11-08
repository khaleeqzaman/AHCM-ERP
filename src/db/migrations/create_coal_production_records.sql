-- ====================================================================
-- SUPABASE MIGRATION: CREATE COAL PRODUCTION RECORDS TABLE
-- ====================================================================
-- Run this in Supabase Dashboard -> SQL Editor to fix PGRST205 error:
-- "Could not find the table 'public.coal_production_records' in the schema cache"
-- ====================================================================

-- 1. Create table if it doesn't already exist
CREATE TABLE IF NOT EXISTS public.coal_production_records (
    id TEXT PRIMARY KEY,
    sr_no INTEGER,
    date TEXT NOT NULL,
    partner_id TEXT,
    partner_name TEXT NOT NULL,
    quantity_tons DOUBLE PRECISION DEFAULT 0,
    pithead_location TEXT,
    vehicle_no TEXT,
    remarks TEXT,
    created_at TEXT DEFAULT now()::text
);

-- 2. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_coal_prod_date ON public.coal_production_records(date);
CREATE INDEX IF NOT EXISTS idx_coal_prod_partner ON public.coal_production_records(partner_id);

-- 3. Grant full permissions to standard Supabase roles
GRANT ALL ON TABLE public.coal_production_records TO postgres, anon, authenticated, service_role;

-- 4. Disable RLS or grant open policy for seamless client SDK access
ALTER TABLE IF EXISTS public.coal_production_records DISABLE ROW LEVEL SECURITY;

-- 5. Force Supabase PostgREST to immediately refresh its schema cache
NOTIFY pgrst, 'reload schema';
