CREATE TABLE "app_users" (
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
);
--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"sr_no" integer,
	"bank_id" text NOT NULL,
	"bank_name" text NOT NULL,
	"account_number" text NOT NULL,
	"account_title" text NOT NULL,
	"opening_balance" double precision DEFAULT 0,
	"opening_balance_date" text,
	"transactions" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banks" (
	"id" text PRIMARY KEY NOT NULL,
	"sr_no" integer,
	"bank_name" text NOT NULL,
	"branch_name" text,
	"branch_code" text,
	"address" text
);
--> statement-breakpoint
CREATE TABLE "buyers" (
	"id" text PRIMARY KEY NOT NULL,
	"buyer_ntn" text,
	"buyer_cnic" text,
	"buyer_name" text NOT NULL,
	"buyer_type" text NOT NULL,
	"phone" text,
	"city" text
);
--> statement-breakpoint
CREATE TABLE "cash_book_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"sr_no" integer,
	"date" text NOT NULL,
	"description" text NOT NULL,
	"credit" double precision DEFAULT 0,
	"debit" double precision DEFAULT 0,
	"balance" double precision DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "chart_accounts" (
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
);
--> statement-breakpoint
CREATE TABLE "coal_sell_records" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"partner_id" text,
	"partner_name" text NOT NULL,
	"quantity_tons" double precision DEFAULT 0,
	"vehicle_no" text,
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE "company_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"address" text NOT NULL,
	"ntn_number" text,
	"contact_number" text,
	"email" text
);
--> statement-breakpoint
CREATE TABLE "credit_book_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"sr_no" integer,
	"date" text NOT NULL,
	"name" text NOT NULL,
	"purpose" text,
	"amount" double precision DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "demands" (
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
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"show_in_report" boolean DEFAULT true,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "pos_coal_sales" (
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
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_type" text NOT NULL,
	"date" text NOT NULL,
	"reference" text NOT NULL,
	"items" jsonb NOT NULL,
	"total_amount" double precision NOT NULL,
	"status" text NOT NULL,
	"admin_remark" text,
	"updated_at" text
);
--> statement-breakpoint
CREATE TABLE "stock_entries" (
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
);
--> statement-breakpoint
CREATE TABLE "stock_items" (
	"id" text PRIMARY KEY NOT NULL,
	"item_code" text NOT NULL,
	"item_name" text NOT NULL,
	"category" text,
	"unit" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_consumptions" (
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
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" text PRIMARY KEY NOT NULL,
	"vehicle_no" text NOT NULL,
	"driver_name" text NOT NULL,
	"vehicle_type" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vouchers" (
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
);
