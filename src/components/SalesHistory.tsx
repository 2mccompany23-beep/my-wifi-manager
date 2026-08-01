import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign, Search, Download, Smartphone, TrendingUp,
  Calendar, Filter, BarChart2, ChevronDown, ChevronUp,
  Cpu, RefreshCw, Database, Zap, CheckCircle2, AlertCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { SaleTransaction } from '../types';

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

export const SalesHistory: React.FC<SalesHistoryProps> = ({ sales, totalRevenue, token, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'all' | '7d' | '30d' | '90d' | 'month'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  });
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  // Router script state
  const [routerTxs, setRouterTxs] = useState<RouterScriptTx[]>([]);
  const [routerRevenue, setRouterRevenue] = useState(0);
  const [routerTotal, setRouterTotal] = useState(0);
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
      const [scriptsRes, salesRes] = await Promise.all([
        fetch(endpoint, { headers: authHeaders }),
        fetch('/api/sales' + (force ? '?force=true' : ''), { headers: authHeaders })
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

  const applyPeriod = <T extends { date: string }>(arr: T[]): T[] => {
    const now = new Date();
    return arr.filter(s => {
      const d = new Date(s.date);
      if (periodFilter === '7d') return now.getTime() - d.getTime() <= 7 * 86400000;
      if (periodFilter === '30d') return now.getTime() - d.getTime() <= 30 * 86400000;
      if (periodFilter === '90d') return now.getTime() - d.getTime() <= 90 * 86400000;
      if (periodFilter === 'month') {
        const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return mk === selectedMonth;
      }
      return true;
    });
  };

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
    return applyPeriod(sales).map(s => ({ ...s, comment: '', source: 'fedapay' }));
  }, [activeSource, routerTxs, sales, periodFilter, selectedMonth]);

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
    const src = activeSource === 'router' ? routerTxs : sales;
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
  }, [activeSource, routerTxs, sales]);

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
    (activeSource === 'router' ? routerTxs : sales).map(s => {
      const d = new Date(s.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })
  )).sort((a, b) => b.localeCompare(a));

  const exportCSV = () => {
    const headers = ['Date', 'Utilisateur/Réf', 'Montant FCFA', 'Forfait', 'Profil', 'IP/Voucher', 'MAC/Téléphone', 'Commentaire'];
    const rows = filteredTxs.map(s => [
      new Date(s.date).toLocaleString('fr-FR'),
      s.reference, s.amount, s.plan, s.profile || '',
      s.voucher, s.phone || '', (s as any).comment || ''
    ]);
    const csv = 'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `finances_2MC_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const toggleSort = (col: 'date' | 'amount') => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const displayRevenue = activeSource === 'router' ? routerRevenue : totalRevenue;

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
          <div className="grid grid-cols-2 sm:flex gap-1.5 w-full sm:w-auto">
            <button onClick={() => setActiveSource('router')}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                activeSource === 'router'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}>
              <Cpu className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Scripts Mikhmon ({routerTotal})</span>
            </button>
            <button onClick={() => setActiveSource('fedapay')}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                activeSource === 'fedapay'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}>
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">FedaPay ({sales.length})</span>
            </button>
          </div>

          {/* Dedicated Router Sync Button */}
          <button
            onClick={() => loadRouterScripts(true)}
            disabled={syncing || loadingScripts}
            title="Synchroniser en direct les données du routeur MikroTik"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/25 border border-indigo-400/30 active:scale-95 disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing || loadingScripts ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Synchronisation...' : 'Synchroniser avec le routeur'}</span>
          </button>
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

      {/* Info banner */}
      <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-2xl bg-indigo-500/8 border border-indigo-500/20 text-xs text-indigo-300">
        <Database className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
        <span className="leading-relaxed">
          {activeSource === 'router'
            ? <>Les données <strong>Scripts Mikhmon</strong> sont lues en direct depuis <strong>System &gt; Scripts</strong> de votre MikroTik (données créées automatiquement à chaque connexion client).</>
            : <>Les données <strong>FedaPay</strong> proviennent des paiements enregistrés localement via le webhook FedaPay.</>
          }
        </span>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Revenu Total', value: `${displayRevenue.toLocaleString('fr-FR')} FCFA`, icon: <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />, color: 'emerald' },
          { label: 'Revenu Filtré', value: `${filteredRevenue.toLocaleString('fr-FR')} FCFA`, icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />, color: 'indigo' },
          { label: 'Connexions', value: filteredTxs.length, icon: <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />, color: 'purple' },
          { label: 'Ticket Moyen', value: `${Math.round(avgTicket).toLocaleString('fr-FR')} F`, icon: <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />, color: 'amber' },
        ].map((kpi, i) => (
          <div key={i} className="glass-card p-3 sm:p-4 rounded-2xl border border-slate-700/50 flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
              {kpi.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">{kpi.label}</p>
              <p className="text-sm sm:text-base font-black text-white truncate">{kpi.value}</p>
            </div>
          </div>
        ))}
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
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-400 mr-1">Période :</span>
          {[{ key: '7d', label: '7j' }, { key: '30d', label: '30j' }, { key: '90d', label: '90j' }, { key: 'all', label: 'Tout' }, { key: 'month', label: 'Mois' }].map(p => (
            <button key={p.key} onClick={() => setPeriodFilter(p.key as any)}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                periodFilter === p.key ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}>{p.label}</button>
          ))}
          {periodFilter === 'month' && (
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500">
              {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
        </div>

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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Utilisateur, IP, MAC, forfait..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs text-slate-400 whitespace-nowrap">{filteredTxs.length} résultat(s)</span>
            <button onClick={exportCSV} disabled={filteredTxs.length === 0}
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
