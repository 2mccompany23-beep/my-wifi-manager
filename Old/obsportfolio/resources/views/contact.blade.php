@extends('layouts.app')

@section('title', __('Contact | Ori Ola OBS Photography'))

@section('content')
<div class="min-h-screen bg-black text-white pt-24">
    <div class="container mx-auto px-4 max-w-6xl">
        <!-- Header -->
        <div class="text-center mb-16">
            <h1 class="font-oswald text-5xl md:text-7xl uppercase mb-6">
                {{ __("Travaillons") }}<br><span class="text-[#00D4FF]">{{ __("ensemble") }}</span>
            </h1>
            <p class="text-xl text-gray-400 max-w-3xl mx-auto">
                {{ __("Discutons de votre projet, que ce soit pour une séance photo, un événement ou une collaboration.") }}
            </p>
        </div>

        <div class="grid lg:grid-cols-2 gap-16">
            <!-- Formulaire -->
            <div>
                <h2 class="font-oswald text-3xl mb-8">{{ __("Envoyez un message") }}</h2>
                
                <form id="contactForm" class="space-y-6">
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm mb-2">{{ __("Votre nom") }} *</label>
                            <input type="text" required 
                                   class="w-full bg-white/5 border border-white/10 p-3 focus:border-[#00D4FF] focus:outline-none"
                                   placeholder="{{ __('Votre nom complet') }}">
                        </div>
                        <div>
                            <label class="block text-sm mb-2">{{ __("Votre email") }} *</label>
                            <input type="email" required 
                                   class="w-full bg-white/5 border border-white/10 p-3 focus:border-[#00D4FF] focus:outline-none"
                                   placeholder="email@exemple.com">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm mb-2">{{ __("Type de projet") }} *</label>
                        <select class="w-full bg-white/5 border border-white/10 p-3 focus:border-[#00D4FF] focus:outline-none">
                            <option>{{ __("Sélectionnez") }}</option>
                            <option>{{ __("Photographie Sportive") }}</option>
                            <option>{{ __("Événementiel / Mariage") }}</option>
                            <option>{{ __("Studio & Portrait") }}</option>
                            <option>{{ __("Nature & Paysages") }}</option>
                            <option>{{ __("Voyage & Reportage") }}</option>
                            <option>{{ __("Autre") }}</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm mb-2">{{ __("Votre message") }} *</label>
                        <textarea rows="6" 
                                  class="w-full bg-white/5 border border-white/10 p-3 focus:border-[#00D4FF] focus:outline-none"
                                  placeholder="{{ __('Décrivez votre projet, vos attentes, la date prévue...') }}"></textarea>
                    </div>

                    <button type="submit" 
                            class="w-full py-4 bg-gradient-to-r from-[#00D4FF] to-[#FF00E5] font-oswald uppercase tracking-widest hover:opacity-90 transition-opacity">
                        {{ __("Envoyer le message") }}
                    </button>
                </form>
            </div>

            <!-- Informations de contact -->
            <div>
                <h2 class="font-oswald text-3xl mb-8">{{ __("Coordonnées") }}</h2>
                
                <div class="space-y-8">
                    <!-- Email -->
                    <div class="flex items-start gap-4">
                        <div class="w-12 h-12 bg-[#00D4FF]/10 rounded-full flex items-center justify-center">
                            <svg class="w-6 h-6 text-[#00D4FF]" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-oswald text-xl mb-1">{{ __("Email") }}</h3>
                            <a href="mailto:contact@oriolaobs.com" class="text-[#00D4FF] hover:underline">
                                contact@oriolaobs.com
                            </a>
                            <p class="text-sm text-gray-400 mt-1">{{ __("Réponse sous 24h") }}</p>
                        </div>
                    </div>

                    <!-- Téléphone -->
                    <div class="flex items-start gap-4">
                        <div class="w-12 h-12 bg-[#25D366]/10 rounded-full flex items-center justify-center">
                            <svg class="w-6 h-6 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.76.982.998-3.675-.236-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.9 6.994c-.004 5.45-4.438 9.88-9.888 9.88m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.333.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.333 11.893-11.893 0-3.18-1.24-6.162-3.495-8.411"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-oswald text-xl mb-1">{{ __("WhatsApp") }}</h3>
                            <a href="https://wa.me/22995919295" target="_blank" rel="noopener noreferrer" class="text-[#25D366] hover:underline">
                                +229 95 91 92 95
                            </a>
                            <p class="text-sm text-gray-400 mt-1">{{ __("Assistance WhatsApp 24h/24, 7j/7") }}</p>
                        </div>
                    </div>

                    <!-- Localisation -->
                    <div class="flex items-start gap-4">
                        <div class="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-oswald text-xl mb-1">{{ __("Studio") }}</h3>
                            <p class="text-white">{{ __("Calavi Parana") }}</p>
                            <p class="text-sm text-gray-400 mt-1">{{ __("à 100 mètre de l’école Blingue devant l’église catholique Bon Pasteur") }}</p>
                        </div>
                    </div>
                </div>

                <!-- FAQ -->
                <div class="mt-12 pt-8 border-t border-white/10">
                    <h3 class="font-oswald text-2xl mb-6">{{ __("Questions fréquentes") }}</h3>
                    
                    <div class="space-y-4">
                        <div>
                            <p class="font-medium mb-1">{{ __("Quels sont vos tarifs ?") }}</p>
                            <p class="text-sm text-gray-400">{{ __("Les tarifs varient selon le type de projet et sa durée. Je propose des devis personnalisés après discussion.") }}</p>
                        </div>
                        
                        <div>
                            <p class="font-medium mb-1">{{ __("Dans quelles villes travaillez-vous ?") }}</p>
                            <p class="text-sm text-gray-400">{{ __("Je suis basé à Cotonou mais je me déplace dans toute l'Afrique et à l'international selon les projets.") }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection