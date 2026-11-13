import { 
  supabase, 
  SUPABASE_TABLES, 
  SUPABASE_URL, 
  isSupabaseConfigured,
  getCurrentSupabaseAnonKey,
  getCurrentSupabaseUrl 
} from '../lib/supabase';
import type { User } from '../types/user';
import type { DemandDocument, PurchaseDocument } from '../types/index';
import type { ChartAccount, VoucherDocument } from '../types/accounting';
import type { CashBookEntry, CreditBookEntry, BankRecord, BankAccountRecord } from '../types/treasury';
import type {
  CompanySettings,
  BuyerRecord,
  PartnerRecord,
  PosCoalSellEntry,
  CoalSellRecord,
  CoalStockRecord,
  CoalProductionRecord,
  StockItem,
  StockEntry,
  VehicleRecord,
  VehicleConsumptionRecord,
  VehicleConsumptionSummary,
  ItemWiseStockSummary,
  MineRecord,
  ItemCategory,
  ItemUnitType,
  MachineryType,
  ItemConsumptionRecord,
  ConsumptionTargetType,
} from '../types/storeSales';

import { initialUsers } from '../data/mockUsers';
import { initialDemands, initialPurchases } from '../data/mockData';
import { initialChartOfAccounts, initialVouchers } from '../data/mockAccountingData';
import {
  initialCashBookEntries,
  initialBanks,
  initialBankAccounts,
  initialCreditBookEntries,
} from '../data/mockTreasuryData';
import {
  initialCompanySettings,
  initialBuyers,
  initialPartners,
  initialPosEntries,
  initialCoalSellRecords,
  initialCoalProductionRecords,
  initialStockItems,
  initialStockEntries,
  initialVehicles,
  initialVehicleConsumptions,
  initialMines,
  initialItemCategories,
  initialItemUnits,
  initialMachineryTypes,
  initialItemConsumptions,
} from '../data/mockStoreSalesData';

export interface BootstrapData {
  users: User[];
  demands: DemandDocument[];
  purchases: PurchaseDocument[];
  accounts: ChartAccount[];
  vouchers: VoucherDocument[];
  cashBookEntries: CashBookEntry[];
  creditBookEntries: CreditBookEntry[];
  banks: BankRecord[];
  bankAccounts: BankAccountRecord[];
  companySettings: CompanySettings;
  buyers: BuyerRecord[];
  partners: PartnerRecord[];
  posEntries: PosCoalSellEntry[];
  coalSellRecords: CoalSellRecord[];
  coalProductionRecords: CoalProductionRecord[];
  stockItems: StockItem[];
  stockEntries: StockEntry[];
  vehicles: VehicleRecord[];
  vehicleConsumptions: VehicleConsumptionRecord[];
  mines: MineRecord[];
  itemCategories: ItemCategory[];
  itemUnits: ItemUnitType[];
  machineryTypes: MachineryType[];
  itemConsumptions: ItemConsumptionRecord[];
  vehicleConsumptionSummary?: VehicleConsumptionSummary[];
  itemWiseStockSummary?: ItemWiseStockSummary[];
}

export interface DiagnosticLogEntry {
  id: string;
  timestamp: string;
  functionName: string;
  url: string;
  method: string;
  payload: any;
  status?: number;
  response?: any;
  error?: string;
  durationMs: number;
  success: boolean;
}

// In-memory ring buffer of diagnostic logs (keeps last 100 entries)
const MAX_LOGS = 100;
let diagnosticLogs: DiagnosticLogEntry[] = (() => {
  try {
    const saved = sessionStorage.getItem('ahcm_db_diagnostic_logs');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore storage errors
  }
  return [];
})();

const listeners = new Set<() => void>();

function appendDiagnosticLog(entry: DiagnosticLogEntry) {
  diagnosticLogs.unshift(entry);
  if (diagnosticLogs.length > MAX_LOGS) {
    diagnosticLogs = diagnosticLogs.slice(0, MAX_LOGS);
  }
  try {
    sessionStorage.setItem('ahcm_db_diagnostic_logs', JSON.stringify(diagnosticLogs.slice(0, 30)));
  } catch {}
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.warn('Error in diagnostic log listener:', e);
    }
  });
}

export function getDbApiDiagnosticLogs(): DiagnosticLogEntry[] {
  return [...diagnosticLogs];
}

export function clearDbApiDiagnosticLogs(): void {
  diagnosticLogs = [];
  try {
    sessionStorage.removeItem('ahcm_db_diagnostic_logs');
  } catch {}
  listeners.forEach((fn) => fn());
}

