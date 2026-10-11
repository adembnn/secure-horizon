# Brancher revoke.js dans l'extension (spécification)

Statut (11/10/2026) : côté JS branché et testé. L'écran reste à faire dans `ui/` (Adem), voir la section 10.

Fait :
- `gatekeeper.js` : après « continue » (décision `confirm`), `keepGrant` calcule `revocationFor` sur la demande telle qu'elle est partie (les params limités par Hold up s'il y en a), garde le résultat dans `storage.session`, clé `hu:grant:<tabId>`, cinq au plus, effacé à la fermeture de l'onglet. Badge `1` sur l'icône. `wallet_sendCalls` : chaque appel est lu.
- Messages `hu.revoke.get`, `hu.revoke.send`, `hu.revoke.check` : acceptés seulement depuis `ui/sidepanel.html`. Un message qui porte `request`, `params`, `to`, `data`, `from`, `method`, `tx` ou `value` est refusé (`{ refused: true }`).
- `hu.revoke.send` n'envoie que les cas `revocable` et `oneClick` (sinon `{ state: 'error', code: 'not_one_click' }`).
- `bridge.js` relaie `hu.revoke.run` vers `inject.js` par le canal privé, et refuse si le site de l'onglet a changé (`origin_changed`).
- `inject.js` appelle la méthode `request` d'origine du fournisseur de la dernière demande autorisée de ce cadre. Pas de nouvelle retenue, donc pas de boucle.
- La marque : jeton du service worker, 32 hexa, usage unique, 8 s, lié à l'onglet, au cadre et à l'empreinte SHA-256 du contenu. Il ne sert que si le portefeuille repasse plus tard par une méthode enveloppée avec une copie. Un jeton inventé, réutilisé, tardif, d'un autre onglet ou pour un autre contenu est ignoré : la demande est retenue comme les autres. La page ne voit jamais le jeton et ne peut pas l'ajouter (la charge envoyée au pont est construite par `inject.js`).
- Journal chaîné : ligne `revocation` (m = kind, d = submitted | rejected | error). Journal local : `request_sha256`, aucune adresse.
- Tests : `tests/unit/revoke_branchement.test.mjs` (13 tests).
- Limite connue : pendant 8 s, la page peut renvoyer exactement la même demande de retrait et elle passera une fois sans question. Elle ne fait que remettre le droit à zéro.

## 1. Ce que revoke.js fournit

`revocationFor(request, opts)` prend la demande telle que la page l'a envoyée au portefeuille (`{ method, params, chainId, from }`) et rend un objet de données (JSON sûr, sans fonction) :

| `status` | Sens | Bouton |
|---|---|---|
| `revocable` et `oneClick: true` | Une seule transaction retire le droit (approve à 0, setApprovalForAll à false, Permit2.approve à 0, verrouillage) | « Révoquer ce droit » |
| `revocable` et `oneClick: false` | Plusieurs transactions (Permit2 : invalider le numéro puis verrouiller) | « Voir comment annuler ce droit » |
| `two_steps` | Signature hors chaîne (Permit EIP-2612, DAI) : on signe un permit sans effet puis on l'envoie | « Voir comment annuler ce droit » |
| `needs_info` | `approve(address,uint256)` est identique pour un jeton et un NFT, ou le compte manque | aucun bouton, un texte |
| `not_revocable_by_click` | Signature hors chaîne inconnue | aucun bouton |
| `not_a_grant` | Aucun droit accordé | aucun |

`requests[]` contient des demandes PRÊTES pour le portefeuille : `{ method: 'eth_sendTransaction' | 'eth_signTypedData_v4', params, does, submitTo: 'wallet' }`. `ifAlreadyUsed[]` contient celles à proposer si la signature a déjà été envoyée. `says`, `steps`, `limits` sont les textes français (tutoiement, sans tiret long). `signedByHoldUp` vaut toujours `false`.

Fonctions annexes : `buttonLabel(result)`, `permitNonceSpendTx(result, signature, chainId)` (deuxième étape d'un Permit, après la signature du permit sans effet), `revocationForRight(right, owner, chainId)` (à partir d'un droit déjà lu par `effect_sim.js`).

