@extends('layouts.admin')

@section('title', __('Tableau de bord | Ori Ola OBS Photography'))

@section('content')
<div class="min-h-screen bg-black text-white pt-24">
    <div class="container mx-auto px-4">
        
        <!-- En-tête du dashboard -->
        <div class="text-center mb-12 gsap-reveal">
            <h1 class="font-oswald text-5xl md:text-7xl uppercase mb-4 tracking-tighter">
                <span class="text-white">{{ __("TABLEAU DE") }}</span>
                <span class="text-[#00D4FF] neon-text">{{ __("BORD") }}</span>
            </h1>
            <p class="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
                {{ __("Gérez vos événements, vos photos et votre contenu") }}
            </p>
        </div>

        <!-- Carte de bienvenue -->
        <div class="bg-black/30 border border-white/10 rounded-lg p-6 mb-8 gsap-reveal">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-400 text-sm uppercase tracking-wider">{{ __("Connecté en tant que") }}</p>
                    <p class="font-oswald text-2xl text-white">
                        {{ Auth::user()->email }}
                        <span class="ml-2 inline-flex items-center px-3 py-1 bg-[#00D4FF]/20 border border-[#00D4FF] rounded-full text-xs text-[#00D4FF] uppercase">
                            {{ __("Administrateur") }}
                        </span>
                    </p>
                </div>
                <form method="POST" action="{{ route('admin.logout') }}">
                    @csrf
                    <button type="submit" 
                            class="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-oswald uppercase tracking-wider text-sm transition-all duration-300 hover:border-red-500/50 hover:text-red-400">
                        {{ __("Déconnexion") }}
                    </button>
                </form>
            </div>
        </div>

        <!-- Grille des actions admin -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            
            <!-- Carte: Gestion des événements -->
            <div class="group bg-black/50 border border-white/10 rounded-lg p-6 hover:border-[#00D4FF]/50 hover:shadow-[0_0_20px_rgba(0,212,255,0.15)] transition-all duration-300">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-oswald text-2xl text-[#00D4FF]">{{ __("ÉVÉNEMENTS") }}</h3>
                    <span class="text-3xl text-[#00D4FF] opacity-50 group-hover:opacity-100 transition">📸</span>
                </div>
                <p class="text-gray-400 text-sm mb-4">{{ __("Gérez vos projets photographiques") }}</p>
                <div class="space-y-2">
                    <a href="{{ route('admin.events.index') }}" 
                       class="block w-full text-left px-4 py-2 bg-white/5 hover:bg-[#00D4FF]/20 rounded border border-white/10 hover:border-[#00D4FF] transition-all duration-300">
                        <span class="text-white">{{ __("Tous les événements") }}</span>
                        <span class="float-right text-[#00D4FF]">→</span>
                    </a>
                    <a href="{{ route('admin.events.create') }}" 
                       class="block w-full text-left px-4 py-2 bg-white/5 hover:bg-[#00D4FF]/20 rounded border border-white/10 hover:border-[#00D4FF] transition-all duration-300">
                        <span class="text-white">{{ __("Ajouter un événement") }}</span>
                        <span class="float-right text-[#00D4FF]">+</span>
                    </a>
                </div>
            </div>

            <!-- Carte: Portfolio public -->
            <div class="group bg-black/50 border border-white/10 rounded-lg p-6 hover:border-[#FF00E5]/50 hover:shadow-[0_0_20px_rgba(255,0,229,0.15)] transition-all duration-300">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-oswald text-2xl text-[#FF00E5]">{{ __("PORTFOLIO") }}</h3>
                    <span class="text-3xl text-[#FF00E5] opacity-50 group-hover:opacity-100 transition">🖼️</span>
                </div>
                <p class="text-gray-400 text-sm mb-4">{{ __("Prévisualisez le site public") }}</p>
                <div class="space-y-2">
                    <a href="{{ route('portfolio') }}" target="_blank" 
                       class="block w-full text-left px-4 py-2 bg-white/5 hover:bg-[#FF00E5]/20 rounded border border-white/10 hover:border-[#FF00E5] transition-all duration-300">
                        <span class="text-white">{{ __("Voir le portfolio") }}</span>
                        <span class="float-right text-[#FF00E5]">↗</span>
                    </a>
                </div>
            </div>

            <!-- Carte: Catégories -->
            <div class="group bg-black/50 border border-white/10 rounded-lg p-6 hover:border-[#00FF88]/50 hover:shadow-[0_0_20px_rgba(0,255,136,0.15)] transition-all duration-300">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-oswald text-2xl text-[#00FF88]">{{ __("CATÉGORIES") }}</h3>
                    <span class="text-3xl text-[#00FF88] opacity-50 group-hover:opacity-100 transition">🏷️</span>
                </div>
                <p class="text-gray-400 text-sm mb-4">{{ __("Gérez les catégories") }}</p>
                <div class="text-sm text-gray-500">
                    {{ __("Les catégories sont gérées automatiquement") }}
                </div>
            </div>

            <!-- Carte: Statistiques rapides -->
            <div class="md:col-span-2 lg:col-span-3 bg-black/30 border border-white/10 rounded-lg p-6">
                <h3 class="font-oswald text-2xl mb-4 text-white">{{ __("APERÇU RAPIDE") }}</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    @php
                        use App\Models\Event;
                        $totalEvents = Event::count();
                        $publishedEvents = Event::where('is_published', true)->count();
                        $totalImages = \App\Models\EventImage::count();
                    @endphp
                    <div class="text-center p-4 bg-white/5 rounded-lg">
                        <div class="text-3xl font-oswald text-[#00D4FF]">{{ $totalEvents }}</div>
                        <div class="text-xs text-gray-400 uppercase tracking-wider">{{ __("Événements") }}</div>
                    </div>
                    <div class="text-center p-4 bg-white/5 rounded-lg">
                        <div class="text-3xl font-oswald text-[#00FF88]">{{ $publishedEvents }}</div>
                        <div class="text-xs text-gray-400 uppercase tracking-wider">{{ __("Publiés") }}</div>
                    </div>
                    <div class="text-center p-4 bg-white/5 rounded-lg">
                        <div class="text-3xl font-oswald text-[#FF00E5]">{{ $totalImages }}</div>
                        <div class="text-xs text-gray-400 uppercase tracking-wider">{{ __("Photos") }}</div>
                    </div>
                    <div class="text-center p-4 bg-white/5 rounded-lg">
                        <div class="text-3xl font-oswald text-[#FFA500]">{{ Event::where('is_new_category', true)->count() }}</div>
                        <div class="text-xs text-gray-400 uppercase tracking-wider">{{ __("Nouvelles catégories") }}</div>
                    </div>
                </div>
            </div>

        </div>

        <!-- Derniers événements ajoutés -->
        <div class="mt-8 border-t border-white/10 pt-8">
            <h2 class="font-oswald text-3xl mb-6">
                <span class="text-white">{{ __("DERNIERS") }}</span>
                <span class="text-[#00D4FF]">{{ __("ÉVÉNEMENTS") }}</span>
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                @foreach(Event::latest()->take(3)->get() as $event)
                <div class="bg-black/50 border border-white/10 rounded-lg p-4 flex items-start space-x-4">
                    @if($event->featured_image && \Illuminate\Support\Facades\Storage::disk('public')->exists($event->featured_image))
                        <img src="{{ \Illuminate\Support\Facades\Storage::url($event->featured_image) }}" 
                             alt="{{ $event->title }}"
                             class="w-16 h-16 object-cover rounded border border-white/20">
                    @else
                        <div class="w-16 h-16 bg-gray-800 rounded flex items-center justify-center text-gray-500">
                            📷
                        </div>
                    @endif
                    <div class="flex-1">
                        <h4 class="font-oswald text-lg text-white">{{ Str::limit($event->title_fr ?? $event->title_en, 30) }}</h4>
                        <p class="text-xs text-gray-400">{{ $event->created_at->format('d/m/Y') }}</p>
                        <a href="{{ route('admin.events.edit', $event) }}" 
                           class="text-[#00D4FF] text-xs hover:underline inline-block mt-2">
                            {{ __("Modifier") }} →
                        </a>
                    </div>
                </div>
                @endforeach
            </div>
        </div>

        <!-- Lien rapide vers la documentation ou aide -->
        <div class="text-center mt-12 text-gray-500 text-sm">
            {{ __("Ori Ola OBS Photography - Espace d'administration") }}
        </div>

    </div>
</div>

<style>
    .neon-text {
        text-shadow: 0 0 10px rgba(0,212,255,0.5);
    }
    .gsap-reveal {
        animation: fadeInUp 0.8s ease forwards;
        opacity: 0;
        transform: translateY(20px);
    }
    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        const reveals = document.querySelectorAll('.gsap-reveal');
        reveals.forEach((el, index) => {
            setTimeout(() => {
                el.style.animation = 'fadeInUp 0.8s ease forwards';
            }, index * 100);
        });
    });
</script>
@endsection