export function subscribeDbApiDiagnostics(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Diagnostic wrapper around direct Supabase operations.
 * If Supabase Anon Key is not yet configured, skips network call to prevent 401 spam.
 */
async function diagnosticSupabaseOperation<T>(
  functionName: string,
  tableName: string,
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'UPSERT' | 'DELETE' | 'PING',
  payload: any,
  queryFn: () => PromiseLike<{ data: any; error: any; status?: number }>
): Promise<T | null> {
  const currentUrl = getCurrentSupabaseUrl();
  const endpointUrl = `${currentUrl}/rest/v1/${tableName}`;

  // If Supabase key is missing in local environment, avoid firing 401-destined requests
  if (!isSupabaseConfigured()) {
    return null;
  }

  const startTime = performance.now();
  const timestamp = new Date().toISOString();
  const logId = `sp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  console.groupCollapsed(
    `%c[SUPABASE SDK] %c${operation} %c${tableName} %c(${functionName})`,
    'color: #10b981; font-weight: bold;',
    'color: #0284c7; font-weight: bold;',
    'color: #0f172a; font-weight: 600;',
    'color: #64748b; font-style: italic;'
  );
  console.log('Timestamp:', timestamp);
  console.log('Endpoint URL:', endpointUrl);
  console.log('Operation:', operation);
  console.log('Payload:', payload !== undefined ? payload : '(none)');
  console.groupEnd();

  try {
    const { data, error, status } = await queryFn();
    const durationMs = Math.round(performance.now() - startTime);

    if (error) {
      const errorMsg = error.message || error.details || JSON.stringify(error);
      const is401 = status === 401 || String(errorMsg).toLowerCase().includes('api key');
      const isMissingTable =
        error.code === 'PGRST205' ||
        String(errorMsg).toLowerCase().includes('could not find the table') ||
        String(errorMsg).toLowerCase().includes('schema cache');

      console.warn(
        `%c[SUPABASE ${is401 ? 'KEY NOTICE' : isMissingTable ? 'TABLE MISSING NOTICE' : 'ERROR'} %c${status || 500}%c] %c${operation} ${tableName} (${durationMs}ms)`,
        'color: #d97706; font-weight: bold;',
        'color: #b45309; font-weight: 800;',
        'color: #d97706; font-weight: bold;',
        'color: #0f172a;',
        { functionName, payload, error }
      );

      appendDiagnosticLog({
        id: logId,
        timestamp,
        functionName,
        url: endpointUrl,
        method: operation,
        payload,
        status: status || 500,
        error: is401
          ? `Invalid Supabase API Key. Configure NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel or Database Diagnostics.`
          : isMissingTable
          ? `Table '${tableName}' not found in Supabase schema cache (PGRST205). Run migration 'src/db/migrations/create_coal_production_records.sql' in Supabase SQL Editor. Fallback to local offline storage active.`
          : `Supabase Error (${error.code || 'ERR'}): ${errorMsg}`,
        durationMs,
        success: false,
      });

      return null;
    }

    console.log(
      `%c[SUPABASE SUCCESS] %c${operation} ${tableName} %c(${durationMs}ms)`,
      'color: #16a34a; font-weight: bold;',
      'color: #0f172a;',
      'color: #64748b;',
      { functionName, payload, data }
    );

    appendDiagnosticLog({
      id: logId,
      timestamp,
      functionName,
      url: endpointUrl,
      method: operation,
      payload,
      status: status || 200,
      response: data,
      durationMs,
      success: true,
    });

    return data as T;
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - startTime);
    const errorMessage = err?.message || String(err);

    console.error(
      `%c[SUPABASE EXCEPTION] %c${operation} ${tableName} (${durationMs}ms)`,
      'color: #dc2626; font-weight: bold;',
      'color: #0f172a;',
      { functionName, payload, exception: errorMessage, stack: err?.stack }
    );

    appendDiagnosticLog({
      id: logId,
      timestamp,
      functionName,
      url: endpointUrl,
      method: operation,
      payload,
      error: `SDK Exception: ${errorMessage}`,
      durationMs,
      success: false,
    });

    return null;
  }
}

// ==========================================
// MAPPERS: POSTGRESQL (snake_case) <-> TS (camelCase)
// ==========================================

const mapUserFromRow = (r: any): User => ({
  id: r.id,
  username: r.username,
  password: r.password,
  name: r.name,
  email: r.email || '',
  role: r.role,
  department: r.department || '',
  status: r.status || 'active',
  createdAt: r.created_at || '',
  lastLogin: r.last_login || '',
  phone: r.phone || '',
});

const mapUserToRow = (u: User) => ({
  id: u.id,
  username: u.username,
  password: u.password,
  name: u.name,
  email: u.email || '',
  role: u.role,
  department: u.department || '',
  status: u.status,
  created_at: u.createdAt || '',
  last_login: u.lastLogin || '',
  phone: u.phone || '',
});

const parseJsonArray = <T>(val: any, fallback: T[] = []): T[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim().length > 0) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return fallback;
};

const mapDemandFromRow = (r: any): DemandDocument => ({
  id: r.id,
  demandType: r.demand_type,
  category: r.category,
  date: r.date,
  referenceNo: r.reference_no,
  items: parseJsonArray(r.items),
  totalAmount: Number(r.total_amount || 0),
  status: r.status,
  adminRemark: r.admin_remark || undefined,
  updatedAt: r.updated_at || '',
});

const mapDemandToRow = (d: DemandDocument) => ({
  id: d.id,
  demand_type: d.demandType,
  category: d.category,
  date: d.date,
  reference_no: d.referenceNo,
  items: d.items || [],
  total_amount: d.totalAmount || 0,
  status: d.status,
  admin_remark: d.adminRemark || null,
  updated_at: d.updatedAt || new Date().toISOString(),
});

const mapPurchaseFromRow = (r: any): PurchaseDocument => ({
  id: r.id,
  paymentType: r.payment_type,
  date: r.date,
  reference: r.reference,
  items: parseJsonArray(r.items),
  totalAmount: Number(r.total_amount || 0),
  status: r.status,
  adminRemark: r.admin_remark || undefined,
  updatedAt: r.updated_at || '',
});

const mapPurchaseToRow = (p: PurchaseDocument) => ({
  id: p.id,
  payment_type: p.paymentType,
  date: p.date,
  reference: p.reference,
  items: p.items || [],
  total_amount: p.totalAmount || 0,
  status: p.status,
  admin_remark: p.adminRemark || null,
  updated_at: p.updatedAt || new Date().toISOString(),
});

const mapChartAccountFromRow = (r: any): ChartAccount => {
  let monthly = r.monthly;
  if (typeof monthly === 'string' && monthly.trim().length > 0) {
    try {
      monthly = JSON.parse(monthly);
    } catch {
      monthly = undefined;
    }
  }
  return {
    id: r.id,
    code: r.code,
    accountNo: r.account_no || r.code,
    typeDigit: Number(r.type_digit || 1),
    classDigit: Number(r.class_digit || 1),
    groupCode: r.group_code || '',
    subCode: r.sub_code || '',
    name: r.name,
    accountType: r.account_type,
    classification: r.classification || '',
    groupName: r.group_name || '',
    normalBalance: (r.normal_balance || 'Debit') as any,
    openingBalance: Number(r.opening_balance || 0),
    currentBalance: Number(r.current_balance || 0),
    description: r.description || undefined,
    isActive: r.is_active ?? true,
    level: r.level !== null && r.level !== undefined ? Number(r.level) : undefined,
    transType: r.trans_type || undefined,
    parentAccountNo: r.parent_account_no ?? undefined,
    openingBalanceType: r.opening_balance_type || (r.normal_balance === 'Credit' ? 'CR' : 'DR'),
    monthly: monthly || undefined,
  };
};

const mapChartAccountCoreToRow = (a: ChartAccount) => ({
  id: a.id,
  code: (a.code || a.accountNo || '').trim(),
  type_digit:
    a.typeDigit ||
    (a.accountType === 'Asset'
      ? 1
      : a.accountType === 'Liability'
      ? 2
      : a.accountType === 'Equity'
      ? 3
      : a.accountType === 'Revenue'
      ? 4
      : 5),
  class_digit: a.classDigit || 1,
  group_code: a.groupCode || '',
  sub_code: a.subCode || '',
  name: a.name,
  account_type: a.accountType,
  classification: a.classification || '',
  group_name: a.groupName || '',
  normal_balance: a.normalBalance || (a.openingBalanceType === 'CR' ? 'Credit' : 'Debit'),
  opening_balance: Number(a.openingBalance) || 0,
  current_balance:
    a.currentBalance !== undefined ? Number(a.currentBalance) || 0 : Number(a.openingBalance) || 0,
  description: a.description || null,
  is_active: a.isActive ?? true,
});

const mapChartAccountToRow = (a: ChartAccount) => ({
  ...mapChartAccountCoreToRow(a),
  account_no: (a.accountNo || a.code || '').trim(),
  level: a.level ?? null,
  trans_type: a.transType ?? null,
  parent_account_no: a.parentAccountNo ?? null,
  opening_balance_type:
    a.openingBalanceType || (a.normalBalance === 'Credit' ? 'CR' : 'DR'),
  monthly: a.monthly ?? null,
});

const mapVoucherFromRow = (r: any): VoucherDocument => ({
  id: r.id,
  voucherNo: r.voucher_no,
  voucherType: r.voucher_type,
  typeCode: (r.type_code as any) || undefined,
  date: r.date,
  referenceNo: r.reference_no || '',
  narration: r.narration || '',
  lines: parseJsonArray(r.lines),
  totalDebit: Number(r.total_debit || 0),
  totalCredit: Number(r.total_credit || 0),
  status: r.status,
  preparedBy: r.prepared_by || undefined,
  approvedBy: r.approved_by || undefined,
  approvedAt: r.approved_at || undefined,
  postedBy: r.posted_by || undefined,
  postedAt: r.posted_at || undefined,
  reversedBy: r.reversed_by || undefined,
  reversedAt: r.reversed_at || undefined,
  reversalReason: r.reversal_reason || undefined,
  reversalVoucherNo: r.reversal_voucher_no || undefined,
  cancelledBy: r.cancelled_by || undefined,
  cancelledAt: r.cancelled_at || undefined,
  cancelReason: r.cancel_reason || undefined,
});

const mapVoucherToRow = (v: VoucherDocument) => ({
  id: v.id,
  voucher_no: v.voucherNo,
  voucher_type: v.voucherType,
  type_code: v.typeCode || null,
  date: v.date,
  reference_no: v.referenceNo || null,
  narration: v.narration || null,
  lines: v.lines || [],
  total_debit: v.totalDebit || 0,
  total_credit: v.totalCredit || 0,
  status: v.status,
  prepared_by: v.preparedBy || null,
  approved_by: v.approvedBy || null,
  approved_at: v.approvedAt || null,
  posted_by: v.postedBy || null,
  posted_at: v.postedAt || null,
  reversed_by: v.reversedBy || null,
  reversed_at: v.reversedAt || null,
  reversal_reason: v.reversalReason || null,
  reversal_voucher_no: v.reversalVoucherNo || null,
  cancelled_by: v.cancelledBy || null,
  cancelled_at: v.cancelledAt || null,
  cancel_reason: v.cancelReason || null,
});

const mapCashBookEntryFromRow = (r: any): CashBookEntry => ({
  id: r.id,
  srNo: Number(r.sr_no || 1),
  date: r.date,
  description: r.description,
  credit: Number(r.credit || 0),
  debit: Number(r.debit || 0),
  balance: Number(r.balance || 0),
});

const mapCashBookEntryToRow = (e: CashBookEntry) => ({
  id: e.id,
  sr_no: e.srNo || 1,
  date: e.date,
  description: e.description,
  credit: e.credit || 0,
  debit: e.debit || 0,
  balance: e.balance || 0,
});

const mapCreditBookEntryFromRow = (r: any): CreditBookEntry => ({
  id: r.id,
  srNo: Number(r.sr_no || 1),
  date: r.date,
  name: r.name,
  purpose: r.purpose || '',
  amount: Number(r.amount || 0),
});

const mapCreditBookEntryToRow = (e: CreditBookEntry) => ({
  id: e.id,
  sr_no: e.srNo || 1,
  date: e.date,
  name: e.name,
  purpose: e.purpose || '',
  amount: e.amount || 0,
});

const mapBankFromRow = (r: any): BankRecord => ({
  id: r.id,
  srNo: Number(r.sr_no || 1),
  bankName: r.bank_name,
  branchName: r.branch_name || '',
  branchCode: r.branch_code || '',
  address: r.address || '',
});

const mapBankToRow = (b: BankRecord) => ({
  id: b.id,
  sr_no: b.srNo || 1,
  bank_name: b.bankName,
  branch_name: b.branchName || '',
  branch_code: b.branchCode || '',
  address: b.address || '',
});

const mapBankAccountFromRow = (r: any): BankAccountRecord => ({
  id: r.id,
  srNo: Number(r.sr_no || 1),
  bankId: r.bank_id,
  bankName: r.bank_name,
  accountNumber: r.account_number,
  accountTitle: r.account_title,
  openingBalance: Number(r.opening_balance || 0),
  openingBalanceDate: r.opening_balance_date || '',
  transactions: parseJsonArray(r.transactions),
});

const mapBankAccountToRow = (a: BankAccountRecord) => ({
  id: a.id,
  sr_no: a.srNo || 1,
  bank_id: a.bankId,
  bank_name: a.bankName,
  account_number: a.accountNumber,
  account_title: a.accountTitle,
  opening_balance: a.openingBalance || 0,
  opening_balance_date: a.openingBalanceDate || '',
  transactions: a.transactions || [],
});

const mapPosSaleFromRow = (r: any): PosCoalSellEntry => ({
  id: r.id,
  date: r.document_date || r.date || '',
  srNo: Number(r.sr_no || 1),
  partnerId: r.partner_id || '',
  partnerName: r.partner_name || '',
  buyerId: r.buyer_id || '',
  buyerNTN: r.buyer_ntn || '',
  buyerCNIC: r.buyer_cnic || '',
  buyerName: r.buyer_name || 'Buyer',
  buyerType: (r.buyer_type || 'Registered') as any,
  saleOrganization: r.sale_organization || 'Balochistan',
  documentType: r.document_type || 'Sales Tax Invoice',
  documentNumber: r.document_number || '',
  documentDate: r.document_date,
  quantity: Number(r.quantity || 0),
  valueExcludingTax: Number(r.value_excluding_tax || 0),
  salesTaxFed: Number(r.sales_tax_fed || 0),
  furtherTax: Number(r.further_tax || 0),
  totalTax: Number(r.total_tax || 0),
  totalValue: Number(r.total_value || 0),
});

const mapPosSaleToRow = (s: PosCoalSellEntry) => ({
  id: s.id,
  sr_no: s.srNo || 1,
  partner_id: s.partnerId || '',
  partner_name: s.partnerName || '',
  buyer_id: s.buyerId || '',
  buyer_ntn: s.buyerNTN || '',
  buyer_cnic: s.buyerCNIC || '',
  buyer_name: s.buyerName,
  buyer_type: s.buyerType || 'Registered',
  sale_organization: s.saleOrganization || '',
  document_type: s.documentType || '',
  document_number: s.documentNumber || '',
  document_date: s.documentDate,
  quantity: s.quantity || 0,
  value_excluding_tax: s.valueExcludingTax || 0,
  sales_tax_fed: s.salesTaxFed || 0,
  further_tax: s.furtherTax || 0,
  total_tax: s.totalTax || 0,
  total_value: s.totalValue || 0,
});

const mapCoalRecordFromRow = (r: any): CoalSellRecord => ({
  id: r.id,
  date: r.date,
  partnerId: r.partner_id || '',
  partnerName: r.partner_name || '',
  buyerName: 'Direct Dispatch',
  buyerType: 'Registered' as any,
  saleOrganization: 'Balochistan',
  documentType: 'Sales Tax Invoice',
  documentNumber: `DISP-${r.id}`,
  quantity: Number(r.quantity_tons || 0),
  quantityTons: Number(r.quantity_tons || 0),
  valueExcludingTax: 0,
  salesTaxFed: 0,
  furtherTax: 0,
  totalTax: 0,
  totalValue: 0,
  vehicleNo: r.vehicle_no || '',
  remarks: r.remarks || '',
});

const mapCoalRecordToRow = (c: CoalSellRecord) => ({
  id: c.id,
  date: c.date,
  partner_id: c.partnerId || '',
  partner_name: c.partnerName,
  quantity_tons: c.quantityTons ?? c.quantity ?? 0,
  vehicle_no: c.vehicleNo || '',
  remarks: c.remarks || '',
});

const mapCoalProductionFromRow = (r: any): CoalStockRecord => ({
  id: r.id,
  srNo: r.sr_no ? Number(r.sr_no) : undefined,
  date: r.date,
  partnerId: r.partner_id || '',
  partnerName: r.partner_name,
  quantity: Number(r.quantity_tons ?? r.quantity ?? 0),
  quantityTons: Number(r.quantity_tons ?? r.quantity ?? 0),
  pitheadLocation: r.pithead_location || '',
  vehicleNo: r.vehicle_no || '',
  remarks: r.remarks || '',
  createdAt: r.created_at || undefined,
});

const mapCoalProductionToRow = (c: CoalProductionRecord) => ({
  id: c.id,
  sr_no: c.srNo || 1,
  date: c.date,
  partner_id: c.partnerId || '',
  partner_name: c.partnerName,
  quantity_tons: Number(c.quantity ?? c.quantityTons ?? 0),
  pithead_location: c.pitheadLocation || '',
  vehicleNo: c.vehicleNo || '',
  remarks: c.remarks || '',
});

const mapBuyerFromRow = (r: any): BuyerRecord => ({
  id: r.id,
  buyerNTN: r.buyer_ntn || '',
  buyerCNIC: r.buyer_cnic || '',
  buyerName: r.buyer_name,
  buyerType: r.buyer_type as any,
  phone: r.phone || '',
  city: r.city || '',
});

const mapBuyerToRow = (b: BuyerRecord) => ({
  id: b.id,
  buyer_ntn: b.buyerNTN || '',
  buyer_cnic: b.buyerCNIC || '',
  buyer_name: b.buyerName,
  buyer_type: b.buyerType,
  phone: b.phone || '',
  city: b.city || '',
});

const mapPartnerFromRow = (r: any): PartnerRecord => ({
  id: r.id,
  name: r.name,
  code: r.code,
  isActive: r.is_active ?? true,
  showInReport: r.show_in_report ?? true,
  notes: r.notes || '',
});

const mapPartnerToRow = (p: PartnerRecord) => ({
  id: p.id,
  name: p.name,
  code: p.code || p.name.substring(0, 4).toUpperCase() || 'PART',
  is_active: p.isActive ?? true,
  show_in_report: p.showInReport ?? true,
  notes: p.notes || '',
});

const mapStockItemFromRow = (r: any): StockItem => ({
  id: r.id,
  itemCode: r.item_code,
  itemName: r.item_name,
  category: r.category || r.category_name || '',
  categoryName: r.category_name || r.category || '',
  categoryId: r.category_id || undefined,
  unit: r.unit || r.unit_symbol || r.unit_type_name || 'Units',
  unitSymbol: r.unit_symbol || r.unit || 'Units',
  unitTypeName: r.unit_type_name || r.unit || 'Units',
  unitTypeId: r.unit_type_id || undefined,
  openingStock: Number(r.opening_stock ?? 0),
  reorderLevel: Number(r.reorder_level ?? 0),
  remarks: r.remarks || '',
  date: r.date || undefined,
  createdAt: r.created_at || undefined,
});

const mapStockItemToRow = (i: any) => ({
  id: i.id,
  item_code: i.itemCode,
  item_name: i.itemName,
  category: i.categoryName || i.category || '',
  unit: i.unit || i.unitSymbol || i.unitTypeName || 'Units',
  category_id: i.categoryId || null,
  category_name: i.categoryName || i.category || null,
  unit_type_id: i.unitTypeId || null,
  unit_type_name: i.unitTypeName || null,
  unit_symbol: i.unitSymbol || i.unit || null,
  opening_stock: Number(i.openingStock || 0),
  reorder_level: Number(i.reorderLevel || 0),
  remarks: i.remarks || null,
  date: i.date || null,
});

const mapStockEntryFromRow = (r: any): StockEntry => ({
  id: r.id,
  srNo: Number(r.sr_no || 1),
  date: r.date,
  itemId: r.item_id,
  itemName: r.item_name,
  itemCode: r.item_code,
  stockQty: Number(r.stock_qty || 0),
  stockQuantity: Number(r.stock_qty || 0),
  purchaseQty: Number(r.purchase_qty || 0),
  purchase: Number(r.purchase_qty || 0),
  mineQty: Number(r.mine_qty || 0),
  vehiclesQty: Number(r.vehicles_qty || 0),
  companyName: r.company_name || '',
  balance: Number(r.balance || 0),
  vendorName: r.vendor_name || '',
  invoiceNo: r.invoice_no || '',
  remarks: r.remarks || '',
  unit: r.unit || '',
  createdAt: r.created_at || undefined,
});

const mapStockEntryToRow = (s: any) => ({
  id: s.id,
  sr_no: s.srNo || 1,
  date: s.date,
  item_id: s.itemId,
  item_name: s.itemName,
  item_code: s.itemCode,
  stock_qty: s.stockQuantity !== undefined ? s.stockQuantity : (s.stockQty !== undefined ? s.stockQty : 0),
  purchase_qty: s.purchase !== undefined ? s.purchase : (s.purchaseQty !== undefined ? s.purchaseQty : 0),
  mine_qty: s.mineQty || 0,
  vehicles_qty: s.vehiclesQty || 0,
  company_name: s.companyName || '',
  balance: s.balance || 0,
  vendor_name: s.vendorName || null,
  invoice_no: s.invoiceNo || null,
  remarks: s.remarks || null,
  unit: s.unit || null,
});

const mapVehicleFromRow = (r: any): VehicleRecord => ({
  id: r.id,
  vehicleNo: r.vehicle_no,
  driverName: r.driver_name,
  vehicleType: r.vehicle_type,
  status: r.status as any,
  notes: r.notes || '',
  createdAt: r.created_at || '',
});

const mapVehicleToRow = (v: VehicleRecord) => ({
  id: v.id,
  vehicle_no: v.vehicleNo,
  driver_name: v.driverName,
  vehicle_type: v.vehicleType,
  status: v.status,
  notes: v.notes || null,
  created_at: v.createdAt || new Date().toISOString(),
});

const mapVehicleConsumptionFromRow = (r: any): VehicleConsumptionRecord => ({
  id: r.id,
  srNo: Number(r.sr_no || 1),
  vehicleId: r.vehicle_id || r.target_id || '',
  vehicleNo: r.vehicle_no || r.target_name || '',
  date: r.date,
  diesel: Number(r.diesel || 0),
  mOil: Number(r.m_oil || 0),
  dOil: Number(r.d_oil || 0),
  oFltr: Number(r.o_fltr || 0),
  dFltr: Number(r.d_fltr || 0),
  kOil: Number(r.k_oil || 0),
  cOil: Number(r.c_oil || 0),
  bOil: Number(r.b_oil || 0),
  remarks: r.remarks || '',
});

const mapVehicleConsumptionToRow = (c: any) => ({
  id: c.id,
  sr_no: c.srNo || 1,
  vehicle_id: c.vehicleId || c.targetId || 'veh-general',
  vehicle_no: c.vehicleNo || c.targetName || 'General',
  date: c.date,
  diesel: c.diesel || (c.quantity && c.itemName?.toLowerCase().includes('diesel') ? c.quantity : 0),
  m_oil: c.mOil || (c.quantity && c.itemName?.toLowerCase().includes('engine') ? c.quantity : 0),
  d_oil: c.dOil || 0,
  o_fltr: c.oFltr || 0,
  d_fltr: c.dFltr || 0,
  k_oil: c.kOil || 0,
  c_oil: c.cOil || 0,
  b_oil: c.bOil || 0,
  remarks: c.remarks || '',
});

const mapMineFromRow = (r: any): MineRecord => ({
  id: r.id,
  name: r.name,
  location: r.location || '',
  incharge: r.incharge || '',
  status: (r.status === 'Inactive' ? 'Inactive' : 'Active') as 'Active' | 'Inactive',
  notes: r.notes || '',
  createdAt: r.created_at || '',
});

const mapMineToRow = (m: MineRecord) => ({
  id: m.id,
  name: m.name,
  location: m.location || null,
  incharge: m.incharge || null,
  status: m.status || 'Active',
  notes: m.notes || null,
  created_at: m.createdAt || new Date().toISOString(),
});

const mapItemCategoryFromRow = (r: any): ItemCategory => ({
  id: r.id,
  name: r.name,
  description: r.description || '',
  createdAt: r.created_at || '',
});

const mapItemCategoryToRow = (c: ItemCategory) => ({
  id: c.id,
  name: c.name,
  description: c.description || null,
  created_at: c.createdAt || new Date().toISOString(),
});

const mapItemUnitTypeFromRow = (r: any): ItemUnitType => ({
  id: r.id,
  name: r.name,
  symbol: r.symbol,
  description: r.description || '',
  createdAt: r.created_at || '',
});

const mapItemUnitTypeToRow = (u: ItemUnitType) => ({
  id: u.id,
  name: u.name,
  symbol: u.symbol,
  description: u.description || null,
  created_at: u.createdAt || new Date().toISOString(),
});

const mapMachineryTypeFromRow = (r: any): MachineryType => ({
  id: r.id,
  name: r.name,
  description: r.description || '',
  createdAt: r.created_at || '',
});

const mapMachineryTypeToRow = (mt: MachineryType) => ({
  id: mt.id,
  name: mt.name,
  description: mt.description || null,
  created_at: mt.createdAt || new Date().toISOString(),
});

const mapItemConsumptionFromRow = (r: any): ItemConsumptionRecord => ({
  id: r.id,
  srNo: Number(r.sr_no || 1),
  date: r.date,
  consumptionType: (r.consumption_type === 'mine' ? 'mine' : 'vehicle') as ConsumptionTargetType,
  targetId: r.target_id || r.vehicle_id || '',
  targetName: r.target_name || r.vehicle_no || '',
  itemId: r.item_id || '',
  itemCode: r.item_code || '',
  itemName: r.item_name || '',
  unit: r.unit || 'Units',
  quantity: Number(r.quantity ?? r.diesel ?? r.m_oil ?? 0),
  operatorName: r.operator_name || r.driver_name || '',
  meterReading: r.meter_reading || '',
  remarks: r.remarks || '',
  createdAt: r.created_at || '',
});

const mapItemConsumptionToRow = (c: ItemConsumptionRecord) => ({
  id: c.id,
  sr_no: c.srNo || 1,
  date: c.date,
  consumption_type: c.consumptionType || 'vehicle',
  target_id: c.targetId || (c as any).vehicleId || 'target-general',
  target_name: c.targetName || (c as any).vehicleNo || 'General',
  item_id: c.itemId || '',
  item_code: c.itemCode || '',
  item_name: c.itemName || '',
  unit: c.unit || 'Units',
  quantity: Number(c.quantity || 0),
  operator_name: c.operatorName || '',
  meter_reading: c.meterReading || null,
  remarks: c.remarks || null,
  created_at: c.createdAt || new Date().toISOString(),
});

const mapCompanySettingsFromRow = (r: any): CompanySettings => ({
  id: r.id || 'cs_default',
  companyName: r.company_name,
  address: r.address,
  ntnNumber: r.ntn_number || '',
  contactNumber: r.contact_number || '',
  email: r.email || '',
} as any);

const mapCompanySettingsToRow = (s: CompanySettings) => ({
  id: (s as any).id || 'cs_default',
  company_name: s.companyName,
  address: s.address,
  ntn_number: s.ntnNumber || '',
  contact_number: s.contactNumber || '',
  email: s.email || '',
});

// ==========================================
// CALCULATION HELPERS FOR SUMMARIES
// ==========================================

export function computeVehicleConsumptionSummary(
  vehiclesList: VehicleRecord[],
  consumptionsList: VehicleConsumptionRecord[]
): VehicleConsumptionSummary[] {
  const summaryMap = new Map<string, VehicleConsumptionSummary>();

  vehiclesList.forEach((v) => {
    summaryMap.set(v.id, {
      vehicleId: v.id,
      vehicleNo: v.vehicleNo,
      vehicleType: v.vehicleType,
      driverName: v.driverName,
      status: v.status || 'Active',
      totalDiesel: 0,
      totalMOil: 0,
      totalDOil: 0,
      totalOFltr: 0,
      totalDFltr: 0,
      totalKOil: 0,
      totalCOil: 0,
      totalBOil: 0,
      logsCount: 0,
      lastDate: '',
    });
  });

  consumptionsList.forEach((c) => {
    const vNo = (c.vehicleNo || '').trim().toUpperCase();
    let target = summaryMap.get(c.vehicleId || '');
    if (!target) {
      for (const item of summaryMap.values()) {
        if ((item.vehicleNo || '').trim().toUpperCase() === vNo) {
          target = item;
          break;
        }
      }
    }

    if (!target) {
      target = {
        vehicleId: c.vehicleId || `v-${c.vehicleNo || 'veh'}`,
        vehicleNo: c.vehicleNo || 'Unknown',
        vehicleType: 'Fleet Vehicle',
        driverName: 'Designated Driver',
        status: 'Active',
        totalDiesel: 0,
        totalMOil: 0,
        totalDOil: 0,
        totalOFltr: 0,
        totalDFltr: 0,
        totalKOil: 0,
        totalCOil: 0,
        totalBOil: 0,
        logsCount: 0,
        lastDate: '',
      };
      summaryMap.set(target.vehicleId || `v-${c.vehicleNo || 'veh'}`, target);
    }

    target.totalDiesel = (target.totalDiesel || 0) + Number(c.diesel || 0);
    target.totalMOil = (target.totalMOil || 0) + Number(c.mOil || 0);
    target.totalDOil = (target.totalDOil || 0) + Number(c.dOil || 0);
    target.totalOFltr = (target.totalOFltr || 0) + Number(c.oFltr || 0);
    target.totalDFltr = (target.totalDFltr || 0) + Number(c.dFltr || 0);
    target.totalKOil = (target.totalKOil || 0) + Number(c.kOil || 0);
    target.totalCOil = (target.totalCOil || 0) + Number(c.cOil || 0);
    target.totalBOil = (target.totalBOil || 0) + Number(c.bOil || 0);
    target.logsCount = (target.logsCount || 0) + 1;
    if (!target.lastDate || (c.date && c.date > target.lastDate)) {
      target.lastDate = c.date;
    }
  });

  const result = Array.from(summaryMap.values());
  result.sort((a, b) => (b.totalDiesel || 0) - (a.totalDiesel || 0));
  return result;
}

export function computeItemWiseStockSummary(
  itemsList: StockItem[],
  entriesList: StockEntry[]
): ItemWiseStockSummary[] {
  const summaryMap = new Map<string, ItemWiseStockSummary>();

  itemsList.forEach((it) => {
    summaryMap.set(it.id, {
      itemId: it.id,
      itemCode: it.itemCode,
      itemName: it.itemName,
      category: it.category || 'General',
      unit: it.unit,
      totalOpeningStock: 0,
      totalPurchaseQty: 0,
      totalMineQty: 0,
      totalVehiclesQty: 0,
      currentBalance: 0,
      entriesCount: 0,
      lastDate: '',
      stockStatus: 'In Stock',
    });
  });

  entriesList.forEach((entry) => {
    let target = summaryMap.get(entry.itemId);
    if (!target) {
      for (const item of summaryMap.values()) {
        if (item.itemCode.trim().toUpperCase() === entry.itemCode.trim().toUpperCase()) {
          target = item;
          break;
        }
      }
    }

    if (!target) {
      target = {
        itemId: entry.itemId || `it-${entry.itemCode}`,
        itemCode: entry.itemCode,
        itemName: entry.itemName || entry.itemCode,
        category: 'General Supplies',
        unit: 'Units',
        totalOpeningStock: 0,
        totalPurchaseQty: 0,
        totalMineQty: 0,
        totalVehiclesQty: 0,
        currentBalance: 0,
        entriesCount: 0,
        lastDate: '',
        stockStatus: 'In Stock',
      };
      summaryMap.set(target.itemId || entry.itemId || 'it', target);
    }

    if (target) {
      target.totalOpeningStock = (target.totalOpeningStock || 0) + Number(entry.stockQty || 0);
      target.totalPurchaseQty = (target.totalPurchaseQty || 0) + Number(entry.purchaseQty || 0);
      target.totalMineQty = (target.totalMineQty || 0) + Number(entry.mineQty || 0);
      target.totalVehiclesQty = (target.totalVehiclesQty || 0) + Number(entry.vehiclesQty || 0);
      target.entriesCount = (target.entriesCount || 0) + 1;
      if (!target.lastDate || entry.date > target.lastDate) {
        target.lastDate = entry.date;
      }
    }
  });

  const result = Array.from(summaryMap.values()).map((s) => {
    const net = ((s.totalOpeningStock || 0) + (s.totalPurchaseQty || 0)) - ((s.totalMineQty || 0) + (s.totalVehiclesQty || 0));
    let status: 'In Stock' | 'Low Stock' | 'Critical' = 'In Stock';
    if (net <= 5) {
      status = 'Critical';
    } else if (net <= 25) {
      status = 'Low Stock';
    }
    return {
      ...s,
      currentBalance: Math.round(net),
      stockStatus: status,
    };
  });

  const priority = { Critical: 0, 'Low Stock': 1, 'In Stock': 2 };
  result.sort((a, b) => priority[a.stockStatus] - priority[b.stockStatus] || a.currentBalance - b.currentBalance);
  return result;
}

// ==========================================
// 1. BOOTSTRAP (INITIAL APP LOAD & SYNC)
// ==========================================
export async function fetchBootstrapData(): Promise<BootstrapData | null> {
  const loadFallback = <T>(key: string, initial: T): T => {
    try {
      const raw = localStorage.getItem(`ahcm_erp_${key}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as unknown as T;
        if (parsed && typeof parsed === 'object') return parsed as unknown as T;
      }
    } catch {}
    return initial;
  };

  try {
    // If Supabase client SDK is not configured in browser, bootstrap from Express PostgreSQL API first
    if (!isSupabaseConfigured()) {
      try {
        const res = await fetch('/api/bootstrap');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data && typeof data === 'object' && Array.isArray(data.accounts)) {
            return {
              users: data.users?.length ? data.users : loadFallback('users', initialUsers),
              demands: data.demands ?? loadFallback('demands', initialDemands),
              purchases: data.purchases ?? loadFallback('purchases', initialPurchases),
              accounts: data.accounts.length ? data.accounts : loadFallback('accounts', initialChartOfAccounts),
              vouchers: data.vouchers ?? loadFallback('vouchers', initialVouchers),
              cashBookEntries: data.cashBookEntries ?? loadFallback('cash_book', initialCashBookEntries),
              creditBookEntries: data.creditBookEntries ?? loadFallback('credit_book', initialCreditBookEntries),
              banks: data.banks ?? loadFallback('banks', initialBanks),
              bankAccounts: data.bankAccounts ?? loadFallback('bank_accounts', initialBankAccounts),
              companySettings: data.companySettings ?? loadFallback('company_settings', initialCompanySettings),
              buyers: data.buyers ?? loadFallback('buyers', initialBuyers),
              partners: data.partners ?? loadFallback('partners', initialPartners),
              posEntries: data.posEntries ?? loadFallback('pos_entries', initialPosEntries),
              coalSellRecords: data.coalSellRecords ?? loadFallback('coal_records', initialCoalSellRecords),
              coalProductionRecords: data.coalProductionRecords ?? loadFallback('coal_production_records', initialCoalProductionRecords),
              stockItems: data.stockItems ?? loadFallback('stock_items', initialStockItems),
              stockEntries: data.stockEntries ?? loadFallback('stock_entries', initialStockEntries),
              vehicles: data.vehicles ?? loadFallback('vehicles', initialVehicles),
              vehicleConsumptions: data.vehicleConsumptions ?? loadFallback('consumptions', initialVehicleConsumptions),
              mines: data.mines ?? loadFallback('item_mines', initialMines),
              itemCategories: data.itemCategories ?? loadFallback('item_categories', initialItemCategories),
              itemUnits: data.itemUnits ?? loadFallback('item_units', initialItemUnits),
              machineryTypes: data.machineryTypes !== undefined ? data.machineryTypes : loadFallback('machinery_types', initialMachineryTypes),
              itemConsumptions: data.itemConsumptions ?? loadFallback('consumptions', initialItemConsumptions),
              vehicleConsumptionSummary:
                data.vehicleConsumptionSummary ??
                computeVehicleConsumptionSummary(data.vehicles || initialVehicles, data.vehicleConsumptions || initialVehicleConsumptions),
              itemWiseStockSummary:
                data.itemWiseStockSummary ??
                computeItemWiseStockSummary(data.stockItems || initialStockItems, data.stockEntries || initialStockEntries),
            };
          }
        }
      } catch (apiErr) {
        console.warn('Express /api/bootstrap unavailable, falling back to local baseline:', apiErr);
      }

      console.log(
        '%c[SUPABASE PREVIEW] %cSupabase Anon Key is not yet configured for this preview environment. Loaded local baseline data.',
        'color: #0284c7; font-weight: bold;',
        'color: #64748b;'
      );

      const vehicleConsumptionSummary = computeVehicleConsumptionSummary(initialVehicles, initialVehicleConsumptions);
      const itemWiseStockSummary = computeItemWiseStockSummary(initialStockItems, initialStockEntries);

      return {
        users: loadFallback('users', initialUsers),
        demands: loadFallback('demands', initialDemands),
        purchases: loadFallback('purchases', initialPurchases),
        accounts: loadFallback('accounts', initialChartOfAccounts),
        vouchers: loadFallback('vouchers', initialVouchers),
        cashBookEntries: loadFallback('cash_book', initialCashBookEntries),
        creditBookEntries: loadFallback('credit_book', initialCreditBookEntries),
        banks: loadFallback('banks', initialBanks),
        bankAccounts: loadFallback('bank_accounts', initialBankAccounts),
        companySettings: loadFallback('company_settings', initialCompanySettings),
        buyers: loadFallback('buyers', initialBuyers),
        partners: loadFallback('partners', initialPartners),
        posEntries: loadFallback('pos_entries', initialPosEntries),
        coalSellRecords: loadFallback('coal_records', initialCoalSellRecords),
        coalProductionRecords: loadFallback('coal_production_records', initialCoalProductionRecords),
        stockItems: loadFallback('stock_items', initialStockItems),
        stockEntries: loadFallback('stock_entries', initialStockEntries),
        vehicles: loadFallback('vehicles', initialVehicles),
        vehicleConsumptions: loadFallback('consumptions', initialVehicleConsumptions),
        mines: loadFallback('item_mines', initialMines),
        itemCategories: loadFallback('item_categories', initialItemCategories),
        itemUnits: loadFallback('item_units', initialItemUnits),
        machineryTypes: loadFallback('machinery_types', initialMachineryTypes),
        itemConsumptions: loadFallback('consumptions', initialItemConsumptions),
        vehicleConsumptionSummary,
        itemWiseStockSummary,
      };
    }

    const [
      usersRes,
      demandsRes,
      purchasesRes,
      accountsRes,
      vouchersRes,
      cashBookRes,
      creditBookRes,
      banksRes,
      bankAccountsRes,
      settingsRes,
      buyersRes,
      partnersRes,
      posRes,
      coalRes,
      coalProductionRes,
      stockItemsRes,
      stockEntriesRes,
      vehiclesRes,
      consumptionsRes,
      minesRes,
      categoriesRes,
      unitsRes,
      machineryTypesRes,
      itemConsumptionsRes,
    ] = await Promise.all([
      diagnosticSupabaseOperation<any[]>('fetchBootstrapUsers', SUPABASE_TABLES.APP_USERS, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.APP_USERS).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapDemands', SUPABASE_TABLES.DEMANDS, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.DEMANDS).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapPurchases', SUPABASE_TABLES.PURCHASES, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.PURCHASES).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapAccounts', SUPABASE_TABLES.CHART_ACCOUNTS, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.CHART_ACCOUNTS).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapVouchers', SUPABASE_TABLES.VOUCHERS, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.VOUCHERS).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapCashBook', SUPABASE_TABLES.CASH_BOOK_ENTRIES, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.CASH_BOOK_ENTRIES).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapCreditBook', SUPABASE_TABLES.CREDIT_BOOK_ENTRIES, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.CREDIT_BOOK_ENTRIES).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapBanks', SUPABASE_TABLES.BANKS, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.BANKS).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapBankAccounts', SUPABASE_TABLES.BANK_ACCOUNTS, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.BANK_ACCOUNTS).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapSettings', SUPABASE_TABLES.COMPANY_SETTINGS, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.COMPANY_SETTINGS).select('*').limit(1)
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapBuyers', SUPABASE_TABLES.BUYERS, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.BUYERS).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapPartners', SUPABASE_TABLES.PARTNERS, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.PARTNERS).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapPos', SUPABASE_TABLES.POS_COAL_SALES, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.POS_COAL_SALES).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapCoal', SUPABASE_TABLES.COAL_SELL_RECORDS, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.COAL_SELL_RECORDS).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapCoalProduction', SUPABASE_TABLES.COAL_PRODUCTION_RECORDS, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.COAL_PRODUCTION_RECORDS).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapStockItems', SUPABASE_TABLES.STOCK_ITEMS, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.STOCK_ITEMS).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapStockEntries', SUPABASE_TABLES.STOCK_ENTRIES, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.STOCK_ENTRIES).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapVehicles', SUPABASE_TABLES.VEHICLES, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.VEHICLES).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapConsumptions', SUPABASE_TABLES.VEHICLE_CONSUMPTIONS, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.VEHICLE_CONSUMPTIONS).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapMines', SUPABASE_TABLES.MINES, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.MINES).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapCategories', SUPABASE_TABLES.ITEM_CATEGORIES, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.ITEM_CATEGORIES).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapUnits', SUPABASE_TABLES.ITEM_UNITS, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.ITEM_UNITS).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapMachineryTypes', SUPABASE_TABLES.MACHINERY_TYPES, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.MACHINERY_TYPES).select('*')
      ),
      diagnosticSupabaseOperation<any[]>('fetchBootstrapItemConsumptions', SUPABASE_TABLES.ITEM_CONSUMPTIONS, 'SELECT', {}, () =>
        supabase.from(SUPABASE_TABLES.ITEM_CONSUMPTIONS).select('*')
      ),
    ]);

    const users = usersRes && usersRes.length > 0 ? usersRes.map(mapUserFromRow) : loadFallback('users', initialUsers);
    const demands = demandsRes ? demandsRes.map(mapDemandFromRow) : loadFallback('demands', initialDemands);
    const purchases = purchasesRes ? purchasesRes.map(mapPurchaseFromRow) : loadFallback('purchases', initialPurchases);
    const accounts = accountsRes && accountsRes.length > 0 ? accountsRes.map(mapChartAccountFromRow) : loadFallback('accounts', initialChartOfAccounts);
    const vouchers = vouchersRes ? vouchersRes.map(mapVoucherFromRow) : loadFallback('vouchers', initialVouchers);
    const cashBookEntries = cashBookRes ? cashBookRes.map(mapCashBookEntryFromRow) : loadFallback('cash_book', initialCashBookEntries);
    const creditBookEntries = creditBookRes ? creditBookRes.map(mapCreditBookEntryFromRow) : loadFallback('credit_book', initialCreditBookEntries);
    const banks = banksRes ? banksRes.map(mapBankFromRow) : loadFallback('banks', initialBanks);
    const bankAccounts = bankAccountsRes ? bankAccountsRes.map(mapBankAccountFromRow) : loadFallback('bank_accounts', initialBankAccounts);
    const companySettings = settingsRes && settingsRes.length > 0 ? mapCompanySettingsFromRow(settingsRes[0]) : loadFallback('company_settings', initialCompanySettings);
    const buyers = buyersRes ? buyersRes.map(mapBuyerFromRow) : loadFallback('buyers', initialBuyers);
    const partners = partnersRes ? partnersRes.map(mapPartnerFromRow) : loadFallback('partners', initialPartners);
    const posEntries = posRes ? posRes.map(mapPosSaleFromRow) : loadFallback('pos_entries', initialPosEntries);
    const coalSellRecords = coalRes ? coalRes.map(mapCoalRecordFromRow) : loadFallback('coal_records', initialCoalSellRecords);
    const coalProductionRecords = coalProductionRes ? coalProductionRes.map(mapCoalProductionFromRow) : loadFallback('coal_production_records', initialCoalProductionRecords);
    const stockItems = stockItemsRes ? stockItemsRes.map(mapStockItemFromRow) : loadFallback('stock_items', initialStockItems);
    const stockEntries = stockEntriesRes ? stockEntriesRes.map(mapStockEntryFromRow) : loadFallback('stock_entries', initialStockEntries);
    const vehicles = vehiclesRes ? vehiclesRes.map(mapVehicleFromRow) : loadFallback('vehicles', initialVehicles);
    const vehicleConsumptions = consumptionsRes ? consumptionsRes.map(mapVehicleConsumptionFromRow) : loadFallback('consumptions', initialVehicleConsumptions);
    const mines = minesRes ? minesRes.map(mapMineFromRow) : loadFallback('item_mines', initialMines);
    const itemCategories = categoriesRes ? categoriesRes.map(mapItemCategoryFromRow) : loadFallback('item_categories', initialItemCategories);
    const itemUnits = unitsRes ? unitsRes.map(mapItemUnitTypeFromRow) : loadFallback('item_units', initialItemUnits);
    const machineryTypes = machineryTypesRes ? machineryTypesRes.map(mapMachineryTypeFromRow) : loadFallback('machinery_types', initialMachineryTypes);

    const itemConsumptions: ItemConsumptionRecord[] = itemConsumptionsRes && itemConsumptionsRes.length > 0
      ? itemConsumptionsRes.map(mapItemConsumptionFromRow)
      : consumptionsRes && consumptionsRes.length > 0
      ? consumptionsRes.map((r: any) => ({
          id: r.id,
          srNo: Number(r.sr_no || 1),
          date: r.date || '01-01-2026',
          consumptionType: 'vehicle' as ConsumptionTargetType,
          targetId: r.vehicle_id || 'veh-1',
          targetName: r.vehicle_no || 'Vehicle',
          itemId: 'item-1',
          itemCode: 'ITM-DSL-01',
          itemName: 'High Speed Diesel (HSD)',
          unit: 'L',
          quantity: Number(r.diesel || r.m_oil || 0),
          operatorName: '',
          remarks: r.remarks || '',
        }))
      : loadFallback('consumptions', initialItemConsumptions);

    const vehicleConsumptionSummary = computeVehicleConsumptionSummary(vehicles, vehicleConsumptions);
    const itemWiseStockSummary = computeItemWiseStockSummary(stockItems, stockEntries);

    return {
      users,
      demands,
      purchases,
      accounts,
      vouchers,
      cashBookEntries,
      creditBookEntries,
      banks,
      bankAccounts,
      companySettings,
      buyers,
      partners,
      posEntries,
      coalSellRecords,
      coalProductionRecords,
      stockItems,
      stockEntries,
      vehicles,
      vehicleConsumptions,
      mines,
      itemCategories,
      itemUnits,
      machineryTypes,
      itemConsumptions,
      vehicleConsumptionSummary,
      itemWiseStockSummary,
    };
  } catch (err: any) {
    console.error('Unhandled exception in fetchBootstrapData:', err);
    return null;
  }
}

