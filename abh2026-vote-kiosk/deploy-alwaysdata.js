import SftpClient from 'ssh2-sftp-client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultKeyPath = path.join(process.env.USERPROFILE || process.env.HOME || '', '.ssh', 'id_rsa');

let config = {
  host: process.env.SFTP_HOST || 'ssh-charmeldev.alwaysdata.net',
  port: parseInt(process.env.SFTP_PORT || '22'),
  username: process.env.SFTP_USERNAME || 'charmeldev_01',
  password: process.env.SFTP_PASSWORD || '',
  privateKey: fs.existsSync(defaultKeyPath) ? fs.readFileSync(defaultKeyPath, 'utf8') : null,
  remotePath: '/home/charmeldev/abh2026top10vote/'
};

async function deploy() {
  const client = new SftpClient();
  console.log(`\n=======================================================`);
  console.log(`🚀 Déploiement de abh2026-vote-kiosk vers AlwaysData`);
  console.log(`   Serveur : ${config.host}`);
  console.log(`   Compte  : ${config.username}`);
  console.log(`   Cible   : ${config.remotePath}`);
  console.log(`   URL     : https://charmeldev.alwaysdata.net`);
  console.log(`   ⚠️ STRICT : https://mcwifi.net et 2mc.alwaysdata.net sont intacts.`);
  console.log(`=======================================================\n`);

  try {
    const connectOptions = {
      host: config.host,
      port: config.port,
      username: config.username
    };

    if (config.privateKey) {
      connectOptions.privateKey = config.privateKey;
      console.log('🔑 Authentification par clé SSH privée (id_rsa)...');
    } else if (config.password) {
      connectOptions.password = config.password;
      console.log('🔑 Authentification par mot de passe...');
    } else {
      throw new Error('Aucune clé SSH ni mot de passe disponible pour la connexion.');
    }

    await client.connect(connectOptions);
    console.log('✅ Connexion SFTP établie avec succès !');

    // 1. Nettoyage ciblé du code (sans toucher aux node_modules NI au dossier data/ contenant les paramètres)
    console.log('🧹 Nettoyage des anciens fichiers de code sur AlwaysData (le dossier data/ reste préservé)...');
    try {
      const cleanCmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=yes ${config.username}@${config.host} "cd ${config.remotePath} && rm -rf lib public scripts server.js package.json package-lock.json 2>/dev/null || true"`;
      execSync(cleanCmd, { stdio: 'ignore' });
      console.log('   ✅ Anciens fichiers de code supprimés sur AlwaysData (data/ préservé).');
    } catch (_) {}

    // 2. Fichiers racine du Kiosk
    const filesToUpload = ['server.js', 'package.json', 'README.md'];
    for (const file of filesToUpload) {
      const localPath = path.join(__dirname, file);
      if (fs.existsSync(localPath)) {
        console.log(`📤 Envoi de ${file}...`);
        await client.fastPut(localPath, `${config.remotePath}${file}`);
      }
    }

    // 3. Dossiers lib/, public/, router-config/, scripts/
    const dirsToUpload = ['lib', 'public', 'router-config', 'scripts'];
    for (const dir of dirsToUpload) {
      const localDir = path.join(__dirname, dir);
      if (fs.existsSync(localDir)) {
        console.log(`📂 Envoi du dossier ${dir}/...`);
        await client.uploadDir(localDir, `${config.remotePath}${dir}`);
      }
    }

    // 4. Dossiers d'exécution et permissions
    await client.mkdir(`${config.remotePath}data`, true);
    await client.mkdir(`${config.remotePath}tmp`, true);

    const adminPassLocal = path.join(__dirname, 'data', '.admin_password');
    if (fs.existsSync(adminPassLocal)) {
      console.log('📤 Envoi de data/.admin_password...');
      await client.fastPut(adminPassLocal, `${config.remotePath}data/.admin_password`);
    }

    try {
      // SÉCURITÉ D1 : chmod 775 pour permettre au groupe web (charmeldev) d'écrire SQLite/JSON dans data/
      const chmodCmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=yes ${config.username}@${config.host} "chmod 775 ${config.remotePath}data ${config.remotePath}tmp 2>/dev/null || true; chmod 664 ${config.remotePath}data/*.json ${config.remotePath}data/*.sqlite ${config.remotePath}data/.admin_password ${config.remotePath}data/.auth_secret 2>/dev/null || true"`;
      execSync(chmodCmd, { stdio: 'ignore' });
    } catch (_) {}

    console.log('✅ Synchronisation des fichiers Kiosk terminée.');

    // 5. Installation des dépendances à distance via SSH
    console.log('\n📦 Installation des dépendances Node.js du Kiosk (express, cors)...');
    try {
      const sshCmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=yes ${config.username}@${config.host} "cd ${config.remotePath} && npm install --omit=dev"`;
      const npmOutput = execSync(sshCmd, { encoding: 'utf8', stdio: 'pipe' });
      console.log(npmOutput);
      console.log('✅ Dépendances installées avec succès sur AlwaysData !');
    } catch (npmErr) {
      console.warn('⚠️ Avertissement lors du npm install distant:', npmErr.message);
    }

    // 6. Signal de redémarrage du serveur Node.js AlwaysData
    console.log('\n🔁 Envoi du signal de redémarrage AlwaysData...');
    try {
      const restartCmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=yes ${config.username}@${config.host} "touch ${config.remotePath}tmp/restart.txt 2>/dev/null; pkill -f 'node server.js' 2>/dev/null || true"`;
      execSync(restartCmd, { stdio: 'ignore', timeout: 8000 });
      console.log('   ✅ Signal de redémarrage transmis avec succès !');
    } catch (_) {}

    try {
      const restartCurl = `ssh -o BatchMode=yes -o StrictHostKeyChecking=yes ${config.username}@${config.host} "curl -s -k --max-time 5 -X POST 'https://charmeldev.alwaysdata.net/api/admin/restart?token=kiosk_poll_secret_2026' 2>/dev/null || true"`;
      execSync(restartCurl, { stdio: 'ignore', timeout: 8000 });
      console.log('   ✅ Requête /api/admin/restart envoyée au serveur Node.js !');
    } catch (_) {}

    console.log('\n=======================================================');
    console.log('🎉 DÉPLOIEMENT DU KIOSK TERMINÉ AVEC SUCCÈS SUR ALWAYSDATA !');
    console.log('=======================================================');
    console.log('🌐 Accédez en ligne sur : https://charmeldev.alwaysdata.net');
    console.log('🔒 Mot de passe Superviseur actif : 9NK6G8');
    console.log('=======================================================\n');

  } catch (err) {
    console.error('❌ Erreur de déploiement:', err.message);
  } finally {
    await client.end();
  }
}

deploy();
