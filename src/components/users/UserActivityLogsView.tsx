import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Download, 
  Trash2, 
  RefreshCw, 
  Filter, 
  Calendar, 
  ShieldCheck, 
  User as UserIcon, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { ActivityLog, ActivityLogCategory } from '../../types/activityLog';
import { getActivityLogs, subscribeActivityLogs, clearActivityLogs } from '../../services/activityLogger';
import { User, UserRole } from '../../types/user';
import { exportUniversalCsv } from '../../utils/exportCsv';

interface UserActivityLogsViewProps {
  users: User[];
  currentUser: User;
}

export const UserActivityLogsView: React.FC<UserActivityLogsViewProps> = ({
  users,
  currentUser,
}) => {
  const [logs, setLogs] = useState<ActivityLog[]>(() => getActivityLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Subscribe to real-time activity log updates
  useEffect(() => {
    setLogs(getActivityLogs());
    return subscribeActivityLogs((freshLogs) => {
      setLogs(freshLogs);
    });
  }, []);

  const handleRefresh = () => {
    setLogs(getActivityLogs());
  };

  const handleClearLogs = () => {
    clearActivityLogs();
    setIsClearModalOpen(false);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.username.toLowerCase().includes(q) ||
        log.category.toLowerCase().includes(q);

      const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
      const matchesUser = selectedUser === 'all' || log.userId === selectedUser || log.username === selectedUser;
      const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;
      
      const matchesDate = !dateFilter || log.displayDate.startsWith(dateFilter) || log.timestamp.startsWith(dateFilter);

      return matchesSearch && matchesCategory && matchesUser && matchesStatus && matchesDate;
    });
  }, [logs, searchQuery, selectedCategory, selectedUser, selectedStatus, dateFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['ID', 'Timestamp', 'Username', 'User Name', 'Role', 'Category', 'Action', 'Details', 'Status', 'Device'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.displayDate,
      l.username,
      l.userName,
      l.userRole,
      l.category,
      l.action,
      l.details,
      l.status,
      l.ipAddress || 'Web Client',
    ]);

    const dateStr = new Date().toISOString().split('T')[0];
    exportUniversalCsv(`AHCM_ERP_Activity_Logs_${dateStr}.csv`, {
      tableName: 'System User Activity Audit Logs',
      reportDate: new Date().toLocaleDateString('en-GB'),
      headers,
      rows,
    });
  };

  // Metrics
  const totalEvents = logs.length;
  const todayStr = new Date().toISOString().split('T')[0].split('-').reverse().join('-');
  const todayCount = logs.filter((l) => l.displayDate.includes(todayStr) || l.timestamp.includes(new Date().toISOString().split('T')[0])).length;
  const uniqueUsersActive = new Set(logs.map((l) => l.userId)).size;
  const authEvents = logs.filter((l) => l.category === 'AUTH' || l.category === 'PROFILE').length;

  const getCategoryBadge = (cat: ActivityLogCategory) => {
    switch (cat) {
      case 'AUTH':
        return { label: 'Auth & Login', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'USER_MANAGEMENT':
        return { label: 'User Admin', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'PROFILE':
        return { label: 'User Profile', bg: 'bg-pink-50 text-pink-700 border-pink-200' };
      case 'PROCUREMENT':
        return { label: 'Procurement', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'TREASURY':
        return { label: 'Treasury', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'ACCOUNTING':
        return { label: 'Accounting', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'STORE_MANAGEMENT':
        return { label: 'Store Items', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'COAL_MANAGEMENT':
        return { label: 'Coal Sales', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      default:
        return { label: cat, bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const getRoleBadge = (role: string) => {
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
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-5">
      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Activities</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{totalEvents}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Today's Logs</div>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">{todayCount}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active Users Logged</div>
            <div className="text-xl font-bold font-mono text-purple-700 mt-0.5">{uniqueUsersActive}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <UserIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Security & Auth</div>
            <div className="text-xl font-bold font-mono text-indigo-700 mt-0.5">{authEvents}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by action, details, user, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Action Buttons: Export & Clear */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <button
              type="button"
              onClick={handleRefresh}
              title="Refresh logs"
              className="p-2 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredLogs.length === 0}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors shadow-xs ${
                filteredLogs.length > 0
                  ? 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer'
                  : 'border-slate-200 text-slate-300 bg-slate-50 cursor-not-allowed'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export CSV</span>
            </button>

            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                disabled={logs.length === 0}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors shadow-xs ${
                  logs.length > 0
                    ? 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer'
                    : 'border-slate-200 text-slate-300 bg-slate-50 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Logs</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500 text-[10px] uppercase">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
            >
              <option value="all">All Categories</option>
              <option value="AUTH">Auth & Login</option>
              <option value="USER_MANAGEMENT">User Management</option>
              <option value="PROFILE">Profile Changes</option>
              <option value="PROCUREMENT">Procurement (Demands/POs)</option>
              <option value="TREASURY">Treasury & Bank</option>
              <option value="ACCOUNTING">Accounting & Vouchers</option>
              <option value="STORE_MANAGEMENT">Store Items & Stock</option>
              <option value="COAL_MANAGEMENT">Coal Sales & Dispatch</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500 text-[10px] uppercase">User:</span>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
            >
              <option value="all">All Users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} (@{u.username})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500 text-[10px] uppercase">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
            </select>
          </div>

          {(searchQuery || selectedCategory !== 'all' || selectedUser !== 'all' || selectedStatus !== 'all' || dateFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedUser('all');
                setSelectedStatus('all');
                setDateFilter('');
              }}
              className="text-[11px] text-purple-600 hover:text-purple-800 font-medium underline ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-3 px-4 w-44">Date & Time</th>
                <th className="py-3 px-4 w-52">User & Role</th>
                <th className="py-3 px-4 w-36">Category</th>
                <th className="py-3 px-4 w-48">Action</th>
                <th className="py-3 px-4">Activity Description & Details</th>
                <th className="py-3 px-4 text-center w-24">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No activity logs found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {logs.length === 0
                        ? 'System activity will automatically be recorded here as users sign in, update records, and change profiles.'
                        : 'No logs match your current filter criteria.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const catBadge = getCategoryBadge(log.category);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{log.displayDate}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] uppercase text-white shrink-0 ${
                            log.userRole === 'admin' ? 'bg-purple-600' :
                            log.userRole === 'purchaser' ? 'bg-blue-600' :
                            log.userRole === 'cashier' ? 'bg-amber-600' :
                            log.userRole === 'accountant' ? 'bg-emerald-600' :
                            'bg-cyan-600'
                          }`}>
                            {log.username.slice(0, 2)}
                          </div>
                          <div className="truncate">
                            <div className="font-semibold text-slate-900 truncate">{log.userName}</div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                              <span>@{log.username}</span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] border font-semibold ${getRoleBadge(log.userRole)}`}>
                                {log.userRole}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${catBadge.bg}`}>
                          {catBadge.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {log.action}
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {log.details}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          log.status === 'success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'warning'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {log.status === 'success' ? (
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          ) : log.status === 'warning' ? (
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                          ) : (
                            <Info className="w-2.5 h-2.5 text-blue-600" />
                          )}
                          <span className="capitalize">{log.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredLogs.length} of {logs.length} logged entries</span>
          <span className="text-[11px] text-slate-400">Activity logs are preserved with high-priority audit tracking</span>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Clear Activity Logs?</h3>
            <p className="text-xs text-slate-600 mt-1">
              This will permanently delete all {logs.length} activity audit log records. This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearLogs}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer shadow-xs"
              >
                Yes, Clear All Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
