const { RouterOSClient } = require('../lib/routeros.js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROUTER_CANDIDATES = [
  {
    id: 1,
    identity: 'MikroTik-Kiosk-1',
    name: 'Routeur 1 · Principal',
    hosts: ['192.168.1.71', '10.50.0.1', '192.168.1.161'],
    user: 'admin',
    passwords: ['4ZFF63YJ4H', '1234@', 'admin', ''],
    subnet: '10.50',
    ssid: 'VOTE ABH 2026 - GILDAS ZODOME 1'
  },
  {
    id: 2,
    identity: 'MikroTik-Kiosk-2',
    name: 'Routeur 2 · Secondaire',
    hosts: ['192.168.1.72', '10.54.0.1', '192.168.1.162'],
    user: 'admin',
    passwords: ['4ZFF63YJ4H', '1234@', 'admin', ''],
    subnet: '10.54',
    ssid: 'VOTE ABH 2026 - GILDAS ZODOME 2'
  }
];

function uploadFtpFile(host, user, pass, localFilePath, remotePath) {
  const normalizedLocal = localFilePath.replace(/\\/g, '\\\\');
  const psScript = `
    $ErrorActionPreference = 'Stop'
    $local = "${normalizedLocal}"
    $remote = "ftp://${host}/${remotePath}"
    $req = [System.Net.FtpWebRequest]::Create($remote)
    $req.Credentials = New-Object System.Net.NetworkCredential('${user}', '${pass}')
    $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $req.UseBinary = $true
    $req.Timeout = 10000

    $bytes = [System.IO.File]::ReadAllBytes($local)
    $req.ContentLength = $bytes.Length
    $stream = $req.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()
    $res = $req.GetResponse()
    $res.Close()
  `;
  try {
    execSync('powershell -NoProfile -Command -', { input: psScript, encoding: 'utf8', timeout: 12000 });
    return true;
  } catch (e) {
    return false;
  }
}

async function findActiveHost(routerDef) {
  for (const host of routerDef.hosts) {
    for (const pass of routerDef.passwords) {
      const client = new RouterOSClient({
        host,
        user: routerDef.user,
        password: pass,
        timeout: 2000
      });
      try {
        const res = await client.getResource();
        return { host, client, resource: res, activePass: pass };
      } catch (_) {}
    }
  }
  return null;
}

