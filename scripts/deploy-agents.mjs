// scripts/deploy-agents.mjs
import { RouterOSClient } from '../abh2026-vote-kiosk/lib/routeros.js';

function buildPollingSource(routerId) {
  return `:local serverUrl "https://charmeldev.alwaysdata.net/api/poll?router=${routerId}"
:local resultUrl "https://charmeldev.alwaysdata.net/api/poll/result?router=${routerId}"
:local authToken "kiosk_poll_secret_2026"
:local headers ("Authorization: Bearer " . $authToken . ",Content-Type: application/json")
:do {
  :local res [/system resource get]
  :local wanRx 0
  :local wanTx 0
  :local wanRunning false
  :do {
    :local wan [/interface get [find name="ether1"]]
    :set wanRx ($wan->"rx-byte")
    :set wanTx ($wan->"tx-byte")
    :set wanRunning ($wan->"running")
  } on-error={}
  :local hostsJson "["
  :local firstH true
  :foreach h in=[/ip hotspot host find] do={
    :local hMac [/ip hotspot host get $h mac-address]
    :local hIp [/ip hotspot host get $h address]
    :local hIn [/ip hotspot host get $h bytes-in]
    :local hOut [/ip hotspot host get $h bytes-out]
    :local hUp [/ip hotspot host get $h uptime]
    :local hAuth [/ip hotspot host get $h authorized]
    :local hByp [/ip hotspot host get $h bypassed]
    :if (!$firstH) do={ :set hostsJson ($hostsJson . ",") }
    :set firstH false
    :set hostsJson ($hostsJson . "{\\"mac-address\\":\\"" . $hMac . "\\",\\"address\\":\\"" . $hIp . "\\",\\"bytes-in\\":\\"" . $hIn . "\\",\\"bytes-out\\":\\"" . $hOut . "\\",\\"uptime\\":\\"" . $hUp . "\\",\\"authorized\\":\\"" . $hAuth . "\\",\\"bypassed\\":\\"" . $hByp . "\\"}")
  }
  :set hostsJson ($hostsJson . "]")
  :local activeJson "["
  :local firstA true
  :foreach a in=[/ip hotspot active find] do={
    :local aMac [/ip hotspot active get $a mac-address]
    :local aIp [/ip hotspot active get $a address]
    :local aIn [/ip hotspot active get $a bytes-in]
    :local aOut [/ip hotspot active get $a bytes-out]
    :local aUser [/ip hotspot active get $a user]
    :if (!$firstA) do={ :set activeJson ($activeJson . ",") }
    :set firstA false
    :set activeJson ($activeJson . "{\\"mac-address\\":\\"" . $aMac . "\\",\\"address\\":\\"" . $aIp . "\\",\\"bytes-in\\":\\"" . $aIn . "\\",\\"bytes-out\\":\\"" . $aOut . "\\",\\"user\\":\\"" . $aUser . "\\"}")
  }
  :set activeJson ($activeJson . "]")
  :local bannedJson "["
  :local firstB true
  :foreach b in=[/ip firewall address-list find where list="banned_students"] do={
    :local bIp [/ip firewall address-list get $b address]
    :local bCom [/ip firewall address-list get $b comment]
    :local bTime [/ip firewall address-list get $b timeout]
    :if (!$firstB) do={ :set bannedJson ($bannedJson . ",") }
    :set firstB false
    :set bannedJson ($bannedJson . "{\\"address\\":\\"" . $bIp . "\\",\\"comment\\":\\"" . $bCom . "\\",\\"timeout\\":\\"" . $bTime . "\\"}")
  }
  :set bannedJson ($bannedJson . "]")
  :local scriptsJson "["
  :local firstS true
  :foreach s in=[/system script find where name~"^kiosk_"] do={
    :local sName [/system script get $s name]
    :local sCom [/system script get $s comment]
    :if ($sName != "kiosk_polling_agent") do={
      :if (!$firstS) do={ :set scriptsJson ($scriptsJson . ",") }
      :set firstS false
      :set scriptsJson ($scriptsJson . "{\\"name\\":\\"" . $sName . "\\",\\"comment\\":\\"" . $sCom . "\\"}")
    }
  }
  :set scriptsJson ($scriptsJson . "]")
  :local teleJson ("{\\"cpu\\":\\"" . ($res->"cpu-load") . "%\\",\\"mem\\":\\"" . ($res->"free-memory") . "\\",\\"uptime\\":\\"" . ($res->"uptime") . "\\",\\"version\\":\\"" . ($res->"version") . "\\",\\"board\\":\\"" . ($res->"board-name") . "\\",\\"wanRx\\":\\"" . $wanRx . "\\",\\"wanTx\\":\\"" . $wanTx . "\\",\\"wanRunning\\":\\"" . $wanRunning . "\\",\\"hosts\\":" . $hostsJson . ",\\"active\\":" . $activeJson . ",\\"banned\\":" . $bannedJson . ",\\"scripts\\":" . $scriptsJson . "}")
  :local fetchRes [/tool fetch url=$serverUrl http-method=post http-data=$teleJson http-header-field=$headers as-value output=user]
  :if (($fetchRes->"status") = "finished" && [:typeof ($fetchRes->"data")] = "str") do={
    :local rawData ($fetchRes->"data")
    :local parsedData [:deserialize from=json value=$rawData]
    :local action ($parsedData->"action")
    :if ($action = "run") do={
      :local commandId ($parsedData->"id")
      :local cmdText ($parsedData->"command")
      :local cmdFunc [:parse $cmdText]
      :local outputData [$cmdFunc]
      :local resObj { "id"=$commandId; "status"="done"; "output"=$outputData }
      :local resJson [:serialize to=json value=$resObj]
      /tool fetch url=$resultUrl http-method=post http-data=$resJson http-header-field=$headers as-value output=user
    }
  }
} on-error={}`;
}

