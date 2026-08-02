@extends('layouts.app')

@section('title', __('À Propos | Ori-Ola Johson - OBS Photography'))

@section('content')
    <div class="min-h-screen bg-black text-white pt-24">
        {{-- Hero Section --}}
        <div class="relative overflow-hidden border-b border-white/5">
            <div class="absolute inset-0 z-0">
                <div class="grid-line"></div>
                <div class="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-[#FF00E5]/10 to-transparent"></div>
                <div class="absolute bottom-0 right-0 w-full h-1/3 bg-gradient-to-t from-[#00D4FF]/10 to-transparent"></div>
            </div>

            <div class="container mx-auto px-4 max-w-6xl relative z-10">
                <div class="text-center mb-16 py-12">
                    <div class="inline-block mb-8">
                        <div class="w-24 h-1 bg-gradient-to-r from-[#FF00E5] to-[#00D4FF] mx-auto mb-6"></div>
                        <span
                            class="text-[#FF00E5] text-sm uppercase tracking-widest font-bold">{{ __('EXPERTISE & VISION PHOTOGRAPHIQUE') }}</span>
                    </div>

                    <h1 class="font-oswald text-5xl md:text-8xl lg:text-9xl uppercase leading-none mb-8 tracking-tighter">
                        <span class="block text-white">ORI-OLA</span>
                        <span class="block text-[#00D4FF] relative">
                            JOHSON
                            <span class="absolute -top-4 -right-4 text-[#FF00E5] text-4xl">•</span>
                        </span>
                        <span
                            class="block text-white mt-2 text-4xl md:text-6xl opacity-50">{{ __('OBS PHOTOGRAPHY') }}</span>
                    </h1>

                    <p class="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
                        {{ __('Une approche rigoureuse du reportage et du portrait, conçue pour révéler l’identité culturelle, capter l’émotion du terrain et sublimer la puissance du visuel, dans le respect des standards internationaux.') }}
                    </p>
                </div>

                <div class="flex flex-col lg:flex-row items-start gap-12 mb-24 gsap-reveal">
                    <div class="lg:w-2/5 relative">
                        <div class="relative group">
                            <div class="aspect-[3/4] overflow-hidden border border-white/10 rounded-sm">
                                @php
                                    $aboutPhoto = \App\Models\Media::section('about_photo')->first();
                                @endphp
                                @if ($aboutPhoto && $aboutPhoto->image_path)
                                    <img src="{{ Storage::url($aboutPhoto->image_path) }}"
                                        alt="{{ __('Ori-Ola Johson - Photographe Professionnel') }}"
                                        class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                                        loading="lazy">
                                @else
                                    <img src="https://scontent.fcoo5-1.fna.fbcdn.net/v/t39.30808-6/619330253_1467066308754906_1593721387508008889_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=111&ccb=1-7&_nc_sid=833d8c&_nc_ohc=1D0Z6YtnYa0Q7kNvwEkkZ4n&_nc_oc=Adn1ljwYVDW-9V78haijbQ8ZWf-ifYfxPsB2gruL5n-Nupmpt9IqKOvBw0g96Av2eLs&_nc_zt=23&_nc_ht=scontent.fcoo5-1.fna&_nc_gid=rmqbSYASmZnTSj_ibDL7tg&oh=00_AfufvoEcfebKgCPCK7HDtbWVuc2s_7RpqcfBLoH54apVeA&oe=698E3ED9"
                                        alt="{{ __('Ori-Ola Johson - Photographe Professionnel') }}"
                                        class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700">
                                @endif

                                <!--img src="https://scontent.fcoo5-1.fna.fbcdn.net/v/t39.30808-6/619330253_1467066308754906_1593721387508008889_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=111&ccb=1-7&_nc_sid=833d8c&_nc_ohc=1D0Z6YtnYa0Q7kNvwEkkZ4n&_nc_oc=Adn1ljwYVDW-9V78haijbQ8ZWf-ifYfxPsB2gruL5n-Nupmpt9IqKOvBw0g96Av2eLs&_nc_zt=23&_nc_ht=scontent.fcoo5-1.fna&_nc_gid=rmqbSYASmZnTSj_ibDL7tg&oh=00_AfufvoEcfebKgCPCK7HDtbWVuc2s_7RpqcfBLoH54apVeA&oe=698E3ED9"
                                        alt="{{ __('Ori-Ola Johson - Photographe Professionnel') }}"
                                        class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"-->
                            </div>
                            <div
                                class="absolute -bottom-4 -right-4 bg-black/90 backdrop-blur-sm p-4 border border-white/10">
                                <p class="font-oswald text-lg text-[#00D4FF]">{{ __('REPORTAGE VISUEL') }}</p>
                                <p class="text-xs uppercase tracking-widest text-gray-400">{{ __('Établi en 2025') }}</p>
                            </div>
                        </div>
                    </div>

                    <div class="lg:w-3/5">
                        <div class="mb-10">
                            <h2 class="font-oswald text-4xl md:text-5xl mb-6 uppercase">
                                {{ __('La Maîtrise de') }} <span class="text-[#FF00E5]">{{ __("l'Instant") }}</span>
                            </h2>

                            <p class="text-lg text-gray-300 mb-6 leading-relaxed">
                                {{ __('Je suis Ori-Ola Johson OGOUDARE, photographe professionnel spécialisé en photographie sportive. Mon travail vise à capturer l’intensité du jeu, l’émotion brute et l’instant décisif, dans le respect des standards éditoriaux des médias et des compétitions internationales.') }}
                            </p>

                            <p class="text-lg text-gray-300 mb-8 leading-relaxed">
                                {{ __('J’ai débuté la photographie en 2014, après l’obtention de mon BEPC, à travers la photographie artisanale. Désireux d’élever ma pratique à un niveau professionnel, j’ai poursuivi ma formation à l’étranger, notamment au Nigeria, où j’ai obtenu un diplôme en photographie professionnelle. Cette expérience a structuré mon regard, affiné ma technique et posé les bases de mon identité visuelle.') }}
                            </p>
                            <p class="text-lg text-gray-300 mb-6 leading-relaxed">
                                {{ __('En parallèle de mon parcours artistique, j’ai suivi une formation universitaire à la Faculté des Sciences de la Santé de Cotonou (FSS), au sein de l’École Supérieure des Assistants Sociaux (ESAS), où j’ai obtenu une Licence professionnelle d’Assistant Social d’État. Cette formation a renforcé mon sens de l’observation, mon approche humaine du terrain et ma rigueur professionnelle, des qualités essentielles dans le reportage sportif et médiatique.') }}
                            </p>
                            <p class="text-lg text-gray-300 mb-6 leading-relaxed">
                                {{ __('Depuis 2023, je me consacre principalement à la photographie sportive, avec la couverture de matchs officiels et d’événements sportifs, en mettant en lumière l’action, la dynamique collective et l’émotion qui définissent chaque compétition.') }}
                            </p>
                            <p class="text-lg text-gray-300 mb-6 leading-relaxed">
                                {{ __('En complément, j’interviens en photographie événementielle et de studio, une polyvalence qui enrichit mon storytelling visuel et garantit des productions adaptées aux exigences des médias, de la CAN et des compétitions FIFA.') }}
                            </p>
                        </div>

                        <div class="flex flex-wrap gap-4">
                            <a href="{{ route('contact') }}"
                                class="px-8 py-4 bg-white text-black font-oswald uppercase tracking-widest hover:bg-[#00D4FF] hover:text-black transition-all duration-300">
                                {{ __('Démarrer une collaboration') }}
                            </a>
                            <a href="{{ route('portfolio') }}"
                                class="px-8 py-4 border border-white/20 font-oswald uppercase tracking-widest hover:bg-white/10 transition-all duration-300">
                                {{ __('Consulter le portfolio') }}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {{-- Sport Section --}}
        <!--div class="py-24 bg-[#0A0A0A] border-b border-white/5">
            <div class="container mx-auto px-4 max-w-6xl">
                <div class="flex flex-col lg:flex-row-reverse items-center gap-16">
                    <div class="lg:w-1/2 gsap-reveal">
                        <span
                            class="text-[#00D4FF] font-bold tracking-widest text-sm uppercase block mb-4">{{ __('EXPÉRIENCE TERRAIN') }}</span>
                        <h2 class="font-oswald text-4xl md:text-5xl mb-8 uppercase leading-tight">
                            {{ __('Couverture des Grands') }} <br> <span
                                class="text-[#FF00E5]">{{ __('Événements Sportifs') }}</span>
                        </h2>
                        <p class="text-gray-300 text-lg mb-6">
                            {{ __("Depuis 2023, j'accompagne les fédérations et les médias dans la documentation des plus grandes compétitions de football sur le continent africain.") }}
                        </p>
                        <div class="space-y-4">
                            <div class="flex items-start gap-4 p-4 bg-white/5 border-l-4 border-[#00D4FF]">
                                <div>
                                    <h4 class="font-oswald text-xl text-white uppercase">{{ __('CAN 2025 - MAROC') }}</h4>
                                    <p class="text-gray-400 text-sm">
                                        {{ __("Photographe accrédité pour la Coupe d'Afrique des Nations, couvrant l'intensité des matchs et l'effervescence culturelle de l'événement.") }}
                                    </p>
                                </div>
                            </div>
                            <div class="flex items-start gap-4 p-4 bg-white/5 border-l-4 border-[#FF00E5]">
                                <div>
                                    <h4 class="font-oswald text-xl text-white uppercase">
                                        {{ __('COMPÉTITIONS CAF & FIFA') }}</h4>
                                    <p class="text-gray-400 text-sm">
                                        {{ __("Une expertise affirmée dans le suivi des éliminatoires et des tournois continentaux à travers l'Afrique.") }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="lg:w-1/2">
                        <div class="grid grid-cols-2 gap-4">
                            <div
                                class="h-64 bg-gray-900 border border-white/10 flex items-center justify-center p-8 text-center group">
                                <span
                                    class="font-oswald text-gray-500 uppercase tracking-tighter group-hover:text-white transition-colors">{{ __('Action Shots') }}</span>
                            </div>
                            <div
                                class="h-64 bg-gray-900 border border-white/10 mt-8 flex items-center justify-center p-8 text-center group">
                                <span
                                    class="font-oswald text-[#00D4FF] uppercase tracking-tighter group-hover:text-[#FF00E5] transition-colors">{{ __('Maroc 2025') }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div-->
{{-- Sport Section --}}
<div class="py-24 bg-[#0A0A0A] border-b border-white/5">
    <div class="container mx-auto px-4 max-w-4xl">
        <div class="gsap-reveal text-center">
            <span class="text-[#00D4FF] font-bold tracking-widest text-sm uppercase block mb-4">{{ __('EXPÉRIENCE TERRAIN') }}</span>
            <h2 class="font-oswald text-4xl md:text-5xl mb-8 uppercase leading-tight">
                {{ __('Couverture des Grands') }} <br> <span class="text-[#FF00E5]">{{ __('Événements Sportifs') }}</span>
            </h2>
            <p class="text-gray-300 text-lg mb-6 max-w-3xl mx-auto">
                {{ __("Depuis 2023, j'accompagne les fédérations et les médias dans la documentation des plus grandes compétitions de football sur le continent africain.") }}
            </p>
            <div class="space-y-4 max-w-2xl mx-auto">
                <div class="flex items-start gap-4 p-4 bg-white/5 border-l-4 border-[#00D4FF]">
                    <div>
                        <h4 class="font-oswald text-xl text-white uppercase">{{ __('CAN 2025 - MAROC') }}</h4>
                        <p class="text-gray-400 text-sm">
                            {{ __("Photographe accrédité pour la Coupe d'Afrique des Nations, couvrant l'intensité des matchs et l'effervescence culturelle de l'événement.") }}
                        </p>
                    </div>
                </div>
                <div class="flex items-start gap-4 p-4 bg-white/5 border-l-4 border-[#FF00E5]">
                    <div>
                        <h4 class="font-oswald text-xl text-white uppercase">{{ __('COMPÉTITIONS CAF & FIFA') }}</h4>
                        <p class="text-gray-400 text-sm">
                            {{ __("Une expertise affirmée dans le suivi des éliminatoires et des tournois continentaux à travers l'Afrique.") }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
        {{-- Stats Section --}}

        <div class="py-20 bg-[#080808]">
            <div class="container mx-auto px-4 max-w-6xl">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                    @foreach (\App\Models\Statistic::active()->get() as $stat)
                        <div class="text-center p-8 border border-white/5 bg-white/5 gsap-reveal">
                            <div class="text-5xl font-oswald mb-2" style="color: {{ $stat->color }}">
                                {{ $stat->value }}
                            </div>
                            <div class="text-[10px] uppercase tracking-widest text-gray-500">
                                {{ $stat->label }}
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        </div>

        {{-- CTA --}}
        <div class="py-24 border-t border-white/5">
            <div class="container mx-auto px-4 text-center max-w-3xl gsap-reveal">
                <h3 class="font-oswald text-4xl mb-8 uppercase">
                    {{ __('Concrétisons votre') }} <span class="text-[#FF00E5]">{{ __('Prochain Projet') }}</span>
                </h3>
                <p class="text-gray-400 mb-10 leading-relaxed">
                    {{ __("Qu'il s'agisse d'une compétition internationale ou d'un projet de marque, bénéficiez d'un regard expert et d'une logistique de haut niveau.") }}
                </p>
                <a href="{{ route('contact') }}"
                    class="inline-block px-12 py-5 bg-[#00D4FF] text-black font-oswald uppercase tracking-widest text-sm hover:bg-[#FF00E5] hover:text-white transition-all duration-300">
                    {{ __('Prendre contact avec Ori-Ola') }}
                </a>
            </div>
        </div>
    </div>
@endsection

@push('styles')
    <style>
        .grid-line {
            background-image:
                linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 50px 50px;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }

        .bg-size-200 {
            background-size: 200% 100%;
        }

        .animate-gradient {
            animation: gradient-shift 3s ease infinite;
        }

        @keyframes gradient-shift {
            0% {
                background-position: 0% 50%;
            }

            50% {
                background-position: 100% 50%;
            }

            100% {
                background-position: 0% 50%;
            }
        }

        /* Animation d'apparition en cascade */
        .gsap-reveal:nth-child(1) {
            animation-delay: 0.1s;
        }

        .gsap-reveal:nth-child(2) {
            animation-delay: 0.2s;
        }

        .gsap-reveal:nth-child(3) {
            animation-delay: 0.3s;
        }

        .gsap-reveal:nth-child(4) {
            animation-delay: 0.4s;
        }

        .gsap-reveal:nth-child(5) {
            animation-delay: 0.5s;
        }

        .gsap-reveal:nth-child(6) {
            animation-delay: 0.6s;
        }

        .gsap-reveal:nth-child(7) {
            animation-delay: 0.7s;
        }

        .gsap-reveal:nth-child(8) {
            animation-delay: 0.8s;
        }
    </style>
@endpush

@push('scripts')
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Attendre que GSAP soit chargé
            function waitForGSAP(callback) {
                if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                    callback();
                } else {
                    // Vérifier toutes les 100ms si GSAP est chargé
                    let attempts = 0;
                    const interval = setInterval(() => {
                        attempts++;
                        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                            clearInterval(interval);
                            callback();
                        } else if (attempts > 50) { // 5 secondes max
                            clearInterval(interval);
                            console.warn('GSAP non chargé après 5 secondes');
                            initFallbackAnimations();
                        }
                    }, 100);
                }
            }

            // Fonction d'initialisation principale
            function initAboutPage() {
                // Initialiser GSAP si disponible
                if (typeof gsap !== 'undefined') {
                    try {
                        if (typeof ScrollTrigger !== 'undefined') {
                            gsap.registerPlugin(ScrollTrigger);
                        }

                        // Animations de révélations
                        const revealElements = document.querySelectorAll('.gsap-reveal');
                        revealElements.forEach((el, index) => {
                            if (typeof ScrollTrigger !== 'undefined') {
                                gsap.fromTo(el, {
                                    y: 60,
                                    opacity: 0,
                                    scale: 0.95
                                }, {
                                    y: 0,
                                    opacity: 1,
                                    scale: 1,
                                    duration: 0.8,
                                    ease: "power3.out",
                                    delay: index * 0.1,
                                    scrollTrigger: {
                                        trigger: el,
                                        start: "top 85%",
                                        toggleActions: "play none none none",
                                        once: true
                                    }
                                });
                            } else {
                                // Fallback sans ScrollTrigger
                                gsap.to(el, {
                                    y: 0,
                                    opacity: 1,
                                    scale: 1,
                                    duration: 0.8,
                                    delay: index * 0.1 + 0.3,
                                    ease: "power3.out"
                                });
                            }
                        });

                        // Animation de la timeline
                        const timelineItems = document.querySelectorAll('.flex.gap-8.mb-12, .flex.gap-8');
                        timelineItems.forEach((item, index) => {
                            if (typeof ScrollTrigger !== 'undefined') {
                                gsap.fromTo(item, {
                                    x: -50,
                                    opacity: 0
                                }, {
                                    x: 0,
                                    opacity: 1,
                                    duration: 0.7,
                                    delay: index * 0.2,
                                    scrollTrigger: {
                                        trigger: item,
                                        start: "top 90%",
                                        toggleActions: "play none none none",
                                        once: true
                                    }
                                });
                            } else {
                                gsap.to(item, {
                                    x: 0,
                                    opacity: 1,
                                    duration: 0.7,
                                    delay: index * 0.2 + 0.5,
                                    ease: "power2.out"
                                });
                            }
                        });

                        // Animation des statistiques au scroll
                        const stats = document.querySelectorAll('.text-center.p-8');
                        stats.forEach(stat => {
                            const numberElement = stat.querySelector('.font-oswald');
                            if (numberElement) {
                                const originalText = numberElement.textContent;
                                const finalNumber = parseInt(originalText);
                                const suffix = originalText.replace(/[0-9+]/g, '');

                                // Animation d'entrée
                                if (typeof ScrollTrigger !== 'undefined') {
                                    gsap.fromTo(stat, {
                                        y: 30,
                                        opacity: 0
                                    }, {
                                        y: 0,
                                        opacity: 1,
                                        duration: 0.8,
                                        scrollTrigger: {
                                            trigger: stat,
                                            start: "top 90%",
                                            toggleActions: "play none none none",
                                            once: true
                                        },
                                        onStart: () => {
                                            // Animation des chiffres si pas déjà animé
                                            if (!numberElement.dataset.animated) {
                                                numberElement.dataset.animated = true;
                                                gsap.fromTo(numberElement, {
                                                    textContent: 0
                                                }, {
                                                    textContent: finalNumber,
                                                    duration: 2,
                                                    ease: "power2.out",
                                                    snap: {
                                                        textContent: 1
                                                    },
                                                    onUpdate: function() {
                                                        numberElement.textContent =
                                                            Math.floor(this
                                                                .targets()[0]
                                                                .textContent) +
                                                            suffix;
                                                    }
                                                });
                                            }
                                        }
                                    });
                                } else {
                                    // Fallback sans scroll trigger
                                    gsap.to(stat, {
                                        y: 0,
                                        opacity: 1,
                                        duration: 0.8,
                                        delay: 0.5
                                    });

                                    // Animer les chiffres après un délai
                                    setTimeout(() => {
                                        if (!numberElement.dataset.animated) {
                                            numberElement.dataset.animated = true;
                                            gsap.fromTo(numberElement, {
                                                textContent: 0
                                            }, {
                                                textContent: finalNumber,
                                                duration: 2,
                                                ease: "power2.out",
                                                snap: {
                                                    textContent: 1
                                                },
                                                onUpdate: function() {
                                                    numberElement.textContent = Math
                                                        .floor(this.targets()[0]
                                                            .textContent) + suffix;
                                                }
                                            });
                                        }
                                    }, 600);
                                }
                            }
                        });

                        // Effet de parallaxe léger sur l'hero
                        const heroSection = document.querySelector('.relative.overflow-hidden');
                        if (heroSection && typeof ScrollTrigger !== 'undefined') {
                            const gridLine = heroSection.querySelector('.grid-line');
                            if (gridLine) {
                                gsap.to(gridLine, {
                                    y: 100,
                                    ease: "none",
                                    scrollTrigger: {
                                        trigger: heroSection,
                                        start: "top top",
                                        end: "bottom top",
                                        scrub: true
                                    }
                                });
                            }
                        }

                    } catch (error) {
                        console.warn('Erreur GSAP:', error);
                        initFallbackAnimations();
                    }
                } else {
                    initFallbackAnimations();
                }
            }

            // Fonction fallback sans GSAP
            function initFallbackAnimations() {
                console.log('Utilisation des animations CSS fallback pour la page À Propos');

                // Révéler les éléments avec délais
                const reveals = document.querySelectorAll('.gsap-reveal');
                reveals.forEach((el, index) => {
                    el.style.opacity = '0';
                    el.style.transform = 'translateY(30px) scale(0.95)';
                    el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';

                    setTimeout(() => {
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0) scale(1)';
                    }, 300 + (index * 100));
                });

                // Animation des statistiques
                const stats = document.querySelectorAll('.text-center.p-8');
                stats.forEach((stat, index) => {
                    const numberElement = stat.querySelector('.font-oswald');
                    if (numberElement) {
                        const originalText = numberElement.textContent;
                        const finalNumber = parseInt(originalText);
                        const suffix = originalText.replace(/[0-9+]/g, '');

                        // Animer le nombre
                        let start = 0;
                        const duration = 2000; // 2 secondes
                        const stepTime = 50; // toutes les 50ms
                        const steps = duration / stepTime;
                        const increment = finalNumber / steps;

                        setTimeout(() => {
                            const timer = setInterval(() => {
                                start += increment;
                                if (start >= finalNumber) {
                                    clearInterval(timer);
                                    numberElement.textContent = finalNumber + suffix;
                                } else {
                                    numberElement.textContent = Math.floor(start) + suffix;
                                }
                            }, stepTime);
                        }, 500 + (index * 200));
                    }
                });

                // Observer pour les animations au scroll
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.style.opacity = '1';
                            entry.target.style.transform = 'translateY(0) scale(1)';
                            observer.unobserve(entry.target);
                        }
                    });
                }, {
                    threshold: 0.1,
                    rootMargin: '50px'
                });

                reveals.forEach(el => {
                    observer.observe(el);
                });
            }

            // Attendre GSAP puis initialiser
            waitForGSAP(initAboutPage);

            // Fallback après 3 secondes
            setTimeout(() => {
                if (typeof gsap === 'undefined') {
                    console.log('GSAP non chargé après timeout, utilisation du fallback');
                    initFallbackAnimations();
                }
            }, 3000);
        });
    </script>
@endpush
