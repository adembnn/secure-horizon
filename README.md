# Hold up

Tout service peut être compromis. Ce jour-là, on perd ce qu'on lui a laissé le droit de prendre. Hold up est une couche indépendante, pensée pour se poser devant le portefeuille que la personne utilise déjà. Elle a deux étages. Un : la personne écrit ce qu'elle veut faire, avant de voir la demande, et du code compare avec ce que la demande fait vraiment. Deux : un plancher de règles qui ne dépend pas de la phrase. Si la demande correspond, le portefeuille s'ouvre seul après une seconde. Sinon, une alerte d'une ligne, et Annuler reste visible. Hold up ne remplace pas le portefeuille, ne tient aucune clé et ne signe rien.

Hackathon Secure Horizons, 10-11 octobre 2026. Track 1, Fintech Security. Hackathon blue team : le projet détecte et répond, il n'attaque rien. Équipe : Adem et Titouan. Des noms techniques (variables d'environnement, fichiers de recherche) portent encore un ancien nom de code : c'est le même projet.

## Le problème

Un particulier qui signe dans son portefeuille voit des octets, pas des conséquences. Exemple : il veut échanger 50 USDC, le site lui demande un droit de dépense illimité présenté comme une étape normale. D'après le code public de MetaMask, lu le 11 oct. 2026, le montant illimité est affiché (« Unlimited ») sans alerte propre à ce montant, et rien ne le rapproche de ce que la personne voulait donner. Cela vaut pour une adresse que MetaMask ne liste pas comme malveillante, et c'est une lecture de code, pas un essai à l'écran.

Les chiffres (tous dans [livrables/CHIFFRES.md](livrables/CHIFFRES.md)) : en 2025, ScamSniffer (éditeur, chaînes EVM, borne basse) compte 83,85 M$ perdus par 106 106 victimes en signant sur un site de phishing. Dans un échantillon de blocs que nous avons lus, 47,6 % des droits de dépense sont illimités sur Ethereum et 34,2 % sur Avalanche (mesure interne, non représentative). Ce n'est pas la majorité, et nous ne disons pas que ça empire : la parade, ne laisser que ce qu'il faut (le moindre privilège), est connue.

## Ce que fait le prototype

1. **Demander.** Avant de montrer la demande, une fenêtre d'extension pose une question : « Que veux-tu faire sur ce site ? ». Champ de texte libre, aucun bouton, aucun pré-remplissage. Seules les demandes qui déplacent de la valeur ou accordent un droit ouvrent la fenêtre.
2. **Lire.** Le montant, le jeton et l'adresse écrits sont extraits par du code. Dans la version autonome, des mots-clés lisent le type d'action. Si le relais Clef est branché (version avec serveur), un modèle de langage hébergé le fait. Phrase trop vague : « Je n'ai pas pu vérifier cette demande ».
3. **Décoder l'effet.** Calldata, données typées (Permit, Permit2), droits accordés, fonds sortants.
4. **Comparer.** Trois réponses : « Ça correspond à ce que tu as écrit. », « Ça ne correspond pas à ce que tu as écrit. », « Je n'ai pas pu vérifier cette demande. » Un montant écrit contre un droit plus large ne correspond pas, même sur un site connu.
5. **Plancher de règles.** Indépendamment de la phrase : droit illimité vers une adresse inconnue, appel délégué, changement de contrôle du compte, signature illisible.
6. **Répondre.** Niveaux : information, attention, danger, manipulation. Jamais de vert. Pour une transaction, la ligne dit comment ramener le droit au montant écrit, ou Hold up le remplace lui-même sous conditions (prouvé en Node, pas dans un vrai Chrome). Pour une signature, elle dit que le droit ne peut pas être limité.
7. **Tracer.** Chaque décision écrit une ligne datée. La version autonome garde 500 lignes locales non chaînées ; le journal de la version serveur est chaîné par hachage. L'ancrage de sa racine sur Avalanche Fuji est codé, pas déployé.

Scènes de démo : voir `pitch/DEMO_SCENES.md`. Héros : « échanger 50 USDC » face à un droit illimité (site Neve). Second exemple : le signataire aveugle, d'après le cas Bybit de 2025 (scène synthétique). Troisième : « me connecter » qui signe un droit.

## Installation (produit figé : extension autonome, sans serveur)

L'extension contient son moteur. Rien à lancer à côté, pas d'Internet nécessaire, aucune clé.

