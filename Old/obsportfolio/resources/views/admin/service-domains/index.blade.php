@extends('layouts.admin')

@section('title', __('Gestion des domaines | Admin'))

@section('content')
<div class="container mx-auto px-4 py-8">
    <!-- En-tête -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
            <h1 class="font-oswald text-4xl uppercase tracking-tighter">
                <span class="text-white">{{ __("DOMAINES") }}</span>
                <span class="text-[#00D4FF] neon-text">{{ __("D'INTERVENTION") }}</span>
            </h1>
            <p class="text-gray-400 mt-2">{{ __("Gérez les différentes catégories de votre activité") }}</p>
        </div>
        <a href="{{ route('admin.service-domains.create') }}" 
           class="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-[#00D4FF] to-[#FF00E5] text-white font-oswald uppercase tracking-wider text-sm hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all duration-300">
            + {{ __("NOUVEAU DOMAINE") }}
        </a>
    </div>

    <!-- Messages flash -->
    @if(session('success'))
        <div class="mb-6 p-4 bg-[#00FF88]/20 border border-[#00FF88] rounded-lg text-[#00FF88]">
            {{ session('success') }}
        </div>
    @endif

    @if(session('error'))
        <div class="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-500">
            {{ session('error') }}
        </div>
    @endif

    <!-- Tableau des domaines -->
    <div class="bg-black/30 border border-white/10 rounded-lg overflow-hidden">
        <table class="w-full">
            <thead class="bg-white/5 border-b border-white/10">
                <tr>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">{{ __("Image") }}</th>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">{{ __("Nom (FR)") }}</th>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">{{ __("Nom (EN)") }}</th>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">{{ __("Slug") }}</th>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">{{ __("Couleur") }}</th>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">{{ __("Ordre") }}</th>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">{{ __("Statut") }}</th>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">{{ __("Actions") }}</th>
                </tr>
            </thead>
            <tbody>
                @forelse($domains as $domain)
                <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td class="px-4 py-3">
                        @if($domain->image && \Illuminate\Support\Facades\Storage::disk('public')->exists($domain->image))
                            <img src="{{ \Illuminate\Support\Facades\Storage::url($domain->image) }}" 
                                 alt="{{ $domain->name_fr }}"
                                 class="w-16 h-12 object-cover rounded border border-white/10">
                        @else
                            <div class="w-16 h-12 bg-gray-800 rounded flex items-center justify-center text-gray-500 text-xs">
                                {{ __("Pas d'image") }}
                            </div>
                        @endif
                    </td>
                    <td class="px-4 py-3 text-white font-medium">{{ $domain->name_fr }}</td>
                    <td class="px-4 py-3 text-gray-400">{{ $domain->name_en ?? '-' }}</td>
                    <td class="px-4 py-3 text-gray-400"><code class="text-xs">{{ $domain->slug }}</code></td>
                    <td class="px-4 py-3">
                        <div class="flex items-center space-x-2">
                            <span class="w-4 h-4 rounded-full" style="background-color: {{ $domain->color }}"></span>
                            <span class="text-xs text-gray-400">{{ $domain->color }}</span>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-gray-400">{{ $domain->order }}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 text-xs rounded-full {{ $domain->is_active ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30' }}">
                            {{ $domain->is_active ? __('Actif') : __('Inactif') }}
                        </span>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex space-x-3">
                            <a href="{{ route('admin.service-domains.edit', $domain) }}" 
                               class="text-[#00D4FF] hover:text-[#00D4FF]/80 transition-colors text-sm"
                               title="{{ __('Modifier') }}">
                                {{ __('Modifier') }}
                            </a>
                            <form action="{{ route('admin.service-domains.destroy', $domain) }}" 
                                  method="POST"
                                  onsubmit="return confirm('{{ __("Êtes-vous sûr de vouloir supprimer ce domaine ?") }}')">
                                @csrf
                                @method('DELETE')
                                <button type="submit" 
                                        class="text-red-400 hover:text-red-300 transition-colors text-sm"
                                        title="{{ __('Supprimer') }}">
                                    {{ __('Supprimer') }}
                                </button>
                            </form>
                        </div>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="8" class="px-4 py-12 text-center text-gray-400">
                        {{ __("Aucun domaine d'intervention trouvé.") }}
                        <div class="mt-4">
                            <a href="{{ route('admin.service-domains.create') }}" 
                               class="text-[#00D4FF] hover:underline">
                                {{ __("Créer le premier domaine") }}
                            </a>
                        </div>
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
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
