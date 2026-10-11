# Hold up : démo web (sans installation)

Un lien, rien à installer. Le jury ouvre la page, choisit un scénario, clique « Signer » dans un **faux** portefeuille, et la fenêtre « Hold up ! » retient la demande. Le moteur d'effets tourne **dans la page** (JavaScript pur) : aucune donnée n'est envoyée à un serveur. La page déclare d'ailleurs une politique `connect-src 'none'` : le navigateur lui-même refuserait tout envoi.

## Ce qu'on y trouve

| Page | Contenu |
|---|---|
| `index.html#demo` | Faux site + faux portefeuille, 8 scénarios en un clic (envoi simple, échange légitime, droit illimité vers un site piège, signature de permit piège, autorisation de tous les NFT, adresse sosie, changement de propriétaire du compte, faux support). Au clic sur « Signer » : question d'intention, puis « Tu as dit / En réalité » (4 lignes de texte clair), niveau, friction (délai réglable, Annuler toujours visible), panneau « Ce que le moteur a vu » pour le jury technique. |
| `index.html#colle` | « Colle une transaction » : on colle une requête `eth_sendTransaction` ou `eth_signTypedData_v4` (ou une transaction / un message seul) et on lit le verdict. Marche sur téléphone : c'est la version « application compagnon » sans installation. 16 exemples synthétiques du jeu public. |
| `index.html#journal` | Journal local dans le navigateur, chaîné par hachage (SHA-256 de la ligne précédente + celle-ci). Bouton « Retoucher une ligne » pour montrer que la chaîne se casse. |
| `limites.html` | Page « Limites » honnête. |

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
node --no-warnings webdemo/tests/run_webdemo_tests.mjs # 59 vérifications, écrit out/RESULTATS.json
```

Node 23.2 ou plus (`module.stripTypeScriptTypes`). Aucun paquet, aucun réseau.

Comment c'est fabriqué : `engine/src/*.mjs` est copié tel quel (seuls les suffixes d'import `.mjs` en `.js` changent, et `Buffer.byteLength` devient `TextEncoder`, qui donne le même nombre d'octets). Le comparateur d'Adem `engine/vendor/compare.ts` est converti en JavaScript par `stripTypeScriptTypes` (types effacés, logique intacte). `run/policy.mjs` et `U_textes_utilisateur.json` sont copiés. La colle « moteur vers verdict » est extraite de `server/server.mjs` (la plus à jour), sans la lecture de fichier ni le serveur HTTP ; les quatre remplacements sont listés dans `BUILD_INFO.json` et en tête de `engine/sentinelle_core.js`.

## Ce que cela prouve

- Le **même moteur** d'effets, le même comparateur et la même politique que le banc donnent, dans un navigateur, les mêmes verdicts : 83 cas (les 8 scénarios sous 6 réponses, plus les requêtes types et malformées), les 144 cas du jeu PUBLIC et les 385 du jeu DEV sont identiques, champ par champ, à la voie de référence (`server/server.mjs`, modules d'origine).
- « ok » ne sort jamais : le plus bas est « Aucun signal trouvé », avec la phrase « ce n'est pas une garantie ». Aucun écran n'affiche « OK », « protégé » ou « bloqué ».
- La page n'a besoin d'aucun serveur ni d'aucune bibliothèque externe (aucune URL externe chargée, pas de CDN, pas de `eval`, pas de secret), et le calcul prend environ 4 ms par verdict.
- Un jury peut juger la **présentation** (question d'intention, « Tu as dit / En réalité », friction, annulation) et le **texte clair** sans rien installer.

## Ce que cela ne prouve pas

- **Ce n'est pas l'extension.** Ici un faux site parle à un faux portefeuille écrit dans la page. Rien ne prouve que l'extension retienne toutes les demandes d'un vrai site avant un vrai portefeuille (voir `extension_standalone/` et `extension/`).
- Aucun vrai portefeuille, aucune vraie clé, aucune vraie signature. « Continuer quand même » ne signe rien.
- Le moteur n'a ici **aucun contexte en ligne** (âge d'un contrat, réputation, solde) ; il ne connaît que 5 adresses publiques, 4 jetons et le contexte fictif du scénario. Les verdicts réels pourraient différer.
- **Pas d'efficacité mesurée sur de vraies personnes** : les chiffres viennent de jeux de cas synthétiques écrits par l'équipe.
- L'interface n'a pas été vérifiée à l'œil dans un vrai navigateur par l'auteur de cette page : la logique de la fenêtre et de la page est exécutée dans un mini-DOM de test sous Node, pas dans Chrome ni Safari. La mise en page (surtout sur téléphone) reste à regarder.

## Approximations connues (voir aussi `limites.html`)

- Les réponses « Échanger une crypto » et « Autre » ne sont pas traduites en intention pour le comparateur (la colle de l'extension ne les connaît pas) : le verdict repose alors sur le seul moteur d'effets.
- Faux support : si la personne répond « Payer quelqu'un » à un envoi simple vers une adresse inconnue, le niveau reste « Aucun signal trouvé » : la pression lue sur la page n'est utilisée que si le moteur voit déjà un signal. Seule la réponse « On m'a demandé de le faire » déclenche « Manipulation ». C'est le cas de la fraude conforme.
- Textes de fiche approximatifs : l'ETH natif s'affiche « NATIVE » ; « ton contact » peut désigner une adresse inconnue ; un échange légitime est décrit « Cette opération envoie 0.1 WETH à ton contact, comme tu l'as dit » (la fiche F26 « aucun signal » parle d'envoi, pas d'échange).
- Sans compte signataire dans la requête collée, le moteur lit un droit comme celui d'un tiers et baisse le niveau. La page suppose alors que c'est toi qui signes et le dit.
- La retenue du niveau Manipulation est de 10 min dans le produit ; la démo la raccourcit à 30 s.
- Les noms de sites des 16 exemples du jeu public sont des étiquettes de test (certains ressemblent à de vraies marques) ; ils ne sont jamais contactés.
- Si le stockage du navigateur est refusé (navigation privée), le journal reste en mémoire jusqu'à la fermeture de la page.
