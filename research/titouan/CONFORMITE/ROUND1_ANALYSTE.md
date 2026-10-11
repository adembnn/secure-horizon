# Round 1, analyste du règlement : abandonner la fiche d'incident coûte-t-il les 15 % ?

Réponse courte : non. La fiche n'est demandée nulle part. Le critère porte sur la trace et sa vérification. Mais trois trous coûtent plus que la fiche.

## 1. Ce que le texte exige (context/notion_guide.md)

- l.67, critère : « Décisions traçables et défendables devant un régulateur ou un auditeur ».
- l.60, playbook : « comment c'est documenté ».
- l.60, slide conformité : « comment un auditeur vérifie les décisions ».
- l.52 : « explicable à un régulateur, un auditeur ou un assureur ».
- l.71, conseil : « si votre modèle se trompe, qui est responsable ? ».

Le mot « fiche » ou « rapport d'incident » n'apparaît pas. La « déclaration pré-remplie » (l.58) appartient à la piste DeFi + DORA, pas à la nôtre.

## 2. Nos preuves sans la fiche

| Preuve | État vérifié le 11 oct. |
|---|---|
| Journal chaîné de l'extension, deux builds (`journal_chain.js`), export et vérification hors ligne | Existe. 7 tests sur 7 relancés. Jamais vu dans Chrome. |
| Minimisation : ni phrase ni adresse dans la chaîne, codes filtrés | Existe, dans le code (`contentOf`). Point fort. |
| Rejeu auditeur (`verify_decision.mjs`) : chaîne, preuve Merkle, rejeu du moteur, règle vers fichier et ligne | Testé. Rejoué aujourd'hui sur copie : 6 sur 6, sortie 0. Version serveur seulement. |
| Auto-test de falsification (ligne modifiée, retirée) | Testé. Limites affichées par le script. |
| Ancrage de la racine | Chaîne locale seulement. Fuji non exécuté. |
| Slide conformité avec articles sourcés, refus de revendiquer une conformité | Écrit. Sérieux. |
| Répartition des responsabilités (EXPLICABILITE §5, QR 12) | Écrit. |
| Réponse graduée en données (`matrix.json`) | 9 tests verts. |

## 3. Ce que la fiche apporte en plus

Il existe deux choses sous ce nom. `reponse/incident.mjs` (ancien format serveur, 7 tests verts). Et `INCIDENT/wip/incident.js` pour l'extension : ses tests ne tournent pas (`fake_chrome.mjs` absent). `INCIDENT_ETAPES.md` est un guide victime, sourcé, mais pas une preuve.

Apport réel : une page lisible par un assureur ou un policier, par événement. Cela répond à « assureur » (l.52) et à « documenté » (l.60). Elle n'ajoute aucune traçabilité : elle est construite depuis le même journal. Elle ne peut donc pas dire plus que lui. Son poids se joue surtout en « Qualité de la réponse » (20 %, « utile à l'analyste »), pas ici.

Risque concret si on l'abandonne sans nettoyer : elle est promise dans `FICHE_DEFENSE.md` l.5, `QR_JURY.md` l.3 et question 4. Une promesse non tenue coûte plus qu'une absence.

## 4. Note estimée sur 15

- Avec fiche montrée : 9 à 11.
- Sans fiche, mentions retirées : 8 à 10.
- Sans fiche, mentions laissées : 6 à 8.

Hypothèses : trois experts, 5 minutes, jugement sur la slide et un moment de démo. Écart dû à la fiche : environ 1 point sur 15 (1 % de la note totale). Si le rejeu auditeur est montré en direct, l'écart tombe vers 0.

## 5. Trois trous qui coûtent des points, fiche ou pas

1. **Le rejeu ne porte pas sur le produit livré.** Il marche sur le journal du serveur. La chaîne de l'extension ne garde ni empreinte des paramètres, ni « qui a décidé » (`by`), ni la limitation à 50 USDC (`contentOf` les retire). D'où les deux inexactitudes déjà relevées par l'audit. De plus, `sample/journal.jsonl` est exclu par `.gitignore` : la commande de la slide échoue sur un clone (il faut lancer `make_sample_journal.mjs` d'abord).
2. **La version des règles n'est pas dans le journal serveur.** Preuve que c'est réel : EXPLICABILITE cite l'empreinte `f30cf33c…` sur 20 fichiers. Aujourd'hui le script calcule `43da74f0…` sur 21 fichiers. Le code a bougé ; une ligne d'hier ne dit pas quelles règles l'ont jugée. L'extension ne garde que la version du build (`v`).
3. **Documents contradictoires et journal non ancré.** PLAYBOOK §2, §6, §8, MAPPING l.17 et PRODUCT l.53 disent le build autonome non chaîné. SLIDE, FICHE_DEFENSE et QR disent chaîné. Le code donne raison aux seconds. Deux pièces qui se contredisent : l'inverse de « défendable ». Ancrage Fuji : non fait.

## 6. Recommandation

1. Abandonner la fiche est défendable. On ne perd pas d'emblée les 15 %, environ 1 point au plus.
2. Retirer toute mention de fiche dans FICHE_DEFENSE, QR_JURY et le pitch, ou la remplacer par « export du journal vérifiable ».
3. Aligner PLAYBOOK, MAPPING et PRODUCT sur le code : build autonome chaîné.
4. Ajouter à la chaîne `by`, la limitation et une empreinte des règles : quelques lignes, gain supérieur à la fiche.
5. Committer le journal d'exemple et montrer le rejeu 30 secondes en démo.
