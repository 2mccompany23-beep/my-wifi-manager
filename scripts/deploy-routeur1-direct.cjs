const { RouterOSClient } = require('../abh2026-vote-kiosk/lib/routeros.js');
const { execSync } = require('child_process');

async function deployRouteur1() {
  console.log('🔍 Détection et déploiement final sur le Routeur 1 (10.50.0.1)...');
  const c = new RouterOSClient({ host: '10.50.0.1', user: 'admin', password: '4ZFF63YJ4H', timeout: 5000 });

  // 1. MSS Clamping
  try {
    const existing = await c.execute('/ip/firewall/mangle/print', ['?comment=Clamp MSS to PMTU']);
    if (existing.length === 0) {
      await c.execute('/ip/firewall/mangle/add', [
        '=chain=forward',
        '=protocol=tcp',
        '=tcp-flags=syn',
        '=action=change-mss',
        '=new-mss=clamp-to-pmtu',
        '=comment=Clamp MSS to PMTU'
      ]);
      console.log('✅ 1. MSS Clamping activé (PMTU)');
    } else {
      console.log('ℹ️ 1. MSS Clamping déjà présent');
    }
  } catch (e) {
    console.log('MSS note:', e.message);
  }

  // 2. Nettoyage préventif des anciennes règles Walled Garden IP
  try {
    const oldRules = await c.execute('/ip/hotspot/walled-garden/ip/print');
    for (const r of oldRules) {
      if (r['.id']) {
        await c.execute('/ip/hotspot/walled-garden/ip/remove', ['=.id=' + r['.id']]);
      }
    }
    console.log('🧹 2. Anciennes règles Walled Garden IP nettoyées proprement');
  } catch (e) {
    console.log('Nettoyage note:', e.message);
  }

  // 3. Ports Push & Protocoles Messagerie
  const ports = [
    { p: 5228, proto: 'tcp', c: 'Kiosk: Google FCM Push 5228' },
    { p: 5229, proto: 'tcp', c: 'Kiosk: Google FCM Push 5229' },
    { p: 5230, proto: 'tcp', c: 'Kiosk: Google FCM Push 5230' },
    { p: 5223, proto: 'tcp', c: 'Kiosk: Apple APNs Push 5223' },
    { p: 993, proto: 'tcp', c: 'Kiosk: IMAPS 993' },
    { p: 995, proto: 'tcp', c: 'Kiosk: POP3S 995' },
    { p: 587, proto: 'tcp', c: 'Kiosk: SMTPS 587' },
    { p: 465, proto: 'tcp', c: 'Kiosk: SMTPS SSL 465' },
    { p: 53, proto: 'udp', c: 'Kiosk: DNS UDP 53' },
    { p: 53, proto: 'tcp', c: 'Kiosk: DNS TCP 53' }
  ];

  for (const item of ports) {
    await c.execute('/ip/hotspot/walled-garden/ip/add', [
      '=action=accept',
      `=dst-port=${item.p}`,
      `=protocol=${item.proto}`,
      `=comment=${item.c}`
    ]);
  }
  console.log('✅ 3. Ports Push FCM (Google), APNs (Apple) et e-mails autorisés');

  // 4. Plages IP Cloudflare Anycast & Apple Push (17.0.0.0/8)
  const cidrs = [
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

  for (const cidr of cidrs) {
    await c.execute('/ip/hotspot/walled-garden/ip/add', [
      '=action=accept',
      `=dst-address=${cidr}`,
      '=comment=Kiosk: Cloudflare CIDR'
    ]);
  }

  await c.execute('/ip/hotspot/walled-garden/ip/add', [
    '=action=accept',
    '=dst-address=17.0.0.0/8',
    '=comment=Kiosk: Apple Push CIDR'
  ]);
  console.log('✅ 4. Plages IP Cloudflare Anycast (14 blocs) et Apple Push ajoutées');

  // 5. Domaines Vote, Cloudflare et Messageries
  const hosts = [
    '*abh2026top10vote.org*',
    '*api.abh2026top10vote.org*',
    '*africabusinessheroes.org*',
    '*event.africabusinessheroes.org*',
    '*challenges.cloudflare.com*',
    '*cloudflareinsights.com*',
    '*static.cloudflareinsights.com*',
    '*cdnjs.cloudflare.com*',
    '*.cloudflare.com',
    '*google.com*',
    '*gmail.com*',
    '*accounts.google.com*',
    '*googleapis.com*',
    '*gstatic.com*',
    '*googleusercontent.com*',
    '*gvt1.com*',
    '*android.clients.google.com*',
    '*mtalk.google.com*',
    '*outlook.com*',
    '*outlook.live.com*',
    '*outlook.office.com*',
    '*outlook.office365.com*',
    '*substrate.office.com*',
    '*office.com*',
    '*office365.com*',
    '*live.com*',
    '*microsoft.com*',
    '*microsoftonline.com*',
    '*msauth.net*',
    '*msftauth.net*',
    '*yahoo.com*',
    '*yimg.com*',
    '*icloud.com*',
    '*apple.com*',
    '*mzstatic.com*'
  ];

  for (const h of hosts) {
    await c.execute('/ip/hotspot/walled-garden/ip/add', [
      '=action=accept',
      `=dst-host=${h}`,
      '=comment=Kiosk: Allowed Host'
    ]);
  }
  console.log('✅ 5. Domaines complets Google, Outlook, Yahoo, Apple et Vote ABH autorisés');

  const rules = await c.execute('/ip/hotspot/walled-garden/ip/print');
  console.log(`🎉 6. Pare-feu Routeur 1 à jour : ${rules.length} règles actives dans Walled Garden IP !`);

  // 6. Téléversement FTP de login.html et status.html
  console.log('📤 7. Téléversement des fichiers du portail captif via FTP...');
  process.env.ROUTER_IP = '10.50.0.1';
  require('../abh2026-vote-kiosk/scripts/upload-kiosk-portal.cjs');
}

deployRouteur1().catch(err => {
  console.error('❌ Erreur de déploiement sur Routeur 1:', err.message);
  process.exit(1);
});

