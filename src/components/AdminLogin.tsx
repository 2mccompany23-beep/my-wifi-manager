import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, KeyRound, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (token: string, username: string, rememberMe?: boolean) => void;
  onBack?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Identifiants administrateur incorrects');
      } else if (data.token) {
        onLoginSuccess(data.token, data.username || username, rememberMe);
      }
    } catch (err) {
      setErrorMsg('Erreur de connexion au serveur d\'authentification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    setUsername('demo');
    setPassword('demo');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'demo', password: 'demo' })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Erreur de connexion au compte démo');
      } else if (data.token) {
        onLoginSuccess(data.token, 'demo');
      }
    } catch (err) {
      setErrorMsg('Erreur de connexion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decorative Glowing Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>

      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl shadow-indigo-500/10 relative z-10 space-y-6">
        
        {/* Brand Badge */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Accès Administrateur
          </h2>
          <p className="text-xs text-slate-400">
            2MC SpotCloud 2.0 • Plateforme Hotspot MikroTik (RB951Ui)
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Nom d'utilisateur Admin</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: admin"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Mot de passe Master Admin</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-10 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Case Se souvenir de moi (30 jours) */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-300 hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer accent-emerald-500"
              />
              <span>Se souvenir de moi sur ce téléphone <span className="text-emerald-400 font-mono font-bold">(30 jours)</span></span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 mt-6"
          >
            {isSubmitting ? (
              <span>Vérification...</span>
            ) : (
              <>
                <span>Connexion Au Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Démo 1-Clic pour les clients / prospects */}
          <div className="pt-2 space-y-2">
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Test Client / Démonstration</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 hover:from-emerald-500/25 hover:to-teal-500/25 text-emerald-300 hover:text-white border border-emerald-500/30 font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span>Tester le Dashboard (Compte Démo Invité)</span>
            </button>
            <p className="text-[10px] text-slate-500 text-center">
              Identifiants pour vos clients : <span className="font-mono text-emerald-400 font-semibold">demo</span> / <span className="font-mono text-emerald-400 font-semibold">demo</span>
            </p>
          </div>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs transition-all border border-slate-700/60 flex items-center justify-center gap-2 mt-2"
            >
              <span>← Retour à la présentation 2MC SpotCloud</span>
            </button>
          )}

        </form>

        <div className="pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500">
          <p>🔒 Session sécurisée avec jetons d'authentification uniques.</p>
        </div>

      </div>

    </div>
  );
};
