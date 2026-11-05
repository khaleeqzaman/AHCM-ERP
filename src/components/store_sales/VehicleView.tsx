import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  Plus, 
  Trash2, 
  Edit2, 
  Download, 
  Printer, 
  Search, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  Fuel,
  Droplet,
  Layers,
  ArrowUpDown,
  X
} from 'lucide-react';
import { 
  VehicleRecord, 
  VehicleConsumptionRecord, 
  CompanySettings 
} from '../../types/storeSales';
import { formatWholeNumber } from '../../utils/formatters';
import { DatePickerInput } from '../common/DatePickerInput';

interface VehicleViewProps {
  vehicles: VehicleRecord[];
  consumptions: VehicleConsumptionRecord[];
  companySettings: CompanySettings;
  onAddVehicle: (vehicle: VehicleRecord) => void;
  onUpdateVehicle: (vehicle: VehicleRecord) => void;
  onDeleteVehicle: (id: string) => void;
  onAddConsumption: (record: VehicleConsumptionRecord) => void;
  onUpdateConsumption: (record: VehicleConsumptionRecord) => void;
  onDeleteConsumption: (id: string) => void;
}

export const VehicleView: React.FC<VehicleViewProps> = ({
  vehicles,
  consumptions,
  companySettings,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onAddConsumption,
  onUpdateConsumption,
  onDeleteConsumption,
}) => {
  const [activeTab, setActiveTab] = useState<'consumption_list' | 'add_consumption' | 'manage_vehicles'>('consumption_list');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [notification, setNotification] = useState<string | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Vehicle master form state
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [vehicleNoInput, setVehicleNoInput] = useState('');
  const [driverNameInput, setDriverNameInput] = useState('');
  const [vehicleTypeInput, setVehicleTypeInput] = useState('Dump Truck (25 Ton)');
  const [vehicleStatusInput, setVehicleStatusInput] = useState<'Active' | 'Under Maintenance'>('Active');
  const [vehicleRosterSearch, setVehicleRosterSearch] = useState('');

  // Consumption form state
  const [editingConsumptionId, setEditingConsumptionId] = useState<string | null>(null);
  const [consumptionToDelete, setConsumptionToDelete] = useState<VehicleConsumptionRecord | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<VehicleRecord | null>(null);

  const [formVehicleId, setFormVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [formDate, setFormDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  });
  const [formDiesel, setFormDiesel] = useState<number | ''>(150);
  const [formMOil, setFormMOil] = useState<number | ''>(10);
  const [formDOil, setFormDOil] = useState<number | ''>(5);
  const [formOFltr, setFormOFltr] = useState<number | ''>(1);
  const [formDFltr, setFormDFltr] = useState<number | ''>(2);
  const [formKOil, setFormKOil] = useState<number | ''>(0);
  const [formCOil, setFormCOil] = useState<number | ''>(4);
  const [formBOil, setFormBOil] = useState<number | ''>(2);
  const [formRemarks, setFormRemarks] = useState<string>('');

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenAddConsumption = () => {
    setEditingConsumptionId(null);
    setFormVehicleId(vehicles[0]?.id || '');
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    setFormDate(`${dd}-${mm}-${yyyy}`);
    setFormDiesel(150);
    setFormMOil(10);
    setFormDOil(5);
    setFormOFltr(1);
    setFormDFltr(2);
    setFormKOil(0);
    setFormCOil(4);
    setFormBOil(2);
    setFormRemarks('');
    setActiveTab('add_consumption');
  };

  const handleOpenEditConsumption = (rec: VehicleConsumptionRecord) => {
    setEditingConsumptionId(rec.id);
    setFormVehicleId(rec.vehicleId);
    setFormDate(rec.date);
    setFormDiesel(rec.diesel);
    setFormMOil(rec.mOil);
    setFormDOil(rec.dOil);
    setFormOFltr(rec.oFltr);
    setFormDFltr(rec.dFltr);
    setFormKOil(rec.kOil);
    setFormCOil(rec.cOil);
    setFormBOil(rec.bOil);
    setFormRemarks(rec.remarks || '');
    setActiveTab('add_consumption');
  };

  // Submit Vehicle Master
  const handleSaveVehicleMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNoInput.trim()) {
      alert('Vehicle No is required');
      return;
    }

    if (editingVehicleId) {
      onUpdateVehicle({
        id: editingVehicleId,
        vehicleNo: vehicleNoInput.trim().toUpperCase(),
        driverName: driverNameInput.trim() || 'Unassigned',
        vehicleType: vehicleTypeInput.trim() || 'Dump Truck (25 Ton)',
        status: vehicleStatusInput,
      });
      showNotice(`Vehicle ${vehicleNoInput.toUpperCase()} updated successfully.`);
    } else {
      const newV: VehicleRecord = {
        id: `v-${Date.now()}`,
        vehicleNo: vehicleNoInput.trim().toUpperCase(),
        driverName: driverNameInput.trim() || 'Unassigned',
        vehicleType: vehicleTypeInput.trim() || 'Dump Truck (25 Ton)',
        status: vehicleStatusInput,
      };
      onAddVehicle(newV);
      showNotice(`Vehicle ${newV.vehicleNo} added to fleet roster.`);
    }

    setIsVehicleFormOpen(false);
    setEditingVehicleId(null);
    setVehicleNoInput('');
    setDriverNameInput('');
    setVehicleStatusInput('Active');
  };

  // Submit Consumption
  const handleConsumptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = vehicles.find((item) => item.id === formVehicleId);
    if (!v) {
      alert('Please select a valid vehicle');
      return;
    }

    if (editingConsumptionId) {
      const updated: VehicleConsumptionRecord = {
        id: editingConsumptionId,
        srNo: consumptions.find((c) => c.id === editingConsumptionId)?.srNo || 1,
        vehicleId: v.id,
        vehicleNo: v.vehicleNo,
        date: formDate,
        diesel: Number(formDiesel) || 0,
        mOil: Number(formMOil) || 0,
        dOil: Number(formDOil) || 0,
        oFltr: Number(formOFltr) || 0,
        dFltr: Number(formDFltr) || 0,
        kOil: Number(formKOil) || 0,
        cOil: Number(formCOil) || 0,
        bOil: Number(formBOil) || 0,
        remarks: formRemarks.trim() || undefined,
      };
      onUpdateConsumption(updated);
      showNotice(`Consumption log for ${v.vehicleNo} updated.`);
    } else {
      const newRec: VehicleConsumptionRecord = {
        id: `vc-${Date.now()}`,
        srNo: 1,
        vehicleId: v.id,
        vehicleNo: v.vehicleNo,
        date: formDate,
        diesel: Number(formDiesel) || 0,
        mOil: Number(formMOil) || 0,
        dOil: Number(formDOil) || 0,
        oFltr: Number(formOFltr) || 0,
        dFltr: Number(formDFltr) || 0,
        kOil: Number(formKOil) || 0,
        cOil: Number(formCOil) || 0,
        bOil: Number(formBOil) || 0,
        remarks: formRemarks.trim() || undefined,
      };
      onAddConsumption(newRec);
      showNotice(`Consumption recorded for ${v.vehicleNo}.`);
    }

    setActiveTab('consumption_list');
    setEditingConsumptionId(null);
  };

  const handleConfirmDeleteConsumption = () => {
    if (consumptionToDelete) {
      onDeleteConsumption(consumptionToDelete.id);
      showNotice(`Consumption record removed.`);
      setConsumptionToDelete(null);
    }
  };

  const parseDDMMYYYY = (dStr: string) => {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
    return new Date(dStr);
  };

  const now = new Date();
  const filteredConsumptions = useMemo(() => {
    return consumptions.filter((c) => {
      // Vehicle filter
      if (selectedVehicleId !== 'all' && c.vehicleId !== selectedVehicleId) return false;

      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches = 
          c.vehicleNo.toLowerCase().includes(term) ||
          c.date.includes(term) ||
          (c.remarks && c.remarks.toLowerCase().includes(term));
        if (!matches) return false;
      }

      // Date range
      const cDate = parseDDMMYYYY(c.date);
      if (dateFrom) {
        const fDate = new Date(dateFrom);
        if (cDate < fDate) return false;
      }
      if (dateTo) {
        const tDate = new Date(dateTo);
        tDate.setHours(23, 59, 59, 999);
        if (cDate > tDate) return false;
      }

      // Time filter
      if (timeFilter === 'daily') {
        const isToday = 
          cDate.getDate() === now.getDate() &&
          cDate.getMonth() === now.getMonth() &&
          cDate.getFullYear() === now.getFullYear();
        if (!isToday) return false;
      } else if (timeFilter === 'weekly') {
        const diffTime = Math.abs(now.getTime() - cDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7) return false;
      } else if (timeFilter === 'monthly') {
        const [yr, mo] = selectedMonth.split('-').map(Number);
        if (cDate.getFullYear() !== yr || cDate.getMonth() + 1 !== mo) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const tA = parseDDMMYYYY(a.date).getTime();
      const tB = parseDDMMYYYY(b.date).getTime();
      return sortOrder === 'desc' ? tB - tA : tA - tB;
    });
  }, [consumptions, selectedVehicleId, searchTerm, dateFrom, dateTo, timeFilter, selectedMonth, sortOrder]);

  const filteredVehicles = useMemo(() => {
    if (!vehicleRosterSearch.trim()) return vehicles;
    const q = vehicleRosterSearch.toLowerCase();
    return vehicles.filter(
      (v) =>
        v.vehicleNo.toLowerCase().includes(q) ||
        v.driverName.toLowerCase().includes(q) ||
        v.vehicleType.toLowerCase().includes(q) ||
        v.status.toLowerCase().includes(q)
    );
  }, [vehicles, vehicleRosterSearch]);

  // Column wise totals at the end of table
  const totalDiesel = filteredConsumptions.reduce((sum, c) => sum + (Number(c.diesel) || 0), 0);
  const totalMOil = filteredConsumptions.reduce((sum, c) => sum + (Number(c.mOil) || 0), 0);
  const totalDOil = filteredConsumptions.reduce((sum, c) => sum + (Number(c.dOil) || 0), 0);
  const totalOFltr = filteredConsumptions.reduce((sum, c) => sum + (Number(c.oFltr) || 0), 0);
  const totalDFltr = filteredConsumptions.reduce((sum, c) => sum + (Number(c.dFltr) || 0), 0);
  const totalKOil = filteredConsumptions.reduce((sum, c) => sum + (Number(c.kOil) || 0), 0);
  const totalCOil = filteredConsumptions.reduce((sum, c) => sum + (Number(c.cOil) || 0), 0);
  const totalBOil = filteredConsumptions.reduce((sum, c) => sum + (Number(c.bOil) || 0), 0);

  // CSV Export with company settings header
  const handleExportCSV = () => {
    const monthName = new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });
    const headerLines = [
      `"${companySettings.companyName}"`,
      `"${companySettings.address}"`,
      `"VEHICLE WISE FUEL & LUBRICANT CONSUMPTION REPORT - ${timeFilter === 'monthly' ? monthName.toUpperCase() : 'CONSOLIDATED'}"`,
      `"Generated: ${new Date().toLocaleDateString()}"`,
      '',
    ];

    const colHeaders = [
      'Sr.',
      'Date',
      'Vehicle No.',
      'DIESEL (Ltr)',
      'M.OIL (Ltr)',
      'D.OIL (Ltr)',
      'O.FLTR (Pcs)',
      'D.FLTR (Pcs)',
      'K.OIL (Ltr)',
      'C.OIL (Ltr)',
      'B.OIL (Ltr)',
      'Remarks'
    ];

    const dataRows = filteredConsumptions.map((c, idx) => [
      idx + 1,
      `"${c.date}"`,
      `"${c.vehicleNo}"`,
      c.diesel.toFixed(2),
      c.mOil.toFixed(2),
      c.dOil.toFixed(2),
      c.oFltr,
      c.dFltr,
      c.kOil.toFixed(2),
      c.cOil.toFixed(2),
      c.bOil.toFixed(2),
      `"${(c.remarks || '').replace(/"/g, '""')}"`
    ].join(','));

    const totalsRow = [
      'TOTAL',
      '',
      'Column Totals',
      totalDiesel.toFixed(2),
      totalMOil.toFixed(2),
      totalDOil.toFixed(2),
      totalOFltr,
      totalDFltr,
      totalKOil.toFixed(2),
      totalCOil.toFixed(2),
      totalBOil.toFixed(2),
      ''
    ].join(',');

    const csvContent = [...headerLines, colHeaders.join(','), ...dataRows, totalsRow].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Vehicle_Consumption_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('Vehicle consumption report exported to CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">
              Store & Sales
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500">Fleet & Machinery Maintenance</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Truck className="w-5 h-5 text-teal-600" />
            Vehicle Screen & Fuel / Lubricant Consumption
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Log machinery fuel, engine oils, differential oil, filters, and hydraulic fluids. Track vehicle-wise consumption with statutory totals.
          </p>
        </div>

        {/* Buttons: add vehicle, add vehicle consumption */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('consumption_list')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'consumption_list'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Consumption Table
          </button>

          <button
            type="button"
            onClick={handleOpenAddConsumption}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'add_consumption' && !editingConsumptionId
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Vehicle Consumption</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manage_vehicles')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'manage_vehicles'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-slate-600" />
            <span>Manage Vehicles ({vehicles.length})</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* MANAGE VEHICLES VIEW */}
      {activeTab === 'manage_vehicles' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Fleet & Heavy Machinery Roster</span>
                <span className="text-xs font-normal text-slate-500">
                  ({filteredVehicles.length} of {vehicles.length} machinery)
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Register dump trucks, excavators, loaders, pickups, and site generators with assigned operators.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={vehicleRosterSearch}
                  onChange={(e) => setVehicleRosterSearch(e.target.value)}
                  placeholder="Search vehicle, driver, type..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-teal-600 focus:border-teal-600 w-52 shadow-2xs"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingVehicleId(null);
                  setVehicleNoInput('');
                  setDriverNameInput('');
                  setVehicleTypeInput('Dump Truck (25 Ton)');
                  setVehicleStatusInput('Active');
                  setIsVehicleFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 cursor-pointer shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Vehicle</span>
              </button>
            </div>
          </div>

          {/* Add / Edit Vehicle Modal */}
          {isVehicleFormOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {editingVehicleId ? 'Edit Vehicle Master' : 'Add Vehicle to Fleet'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {editingVehicleId ? 'Update registration details, operator, or equipment status' : 'Register machinery or logistics transport into fleet roster'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsVehicleFormOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveVehicleMaster} className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Vehicle / Reg No. <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={vehicleNoInput}
                        onChange={(e) => setVehicleNoInput(e.target.value)}
                        placeholder="e.g. TK-8842, KBL-552"
                        className="w-full text-xs font-mono uppercase px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-teal-600 focus:border-teal-600 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Driver / Operator Name
                      </label>
                      <input
                        type="text"
                        value={driverNameInput}
                        onChange={(e) => setDriverNameInput(e.target.value)}
                        placeholder="e.g. Muhammad Gulzar"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-teal-600 focus:border-teal-600 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Vehicle / Machine Type
                      </label>
                      <input
                        type="text"
                        value={vehicleTypeInput}
                        onChange={(e) => setVehicleTypeInput(e.target.value)}
                        placeholder="Dump Truck, Loader, Excavator, Generator"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-teal-600 focus:border-teal-600 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Operational Status
                      </label>
                      <select
                        value={vehicleStatusInput}
                        onChange={(e) => setVehicleStatusInput(e.target.value as 'Active' | 'Under Maintenance')}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-teal-600 focus:border-teal-600 shadow-2xs"
                      >
                        <option value="Active">Active (In Service)</option>
                        <option value="Under Maintenance">Under Maintenance (Workshop)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsVehicleFormOpen(false)}
                      className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{editingVehicleId ? 'Update Vehicle' : 'Save Vehicle'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Vehicles List */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">Sr.</th>
                  <th className="py-2.5 px-3">Vehicle Number</th>
                  <th className="py-2.5 px-3">Driver / Operator</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center min-w-[240px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No vehicles found. Click &quot;Add Vehicle&quot; to register fleet machinery.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((v, idx) => (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{v.vehicleNo}</td>
                      <td className="py-2.5 px-3 text-slate-700">{v.driverName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{v.vehicleType}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          v.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5 justify-center flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingVehicleId(null);
                              setVehicleNoInput('');
                              setDriverNameInput('');
                              setVehicleTypeInput(v.vehicleType || 'Dump Truck (25 Ton)');
                              setVehicleStatusInput('Active');
                              setIsVehicleFormOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md cursor-pointer transition-colors shadow-2xs"
                            title="Add New Vehicle"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingVehicleId(v.id);
                              setVehicleNoInput(v.vehicleNo);
                              setDriverNameInput(v.driverName);
                              setVehicleTypeInput(v.vehicleType);
                              setVehicleStatusInput(v.status || 'Active');
                              setIsVehicleFormOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md cursor-pointer transition-colors shadow-2xs"
                            title={`Edit Vehicle ${v.vehicleNo}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setVehicleToDelete(v)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md cursor-pointer transition-colors shadow-2xs"
                            title={`Delete Vehicle ${v.vehicleNo}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleOpenAddConsumption();
                              setFormVehicleId(v.id);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md cursor-pointer transition-colors shadow-2xs"
                            title={`Log Fuel / Lubricant Consumption for ${v.vehicleNo}`}
                          >
                            <Fuel className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Log Fuel</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT CONSUMPTION FORM */}
      {activeTab === 'add_consumption' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {editingConsumptionId ? 'Edit Vehicle Consumption Record' : 'Add Vehicle Consumption Entry'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Record lubricants, fuel, and filtration elements for specific machinery.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('consumption_list')}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Back to Consumption Table
            </button>
          </div>

          <form onSubmit={handleConsumptionSubmit} className="space-y-5">
            {/* Form Fields: vehicle (dropdown), DIESEL, M.OIL, D.OIL, O.FLTR, D.FLTR, K.OIL, C.OIL, B.OIL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Vehicle Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  Vehicle (Dropdown) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formVehicleId}
                  onChange={(e) => setFormVehicleId(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNo} — {v.vehicleType} ({v.driverName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Date (DD-MM-YYYY) <span className="text-rose-500">*</span>
                </label>
                <DatePickerInput
                  required
                  value={formDate}
                  onChange={(newDate) => setFormDate(newDate)}
                  className="w-full text-xs font-mono font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              {/* DIESEL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-amber-500" />
                  DIESEL (Liters) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={formDiesel}
                  onChange={(e) => setFormDiesel(e.target.value === '' ? '' : Math.round(Number(e.target.value)))}
                  placeholder="0"
                  className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              {/* M.OIL (Motor Oil) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-blue-500" />
                  M.OIL (Motor Oil - Liters)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formMOil}
                  onChange={(e) => setFormMOil(e.target.value === '' ? '' : Math.round(Number(e.target.value)))}
                  placeholder="0"
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              {/* D.OIL (Differential Oil) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-indigo-500" />
                  D.OIL (Differential Oil - Liters)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formDOil}
                  onChange={(e) => setFormDOil(e.target.value === '' ? '' : Math.round(Number(e.target.value)))}
                  placeholder="0"
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              {/* O.FLTR (Oil Filter) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  O.FLTR (Oil Filter - Quantity/Pcs)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formOFltr}
                  onChange={(e) => setFormOFltr(e.target.value === '' ? '' : Math.round(Number(e.target.value)))}
                  placeholder="0"
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              {/* D.FLTR (Diesel Filter) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  D.FLTR (Diesel Filter - Quantity/Pcs)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formDFltr}
                  onChange={(e) => setFormDFltr(e.target.value === '' ? '' : Math.round(Number(e.target.value)))}
                  placeholder="0"
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              {/* K.OIL (Kerosene Oil) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  K.OIL (Kerosene Oil - Liters)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formKOil}
                  onChange={(e) => setFormKOil(e.target.value === '' ? '' : Math.round(Number(e.target.value)))}
                  placeholder="0"
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              {/* C.OIL (Coolant / Compressor Oil) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  C.OIL (Coolant / Compressor Oil - Liters)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formCOil}
                  onChange={(e) => setFormCOil(e.target.value === '' ? '' : Math.round(Number(e.target.value)))}
                  placeholder="0"
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              {/* B.OIL (Brake Oil) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  B.OIL (Brake Oil - Liters)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formBOil}
                  onChange={(e) => setFormBOil(e.target.value === '' ? '' : Math.round(Number(e.target.value)))}
                  placeholder="0"
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              {/* Remarks */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Operating Shift / Pit Notes
                </label>
                <input
                  type="text"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="Double shift, route, or maintenance remarks..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('consumption_list')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                {editingConsumptionId ? 'Update Consumption Log' : 'Save Consumption Log'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VEHICLE CONSUMPTION TABLE & FILTERS */}
      {activeTab === 'consumption_list' && (
        <div className="space-y-4">
          {/* Filters Bar: Sort/filter by vehicle, date wise, daily, weekly, monthly. Export options */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by vehicle no, date, remarks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Filter by Vehicle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 whitespace-nowrap">Filter Vehicle:</span>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="all">All Vehicles ({vehicles.length})</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNo} ({v.driverName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-500 mr-1">Period:</span>
                <button
                  type="button"
                  onClick={() => setTimeFilter('all')}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    timeFilter === 'all'
                      ? 'bg-teal-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter('daily')}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    timeFilter === 'daily'
                      ? 'bg-teal-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Daily
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter('weekly')}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    timeFilter === 'weekly'
                      ? 'bg-teal-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter('monthly')}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    timeFilter === 'monthly'
                      ? 'bg-teal-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Monthly
                </button>

                {timeFilter === 'monthly' && (
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                )}
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Export to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
                  title="Print report with company header"
                >
                  <Printer className="w-3.5 h-3.5 text-teal-600" />
                  <span>Print View</span>
                </button>
              </div>
            </div>

            {/* Date Range filter */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600 flex-wrap">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date Filter:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">From:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">To:</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="text-xs text-rose-600 hover:underline cursor-pointer"
                >
                  Clear dates
                </button>
              )}

              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="ml-auto inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
              </button>
            </div>
          </div>

          {/* Table: Column wise total at the end of table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">Sr.</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3 min-w-[120px]">Vehicle</th>
                    <th className="py-3 px-3 text-right bg-amber-50/50">DIESEL (L)</th>
                    <th className="py-3 px-3 text-right">M.OIL (L)</th>
                    <th className="py-3 px-3 text-right">D.OIL (L)</th>
                    <th className="py-3 px-3 text-right">O.FLTR</th>
                    <th className="py-3 px-3 text-right">D.FLTR</th>
                    <th className="py-3 px-3 text-right">K.OIL (L)</th>
                    <th className="py-3 px-3 text-right">C.OIL (L)</th>
                    <th className="py-3 px-3 text-right">B.OIL (L)</th>
                    <th className="py-3 px-3 min-w-[140px]">Remarks</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredConsumptions.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-8 text-center text-slate-400">
                        No vehicle consumption entries found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredConsumptions.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                          {c.date}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {c.vehicleNo}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-900 bg-amber-50/30">
                          {formatWholeNumber(c.diesel)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {formatWholeNumber(c.mOil)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {formatWholeNumber(c.dOil)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {formatWholeNumber(c.oFltr)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {formatWholeNumber(c.dFltr)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {formatWholeNumber(c.kOil)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {formatWholeNumber(c.cOil)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {formatWholeNumber(c.bOil)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {c.remarks || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5 justify-center flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenAddConsumption();
                                setFormVehicleId(c.vehicleId);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded cursor-pointer transition-colors shadow-2xs"
                              title={`Add Consumption Entry for ${c.vehicleNo}`}
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditConsumption(c)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded cursor-pointer transition-colors shadow-2xs"
                              title="Edit Entry"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConsumptionToDelete(c)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded cursor-pointer transition-colors shadow-2xs"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Column-wise Total at the end of table */}
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                  <tr>
                    <td colSpan={3} className="py-3 px-3 uppercase tracking-wider text-right font-extrabold text-slate-800">
                      Column Totals:
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-amber-950 bg-amber-100/80">
                      {formatWholeNumber(totalDiesel)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                      {formatWholeNumber(totalMOil)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                      {formatWholeNumber(totalDOil)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                      {formatWholeNumber(totalOFltr)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                      {formatWholeNumber(totalDFltr)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                      {formatWholeNumber(totalKOil)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                      {formatWholeNumber(totalCOil)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                      {formatWholeNumber(totalBOil)}
                    </td>
                    <td colSpan={2} className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Print View Modal with Company Header */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full p-6 border border-slate-200 space-y-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Official Report Print Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Official Report Header from Company Settings */}
            <div className="text-center space-y-1 pb-4 border-b border-slate-300">
              <h2 className="text-xl font-extrabold tracking-wide text-slate-900 uppercase">
                {companySettings.companyName}
              </h2>
              <p className="text-xs text-slate-600 max-w-lg mx-auto font-medium">
                {companySettings.address}
              </p>
              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 font-mono">
                {companySettings.ntnNumber && <span>NTN: {companySettings.ntnNumber}</span>}
                {companySettings.contactNumber && <span>Phone: {companySettings.contactNumber}</span>}
              </div>
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-900 tracking-wider uppercase bg-slate-100 px-4 py-1.5 rounded inline-block">
                  VEHICLE FUEL & LUBRICANTS CONSUMPTION REPORT — {selectedMonth}
                </span>
              </div>
            </div>

            {/* Print Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                  <tr className="border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300">Sr.</th>
                    <th className="p-2 border-r border-slate-300">Date</th>
                    <th className="p-2 border-r border-slate-300">Vehicle</th>
                    <th className="p-2 border-r border-slate-300 text-right">DIESEL</th>
                    <th className="p-2 border-r border-slate-300 text-right">M.OIL</th>
                    <th className="p-2 border-r border-slate-300 text-right">D.OIL</th>
                    <th className="p-2 border-r border-slate-300 text-right">O.FLTR</th>
                    <th className="p-2 border-r border-slate-300 text-right">D.FLTR</th>
                    <th className="p-2 border-r border-slate-300 text-right">K.OIL</th>
                    <th className="p-2 border-r border-slate-300 text-right">C.OIL</th>
                    <th className="p-2 text-right">B.OIL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredConsumptions.map((c, idx) => (
                    <tr key={c.id}>
                      <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-mono">{c.date}</td>
                      <td className="p-2 border-r border-slate-200 font-mono font-bold">{c.vehicleNo}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">{formatWholeNumber(c.diesel)}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">{formatWholeNumber(c.mOil)}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">{formatWholeNumber(c.dOil)}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">{c.oFltr}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">{c.dFltr}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">{formatWholeNumber(c.kOil)}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">{formatWholeNumber(c.cOil)}</td>
                      <td className="p-2 text-right font-mono">{formatWholeNumber(c.bOil)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-400 font-bold">
                  <tr>
                    <td colSpan={3} className="p-2 border-r border-slate-300 text-right font-extrabold">COLUMN TOTALS:</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono font-extrabold">{formatWholeNumber(totalDiesel)}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono font-extrabold">{formatWholeNumber(totalMOil)}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono font-extrabold">{formatWholeNumber(totalDOil)}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono font-extrabold">{totalOFltr}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono font-extrabold">{totalDFltr}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono font-extrabold">{formatWholeNumber(totalKOil)}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono font-extrabold">{formatWholeNumber(totalCOil)}</td>
                    <td className="p-2 text-right font-mono font-extrabold">{formatWholeNumber(totalBOil)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-between items-end pt-8 text-xs text-slate-500 font-medium border-t border-slate-200">
              <div>
                <p>Checked By: ___________________</p>
                <p className="mt-1">Fleet / Workshop Foreman</p>
              </div>
              <div className="text-right">
                <p>Authorized Signature: ___________________</p>
                <p className="mt-1">Operations & Transport Manager</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {consumptionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Remove Consumption Record</h3>
                <p className="text-xs text-slate-500">Confirm deletion</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to remove the consumption log for vehicle <strong className="text-slate-900">{consumptionToDelete.vehicleNo}</strong> on {consumptionToDelete.date}?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConsumptionToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteConsumption}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer shadow-xs"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Remove Vehicle</h3>
                <p className="text-xs text-slate-500">Confirm removal</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to remove vehicle <strong className="text-slate-900">{vehicleToDelete.vehicleNo}</strong> from the fleet roster?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVehicleToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteVehicle(vehicleToDelete.id);
                  showNotice(`Vehicle ${vehicleToDelete.vehicleNo} removed.`);
                  setVehicleToDelete(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer shadow-xs"
              >
                Remove Vehicle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
