import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { UserManager } from './components/UserManager';
import { ActiveSessions } from './components/ActiveSessions';
import { VoucherGenerator } from './components/VoucherGenerator';
import { SalesHistory } from './components/SalesHistory';
import { RouterSettings } from './components/RouterSettings';
import { AdminLogin } from './components/AdminLogin';
import { BlockingSpinner } from './components/BlockingSpinner';
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

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

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

  const fetchAllData = async (showBlockingLoader = false, customMsg = '') => {
    if (!authToken) return;

    if (showBlockingLoader) {
      setLoading(true);
      setLoadingMessage(customMsg || 'Chargement et synchronisation des données MikroTik...');
    }

    try {
      await Promise.allSettled([
        fetchWithAuth('/api/router/status').then(async (res) => {
          if (res && res.ok) {
            const sData = await res.json();
            setRouterStatus((prev) => sData.online ? sData : (prev?.online ? prev : sData));
          }
        }),

        fetchWithAuth('/api/router/users').then(async (res) => {
          if (res && res.ok) {
            const uData = await res.json();
            if (Array.isArray(uData) && (uData.length > 0 || users.length === 0)) {
              setUsers(uData);
            }
          }
        }),

        fetchWithAuth('/api/router/active').then(async (res) => {
          if (res && res.ok) {
            const aData = await res.json();
            if (Array.isArray(aData)) {
              setActiveSessions(aData);
            }
          }
        }),

        fetchWithAuth('/api/sales').then(async (res) => {
          if (res && res.ok) {
            const sData = await res.json();
            if (sData.sales) setSales(sData.sales);
            if (sData.totalRevenue !== undefined) setTotalRevenue(sData.totalRevenue);
          }
        })
      ]);
    } finally {
      if (showBlockingLoader) {
        setLoading(false);
      }
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

  const handleManualRefresh = () => {
    fetchAllData(true, 'Synchronisation et rafraîchissement des données MikroTik...');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Blocking Full-Screen Spinner Overlay */}
      <BlockingSpinner isLoading={loading} message={loadingMessage} />

      {/* Header Bar */}
      <Header
        routerStatus={routerStatus}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          // Silent background fetch — no blocking spinner for tab navigation
          fetchAllData(false);
        }}
        onRefresh={handleManualRefresh}
        onLogout={handleLogout}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 pb-24 lg:p-8 lg:pb-8">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            routerStatus={routerStatus}
            users={users}
            activeSessions={activeSessions}
            sales={sales}
            totalRevenue={totalRevenue}
            onNavigate={(tab) => {
              setActiveTab(tab);
              fetchAllData(true, `Chargement de la section ${tab}...`);
            }}
          />
        )}

        {activeTab === 'users' && (
          <UserManager users={users} onRefresh={handleManualRefresh} />
        )}

        {activeTab === 'active' && (
          <ActiveSessions sessions={activeSessions} onRefresh={handleManualRefresh} />
        )}

        {activeTab === 'vouchers' && (
          <VoucherGenerator vouchers={vouchers} onRefresh={handleManualRefresh} />
        )}

        {activeTab === 'sales' && (
          <SalesHistory sales={sales} totalRevenue={totalRevenue} token={sessionStorage.getItem('mikhmon_token') || ''} />
        )}

        {activeTab === 'settings' && (
          <RouterSettings onRefresh={handleManualRefresh} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500 pb-20 lg:pb-4">
        <p>© 2026 2MC COMPANY ETS. Tous droits réservés. | Cloud Mikhmon 2.0 RouterOS v7.23.2 & FedaPay Gateway</p>
      </footer>
    </div>
  );
}

export default App;
