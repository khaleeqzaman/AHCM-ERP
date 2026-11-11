// =========================================================================
// STORE MANAGEMENT & COAL MANAGEMENT TYPES
// =========================================================================

export type StoreCoalModuleTab = 'store_management' | 'coal_management';

// -------------------------------------------------------------------------
// 1. STORE MANAGEMENT SUB-SECTIONS
// -------------------------------------------------------------------------
export type StoreManagementSection = 
  | 'items' 
  | 'item_stock' 
  | 'item_inventory'
  | 'item_consumption' 
  | 'item_setting' 
  | 'reports';

export type ItemSettingSubTab = 'categories' | 'units';
export type ItemsSubTab = 'add_item' | 'view_items';
export type ItemStockSubTab = 'add_stock' | 'view_stock' | 'stock_report' | 'add_inventory' | 'view_inventory' | 'inventory_report';
export type ItemInventorySubTab = 'add_inventory' | 'view_inventory' | 'inventory_report' | 'add_stock' | 'view_stock' | 'stock_report';
export type ItemConsumptionSubTab = 'add_consumption' | 'view_consumption' | 'consumption_report' | 'vehicles' | 'mines';
export type ItemInventoryEntry = ItemStockEntry;


// Item Settings: Categories
export interface ItemCategory {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

// Item Settings: Measurements Unit Types
export interface ItemUnitType {
  id: string;
  name: string; // e.g., Liters, Pieces, Kilograms, Bags, Meters, Drums
  symbol: string; // e.g., L, Pcs, kg, Bags, m, Dr
  description?: string;
  createdAt?: string;
}

// Item Settings: Mine (linked to Item Consumption)
export interface MineRecord {
  id: string;
  name: string; // e.g., Mine #01 - North Pit, Deep Shaft 02, South Adit
  location?: string;
  incharge?: string;
  status: 'Active' | 'Inactive';
  notes?: string;
  createdAt?: string;
}

// Item Settings: Vehicle (linked to Item Consumption)
export interface VehicleRecord {
  id: string;
  vehicleNo: string;
  vehicleType: string; // Dump Truck, Excavator, Loader, Pickup, Generator, Drill Rig
  driverName: string;
  status: 'Active' | 'Under Maintenance';
  notes?: string;
  createdAt?: string;
}

// Section Items: Item Definition
export interface StoreItem {
  id: string;
  date?: string; // DD-MM-YYYY
  itemCode: string;
  itemName: string;
  categoryId?: string;
  categoryName?: string;
  unitTypeId?: string;
  unitTypeName?: string;
  unitSymbol?: string;
  unit?: string;
  openingStock?: number; // Configurable initial opening balance of the item
  reorderLevel?: number;
  remarks?: string;
  category?: string;
  createdAt?: string;
}

// Section Item Stock: Stock Entry / Inflow
export interface ItemStockEntry {
  id: string;
  srNo?: number;
  date: string; // DD-MM-YYYY
  itemId: string;
  itemCode: string;
  itemName: string;
  unit?: string;
  stockQuantity?: number; // Base / Opening stock quantity
  purchase?: number; // Purchase inflow
  stockQty?: number;
  purchaseQty?: number;
  mineQty?: number;
  vehiclesQty?: number;
  companyName?: string;
  balance?: number;
  vendorName?: string;
  invoiceNo?: string;
  remarks?: string;
  createdAt?: string;
}

// Section Item Consumption: Vehicle Consumption & Mine Consumption
export type ConsumptionTargetType = 'vehicle' | 'mine';

export interface ItemConsumptionRecord {
  id: string;
  srNo?: number;
  date: string; // DD-MM-YYYY
  consumptionType: ConsumptionTargetType;
  targetId: string; // vehicleId or mineId
  targetName: string; // vehicleNo or mineName
  itemId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  quantity: number; // Consumed quantity (decreases item stock)
  meterReading?: string;
  operatorName?: string;
  remarks?: string;
  createdAt?: string;
  [key: string]: any;
}

// -------------------------------------------------------------------------
// 2. COAL MANAGEMENT SUB-SECTIONS
// -------------------------------------------------------------------------
export type CoalManagementSection = 
  | 'coal_stock' 
  | 'coal_sell' 
  | 'partners' 
  | 'buyers';

export type CoalStockSubTab = 'add_coal_stock' | 'view_coal_stock';
export type CoalSellSubTab = 'coal_sell_form' | 'date_wise_report' | 'partner_wise_report';
export type PartnersSubTab = 'add_partner' | 'view_partners';
export type BuyersSubTab = 'add_buyer' | 'view_buyers';

// Partner Management (CRUD)
export interface PartnerRecord {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  contactPerson?: string;
  phone?: string;
  notes?: string;
  showInReport?: boolean;
  createdAt?: string;
}

// Buyer Management (CRUD)
export type BuyerType = 'Registered' | 'Unregistered';
export type SaleProvince = 'Sindh' | 'Punjab' | 'Balochistan' | 'KPK';

export interface BuyerRecord {
  id: string;
  buyerNTN: string;
  buyerCNIC: string;
  buyerName: string;
  buyerType: BuyerType;
  saleOrganization?: SaleProvince | string;
  phone?: string;
  city?: string;
  address?: string;
  createdAt?: string;
}

// Coal Stock (Maintained by user, add, edit, remove)
export interface CoalStockRecord {
  id: string;
  srNo?: number;
  date: string; // DD-MM-YYYY
  partnerId: string;
  partnerName: string;
  quantity: number; // in Tons
  quantityTons?: number;
  pitheadLocation?: string;
  vehicleRef?: string;
  vehicleNo?: string;
  remarks?: string;
  createdAt?: string;
}

// Coal Sell (POS Entry / Invoice)
export interface CoalSellRecord {
  id: string;
  srNo?: number;
  date: string; // DD-MM-YYYY
  partnerId: string;
  partnerName: string;
  buyerId?: string;
  buyerName: string;
  buyerNTN?: string;
  buyerCNIC?: string;
  buyerType: BuyerType;
  saleOrganization: SaleProvince | string;
  documentType: string; // e.g. "Sales Tax Invoice"
  documentNumber: string; // e.g. "STI-2026-001"
  documentDate?: string;
  quantity: number; // in Tons (decreased from coal stock)
  quantityTons?: number;
  valueExcludingTax: number;
  salesTaxFed: number;
  furtherTax: number;
  totalTax: number; // Sales Tax/FED + Further Tax
  totalValue: number; // Value Excl Tax + Total Tax
  vehicleNo?: string;
  driverName?: string;
  biltyNo?: string;
  remarks?: string;
  createdAt?: string;
  [key: string]: any;
}

// Company Settings (kept for company details/header on official prints)
export interface CompanySettings {
  companyName: string;
  address: string;
  ntnNumber: string;
  contactNumber: string;
  email: string;
  openingCoalStock?: number;
}

// Backward compatibility type aliases for older dashboard/API imports
export type StockItem = StoreItem;
export type StockEntry = ItemStockEntry;
export type CoalProductionRecord = CoalStockRecord;
export type PosCoalSellEntry = CoalSellRecord;

export interface VehicleConsumptionRecord {
  id: string;
  srNo?: number;
  date: string;
  vehicleId?: string;
  vehicleNo?: string;
  diesel?: number;
  mOil?: number;
  dOil?: number;
  oFltr?: number;
  dFltr?: number;
  kOil?: number;
  cOil?: number;
  bOil?: number;
  remarks?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface VehicleConsumptionSummary {
  vehicleId?: string;
  vehicleNo?: string;
  vehicleType?: string;
  driverName?: string;
  status?: string;
  totalDiesel?: number;
  totalMOil?: number;
  totalDOil?: number;
  totalOFltr?: number;
  totalDFltr?: number;
  totalKOil?: number;
  totalCOil?: number;
  totalBOil?: number;
  totalEntries?: number;
  logsCount?: number;
  lastDate?: string;
  [key: string]: any;
}

export interface ItemWiseStockSummary {
  id?: string;
  itemId?: string;
  itemCode: string;
  itemName: string;
  category?: string;
  unit?: string;
  totalOpeningStock?: number;
  totalPurchaseQty?: number;
  totalMineQty?: number;
  totalVehiclesQty?: number;
  totalStockQty?: number;
  totalPurchasedQty?: number;
  totalIssuedToMines?: number;
  totalIssuedToVehicles?: number;
  currentBalance: number;
  stockStatus: string;
  entriesCount?: number;
  lastDate?: string;
  [key: string]: any;
}

