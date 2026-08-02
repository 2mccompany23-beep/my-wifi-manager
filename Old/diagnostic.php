<?php
/**
 * Diagnostic du système 2MC WIFI ZONE
 * Vérifier tous les prérequis et les chemins
 */

echo "\n" . str_repeat("=", 70) . "\n";
echo "DIAGNOSTIC - 2MC WIFI ZONE PAYMENT SYSTEM\n";
echo str_repeat("=", 70) . "\n\n";

// 1. Vérifier les chemins
echo "1. CHEMINS D'ACCÈS\n";
echo "   - Project Root: " . dirname(__DIR__) . "\n";
echo "   - WWW Root: " . __DIR__ . "\n";
echo "   - Vouchers Dir: " . dirname(__DIR__) . '/vouchers' . " → ";
echo (is_dir(dirname(__DIR__) . '/vouchers') ? '✓ EXISTE' : '✗ MANQUANT') . "\n";

// 2. Vérifier les fichiers essentiels
echo "\n2. FICHIERS ESSENTIELS\n";

$files = [
    'webhook.php' => __DIR__ . '/webhook.php',
    'get_voucher.php' => __DIR__ . '/get_voucher.php',
    'index.php' => __DIR__ . '/index.php',
    '.vouchers.json' => dirname(__DIR__) . '/vouchers/.vouchers.json',
    'transactions.json' => dirname(__DIR__) . '/vouchers/transactions.json',
];

foreach ($files as $name => $path) {
    echo "   - $name: ";
    if (file_exists($path)) {
        $size = filesize($path);
        echo "✓ OK ($size bytes)\n";
    } else {
        echo "✗ MANQUANT\n";
    }
}

// 3. Vérifier les permissions
echo "\n3. PERMISSIONS D'ACCÈS\n";

$dirs = [
    'vouchers/' => dirname(__DIR__) . '/vouchers',
    'www/' => __DIR__,
];

foreach ($dirs as $name => $path) {
    echo "   - $name: ";
    if (is_writable($path)) {
        echo "✓ Writable\n";
    } else {
        echo "✗ Read-only\n";
    }
}

// 4. Vérifier les dépendances PHP
echo "\n4. DÉPENDANCES PHP\n";

$extensions = ['json', 'curl', 'mbstring'];
foreach ($extensions as $ext) {
    echo "   - $ext: " . (extension_loaded($ext) ? '✓ Installé' : '✗ MANQUANT') . "\n";
}

// 5. Vérifier FedaPay SDK
echo "\n5. FEDAPAY SDK\n";
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
    echo "   - Autoloader: ✓ Chargé\n";
    
    if (class_exists('FedaPay\\Webhook')) {
        echo "   - FedaPay\\Webhook: ✓ Disponible\n";
    } else {
        echo "   - FedaPay\\Webhook: ✗ Non trouvé\n";
    }
} else {
    echo "   - Autoloader: ✗ vendor/autoload.php manquant\n";
    echo "     → Exécutez: composer install\n";
}

// 6. Vérifier les données
echo "\n6. DONNÉES EXISTANTES\n";

$vouchers_file = dirname(__DIR__) . '/vouchers/.vouchers.json';
if (file_exists($vouchers_file)) {
    $vouchers = json_decode(file_get_contents($vouchers_file), true);
    echo "   - Vouchers chargés: " . count($vouchers ?? []) . "\n";
    if ($vouchers) {
        foreach (array_slice($vouchers, 0, 3) as $v) {
            echo "     • {$v['code']} (montant: {$v['montant']})\n";
        }
        if (count($vouchers) > 3) echo "     ... et " . (count($vouchers) - 3) . " autres\n";
    }
}

$transactions_file = dirname(__DIR__) . '/vouchers/transactions.json';
if (file_exists($transactions_file)) {
    $transactions = json_decode(file_get_contents($transactions_file), true);
    echo "   - Transactions enregistrées: " . count($transactions ?? []) . "\n";
}

// 7. Tests rapides
echo "\n7. TESTS RAPIDES\n";

// Test JSON validity
$json_test = json_encode(['test' => 'data']);
echo "   - Encodage JSON: " . (json_last_error() === JSON_ERROR_NONE ? '✓ OK' : '✗ ERREUR') . "\n";

// Test file operations
$test_file = dirname(__DIR__) . '/vouchers/test_write.tmp';
$can_write = file_put_contents($test_file, 'test');
if ($can_write !== false) {
    unlink($test_file);
    echo "   - Écriture fichier: ✓ OK\n";
} else {
    echo "   - Écriture fichier: ✗ ERREUR\n";
}

// 8. Recommandations
echo "\n8. RECOMMANDATIONS\n";

$warnings = [];

if (!file_exists(__DIR__ . '/vendor/autoload.php')) {
    $warnings[] = "Exécutez: composer install";
}

if (!is_writable(dirname(__DIR__) . '/vouchers')) {
    $warnings[] = "Le dossier vouchers n'a pas les permissions d'écriture";
}

$vouchers = @json_decode(file_get_contents($vouchers_file ?? ''), true) ?? [];
if (count($vouchers) === 0) {
    $warnings[] = "Aucun voucher disponible - ajoutez des vouchers d'abord";
}

if (empty($warnings)) {
    echo "   ✓ Aucun problème détecté!\n";
} else {
    foreach ($warnings as $i => $warning) {
        echo "   " . ($i + 1) . ". ⚠ $warning\n";
    }
}

echo "\n" . str_repeat("=", 70) . "\n";
echo "Diagnostic terminé\n";
echo str_repeat("=", 70) . "\n\n";
