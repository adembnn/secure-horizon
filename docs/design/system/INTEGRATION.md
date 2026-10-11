# Hold up : appliquer le système au code de l'extension

11 oct. 2026. Cible : `research/titouan/T_banc_e2e/extension/`, lu en lecture seule à 10 h 13 (un autre agent y travaille : vérifier les numéros de ligne avant d'éditer). Source du design : `docs/design/system/` (`tokens.css`, `components.css`, `motion.css`, les écrans). Rien n'a été modifié dans l'extension par ce travail.

Ordre conseillé : chaque étape laisse l'extension utilisable. Après chaque étape, lancer les tests unitaires de `extension/tests/unit/` (plusieurs lisent des classes et des textes : voir l'étape 11).

## 0. Ce qui existe déjà et qu'on garde

`ui/screen.js` a déjà, depuis ce matin : les états `data-state`, `.is-entering`, `.is-leaving`, `.is-verdict-change`, `data-outcome`, `data-from-outcome` ; les durées `TIMING = { min: 400, loadingAfter: 150, leave: 80, guard: 700 }` ; le rappel de la première phrase (`s.first`) ; le message d'erreur du champ vide ; l'avertissement avant la limite de longueur ; `end(text, { wait })` ; le numéro de demande (`s.step`). `window.js` a `END_MS = 700`, l'attente de la suite d'une opération et le message d'expiration. `motion.css` est écrit pour ces noms-là : aucun renommage à faire côté code.

## 1. Polices

Rien à embarquer. Le fondateur a écarté les polices téléchargées : le système n'utilise que la police de la machine, `"Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Roboto, sans-serif`, en 400 et 600. Pas de dossier `extension/fonts/`, pas de `@font-face`, rien à ajouter à la politique de sécurité. Sur macOS ou Linux la pile retombe sur la police du système : mêmes tailles, mêmes graisses, largeur des lignes à 5 % près (les écrans ont de la marge).

## 2. Feuilles de style

1. Copier `tokens.css`, `components.css`, `motion.css` dans `extension/ui/`. Dans `components.css`, la fin du fichier (classes `pl-` et `mo-`, « cadre des planches ») ne sert qu'aux planches : la couper dans la copie.
2. `window.html` : remplacer `<link rel="stylesheet" href="ui/screen.css">` par les trois feuilles, dans cet ordre. Passer `<meta name="color-scheme" content="light dark">` à `content="dark"`.
3. `window.css` : `html, body { height: 100%; margin: 0; overflow: hidden; background: #000; }`. Supprimer le fond blanc et la requête de thème. C'est ce qui donne le fond noir dès la première image.
4. `ui/screen.css` : à supprimer quand l'étape 3 est finie. Ses jetons (`--hu-bg`, `--hu-signal`, `--hu-mono`, `--hu-r: 8px`…) disparaissent : plus de rouge, plus de police à chasse fixe.
5. `ui/sidepanel.html`, `options.html` : lier `tokens.css` et `components.css` (et `motion.css` pour le panneau) ; supprimer `ui/sidepanel.css` et le `<style>` de `options.html` une fois les étapes 6 et 7 faites.

## 3. `ui/screen.js` : la fenêtre

Le conteneur `#hu` reçoit `hu hu-k hu-win` (aujourd'hui `hu`). `window.html` doit contenir le symbole du gant (copier le `<symbol id="hu-glove">` qui est en tête de n'importe quel écran de `docs/design/system/`) : c'est du balisage statique, la politique de sécurité l'accepte.

### Structure

