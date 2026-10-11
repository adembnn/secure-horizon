# BM_SYNTHESE. Le business model de Hold up

Date : 11 octobre 2026. Synthèse de `BM_MODELE.md`, `BM_MARCHE.md`, `BM_PARTENAIRES.md`, `BM_VISION.md`, avec `livrables/CHIFFRES.md` (table de référence), `PRODUCT.md` et `context/notion_guide.md`.

Statuts : **[V]** lu à la source. **[NV]** non relu à la source. **[C]** calcul, formule donnée dans le rapport source. **[H]** hypothèse, à tester. **[M]** notre mesure. **PROSPECTIF** : n'existe pas.

Ce que le règlement attend : une diapo « business model » dans le deck (8 diapos recommandées). La grille Track 1 ne note pas le modèle à part. Il compte surtout dans « Faisabilité et intégration » (20 %) : « s'intègre-t-il aux outils d'une banque, d'une fintech ou d'un protocole ? ». Donc : court au pitch, solide en questions.

## 1. La promesse

> **Cesser de donner plus que nécessaire, car on s'expose en le faisant.**

Un droit donné en trop ne coûte rien le jour où on le donne. Il coûte tout le jour où le site, la plateforme ou l'agent qui le détient est compromis. Hold up borne le droit à ce que la personne a écrit vouloir faire.

## 2. Le problème, chiffré

| Chiffre | Source | Statut |
|---|---|---|
| 83,85 M$ perdus et 106 106 victimes de drainers en 2025, chaînes EVM, borne basse (790 $ en moyenne) | ScamSniffer, publié le 3 janv. 2026 (CHIFFRES B3) | [V]. Éditeur qui vend de l'anti-phishing. Année seule, sans comparaison |
| 158 000 compromissions de portefeuilles personnels en 2025, au moins 80 000 victimes, 713 M$, toutes causes | Chainalysis, 18 déc. 2025 (BM_MARCHE §4) | [V]. **Absent de CHIFFRES** : à y ajouter avant toute diapo. Ne jamais l'additionner à ScamSniffer |
| 47,6 % [46,9 ; 48,3] des droits de dépense non nuls sont illimités sur Ethereum ; 34,2 % [33,6 ; 34,9] sur Avalanche C-Chain | Notre lecture de la chaîne (CHIFFRES B1) | [M]. Échantillon de blocs, des événements et non des personnes. Pas la majorité |
| LI.FI, 16 juil. 2024 : 11,6 M$ pris à 153 portefeuilles en approbation illimitée, rien aux approbations finies | Rapport de LI.FI (CHIFFRES B7) | [V]. Rapport de l'éditeur |

## 3. Le produit en une phrase

Avant toute demande qui déplace de la valeur ou accorde un droit, Hold up demande « Que veux-tu faire ? », compare la réponse à ce que la demande fait vraiment, retient ce qui dépasse et explique ; la personne décide.

## 4. Qui paie, et pourquoi

Le particulier utilise, il ne paie pas. Paient ceux qui portent la perte à sa place.

| Rang | Payeur | Ce qu'il achète | Pourquoi il paierait | Statut |
|---|---|---|---|---|
| 1 | Exchanges, néobanques, fintechs | **API de verdict avant retrait** : le client écrit le motif, le code compare au montant, à la destination, à l'historique ; journal daté | Ils remboursent déjà la fraude. Repère fiat : 249,6 M£ remboursés au Royaume-Uni du 1er avril 2025 au 31 mars 2026 [V]. Analogie avec la crypto : à démontrer | Non construit. À adapter du produit |
| 2 | Portefeuilles, dApps, plateformes | **Licence SDK** du module « Que veux-tu faire ? » devant leur écran de confirmation | Complète leur scanner (Core utilise Blockaid depuis juin 2024 [V]) | Même code que l'extension. Habitude de racheter plutôt que de louer (Wallet Guard, Blowfish, Pocket Universe [V]) |
| 3 | Plateformes d'agents IA qui dépensent | **Mandats** : phrase de l'humain traduite en plafonds, chaque action comparée au mandat | Prouver que l'agent est resté dans son mandat | PROSPECTIF. Rien construit |
| Levier | Assureurs, couvertures | Le journal comme pièce de sinistre et signal de souscription | Une perte bornée est plus facile à assurer [H] | Ne paie pas un logiciel. Aucun assureur contacté. Intermédiation possiblement soumise à agrément (ORIAS, non vérifié) |
| Gratuit | Particulier | Extension locale, sans compte, sans publicité, sans revente de données | Abonnement de masse trop faible (Revoke : revenus « très faibles » avant ses offres [V] ; GoPlus App 18,3 k$ au S2 2025 [V]) | Décision maintenue |

## 5. Prix et économie unitaire

**Tous les prix de vente sont des hypothèses [H].** Aucun prix de marché comparable n'a été trouvé (Blockaid, Hypernative : non publiés).

