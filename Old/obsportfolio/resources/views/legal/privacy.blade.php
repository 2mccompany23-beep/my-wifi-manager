@extends('layouts.app')

@section('title', __('Politique de Confidentialité | Ori Ola OBS Photography'))

@section('content')
<div class="min-h-screen bg-black text-white pt-24 pb-16">
    <div class="container mx-auto px-4 max-w-4xl">
        <!-- Header -->
        <div class="text-center mb-16">
            <div class="inline-block mb-8">
                <div class="w-24 h-1 bg-gradient-to-r from-[#00D4FF] to-[#FF00E5] mx-auto mb-6"></div>
                <span class="text-[#FF00E5] text-sm uppercase tracking-widest font-bold">{{ __("PROTECTION DES DONNÉES") }}</span>
            </div>
            
            <h1 class="font-oswald text-5xl md:text-6xl lg:text-7xl uppercase leading-none mb-8 tracking-tighter">
                <span class="block text-white">{{ __("POLITIQUE DE") }}</span>
                <span class="block text-[#00D4FF]">{{ __("CONFIDENTIALITÉ") }}</span>
            </h1>
            
            <p class="text-xl text-gray-300 max-w-3xl mx-auto">
                {{ __("Comment nous protégeons et utilisons vos données personnelles.") }}
            </p>
        </div>

        <!-- Introduction -->
        <div class="mb-16 gsap-reveal">
            <div class="bg-gradient-to-r from-[#080808] to-black border-l-4 border-[#00D4FF] pl-6 py-6">
                <p class="text-lg text-gray-300">
                    {{ __("Chez Ori Ola OBS Photography, nous prenons très au sérieux la protection de vos données personnelles. Cette politique explique comment nous collectons, utilisons et protégeons vos informations.") }}
                </p>
                <p class="text-lg text-gray-300 mt-4">
                    {{ __("En utilisant notre site, vous acceptez les pratiques décrites dans cette politique.") }}
                </p>
            </div>
        </div>

        <!-- Content -->
        <div class="space-y-12">
            <!-- Données collectées -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#00D4FF] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#00D4FF]">{{ __("1. Données que nous collectons") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-6">
                    <div class="space-y-4">
                        <h4 class="font-oswald text-xl text-white">{{ __("Données fournies volontairement :") }}</h4>
                        <ul class="list-disc pl-6 space-y-2 text-gray-300">
                            <li>{{ __("Nom, prénom") }}</li>
                            <li>{{ __("Adresse email") }}</li>
                            <li>{{ __("Numéro de téléphone") }}</li>
                            <li>{{ __("Message dans le formulaire de contact") }}</li>
                            <li>{{ __("Préférences pour un projet photographique") }}</li>
                        </ul>
                    </div>
                    
                    <div class="space-y-4">
                        <h4 class="font-oswald text-xl text-white">{{ __("Données collectées automatiquement :") }}</h4>
                        <ul class="list-disc pl-6 space-y-2 text-gray-300">
                            <li>{{ __("Adresse IP") }}</li>
                            <li>{{ __("Type de navigateur et appareil") }}</li>
                            <li>{{ __("Pages visitées et temps passé") }}</li>
                            <li>{{ __("Source de provenance (réseaux sociaux, moteurs de recherche)") }}</li>
                        </ul>
                    </div>
                </div>
            </section>

            <!-- Utilisation des données -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#FF00E5] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#FF00E5]">{{ __("2. Utilisation de vos données") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-6">
                    <p class="text-gray-300">
                        {{ __("Nous utilisons vos données personnelles pour :") }}
                    </p>
                    
                    <ul class="list-disc pl-6 space-y-3 text-gray-300">
                        <li>{{ __("Répondre à vos demandes de contact") }}</li>
                        <li>{{ __("Préparer des devis pour vos projets") }}</li>
                        <li>{{ __("Gérer la relation client (contrats, factures)") }}</li>
                        <li>{{ __("Améliorer notre site et nos services") }}</li>
                        <li>{{ __("Envoyer des newsletters (avec votre consentement)") }}</li>
                        <li>{{ __("Respecter nos obligations légales") }}</li>
                    </ul>
                    
                    <div class="mt-6 p-4 bg-black/50 border border-[#00D4FF]/30 rounded-sm">
                        <p class="text-sm text-[#00D4FF]">
                            {{ __("Nous ne vendons jamais vos données personnelles à des tiers.") }}
                        </p>
                    </div>
                </div>
            </section>

            <!-- Bases légales -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#00D4FF] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#00D4FF]">{{ __("3. Bases légales du traitement") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-6">
                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="p-4 border border-white/10 rounded-sm">
                            <div class="text-[#00D4FF] text-2xl mb-3">✓</div>
                            <h4 class="font-oswald text-lg mb-2">{{ __("Consentement") }}</h4>
                            <p class="text-sm text-gray-300">
                                {{ __("Pour l'envoi de newsletters et communications marketing") }}
                            </p>
                        </div>
                        
                        <div class="p-4 border border-white/10 rounded-sm">
                            <div class="text-[#FF00E5] text-2xl mb-3">📝</div>
                            <h4 class="font-oswald text-lg mb-2">{{ __("Exécution contractuelle") }}</h4>
                            <p class="text-sm text-gray-300">
                                {{ __("Pour la réalisation des prestations photographiques commandées") }}
                            </p>
                        </div>
                        
                        <div class="p-4 border border-white/10 rounded-sm">
                            <div class="text-[#00FF88] text-2xl mb-3">⚖️</div>
                            <h4 class="font-oswald text-lg mb-2">{{ __("Obligation légale") }}</h4>
                            <p class="text-sm text-gray-300">
                                {{ __("Pour la conservation des factures et documents comptables") }}
                            </p>
                        </div>
                        
                        <div class="p-4 border border-white/10 rounded-sm">
                            <div class="text-[#FFA500] text-2xl mb-3">🎯</div>
                            <h4 class="font-oswald text-lg mb-2">{{ __("Intérêt légitime") }}</h4>
                            <p class="text-sm text-gray-300">
                                {{ __("Pour l'amélioration de nos services et la sécurité du site") }}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Partage des données -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#FF00E5] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#FF00E5]">{{ __("4. Partage des données") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-6">
                    <p class="text-gray-300">
                        {{ __("Nous pouvons partager vos données avec :") }}
                    </p>
                    
                    <div class="space-y-4">
                        <div class="p-4 border border-white/10 rounded-sm">
                            <h4 class="font-oswald text-lg text-white mb-2">{{ __("Prestataires de services") }}</h4>
                            <ul class="list-disc pl-6 space-y-1 text-gray-300 text-sm">
                                <li>{{ __("Hébergeur web") }}</li>
                                <li>{{ __("Service d'emailing") }}</li>
                                <li>{{ __("Outils analytiques (Google Analytics)") }}</li>
                            </ul>
                        </div>
                        
                        <div class="p-4 border border-white/10 rounded-sm">
                            <h4 class="font-oswald text-lg text-white mb-2">{{ __("Autorités légales") }}</h4>
                            <p class="text-gray-300 text-sm">
                                {{ __("Seulement si requis par la loi (mandat, ordonnance judiciaire)") }}
                            </p>
                        </div>
                    </div>
                    
                    <div class="mt-6 p-4 bg-black/50 border border-[#FF00E5]/30 rounded-sm">
                        <p class="text-sm text-[#FF00E5]">
                            {{ __("Tous nos prestataires sont soumis à des accords de confidentialité stricts.") }}
                        </p>
                    </div>
                </div>
            </section>

            <!-- Durée de conservation -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#00D4FF] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#00D4FF]">{{ __("5. Durée de conservation") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-6">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b border-white/20">
                                    <th class="py-3 px-4 text-left text-[#00D4FF]">{{ __("Type de données") }}</th>
                                    <th class="py-3 px-4 text-left text-[#00D4FF]">{{ __("Durée de conservation") }}</th>
                                </tr>
                            </thead>
                            <tbody class="text-gray-300">
                                <tr class="border-b border-white/10">
                                    <td class="py-3 px-4">{{ __("Données de contact") }}</td>
                                    <td class="py-3 px-4">{{ __("3 ans après le dernier contact") }}</td>
                                </tr>
                                <tr class="border-b border-white/10">
                                    <td class="py-3 px-4">{{ __("Données clients") }}</td>
                                    <td class="py-3 px-4">{{ __("10 ans (obligation légale comptable)") }}</td>
                                </tr>
                                <tr class="border-b border-white/10">
                                    <td class="py-3 px-4">{{ __("Cookies") }}</td>
                                    <td class="py-3 px-4">{{ __("13 mois maximum") }}</td>
                                </tr>
                                <tr>
                                    <td class="py-3 px-4">{{ __("Newsletter") }}</td>
                                    <td class="py-3 px-4">{{ __("Jusqu'au désabonnement") }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <!-- Vos droits -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#FF00E5] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#FF00E5]">{{ __("6. Vos droits") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm">
                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="p-6 border border-[#00D4FF]/20 rounded-sm hover:border-[#00D4FF]/40 transition-all duration-300">
                            <div class="text-[#00D4FF] text-3xl mb-4">👁️</div>
                            <h4 class="font-oswald text-lg mb-2">{{ __("Droit d'accès") }}</h4>
                            <p class="text-sm text-gray-300">
                                {{ __("Obtenir confirmation du traitement de vos données et une copie") }}
                            </p>
                        </div>
                        
                        <div class="p-6 border border-[#FF00E5]/20 rounded-sm hover:border-[#FF00E5]/40 transition-all duration-300">
                            <div class="text-[#FF00E5] text-3xl mb-4">✏️</div>
                            <h4 class="font-oswald text-lg mb-2">{{ __("Droit de rectification") }}</h4>
                            <p class="text-sm text-gray-300">
                                {{ __("Faire corriger des données inexactes ou incomplètes") }}
                            </p>
                        </div>
                        
                        <div class="p-6 border border-[#00FF88]/20 rounded-sm hover:border-[#00FF88]/40 transition-all duration-300">
                            <div class="text-[#00FF88] text-3xl mb-4">🗑️</div>
                            <h4 class="font-oswald text-lg mb-2">{{ __("Droit à l'effacement") }}</h4>
                            <p class="text-sm text-gray-300">
                                {{ __("Demander la suppression de vos données ('droit à l'oubli')") }}
                            </p>
                        </div>
                        
                        <div class="p-6 border border-[#FFA500]/20 rounded-sm hover:border-[#FFA500]/40 transition-all duration-300">
                            <div class="text-[#FFA500] text-3xl mb-4">⏸️</div>
                            <h4 class="font-oswald text-lg mb-2">{{ __("Droit à la limitation") }}</h4>
                            <p class="text-sm text-gray-300">
                                {{ __("Restreindre le traitement de vos données dans certains cas") }}
                            </p>
                        </div>
                        
                        <div class="p-6 border border-white/20 rounded-sm hover:border-white/40 transition-all duration-300">
                            <div class="text-white text-3xl mb-4">📤</div>
                            <h4 class="font-oswald text-lg mb-2">{{ __("Droit à la portabilité") }}</h4>
                            <p class="text-sm text-gray-300">
                                {{ __("Recevoir vos données dans un format structuré et lisible") }}
                            </p>
                        </div>
                        
                        <div class="p-6 border border-[#00D4FF]/20 rounded-sm hover:border-[#00D4FF]/40 transition-all duration-300">
                            <div class="text-[#00D4FF] text-3xl mb-4">🚫</div>
                            <h4 class="font-oswald text-lg mb-2">{{ __("Droit d'opposition") }}</h4>
                            <p class="text-sm text-gray-300">
                                {{ __("Vous opposer au traitement pour des raisons légitimes") }}
                            </p>
                        </div>
                    </div>
                    
                    <div class="mt-8 p-6 border border-white/10 bg-black/50 rounded-sm">
                        <h4 class="font-oswald text-xl mb-3">{{ __("Comment exercer vos droits ?") }}</h4>
                        <p class="text-gray-300 mb-4">
                            {{ __("Pour exercer vos droits, contactez-nous à :") }}
                        </p>
                        <div class="space-y-2">
                            <p><strong>{{ __("Email :") }}</strong> privacy@oriolaobs-photo.com</p>
                            <p><strong>{{ __("Courrier :") }}</strong> Ori Ola OBS Photography, Cotonou, Bénin</p>
                        </div>
                        <p class="text-sm text-gray-400 mt-4">
                            {{ __("Nous répondrons dans un délai maximum d'un mois.") }}
                        </p>
                    </div>
                </div>
            </section>

            <!-- Sécurité -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#00D4FF] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#00D4FF]">{{ __("7. Sécurité des données") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-6">
                    <p class="text-gray-300">
                        {{ __("Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre :") }}
                    </p>
                    
                    <ul class="list-disc pl-6 space-y-3 text-gray-300">
                        <li>{{ __("L'accès non autorisé") }}</li>
                        <li>{{ __("La modification ou destruction illicite") }}</li>
                        <li>{{ __("La divulgation accidentelle") }}</li>
                    </ul>
                    
                    <div class="grid md:grid-cols-3 gap-4 mt-6">
                        <div class="text-center p-4 border border-white/10 rounded-sm">
                            <div class="text-[#00FF88] text-2xl mb-2">🔒</div>
                            <p class="text-sm">{{ __("Chiffrement SSL") }}</p>
                        </div>
                        <div class="text-center p-4 border border-white/10 rounded-sm">
                            <div class="text-[#FF00E5] text-2xl mb-2">🛡️</div>
                            <p class="text-sm">{{ __("Protection contre les intrusions") }}</p>
                        </div>
                        <div class="text-center p-4 border border-white/10 rounded-sm">
                            <div class="text-[#00D4FF] text-2xl mb-2">🔑</div>
                            <p class="text-sm">{{ __("Accès restreint") }}</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Contact et réclamation -->
            <section class="gsap-reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-8 h-px bg-gradient-to-r from-[#FF00E5] to-transparent"></div>
                    <h2 class="font-oswald text-3xl text-[#FF00E5]">{{ __("8. Contact et réclamation") }}</h2>
                </div>
                
                <div class="bg-[#080808] border border-white/10 p-8 rounded-sm space-y-6">
                    <p class="text-gray-300">
                        {{ __("Si vous avez des questions concernant cette politique ou si vous souhaitez déposer une réclamation concernant le traitement de vos données :") }}
                    </p>
                    
                    <div class="space-y-4">
                        <p><strong>{{ __("Délégué à la protection des données :") }}</strong> Ori Ola</p>
                        <p><strong>{{ __("Email :") }}</strong> dpo@oriolaobs-photo.com</p>
                        <p><strong>{{ __("Téléphone :") }}</strong> +229 XX XX XX XX</p>
                    </div>
                    
                    <div class="mt-6 p-6 border border-[#FF00E5]/20 bg-black/50 rounded-sm">
                        <h4 class="font-oswald text-lg mb-3">{{ __("Droit de réclamation") }}</h4>
                        <p class="text-sm text-gray-300">
                            {{ __("Vous avez le droit de déposer une réclamation auprès de l'autorité de protection des données compétente si vous considérez que le traitement de vos données personnelles enfreint la réglementation.") }}
                        </p>
                    </div>
                </div>
            </section>
        </div>

        <!-- Mise à jour -->
        <div class="text-center mt-16 p-8 border border-white/10 rounded-sm gsap-reveal">
            <div class="flex items-center justify-center gap-4 mb-4">
                <div class="w-12 h-px bg-gradient-to-r from-transparent to-[#00D4FF]"></div>
                <span class="text-sm uppercase tracking-widest text-gray-400">{{ __("DERNIÈRE MISE À JOUR") }}</span>
                <div class="w-12 h-px bg-gradient-to-l from-transparent to-[#FF00E5]"></div>
            </div>
            <p class="text-2xl font-oswald">{{ date('d/m/Y') }}</p>
            <p class="text-gray-400 mt-2">
                {{ __("Cette politique peut être mise à jour. Consultez-la régulièrement.") }}
            </p>
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

        // Animation des cartes de droits
        const rightCards = document.querySelectorAll('.p-6.border');
        rightCards.forEach((card, index) => {
            card.addEventListener('mouseenter', () => {
                gsap.to(card, {
                    y: -5,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });
            
            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    y: 0,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });
        });
    });
</script>
@endpush