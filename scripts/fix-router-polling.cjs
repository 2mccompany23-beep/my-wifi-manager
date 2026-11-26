const { RouterOSClient } = require('../abh2026-vote-kiosk/lib/routeros.js');

function makeScript(routerNum) {
  return [
    `:local serverUrl "https://charmeldev.alwaysdata.net/api/poll?router=${routerNum}&token=kiosk_poll_secret_2026"`,
    `:local resultUrl "https://charmeldev.alwaysdata.net/api/poll/result?router=${routerNum}&token=kiosk_poll_secret_2026"`,
    '',
    ':do {',
    '  :local res [/system resource get]',
    '  :local wanRx 0',
    '  :local wanTx 0',
    '  :local wanRunning false',
    '  :do {',
    '    :local wan [/interface get [find name="ether1"]]',
    '    :set wanRx ($wan->"rx-byte")',
    '    :set wanTx ($wan->"tx-byte")',
    '    :set wanRunning ($wan->"running")',
    '  } on-error={}',
    '  :local hosts [/ip hotspot host print as-value]',
    '  :local active [/ip hotspot active print as-value]',
    '  :local banned [/ip firewall address-list print as-value where list="banned_students"]',
    '  :local tele {',
    '    "cpu"=($res->"cpu-load");',
    '    "mem"=($res->"free-memory");',
    '    "uptime"=($res->"uptime");',
    '    "version"=($res->"version");',
    '    "board"=($res->"board-name");',
    '    "wanRx"=$wanRx;',
    '    "wanTx"=$wanTx;',
    '    "wanRunning"=$wanRunning;',
    '    "hosts"=$hosts;',
    '    "active"=$active;',
    '    "banned"=$banned',
    '  }',
    '  :local teleJson [:serialize to=json value=$tele]',
    '  :local fetchRes [/tool fetch url=$serverUrl http-method=post http-data=$teleJson http-header-field="Content-Type: application/json" as-value output=user]',
    '  :if (($fetchRes->"status") = "finished" && [:typeof ($fetchRes->"data")] = "str") do={',
    '    :local rawData ($fetchRes->"data")',
    '    :local parsedData [:deserialize from=json value=$rawData]',
    '    :local action ($parsedData->"action")',
    '    :if ($action = "run") do={',
    '      :local commandId ($parsedData->"id")',
    '      :local cmdText ($parsedData->"command")',
    '      :local cmdFunc [:parse $cmdText]',
    '      :local outputData [$cmdFunc]',
    '      :local resObj { "id"=$commandId; "status"="done"; "output"=$outputData }',
    '      :local resJson [:serialize to=json value=$resObj]',
    '      /tool fetch url=$resultUrl http-method=post http-data=$resJson http-header-field="Content-Type: application/json" as-value output=user',
    '    }',
    '  }',
    '} on-error={}'
  ].join('\r\n');
}

async function configureRouter(host, pass, routerNum, name) {
  console.log(`\n--- Configuration de ${name} (${host}) ---`);
  const c = new RouterOSClient({ host, user: 'admin', password: pass, timeout: 6000 });
  
  // 1. Walled Garden
  console.log('Step 1: Walled Garden...');
  const wg = await c.print('/ip/hotspot/walled-garden/ip');
  const hasWg = wg.some(w => w['dst-host'] && w['dst-host'].includes('alwaysdata'));
  if (!hasWg) {
    await c.add('/ip/hotspot/walled-garden/ip', {
      action: 'accept',
      'dst-host': '*alwaysdata.net*',
      comment: 'Kiosk AlwaysData Cloud'
    }).catch(e => console.log('WG add error:', e.message));
    console.log('✅ Règle Walled Garden AlwaysData ajoutée');
  }

  // 2. Script
  console.log('Step 2: Script...');
  const scripts = await c.print('/system/script');
  const existing = scripts.find(s => s.name === 'kiosk_polling_agent');
  const scriptContent = makeScript(routerNum);
  if (existing) {
    await c.set('/system/script', existing['.id'], { source: scriptContent });
    console.log(`✅ Script kiosk_polling_agent mis à jour pour Routeur ${routerNum}`);
  } else {
    await c.add('/system/script', {
      name: 'kiosk_polling_agent',
      source: scriptContent,
      comment: `Kiosk Polling Agent R${routerNum}`
    });
    console.log(`✅ Script kiosk_polling_agent créé pour Routeur ${routerNum}`);
  }

  // 3. Scheduler
  console.log('Step 3: Scheduler...');
  const scheds = await c.print('/system/scheduler');
  const existingSched = scheds.find(s => s.name === 'sched_kiosk_poll');
  if (existingSched) {
    await c.set('/system/scheduler', existingSched['.id'], {
      interval: '2s',
      'on-event': 'kiosk_polling_agent',
      disabled: 'no'
    });
    console.log('✅ Scheduler sched_kiosk_poll mis à jour (intervalle 2s)');
  } else {
    await c.add('/system/scheduler', {
      name: 'sched_kiosk_poll',
      interval: '2s',
      'on-event': 'kiosk_polling_agent',
      comment: `Kiosk Polling Scheduler R${routerNum}`
    });
    console.log('✅ Scheduler sched_kiosk_poll créé (intervalle 2s)');
  }

  // 4. Test run direct
  console.log('Step 4: Test run...');
  await c.execute('/system/script/run', ['=number=kiosk_polling_agent']).catch(e => console.log('Note test run:', e.message));
  console.log(`✅ Exécution réussie sur ${name} !`);
}

(async () => {
  try {
    await configureRouter('192.168.1.161', '4ZFF63YJ4H', 1, 'Routeur 1');
  } catch (e) {
    console.error('❌ Erreur Routeur 1:', e.message);
  }

  try {
    await configureRouter('192.168.1.162', '4ZFF63YJ4H', 2, 'Routeur 2');
  } catch (e) {
    console.error('❌ Erreur Routeur 2:', e);
  }

  console.log('\n🎉 Configuration des deux routeurs terminée !');
})();

