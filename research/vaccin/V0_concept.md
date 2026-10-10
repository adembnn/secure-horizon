# V0 — Concept retenu : système immunitaire pour agents IA financiers (Track 1)

> Idée d'Adem, 2026-10-10. Rapports détaillés à venir : V1 architecture, V2 Avalanche/partenaires, V3 concurrence, V4 business, V5 démo/stack.

## L'idée en une phrase
Les agents IA qui font des transactions sont exposés en continu, dans une arène qui nous appartient, à des scénarios d'attaque simulés ; chaque attaque réussie produit un **vaccin** (règle de défense exécutable, testée) qui est **partagé et tracé on-chain** pour que tous les agents deviennent immuns, même sans avoir été attaqués.

## Ça existe déjà ?
Des morceaux existent séparément :
- red teaming continu d'agents (Gray Swan, promptfoo, Lakera Red) : il trouve les failles mais ne fabrique ni ne partage le correctif ;
- partage de menaces on-chain (Forta, SEAL 911) : il partage des alertes, pas des défenses prêtes à brancher ;
- « immune system » de Darktrace : un slogan pour de la détection d'anomalies réseau, sans vaccin ni agents IA.

La boucle complète (attaque → défense générée → testée → partagée + preuve on-chain) n'est pas un produit courant. À confirmer par V3.

## Fonctionnement technique (5 étapes)
1. **Arène** : une copie de l'agent financier (même modèle, mêmes outils, fausse trésorerie sur Avalanche Fuji) reçoit des scénarios piégés d'un « agent rouge » : fausse facture, faux mail du DAF, page web manipulée.
2. **Infection** : détection déterministe (transaction vers un destinataire hors mission) et enregistrement de toute la trace (lectures, raisonnement, appels d'outils, paramètres).
3. **Autopsie** : Claude (Bedrock) isole la cause, par exemple « l'IBAN vient d'une pièce jointe non vérifiée ».
4. **Vaccin** : une règle exécutable, pas un texte, par exemple « refuser tout paiement dont le bénéficiaire provient d'un document non signé ». Elle est validée sur deux jeux : les attaques (toutes bloquées) et 200 paiements légitimes (aucun gêné).
5. **Mémoire** : l'empreinte du vaccin est publiée dans un contrat registre sur Avalanche ; les agents abonnés récupèrent la règle ; chaque agent a un « carnet de vaccination » vérifiable publiquement.

## Use cases
| # | Use case | Visuel | Message |
|---|---|---|---|
| 1 | **Agent comptable PME** (factures fournisseurs, changement d'IBAN) | L'agent A est piégé en direct (« 4 000 € partis »), le vaccin naît en 30 s, l'agent B d'une autre entreprise bloque la même attaque sans l'avoir subie | Une PME piégée protège toutes les autres |
| 2 | **Trésorerie DAO / DeFi** sur Fuji | Carte de l'arène, agents qui passent du rouge au vert, vaccins visibles sur Snowtrace | Immunité collective vérifiable on-chain |
| 3 | **Agent qui paie des API (x402)** | Graphe de dépenses qui s'emballe puis s'aplatit après vaccin | L'économie des machines a besoin d'un système immunitaire |
| 4 | **Banque / assureur qui valide un agent** | « Passeport immunitaire » : 47 vaccins, 98 % de couverture, dernier test il y a 2 h | Preuve continue de robustesse (DORA, tests de résilience ; AI Act art. 15) |

## Reco démo
Histoire principale : use case 1 (tout le monde comprend une fausse facture). Chute business : use case 4 (passeport immunitaire vendu aux banques et assureurs). Moment fort : **l'agent B immun sans avoir été attaqué.**
