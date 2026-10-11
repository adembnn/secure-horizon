# Hold up : démo web (sans installation)

Positionnement (décision D-009) : MetaMask te prévient de ce qu'il reconnaît, Hold up vérifie ce que tu voulais faire. La démo montre la comparaison entre l'intention choisie et l'effet réel d'une demande. Elle ne montre pas, et ne prétend pas apporter, ce que MetaMask fait déjà (alertes de sécurité sur transactions et signatures, actives par défaut, Avalanche dans la liste des réseaux couverts : https://support.metamask.io/configure/wallet/security-alerts/, page lue le 11 oct. 2026). Fuji et les chaînes locales ne sont pas dans cette liste : le silence de MetaMask sur la démo ne prouve rien.

Un lien, rien à installer. Le jury ouvre la page, choisit un scénario, clique « Signer » dans un **faux** portefeuille, et la fenêtre « Hold up ! » retient la demande. Le moteur d'effets tourne **dans la page** (JavaScript pur) : aucune donnée n'est envoyée à un serveur. La page déclare d'ailleurs une politique `connect-src 'none'` : le navigateur lui-même refuserait tout envoi.

## Ce qu'on y trouve

| Page | Contenu |
|---|---|
| `index.html#demo` | Faux site + faux portefeuille, 13 scènes en un clic, rangées par rubrique (voir « Les scènes du pitch » plus bas) ; liste des cas du moteur : (envoi simple, échange légitime, « échanger 50 USDC » où le site réclame un droit illimité, droit illimité vers un site piège, signature de permit piège, autorisation de tous les NFT, changement de propriétaire du compte, faux support, et un envoi vers une adresse proche de celle d'un contact, gardé comme cas de test du moteur, pas comme apport de Hold up). Au clic sur « Signer » : question d'intention, puis « Tu crois / En vrai » (4 lignes de texte clair), niveau, friction (délai réglable, Annuler toujours visible), panneau « Voir les preuves techniques » pour le jury technique. La scène « échanger 50 USDC » affiche en plus l'intention écrite contre l'effet réel (« Ce que tu voulais » / « Ce que la demande fait ») et conclut « Ça ne correspond pas. » ; si rien n'est vu, la phrase est « Ça correspond, d'après ce que Hold up sait lire. Ce n'est pas une garantie. », jamais un OK ni un vert. |
| `index.html#colle` | « Colle une transaction » : on colle une requête `eth_sendTransaction` ou `eth_signTypedData_v4` (ou une transaction / un message seul) et on lit le verdict. Marche sur téléphone : c'est la version « application compagnon » sans installation. 16 exemples synthétiques du jeu public. |
| `index.html#journal` | Journal local dans le navigateur, chaîné par hachage (SHA-256 de la ligne précédente + celle-ci). Bouton « Retoucher une ligne » pour montrer que la chaîne se casse. |
| `limites.html` | Page « Limites » honnête. |

## Les scènes du pitch

| Rubrique | Scène | Ce qu'on voit |
|---|---|---|
| 1 · Échanger 50 USDC | Site honnête | Le site demande exactement 50 USDC à un routeur connu : « Ça correspond, d'après ce que Hold up sait lire. Ce n'est pas une garantie. » |
| | Temps 1 · routeur connu | Droit illimité vers un routeur de la liste « déjà utilisés » : « Ça ne correspond pas. », niveau Attention (pas Danger), « Tu peux limiter le droit à 50 USDC », bouton « Limiter à 50 USDC », pas d'attente (Q16). Le clic relit la demande limitée : « Ça correspond… ». Sans ta phrase, ce routeur passe sans alerte. |
| | Temps 2 · adresse neuve | Même demande vers une adresse inconnue : « Ça ne correspond pas. », Danger, 10 s au moins avant « Continuer quand même », aucune limitation proposée. |
| 2 · Coffre à signatures multiples | Le virement cache un appel délégué | L'écran du coffre affiche un virement de 20 USDC, la charge est un appel délégué vers un contrat inconnu : Danger (fiche F09), même sans phrase (plancher). Étiquette « Scène synthétique, adresses factices ». |
| | Version conforme | Même coffre, vrai virement de 20 USDC à Paul : « Aucun signal trouvé », « notre vérification est limitée », jamais vert. |
| 3 · Me connecter | La page réclame un Permit | « Me connecter à ce site » contre un Permit illimité : « Ça ne correspond pas. », Danger. Aucune limitation : pour une signature il n'y a rien à corriger. |

La troisième réponse, « Je n'ai pas pu vérifier cette demande. », s'affiche pour toute demande illisible (mode « Colle une transaction », un exemple du jeu public, et un test). Aucune scène ne la provoque.

Le routeur « connu » (`0xe5e5…`) et le coffre (`0x5afe…`) sont des adresses inventées. La logique de limitation (`corrige` dans `js/scenarios.js`, bouton dans `js/holdup.js`) n'est pas le code de l'extension : c'est la même demande, réécrite avec 50 USDC, relue par le même moteur.

## Publier sur Vercel (site statique, aucun build)

1. Pousser le dépôt sur GitHub, **avec** le dossier `webdemo/engine/` et `webdemo/js/exemples_public.js` (ils sont générés, mais Vercel ne lance aucun build : ils doivent être dans le dépôt).
2. Sur vercel.com : **Add New > Project > Import Git Repository**, choisir le dépôt.
3. **Root Directory** : le dossier `webdemo` (ici `research/titouan/T_banc_e2e/webdemo`).
4. **Framework Preset** : `Other`. **Build Command** : vide. **Output Directory** : vide (ou `.`). **Install Command** : vide. Il n'y a pas de `package.json`, donc rien n'est installé.
5. **Deploy**. Le fichier `vercel.json` ajoute seulement deux en-têtes de sécurité (`nosniff`, pas de référent).

Sans compte lié à Git : `npx vercel --prod` depuis le dossier `webdemo` fait la même chose.

## Publier sur GitHub Pages

Pages ne sait servir que la racine du dépôt ou `/docs`. Deux options :

- **Simple** : copier le contenu de `webdemo/` dans `/docs` à la racine du dépôt, puis **Settings > Pages > Deploy from a branch > main /docs**. Le fichier `.nojekyll` est déjà là.
- **Sans copier** : **Settings > Pages > Source : GitHub Actions**, avec un workflow qui téléverse le sous-dossier :

```yaml
name: pages
on: { push: { branches: [main] } }
permissions: { pages: write, id-token: write, contents: read }
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: "${{ steps.d.outputs.page_url }}" }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/upload-pages-artifact@v3
        with: { path: research/titouan/T_banc_e2e/webdemo }
      - id: d
        uses: actions/deploy-pages@v4
```

Tous les chemins sont relatifs : la page marche aussi sous `https://compte.github.io/depot/`.

## Aperçu sur ta machine (facultatif)

`node webdemo/serve_local.mjs` puis `http://127.0.0.1:8080/`. Double-cliquer `index.html` ne marche pas : les modules ES exigent `http(s)://`, pas `file://`.

## Reconstruire et vérifier

```
node --no-warnings webdemo/build_webdemo.mjs          # régénère engine/ et js/exemples_public.js (reproductible, hachages dans BUILD_INFO.json)
node --no-warnings webdemo/tests/run_webdemo_tests.mjs # 81 vérifications, écrit out/RESULTATS.json
```

Node 23.2 ou plus (`module.stripTypeScriptTypes`). Aucun paquet, aucun réseau.

Comment c'est fabriqué : `engine/src/*.mjs` est copié tel quel (seuls les suffixes d'import `.mjs` en `.js` changent, et `Buffer.byteLength` devient `TextEncoder`, qui donne le même nombre d'octets). Le comparateur d'Adem `engine/vendor/compare.ts` est converti en JavaScript par `stripTypeScriptTypes` (types effacés, logique intacte). `run/policy.mjs` et `U_textes_utilisateur.json` sont copiés. La colle « moteur vers verdict » est extraite de `server/server.mjs` (la plus à jour), sans la lecture de fichier ni le serveur HTTP ; les quatre remplacements sont listés dans `BUILD_INFO.json` et en tête de `engine/sentinelle_core.js`.

## Ce que cela prouve

- Le **même moteur** d'effets, le même comparateur et la même politique que le banc donnent, dans un navigateur, les mêmes verdicts : 89 cas (les 9 scénarios sous 6 réponses, plus les requêtes types et malformées), les 144 cas du jeu PUBLIC et les 385 du jeu DEV sont identiques, champ par champ, à la voie de référence (`server/server.mjs`, modules d'origine).
- « ok » ne sort jamais : le plus bas est « Aucun signal trouvé », avec la phrase « ce n'est pas une garantie ». Aucun écran n'affiche « OK » ni « protégé ».
- La page n'a besoin d'aucun serveur ni d'aucune bibliothèque externe (aucune URL externe chargée, pas de CDN, pas de `eval`, pas de secret), et le calcul prend environ 4 ms par verdict.
- Un jury peut juger la **présentation** (question d'intention, « Tu as dit / En réalité », friction, annulation) et le **texte clair** sans rien installer.

## Ce que cela ne prouve pas

- **Ce n'est pas l'extension.** Ici un faux site parle à un faux portefeuille écrit dans la page. Rien ne prouve que l'extension retienne toutes les demandes d'un vrai site avant un vrai portefeuille (voir `extension_standalone/` et `extension/`).
- Aucun vrai portefeuille, aucune vraie clé, aucune vraie signature. « Continuer quand même » ne signe rien.
- Le moteur n'a ici **aucun contexte en ligne** (âge d'un contrat, réputation, solde) ; il ne connaît que 5 adresses publiques, 4 jetons et le contexte fictif du scénario. Les verdicts réels pourraient différer.
- **Intention en texte libre non mesurée.** La démo propose des réponses à choix fermé. Clef et Jev n'ont jamais été appelés faute de clé : ne jamais écrire « Clef classe l'intention » sans mesure.
- **Hors démo, le produit livré rate beaucoup.** 41,2 % de rappel sur 6 191 arnaques synthétiques (`redteam/PRODUIT_VS_BANC.md`, photo du 11 oct.). Sans le contexte du banc : rappel 99,2 % → 83,8 %, fausses alertes critical 0,9 % → 13,9 % (`banc_realiste/BANC_REALISTE.md`).
- **Pas d'efficacité mesurée sur de vraies personnes** : les chiffres viennent de jeux de cas synthétiques écrits par l'équipe.
- L'interface a été regardée à 1280 px dans le navigateur intégré (page, limites, fenêtre : question, « Ça ne correspond pas », limitation, coffre conforme). Pas vérifiée sur Safari, Firefox ni téléphone : la mise en page étroite reste à regarder. La logique est aussi exécutée dans un mini-DOM de test sous Node.

## Approximations connues (voir aussi `limites.html`)

- La réponse « Autre » n'est pas traduite en intention : le verdict repose alors sur le seul moteur d'effets.
- Faux support : si la personne répond « Payer quelqu'un » à un envoi simple vers une adresse inconnue, le niveau reste « Aucun signal trouvé » : la pression lue sur la page n'est utilisée que si le moteur voit déjà un signal. Seule la réponse « On m'a demandé de le faire » déclenche « Manipulation ». C'est le cas de la fraude conforme.
- Textes de fiche approximatifs : l'ETH natif s'affiche « NATIVE » ; « ton contact » peut désigner une adresse inconnue ; un échange légitime est décrit « Cette opération envoie 0.1 WETH à ton contact, comme tu l'as dit » (la fiche F26 « aucun signal » parle d'envoi, pas d'échange).
- Sans compte signataire dans la requête collée, le moteur lit un droit comme celui d'un tiers et baisse le niveau. La page suppose alors que c'est toi qui signes et le dit.
- La retenue du niveau Manipulation est de 10 min dans le produit ; la démo la raccourcit à 30 s.
- Les noms de sites des 16 exemples du jeu public sont des étiquettes de test (certains ressemblent à de vraies marques) ; ils ne sont jamais contactés.
- Si le stockage du navigateur est refusé (navigation privée), le journal reste en mémoire jusqu'à la fermeture de la page.
