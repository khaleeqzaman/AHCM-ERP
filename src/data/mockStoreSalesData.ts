import type { 
  CompanySettings, 
  BuyerRecord, 
  PartnerRecord, 
  PosCoalSellEntry, 
  CoalSellRecord, 
  StockItem, 
  StockEntry, 
  VehicleRecord, 
  VehicleConsumptionRecord 
} from '../types/storeSales.ts';

export const initialCompanySettings: CompanySettings = {
  companyName: 'AHCM Mining & Minerals Corp.',
  address: 'Plot 48-A, Industrial Estate, Sariab Road, Quetta, Balochistan',
  ntnNumber: '',
  contactNumber: '',
  email: '',
};

export const initialBuyers: BuyerRecord[] = [];

export const initialPartners: PartnerRecord[] = [];

export const initialPosEntries: PosCoalSellEntry[] = [];

export const initialCoalSellRecords: CoalSellRecord[] = [];

export const initialStockItems: StockItem[] = [];

export const initialStockEntries: StockEntry[] = [];

export const initialVehicles: VehicleRecord[] = [];

export const initialVehicleConsumptions: VehicleConsumptionRecord[] = [];