| Aujourd'hui | À la place |
|---|---|
| `frame()` : `main.hu-main > div.hu-col`, puis `div.hu-dock > p.hu-wait + div.hu-actions` | un seul `div.hu-stage` qui contient, dans l'ordre : `p.hu-head`, le contenu, `div.hu-dock`. Sur une réponse, le contenu est dans `div.hu-mid` (c'est lui qui centre en hauteur). `hu-actions` disparaît : le bas est une rangée à deux places |
| `h1.hu-title` (question) | `p.hu-head.hu-m` au-dessus : `<b>{site}</b> veut utiliser ton portefeuille.` puis `h1.hu-title.hu-m` : « Que veux-tu faire ? » |
| `p.hu-quiet.hu-first` sous le titre | `p.hu-head.hu-head--wrap.hu-m` **à la place** de la ligne du site : `Tu as écrit <b>« … »</b>` |
| `textarea.hu-field` (`rows = 3`) | `textarea.hu-field.hu-m` avec `style="--hu-i:1"` ; `hu-field--short` sur une relance ; retirer `rows` |
| `p.hu-error`, `p.hu-quiet.hu-count`, `p.hu-quiet` (statut) : trois frères | un `div.hu-under.hu-m` qui contient `p.hu-assume` (la ligne des suppositions) et `p.hu-busy` ; l'erreur (`p.hu-error`) ou le compte (`p.hu-count`) **remplacent** `hu-assume` dans cette même case. Ne plus utiliser `hidden` sur `hu-busy` : c'est `data-state="checking"` qui le montre |
| rien | `div.hu-got.hu-m` entre le champ et `hu-under` : `span.hu-got-say` « Ce que j'ai compris », puis trois `span.hu-slot` (chacun `span.hu-slot-q` + `span.hu-slot-v`), et `span.hu-got-from` si le compte est connu |
| `h1.hu-title` (réponse) | `h1.hu-verdict.hu-m` |
| rien | sur `mismatch` seulement, avant le `h1` : `<svg class="hu-glove" aria-hidden="true"><use href="#hu-glove"/></svg>` (`createElementNS`) |
| `p.hu-line` | `p.hu-line.hu-m` (`--hu-i:1`). Quand la ligne a deux phrases (« Tu as écrit 50 USDC. La demande en prend 5 000. »), deux `p` : le second porte `hu-line--strong` |
| `p.hu-line.hu-fix` | `p.hu-fix.hu-m` (`--hu-i:2`) : `<b>J'ai limité l'autorisation à 50 USDC.</b><span>Le site demandait tout ton USDC.</span>` |
| `div.hu-addr` et ses cases | mêmes classes. Ajouter `hu-m` et `--hu-i:2` sur `div.hu-addr`. Les cases en `span` conviennent (le CSS accepte `span > span`, `i` et `b`) |
| `div.hu-notes > p.hu-note` | supprimé. La ligne de modèle disparaît (étape 4). Le numéro de demande va dans `p.hu-head` : `<b>{site}</b>, demande 2 sur 2`. Le réseau : voir « non dessiné » en fin de document |
| `button.hu-btn.is-primary` | `button.hu-cuff` |
| `button.hu-btn` | `button.hu-word` |
| `p.hu-wait` (« Continuer sera possible dans 24 s. ») + bouton Continuer | `p.hu-wait` qui **contient** le geste : `button.hu-word[aria-disabled]` « Envoyer quand même » puis `span.hu-wait-count` : `dans <span class="hu-num">24</span> s`. À gauche dans `hu-dock` ; `button.hu-cuff` « Ne rien envoyer » à droite |
| « Ça correspond » : un bouton Annuler seul | à gauche `button.hu-word` « Ne rien envoyer », à droite `p.hu-leave` « Ça part vers ton portefeuille. ». Aucun indicateur |
| `p.hu-end` | même classe, plus `hu-m`, dans `div.hu-stage` |
| `last()` avec `wait` | écran « C'est parti vers ton portefeuille. » : `hu-head`, `hu-mid` (`hu-verdict`, `hu-line`, `hu-next`), `div.hu-dock.hu-dock--end > button.hu-word` « Fermer » (voir `ecran_fin.html`) |

