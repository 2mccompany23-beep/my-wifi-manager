{{-- resources/views/portfolio.blade.php --}}
@extends('layouts.app')

@section('title', __('Portfolio | Ori Ola OBS Photography'))

@section('content')
<div class="min-h-screen bg-black text-white pt-24">
    <div class="container mx-auto px-4">
        <!-- En-tête -->
        <div class="text-center mb-16">
            <div class="mb-6 gsap-reveal">
                <h1 class="font-oswald text-5xl md:text-7xl lg:text-8xl uppercase mb-4 tracking-tighter">
                    <span class="block text-white">{{ __("PORTFOLIO") }}</span>
                    <span class="text-[#00D4FF] neon-text">{{ __("COMPLET") }}</span>
                </h1>
            </div>
            <p class="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 px-4 gsap-reveal">
                {{ __("Explorez l'ensemble de mon travail photographique à travers tous les univers") }}
            </p>
        </div>

        <!-- Filtres par catégorie -->
        <div class="flex flex-wrap justify-center gap-3 mb-16 gsap-reveal">
            <button class="badge-base border-2 border-[#00D4FF] hover:bg-[#00D4FF]/20 transition-all duration-300 active-filter"
                    data-category="all">
                {{ __("TOUT") }}
            </button>
            
            @php
                $categories = $events->pluck('category')->unique();
                $categoryLabels = [
                    'sport' => 'SPORT',
                    'event' => 'ÉVÉNEMENTIEL',
                    'studio' => 'STUDIO',
                    'nature' => 'NATURE',
                    'travel' => 'VOYAGE',
                    'documentary' => 'DOCUMENTAIRE'
                ];
            @endphp
            
            @foreach($categories as $category)
                @if(!in_array($category, array_keys($categoryLabels)) || $categoryLabels[$category] ?? null)
                    <button class="badge-base border border-white/30 hover:border-white hover:bg-white/10 transition-all duration-300"
                            data-category="{{ $category }}">
                        {{ $categoryLabels[$category] ?? strtoupper($category) }}
                    </button>
                @endif
            @endforeach
        </div>

        <!-- Grille de galeries dynamique -->
        <div class="mb-24">
            @php
                // Organiser les événements par sections pour un affichage varié
                $eventChunks = $events->chunk(9);
            @endphp
            
            @foreach($eventChunks as $chunkIndex => $chunk)
                @if($chunkIndex % 2 == 0)
                    {{-- Layout 1: 2 larges --}}
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        @foreach($chunk->take(2) as $event)
                            <div class="group gallery-item gsap-reveal-img" data-category="{{ $event->category }}">
                                <a href="{{ route('event.detail', $event->slug) }}" class="block relative overflow-hidden aspect-[4/3] lg:aspect-[5/3]">
                                    <img src="{{ Storage::url($event->featured_image) }}"
                                         alt="{{ $event->title }}"
                                         class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700">
                                    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500"></div>
                                    <div class="absolute inset-0 border-2 border-white/10 group-hover:border-[{{ $event->category_color }}]/50 transition-all duration-500"></div>
                                    <div class="absolute bottom-0 left-0 p-6 lg:p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        <span class="badge-base mb-3" style="background: {{ $event->category_color }}20; border-color: {{ $event->category_color }}; color: {{ $event->category_color }}">
                                            {{ $event->category_label }}
                                        </span>
                                        <h3 class="font-oswald text-2xl lg:text-4xl mb-2">{{ strtoupper($event->title) }}</h3>
                                        <p class="text-sm text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                            {{ $event->images_count }} {{ $event->images_count > 1 ? __('photos') : __('photo') }}
                                        </p>
                                    </div>
                                    <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                        <div class="text-[{{ $event->category_color }}] text-sm font-oswald uppercase tracking-widest">→</div>
                                    </div>
                                </a>
                            </div>
                        @endforeach
                    </div>

                    {{-- Layout 2: 3 carrés --}}
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        @foreach($chunk->slice(2, 3) as $event)
                            <div class="group gallery-item gsap-reveal-img" data-category="{{ $event->category }}">
                                <a href="{{ route('event.detail', $event->slug) }}" class="block relative overflow-hidden aspect-square">
                                    <img src="{{ Storage::url($event->featured_image) }}"
                                         alt="{{ $event->title }}"
                                         class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700">
                                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-500"></div>
                                    <div class="absolute inset-0 border-2 border-white/10 group-hover:border-white/50 transition-all duration-500"></div>
                                    <div class="absolute bottom-0 left-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        <span class="badge-base mb-2" style="background: {{ $event->category_color }}20; border-color: {{ $event->category_color }}; color: {{ $event->category_color }}">
                                            {{ $event->category_label }}
                                        </span>
                                        <h3 class="font-oswald text-xl lg:text-2xl">{{ strtoupper($event->title) }}</h3>
                                    </div>
                                </a>
                            </div>
                        @endforeach
                    </div>
                @else
                    {{-- Layout alterné: 1 large + 2 moyens --}}
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        @foreach($chunk->take(1) as $event)
                            <div class="group gallery-item gsap-reveal-img lg:col-span-2" data-category="{{ $event->category }}">
                                <a href="{{ route('event.detail', $event->slug) }}" class="block relative overflow-hidden aspect-[4/3] lg:aspect-[16/7]">
                                    <img src="{{ Storage::url($event->featured_image) }}"
                                         alt="{{ $event->title }}"
                                         class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700">
                                    <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500"></div>
                                    <div class="absolute inset-0 border-2 border-white/10 group-hover:border-[{{ $event->category_color }}]/50 transition-all duration-500"></div>
                                    <div class="absolute bottom-0 left-0 p-6 lg:p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        <span class="badge-base mb-3" style="background: {{ $event->category_color }}20; border-color: {{ $event->category_color }}; color: {{ $event->category_color }}">
                                            {{ $event->category_label }}
                                        </span>
                                        <h3 class="font-oswald text-2xl lg:text-4xl mb-2">{{ strtoupper($event->title) }}</h3>
                                        <p class="text-sm text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                            {{ $event->images_count }} {{ $event->images_count > 1 ? __('photos') : __('photo') }}
                                        </p>
                                    </div>
                                </a>
                            </div>
                        @endforeach
                        
                        @foreach($chunk->slice(1, 2) as $event)
                            <div class="group gallery-item gsap-reveal-img" data-category="{{ $event->category }}">
                                <a href="{{ route('event.detail', $event->slug) }}" class="block relative overflow-hidden aspect-square">
                                    <img src="{{ Storage::url($event->featured_image) }}"
                                         alt="{{ $event->title }}"
                                         class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700">
                                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-500"></div>
                                    <div class="absolute bottom-0 left-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        <span class="badge-base mb-2" style="background: {{ $event->category_color }}20; border-color: {{ $event->category_color }}; color: {{ $event->category_color }}">
                                            {{ $event->category_label }}
                                        </span>
                                        <h3 class="font-oswald text-xl lg:text-2xl">{{ strtoupper($event->title) }}</h3>
                                    </div>
                                </a>
                            </div>
                        @endforeach
                    </div>
                @endif
            @endforeach
            
            @if($events->isEmpty())
                <div class="text-center py-20">
                    <p class="text-gray-400 text-xl">{{ __("Aucun projet disponible pour le moment.") }}</p>
                </div>
            @endif
        </div>

        <!-- Section Call to Action -->
        <div class="text-center py-16 border-t border-white/10 mt-16">
            <h2 class="font-oswald text-3xl md:text-5xl mb-6 uppercase">
                <span class="text-white block">{{ __("VOTRE PROJET") }}</span>
                <span class="text-[#FF00E5] pink-glow">{{ __("PHOTOGRAPHIQUE") }}</span>
            </h2>
            <p class="text-gray-400 mb-10 max-w-2xl mx-auto text-lg">
                {{ __("Chaque projet est unique. Discutons du vôtre pour créer des images qui racontent votre histoire.") }}
            </p>
            <a href="{{ route('contact') }}" 
               class="inline-block px-8 py-4 bg-gradient-to-r from-[#00D4FF] to-[#FF00E5] font-oswald uppercase tracking-widest text-lg hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all duration-300 hover:scale-105">
                {{ __("DÉMARRER UN PROJET") }}
            </a>
        </div>
    </div>
