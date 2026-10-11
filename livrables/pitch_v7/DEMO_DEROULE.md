# Déroulé de la démonstration, geste par geste

Sources de l'état de chaque geste : `coord/reports/AUDIT_APPLICATION_FINIE.md` (commit `5602248`, 11 oct., 09h05 à 09h30), `preuves/exhaustivite/EXHAUSTIVITE_INTENTION.md`, `coord/reports/EVAL_DESIGN_1.md`, `research/demo_reelle/site_echange/test/preuve.mjs`, `research/titouan/T_banc_e2e/extension/RAPPORT_CORRECTIFS.md`. Je n'ai rien exécuté moi-même : je n'ai pas de terminal dans cette session. Tout ce qui est marqué « prouvé » l'est par ces rapports, au commit qu'ils citent. Le dépôt a bougé depuis.

## Légende

- **PROUVÉ** : joué dans un vrai Chromium avec l'extension, portefeuille simulé dans la page, chaîne locale, jetons de démo déclarés dans les réglages.
- **PROUVÉ HORS NAVIGATEUR** : vérifié par un script Node qui lit la chaîne.
- **NON PROUVÉ** : jamais joué de bout en bout, ou pas retesté depuis un changement.
- **PAS CONSTRUIT** : n'existe pas dans le dépôt.

## Ce qu'il faut savoir avant de choisir « en direct »

1. **Aucun essai avec un vrai portefeuille.** Les scènes prouvées utilisent un portefeuille simulé, injecté dans la page par un script Playwright (`film_scene.mjs`). Le pilote qui clique sur Continuer et lit les soldes est resté hors dépôt (audit, section Méthode).
2. **Taper la phrase à la main devant le jury est NON PROUVÉ.** Ce qui est prouvé est le rejeu piloté par script. Deux façons de jouer en direct : un vrai MetaMask branché sur la chaîne locale (jamais essayé avec Hold up), ou un Chromium lancé par script avec le portefeuille simulé, que tu pilotes ensuite à la main (à essayer). Si aucune des deux n'a tourné deux fois de suite avant 12h00, la scène se joue en vidéo, annoncée comme telle.
3. **Sur une installation neuve, la scène est cassée** (audit, points 1 et 2, marqués « en cours ») : l'honnête dit « Je n'ai pas pu vérifier » et attend 30 s, le piège laisse partir l'illimité en un clic. Elle marche seulement si les jetons de démo sont déclarés dans les réglages. C'est le contrôle n° 1 avant d'entrer.
4. **Le build livré avec Clef par défaut, les icônes et le gant n'ont pas été retestés** par l'audit.
5. **Rien n'est déployé sur Fuji.** Chaîne locale, argent fictif. Tu le dis.

## Préparation (10 min, avant d'entrer)

| # | Geste | Commande ou lieu | Ce que tu dois voir | État |
|---|---|---|---|---|
| P1 | Lancer la chaîne locale | `npm run chain:local` dans `blockchain/` | nœud sur 8545 | PROUVÉ |
| P2 | Déployer les contrats de démo | `npm run demo:deploy -- --network localhost` (sans `-- --network localhost`, la commande échoue : audit, point 4) | adresses écrites | PROUVÉ |
| P3 | Régénérer les adresses du site | `node config.js` dans `research/demo_reelle/site_echange/` (sinon le site vise des adresses vides : audit, point 16) | fichier d'adresses à jour | PROUVÉ |
| P4 | Servir Neve | `node docs/demo/serve_static.mjs research/demo_reelle/site_echange 8793` | page sur `127.0.0.1:8793` | PROUVÉ |
| P5 | Lancer le relais Clef | relais local sur 8789 (`research/demo_reelle/classifieur/relay.mjs`) | une requête de test répond `source: clef` | PROUVÉ (relais), NON PROUVÉ avec le build livré |
| P6 | Charger l'extension | dossier construit à jour. Le zip du commit audité ne correspond pas au dossier (audit, point 5) : charger le dossier, pas le zip | extension visible, icône du gant | NON PROUVÉ pour le build actuel |
| P7 | Déclarer les jetons de démo | réglages de l'extension, bloc « Mon contexte » : USDC et WAVAX de la chaîne locale | enregistré | PROUVÉ, et obligatoire tant que les points 1 et 2 de l'audit ne sont pas corrigés |
| P8 | Preuve par lecture de chaîne | `node research/demo_reelle/site_echange/test/preuve.mjs` | « TOUT VERT » | PROUVÉ HORS NAVIGATEUR |
| P9 | Rejouer les deux modes une fois | `?mode=honnete` puis `?mode=piege`, phrase exacte ci-dessous | « Ça correspond » puis « Ça ne correspond pas » avec « Droit limité à 50 USDC » | PROUVÉ au commit audité |
| P10 | Vidéo de secours | un onglet, son coupé | la même scène, même build | NON PROUVÉ : à enregistrer (`film_scene.mjs`, voir `livrables/VIDEO_SCRIPT.md`) |

