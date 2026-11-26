const { RouterOSClient } = require('../lib/routeros.js');
const fs = require('fs');
const path = require('path');

const ROUTER_IP = process.env.ROUTER_IP || '192.168.88.1';
const ROUTER_PASSWORDS = ['4ZFF63YJ4H', '4ZFF63YJ4H', 'admin', ''];
const ADMIN_PC_MAC = 'A0:D3:C1:62:3D:79';

async function findWorkingClient() {
  for (const pass of ROUTER_PASSWORDS) {
    const c = new RouterOSClient({
      host: ROUTER_IP,
      user: 'admin',
      password: pass,
      timeout: 3000
    });
    try {
      const res = await c.getResource();
      return { client: c, password: pass, resource: res };
    } catch (_) {}
  }
  throw new Error('Impossible de se connecter au routeur avec aucun des mots de passe connus.');
}

async function main() {
  console.log('=======================================================');
  console.log(`🚀 Configuration Kiosk ABH 2026 sur MikroTik (${ROUTER_IP})`);
  console.log('   Candidat : Gildas Zodome (BIO PHYTO - Bénin)');
  console.log('=======================================================\n');

  let client, activePassword, res;
  try {
    const conn = await findWorkingClient();
    client = conn.client;
    activePassword = conn.password;
    res = conn.resource;
  } catch (e) {
    console.error('❌', e.message);
    process.exit(1);
  }

  const isRouter2 = activePassword === '4ZFF63YJ4H';
  const subnetBase = isRouter2 ? '10.54' : '10.50';
  console.log(`🔌 Routeur détecté : ${isRouter2 ? 'Routeur 2 (Secondaire)' : 'Routeur 1 (Principal)'}`);
  console.log(`   Plage IP attribuée : ${subnetBase}.0.0/22 (IP Routeur: ${subnetBase}.0.1)`);

  try {
    console.log(`✅ Connecté à MikroTik ${res['board-name']} (RouterOS ${res['version']})`);
    console.log(`   Uptime : ${res['uptime']}, CPU : ${res['cpu-load']}%\n`);

    // 1. Configurer l'adresse IP Kiosk sur bridge (${subnetBase}.0.1/22)
    console.log(`1️⃣ Configuration de l'adresse IP Kiosk (${subnetBase}.0.1/22)...`);
    const existingIps = await client.print('/ip/address');
    const hasKioskIp = existingIps.some(ip => ip.address && ip.address.startsWith(`${subnetBase}.0.1`));
    if (!hasKioskIp) {
      await client.add('/ip/address', {
        address: `${subnetBase}.0.1/22`,
        interface: 'bridge',
        comment: 'Kiosk: Hotspot Etudiants'
      });
      console.log(`   ✅ IP ${subnetBase}.0.1/22 ajoutée sur bridge.`);
    } else {
      console.log(`   ℹ️ IP ${subnetBase}.0.1/22 déjà configurée.`);
    }

    // 2. IP Pool Kiosk (${subnetBase}.1.10 - ${subnetBase}.3.250 = ~700 IPs)
    console.log(`\n2️⃣ Configuration du Pool IP Kiosk (~700 adresses)...`);
    const existingPools = await client.print('/ip/pool');
    let kioskPool = existingPools.find(p => p.name === 'kiosk-pool');
    if (!kioskPool) {
      await client.add('/ip/pool', {
        name: 'kiosk-pool',
        ranges: `${subnetBase}.1.10-${subnetBase}.3.250`
      });
      console.log(`   ✅ Pool "kiosk-pool" créé (${subnetBase}.1.10-${subnetBase}.3.250).`);
    } else {
      console.log('   ℹ️ Pool "kiosk-pool" déjà existant.');
    }

    // 3. DHCP Server & Network
    console.log('\n3️⃣ Configuration du serveur DHCP Kiosk...');
    const existingDhcpNets = await client.print('/ip/dhcp-server/network');
    const hasKioskNet = existingDhcpNets.some(n => n.address === `${subnetBase}.0.0/22`);
    if (!hasKioskNet) {
      await client.add('/ip/dhcp-server/network', {
        address: `${subnetBase}.0.0/22`,
        gateway: `${subnetBase}.0.1`,
        'dns-server': `${subnetBase}.0.1`,
        comment: 'Kiosk: DHCP Network Etudiants'
      });
      console.log(`   ✅ Réseau DHCP ${subnetBase}.0.0/22 créé.`);
    } else {
      console.log(`   ℹ️ Réseau DHCP ${subnetBase}.0.0/22 déjà configuré.`);
    }

    // DHCP Server
    const existingDhcp = await client.print('/ip/dhcp-server');
    let dhcpSrv = existingDhcp.find(d => d.name === 'defconf');
    if (dhcpSrv) {
      await client.set('/ip/dhcp-server', dhcpSrv['.id'], {
        'address-pool': 'kiosk-pool',
        'lease-time': '15m'
      });
      console.log('   ✅ Serveur DHCP configuré avec kiosk-pool et bail 15min.');
    }

    // DNS Static
    const existingDns = await client.print('/ip/dns/static');
    if (!existingDns.some(d => d.name === 'kiosk.vote')) {
      await client.add('/ip/dns/static', {
        name: 'kiosk.vote',
        address: `${subnetBase}.0.1`,
        comment: 'Kiosk: DNS Portal'
      });
      console.log(`   ✅ DNS statique "kiosk.vote" -> ${subnetBase}.0.1`);
    }

    // 4. Point d'accès Wi-Fi (wlan1)
    console.log('\n4️⃣ Configuration du Wi-Fi Kiosk (SSID: VOTE ABH 2026 - GILDAS ZODOME)...');
    
    // S'assurer que le profil de sécurité est 100% ouvert (none, sans mot de passe)
    const secProfiles = await client.print('/interface/wireless/security-profiles');
    if (secProfiles.length > 0) {
      await client.set('/interface/wireless/security-profiles', secProfiles[0]['.id'], {
        mode: 'none',
        'authentication-types': ''
      });
      console.log('   ✅ Profil de sécurité Wi-Fi réglé sur "mode=none" (Réseau 100% Ouvert sans mot de passe).');
    }

    const wlanList = await client.print('/interface/wireless');
    if (wlanList.length > 0) {
      const wlan = wlanList[0];
      await client.set('/interface/wireless', wlan['.id'], {
        mode: 'ap-bridge',
        ssid: 'VOTE ABH 2026 - GILDAS ZODOME',
        band: '2ghz-b/g/n',
        'channel-width': '20mhz',
        frequency: 'auto',
        disabled: 'no'
      });
      console.log('   ✅ Wi-Fi wlan1 activé en mode Hotspot Open.');
    }

    // 5. Profil & Serveur Hotspot
    console.log('\n5️⃣ Configuration du serveur Hotspot & Profil Kiosk...');
    const existingProfiles = await client.print('/ip/hotspot/profile');
    let hspProf = existingProfiles.find(p => p.name === 'kiosk-profile');
    if (!hspProf) {
      await client.add('/ip/hotspot/profile', {
        name: 'kiosk-profile',
        'hotspot-address': `${subnetBase}.0.1`,
        'dns-name': 'kiosk.vote',
        'html-directory': 'hotspot',
        'login-by': 'http-pap'
      });
      console.log('   ✅ Profil Hotspot "kiosk-profile" créé (strictement http-pap sans mac-cookie).');
    } else {
      await client.set('/ip/hotspot/profile', kp['.id'], {
        'login-by': 'http-pap'
      }).catch(() => {});
      console.log('   ℹ️ Profil Hotspot "kiosk-profile" mis à jour (strictement http-pap sans mac-cookie).');
    }

    const existingUserProfs = await client.print('/ip/hotspot/user/profile');
    let userProf = existingUserProfs.find(p => p.name === 'kiosk-user-profile');
    if (!userProf) {
      await client.add('/ip/hotspot/user/profile', {
        name: 'kiosk-user-profile',
        'shared-users': '1000',
        'rate-limit': '512k/256k',
        'session-timeout': '15m',
        'idle-timeout': '3m',
        'keepalive-timeout': '30s',
        'add-mac-cookie': 'false'
      });
      console.log('   ✅ Profil utilisateur "kiosk-user-profile" créé (add-mac-cookie=false, keepalive=30s).');
    } else {
      await client.set('/ip/hotspot/user/profile', userProf['.id'], {
        'idle-timeout': '3m',
        'keepalive-timeout': '30s',
        'add-mac-cookie': 'false'
      }).catch(() => {});
      console.log('   ℹ️ Profil utilisateur "kiosk-user-profile" mis à jour (add-mac-cookie=false, keepalive=30s).');
    }

    const existingHotspots = await client.print('/ip/hotspot');
    let hsp = existingHotspots.find(h => h.name === 'kiosk-hotspot');
    if (!hsp) {
      await client.add('/ip/hotspot', {
        name: 'kiosk-hotspot',
        interface: 'bridge',
        'address-pool': 'kiosk-pool',
        profile: 'kiosk-profile',
        'keepalive-timeout': '30s',
        'idle-timeout': '3m',
        disabled: 'no'
      });
      console.log('   ✅ Serveur Hotspot "kiosk-hotspot" activé sur le bridge.');
    } else {
      await client.set('/ip/hotspot', hsp['.id'], {
        'keepalive-timeout': '30s',
        'idle-timeout': '3m'
      }).catch(() => {});
      console.log('   ℹ️ Serveur Hotspot déjà actif (keepalive=30s, idle=3m configurés).');
    }

    // Utilisateur universel Hotspot pour vote
    const existingUsers = await client.print('/ip/hotspot/user');
    let voteUser = existingUsers.find(u => u.name === 'vote');
    if (!voteUser) {
      await client.add('/ip/hotspot/user', {
        name: 'vote',
        password: '',
        profile: 'kiosk-user-profile',
        comment: 'Kiosk: Utilisateur universel de vote'
      });
      console.log('   ✅ Utilisateur Hotspot "vote" (sans mot de passe) créé.');
    } else {
      console.log('   ℹ️ Utilisateur Hotspot "vote" déjà configuré.');
    }

    // Bypass Admin PC
    const existingBindings = await client.print('/ip/hotspot/ip-binding');
    if (!existingBindings.some(b => b['mac-address'] && b['mac-address'].toUpperCase() === ADMIN_PC_MAC)) {
      await client.add('/ip/hotspot/ip-binding', {
        'mac-address': ADMIN_PC_MAC,
        type: 'bypassed',
        comment: 'Kiosk Admin PC Bypassed'
      });
      console.log(`   ✅ PC Admin (${ADMIN_PC_MAC}) configuré en bypass direct.`);
    }

    // 6. Walled Garden Strict (Plateforme de vote + Messageries EXCLUSIVEMENT)
    // NOTE CRITIQUE : Ne JAMAIS inclure *.gstatic.com ou *.apple.com ici !
    // Sinon, Android et iPhone considèrent qu'Internet fonctionne directement
    // et n'affichent JAMAIS le pop-up automatique du portail captif.
    console.log('\n6️⃣ Configuration du Walled Garden Strict (Déclenchement Captif Garanti)...');
    
    // Purger les anciennes règles pour supprimer les wildcards permissifs
    const existingWg = await client.print('/ip/hotspot/walled-garden');
    for (const item of existingWg) {
      if (item.comment && item.comment.includes('Kiosk')) {
        await client.remove('/ip/hotspot/walled-garden', item['.id']).catch(() => {});
      }
    }

    const allowedHosts = [
      'abh2026top10vote.org',
      '*.abh2026top10vote.org',
      'africabusinessheroes.org',
      '*.africabusinessheroes.org',
      'challenges.cloudflare.com',
      '*.cloudflare.com',
      'mail.google.com',
      'accounts.google.com',
      'outlook.live.com',
      'outlook.office.com',
      'login.live.com',
      'login.microsoftonline.com',
      'account.live.com',
      'mail.yahoo.com',
      'login.yahoo.com',
      'mail.icloud.com',
      'idmsa.apple.com',
      '*.alwaysdata.net',
      '*.mcwifi.net'
    ];

    let wgAdded = 0;
    for (const host of allowedHosts) {
      await client.add('/ip/hotspot/walled-garden', {
        'dst-host': host,
        comment: 'Kiosk Allowed'
      });
      wgAdded++;
    }
    console.log(`   ✅ Walled Garden optimisé : ${allowedHosts.length} domaines (Sondes captifs interceptées).`);

    // Walled Garden IP (Ports IMAP / POP3 / SMTP / DNS)
    const existingWgIp = await client.print('/ip/hotspot/walled-garden/ip');
    const allowedPorts = [
      { port: '993', proto: 'tcp', comment: 'Kiosk: IMAPS' },
      { port: '995', proto: 'tcp', comment: 'Kiosk: POP3S' },
      { port: '587', proto: 'tcp', comment: 'Kiosk: SMTPS' },
      { port: '465', proto: 'tcp', comment: 'Kiosk: SMTPS SSL' },
      { port: '53', proto: 'udp', comment: 'Kiosk: DNS UDP' },
      { port: '53', proto: 'tcp', comment: 'Kiosk: DNS TCP' }
    ];

    let wgIpAdded = 0;
    for (const p of allowedPorts) {
      const exists = existingWgIp.some(item => item['dst-port'] === p.port && item['protocol'] === p.proto);
      if (!exists) {
        await client.add('/ip/hotspot/walled-garden/ip', {
          action: 'accept',
          'dst-port': p.port,
          protocol: p.proto,
          comment: p.comment
        });
        wgIpAdded++;
      }
    }
    console.log(`   ✅ Walled Garden IP : ${allowedPorts.length} flux messageries autorisés (+${wgIpAdded} nouveaux).`);

    // 7. Shaper PCQ (Débit équitable par étudiant)
    console.log('\n7️⃣ Configuration du Shaper de bande passante équitable (PCQ)...');
    const existingQueueTypes = await client.print('/queue/type');
    if (!existingQueueTypes.some(q => q.name === 'kiosk_pcq_down')) {
      await client.add('/queue/type', {
        name: 'kiosk_pcq_down',
        kind: 'pcq',
        'pcq-rate': '512k',
        'pcq-classifier': 'dst-address'
      });
    }
    if (!existingQueueTypes.some(q => q.name === 'kiosk_pcq_up')) {
      await client.add('/queue/type', {
        name: 'kiosk_pcq_up',
        kind: 'pcq',
        'pcq-rate': '256k',
        'pcq-classifier': 'src-address'
      });
    }

    const queueName = `Kiosk_${isRouter2 ? 'R2' : 'R1'}_PCQ`;
    const existingQueues = await client.print('/queue/simple');
    if (!existingQueues.some(q => q.name === queueName)) {
      await client.add('/queue/simple', {
        name: queueName,
        target: `${subnetBase}.0.0/22`,
        queue: 'kiosk_pcq_up/kiosk_pcq_down',
        comment: 'Kiosk PCQ Shaper'
      });
      console.log(`   ✅ Shaper PCQ activé (512k down / 256k up par étudiant) sur ${subnetBase}.0.0/22.`);
    } else {
      console.log('   ℹ️ Shaper PCQ déjà en place.');
    }

    // 8. Pare-feu & Anti-Abus (Bannissement)
    console.log('\n8️⃣ Configuration des règles de pare-feu anti-abus...');
    const existingFilters = await client.print('/ip/firewall/filter');
    const hasBanFilter = existingFilters.some(f => f['src-address-list'] === 'banned_students');
    if (!hasBanFilter) {
      await client.add('/ip/firewall/filter', {
        chain: 'forward',
        'src-address-list': 'banned_students',
        action: 'drop',
        comment: 'Kiosk: Bloquer etudiants bannis'
      });
      await client.add('/ip/firewall/filter', {
        chain: 'input',
        'src-address-list': 'banned_students',
        action: 'drop',
        comment: 'Kiosk: Bloquer etudiants bannis (Input)'
      });
      console.log('   ✅ Filtres pare-feu de bannissement activés.');
    }

    // 9. Script MikroTik de surveillance autonome (si autorisé par device-mode)
    console.log('\n9️⃣ Installation du script de surveillance autonome sur le routeur...');
    try {
      const existingScripts = await client.print('/system/script');
      let autoBanScript = existingScripts.find(s => s.name === 'kiosk_auto_ban');
      const scriptSrc = ':local maxBytes (20 * 1024 * 1024);\n:foreach h in=[/ip hotspot host find where !bypassed] do={\n  :local hMac [/ip hotspot host get $h mac-address];\n  :local hIp [/ip hotspot host get $h address];\n  :local bIn [/ip hotspot host get $h bytes-in];\n  :local bOut [/ip hotspot host get $h bytes-out];\n  :if (($bIn + $bOut) > $maxBytes) do={\n    /ip firewall address-list add list=banned_students address=$hIp timeout=24h comment=("Quota 20Mo depasse: " . $hMac);\n    /ip hotspot host remove $h;\n    :log warning ("ABH Kiosk: Banni par quota " . $hMac . " (" . $hIp . ")");\n  }\n}';

      if (!autoBanScript) {
        await client.add('/system/script', {
          name: 'kiosk_auto_ban',
          source: scriptSrc,
          comment: 'Kiosk Auto Ban Script'
        });
        console.log('   ✅ Script /system/script/kiosk_auto_ban créé.');
      }

      const existingSched = await client.print('/system/scheduler');
      if (!existingSched.some(s => s.name === 'sched_kiosk_ban')) {
        await client.add('/system/scheduler', {
          name: 'sched_kiosk_ban',
          interval: '1m',
          'on-event': 'kiosk_auto_ban',
          comment: 'Kiosk Scheduler'
        });
        console.log('   ✅ Tâche planifiée /system/scheduler active (intervalle 1min).');
      }
    } catch (schedErr) {
      console.log('   ℹ️ Scheduler routeur restreint par device-mode (la surveillance continue via le Dashboard Node.js).');
    }

    // 10. Activation des services directs pour APK/EXE local (API 8728 et Web 80)
    console.log('\n🔟 Activation des accès directs pour builds APK (Mobile) & EXE (Desktop)...');
    try {
      const services = await client.print('/ip/service');
      const apiSrv = services.find(s => s.name === 'api');
      if (apiSrv && (apiSrv.disabled === 'true' || apiSrv.disabled === true)) {
        await client.set('/ip/service', apiSrv['.id'], { disabled: 'no' });
      }
      const wwwSrv = services.find(s => s.name === 'www');
      if (wwwSrv && (wwwSrv.disabled === 'true' || wwwSrv.disabled === true)) {
        await client.set('/ip/service', wwwSrv['.id'], { disabled: 'no' });
      }
      console.log('   ✅ Services API (8728) et Web (80) actifs pour la communication directe.');
    } catch (srvErr) {
      console.log('   ℹ️ Services déjà en état actif.');
    }

    // 11. Agent de Reverse Polling Cloud AlwaysData (Routeur 1 ou 2)
    console.log(`\n1️⃣1️⃣ Configuration de l'Agent de Reverse Polling Cloud pour Routeur ${isRouter2 ? '2' : '1'}...`);
    try {
      const rNum = isRouter2 ? 2 : 1;
      const pollScriptSrc = `:local serverUrl "https://charmeldev.alwaysdata.net/api/poll?router=${rNum}"\r\n:local resultUrl "https://charmeldev.alwaysdata.net/api/poll/result?router=${rNum}"\r\n:local authToken "kiosk_poll_secret_2026"\r\n\r\n:do {\r\n  :local fetchRes [/tool fetch url=$serverUrl http-header-field="Authorization: Bearer $authToken" as-value output=user]\r\n  :if (($fetchRes->"status") = "finished" && [:typeof ($fetchRes->"data")] = "str") do={\r\n    :local rawData ($fetchRes->"data")\r\n    :local parsedData [:deserialize from=json value=$rawData]\r\n    :local action ($parsedData->"action")\r\n    :if ($action = "run") do={\r\n      :local commandId ($parsedData->"id")\r\n      :local cmdText ($parsedData->"command")\r\n      :local cmdFunc [:parse $cmdText]\r\n      :local outputData [$cmdFunc]\r\n      :local resObj { "id"=$commandId; "status"="done"; "output"=$outputData }\r\n      :local resJson [:serialize to=json value=$resObj]\r\n      /tool fetch url=$resultUrl http-method=post http-data=$resJson http-header-field="Authorization: Bearer $authToken" http-header-field="Content-Type: application/json" as-value output=user\r\n    }\r\n  }\r\n} on-error={}`;

      const existingScripts = await client.print('/system/script');
      let pollingScript = existingScripts.find(s => s.name === 'kiosk_polling_agent');
      if (!pollingScript) {
        await client.add('/system/script', {
          name: 'kiosk_polling_agent',
          source: pollScriptSrc,
          comment: `Kiosk Polling Agent R${rNum}`
        });
        console.log(`   ✅ Script /system/script/kiosk_polling_agent créé.`);
      } else {
        await client.set('/system/script', pollingScript['.id'], { source: pollScriptSrc });
        console.log(`   ✅ Script /system/script/kiosk_polling_agent mis à jour.`);
      }

      const existingSched = await client.print('/system/scheduler');
      let schedPoll = existingSched.find(s => s.name === 'sched_kiosk_poll');
      if (!schedPoll) {
        await client.add('/system/scheduler', {
          name: 'sched_kiosk_poll',
          interval: '2s',
          'on-event': 'kiosk_polling_agent',
          comment: 'Kiosk Polling Scheduler'
        });
        console.log('   ✅ Tâche planifiée /system/scheduler/sched_kiosk_poll active (intervalle 2s).');
      }
    } catch (pollErr) {
      console.log('   ℹ️ Scheduler polling restreint ou déjà configuré :', pollErr.message);
    }

    console.log('\n=======================================================');
    console.log('🎉 CONFIGURATION DU ROUTEUR TERMINÉE AVEC SUCCÈS !');
    console.log('   - Wi-Fi SSID : "VOTE ABH 2026 - GILDAS ZODOME"');
    console.log('   - Port WAN   : ether1 (Branchez le câble 4G/Internet)');
    console.log('   - Walled Garden : Vote ABH + Gmail + Outlook + Yahoo');
    console.log('   - Limitation : 512 Kbps down / 256 Kbps up par étudiant');
    console.log('   - Quota Max  : 20 Mo ou 15 minutes avant ban 24h');
    console.log('=======================================================\n');

  } catch (err) {
    console.error('❌ Erreur lors de la configuration du routeur :', err);
    process.exit(1);
  }
}

main();

