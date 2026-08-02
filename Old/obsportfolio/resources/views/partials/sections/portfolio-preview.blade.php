<!-- Portfolio Preview -->
<section id="work" class="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-[#080808]">
    <div class="container mx-auto">
        <div class="flex flex-col md:flex-row justify-between items-end mb-12 md:mb-16 gsap-reveal">
            <div class="text-center md:text-left w-full md:w-auto">
                <h2 class="font-oswald text-3xl md:text-5xl uppercase text-white mb-2">{{ __("PORTFOLIO") }}</h2>
                <span class="text-[#00D4FF] tracking-widest text-xs md:text-sm">{{ __("SÉLECTION 2024-2025") }}</span>
            </div>
            <a href="{{ route('portfolio') }}" class="hidden md:block font-oswald text-sm hover:text-[#FF00E5] transition-colors mt-4 md:mt-0 underline decoration-1 underline-offset-4">
                {{ __("VOIR TOUTE LA GALERIE") }}
            </a>
        </div>

        <div class="portfolio-grid">
            @php
                $sportImage = \App\Models\Media::section('domain_sport')->first();
                $eventImage = \App\Models\Media::section('domain_event')->first();
                $studioImage = \App\Models\Media::section('domain_studio')->first();
                $natureImage = \App\Models\Media::section('domain_nature')->first();
                $travelImage = \App\Models\Media::section('domain_travel')->first();
            @endphp

            <!-- Item 1: Sport (grand format) -->
            <div class="grid-item md:col-span-2 lg:col-span-2 group gsap-reveal-img">
                <div class="relative w-full h-full overflow-hidden">
                    @if($sportImage && $sportImage->image_path)
                        <img src="{{ Storage::url($sportImage->image_path) }}"
                             alt="{{ $sportImage->title ?? __('Sport action') }}"
                             class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700">
                    @else
                        <img src="https://via.placeholder.com/1200x800/050505/00D4FF?text=Sport"
                             alt="{{ __('Sport action') }}"
                             class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700">
                    @endif
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                    <div class="absolute bottom-0 left-0 p-4 md:p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <span class="badge-base badge-sport mb-2">{{ __("SPORT") }}</span>
                        <h3 class="font-oswald text-xl md:text-4xl text-white">{{ $sportImage->title ?? __("BREAK POINT") }}</h3>
                        @if($sportImage && $sportImage->description)
                            <p class="text-xs text-gray-300 mt-2 hidden md:block">{{ $sportImage->description }}</p>
                        @endif
                    </div>
                </div>
            </div>

            <!-- Item 2: Event -->
            <div class="grid-item group gsap-reveal-img">
                <div class="relative w-full h-full overflow-hidden">
                    @if($eventImage && $eventImage->image_path)
                        <img src="{{ Storage::url($eventImage->image_path) }}"
                             alt="{{ $eventImage->title ?? __('Événement') }}"
                             class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700">
                    @else
                        <img src="https://via.placeholder.com/800x600/050505/FF00E5?text=Event"
                             alt="{{ __('Événement') }}"
                             class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700">
                    @endif
                    <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                    <div class="absolute bottom-0 left-0 p-4 md:p-6 w-full">
                        <span class="badge-base badge-event mb-1">{{ __("ÉVÉNEMENT") }}</span>
                        <h3 class="font-oswald text-lg md:text-xl text-white">{{ $eventImage->title ?? __("SACRÉ UNION") }}</h3>
                        @if($eventImage && $eventImage->description)
                            <p class="text-xs text-gray-300 mt-1 line-clamp-1">{{ $eventImage->description }}</p>
                        @endif
                    </div>
                </div>
            </div>

            <!-- Item 3: Studio -->
            <div class="grid-item group gsap-reveal-img">
                <div class="relative w-full h-full overflow-hidden">
                    @if($studioImage && $studioImage->image_path)
                        <img src="{{ Storage::url($studioImage->image_path) }}"
                             alt="{{ $studioImage->title ?? __('Studio') }}"
                             class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700">
                    @else
                        <img src="https://via.placeholder.com/800x600/050505/FFFFFF?text=Studio"
                             alt="{{ __('Studio') }}"
                             class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700">
                    @endif
                    <div class="absolute bottom-0 left-0 p-4 md:p-6">
                        <span class="badge-base badge-studio mb-1">{{ __("STUDIO") }}</span>
                        <h3 class="font-oswald text-lg md:text-xl text-white">{{ $studioImage->title ?? __("ATTITUDE") }}</h3>
                    </div>
                </div>
            </div>

            <!-- Item 4: Nature -->
            <div class="grid-item group gsap-reveal-img">
                <div class="relative w-full h-full overflow-hidden">
                    @if($natureImage && $natureImage->image_path)
                        <img src="{{ Storage::url($natureImage->image_path) }}"
                             alt="{{ $natureImage->title ?? __('Nature') }}"
                             class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700">
                    @else
                        <img src="https://via.placeholder.com/800x600/050505/00FF88?text=Nature"
                             alt="{{ __('Nature') }}"
                             class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700">
                    @endif
                    <div class="absolute bottom-0 left-0 p-4 md:p-6">
                        <span class="badge-base badge-nature mb-1">{{ __("NATURE") }}</span>
                        <h3 class="font-oswald text-lg md:text-xl text-white">{{ $natureImage->title ?? __("HORIZONS") }}</h3>
                    </div>
                </div>
            </div>

            <!-- Item 5: Travel (grand format vertical) -->
            <div class="grid-item md:row-span-2 group gsap-reveal-img">
                <div class="relative w-full h-full overflow-hidden">
                    @if($travelImage && $travelImage->image_path)
                        <img src="{{ Storage::url($travelImage->image_path) }}"
                             alt="{{ $travelImage->title ?? __('Voyage') }}"
                             class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700">
                    @else
                        <img src="https://via.placeholder.com/800x1200/050505/FFA500?text=Voyage"
                             alt="{{ __('Voyage') }}"
                             class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700">
                    @endif
                    <div class="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                    <div class="absolute bottom-0 left-0 p-4 md:p-6">
                        <span class="badge-base badge-travel mb-2">{{ __("VOYAGE") }}</span>
                        <h3 class="font-oswald text-lg md:text-2xl text-white">{{ $travelImage->title ?? __("TERRES LOINTAINES") }}</h3>
                        @if($travelImage && $travelImage->description)
                            <p class="text-xs text-gray-300 mt-2 line-clamp-2 hidden md:block">{{ $travelImage->description }}</p>
                        @else
                            <p class="text-xs text-gray-300 mt-2 line-clamp-2 hidden md:block">{{ __("À la rencontre des peuples gardiens de traditions ancestrales.") }}</p>
                        @endif
                    </div>
                </div>
            </div>

            <!-- Item 6: Sport 2 (deuxième image sport si disponible) -->
            <div class="grid-item group gsap-reveal-img">
                <div class="relative w-full h-full overflow-hidden">
                    @php
                        $sportImage2 = \App\Models\Media::section('domain_sport')->skip(1)->first();
                    @endphp
                    @if($sportImage2 && $sportImage2->image_path)
                        <img src="{{ Storage::url($sportImage2->image_path) }}"
                             alt="{{ $sportImage2->title ?? __('Sport') }}"
                             class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700">
                    @elseif($sportImage && $sportImage->image_path)
                        <img src="{{ Storage::url($sportImage->image_path) }}"
                             alt="{{ $sportImage->title ?? __('Sport') }}"
                             class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700">
                    @else
                        <img src="https://via.placeholder.com/800x600/050505/00D4FF?text=Sport+2"
                             alt="{{ __('Sport') }}"
                             class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700">
                    @endif
                    <div class="absolute bottom-0 left-0 p-4 md:p-6">
                        <span class="badge-base badge-sport mb-1">{{ __("SPORT") }}</span>
                        <h3 class="font-oswald text-lg md:text-xl text-white">{{ $sportImage2->title ?? ($sportImage->title ?? __("ENDURANCE")) }}</h3>
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-8 text-center md:hidden">
            <a href="{{ route('portfolio') }}" class="inline-block px-6 py-3 border border-white/20 text-white font-oswald text-sm hover:bg-white hover:text-black transition-all">
                {{ __("VOIR TOUTE LA GALERIE") }}
            </a>
        </div>
    </div>
