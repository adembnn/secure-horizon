# Sentinelle (brouillon de README jury)

Statut : brouillon du 11 oct. 2026, écrit à partir des fichiers de mesure du repo. Les chemins sont relatifs à la racine du repo. Tout chiffre est suivi de sa source. Ce qui n'est pas mesuré est dit "non mesuré". Aucune promesse de résultat.

## 1. Problème

Un particulier qui signe dans son portefeuille voit des octets, pas des conséquences. Un faux support, un faux concours ou un site sosie lui fait signer un droit de dépense (approve, permit) ou envoyer des fonds à une adresse piégée. Il croit faire une chose simple. La transaction en fait une autre.

Sentinelle compare ce que la personne dit vouloir faire avec ce que la transaction fait réellement. Si les deux ne correspondent pas, elle avertit en reprenant ses mots ("tu as dit X, ça fait Y") et elle ralentit la décision. Elle ne retire jamais le choix à l'utilisateur.

## 2. Cible

- Le particulier crypto qui utilise une extension de portefeuille dans un navigateur de bureau (Chrome, Edge). Source du cadrage : `docs/intent-barrier.md`.
- Le mobile n'est pas couvert directement. Il peut l'être seulement via les portefeuilles eux-mêmes (module intégré par l'éditeur du portefeuille, ou Snap). Voir les limites, section 6, et `research/titouan/U_segment/U5a_extensions_mobile.md`, `U5b_signature_mobile.md`.
- Chaîne de démonstration : Avalanche Fuji (43113). Les données de couverture viennent surtout d'Ethereum (voir limites).
- Business : gratuit au départ, partenaires ensuite. Ce point est volontairement mis en parenthèse. Aucun modèle économique abouti n'est présenté.

## 3. Architecture

```
  Site web (dApp)
       |  window.ethereum / EIP-6963
       v
  [1 INTERCEPTION]  extension MV3 : enveloppe le fournisseur, retient la requête
       |            (extension/inject.js, bridge.js, background.js)
       v
  [2 INTENTION]     la personne dit en mots simples ce qu'elle veut faire
       |            (+ message collé, + 2 à 4 questions seulement si risque)
       v
  [3 MOTEUR D'EFFETS]  décode calldata et données typées (EIP-712),
       |               calcule : sorties, entrées, droits accordés, contrôle,
       |               adresses sosies   (engine/src/*.mjs)
       v
  [4 COMPARATEUR]   intention contre effets (engine/vendor/compare.ts)
       |            + règles supplémentaires (engine/src/rules_extra.mjs)
       v
  [5 POLITIQUE]     plancher objectif, jamais abaissé par l'intention
       |            (run/policy.mjs)
       v
  [6 VERDICT]       ok / warn / critical + phrases FR "tu as dit / ça fait"
       v
  [7 FRICTION]      délai, phrase à retaper, retenue configurable,
       |            "Annuler" toujours visible ; l'utilisateur peut passer outre
       v
  [8 JOURNAL]       ligne chaînée par hachage (sha256), sans texte libre
                    ancrage de la racine sur Fuji : EN COURS (voir 3.1)
```

Principes de conception :
- Le comparateur final est du code. Un modèle (optionnel) comprend une phrase ou classe un message collé. Il ne peut qu'aggraver un verdict, jamais le baisser (`research/titouan/O_barriere_intention.md`, position 1).
- Un échec, un délai ou une API absente donne "Non vérifié", jamais un feu vert (`research/titouan/T_banc_e2e/extension/COMPAT.md`).
- Le serveur écoute sur 127.0.0.1 uniquement. Pas de réseau sortant dans la version autonome prévue.

### 3.1 État réel des briques (à la rédaction)

| Brique | État | Source |
|---|---|---|
| Moteur d'effets, 447 tests unitaires | fait, 447/447 rejoués par l'auteur du livrable | `research/titouan/T_banc_e2e/engine/test/` |
| Serveur local `/check`, journal chaîné par hachage, vérificateur | fait | `research/titouan/T_banc_e2e/server/server.mjs` |
| Extension MV3 (Chrome, Edge) avec portefeuille simulé | faite, 64 PASS sur 66, 2 LIMITE | `research/titouan/T_banc_e2e/extension/COMPAT.md` |
| Extension autonome (moteur embarqué, sans réseau) | en cours, dossier `out/` vide à la rédaction | `research/titouan/T_banc_e2e/extension_standalone/` |
| Ancrage de la racine du journal sur Fuji (contrat, script, rejeu) | en cours, dossier `anchor/` absent à la rédaction | `coord/INBOX.md` MSG-051 et réponse de Titouan |
| Contrats déployés sur Fuji | non listés : `blockchain/DEPLOYMENTS.md` est vide | `blockchain/DEPLOYMENTS.md` |
| Essai avec un vrai MetaMask sur Fuji | jamais fait ; protocole en préparation, à jouer par un humain | `coord/INBOX.md` MSG-053 |

## 4. Installation

Prérequis : Node 22 ou plus (24 utilisé ici), Chrome ou Edge. Aucun `npm install` n'est nécessaire : le moteur et le serveur n'ont aucune dépendance.

Les guides `INSTALL_FR.md` et `INSTALL_STANDALONE_FR.md` n'existaient pas à la rédaction. Quand ils seront écrits, ils font foi. En attendant, les étapes ci-dessous viennent des scripts du repo.

### 4.1 Version avec serveur local

1. Démarrer le serveur (PowerShell, depuis `research/titouan/T_banc_e2e/`) :
   `powershell -File server\start.ps1`
   Il écoute sur `http://127.0.0.1:8787`. Option `--no-journal` pour désactiver le journal. Contrôle : `GET /health`.
2. Préparer le dossier de l'extension :
   `powershell -ExecutionPolicy Bypass -File server\package.ps1`
   Cela crée `dist\sentinelle-extension` et `dist\sentinelle-extension.zip` (sans tests, sans faux moteur).
3. Dans Chrome ou Edge : `chrome://extensions`, activer le mode développeur, "Charger l'extension non empaquetée", choisir `dist\sentinelle-extension`.
4. Vérifier le journal à tout moment :
   `node server/server.mjs --verify-journal` affiche "journal OK" ou la ligne où la chaîne est cassée.

### 4.2 Version autonome

Moteur embarqué dans l'extension, aucun serveur, aucun réseau sortant. Code source : `research/titouan/T_banc_e2e/extension_standalone/src/` (`sentinelle_core.js`, `background.js`). Zip et guide : en cours, voir `INSTALL_STANDALONE_FR.md` s'il existe. Équivalence verdict par verdict avec la voie de référence : annoncée, non vérifiée par l'auteur de ce brouillon.

### 4.3 Réglages de test

Le mode automatique (`testMode` + `auto`) n'existe que pour les tests et doit être retiré du build de production (`extension/COMPAT.md`).

## 5. Mesures : ce qu'elles disent, en deux colonnes séparées

Les deux colonnes ne se mélangent jamais. Détail et statut de chaque chiffre : `RESULTATS_A_JOUR.md`.

**Couverture sur cas synthétiques** (catalogues écrits par nous ou par des agents, jamais du trafic réel) :
- Jeu TEST (n = 110 malveillants, 78 bénins), ouvert une seule fois, avant les derniers correctifs : rappel (warn ou critical) 94,5 % [88,6 ; 97,5] (104/110) ; fausses alertes critical 23,1 % [15,1 ; 33,6] (18/78). Source : `research/titouan/T_banc_e2e/COUVERTURE.md`.
- Plancher seul (sans intention), même jeu : rappel 91,8 % [85,2 ; 95,6] (101/110), fausses alertes critical 5,1 % [2,0 ; 12,5] (4/78). Source : même fichier.
- Fixtures publiques (144, dont 134 exécutables), bras "intention honnête" : rappel 95,4 % [87,3 ; 98,4] (62/65), fausses alertes critical 3,0 % [0,8 ; 10,3] (2/67). Source : `research/titouan/T_banc_e2e/attacks_public/out/MESURE_001.md`.
- Jeu aveugle V2 d'Adem (8 425 cas) : aucun résultat publié à la rédaction. Il ne doit être ouvert qu'une fois. Source du protocole : `coord/INBOX.md` MSG-052.

**Taux mesurés sur données réelles** :
- Trafic réel C-Chain, 6 325 transactions : le filet v0 (5 règles sans intention) signale 0,28 % [0,18 ; 0,45] du trafic présumé légitime. Source : `research/titouan/bench/RAPPORT_banc_reel_v0.md`.
- Droits de dépense réels vers des adresses listées (Ethereum, n = 33) : le filet v0 en retrouve 24/33 = 72,7 % [55,8 ; 84,9]. Petit n, étiquettes d'un tiers. Même source, section "CORRECTION MAJEURE".
- Compatibilité de la couche d'interposition sur 96 sites réels : 0 casse sur 89 sites accessibles [0,0 ; 4,1 %]. Attention : le bras test était un Proxy du banc de mesure, pas l'extension réelle. Source : `research/titouan/T_banc_e2e/compat/COMPAT_REEL.md`.

## 6. Limites connues (honnêtes)

1. **Envois lancés depuis l'interface du portefeuille** (bouton Envoyer, Swap, Bridge de MetaMask, Rabby) : la page n'est pas dans le chemin, l'extension ne voit rien. Idem applications natives et scripts. `extension/COMPAT.md`, limite 2.
2. **Mobile** : pas d'extension sur les navigateurs mobiles courants, WalletConnect passe par un relais chiffré. Une couverture mobile exige l'intégration par l'éditeur du portefeuille. `U_segment/U5a`, `U5b`.
3. **Fraude conforme invisible** : si la victime fait un transfert valide, vers une adresse qu'elle a choisie, sous la guidance d'un escroc (faux conseiller, pig butchering), ni l'intention ni les effets ne la distinguent d'un envoi honnête. Sur DEV, 3 des 24 cas passent sans alerte ; sur TEST, 4/4 alertés, mais n est minuscule. `COUVERTURE.md`.
4. **Pas de refus imposé** : on avertit et on ralentit. Un utilisateur déterminé, ou coaché au téléphone, peut passer outre. Seule une extension pourrait retenir une requête, jamais un Snap (`O_barriere_intention.md`).
5. **EIP-7702 absent de la C-Chain** : les règles 7702 sont mesurées sur des cas Ethereum, pas sur Avalanche (`research/titouan/U_segment/U4_menaces_avalanche.md`, ACP-209 non activé).
6. **Données d'attaque étiquetées surtout Ethereum** : la liste ScamSniffer n'a pas de chaîne, et seulement 2 approbations C-Chain vers des adresses listées ont été trouvées (`coord/INBOX.md`, POINT-20MIN 02h23). Pas de jeu d'attaques réelles étiqueté Avalanche.
7. **Catalogues synthétiques écrits par nous** : auteur non aveugle pour DEV/TEST, adresses et ABI souvent écrites de mémoire dans V2 (champ `approximation`), proportions des familles non réalistes, messages d'escroc écrits par une IA. Les chiffres mesurent la couverture et la non-régression, pas la robustesse face à un attaquant réel.
8. **Fausses alertes mesurées, et élevées** : 23,1 % de critical sur le TEST ouvert (jeu bénin difficile). Un listing Seaport honnête et un mint NFT sortaient critical avant correctifs. Des correctifs réduisent les fausses alertes sur DEV, mais ils ont été réglés sur ce même jeu : leur effet sur TEST n'est pas mesuré (`COUVERTURE.md`, section boucle d'amélioration).
9. **Extension jamais testée avec un vrai portefeuille** : seulement un portefeuille simulé. MetaMask enveloppe déjà `request` ; comportement non testé (`extension/COMPAT.md`, limite 11).
10. **Détectabilité** : une page motivée peut détecter l'enveloppe (iframe vierge, descripteur de `window.ethereum`) (`extension/COMPAT.md`, G2 et G3).
11. **Retenue de 10 minutes** : le service worker MV3 peut s'arrêter avant. Testée avec 2 s seulement. Risque : la requête échoue en mode fermé (erreur 4900) (`extension/COMPAT.md`, limite 13).
12. **Hors transaction** : phrase secrète saisie sur un faux site, extension clone, mise à jour piégée, malware. Hors périmètre (`attacks_public/out/MESURE_001.md`, cas non exécutables).
13. **Aucun test avec des personnes** : la compréhension des écrans n'est pas mesurée sur de vrais utilisateurs. Aucun taux n'est présenté comme preuve.
14. **Latence mesurée seulement en local** : voir section 7. Pas de mesure avec simulation sur fork ni RPC réel.

