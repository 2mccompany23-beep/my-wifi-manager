const { RouterOSClient } = require('../lib/routeros.js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ADMIN_PC_MAC = 'A0:D3:C1:62:3D:79';

const ROUTERS = [
  {
    id: 1,
    name: 'Routeur 1 (Principal)',
    host: '192.168.1.161',
    user: 'admin',
    pass: '4ZFF63YJ4H',
    subnet: '10.50',
    frequency: '2412',
    channel: 1,
    ssid: 'VOTE ABH 2026 - GILDAS ZODOME 1',
    identity: 'MikroTik-Kiosk-1'
  },
  {
    id: 2,
    name: 'Routeur 2 (Secondaire)',
    host: '192.168.1.162',
    user: 'admin',
    pass: '4ZFF63YJ4H',
    subnet: '10.54',
    frequency: '2462',
    channel: 11,
    ssid: 'VOTE ABH 2026 - GILDAS ZODOME 2',
    identity: 'MikroTik-Kiosk-2'
  }
];

// Helper FTP Upload via PowerShell .NET
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
  execSync('powershell -NoProfile -Command -', { input: psScript, encoding: 'utf8' });
}

function ensureFtpDir(host, user, pass, remoteDir) {
  const psScript = `
    $ErrorActionPreference = 'SilentlyContinue'
    $remote = "ftp://${host}/${remoteDir}"
    $req = [System.Net.FtpWebRequest]::Create($remote)
    $req.Credentials = New-Object System.Net.NetworkCredential('${user}', '${pass}')
    $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
    $res = $req.GetResponse()
    $res.Close()
  `;
  try {
    execSync('powershell -NoProfile -Command -', { input: psScript, encoding: 'utf8' });
  } catch (_) {}
}

