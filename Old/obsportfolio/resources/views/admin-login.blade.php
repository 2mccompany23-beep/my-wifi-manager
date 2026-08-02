<!DOCTYPE html>
<html>
<head>
    <title>Admin Login</title>
    <style>
        body { margin:0; padding:20px; font-family:Arial; background:#000; color:#fff; display:flex; justify-content:center; align-items:center; height:100vh; }
        .login-box { background:#111; padding:40px; border-radius:10px; border:1px solid #333; width:300px; }
        h2 { margin-bottom:30px; color:#00D4FF; }
        input { width:100%; padding:10px; margin:10px 0; background:#222; border:1px solid #444; color:#fff; border-radius:5px; }
        button { width:100%; padding:10px; margin-top:20px; background:#00D4FF; color:#000; border:none; border-radius:5px; font-weight:bold; cursor:pointer; }
        .error { color:#ff4444; margin:10px 0; padding:10px; background:rgba(255,68,68,0.1); border-radius:5px; }
    </style>
</head>
<body>
    <div class="login-box">
        <h2>ADMIN LOGIN</h2>
        
        @if($errors->any())
            <div class="error">{{ $errors->first() }}</div>
        @endif
        
        <form method="POST" action="{{ route('admin.login') }}">
            @csrf
            <input type="email" name="email" placeholder="Email" required value="{{ old('email') }}">
            <input type="password" name="password" placeholder="Mot de passe" required>
            <div style="margin:10px 0; text-align:left;">
                <label><input type="checkbox" name="remember" value="1"> Se souvenir de moi</label>
            </div>
            <button type="submit">SE CONNECTER</button>
        </form>
        <p style="margin-top:20px; text-align:center; color:#666;">
            <a href="{{ route('home') }}" style="color:#666;">← Retour au site</a>
        </p>
    </div>
</body>
</html>
