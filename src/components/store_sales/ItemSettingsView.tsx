import React, { useState, useMemo } from 'react';
import { 
  Settings, 
  Layers, 
  Scale, 
  Pickaxe, 
  Truck, 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertCircle,
  X
} from 'lucide-react';
import { 
  ItemCategory, 
  ItemUnitType, 
  MineRecord, 
  VehicleRecord, 
  ItemSettingSubTab 
} from '../../types/storeSales';
import { ConfirmModal } from './ConfirmModal';

interface ItemSettingsViewProps {
  categories: ItemCategory[];
  unitTypes: ItemUnitType[];
  mines: MineRecord[];
  vehicles: VehicleRecord[];
  onAddCategory: (cat: ItemCategory) => void;
  onUpdateCategory: (cat: ItemCategory) => void;
  onDeleteCategory: (id: string) => void;
  onAddUnit: (unit: ItemUnitType) => void;
  onUpdateUnit: (unit: ItemUnitType) => void;
  onDeleteUnit: (id: string) => void;
  onAddMine: (mine: MineRecord) => void;
  onUpdateMine: (mine: MineRecord) => void;
  onDeleteMine: (id: string) => void;
  onAddVehicle: (veh: VehicleRecord) => void;
  onUpdateVehicle: (veh: VehicleRecord) => void;
  onDeleteVehicle: (id: string) => void;
}

