import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Search, 
  Key, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  EyeOff, 
  Lock, 
  AlertTriangle,
  Building2,
  RefreshCw,
  SlidersHorizontal,
  Mail,
  Phone,
  Briefcase
} from 'lucide-react';
import { User, UserRole } from '../../types/user';

interface UsersScreenProps {
  users: User[];
  currentUser: User;
  onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onResetPassword: (userId: string, newPass: string) => void;
}

export const UsersScreen: React.FC<UsersScreenProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onResetPassword,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);

  // Form states for Create / Edit
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    role: 'purchaser' as UserRole,
    password: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const togglePasswordReveal = (id: string) => {
    setRevealedPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateModal = () => {
    setFormData({
      username: '',
      name: '',
      email: '',
      phone: '',
      department: 'Procurement & Demands',
      role: 'purchaser',
      password: 'user123',
      status: 'active',
    });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      department: user.department,
      role: user.role,
      password: user.password,
      status: user.status,
    });
    setFormError(null);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUsername = formData.username.trim().toLowerCase();
    if (!cleanUsername) {
      setFormError('Username is required.');
      return;
    }

    // Check username uniqueness
    const existing = users.find(
      (u) => u.username.toLowerCase() === cleanUsername && u.id !== editingUser?.id
    );
    if (existing) {
      setFormError(`Username "${cleanUsername}" is already taken.`);
      return;
    }

    if (!formData.name.trim()) {
      setFormError('Full name is required.');
      return;
    }

    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        username: cleanUsername,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        department: formData.department.trim(),
        role: formData.role,
        password: formData.password || editingUser.password,
        status: formData.status,
      });
      setEditingUser(null);
    } else {
      if (!formData.password.trim()) {
        setFormError('Initial password is required.');
        return;
      }
      onAddUser({
        username: cleanUsername,
        name: formData.name.trim(),
        email: formData.email.trim() || `${cleanUsername}@ahcm-erp.com`,
        phone: formData.phone.trim(),
        department: formData.department.trim() || 'General Operations',
        role: formData.role,
        password: formData.password.trim(),
        status: formData.status,
      });
      setIsCreateModalOpen(false);
    }
  };

  const handlePasswordModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser || !newPasswordValue.trim()) return;
    onResetPassword(passwordModalUser.id, newPasswordValue.trim());
    setPasswordModalUser(null);
    setNewPasswordValue('');
  };

  const handleToggleStatus = (user: User) => {
    if (user.id === currentUser.id) {
      alert("You cannot deactivate your own currently active account.");
      return;
    }
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    onUpdateUser({ ...user, status: newStatus });
  };

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

  const roleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Admin (Full Access)';
      case 'purchaser':
        return 'Purchaser (Demands & POs)';
      case 'cashier':
        return 'Cashier (Treasury & Cash)';
      case 'accountant':
        return 'Accountant (General Ledger)';
      case 'store_manager':
        return 'Store Manager (Sales & Fleet)';
      default:
        return role;
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const inactiveUsers = totalUsers - activeUsers;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                Administration & Access Control
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs text-slate-500">User Management</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1 flex items-center gap-2.5">
              <span>Users & Role Security</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                Admin Exclusive
              </span>
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Create, edit, and assign strict role-wise module permissions for Admin, Purchaser, Cashier, Accountant, and Store Manager.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 transition-colors shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New User</span>
            </button>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-4 text-xs font-medium">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Total Accounts</span>
            <span className="text-lg font-bold font-mono text-slate-900">{totalUsers}</span>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <span className="text-emerald-700 block text-[11px]">Active Users</span>
            <span className="text-lg font-bold font-mono text-emerald-800">{activeUsers}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Inactive</span>
            <span className="text-lg font-bold font-mono text-slate-600">{inactiveUsers}</span>
          </div>

          <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
            <span className="text-purple-700 block text-[11px]">Admins</span>
            <span className="text-lg font-bold font-mono text-purple-800">
              {users.filter(u => u.role === 'admin').length}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <span className="text-blue-700 block text-[11px]">Purchasers</span>
            <span className="text-lg font-bold font-mono text-blue-800">
              {users.filter(u => u.role === 'purchaser').length}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <span className="text-amber-700 block text-[11px]">Cashier / Acc / Store</span>
            <span className="text-lg font-bold font-mono text-amber-800">
              {users.filter(u => ['cashier', 'accountant', 'store_manager'].includes(u.role)).length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, username, email, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-500 uppercase text-[10px]">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="purchaser">Purchaser</option>
                <option value="cashier">Cashier</option>
                <option value="accountant">Accountant</option>
                <option value="store_manager">Store Manager</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-500 uppercase text-[10px]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Assigned Role & Module</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Credentials (Password)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No users match your current filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = user.id === currentUser.id;
                  const isPassRevealed = revealedPasswords[user.id];

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                            user.role === 'admin' ? 'bg-purple-600 text-white' :
                            user.role === 'purchaser' ? 'bg-blue-600 text-white' :
                            user.role === 'cashier' ? 'bg-amber-600 text-white' :
                            user.role === 'accountant' ? 'bg-emerald-600 text-white' :
                            'bg-cyan-600 text-white'
                          }`}>
                            {user.username.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-normal">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 font-mono text-[11px]">
                              @{user.username} · {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${roleBadgeStyle(user.role)}`}>
                          <ShieldCheck className="w-3 h-3" />
                          <span>{roleLabel(user.role)}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        {user.department}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">
                            {isPassRevealed ? user.password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordReveal(user.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                            title={isPassRevealed ? 'Hide password' : 'Show password'}
                          >
                            {isPassRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPasswordModalUser(user);
                              setNewPasswordValue(user.password);
                            }}
                            className="text-[10px] text-purple-700 hover:text-purple-900 underline font-medium cursor-pointer ml-1"
                          >
                            Change
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          disabled={isCurrent}
                          title={isCurrent ? "Cannot deactivate yourself" : "Click to toggle active/inactive"}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                            user.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          } ${isCurrent ? 'cursor-not-allowed opacity-80' : ''}`}
                        >
                          {user.status === 'active' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {user.lastLogin || 'Never'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit user details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmUser(user)}
                            disabled={isCurrent || user.username === 'admin'}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isCurrent || user.username === 'admin'
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={isCurrent ? 'Cannot delete your own account' : user.username === 'admin' ? 'Root admin cannot be deleted' : 'Delete user'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          <span>Role Separation & Module Access Policy</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/50">
            <div className="font-bold text-purple-900">Admin</div>
            <p className="text-[11px] text-purple-700 mt-1">
              Own Admin Dashboard, Admin Approvals console, User Management module, and system oversight.
            </p>
          </div>
          <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/50">
            <div className="font-bold text-blue-900">Purchaser</div>
            <p className="text-[11px] text-blue-700 mt-1">
              Own Purchaser Dashboard, Purchase Module (Daily/Monthly demands, Purchase summaries, status tracking).
            </p>
          </div>
          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50">
            <div className="font-bold text-amber-900">Cashier</div>
            <p className="text-[11px] text-amber-700 mt-1">
              Own Cashier Dashboard, Treasury Module (Daily Cash Book vouchers, Credit Book, Bank accounts & transactions).
            </p>
          </div>
          <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
            <div className="font-bold text-emerald-900">Accountant</div>
            <p className="text-[11px] text-emerald-700 mt-1">
              Own Accountant Dashboard, Accounts Module (COA, Double-entry vouchers, General ledgers, Trial Balance, Old Ledger Access).
            </p>
          </div>
          <div className="p-3 rounded-lg border border-cyan-200 bg-cyan-50/50">
            <div className="font-bold text-cyan-900">Store Manager</div>
            <p className="text-[11px] text-cyan-700 mt-1">
              Own Store Dashboard, Store & Sales Module (Coal POS sell, buyers, partners, stock ledger, fleet & fuel logs).
            </p>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {(isCreateModalOpen || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingUser ? 'Edit User Account' : 'Add New User Account'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingUser ? 'Update role, department, and contact details' : 'Configure login credentials and role permissions'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingUser(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveForm} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. javed_khan"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Javed Khan"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="admin">Admin (Dashboard, Approvals, Users)</option>
                    <option value="purchaser">Purchaser (Dashboard, Purchase)</option>
                    <option value="cashier">Cashier (Dashboard, Treasury)</option>
                    <option value="accountant">Accountant (Dashboard, Accounts)</option>
                    <option value="store_manager">Store Manager (Dashboard, Store & Sales)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="active">Active (Can Sign In)</option>
                    <option value="inactive">Inactive (Disabled)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Logistics, Accounts"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@ahcm-erp.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+92 300 1234567"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
                <p className="text-xs text-slate-500">For @{passwordModalUser.username}</p>
              </div>
            </div>

            <form onSubmit={handlePasswordModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete User Account</h3>
            <p className="text-xs text-slate-600 mt-1">
              Are you sure you want to delete user <strong>@{deleteConfirmUser.username}</strong> ({deleteConfirmUser.name})?
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteUser(deleteConfirmUser.id);
                  setDeleteConfirmUser(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
