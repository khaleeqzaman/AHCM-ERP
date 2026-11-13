import React, { useState } from 'react';
import { 
  ShoppingCart, 
  LayoutDashboard, 
  ShieldCheck, 
  Settings, 
  Building2,
  Scale,
  Banknote,
  Boxes,
  Users,
  UserCircle,
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
  BarChart3,
  Tag,
  Layers,
  Fuel,
  Sliders,
  Database,
  PanelLeftClose,
  PanelLeftOpen
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  pendingApprovalsCount?: number;
  currentUser: User;
  onLogout: () => void;
  onOpenProfile?: () => void;
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
  isCollapsed: propIsCollapsed,
  onToggleCollapse,
  pendingApprovalsCount = 0,
  currentUser,
  onLogout,
  onOpenProfile,
}) => {
  // Collapsible slim sidebar state
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ahcm_erp_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : internalCollapsed;

  const handleToggleCollapse = (explicitValue?: boolean) => {
    const next = explicitValue !== undefined ? explicitValue : !isCollapsed;
    setInternalCollapsed(next);
    try {
      localStorage.setItem('ahcm_erp_sidebar_collapsed', String(next));
    } catch {}
    if (onToggleCollapse) {
      onToggleCollapse();
    }
  };

  // Collapsible state for top-level menus - COLLAPSED BY DEFAULT
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Collapsible state for nested sub-groups inside modules - COLLAPSED BY DEFAULT
  const [expandedSubGroups, setExpandedSubGroups] = useState<Record<string, boolean>>({});

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
            label: 'Cashier Module',
            icon: <Banknote className="w-4 h-4" />,
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
            label: 'Cashier Desk',
            icon: <Banknote className="w-4 h-4" />,
            hasSubmenu: true,
          },
          {
            id: 'store_sales' as NavModule,
            label: 'Store & Sales Desk',
            icon: <Boxes className="w-4 h-4" />,
            hasSubmenu: true,
          },
          {
            id: 'settings' as NavModule,
            label: 'Settings',
            icon: <Sliders className="w-4 h-4" />,
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
        className={`fixed inset-y-0 left-0 z-50 bg-white text-slate-700 flex flex-col border-r border-slate-200 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile 
            ? 'translate-x-0 w-72 shadow-xl' 
            : `-translate-x-full lg:translate-x-0 ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-72'}`
        }`}
      >
        {/* Brand Header */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'} h-16 border-b border-slate-200 shrink-0 bg-white transition-all`}>
          {isCollapsed ? (
            <button
              type="button"
              onClick={() => handleToggleCollapse(false)}
              className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white font-bold shadow-xs transition-transform hover:scale-105 cursor-pointer"
              title="Expand sidebar (Full view)"
              aria-label="Expand sidebar"
            >
              <Building2 className="w-5 h-5" />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-xs shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="text-sm font-bold tracking-tight text-slate-900 block truncate">
                    AHCM ERP
                  </span>
                  <span className="text-[11px] text-slate-500 block -mt-0.5 truncate">
                    Enterprise Suite
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleCollapse(true)}
                  className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Collapse sidebar (Slim icon view)"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  onClick={onToggleMobile}
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Current Active Role Indicator */}
        {isCollapsed ? (
          <div className="py-3 px-2 border-b border-slate-200 flex justify-center bg-slate-50/80">
            <button
              type="button"
              onClick={onOpenProfile}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border ${roleBadge.color} shadow-xs hover:scale-105 transition-transform cursor-pointer`}
              title={`${currentUser.name} (@${currentUser.username}) - Click to change Profile Name or Password`}
              aria-label="User Profile and Password"
            >
              {currentUser.name ? currentUser.name.substring(0, 2).toUpperCase() : 'U'}
            </button>
          </div>
        ) : (
          <div 
            onClick={onOpenProfile}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onOpenProfile?.();
              }
            }}
            title="Click to change your Profile Name and Password"
            className="px-4 py-3 bg-slate-50/80 hover:bg-blue-50/60 border-b border-slate-200 cursor-pointer transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 group-hover:text-blue-600 transition-colors">
                My Profile & Account ⚙️
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 truncate mt-1 flex items-center justify-between">
              <span className="truncate">{currentUser.name}</span>
              <span className="text-[10px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              @{currentUser.username} · {currentUser.department}
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <div className={`flex-1 py-3 ${isCollapsed ? 'px-2 space-y-2' : 'px-2.5 space-y-1'} overflow-y-auto overflow-x-hidden text-xs`}>
          {!isCollapsed && (
            <div className="px-2.5 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              {currentUser.role === 'admin' ? 'Administration & Modules' : 'Assigned Workspace'}
            </div>
          )}

          {navItems.map((item) => {
            const isModuleActive = currentModule === item.id;
            const isExpanded = !!expandedModules[item.id];

            if (isCollapsed) {
              return (
                <div key={item.id} className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      // On slim collapse, clicking expands the sidebar and opens the module's sub-items
                      handleToggleCollapse(false);
                      onSelectModule(item.id);
                      if (item.hasSubmenu) {
                        setExpandedModules({ [item.id]: true });
                      }
                    }}
                    className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isModuleActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    title={`${item.label}${item.hasSubmenu ? ' (Click to expand)' : ''}${item.badgeCount ? ` - ${item.badgeCount} pending` : ''}`}
                    aria-label={item.label}
                  >
                    <span className="scale-110">{item.icon}</span>

                    {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-purple-600 text-white text-[10px] font-bold font-mono rounded-full flex items-center justify-center shadow-xs border border-white">
                        {item.badgeCount}
                      </span>
                    )}

                    {item.hasSubmenu && !isModuleActive && (
                      <span className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    )}
                  </button>
                </div>
              );
            }

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
                    if (item.hasSubmenu) {
                      setExpandedModules((prev) => ({
                        ...prev,
                        [item.id]: !prev[item.id],
                      }));
                    }
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
                        {/* 3.1 STORE MANAGEMENT */}
                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={(e) => toggleSubGroup('store-management', e)}
                            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <Boxes className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="truncate font-bold">STORE MANAGEMENT</span>
                            </span>
                            {expandedSubGroups['store-management'] ? (
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            )}
                          </button>

                          {expandedSubGroups['store-management'] && (
                            <div className="pl-3 space-y-1 border-l border-slate-200 ml-2 mt-1">
                              {/* Items */}
                              <button
                                type="button"
                                onClick={() => handleOperationClick('store_sales', 'store_management', 'items')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('store_sales', 'store_management', 'items')
                                    ? 'bg-emerald-50 text-emerald-900 font-semibold border-l-2 border-emerald-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Tag className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Items (Add / View)</span>
                              </button>

                              {/* Item Inventory */}
                              <button
                                type="button"
                                onClick={() => handleOperationClick('store_sales', 'store_management', 'item_stock')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('store_sales', 'store_management', 'item_stock') || isOpActive('store_sales', 'store_management', 'item_inventory')
                                    ? 'bg-emerald-50 text-emerald-900 font-semibold border-l-2 border-emerald-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Layers className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Item Inventory (Add / View)</span>
                              </button>

                              {/* Item Consumption */}
                              <button
                                type="button"
                                onClick={() => handleOperationClick('store_sales', 'store_management', 'item_consumption')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('store_sales', 'store_management', 'item_consumption')
                                    ? 'bg-emerald-50 text-emerald-900 font-semibold border-l-2 border-emerald-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Fuel className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Item Consumption</span>
                              </button>

                              {/* Item Settings */}
                              <button
                                type="button"
                                onClick={() => handleOperationClick('store_sales', 'store_management', 'item_setting')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('store_sales', 'store_management', 'item_setting')
                                    ? 'bg-emerald-50 text-emerald-900 font-semibold border-l-2 border-emerald-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Sliders className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Item Settings (Categories, Units)</span>
                              </button>

                              {/* Store Reports */}
                              <button
                                type="button"
                                onClick={() => handleOperationClick('store_sales', 'store_management', 'reports')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('store_sales', 'store_management', 'reports')
                                    ? 'bg-emerald-50 text-emerald-900 font-semibold border-l-2 border-emerald-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <BarChart3 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Store Reports & Audits</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 3.2 COAL MANAGEMENT */}
                        <div className="space-y-0.5 pt-1">
                          <button
                            type="button"
                            onClick={(e) => toggleSubGroup('coal-management-group', e)}
                            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <Pickaxe className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                              <span className="truncate font-bold">COAL MANAGEMENT</span>
                            </span>
                            {expandedSubGroups['coal-management-group'] ? (
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            )}
                          </button>

                          {expandedSubGroups['coal-management-group'] && (
                            <div className="pl-3 space-y-1 border-l border-slate-200 ml-2 mt-1">
                              {/* Coal Stock */}
                              <button
                                type="button"
                                onClick={() => handleOperationClick('store_sales', 'coal_management', 'coal_stock')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('store_sales', 'coal_management', 'coal_stock')
                                    ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Database className="w-3 h-3 text-blue-600 shrink-0" />
                                <span>Coal Stock (Inflow & Opening)</span>
                              </button>

                              {/* Coal Sell & Reports */}
                              <button
                                type="button"
                                onClick={() => handleOperationClick('store_sales', 'coal_management', 'coal_sell')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('store_sales', 'coal_management', 'coal_sell')
                                    ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Receipt className="w-3 h-3 text-blue-600 shrink-0" />
                                <span>Coal Sell POS & Reports</span>
                              </button>

                              {/* Partner Management */}
                              <button
                                type="button"
                                onClick={() => handleOperationClick('store_sales', 'coal_management', 'partners')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('store_sales', 'coal_management', 'partners')
                                    ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Handshake className="w-3 h-3 text-blue-600 shrink-0" />
                                <span>Partner Management</span>
                              </button>

                              {/* Buyer Management */}
                              <button
                                type="button"
                                onClick={() => handleOperationClick('store_sales', 'coal_management', 'buyers')}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isOpActive('store_sales', 'coal_management', 'buyers')
                                    ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                              >
                                <Building2 className="w-3 h-3 text-blue-600 shrink-0" />
                                <span>Buyer Management</span>
                              </button>
                            </div>
                          )}
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

        {/* Sidebar Footer with Profile & Sign Out for All Users */}
        <div className={`p-3 border-t border-slate-200 shrink-0 bg-slate-50 ${isCollapsed ? 'flex flex-col items-center gap-2 px-2' : 'space-y-2'}`}>
          {isCollapsed ? (
            <>
              <button
                type="button"
                onClick={onOpenProfile}
                title={`Profile & Password (${currentUser.username})`}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-pointer"
                aria-label="Profile Settings"
              >
                <UserCircle className="w-5 h-5 text-blue-600" />
              </button>
              <button
                type="button"
                onClick={onLogout}
                title={`Sign Out (${currentUser.username})`}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-red-600 hover:bg-red-100 active:bg-red-200 transition-colors cursor-pointer"
                aria-label="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              {/* Profile Option */}
              <button
                type="button"
                onClick={onOpenProfile}
                title="Open user profile and change password"
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200 transition-colors cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 uppercase border border-blue-200">
                    {currentUser.username.charAt(0)}
                  </div>
                  <div className="text-left truncate">
                    <span className="block text-xs font-semibold text-slate-900 truncate">
                      {currentUser.name || currentUser.username}
                    </span>
                    <span className="block text-[10px] text-slate-500 capitalize">
                      {currentUser.role}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-500 shrink-0">
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[11px] font-semibold text-blue-600">Profile</span>
                </div>
              </button>

              {/* Sign Out Option */}
              <button
                type="button"
                onClick={onLogout}
                title="Sign out of current account"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200 hover:border-red-300 transition-colors cursor-pointer shadow-xs"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span>Sign Out ({currentUser.username})</span>
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