</section>

<style>
    /* Styles pour la grille portfolio */
    .portfolio-grid {
        display: grid;
        grid-template-columns: repeat(1, 1fr);
        gap: 1rem;
    }

    @media (min-width: 768px) {
        .portfolio-grid {
            grid-template-columns: repeat(4, 1fr);
            grid-auto-rows: 300px;
        }
        
        .grid-item {
            height: 100%;
        }
        
        .grid-item.md\:col-span-2 {
            grid-column: span 2;
        }
        
        .grid-item.md\:row-span-2 {
            grid-row: span 2;
        }
    }

    @media (min-width: 1024px) {
        .portfolio-grid {
            grid-template-columns: repeat(4, 1fr);
            grid-auto-rows: 350px;
        }
        
        .grid-item.lg\:col-span-2 {
            grid-column: span 2;
        }
    }

    .badge-base {
        display: inline-block;
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
    .badge-studio {
        background: rgba(255, 255, 255, 0.15);
        color: #FFFFFF;
        border: 1px solid rgba(255, 255, 255, 0.3);
    }
    .badge-nature {
        background: rgba(0, 255, 136, 0.15);
        color: #00FF88;
        border: 1px solid rgba(0, 255, 136, 0.3);
    }
    .badge-travel {
        background: rgba(255, 165, 0, 0.15);
        color: #FFA500;
        border: 1px solid rgba(255, 165, 0, 0.3);
    }
</style>
