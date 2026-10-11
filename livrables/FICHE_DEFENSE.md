# Fiche de défense : Hold up (Track 1, Fintech Security)

**Menace.** Tout service peut être compromis : site, contrat, interface détournée. Camille veut échanger 50 USDC ; on lui demande un droit de dépense illimité, ou une signature « de connexion » qui accorde un droit. Son portefeuille affiche la demande sans alerte propre si l'adresse n'est pas listée comme malveillante (code public de MetaMask, non observé à l'écran).
**Réponse.** Hold up est une couche indépendante, pensée pour se poser devant le portefeuille existant. Étage un : Camille écrit ce qu'elle veut faire, du code lit montant, jeton et adresse dans la demande, et répond « Ça correspond » (le portefeuille s'ouvre seul après une seconde), « Ça ne correspond pas » (alerte, Annuler visible) ou « Je n'ai pas pu vérifier ». Étage deux : un plancher de règles qui ne dépend pas de sa phrase.

**NIST CSF 2.0.** Detect : DE.AE-02, DE.AE-07, DE.CM-09. Respond : RS.MI-01, au sens large. Trace : PR.PS-04, RS.AN-06. Secondaire : PR.AA-05 (moindre privilège). **ATT&CK.** T1657, T1566, T1204, T1684.001, T1070. Détail : `livrables/MAPPING_REFERENTIELS.md`.

**Métriques** (source unique : `livrables/CHIFFRES.md`).

| Mesure | Jeu | Valeur |
|---|---|---|
| Écarts « j'ai écrit X, la demande donne Y » | 410 cas écrits par nous | 228 sur 228 signalés ; 0 fausse alerte rouge sur 166 jumeaux. Test de couverture |
| Phrase contre demande, code seul | Contrôle scellé de 1 079 paires, même auteur que les règles | 86,6 % attrapés [83,1 ; 89,4] ; 7,7 % de fausses alertes |
| Idem, un modèle classe et le code compare | idem | 86,6 % ; 1,3 % ; modèle seul juge : 64,4 % |
| Conditions produit | 3 254 arnaques, 2 136 honnêtes (synthétiques) | rappel rouge 71,3 % ; honnêtes en rouge 13,9 % ; avec au moins un avertissement 54,2 % |
| Trafic réel Avalanche | 6 325 transactions, légitime présumé | 19 rouges (0,30 %) ; 76,84 % d'avertissements, 95,8 % d'opacité |
| Temps de verdict local | 400 requêtes, sans réseau | médiane 32,31 ms, p95 47,33 ms (varie) |

**Réponse et temps.** L'alerte s'affiche avant le portefeuille. Appel à Clef-flash (relais seulement) : p50 369 ms, p95 1 083 ms. Temps de décision de personnes réelles : à mesurer. Aucun verdict vert.

**Où va la phrase.** Build autonome : nulle part, aucun accès réseau, lecture par mots-clés. Avec le relais Clef branché : vers un modèle hébergé ; minimisation et durée de conservation non rédigées. Montants et adresses sont lus par du code.

**À mesurer.** Jeu aveugle de 250 cas (autre auteur, hash publié) ; contrôle par un autre auteur que le nôtre ; essai avec un vrai portefeuille ; détection sur Fuji ; compréhension par des personnes.

**Limites.** Fraude voulue, intention vague, contrat qui change à l'exécution, Ledger direct : hors périmètre. Une signature ne peut pas être limitée, on le dit. Fausses alertes élevées : limite principale. Cas et règles écrits par nous. Jamais essayé avec un vrai portefeuille ; démo sur chaîne locale, Fuji non déployé. Une revue de sécurité interne a trouvé des contournements possibles dont un critique : corrections en cours, nous ne disons pas « sécurisé ». Journal : la version autonome garde 500 lignes locales non chaînées ; le journal chaîné par hachage (ligne modifiée ou retirée détectée, pas une réécriture complète sans ancrage) est celui de la version serveur. Hold up alerte et laisse décider ; aucune conformité déclarée (`livrables/SLIDE_CONFORMITE.md`).
