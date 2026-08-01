import React, { useState } from 'react';
import { Wifi, Router, Activity, ShieldCheck, RefreshCw, Zap, ExternalLink, DollarSign, Menu, X, LogOut } from 'lucide-react';
import { RouterStatus } from '../types';

interface HeaderProps {
  routerStatus: RouterStatus | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRefresh: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ routerStatus, activeTab, setActiveTab, onRefresh, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: Activity },
    { id: 'users', label: 'Utilisateurs Hotspot', icon: Wifi },
    { id: 'active', label: 'Sessions Actives', icon: Zap },
    { id: 'vouchers', label: 'Générateur Tickets', icon: ShieldCheck },
    { id: 'sales', label: '💰 Ventes & Finances', icon: DollarSign },
    { id: 'settings', label: 'Paramètres Routeur', icon: RefreshCw }
  ];

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 px-3 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-3">
        
        {/* Brand & Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold shrink-0">
            <Wifi className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Cloud Mikhmon <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold">v2.0</span>
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1">
              <span>2MC WIFI</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-medium">mcwifi.net</span>
            </p>
          </div>
        </div>

        {/* Desktop Router Status Widget */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <Router className="w-4 h-4 text-indigo-400" />
            <div>
              <div className="text-slate-400 font-medium text-[10px]">Routeur</div>
              <div className="font-semibold text-slate-200">{routerStatus?.boardName || 'RB951Ui-2HnD'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <Activity className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-slate-400 font-medium text-[10px]">Version</div>
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
              <span>Non Connecté</span>
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

        {/* Mobile Header Actions */}
        <div className="flex items-center gap-2 lg:hidden">
          {/* Quick status dot */}
          <div className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 ${
            routerStatus?.online
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            <span className={`w-2 h-2 rounded-full ${routerStatus?.online ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
            <span className="hidden xs:inline">{routerStatus?.online ? 'Connecté' : 'Déconnecté'}</span>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-slate-800 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-slate-400 text-[10px]">Routeur</div>
              <div className="font-bold text-slate-200 truncate">{routerStatus?.boardName || 'RB951Ui'}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-slate-400 text-[10px]">Version</div>
              <div className="font-bold text-slate-200 truncate">{routerStatus?.version || 'N/A'}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <a
              href="/login.html"
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 text-white font-semibold text-xs text-center"
            >
              <span>Portail Client</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center justify-center gap-1 py-2 px-4 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/20 font-semibold text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Quitter</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Tab Navigation bar with smooth horizontal swipe on mobile */}
      <nav className="flex space-x-1.5 mt-3 border-t border-slate-800/80 pt-2.5 overflow-x-auto no-scrollbar scroll-smooth">
        {navItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all touch-target shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/50 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 bg-slate-900/40 border border-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