| Élément | Valeur | Statut |
|---|---|---|
| Coût d'une vérification, version autonome (navigateur, sans serveur) | 0 $ de coût marginal | [C] |
| Coût d'une vérification, version serveur (RPC Alchemy + modèle Clef-flash) | **environ 0,00013 à 0,0002 $** ; haut de toutes les hypothèses 0,00107 $ | [C] sur prix publics [V] et nombre d'appels [H] non instrumenté (facteur 2 à 3 possible) |
| Prix envisagé, API | 0,005 à 0,02 $ par vérification, avec forfait mensuel minimum. Repère : GoPlus API 199 à 3 499 $/mois [V] | [H] |
| Prix envisagé, licence | 25 à 250 k$ par an | [H] |
| Marge brute à 0,005 $ | (0,005 moins 0,0003) / 0,005 = **94 %**, coût arrondi vers le haut | [C] |
| Seuil, structure légère (environ 35 k$/an) | 0,62 M vérifications/mois à 0,005 $, ou 1 licence | [C] sur fixe [H] |
| Seuil, structure de 3 personnes (environ 290 k$/an) | 5,1 M vérifications/mois à 0,005 $ (2,5 M à 0,01 $), ou 3 licences à 100 k$ | [C] sur fixe [H] |

Formule : volume mensuel = (fixe / 12) / (prix moins 0,0003 $). Lecture : le calcul n'est jamais le problème. Le problème est le temps de vente et les fausses alertes.

## 6. L'avantage défendable, honnêtement

