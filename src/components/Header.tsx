import React from 'react';
import { Wifi, Router, Activity, ShieldCheck, RefreshCw, Zap, ExternalLink } from 'lucide-react';
import { RouterStatus } from '../types';

interface HeaderProps {
  routerStatus: RouterStatus | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRefresh: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ routerStatus, activeTab, setActiveTab, onRefresh, onLogout }) => {
  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 px-4 lg:px-8 py-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Brand & Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
            <Wifi className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Cloud Mikhmon <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">v2.0</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span>2MC WIFI ZONE</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-medium">mcwifi.net</span>
            </p>
          </div>
        </div>

        {/* Router Status Widget */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <Router className="w-4 h-4 text-indigo-400" />
            <div>
              <div className="text-slate-400 font-medium">Routeur</div>
              <div className="font-semibold text-slate-200">{routerStatus?.boardName || 'RB951Ui-2HnD'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <Activity className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-slate-400 font-medium">Version</div>
              <div className="font-semibold text-slate-200">{routerStatus?.online ? routerStatus.version : 'Hors Ligne'}</div>
            </div>
          </div>

          {routerStatus?.online ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>MikroTik Connecté</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Routeur Non Connecté</span>
            </div>
          )}

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <a
            href="/login.html"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:opacity-90 transition-opacity shadow-md shadow-purple-600/20"
          >
            <span>Portail Client</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/20 transition-colors text-xs"
              title="Déconnexion Administrateur"
            >
              Déconnexion
            </button>
          )}
        </div>

      </div>

      {/* Main Tab Navigation */}
      <nav className="flex space-x-1 mt-4 border-t border-slate-800/80 pt-3 overflow-x-auto">
        {[
          { id: 'dashboard', label: 'Tableau de Bord', icon: Activity },
          { id: 'users', label: 'Utilisateurs Hotspot', icon: Wifi },
          { id: 'active', label: 'Sessions Actives', icon: Zap },
          { id: 'vouchers', label: 'Générateur Tickets', icon: ShieldCheck },
          { id: 'sales', label: 'Ventes FedaPay', icon: Router },
          { id: 'settings', label: 'Paramètres Routeur', icon: RefreshCw }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
