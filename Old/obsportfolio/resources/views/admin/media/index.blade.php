@extends('layouts.admin')

@section('title', __('Gestion des médias | Admin'))

@section('content')
<div class="container mx-auto px-4 py-8">
    <!-- En-tête -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
            <h1 class="font-oswald text-4xl uppercase tracking-tighter">
                <span class="text-white">{{ __("GESTION DES") }}</span>
                <span class="text-[#00D4FF] neon-text">{{ __("MÉDIAS") }}</span>
            </h1>
            <p class="text-gray-400 mt-2">{{ __("Gérez toutes les images du site") }}</p>
            
            <!-- 🔍 DÉBOGAGE : Afficher la section actuelle -->
            <div class="mt-2 p-2 bg-blue-500/20 border border-blue-500 rounded-lg inline-block">
                <span class="text-blue-400 text-sm font-mono">
                    Section actuelle : <strong class="text-white">{{ $section }}</strong>
                </span>
            </div>
        </div>
        <div class="mt-4 md:mt-0 flex space-x-4">
            <select id="section-selector" class="bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:border-[#00D4FF] focus:outline-none">
                @foreach($sections as $key => $label)
                    <option value="{{ $key }}" {{ $section == $key ? 'selected' : '' }}>{{ $label }}</option>
                @endforeach
            </select>
            <a href="{{ route('admin.media.create', ['section' => $section]) }}" 
               class="px-6 py-3 bg-gradient-to-r from-[#00D4FF] to-[#FF00E5] text-white font-oswald uppercase tracking-wider text-sm hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all duration-300">
                + {{ __("AJOUTER UNE IMAGE") }}
            </a>
        </div>
    </div>

    <!-- Messages flash -->
    @if(session('success'))
        <div class="mb-6 p-4 bg-[#00FF88]/20 border border-[#00FF88] rounded-lg text-[#00FF88]">
            {{ session('success') }}
        </div>
    @endif

    <!-- Grille des médias -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @forelse($media as $item)
        <div class="bg-black/30 border border-white/10 rounded-lg overflow-hidden hover:border-[#00D4FF]/50 transition-all duration-300">
            <div class="aspect-video bg-black/50 overflow-hidden">
                <img src="{{ Storage::url($item->image_path) }}" 
                     alt="{{ $item->title_fr }}"
                     class="w-full h-full object-cover hover:scale-105 transition-transform duration-500">
            </div>
            <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-oswald text-white">{{ $item->title_fr ?? 'Sans titre' }}</h3>
                    <span class="text-xs text-gray-400">#{{ $item->order }}</span>
                </div>
                @if($item->title_en)
                    <p class="text-xs text-gray-500 mb-2">{{ $item->title_en }}</p>
                @endif
                <!-- 🔍 Afficher la section de l'image -->
                <div class="text-xs text-gray-500 mb-2">
                    Section: <span class="text-[#00D4FF]">{{ $item->section }}</span>
                </div>
                <div class="flex justify-between items-center mt-4">
                    <span class="px-2 py-1 text-xs rounded-full {{ $item->is_active ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30' }}">
                        {{ $item->is_active ? __('Actif') : __('Inactif') }}
                    </span>
                    <div class="flex space-x-3">
                        <a href="{{ route('admin.media.edit', $item) }}" class="text-[#00D4FF] hover:text-[#00D4FF]/80 text-sm">Modifier</a>
                        <form action="{{ route('admin.media.destroy', $item) }}" method="POST" onsubmit="return confirm('Supprimer cette image ?')">
                            @csrf @method('DELETE')
                            <button type="submit" class="text-red-400 hover:text-red-300 text-sm">Supprimer</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        @empty
        <div class="col-span-3 text-center py-12 text-gray-400">
            {{ __("Aucune image dans cette section.") }}
            <div class="mt-4">
                <a href="{{ route('admin.media.create', ['section' => $section]) }}" class="text-[#00D4FF] hover:underline">
                    {{ __("Ajouter la première image") }}
                </a>
            </div>
        </div>
        @endforelse
    </div>
</div>


<script>
    document.getElementById('section-selector').addEventListener('change', function() {
        window.location.href = '{{ route("admin.media.index") }}?section=' + this.value;
    });
</script>

<style>
    .neon-text { text-shadow: 0 0 10px rgba(0,212,255,0.5); }
</style>
@endsection
