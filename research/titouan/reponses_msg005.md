# Claude-Titouan : réponses aux questions de fond du MSG-005 (10/10/2026, ~22h)

Remarque de méthode : Titouan veut qu'on brainstorme l'idée avant de l'accepter telle quelle. Ce document est donc volontairement critique. Les faits sont étiquetés [V] vérifié, [H] hypothèse.

## Q1. Une pause décidée par une machine est-elle acceptable pour l'exploitant ?
Oui, mais seulement si elle est présentée comme "exécution d'une décision déjà prise par des humains".
- Le marché la vend déjà : Parallel a donné le rôle de pause directement à une adresse Hypernative, sans multisig (blog Hypernative, source vendeur [V]).
- Conditions d'acceptation [H] : (1) mandat signé par l'organe de direction avant tout incident ; (2) pause bornée, à expiration automatique, bien en dessous de 2 h ; (3) mode ombre avant activation (la règle observe, on mesure les faux positifs) ; (4) réversible par humains ; (5) journal rejouable.
- Piège : une fausse pause de plus de 2 h est elle-même un critère DORA d'indisponibilité. Donc : seuls les déclencheurs déterministes sans faux positif peuvent pauser seuls ; un signal probabiliste plafonne au palier "limite de sortie".
- Piège 2 (grief) : un attaquant peut déclencher volontairement des alertes pour provoquer une pause et créer l'incident. Il faut un budget quotidien de pause automatique, au-delà duquel un humain décide.
- Humain d'astreinte : le mandat doit lister l'ordre d'escalade ; sans réponse, le système reste au palier atteint.

## Q2. Champ 2.8 et identifiant d'un oracle ou d'un opérateur RPC
Vérifié dans les instructions opérationnelles ESAs du 16/09/2026, ligne ID 9 [V] (https://www.esma.europa.eu/sites/default/files/2026-09/DORA_Incident_reporting_-_Operational_instructions.pdf) :
- Le champ 2.8 contient, séparés par ";" et dans cet ordre : (1) nom légal complet du prestataire tiers ou de l'autre entité financière, (2) son code (LEI ou EUID), (3) le type de code, (4) toute information complémentaire utile. Champ vide si l'incident ne vient pas d'un tiers.
- Le texte ne traite pas le cas "pas de LEI ni d'EUID". Ce sont des instructions "best efforts", sans valeur d'interprétation juridique.
- Décision proposée : ne jamais deviner un code. Le registre des tiers stocke nom légal + code + type saisis par un humain ; si le code manque, le champ est produit sous la forme "NOM;;;motif" avec un drapeau "à compléter par l'humain" visible dans l'interface. Un oracle décentralisé sans entité juridique est un cas à soumettre à l'autorité compétente.

## Q3. Exploitant dont les fonds ne passent par aucun contrat (cas Bitget)
Bitget : zero-day sur deux équipements tiers, outil de retrait personnalisé, sorties sur environ 3 h, 11 chaînes selon les sources, premiers signes malveillants le 31 août [V, BleepingComputer / Hacker News]. Aucun contrat à mettre en pause.
- Ce qu'on peut faire : un mode "observateur d'adresses". Les hot wallets sont publics. Une règle de vélocité multi-chaînes sur ces adresses aurait pu déclencher une action hors chaîne (arrêt des retraits côté exploitant, appel à l'émetteur de stablecoin) bien avant la fin d'une fuite étalée sur 3 h [H, à chiffrer sur un rejeu].
- Ce qu'on ne peut pas faire : empêcher la sortie sans point d'application. Il faut un point d'application indépendant du backend compromis : politique de dépense dans un compte intelligent (module de limite de dépense) ou politique MPC indépendante.
- Ce qu'on ne voit pas : les 24 jours d'intrusion dans les systèmes informatiques. Le signal on-chain n'apparaît qu'au premier retrait.
- Décision de périmètre à prendre : soit le produit cible les exploitants qui acceptent de placer un point d'application on-chain (coffre gardé), soit il propose deux modes (coffre gardé, observateur). Je recommande de nommer ce second mode dans les limites connues et de ne le construire qu'en lecture seule.

## Ce que je prends
- (B) Modèle de menace et échelle de réponse : ci-dessous et à itérer.
- (C) Revue critique de docs/architecture.md : première version dans research/titouan/challenge_archi_v0.md (faite sur la v0, à refaire après la boucle de jurés).
- (A) Moteur de classification DORA : je peux lire les RTS et écrire la spec, mais je préfère d'abord confirmer l'ordre de priorité avec Titouan.

## (B) Premiers éléments du modèle de menace
| Palier | Contournement de l'attaquant | Parade |
|---|---|---|
| L2 plafond par fenêtre | Drain lent juste sous le seuil, sur de longues heures | Budget cumulé sur plusieurs fenêtres et écart à la ligne de base ; le plafond borne le taux de perte maximal |
| L2 plafond par fenêtre | Fractionnement sur plusieurs adresses | Plafond au niveau du coffre, pas de l'adresse |
| Détection de changement de rôle | Changement légitime qui masque l'illégitime | Timelock sur les rôles ; tout changement hors timelock est un signal fort |
| L3 pause automatique | Provoquer une fausse alerte pour créer l'indisponibilité | Budget quotidien de pauses automatiques ; humain au-delà |
| Clé du bot de pause volée | Pause en boucle ou reprise forcée | Clé à pause seulement, jamais de retrait ; reprise par 2 humains sur 3 |
| Oracle ou RPC qui ment | Fausses données qui masquent l'attaque | Quorum de RPC, borne de prix dans le contrat |
| Attaque en une transaction | Aucune réaction humaine ou bot possible | Invariant dans le contrat uniquement |
| Humain endormi | Attendre l'expiration d'une pause | Plafond réarmé à l'expiration, escalade en continu |

Questions ouvertes pour Adem : quelle valeur de X % par N blocs sur le banc d'essai ? Quel est le ratio de gros retraits légitimes dans le trafic synthétique ? Qui signe le mandat dans la démo ?
