# Round 1, juré KPMG : sans fiche d'incident, la conformité chute-t-elle ?

## 1. Thèse
Le critère note des décisions « défendables devant un régulateur ou un auditeur » (notion_guide.md l. 67). Défendre, c'est remettre une pièce lisible par un tiers, pas un fichier de hachages. Sans fiche, vous montrez une mécanique de trace, pas une preuve d'événement.

## 2. Cinq arguments, du plus fort au plus faible
1. **Le livrable exige « comment c'est documenté »** (l. 60). Votre playbook y répond par la fiche (PLAYBOOK_REPONSE.md l. 22 et 32). Retirez-la : les sections 3 et 5 pointent vers du vide.
2. **Le journal seul ne raconte pas l'incident.** Heure, site, niveau, codes, décision. Ni requête ni phrase (journal_chain.js l. 6 ; SLIDE_CONFORMITE.md l. 17). Un assureur veut : quoi, quand, qui a décidé, quelle suite. La fiche relie verdict, décision et retraits (incident.mjs l. 1 à 3).
3. **Le règlement nomme l'assureur** (« explicable à un régulateur, un auditeur ou un assureur », l. 52). Il ne lance pas `verify_journal.mjs`. Il lit une page datée, avec ligne et empreinte.
4. **Vos pièces se contredisent.** PLAYBOOK l. 17 : autonome « non chaînées » ; SLIDE l. 11 et journal_chain.js : chaînée. incident.mjs lit le format serveur, pas l'extension livrée. Un passage automatique est noté confirmation humaine (SLIDE l. 16).
5. **Votre argument DORA est le registre des incidents** (art. 17 §2, SLIDE l. 11). Un registre se remplit de fiches, pas de lignes de neuf champs.

**Faits contre ma thèse.** Journal chaîné dans les deux builds, 7 tests, export JSON, vérificateur hors ligne (RAPPORT_SECURITE_CORRECTIFS.md l. 125 à 130). Rejeu 6 sur 6 (EXPLICABILITE.md). Playbook existant. « Fiche » absente de la grille. Mes rounds 2 et 3 ne l'ont pas exigée : 10 puis 12 sur 15.

## 3. Trois questions en salle
1. « L'alerte d'hier : montrez-moi la pièce que la victime donne à son assureur. Pas le terminal. »
2. « Votre playbook renvoie à une fiche d'incident. Où est-elle dans l'extension que vous venez de montrer ? »
3. « La personne a continué malgré l'alerte. Où est écrit ce qu'elle a vu, et qui a confirmé : elle ou un automatisme ? »

## 4. Note sur 15
- **Avec fiche** tirée du journal livré, montrée dix secondes : **12,5**. Critère couvert.
- **Sans fiche, playbook corrigé** : **11**. Journal et rejeu portent l'essentiel. Moins un point pour « documenté » faible, un demi pour l'assureur sans pièce.
- **Sans fiche, playbook laissé tel quel** (renvois morts, contradiction l. 17) : **9,5**. Là, la question 2 fait mal.

Honnêtement : vous ne perdez pas les 15 %. Vous perdez 1,5 point, 3 si les renvois morts restent.

## 5. Version minimale qui me suffit
Un bouton « Exporter la fiche » dans le panneau latéral : page HTML imprimable tirée de la chaîne existante, sans réseau :
- numéro de ligne, heure UTC, site, méthode, niveau, codes traduits en clair ;
- décision enregistrée (annuler, continuer), avec la mention si elle est automatique ;
- hachage de la ligne, tête de chaîne, résultat de `verifyChain` et sa limite ;
- deux listes courtes : ce que la fiche établit, ce qu'elle n'établit pas ;
- trois suites : retrait de droits, plainte, AMF (reprises des lignes [V] de INCIDENT_ETAPES.md).

Temps estimé : **3 à 4 heures**, tests compris.

Repli : corriger PLAYBOOK l. 17, 22 et 32 pour renvoyer à l'export JSON et à `verify_journal.mjs`. **30 minutes.** Évite le 9,5, pas la perte du point et demi.
