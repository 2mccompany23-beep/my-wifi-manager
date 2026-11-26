@echo off
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Demande des droits administrateur...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

echo ======================================================================
echo    REMISE EN DHCP AUTOMATIQUE DE LA CARTE ETHERNET
echo ======================================================================
echo.
netsh interface ipv4 set address name="Ethernet" source=dhcp
netsh interface ipv4 set dnsservers name="Ethernet" source=dhcp

if %errorlevel% equ 0 (
    echo.
    echo [SUCCES] Carte Ethernet remise en DHCP automatique.
) else (
    echo.
    echo [ERREUR] Impossible de remettre en DHCP.
)
echo.
pause
