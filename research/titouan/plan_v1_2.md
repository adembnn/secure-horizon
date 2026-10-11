# Plan v1.2 en une page (Claude-Titouan, 10/10/2026 ~minuit)

Nom provisoire : Hold up. Statut : plan, rien n'est construit. Remplace plan_v1_1.md. Intègre le tour 1 de jurés (moyenne 63/100) et la décision D-004 d'Adem (le cœur est le circuit d'approbation des sorties de fonds).

## Le problème
En 2026, les plus gros vols n'ont pas cassé le code : ils ont détourné le **circuit qui approuve les sorties de fonds**. Bitget (387,5 M$, serveurs internes piégés via un équipement tiers, données de transaction falsifiées pour déclencher l'autorisation), Drift (285 M$, signataires piégés), KelpDAO (292 M$, vérificateur unique). Selon TRM, environ 76 % des pertes du premier semestre 2026 viennent de l'infrastructure, des clés et de la signature (chiffre d'éditeur). Toutes les protections font confiance au circuit qui est piraté. Ensuite le prestataire doit déclarer l'incident à l'autorité en 4 heures, à la main.

## Pour qui
Un prestataire agréé MiCA qui opère un produit on-chain (staking, épargne, token), ou un émetteur de token sur Avalanche. Il garde ses clés et son administration.

## Ce qu'on construit, en trois pièces
1. **Une limite de sortie que le circuit d'approbation ne peut pas lever.** Posée à deux endroits possibles : (a) dans le contrat ou compte qui détient les fonds (plafond par fenêtre écrit en dur, voie lente où les retraits suspects attendent quelques minutes) ; (b) chez le custodian par un callback de refus avant signature [faisabilité à confirmer par les tests d'Adem]. La machine peut seulement resserrer, jamais assouplir ni retirer.
2. **Un moniteur hors-bande qui ne croit que la chaîne.** Il calcule le budget global (y compris multi-chaînes, comme à Bitget où les sorties ont touché 7 chaînes en 3 h), repère les signaux qui survivent à un circuit menteur : part de la réserve sortie sur une fenêtre, destination jamais vue, cadence, changements de signataires ou de seuils. Il alerte l'astreinte. Watch (lecture seule) est l'entrée sans installation ; il ne bloque rien, et on le dit.
3. **Un dossier de déclaration prêt à relire en 4 heures.** Chaque champ est calculé depuis la chaîne (lien vers la transaction), saisi une fois par l'entité, ou proposé puis validé par un humain. On affiche "N champs sur M prouvés on-chain". Aucune classification pré-cochée : un responsable conformité nommé choisit, la décision est horodatée. La déclaration est la sortie de la chaîne, pas l'accroche.

## Le scénario unique
Un approbateur compromis (backend ou clé) ment sur ses transactions et vide un coffre synthétique sur Avalanche Fuji par retraits étalés, avec une variante lente. Le plafond le contient dès le 3e retrait, le moniteur alerte, le dossier sort. L'écran affiche "X € sauvés sur Y", le délai en blocs, et la comparaison avec Bitget (moins de 0,3 % des fonds gelés en environ un jour, sources divergentes). Un clic sur un champ du dossier ouvre la transaction sur l'explorateur Fuji.

## Comment on prouve que la détection vaut quelque chose
Hash des règles scellé sur Fuji avant l'écriture des attaques ; une partie des attaques écrite en aveugle ; gros retraits légitimes dans le trafic ; au moins trois variantes difficiles (drain lent, fractionnement, changement de rôle légitime) ; tableau publié avec détection par attaque, faux positifs pour 10 000 transactions, délai en blocs, fonds sauvés, ratés.

## Comment on résiste aux attaques contre l'outil
Plafonds absolus en dur indépendants de toute ligne de base apprise ; ligne de base figée et signée avec dérive maximale ; budget de resserrages épuisé sans jamais retirer le plafond dur ; pause automatique seulement sur invariant sans dépendance externe, expiration dure à 30 minutes ; clé du bot qui ne peut que resserrer, ancrage signé par une autre clé, clés de démo jetables ; callback custodian fermé en cas de panne avec issue humaine.

## Qui décide quoi
Règles et durées maximales : organe de direction, mandat daté. Qualification d'un incident précis : responsable conformité nommé. Dépôt à l'autorité : humain, jamais automatique. Astreinte : ordre d'escalade dans le mandat ; sans réponse, le système reste au palier atteint.

## Où est l'IA
Optionnelle. Elle explique (résumé pour l'astreinte, preuve citée) et enquête en lecture seule après l'alerte (chronologie, propositions de champs de jugement). Elle ne détecte pas et ne décide de rien. L'outil marche sans elle.

## Ce qu'on affirme et ce qu'on n'affirme pas
Affirmé : le plafond est appliqué par la chaîne ; le dossier est rejouable ; les règles ont été scellées avant les tests. Non affirmé : "zéro faux positif", "conforme DORA", "le rapport s'écrit tout seul", "personne ne pose de limite de sortie" (on dit : des briques existent, Safe Allowance, Zodiac, ERC-7265, verrous d'exchanges ; nous n'avons pas trouvé de produit qui les assemble avec une surveillance hors-bande et un dossier prouvé). Limites écrites : Watch ne bloque rien ; une attaque en une seule transaction ne se bloque que par l'invariant du contrat ; sans point d'application on-chain ni callback, le client n'est protégé qu'en lecture ; l'intrusion informatique en amont est invisible sur la chaîne ; une limite trop serrée peut étrangler un vrai mouvement de panique de clients.

## Priorités
P0 : plafond en dur + voie lente, 4 à 5 signaux de type "stock / destination / cadence / configuration", mode ombre, journal et ancrage, dossier initial (champs 1.x et 2.x), banc d'essai avec évasions et pré-enregistrement, scénario unique sur Fuji. P1 : Watch lecture seule, mandat signé on-chain, astreinte, dossier intermédiaire (3.x), texte IA optionnel, leurre bonus. P2 : paquet de gel en document, second scénario, budget global sur 2 chaînes locales. Coupé : traceur multi-sauts, pont simulé, webhooks SIEM, vitrine React.

## Ce qui reste ouvert
Nouvelle deadline ; callback custodian réellement possible ou pas ; qui joue le responsable conformité ; relecture du Journal officiel ; règle de comptage des clients ; source de prix pour l'euro.