La phrase à taper, toujours la même, sans variante : `échanger 50 USDC contre AVAX`. « 50 dollars » n'est pas compris (audit, point 14).

Disposition de l'écran : deux fenêtres de navigateur côte à côte, zoom 125 %. Gauche : `127.0.0.1:8793/?mode=honnete`. Droite : `127.0.0.1:8793/?mode=piege`. Un terminal réduit, prêt avec la commande P8.

**La barre d'adresse montre `mode=piege`.** Ne la cache pas. C'est ton geste de pirate : tu dis « je pirate ce site » en montrant la fenêtre de droite. Le paramètre est l'interrupteur qui joue le jour où l'interface de Neve est détournée. La page ne change pas à l'œil (`app.js` : « Rien à l'écran ne nomme le mode »).

## La scène (version 5 minutes)

| # | Temps | Geste exact | Ce que l'écran montre | Durée du geste | État | Si ça casse |
|---|---|---|---|---|---|---|
| 1 | 0:00 | Aucun. Les deux fenêtres sont ouvertes. | Deux pages Neve identiques. | 0 s | PROUVÉ (la page est la même, seul le paramètre change) | Sans objet |
| 2 | 0:38 | Fenêtre de gauche. Clic sur « Connecter le portefeuille », puis sur « Échanger ». | La fenêtre Hold up s'ouvre 325 à 345 ms après le clic : « Que veux-tu faire sur ce site ? » | 4 s | PROUVÉ (temps mesuré par le pilote de l'audit) | Si aucune fenêtre : vidéo |
| 3 | 0:50 | Taper `échanger 50 USDC contre AVAX`. Entrée. | « Ça correspond. » Verdict environ 400 ms après Entrée, 1,1 s avec Clef. | 8 s | PROUVÉ avec jetons déclarés. NON PROUVÉ à la main et avec le build actuel | Si « Je n'ai pas pu vérifier » : le dire à voix haute, puis vidéo |
| 4 | 1:05 | Ne rien toucher. | La fenêtre se ferme seule après 1 s. Une seconde fenêtre s'ouvre pour l'échange, redit « Ça correspond », se ferme. Solde 100 vers 50 USDC, 0 vers 0,5 WAVAX. | 6 s | PROUVÉ (audit) | Deux fenêtres qui s'ouvrent et se ferment : c'est le comportement actuel (EVAL_DESIGN, F6). Ne pas le commenter |
| 5 | 1:20 | Montrer la fenêtre de droite. | Le même Neve, adresse avec `mode=piege`. | 2 s | PROUVÉ | Sans objet |
| 6 | 1:30 | Terminal : lancer P8. | Lignes du mode piège : « autorisation ILLIMITEE au contrat de collecte », « solde de la victime vide : 100.0 vers 0.0 », « le contrat de collecte a tout recupere ». | 8 s | PROUVÉ HORS NAVIGATEUR. Ce n'est pas la fenêtre du navigateur : c'est un script qui envoie sur la chaîne les mêmes demandes que la page, sur un compte de test neuf. Neve n'affiche aucun solde | Si le script échoue : phrase de rechange sans chiffre (`PITCH_5MIN.md`) |
| 7 | 1:50 | Fenêtre de droite. Clic sur « Échanger ». Taper la même phrase. Entrée. | « Ça ne correspond pas. » « Tu as écrit 50 USDC. La demande donne accès à tout ton USDC. » « Droit limité à 50 USDC. » | 10 s | PROUVÉ avec jetons déclarés (audit, tableau b). NON PROUVÉ à la main | Si la ligne du droit limité manque : s'arrêter à « J'annule, rien ne part » |
| 8 | 2:00 | Lever la main, paume vers le jury. Silence. | Le gant se lève au-dessus du titre. | 3 s | NON PROUVÉ à l'écran : au moment de l'évaluation de design, le gant n'était pas dans la fenêtre. La direction « le carton » le prévoit. À regarder sur le build avant d'entrer | Le geste de la main suffit. Dire « Hold up lève la main » |
| 9 | 2:20 | Clic sur Annuler. | La fenêtre se ferme. Rien n'arrive au portefeuille. | 2 s | PROUVÉ (aucune demande au portefeuille après Annuler) | Sans objet |
| 10 | 2:35 | Afficher le carton de la phrase. | Écran noir, le gant, la phrase. | 2 s | Carton à fabriquer | Garder Neve à l'écran et dire la phrase |

