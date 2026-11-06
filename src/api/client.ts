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
  StockItem,
  StockEntry,
  VehicleRecord,
  VehicleConsumptionRecord,
  VehicleConsumptionSummary,
  ItemWiseStockSummary,
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
  initialStockItems,
  initialStockEntries,
  initialVehicles,
  initialVehicleConsumptions,
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
  stockItems: StockItem[];
  stockEntries: StockEntry[];
  vehicles: VehicleRecord[];
  vehicleConsumptions: VehicleConsumptionRecord[];
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

      console.warn(
        `%c[SUPABASE ${is401 ? 'KEY NOTICE' : 'ERROR'} %c${status || 500}%c] %c${operation} ${tableName} (${durationMs}ms)`,
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

const mapDemandFromRow = (r: any): DemandDocument => ({
  id: r.id,
  demandType: r.demand_type,
  category: r.category,
  date: r.date,
  referenceNo: r.reference_no,
  items: r.items || [],
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
  items: d.items,
  total_amount: d.totalAmount,
  status: d.status,
  admin_remark: d.adminRemark || null,
  updated_at: d.updatedAt || new Date().toISOString(),
});

const mapPurchaseFromRow = (r: any): PurchaseDocument => ({
  id: r.id,
  paymentType: r.payment_type,
  date: r.date,
  reference: r.reference,
  items: r.items || [],
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
  items: p.items,
  total_amount: p.totalAmount,
  status: p.status,
  admin_remark: p.adminRemark || null,
  updated_at: p.updatedAt || new Date().toISOString(),
});

const mapChartAccountFromRow = (r: any): ChartAccount => ({
  id: r.id,
  code: r.code,
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
});

const mapChartAccountToRow = (a: ChartAccount) => ({
  id: a.id,
  code: a.code,
  type_digit: a.typeDigit,
  class_digit: a.classDigit,
  group_code: a.groupCode || '',
  sub_code: a.subCode || '',
  name: a.name,
  account_type: a.accountType,
  classification: a.classification || '',
  group_name: a.groupName || '',
  normal_balance: a.normalBalance || 'Debit',
  opening_balance: a.openingBalance || 0,
  current_balance: a.currentBalance || 0,
  description: a.description || null,
  is_active: a.isActive ?? true,
});

const mapVoucherFromRow = (r: any): VoucherDocument => ({
  id: r.id,
  voucherNo: r.voucher_no,
  voucherType: r.voucher_type,
  typeCode: (r.type_code as any) || undefined,
  date: r.date,
  referenceNo: r.reference_no || '',
  narration: r.narration || '',
  lines: r.lines || [],
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
  transactions: r.transactions || [],
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
  srNo: Number(r.sr_no || 1),
  buyerId: r.buyer_id || '',
  buyerNTN: r.buyer_ntn || '',
  buyerCNIC: r.buyer_cnic || '',
  buyerName: r.buyer_name,
  buyerType: (r.buyer_type || 'Registered') as any,
  saleOrganization: r.sale_organization || '',
  documentType: r.document_type || '',
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
  partnerName: r.partner_name,
  quantityTons: Number(r.quantity_tons || 0),
  vehicleNo: r.vehicle_no || '',
  remarks: r.remarks || '',
});

const mapCoalRecordToRow = (c: CoalSellRecord) => ({
  id: c.id,
  date: c.date,
  partner_id: c.partnerId || '',
  partner_name: c.partnerName,
  quantity_tons: c.quantityTons || 0,
  vehicle_no: c.vehicleNo || '',
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
  category: r.category || '',
  unit: r.unit,
});

const mapStockItemToRow = (i: StockItem) => ({
  id: i.id,
  item_code: i.itemCode,
  item_name: i.itemName,
  category: i.category || '',
  unit: i.unit,
});

const mapStockEntryFromRow = (r: any): StockEntry => ({
  id: r.id,
  srNo: Number(r.sr_no || 1),
  date: r.date,
  itemId: r.item_id,
  itemName: r.item_name,
  itemCode: r.item_code,
  stockQty: Number(r.stock_qty || 0),
  purchaseQty: Number(r.purchase_qty || 0),
  mineQty: Number(r.mine_qty || 0),
  vehiclesQty: Number(r.vehicles_qty || 0),
  companyName: r.company_name || '',
  balance: Number(r.balance || 0),
});

const mapStockEntryToRow = (s: StockEntry) => ({
  id: s.id,
  sr_no: s.srNo || 1,
  date: s.date,
  item_id: s.itemId,
  item_name: s.itemName,
  item_code: s.itemCode,
  stock_qty: s.stockQty || 0,
  purchase_qty: s.purchaseQty || 0,
  mine_qty: s.mineQty || 0,
  vehicles_qty: s.vehiclesQty || 0,
  company_name: s.companyName || '',
  balance: s.balance || 0,
});

const mapVehicleFromRow = (r: any): VehicleRecord => ({
  id: r.id,
  vehicleNo: r.vehicle_no,
  driverName: r.driver_name,
  vehicleType: r.vehicle_type,
  status: r.status as any,
});

const mapVehicleToRow = (v: VehicleRecord) => ({
  id: v.id,
  vehicle_no: v.vehicleNo,
  driver_name: v.driverName,
  vehicle_type: v.vehicleType,
  status: v.status,
});

const mapVehicleConsumptionFromRow = (r: any): VehicleConsumptionRecord => ({
  id: r.id,
  srNo: Number(r.sr_no || 1),
  vehicleId: r.vehicle_id,
  vehicleNo: r.vehicle_no,
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

const mapVehicleConsumptionToRow = (c: VehicleConsumptionRecord) => ({
  id: c.id,
  sr_no: c.srNo || 1,
  vehicle_id: c.vehicleId,
  vehicle_no: c.vehicleNo,
  date: c.date,
  diesel: c.diesel || 0,
  m_oil: c.mOil || 0,
  d_oil: c.dOil || 0,
  o_fltr: c.oFltr || 0,
  d_fltr: c.dFltr || 0,
  k_oil: c.kOil || 0,
  c_oil: c.cOil || 0,
  b_oil: c.bOil || 0,
  remarks: c.remarks || '',
});

const mapCompanySettingsFromRow = (r: any): CompanySettings => ({
  companyName: r.company_name,
  address: r.address,
  ntnNumber: r.ntn_number || '',
  contactNumber: r.contact_number || '',
  email: r.email || '',
});

const mapCompanySettingsToRow = (s: CompanySettings) => ({
  id: 'default',
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
    let target = summaryMap.get(c.vehicleId);
    if (!target) {
      for (const item of summaryMap.values()) {
        if (item.vehicleNo.trim().toUpperCase() === c.vehicleNo.trim().toUpperCase()) {
          target = item;
          break;
        }
      }
    }

    if (!target) {
      target = {
        vehicleId: c.vehicleId || `v-${c.vehicleNo}`,
        vehicleNo: c.vehicleNo,
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
      summaryMap.set(target.vehicleId, target);
    }

    target.totalDiesel += Number(c.diesel || 0);
    target.totalMOil += Number(c.mOil || 0);
    target.totalDOil += Number(c.dOil || 0);
    target.totalOFltr += Number(c.oFltr || 0);
    target.totalDFltr += Number(c.dFltr || 0);
    target.totalKOil += Number(c.kOil || 0);
    target.totalCOil += Number(c.cOil || 0);
    target.totalBOil += Number(c.bOil || 0);
    target.logsCount += 1;
    if (!target.lastDate || c.date > target.lastDate) {
      target.lastDate = c.date;
    }
  });

  const result = Array.from(summaryMap.values());
  result.sort((a, b) => b.totalDiesel - a.totalDiesel);
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
      summaryMap.set(target.itemId, target);
    }

    target.totalOpeningStock += Number(entry.stockQty || 0);
    target.totalPurchaseQty += Number(entry.purchaseQty || 0);
    target.totalMineQty += Number(entry.mineQty || 0);
    target.totalVehiclesQty += Number(entry.vehiclesQty || 0);
    target.entriesCount += 1;
    if (!target.lastDate || entry.date > target.lastDate) {
      target.lastDate = entry.date;
    }
  });

  const result = Array.from(summaryMap.values()).map((s) => {
    const net = (s.totalOpeningStock + s.totalPurchaseQty) - (s.totalMineQty + s.totalVehiclesQty);
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
  try {
    // If Supabase is not configured yet in this environment, return baseline records immediately
    if (!isSupabaseConfigured()) {
      console.log(
        '%c[SUPABASE PREVIEW] %cSupabase Anon Key is not yet configured for this preview environment. Loaded default local baseline data. Connect your Supabase Anon Key in Database Diagnostics to enable live cloud sync.',
        'color: #0284c7; font-weight: bold;',
        'color: #64748b;'
      );

      const vehicleConsumptionSummary = computeVehicleConsumptionSummary(initialVehicles, initialVehicleConsumptions);
      const itemWiseStockSummary = computeItemWiseStockSummary(initialStockItems, initialStockEntries);

      return {
        users: initialUsers,
        demands: initialDemands,
        purchases: initialPurchases,
        accounts: initialChartOfAccounts,
        vouchers: initialVouchers,
        cashBookEntries: initialCashBookEntries,
        creditBookEntries: initialCreditBookEntries,
        banks: initialBanks,
        bankAccounts: initialBankAccounts,
        companySettings: initialCompanySettings,
        buyers: initialBuyers,
        partners: initialPartners,
        posEntries: initialPosEntries,
        coalSellRecords: initialCoalSellRecords,
        stockItems: initialStockItems,
        stockEntries: initialStockEntries,
        vehicles: initialVehicles,
        vehicleConsumptions: initialVehicleConsumptions,
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
      stockItemsRes,
      stockEntriesRes,
      vehiclesRes,
      consumptionsRes,
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
    ]);

    const users = usersRes && usersRes.length > 0 ? usersRes.map(mapUserFromRow) : initialUsers;
    const demands = demandsRes ? demandsRes.map(mapDemandFromRow) : initialDemands;
    const purchases = purchasesRes ? purchasesRes.map(mapPurchaseFromRow) : initialPurchases;
    const accounts = accountsRes && accountsRes.length > 0 ? accountsRes.map(mapChartAccountFromRow) : initialChartOfAccounts;
    const vouchers = vouchersRes ? vouchersRes.map(mapVoucherFromRow) : initialVouchers;
    const cashBookEntries = cashBookRes ? cashBookRes.map(mapCashBookEntryFromRow) : initialCashBookEntries;
    const creditBookEntries = creditBookRes ? creditBookRes.map(mapCreditBookEntryFromRow) : initialCreditBookEntries;
    const banks = banksRes ? banksRes.map(mapBankFromRow) : initialBanks;
    const bankAccounts = bankAccountsRes ? bankAccountsRes.map(mapBankAccountFromRow) : initialBankAccounts;
    const companySettings = settingsRes && settingsRes.length > 0 ? mapCompanySettingsFromRow(settingsRes[0]) : initialCompanySettings;
    const buyers = buyersRes ? buyersRes.map(mapBuyerFromRow) : initialBuyers;
    const partners = partnersRes ? partnersRes.map(mapPartnerFromRow) : initialPartners;
    const posEntries = posRes ? posRes.map(mapPosSaleFromRow) : initialPosEntries;
    const coalSellRecords = coalRes ? coalRes.map(mapCoalRecordFromRow) : initialCoalSellRecords;
    const stockItems = stockItemsRes ? stockItemsRes.map(mapStockItemFromRow) : initialStockItems;
    const stockEntries = stockEntriesRes ? stockEntriesRes.map(mapStockEntryFromRow) : initialStockEntries;
    const vehicles = vehiclesRes ? vehiclesRes.map(mapVehicleFromRow) : initialVehicles;
    const vehicleConsumptions = consumptionsRes ? consumptionsRes.map(mapVehicleConsumptionFromRow) : initialVehicleConsumptions;

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
      stockItems,
      stockEntries,
      vehicles,
      vehicleConsumptions,
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
    return res !== null ? acc : acc;
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveChartAccount:', err);
    return acc;
  }
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