async function updateRouter(rId, host, pass) {
  console.log(`\n--- Config Routeur R${rId} (${host}) ---`);
  const c = new RouterOSClient({ host, user: 'admin', password: pass, timeout: 5000 });
  
  // 1. Lire tous les scripts existants avec .proplist
  const allScripts = await c.execute('/system/script/print', ['=.proplist=.id,name,comment']);
  const existingPoll = allScripts.find(s => s.name === 'kiosk_polling_agent');
  const src = buildPollingSource(rId);

  if (existingPoll) {
    await c.execute('/system/script/set', [`=.id=${existingPoll['.id']}`, `=source=${src}`, `=comment=Kiosk Polling Agent R${rId}`]);
    console.log(`✅ kiosk_polling_agent mis à jour sur R${rId}`);
  } else {
    await c.execute('/system/script/add', ['=name=kiosk_polling_agent', `=source=${src}`, `=comment=Kiosk Polling Agent R${rId}`]);
    console.log(`✅ kiosk_polling_agent créé sur R${rId}`);
  }

  // 2. Scheduler sched_kiosk_poll
  const allScheds = await c.execute('/system/scheduler/print', ['=.proplist=.id,name,comment']);
  const existingSched = allScheds.find(s => s.name === 'sched_kiosk_poll');
  if (existingSched) {
    await c.execute('/system/scheduler/set', [`=.id=${existingSched['.id']}`, '=interval=2s', '=on-event=kiosk_polling_agent', `=comment=Kiosk Polling Scheduler R${rId}`, '=disabled=no']);
    console.log(`✅ sched_kiosk_poll mis à jour sur R${rId}`);
  } else {
    await c.execute('/system/scheduler/add', ['=name=sched_kiosk_poll', '=interval=2s', '=on-event=kiosk_polling_agent', `=comment=Kiosk Polling Scheduler R${rId}`, '=disabled=no']);
    console.log(`✅ sched_kiosk_poll créé sur R${rId}`);
  }

  // 3. kiosk_config initial
  const existingCfg = allScripts.find(s => s.name === 'kiosk_config');
  const defaultCfgComment = 'rate=512k;quota=20;time=15;ban=24;eject=60;mode=smart;ssid=VOTE ABH 2026 - GILDAS ZODOME';
  if (!existingCfg) {
    await c.execute('/system/script/add', ['=name=kiosk_config', `=comment=${defaultCfgComment}`, '=source=# KIOSK CONFIG STORE']);
    console.log(`✅ kiosk_config créé sur R${rId}`);
  } else {
    console.log(`ℹ️ kiosk_config déjà existant sur R${rId}: ${existingCfg.comment}`);
  }
}

async function main() {
  await updateRouter(1, '192.168.1.161', '4ZFF63YJ4H');
  await updateRouter(2, '192.168.1.162', '4ZFF63YJ4H');
  console.log('\n🎉 Configuration terminée avec succès sur R1 et R2 !');
}

main().catch(console.error);
