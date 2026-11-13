import React, { useState, useMemo } from 'react';
import { 
  Settings, 
  Layers, 
  Scale, 
  Truck,
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Download, 
  Printer, 
  CheckCircle2, 
  X
} from 'lucide-react';
import { 
  ItemCategory, 
  ItemUnitType, 
  MachineryType,
  ItemSettingSubTab,
  MineRecord,
  VehicleRecord
} from '../../types/storeSales';
import { ConfirmModal } from './ConfirmModal';
import { printConcernedTable } from '../../utils/printTable';
import { exportUniversalCsv } from '../../utils/exportCsv';

interface ItemSettingsViewProps {
  categories: ItemCategory[];
  unitTypes: ItemUnitType[];
  machineryTypes?: MachineryType[];
  mines?: MineRecord[];
  vehicles?: VehicleRecord[];
  onAddCategory: (cat: ItemCategory) => void;
  onUpdateCategory: (cat: ItemCategory) => void;
  onDeleteCategory: (id: string) => void;
  onAddUnit: (unit: ItemUnitType) => void;
  onUpdateUnit: (unit: ItemUnitType) => void;
  onDeleteUnit: (id: string) => void;
  onAddMachineryType?: (mt: MachineryType) => void;
  onUpdateMachineryType?: (mt: MachineryType) => void;
  onDeleteMachineryType?: (id: string) => void;
  onAddMine?: (mine: MineRecord) => void;
  onUpdateMine?: (mine: MineRecord) => void;
  onDeleteMine?: (id: string) => void;
  onAddVehicle?: (veh: VehicleRecord) => void;
  onUpdateVehicle?: (veh: VehicleRecord) => void;
  onDeleteVehicle?: (id: string) => void;
}

