const { RouterOSClient } = require('../abh2026-vote-kiosk/lib/routeros.js');

const ROUTERS = [
  { id: 1, host: '192.168.1.161', pass: '4ZFF63YJ4H', name: 'Routeur 1' },
  { id: 2, host: '192.168.1.162', pass: '4ZFF63YJ4H', name: 'Routeur 2' }
];

const BLOCKED_APP_CIDRS = [
  // Meta (Facebook, Instagram, WhatsApp Reels & Media)
  '157.240.0.0/16',
  '31.13.64.0/18',
  '31.13.24.0/21',
  '179.60.192.0/22',
  '185.60.216.0/22',
  '204.15.20.0/22',
  '69.63.176.0/20',
  '69.171.224.0/19',
  '66.220.144.0/20',
  '129.134.0.0/16',
  // ByteDance (TikTok Video CDN)
  '161.117.0.0/16',
  '130.44.0.0/16'
];

async function hardenRouter(r) {
  console.log(`\n=======================================================`);
  console.log(`🛡️ Application du Durcissement Pare-feu sur ${r.name} (${r.host})`);
  console.log(`=======================================================`);

  const c = new RouterOSClient({ host: r.host, user: 'admin', password: r.pass, timeout: 6000 });

  // 1. Règle d'autorisation spéciale pour AlwaysData voter-status
  console.log('1️⃣ Configuration de l’exception voter-status pour les bannis...');
  const filters = await c.execute('/ip/firewall/filter/print');
  const hasVoterStatusAllow = filters.some(f => f.comment && f.comment.includes('Allow Banned to check voter-status'));
  if (!hasVoterStatusAllow) {
    await c.execute('/ip/firewall/filter/add', [
      '=chain=forward',
      '=src-address-list=banned_students',
      '=dst-address=185.31.40.30',
      '=protocol=tcp',
      '=dst-port=443',
      '=action=accept',
      '=comment=Kiosk: Allow Banned to check voter-status',
      '=place-before=*0'
    ]).catch(e => console.log('Voter status rule error:', e.message));
    console.log('   ✅ Règle voter-status AlwaysData insérée en tête');
  } else {
    console.log('   ℹ️ Règle voter-status AlwaysData déjà active');
  }

  // 2. Peuplement de l'Address-List Kiosk_Blocked_Apps_CIDR
  console.log('2️⃣ Peuplement de la liste Kiosk_Blocked_Apps_CIDR (Meta/TikTok CDN)...');
  const existingAddrList = await c.execute('/ip/firewall/address-list/print', ['?list=Kiosk_Blocked_Apps_CIDR']);
  const existingSet = new Set(existingAddrList.map(a => a.address));
  for (const cidr of BLOCKED_APP_CIDRS) {
    if (!existingSet.has(cidr)) {
      await c.execute('/ip/firewall/address-list/add', [
        '=list=Kiosk_Blocked_Apps_CIDR',
        `=address=${cidr}`,
        '=comment=Anti-Gaspillage: Meta/TikTok CDN IP Range'
      ]).catch(() => {});
    }
  }
  console.log(`   ✅ ${BLOCKED_APP_CIDRS.length} plages CIDR enregistrées dans Kiosk_Blocked_Apps_CIDR`);

  // 3. Règle Filter Drop pour Kiosk_Blocked_Apps_CIDR
  console.log('3️⃣ Règle de blocage réseau Anti-Gaspillage (Meta/TikTok/Reels direct IPs)...');
  const hasAppDrop = filters.some(f => f.comment && f.comment.includes('Anti-Gaspillage: Bloquer Meta/TikTok/Reels direct IPs'));
  if (!hasAppDrop) {
    await c.execute('/ip/firewall/filter/add', [
      '=chain=forward',
      '=dst-address-list=Kiosk_Blocked_Apps_CIDR',
      '=action=drop',
      '=comment=Anti-Gaspillage: Bloquer Meta/TikTok/Reels direct IPs'
    ]).catch(e => console.log('App drop rule error:', e.message));
    console.log('   ✅ Règle de drop direct IP Meta/TikTok activée');
  } else {
    console.log('   ℹ️ Règle de drop direct IP Meta/TikTok déjà active');
  }

  console.log(`✅ ${r.name} sécurisé avec succès !`);
}

async function main() {
  for (const r of ROUTERS) {
    try {
      await hardenRouter(r);
    } catch (err) {
      console.error(`❌ Erreur sur ${r.name}:`, err.message);
    }
  }
  console.log('\n✨ Opération terminée sur l’ensemble des bornes.');
}

main().catch(console.error);
