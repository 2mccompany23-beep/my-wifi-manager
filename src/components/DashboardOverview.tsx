import React, { useState } from 'react';
import { Cpu, HardDrive, Clock, Users, Zap, TrendingUp, ShoppingCart, ArrowUpRight, ChevronRight, Banknote, WifiOff, KeyRound, Copy, Check, Share2, Printer, X, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';
import { RouterStatus, HotspotUser, ActiveSession, SaleTransaction, VoucherItem } from '../types';

interface DashboardOverviewProps {
  routerStatus: RouterStatus | null;
  users: HotspotUser[];
  activeSessions: ActiveSession[];
  sales: SaleTransaction[];
  totalRevenue: number;
  onNavigate: (tab: string) => void;
  onRefresh?: () => void;
}

const QUICK_PLANS = [
  { id: '100-F-4h', label: '4 Heures', duration: '4h', price: 100, color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
  { id: '200---12h', label: '12 Heures', duration: '12h', price: 200, color: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300' },
  { id: '300-F-24h', label: '24 Heures', duration: '24h', price: 300, color: 'from-indigo-500/20 to-purple-500/20', border: 'border-indigo-500/30', text: 'text-indigo-400', badge: 'bg-indigo-500/20 text-indigo-300' },
  { id: '500---4j', label: '4 Jours', duration: '4j', price: 500, color: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300' },
  { id: '1200---7j', label: '7 Jours', duration: '7j', price: 1200, color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
  { id: '4000--30j', label: '30 Jours', duration: '30j', price: 4000, color: 'from-rose-500/20 to-red-500/20', border: 'border-rose-500/30', text: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-300' }
];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  routerStatus,
  users,
  activeSessions,
  sales,
  totalRevenue,
  onNavigate,
  onRefresh
}) => {
  const [generatingPlanId, setGeneratingPlanId] = useState<string | null>(null);
  const [generatedTicket, setGeneratedTicket] = useState<{ voucher: VoucherItem; planLabel: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleQuickGenerate = async (plan: typeof QUICK_PLANS[0]) => {
    setGeneratingPlanId(plan.id);
    try {
      const token = sessionStorage.getItem('mikhmon_token') || '';
      const res = await fetch('/api/vouchers/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prefix: '2MC-',
          length: 5,
          profile: plan.id,
          quantity: 1,
          price: plan.price
        })
      });

      const data = await res.json();
      if (data && data.vouchers && data.vouchers.length > 0) {
        const v = data.vouchers[0];
        setGeneratedTicket({ voucher: v, planLabel: plan.label });
        
        // Generate QR code
        try {
          const loginUrl = `http://mcwifi.net/login?username=${encodeURIComponent(v.code)}&password=${encodeURIComponent(v.code)}`;
          const qr = await QRCode.toDataURL(loginUrl, { margin: 1, width: 200 });
          setQrDataUrl(qr);
        } catch (e) {
          console.error('QR code error:', e);
        }

        if (onRefresh) onRefresh();
      } else {
        alert('Erreur lors de la création du ticket');
      }
    } catch (err) {
      alert('Erreur de connexion au serveur');
    } finally {
      setGeneratingPlanId(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = (v: VoucherItem, label: string) => {
    const text = `🎫 *2MC WIFI ZONE* 🚀\n\nVotre code d'accès Internet:\n👉 *${v.code}*\n\n⏱ Forfait: ${label || v.profile}\n💰 Prix: ${v.price} FCFA\n🌐 Connexion: http://mcwifi.net\n\n_Merci pour votre confiance !_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">

      {/* Modal Ticket Express Généré */}
      {generatedTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="font-bold text-white text-base">Ticket Express Créé !</h3>
              </div>
              <button
                onClick={() => setGeneratedTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-indigo-950/80 to-slate-900 p-4 rounded-2xl border border-indigo-500/30 text-center space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-indigo-400">2MC WIFI ZONE</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  {generatedTicket.voucher.price} FCFA
                </span>
              </div>

              <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Code d'accès unique</p>
                <p className="text-2xl font-black font-mono tracking-widest text-indigo-300 my-1 select-all">
                  {generatedTicket.voucher.code}
                </p>
                <p className="text-[10px] text-slate-500">Valide: {generatedTicket.planLabel}</p>
              </div>

              {qrDataUrl && (
                <div className="flex flex-col items-center justify-center pt-1">
                  <div className="bg-white p-2 rounded-xl shadow-md inline-block">
                    <img src={qrDataUrl} alt="QR Code Login" className="w-32 h-32" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">Scannez pour connexion automatique</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => copyCode(generatedTicket.voucher.code)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-slate-700"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
                <span>{copied ? 'Copié !' : 'Copier Code'}</span>
              </button>

              <button
                onClick={() => shareWhatsApp(generatedTicket.voucher, generatedTicket.planLabel)}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
            </div>

            <button
              onClick={() => setGeneratedTicket(null)}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
            >
              Fermer / Nouveau Ticket
            </button>
          </div>
        </div>
      )}
      
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
              <p className="text-xs font-medium text-slate-400">Recettes Globales</p>
              <h3 className="text-2xl font-black text-white mt-1">
                {totalRevenue.toLocaleString('fr-FR')} <span className="text-sm font-normal text-indigo-400">FCFA</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 transition-transform">
              <Banknote className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-semibold flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Hotspot & En ligne</span>
            <span className="text-indigo-400/80 font-medium flex items-center gap-0.5">Filtrer par dates <ChevronRight className="w-3 h-3" /></span>
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

      {/* ACCÈS RAPIDE : GÉNÉRATEUR DE TICKETS EXPRESS À L'UNITÉ */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 space-y-4 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/90">
        <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Génération Rapide de Tickets (À l'Unité)</span>
              </h3>
              <p className="text-xs text-slate-400">
                1 clic pour créer un ticket instantané et le transmettre au client
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('vouchers')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-600/10 px-3 py-1.5 rounded-xl border border-indigo-500/20"
          >
            <span>Générer en masse</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Grille des boutons 1 Clic */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_PLANS.map((plan) => {
            const isGenerating = generatingPlanId === plan.id;
            return (
              <button
                key={plan.id}
                onClick={() => handleQuickGenerate(plan)}
                disabled={generatingPlanId !== null}
                className={`p-3.5 rounded-2xl border bg-slate-900/80 text-left transition-all relative overflow-hidden group hover:scale-[1.03] active:scale-[0.98] ${
                  isGenerating ? 'border-indigo-500 ring-2 ring-indigo-500/50' : plan.border
                } disabled:opacity-50 shadow-md`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${plan.badge}`}>
                    {plan.duration}
                  </span>
                  <span className="text-xs font-black text-white">{plan.price} F</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="font-bold text-slate-200">{plan.label}</span>
                  {isGenerating ? (
                    <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-indigo-400 font-extrabold text-sm group-hover:translate-x-0.5 transition-transform">+</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
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
