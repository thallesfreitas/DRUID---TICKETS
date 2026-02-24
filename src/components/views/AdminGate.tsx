/**
 * AdminGate - Rota /admin: exibe login ou dashboard conforme token
 */

import React, { useState, useCallback } from 'react';
import { getAdminToken, clearAdminToken } from '@/lib/adminAuth';
import { AdminLoginView } from './AdminLoginView';
import { AdminView } from './AdminView';
import { LayoutDashboard, LogOut } from 'lucide-react';

export function AdminGate() {
  const [logoutKey, setLogoutKey] = useState(0);
  const hasToken = !!getAdminToken();

  const handleLoginSuccess = useCallback(() => {
    setLogoutKey((k) => k + 1);
  }, []);

  const handleLogout = useCallback(() => {
    clearAdminToken();
    setLogoutKey((k) => k + 1);
  }, []);

  if (!hasToken) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <AdminLoginView onSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" key={logoutKey}>
      <header className="w-full py-4 px-6 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-orange-600" />
          <span className="font-semibold text-slate-900">Admin</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
          aria-label="Sair"
        >
          <LogOut size={18} />
          Sair
        </button>
      </header>
      <main className="flex-grow flex flex-col items-center p-6 max-w-4xl mx-auto w-full">
        <AdminView onBack={handleLogout} />
      </main>
    </div>
  );
}
