import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  BarChart3, 
  Settings as SettingsIcon,
  LogOut, 
  RefreshCw, 
  Database, 
  Activity,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { DatabaseDiagnosticsModal } from './components/common/DatabaseDiagnosticsModal';
import { 
  getDbApiDiagnosticLogs, 
  subscribeDbApiDiagnostics 
} from './api/client';
import { 
  NavModule, 
  NavTarget,
  DemandDocument, 
  PurchaseDocument,
  DemandItem,
  PurchaseSummaryItem,
  User,
  UserRole
} from './types';
import { initialUsers } from './data/mockUsers';
import { LoginScreen } from './components/auth/LoginScreen';
import { UsersScreen } from './components/users/UsersScreen';
import { UserProfileModal } from './components/common/UserProfileModal';
import { recordActivity } from './services/activityLogger';
import { RoleDashboard } from './components/dashboard/RoleDashboard';
import { ChartAccount, VoucherDocument } from './types/accounting';
import { 
  CashBookEntry, 
  BankRecord, 
  BankAccountRecord, 
  BankTransaction,
  CreditBookEntry
} from './types/treasury';
import { 
  CompanySettings, 
  BuyerRecord, 
  PartnerRecord, 
  StoreItem, 
  ItemStockEntry, 
  ItemConsumptionRecord, 
  CoalStockRecord, 
  CoalSellRecord, 
  ItemCategory, 
  ItemUnitType, 
  MineRecord, 
  VehicleRecord,
  PosCoalSellEntry,
  StockItem,
  StockEntry,
  CoalProductionRecord,
  VehicleConsumptionRecord,
  ConsumptionTargetType
} from './types/storeSales';
import { initialDemands, initialPurchases } from './data/mockData';
import { initialChartOfAccounts, initialVouchers } from './data/mockAccountingData';
import { 
  initialCashBookEntries, 
  initialBanks, 
  initialBankAccounts,
  initialCreditBookEntries
} from './data/mockTreasuryData';
import { 
  initialCompanySettings, 
  initialBuyers, 
  initialPartners, 
  initialCoalStocks, 
  initialCoalSells, 
  initialStoreItems, 
  initialStockEntries, 
  initialVehicles, 
  initialItemConsumptions,
  initialItemCategories,
  initialItemUnits,
  initialMines,
} from './data/mockStoreSalesData';
import { Sidebar } from './components/Sidebar';
import { PurchaseScreen } from './components/PurchaseScreen';
import { AdminApprovalView } from './components/AdminApprovalView';
import { AccountingScreen } from './components/accounting/AccountingScreen';
import { TreasuryScreen } from './components/treasury/TreasuryScreen';
import { StoreSalesScreen } from './components/store_sales/StoreSalesScreen';
import {
  fetchBootstrapData,
  apiSaveUser,
  apiDeleteUser,
  apiSaveDemand,
  apiDeleteDemand,
  apiSavePurchase,
  apiDeletePurchase,
  apiSaveChartAccount,
  apiDeleteChartAccount,
  apiBulkSaveChartAccounts,
  apiSaveVoucher,
  apiDeleteVoucher,
  apiSaveCashBookEntry,
  apiDeleteCashBookEntry,
  apiSaveCreditBookEntry,
  apiDeleteCreditBookEntry,
  apiSaveBank,
  apiDeleteBank,
  apiSaveBankAccount,
  apiDeleteBankAccount,
  apiSaveCompanySettings,
  apiSaveBuyer,
  apiDeleteBuyer,
  apiSavePartner,
  apiDeletePartner,
  apiSavePosCoalSale,
  apiDeletePosCoalSale,
  apiSaveCoalSellRecord,
  apiDeleteCoalSellRecord,
  apiSaveCoalProduction,
  apiDeleteCoalProduction,
  apiSaveStockItem,
  apiDeleteStockItem,
  apiSaveStockEntry,
  apiDeleteStockEntry,
  apiSaveVehicle,
  apiDeleteVehicle,
  apiSaveVehicleConsumption,
  apiDeleteVehicleConsumption,
} from './api/client';

// One-time client cache purge for operational mock data (guaranteeing users and active sessions are preserved)
const MOCK_DATA_PURGE_KEY = 'ahcm_erp_mock_purged_v2';
try {
  if (typeof window !== 'undefined' && localStorage.getItem(MOCK_DATA_PURGE_KEY) !== 'true') {
    const mockCacheKeys = [
      'ahcm_erp_demands',
      'ahcm_erp_purchases',
      'ahcm_erp_vouchers',
      'ahcm_erp_cash_book',
      'ahcm_erp_credit_book',
      'ahcm_erp_banks',
      'ahcm_erp_bank_accounts',
      'ahcm_erp_buyers',
      'ahcm_erp_partners',
      'ahcm_erp_coal_stocks',
      'ahcm_erp_coal_sells',
      'ahcm_erp_item_categories',
      'ahcm_erp_item_units',
      'ahcm_erp_item_mines',
      'ahcm_erp_vehicles',
      'ahcm_erp_store_items',
      'ahcm_erp_stock_entries',
      'ahcm_erp_consumptions',
      'ahcm_erp_stock_items',
      'ahcm_erp_pos_sales',
      'ahcm_erp_coal_production',
    ];
    for (const key of mockCacheKeys) {
      localStorage.removeItem(key);
    }
    localStorage.setItem(MOCK_DATA_PURGE_KEY, 'true');
  }
} catch {}

function loadCache<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(`ahcm_erp_${key}`);
    if (item) {
      const parsed = JSON.parse(item);
      if (Array.isArray(defaultValue)) {
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as unknown as T;
      } else if (parsed && typeof parsed === 'object') {
        return parsed as unknown as T;
      }
    }
  } catch {}
  return defaultValue;
}

function saveCache<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`ahcm_erp_${key}`, JSON.stringify(value));
  } catch {}
}

