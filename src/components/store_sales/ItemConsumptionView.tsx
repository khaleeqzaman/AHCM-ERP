import React, { useState, useMemo, useEffect } from 'react';
import { 
  Fuel, 
  Truck, 
  Pickaxe, 
  Plus, 
  Search, 
  Download, 
  Printer, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Filter, 
  Layers, 
  Eye, 
  FileSpreadsheet,
  AlertTriangle,
  ArrowUpDown,
  Building2,
  Calendar,
  Package,
  Boxes
} from 'lucide-react';
import type { 
  ItemConsumptionRecord, 
  StoreItem, 
  ItemStockEntry,
  VehicleRecord, 
  MineRecord, 
  ItemConsumptionSubTab,
  ConsumptionTargetType 
} from '../../types/storeSales.ts';
import { DatePickerInput } from '../common/DatePickerInput.tsx';
import ConfirmModal from './ConfirmModal.tsx';
import { formatWholeNumber } from '../../utils/formatters.ts';
import { printConcernedTable } from '../../utils/printTable.ts';

// Helper to convert DD-MM-YYYY to timestamp for chronological comparisons
const parseDateTs = (d?: string): number => {
  if (!d) return 0;
  const parts = d.split('-');
  if (parts.length === 3) {
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
  }
  return new Date(d).getTime() || 0;
};

interface ItemConsumptionViewProps {
  consumptions: ItemConsumptionRecord[];
  stockEntries?: ItemStockEntry[];
  items: StoreItem[];
  vehicles: VehicleRecord[];
  mines: MineRecord[];
  itemStockMap: Record<string, number>; // itemId -> current live inventory quantity
  onAddConsumption: (record: ItemConsumptionRecord) => void;
  onUpdateConsumption: (record: ItemConsumptionRecord) => void;
  onDeleteConsumption: (id: string) => void;
  onAddMine?: (mine: MineRecord) => void;
  onUpdateMine?: (mine: MineRecord) => void;
  onDeleteMine?: (id: string) => void;
  onAddVehicle?: (veh: VehicleRecord) => void;
  onUpdateVehicle?: (veh: VehicleRecord) => void;
  onDeleteVehicle?: (id: string) => void;
  initialSubTab?: ItemConsumptionSubTab;
}