## 2. Où l'appeler

**gatekeeper.js**, à l'endroit où la décision « confirm » (la personne a passé outre) est journalisée (`journal({ type: 'decision', ... decision: 'confirm' ...})`, vers la ligne 583) :

1. Calculer `const r = revocationFor({ method: rec.method, params: <paramètres de la demande>, chainId, from }, { tokenKind })`.
2. Si `r.status` n'est pas `not_a_grant`, garder `r` dans `chrome.storage.session` (jamais `local`), clé `hu:grant:<tabId>`, avec `origin`, l'heure et `rid`. Une valeur par onglet, les cinq dernières au plus, effacées à la fermeture de l'onglet.
3. `tokenKind` : `'erc20'` si `rec.verdict.effects` ou la mesure de `effect_sim.js` (`grants[]`, jeton lu avec `readToken`) montre un jeton à décimales ; `'erc721'` si un NFT. Sans réponse, ne rien passer : le résultat est alors `needs_info` et aucun bouton n'est montré. Ne jamais deviner.
4. Poser le badge de l'icône : `chrome.action.setBadgeText({ text: '1', tabId })`. Le panneau latéral ne s'ouvre pas tout seul (règle déjà posée dans `ui/sidepanel.js` : jamais ouvert par une demande de page).

Ne rien écrire d'autre. Le journal de l'extension ne contient jamais d'adresse (règle actuelle) : les adresses du droit restent dans `storage.session`.

## 3. Quel bouton, quelle fenêtre

**Panneau latéral** (`ui/sidepanel.js`), pas la fenêtre de retenue : la fenêtre se ferme dès la décision et ne doit pas servir à autre chose que décider avant la signature.

Dans le panneau, une section « Droit accordé » quand `hu:grant:<tabId du panneau>` existe :

- Phrase : « Tu as continué. {site} peut maintenant dépenser tes {jeton} sans limite. » (texte du démonstrateur, `webdemo/js/apres.js`, `whatItDoes`).
- Jeton, adresse qui reçoit le droit (grille à 2 rangées déjà utilisée par la fenêtre), montant.
- Bouton plein « Révoquer ce droit » si `oneClick`, sinon bouton discret « Voir comment annuler ce droit » qui déplie `steps` et `limits`. Un seul bouton plein par écran.
- Sous le bouton : « Hold up prépare la demande de retrait. Ton portefeuille te la montre, c'est toi qui signes. Hold up ne signe jamais. » (c'est `says` pour les cas `oneClick`).
- Pas de rouge (le signal reste réservé à « Ça ne correspond pas »).

## 4. Quel message

Préfixe `hu.` comme `hu.poll`. Trois messages, du panneau vers le service worker :

| Message | Contenu | Réponse |
|---|---|---|
| `hu.revoke.get` | `{ tabId }` | `{ result, origin, at }` ou `{ none: true }` |
| `hu.revoke.send` | `{ tabId, index }` (`index` dans `requests[]`) | `{ state: 'submitted' \| 'rejected' \| 'error', code? }` |
| `hu.revoke.check` | `{ tabId }` | `{ state: 'zero' \| 'still_active' \| 'unknown' }` |

Le service worker ne reçoit jamais `to`, `data` ou `from` du panneau : il relit la demande dans `storage.session`. Un message qui porte une demande est refusé (même principe que les jetons de `securite_s5_jeton`).

## 5. Comment la demande arrive au portefeuille

Hold up ne signe pas, ne détient aucune clé et ne parle à aucun nœud pour envoyer. Seul le fournisseur de la page (`window.ethereum`) connaît le portefeuille. Chemin :

