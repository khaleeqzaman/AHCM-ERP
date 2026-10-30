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
  PartnerRecord, 
  BuyerRecord, 
  StockItem, 
  StockEntry, 
  VehicleRecord, 
  VehicleConsumptionRecord, 
  CompanySettings 
} from '../../types/storeSales';
import { SalesScreen } from './SalesScreen';
import { StockReportView } from './StockReportView';
import { StoreReportSummaryView } from './StoreReportSummaryView';
import { CompanySettingsView } from './CompanySettingsView';
import { PartnersView } from './PartnersView';
import { BuyersView } from './BuyersView';

interface StoreSalesScreenProps {
  // Pos & Coal
  posEntries: PosCoalSellEntry[];
  coalSellRecords: CoalSellRecord[];
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
}

export const StoreSalesScreen: React.FC<StoreSalesScreenProps> = ({
  posEntries,
  coalSellRecords,
  partners,
  buyers,
  stockItems,
  stockEntries,
  vehicles,
  consumptions,
  companySettings,
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
}) => {
  const [mainTab, setMainTab] = useState<StoreSalesMainTab>('sales');

  // Overall KPI stats for isolated store & sales module
  const totalPosValue = posEntries.reduce((sum, e) => sum + (Number(e.totalValue) || 0), 0);
  const totalCoalTons = coalSellRecords.reduce((sum, r) => sum + (Number(r.quantityTons) || 0), 0);
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

          {/* Quick Metrics (Zero $ symbols) */}
          <div className="flex items-center gap-3 text-xs font-medium text-slate-600 flex-wrap">
            <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200">
              <span className="text-blue-700 block text-[11px] font-semibold">POS Gross Sales</span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                {totalPosValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
              <span className="text-emerald-700 block text-[11px] font-semibold">Dispatched Coal (Tons)</span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                {totalCoalTons.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 hidden sm:block">
              <span className="text-amber-700 block text-[11px] font-semibold">Store Catalog</span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                {totalStockItemsCount} Items
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
            Sales, Stock Report, Store Report Summary, Company setting, Partners, Buyers
        */}
        <div className="pt-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Module Sections:
            </span>

            <div className="flex items-center flex-wrap gap-2">
              {/* 1. Sales */}
              <button
                type="button"
                id="btn-store-sales-sales"
                onClick={() => setMainTab('sales')}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                  mainTab === 'sales'
                    ? 'bg-blue-600 text-white ring-2 ring-blue-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Sales</span>
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
        {mainTab === 'sales' && (
          <SalesScreen
            posEntries={posEntries}
            coalSellRecords={coalSellRecords}
            partners={partners}
            buyers={buyers}
            vehicles={vehicles}
            consumptions={consumptions}
            companySettings={companySettings}
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
          />
        )}

        {mainTab === 'stock_report' && (
          <StockReportView
            stockItems={stockItems}
            stockEntries={stockEntries}
            onAddItem={onAddStockItem}
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
