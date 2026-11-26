@echo off
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Demande des droits administrateur...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

echo ======================================================================
echo    FIX INTERNET PC : Configuration Ethernet pour MikroTik
echo ======================================================================
echo.
echo Configuration de la carte Ethernet (IP: 192.168.88.250, Passerelle: AUCUNE)...
netsh interface ipv4 set address name="Ethernet" static 192.168.88.250 255.255.255.0 none

if %errorlevel% equ 0 (
    echo.
    echo ======================================================================
    echo [SUCCES] Ethernet configure SANS passerelle !
    echo Le PC communique avec le MikroTik (192.168.88.1)
    echo ET conserve 100%% de sa connexion Internet sur le Wi-Fi.
    echo ======================================================================
) else (
    echo.
    echo [ERREUR] Impossible de modifier la carte Ethernet.
    echo Verifiez le nom de votre adaptateur reseau (Ethernet).
)
echo.
pause
