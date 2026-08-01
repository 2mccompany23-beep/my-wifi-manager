import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, RefreshCw, Lock, Server, Key, Activity, Copy } from 'lucide-react';
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
  const [pollDiag, setPollDiag] = useState<{ pollingActive: boolean; lastPollSecAgo: number | null; pendingQueueSize: number } | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('mikhmon_token');
    fetch('/api/settings', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch((err) => console.error('Failed to load settings:', err));

    const checkPollStatus = () => {
      fetch('/api/poll/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => setPollDiag(data))
        .catch(() => {});
    };

    checkPollStatus();
    const interval = setInterval(checkPollStatus, 3000);
    return () => clearInterval(interval);
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

        {/* Live Polling Status Banner */}
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-all ${
          pollDiag?.pollingActive
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full shrink-0 ${pollDiag?.pollingActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'}`}></div>
            <div>
              <div className="font-bold text-sm text-white">
                {pollDiag?.pollingActive ? '🟢 Polling Inverse Actif & Connecté' : '🟡 Polling Inactif (En attente du routeur)'}
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                {pollDiag?.pollingActive
                  ? `Le routeur MikroTik communique en direct avec AlwaysData. Dernier signal reçu il y a ${pollDiag.lastPollSecAgo ?? 0}s.`
                  : 'Le serveur AlwaysData attend que votre script MikroTik exécute sa première interrogation HTTP GET vers /api/poll.'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono shrink-0 bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-400">File d'attente : </span>
              <span className="font-bold text-white">{pollDiag?.pendingQueueSize ?? 0} cmd</span>
            </div>
            <span className="text-slate-700">|</span>
            <div>
              <span className="text-slate-400">Signal : </span>
              <span className="font-bold text-emerald-400">
                {pollDiag?.lastPollSecAgo !== null && pollDiag?.lastPollSecAgo !== undefined ? `${pollDiag.lastPollSecAgo}s` : 'Aucun'}
              </span>
            </div>
          </div>
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

            {/* Polling / CGNAT Section */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <span>Mode de Connexion (Contournement CGNAT / Polling Inverse)</span>
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Sélectionnez le mode de liaison entre AlwaysData et votre routeur MikroTik.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <label
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    (settings.connectionMode || 'auto') === 'auto'
                      ? 'bg-indigo-600/10 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">Automatique (Recommandé)</span>
                    <input
                      type="radio"
                      name="connectionMode"
                      value="auto"
                      checked={(settings.connectionMode || 'auto') === 'auto'}
                      onChange={() => setSettings({ ...settings, connectionMode: 'auto' })}
                      className="accent-indigo-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Essaie la connexion TCP directe ; si bloqué par CGNAT, bascule sur le Polling.
                  </p>
                </label>

                <label
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    settings.connectionMode === 'polling'
                      ? 'bg-emerald-600/10 border-emerald-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">Polling Uniquement</span>
                    <input
                      type="radio"
                      name="connectionMode"
                      value="polling"
                      checked={settings.connectionMode === 'polling'}
                      onChange={() => setSettings({ ...settings, connectionMode: 'polling' })}
                      className="accent-emerald-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Le routeur interroge AlwaysData toutes les 5s (Option 2 sans VPN/VPS).
                  </p>
                </label>

                <label
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    settings.connectionMode === 'direct'
                      ? 'bg-purple-600/10 border-purple-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">Direct TCP Seul</span>
                    <input
                      type="radio"
                      name="connectionMode"
                      value="direct"
                      checked={settings.connectionMode === 'direct'}
                      onChange={() => setSettings({ ...settings, connectionMode: 'direct' })}
                      className="accent-purple-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Connexion REST (80/443) ou Winbox (8728) directe avec IP Publique/Port Forwarding.
                  </p>
                </label>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Jeton de Sécurité Polling (Bearer Token)</label>
                <input
                  type="text"
                  value={settings.pollSecretToken || 'mcwifi_secret_token_2026'}
                  onChange={(e) => setSettings({ ...settings, pollSecretToken: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Ce token sécurise les requêtes de votre routeur MikroTik vers AlwaysData.
                </p>
              </div>

              {/* MikroTik RouterOS Script Generator Box */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-300">Script RouterOS v7 Prêt pour Winbox (System -&gt; Scripts)</span>
                  <button
                    type="button"
                    onClick={() => {
                      const origin = window.location.origin;
                      const token = settings.pollSecretToken || 'mcwifi_secret_token_2026';
                      const script = `# Agent Polling AlwaysData (RouterOS v7)
:local serverUrl "${origin}/api/poll"
:local resultUrl "${origin}/api/poll/result"
:local authToken "${token}"

:do {
  :local fetchRes [/tool fetch url=$serverUrl http-header-field="Authorization: Bearer $authToken" as-value output=user]
  :if (($fetchRes->"status") = "finished" && [:typeof ($fetchRes->"data")] = "str") do={
    :local rawData ($fetchRes->"data")
    :local parsedData [:deserialize from=json value=$rawData]
    :local action ($parsedData->"action")
    :if ($action = "run") do={
      :local commandId ($parsedData->"id")
      :local cmdText ($parsedData->"command")
      :local cmdFunc [:parse $cmdText]
      :local outputData [$cmdFunc]
      :local resObj { "id"=$commandId; "status"="done"; "output"=$outputData }
      :local resJson [:serialize to=json value=$resObj]
      /tool fetch url=$resultUrl http-method=post http-data=$resJson http-header-field="Authorization: Bearer $authToken" http-header-field="Content-Type: application/json" as-value output=user
    }
  }
} on-error={}`;
                      navigator.clipboard.writeText(script);
                      alert('✅ Script RouterOS copié dans le presse-papier !');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30 flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copier le Script RouterOS</span>
                  </button>
                </div>

                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap max-h-36">
{`# Agent Polling AlwaysData (RouterOS v7)
:local serverUrl "${typeof window !== 'undefined' ? window.location.origin : 'https://2mc.alwaysdata.net'}/api/poll"
:local resultUrl "${typeof window !== 'undefined' ? window.location.origin : 'https://2mc.alwaysdata.net'}/api/poll/result"
:local authToken "${settings.pollSecretToken || 'mcwifi_secret_token_2026'}"

:do {
  :local fetchRes [/tool fetch url=$serverUrl http-header-field="Authorization: Bearer $authToken" as-value output=user]
  :if (($fetchRes->"status") = "finished" && [:typeof ($fetchRes->"data")] = "str") do={
    :local rawData ($fetchRes->"data")
    :local parsedData [:deserialize from=json value=$rawData]
    :local action ($parsedData->"action")
    :if ($action = "run") do={
      :local commandId ($parsedData->"id")
      :local cmdText ($parsedData->"command")
      :local cmdFunc [:parse $cmdText]
      :local outputData [$cmdFunc]
      :local resObj { "id"=$commandId; "status"="done"; "output"=$outputData }
      :local resJson [:serialize to=json value=$resObj]
      /tool fetch url=$resultUrl http-method=post http-data=$resJson http-header-field="Authorization: Bearer $authToken" http-header-field="Content-Type: application/json" as-value output=user
    }
  }
} on-error={}`}
                </pre>
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
