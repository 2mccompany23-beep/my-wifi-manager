import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { UserManager } from './components/UserManager';
import { ActiveSessions } from './components/ActiveSessions';
import { VoucherGenerator } from './components/VoucherGenerator';
import { SalesHistory } from './components/SalesHistory';
import { RouterSettings } from './components/RouterSettings';
import { AdminLogin } from './components/AdminLogin';
import { LandingPage } from './components/LandingPage';
import { RouterStatus, HotspotUser, ActiveSession, SaleTransaction, VoucherItem } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { registerServiceWorker } from './utils/pushManager';

export function App() {
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('mikhmon_token') || sessionStorage.getItem('mikhmon_token');
  });
  const [adminUser, setAdminUser] = useState<string | null>(() => {
    return localStorage.getItem('mikhmon_user') || sessionStorage.getItem('mikhmon_user');
  });
  
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      return hash === '#admin' || hash === '#login';
    }
    return false;
  });
  const [showLandingPreview, setShowLandingPreview] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [routerStatus, setRouterStatus] = useState<RouterStatus | null>(null);
  const [users, setUsers] = useState<HotspotUser[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

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

  const handleLoginSuccess = (token: string, username: string, rememberMe = false) => {
    sessionStorage.setItem('mikhmon_token', token);
    sessionStorage.setItem('mikhmon_user', username);
    if (rememberMe) {
      localStorage.setItem('mikhmon_token', token);
      localStorage.setItem('mikhmon_user', username);
      localStorage.setItem('mikhmon_remember', 'true');
    } else {
      localStorage.removeItem('mikhmon_token');
      localStorage.removeItem('mikhmon_user');
      localStorage.removeItem('mikhmon_remember');
    }
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
    localStorage.removeItem('mikhmon_token');
    localStorage.removeItem('mikhmon_user');
    localStorage.removeItem('mikhmon_remember');
    setAuthToken(null);
    setAdminUser(null);
  };

  useEffect(() => {
    registerServiceWorker();

    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin' || hash === '#login') {
        setShowAdminLogin(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!authToken) {
      setIsLiveConnected(false);
      return;
    }

    // Chargement initial
    fetchAllData();

    // Écouteur Server-Sent Events (SSE) temps réel
    let es: EventSource | null = null;
    let reconnectTimer: any = null;

    const initSSE = () => {
      try {
        es = new EventSource(`/api/sse/stream?token=${encodeURIComponent(authToken)}`);

        es.addEventListener('open', () => {
          setIsLiveConnected(true);
        });

        es.addEventListener('init', () => {
          setIsLiveConnected(true);
        });

        // Nouvelle vente détectée (connexion d'un voucher ou paiement validé)
        es.addEventListener('sale', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.sale) {
              setSales((prev) => {
                const filtered = prev.filter((s) => s.id !== data.sale.id && s.voucher !== data.sale.voucher);
                return [data.sale, ...filtered];
              });
            }
            if (data.totalRevenue !== undefined) {
              setTotalRevenue(data.totalRevenue);
            }
          } catch (err) {
            console.warn('[SSE sale parse error]:', err);
          }
        });

        // Synchronisation des ventes MikroTik complétée
        es.addEventListener('sales_sync', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.totalRevenue !== undefined) {
              setTotalRevenue(data.totalRevenue);
            }
          } catch {}
          // Rafraîchir silencieusement l'ensemble des données
          fetchAllData(false);
        });

        // Nouveaux vouchers créés
        es.addEventListener('vouchers_generated', () => {
          fetchAllData(false);
        });

        // Paiement FedaPay approuvé
        es.addEventListener('fedapay_approved', () => {
          fetchAllData(false);
        });

        // Session active déconnectée
        es.addEventListener('session_disconnected', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.id) {
              setActiveSessions((prev) => prev.filter((s: any) => s['.id'] !== data.id && s.id !== data.id));
            }
          } catch {}
        });

        es.onerror = () => {
          setIsLiveConnected(false);
          if (es && es.readyState === EventSource.CLOSED) {
            es.close();
            reconnectTimer = setTimeout(initSSE, 5000);
          }
        };
      } catch (err) {
        console.warn('[SSE connection exception]:', err);
        setIsLiveConnected(false);
      }
    };

    initSSE();

    // Fallback de sécurité : synchronisation automatique toutes les 30s
    const interval = setInterval(fetchAllData, 30000);

    return () => {
      clearInterval(interval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (es) {
        es.close();
      }
      setIsLiveConnected(false);
    };
  }, [authToken]);

  // Gatekeeper: If not logged in, show Landing Page by default, with access to Admin Login!
  if (!authToken) {
    if (showAdminLogin) {
      return (
        <AdminLogin
          onLoginSuccess={(token, username, rememberMe) => {
            handleLoginSuccess(token, username, rememberMe);
            setShowAdminLogin(false);
          }}
          onBack={() => {
            setShowAdminLogin(false);
            if (window.location.hash === '#admin' || window.location.hash === '#login') {
              window.history.pushState(null, '', window.location.pathname);
            }
          }}
        />
      );
    }
    return (
      <LandingPage
        onOpenLogin={() => {
          setShowAdminLogin(true);
          window.location.hash = '#admin';
        }}
      />
    );
  }

  // If authenticated but previewing landing page:
  if (showLandingPreview) {
    return (
      <div className="relative">
        <div className="sticky top-0 z-50 bg-indigo-950/95 border-b border-indigo-500/30 px-4 py-2.5 flex items-center justify-between backdrop-blur-md text-xs text-indigo-200 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Mode Aperçu Vitrine (Connecté en tant que <strong className="text-white">{adminUser || 'Admin'}</strong>)</span>
          </div>
          <button
            onClick={() => setShowLandingPreview(false)}
            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm transition-colors cursor-pointer"
          >
            ← Revenir au Dashboard MikroTik
          </button>
        </div>
        <LandingPage onOpenLogin={() => setShowLandingPreview(false)} />
      </div>
    );
  }

  const handleManualRefresh = () => {
    fetchAllData(true, 'Synchronisation et rafraîchissement des données MikroTik...');
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Sleek Non-Intrusive Top Progress Bar (remplace l'ancien modal bloquant) */}
      {loading && (
        <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-slate-900/60 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 animate-pulse w-full"></div>
        </div>
      )}

      {/* Demo Mode Notice Banner for Prospects */}
      {adminUser === 'demo' && (
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-indigo-950/90 border-b border-amber-500/30 px-3 sm:px-6 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2 shadow-lg sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 text-[10px] tracking-wide uppercase">
              Mode Démo Invité
            </span>
            <span className="text-slate-300 text-[11px] sm:text-xs">
              Vous testez les fonctionnalités 2MC SpotCloud en lecture & simulation sécurisée. Aucune modification n'altère le routeur de production.
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold text-[11px] transition-colors cursor-pointer shrink-0"
          >
            Quitter la Démo
          </button>
        </div>
      )}

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
        onViewLanding={() => setShowLandingPreview(true)}
        isLiveConnected={isLiveConnected}
        isRefreshing={loading}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 pb-24 lg:p-8 lg:pb-8">
        <ErrorBoundary key={activeTab}>
          {activeTab === 'dashboard' && (
            <DashboardOverview
              routerStatus={routerStatus}
              users={users}
              activeSessions={activeSessions}
              sales={sales}
              totalRevenue={totalRevenue}
              onNavigate={(tab) => {
                setActiveTab(tab);
                fetchAllData(false);
              }}
              onRefresh={handleManualRefresh}
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
            <SalesHistory sales={sales} totalRevenue={totalRevenue} token={sessionStorage.getItem('mikhmon_token') || ''} onRefresh={handleManualRefresh} />
          )}

          {activeTab === 'settings' && (
            <RouterSettings onRefresh={handleManualRefresh} />
          )}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500 pb-20 lg:pb-4">
        <p>© 2026 2MC COMPANY ETS. Tous droits réservés. | 2MC SpotCloud 2.0 RouterOS v7.23.2 & FedaPay Gateway</p>
      </footer>
    </div>
  );
}

export default App;
