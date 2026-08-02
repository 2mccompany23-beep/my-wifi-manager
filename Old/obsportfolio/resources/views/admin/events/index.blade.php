@extends('layouts.admin')

@section('content')
<div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-oswald uppercase">Gestion du Portfolio</h1>
        <a href="{{ route('admin.events.create') }}" 
           class="px-6 py-3 bg-gradient-to-r from-[#00D4FF] to-[#FF00E5] text-white font-oswald uppercase tracking-wider hover:shadow-lg transition-all">
            + Nouvel Événement
        </a>
    </div>

    @if(session('success'))
        <div class="bg-green-500/20 border border-green-500 text-green-500 px-4 py-3 rounded mb-4">
            {{ session('success') }}
        </div>
    @endif

    <div class="bg-black/30 border border-white/10 rounded-lg p-6">
        <div class="mb-4">
            <h2 class="text-xl font-oswald mb-2">Tous les événements</h2>
            <p class="text-gray-400">Glissez-déposez pour réorganiser l'ordre d'affichage</p>
        </div>

        <div id="sortable-events" class="space-y-4">
            @foreach($events as $event)
                <div class="event-item bg-black/50 border border-white/10 rounded-lg p-4 flex items-center gap-4"
                     data-id="{{ $event->id }}">
                    <div class="cursor-move text-gray-400">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linecap="round" d="M4 8h16M4 16h16" />
                        </svg>
                    </div>
                    
                    <div class="w-20 h-20 bg-gray-800 rounded overflow-hidden">
                        @if($event->featured_image)
                            <img src="{{ Storage::url($event->featured_image) }}" 
                                 alt="{{ $event->title_fr }}"
                                 class="w-full h-full object-cover">
                        @endif
                    </div>
                    
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-1">
                            <h3 class="text-xl font-oswald">{{ $event->title_fr }}</h3>
                            <span class="text-sm text-gray-400">/ {{ $event->title_en }}</span>
                            @if(!$event->is_published)
                                <span class="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-500 rounded">Brouillon</span>
                            @endif
                        </div>
                        <div class="flex items-center gap-4 text-sm">
                            <span class="text-gray-400">
                                Catégorie: 
                                <span class="text-white" style="color: {{ $event->category_color }}">
                                    {{ $event->category_label }}
                                </span>
                            </span>
                            <span class="text-gray-400">
                                Images: {{ $event->images_count }}
                            </span>
                            <span class="text-gray-400">
                                Créé le: {{ $event->created_at->format('d/m/Y') }}
                            </span>
                        </div>
                    </div>
                    
                    <div class="flex gap-2">
                        <a href="{{ route('admin.events.edit', $event) }}" 
                           class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded transition">
                            Modifier
                        </a>
                        <form action="{{ route('admin.events.destroy', $event) }}" 
                              method="POST"
                              onsubmit="return confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')">
                            @csrf
                            @method('DELETE')
                            <button type="submit" 
                                    class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded transition">
                                Supprimer
                            </button>
                        </form>
                    </div>
                </div>
            @endforeach
        </div>
    </div>

<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest"></script>
<script>
    document.addEventListener('DOMContentLoaded', function() {
        const sortable = new Sortable(document.getElementById('sortable-events'), {
            handle: '.cursor-move',
            animation: 150,
            onEnd: function() {
                const events = document.querySelectorAll('.event-item');
                const order = [];
                events.forEach(event => {
                    order.push(event.dataset.id);
                });
                
                fetch('{{ route("admin.events.reorder") }}', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': '{{ csrf_token() }}'
                    },
                    body: JSON.stringify({ events: order })
                });
            }
        });
    });
</script>
</div>
@endsection