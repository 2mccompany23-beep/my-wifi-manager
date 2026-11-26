const { RouterOSClient } = require('../abh2026-vote-kiosk/lib/routeros.js');
const db = require('../abh2026-vote-kiosk/data/routers.json');

async function applyFix(host, pass, name) {
  const c = new RouterOSClient({ host, user: 'admin', password: pass, timeout: 5000 });
  console.log(`\n=== 🛠️ Application du Correctif Captif Garanti sur ${name} (${host}) ===`);

  try {
    // 1. Désactiver mac-cookie et trial sur kiosk-profile
    const profiles = await c.execute('/ip/hotspot/profile/print');
    const kp = profiles.find(p => p.name === 'kiosk-profile');
    if (kp) {
      await c.execute('/ip/hotspot/profile/set', [
        `=.id=${kp['.id']}`,
        '=login-by=http-pap'
      ]);
      console.log('  ✅ kiosk-profile : login-by configuré strictement à http-pap (mac-cookie et trial retirés).');
    }

    // 2. Désactiver add-mac-cookie et régler keepalive sur kiosk-user-profile
    const userProfiles = await c.execute('/ip/hotspot/user/profile/print');
    const kup = userProfiles.find(u => u.name === 'kiosk-user-profile');
    if (kup) {
      await c.execute('/ip/hotspot/user/profile/set', [
        `=.id=${kup['.id']}`,
        '=add-mac-cookie=no',
        '=keepalive-timeout=30s',
        '=idle-timeout=3m'
      ]);
      console.log('  ✅ kiosk-user-profile : add-mac-cookie=no, keepalive=30s, idle=3m configurés.');
    }

    // 3. Régler keepalive-timeout sur le serveur kiosk-hotspot
    const hsList = await c.execute('/ip/hotspot/print');
    const hs = hsList.find(h => h.name === 'kiosk-hotspot');
    if (hs) {
      await c.execute('/ip/hotspot/set', [
        `=.id=${hs['.id']}`,
        '=keepalive-timeout=30s',
        '=idle-timeout=3m'
      ]);
      console.log('  ✅ kiosk-hotspot : keepalive-timeout=30s, idle-timeout=3m configurés.');
    }

    // 4. Purger TOUS les cookies enregistrés
    const cookies = await c.execute('/ip/hotspot/cookie/print');
    console.log(`  🍪 Purge de ${cookies.length} cookies Hotspot en cache...`);
    for (const cookie of cookies) {
      await c.execute('/ip/hotspot/cookie/remove', [`=.id=${cookie['.id']}`]).catch(() => {});
    }
    console.log('  ✅ Tous les cookies Hotspot purgés.');

    // 5. Nettoyer les entrées Walled Garden permissives qui court-circuitent la détection captive OS
    const wgList = await c.execute('/ip/hotspot/walled-garden/print');
    const probePatterns = [
      '*.gstatic.com',
      '*gstatic.com*',
      '*.apple.com',
      '*apple.com*',
      '*.google.com',
      '*google.com*',
      '*.microsoft.com',
      '*microsoft.com*'
    ];
    let removedWg = 0;
    for (const wg of wgList) {
      const h = wg['dst-host'] || '';
      // Vérifier si c'est un wildcard broad qui match les sondes OS
      if (probePatterns.includes(h) || h === '*.gstatic.com' || h === '*.apple.com') {
        // Mais préserver les sous-domaines spécifiques d'authentification e-mail
        if (h !== 'mail.google.com' && h !== 'accounts.google.com' && h !== 'idmsa.apple.com' && h !== 'login.microsoftonline.com') {
          await c.execute('/ip/hotspot/walled-garden/remove', [`=.id=${wg['.id']}`]).catch(() => {});
          removedWg++;
        }
      }
    }
    console.log(`  ✅ ${removedWg} règles Walled Garden trop larges supprimées.`);

    // 6. Nettoyer aussi dans Walled Garden IP si des wildcards d'IP résolvent les sondes
    const wgIpList = await c.execute('/ip/hotspot/walled-garden/ip/print');
    let removedWgIp = 0;
    for (const wgIp of wgIpList) {
      const h = wgIp['dst-host'] || '';
      if (h === '*.apple.com' || h === '*.google.com' || h === '*.gstatic.com' || h === '17.0.0.0/8') {
        await c.execute('/ip/hotspot/walled-garden/ip/remove', [`=.id=${wgIp['.id']}`]).catch(() => {});
        removedWgIp++;
      }
    }
    console.log(`  ✅ ${removedWgIp} règles Walled Garden IP larges supprimées.`);

  } catch (err) {
    console.error(`  ❌ Erreur sur ${name}:`, err.message);
  }
}

async function main() {
  await applyFix('192.168.1.161', db.router1.password, 'Routeur 1');
  await applyFix('192.168.1.162', db.router2.password, 'Routeur 2');
  console.log('\n🎉 Configuration terminée ! Chaque appareil verra désormais le portail à chaque reconnexion.');
}

main();
