const { RouterOSClient } = require('../abh2026-vote-kiosk/lib/routeros.js');

async function installR2() {
  const c = new RouterOSClient({ host: '192.168.1.162', user: 'admin', password: '4ZFF63YJ4H', timeout: 5000 });
  const scriptSource = [
    ':local serverUrl "https://charmeldev.alwaysdata.net/api/poll?router=2&token=kiosk_poll_secret_2026"',
    ':local resultUrl "https://charmeldev.alwaysdata.net/api/poll/result?router=2&token=kiosk_poll_secret_2026"',
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

  const scripts = await c.execute('/system/script/print');
  const existing = scripts.find(s => s.name === 'kiosk_polling_agent');
  if (existing) {
    await c.execute('/system/script/set', [`=.id=${existing['.id']}`, `=source=${scriptSource}`]);
  } else {
    await c.execute('/system/script/add', [
      '=name=kiosk_polling_agent',
      `=source=${scriptSource}`,
      '=comment=Kiosk Polling Agent R2'
    ]);
  }
  console.log('✅ kiosk_polling_agent installed on Routeur 2');

  const scheds = await c.execute('/system/scheduler/print');
  const existingSched = scheds.find(s => s.name === 'sched_kiosk_poll');
  if (!existingSched) {
    await c.execute('/system/scheduler/add', [
      '=name=sched_kiosk_poll',
      '=interval=2s',
      '=on-event=kiosk_polling_agent',
      '=comment=Kiosk Polling Scheduler R2'
    ]);
  }
  console.log('✅ sched_kiosk_poll verified on Routeur 2');
}

installR2().catch(e => console.error(e));

