@extends('layouts.app')

@section('title', __('Mentions Légales | Ori Ola OBS Photography'))

@section('content')
<div class="min-h-screen bg-black text-white pt-24 pb-16">
    <div class="container mx-auto px-4 max-w-4xl">
        <!-- Header -->
        <div class="text-center mb-16">
            <div class="inline-block mb-8">
                <div class="w-24 h-1 bg-gradient-to-r from-[#FF00E5] to-[#00D4FF] mx-auto mb-6"></div>
                <span class="text-[#00D4FF] text-sm uppercase tracking-widest font-bold">{{ __("INFORMATIONS LÉGALES") }}</span>
            </div>
            
            <h1 class="font-oswald text-5xl md:text-6xl lg:text-7xl uppercase leading-none mb-8 tracking-tighter">
                <span class="block text-white">{{ __("MENTIONS") }}</span>
                <span class="block text-[#FF00E5]">{{ __("LÉGALES") }}</span>
            </h1>
            
            <p class="text-xl text-gray-300 max-w-3xl mx-auto">
                {{ __("Conformément aux dispositions légales, voici les informations relatives à ce site web.") }}
            </p>
        </div>

        <!-- Content -->
        <div class="space-y-12">
            <!-- Éditeur du site -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#00D4FF] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#00D4FF]">{{ __("Éditeur du site") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-4">
                    <p><strong>{{ __("Nom :") }}</strong> Ori Ola OBS Photography</p>
                    <p><strong>{{ __("Statut :") }}</strong> {{ __("Entreprise Individuelle") }}</p>
                    <p><strong>{{ __("Siège social :") }}</strong> Cotonou, Bénin</p>
                    <p><strong>{{ __("Email :") }}</strong> contact@oriolaobs-photo.com</p>
                    <p><strong>{{ __("Téléphone :") }}</strong> +229 XX XX XX XX</p>
                    <p><strong>{{ __("Directeur de la publication :") }}</strong> Ori Ola</p>
                    <p><strong>{{ __("SIRET :") }}</strong> XXX XXX XXX XXXXX</p>
                </div>
            </section>

            <!-- Hébergement -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#FF00E5] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#FF00E5]">{{ __("Hébergement") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-4">
                    <p><strong>{{ __("Hébergeur :") }}</strong> DigitalOcean, LLC</p>
                    <p><strong>{{ __("Adresse :") }}</strong> 101 Avenue of the Americas, 10th Floor, New York, NY 10013, USA</p>
                    <p><strong>{{ __("Site web :") }}</strong> www.digitalocean.com</p>
                    <p><strong>{{ __("Téléphone :") }}</strong> +1 347-903-7918</p>
                </div>
            </section>

            <!-- Propriété intellectuelle -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#00D4FF] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#00D4FF]">{{ __("Propriété intellectuelle") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-6">
                    <p class="text-gray-300">
                        {{ __("L'ensemble du contenu de ce site (textes, images, photographies, logos, icônes, sons, vidéos, etc.) est la propriété exclusive de Ori Ola OBS Photography, sauf indication contraire.") }}
                    </p>
                    
                    <p class="text-gray-300">
                        {{ __("Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de Ori Ola OBS Photography.") }}
                    </p>
                    
                    <p class="text-gray-300">
                        {{ __("Les photographies présentées sur ce site sont protégées par le droit d'auteur. Toute utilisation non autorisée est constitutive de contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.") }}
                    </p>
                </div>
            </section>

            <!-- Données personnelles -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#FF00E5] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#FF00E5]">{{ __("Données personnelles") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-6">
                    <p class="text-gray-300">
                        {{ __("Conformément à la loi n° 2017-20 du 20 avril 2017 portant code du numérique en République du Bénin et au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants concernant vos données personnelles :") }}
                    </p>
                    
                    <ul class="list-disc pl-6 space-y-3 text-gray-300">
                        <li>{{ __("Droit d'accès à vos données") }}</li>
                        <li>{{ __("Droit de rectification") }}</li>
                        <li>{{ __("Droit à l'effacement ('droit à l'oubli')") }}</li>
                        <li>{{ __("Droit à la limitation du traitement") }}</li>
                        <li>{{ __("Droit à la portabilité des données") }}</li>
                        <li>{{ __("Droit d'opposition") }}</li>
                    </ul>
                    
                    <p class="text-gray-300">
                        {{ __("Pour exercer ces droits, vous pouvez nous contacter à l'adresse email : privacy@oriolaobs-photo.com") }}
                    </p>
                </div>
            </section>

            <!-- Cookies -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#00D4FF] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#00D4FF]">{{ __("Cookies") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-6">
                    <p class="text-gray-300">
                        {{ __("Ce site utilise des cookies pour améliorer l'expérience utilisateur et analyser le trafic. Les cookies sont de petits fichiers texte stockés sur votre appareil.") }}
                    </p>
                    
                    <div class="space-y-4">
                        <h4 class="font-oswald text-xl text-white">{{ __("Types de cookies utilisés :") }}</h4>
                        <ul class="list-disc pl-6 space-y-2 text-gray-300">
                            <li><strong>{{ __("Cookies essentiels :") }}</strong> {{ __("nécessaires au fonctionnement du site") }}</li>
                            <li><strong>{{ __("Cookies analytiques :") }}</strong> {{ __("pour comprendre comment les visiteurs utilisent le site") }}</li>
                            <li><strong>{{ __("Cookies de préférences :") }}</strong> {{ __("pour mémoriser vos choix") }}</li>
                        </ul>
                    </div>
                    
                    <p class="text-gray-300">
                        {{ __("Vous pouvez configurer votre navigateur pour refuser les cookies. Cependant, certaines fonctionnalités du site pourraient ne pas fonctionner correctement.") }}
                    </p>
                </div>
            </section>

            <!-- Responsabilité -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#FF00E5] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#FF00E5]">{{ __("Limitation de responsabilité") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-6">
                    <p class="text-gray-300">
                        {{ __("Ori Ola OBS Photography ne saurait être tenu responsable des dommages directs ou indirects causés au matériel de l'utilisateur lors de l'accès au site.") }}
                    </p>
                    
                    <p class="text-gray-300">
                        {{ __("Les informations fournies sur le site sont données à titre indicatif et sont susceptibles d'évoluer. Par ailleurs, les informations figurant sur le site ne sont pas exhaustives.") }}
                    </p>
                    
                    <p class="text-gray-300">
                        {{ __("Le site peut contenir des liens vers d'autres sites. Ori Ola OBS Photography n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.") }}
                    </p>
                </div>
            </section>

            <!-- Droit applicable -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#00D4FF] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#00D4FF]">{{ __("Droit applicable") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-6">
                    <p class="text-gray-300">
                        {{ __("Les présentes mentions légales sont régies par le droit béninois. Tout litige relatif à l'utilisation du site sera de la compétence exclusive des tribunaux de Cotonou.") }}
                    </p>
                    
                    <p class="text-gray-300">
                        {{ __("En cas de divergence entre la version française et une version traduite des présentes mentions légales, la version française prévaudra.") }}
                    </p>
                </div>
            </section>

            <!-- Mise à jour -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#FF00E5] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#FF00E5]">{{ __("Mise à jour") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm">
                    <p class="text-gray-300">
                        {{ __("Ces mentions légales sont susceptibles d'être modifiées à tout moment. Nous vous invitons à les consulter régulièrement.") }}
                    </p>
                    <p class="text-gray-300 mt-4">
                        <strong>{{ __("Dernière mise à jour :") }}</strong> {{ date('d/m/Y') }}
                    </p>
                </div>
            </section>
        </div>

        <!-- Contact pour questions légales -->
        <div class="text-center mt-16 p-8 border border-white/10 rounded-sm gsap-reveal">
            <h3 class="font-oswald text-2xl mb-4">{{ __("Questions légales ?") }}</h3>
            <p class="text-gray-300 mb-6">
                {{ __("Pour toute question concernant ces mentions légales, contactez-nous :") }}
            </p>
            <a href="mailto:legal@oriolaobs-photo.com" 
               class="inline-block px-6 py-3 border-2 border-[#00D4FF] text-[#00D4FF] font-oswald uppercase tracking-widest hover:bg-[#00D4FF]/10 transition-all duration-300">
                {{ __("Contact légal") }}
            </a>
        </div>
    </div>
</div>
@endsection

@push('styles')
<style>
    .gsap-reveal:nth-child(1) { animation-delay: 0.1s; }
    .gsap-reveal:nth-child(2) { animation-delay: 0.2s; }
    .gsap-reveal:nth-child(3) { animation-delay: 0.3s; }
    .gsap-reveal:nth-child(4) { animation-delay: 0.4s; }
    .gsap-reveal:nth-child(5) { animation-delay: 0.5s; }
    .gsap-reveal:nth-child(6) { animation-delay: 0.6s; }
    .gsap-reveal:nth-child(7) { animation-delay: 0.7s; }
    .gsap-reveal:nth-child(8) { animation-delay: 0.8s; }
</style>
@endpush

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        gsap.registerPlugin(ScrollTrigger);

        const revealElements = document.querySelectorAll('.gsap-reveal');
        revealElements.forEach((el, index) => {
            gsap.fromTo(el, {
                y: 40,
                opacity: 0
            }, {
                y: 0,
                opacity: 1,
                duration: 0.6,
                ease: "power3.out",
                delay: index * 0.1,
                scrollTrigger: {
                    trigger: el,
                    start: "top 85%",
                    toggleActions: "play none none none"
                }
            });
        });
    });
</script>
@endpush