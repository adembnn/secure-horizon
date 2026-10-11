# Brancher revoke.js dans l'extension (spécification)

Statut : spécification seule. Aucun fichier existant de l'extension n'a été modifié. `revoke.js` et `tests/unit/revoke.test.mjs` sont nouveaux. À brancher plus tard par la personne qui tient `gatekeeper.js`, `background.js`, `inject.js`, `bridge.js` et `ui/`.

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
