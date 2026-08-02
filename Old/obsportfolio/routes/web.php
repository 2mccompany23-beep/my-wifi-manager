<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PortfolioController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\HeroSlideController;
use App\Http\Controllers\Admin\ServiceDomainController;
use App\Http\Controllers\Admin\AboutSectionController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\StatisticController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// ===========================================
// ROUTES PUBLIQUES
// ===========================================
Route::get('/', [PageController::class, 'home'])->name('home');
Route::get('/portfolio', [PortfolioController::class, 'index'])->name('portfolio');
Route::get('/portfolio/{slug}', [PortfolioController::class, 'show'])->name('event.detail');
Route::get('/a-propos', [PageController::class, 'about'])->name('about');
Route::get('/contact', [PageController::class, 'contact'])->name('contact');
Route::get('/mentions-legales', [PageController::class, 'legalMentions'])->name('legal.mentions');
Route::get('/confidentialite', [PageController::class, 'legalPrivacy'])->name('legal.privacy');
Route::get('/conditions-utilisation', [PageController::class, 'legalTerms'])->name('legal.terms');
Route::get('/plan-du-site', [PageController::class, 'sitemap'])->name('sitemap');

// ===========================================
// AUTHENTIFICATION SIMPLE (SANS FILAMENT)
// ===========================================

// Route de login par défaut pour Laravel (OBLIGATOIRE)
Route::get('/login', function () {
    return redirect()->route('admin.login');
})->name('login');

// Page de login (GET) - ✅ GARDE LE NOM 'admin.login'
Route::get('/admin-login', function () {
    return view('admin-login');
})->name('admin.login');

// Traitement du login (POST) - ✅ NOUVEAU NOM : 'admin.login.post'
Route::post('/admin-login', function (Request $request) {
    $credentials = $request->validate([
        'email' => ['required', 'email'],
        'password' => ['required'],
    ]);

    if (Auth::attempt($credentials, $request->boolean('remember'))) {
        $request->session()->regenerate();
        return redirect()->route('admin.dashboard');
    }

    return back()->withErrors([
        'email' => 'Identifiants incorrects.',
    ]);
})->name('admin.login.post');

// Déconnexion
Route::post('/admin-logout', function (Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return redirect()->route('home');
})->name('admin.logout');

// ===========================================
// ADMIN PROTÉGÉ
// ===========================================
Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {
    
    Route::get('/', function () {
        return view('admin-dashboard');
    })->name('dashboard');
    
    // Routes admin existantes
    Route::resource('events', EventController::class)->except(['show']);
    Route::post('events/reorder', [EventController::class, 'reorder'])->name('events.reorder');
    Route::post('events/{event}/images', [EventController::class, 'addImages'])->name('events.images.add');
    Route::delete('events/images/{image}', [EventController::class, 'deleteImage'])->name('events.images.delete');
    Route::post('events/{event}/images/reorder', [EventController::class, 'reorderImages'])->name('events.images.reorder');

    // Hero Slides
    Route::resource('hero-slides', HeroSlideController::class);
    
    // Service Domains
    Route::resource('service-domains', ServiceDomainController::class);
    
    // About Sections
    Route::resource('about-sections', AboutSectionController::class);

    // Gestion des médias (images du site)
    Route::resource('media', MediaController::class);
    
    // Statistiques
    Route::resource('statistics', StatisticController::class);
});

// ===========================================
// TEST SESSION
// ===========================================
Route::get('/test-session', function () {
    return response()->json([
        'session_id' => session()->getId(),
        'csrf_token' => csrf_token(),
        'auth_check' => Auth::check(),
        'auth_user' => Auth::user() ? Auth::user()->email : null,
        'routes' => [
            'login' => route('login', [], false),
            'admin_login' => route('admin.login', [], false),
            'admin_login_post' => route('admin.login.post', [], false),
            'admin_dashboard' => route('admin.dashboard', [], false),
        ]
    ]);
})->name('test-session');

// Fallback
Route::fallback(function () {
    return redirect()->route('admin.login');
});