Total des gestes : environ 45 s. Le texte laisse 50 s.

## Deux gestes dits et non joués, à assumer

**« Si je continue quand même, le droit est déjà ramené à 50. »** PROUVÉ : après Continuer, le portefeuille simulé reçoit `approve(…, 50000000)` au lieu de l'illimité, et le droit final lu sur la chaîne est de 50 USDC (audit, tableau b). Tu ne cliques pas sur Continuer en scène : tu annules.

**« Le pirate ne peut prendre que ce que j'avais écrit. »** NON PROUVÉ comme geste. C'est une conséquence du contrat de démo : `sweepERC20` prend le plus petit du droit et du solde (`blockchain/contracts/demo/FreshDrainer.sol`). Personne n'a joué « Continuer, puis le pirate prend 50 ». Le droit de 50 part chez le contrat du pirate : ces 50 sont perdus si tu continues. Hold up ne contrôle pas à qui le droit est donné (exhaustivité, essais M1a et M1b). La perte est bornée, pas évitée. Si un juré le relève, c'est exact : réponse dans `QR.md`, question 4.

## La scène « site honnête piraté plus tard » (construite le 11 oct.)

L'idée : le site est honnête, tu échanges, il est piraté plus tard. Sans Hold up le compte tombe à zéro. Avec Hold up le droit valait 50, il est déjà dépensé, le pirate ne prend rien. C'est le cas LI.FI, et c'est la meilleure image de la thèse. Elle est désormais **CONSTRUITE et PROUVÉE**.

Les pièces :

1. **Mode `?mode=habituel` de Neve** (`app.js`, `chain-utils.js`) : le site, honnête, demande par défaut un droit **illimité à son propre routeur**, puis échange 50. Même apparence que les autres modes. C'est l'usage courant d'un service réel.
2. **Routeur à la faille volontaire** : `blockchain/contracts/demo/VulnerableRouter.sol`. Routeur d'échange honnête au moment du swap, mais sa fonction `execute()` n'est pas protégée (esprit LI.FI, 16 juillet 2024) : un tiers lui fait exécuter `transferFrom(victime, pirate, montant)` et vide les droits laissés. Tests Hardhat : `blockchain/test/demo/VulnerableRouter.test.js` (4 verts). Déployé et approvisionné par `deploy-local.js` ; l'adresse `vulnRouter` s'ajoute au fichier d'adresses sans casser les champs existants.
3. **Le geste « on pirate le site »** : `research/demo_reelle/chain/pirater.mjs` (CLI + serveur) et le bouton de la régie `research/demo_reelle/site_echange/regie.html` (page sobre, réservée au présentateur). Il vide par la faille tous les comptes qui ont laissé un droit au routeur, affiche avant/après et le butin. Bouton « Remettre à zéro » inclus.

Réserve assumée : après l'échange il reste 50 USDC, pas 100. La phrase vraie est « il te restait 50 ; sans Hold up il te reste zéro, avec Hold up tu gardes 50 ».

### État de chaque geste de cette scène

| # | Geste | Commande / lieu | État | Chiffres lus sur la chaîne |
|---|---|---|---|---|
| H0 | Déployer la chaîne (ajoute `vulnRouter`) | `cd blockchain && npm run demo:deploy -- --network localhost` puis `node config.js` dans `site_echange/` | PROUVÉ | adresse `vulnRouter` écrite |
| H1 | Tests du contrat vulnérable | `cd blockchain && npx hardhat test test/demo/VulnerableRouter.test.js` | PROUVÉ | 4 tests verts |
| H2 | Preuve chiffrée des deux parcours | `node research/demo_reelle/site_echange/test/preuve_piratage.mjs` | PROUVÉ HORS NAVIGATEUR | a) 100 → 50 (échange) → **0** (pirate prend 50) ; b) 100 → 50 (droit ramené à 50, consommé) → **50** (pirate prend **0**) — TOUT VERT |
| H3 | Scène avec Hold up, dans un vrai Chromium | `film_scene.mjs` mode `habituel` (RPC_URL, SITE_ORIGIN, ADDR_PATH, PIRATER=1), extension chargée | PROUVÉ | Verdict « Droit limité à 50 USDC. Le site demandait un accès sans limite. » ; après échange droit restant 0 ; **piratage : rien à prendre ; solde reste 50** |
| H4 | Geste « pirater » en direct (régie) | serveur : `node research/demo_reelle/chain/pirater.mjs --network local --serve` ; page : `127.0.0.1:8793/regie.html` | PROUVÉ | bouton « Pirater » : compte de démo → 0, pirate +butin ; « Remettre à zéro » : butin rendu, droits révoqués |
| H5 | Scène « SANS Hold up » dans le navigateur (compte → 0) | non rejouée telle quelle en direct (l'extension chargée limiterait le droit) | NON PROUVÉ en navigateur ; PROUVÉ sur la chaîne (H2, cas a) | — |

**Ce qui reste exposé, cas b), dit sans exagérer** : rien de plus que l'opération elle-même. Les 50 du droit ne sont à la portée du routeur qu'entre le moment où ils sont accordés et l'échange qui les consomme ; si l'utilisateur s'arrête là, ces 50 restent exposés. Une fois l'échange fait, le droit restant est 0 et le piratage ne prend rien. Ne dis jamais « le pirate ne peut jamais rien prendre » : dis « ce que tu lui as laissé le droit de prendre se limite à ce que tu as écrit ».

