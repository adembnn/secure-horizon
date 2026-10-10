# Revue de cap n°1 (10 oct. 2026, ~23h) : contradicteur, Sentinelle Fuji

Statut : avis de contradicteur sur la DIRECTION, pas sur le détail. Lu : INTEGRATION.md, DECISIONS.md, architecture.md (v2, 648 lignes), data.json, fin d'INBOX, plan_v1_1, G_demo_plan_v2, H_ebauche_archi, 5 fichiers T1_P4, SYNTHESE de la boucle. Non commité. Légende : [V] vérifié par moi dans un fichier du dépôt ou une source web ; [R] repris des recherches de l'équipe, non revérifié ; [ÀV] à vérifier.

## TL;DR

1. **Verdict : CAP À CORRIGER.** Le noyau est bon (D-004 : limite de sortie hors de portée du circuit d'approbation piraté, rejeu réel de Bitget sur Avalanche, honnêteté). Il devient DANGEREUX si `docs/architecture.md` v2 sert de cahier de build.
2. Il reste ~9 h avant le gel démo (08h00), zéro ligne de produit, aucune tâche T-1xx [V : SYNTHESE §6, CLAUDE.md « TODO »]. Le risque n°1 est de ne rien montrer, pas de montrer faux.
3. L'acheteur n'est pas tranché : la démo (coffres jumeaux, fonds dans NOTRE contrat) suppose la migration que 5 jurés sur 7 ont jugée irréaliste. Aucun appel client, aucun prix.
4. Innovation honnête mais modeste : 3 contradicteurs sur 3 réfutent chaque brique ; reste un assemblage (plafond non relevable + preuve de demande + dossier DORA lié aux transactions) [V : nouveauté_verdict].
5. Phrase de valeur proposée en fin de fichier ; plus gros risque de crédibilité = « qui met ses fonds dans votre contrat ? ».

## 1. Les quatre jurés

### 1.1 RSSI d'un CASP agréé MiCA en France

(a) Douleur. Réelle mais indirecte. Les trois grands vols de 2026 (Bitget 387,5 M$, Drift 285 M$, KelpDAO 292 M$) sont des détournements du circuit d'approbation [R : douleur_classement, sources presse]. Mais aucun hack d'un CASP agréé MiCA n'est public, et « aucun coût ni sanction DORA chiffré » [V : douleur_classement §C4]. Le RSSI vit aujourd'hui une douleur de déclaration (ACPR : délais « rarement respectés », erreurs de classification [R, via Forvis Mazars]) et une pression de supervision (exercice ESMA sur la garde, S2 2026-S1 2027 [R, source secondaire William Fry]). La douleur « vol par backend piraté » est une queue de distribution, pas son quotidien.

(b) Vendable. Non en l'état.
- Son hot wallet est MPC/HSM chez Fireblocks, BitGo ou Copper, pas un contrat. Notre plafond n'y vit pas [V : deploiement_reglementaire §1.2, rejeu : Bitget = EOA/hubs].
- Le coffre de H « détient les fonds » : c'est la migration de trésorerie. Elle contredit la sortie « Watch, rien à migrer ».
- La preuve de demande client exige d'enrôler les clés/passkeys de ses clients dans NOTRE registre : refonte de son parcours de retrait. Hors de portée d'un cycle d'achat.
- Un veto dans le chemin de signature fait de nous un prestataire TIC probablement « critique » (DORA art. 30(3) : audit, plan de sortie, TLPT) [R]. Achat de 6 à 12 mois, pas d'un week-end.
- Ce qu'il achèterait aujourd'hui : un surveillant hors bande sur ses adresses + un dossier de déclaration relisible. Mais l'alerte seule existe gratuitement (Hexagate gratuit pour les builders Avalanche, déc. 2025 [V : crowdfundinsider.com/2025/12/256553]).

(c) Crédible. Le rejeu est sérieux et marqué « preuve d'existence » [V]. Mais : 90 % du solde du wallet part dans la première transaction ; la jambe Avalanche = 16,8 M$ sur 387,5 M$ (~4,3 %) ; 1 incident, 1 wallet avec ligne de base [V : rejeu §3, §6]. Dire « R1 aurait protégé Bitget » serait faux ; la valeur réelle est « 11 M$ restaient sur les wallets frères, 8,2 M$ partis 98 min plus tard », et cela exige une capacité d'action sur ces wallets que nous n'avons pas.

(d) Innovant ? Pour lui : « plafond que mes signataires ne peuvent pas lever » est parlant ; Hypernative Safe Shield bloque déjà selon des politiques (limites de montant, contreparties approuvées) [V : help.safe.global 7610775969].

(e) Dérive vue de chez lui : trop de pièces pour un outil qu'il doit faire auditer.

### 1.2 Associé KPMG, membre du jury

(a) Douleur DORA : réelle (3 383 incidents majeurs UE en 2025 selon les ESAs [R], 33 en France, >80 % via prestataires selon l'AMF [R]), mais non monétisée : il le sait et le dira.

(b) Il évalue la conformité (15 %) : points forts = humain décisionnaire, « ni conforme DORA ni certifié », horloges déclenchées par un humain, limites écrites. Points faibles : « N champs sur M prouvés on-chain » risque d'être 6 à 8 champs sur ~40 [V : H §4.5] ; la majorité d'une notification initiale (entité, LEI, contacts, description) n'est pas on-chain. Il dira : « bien, mais c'est un joli formulaire ». Le scénario doit atteindre « majeur » (RTS 2024/1772) avec des chiffres synthétiques assumés [V : MSG-011].

(c) Textes juridiques recoupés mécaniquement, non relus par un juriste [V : SYNTHESE §4]. Acceptable si dit.

(d) Face à ServiceNow DRIR, Incident Oracle, QENEX : classification et brouillon existent déjà ; seul le lien champ-transaction est neuf, « à notre connaissance » [V : nouveauté_verdict N3].

(e) Il sanctionnera la complexité (ladder L0-L3, 9 détecteurs, AML, RGPD, RFC 3161) : il ne la verra pas en 3 minutes.

### 1.3 Dev relations Avalanche

(a) L'attaque Bitget a une jambe C-Chain réelle, lue sur la chaîne : bon récit (821 012 AVAX puis 8,2 M USDC, bloc 96072657) [V : rejeu §1.1, crédibilité forte]. Il aime.

(b) Segment qui l'intéresse : émetteurs de fonds tokenisés et trésoreries de protocoles sur Avalanche [ÀV : l'orientation institutionnelle d'Avalanche n'a pas été vérifiée par moi]. C'est le segment où un « sas plafonné » est réaliste, pas le hot wallet omnibus d'un CEX.

(c) L'architecture écrit « rien n'est propre à Avalanche » (§16). Honnête, mais perd le point « usage avancé ». Aubaine ignorée : le précompile P-256 (ACP-204, actif sur Fuji, testé) [V : preuve_demande_client §2.2], relégué en feuille de route.

(d) Il sait que Hexagate est gratuit pour ses builders : la surveillance seule ne l'excite pas.

(e) Il voudra une adresse Fuji, des transactions cliquables sur Snowtrace dès l'heure H+1.

### 1.4 Investisseur early-stage fintech/cyber

(a) Douleur : événements rares et gigantesques ; ~360 CASP UE (36 FR confirmés) [R] ; pas de coût de la douleur.

(b) Qui paie, combien : non répondu. Slide 7 prévoit « prix non validé » [V : architecture §18] ; « 2 à 3 appels avant 10h » est un plan, pas un fait. Concurrents capitalisés : Hypernative a levé 40 M$ en série B (juin 2025 selon CB Insights/Caplight ; un article la date de 2026, source jugée moins fiable) [V web : caplight.com/company/hypernative, cbinsights.com/company/hypernative/financials] ; l'équipe note elle-même qu'Hypernative/Fireblocks/Chainalysis peuvent ajouter un export DORA [V : nouveauté_verdict §5].

(c) Équipe crédible sur l'honnêteté ; zéro produit à 23h ; boucle de ~150 agents qui note un PLAN (56,3 → 60,6 → 59,5, bruit d'un juré à l'autre : 4 points) [V : SYNTHESE, MSG-011].

(d) Moat : aucun brevetable. Seul avantage défendable : rigueur et rejouabilité par un tiers, pour l'UE.

(e) Il demandera : « un design partner, une lettre d'intention ? ». Sans, présenter la vente comme hypothèse, pas comme traction.

## 2. Les 3 dérives principales

1. **Deux produits dans un même dossier + architecture obèse.** `docs/architecture.md` v2 (22 sections) décrit la « Sentinelle » : modes Watch/Guard/callback, ladder L0-L3, détecteurs D1-D9, quarantaine par compte, droit en crise, TTE, PDP, ticket-sink CEF, AML, RGPD, RFC 3161, témoin. Le plan réellement retenu (plan_v1_1 + G + H + D-004) est un coffre plafonné + preuve de demande + moniteur + dossier. Titouan l'a écrit pour 10 h ; Adem l'a acté (MSG-011) ; la v2 n'a pas été archivée. Le tableau de bord mesure l'effort (« ~150 agents », « 29 fichiers ») et non le produit. Jargon : OPAQUE_EXIT, TTE, PDP, B0-B2, L0-L3.
2. **L'acheteur flotte.** Dossier DORA = vend à un CASP ; coffre à plafond non relevable = vend à une trésorerie on-chain (protocole, émetteur de fonds tokenisé). Les deux segments se recouvrent à peine. Le pitch mélange « RSSI d'un CASP » et « vos fonds dans notre contrat ».
3. **Le centre de gravité glisse hors du critère le plus lourd.** Grille Track 1 : détection 30 %, réponse 20 %, faisabilité 20 %, conformité 15 %, pitch 15 % [V : context/notion_guide.md l.62-68]. « Refus par construction » et « perte maximale démontrée par fuzzing » relèvent de Protect (l'équipe l'écrit : « surtout Protect » [V : preuve_demande_client §5]). Le seul chiffre non circulaire de détection, le rejeu Bitget, risque de devenir une annexe alors que le jury note précision, faux positifs, temps de détection.

## 3. Les 3 corrections concrètes et prioritaires

1. **Geler un cahier de build d'une page maintenant et archiver la v2.** v3 = plan_v1_1 + G + H + D-004. Quatre modules seulement : (i) `GuardedVault` (plafond à seau, relâchement 2/3 + timelock, tighten-only, vérification EIP-712 de la demande), (ii) moniteur à 3 signaux (destinataire inconnu > 50 % du solde, alerte croisée sur wallets frères, sortie sans demande) + script de rejeu Bitget, (iii) dossier initial (champs 1.x/2.x) avec lien de transaction, (iv) ancre de hash simple. Créer les T-1xx avant minuit (frontmatter `nist_csf`, `threat_refs`). Jalons H+1 (adresse Fuji + un refus visible), H+3, H+5, H+7. Si H+3 est raté : démo en rejeu local.
2. **Trancher l'acheteur et ce qu'on lui demande.** Phrase : « RSSI ou responsable trésorerie d'un CASP ou d'un émetteur de fonds tokenisé qui opère une trésorerie on-chain sur Avalanche ». Entrée = Watch (rien à migrer) + dossier ; Guard = « sas de réapprovisionnement plafonné » proposé à un design partner, pas « migrez vos fonds ». Écrire en première ligne des limites : le plafond protège ce qui est DANS le coffre, pas le solde du hot wallet. Ne présenter aucun prix ni traction qui n'a pas eu lieu ; sinon dire « hypothèse, à valider avec 3 CASP ».
3. **Remettre la détection au centre du pitch et de la démo.** Chiffre de tête (non circulaire, [V] rejeu) : « alerte au bloc 96072657, 0 s après la première sortie ; ~11 M$ restaient sur les wallets frères ; 8,2 M$ sont partis 98 min plus tard ». Puis la démo des coffres jumeaux montre ce que le plafond fait de ces 98 minutes. Dire en face : preuve d'existence, n = 1, pas un taux. Ajouter 1 mesure de faux positifs sur trésorerie publique (alertes par adresse-semaine). Étiqueter « scénario écrit par nous ».

## 4. Ce qu'il faut couper

- Ladder L0-L3 : garder 2 états (normal / serré). Couper quarantaine par compte, droit en crise, goutte-à-goutte, budget de restriction.
- Détecteurs D3-D9, D7 natif Safe, seuils appris par adresse, fit-check, OPAQUE_EXIT, FeePolicy.
- Callback PDP et `cosigner-sim`, ticket-sink, CEF/syslog (garder une alerte ntfy).
- Carte d'astreinte, TTE, escalade, kit « prêt à signer ».
- Pack AML, effacement RGPD, RFC 3161, témoin, racine de Merkle, ancre épinglée, scène « journal réécrit » (garder le hash du dossier ancré).
- LLM, traceur, banc à 13 classes × 100 scénarios + boîte blanche + source M, CSV de 20 incidents (garder la stat 31/32 du catalogue en une slide).
- Passkey P-256 et registre complet (garder EIP-712 + une liste d'enrôlement signée par 2 gardiens en fixture).
- Multi-chaîne, nouvelle boucle de jury sur un plan, nouvelles recherches. Une seule relance du jury, sur la démo qui tourne.

## 5. Phrase de valeur la plus vendable (une ligne)

« Quand ceux qui approuvent vos retraits sont piratés, comme chez Bitget, une limite qu'ils ne peuvent pas lever borne la perte, et votre déclaration DORA est déjà prête, chaque fait relié à sa transaction. »

(À ne pas dire : « aurait arrêté Bitget », « premier », « conforme DORA », « fonds sauvés » sans « sur ce scénario ».)

## 6. Plus gros risque de crédibilité devant le jury

Le jury (KPMG, Avalanche, Kryptosphère) posera : « Qui met ses fonds dans votre contrat, et combien paie-t-il ? » La démo (coffres jumeaux, attaque écrite par nous, « X sauvés sur Y ») suppose exactement cette migration, sans client, sans appel, sans prix, alors que le seul fait réel (Bitget) concerne des wallets EOA/hubs que nous ne contrôlons pas. Risque d'être jugé « démo circulaire + tableau de conformité ». Parade : le chiffre Bitget d'abord, la limite dite avant la question, un design partner demandé comme prochaine étape.

Risques secondaires : (1) refus par événement sans revert : l'explorateur affichera une transaction « Success » ; le dire à l'écran et lier l'événement `WithdrawalRefused` ; (2) le checkpoint de samedi 18h30 est passé : vérifier que le formulaire (problème/solution/stack) envoyé correspond à ce cap [ÀV : contenu non retrouvé dans le dépôt]; (3) citation du PDG de Bitget (« sans demandes clients ») = résumé de presse, non relue mot à mot [V : preuve_demande_client §6.3] ; (4) « Tripwire » (ETHGlobal Tokyo, 25-27 sept.) : ma recherche web n'a pas retrouvé ce projet (trouvé : Defendoooor, même événement, pause par invariants) [V web : ethglobal.com/showcase/defendooooor-mgsnx] ; l'alerte reste [ÀV] mais le risque est réel : ne pas faire de la pause asymétrique le cœur.

## 7. Mapping par idée (règlement : NIST CSF 2.0 + au moins un référentiel)

Identifiants issus des fichiers de recherche et de ma connaissance des référentiels, non rouverts sur les sites officiels aujourd'hui [ÀV avant affichage]. OWASP Agentic et ATLAS : sans objet (aucun agent IA dans le chemin de décision) ; ne pas les forcer.

| Idée | NIST CSF 2.0 | ATT&CK | D3FEND | OWASP / ATLAS |
|---|---|---|---|---|
| Plafond non relevable, tighten-only, relâchement 2/3 + timelock | PR.AA-05, RS.MI-01 | T1657, T1078 | D3-AZET | n/a |
| Preuve de demande client (EIP-712) | PR.AA-03, PR.DS-06 | T1565.002, T1657 | D3-AZET (D3-MFA = authentification multifacteur, pas multi-signature : correction de l'étiquette utilisée dans deploiement_reglementaire §5.1) | n/a |
| Moniteur + rejeu Bitget (destinataire inconnu, wallets frères) | DE.CM-01, DE.AE-02, DE.AE-03 | T1657 | D3-UBA, D3-RAPA | n/a |
| Dossier DORA lié aux transactions | RS.CO-02, RS.AN-03, RS.MA-01 | T1657 (champ techniques) | n/a | n/a |
| Journal / ancre de hash | DE.AE-02, PR.DS-06 | n/a | n/a | n/a |

À écrire honnêtement : la preuve de demande et le plafond sont Protect ; la couverture Detect/Respond vient du moniteur, du rejeu et de la restriction déclenchée.

## 8. Sources

- Hypernative Safe Shield (limites de montant, contreparties, blocage avant exécution) : https://help.safe.global/articles/7610775969-understanding-safe-shield-guardian-by-hypernative [V, extrait de recherche]
- Hypernative levée série B 40 M$ : https://www.caplight.com/company/hypernative ; https://www.cbinsights.com/company/hypernative/financials [V, deux trackers concordants sur juin 2025 ; pas de prix public trouvé]
- Hexagate gratuit pour les builders Avalanche (déc. 2025) : https://www.crowdfundinsider.com/2025/12/256553-chainalysis-introduces-hexagate-security-for-blockchain-foundations-ecosystem-devs/ [V, extrait ; blocage de transactions sur Avalanche non confirmé]
- Defendoooor (ETHGlobal Tokyo) : https://ethglobal.com/showcase/defendooooor-mgsnx [V, extrait]
- Grille Track 1 : `context/notion_guide.md` l.62-68 [V]
- Fichiers internes cités : research/INTEGRATION.md, research/tracks/T1_P4_nouveaute_verdict.md, T1_P4_preuve_demande_client.md, T1_P4_rejeu_bitget_avalanche.md, T1_P4_deploiement_reglementaire.md, T1_P4_douleur_classement.md, research/loop/SYNTHESE.md, research/titouan/H_ebauche_archi.md, G_demo_plan_v2.md, coord/INBOX.md (MSG-011).
