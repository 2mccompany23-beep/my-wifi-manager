import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign, Search, Download, Smartphone, TrendingUp,
  Calendar, Filter, BarChart2, ChevronDown, ChevronUp,
  Cpu, RefreshCw, Database, Zap, CheckCircle2, AlertCircle,
  Package, Tag, Wallet, Ticket, CalendarDays, RotateCcw, Clock, Sparkles
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { SaleTransaction, HotspotUser } from '../types';

interface RouterScriptTx {
  id: string;
  source: string;
  date: string;
  username: string;
  amount: number;
  ip: string;
  mac: string;
  duration: string;
  profile: string;
  comment: string;
  plan: string;
}

interface SalesHistoryProps {
  sales: SaleTransaction[];
  totalRevenue: number;
  token?: string;
  onRefresh?: () => void;
}

export type PeriodFilterType =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | '7d'
  | '30d'
  | 'custom'
  | 'all';

const PLAN_COLORS: Record<string, string> = {
  '4h': '#6366f1', '12h': '#8b5cf6', '24h': '#06b6d4',
  '4j': '#10b981', '7j': '#f59e0b', '30j': '#f43f5e',
};
const getPlanColor = (plan: string) => {
  for (const [k, v] of Object.entries(PLAN_COLORS)) {
    if (plan.includes(k)) return v;
  }
  return '#64748b';
};

const getPlanPrice = (profileStr: string = '') => {
  const p = profileStr.toLowerCase();
  if (p.includes('4000') || p.includes('30j')) return 4000;
  if (p.includes('1200') || p.includes('7j')) return 1200;
  if (p.includes('500') || p.includes('4j')) return 500;
  if (p.includes('300') || p.includes('24h')) return 300;
  if (p.includes('200') || p.includes('12h')) return 200;
  if (p.includes('100') || p.includes('4h')) return 100;
  return 100;
};

// Obtenir les dates [start, end] précises pour un mode de période donné
const getPeriodRange = (mode: PeriodFilterType, customStart?: string, customEnd?: string): { start: Date; end: Date; label: string } | null => {
  const now = new Date();

  if (mode === 'all') return null;

  if (mode === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end, label: `Aujourd'hui (${start.toLocaleDateString('fr-FR')})` };
  }

  if (mode === 'yesterday') {
    const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
    const end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
    return { start, end, label: `Hier (${start.toLocaleDateString('fr-FR')})` };
  }

  if (mode === 'this_week') {
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, 0, 0, 0, 0);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);
    return { start: monday, end: sunday, label: `Cette semaine (du ${monday.toLocaleDateString('fr-FR')} au ${sunday.toLocaleDateString('fr-FR')})` };
  }

  if (mode === 'last_week') {
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1) - day - 7;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, 0, 0, 0, 0);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);
    return { start: monday, end: sunday, label: `Semaine passée (du ${monday.toLocaleDateString('fr-FR')} au ${sunday.toLocaleDateString('fr-FR')})` };
  }

  if (mode === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end, label: `Ce mois-ci (${start.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })})` };
  }

  if (mode === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { start, end, label: `Mois dernier (${start.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })})` };
  }

  if (mode === '7d') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end, label: `7 derniers jours (du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')})` };
  }

  if (mode === '30d') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end, label: `30 derniers jours (du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')})` };
  }

  if (mode === 'custom' && customStart) {
    const [sY, sM, sD] = customStart.split('-').map(Number);
    const start = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
    let end: Date;
    if (customEnd) {
      const [eY, eM, eD] = customEnd.split('-').map(Number);
      end = new Date(eY, eM - 1, eD, 23, 59, 59, 999);
    } else {
      end = new Date(sY, sM - 1, sD, 23, 59, 59, 999);
    }
    const realStart = start.getTime() <= end.getTime() ? start : end;
    const realEnd = start.getTime() <= end.getTime() ? end : start;
    return { start: realStart, end: realEnd, label: `Du ${realStart.toLocaleDateString('fr-FR')} au ${realEnd.toLocaleDateString('fr-FR')}` };
  }

  return null;
};

