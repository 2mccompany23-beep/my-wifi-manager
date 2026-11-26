@echo off
chcp 65001 >nul
title Mise à Jour Routeurs Kiosk ABH 2026 (Auto-Login & Règles)
color 0A
cls
echo ======================================================================
echo 🇧🇯 KIOSK ABH 2026 - MISE À JOUR MATÉRIELLE DES ROUTEURS
echo    Candidat : Gildas ZODOME (BIO PHYTO - Bénin)
echo ======================================================================
echo.
echo Assurez-vous que vos routeurs MikroTik sont allumes et connectes
echo au PC (par cable Ethernet ou via le Wi-Fi).
echo.
pause
echo.
echo Deploiement de la configuration en cours...
node abh2026-vote-kiosk/scripts/apply-ground-update.cjs
echo.
echo ======================================================================
echo Appuyez sur une touche pour fermer cette fenetre.
pause >nul
