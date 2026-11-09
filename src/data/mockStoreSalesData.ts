import type { 
  ItemCategory,
  ItemUnitType,
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
  address: 'Plot 48-A, Industrial Estate, Sariab Road, Quetta, Balochistan',
  ntnNumber: '7412890-3',
  contactNumber: '+92 81 2839401',
  email: 'operations@ahcmminerals.com',
  openingCoalStock: 0,
};

// Item Settings: Default Categories
export const initialItemCategories: ItemCategory[] = [
  { id: 'cat-1', name: 'Fuel & Petroleum', description: 'Diesel, Petrol, and heavy engine fuels' },
  { id: 'cat-2', name: 'Lubricants & Oils', description: 'Motor oil, hydraulic fluid, differential oil' },
  { id: 'cat-3', name: 'Heavy Machinery Spares', description: 'Filters, belts, bucket teeth, hydraulic hoses' },
  { id: 'cat-4', name: 'Explosives & Blasting', description: 'Detonators, safety fuses, ANFO, drill rods' },
  { id: 'cat-5', name: 'Safety Equipment (PPE)', description: 'Helmets, safety boots, gas respirators, lamps' },
];

// Item Settings: Default Unit Types
export const initialItemUnits: ItemUnitType[] = [
  { id: 'unit-1', name: 'Liters', symbol: 'L', description: 'Liquid volume' },
  { id: 'unit-2', name: 'Pieces', symbol: 'Pcs', description: 'Single physical unit' },
  { id: 'unit-3', name: 'Kilograms', symbol: 'kg', description: 'Weight in kilograms' },
  { id: 'unit-4', name: 'Bags', symbol: 'Bags', description: 'Packaging bags' },
  { id: 'unit-5', name: 'Meters', symbol: 'm', description: 'Linear length' },
  { id: 'unit-6', name: 'Drums', symbol: 'Drums', description: '208-liter industrial steel drums' },
];

// Item Settings: Default Mines
export const initialMines: MineRecord[] = [
  { id: 'mine-1', name: 'Mine #01 - North Pit', location: 'Degari Valley, Sector A', incharge: 'Engr. Tariq Khan', status: 'Active' },
  { id: 'mine-2', name: 'Mine #02 - Deep Shaft', location: 'Sor-Range Mountain Ridge', incharge: 'Malik Farooq', status: 'Active' },
  { id: 'mine-3', name: 'Mine #03 - South Adit', location: 'Harnai Sub-basin', incharge: 'Sher Mohammad', status: 'Active' },
];

// Item Settings: Default Vehicles
export const initialVehicles: VehicleRecord[] = [
  { id: 'veh-1', vehicleNo: 'DT-104', vehicleType: 'Dump Truck', driverName: 'Abdul Rasheed', status: 'Active' },
  { id: 'veh-2', vehicleNo: 'CAT-320', vehicleType: 'Excavator', driverName: 'Naseer Ahmed', status: 'Active' },
  { id: 'veh-3', vehicleNo: 'FL-07', vehicleType: 'Front Loader', driverName: 'Mohammad Din', status: 'Active' },
  { id: 'veh-4', vehicleNo: 'GEN-02', vehicleType: 'Heavy Generator', driverName: 'Operator Jahangir', status: 'Active' },
];

// Store Items: Initial inventory catalog
export const initialStoreItems: StoreItem[] = [
  {
    id: 'item-1',
    date: '01-01-2026',
    itemCode: 'ITM-DSL-01',
    itemName: 'High Speed Diesel (HSD)',
    categoryId: 'cat-1',
    categoryName: 'Fuel & Petroleum',
    unitTypeId: 'unit-1',
    unitTypeName: 'Liters',
    unitSymbol: 'L',
    reorderLevel: 500,
    remarks: 'Euro-5 compliant fuel for dump trucks & generators',
  },
  {
    id: 'item-2',
    date: '01-01-2026',
    itemCode: 'ITM-OIL-15W40',
    itemName: 'Engine Motor Oil 15W-40',
    categoryId: 'cat-2',
    categoryName: 'Lubricants & Oils',
    unitTypeId: 'unit-1',
    unitTypeName: 'Liters',
    unitSymbol: 'L',
    reorderLevel: 100,
    remarks: 'Heavy duty diesel engine lubricant',
  },
  {
    id: 'item-3',
    date: '02-01-2026',
    itemCode: 'ITM-FLT-OIL',
    itemName: 'Heavy Oil Filter (Cat/Komatsu)',
    categoryId: 'cat-3',
    categoryName: 'Heavy Machinery Spares',
    unitTypeId: 'unit-2',
    unitTypeName: 'Pieces',
    unitSymbol: 'Pcs',
    reorderLevel: 20,
    remarks: 'Spin-on full flow oil filter',
  },
  {
    id: 'item-4',
    date: '03-01-2026',
    itemCode: 'ITM-EXP-ROD',
    itemName: 'Tungsten Drill Rods 32mm',
    categoryId: 'cat-4',
    categoryName: 'Explosives & Blasting',
    unitTypeId: 'unit-2',
    unitTypeName: 'Pieces',
    unitSymbol: 'Pcs',
    reorderLevel: 15,
    remarks: 'Mine tunnel drilling accessories',
  },
];