export const ItemConsumptionView: React.FC<ItemConsumptionViewProps> = ({
  consumptions = [],
  stockEntries = [],
  items = [],
  vehicles = [],
  mines = [],
  itemStockMap = {},
  onAddConsumption,
  onUpdateConsumption,
  onDeleteConsumption,
  onAddMine,
  onUpdateMine,
  onDeleteMine,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  initialSubTab = 'view_consumption',
}) => {
  // Navigation tabs: Add Consumption | View Item Consumption | Item Consumption Report
  const [activeSubTab, setActiveSubTab] = useState<ItemConsumptionSubTab>(initialSubTab);

  // In View Item Consumption: Sub-views: 'vehicle_wise' | 'mine_wise' | 'item_wise' | 'all_logs'
  const [viewGrouping, setViewGrouping] = useState<'vehicle_wise' | 'mine_wise' | 'item_wise' | 'all_logs'>('all_logs');

  // Search and date filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'vehicle' | 'mine'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sorting state for tables
  const [sortField, setSortField] = useState<'date' | 'quantity' | 'itemName' | 'targetName'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Form State for Add Consumption
  const [formConsumptionType, setFormConsumptionType] = useState<ConsumptionTargetType>('vehicle');
  const [formDate, setFormDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${today.getFullYear()}`;
  });
  const [formVehicleId, setFormVehicleId] = useState(vehicles[0]?.id || '');
  const [formMineId, setFormMineId] = useState(mines[0]?.id || '');
  const [formItemId, setFormItemId] = useState(items[0]?.id || '');
  const [formQuantity, setFormQuantity] = useState<number | ''>('');
  const [formOperator, setFormOperator] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<ItemConsumptionRecord | null>(null);
  const [editQuantity, setEditQuantity] = useState<number | ''>('');
  const [editDate, setEditDate] = useState('');
  const [editOperator, setEditOperator] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Vehicle Modal State
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleRecord | null>(null);
  const [vehNo, setVehNo] = useState('');
  const [vehType, setVehType] = useState('Dump Truck');
  const [vehDriver, setVehDriver] = useState('');
  const [vehStatus, setVehStatus] = useState<'Active' | 'Under Maintenance'>('Active');

  // Mine Modal State
  const [isMineModalOpen, setIsMineModalOpen] = useState(false);
  const [editingMine, setEditingMine] = useState<MineRecord | null>(null);
  const [mineName, setMineName] = useState('');
  const [mineLocation, setMineLocation] = useState('');
  const [mineIncharge, setMineIncharge] = useState('');
  const [mineStatus, setMineStatus] = useState<'Active' | 'Inactive'>('Active');

  // Report Item Visibility Filter (allow user to add/remove items from report table)
  const [selectedReportItemIds, setSelectedReportItemIds] = useState<string[]>(() => items.map(i => i.id));

  // Sync selected item ids when items array changes
  useEffect(() => {
    if (items.length > 0 && selectedReportItemIds.length === 0) {
      setSelectedReportItemIds(items.map(i => i.id));
    }
  }, [items]);

  // Ensure form selections stay valid when data arrives or changes
  useEffect(() => {
    if (!formItemId && items.length > 0) {
      setFormItemId(items[0].id);
    }
  }, [items, formItemId]);

  useEffect(() => {
    if (!formVehicleId && vehicles.length > 0) {
      setFormVehicleId(vehicles[0].id);
    }
  }, [vehicles, formVehicleId]);

  useEffect(() => {
    if (!formMineId && mines.length > 0) {
      setFormMineId(mines[0].id);
    }
  }, [mines, formMineId]);

  // Confirmation Modal
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
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Safe selected item in Add Form
  const selectedItem = useMemo(() => {
    return items.find(i => i.id === formItemId);
  }, [items, formItemId]);

  // Current total live inventory for the currently selected item
  const currentTotalInventory = useMemo(() => {
    if (!formItemId) return 0;
    return itemStockMap[formItemId] ?? 0;
  }, [itemStockMap, formItemId]);

  // Date-wise available inventory up to formDate for the selected item:
  // Inflows on or prior to formDate - prior consumptions on or prior to formDate
  const dateWiseAvailableInventory = useMemo(() => {
    if (!formItemId || !selectedItem) return 0;
    const formTs = parseDateTs(formDate);

    const inflowsUpToDate = (stockEntries || [])
      .filter(s => (s.itemId === formItemId || (s.itemCode && s.itemCode === selectedItem.itemCode)) && parseDateTs(s.date) <= formTs)
      .reduce((sum, s) => sum + Number(s.stockQuantity || s.stockQty || 0), 0);

    const consumptionsUpToDate = (consumptions || [])
      .filter(c => (c.itemId === formItemId || (c.itemCode && c.itemCode === selectedItem.itemCode)) && parseDateTs(c.date) <= formTs)
      .reduce((sum, c) => sum + Number(c.quantity || 0), 0);

    return inflowsUpToDate - consumptionsUpToDate;
  }, [formItemId, selectedItem, formDate, stockEntries, consumptions]);

  // Maximum allowed consumption: must not exceed total inventory nor date-wise available inventory
  const maxAllowedConsumption = useMemo(() => {
    return Math.max(0, Math.min(currentTotalInventory, dateWiseAvailableInventory));
  }, [currentTotalInventory, dateWiseAvailableInventory]);

  // Backward compatibility alias
  const currentAvailableStock = maxAllowedConsumption;

  // Safe sanitization of consumption records to prevent any runtime undefined errors
  const safeConsumptions = useMemo(() => {
    return (consumptions || []).map((c, idx) => {
      const targetName = c.targetName || c.vehicleNo || c.mineName || (c.consumptionType === 'mine' ? 'Mining Site' : 'Fleet Unit');
      const itemCode = c.itemCode || 'ITM-00';
      const itemName = c.itemName || 'Store Item';
      const unit = c.unit || 'Units';
      const qty = Number(c.quantity ?? 0);
      const date = c.date || '01-01-2026';
      const type = c.consumptionType === 'mine' ? 'mine' : 'vehicle';

      return {
        ...c,
        id: c.id || `con-safe-${idx + 1}`,
        date,
        consumptionType: type as ConsumptionTargetType,
        targetId: c.targetId || (type === 'mine' ? (mines[0]?.id || 'm-1') : (vehicles[0]?.id || 'v-1')),
        targetName,
        itemId: c.itemId || (items[0]?.id || 'it-1'),
        itemCode,
        itemName,
        unit,
        quantity: isNaN(qty) ? 0 : qty,
        operatorName: c.operatorName || c.driverName || '',
        remarks: c.remarks || '',
      };
    });
  }, [consumptions, mines, vehicles, items]);

  // Filtered Vehicles for Vehicles Sub-Tab
  const filteredVehicles = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return vehicles.filter(
      v =>
        v.vehicleNo.toLowerCase().includes(q) ||
        v.vehicleType.toLowerCase().includes(q) ||
        v.driverName.toLowerCase().includes(q)
    );
  }, [vehicles, searchTerm]);

  // Filtered Mines for Mines Sub-Tab
  const filteredMines = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return mines.filter(
      m =>
        m.name.toLowerCase().includes(q) ||
        (m.location || '').toLowerCase().includes(q) ||
        (m.incharge || '').toLowerCase().includes(q)
    );
  }, [mines, searchTerm]);

  // Vehicle CRUD Handlers
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
          onUpdateVehicle?.({
            ...editingVehicle,
            vehicleNo: vehNo.trim().toUpperCase(),
            vehicleType: vehType,
            driverName: vehDriver.trim(),
            status: vehStatus,
          });
          showToast(`Vehicle "${vehNo.trim().toUpperCase()}" updated.`);
        } else {
          const newVeh: VehicleRecord = {
            id: `veh-${Date.now()}`,
            vehicleNo: vehNo.trim().toUpperCase(),
            vehicleType: vehType,
            driverName: vehDriver.trim(),
            status: vehStatus,
            createdAt: new Date().toISOString(),
          };
          onAddVehicle?.(newVeh);
          setFormVehicleId(newVeh.id);
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
        onDeleteVehicle?.(veh.id);
        showToast(`Vehicle "${veh.vehicleNo}" removed.`);
      },
    });
  };

  // Mine CRUD Handlers
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
          onUpdateMine?.({
            ...editingMine,
            name: mineName.trim(),
            location: mineLocation.trim(),
            incharge: mineIncharge.trim(),
            status: mineStatus,
          });
          showToast(`Mine "${mineName.trim()}" updated.`);
        } else {
          const newMine: MineRecord = {
            id: `mine-${Date.now()}`,
            name: mineName.trim(),
            location: mineLocation.trim(),
            incharge: mineIncharge.trim(),
            status: mineStatus,
            createdAt: new Date().toISOString(),
          };
          onAddMine?.(newMine);
          setFormMineId(newMine.id);
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
        onDeleteMine?.(mine.id);
        showToast(`Mine "${mine.name}" deleted.`);
      },
    });
  };

  // -------------------------------------------------------------
  // Add Consumption Submit (Enforces Date-wise and Total Inventory Ceilings)
  // -------------------------------------------------------------
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formItemId || !selectedItem) {
      setFormError('Please select a valid item from the catalog.');
      return;
    }

    const qty = Number(formQuantity);
    if (!qty || isNaN(qty) || qty <= 0) {
      setFormError('Consumption quantity must be a positive number greater than 0.');
      return;
    }

    // 1. Total available inventory ceiling check
    if (currentTotalInventory <= 0) {
      setFormError(
        `Zero Inventory! "${selectedItem.itemName}" has 0 available inventory in the store. Please add item inventory in Item Inventory before logging consumption.`
      );
      return;
    }

    if (qty > currentTotalInventory) {
      setFormError(
        `Insufficient Total Inventory! Total available quantity for "${selectedItem.itemName}" is ${formatWholeNumber(currentTotalInventory)} ${selectedItem.unitSymbol}. You cannot consume ${formatWholeNumber(qty)} ${selectedItem.unitSymbol}.`
      );
      return;
    }

    // 2. Date-wise available inventory ceiling check
    if (dateWiseAvailableInventory <= 0) {
      setFormError(
        `Insufficient Date-wise Inventory! Available inventory for "${selectedItem.itemName}" on or prior to ${formDate} is 0 ${selectedItem.unitSymbol}. Please log date-wise inventory additions on or before ${formDate}.`
      );
      return;
    }

    if (qty > dateWiseAvailableInventory) {
      setFormError(
        `Date-wise Inventory Limit Exceeded! Available inventory for "${selectedItem.itemName}" up to ${formDate} is only ${formatWholeNumber(dateWiseAvailableInventory)} ${selectedItem.unitSymbol}. You cannot consume ${formatWholeNumber(qty)} ${selectedItem.unitSymbol} on this date.`
      );
      return;
    }

    let targetName = '';
    let targetId = '';

    if (formConsumptionType === 'vehicle') {
      const veh = vehicles.find(v => v.id === formVehicleId);
      if (!veh) {
        setFormError('Please select a valid vehicle / equipment.');
        return;
      }
      targetId = veh.id;
      targetName = `${veh.vehicleNo} (${veh.vehicleType})`;
    } else {
      const mine = mines.find(m => m.id === formMineId);
      if (!mine) {
        setFormError('Please select a valid mine site.');
        return;
      }
      targetId = mine.id;
      targetName = mine.name;
    }

    const item = selectedItem;
    const remainingAfter = currentTotalInventory - qty;

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Item Consumption Issue',
      message: `Are you sure you want to record this consumption within item inventory limits?\n\n• Type: ${formConsumptionType === 'vehicle' ? 'Vehicle Consumption' : 'Mine Consumption'}\n• Target: ${targetName}\n• Item: ${item.itemName} (${item.itemCode})\n• Quantity: ${formatWholeNumber(qty)} ${item.unitSymbol}\n• Remaining Inventory After Issue: ${formatWholeNumber(remainingAfter)} ${item.unitSymbol}\n• Date: ${formDate}`,
      confirmText: 'Confirm & Issue',
      variant: 'primary',
      action: () => {
        const newRecord: ItemConsumptionRecord = {
          id: `con-${Date.now()}`,
          date: formDate,
          consumptionType: formConsumptionType,
          targetId,
          targetName,
          itemId: item.id,
          itemCode: item.itemCode,
          itemName: item.itemName,
          unit: item.unitSymbol || 'Units',
          quantity: qty,
          operatorName: formOperator.trim(),
          remarks: formRemarks.trim(),
          createdAt: new Date().toISOString(),
        };

        onAddConsumption(newRecord);
        showToast(`Successfully issued ${formatWholeNumber(qty)} ${item.unitSymbol} of ${item.itemName} to ${targetName}. Inventory decreased.`);
        setFormQuantity('');
        setFormRemarks('');
        setFormOperator('');
        setActiveSubTab('view_consumption');
      },
    });
  };

  // -------------------------------------------------------------
  // Edit Consumption Submit (Enforces Inventory Limits)
  // -------------------------------------------------------------
  const handleOpenEdit = (rec: ItemConsumptionRecord) => {
    setEditingRecord(rec);
    setEditDate(rec.date);
    setEditQuantity(rec.quantity);
    setEditOperator(rec.operatorName || '');
    setEditRemarks(rec.remarks || '');
    setEditError(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setEditError(null);

    const qty = Number(editQuantity);
    if (!qty || isNaN(qty) || qty <= 0) {
      setEditError('Quantity must be greater than 0.');
      return;
    }

    const recItem = items.find(i => i.id === editingRecord.itemId);
    const unitSym = editingRecord.unit || recItem?.unitSymbol || 'Units';
    const effectiveTotal = (itemStockMap[editingRecord.itemId] ?? 0) + (editingRecord.quantity || 0);

    const editTs = parseDateTs(editDate);
    const inflowsUpToDate = (stockEntries || [])
      .filter(s => (s.itemId === editingRecord.itemId || (s.itemCode && s.itemCode === editingRecord.itemCode)) && parseDateTs(s.date) <= editTs)
      .reduce((sum, s) => sum + Number(s.stockQuantity || s.stockQty || 0), 0);

    const otherConsUpToDate = (consumptions || [])
      .filter(c => c.id !== editingRecord.id && (c.itemId === editingRecord.itemId || (c.itemCode && c.itemCode === editingRecord.itemCode)) && parseDateTs(c.date) <= editTs)
      .reduce((sum, c) => sum + Number(c.quantity || 0), 0);

    const effectiveDateWise = inflowsUpToDate - otherConsUpToDate;
    const effectiveMax = Math.max(0, Math.min(effectiveTotal, effectiveDateWise));

    if (qty > effectiveMax) {
      setEditError(`Insufficient inventory on ${editDate}! Maximum allowed is ${formatWholeNumber(effectiveMax)} ${unitSym}.`);
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Consumption Update',
      message: `Update consumption entry for ${editingRecord.targetName} to ${formatWholeNumber(qty)} ${editingRecord.unit}?`,
      confirmText: 'Update Entry',
      variant: 'primary',
      action: () => {
        onUpdateConsumption({
          ...editingRecord,
          date: editDate,
          quantity: qty,
          operatorName: editOperator.trim(),
          remarks: editRemarks.trim(),
        });
        showToast(`Consumption entry updated.`);
        setEditingRecord(null);
      },
    });
  };

  // Delete Consumption Prompt
  const handleDeletePrompt = (rec: ItemConsumptionRecord) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Consumption Entry',
      message: `Are you sure you want to delete this consumption record (${formatWholeNumber(rec.quantity)} ${rec.unit} for ${rec.targetName})?\n\nThis quantity will be restored to available store inventory balance.`,
      confirmText: 'Delete Entry',
      variant: 'danger',
      action: () => {
        onDeleteConsumption(rec.id);
        showToast(`Consumption record deleted. Inventory restored.`);
      },
    });
  };

  // -------------------------------------------------------------
  // Filtered & Sorted Consumption Records
  // -------------------------------------------------------------
  const filteredConsumptions = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return safeConsumptions.filter(c => {
      const matchSearch = !q || 
        c.targetName.toLowerCase().includes(q) ||
        c.itemCode.toLowerCase().includes(q) ||
        c.itemName.toLowerCase().includes(q) ||
        c.operatorName.toLowerCase().includes(q) ||
        c.remarks.toLowerCase().includes(q) ||
        c.date.includes(q);

      const matchType = filterType === 'all' || c.consumptionType === filterType;
      const matchFrom = !dateFrom || c.date >= dateFrom;
      const matchTo = !dateTo || c.date <= dateTo;

      return matchSearch && matchType && matchFrom && matchTo;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortField === 'quantity') cmp = a.quantity - b.quantity;
      else if (sortField === 'itemName') cmp = a.itemName.localeCompare(b.itemName);
      else if (sortField === 'targetName') cmp = a.targetName.localeCompare(b.targetName);
      return sortAsc ? cmp : -cmp;
    });
  }, [safeConsumptions, searchTerm, filterType, dateFrom, dateTo, sortField, sortAsc]);

  // -------------------------------------------------------------
  // Aggregated Views: Vehicle-wise, Mine-wise, Item-wise
  // -------------------------------------------------------------
  // 1. Vehicle-wise Aggregation
  const vehicleWiseSummary = useMemo(() => {
    const map = new Map<string, {
      vehicleId: string;
      vehicleNo: string;
      itemBreakdown: Record<string, { itemName: string; unit: string; quantity: number }>;
      totalEntries: number;
    }>();

    // Seed all vehicles
    vehicles.forEach(v => {
      map.set(v.id, {
        vehicleId: v.id,
        vehicleNo: `${v.vehicleNo} (${v.vehicleType})`,
        itemBreakdown: {},
        totalEntries: 0,
      });
    });

    filteredConsumptions
      .filter(c => c.consumptionType === 'vehicle')
      .forEach(c => {
        let entry = map.get(c.targetId);
        if (!entry) {
          entry = {
            vehicleId: c.targetId,
            vehicleNo: c.targetName,
            itemBreakdown: {},
            totalEntries: 0,
          };
          map.set(c.targetId, entry);
        }
        if (!entry.itemBreakdown[c.itemId]) {
          entry.itemBreakdown[c.itemId] = { itemName: c.itemName, unit: c.unit, quantity: 0 };
        }
        entry.itemBreakdown[c.itemId].quantity += c.quantity;
        entry.totalEntries += 1;
      });

    return Array.from(map.values()).sort((a, b) => b.totalEntries - a.totalEntries);
  }, [vehicles, filteredConsumptions]);

  // 2. Mine-wise Aggregation
  const mineWiseSummary = useMemo(() => {
    const map = new Map<string, {
      mineId: string;
      mineName: string;
      itemBreakdown: Record<string, { itemName: string; unit: string; quantity: number }>;
      totalEntries: number;
    }>();

    // Seed all mines
    mines.forEach(m => {
      map.set(m.id, {
        mineId: m.id,
        mineName: m.name,
        itemBreakdown: {},
        totalEntries: 0,
      });
    });

    filteredConsumptions
      .filter(c => c.consumptionType === 'mine')
      .forEach(c => {
        let entry = map.get(c.targetId);
        if (!entry) {
          entry = {
            mineId: c.targetId,
            mineName: c.targetName,
            itemBreakdown: {},
            totalEntries: 0,
          };
          map.set(c.targetId, entry);
        }
        if (!entry.itemBreakdown[c.itemId]) {
          entry.itemBreakdown[c.itemId] = { itemName: c.itemName, unit: c.unit, quantity: 0 };
        }
        entry.itemBreakdown[c.itemId].quantity += c.quantity;
        entry.totalEntries += 1;
      });

    return Array.from(map.values()).sort((a, b) => b.totalEntries - a.totalEntries);
  }, [mines, filteredConsumptions]);

  // 3. Item-wise Aggregation
  const itemWiseSummary = useMemo(() => {
    const map = new Map<string, {
      itemId: string;
      itemCode: string;
      itemName: string;
      unit: string;
      vehicleQty: number;
      mineQty: number;
      totalQty: number;
      entriesCount: number;
    }>();

    filteredConsumptions.forEach(c => {
      const existing = map.get(c.itemId) || {
        itemId: c.itemId,
        itemCode: c.itemCode,
        itemName: c.itemName,
        unit: c.unit,
        vehicleQty: 0,
        mineQty: 0,
        totalQty: 0,
        entriesCount: 0,
      };

      if (c.consumptionType === 'vehicle') {
        existing.vehicleQty += c.quantity;
      } else {
        existing.mineQty += c.quantity;
      }
      existing.totalQty += c.quantity;
      existing.entriesCount += 1;
      map.set(c.itemId, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
  }, [filteredConsumptions]);

  // -------------------------------------------------------------
  // Report Filtered Data (respects user's add/remove items from report table)
  // -------------------------------------------------------------
  const reportTableRows = useMemo(() => {
    return filteredConsumptions.filter(c => selectedReportItemIds.includes(c.itemId));
  }, [filteredConsumptions, selectedReportItemIds]);

  const toggleReportItem = (itemId: string) => {
    setSelectedReportItemIds(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  // CSV Export
  const handleExportCSV = () => {
    if (activeSubTab === 'vehicles') {
      const headers = ['Sr', 'Vehicle No', 'Equipment Type', 'Driver / Operator', 'Status'];
      const rows = filteredVehicles.map((v, i) => [i + 1, `"${v.vehicleNo}"`, `"${v.vehicleType}"`, `"${v.driverName}"`, v.status]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Vehicles_Fleet_Register_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Vehicles register exported to CSV.');
      return;
    }

    if (activeSubTab === 'mines') {
      const headers = ['Sr', 'Mine Name', 'Location / Ridge', 'Incharge / Mining Officer', 'Status'];
      const rows = filteredMines.map((m, i) => [i + 1, `"${m.name}"`, `"${m.location || ''}"`, `"${m.incharge || ''}"`, m.status]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Mines_Sites_Register_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Mines register exported to CSV.');
      return;
    }

    const headers = ['Sr.', 'Date', 'Type', 'Target (Vehicle/Mine)', 'Item Code', 'Item Name', 'Unit', 'Quantity Consumed', 'Operator / Incharge', 'Remarks'];
    const rows = filteredConsumptions.map((c, idx) => [
      idx + 1,
      `"${c.date}"`,
      c.consumptionType.toUpperCase(),
      `"${c.targetName.replace(/"/g, '""')}"`,
      `"${c.itemCode}"`,
      `"${c.itemName.replace(/"/g, '""')}"`,
      `"${c.unit}"`,
      c.quantity,
      `"${(c.operatorName || '').replace(/"/g, '""')}"`,
      `"${(c.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Item_Consumption_Register_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Consumption register exported to CSV.');
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

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Store Management
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500 font-medium">Item Consumption</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Fuel className="w-5 h-5 text-blue-600" />
            <span>Item Consumption (Vehicles & Mines)</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Record material and fuel issues to heavy machinery and mine sites. Live inventory stock automatically decreases.
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
              if (activeSubTab === 'vehicles') {
                printConcernedTable('printable-vehicles-table', 'Fleet Machinery & Vehicles Register');
              } else if (activeSubTab === 'mines') {
                printConcernedTable('printable-mines-table', 'Mines & Mining Sites Register');
              } else {
                let tableId = 'printable-consumption-all-logs-table';
                let title = 'Store Item Consumption Register';
                if (viewGrouping === 'item_wise') {
                  tableId = 'printable-consumption-item-wise-table';
                  title = 'Store Item-wise Consumption Summary';
                }
                printConcernedTable(tableId, title);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print View (Table Only)</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs: View Item Consumption, Item Consumption Report, Add Consumption, Vehicles, Mines */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 border border-slate-200 rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => { setActiveSubTab('view_consumption'); setSearchTerm(''); }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'view_consumption'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Item Consumption</span>
            <span className="text-[10px] bg-black/15 px-1.5 py-0.2 rounded-full">{safeConsumptions.length}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveSubTab('consumption_report'); setSearchTerm(''); }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'consumption_report'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Item Consumption Report</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveSubTab('add_consumption'); setSearchTerm(''); }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'add_consumption'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Consumption</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveSubTab('vehicles'); setSearchTerm(''); }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'vehicles'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-teal-600" />
            <span>Vehicles (Consumption)</span>
            <span className="text-[10px] bg-black/15 px-1.5 py-0.2 rounded-full">{vehicles.length}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveSubTab('mines'); setSearchTerm(''); }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'mines'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Pickaxe className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mines (Consumption)</span>
            <span className="text-[10px] bg-black/15 px-1.5 py-0.2 rounded-full">{mines.length}</span>
          </button>
        </div>

        {/* Action Button based on Sub-Tab */}
        <div>
          {activeSubTab === 'vehicles' && (
            <button
              type="button"
              onClick={handleOpenAddVehicle}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Vehicle</span>
            </button>
          )}
          {activeSubTab === 'mines' && (
            <button
              type="button"
              onClick={handleOpenAddMine}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Mine</span>
            </button>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------
          SUB-TAB 1: ADD CONSUMPTION FORM
          Vehicle Consumption & Mine Consumption
          Item dropdown shows CURRENT STOCK QUANTITY
          Decreases item stock quantity
          ------------------------------------------------------------- */}
      {activeSubTab === 'add_consumption' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-3xl">
          <div className="pb-4 mb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Record Item Consumption Issue</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Issue fuel, lubricants, spare parts, or explosives. Stock decreases automatically.
              </p>
            </div>

            {/* Target Switcher: Vehicle Consumption vs Mine Consumption */}
            <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setFormConsumptionType('vehicle')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  formConsumptionType === 'vehicle'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-teal-600" />
                <span>Vehicle Consumption</span>
              </button>
              <button
                type="button"
                onClick={() => setFormConsumptionType('mine')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  formConsumptionType === 'mine'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Pickaxe className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mine Consumption</span>
              </button>
            </div>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Requisition Date */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Requisition Date <span className="text-rose-500">*</span>
                </label>
                <DatePickerInput value={formDate} onChange={setFormDate} className="w-full text-xs" />
              </div>

              {/* Vehicle / Mine Selector */}
              {formConsumptionType === 'vehicle' ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 flex items-center gap-1.5 text-xs">
                      <Truck className="w-3.5 h-3.5 text-teal-600" />
                      <span>Select Vehicle / Machinery <span className="text-rose-500">*</span></span>
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenAddVehicle}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Vehicle</span>
                    </button>
                  </div>
                  <select
                    required
                    value={formVehicleId}
                    onChange={(e) => setFormVehicleId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {vehicles.length === 0 ? (
                      <option value="" disabled>No vehicles registered. Click "+ New Vehicle" or go to Vehicles tab.</option>
                    ) : (
                      vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.vehicleNo} ({v.vehicleType}) {v.driverName ? `— Driver: ${v.driverName}` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 flex items-center gap-1.5 text-xs">
                      <Pickaxe className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Select Mine Site <span className="text-rose-500">*</span></span>
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenAddMine}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Mine</span>
                    </button>
                  </div>
                  <select
                    required
                    value={formMineId}
                    onChange={(e) => setFormMineId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {mines.length === 0 ? (
                      <option value="" disabled>No mines registered. Click "+ New Mine" or go to Mines tab.</option>
                    ) : (
                      mines.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.location ? `(${m.location})` : ''} {m.incharge ? `— Incharge: ${m.incharge}` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {/* Item Dropdown WITH CURRENT LIVE INVENTORY QUANTITY */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>
                    Item Selection (Linked to Item Inventory) <span className="text-rose-500">*</span>
                  </span>
                  {selectedItem && (
                    <span className="text-[11px] font-normal text-slate-500">
                      Code: <strong className="font-mono text-slate-800">{selectedItem.itemCode}</strong>
                    </span>
                  )}
                </label>
                <select
                  required
                  value={formItemId}
                  onChange={(e) => setFormItemId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white font-medium"
                >
                  {items.length === 0 ? (
                    <option value="" disabled>No store items found in catalog</option>
                  ) : (
                    items.map((item) => {
                      const totalInv = itemStockMap[item.id] ?? 0;
                      return (
                        <option key={item.id} value={item.id}>
                          {item.itemName} ({item.itemCode}) — [Available Inventory: {formatWholeNumber(totalInv)} {item.unitSymbol}]
                        </option>
                      );
                    })
                  )}
                </select>
              </div>

              {/* Live Inventory Ceiling & Date-wise Balance Banner */}
              {selectedItem && (
                <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Boxes className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="font-bold text-slate-900 text-xs">
                          Item Inventory Balance: {selectedItem.itemName} ({selectedItem.itemCode})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Consumption is strictly limited within the item's available total inventory and date-wise cumulative balance.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Inventory</span>
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {formatWholeNumber(currentTotalInventory)} {selectedItem.unitSymbol}
                        </span>
                      </div>
                      <div className="h-6 w-px bg-slate-200" />
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 block">Available on {formDate}</span>
                        <span className={`font-mono font-black text-sm ${dateWiseAvailableInventory > 0 ? 'text-emerald-800' : 'text-rose-600'}`}>
                          {formatWholeNumber(dateWiseAvailableInventory)} {selectedItem.unitSymbol}
                        </span>
                      </div>
                    </div>
                  </div>

                  {maxAllowedConsumption <= 0 && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        <strong>Out of Available Inventory:</strong> Zero quantity is available for <strong>{selectedItem.itemName}</strong> on or prior to {formDate}. Please add date-wise inventory in <strong>Item Inventory</strong> first.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Consumption Quantity */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Consumption Quantity (Deducted from Inventory) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    max={maxAllowedConsumption > 0 ? maxAllowedConsumption : undefined}
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={maxAllowedConsumption > 0 ? `Max ${formatWholeNumber(maxAllowedConsumption)}` : '0'}
                    className="w-full pl-3 pr-16 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                    {selectedItem?.unitSymbol || 'Units'}
                  </span>
                </div>
                {Number(formQuantity) > maxAllowedConsumption && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    Cannot issue more than {formatWholeNumber(maxAllowedConsumption)} {selectedItem?.unitSymbol} on {formDate}!
                  </p>
                )}
              </div>

              {/* Operator / Receiving Incharge */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Operator / Driver / Receiving Official
                </label>
                <input
                  type="text"
                  value={formOperator}
                  onChange={(e) => setFormOperator(e.target.value)}
                  placeholder="e.g. Abdul Rasheed, Engr. Tariq"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Purpose / Work Order / Remarks
              </label>
              <textarea
                rows={2}
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                placeholder="Hour meter reading, pit excavation haulage run, compressor overhaul..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSubTab('view_consumption')}
                className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={maxAllowedConsumption <= 0 || (Number(formQuantity) > maxAllowedConsumption)}
                className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Issue Consumption
              </button>
            </div>
          </form>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 2: VIEW ITEM CONSUMPTION
          Views: Vehicle-wise, Mine(s)-wise, Item-wise, All Logs
          ------------------------------------------------------------- */}
      {activeSubTab === 'view_consumption' && (
        <div className="space-y-4">
          {/* Top Controls: Switch between All Logs, Vehicle-wise, Mine(s)-wise, Item-wise */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
            <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setViewGrouping('all_logs')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  viewGrouping === 'all_logs' 
                    ? 'bg-white text-blue-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Logs ({safeConsumptions.length})
              </button>

              <button
                type="button"
                onClick={() => setViewGrouping('vehicle_wise')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  viewGrouping === 'vehicle_wise' 
                    ? 'bg-white text-teal-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-teal-600" />
                <span>Vehicle-Wise</span>
              </button>

              <button
                type="button"
                onClick={() => setViewGrouping('mine_wise')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  viewGrouping === 'mine_wise' 
                    ? 'bg-white text-emerald-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Pickaxe className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mine(s)-Wise</span>
              </button>

              <button
                type="button"
                onClick={() => setViewGrouping('item_wise')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  viewGrouping === 'item_wise' 
                    ? 'bg-white text-purple-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span>Item-Wise Consolidated</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search consumption records..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 1. VEHICLE-WISE VIEW */}
          {viewGrouping === 'vehicle_wise' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-teal-600" />
                    <span>Vehicle-Wise Item Consumption Summary</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">{vehicleWiseSummary.length} Vehicles Registered</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {vehicleWiseSummary.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No vehicles found. Add vehicles in "Vehicles (Consumption)" tab.
                    </div>
                  ) : (
                    vehicleWiseSummary.map((veh) => {
                      const itemsIssued = Object.values(veh.itemBreakdown);
                      return (
                        <div key={veh.vehicleId} className="p-4 hover:bg-slate-50/50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-xs">
                                🚛
                              </span>
                              <div>
                                <span className="font-bold text-xs text-slate-900 block">{veh.vehicleNo}</span>
                                <span className="text-[11px] text-slate-500 font-mono">{veh.totalEntries} Requisition Logs</span>
                              </div>
                            </div>
                          </div>

                          {/* Items issued to this vehicle */}
                          {itemsIssued.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic">No consumption issues logged yet for this vehicle.</p>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                              {itemsIssued.map((it, idx) => (
                                <div key={idx} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                                  <span className="text-slate-500 text-[10px] block truncate">{it.itemName}</span>
                                  <span className="font-mono font-bold text-teal-900 text-sm">
                                    {formatWholeNumber(it.quantity)} <span className="text-[10px] text-slate-500 font-normal">{it.unit}</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. MINE(S)-WISE VIEW */}
          {viewGrouping === 'mine_wise' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Pickaxe className="w-4 h-4 text-emerald-600" />
                    <span>Mine(s)-Wise Item Consumption Summary</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">{mineWiseSummary.length} Mining Sites</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {mineWiseSummary.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No mine sites found. Add mines in "Mines (Consumption)" tab.
                    </div>
                  ) : (
                    mineWiseSummary.map((mine) => {
                      const itemsIssued = Object.values(mine.itemBreakdown);
                      return (
                        <div key={mine.mineId} className="p-4 hover:bg-slate-50/50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs">
                                ⛏️
                              </span>
                              <div>
                                <span className="font-bold text-xs text-slate-900 block">{mine.mineName}</span>
                                <span className="text-[11px] text-slate-500 font-mono">{mine.totalEntries} Requisition Logs</span>
                              </div>
                            </div>
                          </div>

                          {/* Items issued to this mine */}
                          {itemsIssued.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic">No consumption issues logged yet for this mine.</p>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                              {itemsIssued.map((it, idx) => (
                                <div key={idx} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                                  <span className="text-slate-500 text-[10px] block truncate">{it.itemName}</span>
                                  <span className="font-mono font-bold text-emerald-900 text-sm">
                                    {formatWholeNumber(it.quantity)} <span className="text-[10px] text-slate-500 font-normal">{it.unit}</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. ITEM-WISE CONSOLIDATED VIEW TABLE */}
          {viewGrouping === 'item_wise' && (
            <div id="printable-consumption-item-wise-table" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print-concerned-table">
              <div className="hidden print:block print-only-header p-4 border-b border-slate-200 text-center">
                <h1 className="text-lg font-bold text-slate-900">Store Management - Item-Wise Consolidated Consumption</h1>
                <p className="text-xs text-slate-600">Generated on {new Date().toLocaleDateString('en-GB')} · Official Material & Fuel Issues Summary</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">Sr.</th>
                      <th className="py-3 px-4">Item Code</th>
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4 text-right text-teal-800 bg-teal-50/40">Vehicle Usage</th>
                      <th className="py-3 px-4 text-right text-emerald-800 bg-emerald-50/40">Mine Usage</th>
                      <th className="py-3 px-4 text-right font-bold text-slate-900 bg-slate-100/60">
                        Total Consumption
                      </th>
                      <th className="py-3 px-4 text-center">Entries</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {itemWiseSummary.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400">
                          No item consumption records found.
                        </td>
                      </tr>
                    ) : (
                      itemWiseSummary.map((row, idx) => (
                        <tr key={row.itemId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.itemCode}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{row.itemName}</td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-teal-800 bg-teal-50/20">
                            {formatWholeNumber(row.vehicleQty)} <span className="text-[10px] text-slate-400">{row.unit}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-800 bg-emerald-50/20">
                            {formatWholeNumber(row.mineQty)} <span className="text-[10px] text-slate-400">{row.unit}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-rose-900 bg-slate-100/40 tabular-nums">
                            {formatWholeNumber(row.totalQty)} <span className="text-[10px] text-slate-500 font-normal">{row.unit}</span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-500">
                            {row.entriesCount} logs
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. ALL DETAILED LOGS REGISTER TABLE */}
          {viewGrouping === 'all_logs' && (
            <div id="printable-consumption-all-logs-table" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print-concerned-table">
              <div className="hidden print:block print-only-header p-4 border-b border-slate-200 text-center">
                <h1 className="text-lg font-bold text-slate-900">Store Management - Item Consumption Register</h1>
                <p className="text-xs text-slate-600">Generated on {new Date().toLocaleDateString('en-GB')} · Official Machinery & Mining Requisition Logs</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">Sr.</th>
                      <th className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (sortField === 'date') setSortAsc(!sortAsc);
                            else { setSortField('date'); setSortAsc(false); }
                          }}
                          className="flex items-center gap-1 font-semibold hover:text-slate-900 cursor-pointer"
                        >
                          <span>Date</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (sortField === 'targetName') setSortAsc(!sortAsc);
                            else { setSortField('targetName'); setSortAsc(true); }
                          }}
                          className="flex items-center gap-1 font-semibold hover:text-slate-900 cursor-pointer"
                        >
                          <span>Target (Vehicle / Mine)</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-3 px-4">Item Code</th>
                      <th className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (sortField === 'itemName') setSortAsc(!sortAsc);
                            else { setSortField('itemName'); setSortAsc(true); }
                          }}
                          className="flex items-center gap-1 font-semibold hover:text-slate-900 cursor-pointer"
                        >
                          <span>Item Name</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (sortField === 'quantity') setSortAsc(!sortAsc);
                            else { setSortField('quantity'); setSortAsc(false); }
                          }}
                          className="inline-flex items-center gap-1 font-semibold hover:text-slate-900 cursor-pointer"
                        >
                          <span>Quantity Consumed</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-3 px-4">Operator / Incharge</th>
                      <th className="py-3 px-4">Remarks</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredConsumptions.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-10 text-center text-slate-400">
                          No consumption entries match selected filter. Click "Add Consumption" to record issues.
                        </td>
                      </tr>
                    ) : (
                      filteredConsumptions.map((rec, idx) => (
                        <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{rec.date}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              rec.consumptionType === 'vehicle' 
                                ? 'bg-teal-100 text-teal-800' 
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {rec.consumptionType === 'vehicle' ? <Truck className="w-3 h-3" /> : <Pickaxe className="w-3 h-3" />}
                              <span>{rec.consumptionType === 'vehicle' ? 'Vehicle' : 'Mine'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{rec.targetName}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{rec.itemCode}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{rec.itemName}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-rose-800 tabular-nums">
                            -{formatWholeNumber(rec.quantity)} <span className="text-[10px] font-normal text-slate-500">{rec.unit}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{rec.operatorName || '—'}</td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{rec.remarks || '—'}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(rec)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Consumption"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePrompt(rec)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Record"
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
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 3: ITEM CONSUMPTION REPORT
          User can add/remove items from the report table
          All kinds of sorting, filtering, export and print options
          ------------------------------------------------------------- */}
      {activeSubTab === 'consumption_report' && (
        <div className="space-y-4">
          {/* Interactive Item Selector Filter: Add / Remove Items from the report table */}
          <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <span>Select Items to Include in Report Table ({selectedReportItemIds.length}/{items.length})</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReportItemIds(items.map(i => i.id))}
                  className="text-[11px] text-blue-600 hover:underline cursor-pointer font-medium"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedReportItemIds([])}
                  className="text-[11px] text-slate-500 hover:underline cursor-pointer font-medium"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Checkboxes of items to add/remove */}
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
              {items.map((item) => {
                const isSelected = selectedReportItemIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleReportItem(item.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3 pointer-events-none"
                    />
                    <span>{item.itemName} ({item.itemCode})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtering Bar for Report: Search, Type filter, Date range */}
          <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter report..."
                  className="w-full pl-8 pr-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium"
              >
                <option value="all">All Targets (Vehicles & Mines)</option>
                <option value="vehicle">Vehicles Only</option>
                <option value="mine">Mines Only</option>
              </select>

              <div className="flex items-center gap-1 text-slate-500">
                <span>From:</span>
                <input
                  type="text"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="DD-MM-YYYY"
                  className="w-24 px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                />
                <span>To:</span>
                <input
                  type="text"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="DD-MM-YYYY"
                  className="w-24 px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={() => printConcernedTable('printable-consumption-report-table', 'Store Item Consumption Report')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Table Only</span>
              </button>
            </div>
          </div>

          {/* Report Table */}
          <div id="printable-consumption-report-table" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print-concerned-table">
            <div className="hidden print:block print-only-header p-4 border-b border-slate-200 text-center">
              <h1 className="text-lg font-bold text-slate-900">Store Management - Item Consumption Audit Report</h1>
              <p className="text-xs text-slate-600">Generated on {new Date().toLocaleDateString('en-GB')} · Official Material & Fuel Requisition Report</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Sr.</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Target Type</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Item Code</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4 text-right">Quantity Consumed</th>
                    <th className="py-3 px-4">Authorizing Official</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {reportTableRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400">
                        No consumption entries match report criteria or selected items.
                      </td>
                    </tr>
                  ) : (
                    reportTableRows.map((rec, idx) => (
                      <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">{rec.date}</td>
                        <td className="py-2.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            rec.consumptionType === 'vehicle' ? 'bg-teal-50 text-teal-800' : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            {rec.consumptionType === 'vehicle' ? 'Vehicle' : 'Mine'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">{rec.targetName}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{rec.itemCode}</td>
                        <td className="py-2.5 px-4 text-slate-800">{rec.itemName}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-800 tabular-nums">
                          -{formatWholeNumber(rec.quantity)} <span className="text-[10px] text-slate-400 font-normal">{rec.unit}</span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">{rec.operatorName || '—'}</td>
                        <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate">{rec.remarks || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 4: VEHICLES (CONSUMPTION)
          ------------------------------------------------------------- */}
      {activeSubTab === 'vehicles' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vehicle number, machinery type, driver name..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={handleOpenAddVehicle}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Vehicle</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table id="printable-vehicles-table" className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Sr.</th>
                    <th className="py-3 px-4">Vehicle No / Reg</th>
                    <th className="py-3 px-4">Machinery Type</th>
                    <th className="py-3 px-4">Assigned Driver / Operator</th>
                    <th className="py-3 px-4 text-center">Operational Status</th>
                    <th className="py-3 px-4 text-right no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        No vehicles or machinery registered. Click "Add Vehicle" to register units for consumption.
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
                        <td className="py-3 px-4 text-right no-print">
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
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 5: MINES (CONSUMPTION)
          ------------------------------------------------------------- */}
      {activeSubTab === 'mines' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search mine name, location, incharge..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={handleOpenAddMine}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Mine</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table id="printable-mines-table" className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Sr.</th>
                    <th className="py-3 px-4">Mine Name</th>
                    <th className="py-3 px-4">Location / Ridge</th>
                    <th className="py-3 px-4">Incharge / Mining Officer</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredMines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        No mines registered. Click "Add Mine" to register production sites for consumption.
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
                        <td className="py-3 px-4 text-right no-print">
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
        </div>
      )}

      {/* =========================================================
          EDIT CONSUMPTION MODAL
          ========================================================= */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Edit Consumption Issue</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Target:</span>
                  <span className="font-semibold text-slate-900">{editingRecord.targetName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Item:</span>
                  <span className="font-semibold text-slate-900">{editingRecord.itemName} ({editingRecord.itemCode})</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date</label>
                <DatePickerInput value={editDate} onChange={setEditDate} className="w-full text-xs" />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quantity ({editingRecord.unit})</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 font-mono font-bold text-rose-800 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operator / Official</label>
                <input
                  type="text"
                  value={editOperator}
                  onChange={(e) => setEditOperator(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-3.5 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Update Issue
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
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
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
                  className="px-3.5 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                >
                  {editingVehicle ? 'Save Changes' : 'Register Vehicle'}
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
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
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
                  className="px-3.5 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                >
                  {editingMine ? 'Save Changes' : 'Register Mine'}
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

export default ItemConsumptionView;
