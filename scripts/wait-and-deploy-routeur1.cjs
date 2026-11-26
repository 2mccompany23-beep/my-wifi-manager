const net = require('net');
const { execSync, fork } = require('child_process');

function checkPort(host, port, timeout = 1500) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(timeout);
    s.connect(port, host, () => {
      s.destroy();
      resolve(true);
    });
    s.on('error', () => { s.destroy(); resolve(false); });
    s.on('timeout', () => { s.destroy(); resolve(false); });
  });
}

async function loop() {
  console.log('⏳ En attente du branchement du Routeur 1 sur le PC (Port 2 / RJ45)...');
  console.log('Dès que vous branchez le câble, le script le détecte et applique tout automatiquement !');

  for (let i = 0; i < 30; i++) {
    const ok = await checkPort('10.50.0.1', 8728);
    if (ok) {
      console.log('\n🟢 Routeur 1 DÉTECTÉ sur 10.50.0.1 ! Lancement du déploiement...');
      require('./deploy-routeur1-direct.cjs');
      return;
    }
    // Si pas encore joignable, tentative de renouvellement de bail DHCP
    if (i % 3 === 0 && i > 0) {
      try {
        execSync('powershell -Command "ipconfig /renew Ethernet"', { stdio: 'ignore' });
      } catch (_) {}
    }
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log('\n⏱️ Temps d attente écoulé. Vous pourrez relancer dès que le câble est branché.');
}

loop();

