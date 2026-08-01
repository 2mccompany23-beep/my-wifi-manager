import React from 'react';
import { Cpu, HardDrive, Clock, Users, Zap, TrendingUp, ShoppingCart, ArrowUpRight, ChevronRight, Banknote, WifiOff, KeyRound } from 'lucide-react';
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

      {/* Router Resources & Quick Actions Panel */}
      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <span>Ressources & État du Routeur</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              MikroTik RouterOS {routerStatus?.boardName || 'RB951Ui-2HnD'}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className={`w-2 h-2 rounded-full ${routerStatus?.online ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span className="font-semibold text-slate-200">{routerStatus?.online ? 'Connecté' : 'Hors ligne'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gauges Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Charge Processeur (CPU)</span>
                </span>
                <span className="text-indigo-400 font-bold">{routerStatus?.cpuLoad || 0}%</span>
              </div>
              <div className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${routerStatus?.cpuLoad || 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mémoire RAM Disponible</span>
                </span>
                <span className="text-emerald-400 font-bold">{routerStatus?.freeMemory || 0} / {routerStatus?.totalMemory || 128} MB</span>
              </div>
              <div className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(((routerStatus?.freeMemory || 0) / (routerStatus?.totalMemory || 128)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 border border-amber-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Temps de Fonctionnement (Uptime)</div>
                <div className="text-sm font-extrabold text-slate-200">{routerStatus?.uptime || '—'}</div>
              </div>
            </div>
          </div>

          {/* Quick Actions Column */}
          <div className="flex flex-col justify-between space-y-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/60">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Raccourcis de Gestion Rapide</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => onNavigate('vouchers')}
                className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-between shadow-lg shadow-indigo-600/20"
              >
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Générer Tickets</span>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-300" />
              </button>

              <button
                onClick={() => onNavigate('users')}
                className="py-3 px-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-semibold text-xs border border-purple-500/30 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-purple-400" />
                  <span>Comptes Clients</span>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-400" />
              </button>

              <button
                onClick={() => onNavigate('active')}
                className="py-3 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold text-xs border border-emerald-500/30 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Sessions Actives</span>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                onClick={() => onNavigate('sales')}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-between border border-slate-700"
              >
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-slate-400" />
                  <span>Bilan Financier</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
