const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const loginPath = path.resolve(__dirname, '..', 'abh2026-vote-kiosk', 'router-config', 'login.html');
const routers = [
  { host: '192.168.1.161', user: 'admin', pass: '4ZFF63YJ4H' },
  { host: '192.168.1.162', user: 'admin', pass: '4ZFF63YJ4H' }
];

console.log('📤 Téléversement de login.html vers les 2 routeurs MikroTik...');
for (const r of routers) {
  const ps = `
    $ErrorActionPreference = 'Stop'
    $local = "${loginPath.replace(/\\/g, '\\\\')}"
    $remote = "ftp://${r.host}/hotspot/login.html"
    $req = [System.Net.FtpWebRequest]::Create($remote)
    $req.Credentials = New-Object System.Net.NetworkCredential('${r.user}', '${r.pass}')
    $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $req.UseBinary = $true
    $req.Timeout = 5000
    $bytes = [System.IO.File]::ReadAllBytes($local)
    $req.ContentLength = $bytes.Length
    $stream = $req.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()
    $res = $req.GetResponse()
    Write-Host "Uploaded login.html to $remote - $($res.StatusDescription.Trim())"
    $res.Close()
  `;
  try {
    execSync('powershell -NoProfile -Command -', { input: ps, encoding: 'utf8', stdio: 'inherit' });
    console.log(`✅ Succès sur ${r.host}`);
  } catch (err) {
    console.error(`❌ Échec sur ${r.host}:`, err.message);
  }
}
