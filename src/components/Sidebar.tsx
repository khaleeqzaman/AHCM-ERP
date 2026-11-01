import React from 'react';
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
  X
} from 'lucide-react';
import { NavModule } from '../types';
import { User, UserRole } from '../types/user';

interface SidebarProps {
  currentModule: NavModule;
  onSelectModule: (module: NavModule) => void;
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  isOpenMobile,
  onToggleMobile,
  pendingApprovalsCount = 0,
  currentUser,
  onLogout,
}) => {
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
          },
          {
            id: 'accounting' as NavModule,
            label: 'Accounts Desk',
            icon: <Scale className="w-4 h-4" />,
          },
          {
            id: 'treasury' as NavModule,
            label: 'Treasury Desk',
            icon: <Vault className="w-4 h-4" />,
          },
          {
            id: 'store_sales' as NavModule,
            label: 'Store & Sales Desk',
            icon: <Boxes className="w-4 h-4" />,
          },
        ];
    }
  };

  const navItems = getNavItemsForRole(currentUser.role);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-purple-900/80 text-purple-200 border-purple-700' };
      case 'purchaser':
        return { label: 'Purchaser', color: 'bg-blue-900/80 text-blue-200 border-blue-700' };
      case 'cashier':
        return { label: 'Cashier', color: 'bg-amber-900/80 text-amber-200 border-amber-700' };
      case 'accountant':
        return { label: 'Accountant', color: 'bg-emerald-900/80 text-emerald-200 border-emerald-700' };
      case 'store_manager':
        return { label: 'Store Mgr', color: 'bg-cyan-900/80 text-cyan-200 border-cyan-700' };
      default:
        return { label: role, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const roleBadge = getRoleBadge(currentUser.role);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onToggleMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block">
                AHCM ERP
              </span>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                Enterprise Suite
              </span>
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={onToggleMobile}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Role Indicator */}
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Active Session
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${roleBadge.color}`}>
              {roleBadge.label}
            </span>
          </div>
          <div className="text-xs font-semibold text-white truncate mt-1">
            {currentUser.name}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            @{currentUser.username} · {currentUser.department}
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            {currentUser.role === 'admin' ? 'Administration & Modules' : 'Assigned Workspace'}
          </div>

          {navItems.map((item) => {
            const isActive = currentModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectModule(item.id);
                  if (isOpenMobile) onToggleMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded font-mono ${
                      isActive
                        ? 'bg-blue-700 text-blue-100'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      isActive
                        ? 'bg-purple-900 text-purple-200'
                        : 'bg-purple-600 text-white'
                    }`}
                  >
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer with Sign Out */}
        <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-900/80">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-300 bg-red-950/40 hover:bg-red-950/80 border border-red-900/60 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out ({currentUser.username})</span>
          </button>
        </div>
      </aside>
    </>
  );
};
