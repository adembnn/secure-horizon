# Boucle jurés (Claude-Titouan), tour 1 : synthèse

Plan jugé : architecture v0 d'Adem + spec DORA + challenge + positions du grilling. Rien n'est construit. Les jurés sont des sous-agents, leurs notes sont des estimations, pas des mesures. Aucun n'a fait de recherche web : tous les chiffres 2026 sont ceux du dépôt.

## Notes
| Juré | Détection /30 | Réponse /20 | Faisabilité /20 | Conformité /15 | Pitch /15 | Total |
|---|---|---|---|---|---|---|
| 1 Avalanche / Team1 | 17 | 14 | 11 | 12 | 9 | 63 |
| 2 KPMG | 17 | 14 | 11 | 10 | 9 | 61 |
| 3 Kryptosphère | 21 | 14 | 13 | 12 | 8 | 68 |
| 4 RSSI de CASP | 18 | 14 | 11 | 11 | 9 | 63 |
| 5 Chercheur attaquant DeFi | 17 | 12 | 11 | 10 | 9 | 59 |
| 6 Superviseur AMF | 18 | 14 | 11 | 11 | 9 | 63 |
| 7 Grand jury généraliste | 19 | 14 | 11 | 11 | 11 | 66 |
| **Moyenne** | 18,1 | 13,7 | 11,3 | 11,0 | 9,1 | **63,3** |

Lecture : le plan est jugé lucide mais promis, pas prouvé. Les deux colonnes les plus basses relatives sont la faisabilité (11/20) et la détection (18/30).

## Ce sur quoi les 7 jurés convergent (par ordre de fréquence)
1. **Détection circulaire et trop facile (7/7).** Un drain rapide se bloque avec n'importe quel limiteur ; règles et attaques écrites par la même équipe. Remède unanime : hash des règles scellé avant les attaques, attaques écrites en aveugle, variantes d'évasion (drain lent, fractionnement, changement de rôle légitime), faux positifs pour 10 000 transactions avec gros retraits légitimes, ratés publiés.
2. **Périmètre sans rapport avec le temps (7/7).** Un seul scénario parfait. Couper : traceur multi-sauts, pont simulé, webhooks SIEM, vitrine React, Bedrock sur le chemin critique. (Réserve : la deadline serait repoussée ; les jurés ne le savent pas, mais le plan doit rester ordonné par priorité.)
3. **Le pitch et l'architecture se contredisent (6/7).** "Un piège qui ne ment pas / zéro faux positif" est promis, le leurre n'existe pas dans l'architecture, et le rejeu sur fork non plus. Remède : le plafond de sortie et la voie lente en titre, le leurre en bonus honnête, jamais "zéro faux positif".
4. **Persona et point d'application (5/7).** Un prestataire crypto garde ses fonds en MPC, pas dans un vault maison. Le RSSI : "je ne mets pas un contrat de hackathon dans mon périmètre MiCA". Remède : écrire "prestataire agréé qui opère un produit on-chain, ou émetteur de token" ; présenter Guard comme un **module de garde ajouté à un coffre existant** (le client garde clés et admin), et Watch en lecture seule comme entrée.
5. **Jargon et lisibilité (6/7).** Une page pour le juré, ITS/RTS/NIST/D3FEND en annexe.
6. **"Le rapport s'écrit tout seul" est faux et risqué (4/7, dont AMF et KPMG).** Remède : "le dossier est prêt à relire en 4 h", aucune case de classification pré-cochée, choix humain nommé et horodaté.
7. **Chiffres fragiles (6/7).** Bitget "0,08 %" → "moins de 0,3 %" avec la source ; Parallel = source vendeur ; 33 incidents AMF = surtout sociétés de gestion ; "362 CASP" = agrégateur, pas ESMA.

## Défauts graves qu'un seul juré a vus mais qu'il faut traiter
- **Attaques contre le système lui-même (chercheur attaquant).**
  - Empoisonnement de la ligne de base : un attaquant patient fait monter les retraits "légitimes" jusqu'à faire monter le seuil. Remède : plafonds absolus en dur dans le contrat, indépendants de toute ligne de base apprise ; ligne de base fenêtrée, figée, signée, avec une dérive maximale par période.
  - Épuiser le budget de resserrages avec 40 petits retraits puis lancer le vrai drain. Remède : le budget épuisé ne retire jamais le plafond dur ; au-delà, un humain décide.
  - Fausse pause provoquée (changement de rôle douteux, oracle poussé hors bande) pour créer l'incident DORA. Remède : pause automatique seulement sur invariant on-chain sans dépendance externe ; expiration dure à 30 minutes ; signaux probabilistes plafonnés à la voie lente ; budget quotidien défini.
  - Clé du bot volée. Remède : le bot ne peut que resserrer, jamais assouplir ni retirer ; l'ancrage est signé par une autre clé ; clés de démo marquées jetables, modèle de production (HSM/MPC) écrit en une phrase.
- **Erreurs de ma spec DORA (KPMG), corrigées dans A_spec_moteur_dora.md.** T3 était faux : une pause totale de 3 h touche presque tous les clients (9(1)) et dépasse 2 h (9(3)), donc majeur probable ; seule la voie lente partielle ne l'est pas. T9 : lecture stricte retenue (les deux limites s'appliquent, retard à signaler), lecture souple notée. Champ 2.8 : un seul format. Il reste à lire le Journal officiel.
- **Frontière "pré-rempli / décidé" (AMF).** "La règle signée par la direction décide" mélange la règle de pause et la qualification juridique d'un incident donné. Distinguer les deux. La racine Merkle prouve que le journal n'a pas changé, pas qu'il est exact : le dire.
- **Combien de champs prouvés (KPMG).** Afficher "N champs sur M prouvés on-chain, le reste est profil ou jugement humain".

## Ce qui est apprécié (à protéger)
Plafond de sortie en dur (6/7), dossier DORA avec preuve par champ et deux lectures (7/7), pré-enregistrement et ratés publiés (6/7), honnêteté sur les limites (5/7), second signataire pour "non majeur", refus de deviner un LEI.

## Ce qui ferait monter chaque juré de 10 points (même chose, formulée 7 fois)
Une démo unique de 2 à 3 minutes, sur Fuji avec liens Snowtrace, qui se lit sans narration : le coffre se vide en direct, le plafond bloque dès le 3e retrait, un compteur "X € sauvés sur Y", une comparaison mesurée avec un cas réel (Bitget : moins de 0,3 % gelé en un jour), un clic sur un champ du dossier ouvre la transaction, puis un tableau de métriques avec les ratés. Le juré Avalanche : sans lien Snowtrace, sous 65. Le juré AMF : mettre le moteur en échec devant lui sur trois cas limites avec les deux lectures.

## Comparaison avec Trustee (juré Kryptosphère)
Trustee : un utilisateur normal, un clic, un score lisible, une explication, compris en 10 secondes. Sentinelle : B2B réglementé, formulaire de 60 champs. "Trustee gagnerait au pitch aujourd'hui", sauf si la démo transforme la conformité en spectacle visible (argent sauvé, champ prouvé en un clic, phrase "voilà pourquoi on a bloqué" à l'écran).

## Décision pour le tour 2
Réécrire le plan en une page lisible (plan_v1_1.md), appliquer les remèdes 1 à 7 et les défenses contre les attaques sur le système, puis refaire noter par les mêmes 7 jurés. Objectif : passer de 63 à 72 ou plus, et surtout voir si les jurés trouvent de nouveaux défauts plutôt que les mêmes.
