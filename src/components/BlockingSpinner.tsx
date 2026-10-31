import React from 'react';
import { Loader2, Server } from 'lucide-react';

interface BlockingSpinnerProps {
  isLoading: boolean;
  message?: string;
}

export const BlockingSpinner: React.FC<BlockingSpinnerProps> = ({ isLoading, message }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 pointer-events-auto select-none animate-in fade-in duration-150">
      <div className="glass-panel p-8 rounded-3xl border border-indigo-500/30 shadow-2xl max-w-sm w-full text-center space-y-5 bg-[#0f172a] relative overflow-hidden">
        
        <div className="relative flex items-center justify-center">
          {/* Outer Rotating Ring */}
          <div className="w-14 h-14 rounded-full border-3 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
          
          {/* Center Icon */}
          <div className="absolute inset-0 flex items-center justify-center text-indigo-400">
            <Server className="w-6 h-6 text-indigo-400" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-white tracking-tight">
            Chargement En Cours...
          </h3>
          <p className="text-xs text-slate-400">
            {message || 'Liaison avec le routeur MikroTik et synchronisation des données...'}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-medium">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          <span>Veuillez patienter sans fermer la page</span>
        </div>
      </div>
    </div>
  );
};
