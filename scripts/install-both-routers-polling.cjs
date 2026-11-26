// scripts/install-both-routers-polling.cjs
// Installe ou met à jour l'agent de polling et de synchronisation des scripts RouterOS sur R1 et R2

const net = require('net');

class RouterOSClient {
  constructor({ host, user, password, port = 8728, timeout = 5000 }) {
    this.host = host;
    this.user = user;
    this.password = password;
    this.port = port;
    this.timeout = timeout;
    this.socket = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();
      this.socket.setTimeout(this.timeout);

      this.socket.on('connect', async () => {
        try {
          await this.login();
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });

      this.socket.on('timeout', () => {
        this.socket.destroy();
        reject(new Error(`Timeout de connexion vers ${this.host}:${this.port}`));
      });

      this.socket.on('error', (err) => {
        reject(err);
      });

      this.socket.connect(this.port, this.host);
    });
  }

  close() {
    if (this.socket) {
      try { this.socket.destroy(); } catch (_) {}
      this.socket = null;
    }
  }

  encodeLength(len) {
    if (len < 0x80) return Buffer.from([len]);
    if (len < 0x4000) return Buffer.from([(len >> 8) | 0x80, len & 0xFF]);
    if (len < 0x200000) return Buffer.from([(len >> 16) | 0xC0, (len >> 8) & 0xFF, len & 0xFF]);
    if (len < 0x10000000) return Buffer.from([(len >> 24) | 0xE0, (len >> 16) & 0xFF, (len >> 8) & 0xFF, len & 0xFF]);
    return Buffer.from([0xF0, (len >> 24) & 0xFF, (len >> 16) & 0xFF, (len >> 8) & 0xFF, len & 0xFF]);
  }

  writeWord(word) {
    const buf = Buffer.from(word, 'utf8');
    const lenBuf = this.encodeLength(buf.length);
    this.socket.write(Buffer.concat([lenBuf, buf]));
  }

  writeSentence(words) {
    for (const w of words) this.writeWord(w);
    this.socket.write(Buffer.from([0]));
  }

  readSentence() {
    return new Promise((resolve, reject) => {
      const words = [];
      let buffer = Buffer.alloc(0);

      const onData = (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);

        while (true) {
          if (buffer.length === 0) return;

          let len = 0;
          let offset = 0;
          const b1 = buffer[0];

          if ((b1 & 0x80) === 0) {
            len = b1;
            offset = 1;
          } else if ((b1 & 0xC0) === 0x80) {
            if (buffer.length < 2) return;
            len = ((b1 & 0x3F) << 8) | buffer[1];
            offset = 2;
          } else if ((b1 & 0xE0) === 0xC0) {
            if (buffer.length < 3) return;
            len = ((b1 & 0x1F) << 16) | (buffer[1] << 8) | buffer[2];
            offset = 3;
          } else if ((b1 & 0xF0) === 0xE0) {
            if (buffer.length < 4) return;
            len = ((b1 & 0x0F) << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3];
            offset = 4;
          } else {
            if (buffer.length < 5) return;
            len = (buffer[1] << 24) | (buffer[2] << 16) | (buffer[3] << 8) | buffer[4];
            offset = 5;
          }

          if (len === 0) {
            buffer = buffer.slice(offset);
            this.socket.removeListener('data', onData);
            this.socket.removeListener('error', onError);
            resolve(words);
            return;
          }

          if (buffer.length < offset + len) return;

          const word = buffer.slice(offset, offset + len).toString('utf8');
          words.push(word);
          buffer = buffer.slice(offset + len);
        }
      };

      const onError = (err) => {
        this.socket.removeListener('data', onData);
        reject(err);
      };

      this.socket.on('data', onData);
      this.socket.once('error', onError);
    });
  }

  async login() {
    this.writeSentence(['/login', `=name=${this.user}`, `=password=${this.password}`]);
    const reply = await this.readSentence();
    if (reply[0] === '!done') return true;
    if (reply[0] === '!trap') {
      const msg = reply.find(w => w.startsWith('=message='))?.replace('=message=', '') || 'Login failed';
      throw new Error(`Auth Error: ${msg}`);
    }
    throw new Error('Réponse inattendue lors de la connexion RouterOS');
  }

  async execute(command, params = []) {
    this.writeSentence([command, ...params]);
    const results = [];
    while (true) {
      const sentence = await this.readSentence();
      const reply = sentence[0];
      if (reply === '!re') {
        const row = {};
        for (let i = 1; i < sentence.length; i++) {
          const w = sentence[i];
          const eq = w.indexOf('=');
          if (eq > 0) {
            const k = w.substring(1, eq);
            const v = w.substring(eq + 1);
            row[k] = v;
          }
        }
        results.push(row);
      } else if (reply === '!done') {
        return results;
      } else if (reply === '!trap') {
        const msg = sentence.find(w => w.startsWith('=message='))?.replace('=message=', '') || 'Command failed';
        throw new Error(`Trap Error (${command}): ${msg}`);
      }
    }
  }
}

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

