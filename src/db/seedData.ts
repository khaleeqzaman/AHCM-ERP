import type { DemandDocument, PurchaseDocument } from '../types/index.ts';
import type { VoucherDocument } from '../types/accounting.ts';
import type { CashBookEntry, CreditBookEntry, BankRecord, BankAccountRecord } from '../types/treasury.ts';
import type { 
  BuyerRecord, 
  PartnerRecord, 
  PosCoalSellEntry, 
  CoalSellRecord, 
  StockItem, 
  StockEntry, 
  VehicleRecord, 
  VehicleConsumptionRecord 
} from '../types/storeSales.ts';

export const baselineDemands: DemandDocument[] = [];
export const baselinePurchases: PurchaseDocument[] = [];
export const baselineBanks: BankRecord[] = [];
export const baselineBankAccounts: BankAccountRecord[] = [];
export const baselineCashBookEntries: CashBookEntry[] = [];
export const baselineCreditBookEntries: CreditBookEntry[] = [];
export const baselineVouchers: VoucherDocument[] = [];
export const baselinePartners: PartnerRecord[] = [];
export const baselineBuyers: BuyerRecord[] = [];
export const baselineVehicles: VehicleRecord[] = [];
export const baselineVehicleConsumptions: VehicleConsumptionRecord[] = [];
export const baselineStockItems: StockItem[] = [];
export const baselineStockEntries: StockEntry[] = [];
export const baselinePosCoalSales: PosCoalSellEntry[] = [];
export const baselineCoalSellRecords: CoalSellRecord[] = [];
