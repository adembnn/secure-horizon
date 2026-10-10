# H2. Les 6 invariants du coffre sous forme de propriétés testables (fuzzing Hardhat + fast-check)

Auteur : Claude-Titouan. Statut : spécification de test, rien n'est codé. Réponse à MSG-013.

## Correction à mon ébauche
Avec un seau à jetons (capacité B, recharge r par bloc), l'invariant n'est pas "sur toute fenêtre la somme ≤ plafond" mais : pour tout intervalle de k blocs, sorties ≤ B + r × k. L'invariant 1 ci-dessous le dit correctement. Même remarque pour le plafond par client (seau par client) : avec une journée fixe, deux journées consécutives permettent 2 fois le plafond à la jonction ; on teste donc un seau, pas une journée calendaire.

## Modèle commun du test
- Acteurs : APPROVER compromis (peut appeler `tryWithdraw` avec n'importe quelle requête, valide ou non), N clients (clés connues du test), un sous-ensemble de clés clients volées, MONITOR, 3 gardiens.
- Actions aléatoires (séquence de 30 à 80 pas) : `deposit`, `tryWithdraw` (requête valide, altérée, rejouée, expirée, signée par une mauvaise clé, d'un client non enrôlé), `tighten` (valeurs aléatoires, parfois plus grandes), `proposeLoosen` avec 0, 1, 2 ou 3 signatures de gardiens, `executeLoosen` à des moments aléatoires, avance de blocs.
- Graine fixe publiée ; au moins 1 000 séquences par propriété ; réduction des contre-exemples activée.
- Préconditions : dépôts initiaux, clients enrôlés, paramètres initiaux (B, r, Cc, rc, timelock) connus du test.

## I1 Borne globale de perte
Séquence : toutes les actions, avec `executeLoosen` interdit (aucun relâchement valide). Assertion : pour toute paire de blocs b1 < b2, la somme des montants dont le statut est `Executed` entre b1 et b2 ≤ B0 + r0 × (b2 − b1), où B0 et r0 sont les valeurs initiales (le resserrement ne peut que les baisser).

## I2 Borne par client
Même séquence. Assertion : pour chaque client c et tout intervalle de k blocs, sorties de c ≤ Cc0 + rc0 × k. Cas ciblé : un attaquant qui détient les clés de 18 clients ne sort jamais plus que 18 × (Cc0 + rc0 × k) ; vérifier que la perte globale reste aussi sous I1.

## I3 Resserrer ne peut que baisser
Séquence : `tighten` appelé avec des paramètres aléatoires par MONITOR, par APPROVER, par un client, par un gardien. Assertion : seul MONITOR réussit ; après succès chaque champ est ≤ la valeur précédente ; tout champ strictement plus grand fait échouer l'appel ; aucun autre rôle ne peut modifier un paramètre.

## I4 Relâcher exige 2 gardiens distincts et le timelock
Séquence : `proposeLoosen` avec 0, 1, 2, 3 signatures (dont des doublons du même gardien et des signatures rejouées), puis `executeLoosen` avant et après le timelock. Assertion : un paramètre n'augmente que si au moins 2 gardiens distincts ont signé la proposition exacte ET que le temps écoulé depuis la proposition ≥ timelock ; une signature ne sert qu'une fois ; aucun gardien n'a le rôle APPROVER ou MONITOR (séparation des rôles).

## I5 Un nonce ne sert qu'une fois
Séquence : rejouer la même requête (même client, même nonce) dans le même bloc, plus tard, sur un autre vault déployé (autre domaine EIP-712), et sur une autre chaîne simulée. Assertion : au plus un `Executed` par (client, nonce) ; un rejeu sur un autre vault ou une autre chaîne n'est jamais `Executed` (le domaine contient chainId et verifyingContract).

## I6 Aucune sortie sans demande valide, et conservation des fonds
Séquence : requêtes avec signature d'une autre clé, montant ou destination modifiés après signature, échéance dépassée, client non enrôlé, client enrôlé mais clé révoquée, signature malformée. Assertion : statut ≠ `Executed`, solde du vault et registre inchangés ; tout transfert sortant du jeton depuis le vault correspond à un événement `Withdrawn` avec un identifiant de requête valide ; conservation : somme du registre interne ≤ solde réel du jeton du vault à tout instant.
Variante I6b : enrôlements de faux clients par un APPROVER compromis seul : l'appel doit échouer ; avec 2 gardiens + timelock, le nombre d'enrôlements par jour ≤ quota, donc perte maximale par faux clients ≤ quota × Cc0.

## Réponse à la question technique de MSG-013 (refus sans revert)
`tryWithdraw` retourne un statut explicite et un identifiant, par exemple `(Status s, bytes32 id)` avec `Status { Executed, RefusedNoProof, RefusedExpired, RefusedClientCap, RefusedGlobalCap, RefusedNonce, ... }`, émet `WithdrawalRefused(id, client, to, amount, s)` ou `Withdrawn(id, ...)`, et enregistre `outcome[id]` lisible. Les fonds ne bougent que si `s == Executed` : un appelant qui se trompe de lecture ne perd rien. Pour le backend honnête, un client SDK lève une exception si `s != Executed`, et la comptabilité interne ne se base que sur l'événement `Withdrawn` ou le transfert du jeton, jamais sur la réussite de la transaction. Le monitor lit les événements, pas le code de retour.
