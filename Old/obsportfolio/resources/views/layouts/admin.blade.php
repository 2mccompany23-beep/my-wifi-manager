<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="scroll-smooth">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>@yield('title', __('Administration | Ori Ola OBS Photography'))</title>
    <meta name="description" content="@yield('description', __('Espace d\'administration du portfolio'))">

    <!-- Preconnect & Polices -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">

    <!-- Tailwind CSS (CDN) -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Styles personnalisés -->
    <style>
        :root {
            --black-deep: #050505;
            --neon-electric: #00D4FF;
            --vibrant-pink: #FF00E5;
            --pure-white: #FFFFFF;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--black-deep);
            color: var(--pure-white);
            min-height: 100vh;
        }

        .font-oswald {
            font-family: 'Oswald', sans-serif;
            font-weight: 700;
        }

        .neon-text {
            text-shadow: 0 0 5px rgba(0, 212, 255, 0.3);
        }

        /* Badges (réutilisés) */
        .badge-base {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
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
        .badge-studio {
            background: rgba(255, 255, 255, 0.15);
            color: #FFFFFF;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .badge-travel {
            background: rgba(255, 165, 0, 0.15);
            color: #FFA500;
            border: 1px solid rgba(255, 165, 0, 0.3);
        }
        
        /* Menu toggle styles */
        .menu-toggle span {
            transition: all 0.3s ease;
        }
        .menu-toggle.open span:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }
        .menu-toggle.open span:nth-child(2) {
            opacity: 0;
        }
        .menu-toggle.open span:nth-child(3) {
            transform: rotate(-45deg) translate(5px, -5px);
        }

        /* Style pour le contenu principal */
        main {
            min-height: calc(100vh - 80px);
        }
    </style>

    @stack('styles')
</head>