</div>

<style>
    .badge-base {
        @apply px-5 py-2 text-sm font-oswald uppercase tracking-wider rounded-full;
    }
    
    .active-filter {
        background: rgba(0, 212, 255, 0.2) !important;
        box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
    }
    
    .gallery-item {
        position: relative;
        overflow: hidden;
        cursor: pointer;
    }
    
    .gallery-item::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.03) 50%, transparent 60%);
        z-index: 2;
        opacity: 0;
        transition: opacity 0.5s ease;
    }
    
    .gallery-item:hover::before {
        opacity: 1;
    }
    
    .gsap-reveal-img {
        opacity: 0;
        transform: translateY(50px) scale(0.95);
    }
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Filtrage par catégorie
    const filterButtons = document.querySelectorAll('[data-category]');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Retirer la classe active de tous les boutons
            filterButtons.forEach(btn => btn.classList.remove('active-filter'));
            // Ajouter la classe active au bouton cliqué
            this.classList.add('active-filter');

            const filter = this.dataset.category;
            
            galleryItems.forEach(item => {
                if (filter === 'all') {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0) scale(1)';
                    }, 50);
                } else {
                    const category = item.dataset.category;
                    if (category === filter) {
                        item.style.display = 'block';
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0) scale(1)';
                        }, 50);
                    } else {
                        item.style.opacity = '0';
                        item.style.transform = 'translateY(20px) scale(0.9)';
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 500);
                    }
                }
            });
        });
    });

    // Animation au scroll (fallback si GSAP n'est pas chargé)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0) scale(1)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.gsap-reveal-img').forEach(el => {
        observer.observe(el);
    });
});
</script>
@endsection