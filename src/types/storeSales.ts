export type StoreSalesMainTab = 
  | 'coal_management'
  | 'sales' 
  | 'stock_report' 
  | 'store_summary' 
  | 'company_settings' 
  | 'partners' 
  | 'buyers';

export type CoalManagementSubTab = 
  | 'coal_production'
  | 'record_coal_sell' 
  | 'daily_csr_entries'
  | 'total_csr'
  | 'coal_sales_report' 
  | 'daily_csr'
  | 'partners' 
  | 'buyers' 
  | 'vehicle';

export type SalesSubTab = CoalManagementSubTab;

// Coal Production & Daily Stock
export interface CoalProductionRecord {
  id: string;
  srNo?: number;
  date: string; // DD-MM-YYYY
  partnerId: string;
  partnerName: string;
  quantityTons: number; // Mined / Produced coal added to stock (in tons)
  pitheadLocation?: string;
  vehicleNo?: string;
  remarks?: string;
  createdAt?: string;
}

// Company Settings
export interface CompanySettings {
  companyName: string;
  address: string;
  ntnNumber: string;
  contactNumber: string;
  email: string;
  openingCoalStock?: number; // Initial pithead reserve in tons (independent of store items)
}

// Buyer
export type BuyerType = 'Registered' | 'Unregistered' | 'Wholesaler' | 'Corporate' | 'Retailer';

export interface BuyerRecord {
  id: string;
  buyerNTN: string;
  buyerCNIC: string;
  buyerName: string;
  buyerType: BuyerType;
  phone?: string;
  city?: string;
}

// Partner (for coal sales and partner columns)
export interface PartnerRecord {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  showInReport: boolean;
  notes?: string;
}

// POS Coal Sell Entry
export interface PosCoalSellEntry {
  id: string;
  srNo: number;
  partnerId?: string;
  partnerName?: string;
  buyerId: string;
  buyerNTN: string;
  buyerCNIC: string;
  buyerName: string;
  buyerType: BuyerType;
  saleOrganization: string; // Province of supplier
  documentType: string;
  documentNumber: string;
  documentDate: string; // DD-MM-YYYY
  quantity: number; // In tons / units
  valueExcludingTax: number;
  salesTaxFed: number;
  furtherTax: number;
  totalTax: number; // salesTaxFed + furtherTax
  totalValue: number; // valueExcludingTax + salesTaxFed + furtherTax
}

// Record Coal Sell Entry
export interface CoalSellRecord {
  id: string;
  date: string; // DD-MM-YYYY
  partnerId: string;
  partnerName: string;
  quantityTons: number;
  buyerId?: string;
  buyerNTN?: string;
  buyerCNIC?: string;
  buyerName?: string;
  buyerType?: BuyerType;
  saleOrganization?: string;
  documentType?: string;
  documentNumber?: string;
  documentDate?: string;
  valueExcludingTax?: number;
  salesTaxFed?: number;
  furtherTax?: number;
  totalTax?: number;
  totalValue?: number;
  vehicleNo?: string;
  remarks?: string;
}

// Daily CSR Aggregated Record for each date
export interface DailyCsrDayRecord {
  srNo: number;
  date: string;
  totalTons: number;
  entriesCount: number;
  partnerWiseTons: { [partnerName: string]: number };
  entries: PosCoalSellEntry[];
}

// Stock Item definition
export interface StockItem {
  id: string;
  itemCode: string;
  itemName: string;
  category?: string;
  unit: string;
}

// Stock Transaction / Entry
export interface StockEntry {
  id: string;
  srNo: number;
  date: string; // DD-MM-YYYY
  itemId: string;
  itemName: string;
  itemCode: string;
  stockQty: number; // Opening stock quantity
  purchaseQty: number;
  mineQty: number;
  vehiclesQty: number;
  companyName: string;
  balance: number; // (stockQty + purchaseQty) - (mineQty + vehiclesQty)
}

// Vehicle Definition
export interface VehicleRecord {
  id: string;
  vehicleNo: string;
  driverName: string;
  vehicleType: string; // Dump Truck, Excavator, Loader, Pickup, Generator
  status: 'Active' | 'Under Maintenance';
}

// Vehicle Wise Consumption
export interface VehicleConsumptionRecord {
  id: string;
  srNo: number;
  vehicleId: string;
  vehicleNo: string;
  date: string; // DD-MM-YYYY
  diesel: number;
  mOil: number; // Motor Oil
  dOil: number; // Differential Oil
  oFltr: number; // Oil Filter
  dFltr: number; // Diesel Filter
  kOil: number; // Kerosene Oil
  cOil: number; // Coolant / Compressor Oil
  bOil: number; // Brake Oil
  remarks?: string;
}

// Executive Dashboard Summaries
export interface VehicleConsumptionSummary {
  vehicleId: string;
  vehicleNo: string;
  vehicleType: string;
  driverName: string;
  status: string;
  totalDiesel: number;
  totalMOil: number;
  totalDOil: number;
  totalOFltr: number;
  totalDFltr: number;
  totalKOil: number;
  totalCOil: number;
  totalBOil: number;
  logsCount: number;
  lastDate?: string;
}

export interface ItemWiseStockSummary {
  itemId: string;
  itemCode: string;
  itemName: string;
  category: string;
  unit: string;
  totalOpeningStock: number;
  totalPurchaseQty: number;
  totalMineQty: number;
  totalVehiclesQty: number;
  currentBalance: number;
  entriesCount: number;
  lastDate?: string;
  stockStatus: 'In Stock' | 'Low Stock' | 'Critical';
}
