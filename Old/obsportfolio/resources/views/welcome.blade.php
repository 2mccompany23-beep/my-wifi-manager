<!DOCTYPE html>
<html>
<head>
    <title>Ori Ola OBS Photography</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: #000;
            color: #fff;
        }
        .container {
            max-width: 800px;
            margin: 50px auto;
            text-align: center;
        }
        h1 { font-size: 3em; margin-bottom: 20px; }
        .neon { color: #00D4FF; }
        .btn {
            display: inline-block;
            padding: 10px 30px;
            margin: 10px;
            background: #00D4FF;
            color: #000;
            text-decoration: none;
            border-radius: 5px;
        }
        .btn-login {
            background: transparent;
            border: 2px solid #00D4FF;
            color: #00D4FF;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>ORI OLA <span class="neon">OBS</span></h1>
        <h2>PHOTOGRAPHY</h2>
        <p style="margin: 40px 0;">Site en construction</p>
        <div>
            <a href="/obsportfolio/public/portfolio" class="btn">PORTFOLIO</a>
            <a href="/obsportfolio/public/admin-login" class="btn btn-login">ADMIN</a>
        </div>
        <p style="margin-top: 50px; color: #666;">
            <?php echo date('Y'); ?> - Tous droits réservés
        </p>
    </div>
</body>
</html>
