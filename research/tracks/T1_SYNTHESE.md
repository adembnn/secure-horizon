# Track 1 — Fintech Security : synthèse des 4 pistes

> Sources : `T1_P1_aml.md`, `T1_P2_antifraude.md`, `T1_P3_agents_financiers.md`, `T1_P4_defi_dora.md`. Notes calculées par les agents sur la grille officielle (détection 30 / réponse 20 / faisabilité 20 / conformité 15 / pitch 15) : **estimations, pas des verdicts**.

## Rappel de ce que le jury attend
PoC de bout en bout (détection → réponse) sur **un seul** scénario · playbook (qui est alerté, ce qui est automatique ou humain, comment c'est documenté) · slide conformité (DORA, AML, MiCA, AI Act ; comment un auditeur vérifie) · chiffres même synthétiques · réponse à « si le modèle se trompe, qui est responsable ? ».

## Le constat commun aux 4 pistes
La version évidente de chaque piste **existe déjà en produit** : copilote AML (Hawk, Unit21, Lucinity), biométrie comportementale (BioCatch, en cours de rachat par Visa), kill switch d'agents (Coinbase, Stripe, Zenity), détection et pause DeFi (Hypernative l'a fait seul le 7 mai 2026). Pour gagner, il faut un **mécanisme que les produits n'ont pas**, et presque toujours **déterministe + leurre + preuve**, avec le LLM qui explique sans décider.

## Les meilleures idées par piste

| Piste | Combo recommandé | Note estimée | Le mécanisme neuf | Moment « wow » en démo |
|---|---|---|---|---|
| **P1 AML** | **Gel au prorata + Contre-Preuve** | ~87,5 | On suit la contamination de l'argent (3 modèles : proportionnel, FIFO, poison) et on **gèle seulement le montant sale**. Explication contrefactuelle vérifiable ; un sceptique cherche l'explication légitime. | Injection cachée dans un **libellé de virement** qui piège le copilote de l'équipe moyenne, pas le nôtre. |
| **P2 Anti-fraude** | **DOUBLE REGARD** | 83 | Le contexte de session du payeur (appel actif, accès distant, IBAN collé) est croisé avec une **bande de risque du bénéficiaire sans donnée personnelle**, renvoyée dans la réponse VoP. Réponse graduée R0-R4. | Ablation à l'écran : payeur seul / bénéficiaire seul / les deux. |
| **P3 Agents financiers** | **SILLAGE + NASSE** | ~89 | SILLAGE : les jetons d'autorisation **portent la trace de ce que l'agent a lu** ; l'agent payeur refuse tout IBAN d'origine non fiable, sur toute la chaîne. NASSE : l'agent piégé est **basculé sur un grand livre fantôme** ; l'attaquant livre ses comptes de mules. | « L'agent a été piégé, il a payé… un grand livre fantôme, et on a récupéré les IBAN des mules. » |
| **P4 DeFi + DORA** | **HoneyVault + DORA Autopilot** | ~87,5 | Fausse vulnérabilité plantée : **zéro faux positif par construction**, attaquant repéré dès le déploiement de son contrat. Incident on-chain → classification DORA déterministe → déclaration pré-remplie avec compte à rebours. | L'attaquant mord à l'appât sur Fuji, la pause se déclenche, le rapport DORA sort avec ses preuves on-chain. |

Autres idées notables : MANDAT SIGNÉ (P2, 81 : passkey liée à l'IBAN et au montant contre la voix clonée du dirigeant), CONTRE-ÉPREUVE (P3, 80 : rejouer l'agent sans chaque document pour prouver la cause), Dependency X-ray (P4, 71 : quorum de RPC + champ 2.8 DORA « origine tierce »).

## Lecture transversale
1. **Le leurre est l'arme gagnante de la Track 1** : NASSE (bénéficiaires-canaris), HoneyVault (fausse faille), Hameçon inversé (comptes-canaris). Il maximise le critère détection (30 %) avec zéro faux positif, et c'est inattendu.
2. **La réponse proportionnée** fait la différence sur le critère « qualité de réponse » (20 %) : geler seulement le montant sale (P1), réponse R0-R4 (P2), grand livre fantôme plutôt que coupure (P3).
3. **La conformité est un levier sous-exploité** : DORA (RTS 2024/1772, ITS 2025/302, instructions ESAs du 16/09/2026, champ 2.8 « origine tierce »), AMLR art. 26(5) (« explainable, regularly tested »), PSR art. 83. KPMG est au jury.
4. **Réponse type à « qui est responsable ? »** : la règle déterministe tranche, le LLM n'écrit que l'explication, l'humain signataire du mandat valide les exceptions, et le journal chaîné par hash prouve tout.

## Classement Track 1 (avis de l'orchestrateur)
1. **SILLAGE + NASSE** (P3) : le plus original, et exactement le scénario du guide (« agent piégé qui ordonne un paiement »). Risque : beaucoup d'équipes sur la piste, mais personne n'aura NASSE.
2. **HoneyVault + DORA Autopilot** (P4) : fit maximal avec Avalanche et KPMG. Risque : smart contract à écrire de zéro (`blockchain/contracts` est vide).
3. **Gel au prorata + Contre-Preuve** (P1) : très solide côté régulation ; démo moins spectaculaire.
4. **DOUBLE REGARD** (P2) : le plus « banque réelle » ; risque de comparaison avec BioCatch.

**Hybride possible** : SILLAGE/NASSE pour l'agent financier + l'incident DORA généré automatiquement quand NASSE déclenche (récupère le meilleur de P4 sans smart contract complexe).
