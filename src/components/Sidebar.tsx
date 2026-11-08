import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  LayoutDashboard, 
  ShieldCheck, 
  Settings, 
  Building2,
  Scale,
  Vault,
  Boxes,
  Users,
  LogOut,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Table,
  BookOpen,
  BookMarked,
  Landmark,
  Receipt,
  FileSpreadsheet,
  Truck,
  Handshake,
  FolderTree,
  FileCheck2,
  FileText,
  FileCheck,
  Edit3,
  Pickaxe,
  BarChart3
} from 'lucide-react';
import { NavModule, NavTarget } from '../types';
import { User, UserRole } from '../types/user';

interface SidebarProps {
  currentModule: NavModule;
  onSelectModule: (module: NavModule) => void;
  activeNavTarget?: NavTarget | null;
  onNavigateOperation: (target: NavTarget) => void;
  isOpenMobile: boolean;
  onToggleMobile: () => void;
  pendingApprovalsCount?: number;
  currentUser: User;
  onLogout: () => void;
}

interface SidebarNavItem {
  id: NavModule;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeCount?: number;
  hasSubmenu?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  activeNavTarget,
  onNavigateOperation,
  isOpenMobile,
  onToggleMobile,
  pendingApprovalsCount = 0,
  currentUser,
  onLogout,
}) => {
  // Collapsible state for top-level modules
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    treasury: true,
    purchase: true,
    store_sales: true,
    accounting: true,
  });

  // Collapsible state for nested sub-groups inside modules
  const [expandedSubGroups, setExpandedSubGroups] = useState<Record<string, boolean>>({
    'treasury-cash-book': true,
    'treasury-credit-book': true,
    'treasury-bank-management': true,
    'purchase-demand': true,
    'purchase-purchase': true,
    'store-sale': true,
    'store-coal-production': true,
    'store-sale-pos': true,
    'store-sale-coal-report': true,
    'store-sale-partners': true,
    'store-sale-buyers': true,
    'store-sale-vehicles': true,
    'store-stock-report': true,
  });

  // Auto-expand current active module
  useEffect(() => {
    if (['treasury', 'purchase', 'store_sales', 'accounting'].includes(currentModule)) {
      setExpandedModules((prev) => ({
        ...prev,
        [currentModule]: true,
      }));
    }
  }, [currentModule]);

  const toggleModuleExpand = (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const toggleSubGroup = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSubGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleOperationClick = (module: NavModule, section: string, subPage: string, action?: string) => {
    onNavigateOperation({
      module,
      section,
      subPage,
      action,
      timestamp: Date.now(),
    });
    if (isOpenMobile) {
      onToggleMobile();
    }
  };

  const isOpActive = (module: NavModule, section?: string, subPage?: string): boolean => {
    if (currentModule !== module) return false;
    if (!activeNavTarget || activeNavTarget.module !== module) return false;
    if (section) {
      const isCoalSectionMatch =
        module === 'store_sales' &&
        (section === 'coal_management' || section === 'sale') &&
        (activeNavTarget.section === 'coal_management' || activeNavTarget.section === 'sale');
      if (!isCoalSectionMatch && activeNavTarget.section !== section) {
        return false;
      }
    }
    if (subPage && activeNavTarget.subPage !== subPage) return false;
    return true;
  };

  // Strict role-based navigation configuration
  const getNavItemsForRole = (role: UserRole): SidebarNavItem[] => {
    switch (role) {
      case 'purchaser':
        return [
          {
            id: 'dashboard' as NavModule,
            label: 'Purchaser Dashboard',
            icon: <LayoutDashboard className="w-4 h-4" />,
          },
          {
            id: 'purchase' as NavModule,
            label: 'Purchase Module',
            icon: <ShoppingCart className="w-4 h-4" />,
            hasSubmenu: true,
          },
        ];

      case 'cashier':
        return [
          {
            id: 'dashboard' as NavModule,
            label: 'Cashier Dashboard',
            icon: <LayoutDashboard className="w-4 h-4" />,
          },
          {
            id: 'treasury' as NavModule,
            label: 'Treasury Module',
            icon: <Vault className="w-4 h-4" />,
            badge: 'Cashier',
            hasSubmenu: true,
          },
        ];

      case 'accountant':
        return [
          {
            id: 'dashboard' as NavModule,
            label: 'Accountant Dashboard',
            icon: <LayoutDashboard className="w-4 h-4" />,
          },
          {
            id: 'accounting' as NavModule,
            label: 'Accounts Module',
            icon: <Scale className="w-4 h-4" />,
            hasSubmenu: true,
          },
        ];

      case 'store_manager':
        return [
          {
            id: 'dashboard' as NavModule,
            label: 'Store Dashboard',
            icon: <LayoutDashboard className="w-4 h-4" />,
          },
          {
            id: 'store_sales' as NavModule,
            label: 'Store & Sales Module',
            icon: <Boxes className="w-4 h-4" />,
            hasSubmenu: true,
          },
        ];

      case 'admin':
      default:
        return [
          {
            id: 'dashboard' as NavModule,
            label: 'Admin Dashboard',
            icon: <LayoutDashboard className="w-4 h-4" />,
          },
          {
            id: 'admin_approvals' as NavModule,
            label: 'Admin Approvals',
            icon: <ShieldCheck className="w-4 h-4" />,
            badgeCount: pendingApprovalsCount,
          },
          {
            id: 'users' as NavModule,
            label: 'Users Management',
            icon: <Users className="w-4 h-4" />,
          },
          {
            id: 'purchase' as NavModule,
            label: 'Purchase Desk',
            icon: <ShoppingCart className="w-4 h-4" />,
            hasSubmenu: true,
          },
          {
            id: 'accounting' as NavModule,
            label: 'Accounts Desk',
            icon: <Scale className="w-4 h-4" />,
            hasSubmenu: true,
          },
          {
            id: 'treasury' as NavModule,
            label: 'Treasury Desk',
            icon: <Vault className="w-4 h-4" />,
            hasSubmenu: true,
          },
          {
            id: 'store_sales' as NavModule,
            label: 'Store & Sales Desk',
            icon: <Boxes className="w-4 h-4" />,
            hasSubmenu: true,
          },
        ];
    }
  };

  const navItems = getNavItemsForRole(currentUser.role);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'purchaser':
        return { label: 'Purchaser', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'cashier':
        return { label: 'Cashier', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'accountant':
        return { label: 'Accountant', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'store_manager':
        return { label: 'Store Mgr', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
      default:
        return { label: role, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const roleBadge = getRoleBadge(currentUser.role);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
          onClick={onToggleMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white text-slate-700 flex flex-col border-r border-slate-200 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-slate-900 block">
                AHCM ERP
              </span>
              <span className="text-[11px] text-slate-500 block -mt-0.5">
                Enterprise Suite
              </span>
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            onClick={onToggleMobile}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Role Indicator */}
        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Active Session
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${roleBadge.color}`}>
              {roleBadge.label}
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-900 truncate mt-1">
            {currentUser.name}
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            @{currentUser.username} · {currentUser.department}
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 py-3 px-2.5 overflow-y-auto space-y-1 text-xs">
          <div className="px-2.5 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            {currentUser.role === 'admin' ? 'Administration & Modules' : 'Assigned Workspace'}
          </div>

          {navItems.map((item) => {
            const isModuleActive = currentModule === item.id;
            const isExpanded = !!expandedModules[item.id];

            return (
              <div key={item.id} className="space-y-0.5">
                {/* Top-Level Module Navigation Button */}
                <div
                  className={`group w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isModuleActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  onClick={() => {
                    onSelectModule(item.id);
                    if (!item.hasSubmenu && isOpenMobile) {
                      onToggleMobile();
                    }
                  }}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={isModuleActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          isModuleActive
                            ? 'bg-blue-700 text-blue-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          isModuleActive
                            ? 'bg-purple-900 text-purple-200'
                            : 'bg-purple-600 text-white'
                        }`}
                      >
                        {item.badgeCount}
                      </span>
                    )}

                    {item.hasSubmenu && (
                      <button
                        type="button"
                        onClick={(e) => toggleModuleExpand(item.id, e)}
                        className={`p-1 rounded-md transition-transform hover:bg-black/10 cursor-pointer ${
                          isModuleActive ? 'text-white' : 'text-slate-400 hover:text-slate-700'
                        }`}
                        title={isExpanded ? 'Collapse operations' : 'Expand operations'}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-Operations Menus */}
                {item.hasSubmenu && isExpanded && (
                  <div className="pl-3.5 pr-1 py-1 space-y-1.5 border-l-2 border-slate-200 ml-4 my-1">
                    {/* -------------------------------------------------------------
                        1. CASHIER / TREASURY SIDEBAR MENU
                        - Cash Book Register (Add Transaction, View Cash Book)
                        - Credit Book Register (Add Credit, View Credit Book Register)
                        - Bank Management (Add Bank, List of Banks, Add Bank Account, List of Bank Accounts, Bank Account Details, Banks Summary)
                    ------------------------------------------------------------- */}
                    {item.id === 'treasury' && (
                      <div className="space-y-2">
                        {/* 1.1 Cash Book Register */}
                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={(e) => toggleSubGroup('treasury-cash-book', e)}
                            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="truncate">Cash Book Register</span>
                            </span>
                            {expandedSubGroups['treasury-cash-book'] ? (
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                          {expandedSubGroups['treasury-cash-book'] && (
                            <div className="pl-4 space-y-0.5">
                              <button
                                type="button"
                                onClick={() => handleOperationClick('treasury', 'cash_book', 'add_transaction')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('treasury', 'cash_book', 'add_transaction')
                                    ? 'bg-amber-50 text-amber-900 font-semibold border-l-2 border-amber-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Plus className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Add Transaction</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOperationClick('treasury', 'cash_book', 'view_cash_book')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('treasury', 'cash_book', 'view_cash_book')
                                    ? 'bg-amber-50 text-amber-900 font-semibold border-l-2 border-amber-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Table className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>View Cash Book</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 1.2 Credit Book Register */}
                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={(e) => toggleSubGroup('treasury-credit-book', e)}
                            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <BookMarked className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="truncate">Credit Book Register</span>
                            </span>
                            {expandedSubGroups['treasury-credit-book'] ? (
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                          {expandedSubGroups['treasury-credit-book'] && (
                            <div className="pl-4 space-y-0.5">
                              <button
                                type="button"
                                onClick={() => handleOperationClick('treasury', 'credit_book', 'add_credit')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('treasury', 'credit_book', 'add_credit')
                                    ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Plus className="w-3 h-3 text-blue-600 shrink-0" />
                                <span>Add Credit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOperationClick('treasury', 'credit_book', 'view_credit_book')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('treasury', 'credit_book', 'view_credit_book')
                                    ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Table className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>View Credit Book Register</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 1.3 Bank Management */}
                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={(e) => toggleSubGroup('treasury-bank-management', e)}
                            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <Landmark className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span className="truncate">Bank Management</span>
                            </span>
                            {expandedSubGroups['treasury-bank-management'] ? (
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                          {expandedSubGroups['treasury-bank-management'] && (
                            <div className="pl-4 space-y-0.5">
                              <button
                                type="button"
                                onClick={() => handleOperationClick('treasury', 'bank_management', 'add_bank')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('treasury', 'bank_management', 'add_bank')
                                    ? 'bg-teal-50 text-teal-900 font-semibold border-l-2 border-teal-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Plus className="w-3 h-3 text-teal-600 shrink-0" />
                                <span>Add Bank</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOperationClick('treasury', 'bank_management', 'list_banks')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('treasury', 'bank_management', 'list_banks')
                                    ? 'bg-teal-50 text-teal-900 font-semibold border-l-2 border-teal-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Table className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>List of Banks</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOperationClick('treasury', 'bank_management', 'add_bank_account')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('treasury', 'bank_management', 'add_bank_account')
                                    ? 'bg-teal-50 text-teal-900 font-semibold border-l-2 border-teal-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Plus className="w-3 h-3 text-teal-600 shrink-0" />
                                <span>Add Bank Account</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOperationClick('treasury', 'bank_management', 'list_bank_accounts')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('treasury', 'bank_management', 'list_bank_accounts')
                                    ? 'bg-teal-50 text-teal-900 font-semibold border-l-2 border-teal-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Table className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>List of Bank Accounts</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOperationClick('treasury', 'bank_management', 'account_details')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('treasury', 'bank_management', 'account_details')
                                    ? 'bg-teal-50 text-teal-900 font-semibold border-l-2 border-teal-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>Bank Account Details</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOperationClick('treasury', 'bank_management', 'banks_summary')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('treasury', 'bank_management', 'banks_summary')
                                    ? 'bg-teal-50 text-teal-900 font-semibold border-l-2 border-teal-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <FileSpreadsheet className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>Banks Summary</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* -------------------------------------------------------------
                        2. PURCHASER SIDEBAR MENU
                        - Demand (New Demand, View Demands, View list of Approved & Rejected Demands, Approved & Rejected)  
                        - Purchase (New Purchase, View Purchases, Approved & Rejected)
                    ------------------------------------------------------------- */}
                    {item.id === 'purchase' && (
                      <div className="space-y-2">
                        {/* 2.1 Demand */}
                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={(e) => toggleSubGroup('purchase-demand', e)}
                            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="truncate">Demand</span>
                            </span>
                            {expandedSubGroups['purchase-demand'] ? (
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                          {expandedSubGroups['purchase-demand'] && (
                            <div className="pl-4 space-y-0.5">
                              <button
                                type="button"
                                onClick={() => handleOperationClick('purchase', 'demand', 'new_demand')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('purchase', 'demand', 'new_demand')
                                    ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Plus className="w-3 h-3 text-blue-600 shrink-0" />
                                <span>New Demand</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOperationClick('purchase', 'demand', 'view_demands')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('purchase', 'demand', 'view_demands')
                                    ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Table className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>View Demands</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOperationClick('purchase', 'demand', 'approved_rejected_demands')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('purchase', 'demand', 'approved_rejected_demands')
                                    ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <FileCheck2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate">View list of Approved & Rejected Demands</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOperationClick('purchase', 'demand', 'approved_rejected')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('purchase', 'demand', 'approved_rejected')
                                    ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <FileCheck className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>Approved & Rejected</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 2.2 Purchase */}
                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={(e) => toggleSubGroup('purchase-purchase', e)}
                            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <ShoppingCart className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="truncate">Purchase</span>
                            </span>
                            {expandedSubGroups['purchase-purchase'] ? (
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                          {expandedSubGroups['purchase-purchase'] && (
                            <div className="pl-4 space-y-0.5">
                              <button
                                type="button"
                                onClick={() => handleOperationClick('purchase', 'purchase', 'new_purchase')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('purchase', 'purchase', 'new_purchase')
                                    ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Plus className="w-3 h-3 text-blue-600 shrink-0" />
                                <span>New Purchase</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOperationClick('purchase', 'purchase', 'view_purchases')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('purchase', 'purchase', 'view_purchases')
                                    ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Table className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>View Purchases</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOperationClick('purchase', 'purchase', 'approved_rejected_purchases')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('purchase', 'purchase', 'approved_rejected_purchases')
                                    ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <FileCheck2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Approved & Rejected</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* -------------------------------------------------------------
                        3. STORE & SALES SIDEBAR MENU
                        - Sale(
                            POS(POS Sheet & Register, New Coal Sells),
                            Record Coal Sell,
                            Coal Sell Report(Record Coal Sell, Add Partners Column),
                            Partners(Add Partners, View Partners),
                            Buyers(Add Buyers, View Buyers),
                            Vehicles(Manage Vehicle, Add Vehicle, View Vehicle, Add Vehicle Consumption, View Consumption Table)
                          )
                        - Stock Report(Add Item, View Items, Add Stock, View Stock, Store Summary)
                        - Company Setting
                    ------------------------------------------------------------- */}
                    {item.id === 'store_sales' && (
                      <div className="space-y-2">
                        {/* 3.1 Coal Management (Daily Production / Stock, POS, Record Coal Sell, Reports, Partners, Buyers, Vehicles) */}
                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={(e) => toggleSubGroup('store-sale', e)}
                            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <Pickaxe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="truncate">Coal Management</span>
                            </span>
                            {expandedSubGroups['store-sale'] ? (
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            )}
                          </button>

                          {expandedSubGroups['store-sale'] && (
                            <div className="pl-3 space-y-1.5 border-l border-slate-200 ml-2 mt-1">
                              {/* 3.1.0 Daily Coal Production / Stock */}
                              <div className="space-y-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => toggleSubGroup('store-coal-production', e)}
                                  className="w-full flex items-center justify-between px-1.5 py-0.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 rounded cursor-pointer"
                                >
                                  <span className="truncate font-semibold text-emerald-800">Daily Production / Stock</span>
                                  {expandedSubGroups['store-coal-production'] ? (
                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-slate-400" />
                                  )}
                                </button>
                                {expandedSubGroups['store-coal-production'] && (
                                  <div className="pl-3 space-y-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOperationClick('store_sales', 'coal_management', 'add_coal_production')}
                                      className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                        isOpActive('store_sales', 'coal_management', 'add_coal_production')
                                          ? 'bg-emerald-50 text-emerald-900 font-semibold border-l-2 border-emerald-600'
                                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                      }`}
                                    >
                                      <Plus className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span>Add Daily Production</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOperationClick('store_sales', 'coal_management', 'view_coal_production')}
                                      className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                        isOpActive('store_sales', 'coal_management', 'view_coal_production')
                                          ? 'bg-emerald-50 text-emerald-900 font-semibold border-l-2 border-emerald-600'
                                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                      }`}
                                    >
                                      <Table className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span>Production Register</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* 3.1.1 New Coal Sell (POS Entry Form) */}
                              <button
                                type="button"
                                onClick={() => handleOperationClick('store_sales', 'sale', 'record_coal_sell')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('store_sales', 'sale', 'record_coal_sell')
                                    ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <FileCheck2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>New Coal Sell (POS Form)</span>
                              </button>

                              {/* 3.1.2 Daily CSR Entries */}
                              <button
                                type="button"
                                onClick={() => handleOperationClick('store_sales', 'sale', 'daily_csr_entries')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('store_sales', 'sale', 'daily_csr_entries')
                                    ? 'bg-emerald-50 text-emerald-900 font-semibold border-l-2 border-emerald-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Table className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Daily CSR Entries</span>
                              </button>

                              {/* 3.1.3 Total CSR (sales report) */}
                              <div className="space-y-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => toggleSubGroup('store-sale-coal-report', e)}
                                  className="w-full flex items-center justify-between px-1.5 py-0.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 rounded cursor-pointer"
                                >
                                  <span className="truncate">Total CSR (sales report)</span>
                                  {expandedSubGroups['store-sale-coal-report'] ? (
                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-slate-400" />
                                  )}
                                </button>
                                {expandedSubGroups['store-sale-coal-report'] && (
                                  <div className="pl-3 space-y-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOperationClick('store_sales', 'sale', 'total_csr')}
                                      className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                        isOpActive('store_sales', 'sale', 'total_csr') || isOpActive('store_sales', 'sale', 'coal_sales_report')
                                          ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                      }`}
                                    >
                                      <BarChart3 className="w-3 h-3 text-blue-600 shrink-0" />
                                      <span>Sales Report Matrix</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOperationClick('store_sales', 'sale', 'coal_sales_report_record')}
                                      className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                        isOpActive('store_sales', 'sale', 'coal_sales_report_record')
                                          ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                      }`}
                                    >
                                      <Plus className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span>Record Coal Sell</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOperationClick('store_sales', 'sale', 'coal_sales_report_partner_col')}
                                      className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                        isOpActive('store_sales', 'sale', 'coal_sales_report_partner_col')
                                          ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                      }`}
                                    >
                                      <Handshake className="w-3 h-3 text-blue-600 shrink-0" />
                                      <span>Add Partners Column</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* 3.1.4 Partners (Add Partners, View Partners) */}
                              <div className="space-y-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => toggleSubGroup('store-sale-partners', e)}
                                  className="w-full flex items-center justify-between px-1.5 py-0.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 rounded cursor-pointer"
                                >
                                  <span className="truncate">Partners</span>
                                  {expandedSubGroups['store-sale-partners'] ? (
                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-slate-400" />
                                  )}
                                </button>
                                {expandedSubGroups['store-sale-partners'] && (
                                  <div className="pl-3 space-y-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOperationClick('store_sales', 'sale', 'add_partner')}
                                      className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                        isOpActive('store_sales', 'sale', 'add_partner')
                                          ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                      }`}
                                    >
                                      <Plus className="w-3 h-3 text-blue-600 shrink-0" />
                                      <span>Add Partners</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOperationClick('store_sales', 'sale', 'view_partners')}
                                      className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                        isOpActive('store_sales', 'sale', 'view_partners')
                                          ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                      }`}
                                    >
                                      <Table className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span>View Partners</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* 3.1.5 Buyers (Add Buyers, View Buyers) */}
                              <div className="space-y-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => toggleSubGroup('store-sale-buyers', e)}
                                  className="w-full flex items-center justify-between px-1.5 py-0.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 rounded cursor-pointer"
                                >
                                  <span className="truncate">Buyers</span>
                                  {expandedSubGroups['store-sale-buyers'] ? (
                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-slate-400" />
                                  )}
                                </button>
                                {expandedSubGroups['store-sale-buyers'] && (
                                  <div className="pl-3 space-y-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOperationClick('store_sales', 'sale', 'add_buyer')}
                                      className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                        isOpActive('store_sales', 'sale', 'add_buyer')
                                          ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                      }`}
                                    >
                                      <Plus className="w-3 h-3 text-blue-600 shrink-0" />
                                      <span>Add Buyers</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOperationClick('store_sales', 'sale', 'view_buyers')}
                                      className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                        isOpActive('store_sales', 'sale', 'view_buyers')
                                          ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                      }`}
                                    >
                                      <Table className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span>View Buyers</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* 3.1.6 Vehicles (Manage Vehicle, Add Vehicle, View Vehicle, Add Vehicle Consumption, View Consumption Table) */}
                              <div className="space-y-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => toggleSubGroup('store-sale-vehicles', e)}
                                  className="w-full flex items-center justify-between px-1.5 py-0.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 rounded cursor-pointer"
                                >
                                  <span className="truncate">Vehicles</span>
                                  {expandedSubGroups['store-sale-vehicles'] ? (
                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-slate-400" />
                                  )}
                                </button>
                                {expandedSubGroups['store-sale-vehicles'] && (
                                  <div className="pl-3 space-y-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOperationClick('store_sales', 'sale', 'manage_vehicle')}
                                      className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                        isOpActive('store_sales', 'sale', 'manage_vehicle')
                                          ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                      }`}
                                    >
                                      <Truck className="w-3 h-3 text-teal-600 shrink-0" />
                                      <span>Manage Vehicle</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOperationClick('store_sales', 'sale', 'add_vehicle')}
                                      className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                        isOpActive('store_sales', 'sale', 'add_vehicle')
                                          ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                      }`}
                                    >
                                      <Plus className="w-3 h-3 text-blue-600 shrink-0" />
                                      <span>Add Vehicle</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOperationClick('store_sales', 'sale', 'view_vehicle')}
                                      className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                        isOpActive('store_sales', 'sale', 'view_vehicle')
                                          ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                      }`}
                                    >
                                      <Table className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span>View Vehicle</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOperationClick('store_sales', 'sale', 'add_consumption')}
                                      className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                        isOpActive('store_sales', 'sale', 'add_consumption')
                                          ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                      }`}
                                    >
                                      <Plus className="w-3 h-3 text-amber-600 shrink-0" />
                                      <span>Add Vehicle Consumption</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOperationClick('store_sales', 'sale', 'view_consumption')}
                                      className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                        isOpActive('store_sales', 'sale', 'view_consumption')
                                          ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                      }`}
                                    >
                                      <Table className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span>View Consumption Table</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 3.2 Stock Report (Add Item, View Items, Add Stock, View Stock, Store Summary) */}
                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={(e) => toggleSubGroup('store-stock-report', e)}
                            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <Boxes className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="truncate">Stock Report</span>
                            </span>
                            {expandedSubGroups['store-stock-report'] ? (
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                          {expandedSubGroups['store-stock-report'] && (
                            <div className="pl-4 space-y-0.5">
                              <button
                                type="button"
                                onClick={() => handleOperationClick('store_sales', 'stock_report', 'add_item')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('store_sales', 'stock_report', 'add_item')
                                    ? 'bg-amber-50 text-amber-900 font-semibold border-l-2 border-amber-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Plus className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Add Item</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOperationClick('store_sales', 'stock_report', 'view_items')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('store_sales', 'stock_report', 'view_items')
                                    ? 'bg-amber-50 text-amber-900 font-semibold border-l-2 border-amber-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Table className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>View Items</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOperationClick('store_sales', 'stock_report', 'add_stock')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('store_sales', 'stock_report', 'add_stock')
                                    ? 'bg-amber-50 text-amber-900 font-semibold border-l-2 border-amber-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Plus className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Add Stock</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOperationClick('store_sales', 'stock_report', 'view_stock')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('store_sales', 'stock_report', 'view_stock')
                                    ? 'bg-amber-50 text-amber-900 font-semibold border-l-2 border-amber-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Table className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>View Stock</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOperationClick('store_sales', 'stock_report', 'store_summary')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('store_sales', 'stock_report', 'store_summary')
                                    ? 'bg-amber-50 text-amber-900 font-semibold border-l-2 border-amber-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <FileSpreadsheet className="w-3 h-3 text-purple-600 shrink-0" />
                                <span>Store Summary</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 3.3 Company Setting */}
                        <div>
                          <button
                            type="button"
                            onClick={() => handleOperationClick('store_sales', 'company_setting', 'company_setting')}
                            className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                              isOpActive('store_sales', 'company_setting', 'company_setting')
                                ? 'bg-slate-100 text-slate-900 font-semibold border-l-2 border-slate-700'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <Settings className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>Company Setting</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* -------------------------------------------------------------
                        4. ACCOUNTS SIDEBAR MENU
                        - Add Account
                        - Chart of Accounts
                        - Create Voucher
                        - Voucher Register
                        - General Ledger
                        - Trial Balance
                    ------------------------------------------------------------- */}
                    {item.id === 'accounting' && (
                      <div className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => handleOperationClick('accounting', 'accounts', 'add_account')}
                          className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                            isOpActive('accounting', 'accounts', 'add_account')
                              ? 'bg-emerald-50 text-emerald-900 font-semibold border-l-2 border-emerald-600'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <Plus className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Add Account</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOperationClick('accounting', 'accounts', 'chart_of_accounts')}
                          className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                            isOpActive('accounting', 'accounts', 'chart_of_accounts')
                              ? 'bg-emerald-50 text-emerald-900 font-semibold border-l-2 border-emerald-600'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <FolderTree className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>Chart of Accounts</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOperationClick('accounting', 'accounts', 'create_voucher')}
                          className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                            isOpActive('accounting', 'accounts', 'create_voucher')
                              ? 'bg-emerald-50 text-emerald-900 font-semibold border-l-2 border-emerald-600'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <Plus className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Create Voucher</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOperationClick('accounting', 'accounts', 'edit_voucher')}
                          className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                            isOpActive('accounting', 'accounts', 'edit_voucher')
                              ? 'bg-emerald-50 text-emerald-900 font-semibold border-l-2 border-emerald-600'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <Edit3 className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>Edit Voucher</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOperationClick('accounting', 'accounts', 'voucher_register')}
                          className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                            isOpActive('accounting', 'accounts', 'voucher_register')
                              ? 'bg-emerald-50 text-emerald-900 font-semibold border-l-2 border-emerald-600'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <FileSpreadsheet className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>Voucher Register</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOperationClick('accounting', 'accounts', 'general_ledger')}
                          className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                            isOpActive('accounting', 'accounts', 'general_ledger')
                              ? 'bg-emerald-50 text-emerald-900 font-semibold border-l-2 border-emerald-600'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>General Ledger</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOperationClick('accounting', 'accounts', 'trial_balance')}
                          className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                            isOpActive('accounting', 'accounts', 'trial_balance')
                              ? 'bg-emerald-50 text-emerald-900 font-semibold border-l-2 border-emerald-600'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <Scale className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>Trial Balance</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer with Sign Out for All Users */}
        <div className="p-3 border-t border-slate-200 shrink-0 bg-slate-50 space-y-2">
          <button
            type="button"
            onClick={onLogout}
            title="Sign out of current account"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200 hover:border-red-300 transition-colors cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4 text-red-600" />
            <span>Sign Out ({currentUser.username})</span>
          </button>
        </div>
      </aside>
    </>
  );
};