## 7. Rejouer les mesures

Toutes les commandes lancent un seul processus Node. Aucun `npm install`. Depuis `research/titouan/T_banc_e2e/` sauf indication.

| Pour rejouer | Commande | Réseau | Notes |
|---|---|---|---|
| Tests du moteur (447) | `cd engine` puis `node --test test/*.test.mjs` | non | rejoué : 447 pass, 0 fail |
| Tests du serveur local (33) + latence | `node server/test/server.test.mjs` | non | écrit `server/test/results.json` |
| Banc synthétique DEV | `node run/run_loop.mjs` | non | TEST jamais lu par défaut |
| Ouvrir TEST (une fois) | `node run/run_loop.mjs --open-test` | non | journalisé dans `run/out/TEST_OUVERTURES.json`, réouverture refusée sans `--allow-reopen`. Déjà ouvert une fois (R003). Ne pas rouvrir. |
| Comparer un correctif sur DEV | `node run/ab.mjs <label> <fixes>` | non | jamais TEST |
| Fixtures publiques | `node attacks_public/run_public.mjs` | non | écrit `attacks_public/out/MESURE_*` |
| Régénérer les catalogues | `node attacks/gen.mjs` puis `node attacks/validate.mjs` | non | graine fixe 20261011 |
| Jeu aveugle v1 (sha256 attendu `38ebd60c...590aa`) | dans `blind_adem/` : `node gen_malveillants.mjs`, `node gen_benins.mjs`, `node gen_fraudes.mjs`, puis concaténer dans cet ordre | non | `coord/INBOX.md` MSG-050. Les générateurs importent ethers par un chemin absolu de la machine d'Adem : à adapter. |
| Boîte noire sur un jeu de cas | `node redteam/check.mjs <cas.jsonl>` | non | verdicts identiques à `run_loop --dry` sur 385/385 cas DEV (`redteam/README.md`) |
| Filet sur trafic réel (C-Chain, Ethereum) | depuis `research/titouan/bench/` : `node sample_cchain.mjs 1500`, `node eval_legit_eth.mjs 200`, `node eval_attacks.mjs` | oui (RPC publics, lecture seule) | graine 20261011, blocs épinglés dans `data/*.meta.json`. Le rapport cite aussi `decode_rules.mjs`, absent du dossier : à confirmer. |
| Compatibilité sur 96 sites | `node compat/run_all.mjs` puis `node compat/report.mjs` | oui | Chrome installé requis, pilotage CDP. Validation du harnais : `node compat/selftest.mjs` |
| Tests de l'extension (66) | `node extension/mock_engine.mjs` dans un terminal, puis `node extension/tests/run_tests.mjs chrome` (ou `edge`) | local | Chrome ou Edge requis, environ 3 minutes. Non rejoué pour ce brouillon. |
| Vérifier le journal | `node server/server.mjs --verify-journal` | non | |

## 8. Référentiels (à vérifier avant publication)

NIST CSF 2.0 : Detect (DE.AE, DE.CM), Respond, Protect (PR.AT). ATT&CK : T1566, T1656, T1657. Détail et marquage "à vérifier" : `FICHE_DEFENSE_DRAFT.md`.

## 9. Sécurité du repo

Aucun secret dans le repo. Les clés (`FUJI_PRIVATE_KEY`, jetons Cloudflare ou Jev) vivent dans des variables d'environnement, jamais commitées (`docs/intent-barrier.md`). Données synthétiques ou publiques uniquement, aucune action contre un système réel.
