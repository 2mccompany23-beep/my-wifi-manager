@extends('layouts.admin')

@section('title', __('Ajouter une statistique | Admin'))

@section('content')
<div class="container mx-auto px-4 py-8">
    <div class="mb-8">
        <h1 class="font-oswald text-4xl uppercase tracking-tighter">
            <span class="text-white">{{ __("AJOUTER UNE") }}</span>
            <span class="text-[#00D4FF] neon-text">{{ __("STATISTIQUE") }}</span>
        </h1>
    </div>

    <form action="{{ route('admin.statistics.store') }}" method="POST" class="max-w-3xl space-y-6">
        @csrf

        <!-- Clé et valeur -->
        <div class="grid md:grid-cols-2 gap-6">
            <div class="bg-black/30 border border-white/10 rounded-lg p-6">
                <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Clé unique") }}</h2>
                <div>
                    <label class="block text-gray-400 mb-2">{{ __("Clé *") }}</label>
                    <input type="text" name="key" value="{{ old('key') }}" 
                           class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none"
                           placeholder="experience_years, competitions, etc." required>
                    <p class="text-gray-500 text-xs mt-1">Identifiant unique pour le code (ex: experience_years)</p>
                </div>
            </div>

            <div class="bg-black/30 border border-white/10 rounded-lg p-6">
                <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Valeur") }}</h2>
                <div>
                    <label class="block text-gray-400 mb-2">{{ __("Valeur *") }}</label>
                    <input type="text" name="value" value="{{ old('value') }}" 
                           class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none"
                           placeholder="7+, 5+, 15, CAN 25" required>
                </div>
            </div>
        </div>

        <!-- Labels bilingues -->
        <div class="bg-black/30 border border-white/10 rounded-lg p-6">
            <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Libellés") }}</h2>
            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-gray-400 mb-2">{{ __("Libellé (FR) *") }}</label>
                    <input type="text" name="label_fr" value="{{ old('label_fr') }}" 
                           class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none"
                           placeholder="Ans d'expérience" required>
                </div>
                <div>
                    <label class="block text-gray-400 mb-2">{{ __("Libellé (EN)") }}</label>
                    <input type="text" name="label_en" value="{{ old('label_en') }}" 
                           class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#FF00E5] focus:outline-none"
                           placeholder="Years of experience">
                </div>
            </div>
        </div>

        <!-- Options -->
        <div class="grid md:grid-cols-2 gap-6">
            <div class="bg-black/30 border border-white/10 rounded-lg p-6">
                <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Apparence") }}</h2>
                <div class="space-y-4">
                    <div>
                        <label class="block text-gray-400 mb-2">{{ __("Couleur") }}</label>
                        <div class="flex space-x-2">
                            <input type="color" name="color" id="color" value="{{ old('color', '#00D4FF') }}" 
                                   class="h-10 w-10 bg-transparent border border-white/20 rounded cursor-pointer">
                            <input type="text" name="color_hex" id="color_hex" value="{{ old('color', '#00D4FF') }}" 
                                   class="flex-1 bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none">
                        </div>
                    </div>
                    <div>
                        <label class="block text-gray-400 mb-2">{{ __("Icône (classe FontAwesome)") }}</label>
                        <input type="text" name="icon" value="{{ old('icon') }}" 
                               class="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none"
                               placeholder="fas fa-trophy">
                    </div>
                </div>
            </div>

            <div class="bg-black/30 border border-white/10 rounded-lg p-6">
                <h2 class="font-oswald text-xl text-[#00D4FF] mb-4">{{ __("Options") }}</h2>
                <div class="space-y-4">
                    <div>
                        <label class="block text-gray-400 mb-2">{{ __("Ordre d'affichage") }}</label>
                        <input type="number" name="order" value="{{ old('order', 0) }}" 
                               class="w-32 bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none">
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" name="is_active" id="is_active" value="1" {{ old('is_active', true) ? 'checked' : '' }} 
                               class="w-5 h-5 bg-black/50 border border-white/20 rounded">
                        <label for="is_active" class="ml-3 text-gray-400">{{ __("Actif") }}</label>
                    </div>
                </div>
            </div>
        </div>

        <!-- Boutons -->
        <div class="flex justify-end gap-4">
            <a href="{{ route('admin.statistics.index') }}" 
               class="px-8 py-4 bg-white/10 hover:bg-white/20 rounded font-oswald uppercase tracking-wider text-sm transition">
                {{ __("Annuler") }}
            </a>
            <button type="submit" 
                    class="px-8 py-4 bg-gradient-to-r from-[#00D4FF] to-[#FF00E5] text-white font-oswald uppercase tracking-wider text-sm hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition">
                {{ __("Créer") }}
            </button>
        </div>
    </form>
</div>

@section('scripts')
@parent
<script>
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
</script>
@endsection

<style>.neon-text{text-shadow:0 0 10px rgba(0,212,255,0.5);}</style>
@endsection