// ==========================================
// 2. USER MODULE
// ==========================================
export async function apiSaveUser(user: User): Promise<User | null> {
  try {
    const row = mapUserToRow(user);
    if (!isSupabaseConfigured()) {
      return user;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSaveUser',
      SUPABASE_TABLES.APP_USERS,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.APP_USERS).upsert(row)
    );
    return res !== null ? user : user;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveUser:', err);
    return user;
  }
}

export async function apiDeleteUser(userId: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      return true;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeleteUser',
      SUPABASE_TABLES.APP_USERS,
      'DELETE',
      { userId },
      () => supabase.from(SUPABASE_TABLES.APP_USERS).delete().eq('id', userId)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteUser:', err);
    return false;
  }
}

// ==========================================
// 3. DEMANDS MODULE
// ==========================================
export async function apiSaveDemand(demand: DemandDocument): Promise<DemandDocument | null> {
  try {
    const row = mapDemandToRow(demand);
    if (!isSupabaseConfigured()) {
      return demand;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSaveDemand',
      SUPABASE_TABLES.DEMANDS,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.DEMANDS).upsert(row)
    );
    return res !== null ? demand : demand;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveDemand:', err);
    return demand;
  }
}

export async function apiDeleteDemand(demandId: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      return true;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeleteDemand',
      SUPABASE_TABLES.DEMANDS,
      'DELETE',
      { demandId },
      () => supabase.from(SUPABASE_TABLES.DEMANDS).delete().eq('id', demandId)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteDemand:', err);
    return false;
  }
}

