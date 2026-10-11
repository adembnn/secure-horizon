# Hold up

La personne écrit ce qu'elle veut faire, avant de voir la demande. Hold up lit la demande de son portefeuille, dit si elle correspond à ce qui a été écrit, et alerte si ce n'est pas le cas. Si elle correspond, il n'ajoute rien : le portefeuille s'ouvre seul après une seconde. Il garde aussi les signaux que le portefeuille donne déjà.

Hackathon Secure Horizons, 10-11 octobre 2026. Track 1, Fintech Security. Hackathon blue team : le projet détecte et répond, il n'attaque rien. Équipe : Adem et Titouan.
Ancien nom : Sentinelle. Il reste dans des fichiers de recherche et des noms techniques (variables `SENTINELLE_*`). C'est le même projet.

## Le problème

Un particulier qui signe dans son portefeuille voit des octets, pas des conséquences. Exemple : il veut échanger 50 USDC, le site lui demande un droit de dépense illimité présenté comme une étape normale. D'après le code public de MetaMask, lu le 11 oct. 2026, le montant illimité est affiché (« Unlimited ») sans alerte dédiée, et rien ne le rapproche de ce que la personne voulait donner ni à qui. Cela vaut pour une adresse que MetaMask ne liste pas comme malveillante. En 2025, ScamSniffer (éditeur, chaînes EVM, borne basse) compte 83,85 M$ perdus par 106 106 adresses en signant sur un site de phishing. Aucun chiffre propre à Avalanche n'existe dans nos sources.

## Ce que fait le prototype

1. **Demander.** Avant de montrer la demande, une fenêtre d'extension pose une question : « Que veux-tu faire sur ce site ? ». Champ de texte libre, aucun bouton, aucun pré-remplissage. Seules les demandes qui déplacent de la valeur ou accordent un droit ouvrent la fenêtre.
2. **Lire.** Le montant, le jeton et l'adresse écrits sont extraits par du code. Un modèle de langage (Clef) lit la phrase pour le type d'action. Phrase trop vague : une relance, puis « Je n'ai pas pu vérifier cette demande ».
3. **Décoder l'effet.** Calldata, données typées (Permit, Permit2), droits accordés, fonds sortants.
4. **Comparer.** Trois réponses : « Ça correspond à ce que tu as écrit. », « Ça ne correspond pas à ce que tu as écrit. », « Je n'ai pas pu vérifier cette demande. » Un montant écrit contre un droit plus large ne correspond pas, même sur un site connu.
5. **Répondre.** Correspond : le portefeuille s'ouvre seul après une seconde. Ne correspond pas : alerte avec une ligne, Annuler visible. Pour une transaction, la ligne dit comment ramener le droit au montant écrit. Pour une signature, elle dit que le droit ne peut pas être limité. La durée de retenue après alerte n'est pas tranchée.
6. **Tracer.** Chaque décision écrit une ligne dans un journal chaîné par hachage. L'ancrage de sa racine sur Avalanche Fuji est codé, pas déployé.

Scènes de démo : voir `pitch/DEMO_SCENES.md`. Héros : « échanger 50 USDC » face à un droit illimité (site Neve). Second exemple : le signataire aveugle, d'après le cas Bybit de 2025 (scène synthétique). Troisième : « me connecter » qui signe un droit.

## Lancer la démo locale

```bash
git clone <url-du-depot> hold-up && cd hold-up
node scripts/demo.mjs
```

Node 22.18 ou plus (essayé avec Node 25.6.0 sous Windows 11 seulement). La première fois, le script lance `npm install` dans `blockchain/`. Il démarre ce qui existe, saute le reste en le disant, et s'arrête avec Ctrl+C. `node scripts/demo.mjs --check` liste les prérequis sans rien lancer.

