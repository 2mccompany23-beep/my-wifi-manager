import React from 'react';
import { Zap, PowerOff, RefreshCw, Smartphone } from 'lucide-react';
import { ActiveSession } from '../types';

interface ActiveSessionsProps {
  sessions: ActiveSession[];
  onRefresh: () => void;
}

export const ActiveSessions: React.FC<ActiveSessionsProps> = ({ sessions, onRefresh }) => {
  
  const handleDisconnect = async (id: string, user: string) => {
    if (!confirm(`Voulez-vous déconnecter immédiatement la session de "${user}" ?`)) return;
    try {
      await fetch(`/api/router/active/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('mikhmon_token')}`
        }
      });
      onRefresh();
    } catch (err) {
      alert('Erreur lors de la déconnexion');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-4 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">Sessions Hotspot Actives</h3>
            <p className="text-xs text-slate-400">
              {sessions.length} appareils actuellement connectés au MikroTik
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors border border-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Actualiser Les Sessions</span>
        </button>
      </div>

      {/* Mobile Card View (< 768px) */}
      <div className="block md:hidden space-y-2.5">
        {sessions.length === 0 ? (
          <div className="glass-panel p-8 text-center text-slate-500 text-xs rounded-2xl">
            Aucun utilisateur connecté en ce moment sur le Hotspot.
          </div>
        ) : (
          sessions.map((s) => (
            <div key={s['.id']} className="glass-card p-3.5 rounded-2xl border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono font-bold text-sm text-emerald-400 truncate">
                  <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{s.user}</span>
                </div>
                <button
                  onClick={() => handleDisconnect(s['.id'], s.user)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 font-semibold text-xs border border-rose-500/20 shrink-0"
                >
                  <PowerOff className="w-3 h-3" />
                  <span>Kicker</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800/60 pt-2">
                <div>
                  <div className="text-[10px] text-slate-500">Adresse IP</div>
                  <div className="font-mono text-slate-300 truncate">{s.address}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Adresse MAC</div>
                  <div className="font-mono text-slate-400 truncate">{s.macAddress || s.mac || 'N/A'}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs border-t border-slate-800/60 pt-2">
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>{s.uptime}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  ↓ {s.bytesOut || '0 MB'} • ↑ {s.bytesIn || '0 MB'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (>= 768px) */}
      <div className="hidden md:block glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Utilisateur / Voucher</th>
                <th className="p-4">Adresse IP</th>
                <th className="p-4">Adresse MAC</th>
                <th className="p-4">Durée Connectée</th>
                <th className="p-4">Volume Reçu/Envoyé</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Aucun utilisateur n'est connecté en ce moment sur le Hotspot.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s['.id']} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-emerald-400 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-slate-400" />
                      <span>{s.user}</span>
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      {s.address}
                    </td>
                    <td className="p-4 font-mono text-slate-400">
                      {s.macAddress || s.mac || 'N/A'}
                    </td>
                    <td className="p-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>{s.uptime}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">
                      <div>Down: {s.bytesOut || '0 MB'}</div>
                      <div className="text-[10px] text-slate-500">Up: {s.bytesIn || '0 MB'}</div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDisconnect(s['.id'], s.user)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold transition-colors border border-rose-500/20 ml-auto"
                        title="Force Disconnect"
                      >
                        <PowerOff className="w-3.5 h-3.5" />
                        <span>Kicker</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