// Item Stock Entries
export const initialStockEntries: ItemStockEntry[] = [
  {
    id: 'stk-1',
    date: '02-01-2026',
    itemId: 'item-1',
    itemCode: 'ITM-DSL-01',
    itemName: 'High Speed Diesel (HSD)',
    unit: 'L',
    stockQuantity: 2000,
    purchase: 5000,
    vendorName: 'Pakistan State Oil (PSO)',
    invoiceNo: 'PSO-9921',
    remarks: 'Bulk underground fuel storage refilled',
  },
  {
    id: 'stk-2',
    date: '03-01-2026',
    itemId: 'item-2',
    itemCode: 'ITM-OIL-15W40',
    itemName: 'Engine Motor Oil 15W-40',
    unit: 'L',
    stockQuantity: 200,
    purchase: 600,
    vendorName: 'Shell Lubricants Quetta',
    invoiceNo: 'SH-4412',
    remarks: '3 steel drums received',
  },
  {
    id: 'stk-3',
    date: '04-01-2026',
    itemId: 'item-3',
    itemCode: 'ITM-FLT-OIL',
    itemName: 'Heavy Oil Filter (Cat/Komatsu)',
    unit: 'Pcs',
    stockQuantity: 50,
    purchase: 100,
    vendorName: 'Allied Engineering Spares',
    invoiceNo: 'AES-1082',
    remarks: 'Standard quarterly maintenance pack',
  },
];

// Item Consumption Entries
export const initialItemConsumptions: ItemConsumptionRecord[] = [
  {
    id: 'con-1',
    date: '05-01-2026',
    consumptionType: 'vehicle',
    targetId: 'veh-1',
    targetName: 'DT-104 (Dump Truck)',
    itemId: 'item-1',
    itemCode: 'ITM-DSL-01',
    itemName: 'High Speed Diesel (HSD)',
    unit: 'L',
    quantity: 120,
    operatorName: 'Abdul Rasheed',
    remarks: 'Pithead coal haulage run',
  },
  {
    id: 'con-2',
    date: '05-01-2026',
    consumptionType: 'mine',
    targetId: 'mine-1',
    targetName: 'Mine #01 - North Pit',
    itemId: 'item-1',
    itemCode: 'ITM-DSL-01',
    itemName: 'High Speed Diesel (HSD)',
    unit: 'L',
    quantity: 350,
    operatorName: 'Engr. Tariq Khan',
    remarks: 'Ventilation blower & water dewatering pump generator',
  },
  {
    id: 'con-3',
    date: '06-01-2026',
    consumptionType: 'vehicle',
    targetId: 'veh-2',
    targetName: 'CAT-320 (Excavator)',
    itemId: 'item-2',
    itemCode: 'ITM-OIL-15W40',
    itemName: 'Engine Motor Oil 15W-40',
    unit: 'L',
    quantity: 25,
    operatorName: 'Naseer Ahmed',
    remarks: '500-hour routine oil replacement',
  },
  {
    id: 'con-4',
    date: '06-01-2026',
    consumptionType: 'mine',
    targetId: 'mine-2',
    targetName: 'Mine #02 - Deep Shaft',
    itemId: 'item-1',
    itemCode: 'ITM-DSL-01',
    itemName: 'High Speed Diesel (HSD)',
    unit: 'L',
    quantity: 200,
    operatorName: 'Malik Farooq',
    remarks: 'Shaft hoist engine operation',
  },
];

