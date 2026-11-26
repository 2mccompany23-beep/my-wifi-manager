const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const routers = [
  { id: 1, name: 'Routeur 1 (Principal)', hosts: ['192.168.1.68', '192.168.1.71', '192.168.1.161', '10.50.0.1'] },
  { id: 2, name: 'Routeur 2 (Secondaire)', hosts: ['192.168.1.67', '192.168.1.72', '192.168.1.162', '10.54.0.1'] }
];

const passwords = ['4ZFF63YJ4H', '1234@', 'admin', ''];

const routerConfigDir = path.resolve(__dirname, '..', 'abh2026-vote-kiosk', 'router-config');
const filesToUpload = [
  'login.html',
  'gildas.webp',
  'admin.html',
  'status.html',
  'index.html',
  'redirect.html',
  'rlogin.html',
  'alogin.html'
];

function testFtp(host, user, pass) {
  const ps = `
    $req = [System.Net.FtpWebRequest]::Create("ftp://${host}/hotspot/")
    $req.Credentials = New-Object System.Net.NetworkCredential("${user}", "${pass}")
    $req.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
    $req.Timeout = 3000
    try {
      $res = $req.GetResponse()
      $res.Close()
      Write-Host "OK"
    } catch {
      Write-Host "ERR: $($_.Exception.Message)"
    }
  `;
  try {
    const out = execSync('powershell -NoProfile -Command -', { input: ps, encoding: 'utf8', timeout: 5000 });
    return out.includes('OK');
  } catch (_) {
    return false;
  }
}

function uploadFile(host, user, pass, localPath, remotePath) {
  const ps = `
    $ErrorActionPreference = 'Stop'
    $local = "${localPath.replace(/\\/g, '\\\\')}"
    $remote = "ftp://${host}/${remotePath}"
    $req = [System.Net.FtpWebRequest]::Create($remote)
    $req.Credentials = New-Object System.Net.NetworkCredential("${user}", "${pass}")
    $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $req.UseBinary = $true
    $req.Timeout = 8000
    $bytes = [System.IO.File]::ReadAllBytes($local)
    $req.ContentLength = $bytes.Length
    $stream = $req.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()
    $res = $req.GetResponse()
    Write-Host "   -> ${remotePath}: $($res.StatusDescription.Trim())"
    $res.Close()
  `;
  execSync('powershell -NoProfile -Command -', { input: ps, encoding: 'utf8', timeout: 10000 });
}

async function run() {
  console.log('========================================================');
  console.log('🚀 TÉLÉVERSEMENT DES PAGES HOTSPOT SUR LES ROUTEURS MIKROTIK');
  console.log('========================================================\n');

  for (const r of routers) {
    console.log(`\n🔍 Recherche de la connexion FTP pour ${r.name}...`);
    let activeHost = null;
    let activePass = null;

    for (const h of r.hosts) {
      for (const p of passwords) {
        if (testFtp(h, 'admin', p)) {
          activeHost = h;
          activePass = p;
          console.log(`   ✅ Trouvé : ${h} (Mot de passe validé)`);
          break;
        }
      }
      if (activeHost) break;
    }

    if (!activeHost) {
      console.error(`   ❌ Impossible d'accéder au FTP de ${r.name} sur les hôtes testés (${r.hosts.join(', ')})`);
      continue;
    }

    console.log(`📤 Envoi des ${filesToUpload.length} fichiers vers ftp://${activeHost}/hotspot/ ...`);
    for (const file of filesToUpload) {
      const local = path.join(routerConfigDir, file);
      if (!fs.existsSync(local)) {
        console.warn(`   ⚠️ Fichier introuvable localement : ${file}`);
        continue;
      }
      try {
        uploadFile(activeHost, 'admin', activePass, local, `hotspot/${file}`);
        console.log(`   ✅ ${file} téléversé avec succès !`);
      } catch (e) {
        console.error(`   ❌ Échec pour ${file} :`, e.message);
      }
    }
  }

  console.log('\n========================================================');
  console.log('🎉 TÉLÉVERSEMENT TERMINÉ SUR LES ROUTEURS MIKROTIK');
  console.log('========================================================');
}

run();
