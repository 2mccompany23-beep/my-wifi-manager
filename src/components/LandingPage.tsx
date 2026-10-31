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
  ChevronDown,
  RotateCcw,
  Radio,
  Cpu,
  Network,
  Check,
  Sparkles,
  Sliders,
  Power,
  Menu,
  X
} from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  // Menu mobile responsive
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Contact commercial WhatsApp
  const WHATSAPP_CONTACT = '2290144044414';
  const WHATSAPP_DISPLAY = '+229 01 44 04 44 14';

  const getWhatsAppLink = (message: string) => {
    return `https://wa.me/${WHATSAPP_CONTACT}?text=${encodeURIComponent(message)}`;
  };

  // ========================================================
  // SIMULATEUR INTERACTIF EN DIRECT (EXPÉRIENCE CLIENT & ADMIN)
  // ========================================================
  const [simPlan, setSimPlan] = useState<'100' | '200' | '500'>('200');
  const [simOperator, setSimOperator] = useState<'mtn' | 'moov' | 'celtiis'>('mtn');
  const [simStep, setSimStep] = useState<'select' | 'ussd' | 'success'>('select');
  const [simVoucherCode, setSimVoucherCode] = useState<string>('V-8392');
  const [simAdminAlert, setSimAdminAlert] = useState(false);
  const [simTodayRevenue, setSimTodayRevenue] = useState(24600);

  const handleSimulatePayment = () => {
    setSimStep('ussd');
    setTimeout(() => {
      const generatedCode = 'V-' + Math.floor(1000 + Math.random() * 9000);
      setSimVoucherCode(generatedCode);
      setSimStep('success');
      setSimAdminAlert(true);
      setSimTodayRevenue(prev => prev + parseInt(simPlan));
      setTimeout(() => setSimAdminAlert(false), 8000);
    }, 1800);
  };

  const handleResetSim = () => {
    setSimStep('select');
  };

  // ========================================================
  // CALCULATEUR DE RENTABILITÉ DE TERRAIN
  // ========================================================
  const [dailyUsers, setDailyUsers] = useState<number>(45);
  const [avgTicketPrice, setAvgTicketPrice] = useState<number>(200);

  const monthlyGross = dailyUsers * avgTicketPrice * 30;
  const yearlyGross = monthlyGross * 12;
  const internetCostMonthly = 25000; // estimation fibre/starlink
  const netMonthlyProfit = Math.max(0, monthlyGross - internetCostMonthly);

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 font-sans selection:bg-emerald-500 selection:text-black overflow-x-hidden">
      
      {/* Texture de fond technique discrète (grille réseau) */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.035] z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      ></div>

      {/* ========================================================
          1. HEADER / NAVIGATION BAR (STICKY & RESPONSIVE MOBILE)
      ======================================================== */}
      <header className="sticky top-0 z-50 bg-[#080c14]/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between relative z-10">
          
          {/* Brand & Hardware Tag */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 border border-emerald-500/40 p-2 flex items-center justify-center shadow-lg shadow-emerald-500/10 shrink-0">
              <Network className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-heading font-black tracking-tight text-white">2MC SpotCloud</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-bold tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  ROUTEROS v7
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-mono text-slate-400 hidden xs:block">Automate Wi-Fi Zone & Mobile Money</p>
            </div>
          </div>

          {/* Desktop Nav Items — Exactement 3 liens épurés */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-heading font-bold text-slate-300 uppercase tracking-wider">
            <a href="#demo-live" className="hover:text-emerald-400 transition-colors">Démo</a>
            <a href="#architecture" className="hover:text-emerald-400 transition-colors">Installation</a>
            <a href="#tarifs" className="hover:text-emerald-400 transition-colors">Tarifs</a>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden sm:flex items-center gap-2.5">
            <button
              onClick={onOpenLogin}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition-all hover:border-slate-500 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Espace Admin</span>
            </button>

            <a
              href={getWhatsAppLink("Bonjour, je souhaite commander un pack MikroTik 2MC SpotCloud prêt à l'emploi.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-slate-950" />
              <span>WhatsApp Commercial</span>
            </a>
          </div>

          {/* Mobile Right Controls: Hamburger + Quick Login */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={onOpenLogin}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-xs flex items-center justify-center cursor-pointer"
              title="Espace Admin"
            >
              <Lock className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Drawer Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-800 bg-[#080c14] px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 shadow-2xl">
            <nav className="flex flex-col space-y-2 text-sm font-heading font-bold text-slate-200">
              <a
                href="#demo-live"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl hover:bg-slate-900 flex items-center justify-between text-slate-200 hover:text-emerald-400 transition-colors"
              >
                <span>Démo Interactive en Direct</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </a>
              <a
                href="#architecture"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl hover:bg-slate-900 flex items-center justify-between text-slate-200 hover:text-emerald-400 transition-colors"
              >
                <span>Schéma d'Installation Réseau</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </a>
              <a
                href="#tarifs"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl hover:bg-slate-900 flex items-center justify-between text-slate-200 hover:text-emerald-400 transition-colors"
              >
                <span>Tarifs & Packs Routeur</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </a>
            </nav>

            <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Accéder à l'Espace Admin</span>
              </button>

              <a
                href={getWhatsAppLink("Bonjour, je souhaite commander un pack MikroTik 2MC SpotCloud prêt à l'emploi.")}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer text-center"
              >
                <MessageCircle className="w-4 h-4 fill-slate-950" />
                <span>Commander sur WhatsApp ({WHATSAPP_DISPLAY})</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================
          2. HERO SECTION — VENTE DIRECTE SANS LANGUE DE BOIS
      ======================================================== */}
      <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Colonne Gauche : Pitch & Preuves de confiance */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              {/* Badge Opérateurs Compatibles */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>MTN MoMo • Moov Money • Celtiis Cash • Wave</span>
              </div>

              {/* Titre Principal percutant */}
              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-heading font-black text-white tracking-tight leading-[1.18]">
                Arrêtez de vendre des tickets Wi-Fi en papier. <br className="hidden sm:inline" />
                <span className="text-emerald-400 underline decoration-emerald-500/50 underline-offset-8">
                  Encaissez automatiquement par Mobile Money 24h/24.
                </span>
              </h1>

              {/* Explication concrète du problème / solution */}
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                Vos clients se connectent au Wi-Fi, choisissent leur forfait (100F, 200F, 500F), valident leur code secret MoMo sur leur propre téléphone et sont connectés en <strong>3 secondes</strong>.
                <span className="block mt-2 text-slate-400 text-sm">
                  Zéro présence physique requise. L'argent arrive directement sur votre compte. Votre routeur MikroTik gère tout en autonomie totale, même la nuit.
                </span>
              </p>

              {/* Badges de Réassurance Concrets */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono text-slate-300">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> 100% Autonome
                  </div>
                  <p className="text-[11px] text-slate-400">Pas besoin d'ordinateur allumé</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Tout Fournisseur
                  </div>
                  <p className="text-[11px] text-slate-400">Starlink, Fibre, Box 4G/5G</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Zéro Fraude
                  </div>
                  <p className="text-[11px] text-slate-400">Fini les vols de caisse gérants</p>
                </div>
              </div>

              {/* Boutons d'Action Directe */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <a
                  href="#tarifs"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <span>Commander un Routeur Clé en Main</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href="#demo-live"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  <span>Tester le Parcours Client ci-dessous</span>
                </a>
              </div>

            </div>

            {/* Colonne Droite : Fiche Technique Matériel MikroTik Réel */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl space-y-4">
                
                {/* Header Matériel */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <span>MikroTik RouterBOARD RB951Ui-2HnD</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    ONLINE 24/7
                  </span>
                </div>

                {/* Ports physiques simulés */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">État des Interfaces Ethernet :</div>
                  <div className="grid grid-cols-5 gap-1.5 font-mono text-[10px] text-center">
                    <div className="p-2 rounded bg-slate-950 border border-emerald-500/40 text-emerald-400">
                      <div className="font-bold">E1 (WAN)</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">Starlink/Box</div>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-emerald-500/40 text-emerald-400">
                      <div className="font-bold">E2 (LAN)</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">Antenne CPE</div>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-500">
                      <div className="font-bold">E3</div>
                      <div className="text-[9px] text-slate-600 mt-0.5">Libre</div>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-500">
                      <div className="font-bold">E4</div>
                      <div className="text-[9px] text-slate-600 mt-0.5">Libre</div>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-500">
                      <div className="font-bold">E5 (PoE)</div>
                      <div className="text-[9px] text-slate-600 mt-0.5">Libre</div>
                    </div>
                  </div>
                </div>

                {/* Métriques Live réelles */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="text-slate-500 text-[10px]">Consommation électrique</div>
                    <div className="text-white font-bold text-sm mt-0.5">~3.5 Watts (0.3 A)</div>
                    <div className="text-[10px] text-emerald-400">Moins qu'une ampoule LED</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="text-slate-500 text-[10px]">Autonomie après coupure</div>
                    <div className="text-white font-bold text-sm mt-0.5">Redémarrage 15s</div>
                    <div className="text-[10px] text-emerald-400">Zéro perte de données</div>
                  </div>
                </div>

                {/* Callout Commercial */}
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
                  <span>
                    Vous n'avez aucune configuration à faire. Nous vous expédions le boîtier <strong>100% prêt à brancher</strong>.
                  </span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          3. DÉMONSTRATION INTERACTIVE : VIVEZ L'EXPÉRIENCE EN DIRECT
      ======================================================== */}
      <section id="demo-live" className="py-20 bg-slate-950 border-b border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Expérience Interactive en Direct
            </span>
            <h2 className="text-2xl sm:text-4xl font-heading font-black text-white">
              Testez le parcours exact de vos clients et de votre cockpit
            </h2>
            <p className="text-sm text-slate-400">
              Cliquez ci-dessous pour simuler un achat de ticket en 3 étapes et observez la réaction immédiate du dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
            
            {/* Écran 1 : Le Smartphone du Client sur le Portail (mcwifi.net) */}
            <div className="lg:col-span-5 bg-slate-900 border-2 border-slate-700 rounded-3xl p-4 shadow-2xl relative">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono text-slate-400 mb-4 px-1">
                <span className="flex items-center gap-1.5 text-white">
                  <Smartphone className="w-4 h-4 text-emerald-400" /> Smartphone Client
                </span>
                <span className="text-[11px] text-emerald-400">http://mcwifi.net</span>
              </div>

              {/* Étape 1 : Choix du forfait */}
              {simStep === 'select' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="text-center py-2">
                    <h3 className="font-bold text-white text-base">Bienvenue sur le Wi-Fi</h3>
                    <p className="text-xs text-slate-400">Choisissez votre forfait pour naviguer :</p>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setSimPlan('100')}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        simPlan === '100' ? 'bg-emerald-500/15 border-emerald-500 text-white font-bold' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-left">
                        <div className="text-xs">Pass Rapide • 2 Heures</div>
                        <div className="text-[10px] text-slate-400">Vitesse : 5 Mbps</div>
                      </div>
                      <div className="text-sm font-mono text-emerald-400 font-bold">100 FCFA</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSimPlan('200')}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        simPlan === '200' ? 'bg-emerald-500/15 border-emerald-500 text-white font-bold' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-left">
                        <div className="text-xs">Pass Journée • 24 Heures</div>
                        <div className="text-[10px] text-emerald-400 font-semibold">Le Plus Populaire</div>
                      </div>
                      <div className="text-sm font-mono text-emerald-400 font-bold">200 FCFA</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSimPlan('500')}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        simPlan === '500' ? 'bg-emerald-500/15 border-emerald-500 text-white font-bold' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-left">
                        <div className="text-xs">Pass Illimité • 3 Jours</div>
                        <div className="text-[10px] text-slate-400">Streaming HD & Téléchargement</div>
                      </div>
                      <div className="text-sm font-mono text-emerald-400 font-bold">500 FCFA</div>
                    </button>
                  </div>

                  {/* Choix de l'opérateur */}
                  <div className="pt-2">
                    <label className="text-[11px] font-mono text-slate-400 block mb-1.5">Payer avec :</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSimOperator('mtn')}
                        className={`p-2 rounded-lg border text-center text-xs font-bold transition-all cursor-pointer ${
                          simOperator === 'mtn' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        MTN MoMo
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimOperator('moov')}
                        className={`p-2 rounded-lg border text-center text-xs font-bold transition-all cursor-pointer ${
                          simOperator === 'moov' ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        Moov Money
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimOperator('celtiis')}
                        className={`p-2 rounded-lg border text-center text-xs font-bold transition-all cursor-pointer ${
                          simOperator === 'celtiis' ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        Celtiis Cash
                      </button>
                    </div>
                  </div>

                  {/* Bouton de déclenchement */}
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer mt-2"
                  >
                    <span>Valider et Payer {simPlan} FCFA</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Étape 2 : Invite USSD sur le téléphone */}
              {simStep === 'ussd' && (
                <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center animate-pulse">
                    <Smartphone className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-base">Invite USSD Envoyée</h4>
                    <p className="text-xs text-amber-300 font-mono">
                      « Paiement de {simPlan} FCFA pour 2MC SpotCloud. Tapez votre code secret. »
                    </p>
                  </div>
                  <div className="inline-block px-3 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 animate-pulse">
                    En attente de validation opérateur...
                  </div>
                </div>
              )}

              {/* Étape 3 : Paiement validé & Connexion Immédiate */}
              {simStep === 'success' && (
                <div className="py-4 text-center space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-white text-base">Paiement Confirmé !</h4>
                    <p className="text-xs text-slate-300">Votre routeur MikroTik vous a connecté automatiquement :</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-1">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Votre Code Voucher Attribué</div>
                    <div className="text-xl font-mono font-black text-emerald-400 tracking-wider">{simVoucherCode}</div>
                    <div className="text-[11px] text-slate-400">Statut : <span className="text-emerald-400 font-bold">Actif • Session démarrée</span></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetSim}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Recommencer la simulation client</span>
                  </button>
                </div>
              )}

            </div>

            {/* Écran 2 : Ce que le Propriétaire voit en direct sur son Dashboard */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-2 text-white font-bold">
                  <Cpu className="w-4 h-4 text-indigo-400" /> Cockpit Administrateur 2MC SpotCloud (Votre Téléphone)
                </span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  SYNCHRONISÉ EN TEMPS RÉEL
                </span>
              </div>

              {/* Notification Flash dès qu'une vente passe */}
              {simAdminAlert && (
                <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs flex items-center justify-between animate-in slide-in-from-top duration-300 shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
                    <div>
                      <strong>NOUVEL ENCAISSEMENT : +{simPlan} FCFA !</strong>
                      <div className="text-[11px] text-slate-300">
                        Opérateur : {simOperator.toUpperCase()} • Code ticket {simVoucherCode} activé sur le routeur
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">À l'instant</span>
                </div>
              )}

              {/* Métriques du Dashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-500 text-[10px] uppercase">Revenus Aujourd'hui</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {simTodayRevenue.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">F</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Encaissement automatique</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-500 text-[10px] uppercase">Sessions Actives</div>
                  <div className="text-2xl font-black text-white mt-1">
                    {simStep === 'success' ? '17' : '16'} <span className="text-xs font-normal text-slate-400">users</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Contrôle bande passante</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-500 text-[10px] uppercase">Routeur MikroTik</div>
                  <div className="text-sm font-bold text-white mt-2 truncate">RB951Ui • 7.23.2</div>
                  <div className="text-[10px] text-emerald-400 mt-1 font-bold">Signal Polling : 2s</div>
                </div>

              </div>

              {/* Journal des dernières ventes en direct */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                  Dernières Transactions Enregistrées :
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  {simStep === 'success' && (
                    <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-300 animate-in fade-in">
                      <span>{simVoucherCode} • {simPlan} FCFA ({simOperator.toUpperCase()})</span>
                      <span className="text-[10px] text-emerald-400 font-bold">EN LIGNE MAINTENANT</span>
                    </div>
                  )}

                  <div className="p-2 rounded bg-slate-900 border border-slate-800/80 flex items-center justify-between text-slate-300">
                    <span>V-4821 • 200 FCFA (MTN MoMo)</span>
                    <span className="text-[10px] text-slate-500">Il y a 14 min</span>
                  </div>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800/80 flex items-center justify-between text-slate-300">
                    <span>V-1092 • 100 FCFA (Moov Money)</span>
                    <span className="text-[10px] text-slate-500">Il y a 32 min</span>
                  </div>
                </div>
              </div>

              {/* Bouton pour ouvrir la vraie interface */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tester le vrai dashboard avec le compte Démo Invité</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          4. ARCHITECTURE RÉSEAU CONCRÈTE ("COMMENT ÇA SE BRANCHE ?")
      ======================================================== */}
      <section id="architecture" className="py-20 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
              Installation Plug & Play
            </span>
            <h2 className="text-2xl sm:text-4xl font-heading font-black text-white">
              Comment le système se branche chez vous en 5 minutes
            </h2>
            <p className="text-sm text-slate-400">
              Vous n'avez pas besoin d'être ingénieur télécom. Le routeur arrive déjà configuré et prêt à l'emploi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch relative">
            
            {/* Étape 1 */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-black flex items-center justify-center text-sm">
                01
              </div>
              <h3 className="font-bold text-white text-base">Votre Box Internet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                N'importe quelle connexion : <strong>Starlink</strong>, <strong>Box Fibre</strong> (Canalbox, Moov, MTN), ou <strong>Modem 4G/5G</strong>.
              </p>
              <div className="text-[11px] font-mono text-emerald-400">Sortie : Câble Ethernet RJ45</div>
            </div>

            {/* Étape 2 */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-black flex items-center justify-center text-sm">
                02
              </div>
              <h3 className="font-bold text-white text-base">Routeur MikroTik 2MC</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Vous branchez le câble sur le <strong>Port 1</strong>. Le routeur prend le contrôle du trafic, gère le portail captif et filtre les accès.
              </p>
              <div className="text-[11px] font-mono text-emerald-400">Totalement autonome (3 Watts)</div>
            </div>

            {/* Étape 3 */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-black flex items-center justify-center text-sm">
                03
              </div>
              <h3 className="font-bold text-white text-base">Diffusion Wi-Fi</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Le Wi-Fi intégré diffuse dans votre local (restaurant/bar), ou vous branchez une <strong>antenne extérieure longue portée</strong> (TP-Link CPE, Ubiquiti) sur le Port 2.
              </p>
              <div className="text-[11px] font-mono text-emerald-400">Portée : 50m à 500m selon antenne</div>
            </div>

            {/* Étape 4 */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-black flex items-center justify-center text-sm">
                04
              </div>
              <h3 className="font-bold text-white text-base">Vos Sous sur votre Mobile</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chaque fois qu'un client paie, les fonds sont crédités sur votre compte FedaPay / MoMo. Vous recevez un virement direct.
              </p>
              <div className="text-[11px] font-mono text-emerald-400">Zéro intermédiaire • Zéro perte</div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          5. 4 CAS D'USAGE RÉELS DU TERRAIN (AFRIQUE DE L'OUEST)
      ======================================================== */}
      <section id="terrains" className="py-20 bg-slate-950 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Applications Pratiques
            </span>
            <h2 className="text-2xl sm:text-4xl font-heading font-black text-white">
              Déjà rentabilisé dans 4 types d'établissements
            </h2>
            <p className="text-sm text-slate-400">
              Découvrez comment nos clients utilisent 2MC SpotCloud au quotidien :
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Cas 1 : Wi-Fi Zone de Quartier */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded bg-slate-800 text-[11px] font-mono text-emerald-400 font-bold uppercase">
                  Quartier Résidentiel / Carrefour
                </span>
                <span className="text-xs font-mono text-slate-500">60 à 150 clients/jour</span>
              </div>
              <h3 className="text-lg font-bold text-white">La Wi-Fi Zone de Quartier Automatisée</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Vous installez une antenne extérieure sur votre toit. Les jeunes et étudiants du quartier achètent leurs forfaits de 100 F ou 200 F depuis leur lit.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-300">
                <strong className="text-emerald-400">Gain terrain :</strong> Plus besoin de rester assis sous un parasol à vendre des tickets papier. Les ventes continuent à minuit et 3h du matin.
              </div>
            </div>

            {/* Cas 2 : Restaurant, Maquis & Lounge Bar */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded bg-slate-800 text-[11px] font-mono text-emerald-400 font-bold uppercase">
                  Lounge, Bar & Restauration
                </span>
                <span className="text-xs font-mono text-slate-500">Fini les squatteurs</span>
              </div>
              <h3 className="text-lg font-bold text-white">Restaurants, Maquis & Cafés</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Fini les clients qui s'assoient, commandent une eau minérale et monopolisent le mot de passe Wi-Fi pour toute leur bande d'amis.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-300">
                <strong className="text-emerald-400">Gain terrain :</strong> Chaque client paie 100 F pour 2h ou reçoit un code temporisé. Le Wi-Fi rembourse entièrement votre facture fibre chaque mois.
              </div>
            </div>

            {/* Cas 3 : Hôtels, Auberges & Résidences Meublées */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded bg-slate-800 text-[11px] font-mono text-emerald-400 font-bold uppercase">
                  Hôtellerie & Airbnb
                </span>
                <span className="text-xs font-mono text-slate-500">Connexion Pro & Bridée</span>
              </div>
              <h3 className="text-lg font-bold text-white">Hôtels & Résidences Meublées</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Quand vous donnez le mot de passe de la box, un seul client téléchargeant un gros fichier sature la connexion de tout l'établissement.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-300">
                <strong className="text-emerald-400">Gain terrain :</strong> 2MC SpotCloud bride le débit par appareil (ex: 5 Mbps max par client) : tout le monde a un streaming fluide sans ralentissement.
              </div>
            </div>

            {/* Cas 4 : Cybercafés & Espaces de Coworking */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded bg-slate-800 text-[11px] font-mono text-emerald-400 font-bold uppercase">
                  Bureaux & Cybercafé
                </span>
                <span className="text-xs font-mono text-slate-500">Zéro Litige</span>
              </div>
              <h3 className="text-lg font-bold text-white">Espaces Coworking & Bureaux</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Comptabilisation du temps à la seconde près. Le chronomètre ne démarre que quand le client se connecte réellement pour la première fois.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-300">
                <strong className="text-emerald-400">Gain terrain :</strong> Zéro contestation d'heures ou de minutes. Déconnexion automatique dès que le forfait expire.
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          6. CALCULATEUR DE RENTABILITÉ RÉALISTE
      ======================================================== */}
      <section id="simulateur" className="py-20 border-b border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-10 shadow-2xl space-y-8">
            
            <div className="text-center space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Calculateur Financier Réaliste
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-white">
                Simulez vos revenus mensuels nets
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Ajustez selon le nombre de clients quotidiens dans votre zone :
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
              
              {/* Sliders */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-slate-300">Clients / Tickets par jour :</span>
                    <span className="text-emerald-400 font-bold text-base">{dailyUsers} clients</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={dailyUsers}
                    onChange={(e) => setDailyUsers(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>10/jour</span>
                    <span>100/jour</span>
                    <span>200/jour</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-slate-300">Prix moyen du ticket :</span>
                    <span className="text-emerald-400 font-bold text-base">{avgTicketPrice} FCFA</span>
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
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>100 F</span>
                    <span>500 F</span>
                    <span>1 000 F</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400">
                  💡 Déduction estimée de l'abonnement internet (Fibre/Starlink) : <span className="text-slate-200">25 000 FCFA / mois</span>
                </div>
              </div>

              {/* Résultat Calculé */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-emerald-500/30 text-center space-y-4">
                <div>
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Chiffre d'Affaires Brut Mensuel</span>
                  <div className="text-3xl font-mono font-black text-white mt-1">
                    {monthlyGross.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">FCFA</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block font-bold">Bénéfice Net dans votre poche / mois</span>
                  <div className="text-3xl font-mono font-black text-emerald-400 mt-1">
                    +{netMonthlyProfit.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">FCFA</span>
                  </div>
                </div>

                <a
                  href={getWhatsAppLink(`Bonjour 2MC, d'après mon calcul je peux générer environ ${monthlyGross.toLocaleString('fr-FR')} FCFA par mois. Je souhaite commander mon équipement.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <MessageCircle className="w-4 h-4 fill-slate-950" />
                  <span>Démarrer avec ce potentiel</span>
                </a>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          7. GRILLE TARIFAIRE & PACKS DE DÉPLOIEMENT
      ======================================================== */}
      <section id="tarifs" className="py-20 bg-slate-950 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
              Formules & Branding Sur-Mesure
            </span>
            <h2 className="text-2xl sm:text-4xl font-heading font-black text-white">
              Investissement Rentabilisé Dès le 1er Mois
            </h2>
            <p className="text-sm text-slate-400">
              Sans abonnement mensuel obligatoire. Matériel de qualité industrielle, identité visuelle personnalisée et propriétaire à vie.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            
            {/* Formule 1 : Vous avez déjà un MikroTik */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="px-2.5 py-1 rounded bg-slate-800 text-[10px] font-mono text-slate-300 uppercase font-bold">
                  Vous avez déjà votre matériel
                </span>
                <h3 className="text-lg font-bold text-white">Pack Licence & Portail Captif Custom</h3>
                <div className="text-2xl font-black text-white font-mono">35 000 <span className="text-xs font-normal text-slate-400">FCFA (1 fois)</span></div>
                <p className="text-xs text-slate-400">
                  Idéal si vous possédez déjà un routeur MikroTik. Nos ingénieurs prennent la main à distance pour tout configurer et habiller votre portail.
                </p>

                <ul className="space-y-2 text-xs text-slate-300 pt-2 font-mono">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Configuration RouterOS v7 complète à distance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Confection d'un portail captif personnalisé</strong> (votre logo, vos tarifs, vos couleurs)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Intégration Mobile Money FedaPay directe</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Accès au Dashboard 2MC SpotCloud</span>
                  </li>
                </ul>
              </div>

              <a
                href={getWhatsAppLink("Bonjour, j'ai déjà un routeur MikroTik et je souhaite commander le Pack Licence & Portail Captif Customisé à 35 000 FCFA.")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700 cursor-pointer"
              >
                <span>Commander ce pack</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Formule 2 : Routeur Clé en Main Recommandé */}
            <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6 relative shadow-2xl shadow-emerald-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-mono font-black uppercase tracking-wider">
                PACK ROUTEUR + BRANDING COMPLET (RECOMMANDÉ)
              </div>

              <div className="space-y-4 pt-1">
                <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-[10px] font-mono text-emerald-400 uppercase font-bold">
                  Routeur Neuf + Branding Visuel + Logiciel
                </span>
                <h3 className="text-lg font-bold text-white">Routeur Clé en Main & Studio Graphique</h3>
                <div className="text-3xl font-black text-emerald-400 font-mono">75 000 <span className="text-xs font-normal text-slate-400">FCFA (1 fois)</span></div>
                <p className="text-xs text-slate-300">
                  La solution clé en main intégrale : vous recevez un routeur MikroTik neuf, avec votre propre identité visuelle créée de A à Z.
                </p>

                <ul className="space-y-2 text-xs text-slate-200 pt-2 font-mono">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Routeur MikroTik physique neuf inclus & garanti</strong> (valeur 35 000 à 40 000 FCFA)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Création de votre Identité Visuelle</strong> : logo de votre Wi-Fi Zone + kit affiches & stickers QR Code prêts à imprimer</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Confection sur-mesure de votre Portail de Connexion</strong> brandé à 100% à votre nom</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Système 2MC SpotCloud pré-installé et testé en atelier</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Plug & Play : vous branchez sur votre box et encaissez en 2 minutes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Support VIP & Assistance WhatsApp directe 7j/7</span>
                  </li>
                </ul>
              </div>

              <a
                href={getWhatsAppLink("Bonjour, je souhaite commander le Pack Routeur Clé en Main & Identité Visuelle à 75 000 FCFA.")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01] cursor-pointer"
              >
                <span>Commander Mon Pack Clé en Main</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Formule 3 : Multi-Sites / Entreprise / Marque Blanche */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="px-2.5 py-1 rounded bg-slate-800 text-[10px] font-mono text-slate-300 uppercase font-bold">
                  Hôtels, Complexes & Franchises
                </span>
                <h3 className="text-lg font-bold text-white">Marque Blanche Totale & Multi-Sites</h3>
                <div className="text-2xl font-black text-white font-mono">Sur Devis <span className="text-xs font-normal text-slate-400">(Dès 150 000 F)</span></div>
                <p className="text-xs text-slate-400">
                  Pour les établissements haut de gamme, hôtels et chaînes exigeant une application et un réseau 100% à leurs couleurs.
                </p>

                <ul className="space-y-2 text-xs text-slate-300 pt-2 font-mono">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Customisation Complète de l'App (Marque Blanche)</strong> : Votre logo, vos couleurs, votre domaine web exclusif</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Portail captif multi-sites unifié pour plusieurs établissements</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Déploiement multi-antennes longue portée (Ubiquiti / TP-Link Omada)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Audit de couverture Wi-Fi & bridage de bande passante par chambre</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Support dédié 24h/24 & Contrat de maintenance SLA prioritaire</span>
                  </li>
                </ul>
              </div>

              <a
                href={getWhatsAppLink("Bonjour, je souhaite un devis personnalisé pour un projet Marque Blanche Totale / Hôtellerie Multi-Sites.")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700 cursor-pointer"
              >
                <span>Demander un Devis Sur-Mesure</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          8. FOIRE AUX QUESTIONS DIRECTE (ANTI-OBJECTIONS)
      ======================================================== */}
      <section id="faq" className="py-20 border-b border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
              Questions Directes
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-white">
              Tout ce que vous devez savoir avant de commander
            </h2>
          </div>

          <div className="space-y-3">
            
            {[
              {
                q: "Est-ce que je dois laisser un ordinateur allumé chez moi pour que ça marche ?",
                a: "Absolument PAS. Le routeur MikroTik est un mini-ordinateur autonome de qualité industrielle. Il gère le portail captif, la coupure des sessions et les paiements tout seul. Il consomme seulement 3.5 Watts (moins qu'une ampoule) et fonctionne 24h/24 sans écran ni clavier."
              },
              {
                q: "Que se passe-t-il en cas de coupure d'électricité (délestage) ?",
                a: "Dès que le courant revient, le routeur redémarre tout seul en 15 secondes. Toutes les sessions, les tickets vendus et l'argent restent intacts. Vous pouvez également brancher le MikroTik sur un mini-onduleur 12V (routeur UPS) pour qu'il reste allumé 6 à 8 heures sans courant !"
              },
              {
                q: "Comment et quand est-ce que je reçois mon argent ?",
                a: "Les paiements passent par la passerelle agréée FedaPay. Chaque paiement validé est crédité directement sur votre solde. Vous pouvez transférer votre argent vers votre propre compte MTN MoMo, Moov Money ou compte bancaire à tout moment."
              },
              {
                q: "Est-ce compatible avec ma connexion Starlink ou ma box 4G ?",
                a: "Oui, à 100%. Grâce à notre technologie de Polling Cloud, le système fonctionne sur n'importe quel fournisseur d'accès (Starlink, CanalBox, Moov Fibre, MTN, modem 4G) sans avoir besoin d'adresse IP publique fixe ni d'ouverture de ports compliquée."
              },
              {
                q: "Comment puis-je modifier les prix des forfaits ou mon numéro WhatsApp ?",
                a: "Directement depuis votre téléphone sur votre tableau de bord sécurisé 2MC SpotCloud. Vous pouvez changer vos prix, vos profils de vitesse ou votre numéro WhatsApp d'un simple clic."
              }
            ].map((faq, idx) => (
              <div 
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-white hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${activeFaq === idx ? 'rotate-180 text-emerald-400' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}

          </div>

        </div>
      </section>

      {/* ========================================================
          9. FOOTER & CONTACT ENTREPRISE
      ======================================================== */}
      <footer className="py-12 bg-[#060910] text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-emerald-500/40 flex items-center justify-center">
                <Network className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">2MC SpotCloud 2.0</div>
                <div className="text-[11px] font-mono text-slate-500">Solutions Hotspot MikroTik & Mobile Money en Afrique</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 font-mono text-xs">
              <a href="#demo-live" className="hover:text-emerald-400 transition-colors">Démo Interactive</a>
              <a href="#tarifs" className="hover:text-emerald-400 transition-colors">Commander un Routeur</a>
              <button onClick={onOpenLogin} className="hover:text-emerald-400 transition-colors cursor-pointer">
                Connexion Administrateur
              </button>
              <a 
                href={getWhatsAppLink("Bonjour 2MC, je souhaite échanger avec votre support.")} 
                target="_blank" 
                rel="noreferrer" 
                className="text-emerald-400 font-bold hover:underline"
              >
                WhatsApp : {WHATSAPP_DISPLAY}
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-600">
            <p>© 2026 2MC COMPANY ETS. Tous droits réservés.</p>
            <p className="font-mono">RouteurOS v7.23.2 • FedaPay Live Gateway • mcwifi.net</p>
          </div>

        </div>
      </footer>

    </div>
  );
};
