# Fiche de défense : Hold up (Track 1, Fintech Security)

**Scénario de menace.** Camille veut échanger 50 USDC. Un site, ou une interface détournée, lui demande un droit de dépense illimité présenté comme une étape normale, ou une signature « de connexion » qui accorde un droit. Le portefeuille affiche la demande sans alerte si l'adresse n'est pas listée comme malveillante. Hold up fait écrire à Camille ce qu'elle veut faire avant qu'elle voie la demande, lit le montant, le jeton et l'adresse dans la demande, et répond : « Ça correspond » (le portefeuille s'ouvre seul après une seconde) ou « Ça ne correspond pas » (alerte, Annuler visible), ou « Je n'ai pas pu vérifier ». Les signaux que le portefeuille donne déjà sont gardés. Camille garde la décision.

**NIST CSF 2.0 (vérifié, NIST CSWP 29).** Detect : DE.AE-02 (analyse de l'événement), DE.AE-07 (contexte intégré), DE.CM-09 (surveillance des données et logiciels). Respond : RS.MI-01, au sens large. Trace : PR.PS-04, RS.AN-06. Protect, fonction secondaire : PR.AA-05 (moindre privilège).
**ATT&CK (vérifié).** T1657 Financial Theft, T1566 Phishing, T1204 User Execution, T1684.001 Impersonation, T1070 Indicator Removal (journal chaîné). **D3FEND :** aucun identifiant retenu. **OWASP Agentic :** ASI01 Agent Goal Hijack par analogie, seulement si un agent détient le portefeuille. Détail : `livrables/MAPPING_REFERENTIELS.md`.

**Métriques.** Source unique : `livrables/CHIFFRES.md`. Tous nos chiffres viennent de cas écrits par nous, sur lesquels les règles ont été réglées. Aucun jeu aveugle n'a été passé.

| Mesure | Jeu | Valeur |
|---|---|---|
| Détection des écarts « j'ai écrit X, la demande donne Y » | 410 cas de décalage écrits par nous | 228 écarts sur 228 signalés ; 0 fausse alerte rouge sur 166 jumeaux honnêtes. Test de couverture |
| Détection, moteur en conditions produit | 3 254 arnaques, 2 136 honnêtes (synthétiques) | rappel rouge 71,3 % [69,7 ; 72,9] |
| Fausses alertes, mêmes conditions | idem | 13,9 % en rouge ; 54,2 % des honnêtes reçoivent au moins un avertissement |
| Apport de la phrase libre | 298 arnaques vertes sans intention | 0 arrêtée par la phrase libre, 34 par l'intention structurée : les textes ne contiennent pas les détails |
| Temps de détection | 400 requêtes locales | médiane 18,39 ms, p95 34,08 ms, sans réseau et sans l'appel à Clef |

**Temps de réponse.** L'alerte s'affiche avant le portefeuille. Un appel à Clef-flash coûte p50 369 ms, p95 1 083 ms (mesuré sur le classifieur de messages, pas sur la comparaison). Temps de décision de personnes réelles : à mesurer.

**À mesurer, non estimé.** Jeu aveugle « décalage » (250 cas, hash publié) ; grille de 1 500 paires (en cours) ; précision de Clef sur la comparaison (pas de clé chez nous) ; essai avec un vrai portefeuille ; détection sur Fuji ; compréhension par des personnes.

**Limites connues.** Fraude voulue par la personne, intention vague, contrat qui change à l'exécution, Ledger branché directement : hors périmètre. Un droit donné par signature ne peut pas être limité, on le dit. Fausses alertes élevées : la fatigue d'alerte est la limite principale. Cas et règles écrits par nous. Extension jamais essayée avec un vrai portefeuille. Fuji n'est pas déployé : la démo tourne sur une chaîne locale, et le silence de MetaMask sur une chaîne locale ne prouve rien. Hold up alerte et laisse décider ; il ne se déclare conforme à aucun texte (`livrables/SLIDE_CONFORMITE.md`).