async function configureRouter(rId, host, pass) {
  console.log(`\n========================================`);
  console.log(`🚀 Configuration Routeur R${rId} (${host})...`);
  console.log(`========================================`);

  const client = new RouterOSClient({ host, user: 'admin', password: pass, timeout: 5000 });
  await client.connect();
  console.log(`✅ Connecté à R${rId}`);

  // 1. Script kiosk_polling_agent
  const scriptSource = buildPollingSource(rId);
  const existingScripts = await client.execute('/system/script/print', ['?name=kiosk_polling_agent']);
  if (existingScripts.length > 0) {
    await client.execute('/system/script/set', [
      `=.id=${existingScripts[0]['.id']}`,
      `=source=${scriptSource}`,
      `=comment=Kiosk Polling Agent R${rId}`
    ]);
    console.log(`✅ Script 'kiosk_polling_agent' mis à jour sur R${rId}`);
  } else {
    await client.execute('/system/script/add', [
      '=name=kiosk_polling_agent',
      `=source=${scriptSource}`,
      `=comment=Kiosk Polling Agent R${rId}`
    ]);
    console.log(`✅ Script 'kiosk_polling_agent' créé sur R${rId}`);
  }

  // 2. Scheduler sched_kiosk_poll
  const existingSched = await client.execute('/system/scheduler/print', ['?name=sched_kiosk_poll']);
  if (existingSched.length > 0) {
    await client.execute('/system/scheduler/set', [
      `=.id=${existingSched[0]['.id']}`,
      '=interval=2s',
      '=on-event=kiosk_polling_agent',
      `=comment=Kiosk Polling Scheduler R${rId}`,
      '=disabled=no'
    ]);
    console.log(`✅ Scheduler 'sched_kiosk_poll' mis à jour sur R${rId}`);
  } else {
    await client.execute('/system/scheduler/add', [
      '=name=sched_kiosk_poll',
      '=interval=2s',
      '=on-event=kiosk_polling_agent',
      `=comment=Kiosk Polling Scheduler R${rId}`,
      '=disabled=no'
    ]);
    console.log(`✅ Scheduler 'sched_kiosk_poll' créé sur R${rId}`);
  }

  // 3. Configuration script initial kiosk_config (si non présent)
  const existingConfig = await client.execute('/system/script/print', ['?name=kiosk_config']);
  const defaultCfgComment = 'rate=512k;quota=20;time=15;ban=24;eject=60;mode=smart;ssid=VOTE ABH 2026 - GILDAS ZODOME';
  if (existingConfig.length === 0) {
    await client.execute('/system/script/add', [
      '=name=kiosk_config',
      `=comment=${defaultCfgComment}`,
      '=source=# KIOSK CONFIG STORE'
    ]);
    console.log(`✅ Script 'kiosk_config' créé avec la configuration par défaut sur R${rId}`);
  } else {
    console.log(`ℹ️ Script 'kiosk_config' existant sur R${rId}: ${existingConfig[0].comment}`);
  }

  // 4. Tester l'exécution immédiate
  try {
    await client.execute('/system/script/run', ['=number=kiosk_polling_agent']);
    console.log(`⚡ Test d'exécution 'kiosk_polling_agent' réussi sur R${rId}`);
  } catch (err) {
    console.warn(`⚠️ Test d'exécution: ${err.message}`);
  }

  client.close();
}

async function main() {
  try {
    await configureRouter(1, '192.168.1.161', '4ZFF63YJ4H');
    await configureRouter(2, '192.168.1.162', '4ZFF63YJ4H');
    console.log('\n🎉 Configuration terminée avec succès sur R1 et R2 !');
  } catch (err) {
    console.error('❌ Erreur configuration routeurs:', err);
  }
}

main();
