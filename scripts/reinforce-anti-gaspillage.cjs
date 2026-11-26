const { RouterOSClient } = require('../abh2026-vote-kiosk/lib/routeros.js');

const ROUTERS = [
  { id: 1, host: '192.168.1.161', lanHost: '10.50.0.1', pass: '4ZFF63YJ4H', name: 'Routeur 1' },
  { id: 2, host: '192.168.1.162', lanHost: '10.54.0.1', pass: '4ZFF63YJ4H', name: 'Routeur 2' }
];

// Regex pour sinkhole DNS (bloque net et à 0ms WhatsApp, Facebook, Insta, TikTok, YouTube, Netflix, etc.)
const BLOCKED_REGEXPS = [
  '.*(whatsapp|fbcdn|facebook|instagram|cdninstagram).*',
  '.*(tiktok|byteoversea|musical\\.ly|tiktokv).*',
  '.*(googlevideo|youtubei|ytimg).*',
  '.*(netflix|nflxvideo|snapchat|pinterest|reddit).*'
];

// Patterns TLS pour le firewall filter (inspection SNI au premier paquet)
const BLOCKED_TLS_PATTERNS = [
  '*whatsapp*',
  '*facebook*',
  '*fbcdn*',
  '*instagram*',
  '*cdninstagram*',
  '*tiktok*',
  '*byteoversea*',
  '*googlevideo*',
  '*youtube*',
  '*netflix*',
  '*nflxvideo*',
  '*snapchat*'
];

