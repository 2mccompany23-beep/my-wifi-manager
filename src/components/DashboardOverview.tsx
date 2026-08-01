import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Clock, DollarSign, Users, Zap, TrendingUp, RefreshCw, ShoppingCart, ArrowUpRight, ChevronRight, Banknote, WifiOff } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { RouterStatus, HotspotUser, ActiveSession, SaleTransaction } from '../types';

interface DashboardOverviewProps {
  routerStatus: RouterStatus | null;
  users: HotspotUser[];
  activeSessions: ActiveSession[];
  sales: SaleTransaction[];
  totalRevenue: number;
  onNavigate: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  routerStatus,
  users,
  activeSessions,
  sales,
  totalRevenue,
  onNavigate
}) => {
  const [trafficData, setTrafficData] = useState<{ time: string; rx: number; tx: number }[]>([]);

  useEffect(() => {
    // Zero initial traffic when offline, or real rates when online
    const isOnline = routerStatus?.online;
    const initial = Array.from({ length: 12 }).map((_, i) => ({
      time: `${i * 5}s`,
      rx: isOnline ? Number(routerStatus?.rxRate || 0) : 0,
      tx: isOnline ? Number(routerStatus?.txRate || 0) : 0
    }));
    setTrafficData(initial);

    if (!isOnline) return;

    const interval = setInterval(() => {
      setTrafficData((prev) => {
        const nextTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newPoint = {
          time: nextTime,
          rx: Number(routerStatus?.rxRate || 0),
          tx: Number(routerStatus?.txRate || 0)
        };
        return [...prev.slice(1), newPoint];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [routerStatus]);

  return (
    <div className="space-y-6">
      
      {/* Offline Alert */}
      {(!routerStatus || !routerStatus.online) && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
          <WifiOff className="w-4 h-4 shrink-0 text-amber-400" />
          <p className="text-xs font-medium flex-1">Routeur non connecté</p>
          <button
            onClick={() => onNavigate('settings')}
            className="flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-amber-200 whitespace-nowrap shrink-0"
          >
            Paramètres <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Revenue → sales */}
        <button
          onClick={() => onNavigate('sales')}
          className="glass-card p-5 rounded-2xl border border-indigo-500/20 relative overflow-hidden group text-left hover:border-indigo-500/40 transition-all hover:-translate-y-0.5"
        >
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Recettes</p>
              <h3 className="text-2xl font-black text-white mt-1">
                {totalRevenue.toLocaleString('fr-FR')} <span className="text-sm font-normal text-indigo-400">FCFA</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 transition-transform">
              <Banknote className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-semibold flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> FedaPay</span>
            <span className="text-indigo-400/60 flex items-center gap-0.5">Voir <ChevronRight className="w-3 h-3" /></span>
          </div>
        </button>

        {/* Users → users */}
        <button
          onClick={() => onNavigate('users')}
          className="glass-card p-5 rounded-2xl border border-purple-500/20 relative overflow-hidden group text-left hover:border-purple-500/40 transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Utilisateurs</p>
              <h3 className="text-2xl font-black text-white mt-1">{users.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-500">Hotspot MikroTik</span>
            <span className="text-purple-400/60 flex items-center gap-0.5">Voir <ChevronRight className="w-3 h-3" /></span>
          </div>
        </button>

        {/* Active sessions → active */}
        <button
          onClick={() => onNavigate('active')}
          className="glass-card p-5 rounded-2xl border border-emerald-500/20 relative overflow-hidden group text-left hover:border-emerald-500/40 transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Sessions</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">{activeSessions.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />En ligne</span>
            <span className="text-emerald-400/60 flex items-center gap-0.5">Voir <ChevronRight className="w-3 h-3" /></span>
          </div>
        </button>

        {/* Transactions → sales */}
        <button
          onClick={() => onNavigate('sales')}
          className="glass-card p-5 rounded-2xl border border-pink-500/20 relative overflow-hidden group text-left hover:border-pink-500/40 transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Transactions</p>
              <h3 className="text-2xl font-black text-white mt-1">{sales.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-500">FedaPay</span>
            <span className="text-pink-400/60 flex items-center gap-0.5">Voir <ChevronRight className="w-3 h-3" /></span>
          </div>
        </button>

      </div>

      {/* Traffic Graph & Router Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bandwidth Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Bande Passante (Mbps)</span>
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
              </h3>
              <p className="text-xs text-slate-500">ether1 / wlan1</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-indigo-400"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />RX</span>
              <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />TX</span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="M" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="rx" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRx)" name="RX Mbps" />
                <Area type="monotone" dataKey="tx" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorTx)" name="TX Mbps" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Router Resources */}
        <div className="glass-panel p-6 rounded-2xl space-y-5">
          <h3 className="text-sm font-bold text-white">Ressources Routeur</h3>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-indigo-400" />CPU</span>
              <span className="text-indigo-400">{routerStatus?.cpuLoad || 0}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${routerStatus?.cpuLoad || 0}%` }} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-emerald-400" />RAM</span>
              <span className="text-emerald-400">{routerStatus?.freeMemory || 0} / {routerStatus?.totalMemory || 128} MB</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.round(((routerStatus?.freeMemory || 0) / (routerStatus?.totalMemory || 128)) * 100)}%` }} />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Uptime</div>
              <div className="text-sm font-bold text-slate-200">{routerStatus?.uptime || '—'}</div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => onNavigate('vouchers')}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <span>Générer des Tickets</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('active')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700"
            >
              <span>Sessions Actives</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
