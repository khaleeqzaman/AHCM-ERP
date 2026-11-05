import { 
  pgTable, 
  text, 
  integer, 
  doublePrecision, 
  boolean, 
  jsonb, 
  timestamp 
} from 'drizzle-orm/pg-core';

// 1. Users Table
export const appUsers = pgTable('app_users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  email: text('email'),
  role: text('role').notNull(),
  department: text('department'),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at'),
  lastLogin: text('last_login'),
  phone: text('phone'),
});

// 2. Demands Table
export const demands = pgTable('demands', {
  id: text('id').primaryKey(),
  demandType: text('demand_type').notNull(),
  category: text('category').notNull(),
  date: text('date').notNull(),
  referenceNo: text('reference_no').notNull(),
  items: jsonb('items').notNull(),
  totalAmount: doublePrecision('total_amount').notNull(),
  status: text('status').notNull(),
  adminRemark: text('admin_remark'),
  updatedAt: text('updated_at'),
});

// 3. Purchases Table
export const purchases = pgTable('purchases', {
  id: text('id').primaryKey(),
  paymentType: text('payment_type').notNull(),
  date: text('date').notNull(),
  reference: text('reference').notNull(),
  items: jsonb('items').notNull(),
  totalAmount: doublePrecision('total_amount').notNull(),
  status: text('status').notNull(),
  adminRemark: text('admin_remark'),
  updatedAt: text('updated_at'),
});

// 4. Chart of Accounts Table
export const chartAccounts = pgTable('chart_accounts', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  typeDigit: integer('type_digit'),
  classDigit: integer('class_digit'),
  groupCode: text('group_code'),
  subCode: text('sub_code'),
  name: text('name').notNull(),
  accountType: text('account_type').notNull(),
  classification: text('classification'),
  groupName: text('group_name'),
  normalBalance: text('normal_balance'),
  openingBalance: doublePrecision('opening_balance').default(0),
  currentBalance: doublePrecision('current_balance').default(0),
  description: text('description'),
  isActive: boolean('is_active').default(true),
});

// 5. Accounting Vouchers Table
export const vouchers = pgTable('vouchers', {
  id: text('id').primaryKey(),
  voucherNo: text('voucher_no').notNull(),
  voucherType: text('voucher_type').notNull(),
  typeCode: text('type_code'),
  date: text('date').notNull(),
  referenceNo: text('reference_no'),
  narration: text('narration'),
  lines: jsonb('lines').notNull(),
  totalDebit: doublePrecision('total_debit').notNull(),
  totalCredit: doublePrecision('total_credit').notNull(),
  status: text('status').notNull(),
  preparedBy: text('prepared_by'),
  approvedBy: text('approved_by'),
  approvedAt: text('approved_at'),
  postedBy: text('posted_by'),
  postedAt: text('posted_at'),
  reversedBy: text('reversed_by'),
  reversedAt: text('reversed_at'),
  reversalReason: text('reversal_reason'),
  reversalVoucherNo: text('reversal_voucher_no'),
  cancelledBy: text('cancelled_by'),
  cancelledAt: text('cancelled_at'),
  cancelReason: text('cancel_reason'),
});

// 6. Treasury Cash Book Entries Table
export const cashBookEntries = pgTable('cash_book_entries', {
  id: text('id').primaryKey(),
  srNo: integer('sr_no'),
  date: text('date').notNull(),
  description: text('description').notNull(),
  credit: doublePrecision('credit').default(0),
  debit: doublePrecision('debit').default(0),
  balance: doublePrecision('balance').default(0),
});

// 7. Treasury Credit Book Entries Table
export const creditBookEntries = pgTable('credit_book_entries', {
  id: text('id').primaryKey(),
  srNo: integer('sr_no'),
  date: text('date').notNull(),
  name: text('name').notNull(),
  purpose: text('purpose'),
  amount: doublePrecision('amount').default(0),
});

// 8. Treasury Banks Table
export const banks = pgTable('banks', {
  id: text('id').primaryKey(),
  srNo: integer('sr_no'),
  bankName: text('bank_name').notNull(),
  branchName: text('branch_name'),
  branchCode: text('branch_code'),
  address: text('address'),
});

// 9. Treasury Bank Accounts Table
export const bankAccounts = pgTable('bank_accounts', {
  id: text('id').primaryKey(),
  srNo: integer('sr_no'),
  bankId: text('bank_id').notNull(),
  bankName: text('bank_name').notNull(),
  accountNumber: text('account_number').notNull(),
  accountTitle: text('account_title').notNull(),
  openingBalance: doublePrecision('opening_balance').default(0),
  openingBalanceDate: text('opening_balance_date'),
  transactions: jsonb('transactions').notNull(),
});