// Coal Management: Partners
export const initialPartners: PartnerRecord[] = [
  { id: 'part-1', name: 'Quetta Energy Minerals Co.', code: 'QEM', isActive: true, contactPerson: 'Haji Gul Mohammad', phone: '+92 300 9382101', notes: 'Primary mining contractor for Degari blocks' },
  { id: 'part-2', name: 'Chiltan Mining & Extraction', code: 'CME', isActive: true, contactPerson: 'Mir Behram Mengal', phone: '+92 333 7819203', notes: 'Sor-range high-carbon seam extraction' },
  { id: 'part-3', name: 'Zarghoon Coal Resources', code: 'ZCR', isActive: true, contactPerson: 'Arbab Jan', phone: '+92 321 8291044', notes: 'Sub-bituminous steam coal suppliers' },
];

// Coal Management: Buyers
export const initialBuyers: BuyerRecord[] = [
  {
    id: 'buy-1',
    buyerNTN: '3920194-7',
    buyerCNIC: '54400-1928301-3',
    buyerName: 'Fauji Cement Co. Ltd.',
    buyerType: 'Registered',
    saleOrganization: 'Punjab',
    phone: '+92 51 9283741',
    city: 'Rawalpindi',
    address: 'Near Fateh Jang Road, Rawalpindi',
  },
  {
    id: 'buy-2',
    buyerNTN: '4820193-2',
    buyerCNIC: '54401-8392019-1',
    buyerName: 'Lucky Cement Hub Works',
    buyerType: 'Registered',
    saleOrganization: 'Balochistan',
    phone: '+92 853 363201',
    city: 'Hub Chowki',
    address: 'Industrial Area Hub, Lasbela',
  },
  {
    id: 'buy-3',
    buyerNTN: '1092837-5',
    buyerCNIC: '42101-7291028-5',
    buyerName: 'Sindh Industrial Brick Kilns Syndicate',
    buyerType: 'Unregistered',
    saleOrganization: 'Sindh',
    phone: '+92 22 2781920',
    city: 'Hyderabad',
    address: 'Fateh Chowk, Hyderabad',
  },
];

// Coal Stock (Inflow / Production)
export const initialCoalStocks: CoalStockRecord[] = [
  {
    id: 'cstk-1',
    date: '02-01-2026',
    partnerId: 'part-1',
    partnerName: 'Quetta Energy Minerals Co.',
    quantity: 500,
    pitheadLocation: 'Degari Pithead Yard 1',
    vehicleRef: 'DT-104',
    remarks: 'High carbon sub-bituminous seam extraction',
  },
  {
    id: 'cstk-2',
    date: '03-01-2026',
    partnerId: 'part-2',
    partnerName: 'Chiltan Mining & Extraction',
    quantity: 500,
    pitheadLocation: 'Sor-Range Pithead B',
    vehicleRef: 'DT-108',
    remarks: 'Grade A industrial steam coal',
  },
];

// Coal Sell (Outflow / POS Sales)
export const initialCoalSells: CoalSellRecord[] = [
  {
    id: 'csell-1',
    date: '04-01-2026',
    partnerId: 'part-1',
    partnerName: 'Quetta Energy Minerals Co.',
    buyerId: 'buy-1',
    buyerName: 'Fauji Cement Co. Ltd.',
    buyerNTN: '3920194-7',
    buyerCNIC: '54400-1928301-3',
    buyerType: 'Registered',
    saleOrganization: 'Punjab',
    documentType: 'Sales Tax Invoice',
    documentNumber: 'STI-2026-001',
    quantity: 200,
    valueExcludingTax: 3000000,
    salesTaxFed: 540000,
    furtherTax: 90000,
    totalTax: 630000,
    totalValue: 3630000,
    vehicleNo: 'TLR-8812',
    driverName: 'Mohammad Rafique',
    biltyNo: 'BLT-9021',
    remarks: 'Direct dispatch to Rawalpindi works',
  },
];

// Compatibility aliases
export const initialCoalProductionRecords = initialCoalStocks;
export const initialCoalSellRecords = initialCoalSells;
export const initialPosEntries = initialCoalSells;
export const initialStockItems = initialStoreItems;
export const initialVehicleConsumptions = initialItemConsumptions;
