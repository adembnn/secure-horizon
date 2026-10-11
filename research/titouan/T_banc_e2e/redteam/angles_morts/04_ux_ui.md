# Angle mort 04. UX / UI de ce que voit le jury

Date : 11 oct. 2026. Méthode : impeccable (hiérarchie, charge cognitive, accessibilité, responsive, copy), `avoid-ai-writing` pour les phrases, direction `docs/design/v4/R3-figma/` + `HIERARCHIE.md`. Périmètre relu : `webdemo/` (index, css, ui.js, holdup.js, scenarios.js, textes.js, limites.html), `extension/bridge.js` (c'est lui qui dessine la vraie fenêtre ; `inject.js` et `background.js` n'ont aucune UI), `extension_standalone/src/options.html`.

## 0. Ce qui a été fait dans cette passe (webdemo uniquement)

Ré-habillage complet R3 : jetons, rayons 2/8/16/pilule, titres poids 300, texte centré, fenêtre claire de 420 px, boutons pilule, adresses en grille 2 x 5 avec caractères différents en rouge gras souligné, « Tu crois / En vrai », « Pourquoi ? » replié, « Continuer quand même » discret. Le thème sombre est supprimé. Fichiers : voir la fin.

## 1. Critique (méthode impeccable)

**Hiérarchie.** Avant : le titre « Hold up ! » (28 px) passait devant le verdict, le niveau n'était qu'une pastille de 15 px, l'écart était dans une boîte grise puis rouge. Après : un seul titre-verdict en poids 300, l'écart empilé sans boîte, un seul accent (rouge) sur « En vrai ». Règle HIERARCHIE respectée : verdict + écart + Annuler en 3 s, tout le reste derrière « Pourquoi ? ». Aucun eyebrow ni pastille décorative (interdit par la craft-floor d'impeccable). Le niveau (Danger, Attention…) est dit dans « Pourquoi ? » et dans le titre pour Aucun signal / Vérification impossible.

**Charge cognitive dans les 3 s.** Avant : pastille, titre, phrase, deux lignes d'écart, ligne danger, ligne action, citation, adresses, panneau, Annuler, Continuer, minuteur : 12 éléments. Après : 3 (titre, écart ou adresses, Annuler) + 1 lien discret.

**Précision des mots.** Un message par menace : respecté dans les fiches. Restes de jargon visibles par un juré : `Message à signer (EIP-712)` et `Contrat` dans le portefeuille factice (`app.js`, `rawRows`), `eth_sendTransaction` affiché sur chaque écran de l'extension (`bridge.js`, ligne `'Demande : ' + ctx.method`), codes de signaux dans les preuves (volontaire, replié, rebaptisé « Voir les preuves techniques »).

**Cohérence R3.** Webdemo : alignée maintenant. Extension (`bridge.js`) : non. Bandeau plein rouge/ambre avec pictogramme, deux colonnes côte à côte, étiquettes en capitales 13 px, bouton « Continuer » ambre plein, 3 boutons empilés : c'est l'esthétique « alarme » que R3 écarte. À porter en suivant le CSS de la démo.

**Accessibilité.** Contrastes : encre 21:1, gris 7:1, rouge sur blanc 4,83:1 (texte seulement), anneau de focus 2 px noir. Écart jamais porté par la couleur seule (libellés, graisse, soulignement). Clavier : focus piégé dans la fenêtre, Échap annule, focus initial sur Annuler (ou « Continuer » pour Aucun signal), `preventScroll`. Mouvement : réduit couvert. Restes : le bouton « Continuer quand même » est `disabled`, donc hors tabulation et invisible au lecteur d'écran avant la fin du délai (préférer `aria-disabled`) ; le décompte est `aria-hidden`, seul le début et la fin sont annoncés ; l'extension n'a pas de piège de focus.

**Étroit / mobile.** Constat de l'équipe : à 500 x 310 px la fenêtre s'ouvrait défilée en bas. Corrigé : le focus se pose sans défilement, le corps est remis à 0, les actions sont dans un pied fixe (`.dock`) toujours visible ; sous 520 px de haut, titres à 24 px et pied compact ; sous 720 px de large, fenêtre pleine largeur. L'extension a `width:400px; max-width:100%` et 3 boutons de 50 px empilés : sur 310 px de haut, seul le corps défile, c'est correct, mais le pied prend ~190 px.

**Tu / vous.** Webdemo, extension, textes : tutoiement partout. Les seuls « vous » sont la citation du faux conseiller (`scenarios.js`, `pageText`), ce qui est voulu. OK.

**Nom.** Interface : « Hold up » partout. Fuites : `data-sentinelle` (attribut DOM), `sentinelle_core.js`, PRODUCT.md/CLAUDE.md disent « Sentinelle ». Invisible pour le jury, mais un `view-source` ou le README les verra. Noms de niveaux incohérents : démo « Manipulation » / « Vérification impossible », extension « Pause » / « Non vérifié ». Trancher (voir 2.9).

## 2. Les 10 angles morts les plus coûteux en démo live

Statut : A = appliqué dans cette passe, P = à faire (hors périmètre autorisé), avec le correctif exact.

**1. Le titre « Hold up ! » écrasait le verdict.** A. `holdup.js` `frame()` : le titre est maintenant l'`h1` du verdict (`ui.js` `verdictParts`), CSS `h1.verdict` 32 px / poids 300.

**2. Fausse parole prêtée à l'utilisateur.** « Tu as dit : Aucune alerte ne s'affiche, donc je peux signer sans crainte » (fiche F25) ou « Tu as dit : Je veux seulement faire mon échange » alors qu'il a répondu « Recevoir ». A. Libellé « Tu crois » (comme R3), phrase entre guillemets, et pour « Vérification impossible » l'écart est remplacé par « Ce que l'on sait ». Reste P : réécrire `croit` de F25 dans `U_textes_utilisateur.json` (« Je ne vois aucune alerte. ») ; et passer les `croit` à une forme nominale (« recevoir 50 USDC ») comme dans `danger-signature.html`.

**3. Adresses illisibles, sosie invisible.** Avant : 42 caractères coupés au hasard, aucune marque. A. Grille 2 x 5, 4 caractères par groupe, seuls les caractères différents marqués, compteur « 31 caractères différents sur 40 », texte complet pour le lecteur d'écran.

**4. Annuler hors écran sur petit viewport, fenêtre ouverte défilée en bas.** A. Voir « Étroit ».

**5. Question d'intention : Annuler en bouton plein noir plus fort que les choix.** Un utilisateur honnête est poussé à abandonner. A. Choix en pilules (radio), « Vérifier » inactif tant que rien n'est choisi, « Annuler » discret, comme `intention.html`.

**6. Retenue sans explication de la suite.** Le jury voit « Tu pourras continuer dans 30 s » mais pas ce qui se passe ensuite ; la démo retient 30 s, le produit annonce 10 min ; Danger = 10 s sans phrase à retaper alors que la fiche de défense promet « phrase + 30 s ». A partiel : Manipulation affiche un grand minuteur (`.timer`) et « Ta demande reste retenue. Annuler est possible à tout moment. » P : une ligne dans `limites` et sur l'écran : « Démo : 30 s au lieu de 10 min. » ; ajouter la phrase à retaper (R3 `HIERARCHIE`) dans `holdup.js` si la logique le permet ; l'extension l'a déjà (bras C).

**7. Aucun moyen de voir la preuve, ou preuve en jargon.** A. « Pourquoi ? » (danger, action, message vu sur la page) puis « Voir les preuves techniques » (effets décodés, signaux, mesures). P : traduire `via` (permit2 / approve) et les codes de signaux ; remplacer `Message à signer (EIP-712)` par « Message à signer » (`app.js` `rawRows`).

**8. Fatigue d'alerte côté extension.** `bridge.js` ligne 274 : pour le niveau Attention le focus va à « Oui, c'est bien ça, continuer » (`go.focus()`), bouton plein ambre, tandis qu'Annuler est contour. Entrée = confirmer en moins de 1,5 s, exactement le comportement mesuré par Akhawe (47 %). Correctif : `cancel.focus()` pour tous les niveaux sauf Aucun signal ; `.btn.go` en contour (`.btn.quiet`), `.btn.cancel` plein ; libellé « Continuer quand même ». Même fichier : le texte `PHRASES` (« je donne à ce site le droit de prendre mon argent ») est faux pour un sosie d'adresse ou un swap : fournir `v.phrase` par fiche.

**9. Noms et ton incohérents.** « Manipulation » en pastille accuse la victime (REGLES, règle 11 : ne jamais accuser) et diffère de « Pause » dans l'extension. Décision proposée : titre = la consigne (« Raccroche. », « Prends une pause. »), le mot Manipulation reste interne. Un seul état « Vérification impossible » (pas « Non vérifié »). « Hold up » sans point d'exclamation.

**10. Certitudes que le moteur n'a pas.** « à un escroc », « chez un voleur » (F19, F13), « pour vider tes jetons » (F20), « tu perds … et ne récupères jamais rien » (F22). Le moteur soupçonne, il ne sait pas. A pour F21 seulement, par `fx()` dans `ui.js` (« Tu enverrais … à la personne qui te guide »). P : corriger dans `U_textes_utilisateur.json` puis régénérer (`textes.js` est généré et le test d'équivalence du banc le compare à la voie de référence : je n'y ai pas touché). Remplacements proposés : F13 gravite_phrase « Ton envoi partira vers une autre adresse : on te retient. » ; F19 « Ton envoi partirait vers une adresse qui n'est pas la tienne. » ; F20 reel « Ce site, {site_reel}, imite {site}. » ; F22 reel « Tu paierais {montant} {jeton} de plus, sans rien récupérer. »

Constats annexes corrigés dans la démo (`ui.js` `fx`) : « 0.1 NATIVE » devient « 0,1 ETH » ; « tes plusieurs NFT » devient « tous tes NFT » ; swap légitime : « échange 0,1 WETH » au lieu de « envoie 0,1 WETH à ton contact » ; espace insécable avant « : ». Cause racine (non touchée) : `engine/sentinelle_core.js` remplit `nombre: 'plusieurs'`, `contact: 'ton contact'`, symbole `NATIVE`, séparateur décimal point.

## 3. Écran idéal pour les 4 niveaux (mots définitifs)

**OK (Aucun signal).** Jamais vert, jamais « sûr ».
- Titre : « Aucun signal trouvé. »
- Ligne : « Ce n'est pas une garantie : Hold up avertit et ralentit, il ne protège pas. »
- Écart (une ligne chacun) : « Tu crois : envoyer 0,1 ETH à Paul. » / « En vrai : envoyer 0,1 ETH à Paul. »
- Geste unique : **Continuer** (principal) ; « Annuler » discret. Aucune attente.

**Attention.**
- Titre : « Un point à vérifier. »
- Écart : « Tu crois : te connecter à uniswap.org. » / « En vrai : te connecter à unlswap-app.com. »
- Geste unique : **Annuler**. Discret : « Continuer quand même » (1 clic, attente courte).

**Danger.**
- Titre : « Ce n'est pas ce que tu as demandé. »
- Écart : « Tu crois : recevoir 50 USDC. » / « En vrai : donner à ce site le droit de prendre tes 2 480 USDC. » (rouge, souligné)
- Geste unique : **Annuler**. Discret : « Continuer quand même », avec dessous « Il faudra retaper une phrase, puis attendre 30 s. »
- Adresse sosie : titre idem, les deux adresses en grille 2 x 5, « 31 caractères différents sur 40 », action principale **Envoyer à mon adresse habituelle**.

**Manipulation.**
- Titre (consigne) : « On te dicte quoi faire ? Raccroche. »
- Ligne : « Rien n'est parti. »
- Minuteur : « 10:00 », puis « Ta demande reste retenue. Annuler est possible à tout moment. »
- Gestes : **Annuler** (principal), « Appeler un proche ». Aucun « Continuer » pendant la retenue.
- Replié : le message vu sur la page, « Classé : faux support ».

Cinquième état (hors des quatre) : « Vérification impossible. » + « Ce que l'on sait : nous n'avons pas pu vérifier cette opération. » + **Annuler** ; jamais d'écart « Tu crois ».

## 4. Fichiers modifiés

`webdemo/css/holdup.css` (réécrit, R3), `webdemo/js/ui.js` (réécrit : `verdictParts`, `whyDetails`, grille d'adresses, `fx`), `webdemo/js/holdup.js` (réécrit : structure R3, pied fixe, focus sans défilement), `webdemo/index.html` (meta `color-scheme`). Vérifié : `node --check` sur les deux .js, 200 sur toutes les pages, aucune erreur console, rendu contrôlé à 1100 px et à 500 x 310 px. Non modifiés : `engine/policy.js`, `engine/sentinelle_core.js`, `engine/textes.js`, `app.js`, `verdict_model.js`. Pas de reconstruction, pas de commit, suite de tests du banc non relancée (elle reconstruit).
