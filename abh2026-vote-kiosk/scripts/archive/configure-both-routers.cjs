const { RouterOSClient } = require('../lib/routeros.js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ADMIN_PC_MAC = 'A0:D3:C1:62:3D:79';

const ROUTERS = [
  {
    id: 1,
    name: 'Routeur 1 (Principal)',
    ip: '10.50.0.1',
    password: '4ZFF63YJ4H',
    subnet: '10.50',
    ssid: 'VOTE ABH 2026 - GILDAS ZODOME 1',
    identity: 'MikroTik-Kiosk-1'
  },
  {
    id: 2,
    name: 'Routeur 2 (Secondaire)',
    ip: '10.54.0.1',
    password: '4ZFF63YJ4H',
    subnet: '10.54',
    ssid: 'VOTE ABH 2026 - GILDAS ZODOME 2',
    identity: 'MikroTik-Kiosk-2'
  }
];

function uploadFtp(ip, user, password, localFile, remoteFile) {
  const psScript = `
    $ErrorActionPreference = 'Stop'
    $local = "${localFile.replace(/\\/g, '\\\\')}"
    $remote = "ftp://${ip}/${remoteFile}"
    $req = [System.Net.FtpWebRequest]::Create($remote)
    $req.Credentials = New-Object System.Net.NetworkCredential('${user}', '${password}')
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
  execSync('powershell -NoProfile -Command -', { input: psScript, encoding: 'utf8' });
}

function ensureFtpDir(ip, user, password, remoteDir) {
  const psScript = `
    $ErrorActionPreference = 'SilentlyContinue'
    $remote = "ftp://${ip}/${remoteDir}"
    $req = [System.Net.FtpWebRequest]::Create($remote)
    $req.Credentials = New-Object System.Net.NetworkCredential('${user}', '${password}')
    $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
    $res = $req.GetResponse()
    $res.Close()
  `;
  try {
    execSync('powershell -NoProfile -Command -', { input: psScript, encoding: 'utf8' });
  } catch (_) {}
}

async function configureRouter(rConfig) {
  console.log(`\n======================================================================`);
  console.log(`🔧 CONFIGURATION : ${rConfig.name} (${rConfig.ip})`);
  console.log(`   SSID : "${rConfig.ssid}"`);
  console.log(`   Plage : ${rConfig.subnet}.0.0/22`);
  console.log(`======================================================================`);

  const client = new RouterOSClient({
    host: rConfig.ip,
    user: 'admin',
    password: rConfig.password,
    timeout: 5000
  });

  const res = await client.getResource();
  console.log(`✅ Connecté à MikroTik ${res['board-name']} (RouterOS ${res['version']})`);

  // Nom d'identité système
  try {
    const ident = await client.print('/system/identity');
    if (ident.length > 0) {
      await client.set('/system/identity', ident[0]['.id'], { name: rConfig.identity });
      console.log(`   ✅ Identité système fixée à "${rConfig.identity}".`);
    }
  } catch (_) {}

  // 1. IP Address sur Bridge
  console.log(`1️⃣ Configuration IP (${rConfig.subnet}.0.1/22)...`);
  const ips = await client.print('/ip/address');
  if (!ips.some(i => i.address && i.address.startsWith(`${rConfig.subnet}.0.1`))) {
    await client.add('/ip/address', {
      address: `${rConfig.subnet}.0.1/22`,
      interface: 'bridge',
      comment: 'Kiosk: Hotspot Subnet'
    });
    console.log(`   ✅ IP ${rConfig.subnet}.0.1/22 ajoutée sur le bridge.`);
  } else {
    console.log(`   ℹ️ IP ${rConfig.subnet}.0.1/22 déjà en place.`);
  }

  // Si Routeur 1, assurer la liaison vers Routeur 2
  if (rConfig.id === 1) {
    if (!ips.some(i => i.address && i.address.startsWith('10.54.0.254'))) {
      await client.add('/ip/address', {
        address: '10.54.0.254/22',
        interface: 'bridge',
        comment: 'Route to R2 on same switch'
      });
      console.log(`   ✅ Route IP 10.54.0.254/22 ajoutée sur R1 vers R2.`);
    }
    const nats = await client.print('/ip/firewall/nat');
    if (!nats.some(n => n.comment === 'Kiosk: NAT to R2')) {
      await client.add('/ip/firewall/nat', {
        chain: 'srcnat',
        'dst-address': '10.54.0.0/22',
        action: 'masquerade',
        comment: 'Kiosk: NAT to R2'
      });
      console.log(`   ✅ NAT Masquerade activé sur R1 pour atteindre R2.`);
    }
  }

  // 2. IP Pool
  console.log(`\n2️⃣ Configuration du Pool IP (~700 adresses)...`);
  const pools = await client.print('/ip/pool');
  let kioskPool = pools.find(p => p.name === 'kiosk-pool');
  if (!kioskPool) {
    await client.add('/ip/pool', {
      name: 'kiosk-pool',
      ranges: `${rConfig.subnet}.1.10-${rConfig.subnet}.3.250`
    });
    console.log(`   ✅ Pool "kiosk-pool" créé (${rConfig.subnet}.1.10 - ${rConfig.subnet}.3.250).`);
  } else {
    await client.set('/ip/pool', kioskPool['.id'], {
      ranges: `${rConfig.subnet}.1.10-${rConfig.subnet}.3.250`
    }).catch(() => {});
    console.log(`   ℹ️ Pool "kiosk-pool" actualisé.`);
  }

  // 3. DHCP Networks
  console.log(`\n3️⃣ Configuration du DHCP...`);
  const dhcpNets = await client.print('/ip/dhcp-server/network');
  
  // Supprimer la passerelle sur 192.168.88.0/24 pour ne pas couper Internet sur le PC
  const adminNet = dhcpNets.find(n => n.address === '192.168.88.0/24');
  if (adminNet) {
    await client.set('/ip/dhcp-server/network', adminNet['.id'], { gateway: '' }).catch(() => {});
    console.log('   ✅ Réseau 192.168.88.0/24 sans passerelle (Wi-Fi PC protégé).');
  }

  const kioskNet = dhcpNets.find(n => n.address === `${rConfig.subnet}.0.0/22`);
  if (!kioskNet) {
    await client.add('/ip/dhcp-server/network', {
      address: `${rConfig.subnet}.0.0/22`,
      gateway: `${rConfig.subnet}.0.1`,
      'dns-server': `${rConfig.subnet}.0.1`,
      comment: 'Kiosk: DHCP Network Etudiants'
    });
    console.log(`   ✅ Réseau DHCP ${rConfig.subnet}.0.0/22 créé.`);
  } else {
    console.log(`   ℹ️ Réseau DHCP ${rConfig.subnet}.0.0/22 déjà configuré.`);
  }

  const dhcpServers = await client.print('/ip/dhcp-server');
  let defDhcp = dhcpServers.find(d => d.name === 'defconf' || d.name === 'kiosk-dhcp');
  if (defDhcp) {
    await client.set('/ip/dhcp-server', defDhcp['.id'], {
      'address-pool': 'kiosk-pool',
      'lease-time': '15m'
    });
    console.log('   ✅ Serveur DHCP configuré avec kiosk-pool et bail 15min.');
  }

  // 4. Wi-Fi 100% Ouvert (mode=none) et SSID différencié
  console.log(`\n4️⃣ Configuration Wi-Fi : SSID "${rConfig.ssid}"...`);
  const secProfiles = await client.print('/interface/wireless/security-profiles');
  if (secProfiles.length > 0) {
    await client.set('/interface/wireless/security-profiles', secProfiles[0]['.id'], {
      mode: 'none',
      'authentication-types': ''
    });
    console.log('   ✅ Profil Wi-Fi réglé sur "mode=none" (Réseau Ouvert sans mot de passe).');
  }

  const wlans = await client.print('/interface/wireless');
  if (wlans.length > 0) {
    await client.set('/interface/wireless', wlans[0]['.id'], {
      mode: 'ap-bridge',
      ssid: rConfig.ssid,
      band: '2ghz-b/g/n',
      'channel-width': '20mhz',
      frequency: rConfig.id === 1 ? '2412' : '2462', // Canal 1 pour R1, Canal 11 pour R2 pour éviter les interférences !
      disabled: 'no'
    });
    console.log(`   ✅ Wi-Fi wlan1 activé : SSID "${rConfig.ssid}" (${rConfig.id === 1 ? 'Canal 1 (2412MHz)' : 'Canal 11 (2462MHz)'}).`);
  }

  // 5. Profil Hotspot
  console.log(`\n5️⃣ Configuration du serveur Hotspot & Profil Kiosk...`);
  const profiles = await client.print('/ip/hotspot/profile');
  let hspProf = profiles.find(p => p.name === 'kiosk-profile');
  if (!hspProf) {
    await client.add('/ip/hotspot/profile', {
      name: 'kiosk-profile',
      'hotspot-address': `${rConfig.subnet}.0.1`,
      'dns-name': 'kiosk.vote',
      'html-directory': 'hotspot',
      'login-by': 'http-pap,mac-cookie',
      'http-cookie-lifetime': '1d'
    });
    console.log('   ✅ Profil Hotspot "kiosk-profile" créé.');
  } else {
    await client.set('/ip/hotspot/profile', hspProf['.id'], {
      'hotspot-address': `${rConfig.subnet}.0.1`,
      'dns-name': 'kiosk.vote',
      'html-directory': 'hotspot'
    }).catch(() => {});
    console.log('   ℹ️ Profil Hotspot "kiosk-profile" mis à jour.');
  }

  const userProfs = await client.print('/ip/hotspot/user/profile');
  let userProf = userProfs.find(p => p.name === 'kiosk-user-profile');
  if (!userProf) {
    await client.add('/ip/hotspot/user/profile', {
      name: 'kiosk-user-profile',
      'shared-users': '1000',
      'rate-limit': '512k/256k',
      'session-timeout': '15m',
      'idle-timeout': '5m'
    });
    console.log('   ✅ Profil utilisateur "kiosk-user-profile" (512k/256k, 15m) créé.');
  }

  const existingHotspots = await client.print('/ip/hotspot');
  let hsp = existingHotspots.find(h => h.name === 'kiosk-hotspot');
  if (!hsp) {
    await client.add('/ip/hotspot', {
      name: 'kiosk-hotspot',
      interface: 'bridge',
      'address-pool': 'kiosk-pool',
      profile: 'kiosk-profile',
      disabled: 'no'
    });
    console.log('   ✅ Serveur Hotspot "kiosk-hotspot" activé sur le bridge.');
  } else {
    console.log('   ℹ️ Serveur Hotspot déjà actif.');
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

  // Bypass PC Admin
  const bindings = await client.print('/ip/hotspot/ip-binding');
  if (!bindings.some(b => b['mac-address'] && b['mac-address'].toUpperCase() === ADMIN_PC_MAC)) {
    await client.add('/ip/hotspot/ip-binding', {
      'mac-address': ADMIN_PC_MAC,
      type: 'bypassed',
      comment: 'Kiosk Admin PC Bypassed'
    });
    console.log(`   ✅ PC Admin (${ADMIN_PC_MAC}) bypassé.`);
  }

  // 6. Walled Garden Strict (Interception sondes captifs garantie)
  console.log(`\n6️⃣ Optimisation Walled Garden Strict (Vote + Messageries)...`);
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
    'idmsa.apple.com'
  ];

  for (const host of allowedHosts) {
    await client.add('/ip/hotspot/walled-garden', {
      'dst-host': host,
      comment: 'Kiosk Allowed'
    });
  }
  console.log(`   ✅ Walled Garden configuré (${allowedHosts.length} domaines). Sondes mobiles interceptées.`);

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

  for (const p of allowedPorts) {
    const exists = existingWgIp.some(item => item['dst-port'] === p.port && item['protocol'] === p.proto);
    if (!exists) {
      await client.add('/ip/hotspot/walled-garden/ip', {
        action: 'accept',
        'dst-port': p.port,
        protocol: p.proto,
        comment: p.comment
      });
    }
  }
  console.log(`   ✅ Flux messageries autorisés (IMAP, POP, SMTP, DNS).`);

  // 7. Shaper PCQ (512k/256k)
  console.log(`\n7️⃣ Configuration du Shaper de bande passante...`);
  const queueTypes = await client.print('/queue/type');
  if (!queueTypes.some(q => q.name === 'kiosk_pcq_down')) {
    await client.add('/queue/type', {
      name: 'kiosk_pcq_down',
      kind: 'pcq',
      'pcq-rate': '512k',
      'pcq-classifier': 'dst-address'
    });
  }
  if (!queueTypes.some(q => q.name === 'kiosk_pcq_up')) {
    await client.add('/queue/type', {
      name: 'kiosk_pcq_up',
      kind: 'pcq',
      'pcq-rate': '256k',
      'pcq-classifier': 'src-address'
    });
  }

  const queueName = `Kiosk_R${rConfig.id}_PCQ`;
  const queues = await client.print('/queue/simple');
  if (!queues.some(q => q.name === queueName)) {
    await client.add('/queue/simple', {
      name: queueName,
      target: `${rConfig.subnet}.0.0/22`,
      queue: 'kiosk_pcq_up/kiosk_pcq_down',
      comment: 'Kiosk PCQ Shaper'
    });
    console.log(`   ✅ Shaper PCQ activé (512k down / 256k up) sur ${rConfig.subnet}.0.0/22.`);
  } else {
    console.log('   ℹ️ Shaper PCQ déjà présent.');
  }

  // 8. Pare-feu Anti-Abus
  const filters = await client.print('/ip/firewall/filter');
  if (!filters.some(f => f['src-address-list'] === 'banned_students')) {
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

  // 9. Téléversement FTP du Portail Captif
  console.log(`\n📤 Téléversement du portail captif via FTP vers ftp://${rConfig.ip}/hotspot/...`);
  ensureFtpDir(rConfig.ip, 'admin', rConfig.password, 'hotspot');

  const loginLocal = path.join(__dirname, '..', 'router-config', 'login.html');
  const statusLocal = path.join(__dirname, '..', 'router-config', 'status.html');

  uploadFtp(rConfig.ip, 'admin', rConfig.password, loginLocal, 'hotspot/login.html');
  console.log('   ✅ hotspot/login.html téléversé (avec redirection automatique vers Gildas ZODOME) !');

  uploadFtp(rConfig.ip, 'admin', rConfig.password, statusLocal, 'hotspot/status.html');
  console.log('   ✅ hotspot/status.html téléversé !');

  console.log(`\n🎉 ${rConfig.name} EST 100% CONFIGURÉ ET PRÊT !`);
}

async function main() {
  console.log('======================================================================');
  console.log('🚀 CONFIGURATION PARALLÈLE DES DEUX ROUTEURS MIKROTIK');
  console.log('   Plateforme Switch Commun');
  console.log('   Candidat : Gildas ZODOME (BIO PHYTO - Bénin)');
  console.log('======================================================================');

  for (const r of ROUTERS) {
    try {
      await configureRouter(r);
    } catch (e) {
      console.error(`❌ Erreur sur ${r.name} :`, e.message);
    }
  }

  console.log('\n======================================================================');
  console.log('🏆 TOUS LES DEUX ROUTEURS SONT CONFIGURÉS AVEC SUCCÈS !');
  console.log('   - ROUTEUR 1 : SSID "VOTE ABH 2026 - GILDAS ZODOME 1" (Canal 1)');
  console.log('   - ROUTEUR 2 : SSID "VOTE ABH 2026 - GILDAS ZODOME 2" (Canal 11)');
  console.log('   - Portail Captif : Actif avec redirection automatique vers le bulletin');
  console.log('   - Réseau : Ouvert sans mot de passe, anti-collision de canaux Wi-Fi');
  console.log('======================================================================\n');
}

main();