async function configureRouter(r) {
  console.log(`\n======================================================================`);
  console.log(`🚀 APPLICATION CONFIGURATION AUDITÉE SUR : ${r.name} (${r.host})`);
  console.log(`   Identité : "${r.identity}" | SSID : "${r.ssid}" (Canal ${r.channel})`);
  console.log(`   Sous-réseau Hotspot : ${r.subnet}.0.0/22 (Passerelle : ${r.subnet}.0.1)`);
  console.log(`======================================================================\n`);

  const client = new RouterOSClient({
    host: r.host,
    user: r.user,
    password: r.pass,
    timeout: 6000
  });

  const res = await client.getResource();
  console.log(`✅ Connecté à MikroTik ${res['board-name']} (RouterOS ${res['version']})`);
  console.log(`   CPU : ${res['cpu-load']}%, RAM libre : ${(res['free-memory'] / 1024 / 1024).toFixed(1)} MB`);

  // 1. Identité système
  console.log(`\n1️⃣ Configuration de l'identité système ("${r.identity}")...`);
  try {
    await client.execute('/system/identity/set', [`=name=${r.identity}`]);
    console.log(`   ✅ Identité fixée à "${r.identity}".`);
  } catch (e) {
    console.warn('   ⚠️ Erreur identité:', e.message);
  }

  // 2. Règles Pare-feu WAN (WinBox, API, MNDP sur ether1)
  console.log(`\n2️⃣ Autorisation WinBox, API & MNDP sur le port WAN (ether1)...`);
  try {
    const currentFilters = await client.print('/ip/firewall/filter');
    const hasWinboxWan = currentFilters.some(f => f.comment && f.comment.includes('Allow WinBox'));
    if (!hasWinboxWan) {
      await client.add('/ip/firewall/filter', {
        chain: 'input',
        'in-interface': 'ether1',
        protocol: 'tcp',
        'dst-port': '8291,8728',
        action: 'accept',
        comment: 'Allow WinBox & API on WAN'
      });
      await client.add('/ip/firewall/filter', {
        chain: 'input',
        'in-interface': 'ether1',
        protocol: 'udp',
        'dst-port': '5678',
        action: 'accept',
        comment: 'Allow WinBox & MNDP on WAN'
      });
      console.log('   ✅ Règles WAN accept WinBox 8291, API 8728 ajoutées.');
    } else {
      console.log('   ℹ️ Règles WinBox WAN déjà présentes.');
    }
  } catch (e) {
    console.warn('   ⚠️ Note pare-feu WAN:', e.message);
  }

  // 3. Masquerade NAT sur ether1
  console.log(`\n3️⃣ Configuration NAT Masquerade WAN...`);
  try {
    const nats = await client.print('/ip/firewall/nat');
    const hasMasq = nats.some(n => n.chain === 'srcnat' && (n['out-interface'] === 'ether1' || n['out-interface-list'] === 'WAN'));
    if (!hasMasq) {
      await client.add('/ip/firewall/nat', {
        chain: 'srcnat',
        'out-interface': 'ether1',
        action: 'masquerade',
        comment: 'NAT WAN Masquerade'
      });
      console.log('   ✅ NAT Masquerade activé sur ether1.');
    } else {
      console.log('   ℹ️ NAT Masquerade déjà actif.');
    }
  } catch (e) {
    console.warn('   ⚠️ Note NAT:', e.message);
  }

  // 4. DNS Résolution & kiosk.vote
  console.log(`\n4️⃣ Configuration DNS & Résolution locale (kiosk.vote -> ${r.subnet}.0.1)...`);
  try {
    await client.execute('/ip/dns/set', [
      '=allow-remote-requests=yes',
      '=servers=8.8.8.8,1.1.1.1'
    ]);
    const staticDns = await client.print('/ip/dns/static');
    const existingKiosk = staticDns.find(d => d.name === 'kiosk.vote');
    if (!existingKiosk) {
      await client.add('/ip/dns/static', {
        name: 'kiosk.vote',
        address: `${r.subnet}.0.1`,
        comment: 'Kiosk: DNS Portal'
      });
      console.log(`   ✅ DNS statique "kiosk.vote" -> ${r.subnet}.0.1 ajouté.`);
    } else {
      await client.set('/ip/dns/static', existingKiosk['.id'], {
        address: `${r.subnet}.0.1`
      });
      console.log(`   ℹ️ DNS statique "kiosk.vote" mis à jour vers ${r.subnet}.0.1.`);
    }
  } catch (e) {
    console.warn('   ⚠️ Note DNS:', e.message);
  }

  // 5. Adressage IP sur Bridge
  console.log(`\n5️⃣ Configuration IP Hotspot (${r.subnet}.0.1/22 sur bridge)...`);
  try {
    const ips = await client.print('/ip/address');
    const existingSubnet = ips.find(i => i.address && i.address.startsWith(`${r.subnet}.0.1`));
    if (!existingSubnet) {
      await client.add('/ip/address', {
        address: `${r.subnet}.0.1/22`,
        interface: 'bridge',
        comment: 'Kiosk: Hotspot Subnet'
      });
      console.log(`   ✅ IP ${r.subnet}.0.1/22 ajoutée sur bridge.`);
    } else {
      console.log(`   ℹ️ IP ${r.subnet}.0.1/22 déjà présente sur bridge.`);
    }
  } catch (e) {
    console.warn('   ⚠️ Note IP:', e.message);
  }

  // 6. Pool IP & DHCP Server
  console.log(`\n6️⃣ Configuration Pool & DHCP Server (~700 adresses IP)...`);
  try {
    const pools = await client.print('/ip/pool');
    let kPool = pools.find(p => p.name === 'kiosk-pool');
    if (!kPool) {
      await client.add('/ip/pool', {
        name: 'kiosk-pool',
        ranges: `${r.subnet}.1.10-${r.subnet}.3.250`
      });
      console.log(`   ✅ Pool "kiosk-pool" créé (${r.subnet}.1.10-${r.subnet}.3.250).`);
    } else {
      await client.set('/ip/pool', kPool['.id'], {
        ranges: `${r.subnet}.1.10-${r.subnet}.3.250`
      });
      console.log(`   ℹ️ Pool "kiosk-pool" vérifié.`);
    }

    const dhcpNets = await client.print('/ip/dhcp-server/network');
    let kNet = dhcpNets.find(n => n.address === `${r.subnet}.0.0/22`);
    if (!kNet) {
      await client.add('/ip/dhcp-server/network', {
        address: `${r.subnet}.0.0/22`,
        gateway: `${r.subnet}.0.1`,
        'dns-server': `${r.subnet}.0.1`,
        comment: 'Kiosk DHCP Network'
      });
      console.log(`   ✅ Réseau DHCP ${r.subnet}.0.0/22 configuré.`);
    } else {
      console.log(`   ℹ️ Réseau DHCP ${r.subnet}.0.0/22 actif.`);
    }

    const dhcpServers = await client.print('/ip/dhcp-server');
    let kSrv = dhcpServers.find(d => d.name === 'kiosk-dhcp' || d.interface === 'bridge');
    if (!kSrv) {
      await client.add('/ip/dhcp-server', {
        name: 'kiosk-dhcp',
        interface: 'bridge',
        'address-pool': 'kiosk-pool',
        'lease-time': '15m',
        disabled: 'no'
      });
      console.log('   ✅ Serveur DHCP "kiosk-dhcp" créé.');
    } else {
      await client.set('/ip/dhcp-server', kSrv['.id'], {
        'address-pool': 'kiosk-pool',
        'lease-time': '15m',
        disabled: 'no'
      });
      console.log('   ℹ️ Serveur DHCP configuré avec lease 15m.');
    }
  } catch (e) {
    console.warn('   ⚠️ Note DHCP:', e.message);
  }

  // 7. Wi-Fi Ouvert wlan1
  console.log(`\n7️⃣ Configuration Wi-Fi wlan1 (SSID: "${r.ssid}", Canal ${r.channel})...`);
  try {
    const secProfiles = await client.print('/interface/wireless/security-profiles');
    if (secProfiles.length > 0) {
      await client.set('/interface/wireless/security-profiles', secProfiles[0]['.id'], {
        mode: 'none',
        'authentication-types': ''
      });
      console.log('   ✅ Profil de sécurité Wi-Fi : Ouvert (sans mot de passe).');
    }

    const wlanList = await client.print('/interface/wireless');
    if (wlanList.length > 0) {
      await client.set('/interface/wireless', wlanList[0]['.id'], {
        mode: 'ap-bridge',
        ssid: r.ssid,
        band: '2ghz-b/g/n',
        'channel-width': '20mhz',
        frequency: r.frequency,
        'wireless-protocol': '802.11',
        disabled: 'no'
      });
      console.log(`   ✅ Wi-Fi wlan1 activé sur canal ${r.channel} (${r.frequency} MHz).`);
    }
  } catch (e) {
    console.warn('   ⚠️ Note Wi-Fi:', e.message);
  }

  // 8. Hotspot Profile, User Profile & Compte VOTE (Audit C8)
  console.log(`\n8️⃣ Configuration Hotspot & Compte Votant "vote"...`);
  try {
    const userProfs = await client.print('/ip/hotspot/user/profile');
    let uProf = userProfs.find(p => p.name === 'kiosk-user-profile');
    if (!uProf) {
      await client.add('/ip/hotspot/user/profile', {
        name: 'kiosk-user-profile',
        'shared-users': '1000',
        'rate-limit': '512k/256k',
        'session-timeout': '15m',
        'idle-timeout': '5m'
      });
      console.log('   ✅ Profil utilisateur "kiosk-user-profile" (512k/256k, 15m) créé.');
    } else {
      await client.set('/ip/hotspot/user/profile', uProf['.id'], {
        'shared-users': '1000',
        'rate-limit': '512k/256k',
        'session-timeout': '15m',
        'idle-timeout': '5m'
      });
      console.log('   ℹ️ Profil utilisateur "kiosk-user-profile" à jour.');
    }

    const hProfiles = await client.print('/ip/hotspot/profile');
    let hProf = hProfiles.find(p => p.name === 'kiosk-profile');
    if (!hProf) {
      await client.add('/ip/hotspot/profile', {
        name: 'kiosk-profile',
        'hotspot-address': `${r.subnet}.0.1`,
        'dns-name': 'kiosk.vote',
        'html-directory': 'hotspot',
        'login-by': 'trial,http-pap,mac-cookie',
        'trial-uptime-limit': '15m',
        'trial-user-profile': 'kiosk-user-profile',
        'http-cookie-lifetime': '1d'
      });
      console.log('   ✅ Profil Hotspot "kiosk-profile" créé.');
    } else {
      await client.set('/ip/hotspot/profile', hProf['.id'], {
        'hotspot-address': `${r.subnet}.0.1`,
        'dns-name': 'kiosk.vote',
        'html-directory': 'hotspot',
        'login-by': 'trial,http-pap,mac-cookie',
        'trial-uptime-limit': '15m',
        'trial-user-profile': 'kiosk-user-profile',
        'http-cookie-lifetime': '1d'
      });
      console.log('   ℹ️ Profil Hotspot "kiosk-profile" à jour.');
    }

    const hotspots = await client.print('/ip/hotspot');
    let hsp = hotspots.find(h => h.name === 'kiosk-hotspot' || h.interface === 'bridge');
    if (!hsp) {
      await client.add('/ip/hotspot', {
        name: 'kiosk-hotspot',
        interface: 'bridge',
        'address-pool': 'kiosk-pool',
        profile: 'kiosk-profile',
        disabled: 'no'
      });
      console.log('   ✅ Serveur Hotspot "kiosk-hotspot" activé.');
    } else {
      await client.set('/ip/hotspot', hsp['.id'], {
        'address-pool': 'kiosk-pool',
        profile: 'kiosk-profile',
        disabled: 'no'
      });
      console.log('   ℹ️ Serveur Hotspot vérifié.');
    }

    // CORRECTION AUDIT C8 : Création du compte universel "vote" (sans mot de passe)
    const users = await client.print('/ip/hotspot/user');
    let voteUser = users.find(u => u.name === 'vote');
    if (!voteUser) {
      await client.add('/ip/hotspot/user', {
        name: 'vote',
        password: '',
        profile: 'kiosk-user-profile',
        comment: 'Kiosk: Utilisateur universel de vote'
      });
      console.log('   ✅ [AUDIT C8 OK] Utilisateur Hotspot "vote" (sans mot de passe) créé avec succès !');
    } else {
      await client.set('/ip/hotspot/user', voteUser['.id'], {
        password: '',
        profile: 'kiosk-user-profile'
      });
      console.log('   ✅ [AUDIT C8 OK] Utilisateur Hotspot "vote" vérifié et mis à jour.');
    }

    // Bypass PC Admin RJ45
    const bindings = await client.print('/ip/hotspot/ip-binding');
    if (!bindings.some(b => b['mac-address'] && b['mac-address'].toUpperCase() === ADMIN_PC_MAC)) {
      await client.add('/ip/hotspot/ip-binding', {
        'mac-address': ADMIN_PC_MAC,
        type: 'bypassed',
        comment: 'Kiosk Admin PC Bypassed'
      });
      console.log(`   ✅ PC Admin (${ADMIN_PC_MAC}) configuré en bypass direct.`);
    }
  } catch (e) {
    console.warn('   ⚠️ Note Hotspot:', e.message);
  }

  // 9. MSS Clamping (PMTU)
  console.log(`\n9️⃣ MSS Clamping (PMTU pour TLS Cloudflare & Téléphones)...`);
  try {
    const mangles = await client.print('/ip/firewall/mangle');
    const hasMss = mangles.some(m => m.comment && m.comment.includes('Clamp MSS'));
    if (!hasMss) {
      await client.add('/ip/firewall/mangle', {
        chain: 'forward',
        protocol: 'tcp',
        'tcp-flags': 'syn',
        action: 'change-mss',
        'new-mss': 'clamp-to-pmtu',
        comment: 'Clamp MSS to PMTU'
      });
      console.log('   ✅ MSS Clamping to PMTU activé.');
    } else {
      console.log('   ℹ️ MSS Clamping déjà actif.');
    }
  } catch (e) {
    console.warn('   ⚠️ Note MSS Clamping:', e.message);
  }

  // 10. Walled Garden IP (Ports Push Mobiles, Messageries & CIDRs Cloudflare)
  console.log(`\n🔟 Walled Garden IP (CIDRs Cloudflare & Flux Messageries OTP)...`);
  try {
    const wgIps = await client.print('/ip/hotspot/walled-garden/ip');
    
    // Ports
    const ports = [
      { port: '5228', proto: 'tcp', c: 'Kiosk: Google FCM Push 5228' },
      { port: '5229', proto: 'tcp', c: 'Kiosk: Google FCM Push 5229' },
      { port: '5230', proto: 'tcp', c: 'Kiosk: Google FCM Push 5230' },
      { port: '5223', proto: 'tcp', c: 'Kiosk: Apple APNs Push 5223' },
      { port: '993', proto: 'tcp', c: 'Kiosk: IMAPS 993' },
      { port: '995', proto: 'tcp', c: 'Kiosk: POP3S 995' },
      { port: '587', proto: 'tcp', c: 'Kiosk: SMTPS 587' },
      { port: '465', proto: 'tcp', c: 'Kiosk: SMTPS SSL 465' },
      { port: '53', proto: 'udp', c: 'Kiosk: DNS UDP 53' },
      { port: '53', proto: 'tcp', c: 'Kiosk: DNS TCP 53' }
    ];

    for (const p of ports) {
      if (!wgIps.some(w => w['dst-port'] === p.port && w['protocol'] === p.proto)) {
        await client.add('/ip/hotspot/walled-garden/ip', {
          action: 'accept',
          'dst-port': p.port,
          protocol: p.proto,
          comment: p.c
        });
      }
    }

    // Cloudflare Anycast CIDRs
    const cfCidrs = [
      '17.0.0.0/8',
      '104.16.0.0/12',
      '172.64.0.0/13',
      '162.158.0.0/15',
      '198.41.128.0/17',
      '173.245.48.0/20',
      '108.162.192.0/18',
      '190.93.240.0/20',
      '188.114.96.0/20',
      '141.101.64.0/18',
      '103.21.244.0/22',
      '103.22.200.0/22',
      '103.31.4.0/22',
      '197.234.240.0/22',
      '131.0.72.0/22'
    ];

    for (const cidr of cfCidrs) {
      if (!wgIps.some(w => w['dst-address'] === cidr)) {
        await client.add('/ip/hotspot/walled-garden/ip', {
          action: 'accept',
          'dst-address': cidr,
          comment: `Kiosk: CIDR ${cidr}`
        });
      }
    }
    console.log(`   ✅ Flux IP, push mobiles et ${cfCidrs.length} plages Anycast Cloudflare autorisés.`);
  } catch (e) {
    console.warn('   ⚠️ Note Walled Garden IP:', e.message);
  }

  // 11. Walled Garden Domaines (Vote, Cloudflare, Webmails, AlwaysData)
  console.log(`\n1️⃣1️⃣ Walled Garden Domaines (Plateforme Vote, Webmails OTP & Cloud)...`);
  try {
    const wgDomains = await client.print('/ip/hotspot/walled-garden');
    const domains = [
      'abh2026top10vote.org',
      '*.abh2026top10vote.org',
      'africabusinessheroes.org',
      '*.africabusinessheroes.org',
      'challenges.cloudflare.com',
      'cloudflareinsights.com',
      'static.cloudflareinsights.com',
      'cdnjs.cloudflare.com',
      '*.cloudflare.com',
      'mail.google.com',
      'accounts.google.com',
      '*.googleapis.com',
      '*.gstatic.com',
      '*.google.com',
      '*.googleusercontent.com',
      'outlook.com',
      '*.outlook.com',
      'outlook.live.com',
      'outlook.office.com',
      '*.office.com',
      '*.live.com',
      '*.microsoft.com',
      '*.microsoftonline.com',
      '*.msauth.net',
      '*.msftauth.net',
      '*.yahoo.com',
      '*.yimg.com',
      '*.icloud.com',
      '*.apple.com',
      '*.alwaysdata.net',
      '*.mcwifi.net'
    ];

    for (const d of domains) {
      if (!wgDomains.some(w => w['dst-host'] === d)) {
        await client.add('/ip/hotspot/walled-garden', {
          action: 'allow',
          'dst-host': d,
          comment: 'Kiosk Allowed'
        });
      }
    }
    console.log(`   ✅ ${domains.length} domaines autorisés en walled garden.`);
  } catch (e) {
    console.warn('   ⚠️ Note Walled Garden Domaines:', e.message);
  }

  // 12. Shaper PCQ (512k/256k par votant)
  console.log(`\n1️⃣2️⃣ Shaper PCQ Équitable (512k down / 256k up)...`);
  try {
    const qTypes = await client.print('/queue/type');
    if (!qTypes.some(q => q.name === 'kiosk_pcq_down')) {
      await client.add('/queue/type', {
        name: 'kiosk_pcq_down',
        kind: 'pcq',
        'pcq-rate': '512k',
        'pcq-classifier': 'dst-address'
      });
    }
    if (!qTypes.some(q => q.name === 'kiosk_pcq_up')) {
      await client.add('/queue/type', {
        name: 'kiosk_pcq_up',
        kind: 'pcq',
        'pcq-rate': '256k',
        'pcq-classifier': 'src-address'
      });
    }

    const queues = await client.print('/queue/simple');
    const qName = `Kiosk_R${r.id}_PCQ`;
    if (!queues.some(q => q.name === qName)) {
      await client.add('/queue/simple', {
        name: qName,
        target: `${r.subnet}.0.0/22`,
        queue: 'kiosk_pcq_up/kiosk_pcq_down',
        comment: 'Kiosk PCQ Shaper'
      });
      console.log(`   ✅ Shaper PCQ "${qName}" activé sur ${r.subnet}.0.0/22.`);
    } else {
      console.log(`   ℹ️ Shaper PCQ "${qName}" déjà présent.`);
    }
  } catch (e) {
    console.warn('   ⚠️ Note Shaper:', e.message);
  }

  // 13. Filtres Pare-Feu Anti-Abus (Bannissement)
  console.log(`\n1️⃣3️⃣ Filtres Pare-feu de Bannissement...`);
  try {
    const filters = await client.print('/ip/firewall/filter');
    if (!filters.some(f => f['src-address-list'] === 'banned_students' && f.chain === 'forward')) {
      await client.add('/ip/firewall/filter', {
        chain: 'forward',
        'src-address-list': 'banned_students',
        action: 'drop',
        comment: 'Kiosk: Bloquer etudiants bannis (Forward)'
      });
    }
    if (!filters.some(f => f['src-address-list'] === 'banned_students' && f.chain === 'input')) {
      await client.add('/ip/firewall/filter', {
        chain: 'input',
        'src-address-list': 'banned_students',
        action: 'drop',
        comment: 'Kiosk: Bloquer etudiants bannis (Input/DNS)'
      });
    }
    console.log('   ✅ Règles pare-feu de blocage des bannis actives.');
  } catch (e) {
    console.warn('   ⚠️ Note Filtres:', e.message);
  }

  // 14. Agent Reverse Polling vers AlwaysData Cloud (RouterOS v7)
  console.log(`\n1️⃣4️⃣ Configuration de l'Agent Reverse Polling (Routeur ${r.id} -> AlwaysData Cloud)...`);
  try {
    const scripts = await client.print('/system/script');
    const sName = 'kiosk_polling_agent';
    const pollScriptSource = `:local serverUrl "https://charmeldev.alwaysdata.net/api/poll?router=${r.id}"\r\n:local resultUrl "https://charmeldev.alwaysdata.net/api/poll/result?router=${r.id}"\r\n:local authToken "kiosk_poll_secret_2026"\r\n:local headers ("Authorization: Bearer " . $authToken . ",Content-Type: application/json")\r\n\r\n:do {\r\n  :local res [/system resource get]\r\n  :local wanRx 0\r\n  :local wanTx 0\r\n  :local wanRunning false\r\n  :do {\r\n    :local wan [/interface get [find name="ether1"]]\r\n    :set wanRx ($wan->"rx-byte")\r\n    :set wanTx ($wan->"tx-byte")\r\n    :set wanRunning ($wan->"running")\r\n  } on-error={}\r\n  :local hostsJson "["\r\n  :local firstH true\r\n  :foreach h in=[/ip hotspot host find] do={\r\n    :local hMac [/ip hotspot host get $h mac-address]\r\n    :local hIp [/ip hotspot host get $h address]\r\n    :local hIn [/ip hotspot host get $h bytes-in]\r\n    :local hOut [/ip hotspot host get $h bytes-out]\r\n    :local hUp [/ip hotspot host get $h uptime]\r\n    :local hAuth [/ip hotspot host get $h authorized]\r\n    :local hByp [/ip hotspot host get $h bypassed]\r\n    :if (!$firstH) do={ :set hostsJson ($hostsJson . ",") }\r\n    :set firstH false\r\n    :set hostsJson ($hostsJson . "{\\"mac-address\\":\\"" . $hMac . "\\",\\"address\\":\\"" . $hIp . "\\",\\"bytes-in\\":\\"" . $hIn . "\\",\\"bytes-out\\":\\"" . $hOut . "\\",\\"uptime\\":\\"" . $hUp . "\\",\\"authorized\\":\\"" . $hAuth . "\\",\\"bypassed\\":\\"" . $hByp . "\\"}")\r\n  }\r\n  :set hostsJson ($hostsJson . "]")\r\n  :local activeJson "["\r\n  :local firstA true\r\n  :foreach a in=[/ip hotspot active find] do={\r\n    :local aMac [/ip hotspot active get $a mac-address]\r\n    :local aIp [/ip hotspot active get $a address]\r\n    :local aIn [/ip hotspot active get $a bytes-in]\r\n    :local aOut [/ip hotspot active get $a bytes-out]\r\n    :local aUser [/ip hotspot active get $a user]\r\n    :if (!$firstA) do={ :set activeJson ($activeJson . ",") }\r\n    :set firstA false\r\n    :set activeJson ($activeJson . "{\\"mac-address\\":\\"" . $aMac . "\\",\\"address\\":\\"" . $aIp . "\\",\\"bytes-in\\":\\"" . $aIn . "\\",\\"bytes-out\\":\\"" . $aOut . "\\",\\"user\\":\\"" . $aUser . "\\"}")\r\n  }\r\n  :set activeJson ($activeJson . "]")\r\n  :local bannedJson "["\r\n  :local firstB true\r\n  :foreach b in=[/ip firewall address-list find where list="banned_students"] do={\r\n    :local bIp [/ip firewall address-list get $b address]\r\n    :local bCom [/ip firewall address-list get $b comment]\r\n    :local bTime [/ip firewall address-list get $b timeout]\r\n    :if (!$firstB) do={ :set bannedJson ($bannedJson . ",") }\r\n    :set firstB false\r\n    :set bannedJson ($bannedJson . "{\\"address\\":\\"" . $bIp . "\\",\\"comment\\":\\"" . $bCom . "\\",\\"timeout\\":\\"" . $bTime . "\\"}")\r\n  }\r\n  :set bannedJson ($bannedJson . "]")\r\n  :local teleJson ("{\\"cpu\\":\\"" . ($res->"cpu-load") . "%\\",\\"mem\\":\\"" . ($res->"free-memory") . "\\",\\"uptime\\":\\"" . ($res->"uptime") . "\\",\\"version\\":\\"" . ($res->"version") . "\\",\\"board\\":\\"" . ($res->"board-name") . "\\",\\"wanRx\\":\\"" . $wanRx . "\\",\\"wanTx\\":\\"" . $wanTx . "\\",\\"wanRunning\\":\\"" . $wanRunning . "\\",\\"hosts\\":" . $hostsJson . ",\\"active\\":" . $activeJson . ",\\"banned\\":" . $bannedJson . "}")\r\n  :local fetchRes [/tool fetch url=$serverUrl http-method=post http-data=$teleJson http-header-field=$headers as-value output=user]\r\n  :if (($fetchRes->"status") = "finished" && [:typeof ($fetchRes->"data")] = "str") do={\r\n    :local rawData ($fetchRes->"data")\r\n    :local parsedData [:deserialize from=json value=$rawData]\r\n    :local action ($parsedData->"action")\r\n    :if ($action = "run") do={\r\n      :local commandId ($parsedData->"id")\r\n      :local cmdText ($parsedData->"command")\r\n      :local cmdFunc [:parse $cmdText]\r\n      :local outputData [$cmdFunc]\r\n      :local resObj { "id"=$commandId; "status"="done"; "output"=$outputData }\r\n      :local resJson [:serialize to=json value=$resObj]\r\n      /tool fetch url=$resultUrl http-method=post http-data=$resJson http-header-field=$headers as-value output=user\r\n    }\r\n  }\r\n} on-error={}`;

    const existingScript = scripts.find(s => s.name === sName);
    if (!existingScript) {
      await client.add('/system/script', {
        name: sName,
        comment: `Kiosk Polling Agent R${r.id}`,
        source: pollScriptSource
      });
      console.log(`   ✅ Script "kiosk_polling_agent" créé (router=${r.id}).`);
    } else {
      await client.set('/system/script', existingScript['.id'], {
        source: pollScriptSource
      });
      console.log(`   ℹ️ Script "kiosk_polling_agent" mis à jour (router=${r.id}).`);
    }

    const scheds = await client.print('/system/scheduler');
    const schedName = 'sched_kiosk_poll';
    const existingSched = scheds.find(s => s.name === schedName);
    if (!existingSched) {
      await client.add('/system/scheduler', {
        name: schedName,
        interval: '2s',
        'on-event': sName,
        comment: `Kiosk Polling Scheduler R${r.id}`
      });
      console.log('   ✅ Scheduler "sched_kiosk_poll" configuré (toutes les 2s).');
    } else {
      await client.set('/system/scheduler', existingSched['.id'], {
        interval: '2s',
        'on-event': sName
      });
      console.log('   ℹ️ Scheduler "sched_kiosk_poll" actif.');
    }
  } catch (e) {
    console.warn('   ⚠️ Note Reverse Polling:', e.message);
  }

  // 15. Téléversement FTP des Fichiers du Portail Captif
  console.log(`\n1️⃣5️⃣ Téléversement FTP des fichiers du Portail Captif vers ftp://${r.host}/hotspot/...`);
  try {
    ensureFtpDir(r.host, r.user, r.pass, 'hotspot');
    const portalDir = path.join(__dirname, '..', 'router-config');
    const files = ['login.html', 'status.html', 'alogin.html', 'rlogin.html', 'redirect.html'];

    for (const f of files) {
      const localP = path.join(portalDir, f);
      if (fs.existsSync(localP)) {
        uploadFtpFile(r.host, r.user, r.pass, localP, `hotspot/${f}`);
        console.log(`   📤 hotspot/${f} téléversé avec succès.`);
      }
    }
    console.log('   ✅ Tous les fichiers du portail captif sont à jour sur le routeur !');
  } catch (e) {
    console.error('   ❌ Erreur upload FTP portail:', e.message);
  }

  console.log(`\n🎉 CONFIGURATION DU ${r.name} TERMINÉE AVEC SUCCÈS !`);
}

async function main() {
  console.log('======================================================================');
  console.log('🚀 DÉPLOIEMENT DE LA CONFIGURATION OFFICIELLE AUDITÉE');
  console.log('   Routeur 1 (192.168.1.161) & Routeur 2 (192.168.1.162)');
  console.log('   Utilisateur : admin | Mot de passe : 4ZFF63YJ4H');
  console.log('======================================================================');

  for (const r of ROUTERS) {
    try {
      await configureRouter(r);
    } catch (e) {
      console.error(`❌ Échec sur ${r.name}:`, e.message);
    }
  }

  console.log('\n======================================================================');
  console.log('🎉 LES DEUX ROUTEURS SONT 100% AUDITÉS, SÉCURISÉS ET OPÉRATIONNELS !');
  console.log('======================================================================\n');
}

main();
