# Q. Boucle d'auto-amélioration avec juges et tests réels (proposition Claude-Titouan, 11/10/2026)

Statut : proposition de conception, à fusionner avec les consignes d'Adem dès qu'elles arrivent. Consigne de Titouan : creuser, challenger, boucle qui s'améliore seule, juges, tests concrets réels, pas de hardcoding.

## 1. Principe
Une boucle fermée : des agents ATTAQUANTS inventent des cas, le produit rend un verdict, un HARNAIS (code, pas un agent) calcule les métriques, des agents JUGES critiquent, un agent AMÉLIORATEUR propose un changement de règles, et le changement n'est accepté que s'il améliore les métriques sur des données qu'il n'a jamais vues.
Règle d'or : la note vient de mesures exécutées, jamais de l'avis d'un agent. Les juges servent à trouver des défauts et à choisir quoi mesurer, pas à noter à la place du banc.

## 2. Rôles
| Rôle | Fait | Interdit |
|---|---|---|
| Attaquant (red team) | Génère de NOUVELLES attaques sur fork (nouveaux drainers, permits, adresses sosies, faux messages, interfaces trompeuses, appel délégué) sans connaître les règles | Voir le code des règles ; réutiliser un cas existant |
| Générateur de légitime | Rejoue du trafic réel en lecture seule (transactions publiques de Fuji/Avalanche C-Chain, swaps sur routeurs connus, dépôts exchange) + cas durs écrits à la main | Fabriquer un légitime « facile » |
| Harnais | Rejoue chaque cas sur le fork, appelle le produit, calcule précision, rappel, FP critical, fatigue, latence, intervalles de Wilson ; écrit le résultat en JSON signé par hash | Être modifié par l'améliorateur |
| Juges (5) | Technique crypto, produit/UX, conformité, investisseur, « c'est juste un pop-up » : lisent résultats + journal, listent les 3 pires défauts et les cas manquants | Donner une note sans pointer un cas mesuré |
| Améliorateur | Propose UN changement (règle, seuil, prompt, schéma) avec hypothèse | Toucher au jeu de test gelé ; coder un cas précis (hardcoding) |
| Gardien | Rejette tout changement qui contient des adresses, hash ou chaînes copiés du jeu de test ; relance le jeu gelé | — |

## 3. Anti-hardcoding et anti-circularité (le cœur)
1. Trois jeux : DEV (l'améliorateur le voit), VALIDATION (il ne voit que les agrégats), TEST GELÉ (hash publié avant le début, jamais visible, ouvert une fois par palier).
2. Famille d'attaque tenue à l'écart : on retire toute une famille (ex. Permit2 batch) du DEV et on mesure le rappel dessus ; ça mesure la généralisation.
3. Les règles sont des fonctions de l'EFFET décodé (droits, destinataires, signaux transverses), jamais d'adresses ni de hash connus. Le Gardien cherche statiquement les constantes suspectes.
4. Les attaquants tournent sur un modèle DIFFÉRENT de celui du classifieur ; les messages synthétiques partent de vrais témoignages (O2), relus par un humain pour un échantillon.
5. Un changement est accepté si : précision/rappel en hausse sur VALIDATION, FP critical non dégradé, latence dans la limite, et aucune régression sur le jeu de non-régression (anciens cas déjà résolus).
6. On publie aussi les échecs, avec n et la borne : 0 FP sur n cas donne une borne ~3/n (3 000 cas pour affirmer moins de 0,1 %).

## 4. Tours de boucle (durée indicative)
1. Attaquants produisent N nouveaux cas (étiquetés par construction : on sait ce que la victime croyait faire).
2. Harnais rejoue tout, sort le tableau (par famille, par bras : sans intention / intention honnête / intention mensongère / sans filet).
3. Juges lisent le tableau et les échecs, écrivent les défauts et les cas manquants.
4. Améliorateur propose un changement ; Gardien vérifie ; harnais rejoue DEV+VALIDATION.
5. Accept/reject, journal du tour (hash, métriques, décision). Retour à 1.
Arrêt : métriques stables sur deux tours, ou budget épuisé, ou jeu gelé ouvert pour le palier.

## 5. Ce que la boucle mesure (colonnes du tableau)
Rappel par famille (permit, Permit2, approve, setApprovalForAll, 7702, appel délégué, adresse sosie, faux support), FP critical et warn sur légitime, latence p50/p95, accord entre double passe du classifieur, taux de bascule vers l'utilisateur (fatigue), coût par vérification. Ligne spéciale : apport de l'intention (écart entre les bras).

## 6. Risques et garde-fous
- Les juges LLM se flattent : tout jugement sans cas mesuré est écarté.
- Fuite du jeu gelé via les agents : le jeu gelé reste hors de leur dossier de travail, accès par le harnais seul.
- Surapprentissage au fork : inclure des cas où le contrat détecte le fork et des cas rejoués sur blocs différents.
- Coût et rythme : limiter les appels Workers AI (quota gratuit ~7 000 requêtes/jour sur flash), mise en cache des verdicts de classifieur par entrée.
- Cette boucle EST aussi une preuve pour le jury (Détection 30, Faisabilité 20, Conformité 15) : journal signé de chaque tour, rejouable par un auditeur.

## 7. À aligner avec Adem
Format des cas (Intent + Effects + étiquette de vérité terrain), où vit le jeu gelé, qui lance le harnais (workers Bedrock ?), et quel seuil déclenche l'ouverture du jeu gelé.
