<?php
$amount = (int)$_GET['amount'];

// Vérifie si le paiement est validé
if (file_exists("paid_$amount.txt")) {
    // Associe le ticket correspondant
    $tickets = [
        500  => "ticket500",
        1000 => "ticket1000",
        2000 => "ticket2000",
    ];
    $ticket = $tickets[$amount] ?? null;

    if ($ticket) {
        // Redirige vers le portail MikroTik avec login auto
        $username = $ticket;
        $password = $ticket;

        $mikrotik_login_url = "http://10.0.0.1/login?username=$username&password=$password";
        header("Location: $mikrotik_login_url");
        exit;
    }
}
echo "Paiement non validé.";
