# Rapport des correctifs de l'extension (11 oct. 2026)

## Tests, avant et après
- Avant : unitaires 76/76. Suite autonome 38/39 (le bloc PRESENTATION différait seulement par les fins de ligne CRLF de server.mjs sur cette machine).
- Après : unitaires 83/83 (7 tests ajoutés pour Q16 et Q17). Suite autonome 39/39. Contrôle statique : 0 échec.
- Une fois, le test unitaire (f) de inject.test.mjs a échoué dans la suite autonome sous charge (temps). Il passe 3 fois sur 3 isolé et 2 fois sur 2 en suite. À surveiller.
- Lancer par fichiers : `node --test extension\tests\unit\*.test.mjs` (le dossier seul échoue sur cette machine).

## État des correctifs interrompus
Les trois correctifs étaient déjà complets et verts : une intention couvre l'opération (budget 90 s, 120 s max), un échange illisible est vérifié par simulation (effect_sim.js), pas de conseil « réduis le plafond » sur une signature. Rien à refaire.

## Ce qui a changé
- Q16 : sur l'écart « montant écrit contre droit plus large » (transaction), plus d'attente de 30 s. Seule la correction. Le titre reste « Ça ne correspond pas ». Pas de départ automatique : il faut cliquer Continuer.
  - L'attente reste si le moteur trouve autre chose (adresse sosie, contradiction, manipulation), si le montant n'est pas certain, ou si la demande est une signature (Permit, Permit2). Choix de prudence : pour une signature il n'y a aucune correction à offrir.
- Q17 : Hold up remplace lui-même le droit trop large par le montant écrit avant le portefeuille (approve et increaseAllowance, transaction ou lot wallet_sendCalls). Ligne affichée : « Droit limité à 50 USDC ».
  - Jamais deviné. Le remplacement n'a lieu que si : une seule somme dans la phrase, lisible d'une seule façon (« 1,000 USDC » et « 50 USDC contre 1 AVAX » refusés), extraite par code ; intention d'échange ou d'autorisation (pas un paiement, pas « on me l'a demandé », pas une réception) ; jeton connu du contexte local ou lu sur sa propre adresse (symbol et decimals via le nœud du portefeuille) et dont le symbole est celui écrit ; rien d'autre ne sort dans la demande ; la demande relue après remplacement ne dépasse plus le montant.
  - Jamais pour une signature : alerte seulement, sans conseil impossible.
  - Sinon : alerte et conseil « Réduis le plafond » comme avant (sans attente si Q16 s'applique).
  - Désactivable : clé `limitUnlimited` (vrai par défaut) dans options.js. La case HTML d'id `limitUnlimited` reste à ajouter dans options.html (hors de mon périmètre) : sans elle, la valeur enregistrée est conservée et ne peut se changer que par chrome.storage.
  - Chaîne technique : gatekeeper.js calcule le plan (written_check.js `limitPlan`), le garde dans la demande retenue, le renvoie au poll quand l'autorisation humaine est enregistrée, bridge.js le transmet à inject.js, qui envoie au portefeuille les paramètres limités (request, send, sendAsync). Les champs `relief` et `written` venant du moteur sont supprimés.
  - Le budget de l'opération compte le droit limité, pas le droit demandé.
- ui/screen.js : champ vide à la validation, `aria-invalid="true"` et classe `is-error`, retirés à la frappe (demande du design). Ligne `fix` affichée dans un paragraphe `hu-line hu-fix` (la mise en forme CSS de `.hu-fix` n'existe pas, elle hérite de `.hu-line`).
- intent_text.js : `amountIsSure`. effect_sim.js : `readToken`. hold_core.js : `enterVerdict` accepte `verdict.relief`.
- Build autonome : zéro réseau. Le client du relais est remplacé par un stub (aucun fetch), le manifeste n'a plus de host_permissions, CSP `connect-src 'none'`. Le parseur de mots-clés répond seul ; brancher Clef plus tard demandera de rouvrir ce point. static_check.mjs et run_tests.mjs adaptés. Test du bloc PRESENTATION : fins de ligne normalisées.
- Aucun verdict vert « OK » ajouté.

## COMPAT.md
Les défauts listés (détection par iframe vierge, accesseur window.ethereum, send synchrone, globales propriétaires, portefeuilles réels non testés) ne sont pas simples à corriger. Aucun corrigé. Le point 16 de COMPAT.md parle encore du port 8787 et du relais : à mettre à jour.

## Ce qui reste
- Case `limitUnlimited` dans options.html et style de `.hu-fix` (design).
- Rejouer la scène Neve dans un vrai Chromium (non fait ici : pas de drapeaux de débogage). Le remplacement n'a été prouvé qu'en Node (fausse chrome, port privé simulé).
- Un portefeuille réel peut afficher un champ de plafond différent : à vérifier à la main.
- Zip : l'ancien `dist\hold-up-standalone.zip` n'a pas pu être supprimé (accès refusé). Le nouveau paquet est `dist\hold-up-standalone-3fab41e8.zip` (le script package_standalone.ps1 bascule maintenant seul sur ce nom).

## Build
- Arbre : 3fab41e81176243c (sha256 complet 3fab41e81176243c...dans extension_standalone\extension\BUILD_INFO.json, champ tree_sha256).
- Zip : SHA-256 f31bccd73f059100b2bc341db6ce0aeb5db3548c9a0d349842f1ffbeab6a362b, 40 fichiers, 174 369 octets.