Phrase exacte que le présentateur peut dire sans mentir : « Même site, même phrase. Sans Hold up, le droit était illimité : le jour où le routeur est piraté, le compte passe de 50 à zéro. Avec Hold up, le droit a été ramené à 50, l'échange l'a entièrement consommé : le même piratage ne prend rien, il reste 50. »

## Ce que Hold up contrôle pendant cette démonstration, et rien de plus

Source : `EXHAUSTIVITE_INTENTION.md`, moteur serveur, 58 paires d'essai : 18 contrôlées, 20 non contrôlées, 7 en partie, 13 non distinguées.

| Contrôlé au moment de la démonstration | Pas encore contrôlé |
|---|---|
| Le montant d'un droit, avec limitation (E1a, D2a) | La nature de l'opération : « échanger » contre un simple envoi (E6a) |
| Le montant, le jeton et le destinataire d'un paiement (E1c, E2a, E3) | Le sens et le montant d'un échange lu dans l'appel (E1b, E6b) |
| Un second droit glissé dans un lot (D8a) | La contrepartie et le minimum reçu (E4, E5a) |
| Une prise de contrôle du compte (D10a à D10c) | La durée d'un droit ou d'une signature (D1a à D1c) |
| | À qui le droit est donné (M1a, M1b) |
| | La deuxième demande d'une même phrase : un envoi ou un échange de 5 000 passe (O2, O3) |

Conséquence pour la scène : dans la fenêtre de gauche, « Ça correspond » porte sur le droit de 50 USDC. La deuxième fenêtre, celle de l'échange, passe sans que son montant soit comparé. Tu ne dis pas « l'échange est vérifié ».

Ne propose pas au jury d'écrire sa propre phrase pendant le pitch. En questions seulement, et en prévenant : une phrase hors des cinq types compris donne « Je n'ai pas pu vérifier ».

## Plan de secours, par ordre

1. **Un geste casse** : phrase de rechange (`PITCH_5MIN.md`), on continue.
2. **La fenêtre Hold up ne s'ouvre pas, ou l'honnête ne passe pas** : vidéo de la même scène, son coupé, tu dis le même texte. Tu l'annonces : « enregistrement de la même scène, même build ».
3. **Pas de vidéo prête** : les captures de l'évaluation de design (`coord/reports/eval_design_1/planche_flux_reel.png`) et le terminal P8. Tu annonces « captures d'un rejeu ».
4. **Chaîne locale morte** : pas de terminal. Tu dis le cas LI.FI à la place du « cent, zéro » et tu passes aux cartons.

Les trois clips de `livrables/video/` montrent l'ancien produit : ne les passe pas.

## Récapitulatif : ce qui n'est pas prouvé de bout en bout

1. Tout essai avec un vrai portefeuille.
2. La scène tapée à la main en direct (seul le rejeu par script est prouvé).
3. La scène sur une installation neuve, sans jetons déclarés à la main.
4. Le build livré actuel (Clef par défaut, icônes, gant) : pas retesté par l'audit.
5. L'animation du gant au verdict.
6. « Cent, zéro » dans le navigateur : prouvé par script sur la chaîne, pas à travers la page.
7. « Continuer, puis le pirate ne prend que 50 » : le droit de 50 est prouvé, le vol borné ne l'est pas.
8. La scène « site honnête piraté plus tard, le pirate ne prend rien » : désormais CONSTRUITE et prouvée — sur la chaîne (`preuve_piratage.mjs`, TOUT VERT) et avec Hold up dans un vrai Chromium (`film_scene.mjs` mode `habituel`). Non rejouée en direct « SANS Hold up » dans le navigateur (l'extension chargée limiterait le droit) : ce cas reste prouvé sur la chaîne uniquement.
9. La vidéo de secours : à enregistrer.
10. Tout ce qui touche Fuji.
