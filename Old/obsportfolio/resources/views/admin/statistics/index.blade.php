@extends('layouts.admin')

@section('title', __('Gestion des statistiques | Admin'))

@section('content')
<div class="container mx-auto px-4 py-8">
    <!-- En-tête -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
            <h1 class="font-oswald text-4xl uppercase tracking-tighter">
                <span class="text-white">{{ __("GESTION DES") }}</span>
                <span class="text-[#00D4FF] neon-text">{{ __("STATISTIQUES") }}</span>
            </h1>
            <p class="text-gray-400 mt-2">{{ __("Gérez les chiffres clés affichés sur le site") }}</p>
        </div>
        <a href="{{ route('admin.statistics.create') }}" 
           class="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-[#00D4FF] to-[#FF00E5] text-white font-oswald uppercase tracking-wider text-sm hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all duration-300">
            + {{ __("AJOUTER UNE STATISTIQUE") }}
        </a>
    </div>

    <!-- Messages flash -->
    @if(session('success'))
        <div class="mb-6 p-4 bg-[#00FF88]/20 border border-[#00FF88] rounded-lg text-[#00FF88]">
            {{ session('success') }}
        </div>
    @endif

    <!-- Tableau des statistiques -->
    <div class="bg-black/30 border border-white/10 rounded-lg overflow-hidden">
        <table class="w-full">
            <thead class="bg-white/5 border-b border-white/10">
                <tr>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">Clé</th>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">Valeur</th>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">Label (FR)</th>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">Label (EN)</th>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">Couleur</th>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">Ordre</th>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">Statut</th>
                    <th class="px-4 py-3 text-left text-gray-400 text-sm">Actions</th>
                </tr>
            </thead>
            <tbody>
                @forelse($statistics as $stat)
                <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td class="px-4 py-3"><code class="text-xs bg-white/10 px-2 py-1 rounded">{{ $stat->key }}</code></td>
                    <td class="px-4 py-3 font-oswald text-xl" style="color: {{ $stat->color }}">{{ $stat->value }}</td>
                    <td class="px-4 py-3 text-white">{{ $stat->label_fr }}</td>
                    <td class="px-4 py-3 text-gray-400">{{ $stat->label_en ?? '-' }}</td>
                    <td class="px-4 py-3">
                        <div class="flex items-center space-x-2">
                            <span class="w-4 h-4 rounded-full" style="background-color: {{ $stat->color }}"></span>
                            <span class="text-xs text-gray-400">{{ $stat->color }}</span>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-gray-400">{{ $stat->order }}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 text-xs rounded-full {{ $stat->is_active ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30' }}">
                            {{ $stat->is_active ? __('Actif') : __('Inactif') }}
                        </span>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex space-x-3">
                            <a href="{{ route('admin.statistics.edit', $stat) }}" class="text-[#00D4FF] hover:text-[#00D4FF]/80 text-sm">Modifier</a>
                            <form action="{{ route('admin.statistics.destroy', $stat) }}" method="POST" onsubmit="return confirm('Supprimer cette statistique ?')">
                                @csrf @method('DELETE')
                                <button type="submit" class="text-red-400 hover:text-red-300 text-sm">Supprimer</button>
                            </form>
                        </div>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="8" class="px-4 py-12 text-center text-gray-400">
                        {{ __("Aucune statistique trouvée.") }}
                        <div class="mt-4">
                            <a href="{{ route('admin.statistics.create') }}" class="text-[#00D4FF] hover:underline">
                                {{ __("Créer la première statistique") }}
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
        <a href="{{ route('admin.dashboard') }}" class="inline-flex items-center text-gray-400 hover:text-white transition-colors">
            ← {{ __("Retour au tableau de bord") }}
        </a>
    </div>
</div>

<style>
    .neon-text { text-shadow: 0 0 10px rgba(0,212,255,0.5); }
</style>
@endsection
