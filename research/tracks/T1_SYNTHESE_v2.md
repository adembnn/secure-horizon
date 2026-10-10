# Track 1 — synthèse v2 des 4 pistes (10 oct. 2026, soir)

> Sources : `T1_P1_aml_v2.md`, `T1_P2_antifraude_v2.md`, `T1_P3_agents_financiers_v2.md`, `T1_P4_defi_dora_v2.md` (≈ 2 050 lignes, chaque fait étiqueté vérifié / secondaire / inférence). Notes = estimations sur la grille officielle (30/20/20/15/15), jamais mesurées. Remplace `T1_SYNTHESE.md`.

## Corrections de v1 à retenir
- Avalanche **a déjà du monitoring** (Hexagate gratuit depuis déc. 2025, Hypernative). Le trou réel : L1 souveraines et ICM. Se positionner en complément.
- Bitget : pas « 228 M$ en 18 min » ; dire « de l'ordre de l'heure ».
- **FNC-RF** (fichier des IBAN suspects, Banque de France) est live depuis le 7 mai 2026 ; l'EPC prépare FRIDA ; Visa A2A Protect (sept. 2026) ajoute un score réseau. « Aucun score bénéficiaire en UE » est faux : l'angle neuf est le pré-signalement, les motifs et la vitesse.
- Agents payeurs : Ramp Agents for AP en prod depuis oct. 2025, Coinbase Agentic Wallets fév. 2026, mais **aucun vol réel documenté par facture piégée** (tests labo seulement : Forcepoint, Zscaler 4/26 modèles payent). À dire tel quel.
- EchoLeak, postmark-mcp, Hugging Face×OpenAI : pas de perte financière documentée. Ne pas les vendre comme des vols.
- Rachat BioCatch par Visa : 2,4 Md$ (3 août 2026). Marché agent-security très consolidé (Protect AI, CyberArk, Astrix, Oasis, SGNL rachetés).
- AI Act art. 12/14 : haut risque seulement ; report au 2 déc. 2027 = accord provisoire. DORA reste le bon cadre conformité.
- ERC-7265 (circuit breaker) toujours non confirmé.

## Faits nouveaux forts
- ACPR « comptes rebonds » (juil. 2025) : 661 M€ reçus par 13 établissements (+45 %), 29 j entre rappel et déclaration, 60 % des fonds repartent à l'étranger.
- FCA (23 sept. 2026) : cash-out au 2e-5e compte de la chaîne.
- France : fraude par manipulation 516 M€ (+34 %), faux conseiller 376 M€. UK : usurpation de banque en baisse.
- ESAs (3 juin 2026) : 3 383 incidents majeurs DORA en 2025, ~29 % tiers. AMF : 33 en France, >80 % prestataires, 2 chez des CASP, délais « rarement respectés ».
- Assureurs : AIG, Great American, WR Berkley demandent des exclusions IA ; avenants ISO depuis 1er janv. 2026 ; norme AIUC-1 (journaux d'exécution, délégation, approbations). **KPMG est listé certifié AIUC-1.**
- Nexus Mutual : 18,5 M$ payés depuis 2019 ; couverture DeFi < 1 % du TVL.
- Hackathon Chainlink 2026 : « mint stop sur réserve » fait 4 fois. Banal.

## Tableau comparatif

| Piste | Combo recommandé | Note | Mécanisme que personne n'a | Wow de démo | Risque principal |
|---|---|---|---|---|---|
| P1 AML | **Sablier** = triage par urgence (€ contaminés × P(mule) × survie des fonds) + réserve au prorata + contrefactuel falsifiable + benchmark d'injection par libellé | ~86 | Priorisation par **temps avant sortie des fonds** ; gel du seul montant sale ; aucun éditeur sur FNC-RF | Deux files côte à côte, mêmes analystes, compteur « € préservés » | Base légale du gel partiel non établie ; démo peu visuelle ; Tager AI antérieur sur le traçage |
| P2 Anti-fraude | **Double Regard v2 + Golden Hour + dossier PSR** | ~85 | Contexte de session payeur × bande bénéficiaire pré-signalement (motifs, TTL, contestation, export FNC-RF/FRIDA) ; chaîne de gel multi-sauts | Jauge « € encore récupérables » qui décroît seconde par seconde | Comparaison BioCatch/Visa ; le « mandat signé » ressemble au contre-appel rejeté |
| P3 Agents | **SILLAGE+ + NASSE + dossier de preuve AIUC-1** | ~90 | Provenance des données lues portée dans le jeton de délégation (aucun acteur, pas même AWS AgentCore Policy) ; grand livre fantôme et bénéficiaires-canaris à la place du kill switch | Duel live « juge LLM vs moniteur aveugle » ; l'agent piégé paie un faux grand livre et livre les mules | Piste la plus choisie ; pas d'incident réel ; équipe moyenne = journal + kill switch (~62) |
| P4 DeFi+DORA | **Sentinelle Fuji** = HoneyVault + réponse graduée + DORA Autopilot + registre de tiers vivant + scorecard de rejeu | ~87,5 | Fausse vulnérabilité = 0 FP par construction ; registre DORA alimenté par l'état on-chain (rôles, oracles, config DVN, RPC) ; pause > 2 h change elle-même la classification | L'attaquant mord sur Fuji, pause, rapport DORA sort avec preuves ancrées, rejeu auditeur | Contrat à écrire de zéro ; Hexagate/Hypernative déjà là ; aucun cas vivant de leurre défensif |

## Transversal
1. **Leurre** (NASSE, HoneyVault, comptes-canaris) = détection 30 % avec 0 FP, et inattendu.
2. **Réponse proportionnée** (prorata, R0-R4, cage fantôme, pause gradée avec expiration) = le vrai différenciateur sur 20 %.
3. **Conformité = artefact, pas phrase** : dossier PSR, DORA Autopilot, export AIUC-1 (langue de KPMG).
4. **Responsabilité** (réponse commune) : la règle déterministe signée par la direction décide, le LLM n'écrit que l'explication, l'humain valide les exceptions, le journal chaîné et ancré sur Fuji prouve tout, et tout est réversible.
5. **Blockchain crédible partout** : ancrage de hash du journal, accusés horodatés inter-acteurs, enforcer on-chain (Safe/session keys), eERC auditeur. Artificiel : données perso on-chain, rapport DORA entier on-chain, token/DAO.

## Hybrides possibles
- P3 + P4 : NASSE déclenche un incident DORA pré-rempli (meilleur de P4 sans contrat complexe).
- P2 + P1 : Golden Hour (payeur) alimente Mule Radar (bénéficiaire) et le triage Sablier.