1. `background.js` envoie `{ type: 'hu.revoke.run', params }` à `bridge.js` de l'onglet d'origine (frame 0) ; `bridge.js` le passe à `inject.js` (monde MAIN) par le canal privé existant (MessageChannel + jeton aléatoire).
2. `inject.js` appelle la méthode `request` d'origine, celle capturée avant l'enveloppe (zone NATIVES), avec `requests[index]`. Cet appel ne doit pas repasser par la retenue Hold up (sinon boucle) : jeton à usage unique, lié à `rid`, valable quelques secondes, créé par le service worker, comparé à un empreinte du contenu.
3. Le portefeuille ouvre sa propre fenêtre : la personne lit et signe, ou rejette. `inject.js` renvoie `submitted` (la promesse se résout), `rejected` (code 4001) ou `error`.

Point à dire à la personne AVANT le clic, dans le panneau : le portefeuille affichera le nom du SITE d'origine comme demandeur, pas Hold up, parce que la demande part du fournisseur de cette page. C'est le site qui a demandé le droit. La phrase : « Ton portefeuille va afficher le nom du site. C'est normal : lis bien ce que la demande fait. Elle remet le droit à zéro. »

Repli si la page est fermée ou que le fournisseur a disparu : message « Ouvre à nouveau le site ou ton portefeuille, puis reviens ici. », bouton inactif. Ne pas ouvrir de page tierce.

## 6. Après la réponse

- `submitted` : afficher « Retrait envoyé à ton portefeuille. » puis, quand l'état du réseau le permet, `hu.revoke.check` : relire `allowance(owner, spender)` (ou `isApprovedForAll`) par `eth_call` via le même relais que `effect_sim.js` (`READ_METHODS` ne contient que lecture). `0` → « Le droit est à zéro. » Jamais « protégé », jamais « sûr ». Sans réponse du réseau : « Je n'ai pas pu relire le droit. » Rien d'autre.
- `rejected` : « Tu as rejeté la demande. Le droit est toujours actif. » Le bouton reste disponible.
- Journal chaîné (`journal_chain.js`, `chainAppend`) : `{ type: 'revocation', origin, kind, wallet: 'submitted'|'rejected'|'error', request_sha256 }`. Aucune adresse, aucun montant. Même formule d'empreinte que le reste : la ligne est rejouable (`sha256(prev|seq|ts|JSON(entry))`), comme dans `webdemo/js/incident.js`.
- Fiche d'incident : bouton « Voir la fiche d'incident » (sur demande seulement). Le générateur d'Adem (`research/demo_reelle/reponse/incident.mjs`) lit un journal fichier ; dans l'extension, la version navigateur est `webdemo/js/incident.js` (`buildFiche`, `renderFiche`), à déplacer dans `extension/` si on la veut hors ligne. Elle lit la ligne de décision et la ligne de retrait.

## 7. Rien à changer côté permissions

