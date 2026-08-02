<?php
require_once __DIR__ . '/config.php';

// Récupérer la référence depuis GET ou POST
$reference = $_GET['reference'] ?? $_POST['reference'] ?? '';

// Valider la référence
if (!$reference) {
    http_response_code(400);
    exit(json_encode(['error' => 'Référence manquante'], JSON_UNESCAPED_UNICODE));
}

// Vérifier que les fichiers existent
if (!file_exists(TRANSACTIONS_FILE) || !file_exists(VOUCHERS_FILE)) {
    http_response_code(500);
    log_message("ERREUR: Fichiers manquants pour référence $reference");
    exit(json_encode(['error' => 'Configuration manquante'], JSON_UNESCAPED_UNICODE));
}

// Charger transactions
$transactions = json_decode(file_get_contents(TRANSACTIONS_FILE), true) ?? [];

// Chercher la transaction correspondant à la référence
$transaction_index = null;
foreach ($transactions as $k => $t) {
    if (($t['reference'] ?? '') === $reference) {
        $transaction_index = $k;
        break;
    }
}

if ($transaction_index === null) {
    http_response_code(404);
    log_message("Transaction non trouvée: $reference");
    exit(json_encode(['error' => 'Transaction introuvable'], JSON_UNESCAPED_UNICODE));
}

$transaction = $transactions[$transaction_index];

// Si le voucher est déjà attribué, on le renvoie
if (!empty($transaction['voucher'])) {
    http_response_code(200);
    log_message("Voucher renvoyé pour $reference: {$transaction['voucher']}");
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['voucher' => $transaction['voucher']], JSON_UNESCAPED_UNICODE);
    exit;
}

// Charger vouchers disponibles
$vouchers = json_decode(file_get_contents(VOUCHERS_FILE), true) ?? [];

$voucher_code = null;
// Chercher un voucher correspondant au montant
foreach ($vouchers as $k => $v) {
    if (($v['montant'] ?? 0) == ($transaction['amount'] ?? 0)) {
        $voucher_code = $v['code'];
        unset($vouchers[$k]); // Retirer pour ne pas réutiliser
        log_message("Voucher attribué à partir de get_voucher: $voucher_code");
        break;
    }
}

if ($voucher_code) {
    // Mettre à jour la transaction
    $transactions[$transaction_index]['voucher'] = $voucher_code;
    
    $saved_tx = file_put_contents(TRANSACTIONS_FILE, json_encode($transactions, JSON_PRETTY_PRINT));
    $saved_vouchers = file_put_contents(VOUCHERS_FILE, json_encode(array_values($vouchers), JSON_PRETTY_PRINT));
    
    if ($saved_tx && $saved_vouchers) {
        http_response_code(200);
        log_message("Voucher $voucher_code attribué et sauvegardé pour $reference");
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['voucher' => $voucher_code], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(500);
        log_message("ERREUR: Impossible de sauvegarder pour $reference");
        echo json_encode(['error' => 'Erreur sauvegarde'], JSON_UNESCAPED_UNICODE);
    }
} else {
    http_response_code(404);
    log_message("Aucun voucher disponible pour montant {$transaction['amount']}");
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Aucun voucher disponible pour ce montant'], JSON_UNESCAPED_UNICODE);
}