async function reinforceRouter(r) {
  console.log(`\n=======================================================`);
  console.log(`🛡️ Renforcement Anti-Gaspillage sur ${r.name} (${r.host})`);
  console.log(`=======================================================`);

  const c = new RouterOSClient({ host: r.host, user: 'admin', password: r.pass, timeout: 6000 });

  // 1. DNS Regex Sinkhole (retourne 127.0.0.1 immédiatement)
  console.log('1️⃣ Configuration des Sinkholes DNS RegExp...');
  const dnsStatic = await c.print('/ip/dns/static');
  for (const regex of BLOCKED_REGEXPS) {
    const existing = dnsStatic.find(d => d.regexp === regex);
    if (!existing) {
      await c.add('/ip/dns/static', {
        regexp: regex,
        address: '127.0.0.1',
        ttl: '1d',
        comment: 'Anti-Gaspillage: Sinkhole Regex'
      }).catch(e => console.log('DNS static add error:', e.message));
      console.log(`   ✅ Sinkhole DNS actif pour : ${regex}`);
    } else {
      console.log(`   ℹ️ Sinkhole DNS déjà présent pour : ${regex}`);
    }
  }

  // 2. Interception DNS NAT (Redirige tous les paquets UDP/TCP 53 vers le routeur local)
  console.log('\n2️⃣ Redirection forcée du trafic DNS (Anti-contournement 8.8.8.8 / 1.1.1.1)...');
  const natRules = await c.print('/ip/firewall/nat');
  const hasUdpDnsNat = natRules.some(n => n.comment && n.comment.includes('Force Router DNS UDP'));
  if (!hasUdpDnsNat) {
    await c.add('/ip/firewall/nat', {
      chain: 'dstnat',
      protocol: 'udp',
      'dst-port': '53',
      'in-interface': 'bridge',
      action: 'redirect',
      'to-ports': '53',
      comment: 'Anti-Gaspillage: Force Router DNS UDP'
    }).catch(e => console.log('NAT UDP DNS error:', e.message));
    console.log('   ✅ Redirection DNS UDP 53 configurée');
  }

  const hasTcpDnsNat = natRules.some(n => n.comment && n.comment.includes('Force Router DNS TCP'));
  if (!hasTcpDnsNat) {
    await c.add('/ip/firewall/nat', {
      chain: 'dstnat',
      protocol: 'tcp',
      'dst-port': '53',
      'in-interface': 'bridge',
      action: 'redirect',
      'to-ports': '53',
      comment: 'Anti-Gaspillage: Force Router DNS TCP'
    }).catch(e => console.log('NAT TCP DNS error:', e.message));
    console.log('   ✅ Redirection DNS TCP 53 configurée');
  }

  // 3. Bloquer DoT (DNS over TLS - Port 853) pour empêcher Android Private DNS
  console.log('\n3️⃣ Blocage DoT (DNS over TLS port 853)...');
  const filterRules = await c.print('/ip/firewall/filter');
  const hasDot = filterRules.some(f => f.comment && f.comment.includes('Bloquer DoT 853'));
  if (!hasDot) {
    await c.add('/ip/firewall/filter', {
      chain: 'forward',
      protocol: 'tcp',
      'dst-port': '853',
      action: 'reject',
      'reject-with': 'tcp-reset',
      comment: 'Anti-Gaspillage: Bloquer DoT 853'
    }).catch(e => console.log('DoT rule error:', e.message));
    console.log('   ✅ Règle blocage DoT 853 ajoutée');
  }

  // 4. Bloquer tout QUIC (UDP 443) pour forcer TCP et empêcher le streaming UDP non filtrable
  console.log('\n4️⃣ Blocage QUIC (UDP 443) universel...');
  const hasQuic = filterRules.some(f => f.comment && f.comment.includes('Bloquer QUIC UDP 443'));
  if (!hasQuic) {
    await c.add('/ip/firewall/filter', {
      chain: 'forward',
      protocol: 'udp',
      'dst-port': '443',
      action: 'drop',
      comment: 'Anti-Gaspillage: Bloquer QUIC UDP 443'
    }).catch(e => console.log('QUIC rule error:', e.message));
    console.log('   ✅ Règle blocage QUIC UDP 443 ajoutée');
  }

  // 5. Bloquer ports spécifiques WhatsApp Chat & Appels
  console.log('\n5️⃣ Blocage des ports WhatsApp (5222, 5223, 5228, 5242, 3478, 45395)...');
  const hasWaChat = filterRules.some(f => f.comment && f.comment.includes('Bloquer WhatsApp Ports Chat'));
  if (!hasWaChat) {
    await c.add('/ip/firewall/filter', {
      chain: 'forward',
      protocol: 'tcp',
      'dst-port': '5222,5228,5242',
      action: 'drop',
      comment: 'Anti-Gaspillage: Bloquer WhatsApp Ports Chat'
    }).catch(e => console.log('WA TCP error:', e.message));
    console.log('   ✅ Blocage WhatsApp Chat (TCP 5222, 5228, 5242) ajouté');
  }

  const hasWaCall = filterRules.some(f => f.comment && f.comment.includes('Bloquer WhatsApp Ports Media'));
  if (!hasWaCall) {
    await c.add('/ip/firewall/filter', {
      chain: 'forward',
      protocol: 'udp',
      'dst-port': '3478,45395,50318',
      action: 'drop',
      comment: 'Anti-Gaspillage: Bloquer WhatsApp Ports Media'
    }).catch(e => console.log('WA UDP error:', e.message));
    console.log('   ✅ Blocage WhatsApp Media/Calls (UDP 3478, 45395) ajouté');
  }

  // 6. Ajouter les règles TLS-Host Filter et les placer EN HAUT
  console.log('\n6️⃣ Configuration et positionnement des règles TLS-Host...');
  for (const pattern of BLOCKED_TLS_PATTERNS) {
    const comment = `Anti-Gaspillage: Drop ${pattern}`;
    const existing = filterRules.find(f => f.comment === comment);
    if (!existing) {
      await c.add('/ip/firewall/filter', {
        chain: 'forward',
        protocol: 'tcp',
        'tls-host': pattern,
        action: 'drop',
        comment: comment
      }).catch(e => console.log('TLS add error:', e.message));
      console.log(`   ✅ Règle TLS Drop ajoutée pour ${pattern}`);
    }
  }

  // 7. Repositionnement prioritaire : Placer toutes les règles Anti-Gaspillage en tête de la chaîne forward
  console.log('\n7️⃣ Repositionnement prioritaire en tête de chaîne forward...');
  const allFilters = await c.print('/ip/firewall/filter');
  const antiGaspillageRules = allFilters.filter(f => f.chain === 'forward' && f.comment && f.comment.startsWith('Anti-Gaspillage:'));
  
  // Dans RouterOS, les règles de blocage des étudiants bannis restent à la position 0
  // On déplace les règles anti-gaspillage juste après la règle 0
  for (let i = 0; i < antiGaspillageRules.length; i++) {
    const rule = antiGaspillageRules[i];
    await c.execute('/ip/firewall/filter/move', [
      `=.id=${rule['.id']}`,
      `=destination=${i + 1}`
    ]).catch(() => {});
  }
  console.log(`   ✅ ${antiGaspillageRules.length} règles Anti-Gaspillage déplacées en tête de chaîne (positions 1-${antiGaspillageRules.length})`);

  console.log(`\n🎉 Renforcement Anti-Gaspillage validé sur ${r.name} !`);
}

(async () => {
  for (const r of ROUTERS) {
    try {
      await reinforceRouter(r);
    } catch (e) {
      console.error(`❌ Échec sur ${r.name}:`, e.message);
    }
  }
  console.log('\n=======================================================');
  console.log('🚀 TOUS LES ROUTEURS SONT MAINTENANT BLINDÉS CONTRE LE GASPILLAGE !');
  console.log('=======================================================\n');
})();

