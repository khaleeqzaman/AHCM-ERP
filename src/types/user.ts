export type UserRole = 'admin' | 'purchaser' | 'cashier' | 'accountant' | 'store_manager';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  password: string; // Plain text for demo and clear credentials retrieval
  department: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
  phone?: string;
}

export interface RoleConfig {
  role: UserRole;
  label: string;
  badgeColor: string;
  description: string;
  allowedModules: string[];
  defaultModule: string;
}
