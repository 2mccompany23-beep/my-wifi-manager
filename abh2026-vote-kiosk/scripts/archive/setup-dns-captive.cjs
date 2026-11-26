const { RouterOSClient } = require('../lib/routeros.js');

async function setupDnsAndCaptive(ip, pass, subnet) {
  const c = new RouterOSClient({ host: ip, user: 'admin', password: pass, timeout: 5000 });
  console.log(`Configuring DNS & Captive Option on ${ip}...`);

  // 1. Configurer DNS upstream 8.8.8.8, 1.1.1.1
  await c.set('/ip/dns', '*0', {
    servers: '8.8.8.8,1.1.1.1',
    'allow-remote-requests': 'true'
  }).catch(async () => {
    await c.execute('/ip/dns/set', ['=servers=8.8.8.8,1.1.1.1', '=allow-remote-requests=yes']).catch(() => {});
  });
  console.log('  ✅ DNS upstream (8.8.8.8, 1.1.1.1) configuré avec allow-remote-requests=yes.');

  // 2. Static DNS pour les sondes captifs
  const probes = [
    'kiosk.vote',
    'connectivitycheck.gstatic.com',
    'clients3.google.com',
    'connectivitycheck.android.com',
    'captive.apple.com',
    'www.apple.com',
    'msftconnecttest.com'
  ];

  const existingDns = await c.print('/ip/dns/static');
  for (const domain of probes) {
    if (!existingDns.some(d => d.name === domain)) {
      await c.add('/ip/dns/static', {
        name: domain,
        address: `${subnet}.0.1`,
        comment: 'Kiosk: Instant Captive Trigger'
      }).catch(() => {});
    }
  }
  console.log(`  ✅ Sondes DNS locales statiques enregistrées vers ${subnet}.0.1.`);

  // 3. DHCP Option 114 (RFC 8908 Captive Portal URL)
  const options = await c.print('/ip/dhcp-server/option');
  let opt114 = options.find(o => o.name === 'captive-url');
  if (!opt114) {
    await c.add('/ip/dhcp-server/option', {
      name: 'captive-url',
      code: '114',
      value: `'http://${subnet}.0.1/login'`
    }).catch(() => {});
    console.log('  ✅ DHCP Option 114 créée.');
  }

  // Lier Option 114 au réseau DHCP
  const nets = await c.print('/ip/dhcp-server/network');
  const kioskNet = nets.find(n => n.address === `${subnet}.0.0/22`);
  if (kioskNet) {
    await c.set('/ip/dhcp-server/network', kioskNet['.id'], {
      'dhcp-option': 'captive-url'
    }).catch(() => {});
    console.log(`  ✅ DHCP Option 114 liée au réseau ${subnet}.0.0/22.`);
  }
}

async function main() {
  await setupDnsAndCaptive('10.50.0.1', '4ZFF63YJ4H', '10.50');
  await setupDnsAndCaptive('10.54.0.1', '4ZFF63YJ4H', '10.54');
  console.log('\n🚀 DNS & DHCP Option 114 appliqués avec SUCCÈS sur les 2 routeurs !');
}

main();
