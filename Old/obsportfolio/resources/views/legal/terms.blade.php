@extends('layouts.app')

@section('title', __('Conditions d\'Utilisation | Ori Ola OBS Photography'))

@section('content')
<div class="min-h-screen bg-black text-white pt-24 pb-16">
    <div class="container mx-auto px-4 max-w-4xl">
        <!-- Header -->
        <div class="text-center mb-16">
            <div class="inline-block mb-8">
                <div class="w-24 h-1 bg-gradient-to-r from-[#FF00E5] to-[#00D4FF] mx-auto mb-6"></div>
                <span class="text-[#00D4FF] text-sm uppercase tracking-widest font-bold">{{ __("RÈGLES D'UTILISATION") }}</span>
            </div>
            
            <h1 class="font-oswald text-5xl md:text-6xl lg:text-7xl uppercase leading-none mb-8 tracking-tighter">
                <span class="block text-white">{{ __("CONDITIONS") }}</span>
                <span class="block text-[#FF00E5]">{{ __("D'UTILISATION") }}</span>
            </h1>
            
            <p class="text-xl text-gray-300 max-w-3xl mx-auto">
                {{ __("Les règles régissant l'utilisation de notre site web et de nos services.") }}
            </p>
        </div>

        <!-- Introduction -->
        <div class="mb-16 gsap-reveal">
            <div class="bg-gradient-to-r from-[#080808] to-black border border-white/10 p-8 rounded-sm">
                <div class="flex items-start gap-4">
                    <div class="text-4xl text-[#FF00E5]">⚠️</div>
                    <div>
                        <h3 class="font-oswald text-2xl mb-4">{{ __("Attention importante") }}</h3>
                        <p class="text-gray-300">
                            {{ __("En accédant et en utilisant ce site web, vous acceptez sans réserve les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser ce site.") }}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="space-y-12">
            <!-- Objet -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#00D4FF] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#00D4FF]">{{ __("1. Objet") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-4">
                    <p class="text-gray-300">
                        {{ __("Le site www.oriolaobs-photo.com a pour objet :") }}
                    </p>
                    
                    <ul class="list-disc pl-6 space-y-3 text-gray-300">
                        <li>{{ __("Présenter le travail et l'artistique de Ori Ola OBS Photography") }}</li>
                        <li>{{ __("Permettre aux visiteurs de découvrir les services photographiques proposés") }}</li>
                        <li>{{ __("Faciliter la prise de contact pour des projets photographiques") }}</li>
                        <li>{{ __("Partager des informations sur la photographie et l'art visuel") }}</li>
                        <li>{{ __("Promouvoir les œuvres et réalisations de l'artiste") }}</li>
                    </ul>
                </div>
            </section>

            <!-- Accès au site -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#FF00E5] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#FF00E5]">{{ __("2. Accès au site") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-6">
                    <p class="text-gray-300">
                        {{ __("Le site est accessible gratuitement depuis tout endroit par tout utilisateur disposant d'un accès à Internet. Tous les frais afférents à l'accès au site (matériel informatique, logiciels, connexion Internet, etc.) sont à la charge de l'utilisateur.") }}
                    </p>
                    
                    <div class="p-6 border border-white/10 bg-black/50 rounded-sm">
                        <h4 class="font-oswald text-lg mb-3 text-white">{{ __("Maintenance et interruption") }}</h4>
                        <p class="text-gray-300 text-sm">
                            {{ __("L'accès au site peut être interrompu pour maintenance technique, mises à jour ou pour toute autre raison. Ori Ola OBS Photography ne saurait être tenu responsable des interruptions d'accès.") }}
                        </p>
                    </div>
                </div>
            </section>

            <!-- Utilisation autorisée -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#00D4FF] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#00D4FF]">{{ __("3. Utilisation autorisée") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-6">
                    <p class="text-gray-300">
                        {{ __("Vous êtes autorisé à :") }}
                    </p>
                    
                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="p-6 border border-[#00FF88]/20 rounded-sm">
                            <div class="flex items-center gap-4 mb-4">
                                <div class="text-3xl text-[#00FF88]">✅</div>
                                <h4 class="font-oswald text-lg">{{ __("Navigation") }}</h4>
                            </div>
                            <p class="text-sm text-gray-300">
                                {{ __("Consulter les contenus et portfolios") }}
                            </p>
                        </div>
                        
                        <div class="p-6 border border-[#00D4FF]/20 rounded-sm">
                            <div class="flex items-center gap-4 mb-4">
                                <div class="text-3xl text-[#00D4FF]">✅</div>
                                <h4 class="font-oswald text-lg">{{ __("Contact") }}</h4>
                            </div>
                            <p class="text-sm text-gray-300">
                                {{ __("Utiliser les formulaires de contact") }}
                            </p>
                        </div>
                        
                        <div class="p-6 border border-white/20 rounded-sm">
                            <div class="flex items-center gap-4 mb-4">
                                <div class="text-3xl text-white">✅</div>
                                <h4 class="font-oswald text-lg">{{ __("Partage") }}</h4>
                            </div>
                            <p class="text-sm text-gray-300">
                                {{ __("Partager les liens via réseaux sociaux") }}
                            </p>
                        </div>
                        
                        <div class="p-6 border border-[#FFA500]/20 rounded-sm">
                            <div class="flex items-center gap-4 mb-4">
                                <div class="text-3xl text-[#FFA500]">✅</div>
                                <h4 class="font-oswald text-lg">{{ __("Information") }}</h4>
                            </div>
                            <p class="text-sm text-gray-300">
                                {{ __("S'informer sur les services proposés") }}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Utilisation interdite -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#FF00E5] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#FF00E5]">{{ __("4. Utilisation interdite") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-6">
                    <p class="text-gray-300">
                        {{ __("Il est strictement interdit de :") }}
                    </p>
                    
                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="p-6 border border-red-500/20 bg-red-500/5 rounded-sm">
                            <div class="flex items-center gap-4 mb-4">
                                <div class="text-3xl text-red-500">🚫</div>
                                <h4 class="font-oswald text-lg text-red-400">{{ __("Copie") }}</h4>
                            </div>
                            <p class="text-sm text-gray-300">
                                {{ __("Copier ou reproduire les photographies sans autorisation") }}
                            </p>
                        </div>
                        
                        <div class="p-6 border border-red-500/20 bg-red-500/5 rounded-sm">
                            <div class="flex items-center gap-4 mb-4">
                                <div class="text-3xl text-red-500">🚫</div>
                                <h4 class="font-oswald text-lg text-red-400">{{ __("Modification") }}</h4>
                            </div>
                            <p class="text-sm text-gray-300">
                                {{ __("Modifier ou altérer les contenus du site") }}
                            </p>
                        </div>
                        
                        <div class="p-6 border border-red-500/20 bg-red-500/5 rounded-sm">
                            <div class="flex items-center gap-4 mb-4">
                                <div class="text-3xl text-red-500">🚫</div>
                                <h4 class="font-oswald text-lg text-red-400">{{ __("Usage commercial") }}</h4>
                            </div>
                            <p class="text-sm text-gray-300">
                                {{ __("Utiliser les contenus à des fins commerciales") }}
                            </p>
                        </div>
                        
                        <div class="p-6 border border-red-500/20 bg-red-500/5 rounded-sm">
                            <div class="flex items-center gap-4 mb-4">
                                <div class="text-3xl text-red-500">🚫</div>
                                <h4 class="font-oswald text-lg text-red-400">{{ __("Piratage") }}</h4>
                            </div>
                            <p class="text-sm text-gray-300">
                                {{ __("Tenter d'accéder aux zones restreintes") }}
                            </p>
                        </div>
                    </div>
                    
                    <div class="mt-6 p-6 border border-red-500/30 bg-red-500/10 rounded-sm">
                        <h4 class="font-oswald text-lg mb-3 text-red-400">{{ __("Sanctions") }}</h4>
                        <p class="text-gray-300 text-sm">
                            {{ __("Toute utilisation non autorisée pourra entraîner des poursuites judiciaires et des dommages-intérêts.") }}
                        </p>
                    </div>
                </div>
            </section>

            <!-- Propriété intellectuelle -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#00D4FF] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#00D4FF]">{{ __("5. Propriété intellectuelle") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-6">
                    <div class="space-y-4">
                        <h4 class="font-oswald text-xl text-white">{{ __("Tous droits réservés") }}</h4>
                        <p class="text-gray-300">
                            {{ __("L'ensemble du contenu de ce site (textes, images, photographies, logos, vidéos, sons, etc.) est protégé par le droit d'auteur et autres droits de propriété intellectuelle.") }}
                        </p>
                    </div>
                    
                    <div class="grid md:grid-cols-3 gap-6">
                        <div class="p-6 border border-white/10 rounded-sm">
                            <div class="text-3xl text-[#FF00E5] mb-4">📸</div>
                            <h4 class="font-oswald text-lg mb-2">{{ __("Photographies") }}</h4>
                            <p class="text-sm text-gray-300">
                                {{ __("Protégées par le droit d'auteur. Toute reproduction interdite.") }}
                            </p>
                        </div>
                        
                        <div class="p-6 border border-white/10 rounded-sm">
                            <div class="text-3xl text-[#00D4FF] mb-4">🎨</div>
                            <h4 class="font-oswald text-lg mb-2">{{ __("Design") }}</h4>
                            <p class="text-sm text-gray-300">
                                {{ __("Concept unique protégé. Inspirations interdites.") }}
                            </p>
                        </div>
                        
                        <div class="p-6 border border-white/10 rounded-sm">
                            <div class="text-3xl text-[#00FF88] mb-4">✍️</div>
                            <h4 class="font-oswald text-lg mb-2">{{ __("Textes") }}</h4>
                            <p class="text-sm text-gray-300">
                                {{ __("Contenus originaux. Citation avec attribution obligatoire.") }}
                            </p>
                        </div>
                    </div>
                    
                    <div class="p-6 border border-[#00D4FF]/30 bg-[#00D4FF]/5 rounded-sm">
                        <h4 class="font-oswald text-lg mb-3 text-[#00D4FF]">{{ __("Demande d'autorisation") }}</h4>
                        <p class="text-gray-300 text-sm">
                            {{ __("Pour toute demande d'utilisation des contenus, contactez-nous à : licensing@oriolaobs-photo.com") }}
                        </p>
                    </div>
                </div>
            </section>

            <!-- Limitation de responsabilité -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#FF00E5] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#FF00E5]">{{ __("6. Limitation de responsabilité") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-6">
                    <div class="space-y-4">
                        <h4 class="font-oswald text-xl text-white">{{ __("Informations fournies") }}</h4>
                        <p class="text-gray-300">
                            {{ __("Les informations présentées sur le site sont fournies à titre indicatif. Ori Ola OBS Photography s'efforce de maintenir les informations à jour, mais ne garantit pas leur exactitude, exhaustivité ou actualité.") }}
                        </p>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="p-6 border border-white/10 rounded-sm">
                            <div class="text-3xl text-yellow-500 mb-4">⚠️</div>
                            <h4 class="font-oswald text-lg mb-2">{{ __("Disponibilité") }}</h4>
                            <p class="text-sm text-gray-300">
                                {{ __("Nous ne garantissons pas l'accès continu au site.") }}
                            </p>
                        </div>
                        
                        <div class="p-6 border border-white/10 rounded-sm">
                            <div class="text-3xl text-yellow-500 mb-4">⚠️</div>
                            <h4 class="font-oswald text-lg mb-2">{{ __("Sécurité") }}</h4>
                            <p class="text-sm text-gray-300">
                                {{ __("Nous prenons des mesures mais ne garantissons pas une sécurité absolue.") }}
                            </p>
                        </div>
                    </div>
                    
                    <div class="p-6 border border-yellow-500/30 bg-yellow-500/5 rounded-sm">
                        <h4 class="font-oswald text-lg mb-3 text-yellow-400">{{ __("Exclusion de garantie") }}</h4>
                        <p class="text-gray-300 text-sm">
                            {{ __("Le site est fourni 'en l'état', sans garantie d'aucune sorte, expresse ou implicite.") }}
                        </p>
                    </div>
                </div>
            </section>

            <!-- Liens hypertextes -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#00D4FF] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#00D4FF]">{{ __("7. Liens hypertextes") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-6">
                    <div class="space-y-4">
                        <h4 class="font-oswald text-xl text-white">{{ __("Liens sortants") }}</h4>
                        <p class="text-gray-300">
                            {{ __("Ce site peut contenir des liens vers d'autres sites. Ori Ola OBS Photography n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu, leur politique de confidentialité ou leurs pratiques.") }}
                        </p>
                    </div>
                    
                    <div class="space-y-4">
                        <h4 class="font-oswald text-xl text-white">{{ __("Liens entrants") }}</h4>
                        <p class="text-gray-300">
                            {{ __("La création de liens vers ce site est autorisée, à condition que :") }}
                        </p>
                        
                        <ul class="list-disc pl-6 space-y-2 text-gray-300">
                            <li>{{ __("Le lien ne suggère pas un partenariat ou approbation") }}</li>
                            <li>{{ __("Le site liant ne contient pas de contenu illégal ou offensant") }}</li>
                            <li>{{ __("Le lien est réalisé de manière équitable et légitime") }}</li>
                        </ul>
                    </div>
                </div>
            </section>

            <!-- Modification des conditions -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#FF00E5] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#FF00E5]">{{ __("8. Modification des conditions") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-6">
                    <p class="text-gray-300">
                        {{ __("Ori Ola OBS Photography se réserve le droit de modifier à tout moment les présentes conditions d'utilisation. Les modifications prendront effet dès leur publication sur le site.") }}
                    </p>
                    
                    <div class="p-6 border border-[#FF00E5]/30 bg-[#FF00E5]/5 rounded-sm">
                        <h4 class="font-oswald text-lg mb-3 text-[#FF00E5]">{{ __("Votre responsabilité") }}</h4>
                        <p class="text-gray-300 text-sm">
                            {{ __("Il vous incombe de consulter régulièrement ces conditions. Votre utilisation continue du site après modification constitue votre acceptation des nouvelles conditions.") }}
                        </p>
                    </div>
                </div>
            </section>

            <!-- Droit applicable -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#00D4FF] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#00D4FF]">{{ __("9. Droit applicable") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-6">
                    <div class="space-y-4">
                        <h4 class="font-oswald text-xl text-white">{{ __("Loi applicable") }}</h4>
                        <p class="text-gray-300">
                            {{ __("Les présentes conditions d'utilisation sont régies par le droit béninois. Tout litige relatif à l'utilisation du site sera soumis à la compétence exclusive des tribunaux de Cotonou.") }}
                        </p>
                    </div>
                    
                    <div class="space-y-4">
                        <h4 class="font-oswald text-xl text-white">{{ __("Langue") }}</h4>
                        <p class="text-gray-300">
                            {{ __("En cas de divergence entre la version française et une version traduite des présentes conditions, la version française prévaudra.") }}
                        </p>
                    </div>
                    
                    <div class="grid md:grid-cols-3 gap-4">
                        <div class="text-center p-4 border border-white/10 rounded-sm">
                            <div class="text-2xl mb-2">🇧🇯</div>
                            <p class="text-sm">{{ __("Droit béninois") }}</p>
                        </div>
                        <div class="text-center p-4 border border-white/10 rounded-sm">
                            <div class="text-2xl mb-2">🏛️</div>
                            <p class="text-sm">{{ __("Tribunaux de Cotonou") }}</p>
                        </div>
                        <div class="text-center p-4 border border-white/10 rounded-sm">
                            <div class="text-2xl mb-2">🇫🇷</div>
                            <p class="text-sm">{{ __("Langue française") }}</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Contact -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#FF00E5] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#FF00E5]">{{ __("10. Contact") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm">
                    <div class="text-center">
                        <div class="text-5xl text-[#00D4FF] mb-6">📞</div>
                        <h3 class="font-oswald text-2xl mb-4">{{ __("Questions sur ces conditions ?") }}</h3>
                        <p class="text-gray-300 mb-6">
                            {{ __("Contactez-nous pour toute question concernant ces conditions d'utilisation.") }}
                        </p>
                        <a href="mailto:legal@oriolaobs-photo.com" 
                           class="inline-block px-8 py-3 bg-gradient-to-r from-[#00D4FF] to-[#FF00E5] font-oswald uppercase tracking-widest hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all duration-300">
                            {{ __("Nous contacter") }}
                        </a>
                    </div>
                </div>
            </section>
        </div>

        <!-- Avertissement final -->
        <div class="mt-16 p-8 border-2 border-yellow-500/30 bg-yellow-500/5 rounded-sm gsap-reveal">
            <div class="flex items-start gap-4">
                <div class="text-3xl text-yellow-500">ℹ️</div>
                <div>
                    <h3 class="font-oswald text-xl mb-3 text-yellow-400">{{ __("Information importante") }}</h3>
                    <p class="text-gray-300">
                        {{ __("Ces conditions d'utilisation sont complémentaires aux mentions légales et à la politique de confidentialité. Nous vous invitons à les consulter également.") }}
                    </p>
                    <div class="flex flex-wrap gap-4 mt-4">
                        <a href="{{ route('legal.mentions') }}" 
                           class="text-sm text-[#00D4FF] hover:underline">{{ __("Mentions légales") }}</a>
                        <a href="{{ route('legal.privacy') }}" 
                           class="text-sm text-[#FF00E5] hover:underline">{{ __("Politique de confidentialité") }}</a>
                    </div>
                </div>
            </div>
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
    .gsap-reveal:nth-child(9) { animation-delay: 0.9s; }
    .gsap-reveal:nth-child(10) { animation-delay: 1s; }
    .gsap-reveal:nth-child(11) { animation-delay: 1.1s; }
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
        
        // Animation des cartes d'utilisation
        const useCards = document.querySelectorAll('.p-6.border');
        useCards.forEach((card, index) => {
            card.addEventListener('mouseenter', () => {
                gsap.to(card, {
                    scale: 1.02,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });
            
            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    scale: 1,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });
        });
    });
</script>
@endpush