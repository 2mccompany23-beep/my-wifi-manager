const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n📡 [MikroTik Upload] Préparation du transfert vers le routeur...\n');

// 1. Lire la configuration depuis data/db.json
const dbPath = path.join(__dirname, '..', 'data', 'db.json');
if (!fs.existsSync(dbPath)) {
  console.error('❌ Fichier data/db.json introuvable.');
  process.exit(1);
}

let db;
try {
  db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
} catch (e) {
  console.error('❌ Erreur de lecture de data/db.json:', e.message);
  process.exit(1);
}

const routerIp = db.settings?.routerIp || '10.0.0.254';
const routerUser = db.settings?.routerUser || 'admin';
const routerPass = db.settings?.routerPass || '';
const localFile = path.join(__dirname, '..', 'loc', 'login.html');

if (!fs.existsSync(localFile)) {
  console.error('❌ Fichier loc/login.html introuvable.');
  process.exit(1);
}

console.log(`🎯 Cible : Routeur MikroTik à ftp://${routerIp}/hotspot/login.html`);
console.log(`👤 Utilisateur : ${routerUser}`);
console.log(`📄 Fichier source : loc/login.html (${fs.statSync(localFile).size} octets)\n`);

// 2. Script PowerShell pour transfert FTP direct et robuste
const psScript = `
$ErrorActionPreference = 'Stop'
$user = '${routerUser.replace(/'/g, "''")}'
$pass = '${routerPass.replace(/'/g, "''")}'
$ip = '${routerIp}'
$localPath = '${localFile.replace(/'/g, "''")}'

# Tester d'abord si le dossier hotspot existe ou s'il faut le téléverser à la racine
$targetUrl = "ftp://$ip/hotspot/login.html"

Write-Host "Envoi de login.html vers $targetUrl ..."

$req = [System.Net.FtpWebRequest]::Create($targetUrl)
$req.Credentials = New-Object System.Net.NetworkCredential($user, $pass)
$req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
$req.UseBinary = $true
$req.Timeout = 8000

$fileBytes = [System.IO.File]::ReadAllBytes($localPath)
$req.ContentLength = $fileBytes.Length

$stream = $req.GetRequestStream()
$stream.Write($fileBytes, 0, $fileBytes.Length)
$stream.Close()

$res = $req.GetResponse()
Write-Host "Statut réponse: $($res.StatusDescription.Trim())"
$res.Close()

Write-Host "✅ login.html transféré avec SUCCÈS sur le routeur MikroTik !"
`;

try {
  const output = execSync('powershell -NoProfile -ExecutionPolicy Bypass -Command -', {
    input: psScript,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'inherit']
  });
  console.log(output);
  console.log('🎉 Le portail captif est à jour sur votre routeur MikroTik !\n');
} catch (err) {
  console.error('\n❌ Échec du transfert FTP vers le routeur MikroTik :');
  console.error('Assurez-vous que votre PC est connecté au Wi-Fi du routeur et que le service FTP (port 21) est actif.\n');
  process.exit(1);
}
