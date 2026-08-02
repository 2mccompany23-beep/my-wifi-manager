<?php
/**
 * Configuration centralisée du projet 2MC WIFI ZONE
 */

define('PROJECT_ROOT', dirname(__DIR__));
define('WWW_ROOT', __DIR__);
define('VOUCHERS_DIR', PROJECT_ROOT . '/vouchers');
define('VOUCHERS_FILE', VOUCHERS_DIR . '/.vouchers.json');
define('TRANSACTIONS_FILE', VOUCHERS_DIR . '/transactions.json');
define('LOG_FILE', VOUCHERS_DIR . '/log.txt');

// Créer les dossiers s'ils n'existent pas
if (!is_dir(VOUCHERS_DIR)) {
    mkdir(VOUCHERS_DIR, 0755, true);
}

// Vérifier que les fichiers existent
if (!file_exists(VOUCHERS_FILE)) {
    file_put_contents(VOUCHERS_FILE, json_encode([], JSON_PRETTY_PRINT));
}

if (!file_exists(TRANSACTIONS_FILE)) {
    file_put_contents(TRANSACTIONS_FILE, json_encode([], JSON_PRETTY_PRINT));
}

// FedaPay Config
define('FEDAPAY_SECRET', 'wh_live_rANAlsmoCm9qTPovKbNH8W7G');

function log_message($message) {
    $timestamp = date('Y-m-d H:i:s');
    $log_msg = "[$timestamp] $message\n";
    error_log($log_msg);
    file_put_contents(LOG_FILE, $log_msg, FILE_APPEND);
}
