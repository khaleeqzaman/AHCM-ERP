import type { 
  ItemCategory,
  ItemUnitType,
  MachineryType,
  MineRecord,
  VehicleRecord,
  StoreItem,
  ItemStockEntry,
  ItemConsumptionRecord,
  PartnerRecord,
  BuyerRecord,
  CoalStockRecord,
  CoalSellRecord,
  CompanySettings
} from '../types/storeSales.ts';

export const initialCompanySettings: CompanySettings = {
  companyName: 'AHCM Mining & Minerals Corp.',
  address: '',
  ntnNumber: '',
  contactNumber: '',
  email: '',
  openingCoalStock: 0,
};

// Item Settings: Categories (empty by default)
export const initialItemCategories: ItemCategory[] = [];

// Item Settings: Unit Types (empty by default)
export const initialItemUnits: ItemUnitType[] = [];

// Item Settings: Machinery / Equipment Types (standard baseline types)
export const initialMachineryTypes: MachineryType[] = [
  { id: 'mt-1', name: 'Dump Truck', description: 'Heavy Haulage' },
  { id: 'mt-2', name: 'Excavator', description: 'Heavy Excavation' },
  { id: 'mt-3', name: 'Front Loader', description: 'Pithead Stockpile' },
  { id: 'mt-4', name: 'Pickup / Support', description: 'Support Vehicle' },
  { id: 'mt-5', name: 'Heavy Generator', description: 'Heavy Diesel Generator' },
  { id: 'mt-6', name: 'Tunnel Compressor', description: 'Compressor / Drill Rig' },
];

// Item Settings: Mines (empty by default)
export const initialMines: MineRecord[] = [];

// Item Settings: Vehicles (empty by default)
export const initialVehicles: VehicleRecord[] = [];

// Store Items: Inventory catalog (empty by default)
export const initialStoreItems: StoreItem[] = [];

// Item Stock Entries (empty by default)
export const initialStockEntries: ItemStockEntry[] = [];

// Item Consumption Entries (empty by default)
export const initialItemConsumptions: ItemConsumptionRecord[] = [];

// Coal Management: Partners (empty by default)
export const initialPartners: PartnerRecord[] = [];

// Coal Management: Buyers (empty by default)
export const initialBuyers: BuyerRecord[] = [];

// Coal Stock (Inflow / Production) (empty by default)
export const initialCoalStocks: CoalStockRecord[] = [];

// Coal Sell (Outflow / POS Sales) (empty by default)
export const initialCoalSells: CoalSellRecord[] = [];

// Compatibility aliases
export const initialCoalProductionRecords: CoalStockRecord[] = [];
export const initialCoalSellRecords: CoalSellRecord[] = [];
export const initialPosEntries: CoalSellRecord[] = [];
export const initialStockItems: StoreItem[] = [];
export const initialVehicleConsumptions: ItemConsumptionRecord[] = [];
