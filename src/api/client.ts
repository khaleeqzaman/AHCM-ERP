import type { User } from '../types/user.ts';
import type { DemandDocument, PurchaseDocument } from '../types/index.ts';
import type { ChartAccount, VoucherDocument } from '../types/accounting.ts';
import type { CashBookEntry, CreditBookEntry, BankRecord, BankAccountRecord } from '../types/treasury.ts';
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
} from '../types/storeSales.ts';

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
    // Persist last 30 logs across browser reloads
    sessionStorage.setItem('ahcm_db_diagnostic_logs', JSON.stringify(diagnosticLogs.slice(0, 30)));
  } catch {
    // Ignore quota issues
  }
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
 * Core Diagnostic Fetch Request Wrapper.
 * Captures request payload, starts timer, logs to browser console, and logs detailed response/error.
 */
async function diagnosticRequest<T>(
  functionName: string,
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  payload?: any
): Promise<T | null> {
  const startTime = performance.now();
  const timestamp = new Date().toISOString();
  const logId = `db-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // 1. Console Group Header for Diagnostic Visibility
  console.groupCollapsed(
    `%c[DB API CALL] %c${method} ${url} %c(${functionName})`,
    'color: #2563eb; font-weight: bold;',
    'color: #0f172a; font-weight: 600;',
    'color: #64748b; font-style: italic;'
  );
  console.log('Timestamp:', timestamp);
  console.log('Target Endpoint:', url);
  console.log('HTTP Method:', method);
  console.log('Request Payload:', payload !== undefined ? payload : '(none)');
  console.groupEnd();

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (payload !== undefined && method !== 'GET') {
      fetchOptions.body = JSON.stringify(payload);
    }

    const res = await fetch(url, fetchOptions);
    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      let errBody = '';
      try {
        errBody = await res.text();
      } catch {
        errBody = res.statusText;
      }

      console.error(
        `%c[DB API ERROR %c${res.status}%c] %c${method} ${url} (${durationMs}ms)`,
        'color: #dc2626; font-weight: bold;',
        'color: #b91c1c; font-weight: 800;',
        'color: #dc2626; font-weight: bold;',
        'color: #0f172a;',
        {
          functionName,
          payload,
          status: res.status,
          statusText: res.statusText,
          errorBody: errBody,
        }
      );

      appendDiagnosticLog({
        id: logId,
        timestamp,
        functionName,
        url,
        method,
        payload,
        status: res.status,
        error: `HTTP ${res.status}: ${errBody}`,
        durationMs,
        success: false,
      });

      return null;
    }

    const contentType = res.headers.get('content-type') || '';
    let responseData: any = null;

    if (contentType.includes('application/json')) {
      responseData = await res.json();
    } else {
      responseData = await res.text();
    }

    console.log(
      `%c[DB API SUCCESS] %c${method} ${url} %c(${durationMs}ms)`,
      'color: #16a34a; font-weight: bold;',
      'color: #0f172a;',
      'color: #64748b;',
      {
        functionName,
        payload,
        response: responseData,
      }
    );

    appendDiagnosticLog({
      id: logId,
      timestamp,
      functionName,
      url,
      method,
      payload,
      status: res.status,
      response: responseData,
      durationMs,
      success: true,
    });

    return responseData as T;
  } catch (netErr: any) {
    const durationMs = Math.round(performance.now() - startTime);
    const errorMessage = netErr?.message || String(netErr);

    console.error(
      `%c[DB API NETWORK EXCEPTION] %c${method} ${url} (${durationMs}ms)`,
      'color: #dc2626; font-weight: bold;',
      'color: #0f172a;',
      {
        functionName,
        payload,
        exception: errorMessage,
        stack: netErr?.stack,
      }
    );

    appendDiagnosticLog({
      id: logId,
      timestamp,
      functionName,
      url,
      method,
      payload,
      error: `Network Exception: ${errorMessage}`,
      durationMs,
      success: false,
    });

    return null;
  }
}

// ==========================================
// 1. BOOTSTRAP (INITIAL APP LOAD & SYNC)
// ==========================================
export async function fetchBootstrapData(): Promise<BootstrapData | null> {
  try {
    return await diagnosticRequest<BootstrapData>(
      'fetchBootstrapData',
      '/api/bootstrap',
      'GET'
    );
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
    return await diagnosticRequest<User>(
      'apiSaveUser',
      '/api/users',
      'POST',
      user
    );
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveUser:', err);
    return null;
  }
}

export async function apiDeleteUser(userId: string): Promise<boolean> {
  try {
    const res = await diagnosticRequest<{ success: boolean }>(
      'apiDeleteUser',
      `/api/users/${encodeURIComponent(userId)}`,
      'DELETE',
      { userId }
    );
    return !!res?.success;
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
    return await diagnosticRequest<DemandDocument>(
      'apiSaveDemand',
      '/api/demands',
      'POST',
      demand
    );
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveDemand:', err);
    return null;
  }
}

export async function apiDeleteDemand(demandId: string): Promise<boolean> {
  try {
    const res = await diagnosticRequest<{ success: boolean }>(
      'apiDeleteDemand',
      `/api/demands/${encodeURIComponent(demandId)}`,
      'DELETE',
      { demandId }
    );
    return !!res?.success;
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
    return await diagnosticRequest<PurchaseDocument>(
      'apiSavePurchase',
      '/api/purchases',
      'POST',
      purchase
    );
  } catch (err: any) {
    console.error('Unhandled exception in apiSavePurchase:', err);
    return null;
  }
}

export async function apiDeletePurchase(purchaseId: string): Promise<boolean> {
  try {
    const res = await diagnosticRequest<{ success: boolean }>(
      'apiDeletePurchase',
      `/api/purchases/${encodeURIComponent(purchaseId)}`,
      'DELETE',
      { purchaseId }
    );
    return !!res?.success;
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
    return await diagnosticRequest<ChartAccount>(
      'apiSaveChartAccount',
      '/api/accounting/accounts',
      'POST',
      acc
    );
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveChartAccount:', err);
    return null;
  }
}

export async function apiSaveVoucher(voucher: VoucherDocument): Promise<VoucherDocument | null> {
  try {
    return await diagnosticRequest<VoucherDocument>(
      'apiSaveVoucher',
      '/api/accounting/vouchers',
      'POST',
      voucher
    );
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveVoucher:', err);
    return null;
  }
}

export async function apiDeleteVoucher(voucherId: string): Promise<boolean> {
  try {
    const res = await diagnosticRequest<{ success: boolean }>(
      'apiDeleteVoucher',
      `/api/accounting/vouchers/${encodeURIComponent(voucherId)}`,
      'DELETE',
      { voucherId }
    );
    return !!res?.success;
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
    return await diagnosticRequest<CashBookEntry>(
      'apiSaveCashBookEntry',
      '/api/treasury/cash-book',
      'POST',
      entry
    );
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveCashBookEntry:', err);
    return null;
  }
}

export async function apiDeleteCashBookEntry(id: string): Promise<boolean> {
  try {
    const res = await diagnosticRequest<{ success: boolean }>(
      'apiDeleteCashBookEntry',
      `/api/treasury/cash-book/${encodeURIComponent(id)}`,
      'DELETE',
      { id }
    );
    return !!res?.success;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteCashBookEntry:', err);
    return false;
  }
}

export async function apiSaveCreditBookEntry(entry: CreditBookEntry): Promise<CreditBookEntry | null> {
  try {
    return await diagnosticRequest<CreditBookEntry>(
      'apiSaveCreditBookEntry',
      '/api/treasury/credit-book',
      'POST',
      entry
    );
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveCreditBookEntry:', err);
    return null;
  }
}

export async function apiDeleteCreditBookEntry(id: string): Promise<boolean> {
  try {
    const res = await diagnosticRequest<{ success: boolean }>(
      'apiDeleteCreditBookEntry',
      `/api/treasury/credit-book/${encodeURIComponent(id)}`,
      'DELETE',
      { id }
    );
    return !!res?.success;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteCreditBookEntry:', err);
    return false;
  }
}

export async function apiSaveBank(bank: BankRecord): Promise<BankRecord | null> {
  try {
    return await diagnosticRequest<BankRecord>(
      'apiSaveBank',
      '/api/treasury/banks',
      'POST',
      bank
    );
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveBank:', err);
    return null;
  }
}

export async function apiDeleteBank(id: string): Promise<boolean> {
  try {
    const res = await diagnosticRequest<{ success: boolean }>(
      'apiDeleteBank',
      `/api/treasury/banks/${encodeURIComponent(id)}`,
      'DELETE',
      { id }
    );
    return !!res?.success;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteBank:', err);
    return false;
  }
}

export async function apiSaveBankAccount(acc: BankAccountRecord): Promise<BankAccountRecord | null> {
  try {
    return await diagnosticRequest<BankAccountRecord>(
      'apiSaveBankAccount',
      '/api/treasury/bank-accounts',
      'POST',
      acc
    );
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveBankAccount:', err);
    return null;
  }
}

export async function apiDeleteBankAccount(id: string): Promise<boolean> {
  try {
    const res = await diagnosticRequest<{ success: boolean }>(
      'apiDeleteBankAccount',
      `/api/treasury/bank-accounts/${encodeURIComponent(id)}`,
      'DELETE',
      { id }
    );
    return !!res?.success;
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
    return await diagnosticRequest<CompanySettings>(
      'apiSaveCompanySettings',
      '/api/store-sales/company-settings',
      'POST',
      cs
    );
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveCompanySettings:', err);
    return null;
  }
}

export async function apiSaveBuyer(buyer: BuyerRecord): Promise<BuyerRecord | null> {
  try {
    return await diagnosticRequest<BuyerRecord>(
      'apiSaveBuyer',
      '/api/store-sales/buyers',
      'POST',
      buyer
    );
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveBuyer:', err);
    return null;
  }
}

export async function apiDeleteBuyer(id: string): Promise<boolean> {
  try {
    const res = await diagnosticRequest<{ success: boolean }>(
      'apiDeleteBuyer',
      `/api/store-sales/buyers/${encodeURIComponent(id)}`,
      'DELETE',
      { id }
    );
    return !!res?.success;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteBuyer:', err);
    return false;
  }
}

export async function apiSavePartner(partner: PartnerRecord): Promise<PartnerRecord | null> {
  try {
    return await diagnosticRequest<PartnerRecord>(
      'apiSavePartner',
      '/api/store-sales/partners',
      'POST',
      partner
    );
  } catch (err: any) {
    console.error('Unhandled exception in apiSavePartner:', err);
    return null;
  }
}

export async function apiDeletePartner(id: string): Promise<boolean> {
  try {
    const res = await diagnosticRequest<{ success: boolean }>(
      'apiDeletePartner',
      `/api/store-sales/partners/${encodeURIComponent(id)}`,
      'DELETE',
      { id }
    );
    return !!res?.success;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeletePartner:', err);
    return false;
  }
}

export async function apiSavePosCoalSale(sale: PosCoalSellEntry): Promise<PosCoalSellEntry | null> {
  try {
    return await diagnosticRequest<PosCoalSellEntry>(
      'apiSavePosCoalSale',
      '/api/store-sales/pos',
      'POST',
      sale
    );
  } catch (err: any) {
    console.error('Unhandled exception in apiSavePosCoalSale:', err);
    return null;
  }
}

export async function apiDeletePosCoalSale(id: string): Promise<boolean> {
  try {
    const res = await diagnosticRequest<{ success: boolean }>(
      'apiDeletePosCoalSale',
      `/api/store-sales/pos/${encodeURIComponent(id)}`,
      'DELETE',
      { id }
    );
    return !!res?.success;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeletePosCoalSale:', err);
    return false;
  }
}

export async function apiSaveCoalSellRecord(rec: CoalSellRecord): Promise<CoalSellRecord | null> {
  try {
    return await diagnosticRequest<CoalSellRecord>(
      'apiSaveCoalSellRecord',
      '/api/store-sales/coal-records',
      'POST',
      rec
    );
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveCoalSellRecord:', err);
    return null;
  }
}

export async function apiDeleteCoalSellRecord(id: string): Promise<boolean> {
  try {
    const res = await diagnosticRequest<{ success: boolean }>(
      'apiDeleteCoalSellRecord',
      `/api/store-sales/coal-records/${encodeURIComponent(id)}`,
      'DELETE',
      { id }
    );
    return !!res?.success;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteCoalSellRecord:', err);
    return false;
  }
}

export async function apiSaveStockItem(item: StockItem): Promise<StockItem | null> {
  try {
    return await diagnosticRequest<StockItem>(
      'apiSaveStockItem',
      '/api/store-sales/stock-items',
      'POST',
      item
    );
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveStockItem:', err);
    return null;
  }
}

export async function apiDeleteStockItem(id: string): Promise<boolean> {
  try {
    const res = await diagnosticRequest<{ success: boolean }>(
      'apiDeleteStockItem',
      `/api/store-sales/stock-items/${encodeURIComponent(id)}`,
      'DELETE',
      { id }
    );
    return !!res?.success;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteStockItem:', err);
    return false;
  }
}

export async function apiSaveStockEntry(entry: StockEntry): Promise<StockEntry | null> {
  try {
    return await diagnosticRequest<StockEntry>(
      'apiSaveStockEntry',
      '/api/store-sales/stock-entries',
      'POST',
      entry
    );
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveStockEntry:', err);
    return null;
  }
}

export async function apiDeleteStockEntry(id: string): Promise<boolean> {
  try {
    const res = await diagnosticRequest<{ success: boolean }>(
      'apiDeleteStockEntry',
      `/api/store-sales/stock-entries/${encodeURIComponent(id)}`,
      'DELETE',
      { id }
    );
    return !!res?.success;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteStockEntry:', err);
    return false;
  }
}

export async function apiSaveVehicle(veh: VehicleRecord): Promise<VehicleRecord | null> {
  try {
    return await diagnosticRequest<VehicleRecord>(
      'apiSaveVehicle',
      '/api/store-sales/vehicles',
      'POST',
      veh
    );
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveVehicle:', err);
    return null;
  }
}

export async function apiDeleteVehicle(id: string): Promise<boolean> {
  try {
    const res = await diagnosticRequest<{ success: boolean }>(
      'apiDeleteVehicle',
      `/api/store-sales/vehicles/${encodeURIComponent(id)}`,
      'DELETE',
      { id }
    );
    return !!res?.success;
  } catch (err: any) {
    console.error('Unhandled exception in apiDeleteVehicle:', err);
    return false;
  }
}

export async function apiSaveVehicleConsumption(vc: VehicleConsumptionRecord): Promise<VehicleConsumptionRecord | null> {
  try {
    return await diagnosticRequest<VehicleConsumptionRecord>(
      'apiSaveVehicleConsumption',
      '/api/store-sales/consumptions',
      'POST',
      vc
    );
  } catch (err: any) {
    console.error('Unhandled exception in apiSaveVehicleConsumption:', err);
    return null;
  }
}

export async function apiDeleteVehicleConsumption(id: string): Promise<boolean> {
  try {
    const res = await diagnosticRequest<{ success: boolean }>(
      'apiDeleteVehicleConsumption',
      `/api/store-sales/consumptions/${encodeURIComponent(id)}`,
      'DELETE',
      { id }
    );
    return !!res?.success;
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
    const res = await diagnosticRequest<VehicleConsumptionSummary[]>(
      'fetchVehicleConsumptionSummary',
      '/api/reports/vehicle-consumption-summary',
      'GET'
    );
    return res || [];
  } catch (err: any) {
    console.error('Unhandled exception in fetchVehicleConsumptionSummary:', err);
    return [];
  }
}

export async function fetchItemWiseStockSummary(): Promise<ItemWiseStockSummary[]> {
  try {
    const res = await diagnosticRequest<ItemWiseStockSummary[]>(
      'fetchItemWiseStockSummary',
      '/api/reports/item-wise-stock-summary',
      'GET'
    );
    return res || [];
  } catch (err: any) {
    console.error('Unhandled exception in fetchItemWiseStockSummary:', err);
    return [];
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
  try {
    return await diagnosticRequest<DatabaseStatusResponse>(
      'apiCheckDatabaseStatus',
      '/api/database/status',
      'GET'
    );
  } catch (err: any) {
    console.error('Unhandled exception in apiCheckDatabaseStatus:', err);
    return null;
  }
}

export async function apiRunHealthPing(): Promise<{ status: string; time: string } | null> {
  try {
    return await diagnosticRequest<{ status: string; time: string }>(
      'apiRunHealthPing',
      '/api/health',
      'GET'
    );
  } catch (err: any) {
    console.error('Unhandled exception in apiRunHealthPing:', err);
    return null;
  }
}

