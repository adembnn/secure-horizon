# O0. Coller la barrière d'intention à la grille Track 1 (Claude-Titouan, 11/10/2026)

Source de la grille : context/notion_guide.md, Track 1 (lu à l'instant). Statut : analyse, rien n'est figé. Consigne de Titouan : rester collé aux critères du track, aux jurés et aux conseils.

## 1. Ce que la track demande, mot pour mot en substance
- Pistes : 2 (SOC anti-fraude, réponse graduée : authentification renforcée, mise en attente, gel, alerte client) et 4 (DeFi + DORA). La barrière d'intention est une piste 2 côté particulier.
- Livrables : PoC de bout en bout, de la détection à la RÉPONSE, sur UN scénario ; playbook (qui est alerté, ce qui est automatique, ce qui reste humain, comment c'est documenté) ; slide conformité (comment un auditeur vérifie les décisions).
- Conseils : un seul scénario traité parfaitement ; des chiffres même synthétiques ; « si votre modèle se trompe, qui est responsable ? ».
- Grille : Détection 30, Réponse 20, Faisabilité et intégration 20 (s'intègre-t-il aux outils d'une banque, d'une fintech ou d'un protocole), Conformité et explicabilité 15, Pitch 15.

## 2. Le risque de D-007 face à la grille
D-007 abandonne comme cœur la réponse après coup, le dossier de gel (bonus) et les institutions/DORA (une slide). Or Réponse (20) + Conformité (15) = 35 points, et « s'intègre à une banque/fintech/protocole » pèse dans la faisabilité. Un Snap MetaMask s'intègre à un portefeuille, pas à une banque. Si on ne répond pas, on joue 65 points sur 100. À corriger sans changer la direction.

## 3. Mapping proposé (à discuter)
| Critère | Ce que le produit doit montrer | Preuve concrète |
|---|---|---|
| Détection 30 | Banc de test chiffré : attaques inédites + trafic légitime, avec trois références (liste noire, simulation classique sans intention, notre barrière). Métriques : précision, taux de faux positifs, temps d'alerte. | Tableau sur jeu synthétique ou rejoué, annoncé comme petit. Le drainer neuf non listé est un cas du banc, pas toute la preuve. |
| Réponse 20 | Réponse GRADUÉE et proportionnée, pas juste un pop-up : info, avertissement, friction (attente + retaper l'intention), alerte d'un proche de confiance, proposition de révocation, dossier de preuve pour plainte/gel (N4 : on prépare, on ne promet pas). | Playbook d'une page : qui est alerté, automatique vs humain, comment c'est documenté. |
| Faisabilité et intégration 20 | PoC bout en bout sur UN scénario. Intégration : Snap pour portefeuille ET même moteur en API de contrôle avant retrait pour exchange/fintech (« j'envoie vers mon compte Coinbase » existe déjà côté retrait). | Appel API documenté + Snap. C'est le pont vers « banque/fintech ». |
| Conformité 15 | Journal de chaque verdict : intention, effet simulé, règle ou modèle déclenché, version, confiance, décision de l'utilisateur. Réponse à « si le modèle se trompe, qui est responsable ? » : le système est consultatif, l'utilisateur reste signataire, tout dépassement est journalisé, double passe + seuil de confiance → humain. NIST CSF 2.0 (Protect/Detect/Respond), ATT&CK/D3FEND, AI Act (transparence), DORA/MiCA une slide pour les prestataires clients. | Slide conformité + exemple de ligne de journal vérifiable. |
| Pitch 15 | Un scénario, des chiffres, une phrase de problème, le défenseur aidé. | (supports non produits ici, sur consigne.) |

## 4. Points d'attention honnêtes
- « Barrière d'intention » seule se fait traiter de pop-up. Elle monte la note si elle est (a) mesurée contre des références, (b) suivie d'une réponse graduée, (c) auditable.
- Le scénario « on m'a demandé de le faire » doit être un signal à part entière (l'escroc dicte l'intention).
- Ne pas promettre le blocage sur MetaMask stable : à vérifier (O1) ce que le Snap peut faire hors Flask.
- Garder les trois arnaques d'Adem comme trois cas d'UN scénario de bout en bout, plutôt que trois démos.
