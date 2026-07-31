import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, RefreshCw, Lock, Server, Key } from 'lucide-react';
import { AppSettings } from '../types';

interface RouterSettingsProps {
  onRefresh: () => void;
}

export const RouterSettings: React.FC<RouterSettingsProps> = ({ onRefresh }) => {
  const [settings, setSettings] = useState<AppSettings>({
    routerIp: '10.0.0.254',
    routerPort: '80',
    routerUser: 'admin',
    routerPass: '',
    fedapayPublicKey: 'pk_live_jYf2mjUa0Y_wHn4DWBDNseMm',
    fedapaySecretKey: '',
    fedapayEnv: 'live',
    dnsName: 'mcwifi.net'
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('mikhmon_token');
    fetch('/api/settings', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch((err) => console.error('Failed to load settings:', err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const token = sessionStorage.getItem('mikhmon_token');
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      onRefresh();
    } catch (err) {
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestResult('Test en cours...');
    const token = sessionStorage.getItem('mikhmon_token');
    try {
      const res = await fetch('/api/router/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.online) {
        setTestResult(`✅ Connecté à MikroTik ${data.boardName} (v${data.version}) - CPU: ${data.cpuLoad}%`);
      } else {
        setTestResult(`⚠️ Impossible de se connecter: ${data.error || 'Routeur non joint'}`);
      }
    } catch (err) {
      setTestResult('❌ Erreur de communication.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Paramètres Connexion RB951Ui & FedaPay</h3>
              <p className="text-xs text-slate-400">
                Configurez l'adresse de votre MikroTik et vos clés FedaPay Live/Sandbox
              </p>
            </div>
          </div>
          
          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 font-semibold text-xs border border-emerald-500/20">
              <CheckCircle className="w-4 h-4" />
              <span>Paramètres enregistrés !</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6 text-xs">
          
          {/* MikroTik Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Server className="w-4 h-4" />
              <span>Configuration MikroTik RouterOS v7.23.2</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Adresse IP / Hôte Routeur</label>
                <input
                  type="text"
                  value={settings.routerIp}
                  onChange={(e) => setSettings({ ...settings, routerIp: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Port HTTP / REST API</label>
                <input
                  type="text"
                  value={settings.routerPort}
                  onChange={(e) => setSettings({ ...settings, routerPort: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nom d'utilisateur Admin</label>
                <input
                  type="text"
                  value={settings.routerUser}
                  onChange={(e) => setSettings({ ...settings, routerUser: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Mot de passe Admin</label>
                <input
                  type="password"
                  value={settings.routerPass}
                  onChange={(e) => setSettings({ ...settings, routerPass: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* FedaPay Section */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-purple-400 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Key className="w-4 h-4" />
              <span>Clés API FedaPay Gateway (Mobile Money MTN, Moov, Orange, Wave)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Clé Publique FedaPay (Public Key)</label>
                <input
                  type="text"
                  value={settings.fedapayPublicKey}
                  onChange={(e) => setSettings({ ...settings, fedapayPublicKey: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Clé Secrète FedaPay (Secret Key)</label>
                <input
                  type="password"
                  value={settings.fedapaySecretKey}
                  onChange={(e) => setSettings({ ...settings, fedapaySecretKey: e.target.value })}
                  placeholder="sk_live_..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Master Admin Password Change Section */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Lock className="w-4 h-4" />
              <span>Sécurité Accès Administrateur (Changer le mot de passe Master Admin)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Mot de passe actuel</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  id="currentAdminPass"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nouveau mot de passe administrateur</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  id="newAdminPass"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                const currentPassword = (document.getElementById('currentAdminPass') as HTMLInputElement)?.value;
                const newPassword = (document.getElementById('newAdminPass') as HTMLInputElement)?.value;
                if (!currentPassword || !newPassword) {
                  alert('Veuillez remplir les deux champs de mot de passe');
                  return;
                }
                const token = sessionStorage.getItem('mikhmon_token');
                try {
                  const res = await fetch('/api/auth/change-password', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ currentPassword, newPassword })
                  });
                  const data = await res.json();
                  if (!res.ok || data.error) {
                    alert(data.error || 'Erreur lors du changement de mot de passe');
                  } else {
                    alert('✅ Mot de passe Administrateur mis à jour avec succès !');
                    (document.getElementById('currentAdminPass') as HTMLInputElement).value = '';
                    (document.getElementById('newAdminPass') as HTMLInputElement).value = '';
                  }
                } catch (e) {
                  alert('Erreur réseau');
                }
              }}
              className="px-4 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 font-semibold border border-amber-500/30 transition-colors text-xs"
            >
              Modifier Le Mot de Passe Master Admin
            </button>
          </div>

          {/* Test & Submit Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleTestConnection}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors border border-slate-700 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-indigo-400" />
              <span>Tester Connexion MikroTik</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer Les Enseignements</span>
            </button>
          </div>

          {testResult && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs">
              {testResult}
            </div>
          )}

        </form>

      </div>

    </div>
  );
};
