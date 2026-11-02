import { pool } from './index.ts';
import { initialUsers } from '../data/mockUsers.ts';
import { initialChartOfAccounts } from '../data/mockAccountingData.ts';
import { initialCompanySettings } from '../data/mockStoreSalesData.ts';
import { dbGetUsers, dbSaveUser, dbGetChartAccounts, dbSaveChartAccount, dbGetCompanySettings, dbSaveCompanySettings } from './queries.ts';

const TABLE_CREATION_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "app_users" (
    "id" text PRIMARY KEY NOT NULL,
    "username" text NOT NULL,
    "password" text NOT NULL,
    "name" text NOT NULL,
    "email" text,
    "role" text NOT NULL,
    "department" text,
    "status" text DEFAULT 'active' NOT NULL,
    "created_at" text,
    "last_login" text,
    "phone" text,
    CONSTRAINT "app_users_username_unique" UNIQUE("username")
  );`,

  `CREATE TABLE IF NOT EXISTS "bank_accounts" (
    "id" text PRIMARY KEY NOT NULL,
    "sr_no" integer,
    "bank_id" text NOT NULL,
    "bank_name" text NOT NULL,
    "account_number" text NOT NULL,
    "account_title" text NOT NULL,
    "opening_balance" double precision DEFAULT 0,
    "opening_balance_date" text,
    "transactions" jsonb NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "banks" (
    "id" text PRIMARY KEY NOT NULL,
    "sr_no" integer,
    "bank_name" text NOT NULL,
    "branch_name" text,
    "branch_code" text,
    "address" text
  );`,

  `CREATE TABLE IF NOT EXISTS "buyers" (
    "id" text PRIMARY KEY NOT NULL,
    "buyer_ntn" text,
    "buyer_cnic" text,
    "buyer_name" text NOT NULL,
    "buyer_type" text NOT NULL,
    "phone" text,
    "city" text
  );`,

  `CREATE TABLE IF NOT EXISTS "cash_book_entries" (
    "id" text PRIMARY KEY NOT NULL,
    "sr_no" integer,
    "date" text NOT NULL,
    "description" text NOT NULL,
    "credit" double precision DEFAULT 0,
    "debit" double precision DEFAULT 0,
    "balance" double precision DEFAULT 0
  );`,

  `CREATE TABLE IF NOT EXISTS "chart_accounts" (
    "id" text PRIMARY KEY NOT NULL,
    "code" text NOT NULL,
    "type_digit" integer,
    "class_digit" integer,
    "group_code" text,
    "sub_code" text,
    "name" text NOT NULL,
    "account_type" text NOT NULL,
    "classification" text,
    "group_name" text,
    "normal_balance" text,
    "opening_balance" double precision DEFAULT 0,
    "current_balance" double precision DEFAULT 0,
    "description" text,
    "is_active" boolean DEFAULT true
  );`,

  `CREATE TABLE IF NOT EXISTS "coal_sell_records" (
    "id" text PRIMARY KEY NOT NULL,
    "date" text NOT NULL,
    "partner_id" text,
    "partner_name" text NOT NULL,
    "quantity_tons" double precision DEFAULT 0,
    "vehicle_no" text,
    "remarks" text
  );`,

  `CREATE TABLE IF NOT EXISTS "company_settings" (
    "id" text PRIMARY KEY NOT NULL,
    "company_name" text NOT NULL,
    "address" text NOT NULL,
    "ntn_number" text,
    "contact_number" text,
    "email" text
  );`,

  `CREATE TABLE IF NOT EXISTS "credit_book_entries" (
    "id" text PRIMARY KEY NOT NULL,
    "sr_no" integer,
    "date" text NOT NULL,
    "name" text NOT NULL,
    "purpose" text,
    "amount" double precision DEFAULT 0
  );`,

  `CREATE TABLE IF NOT EXISTS "demands" (
    "id" text PRIMARY KEY NOT NULL,
    "demand_type" text NOT NULL,
    "category" text NOT NULL,
    "date" text NOT NULL,
    "reference_no" text NOT NULL,
    "items" jsonb NOT NULL,
    "total_amount" double precision NOT NULL,
    "status" text NOT NULL,
    "admin_remark" text,
    "updated_at" text
  );`,

  `CREATE TABLE IF NOT EXISTS "partners" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "code" text NOT NULL,
    "is_active" boolean DEFAULT true,
    "show_in_report" boolean DEFAULT true,
    "notes" text
  );`,

  `CREATE TABLE IF NOT EXISTS "pos_coal_sales" (
    "id" text PRIMARY KEY NOT NULL,
    "sr_no" integer,
    "buyer_id" text,
    "buyer_ntn" text,
    "buyer_cnic" text,
    "buyer_name" text NOT NULL,
    "buyer_type" text,
    "sale_organization" text,
    "document_type" text,
    "document_number" text,
    "document_date" text NOT NULL,
    "quantity" double precision DEFAULT 0,
    "value_excluding_tax" double precision DEFAULT 0,
    "sales_tax_fed" double precision DEFAULT 0,
    "further_tax" double precision DEFAULT 0,
    "total_tax" double precision DEFAULT 0,
    "total_value" double precision DEFAULT 0
  );`,

  `CREATE TABLE IF NOT EXISTS "purchases" (
    "id" text PRIMARY KEY NOT NULL,
    "payment_type" text NOT NULL,
    "date" text NOT NULL,
    "reference" text NOT NULL,
    "items" jsonb NOT NULL,
    "total_amount" double precision NOT NULL,
    "status" text NOT NULL,
    "admin_remark" text,
    "updated_at" text
  );`,

  `CREATE TABLE IF NOT EXISTS "stock_entries" (
    "id" text PRIMARY KEY NOT NULL,
    "sr_no" integer,
    "date" text NOT NULL,
    "item_id" text NOT NULL,
    "item_name" text NOT NULL,
    "item_code" text NOT NULL,
    "stock_qty" double precision DEFAULT 0,
    "purchase_qty" double precision DEFAULT 0,
    "mine_qty" double precision DEFAULT 0,
    "vehicles_qty" double precision DEFAULT 0,
    "company_name" text,
    "balance" double precision DEFAULT 0
  );`,

  `CREATE TABLE IF NOT EXISTS "stock_items" (
    "id" text PRIMARY KEY NOT NULL,
    "item_code" text NOT NULL,
    "item_name" text NOT NULL,
    "category" text,
    "unit" text NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "vehicle_consumptions" (
    "id" text PRIMARY KEY NOT NULL,
    "sr_no" integer,
    "vehicle_id" text NOT NULL,
    "vehicle_no" text NOT NULL,
    "date" text NOT NULL,
    "diesel" double precision DEFAULT 0,
    "m_oil" double precision DEFAULT 0,
    "d_oil" double precision DEFAULT 0,
    "o_fltr" double precision DEFAULT 0,
    "d_fltr" double precision DEFAULT 0,
    "k_oil" double precision DEFAULT 0,
    "c_oil" double precision DEFAULT 0,
    "b_oil" double precision DEFAULT 0,
    "remarks" text
  );`,

  `CREATE TABLE IF NOT EXISTS "vehicles" (
    "id" text PRIMARY KEY NOT NULL,
    "vehicle_no" text NOT NULL,
    "driver_name" text NOT NULL,
    "vehicle_type" text NOT NULL,
    "status" text NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "vouchers" (
    "id" text PRIMARY KEY NOT NULL,
    "voucher_no" text NOT NULL,
    "voucher_type" text NOT NULL,
    "date" text NOT NULL,
    "reference_no" text,
    "narration" text,
    "lines" jsonb NOT NULL,
    "total_debit" double precision NOT NULL,
    "total_credit" double precision NOT NULL,
    "status" text NOT NULL,
    "posted_at" text
  );`,
];

/**
 * Ensures all required PostgreSQL database tables are created (idempotent)
 * and seeds baseline data (app users, chart of accounts, company settings) if empty.
 */
export async function autoMigrateAndSeed(): Promise<{ success: boolean; message: string; tablesCreated: number }> {
  const client = await pool.connect();
  let tablesCreated = 0;

  try {
    // 1. Ensure tables exist in public schema
    for (const ddl of TABLE_CREATION_STATEMENTS) {
      try {
        await client.query(ddl);
        tablesCreated++;
      } catch (tableErr: any) {
        // Ignore "already exists" errors
        if (!tableErr.message?.includes('already exists')) {
          console.warn('Migration warning on DDL statement:', tableErr.message);
        }
      }
    }

    console.log(`Auto-migration complete: verified/created ${tablesCreated} tables in PostgreSQL database.`);
  } finally {
    client.release();
  }

  // 2. Baseline seed if tables are empty
  try {
    const existingUsers = await dbGetUsers().catch(() => []);
    if (existingUsers.length === 0) {
      console.log('Seeding initial baseline users...');
      for (const u of initialUsers) {
        await dbSaveUser(u);
      }
    }

    const existingAccounts = await dbGetChartAccounts().catch(() => []);
    if (existingAccounts.length === 0) {
      console.log('Seeding initial chart of accounts...');
      for (const a of initialChartOfAccounts) {
        await dbSaveChartAccount(a);
      }
    }

    const existingSettings = await dbGetCompanySettings().catch(() => null);
    if (!existingSettings) {
      console.log('Seeding initial company settings...');
      await dbSaveCompanySettings(initialCompanySettings);
    }
  } catch (seedErr) {
    console.warn('Baseline seed warning:', seedErr);
  }

  return {
    success: true,
    message: 'Database tables verified and baseline data seeded successfully',
    tablesCreated,
  };
}
