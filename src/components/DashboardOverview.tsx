import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Clock, DollarSign, Users, Zap, TrendingUp, RefreshCw, ShoppingCart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
      
      {/* Offline Alert Banner */}
      {(!routerStatus || !routerStatus.online) && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Routeur MikroTik RB951Ui non connecté</h4>
              <p className="text-xs text-rose-300/80">
                Aucune donnée simulée n'est affichée. Saisissez l'adresse IP et le mot de passe Winbox dans l'onglet Paramètres pour établir la liaison en direct.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shrink-0 shadow-md shadow-rose-600/30"
          >
            Configurer IP & Pass Winbox
          </button>
        </div>
      )}
      
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue FCFA */}
        <div className="glass-card p-5 rounded-2xl border border-indigo-500/20 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Recettes Totales (FCFA)</p>
              <h3 className="text-2xl font-black text-white mt-1">
                {totalRevenue.toLocaleString('fr-FR')} <span className="text-sm font-normal text-indigo-400">FCFA</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Paiements FedaPay Mobile Money</span>
          </div>
        </div>

        {/* Total Hotspot Users */}
        <div className="glass-card p-5 rounded-2xl border border-purple-500/20 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Utilisateurs Enregistrés</p>
              <h3 className="text-2xl font-black text-white mt-1">{users.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            RB951Ui Hotspot DB
          </div>
        </div>

        {/* Active Sessions */}
        <div className="glass-card p-5 rounded-2xl border border-emerald-500/20 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Sessions Actives</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">{activeSessions.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 text-xs text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Connectés en ce moment</span>
          </div>
        </div>

        {/* Total Sales count */}
        <div className="glass-card p-5 rounded-2xl border border-pink-500/20 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Transactions Réussies</p>
              <h3 className="text-2xl font-black text-white mt-1">{sales.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            FedaPay Checkout API
          </div>
        </div>

      </div>

      {/* Main Section: Traffic Graph & Router Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bandwidth Chart (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Bande Passante en Temps Réel (Mbps)</span>
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
              </h3>
              <p className="text-xs text-slate-400">Trafic Ethernet & WiFi (ether1 / wlan1)</p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                <span>Téléchargement (RX)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span>Envoi (TX)</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
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

        {/* Router Hardware Gauges (1 col) */}
        <div className="glass-panel p-6 rounded-2xl space-y-5">
          <h3 className="text-base font-bold text-white">Ressources Routeur RB951Ui</h3>

          {/* CPU Gauge */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>Charge CPU</span>
              </span>
              <span className="text-indigo-400">{routerStatus?.cpuLoad || 18}%</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${routerStatus?.cpuLoad || 18}%` }}
              ></div>
            </div>
          </div>

          {/* RAM Gauge */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>Mémoire Libre</span>
              </span>
              <span className="text-emerald-400">{routerStatus?.freeMemory || 71} MB / {routerStatus?.totalMemory || 128} MB</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.round(((routerStatus?.freeMemory || 71) / (routerStatus?.totalMemory || 128)) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* System Uptime */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Uptime Système</div>
                <div className="text-sm font-bold text-slate-200">{routerStatus?.uptime || '4d 18h 22m'}</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-2 space-y-2">
            <button
              onClick={() => onNavigate('vouchers')}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <span>Générer un lot de Tickets</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('active')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700"
            >
              <span>Voir Sessions Actives</span>
              <ArrowDownRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
