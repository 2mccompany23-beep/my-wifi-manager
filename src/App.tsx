import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { UserManager } from './components/UserManager';
import { ActiveSessions } from './components/ActiveSessions';
import { VoucherGenerator } from './components/VoucherGenerator';
import { SalesHistory } from './components/SalesHistory';
import { RouterSettings } from './components/RouterSettings';
import { AdminLogin } from './components/AdminLogin';
import { RouterStatus, HotspotUser, ActiveSession, SaleTransaction, VoucherItem } from './types';

export function App() {
  const [authToken, setAuthToken] = useState<string | null>(() => sessionStorage.getItem('mikhmon_token'));
  const [adminUser, setAdminUser] = useState<string | null>(() => sessionStorage.getItem('mikhmon_user'));
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [routerStatus, setRouterStatus] = useState<RouterStatus | null>(null);
  const [users, setUsers] = useState<HotspotUser[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    if (!authToken) return null;
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${authToken}`
    };
    try {
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        handleLogout();
        return null;
      }
      return res;
    } catch (err) {
      console.warn(`[Auth Fetch] Network error for ${url}:`, err);
      return null;
    }
  };

  const fetchAllData = async () => {
    if (!authToken) return;

    try {
      const [statusRes, usersRes, activeRes, salesRes] = await Promise.all([
        fetchWithAuth('/api/router/status'),
        fetchWithAuth('/api/router/users'),
        fetchWithAuth('/api/router/active'),
        fetchWithAuth('/api/sales')
      ]);

      if (statusRes && statusRes.ok) {
        const sData = await statusRes.json();
        setRouterStatus(sData);
      }
      if (usersRes && usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(uData);
      }
      if (activeRes && activeRes.ok) {
        const aData = await activeRes.json();
        setActiveSessions(aData);
      }
      if (salesRes && salesRes.ok) {
        const sData = await salesRes.json();
        setSales(sData.sales || []);
        setTotalRevenue(sData.totalRevenue || 0);
      }
    } catch (err) {
      console.warn('Error loading dashboard data:', err);
    }
  };

  const handleLoginSuccess = (token: string, username: string) => {
    sessionStorage.setItem('mikhmon_token', token);
    sessionStorage.setItem('mikhmon_user', username);
    setAuthToken(token);
    setAdminUser(username);
  };

  const handleLogout = () => {
    if (authToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      }).catch(() => {});
    }
    sessionStorage.removeItem('mikhmon_token');
    sessionStorage.removeItem('mikhmon_user');
    setAuthToken(null);
    setAdminUser(null);
  };

  useEffect(() => {
    if (authToken) {
      fetchAllData();
      const interval = setInterval(fetchAllData, 10000);
      return () => clearInterval(interval);
    }
  }, [authToken]);

  // Gatekeeper: If not logged in, render the secure AdminLogin screen!
  if (!authToken) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Header Bar */}
      <Header
        routerStatus={routerStatus}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={fetchAllData}
        onLogout={handleLogout}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            routerStatus={routerStatus}
            users={users}
            activeSessions={activeSessions}
            sales={sales}
            totalRevenue={totalRevenue}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'users' && (
          <UserManager users={users} onRefresh={fetchAllData} />
        )}

        {activeTab === 'active' && (
          <ActiveSessions sessions={activeSessions} onRefresh={fetchAllData} />
        )}

        {activeTab === 'vouchers' && (
          <VoucherGenerator vouchers={vouchers} onRefresh={fetchAllData} />
        )}

        {activeTab === 'sales' && (
          <SalesHistory sales={sales} totalRevenue={totalRevenue} token={sessionStorage.getItem('mikhmon_token') || ''} />
        )}

        {activeTab === 'settings' && (
          <RouterSettings onRefresh={fetchAllData} />
        )}
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-800 text-center py-4 text-xs text-slate-500">
        <p>© 2026 2MC COMPANY ETS. Tous droits réservés. | Cloud Mikhmon 2.0 RouterOS v7.23.2 & FedaPay Gateway</p>
      </footer>
    </div>
  );
}

export default App;
