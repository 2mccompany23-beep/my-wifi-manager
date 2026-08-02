<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config.php';

// Vérifier que les fichiers de configuration existent
if (!file_exists(VOUCHERS_FILE) || !file_exists(TRANSACTIONS_FILE)) {
    http_response_code(500);
    log_message("ERREUR: Fichiers de configuration manquants");
    exit("Configuration manquante");
}

$endpoint_secret = FEDAPAY_SECRET;

// Lire le payload brut
$payload = @file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_X_FEDAPAY_SIGNATURE'] ?? '';

if (empty($sig_header)) {
    http_response_code(400);
    log_message("ERREUR: Header X-FedaPay-Signature manquant");
    exit("Header X-FedaPay-Signature manquant");
}

// Valider la signature
try {
    $events = \FedaPay\Webhook::constructEvent($payload, $sig_header, $endpoint_secret);
    log_message("Webhook reçu et validé");
} catch (\UnexpectedValueException $e) {
    http_response_code(400);
    log_message("ERREUR: Payload invalide - " . $e->getMessage());
    exit("Payload invalide");
} catch (\FedaPay\Error\SignatureVerification $e) {
    http_response_code(400);
    log_message("ERREUR: Signature invalide");
    exit("Signature invalide");
}

// S'assurer que $events est un tableau
if (!is_array($events)) $events = [$events];

// Charger transactions existantes
$transactions = file_exists(TRANSACTIONS_FILE) 
    ? json_decode(file_get_contents(TRANSACTIONS_FILE), true) ?? [] 
    : [];

// Charger vouchers existants
$vouchers = file_exists(VOUCHERS_FILE) 
    ? json_decode(file_get_contents(VOUCHERS_FILE), true) ?? [] 
    : [];

foreach ($events as $event_item) {
    $event_name = $event_item['name'] ?? '';
    $entity     = $event_item['entity'] ?? [];

    $reference      = $entity['reference'] ?? '';
    $amount         = $entity['amount'] ?? 0;
    $customer_email = $entity['customer']['email'] ?? '';

    // Debug log
    log_message("Event: $event_name, Ref: $reference, Amount: $amount");

    if ($event_name === 'transaction.approved') {
        // Chercher un voucher correspondant au montant
        $voucher_code = null;
        foreach ($vouchers as $k => $v) {
            if ($v['montant'] == $amount) {
                $voucher_code = $v['code'];
                unset($vouchers[$k]); // Retirer pour ne pas réutiliser
                log_message("Voucher attribué: $voucher_code pour montant $amount");
                break;
            }
        }

        if ($voucher_code) {
            // Enregistrer la transaction avec voucher attribué
            $transactions[] = [
                'reference'      => $reference,
                'amount'         => $amount,
                'customer_email' => $customer_email,
                'voucher'        => $voucher_code,
                'received_at'    => date('Y-m-d H:i:s')
            ];
            log_message("Transaction créée: $reference avec voucher $voucher_code");
        } else {
            // Pas de voucher disponible
            $transactions[] = [
                'reference'      => $reference,
                'amount'         => $amount,
                'customer_email' => $customer_email,
                'voucher'        => null,
                'error'          => 'Aucun voucher disponible pour ce montant',
                'received_at'    => date('Y-m-d H:i:s')
            ];
            log_message("AVERTISSEMENT: Aucun voucher dispo pour montant $amount");
        }
    }
}

// Sauvegarder fichiers mis à jour
$saved_tx = file_put_contents(TRANSACTIONS_FILE, json_encode($transactions, JSON_PRETTY_PRINT));
$saved_vouchers = file_put_contents(VOUCHERS_FILE, json_encode(array_values($vouchers), JSON_PRETTY_PRINT));

if ($saved_tx && $saved_vouchers) {
    log_message("Fichiers sauvegardés avec succès");
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Webhook traité']);
} else {
    log_message("ERREUR: Impossible de sauvegarder les fichiers");
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur sauvegarde']);
}
