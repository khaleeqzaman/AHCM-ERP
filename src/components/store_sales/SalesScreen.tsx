import React, { useState } from 'react';
import { 
  Receipt, 
  FileCheck2, 
  BarChart3, 
  Handshake, 
  Users, 
  Truck,
  Layers,
  Scale,
  Boxes
} from 'lucide-react';
import { 
  SalesSubTab, 
  PosCoalSellEntry, 
  CoalSellRecord, 
  CoalProductionRecord,
  PartnerRecord, 
  BuyerRecord, 
  VehicleRecord, 
  VehicleConsumptionRecord, 
  CompanySettings 
} from '../../types/storeSales';
import { NavTarget } from '../../types';
import { CoalProductionView } from './CoalProductionView';
import { PosView } from './PosView';
import { RecordCoalSellView } from './RecordCoalSellView';
import { CoalSalesReportView } from './CoalSalesReportView';
import { PartnersView } from './PartnersView';
import { BuyersView } from './BuyersView';
import { VehicleView } from './VehicleView';
import { formatWholeNumber } from '../../utils/formatters';

interface SalesScreenProps {
  navTarget?: NavTarget | null;
  initialSubTab?: SalesSubTab;
  productionRecords?: CoalProductionRecord[];
  posEntries: PosCoalSellEntry[];
  coalSellRecords: CoalSellRecord[];
  partners: PartnerRecord[];
  buyers: BuyerRecord[];
  vehicles: VehicleRecord[];
  consumptions: VehicleConsumptionRecord[];
  companySettings: CompanySettings;
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
  onAddVehicle: (vehicle: VehicleRecord) => void;
  onUpdateVehicle: (vehicle: VehicleRecord) => void;
  onDeleteVehicle: (id: string) => void;
  onAddConsumption: (record: VehicleConsumptionRecord) => void;
  onUpdateConsumption: (record: VehicleConsumptionRecord) => void;
  onDeleteConsumption: (id: string) => void;
}

