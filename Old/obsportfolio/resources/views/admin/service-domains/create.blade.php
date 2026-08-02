@extends('layouts.admin')

@section('title', __('Nouveau domaine | Admin'))

@section('content')
<div class="container mx-auto px-4 py-8">
    <!-- En-tête -->
    <div class="mb-8">
        <h1 class="font-oswald text-4xl uppercase tracking-tighter">
            <span class="text-white">{{ __("NOUVEAU") }}</span>
            <span class="text-[#00D4FF] neon-text">{{ __("DOMAINE") }}</span>
        </h1>
        <p class="text-gray-400 mt-2">{{ __("Ajoutez un nouveau domaine d'intervention") }}</p>
    </div>

    <!-- Formulaire -->
    <form action="{{ route('admin.service-domains.store') }}" 
          method="POST" 
          enctype="multipart/form-data"
          class="max-w-3xl space-y-6">
        @csrf

        <!-- Informations bilingues -->
        <div class="bg-black/30 border border-white/10 rounded-lg p-6 space-y-4">
            <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Informations") }}</h2>
            
            <!-- FRANÇAIS -->
            <div class="border-l-2 border-[#00D4FF] pl-4">
                <h3 class="text-sm text-[#00D4FF] mb-3">{{ __("FRANÇAIS") }}</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-gray-400 mb-2">{{ __("Nom *") }}</label>
                        <input type="text" 
                               name="name_fr" 
                               value="{{ old('name_fr') }}"
                               class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none"
                               required>
                        @error('name_fr')
                            <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                        @enderror
                    </div>
                    <div>
                        <label class="block text-gray-400 mb-2">{{ __("Description *") }}</label>
                        <textarea name="description_fr" 
                                  rows="4"
                                  class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none"
                                  required>{{ old('description_fr') }}</textarea>
                        @error('description_fr')
                            <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                        @enderror
                    </div>
                </div>
            </div>

            <!-- ENGLISH -->
            <div class="border-l-2 border-[#FF00E5] pl-4 mt-6">
                <h3 class="text-sm text-[#FF00E5] mb-3">{{ __("ENGLISH") }}</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-gray-400 mb-2">{{ __("Name") }}</label>
                        <input type="text" 
                               name="name_en" 
                               value="{{ old('name_en') }}"
                               class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#FF00E5] focus:outline-none">
                        @error('name_en')
                            <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                        @enderror
                    </div>
                    <div>
                        <label class="block text-gray-400 mb-2">{{ __("Description") }}</label>
                        <textarea name="description_en" 
                                  rows="4"
                                  class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#FF00E5] focus:outline-none">{{ old('description_en') }}</textarea>
                        @error('description_en')
                            <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                        @enderror
                    </div>
                </div>
            </div>
        </div>

        <!-- Média et options -->
        <div class="grid md:grid-cols-2 gap-6">
            <!-- Image -->
            <div class="bg-black/30 border border-white/10 rounded-lg p-6">
                <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Image") }}</h2>
                <div>
                    <input type="file" 
                           name="image" 
                           id="image"
                           accept="image/*"
                           class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white"
                           required>
                    <p class="text-gray-500 text-sm mt-2">{{ __("Format: JPG, PNG, max 2Mo") }}</p>
                </div>
                <div id="image-preview" class="hidden mt-4">
                    <p class="text-gray-400 mb-2">{{ __("Aperçu:") }}</p>
                    <img src="" alt="{{ __('Aperçu') }}" class="max-w-full h-40 object-cover rounded border-2 border-[#00D4FF]">
                </div>
            </div>

            <!-- Options -->
            <div class="bg-black/30 border border-white/10 rounded-lg p-6">
                <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Options") }}</h2>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-gray-400 mb-2">{{ __("Icône (classe FontAwesome)") }}</label>
                        <input type="text" 
                               name="icon" 
                               value="{{ old('icon', 'fas fa-camera') }}"
                               class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none"
                               placeholder="fas fa-camera">
                    </div>

                    <div>
                        <label class="block text-gray-400 mb-2">{{ __("Couleur") }}</label>
                        <div class="flex space-x-2">
                            <input type="color" 
                                   name="color" 
                                   id="color"
                                   value="{{ old('color', '#00D4FF') }}"
                                   class="h-10 w-10 bg-transparent border border-white/20 rounded cursor-pointer">
                            <input type="text" 
                                   name="color_hex" 
                                   id="color_hex"
                                   value="{{ old('color', '#00D4FF') }}"
                                   class="flex-1 bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none">
                        </div>
                    </div>

                    <div>
                        <label class="block text-gray-400 mb-2">{{ __("Ordre d'affichage") }}</label>
                        <input type="number" 
                               name="order" 
                               value="{{ old('order', 0) }}"
                               class="w-32 bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none">
                    </div>

                    <div class="flex items-center">
                        <input type="checkbox" 
                               name="is_active" 
                               id="is_active"
                               value="1"
                               {{ old('is_active', true) ? 'checked' : '' }}
                               class="w-5 h-5 bg-black/50 border border-white/20 rounded">
                        <label for="is_active" class="ml-3 text-gray-400">
                            {{ __("Actif") }}
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <!-- Boutons -->
        <div class="flex justify-end gap-4 pt-4">
            <a href="{{ route('admin.service-domains.index') }}" 
               class="px-8 py-4 bg-white/10 hover:bg-white/20 rounded font-oswald uppercase tracking-wider text-sm transition-all duration-300">
                {{ __("Annuler") }}
            </a>
            <button type="submit" 
                    class="px-8 py-4 bg-gradient-to-r from-[#00D4FF] to-[#FF00E5] text-white font-oswald uppercase tracking-wider text-sm hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all duration-300">
                {{ __("Créer le domaine") }}
            </button>
        </div>
    </form>
</div>

@section('scripts')
@parent
<script>
    // Synchronisation color picker et input texte
    const colorPicker = document.getElementById('color');
    const colorHex = document.getElementById('color_hex');
    
    if (colorPicker && colorHex) {
        colorPicker.addEventListener('input', function() {
            colorHex.value = this.value;
        });
        
        colorHex.addEventListener('input', function() {
            if (/^#[0-9A-F]{6}$/i.test(this.value)) {
                colorPicker.value = this.value;
            }
        });
    }

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
