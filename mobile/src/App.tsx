import React, { useState, useEffect } from 'react';

// Types
interface RouterStatus {
  online: boolean;
  boardName: string;
  version: string;
  cpuLoad: number;
  freeMemory: number;
  totalMemory: number;
  uptime: string;
  pollingActive?: boolean;
  mode?: string;
}

interface HotspotUser {
  '.id': string;
  name: string;
  profile: string;
  comment?: string;
  disabled?: string;
  uptime?: string;
  bytesIn?: string;
  bytesOut?: string;
  bytesTotal?: string;
}

interface ActiveSession {
  '.id': string;
  user: string;
  address: string;
  macAddress?: string;
  uptime: string;
  bytesIn?: string;
  bytesOut?: string;
  sessionTimeLeft?: string;
}

interface SaleTransaction {
  id: string;
  reference: string;
  amount: number;
  plan: string;
  profile: string;
  voucher: string;
  mode: string;
  phone?: string;
  date: string;
  status: string;
  comment?: string;
}

interface VoucherItem {
  id: string;
  code: string;
  profile: string;
  price: number;
  created: string;
  status: string;
  comment?: string;
}

// URL de l'API distante (production)
const API_BASE = 'https://mcwifi.net';

// Composant Login
function LoginScreen({ onLogin }: { onLogin: (token: string, username: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok && data.token) {
        onLogin(data.token, data.username || username);
      } else {
        setError(data.error || 'Identifiants incorrects');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur. Vérifiez votre connexion internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Cloud Mikhmon</h1>
          <p className="text-slate-400 text-sm mt-1">Gestion Hotspot MikroTik</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nom d'utilisateur</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-8">
          © 2026 2MC COMPANY ETS
        </p>
      </div>
    </div>
  );
}

// Composant Header mobile
function MobileHeader({ title, onLogout, onRefresh }: { title: string; onLogout: () => void; onRefresh: () => void }) {
  return (
    <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        </div>
        <h1 className="text-white font-semibold text-sm">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onRefresh} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button onClick={onLogout} className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Composant Navigation bas
function BottomNav({ active, onChange }: { active: string; onChange: (tab: string) => void }) {
  const tabs = [
    { id: 'dashboard', label: 'Tableau', icon: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10' },
    { id: 'users', label: 'Utilisateurs', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'active', label: 'Sessions', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'vouchers', label: 'Vouchers', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
    { id: 'sales', label: 'Ventes', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3-2 2 2 2-2 2 2 2-2 3 2z' },
    { id: 'settings', label: 'Réglages', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-t border-slate-800 pb-safe">
      <div className="flex justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-col items-center py-2 px-3 min-w-[60px] ${
              active === tab.id ? 'text-indigo-400' : 'text-slate-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            <span className="text-[10px] mt-1">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Configurations des forfaits d'accès rapide
const QUICK_PLANS = [
  { id: '100-F-4h', label: '4 Heures', duration: '4h', price: 100, color: 'from-emerald-500 to-teal-600', border: 'border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-300' },
  { id: '200---12h', label: '12 Heures', duration: '12h', price: 200, color: 'from-blue-500 to-cyan-600', border: 'border-blue-500/30', badge: 'bg-blue-500/20 text-blue-300' },
  { id: '300-F-24h', label: '24 Heures', duration: '24h', price: 300, color: 'from-indigo-500 to-purple-600', border: 'border-indigo-500/30', badge: 'bg-indigo-500/20 text-indigo-300' },
  { id: '500---4j', label: '4 Jours', duration: '4j', price: 500, color: 'from-purple-500 to-pink-600', border: 'border-purple-500/30', badge: 'bg-purple-500/20 text-purple-300' },
  { id: '1200---7j', label: '7 Jours', duration: '7j', price: 1200, color: 'from-amber-500 to-orange-600', border: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-300' },
  { id: '4000--30j', label: '30 Jours', duration: '30j', price: 4000, color: 'from-rose-500 to-red-600', border: 'border-rose-500/30', badge: 'bg-rose-500/20 text-rose-300' }
];

// Modal d'affichage du ticket généré
function GeneratedTicketModal({
  voucher,
  planLabel,
  onClose
}: {
  voucher: VoucherItem | null;
  planLabel?: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  if (!voucher) return null;

  const loginUrl = `http://mcwifi.net/login?username=${encodeURIComponent(voucher.code)}&password=${encodeURIComponent(voucher.code)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(loginUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(voucher.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = `🎫 *2MC WIFI ZONE* 🚀\n\nVotre code d'accès WiFi:\n👉 *${voucher.code}*\n\n⏱ Forfait: ${planLabel || voucher.profile}\n💰 Prix: ${voucher.price} FCFA\n🌐 Connexion directe: http://mcwifi.net\n\n_Merci pour votre confiance !_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="font-bold text-white text-base">Ticket Généré avec Succès !</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Ticket Visual Card */}
        <div className="bg-gradient-to-br from-indigo-950/80 to-slate-900 p-4 rounded-2xl border border-indigo-500/30 text-center space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-indigo-400 tracking-wider">2MC WIFI ZONE</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              {voucher.price} FCFA
            </span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Code d'accès Internet</p>
            <p className="text-2xl font-black font-mono tracking-widest text-indigo-300 my-1 select-all">
              {voucher.code}
            </p>
            <p className="text-[10px] text-slate-500">Valide pour: {planLabel || voucher.profile}</p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center pt-1">
            <div className="bg-white p-2 rounded-xl shadow-md inline-block">
              <img src={qrUrl} alt="QR Code Login" className="w-32 h-32" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">Scannez pour connexion automatique</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleCopy}
            className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-slate-700"
          >
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{copied ? '✓ Copié !' : 'Copier Code'}</span>
          </button>

          <button
            onClick={handleWhatsApp}
            className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
            </svg>
            <span>WhatsApp</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/20"
        >
          Terminer / Nouveau Ticket
        </button>
      </div>
    </div>
  );
}

// Composant Dashboard
function Dashboard({
  routerStatus,
  users,
  activeSessions,
  sales,
  totalRevenue,
  onNavigate,
  onRefresh
}: {
  routerStatus: RouterStatus | null;
  users: HotspotUser[];
  activeSessions: ActiveSession[];
  sales: SaleTransaction[];
  totalRevenue: number;
  onNavigate: (tab: string) => void;
  onRefresh?: () => void;
}) {
  const [token] = useState(() => localStorage.getItem('mikhmon_token') || '');
  const [generatingPlanId, setGeneratingPlanId] = useState<string | null>(null);
  const [generatedTicket, setGeneratedTicket] = useState<{ voucher: VoucherItem; planLabel: string } | null>(null);

  const stats = [
    { label: 'Utilisateurs', value: users.length, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'from-blue-500 to-indigo-600', tab: 'users' },
    { label: 'Sessions actives', value: activeSessions.length, icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'from-emerald-500 to-teal-600', tab: 'active' },
    { label: 'Ventes', value: sales.length, icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3-2 2 2 2-2 2 2 2-2 3 2z', color: 'from-amber-500 to-orange-600', tab: 'sales' },
    { label: 'Revenus', value: `${totalRevenue.toLocaleString()} FCFA`, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-purple-500 to-pink-600', tab: 'sales' }
  ];

  // Générateur 1 Clic à l'unité
  const handleQuickGenerate = async (plan: typeof QUICK_PLANS[0]) => {
    setGeneratingPlanId(plan.id);
    try {
      const res = await fetch(`${API_BASE}/api/vouchers/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prefix: '',
          length: 6,
          profile: plan.id,
          quantity: 1,
          price: plan.price
        })
      });

      const data = await res.json();
      if (data && data.vouchers && data.vouchers.length > 0) {
        setGeneratedTicket({
          voucher: data.vouchers[0],
          planLabel: plan.label
        });
        if (onRefresh) onRefresh();
      } else {
        alert('Erreur lors de la génération du ticket');
      }
    } catch (err) {
      alert('Erreur de communication avec le serveur');
    } finally {
      setGeneratingPlanId(null);
    }
  };

  return (
    <>
      {generatedTicket && (
        <GeneratedTicketModal
          voucher={generatedTicket.voucher}
          planLabel={generatedTicket.planLabel}
          onClose={() => setGeneratedTicket(null)}
        />
      )}

      <div className="p-4 space-y-4 pb-24">
        {/* Statut routeur */}
        <div className={`rounded-2xl p-4 border ${routerStatus?.online ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Statut du routeur</p>
              <p className="text-lg font-bold text-white">{routerStatus?.online ? 'En ligne' : 'Hors ligne'}</p>
              <p className="text-xs text-slate-400 mt-1">{routerStatus?.boardName || 'Non connecté'} - v{routerStatus?.version || 'N/A'}</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${routerStatus?.online ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          </div>
          {routerStatus?.online && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{routerStatus.cpuLoad}%</p>
                <p className="text-[10px] text-slate-400">CPU</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">{routerStatus.freeMemory}MB</p>
                <p className="text-[10px] text-slate-400">RAM libre</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">{routerStatus.uptime}</p>
                <p className="text-[10px] text-slate-400">Uptime</p>
              </div>
            </div>
          )}
        </div>

        {/* ACCÈS RAPIDE : GÉNÉRATEUR DE TICKETS À L'UNITÉ (1 CLIC) */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-950/70 to-slate-900 border border-indigo-500/30 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                ⚡
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Tickets Express (À l'Unité)</h3>
                <p className="text-[10px] text-slate-400">1 tap pour créer un ticket instantané</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('vouchers')}
              className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              En masse →
            </button>
          </div>

          {/* Grille des boutons 1-Clic */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            {QUICK_PLANS.map((plan) => {
              const isGenerating = generatingPlanId === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => handleQuickGenerate(plan)}
                  disabled={generatingPlanId !== null}
                  className={`p-3 rounded-xl border bg-slate-900/90 text-left transition-all relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] ${
                    isGenerating ? 'border-indigo-500 ring-2 ring-indigo-500/50' : plan.border
                  } disabled:opacity-60`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plan.badge}`}>
                      {plan.duration}
                    </span>
                    <span className="text-xs font-black text-white">{plan.price} F</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{plan.label}</span>
                    {isGenerating ? (
                      <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-indigo-400 text-sm font-bold">+</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <button
              key={stat.label}
              onClick={() => onNavigate(stat.tab)}
              className="rounded-2xl p-4 bg-slate-900 border border-slate-800 text-left"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </button>
          ))}
        </div>

        {/* Dernières ventes */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Dernières ventes</h3>
            <button onClick={() => onNavigate('sales')} className="text-xs text-indigo-400">Voir tout</button>
          </div>
          <div className="divide-y divide-slate-800">
            {sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">{sale.voucher}</p>
                  <p className="text-xs text-slate-400">{sale.plan} • {new Date(sale.date).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">{sale.amount.toLocaleString()} FCFA</p>
                  <p className="text-[10px] text-slate-500">{sale.mode}</p>
                </div>
              </div>
            ))}
            {sales.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-slate-500">Aucune vente enregistrée</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Composant Utilisateurs
function UsersView({ users, onRefresh }: { users: HotspotUser[]; onRefresh: () => void }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [token] = useState(() => localStorage.getItem('mikhmon_token') || '');

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.profile || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelected(newSet);
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      await fetch(`${API_BASE}/api/router/users/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      onRefresh();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const batchDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Supprimer ${selected.size} utilisateur(s) ?`)) return;
    try {
      await fetch(`${API_BASE}/api/router/users/batch-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ids: Array.from(selected) })
      });
      setSelected(new Set());
      onRefresh();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un utilisateur..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        {selected.size > 0 && (
          <button
            onClick={batchDelete}
            className="px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium"
          >
            Suppr. ({selected.size})
          </button>
        )}
      </div>

      <div className="space-y-2">
        {filtered.map((user) => (
          <div
            key={user['.id'] || user.name}
            className={`rounded-xl p-3 bg-slate-900 border flex items-center gap-3 ${
              selected.has(user['.id'] || user.name) ? 'border-indigo-500' : 'border-slate-800'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.has(user['.id'] || user.name)}
              onChange={() => toggleSelect(user['.id'] || user.name)}
              className="w-4 h-4 accent-indigo-500"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400">{user.profile || 'N/A'}</p>
              {user.bytesTotal && (
                <p className="text-[10px] text-slate-500">↓ {user.bytesIn} ↑ {user.bytesOut}</p>
              )}
            </div>
            <button
              onClick={() => deleteUser(user['.id'] || user.name)}
              className="p-2 rounded-lg text-red-400 hover:bg-red-500/10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-500">Aucun utilisateur trouvé</div>
        )}
      </div>
    </div>
  );
}

// Composant Sessions actives
function ActiveSessionsView({ sessions, onRefresh }: { sessions: ActiveSession[]; onRefresh: () => void }) {
  const [token] = useState(() => localStorage.getItem('mikhmon_token') || '');

  const disconnect = async (id: string) => {
    if (!confirm('Déconnecter cette session ?')) return;
    try {
      await fetch(`${API_BASE}/api/router/active/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      onRefresh();
    } catch (err) {
      alert('Erreur lors de la déconnexion');
    }
  };

  return (
    <div className="p-4 pb-24">
      <div className="space-y-2">
        {sessions.map((session) => (
          <div key={session['.id']} className="rounded-xl p-3 bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{session.user}</p>
                <p className="text-xs text-slate-400">{session.address}</p>
                <p className="text-[10px] text-slate-500">MAC: {session.macAddress || 'N/A'}</p>
              </div>
              <div className="text-right mr-3">
                <p className="text-xs text-slate-300">{session.uptime}</p>
                <p className="text-[10px] text-slate-500">↓ {session.bytesIn} ↑ {session.bytesOut}</p>
              </div>
              <button
                onClick={() => disconnect(session['.id'])}
                className="p-2 rounded-lg text-red-400 hover:bg-red-500/10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-500">Aucune session active</div>
        )}
      </div>
    </div>
  );
}

// Composant Vouchers
function VouchersView({ onRefresh }: { onRefresh: () => void }) {
  const [token] = useState(() => localStorage.getItem('mikhmon_token') || '');
  const [quantity, setQuantity] = useState(5);
  const [profile, setProfile] = useState('300-F-24h');
  const [price, setPrice] = useState(300);
  const [generated, setGenerated] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedTicketModal, setSelectedTicketModal] = useState<VoucherItem | null>(null);

  const profiles = [
    { id: '100-F-4h', label: '4 Heures', price: 100 },
    { id: '200---12h', label: '12 Heures', price: 200 },
    { id: '300-F-24h', label: '24 Heures', price: 300 },
    { id: '500---4j', label: '4 Jours', price: 500 },
    { id: '1200---7j', label: '7 Jours', price: 1200 },
    { id: '4000--30j', label: '30 Jours', price: 4000 }
  ];

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/vouchers/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prefix: '', length: 6, profile, quantity, price })
      });
      const data = await res.json();
      if (data.vouchers) {
        setGenerated(data.vouchers);
        onRefresh();
      }
    } catch (err) {
      alert('Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const shareWhatsApp = (v: VoucherItem) => {
    const text = `🎫 *2MC WIFI ZONE* 🚀\n\nVotre code d'accès WiFi: *${v.code}*\nForfait: ${v.profile} (${v.price} FCFA)\nConnexion: http://mcwifi.net`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <>
      {selectedTicketModal && (
        <GeneratedTicketModal
          voucher={selectedTicketModal}
          onClose={() => setSelectedTicketModal(null)}
        />
      )}

      <div className="p-4 pb-24 space-y-4">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-white">Générateur de Vouchers (En lot)</h3>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Profil Forfait</label>
            <select
              value={profile}
              onChange={(e) => {
                const p = profiles.find(p => p.id === e.target.value);
                setProfile(e.target.value);
                if (p) setPrice(p.price);
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.label} - {p.price} FCFA</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Quantité Rapide</label>
            <div className="flex gap-2">
              {[1, 5, 10, 20, 50].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuantity(q)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                    quantity === q
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Quantité personnalisée</label>
              <input
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Prix (FCFA)</label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Génération en cours...</span>
              </>
            ) : (
              <span>Générer {quantity} voucher(s)</span>
            )}
          </button>
        </div>

        {generated.length > 0 && (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden space-y-2">
            <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-white">Vouchers générés ({generated.length})</h3>
              <span className="text-xs text-emerald-400 font-bold">Prêts à l'emploi</span>
            </div>
            <div className="divide-y divide-slate-800">
              {generated.map((v) => (
                <div key={v.id} className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-mono font-black text-indigo-300 truncate">{v.code}</p>
                    <p className="text-xs text-slate-400">{v.profile} • <span className="text-emerald-400 font-bold">{v.price} F</span></p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => copyCode(v.code)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                      title="Copier"
                    >
                      {copiedCode === v.code ? '✓' : 'Copier'}
                    </button>
                    <button
                      onClick={() => setSelectedTicketModal(v)}
                      className="p-2 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold"
                      title="Voir QR"
                    >
                      QR
                    </button>
                    <button
                      onClick={() => shareWhatsApp(v)}
                      className="p-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold"
                      title="WhatsApp"
                    >
                      WA
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Composant Ventes
function SalesView({ sales, totalRevenue, onRefresh }: { sales: SaleTransaction[]; totalRevenue: number; onRefresh: () => void }) {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? sales : sales.filter(s => s.status === filter.toUpperCase());

  return (
    <div className="p-4 pb-24">
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-4 mb-4">
        <p className="text-xs text-indigo-200">Revenu total</p>
        <p className="text-2xl font-bold text-white">{totalRevenue.toLocaleString()} FCFA</p>
        <p className="text-xs text-indigo-200 mt-1">{sales.length} transaction(s)</p>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['all', 'SUCCESS', 'PENDING', 'FAILED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {f === 'all' ? 'Toutes' : f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((sale) => (
          <div key={sale.id} className="rounded-xl p-3 bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{sale.voucher}</p>
                <p className="text-xs text-slate-400">{sale.plan} • {sale.mode}</p>
                <p className="text-[10px] text-slate-500">{new Date(sale.date).toLocaleString('fr-FR')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-400">{sale.amount.toLocaleString()} FCFA</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  sale.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' :
                  sale.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {sale.status}
                </span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-500">Aucune vente trouvée</div>
        )}
      </div>
    </div>
  );
}

// Composant Réglages
function SettingsView({ onRefresh }: { onRefresh: () => void }) {
  const [token] = useState(() => localStorage.getItem('mikhmon_token') || '');
  const [settings, setSettings] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSettings(await res.json());
      }
    } catch (err) {
      console.error('Erreur chargement réglages:', err);
    }
  };

  const saveSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        onRefresh();
      }
    } catch (err) {
      alert('Erreur lors de la sauvegarde');
    }
  };

  if (!settings) {
    return (
      <div className="p-4 pb-24 text-center text-slate-500">Chargement des réglages...</div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-white">Configuration du routeur</h3>

        <div>
          <label className="block text-xs text-slate-400 mb-1">IP du routeur</label>
          <input
            type="text"
            value={settings.routerIp || ''}
            onChange={(e) => setSettings({ ...settings, routerIp: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Port</label>
            <input
              type="text"
              value={settings.routerPort || ''}
              onChange={(e) => setSettings({ ...settings, routerPort: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Mode connexion</label>
            <select
              value={settings.connectionMode || 'auto'}
              onChange={(e) => setSettings({ ...settings, connectionMode: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="auto">Auto</option>
              <option value="polling">Polling</option>
              <option value="direct">Direct</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Utilisateur routeur</label>
          <input
            type="text"
            value={settings.routerUser || ''}
            onChange={(e) => setSettings({ ...settings, routerUser: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Mot de passe routeur</label>
          <input
            type="password"
            value={settings.routerPass || ''}
            onChange={(e) => setSettings({ ...settings, routerPass: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Nom DNS</label>
          <input
            type="text"
            value={settings.dnsName || ''}
            onChange={(e) => setSettings({ ...settings, dnsName: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={saveSettings}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold"
        >
          {saved ? '✓ Enregistré !' : 'Enregistrer les réglages'}
        </button>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">FedaPay</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Clé publique</label>
            <input
              type="text"
              value={settings.fedapayPublicKey || ''}
              onChange={(e) => setSettings({ ...settings, fedapayPublicKey: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Clé secrète</label>
            <input
              type="password"
              value={settings.fedapaySecretKey || ''}
              onChange={(e) => setSettings({ ...settings, fedapaySecretKey: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Environnement</label>
            <select
              value={settings.fedapayEnv || 'live'}
              onChange={(e) => setSettings({ ...settings, fedapayEnv: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="live">Production</option>
              <option value="sandbox">Test</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant principal
export function App() {
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('mikhmon_token'));
  const [adminUser, setAdminUser] = useState<string | null>(() => localStorage.getItem('mikhmon_user'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [routerStatus, setRouterStatus] = useState<RouterStatus | null>(null);
  const [users, setUsers] = useState<HotspotUser[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(false);

  // Configurer la barre de statut et le bouton retour Android
  useEffect(() => {
    const isNative = window.Capacitor?.isNativePlatform?.() || false;
    if (isNative) {
      // Utiliser les plugins Capacitor via window (chargés par le runtime Capacitor)
      const cap = (window as any).Capacitor;
      if (cap && cap.Plugins) {
        const { StatusBar, App: CapApp } = cap.Plugins;
        if (StatusBar) {
          StatusBar.setStyle({ style: 'DARK' });
          StatusBar.setBackgroundColor({ color: '#020617' });
        }
        if (CapApp) {
          CapApp.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
            if (canGoBack) {
              window.history.back();
            } else {
              CapApp.exitApp();
            }
          });
        }
      }
    }
  }, []);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    if (!authToken) return null;
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${authToken}`
    };
    try {
      const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
      if (res.status === 401) {
        handleLogout();
        return null;
      }
      return res;
    } catch (err) {
      console.warn(`[Auth Fetch] Network error for ${url}:`, err);
      return null;
    }
  };

  const fetchAllData = async () => {
    if (!authToken) return;

    try {
      await Promise.allSettled([
        fetchWithAuth('/api/router/status').then(async (res) => {
          if (res && res.ok) {
            const sData = await res.json();
            setRouterStatus(sData);
          }
        }),
        fetchWithAuth('/api/router/users').then(async (res) => {
          if (res && res.ok) {
            const uData = await res.json();
            if (Array.isArray(uData)) setUsers(uData);
          }
        }),
        fetchWithAuth('/api/router/active').then(async (res) => {
          if (res && res.ok) {
            const aData = await res.json();
            if (Array.isArray(aData)) setActiveSessions(aData);
          }
        }),
        fetchWithAuth('/api/sales').then(async (res) => {
          if (res && res.ok) {
            const sData = await res.json();
            if (sData.sales) setSales(sData.sales);
            if (sData.totalRevenue !== undefined) setTotalRevenue(sData.totalRevenue);
          }
        })
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (token: string, username: string) => {
    localStorage.setItem('mikhmon_token', token);
    localStorage.setItem('mikhmon_user', username);
    setAuthToken(token);
    setAdminUser(username);
  };

  const handleLogout = () => {
    if (authToken) {
      fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      }).catch(() => {});
    }
    localStorage.removeItem('mikhmon_token');
    localStorage.removeItem('mikhmon_user');
    setAuthToken(null);
    setAdminUser(null);
  };

  useEffect(() => {
    if (authToken) {
      fetchAllData();
      const interval = setInterval(fetchAllData, 15000);
      return () => clearInterval(interval);
    }
  }, [authToken]);

  if (!authToken) {
    return <LoginScreen onLogin={handleLoginSuccess} />;
  }

  const titles: Record<string, string> = {
    dashboard: 'Tableau de bord',
    users: 'Utilisateurs',
    active: 'Sessions actives',
    vouchers: 'Génération de vouchers',
    sales: 'Historique des ventes',
    settings: 'Réglages'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <MobileHeader
        title={titles[activeTab] || 'Cloud Mikhmon'}
        onLogout={handleLogout}
        onRefresh={() => {
          setLoading(true);
          fetchAllData();
        }}
      />

      {loading && (
        <div className="fixed top-14 left-0 right-0 z-40 flex justify-center">
          <div className="px-4 py-1.5 rounded-full bg-indigo-600 text-white text-xs shadow-lg">
            Synchronisation...
          </div>
        </div>
      )}

      <main className="pb-20">
        {activeTab === 'dashboard' && (
          <Dashboard
            routerStatus={routerStatus}
            users={users}
            activeSessions={activeSessions}
            sales={sales}
            totalRevenue={totalRevenue}
            onNavigate={setActiveTab}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'users' && (
          <UsersView users={users} onRefresh={fetchAllData} />
        )}

        {activeTab === 'active' && (
          <ActiveSessionsView sessions={activeSessions} onRefresh={fetchAllData} />
        )}

        {activeTab === 'vouchers' && (
          <VouchersView onRefresh={fetchAllData} />
        )}

        {activeTab === 'sales' && (
          <SalesView sales={sales} totalRevenue={totalRevenue} onRefresh={fetchAllData} />
        )}

        {activeTab === 'settings' && (
          <SettingsView onRefresh={fetchAllData} />
        )}
      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

export default App;