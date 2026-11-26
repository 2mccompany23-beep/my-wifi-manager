const path = require('path');

async function main() {
  const { setFilterMode, ROUTERS_MAP } = await import('../abh2026-vote-kiosk/lib/router-service.js');
  const { RouterOSClient } = await import('../abh2026-vote-kiosk/lib/routeros.js');

  console.log('1. Déploiement des règles Anti-Gaspillage (WhatsApp, Streaming, MAJ, Sinkholes)...');
  await setFilterMode({ mode: 'smart' });
  console.log('✅ Règles Anti-Gaspillage appliquées via setFilterMode.');

  // 2. Installation du script Watchdog autonome RouterOS sur les deux routeurs
  for (const [rId, rCfg] of Object.entries(ROUTERS_MAP)) {
    const host = rCfg.activeHost || rCfg.host;
    console.log(`\n2. Installation Watchdog Matériel autonome sur Routeur ${rId} (${host})...`);
    try {
      const c = new RouterOSClient({
        host,
        user: rCfg.user,
        password: rCfg.pass,
        timeout: 4000
      });

      // Le script vérifie toutes les sessions actives MikroTik et kicke/bannit dès 20 Mo
      const scriptSource = `:local maxBytes (20 * 1024 * 1024);\r
:foreach i in=[/ip hotspot active find] do={\r
  :local bIn [/ip hotspot active get $i bytes-in];\r
  :local bOut [/ip hotspot active get $i bytes-out];\r
  :local tot ($bIn + $bOut);\r
  :if ($tot >= $maxBytes) do={\r
    :local uIp [/ip hotspot active get $i address];\r
    :do { /ip firewall address-list add list="banned_students" address=$uIp timeout=24h comment="Auto-ban: Quota depasse" } on-error={};\r
    /ip hotspot active remove $i;\r
    :do { /ip hotspot host remove [find address=$uIp] } on-error={};\r
    :do { /ip firewall connection remove [find src-address=$uIp] } on-error={};\r
    :log warning ("Watchdog: Auto-kicked " . $uIp . " for exceeding quota (" . $tot . " bytes)");\r
  }\r
};`;

      // Ajouter ou mettre à jour le script
      const scripts = await c.execute('/system/script/print', ['?name=kiosk-quota-watchdog']);
      if (scripts.length === 0) {
        await c.execute('/system/script/add', [
          '=name=kiosk-quota-watchdog',
          `=source=${scriptSource}`,
          '=comment=Surveillance autonome du quota 20Mo'
        ]);
        console.log(`✅ Script kiosk-quota-watchdog créé sur Routeur ${rId}`);
      } else {
        await c.execute('/system/script/set', [
          `=.id=${scripts[0]['.id']}`,
          `=source=${scriptSource}`
        ]);
        console.log(`✅ Script kiosk-quota-watchdog mis à jour sur Routeur ${rId}`);
      }

      // Ajouter le scheduler (exécuté toutes les 5 secondes)
      const scheds = await c.execute('/system/scheduler/print', ['?name=kiosk-quota-watchdog']);
      if (scheds.length === 0) {
        await c.execute('/system/scheduler/add', [
          '=name=kiosk-quota-watchdog',
          '=interval=5s',
          '=on-event=kiosk-quota-watchdog',
          '=comment=Execution automatique toutes les 5s'
        ]);
        console.log(`✅ Scheduler kiosk-quota-watchdog (5s) activé sur Routeur ${rId}`);
      }

    } catch (err) {
      console.error(`❌ Erreur sur Routeur ${rId}:`, err.message);
    }
  }

  console.log('\n🎉 Hardening terminé avec succès sur les deux routeurs.');
}

main().catch(console.error);