Ordre des gestes dans `hu-dock` : toujours l'autre geste d'abord dans le document (à gauche), le geste conseillé ensuite (à droite). Le focus va sur le geste conseillé, comme aujourd'hui.

### États à ajouter (quatre lignes)

- `.is-opening` : dans `mount()`, `flag('is-opening', true)` ; le retirer au premier `draw()` suivant, ou le laisser (sans effet après 140 ms).
- `.is-next` : dans `draw()`, `flag('is-next', item.s && item.s.kind === 'answer' && item.s.step > 1)`.
- `.is-ready` : dans `tick()`, au moment où `open` devient vrai avec `waited` : `flag('is-ready', true)` ; le retirer dans `clear()`. Ne plus écrire « Tu peux continuer. » à l'écran (le compte s'efface et le mot se souligne) ; garder l'annonce dans la zone `role="status"`, avec le texte « Tu peux envoyer quand même. ».
- `.is-closing` : dans `window.js`, voir l'étape 5.

`.is-entering` et `.is-leaving` restent posés par `draw()` et `schedule()` : rien à changer. `.is-verdict-change` n'a pas d'animation propre (choix de design, `MOTION.md`).

Chaque élément listé avec `hu-m` ci-dessus doit porter la classe, sinon il apparaît d'un coup pendant que les autres arrivent. `--hu-i` se pose par `el.style.setProperty('--hu-i', '1')`.

### Textes (objet `T`)

| Clé | Aujourd'hui | À écrire |
|---|---|---|
| `cancel` | Annuler | « Annuler » sur la question ; **« Ne rien envoyer »** sur toute réponse (nouvelle clé `stop`) |
| `go` | Continuer | **Envoyer quand même** |
| `checking` | Vérification… | Je compare… |
| `comparing` | Je compare ta phrase à la demande. | inchangé |
| `noModel`, `byModel` | intention classée… | à supprimer de l'écran (les garder pour le journal exporté si besoin) |
| `first` | Tu as écrit : « … » | `Tu as écrit` + la phrase entre guillemets dans un `<b>` |
| `long`, `left` | inchangés | inchangés (« Il reste 40 signes. », à partir de 60 signes avant la limite : déjà le cas) |
| `ready` | Tu peux continuer. | Tu peux envoyer quand même. (annonce seulement) |
| `step` | Demande n° 2 de la même opération. | `, demande 2 sur 2` dans `hu-head` ; sans le total : `, deuxième demande du même échange` |
| `waitLine()` | Continuer sera possible dans 24 s. | ne rend plus que le nombre ; au-delà de 60 s : `dans 2 min 05 s` |

Espaces : insécable avant « : » et dans « 50 USDC », fine insécable avant « ? » et « ; ». L'outil des planches le fait (`typo()` dans `outil/construire.mjs`) ; dans le code, écrire les caractères ` ` et ` ` dans les chaînes.

## 4. `outcome.js`, `written_check.js`, `gatekeeper.js` : ce que l'écran doit recevoir

