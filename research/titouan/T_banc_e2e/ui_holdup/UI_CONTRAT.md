# Hold up : contrat d'interface de la surface de verdict

Version 1 (11 oct. 2026). Fichiers : `verdict.html`, `verdict.css`, `verdict.js`. Direction visuelle : `docs/design/v4/R3-figma`.
La surface n'a aucune logique de sécurité : elle affiche ce que le moteur a décidé et renvoie ce que la personne a choisi.

## Transport

- Dans l'extension : `verdict.html` est chargée dans une iframe (ou une page d'extension). Elle envoie `{type:'holdup.ready', version:1}` à son parent, puis attend un message.
- Elle n'accepte que les messages dont la source est `window.parent` ou `window.opener`, avec `type:'holdup.verdict'` et `version:1`. Elle répond à l'origine de l'expéditeur (ou `*` si l'origine est `null`). **À durcir côté extension** : l'hôte doit vérifier `event.source` et `event.origin` de la réponse.
- Sans iframe : `HoldUp.render(conteneur, message, { onDecision })`, utilisé par `preview.html` et `check_ui.mjs`.
- Une décision par écran. Après la première, les clics suivants sont ignorés.

## Message reçu : `holdup.verdict`

```jsonc
{
  "type": "holdup.verdict", "version": 1,
  "id": "req-42",                    // renvoyé tel quel dans la décision
  "mode": "verdict",                 // "verdict" (défaut) | "intention"
  "site": "unlswap-app.com",         // facultatif
  "amount": "2 480 USDC",            // facultatif (non affiché seul : sert au journal)
  "theme": "auto",                   // "light" | "dark" | absent = selon le système
  "friction": { "type": "none" },    // voir plus bas
  "verdict": { ...verdict du moteur, voir plus bas... }
}
```

