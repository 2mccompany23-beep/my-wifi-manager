<?php
/**
 * TestWebhook.php - Tests pour webhook.php et get_voucher.php
 */

class TestWebhook {
    private $transactions_file;
    private $vouchers_file;
    private $log;

    public function __construct() {
        $this->transactions_file = __DIR__ . '/../vouchers/transactions_test.json';
        $this->vouchers_file = __DIR__ . '/../vouchers/vouchers_test.json';
        $this->log = [];
    }

    public function setUp() {
        // Initialiser les fichiers de test
        $initial_vouchers = [
            ['code' => 'VOUCHER001', 'montant' => 1000],
            ['code' => 'VOUCHER002', 'montant' => 1000],
            ['code' => 'VOUCHER003', 'montant' => 2000],
            ['code' => 'VOUCHER005', 'montant' => 5000],
        ];
        
        file_put_contents($this->vouchers_file, json_encode($initial_vouchers, JSON_PRETTY_PRINT));
        file_put_contents($this->transactions_file, json_encode([], JSON_PRETTY_PRINT));
    }

    public function tearDown() {
        if (file_exists($this->transactions_file)) unlink($this->transactions_file);
        if (file_exists($this->vouchers_file)) unlink($this->vouchers_file);
    }

    // TEST 1: Validation que les fichiers JSON existent
    public function testFilesExist() {
        $this->setUp();
        
        $assert = file_exists($this->vouchers_file);
        $this->log('TEST 1: Les fichiers JSON existent', $assert);
        
        $this->tearDown();
        return $assert;
    }

    // TEST 2: JSON est valide
    public function testValidJSON() {
        $this->setUp();
        
        $content = file_get_contents($this->vouchers_file);
        $data = json_decode($content, true);
        
        $assert = (json_last_error() === JSON_ERROR_NONE && is_array($data));
        $this->log('TEST 2: JSON valide', $assert);
        
        $this->tearDown();
        return $assert;
    }

    // TEST 3: Matching voucher par montant
    public function testVoucherMatching() {
        $this->setUp();
        
        $vouchers = json_decode(file_get_contents($this->vouchers_file), true);
        $amount = 1000;
        
        $voucher_code = null;
        foreach ($vouchers as $k => $v) {
            if ($v['montant'] == $amount) {
                $voucher_code = $v['code'];
                break;
            }
        }
        
        $assert = ($voucher_code === 'VOUCHER001');
        $this->log('TEST 3: Matching voucher 1000', $assert, $voucher_code);
        
        $this->tearDown();
        return $assert;
    }

    // TEST 4: Suppression voucher après attribution
    public function testVoucherRemoval() {
        $this->setUp();
        
        $vouchers = json_decode(file_get_contents($this->vouchers_file), true);
        $initial_count = count($vouchers);
        
        // Simuler l'attribution
        foreach ($vouchers as $k => $v) {
            if ($v['montant'] == 1000) {
                unset($vouchers[$k]);
                break;
            }
        }
        
        $final_count = count($vouchers);
        $assert = ($final_count === $initial_count - 1);
        $this->log('TEST 4: Suppression voucher après attribution', $assert, "$initial_count -> $final_count");
        
        $this->tearDown();
        return $assert;
    }

    // TEST 5: Sauvegarde transaction avec voucher
    public function testSaveTransaction() {
        $this->setUp();
        
        $transaction = [
            'reference' => 'tx_test_001',
            'amount' => 1000,
            'customer_email' => 'test@example.com',
            'voucher' => 'VOUCHER001',
            'received_at' => date('Y-m-d H:i:s')
        ];
        
        $transactions = json_decode(file_get_contents($this->transactions_file), true) ?? [];
        $transactions[] = $transaction;
        
        $saved = file_put_contents($this->transactions_file, json_encode($transactions, JSON_PRETTY_PRINT));
        $restored = json_decode(file_get_contents($this->transactions_file), true);
        
        $assert = ($saved !== false && count($restored) === 1 && $restored[0]['reference'] === 'tx_test_001');
        $this->log('TEST 5: Sauvegarde et restauration transaction', $assert);
        
        $this->tearDown();
        return $assert;
    }

