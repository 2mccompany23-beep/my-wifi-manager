const { Client } = require('ssh2');

function sendUnlock(host, password, name) {
  return new Promise((resolve) => {
    const conn = new Client();
    conn.on('ready', () => {
      console.log(`📡 SSH connecté à ${name} (${host})...`);
      conn.exec('/system device-mode update mode=enterprise', (err, stream) => {
        if (err) {
          console.log(`❌ Erreur sur ${name}:`, err.message);
          conn.end();
          return resolve();
        }
        stream.on('close', () => {
          conn.end();
          resolve();
        }).on('data', (data) => {
          console.log(`[${name}]`, data.toString().trim());
        });
      });
    }).on('error', (err) => {
      console.log(`❌ Impossible de joindre ${name} (${host}):`, err.message);
      resolve();
    }).connect({
      host,
      port: 22,
      username: 'admin',
      password,
      readyTimeout: 4000
    });
  });
}

async function main() {
  console.log('======================================================================');
  console.log('🔓 ACTIVATION DU MODE ENTERPRISE (Déblocage Hotspot) SUR LES 2 ROUTEURS');
  console.log('======================================================================\n');
  await sendUnlock('10.50.0.1', '4ZFF63YJ4H', 'Routeur 1');
  await sendUnlock('10.54.0.1', '4ZFF63YJ4H', 'Routeur 2');
  console.log('\n======================================================================');
  console.log('⚠️ INSTRUCTION PHYSIQUE IMPORTANTE :');
  console.log('Débranchez et rebranchez la prise électrique des 2 routeurs');
  console.log('(ou appuyez 1 seconde sur le bouton Reset/Mode) pour valider le déblocage !');
  console.log('======================================================================\n');
}

main();