| Service | Port | État pour le produit figé |
|---|---|---|
| Nœud local Hardhat | 8545 | utilisé (chaîne de répétition ; `--fork` : copie locale d'Avalanche) |
| Site d'échange Neve | 8793 | scène héros : `?mode=honnete`, `?mode=piege`, `?mode=piege&via=permit` |
| Site « Glacier Rewards » | 8791 | scène « me connecter » |
| Console d'attaque simulée | 8792 | prouve ce qui part sur la chaîne locale |
| Serveur de vérification | 8787 | utilisé par l'extension version serveur |
| RPC de garde, Lab | 8555, 8800, 8801 | prototypes de l'ancienne version, hors démo |

Pas à pas de l'extension dans Chrome : `livrables/INSTALLATION.md` (écrit avant le produit figé, à relire).

## Tests

| Commande | Ce qu'elle vérifie | Résultat noté |
|---|---|---|
| `npm run test:engine` | moteur d'effets | 288 sur 290 sur un clone neuf (2 échecs : données ignorées par git) |
| `npm run test:server` | serveur de vérification, journal | 33 sur 33 |
| `npm run test:extension` | moteur de retenue, Chrome factice | 41 sur 41 au relevé du README précédent ; 63 sur 63 annoncés par la note de passation, à relancer |
| `npm run test:contracts` | contrats de démo (Hardhat) | 30 passent |

Ces tests valident le code, ils ne mesurent pas la détection. Les nombres changent entre les relevés : relancer avant de les citer.

## Chiffres

Un seul tableau fait foi : [livrables/CHIFFRES.md](livrables/CHIFFRES.md), avec deux colonnes (synthétique, données réelles), la source et la date de chaque ligne. En résumé :

- Tout ce qui mesure Hold up vient de cas écrits par nous, sur lesquels les règles ont été réglées. Les 410 cas de décalage sont signalés 228 sur 228 : c'est un test de couverture. Le jeu aveugle de 250 cas (hash publié) n'est pas encore passé. Une grille de 1 500 paires est en cours.
- En conditions produit, 13,9 % des opérations honnêtes reçoivent un écran rouge et 54,2 % un avertissement. C'est la première limite.
- Sur nos cas actuels, la phrase libre n'arrête aucune des 298 arnaques vertes sans intention : les textes se réduisent à « virement ». Il manque un jeu construit pour la thèse.
- La précision de Clef sur la comparaison n'est pas mesurée par nous (pas de clé dans ce dépôt).

## Limites connues

- **Jamais essayé avec un vrai portefeuille.** Aucun résultat dans `research/titouan/T_banc_e2e/essai_reel/ESSAI_REEL_RESULTATS.csv`. La démo tourne sur une chaîne locale, que l'API d'alertes de MetaMask ne sert pas (Fuji non plus) : son silence là ne prouve rien.
- **Rien n'est déployé sur Fuji.** `blockchain/DEPLOYMENTS.md` ne contient que son en-tête. Sans ancrage, le journal détecte une ligne modifiée ou retirée au milieu, pas une réécriture complète.
- **Hors périmètre.** Fraude consentie (la personne veut vraiment faire ce paiement), intention vague, contrat qui change à l'exécution (MetaMask le traite mieux avec Added Protection), Ledger branché directement, mobile, envois lancés depuis le bouton Envoyer du portefeuille.
- **Une signature ne se limite pas.** Un droit donné par Permit n'a pas de plafond modifiable : Hold up alerte et le dit.
- **Fausses alertes élevées.** La fatigue d'alerte est la limite principale.
- **Le modèle lit la phrase, pas les montants.** Sa phrase part vers un service hébergé : minimisation et durée de conservation non rédigées.
- **Aucun test avec des personnes.**
- **Principe non nouveau.** Le moindre privilège pour les approbations existe (Matcha, LI.FI, Talisman, Permit2), et le principe « dire d'abord, valider après simulation » a été décrit publiquement en février 2026. Notre apport est l'assemblage : phrase libre avant la demande, sur toute demande, comparée à l'effet.

## Référentiels

NIST CSF 2.0 : DE.AE-02, DE.AE-07, DE.CM-09 (Detect), RS.MI-01 au sens large (Respond), PR.PS-04 et RS.AN-06 (trace), PR.AA-05 (moindre privilège, fonction secondaire). ATT&CK : T1657, T1566, T1204, T1684.001, T1070. D3FEND : aucun identifiant retenu. OWASP Agentic : ASI01 par analogie, seulement si un agent détient le portefeuille. Tous relus sur les sites officiels le 11 oct. 2026 : [livrables/MAPPING_REFERENTIELS.md](livrables/MAPPING_REFERENTIELS.md).

## Carte du dépôt

| Chemin | Contenu |
|---|---|
| `livrables/` | rendu : [CHIFFRES](livrables/CHIFFRES.md), pitchs, vidéo, fiche de défense, slide de conformité, playbook, questions du jury, deck, mapping, installation |
| `pitch/DEMO_SCENES.md` | scènes de démo du produit figé |
| `research/titouan/T_banc_e2e/extension/`, `extension_standalone/` | extension Chrome/Edge MV3 (avec serveur, ou moteur embarqué) |
| `research/titouan/T_banc_e2e/engine/`, `run/policy.mjs`, `server/` | moteur d'effets, comparateur, serveur, journal |
| `research/titouan/T_banc_e2e/pipeline/` | intégration des détecteurs, mesures de l'intention écrite, grille |
| `research/demo_reelle/` | recherches sourcées (`RECHERCHE_*.md`), sites de démo Neve et Glacier, réponse et audit, prototypes RPC et Lab |
| `blockchain/` | contrats de démo synthétiques, déploiement local et Fuji |
| `coord/` | coordination ; décisions dans `coord/DECISIONS.md`, passation dans `coord/HANDOFF_ADEM_SESSION_2.md` |

## Règle : aucun secret, données synthétiques seulement

Aucun secret n'est dans le dépôt. Les clés (`FUJI_PRIVATE_KEY`, clés du modèle) vivent dans `.env`, ignoré par git ; seuls des fichiers `*.example` sont suivis. Les comptes Hardhat de la démo ont des clés publiques : jamais de vrais fonds. Les jeux de test sont synthétiques. Les mesures sur chaîne réelle lisent des RPC publics en lecture seule et n'envoient aucune transaction. Les attaques sont simulées sur notre chaîne locale.
