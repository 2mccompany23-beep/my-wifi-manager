# test_integration.ps1 - Script de test pour Windows PowerShell
# Exécution: powershell -ExecutionPolicy Bypass -File test_integration.ps1

param(
    [string]$TestType = "all"  # all, diagnostic, unit, integration, flow
)

$ErrorActionPreference = "Continue"

function Write-Header {
    param([string]$Text)
    Write-Host "`n" -NoNewline
    Write-Host ("=" * 60)
    Write-Host $Text -ForegroundColor Cyan
    Write-Host ("=" * 60)
}

function Write-Result {
    param([bool]$Success, [string]$Message, [string]$Details)
    
    if ($Success) {
        Write-Host "✓ " -ForegroundColor Green -NoNewline
        Write-Host $Message
        if ($Details) { Write-Host "  → $Details" -ForegroundColor Gray }
    } else {
        Write-Host "✗ " -ForegroundColor Red -NoNewline
        Write-Host $Message
        if ($Details) { Write-Host "  → $Details" -ForegroundColor DarkRed }
    }
}

Write-Header "TEST 2MC WIFI ZONE PAYMENT SYSTEM"

# Vérifier PHP
$PHPPath = (Get-Command php -ErrorAction SilentlyContinue).Source
if (-not $PHPPath) {
    Write-Result $false "PHP n'est pas installé ou non trouvé dans PATH"
    exit 1
}

Write-Result $true "PHP détecté: $PHPPath"

# Chemin du projet
$WWWRoot = Split-Path $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path $WWWRoot
$VouchersDir = Join-Path $ProjectRoot "vouchers"

Write-Host "`nEmplacement du projet: $WWWRoot"
Write-Host "Dossier vouchers: $VouchersDir"

# ===== TEST 1: DIAGNOSTIC =====
if ($TestType -in "all", "diagnostic") {
    Write-Header "1. DIAGNOSTIC SYSTÈME"
    
    # Fichiers essentiels
    $essential_files = @(
        "config.php",
        "webhook.php",
        "get_voucher.php",
        "test_webhook.php",
        "..\vouchers\.vouchers.json",
        "..\vouchers\transactions.json"
    )
    
    foreach ($file in $essential_files) {
        $full_path = Join-Path $WWWRoot $file
        $exists = Test-Path $full_path
        Write-Result $exists ($file) (if ($exists) { "$(Get-Item $full_path).Length bytes" })
    }
    
    # Permissions
    Write-Host "`nPermissions d'accès:"
    $can_write = New-Item -Path "$VouchersDir\test_write.tmp" -ItemType File -ErrorAction SilentlyContinue
    if ($can_write) {
        Remove-Item $can_write -Force
        Write-Result $true "Dossier vouchers" "Accessible en écriture"
    } else {
        Write-Result $false "Dossier vouchers" "Pas de permission d'écriture"
    }
}

# ===== TEST 2: TESTS UNITAIRES =====
if ($TestType -in "all", "unit") {
    Write-Header "2. TESTS UNITAIRES"
    
    $test_file = Join-Path $WWWRoot "test_webhook.php"
    if (Test-Path $test_file) {
        & $PHPPath $test_file
    } else {
        Write-Result $false "Fichier de test introuvable"
    }
}

