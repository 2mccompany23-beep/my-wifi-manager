@extends('layouts.admin')

@section('content')
<div class="container mx-auto px-4 py-8">
    <div class="mb-6">
        <h1 class="text-3xl font-oswald uppercase">Nouvel Événement</h1>
        <p class="text-gray-400">Ajoutez un nouveau projet à votre portfolio</p>
    </div>

    <form action="{{ route('admin.events.store') }}" 
          method="POST" 
          enctype="multipart/form-data"
          class="space-y-8">
        @csrf

        {{-- Informations bilingues --}}
        <div class="grid md:grid-cols-2 gap-6">
            {{-- Français --}}
            <div class="bg-black/30 border border-white/10 rounded-lg p-6">
                <h2 class="text-xl font-oswald mb-4 text-[#00D4FF]">FRANÇAIS</h2>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-gray-400 mb-2">Titre *</label>
                        <input type="text" 
                               name="title_fr" 
                               value="{{ old('title_fr') }}"
                               class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none"
                               required>
                        @error('title_fr')
                            <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                        @enderror
                    </div>
                    
                    <div>
                        <label class="block text-gray-400 mb-2">Description *</label>
                        <textarea name="description_fr" 
                                  rows="5"
                                  class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none"
                                  required>{{ old('description_fr') }}</textarea>
                        @error('description_fr')
                            <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                        @enderror
                    </div>
                </div>
            </div>

            {{-- Anglais --}}
            <div class="bg-black/30 border border-white/10 rounded-lg p-6">
                <h2 class="text-xl font-oswald mb-4 text-[#FF00E5]">ENGLISH</h2>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-gray-400 mb-2">Title *</label>
                        <input type="text" 
                               name="title_en" 
                               value="{{ old('title_en') }}"
                               class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#FF00E5] focus:outline-none"
                               required>
                        @error('title_en')
                            <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                        @enderror
                    </div>
                    
                    <div>
                        <label class="block text-gray-400 mb-2">Description *</label>
                        <textarea name="description_en" 
                                  rows="5"
                                  class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#FF00E5] focus:outline-none"
                                  required>{{ old('description_en') }}</textarea>
                        @error('description_en')
                            <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                        @enderror
                    </div>
                </div>
            </div>
        </div>

        {{-- Catégorie --}}
        <div class="bg-black/30 border border-white/10 rounded-lg p-6">
            <h2 class="text-xl font-oswald mb-4">CATÉGORIE</h2>
            
            <div class="space-y-4">
                <div class="grid md:grid-cols-3 gap-4">
                    @foreach($categories as $value => $label)
                        <label class="flex items-center p-4 bg-black/50 border border-white/10 rounded-lg cursor-pointer hover:border-[#00D4FF] transition">
                            <input type="radio" 
                                   name="category" 
                                   value="{{ $value }}"
                                   class="mr-3"
                                   {{ old('category') == $value ? 'checked' : '' }}>
                            <span>{{ $label }}</span>
                        </label>
                    @endforeach
                    
                    <label class="flex items-center p-4 bg-black/50 border border-white/10 rounded-lg cursor-pointer hover:border-[#FF00E5] transition">
                        <input type="radio" 
                               name="category" 
                               value="new"
                               id="category-new"
                               class="mr-3"
                               {{ old('category') == 'new' ? 'checked' : '' }}>
                        <span>Nouvelle catégorie</span>
                    </label>
                </div>
                
                <div id="new-category-input" class="{{ old('category') == 'new' ? '' : 'hidden' }}">
                    <label class="block text-gray-400 mb-2">Nom de la nouvelle catégorie</label>
                    <input type="text" 
                           name="new_category" 
                           value="{{ old('new_category') }}"
                           class="w-full md:w-1/2 bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#FF00E5] focus:outline-none"
                           placeholder="Ex: Documentaire, Architecture, ...">
                </div>
            </div>
        </div>

        {{-- Image vedette --}}
        <div class="bg-black/30 border border-white/10 rounded-lg p-6">
            <h2 class="text-xl font-oswald mb-4">IMAGE VEDETTE</h2>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-gray-400 mb-2">Sélectionnez une image *</label>
                    <input type="file" 
                           name="featured_image" 
                           accept="image/*"
                           class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white"
                           required>
                    <p class="text-gray-500 text-sm mt-2">Format recommandé: 1920x1080, JPG ou PNG, max 2Mo</p>
                </div>
                
                <div id="featured-preview" class="hidden mt-4">
                    <p class="text-gray-400 mb-2">Aperçu:</p>
                    <img src="" alt="Aperçu" class="max-w-md rounded-lg border-2 border-[#00D4FF]">
                </div>
            </div>
        </div>

        {{-- Galerie d'images --}}
        <div class="bg-black/30 border border-white/10 rounded-lg p-6">
            <h2 class="text-xl font-oswald mb-4">GALERIE D'IMAGES</h2>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-gray-400 mb-2">Images supplémentaires</label>
                    <input type="file" 
                           name="images[]" 
                           accept="image/*"
                           multiple
                           class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white">
                    <p class="text-gray-500 text-sm mt-2">Vous pouvez sélectionner plusieurs images. Format: JPG, PNG, max 2Mo par image</p>
                </div>
                
                <div id="gallery-preview" class="grid grid-cols-4 md:grid-cols-6 gap-4 mt-4">
                    {{-- Les aperçus seront ajoutés ici via JavaScript --}}
                </div>
            </div>
        </div>

        {{-- Options avancées --}}
        <div class="bg-black/30 border border-white/10 rounded-lg p-6">
            <h2 class="text-xl font-oswald mb-4">OPTIONS</h2>
            
            <div class="space-y-4">
                <div class="flex items-center">
                    <input type="checkbox" 
                           name="is_published" 
                           id="is_published"
                           value="1"
                           {{ old('is_published', true) ? 'checked' : '' }}
                           class="w-5 h-5 bg-black/50 border border-white/20 rounded">
                    <label for="is_published" class="ml-3 text-gray-400">
                        Publier immédiatement
                    </label>
                </div>
                
                <div>
                    <label class="block text-gray-400 mb-2">Ordre d'affichage</label>
                    <input type="number" 
                           name="order" 
                           value="{{ old('order', 0) }}"
                           class="w-32 bg-black/50 border border-white/20 rounded px-4 py-3 text-white">
                    <p class="text-gray-500 text-sm mt-1">Plus le chiffre est petit, plus l'événement apparaîtra en premier</p>
                </div>
            </div>
        </div>

        {{-- Boutons d'action --}}
        <div class="flex justify-end gap-4">
            <a href="{{ route('admin.events.index') }}" 
               class="px-8 py-4 bg-white/10 hover:bg-white/20 rounded font-oswald uppercase tracking-wider transition">
                Annuler
            </a>
            <button type="submit" 
                    class="px-8 py-4 bg-gradient-to-r from-[#00D4FF] to-[#FF00E5] text-white font-oswald uppercase tracking-wider hover:shadow-lg transition">
                Créer l'événement
            </button>
        </div>
    </form>
</div>
<script>
    // Preview de l'image vedette
    document.querySelector('input[name="featured_image"]').addEventListener('change', function(e) {
        const preview = document.getElementById('featured-preview');
        const img = preview.querySelector('img');
        
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                img.src = e.target.result;
                preview.classList.remove('hidden');
            }
            
            reader.readAsDataURL(this.files[0]);
        }
    });

    // Gestion de la nouvelle catégorie
    document.querySelectorAll('input[name="category"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const newCategoryInput = document.getElementById('new-category-input');
            if (this.value === 'new') {
                newCategoryInput.classList.remove('hidden');
            } else {
                newCategoryInput.classList.add('hidden');
            }
        });
    });

    // Preview des images de la galerie
    document.querySelector('input[name="images[]"]').addEventListener('change', function(e) {
        const preview = document.getElementById('gallery-preview');
        preview.innerHTML = '';
        
        for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const div = document.createElement('div');
                div.className = 'aspect-square bg-black/50 border border-white/20 rounded overflow-hidden';
                
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'w-full h-full object-cover';
                
                div.appendChild(img);
                preview.appendChild(div);
            }
            
            reader.readAsDataURL(file);
        }
    });
</script>
@endsection