# Rapport textes et présentation

Date : 11 octobre 2026. Pas de commit, aucun .env.

## EN TÊTE : un NIVEAU change, pas seulement un texte
- **F31 (envoi vers une adresse nouvelle, sans signal) passe de `niveau: info` à `niveau: warn`**, avec `level: attention`. L'ancien niveau reste dans `niveau_moteur: info`. Les interfaces affichaient « Aucun signal » pour F31 : ce n'est plus possible. Jamais de vert.
- Ce changement est dans `evaluate()` (hors bloc) : il modifie le produit mesuré. Mesure sur attacks_public/PUBLIC.jsonl, mode produit seul : 11 cas sur 144 passent de info à warn (1 bénin sur 70, 8 arnaques sur 72, 2 conformes sur 2). Aucun cas ne descend, aucun ne devient critical. La détection d'une pression sur la page continue d'utiliser le niveau du moteur (pas de nouvelle « manipulation »).
- Tous les autres changements sont des textes ou des choix de fiche à niveau égal.
- Je n'ai pas relancé les mesures complètes (DEV, V2_DEV) faute de temps ; à refaire avant le jeu aveugle si les niveaux comptent.

## Corrections
1. Échange légitime : fiche F38 « Tu donnes 0.1 WETH et tu reçois au moins 300 USDC. » (plus F31).
2. Après limitation à 50 USDC : fiche F34 « Tu donnes à … le droit de prendre 50 USDC, pas plus. » (plus F26 « aucun signal »).
3. F31 en attention (voir en tête).
4. Échéance illimitée : « sans date de fin » (variable `duree`), jamais « 1.3e+72 jours ». « pendant 30 jours » quand elle est finie.
5. F01 ne dit « sans limite » que pour un droit sans limite. Un droit à montant fini donne F34 (transaction) ou F35 (signature). Cause trouvée en plus : le symbole du jeton manquait pour les droits (texte « 50 jetons »), table de 4 jetons ajoutée.
6. Textes : 4 lignes de 4 à 12 mots, tutoiement, sans jargon, jamais « bloque », jamais de vert. check_textes : 0 erreur, 0 avertissement.
7. Fiches ajoutées : F34 droit limité, F35 signature à droit limité, F36 jeton non reconnu (« je n’ai pas pu le vérifier », niveau inchangé), F37 droit sans limite vers un programme connu (sans phrase), F38 échange, F39 adresse qui ressemble un peu (lookalike_weak), F40 message qui cache un ordre (signed_calldata), F41 texte qui donne des actifs (signed_text_grants_assets), F42 message sans montant ni destinataire (offchain_signaling). Pour les autres codes (lookalike_reported, signed_transfer_unlimited, signed_right_unlimited_unknown) les fiches F13 et F01/F02 étaient déjà précises. `effect_decoded_limited` ajouté à la table (test 7a était rouge).
8. F02 et F30 utilisent `{duree}` ; F31 passe en gravité warn dans le JSON.

## Tests
- server.test.mjs 33/33. presentation.test.mjs 39/39 (31 avant, 8 ajoutés ; 4b, 5a, 5b réécrits). check_textes 0 erreur. check_nohardcode OK.
- Non lancés : tests de pipeline, d'extension_standalone et de webdemo (autres propriétaires).

## Synchronisation
`server/sync_presentation.mjs` (voir PATCHES_A_FAIRE.md). Il n'a rien écrit dans les autres dossiers. Constat : webdemo/engine/sentinelle_core.js contenait déjà le bloc à jour (reconstruit par un autre agent en parallèle).

## Limites
- F36 ne remonte pas le niveau (choix prudent avant gel). Un jeton inconnu reste « Aucun signal » en en-tête avec un texte « je n’ai pas pu le vérifier » : à trancher.
- F37 décrit un droit sans limite sous un niveau info (décision de la politique, non touchée).
- U_textes_utilisateur.md : lignes F31 à F42 ajoutées ; les autres lignes ne sont pas régénérées.
