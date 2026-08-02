@extends('layouts.admin')

@section('title', __('Modifier un événement | Admin'))

@section('content')
<div class="min-h-screen bg-black text-white pt-24 pb-12">
    <div class="container mx-auto px-4">
        
        <!-- En-tête -->
        <div class="mb-8">
            <h1 class="font-oswald text-4xl md:text-5xl uppercase tracking-tighter">
                <span class="text-white">{{ __("MODIFIER") }}</span>
                <span class="text-[#00D4FF] neon-text">{{ __("L'ÉVÉNEMENT") }}</span>
            </h1>
            <p class="text-gray-400 mt-2">{{ $event->title_fr }}</p>
        </div>

        <!-- Formulaire -->
        <form action="{{ route('admin.events.update', $event) }}" 
              method="POST" 
              enctype="multipart/form-data"
              class="space-y-8">
            @csrf
            @method('PUT')

            <!-- Informations bilingues -->
            <div class="grid md:grid-cols-2 gap-6">
                <!-- Français -->
                <div class="bg-black/30 border border-white/10 rounded-lg p-6">
                    <h2 class="font-oswald text-xl mb-4 text-[#00D4FF]">{{ __("FRANÇAIS") }}</h2>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-gray-400 mb-2">{{ __("Titre *") }}</label>
                            <input type="text" 
                                   name="title_fr" 
                                   value="{{ old('title_fr', $event->title_fr) }}"
                                   class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none"
                                   required>
                            @error('title_fr')
                                <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                            @enderror
                        </div>
                        <div>
                            <label class="block text-gray-400 mb-2">{{ __("Description *") }}</label>
                            <textarea name="description_fr" 
                                      rows="6"
                                      class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none"
                                      required>{{ old('description_fr', $event->description_fr) }}</textarea>
                            @error('description_fr')
                                <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                            @enderror
                        </div>
                    </div>
                </div>

                <!-- Anglais -->
                <div class="bg-black/30 border border-white/10 rounded-lg p-6">
                    <h2 class="font-oswald text-xl mb-4 text-[#FF00E5]">{{ __("ENGLISH") }}</h2>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-gray-400 mb-2">{{ __("Title *") }}</label>
                            <input type="text" 
                                   name="title_en" 
                                   value="{{ old('title_en', $event->title_en) }}"
                                   class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#FF00E5] focus:outline-none"
                                   required>
                            @error('title_en')
                                <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                            @enderror
                        </div>
                        <div>
                            <label class="block text-gray-400 mb-2">{{ __("Description *") }}</label>
                            <textarea name="description_en" 
                                      rows="6"
                                      class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#FF00E5] focus:outline-none"
                                      required>{{ old('description_en', $event->description_en) }}</textarea>
                            @error('description_en')
                                <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                            @enderror
                        </div>
                    </div>
                </div>
            </div>

            <!-- Catégorie -->
            <div class="bg-black/30 border border-white/10 rounded-lg p-6">
                <h2 class="font-oswald text-xl mb-4">{{ __("CATÉGORIE") }}</h2>
                <div class="grid md:grid-cols-3 gap-4">
                    @php
                        $categories = [
                            'sport' => 'Sport',
                            'event' => 'Événementiel',
                            'studio' => 'Studio',
                            'nature' => 'Nature',
                            'travel' => 'Voyage',
                            'documentary' => 'Documentaire'
                        ];
                    @endphp
                    @foreach($categories as $value => $label)
                        <label class="flex items-center p-4 bg-black/50 border border-white/10 rounded-lg cursor-pointer hover:border-[#00D4FF] transition">
                            <input type="radio" 
                                   name="category" 
                                   value="{{ $value }}"
                                   class="mr-3"
                                   {{ old('category', $event->category) == $value ? 'checked' : '' }}>
                            <span>{{ $label }}</span>
                        </label>
                    @endforeach
                    <label class="flex items-center p-4 bg-black/50 border border-white/10 rounded-lg cursor-pointer hover:border-[#FF00E5] transition">
                        <input type="radio" 
                               name="category" 
                               value="new"
                               id="category-new-radio"
                               class="mr-3"
                               {{ old('category', $event->category) == 'new' || $event->is_new_category ? 'checked' : '' }}>
                        <span>{{ __("Nouvelle catégorie") }}</span>
                    </label>
                </div>
                <div id="new-category-input" class="mt-4 {{ old('category', $event->category) == 'new' || $event->is_new_category ? '' : 'hidden' }}">
                    <label class="block text-gray-400 mb-2">{{ __("Nom de la nouvelle catégorie") }}</label>
                    <input type="text" 
                           name="new_category" 
                           value="{{ old('new_category', $event->is_new_category ? $event->category : '') }}"
                           class="w-full md:w-1/2 bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#FF00E5] focus:outline-none"
                           placeholder="{{ __('Ex: Architecture, Portrait, ...') }}">
                </div>
            </div>

            <!-- Image vedette -->
            <div class="bg-black/30 border border-white/10 rounded-lg p-6">
                <h2 class="font-oswald text-xl mb-4">{{ __("IMAGE VEDETTE") }}</h2>
                
                @if($event->featured_image && \Illuminate\Support\Facades\Storage::disk('public')->exists($event->featured_image))
                    <div class="mb-4">
                        <p class="text-gray-400 mb-2">{{ __("Image actuelle:") }}</p>
                        <img src="{{ \Illuminate\Support\Facades\Storage::url($event->featured_image) }}" 
                             alt="{{ $event->title }}"
                             class="w-48 h-32 object-cover rounded border-2 border-[#00D4FF]">
                    </div>
                @endif
                
                <div>
                    <label class="block text-gray-400 mb-2">{{ __("Changer l'image") }}</label>
                    <input type="file" 
                           name="featured_image" 
                           id="featured_image"
                           accept="image/*"
                           class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white">
                    <p class="text-gray-500 text-sm mt-2">{{ __("Laissez vide pour conserver l'image actuelle.") }}</p>
                </div>
                <div id="featured-preview" class="hidden mt-4">
                    <p class="text-gray-400 mb-2">{{ __("Aperçu:") }}</p>
                    <img src="" alt="{{ __('Aperçu') }}" class="max-w-md rounded-lg border-2 border-[#00D4FF]">
                </div>
            </div>

            <!-- Galerie d'images -->
            <div class="bg-black/30 border border-white/10 rounded-lg p-6">
                <h2 class="font-oswald text-xl mb-4">{{ __("GALERIE D'IMAGES") }}</h2>
                
                @if($event->images && $event->images->count() > 0)
                    <div class="mb-6">
                        <p class="text-gray-400 mb-3">{{ __("Images actuelles (glissez-déposez pour réorganiser) :") }}</p>
                        <div id="sortable-gallery" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            @foreach($event->images as $image)
                                <div class="group relative bg-black/50 border border-white/20 rounded-lg overflow-hidden" data-id="{{ $image->id }}">
                                    <img src="{{ \Illuminate\Support\Facades\Storage::url($image->image_path) }}" 
                                         alt=""
                                         class="w-full aspect-square object-cover">
                                    <div class="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <form action="{{ route('admin.events.images.delete', $image) }}" 
                                              method="POST"
                                              onsubmit="return confirm('{{ __("Supprimer cette image ?") }}')">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" 
                                                    class="px-3 py-1 bg-red-500/80 hover:bg-red-500 text-white text-xs rounded">
                                                {{ __("Supprimer") }}
                                            </button>
                                        </form>
                                    </div>
                                    <div class="absolute top-2 left-2 cursor-move text-white opacity-50 group-hover:opacity-100">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linecap="round" d="M4 8h16M4 16h16" />
                                        </svg>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    </div>
                @endif
                
                <div>
                    <label class="block text-gray-400 mb-2">{{ __("Ajouter des images") }}</label>
                    <input type="file" 
                           name="images[]" 
                           id="gallery_images"
                           accept="image/*"
                           multiple
                           class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white">
                    <p class="text-gray-500 text-sm mt-2">{{ __("Les nouvelles images seront ajoutées à la galerie.") }}</p>
                </div>
                <div id="gallery-preview" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
                    <!-- Les aperçus des nouvelles images apparaîtront ici -->
                </div>
            </div>

            <!-- Options -->
            <div class="bg-black/30 border border-white/10 rounded-lg p-6">
                <h2 class="font-oswald text-xl mb-4">{{ __("OPTIONS") }}</h2>
                <div class="space-y-4">
                    <div class="flex items-center">
                        <input type="checkbox" 
                               name="is_published" 
                               id="is_published"
                               value="1"
                               {{ old('is_published', $event->is_published) ? 'checked' : '' }}
                               class="w-5 h-5 bg-black/50 border border-white/20 rounded">
                        <label for="is_published" class="ml-3 text-gray-400">
                            {{ __("Publié") }}
                        </label>
                    </div>
                    <div>
                        <label class="block text-gray-400 mb-2">{{ __("Ordre d'affichage") }}</label>
                        <input type="number" 
                               name="order" 
                               value="{{ old('order', $event->order) }}"
                               class="w-32 bg-black/50 border border-white/20 rounded px-4 py-3 text-white">
                        <p class="text-gray-500 text-sm mt-1">{{ __("Plus le chiffre est petit, plus l'événement apparaît en premier") }}</p>
                    </div>
                </div>
            </div>

            <!-- Boutons d'action -->
            <div class="flex justify-end gap-4">
                <a href="{{ route('admin.events.index') }}" 
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
</div>
@endsection

