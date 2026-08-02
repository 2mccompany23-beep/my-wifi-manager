<footer class="bg-black/90 border-t border-white/10 py-12 px-4 md:px-8 lg:px-12">
    <div class="container mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <!-- Colonne 1 : Logo / Identité -->
            <div class="col-span-1 md:col-span-2">
                <a href="{{ route('home') }}"
                class="font-oswald tracking-tighter   group z-50 relative inline-flex flex-col items-start">
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
                <p class="text-gray-400 text-sm leading-relaxed max-w-md">
                    {{ __("Photographe sportif, événementiel, studio, nature et documentaire. Capturez l'instant avec authenticité.") }}
                </p>
            </div>

            <!-- Colonne 2 : Navigation rapide -->
            <div>
                <h4 class="font-oswald text-white text-sm uppercase tracking-wider mb-4">{{ __("Navigation") }}</h4>
                <ul class="space-y-2 text-sm">
                    <li><a href="{{ route('home') }}" class="text-gray-400 hover:text-white transition-colors">{{ __("Accueil") }}</a></li>
                    <li><a href="{{ route('portfolio') }}" class="text-gray-400 hover:text-white transition-colors">{{ __("Portfolio") }}</a></li>
                    <li><a href="{{ route('about') }}" class="text-gray-400 hover:text-white transition-colors">{{ __("À propos") }}</a></li>
                    <li><a href="{{ route('contact') }}" class="text-gray-400 hover:text-white transition-colors">{{ __("Contact") }}</a></li>
                </ul>
            </div>

            <!-- Colonne 3 : Légal / Admin (DISCRET) -->
            <div>
                <h4 class="font-oswald text-white text-sm uppercase tracking-wider mb-4">{{ __("Informations") }}</h4>
                <ul class="space-y-2 text-sm">
                    <li><a href="{{ route('legal.mentions') }}" class="text-gray-400 hover:text-white transition-colors">{{ __("Mentions légales") }}</a></li>
                    <li><a href="{{ route('legal.privacy') }}" class="text-gray-400 hover:text-white transition-colors">{{ __("Confidentialité") }}</a></li>
                    <li><a href="{{ route('legal.terms') }}" class="text-gray-400 hover:text-white transition-colors">{{ __("CGU") }}</a></li>
                    <!-- 🔐 LIEN ADMIN DISCRET -->
                    <li class="pt-4 mt-2 border-t border-white/10">
                        <a href="{{ route('admin.login') }}" class="text-xs text-gray-500 hover:text-[#00D4FF] transition-colors uppercase tracking-wider">
                            ⚙️ {{ __("Administration") }}
                        </a>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Copyright -->
        <div class="mt-12 pt-8 border-t border-white/5 text-center text-gray-500 text-xs">
            <p>&copy; {{ date('Y') }} Ori Ola OBS Photography. {{ __("Tous droits réservés.") }}</p>
        </div>
    </div>
</footer>

<style>
    .neon-text {
        text-shadow: 0 0 5px rgba(0,212,255,0.3);
    }
</style>
