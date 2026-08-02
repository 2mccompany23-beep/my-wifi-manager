<?php
// --- AUTHENTIFICATION SIMPLIFIÉE ---
$USER = 'admin';
$PASS = 'MonMotDePasseTrèsFort';

if (!isset($_SERVER['PHP_AUTH_USER']) || 
    $_SERVER['PHP_AUTH_USER'] !== $USER || 
    $_SERVER['PHP_AUTH_PW'] !== $PASS) {
    header('WWW-Authenticate: Basic realm="Espace Vouchers"');
    header('HTTP/1.0 401 Unauthorized');
    echo 'Accès refusé';
    exit;
}
// --- FIN AUTH ---

// Fichier où seront stockés les vouchers disponibles
$vouchers_file = __DIR__ . '/../vouchers/.vouchers.json';

$message = '';
$vouchers = [];

// Charger les vouchers existants
if (file_exists($vouchers_file)) {
    $vouchers = json_decode(file_get_contents($vouchers_file), true) ?? [];
}

// Upload d'un fichier CSV ou JSON
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    $tmp = $_FILES['file']['tmp_name'];
    $ext = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));

    $new_vouchers = [];

    // --- CSV Mikhmon ---
    if ($ext === 'csv') {
        if (($handle = fopen($tmp, 'r')) !== false) {
            $first_line = true;
            while (($row = fgetcsv($handle, 1000, ',')) !== false) {
                // Ignorer l'en-tête
                if ($first_line) { $first_line = false; continue; }
                if (count($row) >= 3) {
                    $code = trim($row[0]);       // Username
                    $profile = trim($row[2]);    // Profile (ex: 100-F-3h)
                    // Extraire le montant réel au début de la chaîne
                    preg_match('/^\d+/', $profile, $matches);
                    $montant = $matches[0] ?? 0;

                    $new_vouchers[] = [
                        'code' => $code,
                        'montant' => $montant
                    ];
                }
            }
            fclose($handle);
        }
    } 
    // --- JSON ---
    elseif ($ext === 'json') {
        $json = file_get_contents($tmp);
        $data = json_decode($json, true);
        if (is_array($data)) {
            foreach ($data as $entry) {
                if (isset($entry['code'], $entry['montant'])) {
                    $new_vouchers[] = [
                        'code' => trim($entry['code']),
                        'montant' => (int) $entry['montant']
                    ];
                }
            }
        }
    }

    // --- Gestion des doublons ---
    $existing_codes = array_column($vouchers, 'code');
    $filtered_vouchers = array_filter($new_vouchers, function($v) use ($existing_codes) {
        return !in_array($v['code'], $existing_codes);
    });

    if (!empty($filtered_vouchers)) {
        $vouchers = array_merge($vouchers, $filtered_vouchers);
        file_put_contents($vouchers_file, json_encode($vouchers, JSON_PRETTY_PRINT));
        $message = "✅ " . count($filtered_vouchers) . " vouchers ajoutés. Total: " . count($vouchers);
    } else {
        $message = "⚠️ Aucun nouveau voucher à ajouter (doublons ou fichier vide).";
    }
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Gestion des Vouchers</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#f5f6fa; color:#333; margin:0; padding:0; }
        .container { width:90%; max-width:900px; margin:40px auto; background:#fff; padding:30px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1); }
        h2,h3 { color:#2f3640; }
        form { margin-bottom:30px; }
        input[type="file"] { padding:8px; }
        button { padding:10px 20px; background:#0097e6; color:#fff; border:none; border-radius:6px; cursor:pointer; transition:background 0.3s; }
        button:hover { background:#00a8ff; }
        table { width:100%; border-collapse:collapse; margin-top:15px; }
        table th, table td { padding:12px 10px; text-align:left; }
        table th { background:#00a8ff; color:#fff; }
        table tr:nth-child(even) { background:#f1f2f6; }
        p.message { padding:12px; border-radius:6px; margin-bottom:20px; }
        p.success { background:#dff9fb; color:#22a6b3; }
        p.warning { background:#f6e58d; color:#e1b12c; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Importer des Vouchers</h2>
        <?php if (!empty($message)) : ?>
            <p class="message <?= strpos($message,'✅') === 0 ? 'success' : 'warning' ?>">
                <strong><?= htmlspecialchars($message) ?></strong>
            </p>
        <?php endif; ?>

        <form method="post" enctype="multipart/form-data">
            <input type="file" name="file" accept=".csv,.json" required>
            <button type="submit">Uploader</button>
        </form>

        <?php if (!empty($vouchers)): ?>
            <h3>Vouchers existants</h3>
            <table>
                <tr><th>Code</th><th>Montant</th></tr>
                <?php foreach ($vouchers as $v): ?>
                    <tr>
                        <td><?= htmlspecialchars($v['code']) ?></td>
                        <td><?= htmlspecialchars($v['montant']) ?></td>
                    </tr>
                <?php endforeach; ?>
            </table>
        <?php else: ?>
            <p>Aucun voucher disponible pour le moment.</p>
        <?php endif; ?>
    </div>
</body>
</html>
