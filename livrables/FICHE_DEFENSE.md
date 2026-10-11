# Fiche de défense : Hold up (Track 1, Guardians of Value)

**Cible.** Toute personne qui veut garder la main sur ce qu'elle autorise sur la blockchain.
**Menace.** Un site compromis. Camille veut échanger 50 USDC ; le site demande un droit illimité, ou une signature « de connexion » qui accorde un droit. MetaMask affiche « illimité » sans alerte pour une adresse non listée (code public, non observé à l'écran).
**Réponse.** Extension Chrome devant le portefeuille, sans clé ni signature. Camille écrit ce qu'elle veut faire ; du code lit montant, jeton et adresse et répond « Ça correspond » (sans garantie), « Ça ne correspond pas à ce que tu as écrit. » (le gant, Annuler visible) ou « Je n'ai pas pu vérifier ». Sur une transaction, le bouton « Limiter à 50 USDC et envoyer » ramène l'autorisation au montant écrit : Camille clique, rien ne part tout seul. Boutons « Annuler » et « Continuer ». Panneau latéral : « Retirer l'autorisation » (branché, testé en Node, jamais dans un vrai Chrome).
**Démo.** Même site Neve, piraté : sans Hold up, un droit illimité vide le compte de test, 100 vers 0 (`research/demo_reelle/site_echange/test/preuve.mjs`, hors navigateur) ; avec, « Ça ne correspond pas à ce que tu as écrit. », puis Annuler ou « Limiter à 50 USDC et envoyer ». Preuve rejouable du site piraté plus tard (`preuve_piratage.mjs`) : sans Hold up, après l'échange de 50, le pirate prend les 50 restants (50 vers 0) ; avec l'autorisation limitée à 50, il prend 0. Portefeuille simulé, chaîne locale.

**Métriques** (référence : `METRIQUES.md`). Un seul chiffre de détection : le jeu aveugle, mesuré par notre moteur de comparaison, pas par l'extension livrée.

| Mesure | Valeur |
|---|---|
| **Jeu aveugle, moteur de comparaison (pas l'extension)**, 250 cas, code seul : 150 arnaques, 100 jumeaux, autre auteur, ouvert une fois, moteur figé | Rappel **87,3 %** [81,1 ; 91,7] ; faux rouges **15,0 %** [9,3 ; 23,3] ; faux avertissement ou rouge 30 % |
| Précision, même jeu (60 % d'arnaques, pas la précision réelle) | Signalés justes 131/161 = **81,4 %** ; rouges justes 114/129 = **88,4 %** |
| Plancher sans phrase | Rappel 64,7 %. Gain de la phrase : +34 arnaques signalées |
| Critères publiés avant | Rappel au moins 80 % : **atteint**. Faux rouges au plus 10 % : **non atteint** |
| **Extension livrée, contrôle scellé de 2 662 paires**, sans modèle, build qui plantait sur 19,5 % des demandes | Attrapé **49,4 %** [47,1 ; 51,8] ; raté 2,7 % ; « pas pu vérifier » 31,2 % ; en panne 16,7 % ; fausses alertes **8,2 %** [6,1 ; 10,8] |
| Extension corrigée (panne réparée, commit `b42792d`), réserve scellée de 2 673 paires | **à mesurer** |
| **Temps de détection** (code de l'extension sous Node, sans fenêtre) | Local : p50 2,0 ms, p95 13,0 ms (n = 2 662). Avec le modèle : p50 387 ms, p95 1 436 ms (n = 2 101). De la demande du site au verdict affiché, dans un navigateur : non mesuré de façon reproductible |
| **Temps de réponse** | Automatique : celui du verdict. Humain (un geste : Annuler, Continuer ou « Limiter à 50 USDC et envoyer ») : non mesuré, aucun essai avec des personnes |

**Limites du jeu aveugle.** Auteur : une IA de la même famille que la nôtre. Cas synthétiques, mesurés en Node sur le moteur de comparaison, pas sur l'extension ni dans Chrome. L'extension livrée, mesurée elle-même, fait moins bien (ligne du contrôle scellé ci-dessus). Points faibles : achat NFT à prix quasi nul (11 des 15 faux rouges), jeton différent (63 %).

**Où va la phrase.** La phrase écrite, avec ce que la personne y a mis, part du navigateur vers un relais local qui garde la clé, puis vers le modèle hébergé. Ni l'adresse du compte ni la demande du site ne sont envoyées. Sur le jeu aveugle, le modèle n'a baissé aucune alerte du plancher (moteur de comparaison). Dans l'extension, avec le modèle, les ratés montent de 2,7 % à 3,7 %.

**Trace.** Journal chaîné exportable, vérifiable hors ligne, y compris dans le build autonome : ligne modifiée, retirée ou déplacée au milieu détectée. Fiche technique de traçabilité faite (qui a agi, d'où ça vient, quand, règles, preuve de chaîne) : `node livrables/outils/fiche_tracabilite.mjs holdup-journal.json --n 4 --out fiche.html`, depuis `research/titouan/T_banc_e2e` (exemple : `exemple/fiche_ligne4.html`). Champs « qui a décidé », « droit limité », « règles » : en cours d'ajout. Pas d'ancrage (D-017) : une réécriture complète ne se voit pas. Deux inexactitudes connues du journal (passage automatique noté comme confirmation humaine ; limitation à 50 non notée).
**Modèle économique (hypothèse à valider avec des pilotes, aucun revenu aujourd'hui).** Gratuit pour les personnes. Plus tard, les plateformes qui ne demandent que le nécessaire pourront être reconnues par Hold up : elles y gagnent la confiance de leurs clients, et ce sont elles qui nous financent. Critères publics, pas de classement payé.
**Qui lit l'alerte.** L'équipe fraude de la plateforme qui intègre Hold up ; pour un particulier, la personne elle-même.

**Ce qu'on ne couvre pas.** Sur 58 paires d'essai, 18 contrôlées : ni sens d'un échange, ni durée, ni destinataire d'un droit (perte bornée, pas évitée). Hold up ne reconnaît pas un contrat malveillant, il borne ce qu'on lui laisse. Un droit sans échéance reçoit « ça correspond » dans 21 cas sur 43 du contrôle. Phrases de test écrites par des agents ; jeux conçus par notre équipe. Rien sur un réseau public. Fraude voulue, Ledger direct, téléphone. Jamais essayé avec un vrai MetaMask ; Fuji non déployé ; revue de sécurité non vérifiée dans Chrome. Aucune conformité déclarée (`SLIDE_CONFORMITE.md`).

**Référentiels.** NIST CSF 2.0 : DE.AE-02, DE.AE-07, DE.CM-09, RS.MI-01, RS.AN-06, PR.PS-04. ATT&CK : T1657, T1566, T1204 (`MAPPING_REFERENTIELS.md`).
