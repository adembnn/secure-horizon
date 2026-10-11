# Playbook de réponse : Hold up

Une page. Statut : brouillon du 11 oct. 2026, mis à jour avec les livraisons d'Adem (non rejouées ici). Ce qui est "prévu" n'est pas livré. Les chemins sont relatifs à `research/titouan/`.

## 1. Principe

**MetaMask te prévient de ce qu'il reconnaît. Hold up vérifie ce que tu voulais faire.** Les alertes de MetaMask (transactions et signatures, Blockaid, actives par défaut, Avalanche dans la liste de la page https://support.metamask.io/configure/wallet/security-alerts/) restent en place. Hold up ne les refait pas. Il ajoute la comparaison avec l'intention écrite, un délai et une preuve. Ses réponses sont binaires : « ça correspond » ou « ça ne correspond pas », avec une ligne. Sur Fuji et les chaînes locales, on ne sait pas ce que MetaMask affiche : son silence ne prouve rien.

On avertit et on ralentit. On ne retire pas le choix à l'utilisateur. La réponse est graduée : plus l'écart entre ce que la personne dit et ce que la transaction fait est grand, plus l'écran est insistant et plus le geste demandé est lent.

## 2. Qui est alerté

| Qui | Comment | État |
|---|---|---|
| L'utilisateur, au moment de signer | fenêtre dans la page : "tu as dit X, ça fait Y", bouton "Annuler" toujours visible | fait, testé avec portefeuille simulé (`T_banc_e2e/extension/COMPAT.md`) |
| Un proche de confiance, si l'utilisateur en a désigné un (réglage `contact`) | option de la page d'options | réglage présent, usage réel non testé |
| L'éditeur de Hold up | lignes du journal local (niveau, code de règle, empreinte des paramètres) | fait en local (`T_banc_e2e/server/server.mjs`) |
| Un analyste, un SOC | non prévu pour un particulier | hors périmètre |

## 3. Ce qui est automatique

1. Interception de la requête de signature ou de transaction avant le portefeuille.
2. Décodage de l'effet réel, comparaison à l'intention, verdict `ok`, `warn` ou `critical`.
3. Friction proportionnée : délai, phrase à retaper, retenue plus longue pour une manipulation détectée. Les durées sont des réglages (`frictionMs`, `manipulationHoldMs`). Les valeurs de 30 s et de 10 min sont des hypothèses sans preuve publiée (`docs/design/REGLES_avertissements.md`).
4. En cas de doute, jamais de feu vert : API absente, lente ou erreur donnent "Non vérifié". Si le pont de l'extension ne répond pas en 2,5 s, la requête surveillée est refusée (erreur 4900) plutôt que laissée passer (`T_banc_e2e/extension/COMPAT.md`).
5. Écriture d'une ligne de journal chaînée par hachage, sans texte libre, avec l'empreinte des paramètres et non les paramètres.
6. Les questions de clarification (2 à 4) ne peuvent que monter le niveau, jamais passer sous le plancher objectif du moteur (`R_cas_complexes/SYNTHESE.md`, constat 7).

## 4. Ce qui reste humain

- **La décision de signer.** L'utilisateur peut passer outre. Le temps de décision est journalisé (`time_to_decision_ms`), pas encore mesuré sur des personnes.
- **Appeler un proche, raccrocher, attendre.** Seuls des gestes qui cassent la guidance d'un escroc ont une logique solide (`docs/design/REGLES_avertissements.md`, TL;DR 5).
- **Contester une fausse alerte.** Le canal de signalement n'est pas construit. Le niveau de fausses alertes à connaître : 1,0 % de critical sur V2_DEV (synthétique et réglé, avec le contexte du banc), 14,4 % au réglage produit par défaut sur ce même jeu (13,9 % tous jeux, `banc_realiste/BANC_REALISTE.md`), 0,30 % de critical sur le trafic réel C-Chain, 3,33 % sur Ethereum (`RESULTATS_A_JOUR.md`).
- **Publier, corriger ou retirer une règle.** Prévu : règles signées, mode ombre, déploiement par paliers, retour à la version précédente en un geste (`V_workflow_souris_chat.md`). Non implémenté à la rédaction.
- **Déclarer un incident à un régulateur.** Hors périmètre d'un outil pour particulier.

## 5. Comment c'est documenté

- Journal local chaîné par hachage (sha256) : chaque ligne contient le hachage de la précédente. `node server/server.mjs --verify-journal` dit si la chaîne est intacte.
- Champs journalisés par verdict : origine, méthode, niveau, fiche, codes de règle, latence, empreinte des paramètres. Le journal de l'extension ajoute la décision de l'utilisateur.
- Manque connu : la version des règles et du modèle ne figure pas encore dans la ligne de journal du serveur. Le module `T_banc_e2e/anchor/journal.mjs` a les champs `rulesVersion` et `modelVersion`, à brancher sur le serveur (demande d'Adem, `coord/INBOX.md` MSG-051).
- Ancrage de la racine du journal : le code (racine de Merkle, preuves d'inclusion, vérificateur en lecture seule) passe 42 vérifications locales (`T_banc_e2e/anchor/ANCHOR_README.md`). Le contrat `EvidenceAnchor.sol` n'a pas été compilé chez nous. Adem l'a compilé et déployé sur un nœud local avec son Hardhat (`coord/INBOX.md` MSG-058). Rejeu sur chaîne local annoncé dans `coord/reports/critere_reponse.md`, non rejoué ici. Aucun déploiement sur Fuji listé. Sans ancrage, quelqu'un qui contrôle le fichier peut le réécrire en entier et recalculer la chaîne.
- Les règles sont versionnées par empreinte (`f952f3fb298f` dans `T_banc_e2e/COUVERTURE.md`). Le banc rejoue les cas contre cette empreinte.

## 5bis. Ce qui n'est pas mesuré

- L'intention en texte libre : les mesures utilisent des cases.
- Clef et Jev : jamais appelés faute de clé. Le classement actuel est par mots-clés. On ne dit pas « Clef classe l'intention » sans mesure.
- Le temps de décision et l'effet d'un avertissement sur de vraies personnes.

## 6. Responsabilité

**L'éditeur répond de ses règles et de son journal. L'utilisateur répond de sa signature.**

Détail :
- Faux positif : coût en friction, pas en perte. L'éditeur doit pouvoir corriger la règle et le montrer dans le journal.
- Faux négatif : une perte reste possible. Aucune promesse de résultat n'est faite. Les taux de non-détection sont publiés avec leur n (`RESULTATS_A_JOUR.md`). Le produit livré aujourd'hui rate 3 643 arnaques sur 6 191 (`redteam/PRODUIT_VS_BANC.md`).
- Le modèle de langage, s'il est utilisé, ne peut qu'aggraver un verdict. Il ne peut donc pas valider seul une transaction dangereuse (`O_barriere_intention.md`, position 1).
- Si l'utilisateur passe outre un avertissement critique, le journal en garde la trace. C'est un élément de preuve, pas un transfert de faute automatique.
- Question du jury "si votre modèle se trompe, qui est responsable ?" : l'éditeur pour la règle et le journal, l'utilisateur pour le geste final. Cette répartition est une position de produit, pas un avis juridique.
