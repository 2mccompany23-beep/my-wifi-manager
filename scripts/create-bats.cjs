const fs = require('fs');
const path = require('path');

const kioskDir = path.join(__dirname, '..', 'abh2026-vote-kiosk');
const rootDir = path.join(__dirname, '..');

const fixBat = [
  '@echo off',
  'net session >nul 2>&1',
  'if %errorlevel% neq 0 (',
  '    echo Demande des droits administrateur...',
  '    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath \'%~f0\' -Verb RunAs"',
  '    exit /b',
  ')',
  '',
  'echo ======================================================================',
  'echo    FIX INTERNET PC : Configuration Ethernet pour MikroTik',
  'echo ======================================================================',
  'echo.',
  'echo Configuration de la carte Ethernet (IP: 192.168.88.250, Passerelle: AUCUNE)...',
  'netsh interface ipv4 set address name="Ethernet" static 192.168.88.250 255.255.255.0 none',
  '',
  'if %errorlevel% equ 0 (',
  '    echo.',
  '    echo ======================================================================',
  '    echo [SUCCES] Ethernet configure SANS passerelle !',
  '    echo Le PC communique avec le MikroTik (192.168.88.1)',
  '    echo ET conserve 100%% de sa connexion Internet sur le Wi-Fi.',
  '    echo ======================================================================',
  ') else (',
  '    echo.',
  '    echo [ERREUR] Impossible de modifier la carte Ethernet.',
  '    echo Verifiez le nom de votre adaptateur reseau (Ethernet).',
  ')',
  'echo.',
  'pause'
].join('\r\n') + '\r\n';

const restoreBat = [
  '@echo off',
  'net session >nul 2>&1',
  'if %errorlevel% neq 0 (',
  '    echo Demande des droits administrateur...',
  '    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath \'%~f0\' -Verb RunAs"',
  '    exit /b',
  ')',
  '',
  'echo ======================================================================',
  'echo    REMISE EN DHCP AUTOMATIQUE DE LA CARTE ETHERNET',
  'echo ======================================================================',
  'echo.',
  'netsh interface ipv4 set address name="Ethernet" source=dhcp',
  'netsh interface ipv4 set dnsservers name="Ethernet" source=dhcp',
  '',
  'if %errorlevel% equ 0 (',
  '    echo.',
  '    echo [SUCCES] Carte Ethernet remise en DHCP automatique.',
  ') else (',
  '    echo.',
  '    echo [ERREUR] Impossible de remettre en DHCP.',
  ')',
  'echo.',
  'pause'
].join('\r\n') + '\r\n';

const configBat = [
  '@echo off',
  'title Configuration Kiosk MikroTik ABH 2026',
  'cd /d "%~dp0"',
  '',
  'echo ======================================================================',
  'echo    MISE A JOUR AUTOMATIQUE DES ROUTEURS MIKROTIK',
  'echo    Candidat : Gildas ZODOME (BIO PHYTO - Benin)',
  'echo ======================================================================',
  'echo.',
  '',
  'echo Application de la configuration Kiosk et televersement du portail...',
  'call node scripts\\configure-both-routers.cjs',
  'if %errorlevel% neq 0 (',
  '    echo.',
  '    echo [ERREUR] Echec lors de la configuration. Verifiez le branchement.',
  '    pause',
  '    exit /b 1',
  ')',
  '',
  'echo.',
  'echo ======================================================================',
  'echo [SUCCES TOTAL] Configuration terminee !',
  'echo ======================================================================',
  'echo.',
  'pause'
].join('\r\n') + '\r\n';

const rootConfigBat = [
  '@echo off',
  'cd /d "%~dp0abh2026-vote-kiosk"',
  'call CONFIGURER-ROUTEUR.bat'
].join('\r\n') + '\r\n';

const rootFixBat = [
  '@echo off',
  'cd /d "%~dp0abh2026-vote-kiosk"',
  'call FIX-INTERNET-PC.bat'
].join('\r\n') + '\r\n';

fs.writeFileSync(path.join(kioskDir, 'FIX-INTERNET-PC.bat'), fixBat, 'binary');
fs.writeFileSync(path.join(kioskDir, 'RESTORE-DHCP-PC.bat'), restoreBat, 'binary');
fs.writeFileSync(path.join(kioskDir, 'CONFIGURER-ROUTEUR.bat'), configBat, 'binary');

fs.writeFileSync(path.join(rootDir, 'FIX-INTERNET-PC.bat'), rootFixBat, 'binary');
fs.writeFileSync(path.join(rootDir, 'CONFIGURER-ROUTEUR.bat'), rootConfigBat, 'binary');

console.log('✅ Tous les fichiers .bat ont ete generes en pur CRLF / ASCII !');

