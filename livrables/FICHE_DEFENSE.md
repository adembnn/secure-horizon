# Fiche de défense : Hold up (Track 1, Guardians of Value)

**Menace.** Un site compromis. Camille veut échanger 50 USDC ; le site demande un droit illimité, ou une signature « de connexion » qui accorde un droit. MetaMask affiche « illimité » sans alerte pour une adresse non listée (code public, non observé à l'écran).
**Réponse.** Extension Chrome devant le portefeuille, sans clé ni signature. Camille écrit ce qu'elle veut faire ; du code lit montant, jeton et adresse et répond « Ça correspond » (sans garantie), « Ça ne correspond pas » (alerte, Annuler visible) ou « Je n'ai pas pu vérifier ». Sur une transaction, le droit trop large est ramené au montant écrit. Révocation en un clic : démo web, portefeuille simulé.
**Démo.** Même site Neve, piraté : sans Hold up, 100 USDC tombent à 0 ; avec, « Ça ne correspond pas » et droit ramené à 50. Portefeuille simulé, chaîne locale.

**Métriques** (source unique : `livrables/CHIFFRES.md`). Un seul chiffre de détection : le jeu aveugle, mesuré par notre moteur de comparaison, pas par l'extension livrée.

| Mesure | Valeur |
|---|---|
| **Notre moteur de comparaison, jeu aveugle de 250 cas (A6)** : 150 arnaques, 100 jumeaux, autre auteur, ouvert une fois, moteur figé | Rappel **87,3 %** [81,1 ; 91,7] ; faux rouges **15,0 %** [9,3 ; 23,3] ; faux avertissement ou rouge 30 % |
| Précision, même jeu (60 % d'arnaques, pas la précision réelle) | Signalés justes 131/161 = **81,4 %** ; rouges justes 114/129 = **88,4 %** |
| Plancher sans phrase | Rappel 64,7 %. Gain de la phrase : +34 arnaques signalées |
| Critères publiés avant | Rappel au moins 80 % : **atteint**. Faux rouges au plus 10 % : **non atteint** |
| **Temps de réponse** (A16, A17) | Verdict local : médiane sous 50 ms (400 requêtes, sans réseau). Le modèle hébergé ajoute un délai distinct (p50 369 ms) |

**Limites du jeu aveugle.** Auteur : une IA de la même famille que la nôtre. Cas synthétiques. Chaîne de banc, pas l'extension : mesurée elle-même sur une autre grille, l'extension livrée fait moins bien (CHIFFRES.md, « Mesure sur l'extension livrée »). Points faibles : achat NFT à prix quasi nul (11 des 15 faux rouges), jeton différent (63 %).

**Où va la phrase.** La phrase seule part vers le modèle par un relais local qui garde la clé ; jamais les montants ni les adresses. Le modèle ne peut pas baisser une alerte du code.

**Trace.** Journal chaîné exportable, vérifiable hors ligne, y compris dans le build autonome : ligne modifiée, retirée ou déplacée au milieu détectée. Fiche technique de traçabilité faite (qui a agi, d'où ça vient, quand, règles, preuve de chaîne ; 7 tests) : `node livrables/outils/fiche_tracabilite.mjs holdup-journal.json --n 4 --out fiche.html`, depuis `research/titouan/T_banc_e2e` (exemple : `exemple/fiche_ligne4.html`). Champs « qui a décidé », « droit limité », « règles » : en cours d'ajout. Pas d'ancrage (D-017) : une réécriture complète ne se voit pas. Deux inexactitudes connues du journal (passage automatique noté comme confirmation humaine ; limitation à 50 non notée).
**Qui lit l'alerte.** L'équipe fraude de la plateforme qui intègre Hold up ; pour un particulier, la personne elle-même.

**Ce qu'on ne couvre pas.** Sur 58 paires d'essai, 18 contrôlées : ni sens d'un échange, ni durée, ni destinataire d'un droit (perte bornée, pas évitée). Fraude voulue, Ledger direct, téléphone. Jamais essayé avec un vrai MetaMask ; Fuji non déployé ; revue de sécurité non vérifiée dans Chrome. Aucune conformité déclarée (`SLIDE_CONFORMITE.md`).

**Référentiels.** NIST CSF 2.0 : DE.AE-02, DE.AE-07, DE.CM-09, RS.MI-01, RS.AN-06, PR.PS-04. ATT&CK : T1657, T1566, T1204 (`MAPPING_REFERENTIELS.md`).
