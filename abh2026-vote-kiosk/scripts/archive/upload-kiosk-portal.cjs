const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROUTER_IP = process.env.ROUTER_IP || '192.168.88.1';
const PASSWORDS = ['4ZFF63YJ4H', '4ZFF63YJ4H', 'admin', ''];

function findWorkingPassword() {
  for (const pass of PASSWORDS) {
    const ps = `
      $ErrorActionPreference = 'Stop'
      $req = [System.Net.FtpWebRequest]::Create('ftp://${ROUTER_IP}/')
      $req.Credentials = New-Object System.Net.NetworkCredential('admin', '${pass}')
      $req.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
      $req.Timeout = 2500
      try {
        $res = $req.GetResponse()
        $res.Close()
        exit 0
      } catch {
        exit 1
      }
    `;
    try {
      execSync('powershell -NoProfile -Command -', { input: ps, encoding: 'utf8' });
      return pass;
    } catch (_) {}
  }
  return '4ZFF63YJ4H';
}

function uploadFile(localPath, remotePath, password) {
  const psScript = `
    $ErrorActionPreference = 'Stop'
    $local = "${localPath.replace(/\\/g, '\\\\')}"
    $remote = "ftp://${ROUTER_IP}/${remotePath}"
    $req = [System.Net.FtpWebRequest]::Create($remote)
    $req.Credentials = New-Object System.Net.NetworkCredential('admin', '${password}')
    $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $req.UseBinary = $true
    $req.Timeout = 10000

    $bytes = [System.IO.File]::ReadAllBytes($local)
    $req.ContentLength = $bytes.Length
    $stream = $req.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()
    $res = $req.GetResponse()
    Write-Host "Statut: $($res.StatusDescription.Trim())"
    $res.Close()
  `;

  execSync('powershell -NoProfile -Command -', {
    input: psScript,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'inherit']
  });
}

function ensureDir(remoteDir, password) {
  const psScript = `
    $ErrorActionPreference = 'SilentlyContinue'
    $remote = "ftp://${ROUTER_IP}/${remoteDir}"
    $req = [System.Net.FtpWebRequest]::Create($remote)
    $req.Credentials = New-Object System.Net.NetworkCredential('admin', '${password}')
    $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
    $res = $req.GetResponse()
    $res.Close()
  `;
  try {
    execSync('powershell -NoProfile -Command -', { input: psScript, encoding: 'utf8' });
  } catch (_) {}
}

async function main() {
  console.log(`\n📡 Téléversement du portail Kiosk vers ftp://${ROUTER_IP}...`);
  const password = findWorkingPassword();
  console.log(`🔑 Authentification FTP avec le mot de passe routeur actif...`);
  
  ensureDir('hotspot', password);

  const loginLocal = path.join(__dirname, '..', 'router-config', 'login.html');
  const statusLocal = path.join(__dirname, '..', 'router-config', 'status.html');

  console.log('📤 Envoi de login.html vers hotspot/login.html (avec redirection automatique vers Gildas Zodome)...');
  uploadFile(loginLocal, 'hotspot/login.html', password);
  console.log('✅ hotspot/login.html téléversé avec SUCCÈS !');

  console.log('📤 Envoi de status.html vers hotspot/status.html...');
  uploadFile(statusLocal, 'hotspot/status.html', password);
  console.log('✅ hotspot/status.html téléversé avec SUCCÈS !');

  console.log('🎉 Le portail de redirection captif est à jour sur le routeur !\n');
}

main();
