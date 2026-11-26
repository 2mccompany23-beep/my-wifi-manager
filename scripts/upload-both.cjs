const path = require('path');
const { execSync } = require('child_process');

const routers = ['192.168.1.161', '192.168.1.162'];
const password = '4ZFF63YJ4H';

const filesToUpload = [
  'login.html',
  'index.html',
  'status.html',
  'redirect.html',
  'rlogin.html',
  'alogin.html'
];

function uploadFile(ip, localPath, remotePath) {
  const psScript = `
    $ErrorActionPreference = 'Stop'
    $local = "${localPath.replace(/\\/g, '\\\\')}"
    $remote = "ftp://${ip}/${remotePath}"
    $req = [System.Net.FtpWebRequest]::Create($remote)
    $req.Credentials = New-Object System.Net.NetworkCredential('admin', '${password}')
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
  execSync('powershell -NoProfile -Command -', { input: psScript, encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'] });
}

for (const ip of routers) {
  console.log(`\n📡 Téléversement du pack complet Hotspot vers ${ip}...`);
  for (const f of filesToUpload) {
    const local = path.join(__dirname, '..', 'abh2026-vote-kiosk', 'router-config', f);
    uploadFile(ip, local, `hotspot/${f}`);
  }
  console.log(`✅ ${ip} : Pack complet (login, index, status, redirect, rlogin, alogin) déployé avec succès !`);
}
