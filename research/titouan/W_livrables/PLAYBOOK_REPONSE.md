# Playbook de réponse : Hold up

Une page. Statut : brouillon du 11 oct. 2026. Ce qui est "prévu" n'est pas livré. Les chemins sont relatifs à `research/titouan/`.

## 1. Principe

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
- **Contester une fausse alerte.** Le canal de signalement n'est pas construit.
- **Publier, corriger ou retirer une règle.** Prévu : règles signées, mode ombre, déploiement par paliers, retour à la version précédente en un geste (`V_workflow_souris_chat.md`). Non implémenté à la rédaction.
- **Déclarer un incident à un régulateur.** Hors périmètre d'un outil pour particulier.

## 5. Comment c'est documenté

- Journal local chaîné par hachage (sha256) : chaque ligne contient le hachage de la précédente. `node server/server.mjs --verify-journal` dit si la chaîne est intacte.
- Champs journalisés par verdict : origine, méthode, niveau, fiche, codes de règle, latence, empreinte des paramètres. Le journal de l'extension ajoute la décision de l'utilisateur.
- Manque connu : la version des règles et du modèle ne figure pas encore dans la ligne de journal du serveur. À ajouter (demande d'Adem, `coord/INBOX.md` MSG-051).
- Ancrage de la racine du journal sur Fuji : en cours, non livré. Sans ancrage, quelqu'un qui contrôle le fichier peut le réécrire en entier et recalculer la chaîne.
- Les règles sont versionnées par empreinte (`f952f3fb298f` dans `T_banc_e2e/COUVERTURE.md`). Le banc rejoue les cas contre cette empreinte.

## 6. Responsabilité

**L'éditeur répond de ses règles et de son journal. L'utilisateur répond de sa signature.**

Détail :
- Faux positif : coût en friction, pas en perte. L'éditeur doit pouvoir corriger la règle et le montrer dans le journal.
- Faux négatif : une perte reste possible. Aucune promesse de résultat n'est faite. Les taux de non-détection sont publiés avec leur n (`RESULTATS_A_JOUR.md`).
- Le modèle de langage, s'il est utilisé, ne peut qu'aggraver un verdict. Il ne peut donc pas valider seul une transaction dangereuse (`O_barriere_intention.md`, position 1).
- Si l'utilisateur passe outre un avertissement critique, le journal en garde la trace. C'est un élément de preuve, pas un transfert de faute automatique.
- Question du jury "si votre modèle se trompe, qui est responsable ?" : l'éditeur pour la règle et le journal, l'utilisateur pour le geste final. Cette répartition est une position de produit, pas un avis juridique.
