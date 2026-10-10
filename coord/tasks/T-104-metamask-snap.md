---
id: T-104
title: Snap MetaMask — capter l'intention et afficher l'avertissement critique
lane: tech
status: todo
owner: none
agent: builder-frontend
branch: t/T-104
depends_on: []
files: ["app/snap/**", "coord/reports/T-104.md"]
test: "cd app/snap && npm install && npm run build && npm test"
nist_csf: [Detect, Protect]
threat_refs: [T1566, T1656, T1657]
deadline: 2026-10-11T07:00+02:00
budget_usd: 8
created_by: claude-adem
updated: 2026-10-11T01:05+02:00
---
## Objectif
Créer un Snap MetaMask (MetaMask Flask, `@metamask/snaps-sdk`, JSX UI) qui fait deux choses :
1. capter l'intention de l'utilisateur en mots simples ;
2. au moment d'une transaction ou d'une signature, appeler l'API locale `POST http://127.0.0.1:8787/check` (T-103) et afficher le verdict.

Tu peux créer `app/snap/package.json`.

## Critères d'acceptation (DoD)
- [ ] Permissions : `endowment:transaction-insight` (avec `allowTransactionOrigin`), `endowment:signature-insight`, `endowment:network-access`, `snap_manageState`, `endowment:page-home`, `snap_dialog`.
- [ ] **Avant** : la page d'accueil du Snap (onHomePage) propose les 5 intentions en mots simples (« Je paie quelqu'un », « J'envoie vers mon compte », « J'achète ou j'échange une crypto », « Je me connecte à un site ou j'accepte une offre », « On m'a demandé de le faire »). S'y ajoutent les champs montant et contact, plus une zone « colle le message qui t'a poussé à le faire ». L'intention est stockée dans `snap_manageState` avec une durée de vie de 10 min. Exposer aussi une méthode RPC `sentinel_setIntent` pour que notre page compagnon puisse la poser.
- [ ] **Pendant** : `onTransaction` et `onSignature` récupèrent l'intention, appellent l'API (délai max 2,5 s ; si l'API est muette, avertissement `warn` « vérification impossible ») et renvoient le contenu avec `severity: "critical"` quand le verdict est `critical`. Si aucune intention n'est déclarée, afficher « Qu'essaies-tu de faire ? » avec les 5 choix, en UI interactive si le SDK le permet dans l'insight ; sinon, renvoyer vers la page d'accueil.
- [ ] Rendu de l'avertissement : deux blocs côte à côte, « Tu as dit » et « En réalité », en gros et en clair, avec les montants en unités lisibles et l'adresse sosie mise en évidence (caractères différents soulignés).
- [ ] Tests unitaires du rendu (`@metamask/snaps-jest` si disponible, sinon tests des fonctions de mise en forme) avec un mock de l'API.
- [ ] Guide pas à pas dans `app/snap/README.md` : installer Flask, `npm run serve`, installer le Snap local, tester. Rapport `coord/reports/T-104.md` avec les limites réelles constatées (sévérité critique en Flask uniquement ? modal de signature après le clic ?).

## Contexte / liens
docs/intent-barrier.md ; documentation officielle : docs.metamask.io/snaps/features/transaction-insights, docs.metamask.io/snaps/features/signature-insights ; D-007.