<body class="antialiased">

    <!-- Navigation Admin (fixe, simple) -->
    <nav class="fixed top-0 left-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-white/10 py-3 px-4 md:px-8">
        <div class="container mx-auto flex justify-between items-center">
            <!-- Logo / Brand -->
            <a href="{{ route('admin.dashboard') }}" class="font-oswald text-xl md:text-2xl tracking-tighter uppercase italic">
                <span class="text-white">{{ __('ORI-OLA') }}</span>
                <span class="text-[#00D4FF] neon-text ml-1">{{ __('ADMIN') }}</span>
            </a>

            <!-- Menu Desktop -->
            <div class="hidden md:flex items-center space-x-6 font-oswald text-xs uppercase tracking-widest">
                <a href="{{ route('admin.dashboard') }}" class="hover:text-[#00D4FF] transition-colors relative group py-1">
                    {{ __('DASHBOARD') }}
                    <span class="absolute bottom-0 left-0 w-0 h-[1px] bg-[#00D4FF] group-hover:w-full transition-all duration-300"></span>
                </a>
                
                <a href="{{ route('admin.events.index') }}" class="hover:text-[#00D4FF] transition-colors relative group py-1">
                    {{ __('ÉVÉNEMENTS') }}
                    <span class="absolute bottom-0 left-0 w-0 h-[1px] bg-[#00D4FF] group-hover:w-full transition-all duration-300"></span>
                </a>
                
                <a href="{{ route('admin.hero-slides.index') }}" class="hover:text-[#00D4FF] transition-colors relative group py-1">
            <a href="{{ route('admin.media.index') }}?section=hero" class="hover:text-[#00D4FF] transition-colors">{{ __("MÉDIAS") }}</a>
                
                <a href="{{ route('admin.statistics.index') }}" class="hover:text-[#00D4FF] transition-colors relative group py-1">
                    {{ __("STATISTIQUES") }}
                    <span class="absolute bottom-0 left-0 w-0 h-[1px] bg-[#00D4FF] group-hover:w-full transition-all duration-300"></span>
                </a>
                   
                <a href="{{ route('portfolio') }}" target="_blank" class="hover:text-[#FF00E5] transition-colors relative group py-1">
                    {{ __('VOIR LE SITE') }}
                    <span class="absolute bottom-0 left-0 w-0 h-[1px] bg-[#FF00E5] group-hover:w-full transition-all duration-300"></span>
                </a>
                
                <form method="POST" action="{{ route('admin.logout') }}" class="inline">
                    @csrf
                    <button type="submit" class="hover:text-red-400 transition-colors relative group py-1">
                        {{ __('DÉCONNEXION') }}
                        <span class="absolute bottom-0 left-0 w-0 h-[1px] bg-red-400 group-hover:w-full transition-all duration-300"></span>
                    </button>
                </form>
            </div>

            <!-- Mobile: Menu hamburger -->
            <div class="md:hidden">
                <div id="admin-mobile-menu-toggle" class="menu-toggle w-6 h-5 relative cursor-pointer">
                    <span class="absolute h-0.5 w-full bg-white top-0 left-0 transition-all"></span>
                    <span class="absolute h-0.5 w-full bg-white top-2 left-0 transition-all"></span>
                    <span class="absolute h-0.5 w-full bg-white top-4 left-0 transition-all"></span>
                </div>
            </div>
        </div>

        <!-- Mobile Menu (simple dropdown) -->
        <div id="admin-mobile-menu" class="md:hidden hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-md border-t border-white/10 py-4 px-6 flex flex-col space-y-4 text-sm font-oswald uppercase tracking-widest">
            <a href="{{ route('admin.dashboard') }}" class="hover:text-[#00D4FF] transition-colors">{{ __('DASHBOARD') }}</a>
            <a href="{{ route('admin.events.index') }}" class="hover:text-[#00D4FF] transition-colors">{{ __('ÉVÉNEMENTS') }}</a>
            <a href="{{ route('admin.hero-slides.index') }}" class="hover:text-[#00D4FF] transition-colors">{{ __('SLIDER HERO') }}</a>
            <a href="{{ route('admin.media.index') }}?section=hero" class="hover:text-[#00D4FF] transition-colors">{{ __("MÉDIAS") }}</a>
                
                <a href="{{ route('admin.media.index') }}?section=hero" class="hover:text-[#00D4FF] transition-colors relative group py-1">
                    {{ __("MÉDIAS") }}
                    <span class="absolute bottom-0 left-0 w-0 h-[1px] bg-[#00D4FF] group-hover:w-full transition-all duration-300"></span>
                </a>
            <a href="{{ route('admin.service-domains.index') }}" class="hover:text-[#00D4FF] transition-colors">{{ __('DOMAINES') }}</a>
            <a href="{{ route('admin.about-sections.index') }}" class="hover:text-[#00D4FF] transition-colors">{{ __('À PROPOS') }}</a>
                
                <a href="{{ route('admin.statistics.index') }}" class="hover:text-[#00D4FF] transition-colors relative group py-1">
                    {{ __("STATISTIQUES") }}
                    <span class="absolute bottom-0 left-0 w-0 h-[1px] bg-[#00D4FF] group-hover:w-full transition-all duration-300"></span>
                </a>
            <a href="{{ route('portfolio') }}" target="_blank" class="hover:text-[#FF00E5] transition-colors">{{ __('VOIR LE SITE') }}</a>
            <form method="POST" action="{{ route('admin.logout') }}">
                @csrf
                <button type="submit" class="hover:text-red-400 transition-colors">{{ __('DÉCONNEXION') }}</button>
            </form>
        </div>
    </nav>

    <!-- Contenu principal (padding-top pour compenser la navbar fixe) -->
    <main class="pt-20 pb-12">
        @yield('content')
    </main>

    <!-- Scripts -->
    <script>
        // Gestion du menu mobile admin
        document.addEventListener('DOMContentLoaded', function() {
            const toggle = document.getElementById('admin-mobile-menu-toggle');
            const menu = document.getElementById('admin-mobile-menu');
            
            if (toggle && menu) {
                toggle.addEventListener('click', function(e) {
                    e.stopPropagation();
                    menu.classList.toggle('hidden');
                    toggle.classList.toggle('open');
                });

                // Fermer au clic sur un lien
                menu.querySelectorAll('a, button').forEach(el => {
                    el.addEventListener('click', () => {
                        menu.classList.add('hidden');
                        toggle.classList.remove('open');
                    });
                });

                // Fermer au clic en dehors du menu
                document.addEventListener('click', function(e) {
                    if (!menu.classList.contains('hidden') && 
                        !menu.contains(e.target) && 
                        !toggle.contains(e.target)) {
                        menu.classList.add('hidden');
                        toggle.classList.remove('open');
                    }
                });
            }
        });
    </script>

    @stack('scripts')
</body>
</html>