// ==========================================
// 4. PURCHASES MODULE
// ==========================================
export async function apiSavePurchase(purchase: PurchaseDocument): Promise<PurchaseDocument | null> {
  try {
    const row = mapPurchaseToRow(purchase);
    if (!isSupabaseConfigured()) {
      return purchase;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSavePurchase',
      SUPABASE_TABLES.PURCHASES,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.PURCHASES).upsert(row)
    );
    return res !== null ? purchase : purchase;
  } catch (err: any) {
    console.error('Unhandled exception in apiSavePurchase:', err);
    return purchase;
  }
}

export async function apiDeletePurchase(purchaseId: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      return true;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeletePurchase',
      SUPABASE_TABLES.PURCHASES,
      'DELETE',
      { purchaseId },
      () => supabase.from(SUPABASE_TABLES.PURCHASES).delete().eq('id', purchaseId)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeletePurchase:', err);
    return false;
  }
}

// ==========================================
// 5. ACCOUNTING (CHARTS & VOUCHERS) MODULE
// ==========================================
export async function apiSaveChartAccount(acc: ChartAccount): Promise<ChartAccount | null> {
  try {
    // Sync with Express PostgreSQL API when available
    fetch('/api/accounting/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(acc),
    }).catch(() => {});

    const row = mapChartAccountToRow(acc);
    if (!isSupabaseConfigured()) {
      return acc;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSaveChartAccount',
      SUPABASE_TABLES.CHART_ACCOUNTS,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.CHART_ACCOUNTS).upsert(row)
    );
    if (res === null) {
      const coreRow = mapChartAccountCoreToRow(acc);
      await diagnosticSupabaseOperation<any>(
        'apiSaveChartAccount_coreFallback',
        SUPABASE_TABLES.CHART_ACCOUNTS,
        'UPSERT',
        coreRow,
        () => supabase.from(SUPABASE_TABLES.CHART_ACCOUNTS).upsert(coreRow)
      );
    }
    return acc;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveChartAccount:', err);
    return acc;
  }
}

