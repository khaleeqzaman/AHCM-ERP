import { User } from '../types/user';
import { DemandDocument, PurchaseDocument } from '../types';
import { ChartAccount, VoucherDocument } from '../types/accounting';
import { CashBookEntry, CreditBookEntry, BankRecord, BankAccountRecord } from '../types/treasury';
import {
  CompanySettings,
  BuyerRecord,
  PartnerRecord,
  PosCoalSellEntry,
  CoalSellRecord,
  StockItem,
  StockEntry,
  VehicleRecord,
  VehicleConsumptionRecord,
} from '../types/storeSales';

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
}

const request = async <T>(url: string, options?: RequestInit): Promise<T | null> => {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`API request to ${url} failed with status ${res.status}:`, errText);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`Network error during API request to ${url}:`, err);
    return null;
  }
};

export async function fetchBootstrapData(): Promise<BootstrapData | null> {
  return request<BootstrapData>('/api/bootstrap');
}

// Users
export async function apiSaveUser(user: User): Promise<User | null> {
  return request<User>('/api/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });
}

export async function apiDeleteUser(userId: string): Promise<boolean> {
  const res = await request<{ success: boolean }>(`/api/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
  return !!res?.success;
}

// Demands
export async function apiSaveDemand(demand: DemandDocument): Promise<DemandDocument | null> {
  return request<DemandDocument>('/api/demands', {
    method: 'POST',
    body: JSON.stringify(demand),
  });
}

export async function apiDeleteDemand(demandId: string): Promise<boolean> {
  const res = await request<{ success: boolean }>(`/api/demands/${encodeURIComponent(demandId)}`, {
    method: 'DELETE',
  });
  return !!res?.success;
}

// Purchases
export async function apiSavePurchase(purchase: PurchaseDocument): Promise<PurchaseDocument | null> {
  return request<PurchaseDocument>('/api/purchases', {
    method: 'POST',
    body: JSON.stringify(purchase),
  });
}

export async function apiDeletePurchase(purchaseId: string): Promise<boolean> {
  const res = await request<{ success: boolean }>(`/api/purchases/${encodeURIComponent(purchaseId)}`, {
    method: 'DELETE',
  });
  return !!res?.success;
}

// Accounts & Vouchers
export async function apiSaveChartAccount(acc: ChartAccount): Promise<ChartAccount | null> {
  return request<ChartAccount>('/api/accounting/accounts', {
    method: 'POST',
    body: JSON.stringify(acc),
  });
}

export async function apiSaveVoucher(voucher: VoucherDocument): Promise<VoucherDocument | null> {
  return request<VoucherDocument>('/api/accounting/vouchers', {
    method: 'POST',
    body: JSON.stringify(voucher),
  });
}

// Treasury
export async function apiSaveCashBookEntry(entry: CashBookEntry): Promise<CashBookEntry | null> {
  return request<CashBookEntry>('/api/treasury/cash-book', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

export async function apiDeleteCashBookEntry(id: string): Promise<boolean> {
  const res = await request<{ success: boolean }>(`/api/treasury/cash-book/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return !!res?.success;
}

export async function apiSaveCreditBookEntry(entry: CreditBookEntry): Promise<CreditBookEntry | null> {
  return request<CreditBookEntry>('/api/treasury/credit-book', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

export async function apiDeleteCreditBookEntry(id: string): Promise<boolean> {
  const res = await request<{ success: boolean }>(`/api/treasury/credit-book/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return !!res?.success;
}

export async function apiSaveBank(bank: BankRecord): Promise<BankRecord | null> {
  return request<BankRecord>('/api/treasury/banks', {
    method: 'POST',
    body: JSON.stringify(bank),
  });
}

export async function apiDeleteBank(id: string): Promise<boolean> {
  const res = await request<{ success: boolean }>(`/api/treasury/banks/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return !!res?.success;
}

export async function apiSaveBankAccount(acc: BankAccountRecord): Promise<BankAccountRecord | null> {
  return request<BankAccountRecord>('/api/treasury/bank-accounts', {
    method: 'POST',
    body: JSON.stringify(acc),
  });
}

export async function apiDeleteBankAccount(id: string): Promise<boolean> {
  const res = await request<{ success: boolean }>(`/api/treasury/bank-accounts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return !!res?.success;
}

// Store & Sales
export async function apiSaveCompanySettings(cs: CompanySettings): Promise<CompanySettings | null> {
  return request<CompanySettings>('/api/store-sales/company-settings', {
    method: 'POST',
    body: JSON.stringify(cs),
  });
}

export async function apiSaveBuyer(buyer: BuyerRecord): Promise<BuyerRecord | null> {
  return request<BuyerRecord>('/api/store-sales/buyers', {
    method: 'POST',
    body: JSON.stringify(buyer),
  });
}

export async function apiDeleteBuyer(id: string): Promise<boolean> {
  const res = await request<{ success: boolean }>(`/api/store-sales/buyers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return !!res?.success;
}

export async function apiSavePartner(partner: PartnerRecord): Promise<PartnerRecord | null> {
  return request<PartnerRecord>('/api/store-sales/partners', {
    method: 'POST',
    body: JSON.stringify(partner),
  });
}

export async function apiDeletePartner(id: string): Promise<boolean> {
  const res = await request<{ success: boolean }>(`/api/store-sales/partners/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return !!res?.success;
}

export async function apiSavePosCoalSale(sale: PosCoalSellEntry): Promise<PosCoalSellEntry | null> {
  return request<PosCoalSellEntry>('/api/store-sales/pos', {
    method: 'POST',
    body: JSON.stringify(sale),
  });
}

export async function apiDeletePosCoalSale(id: string): Promise<boolean> {
  const res = await request<{ success: boolean }>(`/api/store-sales/pos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return !!res?.success;
}

export async function apiSaveCoalSellRecord(rec: CoalSellRecord): Promise<CoalSellRecord | null> {
  return request<CoalSellRecord>('/api/store-sales/coal-records', {
    method: 'POST',
    body: JSON.stringify(rec),
  });
}

export async function apiDeleteCoalSellRecord(id: string): Promise<boolean> {
  const res = await request<{ success: boolean }>(`/api/store-sales/coal-records/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return !!res?.success;
}

export async function apiSaveStockItem(item: StockItem): Promise<StockItem | null> {
  return request<StockItem>('/api/store-sales/stock-items', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function apiSaveStockEntry(entry: StockEntry): Promise<StockEntry | null> {
  return request<StockEntry>('/api/store-sales/stock-entries', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

export async function apiDeleteStockEntry(id: string): Promise<boolean> {
  const res = await request<{ success: boolean }>(`/api/store-sales/stock-entries/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return !!res?.success;
}

export async function apiSaveVehicle(veh: VehicleRecord): Promise<VehicleRecord | null> {
  return request<VehicleRecord>('/api/store-sales/vehicles', {
    method: 'POST',
    body: JSON.stringify(veh),
  });
}

export async function apiDeleteVehicle(id: string): Promise<boolean> {
  const res = await request<{ success: boolean }>(`/api/store-sales/vehicles/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return !!res?.success;
}

export async function apiSaveVehicleConsumption(vc: VehicleConsumptionRecord): Promise<VehicleConsumptionRecord | null> {
  return request<VehicleConsumptionRecord>('/api/store-sales/consumptions', {
    method: 'POST',
    body: JSON.stringify(vc),
  });
}

export async function apiDeleteVehicleConsumption(id: string): Promise<boolean> {
  const res = await request<{ success: boolean }>(`/api/store-sales/consumptions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return !!res?.success;
}