1. Récupère le paquet `research/titouan/T_banc_e2e/dist/hold-up-standalone.zip` et dézippe-le, ou utilise le dossier `research/titouan/T_banc_e2e/extension_standalone/extension`.
2. Dans Chrome ou Edge : `chrome://extensions`, active **Mode développeur**, clique **Charger l'extension non empaquetée**, choisis le dossier.
3. La carte « Hold up (autonome) » doit apparaître sans bouton « Erreurs ». Pour une page locale `file://`, active « Autoriser l'accès aux URL de fichier ».
4. Vérifie avec `research/titouan/T_banc_e2e/standalone_test_page/index.html` (faux portefeuille, rien n'est signé).

Pas à pas complet, démo locale (`node scripts/demo.mjs`, Node 22.18 ou plus) et dépannage : [livrables/INSTALLATION.md](livrables/INSTALLATION.md).

**Ce qui sort de la machine.** Le build autonome n'a aucun accès réseau (aucune permission d'hôte, `connect-src 'none'`, aucun `fetch`) : ni la phrase ni la demande ne le quittent. La phrase part vers un modèle hébergé si, et seulement si, le relais Clef est branché, ce qui n'est pas le cas du build autonome. Minimisation et durée de conservation chez le fournisseur ne sont pas rédigées. Pour réécrire un droit, l'extension interroge le nœud du portefeuille, comme le ferait la page.

**À ne pas oublier.** Jamais essayé avec un vrai portefeuille. Une revue de sécurité interne ([research/titouan/T_banc_e2e/security_review2/REVUE.md](research/titouan/T_banc_e2e/security_review2/REVUE.md)) a trouvé des contournements possibles, dont un critique ; les corrections sont en cours. Ne pas utiliser avec de vrais fonds.

