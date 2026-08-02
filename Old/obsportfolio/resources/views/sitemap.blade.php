@extends('layouts.app')

@section('title', __('Plan du Site | Ori Ola OBS Photography'))

@section('content')
<div class="min-h-screen bg-black text-white pt-24 pb-16">
    <div class="container mx-auto px-4 max-w-6xl">
        <!-- Header -->
        <div class="text-center mb-16">
            <div class="inline-block mb-8">
                <div class="w-24 h-1 bg-gradient-to-r from-[#00D4FF] to-[#FF00E5] mx-auto mb-6"></div>
                <span class="text-[#FF00E5] text-sm uppercase tracking-widest font-bold">{{ __("NAVIGATION") }}</span>
            </div>
            
            <h1 class="font-oswald text-5xl md:text-6xl lg:text-7xl uppercase leading-none mb-8 tracking-tighter">
                <span class="block text-white">{{ __("PLAN") }}</span>
                <span class="block text-[#00D4FF]">{{ __("DU SITE") }}</span>
            </h1>
            
            <p class="text-xl text-gray-300 max-w-3xl mx-auto">
                {{ __("Retrouvez l'ensemble des pages de notre site pour une navigation optimale.") }}
            </p>
        </div>

        <!-- Introduction -->
        <div class="mb-12 text-center gsap-reveal">
            <p class="text-lg text-gray-400 max-w-3xl mx-auto">
                {{ __("Ce plan du site vous permet de découvrir l'ensemble de notre contenu et de naviguer facilement vers les pages qui vous intéressent.") }}
            </p>
        </div>

        <!-- Main Navigation -->
        <div class="mb-16 gsap-reveal">
            <h2 class="font-oswald text-3xl md:text-4xl mb-8 text-center">
                <span class="text-white">{{ __("Navigation") }}</span>
                <span class="text-[#FF00E5]">{{ __("Principale") }}</span>
            </h2>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <a href="{{ route('home') }}" 
                   class="group p-8 border-2 border-white/10 bg-[#080808] hover:border-[#00D4FF] hover:bg-[#00D4FF]/5 transition-all duration-300 text-center gsap-reveal">
                    <div class="text-4xl text-[#00D4FF] mb-4 group-hover:scale-110 transition-transform duration-300">🏠</div>
                    <h3 class="font-oswald text-xl mb-2">{{ __("Accueil") }}</h3>
                    <p class="text-sm text-gray-400">{{ __("Page d'accueil et présentation") }}</p>
                </a>
                
                <a href="{{ route('about') }}" 
                   class="group p-8 border-2 border-white/10 bg-[#080808] hover:border-[#FF00E5] hover:bg-[#FF00E5]/5 transition-all duration-300 text-center gsap-reveal">
                    <div class="text-4xl text-[#FF00E5] mb-4 group-hover:scale-110 transition-transform duration-300">👨‍🎨</div>
                    <h3 class="font-oswald text-xl mb-2">{{ __("À Propos") }}</h3>
                    <p class="text-sm text-gray-400">{{ __("Qui suis-je ? Mon parcours") }}</p>
                </a>
                
                <a href="{{ route('portfolio') }}" 
                   class="group p-8 border-2 border-white/10 bg-[#080808] hover:border-[#00FF88] hover:bg-[#00FF88]/5 transition-all duration-300 text-center gsap-reveal">
                    <div class="text-4xl text-[#00FF88] mb-4 group-hover:scale-110 transition-transform duration-300">📸</div>
                    <h3 class="font-oswald text-xl mb-2">{{ __("Portfolio") }}</h3>
                    <p class="text-sm text-gray-400">{{ __("Mes travaux photographiques") }}</p>
                </a>
                
                <a href="{{ route('contact') }}" 
                   class="group p-8 border-2 border-white/10 bg-[#080808] hover:border-[#FFA500] hover:bg-[#FFA500]/5 transition-all duration-300 text-center gsap-reveal">
                    <div class="text-4xl text-[#FFA500] mb-4 group-hover:scale-110 transition-transform duration-300">📞</div>
                    <h3 class="font-oswald text-xl mb-2">{{ __("Contact") }}</h3>
                    <p class="text-sm text-gray-400">{{ __("Me contacter pour un projet") }}</p>
                </a>
            </div>
        </div>

        <!-- Services -->
        <div class="mb-16 gsap-reveal">
            <h2 class="font-oswald text-3xl md:text-4xl mb-8 text-center">
                <span class="text-white">{{ __("Mes") }}</span>
                <span class="text-[#00D4FF]">{{ __("Services") }}</span>
            </h2>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="p-6 border border-white/10 bg-[#080808] rounded-sm">
                    <div class="text-[#FF00E5] text-2xl mb-4">💍</div>
                    <h3 class="font-oswald text-xl mb-3">{{ __("Photographie de Mariage") }}</h3>
                    <p class="text-gray-400 text-sm mb-4">{{ __("Capturer les moments magiques de votre grand jour") }}</p>
                    <div class="flex flex-wrap gap-2">
                        <span class="px-3 py-1 text-xs bg-[#FF00E5]/10 text-[#FF00E5] rounded-full">{{ __("Reportage") }}</span>
                        <span class="px-3 py-1 text-xs bg-white/10 text-white rounded-full">{{ __("Portraits") }}</span>
                        <span class="px-3 py-1 text-xs bg-[#00D4FF]/10 text-[#00D4FF] rounded-full">{{ __("Cérémonie") }}</span>
                    </div>
                </div>
                
                <div class="p-6 border border-white/10 bg-[#080808] rounded-sm">
                    <div class="text-[#00D4FF] text-2xl mb-4">🏃</div>
                    <h3 class="font-oswald text-xl mb-3">{{ __("Photographie Sportive") }}</h3>
                    <p class="text-gray-400 text-sm mb-4">{{ __("Immortaliser l'action et l'émotion du sport") }}</p>
                    <div class="flex flex-wrap gap-2">
                        <span class="px-3 py-1 text-xs bg-[#00D4FF]/10 text-[#00D4FF] rounded-full">{{ __("Action") }}</span>
                        <span class="px-3 py-1 text-xs bg-white/10 text-white rounded-full">{{ __("Événements") }}</span>
                        <span class="px-3 py-1 text-xs bg-[#00FF88]/10 text-[#00FF88] rounded-full">{{ __("Athlètes") }}</span>
                    </div>
                </div>
                
                <div class="p-6 border border-white/10 bg-[#080808] rounded-sm">
                    <div class="text-[#00FF88] text-2xl mb-4">🎭</div>
                    <h3 class="font-oswald text-xl mb-3">{{ __("Photographie d'Événement") }}</h3>
                    <p class="text-gray-400 text-sm mb-4">{{ __("Couvrir vos événements professionnels et culturels") }}</p>
                    <div class="flex flex-wrap gap-2">
                        <span class="px-3 py-1 text-xs bg-[#00FF88]/10 text-[#00FF88] rounded-full">{{ __("Corporate") }}</span>
                        <span class="px-3 py-1 text-xs bg-white/10 text-white rounded-full">{{ __("Culturel") }}</span>
                        <span class="px-3 py-1 text-xs bg-[#FFA500]/10 text-[#FFA500] rounded-full">{{ __("Social") }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pages Légales -->
        <div class="mb-16 gsap-reveal">
            <h2 class="font-oswald text-3xl md:text-4xl mb-8 text-center">
                <span class="text-white">{{ __("Informations") }}</span>
                <span class="text-[#FF00E5]">{{ __("Légales") }}</span>
            </h2>
            
            <div class="grid md:grid-cols-3 gap-6">
                <a href="{{ route('legal.mentions') }}" 
                   class="group p-6 border border-white/10 bg-[#080808] hover:border-[#00D4FF] hover:bg-[#00D4FF]/5 transition-all duration-300">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="text-2xl text-[#00D4FF] group-hover:scale-110 transition-transform duration-300">⚖️</div>
                        <h3 class="font-oswald text-lg">{{ __("Mentions Légales") }}</h3>
                    </div>
                    <p class="text-sm text-gray-400">{{ __("Informations légales sur le site et l'éditeur") }}</p>
                </a>
                
                <a href="{{ route('legal.privacy') }}" 
                   class="group p-6 border border-white/10 bg-[#080808] hover:border-[#FF00E5] hover:bg-[#FF00E5]/5 transition-all duration-300">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="text-2xl text-[#FF00E5] group-hover:scale-110 transition-transform duration-300">🔒</div>
                        <h3 class="font-oswald text-lg">{{ __("Confidentialité") }}</h3>
                    </div>
                    <p class="text-sm text-gray-400">{{ __("Politique de protection des données personnelles") }}</p>
                </a>
                
                <a href="{{ route('legal.terms') }}" 
                   class="group p-6 border border-white/10 bg-[#080808] hover:border-[#00FF88] hover:bg-[#00FF88]/5 transition-all duration-300">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="text-2xl text-[#00FF88] group-hover:scale-110 transition-transform duration-300">📝</div>
                        <h3 class="font-oswald text-lg">{{ __("Conditions d'Utilisation") }}</h3>
                    </div>
                    <p class="text-sm text-gray-400">{{ __("Règles d'utilisation du site et des services") }}</p>
                </a>
            </div>
        </div>

        <!-- Catégories Portfolio -->
        <div class="mb-16 gsap-reveal">
            <h2 class="font-oswald text-3xl md:text-4xl mb-8 text-center">
                <span class="text-white">{{ __("Catégories") }}</span>
                <span class="text-[#00D4FF]">{{ __("Portfolio") }}</span>
            </h2>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <a href="{{ route('portfolio') }}?category=sport" 
                   class="group p-4 border border-white/10 bg-[#080808] hover:border-[#FF00E5] hover:bg-[#FF00E5]/5 transition-all duration-300 text-center">
                    <div class="text-lg mb-2">⚽</div>
                    <p class="text-sm font-medium">{{ __("Sport") }}</p>
                    <p class="text-xs text-gray-400 mt-1">{{ __("Action et émotion") }}</p>
                </a>
                
                <a href="{{ route('portfolio') }}?category=portrait" 
                   class="group p-4 border border-white/10 bg-[#080808] hover:border-[#00D4FF] hover:bg-[#00D4FF]/5 transition-all duration-300 text-center">
                    <div class="text-lg mb-2">👤</div>
                    <p class="text-sm font-medium">{{ __("Portrait") }}</p>
                    <p class="text-xs text-gray-400 mt-1">{{ __("Personnalité et caractère") }}</p>
                </a>
                
                <a href="{{ route('portfolio') }}?category=event" 
                   class="group p-4 border border-white/10 bg-[#080808] hover:border-[#00FF88] hover:bg-[#00FF88]/5 transition-all duration-300 text-center">
                    <div class="text-lg mb-2">🎉</div>
                    <p class="text-sm font-medium">{{ __("Événement") }}</p>
                    <p class="text-xs text-gray-400 mt-1">{{ __("Moment et ambiance") }}</p>
                </a>
                
                <a href="{{ route('portfolio') }}?category=travel" 
                   class="group p-4 border border-white/10 bg-[#080808] hover:border-[#FFA500] hover:bg-[#FFA500]/5 transition-all duration-300 text-center">
                    <div class="text-lg mb-2">🌍</div>
                    <p class="text-sm font-medium">{{ __("Voyage") }}</p>
                    <p class="text-xs text-gray-400 mt-1">{{ __("Découverte et aventure") }}</p>
                </a>
            </div>
        </div>

        <!-- Search Tips -->
        <div class="mb-16 gsap-reveal">
            <div class="bg-gradient-to-r from-[#080808] to-black border-l-4 border-[#00D4FF] pl-6 py-6">
                <h3 class="font-oswald text-2xl mb-4">{{ __("Conseils de Recherche") }}</h3>
                <p class="text-gray-300 mb-4">
                    {{ __("Vous cherchez quelque chose de spécifique ? Utilisez ces mots-clés :") }}
                </p>
                <div class="flex flex-wrap gap-2">
                    <span class="px-3 py-1 text-sm bg-[#FF00E5]/10 text-[#FF00E5] rounded-full">mariage</span>
                    <span class="px-3 py-1 text-sm bg-[#00D4FF]/10 text-[#00D4FF] rounded-full">sport</span>
                    <span class="px-3 py-1 text-sm bg-[#00FF88]/10 text-[#00FF88] rounded-full">portrait</span>
                    <span class="px-3 py-1 text-sm bg-[#FFA500]/10 text-[#FFA500] rounded-full">corporate</span>
                    <span class="px-3 py-1 text-sm bg-white/10 text-white rounded-full">événement</span>
                    <span class="px-3 py-1 text-sm bg-[#00D4FF]/10 text-[#00D4FF] rounded-full">photographe bénin</span>
                </div>
            </div>
        </div>

        <!-- Accessibility -->
        <div class="gsap-reveal">
            <div class="p-8 border-2 border-white/10 bg-[#080808] rounded-sm">
                <h3 class="font-oswald text-2xl mb-6 text-center">{{ __("Accessibilité") }}</h3>
                
                <div class="grid md:grid-cols-2 gap-8">
                    <div>
                        <h4 class="font-oswald text-lg mb-4 text-[#00D4FF]">{{ __("Navigation au clavier") }}</h4>
                        <ul class="space-y-3 text-gray-300">
                            <li class="flex items-center gap-2">
                                <div class="w-2 h-2 bg-[#00D4FF] rounded-full"></div>
                                <span>{{ __("Tab pour naviguer entre les liens") }}</span>
                            </li>
                            <li class="flex items-center gap-2">
                                <div class="w-2 h-2 bg-[#00D4FF] rounded-full"></div>
                                <span>{{ __("Entrée pour activer un lien") }}</span>
                            </li>
                            <li class="flex items-center gap-2">
                                <div class="w-2 h-2 bg-[#00D4FF] rounded-full"></div>
                                <span>{{ __("Échap pour fermer les modales") }}</span>
                            </li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="font-oswald text-lg mb-4 text-[#FF00E5]">{{ __("Contraste") }}</h4>
                        <ul class="space-y-3 text-gray-300">
                            <li class="flex items-center gap-2">
                                <div class="w-2 h-2 bg-[#FF00E5] rounded-full"></div>
                                <span>{{ __("Texte contrasté pour lisibilité") }}</span>
                            </li>
                            <li class="flex items-center gap-2">
                                <div class="w-2 h-2 bg-[#FF00E5] rounded-full"></div>
                                <span>{{ __("Alternatives textuelles aux images") }}</span>
                            </li>
                            <li class="flex items-center gap-2">
                                <div class="w-2 h-2 bg-[#FF00E5] rounded-full"></div>
                                <span>{{ __("Structure sémantique claire") }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- Back to top -->
        <div class="text-center mt-16">
            <a href="#top" 
               class="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white hover:bg-white/10 transition-all duration-300">
                <span>↑</span>
                {{ __("Retour en haut de page") }}
            </a>
        </div>
    </div>
</div>
@endsection

@push('styles')
<style>
    .gsap-reveal:nth-child(1) { animation-delay: 0.1s; }
    .gsap-reveal:nth-child(2) { animation-delay: 0.2s; }
    .gsap-reveal:nth-child(3) { animation-delay: 0.3s; }
    .gsap-reveal:nth-child(4) { animation-delay: 0.4s; }
    .gsap-reveal:nth-child(5) { animation-delay: 0.5s; }
    .gsap-reveal:nth-child(6) { animation-delay: 0.6s; }
    .gsap-reveal:nth-child(7) { animation-delay: 0.7s; }
    .gsap-reveal:nth-child(8) { animation-delay: 0.8s; }
</style>
@endpush

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        gsap.registerPlugin(ScrollTrigger);

        const revealElements = document.querySelectorAll('.gsap-reveal');
        revealElements.forEach((el, index) => {
            gsap.fromTo(el, {
                y: 40,
                opacity: 0
            }, {
                y: 0,
                opacity: 1,
                duration: 0.6,
                ease: "power3.out",
                delay: index * 0.1,
                scrollTrigger: {
                    trigger: el,
                    start: "top 85%",
                    toggleActions: "play none none none"
                }
            });
        });

        // Smooth scroll pour le lien "Retour en haut"
        document.querySelector('a[href="#top"]').addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });
</script>
@endpush