export const SalesHistory: React.FC<SalesHistoryProps> = ({ sales, totalRevenue, token, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterType>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  // Router script state
  const [routerTxs, setRouterTxs] = useState<RouterScriptTx[]>([]);
  const [routerRevenue, setRouterRevenue] = useState(0);
  const [routerTotal, setRouterTotal] = useState(0);
  const [unsoldVouchers, setUnsoldVouchers] = useState<HotspotUser[]>([]);
  const [loadingScripts, setLoadingScripts] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Default source: 'router' = 320+ scripts from MikroTik, 'fedapay' = db.json sales
  const [activeSource, setActiveSource] = useState<'router' | 'fedapay'>('router');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || sessionStorage.getItem('mikhmon_token')}`
  };

  const loadRouterScripts = async (force = false) => {
    if (force) setSyncing(true);
    else setLoadingScripts(true);

    try {
      const endpoint = force ? '/api/router/mikhmon-scripts?force=true' : '/api/router/mikhmon-scripts';
      const [scriptsRes, salesRes, usersRes] = await Promise.all([
        fetch(endpoint, { headers: authHeaders }),
        fetch('/api/sales' + (force ? '?force=true' : ''), { headers: authHeaders }),
        fetch('/api/router/users' + (force ? '?force=true' : ''), { headers: authHeaders })
      ]);

      let scriptTxs: RouterScriptTx[] = [];
      let newCount = 0;
      if (scriptsRes.ok) {
        const data = await scriptsRes.json();
        scriptTxs = data.transactions || [];
        newCount = data.newlyAddedCount || 0;
      }

      if (salesRes.ok) {
        const salesData = await salesRes.json();
        // Conserver uniquement les ventes non-script (ex: FedaPay)
        const localSales: any[] = (salesData.sales || []).filter((s: any) =>
          s.source === 'fedapay' || (s.mode && String(s.mode).toLowerCase().includes('fedapay'))
        );
        const scriptUsernames = new Set(scriptTxs.map(t => t.username.toLowerCase()));

        for (const s of localSales) {
          const voucherKey = (s.voucher || '').toLowerCase();
          const refKey = (s.reference || '').toLowerCase();
          if (voucherKey && !scriptUsernames.has(voucherKey) && !scriptUsernames.has(refKey)) {
            scriptTxs.push({
              id: s.id || `local_${s.reference}`,
              source: 'local_db',
              date: s.date,
              username: s.voucher || s.reference || '',
              amount: s.amount || 0,
              ip: s.phone || '',
              mac: s.mode || '',
              duration: s.plan || '',
              profile: s.profile || s.plan || '',
              comment: s.reference || '',
              plan: s.plan || s.profile || ''
            });
          }
        }
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (Array.isArray(usersData)) {
          const unsold = usersData.filter((u: any) => {
            if (u.name === 'default-trial' || u.default === 'true') return false;
            const uptimeStr = String(u.uptime || '0s');
            const isZeroUptime = uptimeStr === '0s' || uptimeStr === '0' || uptimeStr === '';
            const bIn = parseInt(String(u.bytesIn || u['bytes-in'] || '0')) || 0;
            const bOut = parseInt(String(u.bytesOut || u['bytes-out'] || '0')) || 0;
            return isZeroUptime && bIn === 0 && bOut === 0;
          });
          setUnsoldVouchers(unsold);
        }
      }

      scriptTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const totalRev = scriptTxs.reduce((sum, t) => sum + t.amount, 0);

      setRouterTxs(scriptTxs);
      setRouterRevenue(totalRev);
      setRouterTotal(scriptTxs.length);

      if (force) {
        setSyncStatus({
          message: `Synchronisation réussie ! Cache remplacé par les ${scriptTxs.length} transaction(s) réelles actuellement sur le routeur.`,
          type: 'success'
        });
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      console.warn('Failed to load router scripts:', e);
      if (force) {
        setSyncStatus({ message: 'Erreur lors de la connexion au routeur MikroTik.', type: 'error' });
      }
    }
    setLoadingScripts(false);
    setSyncing(false);

    if (force) {
      setTimeout(() => setSyncStatus(null), 6000);
    }
  };

  useEffect(() => { loadRouterScripts(); }, []);

  const currentPeriodRange = useMemo(() => {
    return getPeriodRange(periodFilter, customStartDate, customEndDate);
  }, [periodFilter, customStartDate, customEndDate]);

  const applyPeriod = <T extends { date: string }>(arr: T[]): T[] => {
    if (!currentPeriodRange) return arr;
    const { start, end } = currentPeriodRange;
    const startTime = start.getTime();
    const endTime = end.getTime();

    return arr.filter(s => {
      if (!s.date) return false;
      const d = new Date(s.date);
      const time = d.getTime();
      if (isNaN(time)) return false;
      return time >= startTime && time <= endTime;
    });
  };

  const fedapaySales = useMemo(() => {
    return sales.filter(s => {
      if (s.source === 'fedapay') return true;
      const idStr = String(s.id || '');
      const modeStr = String(s.mode || '').toLowerCase();
      const commentStr = String((s as any).comment || '').toLowerCase();
      return idStr.startsWith('tx_') || modeStr.includes('fedapay') || modeStr.includes('mobile money') || commentStr.includes('fedapay');
    });
  }, [sales]);

  const fedapayRevenue = useMemo(() => {
    return fedapaySales.reduce((sum, s) => sum + (s.amount || 0), 0);
  }, [fedapaySales]);

  const allTxs = useMemo(() => {
    if (activeSource === 'router') {
      return applyPeriod(routerTxs).map(t => ({
        id: t.id,
        date: t.date,
        reference: t.username,
        amount: t.amount,
        plan: t.plan || t.profile,
        profile: t.profile,
        voucher: t.username,
        mode: t.ip,
        phone: t.mac,
        comment: t.comment,
        source: t.source,
        status: 'SUCCESS' as const
      }));
    }
    return applyPeriod(fedapaySales).map(s => ({
      ...s,
      comment: s.comment || 'Paiement FedaPay',
      source: 'fedapay'
    }));
  }, [activeSource, routerTxs, fedapaySales, currentPeriodRange]);

  const filteredTxs = useMemo(() => {
    return allTxs.filter(s => {
      const matchSearch =
        (s.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.voucher || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.plan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.phone || '').includes(searchTerm);
      const matchPlan = planFilter === 'all' || (s.plan || '').includes(planFilter) || (s.profile || '') === planFilter;
      return matchSearch && matchPlan;
    }).slice().sort((a, b) => {
      const mult = sortDir === 'desc' ? -1 : 1;
      if (sortBy === 'amount') return mult * (a.amount - b.amount);
      return mult * (new Date(a.date).getTime() - new Date(b.date).getTime());
    });
  }, [allTxs, searchTerm, planFilter, sortBy, sortDir]);

  const filteredRevenue = filteredTxs.reduce((s, t) => s + t.amount, 0);
  const avgTicket = filteredTxs.length > 0 ? filteredRevenue / filteredTxs.length : 0;

  const monthlyData = useMemo(() => {
    const src = activeSource === 'router' ? routerTxs : fedapaySales;
    const map: Record<string, { label: string; revenue: number; count: number; plans: Record<string, number> }> = {};
    src.forEach(s => {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
      if (!map[key]) map[key] = { label, revenue: 0, count: 0, plans: {} };
      map[key].revenue += s.amount;
      map[key].count += 1;
      const pk = (s as any).plan || (s as any).profile || 'Autre';
      map[key].plans[pk] = (map[key].plans[pk] || 0) + 1;
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a)).map(([key, val]) => ({ key, ...val }));
  }, [activeSource, routerTxs, fedapaySales]);

  const chartData = useMemo(() => {
    return monthlyData.slice(0, 6).reverse().map(m => ({
      name: m.label.slice(0, 3) + '\'' + m.label.slice(-2),
      revenue: m.revenue, transactions: m.count
    }));
  }, [monthlyData]);

  const planBreakdown = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    filteredTxs.forEach(s => {
      const k = s.plan || s.profile || 'Autre';
      if (!map[k]) map[k] = { count: 0, revenue: 0 };
      map[k].count++; map[k].revenue += s.amount;
    });
    return Object.entries(map).map(([plan, d]) => ({ plan, ...d })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredTxs]);

  const uniquePlans = Array.from(new Set(allTxs.map(s => s.plan || s.profile).filter(Boolean)));
  const availableMonths = Array.from(new Set(
    (activeSource === 'router' ? routerTxs : fedapaySales).map(s => {
      const d = new Date(s.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })
  )).sort((a, b) => b.localeCompare(a));

  const unsoldTotalValue = useMemo(() => {
    return unsoldVouchers.reduce((sum, u) => sum + getPlanPrice(u.profile || (u as any).plan || ''), 0);
  }, [unsoldVouchers]);

  const unsoldBreakdown = useMemo(() => {
    const map: Record<string, { count: number; unitPrice: number; total: number }> = {};
    unsoldVouchers.forEach(u => {
      const prof = u.profile || (u as any).plan || '100-F-4h';
      const price = getPlanPrice(prof);
      if (!map[prof]) map[prof] = { count: 0, unitPrice: price, total: 0 };
      map[prof].count += 1;
      map[prof].total += price;
    });
    return Object.entries(map).map(([profile, d]) => ({ profile, ...d })).sort((a, b) => b.total - a.total);
  }, [unsoldVouchers]);

  const exportCSV = () => {
    const headers = ['Date & Heure', 'Code Voucher / Référence', 'Montant FCFA', 'Forfait', 'Profil', 'IP / Voucher', 'MAC / Téléphone', 'Commentaire'];
    const rows = filteredTxs.map(s => [
      new Date(s.date).toLocaleString('fr-FR'),
      s.reference, s.amount, s.plan, s.profile || '',
      s.voucher, s.phone || '', (s as any).comment || ''
    ]);
    const csv = 'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    const periodSlug = currentPeriodRange
      ? `${currentPeriodRange.start.toISOString().slice(0, 10)}_au_${currentPeriodRange.end.toISOString().slice(0, 10)}`
      : 'tout_historique';
    link.download = `ventes_2MC_${periodSlug}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const toggleSort = (col: 'date' | 'amount') => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const displayRevenue = activeSource === 'router' ? routerRevenue : fedapayRevenue;

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Source Toggle & Router Sync Action Bar */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-white">Source des données financières</span>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center justify-end">
          <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveSource('router');
                loadRouterScripts(true);
              }}
              disabled={syncing || loadingScripts}
              title="Synchroniser et afficher les ventes en direct du routeur MikroTik"
              className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeSource === 'router'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400/50 shadow-md shadow-indigo-600/25'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing || loadingScripts ? 'animate-spin' : ''}`} />
              <span className="truncate">{syncing ? 'Synchronisation...' : `Ventes MikroTik (${routerTotal})`}</span>
            </button>

            <button
              onClick={() => setActiveSource('fedapay')}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeSource === 'fedapay'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">FedaPay ({fedapaySales.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Status Toast/Banner */}
      {syncStatus && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-medium border animate-in fade-in slide-in-from-top-2 duration-200 ${
          syncStatus.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {syncStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-semibold">{syncStatus.message}</span>
          </div>
          <button onClick={() => setSyncStatus(null)} className="text-slate-400 hover:text-white ml-2 text-sm font-bold">✕</button>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          {
            label: currentPeriodRange ? 'Recettes Période' : 'Recettes Totales',
            value: `${filteredRevenue.toLocaleString('fr-FR')} F`,
            subtitle: currentPeriodRange ? currentPeriodRange.label : 'Tout l\'historique',
            icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />,
            highlight: true
          },
          {
            label: 'Ventes Période',
            value: `${filteredTxs.length} ticket(s)`,
            subtitle: `${filteredRevenue > 0 && filteredTxs.length > 0 ? Math.round(avgTicket).toLocaleString('fr-FR') + ' F / ticket' : '0 ticket'}`,
            icon: <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />,
            highlight: false
          },
          {
            label: 'Total Vendu (Historique)',
            value: `${displayRevenue.toLocaleString('fr-FR')} F`,
            subtitle: `${activeSource === 'router' ? 'Routeur + Local' : 'Paiements FedaPay'}`,
            icon: <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />,
            highlight: false
          },
          {
            label: 'Tickets Invendus (Stock)',
            value: `${unsoldTotalValue.toLocaleString('fr-FR')} F`,
            subtitle: `${unsoldVouchers.length} tickets en stock`,
            icon: <Package className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />,
            highlight: false
          },
          {
            label: 'Ticket Moyen Période',
            value: `${Math.round(avgTicket).toLocaleString('fr-FR')} F`,
            subtitle: 'Moyenne par client',
            icon: <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />,
            highlight: false
          },
        ].map((kpi, i) => (
          <div
            key={i}
            className={`glass-card p-3 sm:p-4 rounded-2xl border flex items-center gap-2.5 sm:gap-3 transition-all ${
              kpi.highlight
                ? 'border-emerald-500/40 bg-emerald-950/10 shadow-lg shadow-emerald-500/5'
                : 'border-slate-700/50'
            }`}
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border shrink-0 ${
              kpi.highlight
                ? 'bg-emerald-500/20 border-emerald-500/30'
                : 'bg-slate-800/80 border-slate-700'
            }`}>
              {kpi.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">{kpi.label}</p>
              <p className="text-xs sm:text-sm lg:text-base font-black text-white truncate">{kpi.value}</p>
              {kpi.subtitle && (
                <p className="text-[9px] sm:text-[10px] text-slate-500 truncate mt-0.5">{kpi.subtitle}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Section Rubrique : Tickets Invendus en Stock */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-slate-900/90 to-slate-950 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                <span>Valeur Financière des Tickets Invendus en Stock</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  {unsoldVouchers.length} ticket(s) en stock
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Total estimé du capital immobilisé en tickets imprimés/générés mais non encore activés par les clients.
              </p>
            </div>
          </div>

          <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-right shrink-0">
            <span className="text-[10px] uppercase font-semibold text-amber-400 block tracking-wider">Montant Stock Invendu</span>
            <span className="text-base sm:text-lg font-black text-amber-300">{unsoldTotalValue.toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>

        {unsoldBreakdown.length === 0 ? (
          <div className="p-3 text-center text-slate-400 text-xs">
            Aucun ticket invendu actuellement disponible en stock sur le routeur.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {unsoldBreakdown.map((item) => (
              <div key={item.profile} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-white truncate">
                    <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{item.profile}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {item.count} ticket(s) × {item.unitPrice.toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="text-xs sm:text-sm font-black text-amber-400">{item.total.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800">
          <h3 className="text-xs sm:text-sm font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            Revenus mensuels — {activeSource === 'router' ? 'Scripts Mikhmon' : 'FedaPay'}
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px' }}
                formatter={(v: number) => [`${v.toLocaleString('fr-FR')} FCFA`, 'Revenu']} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i === chartData.length - 1 ? '#6366f1' : '#334155'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly Accordion */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-800">
          <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            Bilan Mensuel
          </h3>
        </div>
        <div className="divide-y divide-slate-800/60">
          {monthlyData.length === 0
            ? (
              <div className="p-6 text-center text-slate-500 text-xs sm:text-sm">
                {activeSource === 'router'
                  ? 'Aucune donnée trouvée dans System › Scripts du MikroTik.'
                  : 'Aucune vente FedaPay enregistrée.'}
              </div>
            )
            : monthlyData.map(m => (
              <div key={m.key}>
                <button onClick={() => setExpandedMonth(expandedMonth === m.key ? null : m.key)}
                  className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-slate-800/40 transition-colors text-left">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xs sm:text-sm font-bold text-white capitalize">{m.label}</span>
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{m.count} connexions</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <span className="text-xs sm:text-sm font-black text-emerald-400">{m.revenue.toLocaleString('fr-FR')} FCFA</span>
                    {expandedMonth === m.key ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </button>
                {expandedMonth === m.key && (
                  <div className="px-4 sm:px-6 pb-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(m.plans).map(([plan, count]) => (
                      <div key={plan} className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getPlanColor(plan) }} />
                          <span className="text-[11px] font-semibold text-slate-300 truncate">{plan}</span>
                        </div>
                        <span className="text-[11px] font-bold text-white ml-1">{count}×</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-3.5">
        {/* Preset Périodes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              <span>Filtrer par Période de Vente :</span>
            </div>
            {currentPeriodRange && (
              <button
                onClick={() => setPeriodFilter('all')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Voir tout l'historique</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
            {[
              { key: 'today' as const, label: "Aujourd'hui" },
              { key: 'yesterday' as const, label: "Hier" },
              { key: 'this_week' as const, label: "Cette semaine" },
              { key: 'last_week' as const, label: "Semaine passée" },
              { key: 'this_month' as const, label: "Ce mois-ci" },
              { key: 'last_month' as const, label: "Mois dernier" },
              { key: '7d' as const, label: "7j" },
              { key: '30d' as const, label: "30j" },
              { key: 'custom' as const, label: "🎯 Du ... Au ..." },
              { key: 'all' as const, label: "🌐 Tout" }
            ].map(p => (
              <button
                key={p.key}
                onClick={() => setPeriodFilter(p.key)}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  periodFilter === p.key
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sélecteur de Plage Personnalisée */}
        {periodFilter === 'custom' && (
          <div className="p-3 sm:p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2.5 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs font-bold text-white">Sélectionner une plage de dates précise</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().slice(0, 10);
                    setCustomStartDate(today);
                    setCustomEndDate(today);
                  }}
                  className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  Aujourd'hui
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                    const y = d.toISOString().slice(0, 10);
                    setCustomStartDate(y);
                    setCustomEndDate(y);
                  }}
                  className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  Hier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
                    const end = new Date().toISOString().slice(0, 10);
                    setCustomStartDate(start);
                    setCustomEndDate(end);
                  }}
                  className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  Mois en cours
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 text-xs">
              <div className="flex items-center gap-2">
                <label className="text-slate-400 font-bold text-[11px]">Du :</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-slate-400 font-bold text-[11px]">Au :</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="text-[11px] text-indigo-300 font-semibold flex items-center gap-1 sm:ml-auto">
                <span>Ventes trouvées :</span>
                <span className="font-bold text-white bg-indigo-600/40 px-2 py-0.5 rounded-md border border-indigo-500/30">
                  {filteredTxs.length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bandeau Récapitulatif de la Période Active */}
        {currentPeriodRange && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-indigo-950/30 border border-emerald-500/30 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-xs sm:text-sm">{currentPeriodRange.label}</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/30">
                    {filteredRevenue.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {filteredTxs.length} ticket(s) vendu(s) • Ticket moyen: {Math.round(avgTicket).toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            </div>

            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-2">
              <span className="text-emerald-400">● Période active</span>
            </div>
          </div>
        )}

        {/* Filtre Forfaits */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
          <span className="text-xs font-semibold text-slate-400 mr-1">Forfait :</span>
          <button onClick={() => setPlanFilter('all')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all ${planFilter === 'all' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}>Tous</button>
          {uniquePlans.map(p => (
            <button key={p} onClick={() => setPlanFilter(p)}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all ${planFilter === p ? 'text-white' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
              style={planFilter === p ? { backgroundColor: getPlanColor(p), borderColor: getPlanColor(p) } : {}}>{p}</button>
          ))}
        </div>

        {/* Recherche & Export CSV */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Rechercher code voucher, référence, IP, MAC, forfait..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs text-slate-400 whitespace-nowrap font-medium">
              {filteredTxs.length} vente(s) ({filteredRevenue.toLocaleString('fr-FR')} F)
            </span>
            <button onClick={exportCSV} disabled={filteredTxs.length === 0}
              title="Télécharger l'export CSV des ventes de la période sélectionnée"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-md shadow-emerald-600/20">
              <Download className="w-3.5 h-3.5" /><span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Plan Breakdown Pill Cards */}
      {planBreakdown.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {planBreakdown.map(p => (
            <div key={p.plan} className="glass-card p-2.5 sm:p-3 rounded-xl border border-slate-700/50 flex flex-col gap-1"
              style={{ borderLeftColor: getPlanColor(p.plan), borderLeftWidth: 3 }}>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase truncate">{p.plan}</span>
              <span className="text-sm sm:text-base font-black text-white">{p.count}×</span>
              <span className="text-xs font-semibold" style={{ color: getPlanColor(p.plan) }}>{p.revenue.toLocaleString('fr-FR')} F</span>
            </div>
          ))}
        </div>
      )}

      {/* Mobile Card List (Visible on phones < 768px) */}
      <div className="block md:hidden space-y-2.5">
        {filteredTxs.length === 0 ? (
          <div className="glass-panel p-8 text-center text-slate-400 rounded-2xl">
            <Cpu className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="font-bold text-xs text-white">Aucune donnée trouvée</p>
          </div>
        ) : (
          filteredTxs.map(s => (
            <div key={s.id} className="glass-card p-3.5 rounded-2xl border border-slate-800 flex flex-col gap-2 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-bold text-sm text-white truncate">{s.reference}</span>
                  {(s as any).source === 'local_db' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold shrink-0">LOCAL</span>
                  )}
                </div>
                <span className="text-sm font-black text-emerald-400 shrink-0">{s.amount.toLocaleString('fr-FR')} F</span>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs gap-1 border-t border-slate-800/60 pt-2">
                <span className="px-2 py-0.5 rounded-md font-semibold border text-[10px]"
                  style={{ backgroundColor: getPlanColor(s.plan) + '20', color: getPlanColor(s.plan), borderColor: getPlanColor(s.plan) + '40' }}>
                  {s.plan}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{s.voucher}</span>
                <span className="text-[10px] text-slate-500">{new Date(s.date).toLocaleDateString('fr-FR')} {new Date(s.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table (Visible on screens >= 768px) */}
      <div className="hidden md:block glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Utilisateur / Référence</th>
                <th className="p-4 cursor-pointer hover:text-indigo-400" onClick={() => toggleSort('amount')}>
                  <span className="flex items-center gap-1">Montant {sortBy === 'amount' ? (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />) : null}</span>
                </th>
                <th className="p-4">Forfait</th>
                <th className="p-4">{activeSource === 'router' ? 'IP / Voucher' : 'Voucher'}</th>
                <th className="p-4">{activeSource === 'router' ? 'MAC / Mode' : 'Téléphone'}</th>
                <th className="p-4 cursor-pointer hover:text-indigo-400" onClick={() => toggleSort('date')}>
                  <span className="flex items-center gap-1">Date {sortBy === 'date' ? (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />) : null}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <Cpu className="w-10 h-10 text-slate-700" />
                      <div>
                        <p className="font-bold text-sm text-white">Aucune donnée</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredTxs.map(s => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-200">
                    {s.reference}
                    {(s as any).source === 'local_db' && (
                      <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">LOCAL</span>
                    )}
                  </td>
                  <td className="p-4 font-black text-emerald-400">{s.amount.toLocaleString('fr-FR')} FCFA</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-lg font-semibold border text-[11px]"
                      style={{ backgroundColor: getPlanColor(s.plan) + '20', color: getPlanColor(s.plan), borderColor: getPlanColor(s.plan) + '40' }}>
                      {s.plan}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-300 text-[10px]">{s.voucher || '—'}</td>
                  <td className="p-4 text-slate-300 text-[10px]">{s.phone || '—'}</td>
                  <td className="p-4 text-slate-400 whitespace-nowrap">{new Date(s.date).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