export const SalesScreen: React.FC<SalesScreenProps> = ({
  navTarget,
  initialSubTab = 'coal_production',
  productionRecords = [],
  posEntries,
  coalSellRecords,
  partners,
  buyers,
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
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onAddConsumption,
  onUpdateConsumption,
  onDeleteConsumption,
}) => {
  const [subTab, setSubTab] = useState<SalesSubTab>(initialSubTab);
  const [posTab, setPosTab] = useState<'sheet' | 'form'>('sheet');
  const [openPartnerColModal, setOpenPartnerColModal] = useState<boolean>(false);
  const [openPartnerForm, setOpenPartnerForm] = useState<boolean>(false);
  const [openBuyerForm, setOpenBuyerForm] = useState<boolean>(false);
  const [vehicleTab, setVehicleTab] = useState<'consumption_list' | 'add_consumption' | 'manage_vehicles'>('consumption_list');
  const [openVehicleForm, setOpenVehicleForm] = useState<boolean>(false);

  // Live Coal Stock calculation
  const totalProducedTons = productionRecords.reduce((sum, r) => sum + (Number(r.quantityTons) || 0), 0);
  const totalSoldTons = coalSellRecords.reduce((sum, r) => sum + (Number(r.quantityTons) || 0), 0);
  const currentCoalStock = Math.max(0, totalProducedTons - totalSoldTons);

  React.useEffect(() => {
    if (!navTarget || navTarget.module !== 'store_sales') return;

    if (navTarget.section === 'coal_management' || navTarget.section === 'sale') {
      if (navTarget.subPage === 'coal_production' || navTarget.subPage === 'add_coal_production' || navTarget.subPage === 'view_coal_production') {
        setSubTab('coal_production');
      } else if (navTarget.subPage === 'pos_sheet') {
        setSubTab('pos');
        setPosTab('sheet');
      } else if (navTarget.subPage === 'pos_form') {
        setSubTab('pos');
        setPosTab('form');
      } else if (navTarget.subPage === 'record_coal_sell') {
        setSubTab('record_coal_sell');
      } else if (navTarget.subPage === 'coal_sales_report_record') {
        setSubTab('record_coal_sell');
      } else if (navTarget.subPage === 'coal_sales_report_partner_col') {
        setSubTab('coal_sales_report');
        setOpenPartnerColModal(true);
      } else if (navTarget.subPage === 'add_partner') {
        setSubTab('partners');
        setOpenPartnerForm(true);
      } else if (navTarget.subPage === 'view_partners') {
        setSubTab('partners');
        setOpenPartnerForm(false);
      } else if (navTarget.subPage === 'add_buyer') {
        setSubTab('buyers');
        setOpenBuyerForm(true);
      } else if (navTarget.subPage === 'view_buyers') {
        setSubTab('buyers');
        setOpenBuyerForm(false);
      } else if (navTarget.subPage === 'manage_vehicle') {
        setSubTab('vehicle');
        setVehicleTab('manage_vehicles');
        setOpenVehicleForm(false);
      } else if (navTarget.subPage === 'add_vehicle') {
        setSubTab('vehicle');
        setVehicleTab('manage_vehicles');
        setOpenVehicleForm(true);
      } else if (navTarget.subPage === 'view_vehicle') {
        setSubTab('vehicle');
        setVehicleTab('manage_vehicles');
        setOpenVehicleForm(false);
      } else if (navTarget.subPage === 'add_consumption') {
        setSubTab('vehicle');
        setVehicleTab('add_consumption');
      } else if (navTarget.subPage === 'view_consumption') {
        setSubTab('vehicle');
        setVehicleTab('consumption_list');
      }
    }
  }, [navTarget]);

  return (
    <div className="space-y-6">
      {/* Coal Management Sub-Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-2 hidden md:inline">
              Coal Operations:
            </span>

            {/* 1. Daily Coal Production / Stock (NEW SPECIAL SECTION) */}
            <button
              type="button"
              onClick={() => setSubTab('coal_production')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                subTab === 'coal_production'
                  ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Daily Production / Stock</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                subTab === 'coal_production' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {formatWholeNumber(currentCoalStock)} MT
              </span>
            </button>

            {/* 2. POS */}
            <button
              type="button"
              onClick={() => setSubTab('pos')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                subTab === 'pos'
                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>POS</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                subTab === 'pos' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {posEntries.length}
              </span>
            </button>

            {/* 3. Record Coal Sell */}
            <button
              type="button"
              onClick={() => setSubTab('record_coal_sell')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                subTab === 'record_coal_sell'
                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Record Coal Sell</span>
            </button>

            {/* 4. Coal Sales Report */}
            <button
              type="button"
              onClick={() => setSubTab('coal_sales_report')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                subTab === 'coal_sales_report'
                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Coal Sales Report</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                subTab === 'coal_sales_report' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {coalSellRecords.length}
              </span>
            </button>

            {/* 5. Partners */}
            <button
              type="button"
              onClick={() => setSubTab('partners')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                subTab === 'partners'
                  ? 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-600/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Handshake className="w-3.5 h-3.5" />
              <span>Partners</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                subTab === 'partners' ? 'bg-purple-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {partners.length}
              </span>
            </button>

            {/* 6. Buyers */}
            <button
              type="button"
              onClick={() => setSubTab('buyers')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                subTab === 'buyers'
                  ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-600/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Buyers</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                subTab === 'buyers' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {buyers.length}
              </span>
            </button>

            {/* 7. Vehicle */}
            <button
              type="button"
              onClick={() => setSubTab('vehicle')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                subTab === 'vehicle'
                  ? 'bg-teal-600 text-white shadow-xs ring-2 ring-teal-600/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Vehicle</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                subTab === 'vehicle' ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {vehicles.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-view Content */}
      <div>
        {subTab === 'coal_production' && (
          <CoalProductionView
            productionRecords={productionRecords}
            coalSellRecords={coalSellRecords}
            partners={partners}
            companySettings={companySettings}
            onAddProduction={onAddProduction || (() => {})}
            onUpdateProduction={onUpdateProduction || (() => {})}
            onDeleteProduction={onDeleteProduction || (() => {})}
            onNavigateToRecordSell={() => setSubTab('record_coal_sell')}
          />
        )}

        {subTab === 'pos' && (
          <PosView
            entries={posEntries}
            buyers={buyers}
            companySettings={companySettings}
            initialTab={posTab}
            onAddEntry={onAddPosEntry}
            onUpdateEntry={onUpdatePosEntry}
            onDeleteEntry={onDeletePosEntry}
          />
        )}

        {subTab === 'record_coal_sell' && (
          <RecordCoalSellView
            partners={partners}
            currentCoalStock={currentCoalStock}
            onSaveCoalSell={(rec) => {
              onAddCoalSellRecord(rec);
              setSubTab('coal_production');
            }}
            onCancel={() => setSubTab('coal_production')}
          />
        )}

        {subTab === 'coal_sales_report' && (
          <CoalSalesReportView
            records={coalSellRecords}
            partners={partners}
            companySettings={companySettings}
            initialOpenAddPartnerModal={openPartnerColModal}
            onAddRecord={onAddCoalSellRecord}
            onUpdateRecord={onUpdateCoalSellRecord}
            onDeleteRecord={onDeleteCoalSellRecord}
            onAddPartner={onAddPartner}
            onTogglePartnerReportColumn={onTogglePartnerReportColumn}
            onTogglePartnerActive={onTogglePartnerActive}
            onDeletePartner={onDeletePartner}
            onNavigateToRecordSell={() => setSubTab('record_coal_sell')}
          />
        )}

        {subTab === 'partners' && (
          <PartnersView
            partners={partners}
            initialFormOpen={openPartnerForm}
            onAddPartner={onAddPartner}
            onUpdatePartner={onUpdatePartner}
            onDeletePartner={onDeletePartner}
            onToggleActive={onTogglePartnerActive}
            onToggleShowInReport={onTogglePartnerReportColumn}
          />
        )}

        {subTab === 'buyers' && (
          <BuyersView
            buyers={buyers}
            initialFormOpen={openBuyerForm}
            onAddBuyer={onAddBuyer}
            onUpdateBuyer={onUpdateBuyer}
            onDeleteBuyer={onDeleteBuyer}
          />
        )}

        {subTab === 'vehicle' && (
          <VehicleView
            vehicles={vehicles}
            consumptions={consumptions}
            companySettings={companySettings}
            initialTab={vehicleTab}
            initialVehicleFormOpen={openVehicleForm}
            onAddVehicle={onAddVehicle}
            onUpdateVehicle={onUpdateVehicle}
            onDeleteVehicle={onDeleteVehicle}
            onAddConsumption={onAddConsumption}
            onUpdateConsumption={onUpdateConsumption}
            onDeleteConsumption={onDeleteConsumption}
          />
        )}
      </div>
    </div>
  );
};