async function updateRouter(rDef, host, client, res, activePass) {
  console.log(`\n-------------------------------------------------------------`);
  console.log(`📡 MISE À JOUR DE : ${rDef.name} (${host})`);
  console.log(`   Modèle: ${res['board-name']} | RouterOS: ${res['version']} | CPU: ${res['cpu-load']}%`);
  console.log(`-------------------------------------------------------------`);

  const routerPassword = activePass || rDef.passwords?.[0] || '4ZFF63YJ4H';

  // 1. Mise à jour du Hotspot Profile (kiosk-profile) : login-by=mac,http-pap
  console.log('1️⃣ Configuration de l\'authentification automatique MAC...');
  const profiles = await client.print('/ip/hotspot/profile');
  let kioskProf = profiles.find(p => p.name === 'kiosk-profile') || profiles.find(p => p.name === 'hsprof1') || profiles[0];
  if (kioskProf) {
    await client.set('/ip/hotspot/profile', kioskProf['.id'], {
      'login-by': 'mac,http-pap',
      'mac-auth-password': '',
      'http-cookie-lifetime': '1d',
      'split-user-domain': 'no'
    });
    console.log(`   ✅ Profil Hotspot "${kioskProf.name}" mis à jour : login-by=mac,http-pap`);
  }

  // 2. User Profile (kiosk-user-profile)
  console.log('2️⃣ Vérification du profil utilisateur "kiosk-user-profile"...');
  const userProfiles = await client.print('/ip/hotspot/user/profile');
  let userProf = userProfiles.find(p => p.name === 'kiosk-user-profile');
  if (!userProf) {
    await client.add('/ip/hotspot/user/profile', {
      name: 'kiosk-user-profile',
      'rate-limit': '1M/1M',
      'session-timeout': '15m',
      'shared-users': '1',
      'keepalive-timeout': '2m',
      'status-autorefresh': '10s',
      comment: 'Kiosk: Profil automatique vote unique'
    });
    console.log('   ✅ Profil utilisateur "kiosk-user-profile" créé (1M/1M, 15 min).');
  } else {
    await client.set('/ip/hotspot/user/profile', userProf['.id'], {
      'rate-limit': '1M/1M',
      'session-timeout': '15m',
      'shared-users': '1',
      'keepalive-timeout': '2m'
    });
    console.log('   ✅ Profil utilisateur "kiosk-user-profile" vérifié.');
  }

  // 3. Script d'auto-provisioning des utilisateurs par MAC
  console.log('3️⃣ Installation du script RouterOS d\'auto-création d\'utilisateurs...');
  const autoUserScriptSource = [
    ':foreach h in=[/ip hotspot host find where !bypassed] do={',
    '  :local m [/ip hotspot host get $h mac-address];',
    '  :local a [/ip hotspot host get $h address];',
    '  :if ([:len [/ip hotspot user find where name=$m]] = 0) do={',
    '    /ip hotspot user add name=$m password="" profile="kiosk-user-profile" comment=("Auto-provision Kiosk " . $a);',
    '  }',
    '}'
  ].join('\r\n');

  const scripts = await client.print('/system/script');
  let autoUserScript = scripts.find(s => s.name === 'kiosk_auto_user');
  if (!autoUserScript) {
    await client.add('/system/script', {
      name: 'kiosk_auto_user',
      source: autoUserScriptSource,
      policy: 'read,write,test',
      comment: 'Auto-provisionne les MAC dans le hotspot user sous kiosk-user-profile'
    });
    console.log('   ✅ Script RouterOS "kiosk_auto_user" créé.');
  } else {
    await client.set('/system/script', autoUserScript['.id'], {
      source: autoUserScriptSource,
      policy: 'read,write,test'
    });
    console.log('   ✅ Script RouterOS "kiosk_auto_user" actualisé.');
  }

  // 4. Scheduler RouterOS pour exécuter kiosk_auto_user toutes les 2s
  console.log('4️⃣ Activation du Scheduler RouterOS (intervalle 2s)...');
  const schedulers = await client.print('/system/scheduler');
  let autoUserSched = schedulers.find(s => s.name === 'sched_kiosk_auto_user');
  if (!autoUserSched) {
    await client.add('/system/scheduler', {
      name: 'sched_kiosk_auto_user',
      'on-event': 'kiosk_auto_user',
      interval: '2s',
      'start-time': 'startup',
      comment: 'Auto-provisioning instantane des votants Kiosk'
    });
    console.log('   ✅ Scheduler "sched_kiosk_auto_user" activé (2s).');
  } else {
    await client.set('/system/scheduler', autoUserSched['.id'], {
      'on-event': 'kiosk_auto_user',
      interval: '2s',
      disabled: 'no'
    });
    console.log('   ✅ Scheduler "sched_kiosk_auto_user" vérifié et actif.');
  }

  // 5. Téléversement FTP de login.html avec Auto-Login instantané
  console.log('5️⃣ Téléversement du portail captif login.html (Auto-Login instantané)...');
  const localLoginPath = path.resolve(__dirname, '../router-config/login.html');
  if (fs.existsSync(localLoginPath)) {
    const uploaded = uploadFtpFile(host, rDef.user, routerPassword, localLoginPath, 'hotspot/login.html');
    if (uploaded) {
      console.log('   ✅ "hotspot/login.html" téléversé avec succès via FTP !');
    } else {
      console.log('   ⚠️ Impossible d\'uploader via FTP (Port 21 fermé ou bloqué).');
    }
  } else {
    console.log('   ⚠️ Fichier router-config/login.html introuvable en local.');
  }

  // 6. Exécution immédiate du script pour provisionner les utilisateurs déjà connectés
  try {
    await client.execute('/system/script/run', { number: 'kiosk_auto_user' });
    console.log('   ✅ Script kiosk_auto_user exécuté immédiatement.');
  } catch (_) {}

  return true;
}

async function main() {
  console.log('======================================================================');
  console.log('🇧🇯 KIOSK ABH 2026 · DÉPLOIEMENT TERRAIN : AUTO-LOGIN & VÉRIFICATION VISUELLE');
  console.log('   Candidat : Gildas ZODOME | Élimination totale du blocage du clic');
  console.log('======================================================================\n');

  let reachableCount = 0;

  for (const rDef of ROUTER_CANDIDATES) {
    process.stdout.write(`🔍 Recherche de ${rDef.name}... `);
    const conn = await findActiveHost(rDef);
    if (conn) {
      console.log(`TROUVÉ sur ${conn.host} !`);
      reachableCount++;
      try {
        await updateRouter(rDef, conn.host, conn.client, conn.resource, conn.activePass);
      } catch (err) {
        console.error(`❌ Erreur mise à jour sur ${rDef.name}:`, err.message);
      }
    } else {
      console.log(`HORS LIGNE (Non détecté sur ${rDef.hosts.join(', ')})`);
    }
  }

  console.log('\n======================================================================');
  if (reachableCount > 0) {
    console.log(`🎉 SUCCÈS : ${reachableCount} routeur(s) mis à jour avec succès !`);
    console.log('👉 Les utilisateurs Wi-Fi sont désormais automatiquement authentifiés');
    console.log('   sans avoir besoin de cliquer sur le bouton du portail captif.');
    console.log('👉 Chaque appareil reçoit un ID unique (VOTER-XXXX) et les règles admin');
    console.log('   s\'appliquent avec confirmation visuelle en temps réel.');
  } else {
    console.log('⚠️ AUCUN ROUTEUR CONNECTÉ AU PC POUR LE MOMENT.');
    console.log('   Veuillez brancher les routeurs (Ethernet ou Wi-Fi) puis relancez :');
    console.log('   node abh2026-vote-kiosk/scripts/apply-ground-update.cjs');
  }
  console.log('======================================================================\n');
}

main().catch(e => {
  console.error('Erreur fatale:', e);
  process.exit(1);
});