| Fichier | Changement |
|---|---|
| `outcome.js`, `TEXT.question` | ne rend plus « Que veux-tu faire sur {site} ? » mais « Que veux-tu faire ? » ; le site part dans un champ `site` de l'écran (déjà calculé par `siteName()`). Un nom de site long ne casse plus le titre |
| `outcome.js`, `TEXT.placeholder` | « échanger 50 USDC contre AVAX », sans « Par exemple : ». Le faire tourner avec « payer 20 USDC à 0x… », « déposer 50 USDC » si possible |
| `outcome.js`, `answerOf` | ne plus transmettre `noModel` ni `model` à l'écran. Scinder `line` en `said` (ce que tu as écrit) et `does` (ce que fait la demande) quand le texte vient de `written.line` |
| `written_check.js:630`, `limitText` | « J'ai limité l'autorisation à 50 USDC. » ; ajouter la seconde phrase (« Le site demandait tout ton USDC. ») dans un champ `fixWhy` |
| `written_check.js:104`, `ASK` | quatre relances ciblées : « Combien ? », « À quelle adresse ? », « Quelle monnaie ? », « Contre quoi ? » ; « Que veux-tu faire, et pour combien ? » reste pour une phrase non comprise. Aujourd'hui `pay` et `swap` demandent deux choses à la fois |
| `written_check.js`, textes d'écart | passer les phrases au lexique de `DESIGN.md` : plus de « jeton », « droit », « plafond », « signature », « simulation », ni de nombre brut |
| `gatekeeper.js:708`, écran `question` | ajouter `site`, `got` (voir plus bas), `account` |
| `gatekeeper.js:713`, écran `answer` | ajouter `stepTotal` quand il est connu |
| `gatekeeper.js:63`, `WIN` | inchangé (440 × 540). Titre : `document.title = 'Hold up : ' + site` dans `window.js` |
| `gatekeeper.js`, expiration | une demande retenue sans geste expire après trois minutes : `LIMITS.expireAfterMs` existe pour l'étape `grill` ; l'étendre aux étapes `intent` et `verdict` |

## 5. `window.js`

- `TEXT.sent`, `cancelled` : inchangés. `TEXT.expired` : « Demande expirée. Rien n'a été envoyé. » et ne plus fermer la fenêtre après 700 ms dans ce cas : la personne est partie, elle doit pouvoir le lire en revenant. Dessiner l'écran `fin-expiree` (`ecran_fin.html`) avec le bouton « Fermer ».
- `end()` : poser `.is-closing` sur `#hu` 120 ms avant `window.close()` : `setTimeout(() => root.classList.add('is-closing'), lead + END_MS - 120)`.
- `fit()` : il lit `.hu-main` ; lire `.hu-stage` à la place. Garder `grow()` (agrandir la fenêtre quand le zoom la rétrécit) : c'est la meilleure réponse au zoom. Les paliers de `components.css` (125, 150, 200 %) prennent le relais quand l'écran est trop petit pour agrandir. `scaleTo()` (réduction par `zoom`) devient un dernier recours : avec les paliers il ne devrait plus se déclencher ; ne pas le retirer avant de l'avoir vérifié à 200 %.
- `DESIGN = { w: 422, h: 493 }` : inchangé.

## 6. `ui/sidepanel.js`, `ui/sidepanel.html`

`<main id="panel">` reçoit `hu hu-panel`. Ordre et classes (`panneau_lateral.html`) :