export async function apiDeleteChartAccount(accountId: string): Promise<boolean> {
  try {
    let deletedViaExpress = false;
    try {
      const serverRes = await fetch(`/api/accounting/accounts/${encodeURIComponent(accountId)}`, {
        method: 'DELETE',
      });
      const contentType = serverRes.headers.get('content-type') || '';
      if (serverRes.ok && contentType.includes('application/json')) {
        deletedViaExpress = true;
      }
    } catch {}

    if (!isSupabaseConfigured()) {
      return deletedViaExpress;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeleteChartAccount',
      SUPABASE_TABLES.CHART_ACCOUNTS,
      'DELETE',
      { accountId },
      () => supabase.from(SUPABASE_TABLES.CHART_ACCOUNTS).delete().eq('id', accountId)
    );
    return res !== null || deletedViaExpress;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteChartAccount:', err);
    return false;
  }
}

export async function apiBulkSaveChartAccounts(
  accountsList: ChartAccount[],
  overrideAll = false
): Promise<{ success: boolean; accounts: ChartAccount[]; error?: string }> {
  // Deduplicate by normalized code (keeping latest)
  const dedupedMap = new Map<string, ChartAccount>();
  for (const acc of accountsList) {
    const key = (acc.code || acc.accountNo || acc.id || '').trim().toLowerCase();
    if (!key) continue;
    dedupedMap.set(key, acc);
  }
  const deduped = Array.from(dedupedMap.values());

  let persistedAccounts = deduped;
  let savedViaExpress = false;
  let expressError = '';
  let savedViaSupabase = false;
  let supabaseError = '';

  // 1. Primary Express / PostgreSQL backend persistence
  try {
    const serverRes = await fetch('/api/accounting/accounts/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accounts: deduped, overrideAll }),
    });
    const contentType = serverRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await serverRes.json();
      if (serverRes.ok && json?.success) {
        savedViaExpress = true;
        if (Array.isArray(json.accounts)) {
          persistedAccounts = json.accounts;
        }
      } else {
        expressError = json?.details || json?.error || `Server error (${serverRes.status})`;
      }
    }
  } catch (err: any) {
    // Express API may be absent in pure static hosting
    expressError = err?.message || '';
  }

  // 2. Direct Supabase Client SDK persistence (when configured in browser / Vercel)
  if (isSupabaseConfigured()) {
    try {
      let toUpsert = persistedAccounts;

      if (overrideAll) {
        const delRes = await diagnosticSupabaseOperation<any>(
          'apiClearChartAccountsBeforeImport',
          SUPABASE_TABLES.CHART_ACCOUNTS,
          'DELETE',
          { overrideAll: true },
          () => supabase.from(SUPABASE_TABLES.CHART_ACCOUNTS).delete().neq('id', '___non_existent_safety_id___')
        );
        if (delRes === null) {
          supabaseError = getDbApiDiagnosticLogs()[0]?.error || 'Failed to clear existing accounts in Supabase.';
        }
      } else {
        // Reconcile IDs by existing code so UNIQUE(code) never conflicts and duplicates aren't created
        const existingRows = await diagnosticSupabaseOperation<any[]>(
          'apiFetchExistingChartAccountCodes',
          SUPABASE_TABLES.CHART_ACCOUNTS,
          'SELECT',
          {},
          () => supabase.from(SUPABASE_TABLES.CHART_ACCOUNTS).select('id, code')
        );
        if (Array.isArray(existingRows)) {
          const codeToId = new Map<string, string>();
          existingRows.forEach((r) => {
            if (r?.code && r?.id) codeToId.set(String(r.code).trim().toLowerCase(), String(r.id));
          });
          toUpsert = toUpsert.map((acc) => {
            const matchedId = codeToId.get((acc.code || acc.accountNo || '').trim().toLowerCase());
            return matchedId ? { ...acc, id: matchedId } : acc;
          });
        }
      }

      if (!supabaseError) {
        const batchSize = 40;
        let allBatchesOk = true;
        for (let i = 0; i < toUpsert.length; i += batchSize) {
          const batchSlice = toUpsert.slice(i, i + batchSize);
          const rows = batchSlice.map(mapChartAccountToRow);
          let batchRes = await diagnosticSupabaseOperation<any>(
            `apiBulkSaveChartAccounts_batch_${Math.floor(i / batchSize)}`,
            SUPABASE_TABLES.CHART_ACCOUNTS,
            'UPSERT',
            { count: rows.length },
            () => supabase.from(SUPABASE_TABLES.CHART_ACCOUNTS).upsert(rows)
          );

          // If optional hierarchical columns aren't in PostgREST schema cache yet, fall back to core columns
          if (batchRes === null) {
            const lastErr = getDbApiDiagnosticLogs()[0]?.error || '';
            if (lastErr.includes('PGRST204') || lastErr.toLowerCase().includes('schema cache') || lastErr.toLowerCase().includes('column')) {
              const coreRows = batchSlice.map(mapChartAccountCoreToRow);
              batchRes = await diagnosticSupabaseOperation<any>(
                `apiBulkSaveChartAccounts_coreBatch_${Math.floor(i / batchSize)}`,
                SUPABASE_TABLES.CHART_ACCOUNTS,
                'UPSERT',
                { count: coreRows.length },
                () => supabase.from(SUPABASE_TABLES.CHART_ACCOUNTS).upsert(coreRows)
              );
            }
          }

          if (batchRes === null) {
            allBatchesOk = false;
            supabaseError = getDbApiDiagnosticLogs()[0]?.error || 'Failed to upsert Chart of Accounts batch to Supabase.';
            break;
          }
        }
        if (allBatchesOk) {
          savedViaSupabase = true;
          persistedAccounts = toUpsert;
        }
      }
    } catch (err: any) {
      supabaseError = err?.message || String(err);
      console.error('Unhandled exception in apiBulkSaveChartAccounts:', err);
    }
  }

  if (savedViaExpress || savedViaSupabase) {
    return { success: true, accounts: persistedAccounts };
  }

  return {
    success: false,
    accounts: deduped,
    error:
      supabaseError ||
      expressError ||
      'Unable to reach PostgreSQL backend or Supabase database to store Chart of Accounts.',
  };
}

