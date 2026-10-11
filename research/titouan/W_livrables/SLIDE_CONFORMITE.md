# Slide conformité : contenu

Titre proposé : **Une décision, une preuve, un rejeu.**

Statut : brouillon du 11 oct. 2026. Aucune conformité n'est affirmée. Ce qui n'est pas livré est marqué.

## Colonne 1 : comment un auditeur vérifie une décision

1. **Journal chaîné par hachage.** Chaque verdict devient une ligne : horodatage, hachage de la ligne précédente, niveau, codes de règle, empreinte des paramètres. Une ligne modifiée ou supprimée casse la chaîne. Commande : `node server/server.mjs --verify-journal`. État : fait en local (`research/titouan/T_banc_e2e/server/server.mjs`).
2. **Ancrage sur Fuji.** La racine du journal est écrite par lots sur la blockchain de test Avalanche Fuji, pour qu'une alerte montrée, son heure et le choix de l'utilisateur ne puissent pas être réécrits après coup. Un vérificateur en lecture seule recalcule les racines et les compare à celles enregistrées. État : en cours, non livré. Les contrats ne sont pas encore listés (`blockchain/DEPLOYMENTS.md`). Fuji est un réseau de test : cela démontre le mécanisme, pas une valeur légale.
3. **Version des règles.** Les règles ont une empreinte (`f952f3fb298f`, `research/titouan/T_banc_e2e/COUVERTURE.md`). À faire : écrire cette empreinte et la version du modèle dans chaque ligne de journal (`coord/INBOX.md` MSG-051).
4. **Rejeu.** Le banc rejoue les cas contre une empreinte de règles donnée, avec jeu gelé dont le hachage est publié avant ouverture (`research/titouan/T_banc_e2e/attacks/TEST_HASH.txt`, `blind_adem/v2/V2_TEST.sha256`). Chaque ouverture du jeu TEST est journalisée (`run/out/TEST_OUVERTURES.json`).
5. **Explicabilité.** Chaque avertissement vient de code déterministe et cite ses raisons ("tu as dit X, ça fait Y"). Le verdict ne dépend pas d'un score opaque.

Limite à dire : un journal chaîné prouve l'intégrité et l'ordre. Il ne prouve pas que les règles étaient bonnes.

## Colonne 2 : RGPD (principes de conception, pas une attestation)

- **Minimisation.** Le journal garde l'empreinte des paramètres, pas les paramètres ni le texte libre.
- **Local par défaut.** Le serveur écoute sur 127.0.0.1. L'extension n'a pour permission réseau que cette adresse (`extension/COMPAT.md`, limite 16). La version autonome vise zéro réseau sortant, en cours.
- **Point d'attention.** `pageText` (4000 caractères de début visibles) et `intent_text` partent vers le serveur local : à traiter comme données personnelles potentielles.
- **Droits des personnes** (accès, effacement) : non traités à ce stade.

## Colonne 3 : AI Act (positionnement, à faire valider)

- **Le modèle ne peut qu'aggraver.** Le comparateur final est du code. Un modèle, s'il est utilisé, peut monter le niveau, jamais le baisser (`research/titouan/O_barriere_intention.md`). Il ne décide pas seul.
- **Transparence.** L'utilisateur sait quand un message a été classé par un modèle et voit la raison de l'avertissement.
- **Contrôle humain.** L'utilisateur garde la décision finale.
- **Qualification juridique** (risque, obligations) : non établie par nous. Le guide du hackathon note un report des obligations haut risque à déc. 2027 (`context/notion_guide.md`).

## Colonne 4 : DORA et MiCA

Pertinent pour des clients prestataires (par exemple un prestataire de services sur crypto-actifs qui intégrerait l'outil). Hold up ne se déclare conforme à aucun de ces textes. Elle fournit des éléments de preuve (journal, version, rejeu) qu'un client prestataire pourrait verser à son propre dossier.

## À dire à l'oral en une phrase

"Chaque décision laisse une ligne que personne ne peut modifier sans que cela se voie, rattachée à une version de règles que l'on peut rejouer."
(La partie "sans que cela se voie" dépend de l'ancrage Fuji. Ne la dire qu'une fois l'ancrage livré et testé.)
