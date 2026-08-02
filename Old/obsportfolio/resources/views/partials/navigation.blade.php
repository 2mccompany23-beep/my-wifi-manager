<!-- Navigation -->
<nav class="fixed top-0 w-full z-50 py-3 px-4 md:px-8 lg:px-12 bg-black/90 backdrop-blur-md border-b border-white/5 transition-all duration-300" id="navbar">
    <div class="container mx-auto flex justify-between items-center">
        <!-- Logo -->
        <a href="{{ route('home') }}" class="font-oswald text-xl md:text-2xl lg:text-3xl tracking-tighter uppercase italic group z-50 relative">
            <span class="text-white group-hover:text-gray-200 transition-colors">{{ __("ORI OLA") }}</span>
            <span class="text-[#00D4FF] neon-text ml-1">{{ __("OBS") }}</span>
        </a>

        <!-- Desktop Nav -->
        <div class="hidden lg:flex items-center space-x-6 md:space-x-8 font-oswald text-xs md:text-sm uppercase tracking-widest">
            <a href="{{ route('home') }}" class="hover:text-[#00D4FF] transition-colors relative group py-2">
                {{ __("ACCUEIL") }}
                <span class="absolute bottom-0 left-0 w-0 h-[1px] bg-[#00D4FF] group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="{{ route('portfolio') }}" class="hover:text-[#00D4FF] transition-colors relative group py-2">
                {{ __("PORTFOLIO") }}
                <span class="absolute bottom-0 left-0 w-0 h-[1px] bg-[#00D4FF] group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="{{ route('about') }}" class="hover:text-[#FF00E5] transition-colors relative group py-2">
                {{ __("À PROPOS") }}
                <span class="absolute bottom-0 left-0 w-0 h-[1px] bg-[#FF00E5] group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="{{ route('contact') }}" class="hover:text-[#00D4FF] transition-colors relative group py-2">
                {{ __("CONTACT") }}
                <span class="absolute bottom-0 left-0 w-0 h-[1px] bg-[#00D4FF] group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="{{ route('contact') }}" class="px-4 md:px-6 py-2 border border-white/20 hover:bg-white hover:text-black transition-all duration-300 text-xs md:text-sm ml-2">
                {{ __("PROJET SUR MESURE") }}
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
    <div id="mobile-menu" class="lg:hidden fixed inset-0 bg-black hidden flex-col justify-center items-center transform transition-transform duration-300">
        <div class="flex flex-col space-y-8 text-center font-oswald text-2xl uppercase tracking-widest w-full px-4">
            <a href="{{ route('home') }}" class="mobile-link hover:text-[#00D4FF] transition-colors border-b border-white/10 pb-4">{{ __("ACCUEIL") }}</a>
            <a href="{{ route('portfolio') }}" class="mobile-link hover:text-[#00D4FF] transition-colors border-b border-white/10 pb-4">{{ __("PORTFOLIO") }}</a>
            <a href="{{ route('about') }}" class="mobile-link hover:text-[#FF00E5] transition-colors border-b border-white/10 pb-4">{{ __("À PROPOS") }}</a>
            <a href="{{ route('contact') }}" class="mobile-link hover:text-[#00D4FF] transition-colors border-b border-white/10 pb-4">{{ __("CONTACT") }}</a>
            <a href="{{ route('contact') }}" class="mobile-link px-8 py-4 mt-4 border border-white/20 hover:bg-white hover:text-black transition-all">{{ __("PROJET SUR MESURE") }}</a>
        </div>
    </div>
</nav>