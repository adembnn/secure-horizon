# Reprise de la session Adem (11 oct. 2026, matin)

À lire par toute session (Claude, Kiro, Titouan) qui reprend le travail côté Adem.

## Thèse retenue par Adem (à confirmer par la vérification en cours)

« Tout service peut être compromis. Ce jour-là, tu perds ce que tu lui as laissé le droit de prendre. Hold up ne lui laisse que ce que tu as écrit vouloir faire. »

- Ne pas dire « les données fuitent donc le portefeuille est vidé » : ce qui vide un portefeuille est un contrat exploité ou une interface détournée qui utilise les droits déjà accordés.
- « À l'ère de l'IA » : pas encore sourcé. Vérification attendue dans `research/demo_reelle/RECHERCHE_these_moindre_privilege.md` (agent lancé, fichier peut-être absent si la session s'est arrêtée avant).
- Ne pas prédire un changement d'habitudes des utilisateurs.
- Ne jamais écrire « MetaMask ne le voit pas », « personne ne protège les particuliers », « l'idée n'existe pas ».

## Décisions produit arrêtées (saisie de l'intention)

1. La fenêtre s'ouvre seulement sur les demandes qui déplacent de la valeur ou accordent un droit.
2. L'utilisateur écrit son intention avant de voir la demande.
3. Un champ de texte libre : ni trous, ni pré-remplissage, ni boutons, ni dernière intention proposée. Exemple grisé seulement.
4. Intention vague : une relance, puis « Je n'ai pas pu vérifier cette demande ».
5. Pas de question « quelqu'un me guide ».
6. Pas de carnet d'adresses : l'adresse est collée dans la phrase.
7. Ça correspond : le portefeuille s'ouvre tout seul après une seconde.
8. Montant écrit contre droit plus large : « Ça ne correspond pas », même sur un site connu.
9. On ne parle pas du questionnaire de MetaMask en pitch ; réponse prête si un juré le soulève.

## Questions ouvertes pour Adem

- Q16 : sur l'écart « montant écrit contre droit plus large », pas d'attente de 30 s, seulement la correction ? (recommandé : oui)
- Q17 : Hold up remplace-t-il lui-même le droit illimité par le montant écrit avant de transmettre au portefeuille, avec une ligne « Droit limité à 50 USDC » ? (recommandé : oui ; impossible pour une signature Permit)

## État du code

- Extension alignée sur les décisions 1 à 8 : `research/titouan/T_banc_e2e/extension/` (`written_check.js`, tests `tests/unit/decisions.test.mjs`), build autonome et zip refaits. Tests annoncés : 63/63 unitaires, 37/37 suite autonome.
- Correctifs EN COURS au moment du commit (agent interrompu possible, état non vérifié) : `extension/effect_sim.js`, `tests/unit/operation.test.mjs`. Objectifs : (a) une intention couvre les demandes successives de la même opération sur le même site ; (b) vérifier un échange illisible par simulation ; (c) pour une signature, ne pas conseiller de réduire le plafond ; (d) accents du site Neve. Relancer les tests avant de s'y fier.
- Site de démo « Neve » : `research/demo_reelle/site_echange/` (port 8793, `?mode=honnete`, `?mode=piege`, `?mode=piege&via=permit`), preuve par lecture de chaîne dans `test/preuve.mjs`.
- Scène jouée dans un vrai Chromium avec l'extension : piège et piège par signature = « Ça ne correspond pas », rien n'arrive au portefeuille ; honnête = 1re demande correcte, 2e demande (l'échange) échouait en « pas pu vérifier » avant les correctifs ci-dessus.
- Clef-flash fonctionne (clés dans `.env`, non versionné). `pipeline/intent_clef.mjs` classe l'intention écrite ; il n'est branché ni dans l'extension ni dans le serveur.

## Mesures (toutes sur le jeu de réglage, V2_TEST jamais ouvert)

- `pipeline/RESULTATS_INTEGRATION.md` : produit seul 3 643 arnaques ratées / 440 fausses alertes ; avec détecteurs 971 / 684.
- `pipeline/RESULTATS_INTENTION_CLEF.md` : sur 298 arnaques qui passent sans intention, l'intention parfaite en rattrape 34, le texte libre 0 (les textes des cas ne contiennent pas les détails). Ensemble : 920 ratées sans intention, 752 avec intention parfaite, 804 avec texte libre + Clef ; fausses alertes 623 / 768 / 645. Aucun chiffre ne montre encore un fort apport de l'intention écrite : il manque un jeu de cas construit pour la thèse (demande d'apparence normale, phrase réaliste avec montant).
- `redteam/classifier_measure.json` : texte accompagnant la demande, mots-clés 21,3 % de rappel, Clef-flash 72 % à 0,3 % de fausses alertes.
- Défauts connus : 26 arnaques bloquées sans intention passent avec le texte lu par Clef (comparateur) ; 112 textes « autoriser / mettre en vente » classés dans le sens le moins strict.

## Recherches sourcées (`research/demo_reelle/`)

`RECHERCHE_metamask_couverture.md`, `RECHERCHE_concurrents_particuliers.md`, `RECHERCHE_chiffres_douleur.md`, `RECHERCHE_douleurs_secondaires.md`. Les pages ont été lues via un outil qui résume : relire chaque citation à son URL avant de la mettre sur une slide.

## À faire

1. Trancher Q16 et Q17, puis construire le plafonnement automatique si Q17 = oui.
2. Finir et vérifier les correctifs de l'extension, rejouer les trois modes, filmer.
3. Brancher Clef dans l'extension (relais `research/demo_reelle/classifieur/relay.mjs`).
4. Construire le jeu de cas de la thèse et mesurer.
5. Reprendre deck, pitchs, fiche de défense, README et vidéo sur la thèse ; retirer l'adresse sosie et le RPC de garde.
6. Points bloquants déjà listés dans `coord/reports/jury/` (vidéo unique, fiche d'une page, incohérence Fuji, cache de 95 Mo et jeux gelés suivis par git).
