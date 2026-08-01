import SftpClient from 'ssh2-sftp-client';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

// Charger les variables d'environnement depuis .env
const require = createRequire(import.meta.url);
try {
  const dotenv = require('dotenv');
  dotenv.config();
} catch (e) {}

// Config depuis .env (prioritaire) ou sftp.json (fallback)
const sftpConfigPath = path.join(process.cwd(), '.vscode', 'sftp.json');
let config = {
  host: process.env.SFTP_HOST || 'ssh-2mc.alwaysdata.net',
  port: parseInt(process.env.SFTP_PORT || '22'),
  username: process.env.SFTP_USERNAME || '2mc',
  password: process.env.SFTP_PASSWORD || '',
  remotePath: process.env.SFTP_REMOTE_PATH || 'www/'
};

// Fallback vers sftp.json si le mot de passe n'est pas dans .env
if (!config.password && fs.existsSync(sftpConfigPath)) {
  try {
    const raw = fs.readFileSync(sftpConfigPath, 'utf8');
    const parsed = JSON.parse(raw);
    config = {
      host: parsed.host || config.host,
      port: parsed.port || config.port,
      username: parsed.username || config.username,
      password: parsed.password || config.password,
      remotePath: parsed.remotePath || config.remotePath
    };
  } catch (e) {}
}

if (!config.password) {
  console.error('❌ SFTP_PASSWORD manquant. Définissez-le dans .env ou .vscode/sftp.json');
  process.exit(1);
}

async function deploy() {
  const client = new SftpClient();
  console.log(`\n🚀 Début du déploiement automatique vers AlwaysData (${config.host})...\n`);

  try {
    await client.connect({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password
    });

    console.log('✅ Connexion SFTP établie avec succès !');

    const remoteBase = config.remotePath.endsWith('/') ? config.remotePath : `${config.remotePath}/`;

    // 1. Televersement de server.bundle.cjs
    const localBundle = path.join(process.cwd(), 'server.bundle.cjs');
    if (fs.existsSync(localBundle)) {
      console.log('📤 Transfert de server.bundle.cjs...');
      await client.fastPut(localBundle, `${remoteBase}server.bundle.cjs`);
      console.log('✅ server.bundle.cjs envoyé avec succès !');
    }

    // 2. Televersement du dossier dist/
    const localDist = path.join(process.cwd(), 'dist');
    if (fs.existsSync(localDist)) {
      console.log('📂 Transfert du dossier dist/...');
      await client.uploadDir(localDist, `${remoteBase}dist`);
      console.log('✅ Dossier dist/ envoyé avec succès !');
    }

    // 3. Demande de redemarrage AlwaysData via tmp/restart.txt
    try {
      const restartDir = `${remoteBase}tmp`;
      const restartFile = `${remoteBase}tmp/restart.txt`;
      await client.mkdir(restartDir, true);
      const buffer = Buffer.from(new Date().toISOString());
      await client.put(buffer, restartFile);
      console.log('🔁 Signal de redémarrage (tmp/restart.txt) envoyé !');
    } catch (err) {
      console.warn('⚠️ Note redémarrage:', err.message);
    }

    console.log('\n🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS ! Votre site est en ligne et à jour.\n');
  } catch (err) {
    console.error('❌ Erreur lors du déploiement:', err.message);
  } finally {
    await client.end();
  }
}

deploy();
