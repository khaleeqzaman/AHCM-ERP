import React, { useState } from 'react';
import { 
  FileCheck2, 
  Save, 
  X, 
  CheckCircle2, 
  Calendar, 
  Building2, 
  Scale, 
  Truck 
} from 'lucide-react';
import { PartnerRecord, CoalSellRecord } from '../../types/storeSales';
import { DatePickerInput } from '../common/DatePickerInput';
import { formatWholeNumber } from '../../utils/formatters';

interface RecordCoalSellViewProps {
  partners: PartnerRecord[];
  currentCoalStock?: number;
  onSaveCoalSell: (record: CoalSellRecord) => void;
  onCancel: () => void;
}

export const RecordCoalSellView: React.FC<RecordCoalSellViewProps> = ({
  partners,
  currentCoalStock = 0,
  onSaveCoalSell,
  onCancel,
}) => {
  const activePartners = partners.filter((p) => p.isActive);

  const [date, setDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  });

  const [partnerId, setPartnerId] = useState<string>(activePartners[0]?.id || '');
  const [quantityTons, setQuantityTons] = useState<number | ''>(50);
  const [vehicleNo, setVehicleNo] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId) {
      alert('Please select a partner company');
      return;
    }
    const partner = partners.find((p) => p.id === partnerId);
    if (!partner) return;

    const numQty = Number(quantityTons);
    if (!numQty || numQty <= 0) {
      alert('Please enter a valid positive quantity in tons');
      return;
    }

    const newRecord: CoalSellRecord = {
      id: `cs-${Date.now()}`,
      date: date.trim(),
      partnerId: partner.id,
      partnerName: partner.name,
      quantityTons: numQty,
      vehicleNo: vehicleNo.trim() || undefined,
      remarks: remarks.trim() || undefined,
    };

    onSaveCoalSell(newRecord);
    setNotification(`Successfully recorded sale of ${formatWholeNumber(numQty)} Tons for ${partner.name}.`);
    
    // Reset fields for another rapid entry
    setQuantityTons('');
    setRemarks('');
    setVehicleNo('');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Store & Sales
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500">Pithead Dispatch</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-600" />
            Record Coal Sell
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Log date-wise coal quantity sold or dispatched to registered partner companies in metric tons.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          Cancel / Back
        </button>
      </div>

      {notification && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Live Coal Stock Impact Banner */}
          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-[11px] font-semibold text-blue-900 block">
                Current Coal Stock Available:
              </span>
              <span className="font-mono text-base font-bold text-blue-950">
                {formatWholeNumber(currentCoalStock)} MT
              </span>
            </div>
            <div className="sm:text-right">
              <span className="text-[11px] font-semibold text-blue-900 block">
                Stock Deduction on Save:
              </span>
              <span className="font-mono text-xs font-bold text-rose-700">
                -{formatWholeNumber(Number(quantityTons) || 0)} MT → Remaining: {formatWholeNumber(Math.max(0, currentCoalStock - (Number(quantityTons) || 0)))} MT
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date (DD-MM-YYYY) <span className="text-rose-500">*</span>
              </label>
              <DatePickerInput
                required
                value={date}
                onChange={(newDate) => setDate(newDate)}
                className="w-full text-xs font-mono font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* Company Name (Dropdown list of existing partners added) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Company / Partner Name <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {activePartners.length === 0 ? (
                  <option value="">No active partners available</option>
                ) : (
                  activePartners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))
                )}
              </select>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Populated from registered partner directory
              </span>
            </div>

            {/* Quantity in Ton */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-slate-400" />
                Quantity in Ton <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={quantityTons}
                onChange={(e) => setQuantityTons(e.target.value === '' ? '' : Math.round(Number(e.target.value)))}
                placeholder="e.g. 85"
                className="w-full text-sm font-bold font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">Metric Tons (MT)</span>
            </div>

            {/* Vehicle No */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-slate-400" />
                Vehicle / Truck No. (Optional)
              </label>
              <input
                type="text"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                placeholder="e.g. TK-8842"
                className="w-full text-xs font-mono px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white uppercase"
              />
            </div>

            {/* Remarks */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dispatch Remarks / Seam Reference
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Pithead or lease block notes..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Coal Sell Entry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
