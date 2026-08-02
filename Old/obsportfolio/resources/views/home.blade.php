@extends('layouts.app')

@section('title', __('Ori Ola OBS Photography | Photographe Sportif, Événementiel, Studio, Nature & Voyage'))

@section('description', __('Ori Ola OBS - Photographe polyvalent spécialisé en sport, événementiel, studio, nature et
    voyage.'))

@section('content')
    <!-- Hero Section -->
    <header class="relative min-h-screen flex items-center justify-center overflow-hidden pt-20" id="hero-section">
        <div class="absolute inset-0 z-0">
            @if (isset($heroImages) && $heroImages->isNotEmpty())
                @foreach ($heroImages as $index => $image)
                    <img src="{{ Storage::url($image->image_path) }}" class="w-full h-full object-cover opacity-30"
                        alt="{{ $image->title ?? __('Photographie Professionnelle') }}"
                        loading="{{ $index === 0 ? 'eager' : 'lazy' }}" decoding="sync">
                @endforeach
            @else
                <img src="https://scontent.fcoo5-1.fna.fbcdn.net/v/t39.30808-6/611339526_1453481453446725_7031716561456807716_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=833d8c&_nc_ohc=Jh6E-lR6XhkQ7kNvwHFX9JS&_nc_oc=Adlv4Ux4magLvecndmkRMFhoyvDXBwUgDxkOuYZ13ObcpN9K82XCnzjKT8aDV-lvqKA&_nc_zt=23&_nc_ht=scontent.fcoo5-1.fna&_nc_gid=1iGxF0vPN-CWKp21PduhgA&oh=00_Afvh3jQT_TpN4yK0MsngF61kvyZV-84Ybdz8T40lCsY4hg&oe=6991FE0C"
                    class="w-full h-full object-cover opacity-30" alt="{{ __('Photographie Professionnelle') }}"
                    loading="eager" decoding="sync">
            @endif

            <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black"></div>
        </div>

        <div class="absolute inset-0 z-0 overflow-hidden">
            <div class="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-[#FF00E5] rounded-full opacity-10 blur-3xl">
            </div>
            <div
                class="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-[#00D4FF] rounded-full opacity-10 blur-3xl">
            </div>
        </div>

        <div class="container mx-auto px-4 relative z-10 text-center">
            <div class="mb-6 md:mb-8 flex flex-wrap justify-center gap-2" id="hero-badges">
                <span class="badge-base badge-sport">{{ __('PHOTOS SPORTIVES') }}</span>
                <span class="badge-base badge-event">{{ __(' PHOTOS ÉVÉNEMENTIEL') }}</span>
                <span class="badge-base badge-nature">{{ __('PHOTOS STUDIO') }}</span>

                <!--span class="badge-base badge-nature">{{ __('NATURE') }}</span>
                <span class="badge-base badge-travel">{{ __('REPORTAGE') }}</span-->
            </div>

            <h1 class="font-oswald uppercase leading-none mb-6">
                <div id="hero-title-1">
                    <span
                        class="block text-white text-4xl md:text-6xl lg:text-8xl tracking-tighter">{{ __('UNE VISION') }}</span>
                </div>
                <div id="hero-title-2" class="mt-2">
                    <span class="text-transparent text-3xl md:text-5xl lg:text-7xl tracking-tighter block"
                        style="-webkit-text-stroke: 1px rgba(255,255,255,0.8);">
                        {{ __('PROFESSIONNELLE') }}
                    </span>
                    <span
                        class="text-[#FF00E5] text-4xl md:text-6xl lg:text-8xl ml-0 md:ml-4 italic tracking-tighter block mt-1">{{ __('DU SPORT') }}</span>
                </div>
            </h1>

            <p id="hero-subtitle"
                class="text-sm md:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed opacity-90 mb-10 md:mb-12 font-light px-4 text-gray-300">
                {{ __('De l’exigence du terrain sportif à la rigueur des événements et à la précision du studio, une photographie dédiée au sport. Une approche technique polyvalente pour documenter vos projets avec clarté.') }}
            </p>

            <div id="hero-buttons" class="flex flex-col sm:flex-row justify-center gap-4 md:gap-6 px-4">
                <a href="#work"
                    class="px-6 py-3 md:px-8 md:py-4 border border-[#00D4FF] text-[#00D4FF] font-oswald text-sm md:text-base uppercase tracking-widest hover:bg-[#00D4FF] hover:text-black transition-all duration-300 text-center">
                    {{ __('Consulter le portfolio') }}
                </a>
                <a href="{{ route('contact') }}"
                    class="px-6 py-3 md:px-8 md:py-4 bg-white text-black font-oswald text-sm md:text-base uppercase tracking-widest hover:bg-[#FF00E5] hover:text-white transition-all duration-300 text-center">
                    {{ __('Demander un devis') }}
                </a>
            </div>
        </div>
    </header>

    <!-- Ticker Bandeau - CORRIGÉ AVEC INCLINAISON -->
    <div class="relative z-20 overflow-hidden my-8 md:my-12">
        <!-- Conteneur incliné -->
        <div class="relative  origin-center">
            <!-- Fond du bandeau -->
            <div class="bg-black py-3 md:py-4 border-y border-white/10">
                <!-- Contenu du ticker -->
                <div class="whitespace-nowrap font-oswald text-xs md:text-sm tracking-widest animate-marquee">
                    <span class="inline-block px-4 md:px-8 text-[#00D4FF]">★ {{ __('PHOTOGRAPHE SPORTIF') }}</span>
                    <span class="inline-block px-4 md:px-8 text-[#FF00E5]">★ {{ __('PHOTOGRAPHE ÉVÉNEMENTIEL') }}</span>
                    <span class="inline-block px-4 md:px-8 text-white">★ {{ __('PHOTOGRAPHE STUDIO & PORTRAIT') }}</span>
                    <!--span class="inline-block px-4 md:px-8 text-[#00FF88]">★ {{ __('NATURE & PAYSAGES') }}</span>
                        <span class="inline-block px-4 md:px-8 text-[#FFA500]">★ {{ __('VOYAGE & REPORTAGE') }}</span-->
                    <!-- Duplication pour l'effet infini -->
                    <span class="inline-block px-4 md:px-8 text-[#00D4FF]">★ {{ __('PHOTOGRAPHE SPORTIF') }}</span>
                    <span class="inline-block px-4 md:px-8 text-[#FF00E5]">★ {{ __('PHOTOGRAPHE ÉVÉNEMENTIEL') }}</span>
                    <span class="inline-block px-4 md:px-8 text-white">★ {{ __('PHOTOGRAPHE STUDIO & PORTRAIT') }}</span>
                    <!--span class="inline-block px-4 md:px-8 text-[#00FF88]">★ {{ __('NATURE & PAYSAGES') }}</span>
                        <span class="inline-block px-4 md:px-8 text-[#FFA500]">★ {{ __('VOYAGE & REPORTAGE') }}</span-->
                </div>
            </div>

            <!-- Effets de bords diagonaux -->
            <div
                class="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent opacity-50">
            </div>
            <div
                class="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF00E5] to-transparent opacity-50">
            </div>
        </div>
    </div>

    <!-- Inclure les sections -->
    @include('partials.sections.specialties')
    @include('partials.sections.portfolio-preview')
    @include('partials.sections.about-preview')
@endsection

@push('styles')
    <style>
        /* Animation CSS pour le ticker */
        .animate-marquee {
            animation: marquee 30s linear infinite;
            display: inline-block;
        }

        @keyframes marquee {
            0% {
                transform: translateX(0);
            }

            100% {
                transform: translateX(-50%);
            }
        }

        /* Styles pour l'animation du hero */
        #hero-badges,
        #hero-title-1,
        #hero-title-2,
        #hero-subtitle,
        #hero-buttons {
            opacity: 0;
            transform: translateY(20px);
        }

        /* Animation de fade-in avec CSS */
        .fade-in-up {
            animation: fadeInUp 0.8s ease forwards;
        }

        @keyframes fadeInUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Effets pour le bandeau incliné */
        .ticker-container {
            transform-style: preserve-3d;
            perspective: 1000px;
        }

        /* Correction pour éviter le débordement sur mobile */
        @media (max-width: 768px) {
            .animate-marquee {
                animation: marquee 40s linear infinite;
                /* Plus lent sur mobile */
            }

            .ticker-container {
                overflow: hidden;
            }
        }

        /* Pause au hover */
        .animate-marquee:hover {
            animation-play-state: paused;
        }
    </style>
@endpush

@push('scripts')
    <script>
        // Scripts spécifiques à la page d'accueil
        document.addEventListener('DOMContentLoaded', function() {
            // 1. Animer le hero avec des délais CSS simples
            setTimeout(() => {
                const heroElements = [
                    document.getElementById('hero-badges'),
                    document.getElementById('hero-title-1'),
                    document.getElementById('hero-title-2'),
                    document.getElementById('hero-subtitle'),
                    document.getElementById('hero-buttons')
                ];

                heroElements.forEach((el, index) => {
                    if (el) {
                        setTimeout(() => {
                            el.classList.add('fade-in-up');
                        }, index * 200); // Délai progressif
                    }
                });
            }, 300);

            // 2. Smooth Scroll for Anchors (solution native légère)
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    const href = this.getAttribute('href');
                    if (href !== '#') {
                        e.preventDefault();
                        const target = document.querySelector(href);
                        if (target) {
                            window.scrollTo({
                                top: target.offsetTop - 80,
                                behavior: 'smooth'
                            });
                        }
                    }
                });
            });

            // 3. Charger GSAP seulement si nécessaire pour les autres sections
            function loadGSAPIfNeeded() {
                // Vérifier si des éléments nécessitent GSAP
                const needsGSAP = document.querySelectorAll('.gsap-reveal, .gsap-reveal-img').length > 0;

                if (needsGSAP && typeof gsap === 'undefined') {
                    // Charger GSAP dynamiquement
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
                    script.onload = function() {
                        const scrollTrigger = document.createElement('script');
                        scrollTrigger.src =
                            'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js';
                        scrollTrigger.onload = initScrollAnimations;
                        document.body.appendChild(scrollTrigger);
                    };
                    document.body.appendChild(script);
                } else if (typeof gsap !== 'undefined') {
                    // GSAP déjà chargé
                    initScrollAnimations();
                }
            }

            function initScrollAnimations() {
                if (typeof gsap !== 'undefined' && gsap.registerPlugin) {
                    gsap.registerPlugin(ScrollTrigger);

                    // Animations pour les sections révélées au scroll
                    const revealElements = document.querySelectorAll('.gsap-reveal');
                    revealElements.forEach(el => {
                        gsap.fromTo(el, {
                            y: 50,
                            opacity: 0
                        }, {
                            y: 0,
                            opacity: 1,
                            duration: 0.8,
                            ease: "power2.out",
                            scrollTrigger: {
                                trigger: el,
                                start: "top 85%",
                                toggleActions: "play none none none"
                            }
                        });
                    });

                    const imgElements = document.querySelectorAll('.gsap-reveal-img');
                    imgElements.forEach(el => {
                        gsap.fromTo(el, {
                            scale: 0.95,
                            opacity: 0
                        }, {
                            scale: 1,
                            opacity: 1,
                            duration: 1,
                            ease: "power2.out",
                            scrollTrigger: {
                                trigger: el,
                                start: "top 90%",
                                toggleActions: "play none none none"
                            }
                        });
                    });
                }
            }

            // Charger GSAP après un léger délai ou au scroll
            setTimeout(loadGSAPIfNeeded, 1000);

            // Ou charger au premier scroll
            let gsapLoaded = false;
            window.addEventListener('scroll', function loadOnScroll() {
                if (!gsapLoaded) {
                    gsapLoaded = true;
                    loadGSAPIfNeeded();
                    window.removeEventListener('scroll', loadOnScroll);
                }
            }, {
                once: true,
                passive: true
            });

            // 4. Effet interactif pour le ticker (optionnel)
            const ticker = document.querySelector('.animate-marquee');
            if (ticker) {
                ticker.addEventListener('mouseenter', () => {
                    ticker.style.animationPlayState = 'paused';
                });

                ticker.addEventListener('mouseleave', () => {
                    ticker.style.animationPlayState = 'running';
                });

                // Pause au toucher sur mobile
                ticker.addEventListener('touchstart', () => {
                    ticker.style.animationPlayState = 'paused';
                });

                ticker.addEventListener('touchend', () => {
                    setTimeout(() => {
                        ticker.style.animationPlayState = 'running';
                    }, 1000);
                });
            }
        });
    </script>
@endpush