# ===== TEST 3: SIMULATION DE FLUX COMPLET =====
if ($TestType -in "all", "flow", "integration") {
    Write-Header "3. SIMULATION DE FLUX DE PAIEMENT"
    
    # Réinitialiser les données de test
    $test_vouchers = @(
        @{code = "TEST001"; montant = 1000},
        @{code = "TEST002"; montant = 1000},
        @{code = "TEST003"; montant = 2000},
        @{code = "TEST004"; montant = 5000}
    ) | ConvertTo-Json
    
    $vouchers_file = Join-Path $VouchersDir ".vouchers.json"
    $transactions_file = Join-Path $VouchersDir "transactions.json"
    
    Write-Host "`n📋 Initialisation des données de test..."
    
    # Sauvegarder les vouchers
    $test_vouchers | Out-File $vouchers_file -Encoding UTF8 -Force
    Write-Result $true "Vouchers de test créés" "4 vouchers"
    
    # Écrire un script PHP de test
    $php_test_script = @'
<?php
require_once 'config.php';

echo "\n=== SIMULATION DE FLUX DE PAIEMENT ===\n\n";

// 1. Simuler un webhook de transaction
echo "1️⃣  Simulation webhook transaction.approved\n";

$test_transaction = [
    'name' => 'transaction.approved',
    'entity' => [
        'reference' => 'tx_test_' . uniqid(),
        'amount' => 1000,
        'customer' => ['email' => 'test@example.com']
    ]
];

// Lire les vouchers
$vouchers = json_decode(file_get_contents(VOUCHERS_FILE), true) ?? [];
echo "   Vouchers disponibles: " . count($vouchers) . "\n";

// Simuler l'attribution du voucher
$voucher_code = null;
$ref = $test_transaction['entity']['reference'];
$amount = $test_transaction['entity']['amount'];

foreach ($vouchers as $k => $v) {
    if ($v['montant'] == $amount) {
        $voucher_code = $v['code'];
        unset($vouchers[$k]);
        break;
    }
}

if ($voucher_code) {
    echo "   ✓ Voucher attribué: $voucher_code\n";
    
    // Sauvegarder la transaction
    $transactions = json_decode(file_get_contents(TRANSACTIONS_FILE), true) ?? [];
    $transactions[] = [
        'reference' => $ref,
        'amount' => $amount,
        'customer_email' => $test_transaction['entity']['customer']['email'],
        'voucher' => $voucher_code,
        'received_at' => date('Y-m-d H:i:s')
    ];
    
    file_put_contents(TRANSACTIONS_FILE, json_encode($transactions, JSON_PRETTY_PRINT));
    file_put_contents(VOUCHERS_FILE, json_encode(array_values($vouchers), JSON_PRETTY_PRINT));
    
    echo "\n2️⃣  Récupération du voucher via get_voucher.php\n";
    echo "   Référence: $ref\n";
    
    // Simuler l'appel get_voucher
    $fetched_tx = null;
    foreach ($transactions as $tx) {
        if ($tx['reference'] === $ref) {
            $fetched_tx = $tx;
            break;
        }
    }
    
    if ($fetched_tx && !empty($fetched_tx['voucher'])) {
        echo "   ✓ Voucher récupéré: {$fetched_tx['voucher']}\n";
        echo "\n✅ FLUX COMPLET RÉUSSI\n";
    } else {
        echo "   ✗ Erreur: Voucher non trouvé\n";
        echo "\n❌ FLUX ÉCHOUÉ\n";
    }
} else {
    echo "   ✗ Erreur: Aucun voucher disponible\n";
    echo "\n❌ FLUX ÉCHOUÉ\n";
}
?>
'@
    
    $test_file = Join-Path $WWWRoot "flow_test_temp.php"
    $php_test_script | Out-File $test_file -Encoding UTF8 -Force
    
    & $PHPPath $test_file
    
    Remove-Item $test_file -Force -ErrorAction SilentlyContinue
}

# ===== RÉSUMÉ FINAL =====
Write-Header "RÉSUMÉ"

Write-Host "
Checklist de configuration:
  □ PHP installé et en PATH
  □ Dossier /vouchers/ créé
  □ Fichiers .vouchers.json et transactions.json présents
  □ Permissions d'écriture sur /vouchers/
  □ config.php inclus dans les scripts
  □ Logs fonctionnels

Actions recommandées:
  1. Exécuter: php diagnostic.php
  2. Exécuter: php test_webhook.php
  3. Ajouter des vouchers dans .vouchers.json
  4. Tester avec un webhooks réel depuis FedaPay
"

Write-Host "Tests terminés." -ForegroundColor Green