export async function apiSaveVoucher(voucher: VoucherDocument): Promise<VoucherDocument | null> {
  try {
    const row = mapVoucherToRow(voucher);
    if (!isSupabaseConfigured()) {
      return voucher;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSaveVoucher',
      SUPABASE_TABLES.VOUCHERS,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.VOUCHERS).upsert(row)
    );
    return res !== null ? voucher : voucher;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveVoucher:', err);
    return voucher;
  }
}

export async function apiDeleteVoucher(voucherId: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      return true;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeleteVoucher',
      SUPABASE_TABLES.VOUCHERS,
      'DELETE',
      { voucherId },
      () => supabase.from(SUPABASE_TABLES.VOUCHERS).delete().eq('id', voucherId)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteVoucher:', err);
    return false;
  }
}

// ==========================================
// 6. TREASURY (CASH BOOK, CREDIT BOOK, BANKS)
// ==========================================
export async function apiSaveCashBookEntry(entry: CashBookEntry): Promise<CashBookEntry | null> {
  try {
    const row = mapCashBookEntryToRow(entry);
    if (!isSupabaseConfigured()) {
      return entry;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSaveCashBookEntry',
      SUPABASE_TABLES.CASH_BOOK_ENTRIES,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.CASH_BOOK_ENTRIES).upsert(row)
    );
    return res !== null ? entry : entry;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveCashBookEntry:', err);
    return entry;
  }
}

export async function apiDeleteCashBookEntry(id: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      return true;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeleteCashBookEntry',
      SUPABASE_TABLES.CASH_BOOK_ENTRIES,
      'DELETE',
      { id },
      () => supabase.from(SUPABASE_TABLES.CASH_BOOK_ENTRIES).delete().eq('id', id)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteCashBookEntry:', err);
    return false;
  }
}

export async function apiSaveCreditBookEntry(entry: CreditBookEntry): Promise<CreditBookEntry | null> {
  try {
    const row = mapCreditBookEntryToRow(entry);
    if (!isSupabaseConfigured()) {
      return entry;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSaveCreditBookEntry',
      SUPABASE_TABLES.CREDIT_BOOK_ENTRIES,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.CREDIT_BOOK_ENTRIES).upsert(row)
    );
    return res !== null ? entry : entry;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveCreditBookEntry:', err);
    return entry;
  }
}

export async function apiDeleteCreditBookEntry(id: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      return true;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeleteCreditBookEntry',
      SUPABASE_TABLES.CREDIT_BOOK_ENTRIES,
      'DELETE',
      { id },
      () => supabase.from(SUPABASE_TABLES.CREDIT_BOOK_ENTRIES).delete().eq('id', id)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteCreditBookEntry:', err);
    return false;
  }
}

export async function apiSaveBank(bank: BankRecord): Promise<BankRecord | null> {
  try {
    const row = mapBankToRow(bank);
    if (!isSupabaseConfigured()) {
      return bank;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSaveBank',
      SUPABASE_TABLES.BANKS,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.BANKS).upsert(row)
    );
    return res !== null ? bank : bank;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveBank:', err);
    return bank;
  }
}

export async function apiDeleteBank(id: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      return true;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeleteBank',
      SUPABASE_TABLES.BANKS,
      'DELETE',
      { id },
      () => supabase.from(SUPABASE_TABLES.BANKS).delete().eq('id', id)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteBank:', err);
    return false;
  }
}

export async function apiSaveBankAccount(acc: BankAccountRecord): Promise<BankAccountRecord | null> {
  try {
    const row = mapBankAccountToRow(acc);
    if (!isSupabaseConfigured()) {
      return acc;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSaveBankAccount',
      SUPABASE_TABLES.BANK_ACCOUNTS,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.BANK_ACCOUNTS).upsert(row)
    );
    return res !== null ? acc : acc;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveBankAccount:', err);
    return acc;
  }
}

