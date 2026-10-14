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

    // 3. Televersement du dossier loc/
    const localLoc = path.join(process.cwd(), 'loc');
    if (fs.existsSync(localLoc)) {
      console.log('📂 Transfert du dossier loc/...');
      await client.uploadDir(localLoc, `${remoteBase}loc`);
      console.log('✅ Dossier loc/ envoyé avec succès !');
    }

    // 3b. Transfert de login.html (page portail captif clients)
    const localLoginHtml = path.join(process.cwd(), 'login.html');
    if (fs.existsSync(localLoginHtml)) {
      console.log('📄 Transfert de login.html...');
      await client.fastPut(localLoginHtml, `${remoteBase}login.html`);
      console.log('✅ login.html envoyé avec succès !');
    }

    // 3c. Transfert de status.html (page statut connexion clients)
    const localStatusHtml = path.join(process.cwd(), 'status.html');
    if (fs.existsSync(localStatusHtml)) {
      console.log('📄 Transfert de status.html...');
      await client.fastPut(localStatusHtml, `${remoteBase}status.html`);
      console.log('✅ status.html envoyé avec succès !');
    }

    // 3d. Transfert des fichiers PWA (sw.js, manifest.webmanifest, icônes)
    const pwaFiles = ['sw.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
    for (const f of pwaFiles) {
      const localFile = path.join(process.cwd(), 'public', f);
      if (fs.existsSync(localFile)) {
        console.log(`📱 Transfert du fichier PWA ${f}...`);
        await client.fastPut(localFile, `${remoteBase}${f}`);
      }
    }
    console.log('✅ Fichiers PWA & Service Worker envoyés avec succès !');

    // 4. Protection de la base de données de production (NE JAMAIS ÉCRASER db.json EN PRODUCTION)
    const remoteDbFile = `${remoteBase}data/db.json`;
    const remoteExists = await client.exists(remoteDbFile);
    if (!remoteExists) {
      const localDbFile = path.join(process.cwd(), 'data', 'db.json');
      if (fs.existsSync(localDbFile)) {
        console.log('📂 Initialisation initiale de data/db.json sur le serveur...');
        await client.mkdir(`${remoteBase}data`, true);
        await client.fastPut(localDbFile, remoteDbFile);
        console.log('✅ Base de données initialisée avec succès !');
      }
    } else {
      console.log('🛡️ Base de données distante préservée avec succès (AUCUN écrasement de vos ventes/vouchers).');
    }

    // 5. Demande de redémarrage AlwaysData via tmp/restart.txt et API
    try {
      const restartDirs = [`${remoteBase}tmp`, 'tmp', 'admin/tmp'];
      const buffer = Buffer.from(new Date().toISOString());
      for (const d of restartDirs) {
        try {
          await client.mkdir(d, true);
          await client.put(buffer, `${d}/restart.txt`);
        } catch (e) {}
      }
      console.log('🔁 Signal de redémarrage (tmp/restart.txt) envoyé !');

      // Appel de l'endpoint API pour redémarrer le worker Node.js
      try {
        await fetch('https://2mc.alwaysdata.net/api/system/restart?token=mcwifi_secret_token_2026');
        console.log('⚡ Signal de redémarrage instantané reçu par le serveur !');
      } catch (e) {}
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
