const { RouterOSClient } = require('../abh2026-vote-kiosk/lib/routeros.js');

const MAIL_PORTS = [
  // Google Android Push & Sync
  { port: 5228, proto: 'tcp', comment: 'Kiosk: Google FCM Push 5228' },
  { port: 5229, proto: 'tcp', comment: 'Kiosk: Google FCM Push 5229' },
  { port: 5230, proto: 'tcp', comment: 'Kiosk: Google FCM Push 5230' },
  // Apple iOS Push APNs
  { port: 5223, proto: 'tcp', comment: 'Kiosk: Apple APNs Push 5223' },
  // Standard Mail Protocols (IMAPS, POP3S, SMTPS)
  { port: 993, proto: 'tcp', comment: 'Kiosk: IMAPS 993' },
  { port: 995, proto: 'tcp', comment: 'Kiosk: POP3S 995' },
  { port: 587, proto: 'tcp', comment: 'Kiosk: SMTPS 587' },
  { port: 465, proto: 'tcp', comment: 'Kiosk: SMTPS SSL 465' },
  // DNS
  { port: 53, proto: 'udp', comment: 'Kiosk: DNS UDP 53' },
  { port: 53, proto: 'tcp', comment: 'Kiosk: DNS TCP 53' }
];

const CLOUDFLARE_CIDRS = [
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

const ESSENTIAL_HOSTS = [
  // 1. Vote Platform & Cloudflare
  '*abh2026top10vote.org*',
  '*api.abh2026top10vote.org*',
  '*africabusinessheroes.org*',
  '*event.africabusinessheroes.org*',
  '*challenges.cloudflare.com*',
  '*cloudflareinsights.com*',
  '*static.cloudflareinsights.com*',
  '*cdnjs.cloudflare.com*',
  '*.cloudflare.com',

  // 2. Google / Gmail Ecosystem (App Mobile + Web + Notifications)
  '*google.com*',
  '*gmail.com*',
  '*googleapis.com*',
  '*gstatic.com*',
  '*googleusercontent.com*',
  '*gvt1.com*',
  '*android.clients.google.com*',
  '*mtalk.google.com*',

  // 3. Microsoft Outlook / Hotmail Ecosystem (App Mobile + Substrate + MSAL)
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

  // 4. Yahoo Mail Ecosystem (App Mobile + API + Media)
  '*yahoo.com*',
  '*yimg.com*',

  // 5. Apple Mail / iCloud Ecosystem (App Mail iOS + Push)
  '*icloud.com*',
  '*apple.com*',
  '*mzstatic.com*'
];

async function applyFix(host, name) {
  console.log(`\n======================================================`);
  console.log(`🚀 Mise à jour complète Walled Garden sur ${name} (${host})...`);
  const c = new RouterOSClient({ host, user: 'admin', password: '4ZFF63YJ4H' });

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
      console.log('✅ MSS Clamping activé (PMTU)');
    }
  } catch (e) {
    console.log('MSS note:', e.message);
  }

  // 2. Nettoyage et ajout des ports messageries et push
  console.log('📬 Ajout des ports Push et protocoles Mail...');
  for (const item of MAIL_PORTS) {
    try {
      await c.execute('/ip/hotspot/walled-garden/ip/add', [
        '=action=accept',
        `=dst-port=${item.port}`,
        `=protocol=${item.proto}`,
        `=comment=${item.comment}`
      ]);
    } catch (_) {}
  }

  // 3. Ajout des sous-réseaux IP Cloudflare & Apple Push (17.0.0.0/8)
  console.log('🌐 Ajout des plages IP Cloudflare & Apple Push...');
  for (const cidr of CLOUDFLARE_CIDRS) {
    try {
      await c.execute('/ip/hotspot/walled-garden/ip/add', [
        '=action=accept',
        `=dst-address=${cidr}`,
        '=comment=Kiosk: Cloudflare CIDR'
      ]);
    } catch (_) {}
  }

  try {
    await c.execute('/ip/hotspot/walled-garden/ip/add', [
      '=action=accept',
      '=dst-address=17.0.0.0/8',
      '=comment=Kiosk: Apple Push CIDR'
    ]);
  } catch (_) {}

  // 4. Ajout de tous les domaines d'applications e-mails
  console.log('🔍 Ajout des domaines complets Google, Outlook, Yahoo, Apple...');
  for (const h of ESSENTIAL_HOSTS) {
    try {
      await c.execute('/ip/hotspot/walled-garden/ip/add', [
        '=action=accept',
        `=dst-host=${h}`,
        '=comment=Kiosk: Allowed Host'
      ]);
    } catch (_) {}
  }

  const wg = await c.execute('/ip/hotspot/walled-garden/ip/print');
  console.log(`🎉 SUCCÈS sur ${name} : ${wg.length} règles Walled Garden IP actives !`);
}

async function main() {
  for (const [host, name] of [['10.54.0.1', 'Routeur 2'], ['192.168.1.161', 'Routeur 1'], ['10.50.0.1', 'Routeur 1 (Direct)']]) {
    try {
      await applyFix(host, name);
    } catch (e) {
      console.log(`ℹ️ ${name} sur ${host} non joignable via API directe.`);
    }
  }
}

main();

