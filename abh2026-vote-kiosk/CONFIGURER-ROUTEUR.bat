@echo off
title Configuration Kiosk MikroTik ABH 2026
cd /d "%~dp0"

echo ======================================================================
echo    MISE A JOUR AUTOMATIQUE DES ROUTEURS MIKROTIK
echo    Candidat : Gildas ZODOME (BIO PHYTO - Benin)
echo ======================================================================
echo.

echo Application de la configuration Kiosk et televersement du portail...
call node scripts\configure-both-routers.cjs
if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] Echec lors de la configuration. Verifiez le branchement.
    pause
    exit /b 1
)

echo.
echo ======================================================================
echo [SUCCES TOTAL] Configuration terminee !
echo ======================================================================
echo.
pause
