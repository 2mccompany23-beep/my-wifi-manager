<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="scroll-smooth">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>@yield('title', __('Ori Ola OBS Photography'))</title>
    <meta name="description" content="@yield('description', __('Ori Ola OBS - Photographe polyvalent spécialisé en sport, événementiel, studio, nature et voyage.'))">

    <!-- Preconnect pour améliorer les performances de chargement -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdnjs.cloudflare.com">

    <!-- Tailwind CSS (CDN optimisé) -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Polices avec chargement asynchrone -->
    <link rel="preload" as="style"
        href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Inter:wght@300;400;600&display=swap">
    <link rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Inter:wght@300;400;600&display=swap"
        media="print" onload="this.media='all'">
    <noscript>
        <link rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Inter:wght@300;400;600&display=swap">
    </noscript>

    <style>
        /* === STYLES CRITIQUES (First Paint) === */
        :root {
            --black-deep: #050505;
            --neon-electric: #00D4FF;
            --vibrant-pink: #FF00E5;
            --pure-white: #FFFFFF;
        }

        /* Reset et base */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background-color: var(--black-deep);
            color: var(--pure-white);
            min-height: 100vh;
            overflow-x: hidden;
        }

        .font-oswald {
            font-family: 'Oswald', sans-serif;
            font-weight: 700;
        }

        /* Loader minimal */
        #loader {
            position: fixed;
            inset: 0;
            background: var(--black-deep);
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        /* Navigation de base - TRANSPARENTE au départ */
        #navbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 50;
            background-color: transparent; /* ← TRANSPARENT au début */
            backdrop-filter: blur(0px);    /* ← Pas de flou au début */
            transition: all 0.3s ease;
        }

        /* Classe ajoutée par JavaScript au scroll */
        #navbar.scrolled {
            background-color: rgba(5, 5, 5, 0.95);
            backdrop-filter: blur(8px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        /* Protection simplifiée */
        body {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }

        input,
        textarea {
            user-select: text !important;
        }

        /* Cache le contenu pendant le chargement */
        [data-loaded="false"] {
            opacity: 0;
            visibility: hidden;
        }

        [data-loaded="true"] {
            opacity: 1;
            visibility: visible;
            transition: opacity 0.3s ease;
        }

        #mobile-menu {
            position: fixed;
            inset: 0;
            background: rgba(5, 5, 5, 0.98);
            backdrop-filter: blur(10px);
            z-index: 40;
            display: none;
            flex-direction: column;
            justify-content: start;
            align-items: center;
        }

        .mobile-link {
            display: block;
            width: 90%;
            max-width: 300px;
            margin: 0 auto;
        }
    </style>
    <!-- Styles non-critiques (chargés après) -->
    <style>
        /* === STYLES NON-CRITIQUES === */
        .badge-base {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.75rem;
            border-radius: 99px;
            font-size: 0.65rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            backdrop-filter: blur(4px);
        }

        .badge-sport {
            background: rgba(0, 212, 255, 0.15);
            color: #00D4FF;
            border: 1px solid rgba(0, 212, 255, 0.3);
        }

        .badge-event {
            background: rgba(255, 0, 229, 0.15);
            color: #FF00E5;
            border: 1px solid rgba(255, 0, 229, 0.3);
        }

        .badge-nature {
            background: rgba(0, 255, 136, 0.15);
            color: #00FF88;
            border: 1px solid rgba(0, 255, 136, 0.3);
        }

        /* Animation du menu hamburger */
        .menu-toggle {
            width: 30px;
            height: 20px;
            position: relative;
            cursor: pointer;
            z-index: 60;
        }

        .menu-toggle span {
            display: block;
            position: absolute;
            height: 2px;
            width: 100%;
            background: white;
            left: 0;
            transition: .25s ease-in-out;
        }

        .menu-toggle span:nth-child(1) {
            top: 0px;
        }

        .menu-toggle span:nth-child(2) {
            top: 9px;
        }

        .menu-toggle span:nth-child(3) {
            top: 18px;
        }

        .menu-toggle.open span:nth-child(1) {
            transform: rotate(45deg);
            top: 9px;
        }

        .menu-toggle.open span:nth-child(2) {
            opacity: 0;
        }

        .menu-toggle.open span:nth-child(3) {
            transform: rotate(-45deg);
            top: 9px;
        }

        /* Grid lines (optionnel - peut être lourd) */
        .grid-line {
            background-image:
                linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 50px 50px;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            opacity: 0.3;
        }

        /* Effets de texte */
        .neon-text {
            text-shadow: 0 0 5px rgba(0, 212, 255, 0.3);
        }

        /* Portfolio grid responsive */
        .portfolio-grid {
            display: grid;
            gap: 1rem;
            grid-template-columns: 1fr;
        }

        @media (min-width: 640px) {
            .portfolio-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (min-width: 1024px) {
            .portfolio-grid {
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            }
        }
    </style>
    <!-- Protection légère non-bloquante -->
    <script>
        // Version légère de la protection
        document.addEventListener('DOMContentLoaded', function() {
            // Empêcher le clic droit sur les images seulement
            document.addEventListener('contextmenu', function(e) {
                if (e.target.tagName === 'IMG') {
                    e.preventDefault();
                }
            }, {
                passive: false
            });

            // Empêcher seulement Ctrl+U (code source)
            document.addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                    e.preventDefault();
                }
            }, {
                passive: false
            });
        });
    </script>

    @stack('styles')
