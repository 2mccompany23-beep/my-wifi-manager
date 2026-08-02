@extends('layouts.admin')

@section('title', __('Gestion de la page À propos | Admin'))

@section('content')
<div class="container mx-auto px-4 py-8">
    <!-- En-tête -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
            <h1 class="font-oswald text-4xl uppercase tracking-tighter">
                <span class="text-white">{{ __("PAGE") }}</span>
                <span class="text-[#00D4FF] neon-text">{{ __("À PROPOS") }}</span>
            </h1>
            <p class="text-gray-400 mt-2">{{ __("Gérez les différentes sections de la page À propos") }}</p>
        </div>
        <a href="{{ route('admin.about-sections.create') }}" 
           class="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-[#00D4FF] to-[#FF00E5] text-white font-oswald uppercase tracking-wider text-sm hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all duration-300">
            + {{ __("NOUVELLE SECTION") }}
        </a>
    </div>

    <!-- Messages flash -->
    @if(session('success'))
        <div class="mb-6 p-4 bg-[#00FF88]/20 border border-[#00FF88] rounded-lg text-[#00FF88]">
            {{ session('success') }}
        </div>
    @endif

    <!-- Tableau des sections -->
    <div class="bg-black/30 border border-white/10 rounded-lg overflow-hidden">
        <table class="w-full">
            <thead class="bg-white/5 border-b border-white/10">
                <tr>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">{{ __("Clé") }}</th>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">{{ __("Titre (FR)") }}</th>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">{{ __("Image") }}</th>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">{{ __("Statistiques") }}</th>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">{{ __("Statut") }}</th>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">{{ __("Actions") }}</th>
                </tr>
            </thead>
            <tbody>
                @forelse($sections as $section)
                <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td class="px-4 py-3">
                        <code class="text-xs bg-white/10 px-2 py-1 rounded">{{ $section->section_key }}</code>
                    </td>
                    <td class="px-4 py-3 text-white">{{ $section->title_fr ?? '-' }}</td>
                    <td class="px-4 py-3">
                        @if($section->image && \Illuminate\Support\Facades\Storage::disk('public')->exists($section->image))
                            <img src="{{ \Illuminate\Support\Facades\Storage::url($section->image) }}" 
                                 alt=""
                                 class="w-12 h-12 object-cover rounded border border-white/10">
                        @else
                            <span class="text-gray-600 text-xs">-</span>
                        @endif
                    </td>
                    <td class="px-4 py-3">
                        @if($section->stats)
                            <span class="text-xs text-[#00FF88]">{{ count($section->stats) }} stats</span>
                        @else
                            <span class="text-gray-600 text-xs">-</span>
                        @endif
                    </td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 text-xs rounded-full {{ $section->is_active ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30' }}">
                            {{ $section->is_active ? __('Actif') : __('Inactif') }}
                        </span>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex space-x-3">
                            <a href="{{ route('admin.about-sections.edit', $section) }}" 
                               class="text-[#00D4FF] hover:text-[#00D4FF]/80 transition-colors text-sm">
                                {{ __('Modifier') }}
                            </a>
                            <form action="{{ route('admin.about-sections.destroy', $section) }}" 
                                  method="POST"
                                  onsubmit="return confirm('{{ __("Êtes-vous sûr de vouloir supprimer cette section ?") }}')">
                                @csrf
                                @method('DELETE')
                                <button type="submit" 
                                        class="text-red-400 hover:text-red-300 transition-colors text-sm">
                                    {{ __('Supprimer') }}
                                </button>
                            </form>
                        </div>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="6" class="px-4 py-12 text-center text-gray-400">
                        {{ __("Aucune section trouvée.") }}
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <!-- Note d'information -->
    <div class="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm">
        <p class="flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linecap="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ __("Les clés de section disponibles : intro, main_photo, bio, stats. Utilisez-les pour organiser votre contenu.") }}
        </p>
    </div>

    <!-- Bouton retour -->
    <div class="mt-8 text-center">
        <a href="{{ route('admin.dashboard') }}" 
           class="inline-flex items-center text-gray-400 hover:text-white transition-colors">
            ← {{ __("Retour au tableau de bord") }}
        </a>
    </div>
</div>

<style>
    .neon-text {
        text-shadow: 0 0 10px rgba(0,212,255,0.5);
    }
</style>
@endsection