1. `div.hu-top` : `span.hu-name` « Hold up », `span.hu-2` « Actif » ou « Inactif ».
2. `div.hu-scroll` (`tabindex="0"`, `role="region"`, `aria-label="Journal"`) qui contient :
   - `h2.hu-h` « Ce que tu as laissé ouvert » puis `ul > li.hu-right` : une phrase (`{site} peut dépenser {montant}.`) et `button.hu-word` « Retirer l'autorisation ». Pendant le retrait : `li.hu-right.is-busy` et `span.hu-right-note` « En cours… » ; après : `is-done`, phrase en `hu-2`, « Retirée ». `p.hu-note` : « Ton portefeuille te demandera de confirmer. »
   - par jour, `h2.hu-h` (« Aujourd'hui », « Hier », puis la date) et `ol > li.hu-entry` : `time`, `span.hu-entry-site`, `span.hu-entry-what`. Un écart : `<strong>Ça ne correspondait pas.</strong> Tu n'as rien envoyé.`
3. `div.hu-foot` : `button.hu-word` « Effacer le journal » (second appui : « Effacer pour de bon ? », déjà codé), « Réglages », « Exporter le journal ».

À retirer du panneau : la version, le compteur « demandes vérifiées, annulées », « Comment ça marche » (c'est le rôle de la page de bienvenue), la phrase sur le journal chaîné (elle va dans les réglages). L'avertissement « je n'ai pas pu me placer devant le portefeuille » reste, en `p.hu-error` en tête de `hu-scroll`.

Textes `REVOKE` : `title` « Ce que tu as laissé ouvert », `none` « Tu n'as rien laissé ouvert sur cet onglet. », `button` « Retirer l'autorisation ». Phrases du journal : « Ça correspondait. », « Ça ne correspondait pas. », « Je n'ai pas pu vérifier. », suivies de « Tu n'as rien envoyé. » ou « Tu as envoyé quand même. ».

Arrivée d'une ligne : `render()` vide et redessine tout aujourd'hui. Pour l'animation, insérer la seule ligne neuve en tête de la liste du jour, mesurer sa hauteur, poser `--hu-dy` (moins cette hauteur) et `.is-pushed` sur les lignes et blocs qui suivent, `.is-arriving` sur la neuve, et retirer ces classes après 260 ms. Le code exact est dans `outil/src/motion.js`, démonstration `entry`. À l'ouverture : `.is-opening` sur `#panel`.

## 7. `options.html`, `options.js`

`<main>` devient `div.hu.hu-tab > div.hu-tab-in > div.hu-col`. Titre `h1.hu-page-title`, sections `h2.hu-h`, une ligne par réglage : `div.hu-set` (le libellé à gauche, `span.hu-set-ctl` à droite).

| Identifiant | Libellé | Contrôle |
|---|---|---|
| `askIntent` | Je te demande ce que tu veux faire | `span.hu-pick > select.hu-select` : « à chaque demande », « quand un site veut une autorisation ou de l'argent », « jamais » |
| `window` (s'il est encore là) | Je pose la question dans une fenêtre à part | `label.hu-switch`, mots « Oui » / « Non » |
| `limitUnlimited` | Je limite l'autorisation au montant que tu as écrit | `label.hu-switch` |
| `dangerWait` | Quand ça ne correspond pas, tu attends avant de pouvoir envoyer quand même | `input.hu-input` + « secondes » |
| `manipHold` | Quand quelqu'un te presse sur la page, je retiens la demande | `input.hu-input` + « minutes » (convertir : le code compte en secondes) |

Enregistrer à chaque changement et écrire « Enregistré. » (`p[role=status]`, classe `hu-saved`) sous le titre ; retirer le bouton « Enregistrer ». Une valeur hors bornes : `aria-invalid="true"` sur le champ et `span.hu-error` à côté (« Entre 5 et 600 secondes. J'ai gardé 30. »).

Le carnet d'adresses, « Mes adresses » et « Contrats que j'utilise » sont apparus dans le code pendant ce travail et **ne sont pas dessinés**. En attendant : même grammaire, une section `h2.hu-h` chacune, une ligne `div.hu-set` par entrée (le nom et l'adresse à gauche, `button.hu-word` « Retirer » à droite), et pour l'ajout deux `input.hu-input` (largeur libre, alignés à gauche : surcharger `width` et `text-align`) suivis d'un `button.hu-word` « Ajouter ».

## 8. `bridge.js` : le repli dans la page

Le bloc `CSS` (lignes 129 et suivantes) et les fonctions qui dessinent bandeaux, colonnes et minuteur sont l'ancien design rouge : à remplacer en entier. Dans la racine fermée (`attachShadow`), poser le texte de `tokens.css` + `components.css` + `motion.css` (un script de contenu ne peut pas lier une feuille de l'extension sans l'exposer à la page : l'embarquer en chaîne au moment du build), puis :

`div.hu-over > div.hu-over-box > div.hu.hu-k.hu-win` et monter le même `HoldupScreen` que la fenêtre. `:root` n'existe pas dans une racine fermée : remplacer le sélecteur `:root` de `tokens.css` par `:host` dans la copie embarquée. Écran : `repli_dans_la_page.html`. Mêmes états, mêmes textes. Le voile (`rgba(0,0,0,.6)`) n'est pas un décor : il empêche de cliquer le site tant que la question est là.

## 9. Nouvelle page `popup.html`

Fichiers : `extension/popup.html`, `extension/popup.js`. Balisage : `popup.html` de ce dossier, sans le cadre de planche (`body.hu.hu-pop`, largeur 320). Trois états : actif, en pause sur ce site, page où rien n'est à vérifier.

Manifeste : `"action": { "default_title": "Hold up", "default_icon": {…}, "default_popup": "popup.html" }`.

Conséquence à traiter dans le même changement : avec un popup, le clic sur l'icône n'ouvre plus le panneau. Dans `background.js:30`, passer `openPanelOnActionClick` à `false`. Le mot « Journal » du popup ouvre le panneau : `chrome.sidePanel.open({ windowId })`, appelé dans le geste de l'utilisateur. Cette fonction demande Chrome 116 : passer `minimum_chrome_version` de 114 à 116. « Réglages » : `chrome.runtime.openOptionsPage()`.

`popup.js` lit le site de l'onglet actif (permission `activeTab` à ajouter, ou demander au service worker qui connaît déjà l'origine de l'onglet), la dernière ligne du journal pour ce site, et l'état de pause. Classe `.is-opening` sur `body` au chargement.

## 10. Nouvelle page `welcome.html`

Fichiers : `extension/welcome.html`, `extension/welcome.js`. Balisage : `bienvenue.html` (`div.hu.hu-tab.hu-welcome`). L'icône est `icons/icon48.png` (ou le symbole `hu-icon`).

Ouverture : dans `background.js`, `chrome.runtime.onInstalled.addListener((d) => { if (d.reason === 'install') chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') }); })`. Aucune déclaration dans le manifeste : une page de l'extension ouverte par l'extension n'a pas à figurer dans `web_accessible_resources`, et il ne faut pas l'y mettre. Le bouton « Essayer sur une page de test » ouvre une page de démonstration locale, à fournir.

## 11. Icône, pastille, tests, paquet

- Pastille : `chrome.action.setBadgeBackgroundColor({ color: '#ffffff' })` et `setBadgeTextColor({ color: '#000000' })` une fois ; texte vide quand tout va bien, « II » en pause sur l'onglet, « × » à l'arrêt. `gatekeeper.js:542` écrit « 1 » quand une demande attend : à garder, c'est utile, avec les mêmes couleurs.
- Tests unitaires : `tests/unit/sidepanel.test.mjs`, `flow.test.mjs`, `gatekeeper.test.mjs` lisent des textes (« Continuer », « Révoquer », « Droit limité ») et des classes (`hu-btn`, `is-primary`). Les mettre à jour dans le même changement que les fichiers qu'ils couvrent.
- `extension_standalone/` : il a sa propre copie de `options.html` et un dossier construit en retard. Reconstruire après chaque étape, sinon la version livrée garde l'ancien design.
- Contrôle : `node docs/design/system/outil/capturer.mjs 1.25 1.5 2` pour les maquettes ; `coord/reports/eval_design_1/mesures/` (`flow.mjs`, `static.mjs`) pour la vraie fenêtre.

## 12. Ce que les écrans montrent et que le code ne sait pas encore alimenter

| Sur l'écran | État du code | Ce qu'il faut |
|---|---|---|
| « Ce que j'ai compris » pendant la frappe | `extractFields` (`intent_text.js`) n'est appelé qu'à la vérification, dans le service worker | l'appeler dans la page à chaque frappe (avec 150 ms de retenue), ou n'afficher la ligne qu'après la première vérification. Sans cela : ne pas dessiner `hu-got` |
| La troisième place qui change de mot (« à qui » devient « contre quoi ») | pas de notion de place | déduire du verbe compris : échange → « contre quoi », envoi → « à qui », connexion → places 2 et 3 en `is-off` |
| « depuis ton compte 0x71c4…9a3f » | l'adresse est dans la demande (`from`), pas transmise à l'écran | l'ajouter à l'écran `question` |
| La ligne des suppositions | texte fixe, aucun besoin de données | une chaîne dans `T` |
| Relances « Quelle monnaie ? », « Contre quoi ? », « À quelle adresse ? » | quatre textes qui demandent deux choses à la fois | étape 4 |
| La place « ce qui manque » en blanc sur la relance (`is-missing`) | inconnu de l'écran | transmettre le champ manquant avec la relance |
| Deux lignes d'écart (ce que tu as écrit, ce que fait la demande) | une seule chaîne `line` | étape 4 (`said`, `does`) |
| « Le site demandait tout ton USDC. » sous l'autorisation limitée | absent | `fixWhy` |
| « demande 1 sur 2 » et « Ensuite, l'échange contre AVAX. » | le code connaît le rang (`step`), ni le total ni la suite | montrer le rang seul, et retirer `hu-next`, tant que le total n'est pas connu |
| « Réessayer » sur « Je n'ai pas pu vérifier » | aucune décision de ce nom | une décision `retry` qui relance la vérification sans redemander la phrase |
| « Écrire autrement » | la relance n'existe qu'une fois, avant la réponse | une décision `rewrite` qui revient à la question avec la phrase déjà écrite dans le champ |
| La raison de « pas pu vérifier » (« La vérification n'a pas répondu. », « Je n'ai pas compris ta phrase. ») | `verdict.why` existe en interne, en mots de développeur | deux ou trois raisons en clair, choisies par `outcomeOf` |
| « Demande expirée » qui reste à l'écran | la demande expire, le message s'affiche 700 ms puis la fenêtre se ferme | étape 5 ; et l'expiration à trois minutes pour toute étape |
| Popup : « Je vérifie ce site. », pause par site, dernière ligne pour ce site | rien de cela n'existe | page, réglage de pause par origine dans `chrome.storage.local`, et `inject.js` qui le respecte (fichier réservé) |
| Popup : « Je ne peux pas agir sur cette page. » | inconnu | détecter les adresses `chrome://`, `edge://`, la boutique d'extensions |
| Panneau : « {site} peut dépenser 50 USDC. » et les états « En cours… », « Retirée » | la révocation est branchée (`hu.revoke.*`) avec ses propres textes et étapes | reformuler ; garder les étapes du portefeuille en `p.hu-note` sous la ligne |
| Panneau : journal par jour, phrase en mots de réponse | le journal garde `outcome` depuis ce matin (`BY_LEVEL` en repli) ; pas de regroupement par jour | regrouper dans `summarize()` |
| Réglages : « minutes » pour la retenue, enregistrement à chaque changement, « J'ai gardé 30. » | secondes, bouton Enregistrer, correction muette | étape 7 |
| Page de bienvenue, « Essayer sur une page de test » | n'existe pas | étape 10 et une page de démonstration |
| Pastille « II », « × » | seule « 1 » existe | étape 11 |

## 13. Ce que le code montre et que le design n'a pas dessiné

- Le **réseau** de la demande (`s.network`, « Réseau : Avalanche. »). Proposition : le dire dans la ligne du site quand ce n'est pas le réseau habituel de la personne (« app.neve.exchange, sur Fuji »), le taire sinon. À trancher.
- Le **carnet d'adresses** et les deux autres listes des réglages (étape 7).
- Les **étapes de révocation** et les messages du portefeuille (`g.says`, `g.steps`) dans le panneau.
- Les **questions sociales** de l'étape `grill` (« quelqu'un te guide ? ») : si elles existent encore, elles ont besoin d'un écran. Aucun n'a été demandé ni dessiné.
- L'état `waiting` avec `waitText` : dessiné (`fin-attente`), mais avec un texte raccourci.
