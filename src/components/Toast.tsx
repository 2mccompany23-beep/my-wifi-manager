import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const styles = {
  success: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
  error:   'bg-rose-500/15 border-rose-500/40 text-rose-300',
  warning: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
  info:    'bg-indigo-500/15 border-indigo-500/40 text-indigo-300',
};

const iconColors = {
  success: 'text-emerald-400',
  error:   'text-rose-400',
  warning: 'text-amber-400',
  info:    'text-indigo-400',
};

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const Icon = icons[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 3500);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-xl text-sm font-medium animate-in slide-in-from-right-5 fade-in duration-300 ${styles[toast.type]}`}>
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColors[toast.type]}`} />
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} className="text-current opacity-50 hover:opacity-100 transition-opacity ml-1 shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ─── Toast Container (renders in top-right corner) ───────────────────────────
interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => (
  <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
    {toasts.map((t) => (
      <div key={t.id} className="pointer-events-auto">
        <ToastItem toast={t} onDismiss={onDismiss} />
      </div>
    ))}
  </div>
);

// ─── useToast hook ────────────────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    setToasts((prev) => [...prev.slice(-4), { id, type, message, duration }]);
  }, []);

  return {
    toasts,
    dismiss,
    success: (msg: string) => toast('success', msg),
    error:   (msg: string) => toast('error',   msg, 5000),
    warning: (msg: string) => toast('warning', msg),
    info:    (msg: string) => toast('info',    msg),
  };
}