| Service de la démo locale | Port | État pour le produit figé |
|---|---|---|
| Nœud local Hardhat | 8545 | utilisé (chaîne de répétition ; `--fork` : copie locale d'Avalanche) |
| Site d'échange Neve | 8793 | scène héros : `?mode=honnete`, `?mode=piege`, `?mode=piege&via=permit` |
| Site « Glacier Rewards » | 8791 | scène « me connecter » |
| Console d'attaque simulée | 8792 | prouve ce qui part sur la chaîne locale |
| Serveur de vérification, RPC de garde, Lab | 8787, 8555, 8800, 8801 | ancienne version, hors démo |

## Tests

| Commande | Ce qu'elle vérifie | Résultat noté |
|---|---|---|
| `npm run test:engine` | moteur d'effets | 288 sur 290 sur un clone neuf (2 échecs : données ignorées par git) |
| `npm run test:server` | serveur de vérification, journal | 33 sur 33 |
| `node --test extension/tests/unit/*.test.mjs` (depuis `research/titouan/T_banc_e2e`) | moteur de retenue, Chrome factice | 83 sur 83 (`extension/RAPPORT_CORRECTIFS.md`) ; suite autonome 39 sur 39 |
| `npm run test:contracts` | contrats de démo (Hardhat) | 30 passent |

Ces tests valident le code, ils ne mesurent pas la détection. Les nombres changent entre les relevés : relancer avant de les citer. Les tests de la revue de sécurité (`security_review2/tests/`) échouent tant que leurs failles ne sont pas corrigées.

## Chiffres

Un seul tableau fait foi : [livrables/CHIFFRES.md](livrables/CHIFFRES.md), avec les colonnes synthétique, contrôle scellé et données réelles, la source et la date de chaque ligne. En résumé :

- Cas écrits par nous : 228 écarts sur 228 signalés, 0 fausse alerte rouge sur 166 honnêtes. C'est un test de couverture.
- Contrôle scellé (1 079 paires phrase / demande, même auteur pour les phrases et les règles, une seule mesure par bras) : le code seul attrape 86,6 % des écarts avec 7,7 % de fausses alertes ; un modèle qui classe puis le code qui compare, 86,6 % avec 1,3 % ; le modèle seul comme juge, 64,4 %. Le jeu aveugle de 250 cas, d'un autre auteur, n'est pas encore passé.
- En conditions produit (banc synthétique) : rappel rouge 71,3 %, 13,9 % des opérations honnêtes en rouge, 54,2 % avec au moins un avertissement. C'est la première limite.
- Trafic réel Avalanche, 6 325 transactions (légitime présumé) : 19 rouges (0,30 %), mais 76,84 % d'avertissements, surtout de l'opacité.
- Pipeline strict : aucune arnaque ratée de plus, aucun cas sous le plancher, aucun « ok » produit par la couche.
- Sur nos cas actuels, la phrase libre n'arrête aucune des 298 arnaques vertes sans intention : les textes se réduisent à « virement ».
- Verdict local : médiane sous 50 ms, sans l'appel au modèle.

## Limites connues

- **Jamais essayé avec un vrai portefeuille.** Aucun résultat dans `research/titouan/T_banc_e2e/essai_reel/ESSAI_REEL_RESULTATS.csv`. La démo tourne sur une chaîne locale, que l'API d'alertes de MetaMask ne sert pas (Fuji non plus) : son silence là ne prouve rien.
- **Revue de sécurité.** Contournements trouvés, dont un critique (une page qui remplace des fonctions natives). Corrections en cours, non vérifiées dans un navigateur. Nous ne disons pas « sécurisé ».
- **Rien n'est déployé sur Fuji.** `blockchain/DEPLOYMENTS.md` ne contient que son en-tête. Sans ancrage, le journal de la version serveur détecte une ligne modifiée ou retirée au milieu, pas une réécriture complète.
- **Hors périmètre.** Fraude consentie (la personne veut vraiment faire ce paiement), intention vague, contrat qui change à l'exécution (MetaMask le traite mieux avec Added Protection), Ledger branché directement, mobile, envois lancés depuis le bouton Envoyer du portefeuille.
- **Une signature ne se limite pas.** Un droit donné par Permit n'a pas de plafond modifiable : Hold up alerte et le dit.
- **Fausses alertes élevées.** La fatigue d'alerte est la limite principale.
- **Où va la phrase.** Nulle part dans le build autonome. Vers un modèle hébergé si le relais Clef est branché : minimisation et durée de conservation non rédigées.
- **Aucun test avec des personnes.**
- **Principe non nouveau.** Le moindre privilège pour les approbations existe (Matcha, LI.FI, Talisman, Permit2), et le principe « dire d'abord, valider après simulation » a été décrit publiquement en février 2026. Notre apport est l'assemblage : phrase libre avant la demande, sur toute demande, comparée à l'effet, avec un plancher de règles.

## Référentiels

NIST CSF 2.0 : DE.AE-02, DE.AE-07, DE.CM-09 (Detect), RS.MI-01 au sens large (Respond), PR.PS-04 et RS.AN-06 (trace), PR.AA-05 (moindre privilège, fonction secondaire). ATT&CK : T1657, T1566, T1204, T1684.001, T1070. D3FEND : aucun identifiant retenu. OWASP Agentic : ASI01 par analogie, seulement si un agent détient le portefeuille. Tous relus sur les sites officiels le 11 oct. 2026 : [livrables/MAPPING_REFERENTIELS.md](livrables/MAPPING_REFERENTIELS.md). Aucune conformité déclarée.

## Carte du dépôt

| Chemin | Contenu |
|---|---|
| `livrables/` | rendu : [CHIFFRES](livrables/CHIFFRES.md), pitchs, vidéo, fiche de défense, slide de conformité, playbook, questions du jury, deck, mapping, installation |
| `pitch/DEMO_SCENES.md` | scènes de démo du produit figé |
| `research/titouan/T_banc_e2e/extension_standalone/`, `dist/`, `extension/` | extension Chrome/Edge MV3 : build autonome (moteur embarqué, sans réseau), paquet zip, version avec serveur et relais |
| `research/titouan/T_banc_e2e/engine/`, `run/policy.mjs`, `server/` | moteur d'effets, comparateur, serveur, journal chaîné |
| `research/titouan/T_banc_e2e/pipeline/` | intégration des détecteurs, mesures de l'intention écrite, grille phrase / demande |
| `research/titouan/T_banc_e2e/security_review2/` | revue de sécurité défensive de l'extension, avec tests |
| `research/demo_reelle/` | recherches sourcées (`RECHERCHE_*.md`), sites de démo Neve et Glacier, réponse et audit, prototypes RPC et Lab |
| `blockchain/` | contrats de démo synthétiques, déploiement local et Fuji |
| `coord/` | coordination ; décisions dans `coord/DECISIONS.md`, passation dans `coord/HANDOFF_ADEM_SESSION_2.md` |

## Règle : aucun secret, données synthétiques seulement

Aucun secret n'est dans le dépôt. Les clés (`FUJI_PRIVATE_KEY`, clés du modèle) vivent dans `.env`, ignoré par git ; seuls des fichiers `*.example` sont suivis. Les comptes Hardhat de la démo ont des clés publiques : jamais de vrais fonds. Les jeux de test sont synthétiques. Les mesures sur chaîne réelle lisent des RPC publics en lecture seule et n'envoient aucune transaction. Les attaques sont simulées sur notre chaîne locale.