export default function App() {
  // User Management & Persistence
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('ahcm_erp_users');
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    return initialUsers;
  });

  // Current authenticated user - Entry point is Signin Page (null initially)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ahcm_erp_active_user');
    if (saved) {
      try {
        const parsed: User = JSON.parse(saved);
        if (parsed && parsed.id) {
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    return null;
  });

  const [currentModule, setCurrentModule] = useState<NavModule>(() => {
    const saved = localStorage.getItem('ahcm_erp_active_module');
    return (saved as NavModule) || 'dashboard';
  });
  const [activeNavTarget, setActiveNavTarget] = useState<NavTarget | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ahcm_erp_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ahcm_erp_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const handleNavigateOperation = (target: NavTarget) => {
    setCurrentModule(target.module);
    setActiveNavTarget(target);
  };

  // Sync active module
  useEffect(() => {
    localStorage.setItem('ahcm_erp_active_module', currentModule);
  }, [currentModule]);

  // Sync users to localStorage
  useEffect(() => {
    localStorage.setItem('ahcm_erp_users', JSON.stringify(users));
  }, [users]);

  // Sync active session
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ahcm_erp_active_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('ahcm_erp_active_user');
    }
  }, [currentUser]);

  // Role permissions mapping
  const getAllowedModules = (role: UserRole): NavModule[] => {
    switch (role) {
      case 'purchaser':
        return ['dashboard', 'purchase'];
      case 'cashier':
        return ['dashboard', 'treasury'];
      case 'accountant':
        return ['dashboard', 'accounting'];
      case 'store_manager':
        return ['dashboard', 'store_sales'];
      case 'admin':
      default:
        return [
          'dashboard', 
          'admin_approvals', 
          'users', 
          'purchase', 
          'accounting', 
          'treasury', 
          'store_sales', 
          'reports', 
          'settings'
        ];
    }
  };

  // Enforce role isolation guard on module navigation
  useEffect(() => {
    if (currentUser) {
      const allowed = getAllowedModules(currentUser.role);
      if (!allowed.includes(currentModule)) {
        setCurrentModule('dashboard');
      }
    }
  }, [currentUser, currentModule]);

  // Self Profile & Password Management State (Available in all modules)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Auth Handlers
  const handleLogin = (user: User) => {
    const now = new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
    const updated = { ...user, lastLogin: now };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    apiSaveUser(updated);
    setCurrentModule('dashboard');

    recordActivity({
      userId: user.id,
      username: user.username,
      userName: user.name,
      userRole: user.role,
      action: 'LOGIN',
      category: 'AUTH',
      description: `User ${user.name} (@${user.username}) successfully authenticated with role ${user.role}.`,
      status: 'SUCCESS',
    });
  };

  const handleLogout = () => {
    if (currentUser) {
      recordActivity({
        userId: currentUser.id,
        username: currentUser.username,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'LOGOUT',
        category: 'AUTH',
        description: `User ${currentUser.name} signed out of session.`,
        status: 'SUCCESS',
      });
    }
    setCurrentUser(null);
    setCurrentModule('dashboard');
  };

  // Self-Service Profile Update (Allowed for all users across all modules)
  const handleUpdateMyProfile = (updatedProfile: { name: string; department?: string; email?: string; phone?: string }) => {
    if (!currentUser) return;
    const oldName = currentUser.name;
    const updatedUser: User = {
      ...currentUser,
      name: updatedProfile.name.trim(),
      department: updatedProfile.department || currentUser.department,
      email: updatedProfile.email || currentUser.email,
      phone: updatedProfile.phone || currentUser.phone,
    };

    handleUpdateUser(updatedUser);

    recordActivity({
      userId: currentUser.id,
      username: currentUser.username,
      userName: updatedUser.name,
      userRole: currentUser.role,
      action: 'UPDATE_PROFILE',
      category: 'PROFILE',
      description: `User updated profile name from "${oldName}" to "${updatedUser.name}".`,
      details: {
        previousName: oldName,
        newName: updatedUser.name,
        department: updatedUser.department,
      },
      status: 'SUCCESS',
    });
  };

  // Self-Service Password Change (Allowed for all users across all modules)
  const handleChangeMyPassword = (currentPass: string, newPass: string) => {
    if (!currentUser) {
      return { success: false, message: 'No active session.' };
    }

    if (currentUser.password !== currentPass) {
      recordActivity({
        userId: currentUser.id,
        username: currentUser.username,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'CHANGE_PASSWORD_FAILED',
        category: 'PROFILE',
        description: `User @${currentUser.username} attempted to change password with incorrect current password.`,
        status: 'FAILED',
      });
      return { success: false, message: 'Current password does not match your active credentials.' };
    }

    if (!newPass || newPass.length < 4) {
      return { success: false, message: 'New password must be at least 4 characters.' };
    }

    const updatedUser: User = {
      ...currentUser,
      password: newPass,
    };

    handleUpdateUser(updatedUser);

    recordActivity({
      userId: currentUser.id,
      username: currentUser.username,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'CHANGE_PASSWORD_SUCCESS',
      category: 'PROFILE',
      description: `User @${currentUser.username} (${currentUser.name}) successfully changed their account password.`,
      status: 'SUCCESS',
    });

    return { success: true, message: 'Password updated successfully.' };
  };

  // Admin User Management Handlers
  const handleAddUser = (newUserData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...newUserData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
    };
    setUsers((prev) => {
      const next = [newUser, ...prev];
      try {
        localStorage.setItem('ahcm_erp_users', JSON.stringify(next));
      } catch {}
      return next;
    });
    apiSaveUser(newUser);

    if (currentUser) {
      recordActivity({
        userId: currentUser.id,
        username: currentUser.username,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'CREATE_USER',
        category: 'USER_MANAGEMENT',
        description: `Admin created new account @${newUser.username} (${newUser.name}) with role "${newUser.role}".`,
        details: { targetUserId: newUser.id, username: newUser.username, role: newUser.role },
        status: 'SUCCESS',
      });
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers((prev) => {
      const next = prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      try {
        localStorage.setItem('ahcm_erp_users', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('ahcm_erp_active_user', JSON.stringify(updatedUser));
      } catch {}
    }
    apiSaveUser(updatedUser);
  };

  const handleDeleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    setUsers((prev) => {
      const next = prev.filter((u) => u.id !== userId);
      try {
        localStorage.setItem('ahcm_erp_users', JSON.stringify(next));
      } catch {}
      return next;
    });
    apiDeleteUser(userId);

    if (currentUser && target) {
      recordActivity({
        userId: currentUser.id,
        username: currentUser.username,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'DELETE_USER',
        category: 'USER_MANAGEMENT',
        description: `Admin deleted user account @${target.username} (${target.name}).`,
        details: { targetUserId: userId, username: target.username },
        status: 'WARNING',
      });
    }
  };

  const handleResetPassword = (userId: string, newPass: string) => {
    let updatedTarget: User | null = null;
    setUsers((prev) => {
      const next = prev.map((u) => {
        if (u.id === userId) {
          updatedTarget = { ...u, password: newPass };
          return updatedTarget;
        }
        return u;
      });
      try {
        localStorage.setItem('ahcm_erp_users', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (currentUser && currentUser.id === userId && updatedTarget) {
      setCurrentUser(updatedTarget);
      try {
        localStorage.setItem('ahcm_erp_active_user', JSON.stringify(updatedTarget));
      } catch {}
    }
    if (updatedTarget) {
      apiSaveUser(updatedTarget);

      if (currentUser) {
        recordActivity({
          userId: currentUser.id,
          username: currentUser.username,
          userName: currentUser.name,
          userRole: currentUser.role,
          action: 'RESET_PASSWORD',
          category: 'USER_MANAGEMENT',
          description: `Admin reset password for user @${(updatedTarget as User).username} (${(updatedTarget as User).name}).`,
          details: { targetUserId: userId },
          status: 'WARNING',
        });
      }
    }
  };

  // Fully independent data states with instant refresh-resilient cache
  const [demands, setDemands] = useState<DemandDocument[]>(() => loadCache('demands', []));
  const [purchases, setPurchases] = useState<PurchaseDocument[]>(() => loadCache('purchases', []));

  // 100% ISOLATED ACCOUNTANT DATA STATE
  const [accounts, setAccounts] = useState<ChartAccount[]>(() => loadCache('accounts', []));
  const [vouchers, setVouchers] = useState<VoucherDocument[]>(() => loadCache('vouchers', []));

  // 100% ISOLATED TREASURY (CASHIER) DATA STATE
  const [cashBookEntries, setCashBookEntries] = useState<CashBookEntry[]>(() => loadCache('cash_book', []));
  const [creditBookEntries, setCreditBookEntries] = useState<CreditBookEntry[]>(() => loadCache('credit_book', []));
  const [banks, setBanks] = useState<BankRecord[]>(() => loadCache('banks', []));
  const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>(() => loadCache('bank_accounts', []));

  // 100% ISOLATED STORE & COAL MANAGEMENT DATA STATE
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => loadCache('company_settings', initialCompanySettings));
  const [buyers, setBuyers] = useState<BuyerRecord[]>(() => loadCache('buyers', initialBuyers));
  const [partners, setPartners] = useState<PartnerRecord[]>(() => loadCache('partners', initialPartners));
  const [coalStocks, setCoalStocks] = useState<CoalStockRecord[]>(() => loadCache('coal_stocks', initialCoalStocks));
  const [coalSells, setCoalSells] = useState<CoalSellRecord[]>(() => loadCache('coal_sells', initialCoalSells));

  // Store Management Data State
  const [categories, setCategories] = useState<ItemCategory[]>(() => loadCache('item_categories', initialItemCategories));
  const [unitTypes, setUnitTypes] = useState<ItemUnitType[]>(() => loadCache('item_units', initialItemUnits));
  const [mines, setMines] = useState<MineRecord[]>(() => loadCache('item_mines', initialMines));
  const [vehicles, setVehicles] = useState<VehicleRecord[]>(() => loadCache('vehicles', initialVehicles));
  const [storeItems, setStoreItems] = useState<StoreItem[]>(() => loadCache('store_items', initialStoreItems));
  const [stockEntries, setStockEntries] = useState<ItemStockEntry[]>(() => loadCache('stock_entries', initialStockEntries));
  const [itemConsumptions, setItemConsumptions] = useState<ItemConsumptionRecord[]>(() => {
    const raw = loadCache<any[]>('consumptions', initialItemConsumptions);
    return (raw || []).map((c, idx) => ({
      id: c.id || `con-${idx + 1}`,
      date: c.date || '01-01-2026',
      consumptionType: (c.consumptionType === 'mine' ? 'mine' : 'vehicle') as ConsumptionTargetType,
      targetId: c.targetId || c.vehicleId || c.mineId || (c.consumptionType === 'mine' ? 'mine-1' : 'veh-1'),
      targetName: c.targetName || c.vehicleNo || c.mineName || (c.consumptionType === 'mine' ? 'Mine #01 - North Pit' : 'DT-104 (Dump Truck)'),
      itemId: c.itemId || 'item-1',
      itemCode: c.itemCode || 'ITM-DSL-01',
      itemName: c.itemName || 'High Speed Diesel (HSD)',
      unit: c.unit || 'L',
      quantity: Number(c.quantity ?? c.diesel ?? c.mOil ?? 0),
      operatorName: c.operatorName || c.driverName || '',
      remarks: c.remarks || '',
      createdAt: c.createdAt || new Date().toISOString(),
    }));
  });

  // Database Synchronization & Diagnostics state
  const [isRefreshingDb, setIsRefreshingDb] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [diagnosticErrorsCount, setDiagnosticErrorsCount] = useState(0);

  useEffect(() => {
    const updateErrorCount = () => {
      const logs = getDbApiDiagnosticLogs();
      setDiagnosticErrorsCount(logs.filter((l) => !l.success).length);
    };
    updateErrorCount();
    return subscribeDbApiDiagnostics(updateErrorCount);
  }, []);

  const refreshDataFromDatabase = async () => {
    setIsRefreshingDb(true);
    try {
      const data = await fetchBootstrapData();
      if (!data) return;
      if (data.users?.length) {
        setUsers(data.users);
        saveCache('users', data.users);
        setCurrentUser((current) => {
          if (!current) return null;
          const fresh = data.users.find((u) => u.id === current.id);
          if (fresh) {
            try {
              localStorage.setItem('ahcm_erp_active_user', JSON.stringify(fresh));
            } catch {}
            return fresh;
          }
          return current;
        });
      }
      if (data.demands !== undefined) {
        setDemands(data.demands);
        saveCache('demands', data.demands);
      }
      if (data.purchases !== undefined) {
        setPurchases(data.purchases);
        saveCache('purchases', data.purchases);
      }
      if (data.accounts !== undefined) {
        setAccounts(data.accounts);
        saveCache('accounts', data.accounts);
      }
      if (data.vouchers !== undefined) {
        setVouchers(data.vouchers);
        saveCache('vouchers', data.vouchers);
      }
      if (data.cashBookEntries !== undefined) {
        setCashBookEntries(data.cashBookEntries);
        saveCache('cash_book', data.cashBookEntries);
      }
      if (data.creditBookEntries !== undefined) {
        setCreditBookEntries(data.creditBookEntries);
        saveCache('credit_book', data.creditBookEntries);
      }
      if (data.banks !== undefined) {
        setBanks(data.banks);
        saveCache('banks', data.banks);
      }
      if (data.bankAccounts !== undefined) {
        setBankAccounts(data.bankAccounts);
        saveCache('bank_accounts', data.bankAccounts);
      }
      if (data.companySettings) {
        setCompanySettings(data.companySettings);
        saveCache('company_settings', data.companySettings);
      }
      if (data.buyers !== undefined) {
        setBuyers(data.buyers);
        saveCache('buyers', data.buyers);
      }
      if (data.partners !== undefined) {
        setPartners(data.partners);
        saveCache('partners', data.partners);
      }
      if (data.posEntries !== undefined) {
        setCoalSells(data.posEntries as any);
        saveCache('coal_sells', data.posEntries);
      }
      if (data.coalSellRecords !== undefined) {
        setCoalSells(data.coalSellRecords as any);
        saveCache('coal_sells', data.coalSellRecords);
      }
      if (data.coalProductionRecords !== undefined) {
        setCoalStocks(data.coalProductionRecords as any);
        saveCache('coal_stocks', data.coalProductionRecords);
      }
      if (data.stockItems !== undefined) {
        setStoreItems(data.stockItems as any);
        saveCache('store_items', data.stockItems);
      }
      if (data.stockEntries !== undefined) {
        setStockEntries(data.stockEntries);
        saveCache('stock_entries', data.stockEntries);
      }
      if (data.vehicles !== undefined) {
        setVehicles(data.vehicles);
        saveCache('vehicles', data.vehicles);
      }
      if (data.vehicleConsumptions !== undefined) {
        setItemConsumptions(data.vehicleConsumptions as any);
        saveCache('consumptions', data.vehicleConsumptions);
      }
    } catch (err) {
      console.warn('Failed to refresh data from database:', err);
    } finally {
      setIsRefreshingDb(false);
    }
  };

  // Initial bootstrap from backend Supabase PostgreSQL database
  useEffect(() => {
    refreshDataFromDatabase();
  }, []);

  // Demand Handlers
  const handleSaveDemand = (demand: DemandDocument) => {
    setDemands((prev) => {
      const exists = prev.some((d) => d.id === demand.id);
      const next = exists ? prev.map((d) => (d.id === demand.id ? demand : d)) : [demand, ...prev];
      saveCache('demands', next);
      return next;
    });
    apiSaveDemand(demand);
  };

  const handleFinalizeDemand = (id: string) => {
    let toSave: DemandDocument | null = null;
    setDemands((prev) => {
      const next = prev.map((d) => {
        if (d.id === id) {
          toSave = { ...d, status: 'Finalized', updatedAt: new Date().toISOString().substring(0, 16) };
          return toSave;
        }
        return d;
      });
      saveCache('demands', next);
      return next;
    });
    if (toSave) apiSaveDemand(toSave);
  };

  const handleSubmitDemand = (id: string) => {
    let toSave: DemandDocument | null = null;
    setDemands((prev) => {
      const next = prev.map((d) => {
        if (d.id === id) {
          toSave = { ...d, status: 'Submitted for Approval', updatedAt: new Date().toISOString().substring(0, 16) };
          return toSave;
        }
        return d;
      });
      saveCache('demands', next);
      return next;
    });
    if (toSave) apiSaveDemand(toSave);
  };

  const handleSubmitMultipleDemands = (ids: string[]) => {
    const toSaves: DemandDocument[] = [];
    setDemands((prev) => {
      const next = prev.map((d) => {
        if (ids.includes(d.id)) {
          const updated: DemandDocument = { ...d, status: 'Submitted for Approval', updatedAt: new Date().toISOString().substring(0, 16) };
          toSaves.push(updated);
          return updated;
        }
        return d;
      });
      saveCache('demands', next);
      return next;
    });
    toSaves.forEach((doc) => apiSaveDemand(doc));
  };

  const handleUpdateDemandItems = (id: string, updatedItems: DemandItem[]) => {
    let toSave: DemandDocument | null = null;
    setDemands((prev) => {
      const next = prev.map((d) => {
        if (d.id !== id) return d;
        const total = Number(
          updatedItems.reduce((sum, it) => sum + it.amount, 0).toFixed(2)
        );
        toSave = {
          ...d,
          items: updatedItems,
          totalAmount: total,
          updatedAt: new Date().toISOString().substring(0, 16),
        };
        return toSave;
      });
      saveCache('demands', next);
      return next;
    });
    if (toSave) apiSaveDemand(toSave);
  };

  const handleApproveDemand = (id: string, remark?: string) => {
    let toSave: DemandDocument | null = null;
    setDemands((prev) => {
      const next = prev.map((d) => {
        if (d.id === id) {
          toSave = { ...d, status: 'Approved', adminRemark: remark };
          return toSave;
        }
        return d;
      });
      saveCache('demands', next);
      return next;
    });
    if (toSave) apiSaveDemand(toSave);
  };

  const handleRejectDemand = (id: string, remark?: string) => {
    let toSave: DemandDocument | null = null;
    setDemands((prev) => {
      const next = prev.map((d) => {
        if (d.id === id) {
          toSave = { ...d, status: 'Rejected', adminRemark: remark };
          return toSave;
        }
        return d;
      });
      saveCache('demands', next);
      return next;
    });
    if (toSave) apiSaveDemand(toSave);
  };

  // Purchase Handlers
  const handleSavePurchase = (purchase: PurchaseDocument) => {
    setPurchases((prev) => {
      const exists = prev.some((p) => p.id === purchase.id);
      const next = exists ? prev.map((p) => (p.id === purchase.id ? purchase : p)) : [purchase, ...prev];
      saveCache('purchases', next);
      return next;
    });
    apiSavePurchase(purchase);
  };

  const handleFinalizePurchase = (id: string) => {
    let toSave: PurchaseDocument | null = null;
    setPurchases((prev) => {
      const next = prev.map((p) => {
        if (p.id === id) {
          toSave = { ...p, status: 'Finalized', updatedAt: new Date().toISOString().substring(0, 16) };
          return toSave;
        }
        return p;
      });
      saveCache('purchases', next);
      return next;
    });
    if (toSave) apiSavePurchase(toSave);
  };

  const handleSubmitPurchase = (id: string) => {
    let toSave: PurchaseDocument | null = null;
    setPurchases((prev) => {
      const next = prev.map((p) => {
        if (p.id === id) {
          toSave = { ...p, status: 'Submitted for Approval', updatedAt: new Date().toISOString().substring(0, 16) };
          return toSave;
        }
        return p;
      });
      saveCache('purchases', next);
      return next;
    });
    if (toSave) apiSavePurchase(toSave);
  };

  const handleSubmitMultiplePurchases = (ids: string[]) => {
    const toSaves: PurchaseDocument[] = [];
    setPurchases((prev) => {
      const next = prev.map((p) => {
        if (ids.includes(p.id)) {
          const updated: PurchaseDocument = { ...p, status: 'Submitted for Approval', updatedAt: new Date().toISOString().substring(0, 16) };
          toSaves.push(updated);
          return updated;
        }
        return p;
      });
      saveCache('purchases', next);
      return next;
    });
    toSaves.forEach((doc) => apiSavePurchase(doc));
  };

  const handleUpdatePurchaseItems = (id: string, updatedItems: PurchaseSummaryItem[]) => {
    let toSave: PurchaseDocument | null = null;
    setPurchases((prev) => {
      const next = prev.map((p) => {
        if (p.id !== id) return p;
        const total = Number(
          updatedItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0).toFixed(2)
        );
        toSave = {
          ...p,
          items: updatedItems,
          totalAmount: total,
          updatedAt: new Date().toISOString().substring(0, 16),
        };
        return toSave;
      });
      saveCache('purchases', next);
      return next;
    });
    if (toSave) apiSavePurchase(toSave);
  };

  const handleApprovePurchase = (id: string, remark?: string) => {
    let toSave: PurchaseDocument | null = null;
    setPurchases((prev) => {
      const next = prev.map((p) => {
        if (p.id === id) {
          toSave = { ...p, status: 'Approved', adminRemark: remark };
          return toSave;
        }
        return p;
      });
      saveCache('purchases', next);
      return next;
    });
    if (toSave) apiSavePurchase(toSave);
  };

  const handleRejectPurchase = (id: string, remark?: string) => {
    let toSave: PurchaseDocument | null = null;
    setPurchases((prev) => {
      const next = prev.map((p) => {
        if (p.id === id) {
          toSave = { ...p, status: 'Rejected', adminRemark: remark };
          return toSave;
        }
        return p;
      });
      saveCache('purchases', next);
      return next;
    });
    if (toSave) apiSavePurchase(toSave);
  };

  const handleDeleteDemand = (id: string) => {
    setDemands((prev) => {
      const next = prev.filter((d) => d.id !== id);
      saveCache('demands', next);
      return next;
    });
    apiDeleteDemand(id);
  };

  const handleDeletePurchase = (id: string) => {
    setPurchases((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveCache('purchases', next);
      return next;
    });
    apiDeletePurchase(id);
  };

  // ACCOUNTANT HANDLERS (Completely isolated)
  const handleAddAccount = (account: ChartAccount) => {
    setAccounts((prev) => {
      const next = [...prev, account];
      saveCache('accounts', next);
      return next;
    });
    apiSaveChartAccount(account);
  };

  const handleUpdateAccount = (account: ChartAccount) => {
    setAccounts((prev) => {
      const next = prev.map((a) => (a.id === account.id ? account : a));
      saveCache('accounts', next);
      return next;
    });
    apiSaveChartAccount(account);
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      saveCache('accounts', next);
      return next;
    });
    apiDeleteChartAccount(id);
  };

  const handleImportAccounts = (importedAccounts: ChartAccount[], overrideAll: boolean) => {
    setAccounts((prev) => {
      let next: ChartAccount[];
      if (overrideAll) {
        next = importedAccounts;
      } else {
        const map = new Map<string, ChartAccount>();
        prev.forEach((a) => map.set(a.code || a.id, a));
        importedAccounts.forEach((a) => map.set(a.code || a.id, a));
        next = Array.from(map.values());
      }
      saveCache('accounts', next);
      return next;
    });
    apiBulkSaveChartAccounts(importedAccounts, overrideAll);
  };

  const handleSaveVoucher = (voucher: VoucherDocument) => {
    const existing = vouchers.find((v) => v.id === voucher.id);

    // If existing voucher was already posted, revert its prior balance impact first
    if (existing && existing.status === 'Posted') {
      existing.lines.forEach((line) => {
        setAccounts((prevAccounts) => {
          const next = prevAccounts.map((acc) => {
            if (acc.id === line.accountId) {
              const delta =
                acc.normalBalance === 'Debit'
                  ? line.debit - line.credit
                  : line.credit - line.debit;
              const updatedAcc = {
                ...acc,
                currentBalance: Math.round(acc.currentBalance - delta),
              };
              apiSaveChartAccount(updatedAcc);
              return updatedAcc;
            }
            return acc;
          });
          saveCache('accounts', next);
          return next;
        });
      });
    }

    setVouchers((prev) => {
      const exists = prev.some((v) => v.id === voucher.id);
      const next = exists ? prev.map((v) => (v.id === voucher.id ? voucher : v)) : [voucher, ...prev];
      saveCache('vouchers', next);
      return next;
    });
    apiSaveVoucher(voucher);

    // If saving directly as Posted, update accounts
    if (voucher.status === 'Posted') {
      voucher.lines.forEach((line) => {
        setAccounts((prevAccounts) => {
          const next = prevAccounts.map((acc) => {
            if (acc.id === line.accountId) {
              const delta =
                acc.normalBalance === 'Debit'
                  ? line.debit - line.credit
                  : line.credit - line.debit;
              const updatedAcc = {
                ...acc,
                currentBalance: Math.round(acc.currentBalance + delta),
              };
              apiSaveChartAccount(updatedAcc);
              return updatedAcc;
            }
            return acc;
          });
          saveCache('accounts', next);
          return next;
        });
      });
    }
  };

  const handleDeleteVoucher = (voucherId: string) => {
    const target = vouchers.find((v) => v.id === voucherId);
    if (!target) return;

    // If deleting a Posted voucher, revert the account balances
    if (target.status === 'Posted') {
      target.lines.forEach((line) => {
        setAccounts((prevAccounts) => {
          const next = prevAccounts.map((acc) => {
            if (acc.id === line.accountId) {
              const delta =
                acc.normalBalance === 'Debit'
                  ? line.debit - line.credit
                  : line.credit - line.debit;
              const updatedAcc = {
                ...acc,
                currentBalance: Math.round(acc.currentBalance - delta),
              };
              apiSaveChartAccount(updatedAcc);
              return updatedAcc;
            }
            return acc;
          });
          saveCache('accounts', next);
          return next;
        });
      });
    }

    setVouchers((prev) => {
      const next = prev.filter((v) => v.id !== voucherId);
      saveCache('vouchers', next);
      return next;
    });
    apiDeleteVoucher(voucherId);
  };

  const handleApproveVoucher = (voucherId: string) => {
    const target = vouchers.find((v) => v.id === voucherId);
    if (!target) return;

    const nowIso = new Date().toISOString();
    const updatedVoucher: VoucherDocument = {
      ...target,
      status: 'Approved',
      approvedBy: currentUser?.name || 'Chief Accountant',
      approvedAt: nowIso,
    };

    setVouchers((prev) => {
      const next = prev.map((v) => (v.id === voucherId ? updatedVoucher : v));
      saveCache('vouchers', next);
      return next;
    });
    apiSaveVoucher(updatedVoucher);
  };

  const handlePostVoucher = (voucherId: string) => {
    const target = vouchers.find((v) => v.id === voucherId);
    if (!target) return;

    const nowIso = new Date().toISOString();
    const updatedVoucher: VoucherDocument = {
      ...target,
      status: 'Posted',
      approvedBy: target.approvedBy || currentUser?.name || 'Chief Accountant',
      approvedAt: target.approvedAt || nowIso,
      postedBy: currentUser?.name || 'Chief Accountant',
      postedAt: nowIso,
    };

    setVouchers((prev) => {
      const next = prev.map((v) => (v.id === voucherId ? updatedVoucher : v));
      saveCache('vouchers', next);
      return next;
    });
    apiSaveVoucher(updatedVoucher);

    // Post to General Ledger - update Account balances
    target.lines.forEach((line) => {
      setAccounts((prevAccounts) => {
        const next = prevAccounts.map((acc) => {
          if (acc.id === line.accountId) {
            const delta =
              acc.normalBalance === 'Debit'
                ? line.debit - line.credit
                : line.credit - line.debit;
            const updatedAcc = {
              ...acc,
              currentBalance: Math.round(acc.currentBalance + delta),
            };
            apiSaveChartAccount(updatedAcc);
            return updatedAcc;
          }
          return acc;
        });
        saveCache('accounts', next);
        return next;
      });
    });
  };

  const handleCancelVoucher = (voucherId: string, reason: string) => {
    const target = vouchers.find((v) => v.id === voucherId);
    if (!target) return;
    if (target.status === 'Posted') return; // Posted vouchers must use Reverse

    const nowIso = new Date().toISOString();
    const updatedVoucher: VoucherDocument = {
      ...target,
      status: 'Cancelled',
      cancelledBy: currentUser?.name || 'Authorized Auditor',
      cancelledAt: nowIso,
      cancelReason: reason,
    };

    setVouchers((prev) => {
      const next = prev.map((v) => (v.id === voucherId ? updatedVoucher : v));
      saveCache('vouchers', next);
      return next;
    });
    apiSaveVoucher(updatedVoucher);
  };

  const handleReverseVoucher = (voucherId: string, reason: string) => {
    const target = vouchers.find((v) => v.id === voucherId);
    if (!target) return;
    if (target.status !== 'Posted') return;

    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];
    const cleanPrefix = target.voucherNo.replace(/^(CP|CR|BP|BR|JV)-/i, '');
    const revVoucherNo = `JV-REV-${cleanPrefix}`;
    const revVoucherId = `vouch-rev-${Date.now()}`;

    // Standard GAAP: Invert debit and credit on each line for a balancing reversal
    const invertedLines = target.lines.map((line, idx) => ({
      id: `rev-line-${Date.now()}-${idx}`,
      srNo: idx + 1,
      accountId: line.accountId,
      accountCode: line.accountCode,
      accountName: line.accountName,
      description: `Reversal of ${target.voucherNo}: ${line.description || reason}`,
      debit: line.credit, // Invert
      credit: line.debit, // Invert
    }));

    const reversalVoucher: VoucherDocument = {
      id: revVoucherId,
      voucherNo: revVoucherNo,
      voucherType: 'JV - Journal Voucher',
      typeCode: 'JV',
      date: today,
      referenceNo: target.voucherNo,
      narration: `Reversal entry for voucher ${target.voucherNo}. Controlled reason: ${reason}`,
      status: 'Posted',
      lines: invertedLines,
      totalDebit: target.totalCredit,
      totalCredit: target.totalDebit,
      preparedBy: currentUser?.name || 'Chief Accountant',
      approvedBy: currentUser?.name || 'Chief Accountant',
      approvedAt: nowIso,
      postedBy: currentUser?.name || 'Chief Accountant',
      postedAt: nowIso,
    };

    const updatedTarget: VoucherDocument = {
      ...target,
      status: 'Reversed',
      reversedBy: currentUser?.name || 'Chief Accountant',
      reversedAt: nowIso,
      reversalReason: reason,
      reversalVoucherNo: revVoucherNo,
    };

    setVouchers((prev) => {
      const next = [reversalVoucher, ...prev.map((v) => (v.id === voucherId ? updatedTarget : v))];
      saveCache('vouchers', next);
      return next;
    });
    apiSaveVoucher(updatedTarget);
    apiSaveVoucher(reversalVoucher);

    // Apply the inverted balance to accounts
    invertedLines.forEach((line) => {
      setAccounts((prevAccounts) => {
        const next = prevAccounts.map((acc) => {
          if (acc.id === line.accountId) {
            const delta =
              acc.normalBalance === 'Debit'
                ? line.debit - line.credit
                : line.credit - line.debit;
            const updatedAcc = {
              ...acc,
              currentBalance: Math.round(acc.currentBalance + delta),
            };
            apiSaveChartAccount(updatedAcc);
            return updatedAcc;
          }
          return acc;
        });
        saveCache('accounts', next);
        return next;
      });
    });
  };

  // TREASURY / CASHIER HANDLERS (Completely isolated)
  const handleAddCashBookEntry = (entry: CashBookEntry) => {
    const updatedEntry: CashBookEntry = {
      ...entry,
      balance: (Number(entry.credit) || 0) - (Number(entry.debit) || 0),
    };
    setCashBookEntries((prev) => {
      const next = [updatedEntry, ...prev].map((e, idx) => ({ ...e, srNo: idx + 1 }));
      saveCache('cash_book', next);
      return next;
    });
    apiSaveCashBookEntry(updatedEntry);
  };

  const handleUpdateCashBookEntry = (
    id: string,
    field: 'date' | 'description' | 'credit' | 'debit',
    value: string | number
  ) => {
    let targetEntry: CashBookEntry | null = null;
    setCashBookEntries((prev) => {
      const next = prev.map((entry) => {
        if (entry.id !== id) return entry;
        targetEntry = { ...entry, [field]: value };
        targetEntry.balance = (Number(targetEntry.credit) || 0) - (Number(targetEntry.debit) || 0);
        return targetEntry;
      });
      saveCache('cash_book', next);
      return next;
    });
    if (targetEntry) apiSaveCashBookEntry(targetEntry);
  };

  const handleDeleteCashBookEntry = (id: string) => {
    setCashBookEntries((prev) => {
      const next = prev.filter((e) => e.id !== id).map((e, idx) => ({ ...e, srNo: idx + 1 }));
      saveCache('cash_book', next);
      return next;
    });
    apiDeleteCashBookEntry(id);
  };

  // CREDIT BOOK REGISTER HANDLERS
  const handleAddCreditBookEntry = (entry: CreditBookEntry) => {
    setCreditBookEntries((prev) => {
      const next = [entry, ...prev].map((e, idx) => ({ ...e, srNo: idx + 1 }));
      saveCache('credit_book', next);
      return next;
    });
    apiSaveCreditBookEntry(entry);
  };

  const handleUpdateCreditBookEntry = (
    id: string,
    field: 'date' | 'name' | 'purpose' | 'amount',
    value: string | number
  ) => {
    let targetEntry: CreditBookEntry | null = null;
    setCreditBookEntries((prev) => {
      const next = prev.map((entry) => {
        if (entry.id !== id) return entry;
        targetEntry = { ...entry, [field]: value };
        return targetEntry;
      });
      saveCache('credit_book', next);
      return next;
    });
    if (targetEntry) apiSaveCreditBookEntry(targetEntry);
  };

  const handleDeleteCreditBookEntry = (id: string) => {
    setCreditBookEntries((prev) => {
      const next = prev.filter((e) => e.id !== id).map((e, idx) => ({ ...e, srNo: idx + 1 }));
      saveCache('credit_book', next);
      return next;
    });
    apiDeleteCreditBookEntry(id);
  };

  const handleResetCreditBook = () => {
    creditBookEntries.forEach((e) => apiDeleteCreditBookEntry(e.id));
    setCreditBookEntries([]);
    saveCache('credit_book', []);
  };

  const handleBulkUpdateCreditBookEntries = (updatedEntries: CreditBookEntry[]) => {
    setCreditBookEntries(updatedEntries);
    saveCache('credit_book', updatedEntries);
    updatedEntries.forEach((e) => apiSaveCreditBookEntry(e));
  };

  const handleAddBank = (bank: BankRecord) => {
    setBanks((prev) => {
      const next = [...prev, bank];
      saveCache('banks', next);
      return next;
    });
    apiSaveBank(bank);
  };

  const handleDeleteBank = (id: string) => {
    setBanks((prev) => {
      const next = prev.filter((b) => b.id !== id).map((b, idx) => ({ ...b, srNo: idx + 1 }));
      saveCache('banks', next);
      return next;
    });
    apiDeleteBank(id);
  };

  const handleAddBankAccount = (account: BankAccountRecord) => {
    setBankAccounts((prev) => {
      const next = [...prev, account];
      saveCache('bank_accounts', next);
      return next;
    });
    apiSaveBankAccount(account);
  };

  const handleDeleteBankAccount = (id: string) => {
    setBankAccounts((prev) => {
      const next = prev.filter((a) => a.id !== id).map((a, idx) => ({ ...a, srNo: idx + 1 }));
      saveCache('bank_accounts', next);
      return next;
    });
    apiDeleteBankAccount(id);
  };

  const handleAddBankTransaction = (accountId: string, transaction: BankTransaction) => {
    let targetAccount: BankAccountRecord | null = null;
    setBankAccounts((prev) => {
      const next = prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        const combined = [...acc.transactions, transaction];
        let running = Number(acc.openingBalance) || 0;
        const withBalances = combined.map((t, idx) => {
          const deposit = Number(t.depositDebit) || 0;
          const withdrawal = Number(t.withdrawalPayment) || 0;
          running = Number((running + deposit - withdrawal).toFixed(2));
          return {
            ...t,
            srNo: idx + 1,
            balance: running,
          };
        });
        targetAccount = {
          ...acc,
          transactions: withBalances,
        };
        return targetAccount;
      });
      saveCache('bank_accounts', next);
      return next;
    });
    if (targetAccount) apiSaveBankAccount(targetAccount);
  };

  const handleUpdateBankTransaction = (
    accountId: string,
    transactionId: string,
    field: 'date' | 'payeeDescription' | 'category' | 'depositDebit' | 'withdrawalPayment',
    value: string | number
  ) => {
    let targetAccount: BankAccountRecord | null = null;
    setBankAccounts((prev) => {
      const next = prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        const updatedTxs = acc.transactions.map((tx) => {
          if (tx.id !== transactionId) return tx;
          return { ...tx, [field]: value };
        });
        let running = Number(acc.openingBalance) || 0;
        const withBalances = updatedTxs.map((tx) => {
          const deposit = Number(tx.depositDebit) || 0;
          const withdrawal = Number(tx.withdrawalPayment) || 0;
          running = Number((running + deposit - withdrawal).toFixed(2));
          return {
            ...tx,
            balance: running,
          };
        });
        targetAccount = {
          ...acc,
          transactions: withBalances,
        };
        return targetAccount;
      });
      saveCache('bank_accounts', next);
      return next;
    });
    if (targetAccount) apiSaveBankAccount(targetAccount);
  };

  const handleDeleteBankTransaction = (accountId: string, transactionId: string) => {
    let targetAccount: BankAccountRecord | null = null;
    setBankAccounts((prev) => {
      const next = prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        const filtered = acc.transactions.filter((tx) => tx.id !== transactionId);
        let running = Number(acc.openingBalance) || 0;
        const withBalances = filtered.map((tx, idx) => {
          const deposit = Number(tx.depositDebit) || 0;
          const withdrawal = Number(tx.withdrawalPayment) || 0;
          running = Number((running + deposit - withdrawal).toFixed(2));
          return {
            ...tx,
            srNo: idx + 1,
            balance: running,
          };
        });
        targetAccount = {
          ...acc,
          transactions: withBalances,
        };
        return targetAccount;
      });
      saveCache('bank_accounts', next);
      return next;
    });
    if (targetAccount) apiSaveBankAccount(targetAccount);
  };

  // 100% ISOLATED STORE & SALES HANDLERS
  const handleAddPosEntry = (entry: PosCoalSellEntry) => {
    setCoalSells((prev) => {
      const next = [entry, ...prev].map((e, idx) => ({ ...e, srNo: idx + 1 }));
      saveCache('coal_sells', next);
      return next;
    });
    apiSavePosCoalSale(entry);
  };

  const handleUpdatePosEntry = (entry: PosCoalSellEntry) => {
    setCoalSells((prev) => {
      const next = prev.map((e) => (e.id === entry.id ? entry : e));
      saveCache('coal_sells', next);
      return next;
    });
    apiSavePosCoalSale(entry);
  };

  const handleDeletePosEntry = (id: string) => {
    setCoalSells((prev) => {
      const next = prev.filter((e) => e.id !== id).map((e, idx) => ({ ...e, srNo: idx + 1 }));
      saveCache('coal_sells', next);
      return next;
    });
    apiDeletePosCoalSale(id);
  };

  const handleAddCoalSellRecord = (record: CoalSellRecord) => {
    setCoalSells((prev) => {
      const next = [record, ...prev];
      saveCache('coal_sells', next);
      return next;
    });
    apiSaveCoalSellRecord(record);
  };

  const handleUpdateCoalSellRecord = (record: CoalSellRecord) => {
    setCoalSells((prev) => {
      const next = prev.map((r) => (r.id === record.id ? record : r));
      saveCache('coal_sells', next);
      return next;
    });
    apiSaveCoalSellRecord(record);
  };

  const handleDeleteCoalSellRecord = (id: string) => {
    setCoalSells((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveCache('coal_sells', next);
      return next;
    });
    apiDeleteCoalSellRecord(id);
  };

  const handleAddCoalProduction = (newRecord: Omit<CoalProductionRecord, 'id' | 'createdAt'>) => {
    const record: CoalProductionRecord = {
      ...newRecord,
      id: `cpr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCoalStocks((prev) => {
      const next = [record, ...prev];
      saveCache('coal_stocks', next);
      return next;
    });
    apiSaveCoalProduction(record);
  };

  const handleUpdateCoalProduction = (record: CoalProductionRecord) => {
    setCoalStocks((prev) => {
      const next = prev.map((r) => (r.id === record.id ? record : r));
      saveCache('coal_stocks', next);
      return next;
    });
    apiSaveCoalProduction(record);
  };

  const handleDeleteCoalProduction = (id: string) => {
    setCoalStocks((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveCache('coal_stocks', next);
      return next;
    });
    apiDeleteCoalProduction(id);
  };

  const handleAddPartner = (partner: PartnerRecord) => {
    setPartners((prev) => {
      const next = [...prev, partner];
      saveCache('partners', next);
      return next;
    });
    apiSavePartner(partner);
  };

  const handleUpdatePartner = (partner: PartnerRecord) => {
    setPartners((prev) => {
      const next = prev.map((p) => (p.id === partner.id ? partner : p));
      saveCache('partners', next);
      return next;
    });
    apiSavePartner(partner);
  };

  const handleDeletePartner = (id: string) => {
    setPartners((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveCache('partners', next);
      return next;
    });
    apiDeletePartner(id);
  };

  const handleTogglePartnerActive = (id: string) => {
    let target: PartnerRecord | null = null;
    setPartners((prev) => {
      const next = prev.map((p) => {
        if (p.id === id) {
          target = { ...p, isActive: !p.isActive };
          return target;
        }
        return p;
      });
      saveCache('partners', next);
      return next;
    });
    if (target) apiSavePartner(target);
  };

  const handleTogglePartnerReportColumn = (id: string) => {
    let target: PartnerRecord | null = null;
    setPartners((prev) => {
      const next = prev.map((p) => {
        if (p.id === id) {
          target = { ...p, showInReport: !p.showInReport };
          return target;
        }
        return p;
      });
      saveCache('partners', next);
      return next;
    });
    if (target) apiSavePartner(target);
  };

  const handleAddBuyer = (buyer: BuyerRecord) => {
    setBuyers((prev) => {
      const next = [buyer, ...prev];
      saveCache('buyers', next);
      return next;
    });
    apiSaveBuyer(buyer);
  };

  const handleUpdateBuyer = (buyer: BuyerRecord) => {
    setBuyers((prev) => {
      const next = prev.map((b) => (b.id === buyer.id ? buyer : b));
      saveCache('buyers', next);
      return next;
    });
    apiSaveBuyer(buyer);
  };

  const handleDeleteBuyer = (id: string) => {
    setBuyers((prev) => {
      const next = prev.filter((b) => b.id !== id);
      saveCache('buyers', next);
      return next;
    });
    apiDeleteBuyer(id);
  };

  const handleAddStockItem = (item: StockItem) => {
    setStoreItems((prev) => {
      const next = [...prev, item];
      saveCache('store_items', next);
      return next;
    });
    apiSaveStockItem(item);
  };

  const handleUpdateStockItem = (item: StockItem) => {
    setStoreItems((prev) => {
      const next = prev.map((i) => (i.id === item.id ? item : i));
      saveCache('store_items', next);
      return next;
    });
    apiSaveStockItem(item);
  };

  const handleDeleteStockItem = (id: string) => {
    setStoreItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveCache('store_items', next);
      return next;
    });
    apiDeleteStockItem(id);
  };

  const handleAddStockEntry = (entry: StockEntry) => {
    setStockEntries((prev) => {
      const next = [entry, ...prev].map((e, idx) => ({ ...e, srNo: idx + 1 }));
      saveCache('stock_entries', next);
      return next;
    });
    apiSaveStockEntry(entry);
  };

  const handleUpdateStockEntry = (entry: StockEntry) => {
    setStockEntries((prev) => {
      const next = prev.map((e) => (e.id === entry.id ? entry : e));
      saveCache('stock_entries', next);
      return next;
    });
    apiSaveStockEntry(entry);
  };

  const handleDeleteStockEntry = (id: string) => {
    setStockEntries((prev) => {
      const next = prev.filter((e) => e.id !== id).map((e, idx) => ({ ...e, srNo: idx + 1 }));
      saveCache('stock_entries', next);
      return next;
    });
    apiDeleteStockEntry(id);
  };

  const handleAddVehicle = (vehicle: VehicleRecord) => {
    setVehicles((prev) => {
      const next = [...prev, vehicle];
      saveCache('vehicles', next);
      return next;
    });
    apiSaveVehicle(vehicle);
  };

  const handleUpdateVehicle = (vehicle: VehicleRecord) => {
    setVehicles((prev) => {
      const next = prev.map((v) => (v.id === vehicle.id ? vehicle : v));
      saveCache('vehicles', next);
      return next;
    });
    apiSaveVehicle(vehicle);
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles((prev) => {
      const next = prev.filter((v) => v.id !== id);
      saveCache('vehicles', next);
      return next;
    });
    apiDeleteVehicle(id);
  };

  const handleAddVehicleConsumption = (record: any) => {
    setItemConsumptions((prev) => {
      const next = [record, ...prev].map((c, idx) => ({ ...c, srNo: idx + 1 }));
      saveCache('consumptions', next);
      return next as any;
    });
    apiSaveVehicleConsumption(record);
  };

  const handleUpdateVehicleConsumption = (record: any) => {
    setItemConsumptions((prev) => {
      const next = prev.map((c) => (c.id === record.id ? record : c));
      saveCache('consumptions', next);
      return next as any;
    });
    apiSaveVehicleConsumption(record);
  };

  const handleDeleteVehicleConsumption = (id: string) => {
    setItemConsumptions((prev) => {
      const next = prev.filter((c) => c.id !== id).map((c, idx) => ({ ...c, srNo: idx + 1 }));
      saveCache('consumptions', next);
      return next as any;
    });
    apiDeleteVehicleConsumption(id);
  };

  const handleSaveCompanySettings = (cs: CompanySettings) => {
    setCompanySettings(cs);
    saveCache('company_settings', cs);
    apiSaveCompanySettings(cs);
  };

  const handleClearLegacyCoalSales = () => {
    setCoalSells([]);
    saveCache('coal_sells', []);
  };

  const pendingApprovalsCount =
    demands.filter((d) => d.status === 'Submitted for Approval').length +
    purchases.filter((p) => p.status === 'Submitted for Approval').length;

  // App entry point is Login page if unauthenticated
  if (!currentUser) {
    return <LoginScreen users={users} onLogin={handleLogin} />;
  }

  const roleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'purchaser':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cashier':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'accountant':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'store_manager':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentModule={currentModule}
        onSelectModule={(mod) => {
          setCurrentModule(mod);
          setActiveNavTarget(null);
        }}
        activeNavTarget={activeNavTarget}
        onNavigateOperation={handleNavigateOperation}
        isOpenMobile={isMobileSidebarOpen}
        onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        pendingApprovalsCount={pendingApprovalsCount}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Collapsible Sidebar Toggle Button */}
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title={isSidebarCollapsed ? "Expand sidebar (Full view)" : "Collapse sidebar (Slim icon view)"}
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-blue-600" />
              ) : (
                <PanelLeftClose className="w-5 h-5 text-slate-600" />
              )}
            </button>

            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <button
                type="button"
                onClick={() => setCurrentModule('dashboard')}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                {currentUser.role === 'admin'
                  ? 'Admin'
                  : currentUser.role === 'purchaser'
                  ? 'Purchaser'
                  : currentUser.role === 'cashier'
                  ? 'Cashier'
                  : currentUser.role === 'accountant'
                  ? 'Accountant'
                  : 'Store'}{' '}
                Dashboard
              </button>
            </nav>
          </div>

          {/* Top Bar Right Actions: System Status & User Profile */}
          <div className="flex items-center gap-2.5">

            {/* Supabase PostgreSQL Status & Sync */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div 
                title="Supabase PostgreSQL Database Connected" 
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Database className="w-3 h-3 text-emerald-600" />
                <span>Supabase Live</span>
              </div>

              <button
                type="button"
                onClick={refreshDataFromDatabase}
                disabled={isRefreshingDb}
                title="Sync and reload all data from Supabase PostgreSQL database"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  isRefreshingDb
                    ? 'bg-blue-50 text-blue-700 border-blue-200 cursor-wait'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshingDb ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshingDb ? 'Syncing...' : 'Sync Database'}</span>
              </button>

              {/* DB API Diagnostics Inspector Button */}
              <button
                type="button"
                onClick={() => setIsDiagnosticsOpen(true)}
                title="Inspect real-time Supabase Database API calls, request payloads, responses, and errors"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  diagnosticErrorsCount > 0
                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
                }`}
              >
                <Activity className={`w-3.5 h-3.5 ${diagnosticErrorsCount > 0 ? 'text-red-600' : 'text-purple-600'}`} />
                <span className="hidden sm:inline">DB Logs</span>
                {diagnosticErrorsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-bold">
                    {diagnosticErrorsCount}
                  </span>
                )}
              </button>
            </div>

            <div className="w-px h-5 bg-slate-200 hidden sm:block" />

            {/* User Profile Info - Clickable for Profile Name and Password Change */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                title="Change Profile Name and Password"
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-left group"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-xs group-hover:scale-105 transition-transform ${
                    currentUser.role === 'admin'
                      ? 'bg-purple-600 text-white'
                      : currentUser.role === 'purchaser'
                      ? 'bg-blue-600 text-white'
                      : currentUser.role === 'cashier'
                      ? 'bg-amber-600 text-white'
                      : currentUser.role === 'accountant'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-cyan-600 text-white'
                  }`}
                >
                  {currentUser.username.slice(0, 2)}
                </div>

                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight flex items-center gap-1">
                    <span>{currentUser.name}</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-blue-500">✎</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono capitalize">
                    @{currentUser.username} · {currentUser.role.replace('_', ' ')}
                  </div>
                </div>
              </button>

              {/* Explicit Profile & Password button for clarity */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                title="Change profile name or password"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                <span>⚙️ Profile</span>
              </button>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out of system"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors cursor-pointer ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Role-Specific Dashboard (Admin, Purchaser, Cashier, Accountant, Store Manager) */}
          {currentModule === 'dashboard' && (
            <RoleDashboard
              currentUser={currentUser}
              demands={demands}
              purchases={purchases}
              accounts={accounts}
              vouchers={vouchers}
              cashBookEntries={cashBookEntries}
              creditBookEntries={creditBookEntries}
              banks={banks}
              bankAccounts={bankAccounts}
              posEntries={coalSells as any}
              coalSellRecords={coalSells}
              coalProductionRecords={coalStocks}
              partners={partners}
              stockItems={storeItems}
              stockEntries={stockEntries}
              vehicles={vehicles}
              consumptions={itemConsumptions}
              companySettings={companySettings}
              users={users}
              onNavigate={setCurrentModule}
            />
          )}

          {/* Admin Exclusive: User Management Module */}
          {currentModule === 'users' && currentUser.role === 'admin' && (
            <UsersScreen
              users={users}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onResetPassword={handleResetPassword}
            />
          )}

          {/* Admin Exclusive: Approval Console */}
          {currentModule === 'admin_approvals' && currentUser.role === 'admin' && (
            <AdminApprovalView
              demands={demands}
              purchases={purchases}
              onApproveDemand={handleApproveDemand}
              onRejectDemand={handleRejectDemand}
              onApprovePurchase={handleApprovePurchase}
              onRejectPurchase={handleRejectPurchase}
            />
          )}

          {/* Purchase Module (Purchaser & Admin) */}
          {currentModule === 'purchase' && (currentUser.role === 'admin' || currentUser.role === 'purchaser') && (
            <PurchaseScreen
              navTarget={activeNavTarget}
              demands={demands}
              purchases={purchases}
              onSaveDemand={handleSaveDemand}
              onSavePurchase={handleSavePurchase}
              onFinalizeDemand={handleFinalizeDemand}
              onFinalizePurchase={handleFinalizePurchase}
              onSubmitDemand={handleSubmitDemand}
              onSubmitMultipleDemands={handleSubmitMultipleDemands}
              onSubmitPurchase={handleSubmitPurchase}
              onSubmitMultiplePurchases={handleSubmitMultiplePurchases}
              onUpdateDemandItems={handleUpdateDemandItems}
              onUpdatePurchaseItems={handleUpdatePurchaseItems}
              onApproveDemand={handleApproveDemand}
              onRejectDemand={handleRejectDemand}
              onApprovePurchase={handleApprovePurchase}
              onRejectPurchase={handleRejectPurchase}
              onDeleteDemand={handleDeleteDemand}
              onDeletePurchase={handleDeletePurchase}
            />
          )}

          {/* ISOLATED ACCOUNTANT MODULE (Accountant & Admin) */}
          {currentModule === 'accounting' && (currentUser.role === 'admin' || currentUser.role === 'accountant') && (
            <AccountingScreen
              navTarget={activeNavTarget}
              accounts={accounts}
              vouchers={vouchers}
              onAddAccount={handleAddAccount}
              onUpdateAccount={handleUpdateAccount}
              onDeleteAccount={handleDeleteAccount}
              onImportAccounts={handleImportAccounts}
              onSaveVoucher={handleSaveVoucher}
              onDeleteVoucher={handleDeleteVoucher}
              onApproveVoucher={handleApproveVoucher}
              onPostVoucher={handlePostVoucher}
              onCancelVoucher={handleCancelVoucher}
              onReverseVoucher={handleReverseVoucher}
            />
          )}

          {/* ISOLATED TREASURY MODULE (Cashier & Admin) */}
          {currentModule === 'treasury' && (currentUser.role === 'admin' || currentUser.role === 'cashier') && (
            <TreasuryScreen
              navTarget={activeNavTarget}
              cashBookEntries={cashBookEntries}
              creditBookEntries={creditBookEntries}
              banks={banks}
              bankAccounts={bankAccounts}
              onAddCashBookEntry={handleAddCashBookEntry}
              onUpdateCashBookEntry={handleUpdateCashBookEntry}
              onDeleteCashBookEntry={handleDeleteCashBookEntry}
              onAddCreditBookEntry={handleAddCreditBookEntry}
              onUpdateCreditBookEntry={handleUpdateCreditBookEntry}
              onDeleteCreditBookEntry={handleDeleteCreditBookEntry}
              onResetCreditBook={handleResetCreditBook}
              onBulkUpdateCreditBookEntries={handleBulkUpdateCreditBookEntries}
              onAddBank={handleAddBank}
              onDeleteBank={handleDeleteBank}
              onAddBankAccount={handleAddBankAccount}
              onDeleteBankAccount={handleDeleteBankAccount}
              onAddBankTransaction={handleAddBankTransaction}
              onUpdateBankTransaction={handleUpdateBankTransaction}
              onDeleteBankTransaction={handleDeleteBankTransaction}
            />
          )}

          {/* 100% ISOLATED STORE & COAL MANAGEMENT MODULE (Store Manager & Admin) */}
          {currentModule === 'store_sales' && (currentUser.role === 'admin' || currentUser.role === 'store_manager') && (
            <StoreSalesScreen
              categories={categories}
              unitTypes={unitTypes}
              mines={mines}
              vehicles={vehicles}
              items={storeItems}
              stockEntries={stockEntries}
              consumptions={itemConsumptions}
              partners={partners}
              buyers={buyers}
              coalStocks={coalStocks}
              coalSells={coalSells}
              companySettings={companySettings}
              onAddCategory={(cat) => {
                const newCat: ItemCategory = { ...cat, id: `cat-${Date.now()}` };
                setCategories((prev) => {
                  const next = [...prev, newCat];
                  saveCache('item_categories', next);
                  return next;
                });
              }}
              onUpdateCategory={(cat) => {
                setCategories((prev) => {
                  const next = prev.map((c) => (c.id === cat.id ? cat : c));
                  saveCache('item_categories', next);
                  return next;
                });
              }}
              onDeleteCategory={(id) => {
                setCategories((prev) => {
                  const next = prev.filter((c) => c.id !== id);
                  saveCache('item_categories', next);
                  return next;
                });
              }}
              onAddUnitType={(unit) => {
                const newUnit: ItemUnitType = { ...unit, id: `unit-${Date.now()}` };
                setUnitTypes((prev) => {
                  const next = [...prev, newUnit];
                  saveCache('item_units', next);
                  return next;
                });
              }}
              onUpdateUnitType={(unit) => {
                setUnitTypes((prev) => {
                  const next = prev.map((u) => (u.id === unit.id ? unit : u));
                  saveCache('item_units', next);
                  return next;
                });
              }}
              onDeleteUnitType={(id) => {
                setUnitTypes((prev) => {
                  const next = prev.filter((u) => u.id !== id);
                  saveCache('item_units', next);
                  return next;
                });
              }}
              onAddMine={(mine) => {
                const newMine: MineRecord = { ...mine, id: `mine-${Date.now()}` };
                setMines((prev) => {
                  const next = [...prev, newMine];
                  saveCache('item_mines', next);
                  return next;
                });
              }}
              onUpdateMine={(mine) => {
                setMines((prev) => {
                  const next = prev.map((m) => (m.id === mine.id ? mine : m));
                  saveCache('item_mines', next);
                  return next;
                });
              }}
              onDeleteMine={(id) => {
                setMines((prev) => {
                  const next = prev.filter((m) => m.id !== id);
                  saveCache('item_mines', next);
                  return next;
                });
              }}
              onAddVehicle={(veh) => {
                const newVeh: VehicleRecord = { ...veh, id: `veh-${Date.now()}` };
                setVehicles((prev) => {
                  const next = [...prev, newVeh];
                  saveCache('vehicles', next);
                  return next;
                });
                apiSaveVehicle(newVeh as any);
              }}
              onUpdateVehicle={(veh) => {
                setVehicles((prev) => {
                  const next = prev.map((v) => (v.id === veh.id ? veh : v));
                  saveCache('vehicles', next);
                  return next;
                });
                apiSaveVehicle(veh as any);
              }}
              onDeleteVehicle={(id) => {
                setVehicles((prev) => {
                  const next = prev.filter((v) => v.id !== id);
                  saveCache('vehicles', next);
                  return next;
                });
                apiDeleteVehicle(id);
              }}
              onAddItem={(item) => {
                const newItem: StoreItem = { ...item, id: `item-${Date.now()}` };
                setStoreItems((prev) => {
                  const next = [...prev, newItem];
                  saveCache('store_items', next);
                  return next;
                });
                apiSaveStockItem(newItem as any);
              }}
              onUpdateItem={(item) => {
                setStoreItems((prev) => {
                  const next = prev.map((i) => (i.id === item.id ? item : i));
                  saveCache('store_items', next);
                  return next;
                });
                apiSaveStockItem(item as any);
              }}
              onDeleteItem={(id) => {
                setStoreItems((prev) => {
                  const next = prev.filter((i) => i.id !== id);
                  saveCache('store_items', next);
                  return next;
                });
                apiDeleteStockItem(id);
              }}
              onAddStockEntry={(entry) => {
                const newEntry: ItemStockEntry = { ...entry, id: `stk-${Date.now()}` };
                setStockEntries((prev) => {
                  const next = [newEntry, ...prev];
                  saveCache('stock_entries', next);
                  return next;
                });
                apiSaveStockEntry(newEntry as any);
              }}
              onUpdateStockEntry={(entry) => {
                setStockEntries((prev) => {
                  const next = prev.map((s) => (s.id === entry.id ? entry : s));
                  saveCache('stock_entries', next);
                  return next;
                });
                apiSaveStockEntry(entry as any);
              }}
              onDeleteStockEntry={(id) => {
                setStockEntries((prev) => {
                  const next = prev.filter((s) => s.id !== id);
                  saveCache('stock_entries', next);
                  return next;
                });
                apiDeleteStockEntry(id);
              }}
              onAddConsumption={(record: any) => {
                const newRec: ItemConsumptionRecord = { ...record, id: record.id || `con-${Date.now()}` };
                setItemConsumptions((prev) => {
                  const next = [newRec, ...prev];
                  saveCache('consumptions', next);
                  return next;
                });
                apiSaveVehicleConsumption(newRec as any);
              }}
              onUpdateConsumption={(record: any) => {
                setItemConsumptions((prev) => {
                  const next = prev.map((c) => (c.id === record.id ? record : c));
                  saveCache('consumptions', next);
                  return next;
                });
                apiSaveVehicleConsumption(record as any);
              }}
              onDeleteConsumption={(id: string) => {
                setItemConsumptions((prev) => {
                  const next = prev.filter((c) => c.id !== id);
                  saveCache('consumptions', next);
                  return next;
                });
                apiDeleteVehicleConsumption(id);
              }}
              onAddCoalStock={(stock: any) => {
                const newStk: CoalStockRecord = { ...stock, id: stock.id || `cstk-${Date.now()}` };
                setCoalStocks((prev) => {
                  const next = [newStk, ...prev];
                  saveCache('coal_stocks', next);
                  return next;
                });
                apiSaveCoalProduction(newStk as any);
              }}
              onUpdateCoalStock={(stock) => {
                setCoalStocks((prev) => {
                  const next = prev.map((s) => (s.id === stock.id ? stock : s));
                  saveCache('coal_stocks', next);
                  return next;
                });
                apiSaveCoalProduction(stock as any);
              }}
              onDeleteCoalStock={(id) => {
                setCoalStocks((prev) => {
                  const next = prev.filter((s) => s.id !== id);
                  saveCache('coal_stocks', next);
                  return next;
                });
                apiDeleteCoalProduction(id);
              }}
              onAddCoalSell={(sell: any) => {
                const newSell: CoalSellRecord = { ...sell, id: sell.id || `csell-${Date.now()}` };
                setCoalSells((prev) => {
                  const next = [newSell, ...prev];
                  saveCache('coal_sells', next);
                  return next;
                });
                apiSaveCoalSellRecord(newSell as any);
              }}
              onUpdateCoalSell={(sell) => {
                setCoalSells((prev) => {
                  const next = prev.map((s) => (s.id === sell.id ? sell : s));
                  saveCache('coal_sells', next);
                  return next;
                });
                apiSaveCoalSellRecord(sell as any);
              }}
              onDeleteCoalSell={(id) => {
                setCoalSells((prev) => {
                  const next = prev.filter((s) => s.id !== id);
                  saveCache('coal_sells', next);
                  return next;
                });
                apiDeleteCoalSellRecord(id);
              }}
              onAddPartner={(p) => {
                const newP: PartnerRecord = { ...p, id: `part-${Date.now()}` };
                setPartners((prev) => {
                  const next = [...prev, newP];
                  saveCache('partners', next);
                  return next;
                });
                apiSavePartner(newP);
              }}
              onUpdatePartner={(p) => {
                setPartners((prev) => {
                  const next = prev.map((x) => (x.id === p.id ? p : x));
                  saveCache('partners', next);
                  return next;
                });
                apiSavePartner(p);
              }}
              onDeletePartner={(id) => {
                setPartners((prev) => {
                  const next = prev.filter((p) => p.id !== id);
                  saveCache('partners', next);
                  return next;
                });
                apiDeletePartner(id);
              }}
              onAddBuyer={(b) => {
                const newB: BuyerRecord = { ...b, id: `buy-${Date.now()}` };
                setBuyers((prev) => {
                  const next = [...prev, newB];
                  saveCache('buyers', next);
                  return next;
                });
                apiSaveBuyer(newB);
              }}
              onUpdateBuyer={(b) => {
                setBuyers((prev) => {
                  const next = prev.map((x) => (x.id === b.id ? b : x));
                  saveCache('buyers', next);
                  return next;
                });
                apiSaveBuyer(b);
              }}
              onDeleteBuyer={(id) => {
                setBuyers((prev) => {
                  const next = prev.filter((b) => b.id !== id);
                  saveCache('buyers', next);
                  return next;
                });
                apiDeleteBuyer(id);
              }}
              onUpdateCompanySettings={(cs) => {
                setCompanySettings(cs);
                saveCache('company_settings', cs);
                apiSaveCompanySettings(cs);
              }}
              navTarget={activeNavTarget}
            />
          )}

          {/* Reports */}
          {currentModule === 'reports' && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
              <BarChart3 className="w-12 h-12 text-slate-400 mx-auto" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Audit Reports & Cross-Module Ledger Logs
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Demand vs Purchase financial reconciliation, status turnaround times, and Admin approval audit history.
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentModule('purchase')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Go to Purchase Module
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentModule('accounting')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Go to Accounts
                </button>
              </div>
            </div>
          )}

          {/* Settings */}
          {currentModule === 'settings' && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
              <SettingsIcon className="w-12 h-12 text-slate-400 mx-auto" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  System Settings & Workflow Configurations
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Manage reference number generation prefixes, automated workflow thresholds, and approver assignments.
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentModule('purchase')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Go to Purchase Module
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentModule('accounting')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Go to Accounts
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Real-Time Database API Diagnostics Inspector Modal */}
      <DatabaseDiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        onRefreshDatabase={refreshDataFromDatabase}
        isRefreshing={isRefreshingDb}
      />

      {/* Universal User Profile & Password Change Modal (Available in all modules) */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateProfile={handleUpdateMyProfile}
        onChangePassword={handleChangeMyPassword}
      />
    </div>
  );
}
