-- ====================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR ENTERPRISE ERP / COAL MINING SYSTEM
-- ====================================================================
-- Run this script in the Supabase Dashboard -> SQL Editor -> Run
-- This script is idempotent (safe to run multiple times).
-- ====================================================================

-- 1. App Users Table
CREATE TABLE IF NOT EXISTS public.app_users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL,
    department TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT,
    last_login TEXT,
    phone TEXT
);

CREATE INDEX IF NOT EXISTS idx_app_users_username ON public.app_users(username);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON public.app_users(role);

-- 2. Demands Table
CREATE TABLE IF NOT EXISTS public.demands (
    id TEXT PRIMARY KEY,
    demand_type TEXT NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    reference_no TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    admin_remark TEXT,
    updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_demands_reference_no ON public.demands(reference_no);
CREATE INDEX IF NOT EXISTS idx_demands_date ON public.demands(date);
CREATE INDEX IF NOT EXISTS idx_demands_status ON public.demands(status);

-- 3. Purchases Table
CREATE TABLE IF NOT EXISTS public.purchases (
    id TEXT PRIMARY KEY,
    payment_type TEXT NOT NULL,
    date TEXT NOT NULL,
    reference TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    admin_remark TEXT,
    updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_purchases_reference ON public.purchases(reference);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON public.purchases(date);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);

-- 4. Chart of Accounts Table
CREATE TABLE IF NOT EXISTS public.chart_accounts (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    type_digit INTEGER,
    class_digit INTEGER,
    group_code TEXT,
    sub_code TEXT,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    classification TEXT,
    group_name TEXT,
    normal_balance TEXT,
    opening_balance DOUBLE PRECISION DEFAULT 0,
    current_balance DOUBLE PRECISION DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_chart_accounts_code ON public.chart_accounts(code);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_type ON public.chart_accounts(account_type);

-- 5. Accounting Vouchers Table
CREATE TABLE IF NOT EXISTS public.vouchers (
    id TEXT PRIMARY KEY,
    voucher_no TEXT NOT NULL UNIQUE,
    voucher_type TEXT NOT NULL,
    type_code TEXT,
    date TEXT NOT NULL,
    reference_no TEXT,
    narration TEXT,
    lines JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_debit DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_credit DOUBLE PRECISION NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    prepared_by TEXT,
    approved_by TEXT,
    approved_at TEXT,
    posted_by TEXT,
    posted_at TEXT,
    reversed_by TEXT,
    reversed_at TEXT,
    reversal_reason TEXT,
    reversal_voucher_no TEXT,
    cancelled_by TEXT,
    cancelled_at TEXT,
    cancel_reason TEXT
);

-- Ensure non-breaking columns exist on existing vouchers tables
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS type_code TEXT;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS prepared_by TEXT;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS approved_at TEXT;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS posted_by TEXT;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS posted_at TEXT;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS reversed_by TEXT;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS reversed_at TEXT;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS reversal_reason TEXT;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS reversal_voucher_no TEXT;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS cancelled_by TEXT;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS cancelled_at TEXT;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_vouchers_no ON public.vouchers(voucher_no);
CREATE INDEX IF NOT EXISTS idx_vouchers_date ON public.vouchers(date);
CREATE INDEX IF NOT EXISTS idx_vouchers_type ON public.vouchers(voucher_type);

-- 6. Treasury Cash Book Entries Table
CREATE TABLE IF NOT EXISTS public.cash_book_entries (
    id TEXT PRIMARY KEY,
    sr_no INTEGER,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    credit DOUBLE PRECISION DEFAULT 0,
    debit DOUBLE PRECISION DEFAULT 0,
    balance DOUBLE PRECISION DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_cash_book_date ON public.cash_book_entries(date);

-- 7. Treasury Credit Book Entries Table
CREATE TABLE IF NOT EXISTS public.credit_book_entries (
    id TEXT PRIMARY KEY,
    sr_no INTEGER,
    date TEXT NOT NULL,
    name TEXT NOT NULL,
    purpose TEXT,
    amount DOUBLE PRECISION DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_credit_book_date ON public.credit_book_entries(date);

-- 8. Treasury Banks Table
CREATE TABLE IF NOT EXISTS public.banks (
    id TEXT PRIMARY KEY,
    sr_no INTEGER,
    bank_name TEXT NOT NULL,
    branch_name TEXT,
    branch_code TEXT,
    address TEXT
);

-- 9. Treasury Bank Accounts Table
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id TEXT PRIMARY KEY,
    sr_no INTEGER,
    bank_id TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_title TEXT NOT NULL,
    opening_balance DOUBLE PRECISION DEFAULT 0,
    opening_balance_date TEXT,
    transactions JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_bank_id ON public.bank_accounts(bank_id);

-- 10. Store & Sales: POS Coal Sales Table
CREATE TABLE IF NOT EXISTS public.pos_coal_sales (
    id TEXT PRIMARY KEY,
    sr_no INTEGER,
    buyer_id TEXT,
    buyer_ntn TEXT,
    buyer_cnic TEXT,
    buyer_name TEXT NOT NULL,
    buyer_type TEXT,
    sale_organization TEXT,
    document_type TEXT,
    document_number TEXT,
    document_date TEXT NOT NULL,
    quantity DOUBLE PRECISION DEFAULT 0,
    value_excluding_tax DOUBLE PRECISION DEFAULT 0,
    sales_tax_fed DOUBLE PRECISION DEFAULT 0,
    further_tax DOUBLE PRECISION DEFAULT 0,
    total_tax DOUBLE PRECISION DEFAULT 0,
    total_value DOUBLE PRECISION DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pos_coal_sales_date ON public.pos_coal_sales(document_date);
CREATE INDEX IF NOT EXISTS idx_pos_coal_sales_buyer ON public.pos_coal_sales(buyer_id);

-- 11. Store & Sales: Coal Sell Records Table
CREATE TABLE IF NOT EXISTS public.coal_sell_records (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    partner_id TEXT,
    partner_name TEXT NOT NULL,
    quantity_tons DOUBLE PRECISION DEFAULT 0,
    vehicle_no TEXT,
    remarks TEXT
);

CREATE INDEX IF NOT EXISTS idx_coal_sell_date ON public.coal_sell_records(date);
CREATE INDEX IF NOT EXISTS idx_coal_sell_partner ON public.coal_sell_records(partner_id);

-- 12. Store & Sales: Buyers Table
CREATE TABLE IF NOT EXISTS public.buyers (
    id TEXT PRIMARY KEY,
    buyer_ntn TEXT,
    buyer_cnic TEXT,
    buyer_name TEXT NOT NULL,
    buyer_type TEXT NOT NULL,
    phone TEXT,
    city TEXT
);

-- 13. Store & Sales: Partners Table
CREATE TABLE IF NOT EXISTS public.partners (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    show_in_report BOOLEAN DEFAULT TRUE,
    notes TEXT
);

-- 14. Store & Sales: Stock Items Table
CREATE TABLE IF NOT EXISTS public.stock_items (
    id TEXT PRIMARY KEY,
    item_code TEXT NOT NULL UNIQUE,
    item_name TEXT NOT NULL,
    category TEXT,
    unit TEXT NOT NULL
);

-- 15. Store & Sales: Stock Entries Table
CREATE TABLE IF NOT EXISTS public.stock_entries (
    id TEXT PRIMARY KEY,
    sr_no INTEGER,
    date TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_code TEXT NOT NULL,
    stock_qty DOUBLE PRECISION DEFAULT 0,
    purchase_qty DOUBLE PRECISION DEFAULT 0,
    mine_qty DOUBLE PRECISION DEFAULT 0,
    vehicles_qty DOUBLE PRECISION DEFAULT 0,
    company_name TEXT,
    balance DOUBLE PRECISION DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_stock_entries_date ON public.stock_entries(date);
CREATE INDEX IF NOT EXISTS idx_stock_entries_item ON public.stock_entries(item_id);

-- 16. Store & Sales: Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id TEXT PRIMARY KEY,
    vehicle_no TEXT NOT NULL UNIQUE,
    driver_name TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    status TEXT NOT NULL
);

-- 17. Store & Sales: Vehicle Consumptions Table
CREATE TABLE IF NOT EXISTS public.vehicle_consumptions (
    id TEXT PRIMARY KEY,
    sr_no INTEGER,
    vehicle_id TEXT NOT NULL,
    vehicle_no TEXT NOT NULL,
    date TEXT NOT NULL,
    diesel DOUBLE PRECISION DEFAULT 0,
    m_oil DOUBLE PRECISION DEFAULT 0,
    d_oil DOUBLE PRECISION DEFAULT 0,
    o_fltr DOUBLE PRECISION DEFAULT 0,
    d_fltr DOUBLE PRECISION DEFAULT 0,
    k_oil DOUBLE PRECISION DEFAULT 0,
    c_oil DOUBLE PRECISION DEFAULT 0,
    b_oil DOUBLE PRECISION DEFAULT 0,
    remarks TEXT
);

CREATE INDEX IF NOT EXISTS idx_vehicle_consumptions_vehicle ON public.vehicle_consumptions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_consumptions_date ON public.vehicle_consumptions(date);

-- 18. Store & Sales: Company Settings Table
CREATE TABLE IF NOT EXISTS public.company_settings (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    address TEXT NOT NULL,
    ntn_number TEXT,
    contact_number TEXT,
    email TEXT
);

-- ====================================================================
-- SEED ESSENTIAL PRODUCTION DATA (Idempotent)
-- ====================================================================

-- Essential Production Users (Admin, Purchaser, Cashier, Accountant, Store Manager)
INSERT INTO public.app_users (id, username, password, name, email, role, department, status, created_at, last_login, phone)
VALUES
('usr_1', 'admin', 'admin123', 'System Administrator', 'admin@coalmine.local', 'admin', 'Management', 'active', '2026-01-01', '2026-03-30', '+92 300 0000001'),
('usr_2', 'purchaser', 'purchaser123', 'Procurement Officer', 'purchaser@coalmine.local', 'purchaser', 'Procurement', 'active', '2026-01-01', '2026-03-29', '+92 300 0000002'),
('usr_3', 'cashier', 'cashier123', 'Cashier', 'cashier@coalmine.local', 'cashier', 'Treasury', 'active', '2026-01-01', '2026-03-29', '+92 300 0000003'),
('usr_4', 'accountant', 'accountant123', 'Chief Accountant', 'accountant@coalmine.local', 'accountant', 'Finance', 'active', '2026-01-01', '2026-03-30', '+92 300 0000004'),
('usr_5', 'store_manager', 'store123', 'Store & Sales Manager', 'store@coalmine.local', 'store_manager', 'Inventory & Dispatch', 'active', '2026-01-01', '2026-03-28', '+92 300 0000005')
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    status = EXCLUDED.status;

-- Default Company Settings
INSERT INTO public.company_settings (id, company_name, address, ntn_number, contact_number, email)
VALUES
('cs_default', 'Indus Coal & Minerals Enterprise', 'Mining Site Sector 4, Lakhra Coalfield, Jamshoro, Sindh', '7492104-8', '+92-22-3849102', 'contact@induscoalminerals.com')
ON CONFLICT (id) DO NOTHING;

-- Standard Chart of Accounts
INSERT INTO public.chart_accounts (id, code, type_digit, class_digit, group_code, sub_code, name, account_type, classification, group_name, normal_balance, opening_balance, current_balance, description, is_active)
VALUES
('coa_1', '1001', 1, 1, '10', '01', 'Main Cash in Hand (Treasury)', 'asset', 'Current Asset', 'Cash & Cash Equivalents', 'debit', 0, 0, 'Physical cash stored in central mine safe', true),
('coa_2', '1002', 1, 1, '10', '02', 'Petty Cash - Mine Site', 'asset', 'Current Asset', 'Cash & Cash Equivalents', 'debit', 0, 0, 'On-site petty cash for emergency mine procurement', true),
('coa_3', '1010', 1, 1, '10', '10', 'Habib Bank Limited (HBL) - Operational', 'asset', 'Current Asset', 'Bank Accounts', 'debit', 0, 0, 'Main payroll and operations clearing account', true),
('coa_4', '1020', 1, 1, '10', '20', 'Accounts Receivable - Coal Buyers', 'asset', 'Current Asset', 'Receivables', 'debit', 0, 0, 'Trade receivables from wholesale coal dispatches', true),
('coa_5', '1030', 1, 1, '10', '30', 'Inventory - Raw Coal Stockpiles', 'asset', 'Current Asset', 'Inventory', 'debit', 0, 0, 'Stock of mined coal ready for screening & dispatch', true),
('coa_6', '1031', 1, 1, '10', '31', 'Inventory - Machinery Spares & Oils', 'asset', 'Current Asset', 'Inventory', 'debit', 0, 0, 'Heavy plant parts, lubricants, diesel stocks', true),
('coa_7', '2001', 2, 1, '20', '01', 'Accounts Payable - Vendors & Spares', 'liability', 'Current Liability', 'Trade Payables', 'credit', 0, 0, 'Amounts due for explosive supplies, diesel, and machinery repair', true),
('coa_8', '3001', 3, 1, '30', '01', 'Partners Capital Fund', 'equity', 'Equity', 'Shareholders Capital', 'credit', 0, 0, 'Initial equity capital provided by partners', true),
('coa_9', '4001', 4, 1, '40', '01', 'Coal Sales Revenue', 'revenue', 'Revenue', 'Operating Revenue', 'credit', 0, 0, 'Gross proceeds from bulk and retail coal dispatches', true),
('coa_10', '5001', 5, 1, '50', '01', 'Direct Mining & Excavation Expenses', 'expense', 'Expense', 'Cost of Production', 'debit', 0, 0, 'Direct extraction labor, explosives, compressor costs', true),
('coa_11', '5002', 5, 1, '50', '02', 'Machinery Fuel & Diesel Consumption', 'expense', 'Expense', 'Fleet & Plant Expenses', 'debit', 0, 0, 'Heavy dumpers, excavators, generator fuel consumption', true),
('coa_12', '5003', 5, 1, '50', '03', 'Site Salaries & Labor Wages', 'expense', 'Expense', 'Payroll', 'debit', 0, 0, 'Monthly salaries for engineers, staff, and miners', true)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions for Supabase standard roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