Pour `mode:"intention"` (une phrase + boutons) : `question` (facultatif, sinon « Que veux-tu faire sur {site} ? »), `choices` (facultatif, liste `{value,label}`; défaut : recevoir / payer / échanger / me connecter / on me l'a demandé). Pas de `verdict`.

### Objet `verdict` : champs réels du moteur

Ce sont ceux que renvoient `server/server.mjs` et `extension_standalone/src/sentinelle_core.js`. La surface n'en invente aucun, sauf ceux marqués **(nouveau)**.

| Champ | Type | Rôle |
|---|---|---|
| `level` | `danger` \| `attention` \| `manipulation` \| `unknown` | Niveau d'affichage du moteur. Choisit l'écran. |
| `niveau` | `critical` \| `warn` \| `info` | Niveau de gravité du moteur (critical = rouge, warn, info). `info` donne l'étiquette « Information », jamais un feu vert. |
| `fiche` | `F01`..`F30` \| null | Fiche de texte utilisée (informatif, jamais affiché). |
| `texts.croit` | texte | Ligne « Tu crois ». |
| `texts.reel` | texte | Ligne « En vrai ». |
| `texts.danger` | texte | Ligne « Le danger ». |
| `texts.action` | texte | Ligne « À faire ». |
| `reasons` | textes[] | Le moteur y met `[danger, action]`, et `Un vrai support ne te demandera jamais ça.` en tête pour la manipulation. Les lignes qui ne répètent pas une ligne déjà affichée vont sous « Pourquoi ? ». |
| `address_diff` | `{expected, actual, expectedLabel}` | Les deux adresses à comparer. `expected` = celle que la personne utilise d'habitude, `actual` = celle de la demande. Écran « sosie d'adresse » si `level` = `danger`. `actualLabel` facultatif **(nouveau)**. |
| `quote` | texte | Phrase repérée sur la page (manipulation). Coupée à 12 mots, affichée sous « Pourquoi ? ». |
| `indeterminate` | bool | `true` : écran « Vérification impossible » (jamais vert, jamais d'alerte rouge). |
| `title` **(nouveau)** | texte | Titre qui nomme la conséquence. Absent : la surface prend `texts.reel`. Recommandation : le moteur envoie `fiche.menace` de `U_textes_utilisateur.json`. |
| `gesture` **(nouveau)** | texte | Geste qui rompt la ligne (manipulation). Absent : « Raccroche, puis rappelle toi-même le numéro officiel. » |
| `raisons`, `codes`, `said`, `real`, `effects`, `risk_signals`, `latency_*`, `engine`, `why`, `texts_source`, `lead` | divers | Ignorés à l'affichage (codes techniques : jamais montrés à la personne). `said.amount` / `real.amount` ne servent que si `texts` est absent. |

Choix de l'écran (`HoldUp.pickScreen`) : `mode:"intention"` → intention ; `level:"manipulation"` → manipulation ; `level:"unknown"` ou `indeterminate` → vérification impossible ; `address_diff` + (`level:"danger"` ou `niveau:"critical"`) → sosie d'adresse ; `level:"danger"` → danger ; `niveau:"info"` → information ; sinon attention. Message vide ou incomplet : écran « attention » avec le texte de secours. Aucun écran vert, aucun « OK ».

### Friction : `friction`

| `type` | Champs | Comportement |
|---|---|---|
| `none` | | Continuer actif tout de suite. Annuler reste le bouton principal. |
| `wait` | `seconds` (1 à 3600, défaut 30) | Continuer désactivé jusqu'à la fin du compte à rebours (`role="timer"`, annonce vocale au début et à la fin). 30 s ou 600 s (manipulation) = hypothèses à mesurer, pas des faits. |
| `phrase` | `phrase` (défaut « Je veux continuer malgré le danger ») | Continuer désactivé jusqu'à ce que la phrase soit retapée (casse, espaces multiples et point final ignorés). Le collage est bloqué. La phrase peut changer à chaque fois (bras C). |

Annuler n'est jamais désactivé, ni pendant l'attente. C'est à l'hôte de choisir la friction par écran, par exemple : danger = `wait` 30 ; manipulation = `wait` 600 ; attention = `none`.

## Message renvoyé : `holdup.decision`

```jsonc
{
  "type": "holdup.decision", "version": 1,
  "id": "req-42",
  "decision": "cancel",              // cancel | continue | call_trusted | intent
  "via": "button",                   // button | escape
  "screen": "danger",                // danger | address | manipulation | attention | unknown | info | intention
  "time_to_decision_ms": 2345,       // de l'affichage à la décision (performance.now)
  "friction": { "type": "wait", "satisfied": true },
  // seulement pour decision == "intent" :
  "intent": "payer", "intent_message": "texte collé (2000 car. max)"
}
```

- `time_to_decision_ms` est la mesure demandée par MSG-038 (Akhawe & Felt 2013 : 47 % des outrepassements en moins de 1,5 s). L'hôte doit la journaliser pour chaque écran, y compris pour `cancel`.
- `continue` n'est émis que si la friction est satisfaite (`friction.satisfied:true`). L'hôte doit tout de même contrôler `friction.satisfied`.
- `call_trusted` : écran manipulation seulement. L'hôte ouvre ce qu'il a prévu (contact de confiance) et ne signe rien.
- `intent` : la personne a répondu à la question d'intention. L'hôte rappelle le moteur avec `body.intent` (voir `toIntent` dans `server.mjs`), puis affiche le verdict.

## Règles d'affichage (contrôlées par `check_ui.mjs`)

1. **12 mots maximum par ligne affichée.** Un nombre avec séparateur de milliers (`2 480`) compte pour 1 mot. Les signes seuls (« », tirets) ne comptent pas.
2. Aucun des mots interdits de `check_textes.mjs` (jargon, `ok`, `vert`, `protégé`, `bloqué`, vouvoiement). Les adresses (`data-raw`) et la citation de la page sont exemptées.
3. Texte uniquement via `textContent`. Aucun `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval`, `document.write`. Aucune URL externe, aucune police distante.
4. Annuler présent dans chaque écran, jamais en lien discret, en premier dans l'ordre du document ; sur les écrans de verdict c'est le bouton plein (`btn-primary`), Continuer est un bouton de même taille (`btn-secondary`).
5. Le focus initial est sur Annuler (jamais sur Continuer). Échap = Annuler. Tab reste dans la fenêtre (mode page).
6. Titre : nomme la conséquence (« Ce site pourra dépenser tes jetons »). Le titre n'est pas répété dans les lignes.

## Accessibilité

`role="alertdialog"`, `aria-modal`, `aria-labelledby` (titre) et `aria-describedby` (contenu). Zone `role="status"` pour les annonces (début et fin de l'attente, phrase correcte). Le niveau est dit en mots (Danger, Attention, Non vérifié...) et jamais par la couleur seule : le rouge s'accompagne de graisse et de soulignement, les groupes d'adresse qui diffèrent sont en gras souligné et un texte compte les différences. Texte de 20 px, cibles de 56 px, anneau de focus 3 px, thème clair/sombre (système ou `theme`), `forced-colors` et `prefers-reduced-motion` pris en charge. Contrastes : voir l'en-tête de `verdict.css` (21:1, 7:1, 4,83:1 en clair ; 21:1, 8,63:1, 7,52:1 en sombre).

## Écarts connus avec le moteur (à traiter côté moteur)

- Le moteur n'envoie pas `title`. Sans lui, le titre est `texts.reel`, plus long et parfois moins parlant que `fiche.menace`. Ajouter `title: FICHES[fid].menace` dans `server.mjs` et `sentinelle_core.js`.
- La citation `quote` de la page vient du texte brut de la page : elle est coupée à 12 mots côté surface.
- Les montants doivent arriver déjà formatés (« 2 480 USDC »).
