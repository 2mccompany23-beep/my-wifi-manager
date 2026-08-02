@extends('layouts.admin')

@section('title', __('Modifier une section | Admin'))

@section('content')
<div class="container mx-auto px-4 py-8">
    <!-- En-tête -->
    <div class="mb-8">
        <h1 class="font-oswald text-4xl uppercase tracking-tighter">
            <span class="text-white">{{ __("MODIFIER") }}</span>
            <span class="text-[#00D4FF] neon-text">{{ __("LA SECTION") }}</span>
        </h1>
        <p class="text-gray-400 mt-2">{{ $section->title_fr ?? $section->section_key }}</p>
    </div>

    <!-- Formulaire -->
    <form action="{{ route('admin.about-sections.update', $section) }}" 
          method="POST" 
          enctype="multipart/form-data"
          class="max-w-3xl space-y-6">
        @csrf
        @method('PUT')

        <!-- Clé de section (lecture seule) -->
        <div class="bg-black/30 border border-white/10 rounded-lg p-6">
            <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Identification") }}</h2>
            <div>
                <label class="block text-gray-400 mb-2">{{ __("Clé de section") }}</label>
                <input type="text" 
                       value="{{ $section->section_key }}"
                       class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-gray-400 cursor-not-allowed"
                       readonly>
                <input type="hidden" name="section_key" value="{{ $section->section_key }}">
            </div>
        </div>

        <!-- Contenu bilingue -->
        <div class="bg-black/30 border border-white/10 rounded-lg p-6 space-y-4">
            <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Contenu") }}</h2>
            
            <!-- FRANÇAIS -->
            <div class="border-l-2 border-[#00D4FF] pl-4">
                <h3 class="text-sm text-[#00D4FF] mb-3">{{ __("FRANÇAIS") }}</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-gray-400 mb-2">{{ __("Titre") }}</label>
                        <input type="text" 
                               name="title_fr" 
                               value="{{ old('title_fr', $section->title_fr) }}"
                               class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-gray-400 mb-2">{{ __("Contenu") }}</label>
                        <textarea name="content_fr" 
                                  rows="6"
                                  class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none">{{ old('content_fr', $section->content_fr) }}</textarea>
                    </div>
                </div>
            </div>

            <!-- ENGLISH -->
            <div class="border-l-2 border-[#FF00E5] pl-4 mt-6">
                <h3 class="text-sm text-[#FF00E5] mb-3">{{ __("ENGLISH") }}</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-gray-400 mb-2">{{ __("Title") }}</label>
                        <input type="text" 
                               name="title_en" 
                               value="{{ old('title_en', $section->title_en) }}"
                               class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#FF00E5] focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-gray-400 mb-2">{{ __("Content") }}</label>
                        <textarea name="content_en" 
                                  rows="6"
                                  class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#FF00E5] focus:outline-none">{{ old('content_en', $section->content_en) }}</textarea>
                    </div>
                </div>
            </div>
        </div>

        <!-- Image et vidéo -->
        <div class="grid md:grid-cols-2 gap-6">
            <!-- Image -->
            <div class="bg-black/30 border border-white/10 rounded-lg p-6">
                <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Image") }}</h2>
                
                @if($section->image && \Illuminate\Support\Facades\Storage::disk('public')->exists($section->image))
                <div class="mb-4">
                    <p class="text-gray-400 mb-2">{{ __("Image actuelle:") }}</p>
                    <img src="{{ \Illuminate\Support\Facades\Storage::url($section->image) }}" 
                         alt=""
                         class="max-w-full h-32 object-cover rounded border-2 border-[#00D4FF]">
                </div>
                @endif
                
                <div>
                    <label class="block text-gray-400 mb-2">{{ __("Changer l'image") }}</label>
                    <input type="file" 
                           name="image" 
                           id="image"
                           accept="image/*"
                           class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white">
                </div>
                <div id="image-preview" class="hidden mt-4">
                    <p class="text-gray-400 mb-2">{{ __("Aperçu:") }}</p>
                    <img src="" alt="{{ __('Aperçu') }}" class="max-w-full h-32 object-cover rounded border-2 border-[#00D4FF]">
                </div>
            </div>

            <!-- URL Vidéo -->
            <div class="bg-black/30 border border-white/10 rounded-lg p-6">
                <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Vidéo") }}</h2>
                <div>
                    <label class="block text-gray-400 mb-2">{{ __("URL YouTube / Vimeo") }}</label>
                    <input type="url" 
                           name="video_url" 
                           value="{{ old('video_url', $section->video_url) }}"
                           class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none"
                           placeholder="https://www.youtube.com/watch?v=...">
                </div>
            </div>
        </div>

        <!-- Statistiques (si section stats) -->
        @if($section->section_key === 'stats' || old('stats'))
        <div class="bg-black/30 border border-white/10 rounded-lg p-6">
            <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Statistiques") }}</h2>
            
            <div id="stats-container">
                @php
                    $stats = old('stats', $section->stats ?? []);
                @endphp
                
                @if(is_array($stats) && count($stats) > 0)
                    @foreach($stats as $index => $stat)
                    <div class="stats-item grid grid-cols-2 gap-4 mb-4 p-4 bg-white/5 rounded">
                        <div>
                            <label class="block text-gray-400 text-xs mb-1">{{ __("Valeur") }}</label>
                            <input type="text" 
                                   name="stats[{{ $index }}][value]" 
                                   value="{{ $stat['value'] ?? '' }}"
                                   class="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white focus:border-[#00D4FF] focus:outline-none"
                                   placeholder="10+">
                        </div>
                        <div>
                            <label class="block text-gray-400 text-xs mb-1">{{ __("Label") }}</label>
                            <input type="text" 
                                   name="stats[{{ $index }}][label]" 
                                   value="{{ $stat['label'] ?? '' }}"
                                   class="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white focus:border-[#00D4FF] focus:outline-none"
                                   placeholder="Années d'expérience">
                        </div>
                    </div>
                    @endforeach
                @endif
            </div>
            
            <button type="button" 
                    id="add-stat"
                    class="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm transition">
                + {{ __("Ajouter une statistique") }}
            </button>
        </div>
        @endif

        <!-- Options -->
        <div class="bg-black/30 border border-white/10 rounded-lg p-6">
            <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Options") }}</h2>
            
            <div class="flex items-center">
                <input type="checkbox" 
                       name="is_active" 
                       id="is_active"
                       value="1"
                       {{ old('is_active', $section->is_active) ? 'checked' : '' }}
                       class="w-5 h-5 bg-black/50 border border-white/20 rounded">
                <label for="is_active" class="ml-3 text-gray-400">
                    {{ __("Actif") }}
                </label>
            </div>
        </div>

        <!-- Boutons -->
        <div class="flex justify-end gap-4 pt-4">
            <a href="{{ route('admin.about-sections.index') }}" 
               class="px-8 py-4 bg-white/10 hover:bg-white/20 rounded font-oswald uppercase tracking-wider text-sm transition-all duration-300">
                {{ __("Annuler") }}
            </a>
            <button type="submit" 
                    class="px-8 py-4 bg-gradient-to-r from-[#00D4FF] to-[#FF00E5] text-white font-oswald uppercase tracking-wider text-sm hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all duration-300">
                {{ __("Mettre à jour") }}
            </button>
        </div>
    </form>
