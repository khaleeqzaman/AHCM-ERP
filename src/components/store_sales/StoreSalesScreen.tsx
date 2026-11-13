import React, { useState } from 'react';
import { 
  Building2, 
  Boxes, 
  Pickaxe, 
  Tag, 
  Layers, 
  Fuel, 
  Sliders, 
  BarChart3, 
  Database, 
  Receipt, 
  Handshake, 
  Factory 
} from 'lucide-react';
import type {
  StoreCoalModuleTab,
  StoreManagementSection,
  CoalManagementSection,
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
} from '../../types/storeSales.ts';

import ItemsView from './ItemsView.tsx';
import ItemStockView from './ItemStockView.tsx';
import ItemConsumptionView from './ItemConsumptionView.tsx';
import ItemSettingsView from './ItemSettingsView.tsx';
import StoreReportsView from './StoreReportsView.tsx';

import CoalStockView from './CoalStockView.tsx';
import CoalSellView from './CoalSellView.tsx';
import PartnersManagementView from './PartnersManagementView.tsx';
import BuyerManagementView from './BuyerManagementView.tsx';

interface StoreSalesScreenProps {
  // Store Management Data
  categories: ItemCategory[];
  unitTypes: ItemUnitType[];
  machineryTypes?: MachineryType[];
  mines: MineRecord[];
  vehicles: VehicleRecord[];
  items: StoreItem[];
  stockEntries: ItemStockEntry[];
  consumptions: ItemConsumptionRecord[];

  // Coal Management Data
  partners: PartnerRecord[];
  buyers: BuyerRecord[];
  coalStocks: CoalStockRecord[];
  coalSells: CoalSellRecord[];
  companySettings: CompanySettings;

  // Store Management Handlers
  onAddCategory: (cat: Omit<ItemCategory, 'id' | 'createdAt'>) => void;
  onUpdateCategory: (cat: ItemCategory) => void;
  onDeleteCategory: (id: string) => void;

  onAddUnitType: (unit: Omit<ItemUnitType, 'id' | 'createdAt'>) => void;
  onUpdateUnitType: (unit: ItemUnitType) => void;
  onDeleteUnitType: (id: string) => void;

  onAddMachineryType?: (mt: Omit<MachineryType, 'id' | 'createdAt'>) => void;
  onUpdateMachineryType?: (mt: MachineryType) => void;
  onDeleteMachineryType?: (id: string) => void;

  onAddMine: (mine: Omit<MineRecord, 'id' | 'createdAt'>) => void;
  onUpdateMine: (mine: MineRecord) => void;
  onDeleteMine: (id: string) => void;

  onAddVehicle: (veh: Omit<VehicleRecord, 'id' | 'createdAt'>) => void;
  onUpdateVehicle: (veh: VehicleRecord) => void;
  onDeleteVehicle: (id: string) => void;

  onAddItem: (item: Omit<StoreItem, 'id' | 'createdAt'>) => void;
  onUpdateItem: (item: StoreItem) => void;
  onDeleteItem: (id: string) => void;

  onAddStockEntry: (entry: any) => void;
  onUpdateStockEntry?: (entry: any) => void;
  onDeleteStockEntry?: (id: string) => void;
  onAddConsumption: (record: any) => void;
  onUpdateConsumption?: (record: any) => void;
  onDeleteConsumption?: (id: string) => void;

  // Coal Management Handlers
  onAddCoalStock: (stock: any) => void;
  onUpdateCoalStock: (stock: CoalStockRecord) => void;
  onDeleteCoalStock: (id: string) => void;

  onAddCoalSell: (sell: any) => void;
  onUpdateCoalSell: (sell: CoalSellRecord) => void;
  onDeleteCoalSell: (id: string) => void;

  onAddPartner: (partner: Omit<PartnerRecord, 'id' | 'createdAt'>) => void;
  onUpdatePartner: (partner: PartnerRecord) => void;
  onDeletePartner: (id: string) => void;

