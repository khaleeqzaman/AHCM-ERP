import React, { useState } from 'react';
import { 
  Boxes, 
  ShoppingCart, 
  Package, 
  FileSpreadsheet, 
  Settings as SettingsIcon, 
  Handshake, 
  Users, 
  Truck,
  Building2,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { 
  StoreSalesMainTab,
  SalesSubTab, 
  PosCoalSellEntry, 
  CoalSellRecord, 
  CoalProductionRecord,
  PartnerRecord, 
  BuyerRecord, 
  StockItem, 
  StockEntry, 
  VehicleRecord, 
  VehicleConsumptionRecord, 
  CompanySettings 
} from '../../types/storeSales';
import { NavTarget } from '../../types';
import { formatWholeNumber } from '../../utils/formatters';
import { SalesScreen } from './SalesScreen';
import { StockReportView } from './StockReportView';
import { StoreReportSummaryView } from './StoreReportSummaryView';
import { CompanySettingsView } from './CompanySettingsView';
import { PartnersView } from './PartnersView';
import { BuyersView } from './BuyersView';

interface StoreSalesScreenProps {
  navTarget?: NavTarget | null;
  // Pos & Coal
  posEntries: PosCoalSellEntry[];
  coalSellRecords: CoalSellRecord[];
  coalProductionRecords?: CoalProductionRecord[];
  // Partners & Buyers
  partners: PartnerRecord[];
  buyers: BuyerRecord[];
  // Stock
  stockItems: StockItem[];
  stockEntries: StockEntry[];
  // Vehicle
  vehicles: VehicleRecord[];
  consumptions: VehicleConsumptionRecord[];
  // Company
  companySettings: CompanySettings;

  // Handlers
  onAddProduction?: (record: CoalProductionRecord) => void;
  onUpdateProduction?: (record: CoalProductionRecord) => void;
  onDeleteProduction?: (id: string) => void;

  onAddPosEntry: (entry: PosCoalSellEntry) => void;
  onUpdatePosEntry: (entry: PosCoalSellEntry) => void;
  onDeletePosEntry: (id: string) => void;

  onAddCoalSellRecord: (record: CoalSellRecord) => void;
  onUpdateCoalSellRecord: (record: CoalSellRecord) => void;
  onDeleteCoalSellRecord: (id: string) => void;

  onAddPartner: (partner: PartnerRecord) => void;
  onUpdatePartner: (partner: PartnerRecord) => void;
  onDeletePartner: (id: string) => void;
  onTogglePartnerActive: (id: string) => void;
  onTogglePartnerReportColumn: (id: string) => void;

  onAddBuyer: (buyer: BuyerRecord) => void;
  onUpdateBuyer: (buyer: BuyerRecord) => void;
  onDeleteBuyer: (id: string) => void;

  onAddStockItem: (item: StockItem) => void;
  onUpdateStockItem?: (item: StockItem) => void;
  onDeleteStockItem?: (id: string) => void;
  onAddStockEntry: (entry: StockEntry) => void;
  onUpdateStockEntry: (entry: StockEntry) => void;
  onDeleteStockEntry: (id: string) => void;

  onAddVehicle: (vehicle: VehicleRecord) => void;
  onUpdateVehicle: (vehicle: VehicleRecord) => void;
  onDeleteVehicle: (id: string) => void;
  onAddConsumption: (record: VehicleConsumptionRecord) => void;
  onUpdateConsumption: (record: VehicleConsumptionRecord) => void;
  onDeleteConsumption: (id: string) => void;

  onSaveCompanySettings: (settings: CompanySettings) => void;
  onClearLegacyCoalSales?: () => void;
}

export const StoreSalesScreen: React.FC<StoreSalesScreenProps> = ({
  navTarget,
  posEntries,
  coalSellRecords,
  coalProductionRecords = [],
  partners,
  buyers,
  stockItems,
  stockEntries,
  vehicles,
  consumptions,
  companySettings,
  onAddProduction,
  onUpdateProduction,
  onDeleteProduction,
  onAddPosEntry,
  onUpdatePosEntry,
  onDeletePosEntry,
  onAddCoalSellRecord,
  onUpdateCoalSellRecord,
  onDeleteCoalSellRecord,
  onAddPartner,
  onUpdatePartner,
  onDeletePartner,
  onTogglePartnerActive,
  onTogglePartnerReportColumn,
  onAddBuyer,
  onUpdateBuyer,
  onDeleteBuyer,
  onAddStockItem,
  onUpdateStockItem,
  onDeleteStockItem,
  onAddStockEntry,
  onUpdateStockEntry,
  onDeleteStockEntry,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onAddConsumption,
  onUpdateConsumption,
  onDeleteConsumption,
  onSaveCompanySettings,
  onClearLegacyCoalSales,
}) => {
  const [mainTab, setMainTab] = useState<StoreSalesMainTab>('coal_management');
  const [stockTab, setStockTab] = useState<'view_stock' | 'add_stock' | 'add_item' | 'view_items'>('view_stock');

  // React to navTarget from Sidebar
  React.useEffect(() => {
    if (!navTarget || navTarget.module !== 'store_sales') return;

    if (navTarget.section === 'coal_management' || navTarget.section === 'sale') {
      setMainTab('coal_management');
    } else if (navTarget.section === 'stock_report') {
      if (navTarget.subPage === 'store_summary') {
        setMainTab('store_summary');
      } else {
        setMainTab('stock_report');
        if (['add_item', 'view_items', 'add_stock', 'view_stock'].includes(navTarget.subPage || '')) {
          setStockTab(navTarget.subPage as 'view_stock' | 'add_stock' | 'add_item' | 'view_items');
        }
      }
    } else if (navTarget.section === 'company_setting') {
      setMainTab('company_settings');
    }
  }, [navTarget]);

  const openingCoalStock = (typeof companySettings?.openingCoalStock === 'number' && companySettings.openingCoalStock > 0)
    ? companySettings.openingCoalStock
    : 100;
  const totalProducedTons = coalProductionRecords.reduce((sum, r) => sum + (Number(r.quantityTons) || 0), 0);
  const totalCoalTons = coalSellRecords.reduce((sum, r) => sum + (Number(r.quantityTons) || 0), 0);
  const totalCoalStockGross = totalProducedTons + openingCoalStock;
  const currentCoalStock = Math.max(0, totalCoalStockGross - totalCoalTons);
  const totalPosValue = posEntries.reduce((sum, e) => sum + (Number(e.totalValue) || 0), 0);
  const totalStockItemsCount = stockItems.length;
  const activeVehiclesCount = vehicles.filter((v) => v.status === 'Active').length;

  return (
    <div className="space-y-6">
      {/* Module Banner / Workspace Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Operations & Mining Logistics
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs text-slate-500">Commercial & Inventory Center</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1 flex items-center gap-2.5">
              <Boxes className="w-6 h-6 text-blue-600" />
              <span>Store & Sales Module</span>
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Dedicated, fully isolated workspace for Coal Sales, Point of Sale (POS), Partner Matrices, Store Inventories, and Fleet Maintenance.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs font-medium text-slate-600 flex-wrap">
            <div className="p-2.5 rounded-lg bg-emerald-50/90 border border-emerald-300">
              <span className="text-emerald-800 block text-[11px] font-bold uppercase tracking-wider">Live Coal Stock</span>
              <span className="text-sm font-bold font-mono tabular-nums text-emerald-950">
                {formatWholeNumber(totalCoalStockGross)} Tons
              </span>
              <span className="text-[10px] text-emerald-700 block font-mono">
                Stock + Opening ({formatWholeNumber(totalProducedTons)} + {formatWholeNumber(openingCoalStock)})
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px] font-semibold">Total Produced</span>
              <span className="text-sm font-bold font-mono tabular-nums text-emerald-700">
                {formatWholeNumber(totalProducedTons)} Tons
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px] font-semibold">Total Dispatched / Sold</span>
              <span className="text-sm font-bold font-mono tabular-nums text-blue-700">
                {formatWholeNumber(totalCoalTons)} Tons
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 hidden sm:block">
              <span className="text-blue-700 block text-[11px] font-semibold">POS Gross Sales</span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                PKR {totalPosValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200 hidden md:block">
              <span className="text-teal-700 block text-[11px] font-semibold">Active Fleet</span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                {activeVehiclesCount} Units
              </span>
            </div>
          </div>
        </div>

        {/* Main Module screen Buttons:
            Coal Management, Stock Report, Store Report Summary, Company setting, Partners, Buyers
        */}
        <div className="pt-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Module Sections:
            </span>

            <div className="flex items-center flex-wrap gap-2">
              {/* 1. Coal Management (Special Section) */}
              <button
                type="button"
                id="btn-store-sales-coal-mgmt"
                onClick={() => setMainTab('coal_management')}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                  mainTab === 'coal_management' || mainTab === 'sales'
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Coal Management</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  mainTab === 'coal_management' || mainTab === 'sales' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {formatWholeNumber(totalCoalStockGross)} Tons
                </span>
              </button>

              {/* 2. Stock Report */}
              <button
                type="button"
                id="btn-store-sales-stock"
                onClick={() => setMainTab('stock_report')}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                  mainTab === 'stock_report'
                    ? 'bg-amber-600 text-white ring-2 ring-amber-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Stock Report</span>
              </button>

              {/* 3. Store Report Summary */}
              <button
                type="button"
                id="btn-store-sales-summary"
                onClick={() => setMainTab('store_summary')}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                  mainTab === 'store_summary'
                    ? 'bg-purple-600 text-white ring-2 ring-purple-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Store Report Summary</span>
              </button>

              {/* 4. Company setting */}
              <button
                type="button"
                id="btn-store-sales-company"
                onClick={() => setMainTab('company_settings')}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                  mainTab === 'company_settings'
                    ? 'bg-slate-800 text-white ring-2 ring-slate-800/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <SettingsIcon className="w-3.5 h-3.5" />
                <span>Company setting</span>
              </button>

              {/* 5. Partners */}
              <button
                type="button"
                id="btn-store-sales-partners"
                onClick={() => setMainTab('partners')}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                  mainTab === 'partners'
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Handshake className="w-3.5 h-3.5" />
                <span>Partners</span>
              </button>

              {/* 6. Buyers */}
              <button
                type="button"
                id="btn-store-sales-buyers"
                onClick={() => setMainTab('buyers')}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                  mainTab === 'buyers'
                    ? 'bg-blue-600 text-white ring-2 ring-blue-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Buyers</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Section Content */}
      <div>
        {(mainTab === 'coal_management' || mainTab === 'sales') && (
          <SalesScreen
            navTarget={navTarget}
            productionRecords={coalProductionRecords}
            posEntries={posEntries}
            coalSellRecords={coalSellRecords}
            partners={partners}
            buyers={buyers}
            vehicles={vehicles}
            consumptions={consumptions}
            companySettings={companySettings}
            onAddProduction={onAddProduction}
            onUpdateProduction={onUpdateProduction}
            onDeleteProduction={onDeleteProduction}
            onAddPosEntry={onAddPosEntry}
            onUpdatePosEntry={onUpdatePosEntry}
            onDeletePosEntry={onDeletePosEntry}
            onAddCoalSellRecord={onAddCoalSellRecord}
            onUpdateCoalSellRecord={onUpdateCoalSellRecord}
            onDeleteCoalSellRecord={onDeleteCoalSellRecord}
            onAddPartner={onAddPartner}
            onUpdatePartner={onUpdatePartner}
            onDeletePartner={onDeletePartner}
            onTogglePartnerActive={onTogglePartnerActive}
            onTogglePartnerReportColumn={onTogglePartnerReportColumn}
            onAddBuyer={onAddBuyer}
            onUpdateBuyer={onUpdateBuyer}
            onDeleteBuyer={onDeleteBuyer}
            onAddVehicle={onAddVehicle}
            onUpdateVehicle={onUpdateVehicle}
            onDeleteVehicle={onDeleteVehicle}
            onAddConsumption={onAddConsumption}
            onUpdateConsumption={onUpdateConsumption}
            onDeleteConsumption={onDeleteConsumption}
            onClearLegacyCoalSales={onClearLegacyCoalSales}
            onUpdateCompanySettings={onSaveCompanySettings}
          />
        )}

        {mainTab === 'stock_report' && (
          <StockReportView
            stockItems={stockItems}
            stockEntries={stockEntries}
            initialTab={stockTab}
            onAddItem={onAddStockItem}
            onUpdateItem={onUpdateStockItem}
            onDeleteItem={onDeleteStockItem}
            onAddStockEntry={onAddStockEntry}
            onUpdateStockEntry={onUpdateStockEntry}
            onDeleteStockEntry={onDeleteStockEntry}
          />
        )}

        {mainTab === 'store_summary' && (
          <StoreReportSummaryView
            stockEntries={stockEntries}
            stockItems={stockItems}
            companySettings={companySettings}
          />
        )}

        {mainTab === 'company_settings' && (
          <CompanySettingsView
            settings={companySettings}
            onSaveSettings={onSaveCompanySettings}
          />
        )}

        {mainTab === 'partners' && (
          <PartnersView
            partners={partners}
            onAddPartner={onAddPartner}
            onUpdatePartner={onUpdatePartner}
            onDeletePartner={onDeletePartner}
            onToggleActive={onTogglePartnerActive}
            onToggleShowInReport={onTogglePartnerReportColumn}
          />
        )}

        {mainTab === 'buyers' && (
          <BuyersView
            buyers={buyers}
            onAddBuyer={onAddBuyer}
            onUpdateBuyer={onUpdateBuyer}
            onDeleteBuyer={onDeleteBuyer}
          />
        )}
      </div>
    </div>
  );
};