Aujourd'hui, pas de fossé. Une avance et une méthode.
- **Copiable vite** : le champ « Que veux-tu faire ? » (MetaMask pose déjà « What's this payment for? », mais seulement après un verdict malveillant, en choix fermés [V-code]) ; le décodage ; les règles de base ; le principe, public.
- **Plus dur à copier** : (1) la **neutralité**, une couche devant n'importe quel portefeuille, demain devant un retrait ou un agent ; (2) la **mesure publique et rejouable** (jeux scellés, sha256 publié, résultats négatifs publiés), qu'un vendeur a intérêt à éviter ; (3) le **corpus phrase écrite contre demande réelle**, faible aujourd'hui, fort si un pilote apporte des phrases réelles consenties ; (4) des **contrats B2B**, zéro aujourd'hui.
- **Issue probable du secteur** : intégration ou rachat. Le modèle doit valoir dans ce cas.

## 7. Feuille de route en trois horizons

| Horizon | Statut | Contenu |
|---|---|---|
| Aujourd'hui | **FAIT** | Extension Chrome ou Edge, autonome. Fenêtre d'intention, comparaison par code, trois verdicts, règles de base, journal local de 500 lignes. Jeu aveugle d'un autre auteur (250 cas) : rappel 87,3 % [81,1 ; 91,7], faux rouges 15,0 % [9,3 ; 23,3], seuil de 10 % **non atteint** (CHIFFRES A6). Mesure 47,6 % et 34,2 % (B1) |
| Aujourd'hui | **PROTOTYPÉ** | Relais Clef (hors version autonome) ; pipeline où la couche ne peut qu'aggraver (A15) ; révocation en un clic dans la démo web, portefeuille simulé (A18) |
| Aujourd'hui | **LIMITES** | Jamais essayé avec un vrai portefeuille. Aucune personne testée, aucun client. Contournements trouvés en revue interne, dont un critique |
| 6 mois | **PRÉVU** | Corriger les fausses alertes, nouveau jeu aveugle, audit court, Chrome Web Store, un pilote portefeuille dans l'écosystème Avalanche, 15 entretiens payeurs, maquette « motif du retrait », mandat traduit en permission ERC-7715 sur réseau de test |
| 2 ans | **PROSPECTIF** | API en production chez 2 à 4 plateformes, SDK dans 2 à 4 portefeuilles, un pilote agents, un partenaire de couverture qui lit le journal. Scénarios [H] : environ moins 97 k$ (prudent) à plus 251 k$ (central) de résultat annuel |

## 8. Plan 90 jours et trois pilotes

J0 à J30 : extension en « non répertorié » avec politique de confidentialité ; entrée à ESSEC Ventures ; dépôt Team1 Mini Grant (jusqu'à 10 000 $ [V]). J30 à J60 : ateliers avec Kryptosphère ; avis juridique écrit. J60 à J90 : publication publique ; rencontre fintech ou CASP.

| Pilote | Qui | Réussite à J90 |
|---|---|---|
| P1 Testeurs | ESSEC et deux antennes Kryptosphère, 50 testeurs, sans fonds réels | 30 actifs à J30, 500 phrases, alertes jugées injustifiées sous 10 %, 5 écarts réels signalés |
| P2 Avalanche | Team1, puis Core via Team1 | Dossier avant J30, réponse avant J90, une démo à Team1 ou Ava Labs |
| P3 Avant retrait | Une fintech ou un CASP français (réseau ESSEC) | 20 retraits publics ou anonymisés rejoués ; une lettre d'intention ou un refus motivé écrit |

Tous les seuils sont fixés par nous [H].

## 9. Vision prospective : le droit borné par l'intention

- **Permissions bornées.** MetaMask Advanced Permissions (ERC-7715) en production : plafonds, périodes, expiration [V]. Le standard ERC-7715 reste en « Draft » [V]. Partout, c'est le site qui propose la borne. Hold up partirait de la phrase de l'humain [H].
- **Agents.** FIDO Alliance : groupes sur l'authentification et les paiements d'agents, 28 avril 2026 [V]. Coinbase Agentic Wallets, 11 février 2026 [NV]. Volume qui ressemble à des agents sur x402 : 5 000 à 11 000 $ par mois selon TRM [V, source qui vend de l'analyse]. Incident Grok et Bankr, mai 2026, environ 150 000 à 200 000 $ [presse, NV]. **Besoin réel, marché minuscule aujourd'hui.**
- **Équipes.** Bybit, environ 1,5 Md$, interface détournée (CHIFFRES B13) : plusieurs signataires lisaient la même interface. Safe propose déjà des gardes (Hypernative) [V]. Manque le lien avec l'intention écrite du proposeur [H].
- **Assurance.** Précédent direct (prime liée aux droits bornés) : **non trouvé**. Cousins : Coincover, rabais cyber liés à un contrôle installé, AIUC-1 [V/NV].

## 10. Risques

| Risque | Réponse |
|---|---|
| MetaMask élargit sa question à toute demande | Validation de l'idée. Rester neutre et multi-surfaces, vendre la mesure, viser le B2B hors MetaMask, préparer l'issue « intégration » |
| Fausses alertes (15,0 % de faux rouges sur le jeu aveugle) | Limite principale. Pas de vente avant correction et nouveau jeu aveugle sous 10 % |
| Le payeur ne paie pas, cycle de 6 à 12 mois [H] | Forfait minimum, pilote borné dans le temps avec critère écrit, structure légère |
| Responsabilité en cas de faux négatif | Aucune clé, aucune signature ; « retient et explique » ; journal de ce qui a été montré ; contrat sans promesse de résultat ; RC pro |
| Conformité | Hold up ne détient ni fonds ni clés (MiCA considérant 83 exclut même les portefeuilles non dépositaires [V]). Restent à qualifier par un juriste : conseil, intermédiation d'assurance, RGPD de la phrase. Si le client est une banque, nous devenons prestataire TIC : annexe contractuelle à préparer. Aucune conformité revendiquée |

## 11. Ce qu'il faut arbitrer

1. **Décision antérieure.** « Gratuit puis partenaires, au-delà d'environ 8 000 utilisateurs » devient **« gratuit pour le particulier, pilotes B2B dès maintenant »**. Le seuil de 8 000 était un seuil de coût (quotas gratuits), pas de revenu. À reporter dans la mémoire et dans `PRODUCT.md` (section Modèle : « aucun modèle abouti n'est pitché », à changer).
2. **Pilotes payants ou non.** Le seuil de vente de BM_MODELE (faux rouges sous 10 %) n'est pas atteint. Proposition : pilotes de rejeu non payants et lettres d'intention maintenant, facturation après le nouveau jeu aveugle.
3. **API d'abord ou SDK d'abord.** Proposition : SDK pour le pilote (même code, distribution), API pour le revenu.
4. **Agents au pitch.** Une ligne « demain », jamais un marché chiffré.

## 12. Désaccords entre les rapports sources

| Sujet | Désaccord | Choix ici |
|---|---|---|
| Jeu aveugle | `PRODUCT.md` et BM_MODELE : « non passé ». CHIFFRES v3 : passé le 11 oct., 87,3 % et 15,0 % | CHIFFRES fait foi. `PRODUCT.md` est à mettre à jour |
| Coût par vérification | BM_MODELE : 0,00021 $ central (232 à 750 CU, 1 800 jetons). BM_MARCHE : 0,00013 $ (5 appels de 27 CU, 1 500 jetons) | Fourchette 0,00013 à 0,0002 $, à instrumenter (expérience 5 de `BM_DIAPO.md`) |
| Quota gratuit Alchemy | BM_MODELE : environ 83 000 vérifications/mois (8 300 utilisateurs). BM_MARCHE : environ 222 000 | Même cause que ci-dessus |
| Pocket Universe | BM_MODELE : environ 200 000 utilisateurs [NV]. BM_MARCHE : nombre non publié [V] | Ne pas citer le nombre |
| Ordre des payeurs | BM_MODELE : API exchanges d'abord. BM_VISION (scénario probable) : licence aux portefeuilles et rails d'agents d'abord | Ordre demandé : API, puis SDK, puis mandats |
| Exclusions de MetaMask Transaction Shield | BM_MARCHE : exclut le phishing et la phrase volée. BM_MODELE : exclut transactions signalées, clés compromises, pair à pair | Relire la page avant de citer ; CHIFFRES B15 retient « exclut le phishing et la phrase secrète volée » |
| 1,3 % de fausses alertes avec Clef | Utilisé par BM_MODELE au pitch. CHIFFRES V7 : en réponse seulement, « grille écrite par nous » ; 16,0 % sur le jeu aveugle | Non utilisé ici |
| MiCA | BM_MODELE : [NV]. BM_PARTENAIRES : considérant 83 lu [V] | [V], sans revendiquer de conformité |
