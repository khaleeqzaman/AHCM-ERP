import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  AlertCircle,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { User } from '../../types/user';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase();
    const matchedUser = users.find(
      (u) => u.username.toLowerCase() === cleanUsername && u.password === password
    );

    if (!matchedUser) {
      setError('Invalid username or password. Please check your credentials.');
      return;
    }

    if (matchedUser.status === 'inactive') {
      setError('This account is currently inactive. Please contact your System Administrator.');
      return;
    }

    onLogin(matchedUser);
  };

  const handleQuickLogin = (roleUsername: string) => {
    const user = users.find((u) => u.username === roleUsername);
    if (user) {
      setUsername(user.username);
      setPassword(user.password);
      setError(null);
      onLogin(user);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50/90 to-blue-50/30 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-blue-600 selection:text-white relative">
      {/* Background glow effects for light theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[320px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 mb-1">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            AHCM ERP Suite
          </h1>
          <p className="text-sm text-slate-500">
            Sign in to access your role-specific module workspace
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="username"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin, purchaser, cashier..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label 
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switcher Section */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3 h-3 text-blue-600" />
                <span>Quick Role Login</span>
              </span>
              <span className="text-[11px] text-slate-400">One-click test</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors group cursor-pointer"
              >
                <div className="text-xs font-semibold text-purple-700 group-hover:text-purple-800 truncate">{users.find(u => u.username === 'admin')?.name || 'Admin'}</div>
                <div className="text-[10px] text-slate-500 truncate">admin / admin123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('purchaser')}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors group cursor-pointer"
              >
                <div className="text-xs font-semibold text-blue-700 group-hover:text-blue-800 truncate">{users.find(u => u.username === 'purchaser')?.name || 'Purchaser'}</div>
                <div className="text-[10px] text-slate-500 truncate">purchaser / purchaser123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('cashier')}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors group cursor-pointer"
              >
                <div className="text-xs font-semibold text-amber-700 group-hover:text-amber-800 truncate">{users.find(u => u.username === 'cashier')?.name || 'Cashier'}</div>
                <div className="text-[10px] text-slate-500 truncate">cashier / cashier123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('accountant')}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors group cursor-pointer"
              >
                <div className="text-xs font-semibold text-emerald-700 group-hover:text-emerald-800 truncate">{users.find(u => u.username === 'accountant')?.name || 'Accountant'}</div>
                <div className="text-[10px] text-slate-500 truncate">accountant / accountant123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('storemanager')}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors group cursor-pointer col-span-2 sm:col-span-1"
              >
                <div className="text-xs font-semibold text-cyan-700 group-hover:text-cyan-800 truncate">{users.find(u => u.username === 'storemanager')?.name || 'Store Mgr'}</div>
                <div className="text-[10px] text-slate-500 truncate">storemanager / store123</div>
              </button>
            </div>
          </div>
        </div>

        {/* Credentials Reference Card */}
        <div className="bg-white/80 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 shadow-sm backdrop-blur-xs">
          <div className="flex items-center gap-2 text-slate-800 font-semibold mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Default System Accounts</span>
          </div>
          <div className="grid grid-cols-1 gap-1 text-[11px] font-mono">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-purple-700 font-medium truncate">{users.find(u => u.username === 'admin')?.name || 'Admin'}:</span>
              <span className="text-slate-600">admin / admin123</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-blue-700 font-medium truncate">{users.find(u => u.username === 'purchaser')?.name || 'Purchaser'}:</span>
              <span className="text-slate-600">purchaser / purchaser123</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-amber-700 font-medium truncate">{users.find(u => u.username === 'cashier')?.name || 'Cashier'}:</span>
              <span className="text-slate-600">cashier / cashier123</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-emerald-700 font-medium truncate">{users.find(u => u.username === 'accountant')?.name || 'Accountant'}:</span>
              <span className="text-slate-600">accountant / accountant123</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-cyan-700 font-medium truncate">{users.find(u => u.username === 'storemanager')?.name || 'Store Manager'}:</span>
              <span className="text-slate-600">storemanager / store123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