export async function apiDeleteBankAccount(id: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      return true;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeleteBankAccount',
      SUPABASE_TABLES.BANK_ACCOUNTS,
      'DELETE',
      { id },
      () => supabase.from(SUPABASE_TABLES.BANK_ACCOUNTS).delete().eq('id', id)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteBankAccount:', err);
    return false;
  }
}

// ==========================================
// 7. STORE & SALES MODULE
// ==========================================
export async function apiSaveCompanySettings(cs: CompanySettings): Promise<CompanySettings | null> {
  try {
    const row = mapCompanySettingsToRow(cs);
    if (!isSupabaseConfigured()) {
      return cs;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSaveCompanySettings',
      SUPABASE_TABLES.COMPANY_SETTINGS,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.COMPANY_SETTINGS).upsert(row)
    );
    return res !== null ? cs : cs;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveCompanySettings:', err);
    return cs;
  }
}

export async function apiSaveBuyer(buyer: BuyerRecord): Promise<BuyerRecord | null> {
  try {
    const row = mapBuyerToRow(buyer);
    if (!isSupabaseConfigured()) {
      return buyer;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSaveBuyer',
      SUPABASE_TABLES.BUYERS,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.BUYERS).upsert(row)
    );
    return res !== null ? buyer : buyer;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveBuyer:', err);
    return buyer;
  }
}

export async function apiDeleteBuyer(id: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      return true;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeleteBuyer',
      SUPABASE_TABLES.BUYERS,
      'DELETE',
      { id },
      () => supabase.from(SUPABASE_TABLES.BUYERS).delete().eq('id', id)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteBuyer:', err);
    return false;
  }
}

export async function apiSavePartner(partner: PartnerRecord): Promise<PartnerRecord | null> {
  try {
    const row = mapPartnerToRow(partner);
    if (!isSupabaseConfigured()) {
      return partner;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSavePartner',
      SUPABASE_TABLES.PARTNERS,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.PARTNERS).upsert(row)
    );
    return res !== null ? partner : partner;
  } catch (err: any) {
    console.error('Unhandled exception in apiSavePartner:', err);
    return partner;
  }
}

export async function apiDeletePartner(id: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      return true;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeletePartner',
      SUPABASE_TABLES.PARTNERS,
      'DELETE',
      { id },
      () => supabase.from(SUPABASE_TABLES.PARTNERS).delete().eq('id', id)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeletePartner:', err);
    return false;
  }
}

export async function apiSavePosCoalSale(sale: PosCoalSellEntry): Promise<PosCoalSellEntry | null> {
  try {
    const row = mapPosSaleToRow(sale);
    if (!isSupabaseConfigured()) {
      return sale;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSavePosCoalSale',
      SUPABASE_TABLES.POS_COAL_SALES,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.POS_COAL_SALES).upsert(row)
    );
    return res !== null ? sale : sale;
  } catch (err: any) {
    console.error('Unhandled exception in apiSavePosCoalSale:', err);
    return sale;
  }
}

export async function apiDeletePosCoalSale(id: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      return true;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeletePosCoalSale',
      SUPABASE_TABLES.POS_COAL_SALES,
      'DELETE',
      { id },
      () => supabase.from(SUPABASE_TABLES.POS_COAL_SALES).delete().eq('id', id)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeletePosCoalSale:', err);
    return false;
  }
}

export async function apiSaveCoalSellRecord(rec: CoalSellRecord): Promise<CoalSellRecord | null> {
  try {
    const row = mapCoalRecordToRow(rec);
    if (!isSupabaseConfigured()) {
      return rec;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSaveCoalSellRecord',
      SUPABASE_TABLES.COAL_SELL_RECORDS,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.COAL_SELL_RECORDS).upsert(row)
    );
    return res !== null ? rec : rec;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveCoalSellRecord:', err);
    return rec;
  }
}

export async function apiDeleteCoalSellRecord(id: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      return true;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeleteCoalSellRecord',
      SUPABASE_TABLES.COAL_SELL_RECORDS,
      'DELETE',
      { id },
      () => supabase.from(SUPABASE_TABLES.COAL_SELL_RECORDS).delete().eq('id', id)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteCoalSellRecord:', err);
    return false;
  }
}

export async function apiSaveCoalProduction(record: CoalProductionRecord): Promise<CoalProductionRecord | null> {
  try {
    try {
      const raw = localStorage.getItem('ahcm_erp_coal_production_records');
      const prev: CoalProductionRecord[] = raw ? JSON.parse(raw) : [];
      const idx = prev.findIndex((r) => r.id === record.id);
      const next = idx >= 0 ? prev.map((r) => (r.id === record.id ? record : r)) : [record, ...prev];
      localStorage.setItem('ahcm_erp_coal_production_records', JSON.stringify(next));
    } catch {}

    // Sync with server API
    fetch('/api/store-sales/coal-production', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    }).catch(() => {});

    const row = mapCoalProductionToRow(record);
    if (!isSupabaseConfigured()) {
      return record;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSaveCoalProduction',
      SUPABASE_TABLES.COAL_PRODUCTION_RECORDS,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.COAL_PRODUCTION_RECORDS).upsert(row)
    );
    return res !== null ? record : record;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveCoalProduction:', err);
    return record;
  }
}

export async function apiDeleteCoalProduction(id: string): Promise<boolean> {
  try {
    try {
      const raw = localStorage.getItem('ahcm_erp_coal_production_records');
      if (raw) {
        const prev: CoalProductionRecord[] = JSON.parse(raw);
        const next = prev.filter((r) => r.id !== id);
        localStorage.setItem('ahcm_erp_coal_production_records', JSON.stringify(next));
      }
    } catch {}

    // Sync with server API
    fetch(`/api/store-sales/coal-production/${id}`, {
      method: 'DELETE',
    }).catch(() => {});

    if (!isSupabaseConfigured()) {
      return true;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeleteCoalProduction',
      SUPABASE_TABLES.COAL_PRODUCTION_RECORDS,
      'DELETE',
      { id },
      () => supabase.from(SUPABASE_TABLES.COAL_PRODUCTION_RECORDS).delete().eq('id', id)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteCoalProduction:', err);
    return false;
  }
}

export async function apiSaveStockItem(item: StockItem): Promise<StockItem | null> {
  try {
    const row = mapStockItemToRow(item);
    if (!isSupabaseConfigured()) {
      return item;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSaveStockItem',
      SUPABASE_TABLES.STOCK_ITEMS,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.STOCK_ITEMS).upsert(row)
    );
    return res !== null ? item : item;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveStockItem:', err);
    return item;
  }
}

export async function apiDeleteStockItem(id: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      return true;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeleteStockItem',
      SUPABASE_TABLES.STOCK_ITEMS,
      'DELETE',
      { id },
      () => supabase.from(SUPABASE_TABLES.STOCK_ITEMS).delete().eq('id', id)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteStockItem:', err);
    return false;
  }
}

export async function apiSaveStockEntry(entry: StockEntry): Promise<StockEntry | null> {
  try {
    const row = mapStockEntryToRow(entry);
    if (!isSupabaseConfigured()) {
      return entry;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSaveStockEntry',
      SUPABASE_TABLES.STOCK_ENTRIES,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.STOCK_ENTRIES).upsert(row)
    );
    return res !== null ? entry : entry;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveStockEntry:', err);
    return entry;
  }
}

export async function apiDeleteStockEntry(id: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      return true;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeleteStockEntry',
      SUPABASE_TABLES.STOCK_ENTRIES,
      'DELETE',
      { id },
      () => supabase.from(SUPABASE_TABLES.STOCK_ENTRIES).delete().eq('id', id)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteStockEntry:', err);
    return false;
  }
}

export async function apiSaveVehicle(veh: VehicleRecord): Promise<VehicleRecord | null> {
  try {
    const row = mapVehicleToRow(veh);
    if (!isSupabaseConfigured()) {
      fetch('/api/store-sales/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(veh),
      }).catch(() => {});
      return veh;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSaveVehicle',
      SUPABASE_TABLES.VEHICLES,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.VEHICLES).upsert(row)
    );
    return res !== null ? veh : veh;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveVehicle:', err);
    return veh;
  }
}

export async function apiDeleteVehicle(id: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      fetch(`/api/store-sales/vehicles/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch(() => {});
      return true;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeleteVehicle',
      SUPABASE_TABLES.VEHICLES,
      'DELETE',
      { id },
      () => supabase.from(SUPABASE_TABLES.VEHICLES).delete().eq('id', id)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteVehicle:', err);
    return false;
  }
}

export async function apiSaveVehicleConsumption(vc: VehicleConsumptionRecord): Promise<VehicleConsumptionRecord | null> {
  try {
    const row = mapVehicleConsumptionToRow(vc);
    if (!isSupabaseConfigured()) {
      return vc;
    }
    // Also save to item_consumptions if this is an ItemConsumptionRecord
    if ((vc as any).consumptionType || (vc as any).targetId) {
      const itemRow = mapItemConsumptionToRow(vc as any);
      Promise.resolve(supabase.from(SUPABASE_TABLES.ITEM_CONSUMPTIONS).upsert(itemRow)).catch(() => {});
    }

    const res = await diagnosticSupabaseOperation<any>(
      'apiSaveVehicleConsumption',
      SUPABASE_TABLES.VEHICLE_CONSUMPTIONS,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.VEHICLE_CONSUMPTIONS).upsert(row)
    );
    return res !== null ? vc : vc;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveVehicleConsumption:', err);
    return vc;
  }
}

export async function apiDeleteVehicleConsumption(id: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      return true;
    }
    // Try both tables
    Promise.resolve(supabase.from(SUPABASE_TABLES.ITEM_CONSUMPTIONS).delete().eq('id', id)).catch(() => {});
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeleteVehicleConsumption',
      SUPABASE_TABLES.VEHICLE_CONSUMPTIONS,
      'DELETE',
      { id },
      () => supabase.from(SUPABASE_TABLES.VEHICLE_CONSUMPTIONS).delete().eq('id', id)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteVehicleConsumption:', err);
    return false;
  }
}

// ------------------------------------------
// STORE EXTENSIONS: MINES, CATEGORIES, UNITS, ITEM CONSUMPTIONS
// ------------------------------------------

export async function apiSaveMine(mine: MineRecord): Promise<MineRecord | null> {
  try {
    const row = mapMineToRow(mine);
    if (!isSupabaseConfigured()) {
      return mine;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSaveMine',
      SUPABASE_TABLES.MINES,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.MINES).upsert(row)
    );
    return res !== null ? mine : mine;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveMine:', err);
    return mine;
  }
}

export async function apiDeleteMine(id: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      return true;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeleteMine',
      SUPABASE_TABLES.MINES,
      'DELETE',
      { id },
      () => supabase.from(SUPABASE_TABLES.MINES).delete().eq('id', id)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteMine:', err);
    return false;
  }
}

export async function apiSaveItemCategory(cat: ItemCategory): Promise<ItemCategory | null> {
  try {
    const row = mapItemCategoryToRow(cat);
    if (!isSupabaseConfigured()) {
      fetch('/api/store-sales/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cat),
      }).catch(() => {});
      return cat;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSaveItemCategory',
      SUPABASE_TABLES.ITEM_CATEGORIES,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.ITEM_CATEGORIES).upsert(row)
    );
    return res !== null ? cat : cat;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveItemCategory:', err);
    return cat;
  }
}

export async function apiDeleteItemCategory(id: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      fetch(`/api/store-sales/categories/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch(() => {});
      return true;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeleteItemCategory',
      SUPABASE_TABLES.ITEM_CATEGORIES,
      'DELETE',
      { id },
      () => supabase.from(SUPABASE_TABLES.ITEM_CATEGORIES).delete().eq('id', id)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteItemCategory:', err);
    return false;
  }
}

