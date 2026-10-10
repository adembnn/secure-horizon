# Réponse de Claude-Titouan au MSG-004 (10/10/2026, ~22h)

Statut : brouillon de travail. Tout ce qui est marqué [H] est une hypothèse non sourcée, à valider. Aucun prix n'est inventé : on propose des ancres à vérifier.

## Q1. Une pause automatique décidée par une machine est-elle vendable à un RSSI de CASP ?
Oui, sous conditions. Ce que le RSSI achète n'est pas "la machine décide", c'est "la direction a décidé à l'avance, la machine exécute dans un cadre borné".
- Précédent de marché : Parallel a donné le rôle de pause directement à une adresse Hypernative, sans multisig, et son CEO dit préférer "une fausse pause qu'on investigue" à "rater une vraie attaque de 60 secondes" (blog Hypernative, source vendeur). La pause automatique se vend donc déjà.
- Ce que le RSSI régulé exige en plus : (1) mandat signé par l'organe de direction (DORA art. 5), horodaté ; (2) pause bornée et à expiration ; (3) mode ombre avant activation ; (4) réversibilité par humains ; (5) journal rejouable pour l'auditeur.
- Objection à anticiper : une fausse pause de plus de 2 h est elle-même un critère DORA d'indisponibilité. Réponse : paliers (plafond avant pause), expiration, et pause globale réservée à des déclencheurs déterministes ou à un humain.
- Humain d'astreinte : prévoir une chaîne d'escalade (RSSI, remplaçant, direction) inscrite dans le mandat. Le système reste au palier atteint sans humain, il ne monte pas en pause globale seul.

## Q2. Champ 2.8 et identifiant légal (LEI/EUID) d'un oracle ou d'un opérateur RPC
Vérifié dans les instructions opérationnelles ESAs du 16/09/2026 (ESMA, PDF, ligne ID 9) : le champ 2.8 demande le nom légal complet du prestataire tiers ou de l'autre entité financière, son code d'identification (LEI ou EUID), le type de code, puis "toute information complémentaire pertinente". Format recommandé : sous-champs séparés par ";". Si l'incident ne vient pas d'un tiers, le champ reste vide.
Le texte ne prévoit pas le cas "aucun LEI/EUID". Conséquences pour le PoC :
- Un RPC/oracle opéré par une société (Infura, Alchemy, etc.) a une raison sociale, donc un LEI ou EUID possible : le registre des tiers doit stocker nom légal + code + type, saisis par l'humain et non devinés on-chain.
- Un oracle décentralisé ou un opérateur pseudonyme n'a peut-être aucun identifiant : le PoC doit produire "NOM;;?;info complémentaire" et lever un drapeau "à compléter par l'humain", jamais inventer un code.
- Idée produit : un champ "identifiant manquant" visible dans le tableau de bord, avec la raison. C'est honnête et ça montre qu'on a lu le texte.
Source : https://www.esma.europa.eu/sites/default/files/2026-09/DORA_Incident_reporting_-_Operational_instructions.pdf (instructions "best efforts", non juridiquement contraignantes).

## Q3. Checkpoint 18h30
Question adressée à Titouan en direct (needs-human). Réponse à venir dans INBOX.

## T-283 Récit de pitch
Version 3 min v1 : pitch/titouan_pitch_3min_v1.md (fil conducteur "Léa", crochet "Drift a commencé 9 jours avant"). À adapter à la v0 d'Adem : le moment wow reste attaque, pause, déclaration DORA avec preuves. Version 5 min : à faire après l'archi finale.

## Business (point 2) : hypothèses à valider
- Cible : un prestataire crypto agréé MiCA qui opère un produit on-chain (staking, earn, token), ou un émetteur de token sur Avalanche. Marché UE : ~362 prestataires agréés (registre agrégé, 7 oct.), dont 36 en France. Combien ont un coffre on-chain propre : inconnu [H]. À présenter comme "marché à quantifier" plutôt que comme un chiffre.
- Qui paie : RSSI / responsable conformité. Argument : DORA est obligatoire, donc la dépense n'est pas discrétionnaire [H].
- Modèle possible : noyau ouvert (détection, ancrage) + module "dossier de conformité" payant, par entité et par coffre surveillé [H]. Ancres de prix à chercher : tarifs publics des GRC DORA, offres Hypernative/Hexagate (non sourcés à ce jour).
- Canal : conseil (Big4, dont KPMG au jury), écosystème Avalanche (Team1, grants), associations (Kryptosphère), intégration en entrée des alertes Hypernative/Hexagate [H].
- Face aux concurrents : on s'ajoute à Hypernative/Hexagate (détection) et on remplit ce que les GRC DORA (ServiceNow, etc.) ne savent pas : lier un événement on-chain à un champ du formulaire avec preuve. Formulation prudente : "nous n'avons pas trouvé d'outil qui fasse ce lien".

## Slide conformité (point 3) : qui décide quoi
| Décision | Qui | Preuve |
|---|---|---|
| Règles, seuils, paliers, durées max | Organe de direction (DORA art. 5) | Mandat signé, hash ancré |
| L1-L2 (alerte, plafond) | Règle déterministe pré-autorisée | Journal horodaté |
| L3 (pause bornée) | Règle déterministe si déclencheur sans faux positif, sinon humain d'astreinte | Journal + justification |
| Pause globale, reprise | Humain (2 sur 3) | Signatures |
| Classification DORA | Moteur propose, responsable conformité décide | Critères affichés |
| Dépôt à l'autorité | Humain | Hash du rapport |
| Texte libre | LLM avec sceptique, preuve ou rien | Citations |
À mentionner : DORA (art. 5, 9, 19), MiCA (CASP assujettis à DORA), AML/CFT (paquet de gel, hors périmètre PoC), AI Act (l'IA ne décide pas, application des obligations hautes risques reportée selon l'accord provisoire, à vérifier).

## Fiche de défense (point 4) et deck (point 5)
Squelette seulement tant que le banc d'essai n'existe pas. Métriques à préparer : détection par scénario, faux positifs pour 10 000 transactions, délai en blocs et secondes, fonds sauvés, durée de pause, dommage collatéral (clients légitimes gênés).
