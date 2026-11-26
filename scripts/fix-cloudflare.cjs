const { RouterOSClient } = require('../abh2026-vote-kiosk/lib/routeros.js');

async function fixRouter(ip, name) {
  console.log(`\n🔧 Application du correctif Cloudflare Turnstile sur ${name} (${ip})...`);
  const c = new RouterOSClient({ host: ip, user: 'admin', password: '4ZFF63YJ4H' });

  // 1. MSS Clamping pour éviter la fragmentation des certificats TLS Cloudflare
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
    } else {
      console.log('ℹ️ MSS Clamping déjà présent');
    }
  } catch (e) {
    console.log('Erreur MSS:', e.message);
  }

  // 2. Ajout des sous-réseaux IP Anycast officiels de Cloudflare
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

  let added = 0;
  for (const cidr of cidrs) {
    try {
      await c.execute('/ip/hotspot/walled-garden/ip/add', [
        '=action=accept',
        `=dst-address=${cidr}`,
        '=comment=Kiosk: Cloudflare CIDR'
      ]);
      added++;
    } catch (_) {}
  }
  console.log(`✅ ${added} plages IP Cloudflare ajoutées dans Walled Garden IP`);

  // 3. Domaines explicites Turnstile & API Vote
  const hosts = [
    '*challenges.cloudflare.com*',
    '*static.cloudflareinsights.com*',
    '*cloudflareinsights.com*',
    '*api.abh2026top10vote.org*',
    '*event.africabusinessheroes.org*',
    '*cdnjs.cloudflare.com*'
  ];

  for (const h of hosts) {
    try {
      await c.execute('/ip/hotspot/walled-garden/ip/add', [
        '=action=accept',
        `=dst-host=${h}`,
        '=comment=Kiosk: Cloudflare Host'
      ]);
    } catch (_) {}
  }
  console.log('✅ Domaines explicites Cloudflare & API Vote ajoutés');
}

async function main() {
  for (const [ip, name] of [['10.50.0.1', 'Routeur 1'], ['10.54.0.1', 'Routeur 2']]) {
    try {
      await fixRouter(ip, name);
    } catch (e) {
      console.log(`ℹ️ ${name} (${ip}) non joignable actuellement:`, e.message);
    }
  }
}

main();