@section('scripts')
@parent
<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest"></script>
<script>
    document.addEventListener('DOMContentLoaded', function() {
        // ---------- PREVIEW IMAGE VEDETTE ----------
        const featuredInput = document.getElementById('featured_image');
        const featuredPreview = document.getElementById('featured-preview');
        const featuredImg = featuredPreview?.querySelector('img');
        
        if (featuredInput) {
            featuredInput.addEventListener('change', function(e) {
                if (this.files && this.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        if (featuredImg) {
                            featuredImg.src = e.target.result;
                            featuredPreview.classList.remove('hidden');
                        }
                    }
                    reader.readAsDataURL(this.files[0]);
                }
            });
        }

        // ---------- GESTION NOUVELLE CATÉGORIE ----------
        const radios = document.querySelectorAll('input[name="category"]');
        const newCategoryDiv = document.getElementById('new-category-input');
        
        radios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'new') {
                    newCategoryDiv.classList.remove('hidden');
                } else {
                    newCategoryDiv.classList.add('hidden');
                }
            });
        });

        // ---------- PREVIEW NOUVELLES IMAGES DE GALERIE ----------
        const galleryInput = document.getElementById('gallery_images');
        const galleryPreview = document.getElementById('gallery-preview');
        
        if (galleryInput) {
            galleryInput.addEventListener('change', function(e) {
                galleryPreview.innerHTML = '';
                
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
                        galleryPreview.appendChild(div);
                    }
                    
                    reader.readAsDataURL(file);
                }
            });
        }

        // ---------- DRAG & DROP POUR LA GALERIE EXISTANTE ----------
        const sortableGallery = document.getElementById('sortable-gallery');
        if (sortableGallery) {
            new Sortable(sortableGallery, {
                handle: '.cursor-move',
                animation: 150,
                onEnd: function() {
                    const images = document.querySelectorAll('#sortable-gallery > div');
                    const order = Array.from(images).map(div => div.dataset.id);
                    
                    fetch('{{ route("admin.events.images.reorder", $event) }}', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': '{{ csrf_token() }}'
                        },
                        body: JSON.stringify({ images: order })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            console.log('✅ Ordre des images mis à jour');
                        }
                    })
                    .catch(error => console.error('❌ Erreur:', error));
                }
            });
        }
    });
</script>
@endsection

<style>
    .neon-text {
        text-shadow: 0 0 10px rgba(0,212,255,0.5);
    }
</style>
