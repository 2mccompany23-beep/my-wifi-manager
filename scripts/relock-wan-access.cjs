const { RouterOSClient } = require('../abh2026-vote-kiosk/lib/routeros.js');

const routers = [
  { name: 'Routeur 1', ip: '192.168.1.161' },
  { name: 'Routeur 2', ip: '192.168.1.162' }
];

async function relock() {
  console.log('🔒 Verrouillage de l accès WAN (Port 1)...');
  for (const r of routers) {
    try {
      const c = new RouterOSClient({ host: r.ip, user: 'admin', password: '4ZFF63YJ4H', timeout: 4000 });
      // 1. Remettre mac-server sur LAN
      await c.execute('/tool/mac-server/set', ['=allowed-interface-list=LAN']);
      await c.execute('/tool/mac-server/mac-winbox/set', ['=allowed-interface-list=LAN']);

      // 2. Supprimer la règle d'ouverture WAN
      const rules = await c.execute('/ip/firewall/filter/print');
      for (const rule of rules) {
        if (rule.comment && rule.comment.includes('Allow WinBox & ALL from Box on WAN')) {
          await c.execute('/ip/firewall/filter/remove', ['=.id=' + rule['.id']]);
        }
      }
      console.log(`✅ ${r.name} (${r.ip}) : Accès Port 1 fermé ! Accès restreint uniquement au LAN (Port 2 à 5 / Wi-Fi).`);
    } catch (e) {
      console.error(`❌ Erreur sur ${r.name}:`, e.message);
    }
  }
}

relock();

