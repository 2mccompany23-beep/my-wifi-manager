import React, { useState } from 'react';
import { 
  Wifi, 
  Zap, 
  ShieldCheck, 
  Smartphone, 
  TrendingUp, 
  Users, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  MessageCircle, 
  PhoneCall, 
  Play, 
  Lock, 
  Server, 
  Layers, 
  CreditCard, 
  DollarSign, 
  Bell, 
  Award,
  HelpCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  // Simulateur de gains interactif
  const [dailyUsers, setDailyUsers] = useState<number>(35);
  const [avgTicketPrice, setAvgTicketPrice] = useState<number>(200);

  const monthlyRevenue = dailyUsers * avgTicketPrice * 30;
  const yearlyRevenue = monthlyRevenue * 12;

  // État accordéon FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Numéro WhatsApp de contact commercial
  const WHATSAPP_CONTACT = '2290144044414';
  const WHATSAPP_DISPLAY = '+229 01 44 04 44 14';

  const getWhatsAppLink = (message: string) => {
    return `https://wa.me/${WHATSAPP_CONTACT}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-indigo-600 selection:text-white font-sans overflow-x-hidden">
      
      {/* ========================================================
          1. HEADER / NAVIGATION BAR
      ======================================================== */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070b14]/85 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Wifi className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">2MC SpotCloud</span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  v2.0 PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Automate Wi-Fi Zone MikroTik & Mobile Money</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#solution" className="hover:text-indigo-400 transition-colors">La Solution</a>
            <a href="#features" className="hover:text-indigo-400 transition-colors">Fonctionnalités</a>
            <a href="#simulator" className="hover:text-indigo-400 transition-colors">Simulateur de Gains</a>
            <a href="#pricing" className="hover:text-indigo-400 transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-indigo-400 transition-colors">FAQ</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLogin}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all hover:border-slate-600"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Espace Admin</span>
            </button>

            <a
              href={getWhatsAppLink("Bonjour 2MC, je souhaite commander ou tester la solution 2MC SpotCloud pour mon Wi-Fi Zone.")}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4 fill-slate-950" />
              <span>Commander / WhatsApp</span>
            </a>
          </div>

        </div>
      </header>

      {/* ========================================================
          2. HERO SECTION — VENTE & PROPOSITION DE VALEUR
      ======================================================== */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-semibold shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Solution #1 d'Automatisation Wi-Fi Zone en Afrique de l'Ouest</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Transformez votre routeur <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-400">MikroTik</span> en une machine à billets <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">24h/24 par Mobile Money</span>.
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Fini l'impression de tickets en carton et les vols de caisse. Vos clients se connectent, paient par <strong>MTN MoMo, Moov, Wave ou Orange</strong>, et sont connectés en <strong>3 secondes</strong>. Vous recevez l'argent directement sur votre téléphone.
            </p>

            {/* CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={getWhatsAppLink("Bonjour, je souhaite équiper ma Wi-Fi Zone avec 2MC SpotCloud. Pouvez-vous me guider ?")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Obtenir Mon Pack Wi-Fi Automatisé</span>
                <ArrowRight className="w-5 h-5" />
              </a>

              <button
                onClick={onOpenLogin}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 font-bold text-base flex items-center justify-center gap-2 transition-all"
              >
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <span>Tester la Démo Dashboard</span>
              </button>
            </div>

            {/* Micro-assurances */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Sans abonnement obligatoire</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Compatible Starlink & Box 4G</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Installation en 30 minutes</span>
              </div>
            </div>

          </div>

          {/* ========================================================
              DASHBOARD & MOBILE DUAL PREVIEW MOCKUP
          ======================================================== */}
          <div className="mt-14 lg:mt-20 relative max-w-5xl mx-auto">
            
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-3 sm:p-5 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl">
              
              {/* Window controls header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  <span className="text-xs font-mono text-slate-500 ml-2">2mc.alwaysdata.net/dashboard</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Connecté en Direct • RouterOS v7</span>
                </div>
              </div>

              {/* Inside Dashboard Teaser Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Metric 1 */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Revenus Aujourd'hui (MoMo)</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono">18 500 <span className="text-xs font-normal text-slate-400">FCFA</span></div>
                  <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +34% par rapport à hier
                  </p>
                </div>

                {/* Metric 2 */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Clients Connectés en Direct</span>
                    <Users className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono">28 <span className="text-xs font-normal text-slate-400">utilisateurs</span></div>
                  <p className="text-[11px] text-slate-400">Bande passante : 42.8 Mbps / 50 Mbps</p>
                </div>

                {/* Metric 3 */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Dernière Vente Automatique</span>
                    <Bell className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-sm font-bold text-white font-mono truncate">Code: wzdz3nfh (Forfait 4h)</div>
                  <p className="text-[11px] text-emerald-400 font-medium">Payé via MTN Mobile Money (il y a 2 min)</p>
                </div>

              </div>

              {/* Banner notification showcase */}
              <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    📲
                  </div>
                  <div className="text-xs">
                    <strong className="text-white">Notification Push Directe :</strong> <span className="text-slate-300">Vous recevez une alerte sur votre téléphone dès qu'un ticket est acheté, même si vous dormez.</span>
                  </div>
                </div>
                <button
                  onClick={onOpenLogin}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs whitespace-nowrap transition-colors"
                >
                  Voir en direct
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          3. LE PROBLÈME VS LA SOLUTION (AGITATION & TRANSFORMATION)
      ======================================================== */}
      <section id="solution" className="py-20 bg-slate-950/60 border-y border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Le Constat Cruel</h2>
            <p className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Combien d'argent perdez-vous chaque jour avec l'ancienne méthode ?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* Colonne 1 : La méthode traditionnelle (douloureuse) */}
            <div className="rounded-3xl border border-rose-900/30 bg-rose-950/10 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold uppercase">
                  <XCircle className="w-4 h-4" /> La Méthode Ancienne (Mikhmon Papier)
                </div>
                <h3 className="text-xl font-bold text-white">Lente, risquée et dépendante d'un être humain</h3>
                
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold text-lg leading-none">✕</span>
                    <span><strong>Pertes de clients la nuit</strong> : Le gérant dort ou est absent, les clients ne peuvent pas acheter de tickets et repartent.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold text-lg leading-none">✕</span>
                    <span><strong>Vols de caisse & triche</strong> : Difficile de savoir si tous les tickets vendus ont réellement été enregistrés et payés.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold text-lg leading-none">✕</span>
                    <span><strong>Coûts d'impression & d'encres</strong> : Des ramettes de papier, des imprimantes qui tombent en panne, des tickets perdus ou mouillés.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold text-lg leading-none">✕</span>
                    <span><strong>Dépendance totale</strong> : Si vous voyagez ou êtes malade, votre business Wi-Fi s'arrête net.</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/50 text-xs text-rose-300">
                ⚠️ Résultat : Vous perdez en moyenne <strong>30% à 50% de chiffre d'affaires</strong> chaque mois.
              </div>
            </div>

            {/* Colonne 2 : Avec 2MC SpotCloud (Automatisé) */}
            <div className="rounded-3xl border border-emerald-500/40 bg-emerald-950/10 p-6 sm:p-8 space-y-6 flex flex-col justify-between relative overflow-hidden shadow-xl shadow-emerald-500/5">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="space-y-4 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Avec 2MC SpotCloud 2.0
                </div>
                <h3 className="text-xl font-bold text-white">Un robot qui encaisse et connecte vos clients 24h/24</h3>

                <ul className="space-y-3 text-sm text-slate-200">
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-400 font-bold text-lg leading-none">✓</span>
                    <span><strong>Encaissement 100% Automatique</strong> : Le client clique sur son forfait, valide son code Mobile Money et accède à Internet instantanément.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-400 font-bold text-lg leading-none">✓</span>
                    <span><strong>Zéro vol possible</strong> : L'argent arrive directement sur votre compte FedaPay / MoMo sans intermédiaire.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-400 font-bold text-lg leading-none">✓</span>
                    <span><strong>Votre Wi-Fi vend pendant que vous dormez</strong> : Ouvert 24h/24, 7j/7, même à 3h du matin sous la pluie.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-400 font-bold text-lg leading-none">✓</span>
                    <span><strong>Pilotage depuis votre téléphone</strong> : Consultez vos ventes en temps réel, coupez des sessions abusives et recevez vos alertes.</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 relative z-10">
                🚀 Résultat : <strong>Revenus maximisés, zéro fatigue, liberté totale.</strong>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          4. FONCTIONNALITÉS CLÉS — CE QUE VOUS OBTENEZ
      ======================================================== */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Technologies & Fonctionnalités</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Tout ce dont vous avez besoin pour dominer votre marché local
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/50 transition-all hover:bg-slate-900/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Portail Captif Hybride & Rapide</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Page de login moderne, hébergée sur votre routeur MikroTik pour 0 ms de latence, avec ouverture automatique sur tous les smartphones (Android, iPhone).
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/50 transition-all hover:bg-slate-900/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Passerelle Mobile Money FedaPay</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Acceptez MTN MoMo, Moov Money, Orange, Wave et Celtiis en direct. Les fonds sont versés immédiatement sur votre portefeuille sans blocage.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 hover:border-purple-500/50 transition-all hover:bg-slate-900/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Technologie Polling Inverse Cloud</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fonctionne sur n'importe quel modem (4G, Starlink, Fibre) SANS adresse IP publique fixe ni configuration compliquée de box opérateur.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 hover:border-amber-500/50 transition-all hover:bg-slate-900/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Notifications Push Web Temps Réel</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Recevez un carillon et une notification sur votre smartphone dès qu'un paiement passe avec le montant et le forfait acheté.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 hover:border-sky-500/50 transition-all hover:bg-slate-900/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">WhatsApp Support Dynamique</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Changez votre numéro de contact en 3 secondes dans le Dashboard : il s'actualise automatiquement sur le portail de tous vos clients.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 hover:border-rose-500/50 transition-all hover:bg-slate-900/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Sécurité Anti-Fraude & Audit MikroTik</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Comptabilisation infalsifiable croisée entre les scripts MikroTik et les transactions financières. Zéro discordance de caisse.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          5. SIMULATEUR DE REVENUS INTERACTIF
      ======================================================== */}
      <section id="simulator" className="py-20 bg-gradient-to-b from-[#070b14] via-slate-950 to-[#070b14] border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 sm:p-10 shadow-2xl space-y-8">
            
            <div className="text-center space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Simulateur de Rentabilité
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Combien votre Wi-Fi Zone peut vous rapporter ?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Ajustez les curseurs selon la fréquentation de votre quartier ou commerce :
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
              
              {/* Sliders */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-300">Clients / Ventes par jour :</span>
                    <span className="text-indigo-400 font-mono text-base">{dailyUsers} clients</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="150"
                    step="5"
                    value={dailyUsers}
                    onChange={(e) => setDailyUsers(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>5 clients</span>
                    <span>75 clients</span>
                    <span>150 clients</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-300">Prix moyen d'un forfait :</span>
                    <span className="text-emerald-400 font-mono text-base">{avgTicketPrice} FCFA</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={avgTicketPrice}
                    onChange={(e) => setAvgTicketPrice(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>100 F</span>
                    <span>500 F</span>
                    <span>1 000 F</span>
                  </div>
                </div>
              </div>

              {/* Résultat Calculé */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Revenu Net Estimé par Mois</span>
                  <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-mono mt-1">
                    {monthlyRevenue.toLocaleString('fr-FR')} <span className="text-sm font-bold text-slate-400">FCFA</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400 block">Sur une année complète :</span>
                  <span className="text-base font-extrabold text-indigo-300 font-mono">
                    {yearlyRevenue.toLocaleString('fr-FR')} FCFA / an
                  </span>
                </div>

                <a
                  href={getWhatsAppLink(`Bonjour, d'après le simulateur je peux faire ${monthlyRevenue.toLocaleString('fr-FR')} FCFA/mois. Je souhaite démarrer mon installation.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>Activer mes revenus maintenant</span>
                </a>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          6. GRILLE TARIFAIRE & PACKS DE DÉPLOIEMENT
      ======================================================== */}
      <section id="pricing" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Offres & Déploiement</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Choisissez la formule qui correspond à votre projet
            </p>
            <p className="text-sm text-slate-400">
              Déploiement rapide en 24h à distance ou livraison du routeur prêt à brancher.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            
            {/* Pack 1 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 uppercase">
                  Vous avez déjà un MikroTik
                </span>
                <h3 className="text-xl font-bold text-white">Pack Installation & Licence</h3>
                <div className="text-3xl font-black text-white font-mono">25 000 <span className="text-xs font-normal text-slate-400">FCFA (1 fois)</span></div>
                <p className="text-xs text-slate-400">
                  Nous configurons votre propre routeur MikroTik à distance et activons le système complet.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Configuration complète de votre routeur</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Portail captif personnalisé à vos couleurs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Intégration Mobile Money FedaPay</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Accès Dashboard Cloud sécurisé</span>
                  </li>
                </ul>
              </div>

              <a
                href={getWhatsAppLink("Bonjour, j'ai déjà un routeur MikroTik et je souhaite commander le Pack Installation à 25 000 FCFA.")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
              >
                <span>Commander ce pack</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Pack 2 : Recommandé Clé en Main */}
            <div className="bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900 border-2 border-indigo-500 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative shadow-2xl shadow-indigo-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[11px] font-black uppercase tracking-wider shadow-md">
                Pack Clé en Main Recommandé
              </div>

              <div className="space-y-4 pt-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 uppercase">
                  Matériel + Logiciel Inclus
                </span>
                <h3 className="text-xl font-bold text-white">Routeur MikroTik Prêt à Brancher</h3>
                <div className="text-3xl font-black text-emerald-400 font-mono">55 000 <span className="text-xs font-normal text-slate-400">FCFA</span></div>
                <p className="text-xs text-slate-300">
                  Vous recevez un routeur MikroTik hEX / RB951 déjà entièrement flashé et configuré. Vous branchez sur votre box et vous commencez à encaisser.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-200 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Routeur MikroTik physique inclus & garanti</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Système 2MC SpotCloud pré-installé</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Plug & Play : vous branchez, ça fonctionne</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Support VIP & Assistance WhatsApp dédiée</span>
                  </li>
                </ul>
              </div>

              <a
                href={getWhatsAppLink("Bonjour, je souhaite commander le Pack Routeur MikroTik Prêt à Brancher à 55 000 FCFA.")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02]"
              >
                <span>Commander Mon Routeur Clé en Main</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Pack 3 : Multi-Sites / Entreprise */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 uppercase">
                  Hôtels, Campus, Réseaux
                </span>
                <h3 className="text-xl font-bold text-white">Solution Multi-Sites Sur-Mesure</h3>
                <div className="text-3xl font-black text-white font-mono">Sur Devis</div>
                <p className="text-xs text-slate-400">
                  Déploiement pour plusieurs points d'accès, antennes longue portée (Ubiquiti / TP-Link Omada), résidences ou complexes hôteliers.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Gestion centralisée multi-routeurs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Audit de couverture Wi-Fi & antennes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Accompagnement & SLA garanti</span>
                  </li>
                </ul>
              </div>

              <a
                href={getWhatsAppLink("Bonjour, je souhaite un devis personnalisé pour un projet Wi-Fi multi-sites (Hôtel / Résidence / Réseau).")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
              >
                <span>Demander un Devis WhatsApp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          7. FOIRE AUX QUESTIONS (FAQ ANTI-OBJECTIONS)
      ======================================================== */}
      <section id="faq" className="py-20 bg-slate-950/60 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Des Réponses Claires</h2>
            <p className="text-3xl font-extrabold text-white tracking-tight">
              Questions Fréquentes
            </p>
          </div>

          <div className="space-y-4">
            
            {[
              {
                q: "Ai-je besoin d'une adresse IP publique fixe pour faire fonctionner le système ?",
                a: "NON ! Grâce à notre technologie exclusive de Polling Inverse Cloud, votre routeur MikroTik se connecte automatiquement à notre plateforme en arrière-plan. Cela fonctionne parfaitement avec n'importe quelle box opérateur (MTN, Moov, Orange, Starlink, Box 4G) même derrière un routeur NAT/CGNAT."
              },
              {
                q: "Comment et quand est-ce que je reçois l'argent de mes clients ?",
                a: "L'argent est crédité instantanément sur votre compte marchand FedaPay. Vous pouvez configurer des virements automatiques quotidiens ou retirer votre argent à tout moment directement vers votre numéro MTN Mobile Money, Moov Money ou votre compte bancaire."
              },
              {
                q: "Quels modèles de routeurs MikroTik sont compatibles ?",
                a: "Tous les modèles MikroTik RouterOS sont supportés (v6 et v7), du petit hAP mini / hEX (à partir de 20 000 FCFA) jusqu'aux gros CCR industriels. Si vous n'avez pas encore de routeur, nous pouvons vous fournir un pack complet prêt à l'emploi."
              },
              {
                q: "Puis-je quand même continuer à vendre des tickets papier en physique si je le souhaite ?",
                a: "Absolument ! Notre générateur de vouchers intégré vous permet d'imprimer ou de générer des tickets en lots quand vous le souhaitez. Vos clients physiques peuvent taper leur code ou scanner le QR code avec la caméra de leur smartphone."
              },
              {
                q: "Que se passe-t-il en cas de coupure Internet du quartier ?",
                a: "La page de connexion est hébergée en local sur votre routeur MikroTik. Dès que la connexion revient, les sessions reprennent automatiquement. Les clients ne subissent aucun bug d'écran blanc."
              }
            ].map((item, idx) => (
              <div 
                key={idx}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left font-bold text-sm sm:text-base text-white flex items-center justify-between gap-4"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-indigo-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}

          </div>

        </div>
      </section>

      {/* ========================================================
          8. BANNIÈRE FINALE / CALL TO ACTION
      ======================================================== */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-indigo-600 mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/20 text-white">
            <Zap className="w-8 h-8 fill-white" />
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Prêt à faire passer votre Wi-Fi Zone au niveau supérieur ?
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Discutez avec notre équipe technique sur WhatsApp. Nous répondons en 5 minutes pour analyser votre installation et lancer votre automatisation.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={getWhatsAppLink("Bonjour 2MC, je veux démarrer mon installation Wi-Fi Automatisée aujourd'hui.")}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02]"
            >
              <MessageCircle className="w-5 h-5 fill-slate-950" />
              <span>Contacter un Conseiller WhatsApp</span>
            </a>

            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>Accéder à l'Administration</span>
            </button>
          </div>

          <div className="pt-6 text-xs text-slate-400">
            <span>Téléphone direct : </span>
            <a href={`tel:${WHATSAPP_DISPLAY}`} className="text-emerald-400 font-bold hover:underline">
              {WHATSAPP_DISPLAY}
            </a>
          </div>

        </div>
      </section>

      {/* ========================================================
          9. FOOTER
      ======================================================== */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          
          <div>
            <p className="font-semibold text-slate-400">© 2026 2MC COMPANY ETS. Tous droits réservés.</p>
            <p className="text-[11px] text-slate-600 mt-1">Spécialiste de la monétisation Wi-Fi MikroTik & Solutions Telecom en Afrique.</p>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={onOpenLogin} className="hover:text-indigo-400 font-semibold transition-colors">
              Connexion Admin
            </button>
            <a href={getWhatsAppLink("Assistance 2MC SpotCloud")} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 font-semibold transition-colors">
              Support Client
            </a>
          </div>

        </div>
      </footer>

    </div>
  );
};

