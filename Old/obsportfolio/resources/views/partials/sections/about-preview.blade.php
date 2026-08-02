<section id="about" class="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-black relative overflow-hidden">
    <div
        class="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#00D4FF]/5 to-transparent pointer-events-none">
    </div>

    <div class="container mx-auto max-w-6xl">
        <div class="flex flex-col lg:flex-row gap-8 md:gap-16 items-center">
            <div class="w-full lg:w-1/2 relative gsap-reveal">
                <div class="aspect-[4/5] overflow-hidden border border-white/10 relative w-full">
                    @php
                        $about_intro = \App\Models\Media::section('about_intro')->first();
                    @endphp
                    @if($about_intro && $about_intro->image_path)
                        <img src="{{ Storage::url($about_intro->image_path) }}"
                             alt="{{ $about_intro->title ?? __('Ori Ola Photographe') }}"
                             class="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                             loading="lazy">
                    @else
                    <img src="https7://scontent.fcoo5-1.fna.fbcdn.net/v/t39.30808-6/619290022_1467066402088230_4642759953774690954_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=105&ccb=1-7&_nc_sid=833d8c&_nc_ohc=W4R820lhnJUQ7kNvwFeYVWO&_nc_oc=AdnklzLIm-HuekQ6_6G0yO4toXHN7vCKIJhEyCa5p46euh9fwJAn1yuEsPi0Sl2rFsY&_nc_zt=23&_nc_ht=scontent.fcoo5-1.fna&_nc_gid=SNjJvxMztzXixNtWF-jSYw&oh=00_Aft-RJAkfTSb1ON42y9V3-E1RQJavblMLkpfUjPUWtRYbA&oe=6991ECAB"
                        alt="{{ __('Ori Ola Photographe') }}"
                        class="w-full h-full object-cover hover:scale-105 transition-transform duration-700">
                    @endif
                    <div
                        class="absolute bottom-0 left-0 bg-black/90 backdrop-blur-sm p-4 md:p-6 border-t border-r border-white/10 w-full md:w-auto">
                        <div class="flex items-baseline leading-none font-oswald">
                            <span
                                class="text-white group-hover:text-gray-200 transition-colors text-xl md:text-2xl lg:text-3xl">
                                {{ __('Ori Ola') }}
                            </span>
                            <span class="text-white neon-text ml-1 text-xl md:text-2xl lg:text-3xl">
                                {{ __('Johson') }}
                            </span>
                        </div>
                        <span
                            class="text-[#00D4FF] neon-text text-[11px] md:text-xs lg:text-sm uppercase font-normal not-italic tracking-widest mt-[-2px] opacity-80"
                            style="letter-spacing: normal;">
                            {{ __('ORI OLA OBS Photography') }}
                        </span>
                    </div>
                </div>
            </div>

            <div class="w-full lg:w-1/2 gsap-reveal">
                <span
                    class="text-[#FF00E5] font-bold tracking-widest text-[10px] md:text-xs uppercase mb-4 block">{{ __('Parcours') }}</span>
                <h2 class="font-oswald text-3xl md:text-5xl mb-6 uppercase leading-tight">
                    {{ __("Documenter l'instant avec précision.") }}</h2>
                <p class="text-gray-400 mb-6 leading-relaxed text-sm md:text-base">
                    {{ __('Photographe accrédité par la CAF et la FIFA, fort d’une solide expérience sur des événements d’envergure, je produis des contenus visuels conformes aux exigences des compétitions internationales. Mon approche stratégique allie rigueur, réactivité terrain et maîtrise des protocoles médias.') }}
                </p>
                <p class="text-gray-400 mb-6 leading-relaxed text-sm md:text-base">
                    {{ __('Chaque image, portée par une maîtrise avancée de la lumière, de la composition et du timing, traduit avec précision l’intensité du jeu, la dimension humaine et l’identité culturelle, dans le respect des standards internationaux.') }}
                </p>
                <p class="text-white mb-8 border-l-2 border-[#00D4FF] pl-4 italic text-sm md:text-base">
                    "{{ __('Photographier, pour moi, c’est révéler ce que l’instant ne dit qu’une seule fois.') }}"
                </p>

                <div class="grid grid-cols-2 gap-3 md:gap-4">
                    <div class="border border-white/10 p-3 md:p-4 text-center">
                        <div class="font-oswald text-2xl md:text-3xl text-white mb-1">5</div>
                        <div class="text-[10px] uppercase tracking-widest text-gray-500">
                            {{ __("Domaines d'expertise") }}</div>
                    </div>
                    <div class="border border-white/10 p-3 md:p-4 text-center">
                        <div class="font-oswald text-2xl md:text-3xl text-[#FF00E5] mb-1">5+</div>
                        <div class="text-[10px] uppercase tracking-widest text-gray-500">
                            {{ __("Années d'expérience") }}
                        </div>
                    </div>
                    <div class="border border-white/10 p-3 md:p-4 text-center">
                        <div class="font-oswald text-2xl md:text-3xl text-[#00D4FF] mb-1">10k</div>
                        <div class="text-[10px] uppercase tracking-widest text-gray-500">{{ __('Images livrées') }}
                        </div>
                    </div>
                    <div class="border border-white/10 p-3 md:p-4 text-center">
                        <div class="font-oswald text-2xl md:text-3xl text-white mb-1">100%</div>
                        <div class="text-[10px] uppercase tracking-widest text-gray-500">{{ __('Engagement') }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
