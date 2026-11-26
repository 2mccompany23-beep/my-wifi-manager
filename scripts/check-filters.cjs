const { RouterOSClient } = require('../abh2026-vote-kiosk/lib/routeros.js');

async function check() {
  const c = new RouterOSClient({ host: '192.168.1.161', user: 'admin', password: '4ZFF63YJ4H' });
  const filters = await c.execute('/ip/firewall/filter/print');
  console.log('--- FILTER RULES ON ROUTEUR 1 (' + filters.length + ' rules) ---');
  filters.forEach((f, i) => {
    console.log(`${i}: chain=${f.chain} action=${f.action} src-address-list=${f['src-address-list'] || ''} dst-address-list=${f['dst-address-list'] || ''} comment="${f.comment || ''}" disabled=${f.disabled}`);
  });

  const nat = await c.execute('/ip/firewall/nat/print');
  console.log('--- NAT RULES ON ROUTEUR 1 (' + nat.length + ' rules) ---');
  nat.forEach((n, i) => {
    console.log(`${i}: chain=${n.chain} action=${n.action} to-ports=${n['to-ports'] || ''} comment="${n.comment || ''}"`);
  });
}

check().catch(console.error);
