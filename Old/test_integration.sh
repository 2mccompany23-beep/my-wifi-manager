#!/bin/bash
# test_integration.sh - Script de test d'intégration complète

echo "========================================"
echo "TEST D'INTÉGRATION - 2MC WIFI ZONE"
echo "========================================"
echo ""

# Détecter PHP
PHP_CMD="php"
if ! command -v $PHP_CMD &> /dev/null; then
    echo "❌ PHP n'est pas installé"
    exit 1
fi

echo "✓ PHP détecté"
echo ""

# Dossier du projet
WWW_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$WWW_ROOT"

echo "Dossier: $WWW_ROOT"
echo ""

# 1. Exécuter le diagnostic
echo "1. Exécution du diagnostic..."
$PHP_CMD diagnostic.php 2>&1
if [ $? -ne 0 ]; then
    echo "⚠ Diagnostic terminé avec des avertissements"
fi
echo ""

# 2. Exécuter les tests unitaires
echo "2. Exécution des tests unitaires..."
$PHP_CMD test_webhook.php
if [ $? -eq 0 ]; then
    echo "✓ Tous les tests sont passés"
else
    echo "❌ Certains tests ont échoué"
fi
echo ""

# 3. Vérifier la structure
echo "3. Vérification de la structure des fichiers..."
files=(
    "config.php"
    "webhook.php"
    "get_voucher.php"
    "vendor/autoload.php"
    "../vouchers/.vouchers.json"
    "../vouchers/transactions.json"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✓ $file"
    else
        echo "   ❌ $file (MANQUANT)"
    fi
done
echo ""

# 4. Tester les permissions
echo "4. Vérification des permissions..."
vouchers_dir="../vouchers"
if [ -w "$vouchers_dir" ]; then
    echo "   ✓ $vouchers_dir est accessible en écriture"
else
    echo "   ❌ $vouchers_dir n'est pas accessible en écriture"
fi
echo ""

echo "========================================"
echo "Tests d'intégration terminés"
echo "========================================"