export const ItemSettingsView: React.FC<ItemSettingsViewProps> = ({
  categories = [],
  unitTypes = [],
  machineryTypes = [],
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddUnit,
  onUpdateUnit,
  onDeleteUnit,
  onAddMachineryType,
  onUpdateMachineryType,
  onDeleteMachineryType,
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

  const [isMachineryTypeModalOpen, setIsMachineryTypeModalOpen] = useState(false);
  const [editingMachineryType, setEditingMachineryType] = useState<MachineryType | null>(null);
  const [mtName, setMtName] = useState('');
  const [mtDesc, setMtDesc] = useState('');

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

  const filteredMachineryTypes = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return machineryTypes.filter(
      m => m.name.toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q)
    );
  }, [machineryTypes, searchTerm]);

  // -------------------------------------------------------------
  // Category CRUD
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // Unit Types CRUD
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // Machinery / Equipment Types CRUD
  // -------------------------------------------------------------
  const handleOpenAddMachineryType = () => {
    setEditingMachineryType(null);
    setMtName('');
    setMtDesc('');
    setIsMachineryTypeModalOpen(true);
  };

  const handleOpenEditMachineryType = (mt: MachineryType) => {
    setEditingMachineryType(mt);
    setMtName(mt.name);
    setMtDesc(mt.description || '');
    setIsMachineryTypeModalOpen(true);
  };

  const submitMachineryTypeForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mtName.trim()) return;

    const isEdit = !!editingMachineryType;
    setConfirmModal({
      isOpen: true,
      title: isEdit ? 'Confirm Machinery Type Update' : 'Confirm New Machinery Type',
      message: isEdit
        ? `Are you sure you want to update machinery / equipment type "${editingMachineryType.name}" to "${mtName.trim()}"?`
        : `Are you sure you want to create new machinery / equipment type "${mtName.trim()}"?`,
      confirmText: isEdit ? 'Update Machinery Type' : 'Save Machinery Type',
      variant: 'primary',
      action: () => {
        if (isEdit && editingMachineryType) {
          onUpdateMachineryType?.({
            ...editingMachineryType,
            name: mtName.trim(),
            description: mtDesc.trim(),
          });
          showToast(`Machinery / equipment type "${mtName.trim()}" updated successfully.`);
        } else {
          onAddMachineryType?.({
            id: `mt-${Date.now()}`,
            name: mtName.trim(),
            description: mtDesc.trim(),
            createdAt: new Date().toISOString(),
          });
          showToast(`Machinery / equipment type "${mtName.trim()}" added successfully.`);
        }
        setIsMachineryTypeModalOpen(false);
      },
    });
  };

  const handleDeleteMachineryTypePrompt = (mt: MachineryType) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Machinery / Equipment Type',
      message: `Are you sure you want to permanently delete machinery / equipment type "${mt.name}"?`,
      confirmText: 'Delete Machinery Type',
      variant: 'danger',
      action: () => {
        onDeleteMachineryType?.(mt.id);
        showToast(`Machinery / equipment type "${mt.name}" deleted.`);
      },
    });
  };

  // CSV Export
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = '';
    let tableName = '';

    if (activeTab === 'categories') {
      headers = ['ID', 'Category Name', 'Description'];
      rows = filteredCategories.map(c => [c.id, c.name, c.description || '']);
      filename = 'Item_Categories.csv';
      tableName = 'Item Categories Master Register';
    } else if (activeTab === 'units') {
      headers = ['ID', 'Unit Name', 'Symbol', 'Description'];
      rows = filteredUnits.map(u => [u.id, u.name, u.symbol, u.description || '']);
      filename = 'Item_Unit_Types.csv';
      tableName = 'Measurement Unit Types Master Register';
    } else {
      headers = ['ID', 'Machinery / Equipment Type', 'Description'];
      rows = filteredMachineryTypes.map(m => [m.id, m.name, m.description || '']);
      filename = 'Machinery_Equipment_Types.csv';
      tableName = 'Machinery / Equipment Types Master Register';
    }

    exportUniversalCsv(filename, {
      tableName,
      reportDate: new Date().toLocaleDateString('en-GB'),
      headers,
      rows,
    });
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
            Configure Item Categories, Measurement Units, and Machinery / Equipment Types linked to inventory & fleet registration.
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
            onClick={() => {
              const tableId =
                activeTab === 'categories'
                  ? 'printable-categories-table'
                  : activeTab === 'units'
                  ? 'printable-units-table'
                  : 'printable-machinery-types-table';
              const title =
                activeTab === 'categories'
                  ? 'Item Categories Master'
                  : activeTab === 'units'
                  ? 'Measurement Unit Types Master'
                  : 'Machinery / Equipment Types Master';
              printConcernedTable(tableId, title, {
                tableName: title,
                reportDate: new Date().toLocaleDateString('en-GB'),
              });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print View (Table Only)</span>
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
            onClick={() => { setActiveTab('machinery_types'); setSearchTerm(''); }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'machinery_types'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Machinery / Equipment Types</span>
            <span className="text-[10px] bg-black/15 px-1.5 py-0.2 rounded-full">{machineryTypes.length}</span>
          </button>
        </div>

        {/* Action Button based on Tab */}
        <div>
          {activeTab === 'categories' ? (
            <button
              type="button"
              onClick={handleOpenAddCategory}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          ) : activeTab === 'units' ? (
            <button
              type="button"
              onClick={handleOpenAddUnit}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Measurement Unit</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenAddMachineryType}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Machinery Type</span>
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
          placeholder={`Search ${
            activeTab === 'categories'
              ? 'categories'
              : activeTab === 'units'
              ? 'units'
              : 'machinery / equipment types'
          }...`}
          className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* TAB CONTENT: 1. CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table id="printable-categories-table" className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Sr.</th>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right no-print">Actions</th>
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
                      <td className="py-3 px-4 text-right no-print">
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
            <table id="printable-units-table" className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Sr.</th>
                  <th className="py-3 px-4">Unit Name</th>
                  <th className="py-3 px-4">Symbol / Abbreviation</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right no-print">Actions</th>
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
                      <td className="py-3 px-4 text-right no-print">
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

      {/* TAB CONTENT: 3. MACHINERY / EQUIPMENT TYPES */}
      {activeTab === 'machinery_types' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table id="printable-machinery-types-table" className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Sr.</th>
                  <th className="py-3 px-4">Machinery / Equipment Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredMachineryTypes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-400">
                      No machinery / equipment types found. Click "Add Machinery Type" to define types for vehicle registration.
                    </td>
                  </tr>
                ) : (
                  filteredMachineryTypes.map((mt, idx) => (
                    <tr key={mt.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-teal-600" />
                        <span>{mt.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-md">{mt.description || '—'}</td>
                      <td className="py-3 px-4 text-right no-print">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditMachineryType(mt)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Machinery Type"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMachineryTypePrompt(mt)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Machinery Type"
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
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
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
                  className="px-3.5 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
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
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
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
                  className="px-3.5 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                >
                  {editingUnit ? 'Save Changes' : 'Create Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: ADD/EDIT MACHINERY / EQUIPMENT TYPE
          ========================================================= */}
      {isMachineryTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-teal-600" />
                <span>{editingMachineryType ? 'Edit Machinery / Equipment Type' : 'Add Machinery / Equipment Type'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsMachineryTypeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submitMachineryTypeForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Machinery / Equipment Type Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={mtName}
                  onChange={(e) => setMtName(e.target.value)}
                  placeholder="e.g. Dump Truck, Excavator, Wheel Loader, Drill Rig"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={mtDesc}
                  onChange={(e) => setMtDesc(e.target.value)}
                  placeholder="Optional details (e.g. Heavy Haulage, Pithead Stockpile)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMachineryTypeModalOpen(false)}
                  className="px-3.5 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                >
                  {editingMachineryType ? 'Save Changes' : 'Create Machinery Type'}
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
