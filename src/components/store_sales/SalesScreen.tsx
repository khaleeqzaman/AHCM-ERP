import React, { useState } from 'react';
import { 
  Receipt, 
  FileCheck2, 
  BarChart3, 
  Handshake, 
  Users, 
  Truck,
  Layers
} from 'lucide-react';
import { 
  SalesSubTab, 
  PosCoalSellEntry, 
  CoalSellRecord, 
  PartnerRecord, 
  BuyerRecord, 
  VehicleRecord, 
  VehicleConsumptionRecord, 
  CompanySettings 
} from '../../types/storeSales';
import { PosView } from './PosView';
import { RecordCoalSellView } from './RecordCoalSellView';
import { CoalSalesReportView } from './CoalSalesReportView';
import { PartnersView } from './PartnersView';
import { BuyersView } from './BuyersView';
import { VehicleView } from './VehicleView';

interface SalesScreenProps {
  initialSubTab?: SalesSubTab;
  posEntries: PosCoalSellEntry[];
  coalSellRecords: CoalSellRecord[];
  partners: PartnerRecord[];
  buyers: BuyerRecord[];
  vehicles: VehicleRecord[];
  consumptions: VehicleConsumptionRecord[];
  companySettings: CompanySettings;
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
  initialSubTab = 'pos',
  posEntries,
  coalSellRecords,
  partners,
  buyers,
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
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onAddConsumption,
  onUpdateConsumption,
  onDeleteConsumption,
}) => {
  const [subTab, setSubTab] = useState<SalesSubTab>(initialSubTab);

  return (
    <div className="space-y-6">
      {/* Sales Sub-Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-2 hidden md:inline">
              Sales Desk:
            </span>

            {/* 1. POS */}
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

            {/* 2. Record Coal Sell */}
            <button
              type="button"
              onClick={() => setSubTab('record_coal_sell')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                subTab === 'record_coal_sell'
                  ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Record Coal Sell</span>
            </button>

            {/* 3. Coal Sales Report */}
            <button
              type="button"
              onClick={() => setSubTab('coal_sales_report')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                subTab === 'coal_sales_report'
                  ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Coal Sales Report</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                subTab === 'coal_sales_report' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {coalSellRecords.length}
              </span>
            </button>

            {/* 4. Partners */}
            <button
              type="button"
              onClick={() => setSubTab('partners')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                subTab === 'partners'
                  ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Handshake className="w-3.5 h-3.5" />
              <span>Partners</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                subTab === 'partners' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {partners.length}
              </span>
            </button>

            {/* 5. Buyers */}
            <button
              type="button"
              onClick={() => setSubTab('buyers')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                subTab === 'buyers'
                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Buyers</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                subTab === 'buyers' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {buyers.length}
              </span>
            </button>

            {/* 6. Vehicle */}
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
        {subTab === 'pos' && (
          <PosView
            entries={posEntries}
            buyers={buyers}
            companySettings={companySettings}
            onAddEntry={onAddPosEntry}
            onUpdateEntry={onUpdatePosEntry}
            onDeleteEntry={onDeletePosEntry}
          />
        )}

        {subTab === 'record_coal_sell' && (
          <RecordCoalSellView
            partners={partners}
            onSaveCoalSell={(rec) => {
              onAddCoalSellRecord(rec);
              setSubTab('coal_sales_report');
            }}
            onCancel={() => setSubTab('coal_sales_report')}
          />
        )}

        {subTab === 'coal_sales_report' && (
          <CoalSalesReportView
            records={coalSellRecords}
            partners={partners}
            companySettings={companySettings}
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
