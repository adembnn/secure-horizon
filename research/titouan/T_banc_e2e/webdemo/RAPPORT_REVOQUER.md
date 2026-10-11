# Après l'alerte : révoquer le droit en un clic

Date : 11 oct. 2026. Périmètre : `extension/revoke.js`, `extension/tests/unit/revoke.test.mjs`, `extension/REVOKE_BRANCHEMENT.md`, et dans `webdemo/` : `js/apres.js`, `js/incident.js`, `js/revoke.js` (copie), `index.html`, `css/holdup.css`, `js/app.js` (3 points de branchement), `build_webdemo.mjs`, tests.

## Ce qui est prouvé (tests exécutés)

- `node webdemo/tests/run_webdemo_tests.mjs` : 135 vérifications, toutes vertes (81 d'origine + 54 nouvelles). Zéro appel réseau.
- `node --test extension/tests/unit/revoke.test.mjs` : 25 tests verts.
- Sélecteurs recalculés par keccak-256 du moteur : approve, increaseAllowance, setApprovalForAll, permit EIP-2612, Permit2 approve, permit, lockdown, invalidateNonces, invalidateUnorderedNonces. Calldata recomparée à l'encodeur ABI du moteur (pas celui de revoke.js).
- approve et increaseAllowance donnent approve(spender, 0) ; setApprovalForAll donne false ; Permit2.approve donne approve(token, spender, 0, 0) ; Permit2.permit en transaction donne lockdown.
- Cas non révocables en un clic, dits comme tels : Permit EIP-2612 et DAI (signer un permit sans effet au même numéro, l'envoyer, course possible, ou attendre l'échéance), Permit2 signé (invalider le numéro puis verrouiller : deux transactions, `oneClick: false`), signature inconnue (aucune demande). Le bouton « Révoquer ce droit » n'apparaît que si une seule transaction suffit.
- `approve(address,uint256)` est identique pour jeton et NFT : sans `tokenKind`, Hold up demande au lieu de deviner.
- Hold up ne signe jamais : `signedByHoldUp: false`, `submitTo: 'wallet'` partout ; le module n'a ni réseau, ni import, ni méthode de signature (test statique).
- Entrées malformées ou hostiles (20 cas) : jamais d'exception, jamais de demande construite.
- Équivalence moteur : la demande de retrait est lue pareil par la page et par `server/server.mjs` (5 demandes), niveau « aucun signal ».
- Journal : la formule d'empreinte est celle de `recordHash` d'Adem ; `readJournal` d'Adem relit le journal de la page, chaîne intacte, même tête. Chaque ligne citée dans la fiche se rejoue avec `node:crypto`. Aucune adresse dans le journal. Une ligne retouchée rend la chaîne « cassée » dans la fiche.
- Parcours de bout en bout dans `app.js` (faux DOM) : raccourci, bouton, faux portefeuille, rejet puis signature, ligne n° 3, fiche, rejouer une ligne, rejouer la chaîne.
- 6 scènes sur 13 accordent un droit et montrent la section ; les 7 autres n'ont aucun bouton. Changer de scène masque la section.

## Ce qui est simulé

- Le portefeuille, la signature, la transaction, le réseau et la valeur « plafond actuel 0 ». Chaque écran et chaque ligne de journal le dit (`simulated: true`, « Simulation : aucune transaction n'a été envoyée »).
- Le raccourci « passer à tu as continué par erreur » écrit la même ligne de décision que la fenêtre, marquée `raccourci`, pour éviter les 10 s de retenue pendant le pitch.
- L'unité du montant (6 décimales) suppose USDC, seul jeton des scènes.

## Ce qui est adapté d'Adem (lecture seule)

`js/incident.js` reprend le schéma `holdup.incident/1`, la formule d'identifiant, `proves` / `does_not_prove`, l'appariement et la vérification de chaîne. Écarts voulus : navigateur et DOM au lieu de fichiers ; la porte est toujours « extension » ; la ligne de décision de la démo porte déjà niveau et fiche (pas de ligne « verdict » séparée) ; ajout des blocs `right` et `revocation`. Pas d'ancrage (`anchor` absent).

## Ce qui reste

- Brancher dans l'extension : voir `extension/REVOKE_BRANCHEMENT.md` (gatekeeper, panneau latéral, messages `hu.revoke.*`, envoi par le fournisseur de la page avec jeton à usage unique).
- Le portefeuille affichera le site d'origine comme demandeur de la révocation. À dire à la personne avant le clic (prévu dans la spec).
- Les cas en plusieurs étapes (Permit, Permit2 signé) ne sont qu'expliqués, pas simulés.
- Relecture réelle du droit (`allowance`) et ancrage de la fiche : non faits ici.
- Les tests de chaîne d'Adem ne tournent pas ici : `ethers` est absent de `blockchain/node_modules` et il faut un nœud jetable. Constat : 18 tests passent (incident, matrix), 1 fichier échoue au chargement (revoke), 1 anchor sauté. Les « 23 annoncés » ne sont pas reproductibles tels quels.
- Aucune vérification visuelle dans un navigateur : le volet navigateur était plein (onglets d'autres agents). Structure et textes testés en faux DOM seulement.
- Aucun commit, aucun `.env`.
