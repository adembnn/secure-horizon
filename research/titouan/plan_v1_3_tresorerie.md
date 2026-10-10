# Plan v1.3 en une page : cible trésorerie on-chain / fonds tokenisé (Claude-Titouan)

Statut : plan, pour validation. Remplace plan_v1_2.md. Cible proposée par moi (revue de cap et jury aveugle d'Adem), en attente de la validation explicite de Titouan.

## Le problème
Les gros vols de 2026 détournent le circuit qui approuve les sorties de fonds (Bitget, Drift, KelpDAO), pas le code. Toutes les protections font confiance à ce circuit. Ensuite il faut déclarer l'incident en 4 heures, à la main.

## Pour qui
Le responsable trésorerie ou sécurité d'un **émetteur de fonds tokenisé** ou d'une **trésorerie on-chain** sur Avalanche (protocole, DAO, prestataire qui opère un produit on-chain). Leurs fonds sont vraiment dans un contrat ou un Safe. Ce n'est pas un exchange avec des hot wallets multi-chaînes.

## Ce qu'on construit (4 modules)
1. **Coffre à deux gardes** : plafond à seau écrit dans le contrat qui détient les fonds, et une **demande signée** pour chaque sortie (rachat signé par l'investisseur, ou ordre de paiement signé par les officiers de trésorerie). L'approbateur et le moniteur ne peuvent que **resserrer**. Relâcher : deux niveaux, petit relâchement (≤ 2×) par 2 gardiens sur 3 avec timelock court, grand relâchement avec timelock long.
2. **Moniteur** : 3 signaux (sortie sans demande valide, part de l'encours sortie sur une fenêtre, destination jamais vue), plus un rejeu en lecture seule du vol Bitget sur Avalanche pour la mesure de détection.
3. **Dossier de déclaration** (notification initiale 1.x et 2.x) : critères évalués et affichés, champs reliés à leur transaction, un responsable conformité nommé qui classe, deuxième signature pour "non majeur". Vendable seul, sans migrer un euro.
4. **Ancre de hash** du dossier et des règles, scellées avant les attaques de test.

## Démo unique et chiffrée
Un approbateur piraté tente, sur un coffre synthétique Fuji : (1) de retirer sans demande, (2) d'inscrire une fausse clé, (3) de fractionner sous le plafond. Les trois échouent ou sont bornés, avec les chiffres (perte maximale, fonds sauvés, faux positifs sur trafic légitime) et le dossier de déclaration. Bitget sert de preuve de détection, pas de cible.

## Enrôlement des clés qu'un backend piraté ne peut pas casser
- Pour un fonds tokenisé, la liste des investisseurs existe déjà (registre de l'émetteur ou de l'agent de transfert, par exemple ERC-3643) : on la **réutilise** au lieu de créer une nouvelle racine de confiance.
- Aucune fonction du registre n'est appelable par l'approbateur.
- Toute inscription exige 2 gardiens sur 3 (clés matérielles hors du backend, signature EIP-712 affichée en clair) + timelock + quota quotidien ; chaque proposition déclenche une alerte et peut être annulée par le client.
- Perte maximale due à de faux clients = quota × plafond par client, affichée.
- Limite à dire : si deux gardiens sont piégés (Drift), la protection tombe ; on ajoute le timelock et l'alerte, pas une garantie absolue.

## Ce qu'on n'affirme pas
"Zéro faux positif", "conforme DORA", "aurait arrêté Bitget", "personne ne fait ça". Limites écrites : le plafond protège ce qui est dans le coffre ; une interface qui fait signer une mauvaise adresse n'est pas couverte ; Watch ne bloque rien.

## Priorités
P0 : coffre (plafond, demande signée, enrôlement 2/3 + timelock), simulateur et 3 attaques, moniteur à 3 signaux, ancre, dossier initial, rejeu Bitget. P1 : voie lente, mandat complet, texte IA. Coupé : paliers multiples, détecteurs D3 à D9, traceur, passkey, multi-chaînes.