Pas de nouvelle permission, pas de nouvel hôte, la CSP ne bouge pas (revoke.js n'a ni réseau ni import). `chrome.action` badge ne demande pas de permission supplémentaire.

## 8. Tests à ajouter au branchement

- Après « confirm » sur un approve illimité : `hu:grant:<tab>` existe dans `session`, pas dans `local`, et le journal ne contient aucune adresse.
- `hu.revoke.send` avec une demande dans le message : refusé.
- `inject.js` : l'appel de retrait ne repasse pas par la retenue ; un second appel avec le même jeton est refusé.
- Rejet 4001 : état `rejected`, bouton encore actif.
- Permit hors chaîne : jamais de bouton « Révoquer ce droit ».
- Texte : aucun des mots OK, bloque, sûr, protégé, garanti, remboursement.

## 9. Ce que cette version ne fait pas

- Les cas `two_steps` et `oneClick: false` (Permit, Permit2 avec signature) ne sont qu'expliqués. Brancher `permitNonceSpendTx` demande de recevoir la signature du portefeuille (`eth_signTypedData_v4`) puis d'envoyer la seconde demande : deux allers-retours, à faire après le premier branchement.
- Aucun inventaire des droits existants (c'est le rôle de `research/demo_reelle/reponse/revoke.mjs`, qui lit la chaîne ; il demande `ethers`, absent de `blockchain/node_modules` dans ce dépôt).
- Une révocation ne ramène pas ce qui a déjà été pris.

## 10. Ce que l'UI doit ajouter (pour Adem, dans `ui/sidepanel.js`)

Aucun autre fichier à toucher : pas de permission, pas de manifeste. L'identifiant d'onglet s'obtient par `chrome.tabs.query({ active: true, currentWindow: true })` (l'`id` ne demande pas la permission `tabs`).

**Où.** Dans le panneau latéral, une section « Droit accordé », juste après « Hold up est actif. » et avant « Aujourd'hui ». Absente si `hu.revoke.get` répond `{ none: true }` : le test actuel du panneau attend alors exactement les trois boutons existants.

**Données.** `chrome.runtime.sendMessage({ type: 'hu.revoke.get', tabId })` rend `{ result, origin, at, id, wallet, grants: [{ id, result, origin, at, wallet }] }` (le plus récent d'abord). Afficher un bloc par droit, cinq au plus. Ne rien stocker côté panneau.

**Contenu d'un bloc**, tout en `textContent` :
1. Titre : « Tu as continué. {site} peut maintenant dépenser {jeton} sans limite. » si `result.grant.unlimited`, sinon « Tu as continué. {site} peut maintenant dépenser {jeton}. ». {site} vient de `origin` (même coupe que `siteLabel`). {jeton} : « tes jetons », ou le libellé déjà dans `result.says`.
2. Grille à 2 rangées : « Qui reçoit le droit » (`result.grant.spender`, adresse complète, groupes de 4) et « Montant » (« sans limite » ou `result.grant.amount`).
3. Avant le bouton, toujours : « Ton portefeuille va afficher le nom du site, pas Hold up. C'est normal : lis bien ce que la demande fait. Elle remet le droit à zéro. »
4. Bouton selon `buttonLabel(result)` (copier la fonction de `revoke.js`, ou tester `result.status === 'revocable' && result.oneClick`) :
   - « Révoquer ce droit » : bouton plein, le seul bouton plein de l'écran. Clic : `{ type: 'hu.revoke.send', tabId, id }`. Ne jamais mettre `params`, `to`, `data` ou `from` dans ce message : il serait refusé.
   - « Voir comment annuler ce droit » : bouton discret qui déplie `result.steps` puis `result.limits`. Aucun envoi.
   - `needs_info` et `not_revocable_by_click` : pas de bouton, seulement `result.says`.
5. Sous le bouton : « Hold up prépare la demande de retrait. Ton portefeuille te la montre, c'est toi qui signes. Hold up ne signe jamais. »
6. Toujours, en petit : « Une signature hors chaîne (Permit) ne se révoque pas toujours en un clic. Retirer un droit ne ramène pas ce qui est déjà parti. »

**Après le clic** (réponse de `hu.revoke.send`) :
- `submitted` : « Retrait envoyé à ton portefeuille. » Puis, après quelques secondes, `{ type: 'hu.revoke.check', tabId, id }` : `zero` → « Le droit est à zéro. » ; `still_active` → « Le droit est encore actif. La transaction n'est peut-être pas encore confirmée. » ; `unknown` → « Je n'ai pas pu relire le droit. »
- `rejected` : « Tu as rejeté la demande. Le droit est toujours actif. » Le bouton reste actif.
- `error` avec `code` `no_provider`, `origin_changed`, `no_answer` ou `timeout` : « Ouvre à nouveau le site ou ton portefeuille, puis reviens ici. » Bouton inactif jusqu'au prochain rendu.
- `error` avec `not_one_click` : ne doit pas arriver (pas de bouton plein dans ce cas).

**Règles.** Pas de rouge (réservé à « Ça ne correspond pas »). Jamais les mots OK, bloqué, sûr, protégé, garanti, remboursement. Pas de tiret long. Le bouton est désactivé pendant l'attente de la réponse (le portefeuille peut rester ouvert plusieurs minutes, délai maximal 5 min).

**Tests à ajouter dans `sidepanel.test.mjs`** : section absente sans droit ; « Révoquer ce droit » présent pour un approve illimité, absent pour un Permit ; le message envoyé ne contient que `type`, `tabId`, `id` ; `rejected` laisse le bouton actif ; aucun mot interdit.
