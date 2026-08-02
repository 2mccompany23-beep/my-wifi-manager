import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loadingLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-rose-500/20 border-rose-500/30 text-rose-400',
    btn: 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
    btn: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25',
  },
  info: {
    icon: AlertTriangle,
    iconBg: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400',
    btn: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25',
  },
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen, title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', loadingLabel = 'Suppression en cours...',
  variant = 'danger', isLoading = false, onConfirm, onCancel,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen || isLoading) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const cfg = variantConfig[variant];
  const Icon = cfg.icon;

  return (
    <div
      className="fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => { if (!isLoading && e.target === e.currentTarget) onCancel(); }}
    >
      <div className="glass-panel bg-slate-900/95 rounded-3xl border border-slate-700 shadow-2xl max-w-sm w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
            </div>
            <h3 className="text-base font-bold text-white leading-tight">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 mt-0.5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <p className="text-sm text-slate-300 leading-relaxed pl-1">{message}</p>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-4 rounded-xl text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-wait ${cfg.btn}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>{loadingLabel}</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

