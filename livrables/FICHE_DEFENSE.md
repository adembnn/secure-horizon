# Fiche de défense : Hold up (Track 1, Guardians of Value)

**Promesse.** Cesser de donner plus que nécessaire, car on s'expose en le faisant.
**Menace.** Tout service peut être compromis. Camille veut échanger 50 USDC ; le site demande un droit illimité, ou une signature « de connexion » qui accorde un droit. Pour une adresse non listée comme malveillante, MetaMask affiche « illimité » sans alerte et ne sait ni combien elle voulait donner ni à qui (code public de MetaMask, non observé à l'écran).
**Réponse.** Extension Chrome devant le portefeuille existant, sans clé, sans signature. Camille écrit ce qu'elle veut faire ; du code lit montant, jeton et adresse et répond « Ça correspond, d'après ce que Hold up sait lire. Ce n'est pas une garantie. », « Ça ne correspond pas » (alerte, Annuler visible) ou « Je n'ai pas pu vérifier ». Règles de base indépendantes de la phrase. Sur une transaction, le droit trop large est ramené au montant écrit. **Après l'alerte** : révoquer le droit en un clic (le portefeuille signe, jamais Hold up), fiche d'incident, cahier rejouable : démo web, portefeuille simulé, pas encore dans l'extension.
**Démo.** Deux fenêtres, le même site Neve, l'un piraté : sans Hold up, 100 USDC tombent à 0 (script qui lit la chaîne) ; avec Hold up, « Ça ne correspond pas » et droit ramené à 50. Vrai Chromium, portefeuille simulé, copie locale d'Avalanche (`livrables/pitch_v7/DEMO_DEROULE.md`).

**Métriques** (source unique : `livrables/CHIFFRES.md`). La preuve citée en premier est le jeu aveugle.

| Mesure | Jeu | Valeur |
|---|---|---|
| **Jeu aveugle (A6)**, code seul | 150 arnaques, 100 jumeaux, autre auteur, ouvert une fois, moteur figé | Rappel **87,3 %** [81,1 ; 91,7] ; rouge seul 76,0 % ; faux rouges **15,0 %** [9,3 ; 23,3] ; faux avertissement ou rouge 30 % |
| Idem, Clef classe puis le code compare | idem | 88,7 % ; rouge 78,0 % ; faux rouges 16,0 % |
| Idem, plancher sans phrase | idem | 64,7 % ; rouge 53,3 % ; faux rouges 15,0 %. Gain de la phrase : +34 à +36 arnaques signalées |
| Critères publiés avant | | Rappel au moins 80 % : **atteint**. Faux rouges au plus 10 % : **non atteint** |
| Grille de contrôle (A11, A12) | 1 079 paires écrites par nous | 86,6 % ; 7,7 % (code) ou 1,3 % (avec Clef). Pas une garantie |
| Trafic réel Avalanche (B11) | 6 325 transactions, légitime présumé | 0,30 % de rouges ; 76,84 % d'avertissements |
| Verdict local (A16) | 400 requêtes, sans réseau | médiane sous 50 ms |

**Limites du jeu aveugle.** Auteur : une IA de la même famille que celle qui nous a aidés. Cas synthétiques. Mesuré en Node, pas dans Chrome. 3 fichiers non commités au moment de l'ouverture (notés au journal). Points faibles : achat NFT à prix quasi nul (11 des 15 faux rouges), jeton différent (63 %), chaîne ou domaine différent (67 %, souvent invérifiables).

**Où va la phrase.** Build livré : la phrase seule part vers le modèle Clef par un relais local qui garde la clé, jamais les montants ni les adresses ; base légale et conservation non rédigées. Option sans réseau : lecture par mots-clés. Le modèle ne peut pas baisser une alerte du code.

**Trace.** Cahier chaîné par hachage, y compris dans le build autonome : ligne modifiée, retirée ou déplacée au milieu détectée. Réécriture complète non détectée sans ancrage externe, non fait. Deux inexactitudes relevées par l'audit (passage automatique noté comme confirmation humaine ; limitation à 50 non notée) : à corriger.

**Ce qu'on ne couvre pas.** Sur 58 paires d'essai, 18 contrôlées : pas encore le sens d'un échange, la contrepartie, la durée d'un droit, ni à qui il est donné (la perte est bornée, pas évitée). Fraude voulue, phrase dictée exacte, Ledger direct, téléphone. Permit et Permit2 signés : pas de révocation en un clic. Jamais essayé avec un vrai MetaMask ; démonstration sur une copie locale d'Avalanche, déploiement Fuji préparé et répété, non exécuté ; revue de sécurité corrigée en Node, non vérifiée dans Chrome : nous ne disons pas « sécurisé ». Aucune conformité déclarée (`livrables/SLIDE_CONFORMITE.md`).

**Référentiels.** NIST CSF 2.0 : DE.AE-02, DE.AE-07, DE.CM-09, RS.MI-01, PR.PS-04, RS.AN-06 ; limiter un droit relève aussi de PR.AA-05 (Protect). ATT&CK : T1657, T1566, T1204. Détail : `livrables/MAPPING_REFERENTIELS.md`.
**Modèle économique** (`research/titouan/BM2/BM_MODELE.md`). Gratuit pour la personne. Paient ceux qui portent la perte : API « verdict avant retrait » pour exchanges et fintechs (premier revenu visé), licence SDK pour portefeuilles (premier pilote), mandats pour agents qui dépensent (pari à 2 ans). Pilotes B2B recherchés maintenant. Prix envisagés : hypothèses, aucun client.
