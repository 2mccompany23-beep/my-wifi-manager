@extends('layouts.admin')

@section('title', __('Modifier une image | Admin'))

@section('content')
<div class="container mx-auto px-4 py-8">
    <div class="mb-8">
        <h1 class="font-oswald text-4xl uppercase tracking-tighter">
            <span class="text-white">{{ __("MODIFIER") }}</span>
            <span class="text-[#00D4FF] neon-text">{{ __("L'IMAGE") }}</span>
        </h1>
        <p class="text-gray-400 mt-2">{{ $media->title_fr ?? 'Sans titre' }}</p>
    </div>

    <form action="{{ route('admin.media.update', $media) }}" method="POST" enctype="multipart/form-data" class="max-w-3xl space-y-6">
        @csrf
        @method('PUT')

        <!-- Image actuelle -->
        <div class="bg-black/30 border border-white/10 rounded-lg p-6">
            <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Image") }}</h2>
            
            @if($media->image_path)
                <div class="mb-4">
                    <p class="text-gray-400 mb-2">{{ __("Image actuelle:") }}</p>
                    <img src="{{ Storage::url($media->image_path) }}" 
                         alt="{{ $media->title_fr }}"
                         class="max-w-full h-48 object-cover rounded border-2 border-[#00D4FF]">
                </div>
            @endif
            
            <div>
                <label class="block text-gray-400 mb-2">{{ __("Changer l'image (optionnel)") }}</label>
                <input type="file" 
                       name="image" 
                       id="image"
                       accept="image/*" 
                       class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white">
                <p class="text-gray-500 text-sm mt-2">{{ __("Laissez vide pour conserver l'image actuelle") }}</p>
            </div>
            
            <div id="image-preview" class="hidden mt-4">
                <p class="text-gray-400 mb-2">{{ __("Nouvel aperçu:") }}</p>
                <img src="" alt="Aperçu" class="max-w-full h-48 object-cover rounded border-2 border-[#00D4FF]">
            </div>
        </div>

        <!-- Section (lecture seule) -->
        <div class="bg-black/30 border border-white/10 rounded-lg p-6">
            <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Section") }}</h2>
            <div>
                <input type="text" 
                       value="{{ $media->section }}"
                       class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-gray-400 cursor-not-allowed"
                       readonly>
                <p class="text-gray-500 text-sm mt-1">{{ __("La section ne peut pas être modifiée") }}</p>
            </div>
        </div>

        <!-- Titres bilingues -->
        <div class="bg-black/30 border border-white/10 rounded-lg p-6">
            <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Titres") }}</h2>
            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-gray-400 mb-2">{{ __("Titre (FR)") }}</label>
                    <input type="text" 
                           name="title_fr" 
                           value="{{ old('title_fr', $media->title_fr) }}" 
                           class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none">
                </div>
                <div>
                    <label class="block text-gray-400 mb-2">{{ __("Title (EN)") }}</label>
                    <input type="text" 
                           name="title_en" 
                           value="{{ old('title_en', $media->title_en) }}" 
                           class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#FF00E5] focus:outline-none">
                </div>
            </div>
        </div>

        <!-- Descriptions bilingues -->
        <div class="bg-black/30 border border-white/10 rounded-lg p-6">
            <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Descriptions") }}</h2>
            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-gray-400 mb-2">{{ __("Description (FR)") }}</label>
                    <textarea name="description_fr" 
                              rows="3" 
                              class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none">{{ old('description_fr', $media->description_fr) }}</textarea>
                </div>
                <div>
                    <label class="block text-gray-400 mb-2">{{ __("Description (EN)") }}</label>
                    <textarea name="description_en" 
                              rows="3" 
                              class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#FF00E5] focus:outline-none">{{ old('description_en', $media->description_en) }}</textarea>
                </div>
            </div>
        </div>

        <!-- Options -->
        <div class="bg-black/30 border border-white/10 rounded-lg p-6">
            <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Options") }}</h2>
            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-gray-400 mb-2">{{ __("Ordre") }}</label>
                    <input type="number" 
                           name="order" 
                           value="{{ old('order', $media->order) }}" 
                           class="w-32 bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none">
                </div>
                <div class="flex items-center">
                    <input type="checkbox" 
                           name="is_active" 
                           id="is_active" 
                           value="1" 
                           {{ old('is_active', $media->is_active) ? 'checked' : '' }} 
                           class="w-5 h-5 bg-black/50 border border-white/20 rounded">
                    <label for="is_active" class="ml-3 text-gray-400">{{ __("Actif") }}</label>
                </div>
            </div>
        </div>

        <!-- Boutons -->
        <div class="flex justify-end gap-4">
            <a href="{{ route('admin.media.index', ['section' => $media->section]) }}" 
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
</script>
@endsection

<style>
    .neon-text {
        text-shadow: 0 0 10px rgba(0,212,255,0.5);
    }
</style>
@endsection
