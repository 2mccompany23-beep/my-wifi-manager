<?php
$fakeWebhook = [
    "event" => [
        "data" => [
            "id" => uniqid("tx_"),
            "status" => "approved",
            "amount" => 2000
        ]
    ]
];

file_put_contents("php://input", json_encode($fakeWebhook));
include "webhook.php";

