const { RouterOSClient } = require('../abh2026-vote-kiosk/lib/routeros.js');

async function inspect(host, name) {
  console.log(`\n--- Inspecting ${name} (${host}) ---`);
  try {
    const c = new RouterOSClient({ host, user: 'admin', password: '4ZFF63YJ4H', timeout: 3500 });
    const scripts = await c.execute('/system/script/print');
    console.log('Scripts:');
    scripts.forEach(s => console.log(`  - ${s.name} (run-count: ${s['run-count']})`));

    const pollScript = scripts.find(s => s.name === 'kiosk_polling_agent');
    if (pollScript) {
      console.log('kiosk_polling_agent source:\n' + pollScript.source);
    }

    const scheds = await c.execute('/system/scheduler/print');
    console.log('Schedulers:');
    scheds.forEach(s => console.log(`  - ${s.name} interval: ${s.interval} on-event: ${s['on-event']} disabled: ${s.disabled}`));
  } catch (err) {
    console.error(`Error on ${name}:`, err.message);
  }
}

async function main() {
  await inspect('192.168.1.161', 'Routeur 1');
  await inspect('192.168.1.162', 'Routeur 2');
}

main();

