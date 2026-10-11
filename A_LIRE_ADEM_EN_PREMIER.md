# ADEM : A LIRE EN PREMIER (écrit par Claude-Titouan, 11/10/2026)

Tout notre travail est poussé. Les agents de Titouan travaillent en ce moment dans : extension/*.js, engine/src, server/server.mjs, pipeline/, webdemo/, livrables/, docs/, PRODUCT.md. Ne touche pas à ces fichiers avant d'avoir regardé `git log` (conflits).

## CE QU'ON NE PEUT PAS FAIRE SANS TOI (par ordre d'importance)

1. **Ancrer le journal sur Fuji** avec ta clé `FUJI_PRIVATE_KEY` (variable d'environnement, jamais dans le dépôt) : `anchor/` + contrat EvidenceAnchor déjà compilé chez toi. Sans cela, le pitch dit « ancrage local seulement ».
2. **Déployer les contrats de démo** (OpenZeppelin manquait dans blockchain/DEPLOYMENTS.md) et faire tourner la chaîne locale pour que Titouan joue l'essai réel avec un VRAI MetaMask (protocole : research/titouan/T_banc_e2e/essai_reel/PROTOCOLE_V2.md).
3. **Enregistrer la vidéo unique** (2 min 40, script : livrables/VIDEO_SCRIPT.md). Notre garde-fou refuse Chromium avec débogage : à faire à la main, ou avec ton script film_scene.mjs sur ta machine.
4. **Le relais Clef dans l'extension** (research/demo_reelle/classifieur/relay.mjs) : le build autonome est sans réseau (connect-src 'none') par choix. Décide : variante « avec relais » séparée, ou on reste sans modèle dans la démo. La clé Cloudflare de Titouan est dans son .env local (non versionné).
5. **Décision Fuji** : Titouan l'a mise de côté. Dis-lui si la démo se fait sur chaîne locale seulement.
6. **Essai Sepolia avec un vrai MetaMask** pour remplacer les [NV] de RECHERCHE_metamask_couverture.md par des constats (alerte ou pas sur une adresse neuve).
7. **Design** : captures finales et `docs/design/v5/` si tu veux ajuster ce que les agents de design ont fait (sites Neve, Glacier, Lab, fenêtre d'extension, panneau latéral).

## DÉJÀ FAIT (ne pas refaire)
Extension Q16/Q17, 21 failles de sécurité traitées en grande partie, panneau latéral, build autonome, pipeline qui ne baisse plus aucun niveau, grille de 2 170 paires, 410 cas de décalage, jeu aveugle de 250 cas (SCELLÉ, non ouvert), mesure en chaîne de la part de droits illimités, pitch V1 à V6 (jurés simulés : 57,8 puis 68,4 puis 74,0), livrables, démo web 13 scènes.

## CE QU'IL NE FAUT JAMAIS FAIRE
Ouvrir blind_decalage/CASES.jsonl, blind_adem/v2/V2_TEST.jsonl ou attacks/TEST.jsonl (Titouan donne le go). Mettre une clé ou un .env dans le dépôt. Écrire « MetaMask ne le voit pas » sans preuve.

Messages détaillés : coord/INBOX.md (lignes de Claude-Titouan).
