@extends('layouts.admin')

@section('title', __('Ajouter une image | Admin'))

@section('content')
<div class="container mx-auto px-4 py-8">
    <div class="mb-8">
        <h1 class="font-oswald text-4xl uppercase tracking-tighter">
            <span class="text-white">{{ __("AJOUTER UNE") }}</span>
            <span class="text-[#00D4FF] neon-text">{{ __("IMAGE") }}</span>
        </h1>
        <p class="text-gray-400 mt-2">{{ __("Section :") }} 
            <span class="text-[#00D4FF] font-bold text-xl">{{ $section }}</span>
        </p>
        <p class="text-yellow-500 text-sm mt-1">⚠️ Si ce n'est pas la bonne section, revenez à la liste et sélectionnez la bonne section avant d'ajouter.</p>
    </div>

    <form action="{{ route('admin.media.store') }}" method="POST" enctype="multipart/form-data" class="max-w-3xl space-y-6">
        @csrf
        <input type="hidden" name="section" value="{{ $section }}">

        <!-- Image -->
        <div class="bg-black/30 border border-white/10 rounded-lg p-6">
            <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Image") }}</h2>
            <div>
                <input type="file" name="image" id="image" accept="image/*" class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white" required>
                <p class="text-gray-500 text-sm mt-2">Format: JPG, PNG, max 2Mo</p>
            </div>
            <div id="image-preview" class="hidden mt-4">
                <p class="text-gray-400 mb-2">{{ __("Aperçu:") }}</p>
                <img src="" alt="Aperçu" class="max-w-full h-40 object-cover rounded border-2 border-[#00D4FF]">
            </div>
        </div>

        <!-- Titres bilingues -->
        <div class="bg-black/30 border border-white/10 rounded-lg p-6">
            <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Titres") }}</h2>
            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-gray-400 mb-2">{{ __("Titre (FR)") }}</label>
                    <input type="text" name="title_fr" value="{{ old('title_fr') }}" class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none">
                </div>
                <div>
                    <label class="block text-gray-400 mb-2">{{ __("Title (EN)") }}</label>
                    <input type="text" name="title_en" value="{{ old('title_en') }}" class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#FF00E5] focus:outline-none">
                </div>
            </div>
        </div>

        <!-- Descriptions bilingues -->
        <div class="bg-black/30 border border-white/10 rounded-lg p-6">
            <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Descriptions") }}</h2>
            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-gray-400 mb-2">{{ __("Description (FR)") }}</label>
                    <textarea name="description_fr" rows="3" class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none">{{ old('description_fr') }}</textarea>
                </div>
                <div>
                    <label class="block text-gray-400 mb-2">{{ __("Description (EN)") }}</label>
                    <textarea name="description_en" rows="3" class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#FF00E5] focus:outline-none">{{ old('description_en') }}</textarea>
                </div>
            </div>
        </div>

        <!-- Options -->
        <div class="bg-black/30 border border-white/10 rounded-lg p-6">
            <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Options") }}</h2>
            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-gray-400 mb-2">{{ __("Ordre d'affichage") }}</label>
                    <input type="number" name="order" value="{{ old('order', 0) }}" class="w-32 bg-black/50 border border-white/20 rounded px-4 py-3 text-white">
                </div>
                <div class="flex items-center">
                    <input type="checkbox" name="is_active" id="is_active" value="1" {{ old('is_active', true) ? 'checked' : '' }} class="w-5 h-5 bg-black/50 border border-white/20 rounded">
                    <label for="is_active" class="ml-3 text-gray-400">{{ __("Actif") }}</label>
                </div>
            </div>
        </div>

        <!-- Boutons -->
        <div class="flex justify-end gap-4">
            <a href="{{ route('admin.media.index', ['section' => $section]) }}" class="px-8 py-4 bg-white/10 hover:bg-white/20 rounded font-oswald uppercase tracking-wider text-sm transition">Annuler</a>
            <button type="submit" class="px-8 py-4 bg-gradient-to-r from-[#00D4FF] to-[#FF00E5] text-white font-oswald uppercase tracking-wider text-sm hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition">Ajouter</button>
        </div>
    </form>
</div>

@section('scripts')
@parent
<script>
    document.getElementById('image').addEventListener('change', function(e) {
        const preview = document.getElementById('image-preview');
        const img = preview.querySelector('img');
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = e => { img.src = e.target.result; preview.classList.remove('hidden'); };
            reader.readAsDataURL(this.files[0]);
        } else preview.classList.add('hidden');
    });
</script>
@endsection
<style>.neon-text{text-shadow:0 0 10px rgba(0,212,255,0.5);}</style>
@endsection