export const ItemSettingsView: React.FC<ItemSettingsViewProps> = ({
  categories,
  unitTypes,
  mines,
  vehicles,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddUnit,
  onUpdateUnit,
  onDeleteUnit,
  onAddMine,
  onUpdateMine,
  onDeleteMine,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
}) => {
  const [activeTab, setActiveTab] = useState<ItemSettingSubTab>('categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ItemCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ItemUnitType | null>(null);
  const [unitName, setUnitName] = useState('');
  const [unitSymbol, setUnitSymbol] = useState('');
  const [unitDesc, setUnitDesc] = useState('');

  const [isMineModalOpen, setIsMineModalOpen] = useState(false);
  const [editingMine, setEditingMine] = useState<MineRecord | null>(null);
  const [mineName, setMineName] = useState('');
  const [mineLocation, setMineLocation] = useState('');
  const [mineIncharge, setMineIncharge] = useState('');
  const [mineStatus, setMineStatus] = useState<'Active' | 'Inactive'>('Active');

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleRecord | null>(null);
  const [vehNo, setVehNo] = useState('');
  const [vehType, setVehType] = useState('Dump Truck');
  const [vehDriver, setVehDriver] = useState('');
  const [vehStatus, setVehStatus] = useState<'Active' | 'Under Maintenance'>('Active');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: 'danger' | 'primary' | 'warning';
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // -------------------------------------------------------------
  // Filtered Lists
  // -------------------------------------------------------------
  const filteredCategories = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return categories.filter(c => c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q));
  }, [categories, searchTerm]);

  const filteredUnits = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return unitTypes.filter(u => u.name.toLowerCase().includes(q) || u.symbol.toLowerCase().includes(q));
  }, [unitTypes, searchTerm]);

  const filteredMines = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return mines.filter(m => m.name.toLowerCase().includes(q) || (m.location || '').toLowerCase().includes(q) || (m.incharge || '').toLowerCase().includes(q));
  }, [mines, searchTerm]);

  const filteredVehicles = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return vehicles.filter(v => v.vehicleNo.toLowerCase().includes(q) || v.vehicleType.toLowerCase().includes(q) || v.driverName.toLowerCase().includes(q));
  }, [vehicles, searchTerm]);

  // -------------------------------------------------------------
  // Handlers with User Confirmation
  // -------------------------------------------------------------
  // Category CRUD
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDesc('');
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: ItemCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setIsCategoryModalOpen(true);
  };

  const submitCategoryForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const isEdit = !!editingCategory;
    setConfirmModal({
      isOpen: true,
      title: isEdit ? 'Confirm Category Update' : 'Confirm New Category',
      message: isEdit 
        ? `Are you sure you want to update category "${editingCategory.name}" to "${catName.trim()}"?`
        : `Are you sure you want to create new item category "${catName.trim()}"?`,
      confirmText: isEdit ? 'Update Category' : 'Save Category',
      variant: 'primary',
      action: () => {
        if (isEdit && editingCategory) {
          onUpdateCategory({
            ...editingCategory,
            name: catName.trim(),
            description: catDesc.trim(),
          });
          showToast(`Category "${catName.trim()}" updated successfully.`);
        } else {
          onAddCategory({
            id: `cat-${Date.now()}`,
            name: catName.trim(),
            description: catDesc.trim(),
            createdAt: new Date().toISOString(),
          });
          showToast(`Category "${catName.trim()}" added successfully.`);
        }
        setIsCategoryModalOpen(false);
      },
    });
  };

  const handleDeleteCategoryPrompt = (cat: ItemCategory) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Item Category',
      message: `Are you sure you want to permanently delete category "${cat.name}"? Items linked to this category should be reassigned.`,
      confirmText: 'Delete Category',
      variant: 'danger',
      action: () => {
        onDeleteCategory(cat.id);
        showToast(`Category "${cat.name}" deleted.`);
      },
    });
  };

  // Unit Types CRUD
  const handleOpenAddUnit = () => {
    setEditingUnit(null);
    setUnitName('');
    setUnitSymbol('');
    setUnitDesc('');
    setIsUnitModalOpen(true);
  };

  const handleOpenEditUnit = (unit: ItemUnitType) => {
    setEditingUnit(unit);
    setUnitName(unit.name);
    setUnitSymbol(unit.symbol);
    setUnitDesc(unit.description || '');
    setIsUnitModalOpen(true);
  };

  const submitUnitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim() || !unitSymbol.trim()) return;

    const isEdit = !!editingUnit;
    setConfirmModal({
      isOpen: true,
      title: isEdit ? 'Confirm Unit Type Update' : 'Confirm New Unit Type',
      message: isEdit 
        ? `Are you sure you want to update measurement unit to "${unitName.trim()} (${unitSymbol.trim()})"?`
        : `Are you sure you want to add unit "${unitName.trim()} (${unitSymbol.trim()})"?`,
      confirmText: isEdit ? 'Update Unit' : 'Save Unit',
      variant: 'primary',
      action: () => {
        if (isEdit && editingUnit) {
          onUpdateUnit({
            ...editingUnit,
            name: unitName.trim(),
            symbol: unitSymbol.trim(),
            description: unitDesc.trim(),
          });
          showToast(`Unit "${unitName.trim()}" updated.`);
        } else {
          onAddUnit({
            id: `unit-${Date.now()}`,
            name: unitName.trim(),
            symbol: unitSymbol.trim(),
            description: unitDesc.trim(),
            createdAt: new Date().toISOString(),
          });
          showToast(`Unit "${unitName.trim()}" added.`);
        }
        setIsUnitModalOpen(false);
      },
    });
  };

  const handleDeleteUnitPrompt = (unit: ItemUnitType) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Unit Type',
      message: `Are you sure you want to permanently delete unit "${unit.name} (${unit.symbol})"?`,
      confirmText: 'Delete Unit',
      variant: 'danger',
      action: () => {
        onDeleteUnit(unit.id);
        showToast(`Unit "${unit.name}" removed.`);
      },
    });
  };

  // Mine CRUD
  const handleOpenAddMine = () => {
    setEditingMine(null);
    setMineName('');
    setMineLocation('');
    setMineIncharge('');
    setMineStatus('Active');
    setIsMineModalOpen(true);
  };

  const handleOpenEditMine = (mine: MineRecord) => {
    setEditingMine(mine);
    setMineName(mine.name);
    setMineLocation(mine.location || '');
    setMineIncharge(mine.incharge || '');
    setMineStatus(mine.status);
    setIsMineModalOpen(true);
  };

  const submitMineForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mineName.trim()) return;

    const isEdit = !!editingMine;
    setConfirmModal({
      isOpen: true,
      title: isEdit ? 'Confirm Mine Update' : 'Confirm New Mine',
      message: isEdit
        ? `Are you sure you want to save changes to mine "${mineName.trim()}"?`
        : `Are you sure you want to register new mine "${mineName.trim()}" for consumption tracking?`,
      confirmText: isEdit ? 'Update Mine' : 'Save Mine',
      variant: 'primary',
      action: () => {
        if (isEdit && editingMine) {
          onUpdateMine({
            ...editingMine,
            name: mineName.trim(),
            location: mineLocation.trim(),
            incharge: mineIncharge.trim(),
            status: mineStatus,
          });
          showToast(`Mine "${mineName.trim()}" updated.`);
        } else {
          onAddMine({
            id: `mine-${Date.now()}`,
            name: mineName.trim(),
            location: mineLocation.trim(),
            incharge: mineIncharge.trim(),
            status: mineStatus,
            createdAt: new Date().toISOString(),
          });
          showToast(`Mine "${mineName.trim()}" registered.`);
        }
        setIsMineModalOpen(false);
      },
    });
  };

  const handleDeleteMinePrompt = (mine: MineRecord) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Mine',
      message: `Are you sure you want to remove mine "${mine.name}"? Past consumption records for this mine will remain intact.`,
      confirmText: 'Delete Mine',
      variant: 'danger',
      action: () => {
        onDeleteMine(mine.id);
        showToast(`Mine "${mine.name}" deleted.`);
      },
    });
  };

  // Vehicle CRUD
  const handleOpenAddVehicle = () => {
    setEditingVehicle(null);
    setVehNo('');
    setVehType('Dump Truck');
    setVehDriver('');
    setVehStatus('Active');
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditVehicle = (veh: VehicleRecord) => {
    setEditingVehicle(veh);
    setVehNo(veh.vehicleNo);
    setVehType(veh.vehicleType);
    setVehDriver(veh.driverName);
    setVehStatus(veh.status);
    setIsVehicleModalOpen(true);
  };

  const submitVehicleForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehNo.trim()) return;

    const isEdit = !!editingVehicle;
    setConfirmModal({
      isOpen: true,
      title: isEdit ? 'Confirm Vehicle Update' : 'Confirm New Vehicle',
      message: isEdit
        ? `Are you sure you want to update vehicle "${vehNo.trim()}"?`
        : `Are you sure you want to add vehicle "${vehNo.trim()} (${vehType})"?`,
      confirmText: isEdit ? 'Update Vehicle' : 'Save Vehicle',
      variant: 'primary',
      action: () => {
        if (isEdit && editingVehicle) {
          onUpdateVehicle({
            ...editingVehicle,
            vehicleNo: vehNo.trim().toUpperCase(),
            vehicleType: vehType,
            driverName: vehDriver.trim(),
            status: vehStatus,
          });
          showToast(`Vehicle "${vehNo.trim().toUpperCase()}" updated.`);
        } else {
          onAddVehicle({
            id: `veh-${Date.now()}`,
            vehicleNo: vehNo.trim().toUpperCase(),
            vehicleType: vehType,
            driverName: vehDriver.trim(),
            status: vehStatus,
            createdAt: new Date().toISOString(),
          });
          showToast(`Vehicle "${vehNo.trim().toUpperCase()}" added.`);
        }
        setIsVehicleModalOpen(false);
      },
    });
  };

  const handleDeleteVehiclePrompt = (veh: VehicleRecord) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Vehicle',
      message: `Are you sure you want to delete vehicle "${veh.vehicleNo}" (${veh.vehicleType})?`,
      confirmText: 'Delete Vehicle',
      variant: 'danger',
      action: () => {
        onDeleteVehicle(veh.id);
        showToast(`Vehicle "${veh.vehicleNo}" removed.`);
      },
    });
  };

  // CSV Export for settings
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = '';

    if (activeTab === 'categories') {
      headers = ['ID', 'Category Name', 'Description'];
      rows = filteredCategories.map(c => [c.id, `"${c.name}"`, `"${c.description || ''}"`]);
      filename = 'Item_Categories.csv';
    } else if (activeTab === 'units') {
      headers = ['ID', 'Unit Name', 'Symbol', 'Description'];
      rows = filteredUnits.map(u => [u.id, `"${u.name}"`, `"${u.symbol}"`, `"${u.description || ''}"`]);
      filename = 'Item_Unit_Types.csv';
    } else if (activeTab === 'mines') {
      headers = ['ID', 'Mine Name', 'Location', 'Incharge', 'Status'];
      rows = filteredMines.map(m => [m.id, `"${m.name}"`, `"${m.location || ''}"`, `"${m.incharge || ''}"`, m.status]);
      filename = 'Mines_Register.csv';
    } else {
      headers = ['ID', 'Vehicle No', 'Type', 'Driver Name', 'Status'];
      rows = filteredVehicles.map(v => [v.id, `"${v.vehicleNo}"`, `"${v.vehicleType}"`, `"${v.driverName}"`, v.status]);
      filename = 'Vehicles_Register.csv';
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filename} successfully.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button type="button" onClick={() => setToastMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Store Management
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500 font-medium">Master Definitions</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>Item Settings & Master References</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Configure Item Categories, Measurement Units, Mines, and Fleet Vehicles linked to item inventory & consumption.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => { setActiveTab('categories'); setSearchTerm(''); }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Item Categories</span>
            <span className="text-[10px] bg-black/15 px-1.5 py-0.2 rounded-full">{categories.length}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('units'); setSearchTerm(''); }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'units'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Measurement Units</span>
            <span className="text-[10px] bg-black/15 px-1.5 py-0.2 rounded-full">{unitTypes.length}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('mines'); setSearchTerm(''); }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'mines'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Pickaxe className="w-3.5 h-3.5" />
            <span>Mines (Consumption)</span>
            <span className="text-[10px] bg-black/15 px-1.5 py-0.2 rounded-full">{mines.length}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('vehicles'); setSearchTerm(''); }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'vehicles'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Vehicles (Consumption)</span>
            <span className="text-[10px] bg-black/15 px-1.5 py-0.2 rounded-full">{vehicles.length}</span>
          </button>
        </div>

        {/* Action Button based on Tab */}
        <div>
          {activeTab === 'categories' && (
            <button
              type="button"
              onClick={handleOpenAddCategory}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          )}
          {activeTab === 'units' && (
            <button
              type="button"
              onClick={handleOpenAddUnit}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Measurement Unit</span>
            </button>
          )}
          {activeTab === 'mines' && (
            <button
              type="button"
              onClick={handleOpenAddMine}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Mine</span>
            </button>
          )}
          {activeTab === 'vehicles' && (
            <button
              type="button"
              onClick={handleOpenAddVehicle}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Vehicle</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Search ${activeTab.replace('_', ' ')}...`}
          className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* TAB CONTENT: 1. CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Sr.</th>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-400">
                      No item categories found. Click "Add Category" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat, idx) => (
                    <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span>{cat.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-md">{cat.description || '—'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCategory(cat)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategoryPrompt(cat)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* TAB CONTENT: 2. MEASUREMENT UNIT TYPES */}
      {activeTab === 'units' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Sr.</th>
                  <th className="py-3 px-4">Unit Name</th>
                  <th className="py-3 px-4">Symbol / Abbreviation</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      No measurement units found. Click "Add Measurement Unit" to define units.
                    </td>
                  </tr>
                ) : (
                  filteredUnits.map((unit, idx) => (
                    <tr key={unit.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{unit.name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 bg-blue-50/40 w-32">
                        {unit.symbol}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{unit.description || '—'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditUnit(unit)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Unit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUnitPrompt(unit)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Unit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* TAB CONTENT: 3. MINES */}
      {activeTab === 'mines' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Sr.</th>
                  <th className="py-3 px-4">Mine Name</th>
                  <th className="py-3 px-4">Location / Ridge</th>
                  <th className="py-3 px-4">Incharge / Mining Officer</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredMines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No mines registered. Click "Add Mine" to register production sites.
                    </td>
                  </tr>
                ) : (
                  filteredMines.map((m, idx) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        <Pickaxe className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{m.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{m.location || '—'}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{m.incharge || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          m.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditMine(m)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Mine"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMinePrompt(m)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Mine"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* TAB CONTENT: 4. VEHICLES */}
      {activeTab === 'vehicles' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Sr.</th>
                  <th className="py-3 px-4">Vehicle No / Reg</th>
                  <th className="py-3 px-4">Machinery Type</th>
                  <th className="py-3 px-4">Assigned Driver / Operator</th>
                  <th className="py-3 px-4 text-center">Operational Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No vehicles or machinery registered. Click "Add Vehicle" to register units.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((v, idx) => (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-teal-600" />
                        <span>{v.vehicleNo}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{v.vehicleType}</td>
                      <td className="py-3 px-4 text-slate-600">{v.driverName}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          v.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditVehicle(v)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Vehicle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVehiclePrompt(v)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Vehicle"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* =========================================================
          MODAL: ADD/EDIT CATEGORY
          ========================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>{editingCategory ? 'Edit Item Category' : 'Add Item Category'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submitCategoryForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Fuel & Petroleum, Heavy Machinery Spares"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Optional details about this inventory category..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3.5 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: ADD/EDIT UNIT
          ========================================================= */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-600" />
                <span>{editingUnit ? 'Edit Measurement Unit' : 'Add Measurement Unit'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsUnitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submitUnitForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Unit Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="e.g. Liters, Pieces, Kilograms, Bags"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Symbol / Short Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={unitSymbol}
                  onChange={(e) => setUnitSymbol(e.target.value)}
                  placeholder="e.g. L, Pcs, kg, Bags, m"
                  className="w-full px-3 py-2 font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={unitDesc}
                  onChange={(e) => setUnitDesc(e.target.value)}
                  placeholder="Optional notes regarding this measurement unit..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="px-3.5 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  {editingUnit ? 'Save Changes' : 'Create Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: ADD/EDIT MINE
          ========================================================= */}
      {isMineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Pickaxe className="w-4 h-4 text-emerald-600" />
                <span>{editingMine ? 'Edit Mine Site' : 'Register Mine Site'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsMineModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submitMineForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mine Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={mineName}
                  onChange={(e) => setMineName(e.target.value)}
                  placeholder="e.g. Mine #01 - North Pit, Deep Shaft 02"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Geographic Location / Valley
                </label>
                <input
                  type="text"
                  value={mineLocation}
                  onChange={(e) => setMineLocation(e.target.value)}
                  placeholder="e.g. Degari Valley Sector A, Sor-Range"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mine Incharge / Supervisor
                </label>
                <input
                  type="text"
                  value={mineIncharge}
                  onChange={(e) => setMineIncharge(e.target.value)}
                  placeholder="e.g. Engr. Tariq Khan"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Operating Status
                </label>
                <select
                  value={mineStatus}
                  onChange={(e) => setMineStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Active">Active Operations</option>
                  <option value="Inactive">Inactive / Suspended</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMineModalOpen(false)}
                  className="px-3.5 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  {editingMine ? 'Save Changes' : 'Register Mine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: ADD/EDIT VEHICLE
          ========================================================= */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-teal-600" />
                <span>{editingVehicle ? 'Edit Machinery / Vehicle' : 'Register Machinery / Vehicle'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsVehicleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submitVehicleForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Vehicle No / Equipment Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={vehNo}
                  onChange={(e) => setVehNo(e.target.value)}
                  placeholder="e.g. DT-104, CAT-320, FL-07"
                  className="w-full px-3 py-2 font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Machinery / Equipment Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={vehType}
                  onChange={(e) => setVehType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Dump Truck">Dump Truck (Heavy Haulage)</option>
                  <option value="Excavator">Excavator (Heavy Excavation)</option>
                  <option value="Front Loader">Front Loader (Pithead Stockpile)</option>
                  <option value="Pickup / Support">Pickup / Support Vehicle</option>
                  <option value="Heavy Generator">Heavy Diesel Generator</option>
                  <option value="Tunnel Compressor">Tunnel Compressor / Drill Rig</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assigned Driver / Operator
                </label>
                <input
                  type="text"
                  value={vehDriver}
                  onChange={(e) => setVehDriver(e.target.value)}
                  placeholder="e.g. Abdul Rasheed"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={vehStatus}
                  onChange={(e) => setVehStatus(e.target.value as 'Active' | 'Under Maintenance')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Active">Active Operational</option>
                  <option value="Under Maintenance">Under Maintenance / Workshop</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-3.5 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  {editingVehicle ? 'Save Changes' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        onConfirm={() => {
          confirmModal.action();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default ItemSettingsView;