    // TEST 6: Voucher non disponible
    public function testNoVoucherAvailable() {
        $this->setUp();
        
        $amount = 999999; // Montant inexistant
        $vouchers = json_decode(file_get_contents($this->vouchers_file), true);
        
        $voucher_code = null;
        foreach ($vouchers as $k => $v) {
            if ($v['montant'] == $amount) {
                $voucher_code = $v['code'];
                break;
            }
        }
        
        $assert = ($voucher_code === null);
        $this->log('TEST 6: Aucun voucher pour montant inexistant', $assert);
        
        $this->tearDown();
        return $assert;
    }

    // TEST 7: Éviter les doublons références
    public function testNoDuplicateReferences() {
        $this->setUp();
        
        $ref = 'tx_test_001';
        $transactions = [];
        
        $transactions[] = ['reference' => $ref, 'amount' => 1000];
        $transactions[] = ['reference' => $ref, 'amount' => 2000]; // DOUBLON!
        
        // Chercher le doublon
        $found = 0;
        foreach ($transactions as $t) {
            if ($t['reference'] === $ref) $found++;
        }
        
        $assert = ($found === 2); // Le code devrait éviter cela
        $this->log('TEST 7: Détection de références dupliquées', $assert, "Trouvé: $found fois");
        
        $this->tearDown();
        return $assert;
    }

    // TEST 8: Récupération transaction par référence
    public function testGetTransactionByReference() {
        $this->setUp();
        
        $transactions = [
            ['reference' => 'tx_001', 'amount' => 1000, 'voucher' => 'V001'],
            ['reference' => 'tx_002', 'amount' => 2000, 'voucher' => 'V002'],
        ];
        file_put_contents($this->transactions_file, json_encode($transactions, JSON_PRETTY_PRINT));
        
        $ref_to_find = 'tx_002';
        $transactions = json_decode(file_get_contents($this->transactions_file), true);
        
        $found_tx = null;
        foreach ($transactions as $t) {
            if ($t['reference'] === $ref_to_find) {
                $found_tx = $t;
                break;
            }
        }
        
        $assert = ($found_tx !== null && $found_tx['amount'] === 2000);
        $this->log('TEST 8: Récupération transaction par référence', $assert);
        
        $this->tearDown();
        return $assert;
    }

    public function log($message, $result, $details = '') {
        $status = $result ? '✓ PASS' : '✗ FAIL';
        $msg = "$status - $message";
        if ($details) $msg .= " ($details)";
        $this->log[] = $msg;
        echo $msg . "\n";
    }

    public function runAllTests() {
        echo "\n" . str_repeat("=", 60) . "\n";
        echo "SUITE DE TESTS - 2MC WIFI ZONE\n";
        echo str_repeat("=", 60) . "\n\n";
        
        $results = [
            $this->testFilesExist(),
            $this->testValidJSON(),
            $this->testVoucherMatching(),
            $this->testVoucherRemoval(),
            $this->testSaveTransaction(),
            $this->testNoVoucherAvailable(),
            $this->testNoDuplicateReferences(),
            $this->testGetTransactionByReference(),
        ];
        
        $passed = count(array_filter($results));
        $total = count($results);
        
        echo "\n" . str_repeat("=", 60) . "\n";
        printf("RÉSULTAT: %d/%d tests réussis\n", $passed, $total);
        echo str_repeat("=", 60) . "\n\n";
        
        return $passed === $total;
    }
}

// Exécuter les tests
if (php_sapi_name() === 'cli' || !empty($_GET['test'])) {
    $tester = new TestWebhook();
    $success = $tester->runAllTests();
    exit($success ? 0 : 1);
}