  onAddBuyer: (buyer: Omit<BuyerRecord, 'id' | 'createdAt'>) => void;
  onUpdateBuyer: (buyer: BuyerRecord) => void;
  onDeleteBuyer: (id: string) => void;

  onUpdateCompanySettings: (settings: CompanySettings) => void;

  navTarget?: { module: string; section?: string; subPage?: string; action?: string; timestamp?: number } | null;
  initialModuleTab?: StoreCoalModuleTab;
  initialStoreSection?: StoreManagementSection;
  initialCoalSection?: CoalManagementSection;
}

export const StoreSalesScreen: React.FC<StoreSalesScreenProps> = ({
  categories,
  unitTypes,
  machineryTypes = [],
  mines,
  vehicles,
  items,
  stockEntries,
  consumptions,
  partners,
  buyers,
  coalStocks,
  coalSells,
  companySettings,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddUnitType,
  onUpdateUnitType,
  onDeleteUnitType,
  onAddMachineryType,
  onUpdateMachineryType,
  onDeleteMachineryType,
  onAddMine,
  onUpdateMine,
  onDeleteMine,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onAddStockEntry,
  onUpdateStockEntry,
  onDeleteStockEntry,
  onAddConsumption,
  onUpdateConsumption,
  onDeleteConsumption,
  onAddCoalStock,
  onUpdateCoalStock,
  onDeleteCoalStock,
  onAddCoalSell,
  onUpdateCoalSell,
  onDeleteCoalSell,
  onAddPartner,
  onUpdatePartner,
  onDeletePartner,
  onAddBuyer,
  onUpdateBuyer,
  onDeleteBuyer,
  onUpdateCompanySettings,
  navTarget,
  initialModuleTab = 'store_management',
  initialStoreSection = 'items',
  initialCoalSection = 'coal_stock',
}) => {
  // Main Module Toggle: STORE MANAGEMENT vs COAL MANAGEMENT
  const [mainTab, setMainTab] = useState<StoreCoalModuleTab>(initialModuleTab);

  // Sub-sections
  const [storeSection, setStoreSection] = useState<StoreManagementSection>(initialStoreSection);
  const [coalSection, setCoalSection] = useState<CoalManagementSection>(initialCoalSection);

  // Respond to navTarget from Sidebar
  React.useEffect(() => {
    if (!navTarget || navTarget.module !== 'store_sales') return;

    if (navTarget.section === 'store_management') {
      setMainTab('store_management');
      if (['items', 'item_stock', 'item_inventory', 'item_consumption', 'item_setting', 'reports'].includes(navTarget.subPage || '')) {
        const targetSec = navTarget.subPage === 'item_inventory' ? 'item_stock' : navTarget.subPage as StoreManagementSection;
        setStoreSection(targetSec);
      }
    } else if (navTarget.section === 'coal_management' || navTarget.section === 'sale') {
      setMainTab('coal_management');
      if (navTarget.subPage === 'coal_sell' || navTarget.subPage === 'record_coal_sell' || navTarget.subPage === 'daily_csr_entries' || navTarget.subPage === 'total_csr') {
        setCoalSection('coal_sell');
      } else if (navTarget.subPage === 'partners' || navTarget.subPage === 'add_partner' || navTarget.subPage === 'view_partners') {
        setCoalSection('partners');
      } else if (navTarget.subPage === 'buyers' || navTarget.subPage === 'add_buyer' || navTarget.subPage === 'view_buyers') {
        setCoalSection('buyers');
      } else {
        setCoalSection('coal_stock');
      }
    } else if (navTarget.section === 'stock_report' || navTarget.section === 'inventory_report') {
      setMainTab('store_management');
      if (navTarget.subPage === 'add_item' || navTarget.subPage === 'view_items') {
        setStoreSection('items');
      } else if (navTarget.subPage === 'add_stock' || navTarget.subPage === 'view_stock' || navTarget.subPage === 'add_inventory' || navTarget.subPage === 'view_inventory') {
        setStoreSection('item_stock');
      } else {
        setStoreSection('reports');
      }
    }
  }, [navTarget]);

  // Calculate live coal stock for high-level banner
  const openingCoal = Number(companySettings.openingCoalStock || 0);
  const totalCoalInflow = coalStocks.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
  const totalCoalSold = coalSells.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
  const liveCoalBalance = (openingCoal + totalCoalInflow) - totalCoalSold;

  // Compute live item inventory map (strictly inventory additions minus consumptions)
  const itemStockMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((it) => {
      const itStock = stockEntries.filter((s) => s.itemId === it.id || (s.itemCode && s.itemCode === it.itemCode));
      const stockQty = itStock.reduce((sum, s) => sum + Number(s.stockQuantity || s.stockQty || 0), 0);
      const itConsumptions = consumptions.filter((c) => c.itemId === it.id || (c.itemCode && c.itemCode === it.itemCode));
      const used = itConsumptions.reduce((sum, c) => sum + Number(c.quantity || 0), 0);
      map[it.id] = stockQty - used;
    });
    return map;
  }, [items, stockEntries, consumptions]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header / Primary Module Selector */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <Factory className="w-7 h-7 text-emerald-700 shrink-0" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {mainTab === 'store_management' ? 'STORE MANAGEMENT' : 'COAL MANAGEMENT'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {mainTab === 'store_management'
              ? 'Catalog items, inventory inflows, vehicle & mine consumptions, unit settings and audit reports.'
              : 'Coal production & stock logs, POS invoicing (strictly in Tons), partner extraction and buyer profiles.'}
          </p>
        </div>

        {/* Big Dual Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setMainTab('store_management')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              mainTab === 'store_management'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4 shrink-0 text-emerald-700" />
            <span>STORE MANAGEMENT</span>
          </button>
          <button
            onClick={() => setMainTab('coal_management')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              mainTab === 'coal_management'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pickaxe className="w-4 h-4 shrink-0" />
            <span>COAL MANAGEMENT</span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-700 text-emerald-100 font-mono">
              {liveCoalBalance.toLocaleString()} Tons
            </span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 1. STORE MANAGEMENT SUB-NAVIGATION & SECTIONS                     */}
      {/* ----------------------------------------------------------------- */}
      {mainTab === 'store_management' && (
        <div className="space-y-6">
          {/* Section Navigation Pills */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setStoreSection('items')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors ${
                storeSection === 'items'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Tag className="w-3.5 h-3.5 shrink-0" />
              <span>Items ({items.length})</span>
            </button>

            <button
              onClick={() => setStoreSection('item_stock')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors ${
                storeSection === 'item_stock' || (storeSection as string) === 'item_inventory'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Item Inventory ({stockEntries.length})</span>
            </button>

            <button
              onClick={() => setStoreSection('item_consumption')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors ${
                storeSection === 'item_consumption'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Fuel className="w-3.5 h-3.5 shrink-0" />
              <span>Item Consumption ({consumptions.length})</span>
            </button>

            <button
              onClick={() => setStoreSection('item_setting')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors ${
                storeSection === 'item_setting'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span>Item Settings</span>
            </button>

            <button
              onClick={() => setStoreSection('reports')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors ${
                storeSection === 'reports'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span>Reports</span>
            </button>
          </div>

          {/* Section View Routing */}
          {storeSection === 'items' && (
            <ItemsView
              items={items}
              categories={categories}
              unitTypes={unitTypes}
              itemStockMap={itemStockMap}
              onAddItem={onAddItem}
              onUpdateItem={onUpdateItem}
              onDeleteItem={onDeleteItem}
            />
          )}

          {(storeSection === 'item_stock' || (storeSection as string) === 'item_inventory') && (
            <ItemStockView
              stockEntries={stockEntries}
              items={items}
              consumptions={consumptions}
              mines={mines}
              onAddStockEntry={onAddStockEntry}
              onUpdateStockEntry={onUpdateStockEntry || (() => {})}
              onDeleteStockEntry={onDeleteStockEntry || (() => {})}
              onUpdateItem={onUpdateItem}
            />
          )}

          {storeSection === 'item_consumption' && (
            <ItemConsumptionView
              consumptions={consumptions}
              stockEntries={stockEntries}
              items={items}
              mines={mines}
              vehicles={vehicles}
              machineryTypes={machineryTypes}
              itemStockMap={itemStockMap}
              onAddConsumption={onAddConsumption}
              onUpdateConsumption={onUpdateConsumption || (() => {})}
              onDeleteConsumption={onDeleteConsumption || (() => {})}
              onAddMine={onAddMine}
              onUpdateMine={onUpdateMine}
              onDeleteMine={onDeleteMine}
              onAddVehicle={onAddVehicle}
              onUpdateVehicle={onUpdateVehicle}
              onDeleteVehicle={onDeleteVehicle}
            />
          )}

          {storeSection === 'item_setting' && (
            <ItemSettingsView
              categories={categories}
              unitTypes={unitTypes}
              machineryTypes={machineryTypes}
              onAddCategory={onAddCategory}
              onUpdateCategory={onUpdateCategory}
              onDeleteCategory={onDeleteCategory}
              onAddUnit={onAddUnitType}
              onUpdateUnit={onUpdateUnitType}
              onDeleteUnit={onDeleteUnitType}
              onAddMachineryType={onAddMachineryType}
              onUpdateMachineryType={onUpdateMachineryType}
              onDeleteMachineryType={onDeleteMachineryType}
            />
          )}

          {storeSection === 'reports' && (
            <StoreReportsView
              items={items}
              stockEntries={stockEntries}
              consumptions={consumptions}
              mines={mines}
              vehicles={vehicles}
              categories={categories}
            />
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 2. COAL MANAGEMENT SUB-NAVIGATION & SECTIONS                      */}
      {/* ----------------------------------------------------------------- */}
      {mainTab === 'coal_management' && (
        <div className="space-y-6">
          {/* Section Navigation Pills */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setCoalSection('coal_stock')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors ${
                coalSection === 'coal_stock'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span>Coal Stock ({coalStocks.length})</span>
            </button>

            <button
              onClick={() => setCoalSection('coal_sell')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors ${
                coalSection === 'coal_sell'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 shrink-0" />
              <span>Coal Sell & POS Invoices ({coalSells.length})</span>
            </button>

            <button
              onClick={() => setCoalSection('partners')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors ${
                coalSection === 'partners'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Handshake className="w-3.5 h-3.5 shrink-0" />
              <span>Partner Management ({partners.length})</span>
            </button>

            <button
              onClick={() => setCoalSection('buyers')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors ${
                coalSection === 'buyers'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span>Buyer Management ({buyers.length})</span>
            </button>
          </div>

          {/* Coal Section View Routing */}
          {coalSection === 'coal_stock' && (
            <CoalStockView
              coalStocks={coalStocks}
              partners={partners}
              coalSells={coalSells}
              companySettings={companySettings}
              onAddCoalStock={onAddCoalStock}
              onUpdateCoalStock={onUpdateCoalStock}
              onDeleteCoalStock={onDeleteCoalStock}
              onUpdateCompanySettings={onUpdateCompanySettings}
            />
          )}

          {coalSection === 'coal_sell' && (
            <CoalSellView
              coalSells={coalSells}
              coalStocks={coalStocks}
              partners={partners}
              buyers={buyers}
              companySettings={companySettings}
              onAddCoalSell={onAddCoalSell}
              onUpdateCoalSell={onUpdateCoalSell}
              onDeleteCoalSell={onDeleteCoalSell}
            />
          )}

          {coalSection === 'partners' && (
            <PartnersManagementView
              partners={partners}
              coalStocks={coalStocks}
              coalSells={coalSells}
              onAddPartner={onAddPartner}
              onUpdatePartner={onUpdatePartner}
              onDeletePartner={onDeletePartner}
            />
          )}

          {coalSection === 'buyers' && (
            <BuyerManagementView
              buyers={buyers}
              coalSells={coalSells}
              onAddBuyer={onAddBuyer}
              onUpdateBuyer={onUpdateBuyer}
              onDeleteBuyer={onDeleteBuyer}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default StoreSalesScreen;
