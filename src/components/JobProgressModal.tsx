import React, { useEffect, useState, useRef } from 'react';
import { Trash2, RefreshCw, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface BackgroundJob {
  id: string;
  type: string;
  title: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  current: number;
  total: number;
  currentStep: string;
  error?: string | null;
  result?: any;
}

interface JobProgressModalProps {
  jobId: string | null;
  onComplete?: (job: BackgroundJob) => void;
  onClose?: () => void;
}

export const JobProgressModal: React.FC<JobProgressModalProps> = ({ jobId, onComplete, onClose }) => {
  const [job, setJob] = useState<BackgroundJob | null>(null);
  const [visible, setVisible] = useState(false);
  const pollIntervalRef = useRef<any>(null);
  const hasTriggeredCompleteRef = useRef(false);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('mikhmon_token') || ''}`
  });

  const checkJob = async (targetId: string | null) => {
    try {
      const url = targetId ? `/api/jobs/${targetId}` : '/api/jobs/active';
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) return;

      const data = await res.json();
      const currentJob: BackgroundJob | null = data.job || (data.active ? data.job : null);

      if (currentJob) {
        setJob(currentJob);
        setVisible(true);

        if (currentJob.status === 'completed') {
          if (!hasTriggeredCompleteRef.current) {
            hasTriggeredCompleteRef.current = true;
            try {
              confetti({
                particleCount: 40,
                spread: 60,
                origin: { y: 0.6 }
              });
            } catch (e) {}

            if (onComplete) onComplete(currentJob);
          }

          // Auto-fermeture après 2.5 secondes si complété
          setTimeout(() => {
            handleClose();
          }, 2500);
        } else if (currentJob.status === 'failed') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
      } else if (!targetId) {
        // Pas de job actif
        setVisible(false);
      }
    } catch (err) {
      console.warn('[JobProgress] Erreur vérification:', err);
    }
  };

  useEffect(() => {
    hasTriggeredCompleteRef.current = false;
    if (jobId) {
      checkJob(jobId);
      pollIntervalRef.current = setInterval(() => checkJob(jobId), 750);
    } else {
      // Vérifier au montage si un job est en cours
      checkJob(null);
      pollIntervalRef.current = setInterval(() => checkJob(null), 1500);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [jobId]);

  const handleClose = () => {
    setVisible(false);
    setJob(null);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (onClose) onClose();
  };

  if (!visible || !job) return null;

  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed';
  const isRunning = job.status === 'running';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-indigo-500/30 shadow-2xl max-w-md w-full bg-slate-900/95 relative overflow-hidden space-y-6">
        
        {/* Lueur d'arrière-plan animée */}
        <div className={`absolute -top-12 -left-12 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-colors duration-500 ${
          isCompleted ? 'bg-emerald-500/20' : isFailed ? 'bg-rose-500/20' : 'bg-indigo-500/25 animate-pulse'
        }`}></div>
        <div className={`absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-colors duration-500 ${
          isCompleted ? 'bg-teal-500/20' : isFailed ? 'bg-red-500/20' : 'bg-purple-500/25 animate-pulse'
        }`}></div>

        {/* Bouton fermeture si terminé ou échoué */}
        {(isCompleted || isFailed) && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Icône d'état */}
        <div className="flex items-center justify-center">
          {isRunning && (
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 border-r-purple-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-indigo-400">
                {job.type === 'batch_delete' ? (
                  <Trash2 className="w-6 h-6 animate-pulse text-indigo-400" />
                ) : (
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                )}
              </div>
            </div>
          )}

          {isCompleted && (
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-in zoom-in duration-300">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
          )}

          {isFailed && (
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-400 animate-in zoom-in duration-300">
              <AlertCircle className="w-8 h-8 text-rose-400" />
            </div>
          )}
        </div>

        {/* Titres & Étapes */}
        <div className="text-center space-y-1.5">
          <h3 className="text-lg font-bold text-white tracking-tight">
            {job.title}
          </h3>
          <p className="text-xs text-slate-400 min-h-[32px] flex items-center justify-center px-2">
            {job.error || job.currentStep || 'Traitement en cours...'}
          </p>
        </div>

        {/* Barre de progression avec pourcentage */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold px-0.5">
            <span className="text-slate-400">
              {job.type === 'batch_delete' && `${job.current} / ${job.total} utilisateurs`}
              {job.type === 'sync_sales' && 'Synchronisation MikroTik'}
            </span>
            <span className={`font-mono font-bold ${isCompleted ? 'text-emerald-400' : 'text-indigo-400'}`}>
              {job.progress}%
            </span>
          </div>

          <div className="w-full bg-slate-800/80 rounded-full h-3.5 p-0.5 border border-slate-700/60 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                isCompleted
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : isFailed
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse'
              }`}
              style={{ width: `${Math.max(5, job.progress)}%` }}
            ></div>
          </div>
        </div>

        {/* Badge d'avertissement tâche de fond */}
        <div className="flex items-center justify-center pt-1">
          {isRunning && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Tâche de fond active — Ne fermez pas l'application</span>
            </div>
          )}

          {isCompleted && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Terminé avec succès ! Fermeture automatique...</span>
            </div>
          )}

          {isFailed && (
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-lg shadow-rose-500/20"
            >
              Fermer et réessayer
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