export async function apiSaveItemUnitType(unit: ItemUnitType): Promise<ItemUnitType | null> {
  try {
    const row = mapItemUnitTypeToRow(unit);
    if (!isSupabaseConfigured()) {
      fetch('/api/store-sales/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unit),
      }).catch(() => {});
      return unit;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSaveItemUnitType',
      SUPABASE_TABLES.ITEM_UNITS,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.ITEM_UNITS).upsert(row)
    );
    return res !== null ? unit : unit;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveItemUnitType:', err);
    return unit;
  }
}

export async function apiDeleteItemUnitType(id: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      fetch(`/api/store-sales/units/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch(() => {});
      return true;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeleteItemUnitType',
      SUPABASE_TABLES.ITEM_UNITS,
      'DELETE',
      { id },
      () => supabase.from(SUPABASE_TABLES.ITEM_UNITS).delete().eq('id', id)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteItemUnitType:', err);
    return false;
  }
}

export async function apiSaveMachineryType(mt: MachineryType): Promise<MachineryType | null> {
  try {
    const row = mapMachineryTypeToRow(mt);
    if (!isSupabaseConfigured()) {
      const resp = await fetch('/api/store-sales/machinery-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mt),
      });
      if (!resp.ok) {
        console.error('Failed to save machinery type via API:', resp.status);
      }
      return mt;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiSaveMachineryType',
      SUPABASE_TABLES.MACHINERY_TYPES,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.MACHINERY_TYPES).upsert(row)
    );
    return res !== null ? mt : mt;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveMachineryType:', err);
    return mt;
  }
}

export async function apiDeleteMachineryType(id: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      const resp = await fetch(`/api/store-sales/machinery-types/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return resp.ok;
    }
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeleteMachineryType',
      SUPABASE_TABLES.MACHINERY_TYPES,
      'DELETE',
      { id },
      () => supabase.from(SUPABASE_TABLES.MACHINERY_TYPES).delete().eq('id', id)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteMachineryType:', err);
    return false;
  }
}

export async function apiSaveItemConsumption(rec: ItemConsumptionRecord): Promise<ItemConsumptionRecord | null> {
  try {
    const row = mapItemConsumptionToRow(rec);
    if (!isSupabaseConfigured()) {
      return rec;
    }
    // Upsert into dedicated item_consumptions
    const res = await diagnosticSupabaseOperation<any>(
      'apiSaveItemConsumption',
      SUPABASE_TABLES.ITEM_CONSUMPTIONS,
      'UPSERT',
      row,
      () => supabase.from(SUPABASE_TABLES.ITEM_CONSUMPTIONS).upsert(row)
    );

    // Also attempt backward-compatible vehicle_consumptions upsert if vehicle
    if (rec.consumptionType === 'vehicle') {
      const vRow = mapVehicleConsumptionToRow(rec);
      Promise.resolve(supabase.from(SUPABASE_TABLES.VEHICLE_CONSUMPTIONS).upsert(vRow)).catch(() => {});
    }

    return res !== null ? rec : rec;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveItemConsumption:', err);
    return rec;
  }
}

export async function apiDeleteItemConsumption(id: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      return true;
    }
    Promise.resolve(supabase.from(SUPABASE_TABLES.VEHICLE_CONSUMPTIONS).delete().eq('id', id)).catch(() => {});
    const res = await diagnosticSupabaseOperation<any>(
      'apiDeleteItemConsumption',
      SUPABASE_TABLES.ITEM_CONSUMPTIONS,
      'DELETE',
      { id },
      () => supabase.from(SUPABASE_TABLES.ITEM_CONSUMPTIONS).delete().eq('id', id)
    );
    return res !== null;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteItemConsumption:', err);
    return false;
  }
}

// ==========================================
// 8. EXECUTIVE SUMMARIES & REPORTS
// ==========================================
export async function fetchVehicleConsumptionSummary(): Promise<VehicleConsumptionSummary[]> {
  try {
    if (!isSupabaseConfigured()) {
      return computeVehicleConsumptionSummary(initialVehicles, initialVehicleConsumptions);
    }
    const [vehiclesRes, consumptionsRes] = await Promise.all([
      supabase.from(SUPABASE_TABLES.VEHICLES).select('*'),
      supabase.from(SUPABASE_TABLES.VEHICLE_CONSUMPTIONS).select('*'),
    ]);

    const vehicles = vehiclesRes.data ? vehiclesRes.data.map(mapVehicleFromRow) : initialVehicles;
    const consumptions = consumptionsRes.data ? consumptionsRes.data.map(mapVehicleConsumptionFromRow) : initialVehicleConsumptions;
    return computeVehicleConsumptionSummary(vehicles, consumptions);
  } catch (err: any) {
    console.error('Unhandled exception in fetchVehicleConsumptionSummary:', err);
    return computeVehicleConsumptionSummary(initialVehicles, initialVehicleConsumptions);
  }
}

export async function fetchItemWiseStockSummary(): Promise<ItemWiseStockSummary[]> {
  try {
    if (!isSupabaseConfigured()) {
      return computeItemWiseStockSummary(initialStockItems, initialStockEntries);
    }
    const [itemsRes, entriesRes] = await Promise.all([
      supabase.from(SUPABASE_TABLES.STOCK_ITEMS).select('*'),
      supabase.from(SUPABASE_TABLES.STOCK_ENTRIES).select('*'),
    ]);

    const items = itemsRes.data ? itemsRes.data.map(mapStockItemFromRow) : initialStockItems;
    const entries = entriesRes.data ? entriesRes.data.map(mapStockEntryFromRow) : initialStockEntries;
    return computeItemWiseStockSummary(items, entries);
  } catch (err: any) {
    console.error('Unhandled exception in fetchItemWiseStockSummary:', err);
    return computeItemWiseStockSummary(initialStockItems, initialStockEntries);
  }
}

// ==========================================
// 9. LIVE CONNECTIVITY & HEALTH DIAGNOSTICS
// ==========================================
export interface DatabaseStatusResponse {
  connected: boolean;
  message: string;
  version?: string;
  host?: string;
  database?: string;
  timestamp: string;
  provider: string;
}

export async function apiCheckDatabaseStatus(): Promise<DatabaseStatusResponse | null> {
  const startTime = performance.now();
  const currentUrl = getCurrentSupabaseUrl();

  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      message: 'Supabase Anon Key is not yet set for this local preview environment. Paste your key in Database Diagnostics to enable live cloud sync.',
      host: currentUrl,
      database: 'postgres',
      timestamp: new Date().toISOString(),
      provider: 'Supabase Cloud PostgreSQL Direct Client SDK',
    };
  }

  try {
    const { count, error, status } = await supabase
      .from(SUPABASE_TABLES.APP_USERS)
      .select('id', { count: 'exact', head: true });

    const durationMs = Math.round(performance.now() - startTime);

    if (error && error.code !== 'PGRST116') {
      const is401 = status === 401 || String(error.message).toLowerCase().includes('api key');

      appendDiagnosticLog({
        id: `db-status-${Date.now()}`,
        timestamp: new Date().toISOString(),
        functionName: 'apiCheckDatabaseStatus',
        url: `${currentUrl}/rest/v1/${SUPABASE_TABLES.APP_USERS}`,
        method: 'HEAD',
        payload: {},
        status: status || 500,
        error: is401 
          ? 'Invalid Supabase API Key. Double check your NEXT_PUBLIC_SUPABASE_ANON_KEY.'
          : error.message,
        durationMs,
        success: false,
      });

      return {
        connected: false,
        message: is401 
          ? 'Invalid API Key. Please verify your NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel or Database Diagnostics.'
          : `Supabase status check: ${error.message} (${error.code || 'ERR'})`,
        host: currentUrl,
        database: 'postgres',
        timestamp: new Date().toISOString(),
        provider: 'Supabase Cloud PostgreSQL Direct Client SDK',
      };
    }

    appendDiagnosticLog({
      id: `db-status-${Date.now()}`,
      timestamp: new Date().toISOString(),
      functionName: 'apiCheckDatabaseStatus',
      url: `${currentUrl}/rest/v1/${SUPABASE_TABLES.APP_USERS}`,
      method: 'HEAD',
      payload: {},
      status: 200,
      response: { count },
      durationMs,
      success: true,
    });

    return {
      connected: true,
      message: `Successfully connected to live Supabase database tables via JavaScript Client SDK (${durationMs}ms latency)`,
      host: currentUrl,
      database: 'postgres',
      timestamp: new Date().toISOString(),
      provider: 'Supabase Cloud PostgreSQL Direct Client SDK',
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err.message || 'Failed to ping Supabase database',
      host: currentUrl,
      database: 'postgres',
      timestamp: new Date().toISOString(),
      provider: 'Supabase Cloud PostgreSQL Direct Client SDK',
    };
  }
}

export async function apiRunHealthPing(): Promise<{ status: string; time: string } | null> {
  return {
    status: 'ok',
    time: new Date().toISOString(),
  };
}

export interface TableAuditResult {
  tableKey: string;
  tableName: string;
  status: 'ok' | 'missing' | 'error' | 'unconfigured';
  count?: number;
  error?: string;
  latencyMs?: number;
}

export async function apiAuditSupabaseTables(): Promise<TableAuditResult[]> {
  if (!isSupabaseConfigured()) {
    return Object.entries(SUPABASE_TABLES).map(([tableKey, tableName]) => ({
      tableKey,
      tableName,
      status: 'unconfigured' as const,
      error: 'Supabase Anon Key not set',
    }));
  }

  const entries = Object.entries(SUPABASE_TABLES);
  const results = await Promise.all(
    entries.map(async ([tableKey, tableName]) => {
      const start = performance.now();
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('id', { count: 'exact', head: true });
        const latencyMs = Math.round(performance.now() - start);

        if (error) {
          const isMissing = error.code === 'PGRST205' || String(error.message).toLowerCase().includes('not exist') || String(error.message).toLowerCase().includes('schema');
          return {
            tableKey,
            tableName,
            status: isMissing ? ('missing' as const) : ('error' as const),
            error: error.message || (isMissing ? 'Table does not exist' : 'Query error'),
            latencyMs,
          };
        }

        return {
          tableKey,
          tableName,
          status: 'ok' as const,
          count: count ?? 0,
          latencyMs,
        };
      } catch (err: any) {
        return {
          tableKey,
          tableName,
          status: 'error' as const,
          error: err.message || 'Exception during table check',
        };
      }
    })
  );

  return results;
}