</head>

<body data-loaded="false">
    <!-- Loader minimal -->
    <div id="loader">
        <div class="font-oswald text-xl text-[#00D4FF]">
            ORI OLA OBS
        </div>
    </div>

    <!-- Navigation -->
    <nav class="fixed top-0 w-full z-50 py-3 px-4 md:px-8 lg:px-12 transition-all duration-300"
        id="navbar">
        <div class="container mx-auto flex justify-between items-center">
            <!-- Logo -->
            <a href="{{ route('home') }}"
                class="font-oswald tracking-tighter group z-50 relative inline-flex flex-col items-start">
                <!-- Nom principal -->
                <div class="flex items-baseline leading-none">
                    <span
                        class="text-white group-hover:text-gray-200 transition-colors text-xl md:text-2xl lg:text-3xl">
                        {{ __('Ori Ola') }}
                    </span>
                    <span class="text-white neon-text ml-1 text-xl md:text-2xl lg:text-3xl">
                        {{ __('Johson') }}
                    </span>
                </div>

                <!-- Sous-titre de métier -->
                <span
                    class="text-[#00D4FF] neon-text text-[11px] md:text-xs lg:text-sm uppercase font-normal not-italic tracking-widest mt-[-2px] opacity-80"
                    style="letter-spacing: normal;">
                    {{ __('ORI OLA OBS Photography') }}
                </span>
            </a>

            <!-- Desktop Nav -->
            <div
                class="hidden lg:flex items-center space-x-6 md:space-x-8 font-oswald text-xs md:text-sm uppercase tracking-widest">
                <a href="{{ route('home') }}" class="hover:text-[#00D4FF] transition-colors relative group py-2">
                    {{ __('ACCUEIL') }}
                    <span
                        class="absolute bottom-0 left-0 w-0 h-[1px] bg-[#00D4FF] group-hover:w-full transition-all duration-300"></span>
                </a>
                <a href="{{ route('portfolio') }}" class="hover:text-[#00D4FF] transition-colors relative group py-2">
                    {{ __('PORTFOLIO') }}
                    <span
                        class="absolute bottom-0 left-0 w-0 h-[1px] bg-[#00D4FF] group-hover:w-full transition-all duration-300"></span>
                </a>
                <a href="{{ route('about') }}" class="hover:text-[#FF00E5] transition-colors relative group py-2">
                    {{ __('À PROPOS') }}
                    <span
                        class="absolute bottom-0 left-0 w-0 h-[1px] bg-[#FF00E5] group-hover:w-full transition-all duration-300"></span>
                </a>
                <a href="{{ route('contact') }}" class="hover:text-[#00D4FF] transition-colors relative group py-2">
                    {{ __('CONTACT') }}
                    <span
                        class="absolute bottom-0 left-0 w-0 h-[1px] bg-[#00D4FF] group-hover:w-full transition-all duration-300"></span>
                </a>
                <a href="{{ route('contact') }}"
                    class="px-4 md:px-6 py-2 border border-white/20 hover:bg-white hover:text-black transition-all duration-300 text-xs md:text-sm ml-2">
                    {{ __('PROJET SUR MESURE') }}
                </a>
            </div>

            <!-- Mobile Toggle -->
            <div class="lg:hidden">
                <div class="menu-toggle" id="mobile-menu-toggle" aria-label="{{ __('Menu') }}">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>

        <!-- Mobile Menu Overlay -->
        <div id="mobile-menu"
            class="lg:hidden fixed inset-0 bg-black hidden flex-col justify-center items-center transform transition-transform duration-300">
            <div
                class="flex flex-col space-y-8 bg-black text-center font-oswald text-2xl uppercase tracking-widest w-full p-8">
                <a href="{{ route('home') }}"
                    class="mobile-link hover:text-[#00D4FF] transition-colors border-b border-white/10 pb-4">{{ __('ACCUEIL') }}</a>
                <a href="{{ route('portfolio') }}"
                    class="mobile-link hover:text-[#00D4FF] transition-colors border-b border-white/10 pb-4">{{ __('PORTFOLIO') }}</a>
                <a href="{{ route('about') }}"
                    class="mobile-link hover:text-[#FF00E5] transition-colors border-b border-white/10 pb-4">{{ __('À PROPOS') }}</a>
                <a href="{{ route('contact') }}"
                    class="mobile-link hover:text-[#00D4FF] transition-colors border-b border-white/10 pb-4">{{ __('CONTACT') }}</a>
                <a href="{{ route('contact') }}"
                    class="mobile-link px-8 py-4 mt-4 border border-white/20 hover:bg-white hover:text-black transition-all">{{ __('PROJET SUR MESURE') }}</a>
            </div>
        </div>
    </nav>

    <main id="main-content">
        @yield('content')
    </main>

    @include('partials.footer')

    <!-- Scripts non-critiques chargés après le contenu -->
    <script>
        // === GESTION DU CHARGEMENT ===
        window.addEventListener('load', function() {
            // Cacher le loader
            const loader = document.getElementById('loader');
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => {
                    loader.style.display = 'none';
                    document.body.setAttribute('data-loaded', 'true');
                }, 300);
            } else {
                document.body.setAttribute('data-loaded', 'true');
            }

            // Initialiser les composants de base
            initNavigation();
        });

        // === NAVIGATION SIMPLIFIÉE ===
        function initNavigation() {
            const menuToggle = document.getElementById('mobile-menu-toggle');
            const mobileMenu = document.getElementById('mobile-menu');
            const navbar = document.getElementById('navbar');

            // Gestion du Menu Mobile
            if (menuToggle && mobileMenu) {
                const toggleMenu = (open) => {
                    if (open) {
                        mobileMenu.style.display = 'flex';
                        document.body.style.overflow = 'hidden';
                        menuToggle.classList.add('open');
                        menuToggle.setAttribute('aria-expanded', 'true');
                    } else {
                        mobileMenu.style.display = 'none';
                        document.body.style.overflow = 'auto';
                        menuToggle.classList.remove('open');
                        menuToggle.setAttribute('aria-expanded', 'false');
                    }
                };

                menuToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isVisible = mobileMenu.style.display === 'flex';
                    toggleMenu(!isVisible);
                });

                // Fermer au clic sur les liens
                document.querySelectorAll('.mobile-link').forEach(link => {
                    link.addEventListener('click', () => toggleMenu(false));
                });

                // Fermer au clic en dehors
                document.addEventListener('click', (e) => {
                    if (mobileMenu.style.display === 'flex' &&
                        !mobileMenu.contains(e.target) &&
                        !menuToggle.contains(e.target)) {
                        toggleMenu(false);
                    }
                });
            }

            // Gestion du Scroll Navbar - TRANSPARENT → NOIR
            if (navbar) {
                window.addEventListener('scroll', () => {
                    if (window.scrollY > 50) { // Seuil à 50px
                        navbar.classList.add('scrolled');
                    } else {
                        navbar.classList.remove('scrolled');
                    }
                }, {
                    passive: true
                });
                
                // Vérifier la position au chargement
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                }
            }
        }

        // === CHARGEMENT INTELLIGENT DE GSAP ===
        let gsapLoadingStarted = false;

        function loadGSAP() {
            if (gsapLoadingStarted) return;
            if (!document.querySelector('.gsap-reveal') && !document.querySelector('.animate-on-scroll')) return;

            gsapLoadingStarted = true;

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
            script.onload = function() {
                const scrollTrigger = document.createElement('script');
                scrollTrigger.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js';
                scrollTrigger.onload = initAnimations;
                document.body.appendChild(scrollTrigger);
            };
            document.body.appendChild(script);
        }

        function initAnimations() {
            if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                gsap.registerPlugin(ScrollTrigger);

                const reveals = document.querySelectorAll('.gsap-reveal');
                reveals.forEach(el => {
                    gsap.fromTo(el, {
                        y: 30,
                        opacity: 0
                    }, {
                        y: 0,
                        opacity: 1,
                        duration: 0.6,
                        scrollTrigger: {
                            trigger: el,
                            start: "top 85%",
                            toggleActions: "play none none none"
                        }
                    });
                });
            }
        }

        setTimeout(loadGSAP, 1000);
        window.addEventListener('scroll', loadGSAP, {
            once: true,
            passive: true
        });
    </script>

    @stack('scripts')
<!-- WhatsApp Floating Button -->

<a href="https://wa.me/22995919295" target="_blank" rel="noopener noreferrer"

   class="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center w-14 h-14">

    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-7 h-7 fill-current">

        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.2-99.6 224.2-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54.5-29.1-75.5-66-5.7-9.9 5.7-9.2 16.4-30.6 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 81.8 13.2 5.2 23.5 8.3 31.5 10.6 13.2 3.7 25.2 3.2 34.7 2 10.6-1.4 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.3-5.1-3.7-10.6-6.5z"/>

    </svg>

</a>

</body>

</html>