// 10. Store & Sales: POS Coal Sales Table
export const posCoalSales = pgTable('pos_coal_sales', {
  id: text('id').primaryKey(),
  srNo: integer('sr_no'),
  buyerId: text('buyer_id'),
  buyerNTN: text('buyer_ntn'),
  buyerCNIC: text('buyer_cnic'),
  buyerName: text('buyer_name').notNull(),
  buyerType: text('buyer_type'),
  saleOrganization: text('sale_organization'),
  documentType: text('document_type'),
  documentNumber: text('document_number'),
  documentDate: text('document_date').notNull(),
  quantity: doublePrecision('quantity').default(0),
  valueExcludingTax: doublePrecision('value_excluding_tax').default(0),
  salesTaxFed: doublePrecision('sales_tax_fed').default(0),
  furtherTax: doublePrecision('further_tax').default(0),
  totalTax: doublePrecision('total_tax').default(0),
  totalValue: doublePrecision('total_value').default(0),
});

// 11. Store & Sales: Coal Sell Records Table
export const coalSellRecords = pgTable('coal_sell_records', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  partnerId: text('partner_id'),
  partnerName: text('partner_name').notNull(),
  quantityTons: doublePrecision('quantity_tons').default(0),
  vehicleNo: text('vehicle_no'),
  remarks: text('remarks'),
});

// 12. Store & Sales: Buyers Table
export const buyers = pgTable('buyers', {
  id: text('id').primaryKey(),
  buyerNTN: text('buyer_ntn'),
  buyerCNIC: text('buyer_cnic'),
  buyerName: text('buyer_name').notNull(),
  buyerType: text('buyer_type').notNull(),
  phone: text('phone'),
  city: text('city'),
});

// 13. Store & Sales: Partners Table
export const partners = pgTable('partners', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  isActive: boolean('is_active').default(true),
  showInReport: boolean('show_in_report').default(true),
  notes: text('notes'),
});

// 14. Store & Sales: Stock Items Table
export const stockItems = pgTable('stock_items', {
  id: text('id').primaryKey(),
  itemCode: text('item_code').notNull(),
  itemName: text('item_name').notNull(),
  category: text('category'),
  unit: text('unit').notNull(),
});

// 15. Store & Sales: Stock Entries Table
export const stockEntries = pgTable('stock_entries', {
  id: text('id').primaryKey(),
  srNo: integer('sr_no'),
  date: text('date').notNull(),
  itemId: text('item_id').notNull(),
  itemName: text('item_name').notNull(),
  itemCode: text('item_code').notNull(),
  stockQty: doublePrecision('stock_qty').default(0),
  purchaseQty: doublePrecision('purchase_qty').default(0),
  mineQty: doublePrecision('mine_qty').default(0),
  vehiclesQty: doublePrecision('vehicles_qty').default(0),
  companyName: text('company_name'),
  balance: doublePrecision('balance').default(0),
});

// 16. Store & Sales: Vehicles Table
export const vehicles = pgTable('vehicles', {
  id: text('id').primaryKey(),
  vehicleNo: text('vehicle_no').notNull(),
  driverName: text('driver_name').notNull(),
  vehicleType: text('vehicle_type').notNull(),
  status: text('status').notNull(),
});

// 17. Store & Sales: Vehicle Consumptions Table
export const vehicleConsumptions = pgTable('vehicle_consumptions', {
  id: text('id').primaryKey(),
  srNo: integer('sr_no'),
  vehicleId: text('vehicle_id').notNull(),
  vehicleNo: text('vehicle_no').notNull(),
  date: text('date').notNull(),
  diesel: doublePrecision('diesel').default(0),
  mOil: doublePrecision('m_oil').default(0),
  dOil: doublePrecision('d_oil').default(0),
  oFltr: doublePrecision('o_fltr').default(0),
  dFltr: doublePrecision('d_fltr').default(0),
  kOil: doublePrecision('k_oil').default(0),
  cOil: doublePrecision('c_oil').default(0),
  bOil: doublePrecision('b_oil').default(0),
  remarks: text('remarks'),
});

// 18. Store & Sales: Company Settings Table
export const companySettings = pgTable('company_settings', {
  id: text('id').primaryKey(),
  companyName: text('company_name').notNull(),
  address: text('address').notNull(),
  ntnNumber: text('ntn_number'),
  contactNumber: text('contact_number'),
  email: text('email'),
});
