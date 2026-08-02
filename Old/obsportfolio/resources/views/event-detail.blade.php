@extends('layouts.app')

@section('title', $event->title . ' | Ori Ola OBS Photography')

@section('content')
<div class="min-h-screen bg-black text-white pt-24">
    <div class="container mx-auto px-4">
        <!-- Header de l'événement -->
        <div class="mb-12">
            <a href="{{ route('portfolio') }}" class="text-[#00D4FF] hover:text-[#00D4FF]/70 mb-4 inline-flex items-center">
                ← Retour au portfolio
            </a>
            
            <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <span class="badge-base badge-{{ $event->category }} mb-3">{{ strtoupper($event->category) }}</span>
                    <h1 class="font-oswald text-4xl md:text-6xl uppercase">{{ $event->title }}</h1>
                    <p class="text-gray-400 mt-2">{{ $event->date->format('d/m/Y') }} • {{ $event->location }}</p>
                </div>
                
                <div class="text-right">
                    <p class="text-sm text-gray-400">Partager</p>
                    <div class="flex gap-2 mt-2">
                        <!-- Icônes de partage -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Description -->
        <div class="max-w-3xl mb-12">
            <p class="text-lg leading-relaxed">{{ $event->description }}</p>
        </div>

        <!-- Galerie photos -->
        <div class="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            @foreach($event->photos as $photo)
            <div class="break-inside-avoid">
                <img src="{{ $photo->url }}" 
                     alt="{{ $photo->caption }}"
                     class="w-full h-auto rounded-sm mb-4 cursor-zoom-in"
                     onclick="openLightbox('{{ $photo->url }}', '{{ $photo->caption }}')">
            </div>
            @endforeach
        </div>

        <!-- Navigation entre événements -->
        <div class="flex justify-between items-center mt-16 pt-8 border-t border-white/10">
            @if($previousEvent)
            <a href="{{ route('event.detail', $previousEvent->slug) }}" class="group flex items-center">
                <div class="text-left">
                    <p class="text-sm text-gray-400">Précédent</p>
                    <p class="font-oswald text-lg group-hover:text-[#00D4FF]">{{ $previousEvent->title }}</p>
                </div>
            </a>
            @endif

            @if($nextEvent)
            <a href="{{ route('event.detail', $nextEvent->slug) }}" class="group flex items-center ml-auto">
                <div class="text-right">
                    <p class="text-sm text-gray-400">Suivant</p>
                    <p class="font-oswald text-lg group-hover:text-[#00D4FF]">{{ $nextEvent->title }}</p>
                </div>
            </a>
            @endif
        </div>
    </div>
</div>

<!-- Lightbox -->
<div id="lightbox" class="hidden fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
    <button onclick="closeLightbox()" class="absolute top-4 right-4 text-white text-2xl">×</button>
    <div class="max-w-4xl max-h-[80vh] p-4">
        <img id="lightbox-img" src="" alt="" class="max-w-full max-h-full object-contain">
        <p id="lightbox-caption" class="text-center text-white mt-4"></p>
    </div>
</div>

<script>
function openLightbox(src, caption) {
    document.getElementById('lightbox-img').src = src;
    document.getElementById('lightbox-caption').textContent = caption;
    document.getElementById('lightbox').classList.remove('hidden');
}

function closeLightbox() {
    document.getElementById('lightbox').classList.add('hidden');
}
</script>
@endsection