</div>

@section('scripts')
@parent
<script>
    // Preview image
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = imagePreview?.querySelector('img');
    
    if (imageInput && previewImg) {
        imageInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    imagePreview.classList.remove('hidden');
                };
                reader.readAsDataURL(this.files[0]);
            } else {
                imagePreview.classList.add('hidden');
            }
        });
    }

    // Gestion des statistiques
    const addStatBtn = document.getElementById('add-stat');
    const statsContainer = document.getElementById('stats-container');
    
    if (addStatBtn && statsContainer) {
        let statCount = {{ is_array($section->stats ?? []) ? count($section->stats ?? []) : 0 }};
        
        addStatBtn.addEventListener('click', function() {
            const div = document.createElement('div');
            div.className = 'stats-item grid grid-cols-2 gap-4 mb-4 p-4 bg-white/5 rounded';
            div.innerHTML = `
                <div>
                    <label class="block text-gray-400 text-xs mb-1">{{ __("Valeur") }}</label>
                    <input type="text" 
                           name="stats[${statCount}][value]" 
                           class="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white focus:border-[#00D4FF] focus:outline-none"
                           placeholder="10+">
                </div>
                <div>
                    <label class="block text-gray-400 text-xs mb-1">{{ __("Label") }}</label>
                    <input type="text" 
                           name="stats[${statCount}][label]" 
                           class="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white focus:border-[#00D4FF] focus:outline-none"
                           placeholder="Années d'expérience">
                </div>
            `;
            statsContainer.appendChild(div);
            statCount++;
        });
    }
</script>
@endsection

<style>
    .neon-text {
        text-shadow: 0 0 10px rgba(0,212,255,0.5);
    }
</style>
@endsection
