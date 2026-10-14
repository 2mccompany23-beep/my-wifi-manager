import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle2, AlertCircle, Smartphone, Send, Sparkles, Download } from 'lucide-react';
import {
  isPushSupported,
  getCurrentPushSubscription,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  sendTestPushNotification
} from '../utils/pushManager';

interface PushNotificationSettingsProps {
  token: string;
}

export const PushNotificationSettings: React.FC<PushNotificationSettingsProps> = ({ token }) => {
  const [supported, setSupported] = useState<boolean>(true);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    setSupported(isPushSupported());
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true);

    const checkCurrentSub = async () => {
      const sub = await getCurrentPushSubscription();
      setIsSubscribed(Boolean(sub));
    };
    checkCurrentSub();

    // Capturer l'événement d'installation PWA si disponible
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleToggleSubscription = async () => {
    setLoading(true);
    setStatusMessage(null);

    if (isSubscribed) {
      const res = await unsubscribeFromPushNotifications(token);
      if (res.success) {
        setIsSubscribed(false);
        setStatusMessage({ text: res.message, type: 'info' });
      } else {
        setStatusMessage({ text: res.message, type: 'error' });
      }
    } else {
      const res = await subscribeToPushNotifications(token);
      if (res.success) {
        setIsSubscribed(true);
        setStatusMessage({ text: res.message, type: 'success' });
      } else {
        setStatusMessage({ text: res.message, type: 'error' });
      }
    }

    setLoading(false);
  };

  const handleTestPush = async () => {
    setLoading(true);
    setStatusMessage(null);
    const res = await sendTestPushNotification(token);
    setStatusMessage({
      text: res.message,
      type: res.success ? 'success' : 'error'
    });
    setLoading(false);
  };

  const handleInstallPWA = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/20 via-slate-900/60 to-slate-950 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 shrink-0">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Notifications Push PWA & Alertes Ventes
              {isSubscribed ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Actif sur cet appareil
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                  Inactif
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Recevez instantanément une alerte native sur votre téléphone (son + vibration) à chaque vente FedaPay ou connexion ticket MikroTik, même si l'application est fermée ou votre écran éteint.
            </p>
          </div>
        </div>

        {installPrompt && !isStandalone && (
          <button
            type="button"
            onClick={handleInstallPWA}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:opacity-90 transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Installer l'App sur ce téléphone</span>
          </button>
        )}
      </div>

      {!supported && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Ce navigateur ne supporte pas les notifications Web Push. Utilisez Google Chrome, Microsoft Edge ou Safari (iOS 16.4+).</span>
        </div>
      )}

      {statusMessage && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
          statusMessage.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : statusMessage.type === 'error'
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={handleToggleSubscription}
          disabled={!supported || loading}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
            isSubscribed
              ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/30'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
          }`}
        >
          {isSubscribed ? (
            <>
              <BellOff className="w-4 h-4" />
              <span>Désactiver les alertes sur ce téléphone</span>
            </>
          ) : (
            <>
              <Bell className="w-4 h-4" />
              <span>Activer les alertes sur ce téléphone</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleTestPush}
          disabled={!supported || !isSubscribed || loading}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all border bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4 text-indigo-400" />
          <span>Tester la notification (Envoyer un test)</span>
        </button>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
        <p className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          Comment installer l'application sur votre écran d'accueil :
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1 text-slate-400">
          <li><strong>Sur Android (Chrome / Edge) :</strong> Appuyez sur les trois points <code className="text-white">⋮</code> en haut à droite &gt; <em>"Installer l'application"</em> ou <em>"Ajouter à l'écran d'accueil"</em>.</li>
          <li><strong>Sur iPhone (Safari iOS 16.4+) :</strong> Appuyez sur le bouton Partager <code className="text-white">⎋</code> &gt; <em>"Sur l'écran d'accueil"</em>, puis activez les notifications.</li>
        </ul>
      </div>
    </div>
  );
};
