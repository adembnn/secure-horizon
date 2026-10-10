# Track 1 — 4 pitchs, un par piste (v1, 10 oct. 2026)

> Format identique pour chaque piste : douleur, concurrents, innovation, technique, démo, phrase de fin. Détails et sources dans `research/tracks/T1_P*_v2.md`.

---

## Piste 1 — SABLIER : « on gèle l'argent avant qu'il sorte, et seulement l'argent sale »

**Douleur.** Quand une victime de faux conseiller vire 4 000 €, l'argent passe par 2 à 5 comptes de mules et sort du pays en quelques heures. L'analyste AML de la banque met 29 jours en moyenne à déclarer (ACPR 2025), traite ses alertes dans l'ordre d'arrivée, et quand il gèle, il gèle tout le compte, y compris le salaire d'un étudiant qui a prêté son RIB. 661 M€ reçus sur des comptes rebonds en un an par 13 banques, 60 % repartent à l'étranger.

**Concurrents.** Hawk, Unit21, Lucinity, Quantexa, Feedzai, Sardine : ils scorent le compte et expliquent l'alerte. Mastercard TRACE, Salv Bridge, le FNC-RF français (live depuis mai 2026) partagent des listes de comptes suspects. Tous classent par score de risque. Aucun ne classe par **temps restant avant que l'argent sorte**, aucun ne gèle au prorata, aucun n'a de workflow FNC-RF.

**Innovation.** Un sablier par alerte : on calcule combien d'euros contaminés sont encore sur le compte, la probabilité que ce soit une mule, et la vitesse à laquelle ces fonds vont partir. L'analyste traite d'abord ce qui va disparaître. Quand il agit, on ne retient que le montant sale, pas le compte. Et chaque décision vient avec une explication qu'un auditeur peut rejouer et contredire.

**Technique.** Graphe temporel des virements (données synthétiques calibrées sur les stats ACPR/FCA) → traçage de contamination (proportionnel / FIFO / poison) → score de mule par GNN → file de priorité = € contaminés × P(mule) × survie des fonds ÷ temps analyste → retenue partielle + déclaration FNC-RF pré-remplie → explication contrefactuelle. Journal haché, ancré sur Avalanche Fuji. Le LLM rédige, il ne décide jamais.

**Démo.** Deux files d'analystes côte à côte, mêmes alertes : compteur « € préservés » qui s'écarte en direct.

**Fin.** « Mêmes analystes, mêmes alertes, trois fois plus d'argent sauvé, et personne de bloqué à tort. »

---

## Piste 2 — GOLDEN HOUR : « la banque voit l'arnaque pendant qu'elle a lieu, et court après l'argent »

**Douleur.** En France, la fraude par manipulation coûte 516 M€ par an (+34 %), dont 376 M€ pour le faux conseiller bancaire. La victime valide elle-même le virement, donc la vérification du bénéficiaire (VoP) ne sert à rien. La banque ne voit rien, et quand la victime appelle le lendemain, l'argent a déjà sauté trois comptes. Demain, avec le PSR, c'est la banque qui rembourse.

**Concurrents.** BioCatch (racheté 2,4 Md$ par Visa), Feedzai, Featurespace, Cleafy, ThreatMark : biométrie comportementale côté payeur. FNC-RF, FRIDA (EPC), Visa A2A Protect : listes de bénéficiaires suspects, mais après signalement et en oui/non. Personne ne croise les deux en temps réel, personne n'automatise la course après l'argent.

**Innovation.** Double regard : d'un côté le contexte de la session du payeur (appel en cours, accès à distance actif, IBAN collé, montant inhabituel), de l'autre une bande de risque du bénéficiaire avant tout signalement, avec motifs et date d'expiration. Les deux ensemble déclenchent une réponse graduée, de « rien » à « on retient et on appelle ». Et dès qu'on retient, l'heure d'or démarre : paquet de gel prêt pour les banques suivantes, traçage multi-sauts, jauge « € encore récupérables ».

**Technique.** Capteurs de session (synthétiques) + registre bénéficiaire pré-signalement → matrice de décision déterministe R0-R4 → budget de friction mesuré (friction par fraude évitée) → chaîne de gel inter-banques avec accusés horodatés ancrés sur Fuji → dossier de responsabilité PSR généré automatiquement (authorised vs unauthorised, pièces, régime). Le LLM explique au client en langage clair, il ne décide pas.

**Démo.** Scénario faux conseiller en direct : la jauge « € récupérables » décroît seconde par seconde, on retient, on gèle au 3e compte, le dossier PSR sort.

**Fin.** « On ne demande pas à la victime de se méfier. On donne à la banque une heure pour courir. »

---

## Piste 3 — SILLAGE + NASSE : « l'agent piégé paie… dans un faux grand livre »

**Douleur.** Les entreprises confient déjà les paiements fournisseurs à des agents IA (Ramp en production depuis octobre 2025, Coinbase Agentic Wallets). Une facture PDF peut contenir une instruction cachée qui fait changer l'IBAN : en labo, 4 modèles sur 26 paient, et 8 750 € deviennent 46 200 €. La fraude au fournisseur coûte déjà 3 Md$ par an sans IA. Et depuis janvier 2026, les assureurs excluent les incidents dus à une IA non contrôlée.

**Concurrents.** Lakera, Prompt Security, Zenity, Noma : filtres de prompt et garde-fous, rachetés en masse par Palo Alto, Cisco, CrowdStrike. Okta, Entra, AWS AgentCore : identité et politique d'accès par appel d'outil. Fireblocks, Safe : plafonds de dépense. Tous regardent l'agent ou l'appel. Aucun ne sait **d'où vient la valeur** que l'agent utilise, aucun ne piège l'attaquant.

**Innovation.** Sillage : chaque donnée que l'agent lit garde sa trace d'origine, et cette trace voyage dans le jeton d'autorisation. Un IBAN venu d'une pièce jointe ne peut jamais devenir un ordre de paiement, quel que soit le nombre d'agents entre les deux. Nasse : au lieu de couper l'agent, on le bascule sur un grand livre fantôme. L'attaquant croit avoir réussi, zéro euro part, les paiements légitimes continuent, et on récupère les IBAN des mules pour la lutte anti-blanchiment.

**Technique.** Passerelle de paiement entre les agents (Bedrock) et le ledger : jetons courts à capacités avec étiquette de provenance, chaîne d'autorité signée humain → agent → agent vérifiable hors ligne, moniteur aveugle qui ne lit que des actions structurées (jamais le contenu des documents), bénéficiaires-canaris, bascule en cage, rejeu contrefactuel pour prouver que « la facture a commandé, pas l'humain ». Journal chaîné ancré sur Fuji, export au format AIUC-1 (la norme que KPMG certifie).

**Démo.** Duel en direct : un agent protégé par un juge LLM se fait avoir, le nôtre paie le faux grand livre et affiche la liste des mules.

**Fin.** « Le kill switch arrête l'agent. Nous, on arrête l'attaquant. »

---

## Piste 4 — SENTINELLE FUJI : « le hack déclenche la pause, et le rapport DORA s'écrit tout seul »

**Douleur.** 1,26 Md$ volés en DeFi au 3e trimestre 2026, en minutes. Les prestataires crypto agréés MiCA sont soumis à DORA : 3 383 incidents majeurs déclarés en Europe en 2025, 80 % venant de tiers, et l'AMF dit que les délais de 4 h / 24 h / 72 h sont « rarement respectés ». Un protocole hacké doit en même temps arrêter l'hémorragie, tracer les fonds et remplir un formulaire de 60 champs.

**Concurrents.** Hypernative, Hexagate (gratuit sur Avalanche), Forta, Cyvers, Blockaid : détection d'anomalies on-chain avec faux positifs, pause manuelle ou par règle. Regnology, Corlytics, OneTrust, Big4 : formulaires DORA remplis à la main. Aucun outil DORA n'est alimenté par la chaîne, aucun outil on-chain ne produit la déclaration.

**Innovation.** Un leurre : une fausse vulnérabilité dans le contrat, sans usage légitime. Celui qui la touche est un attaquant, par construction : zéro faux positif, détection dès le déploiement de son contrat d'attaque. La réponse est graduée (rate limit, pause partielle, pause totale avec expiration automatique). Et chaque événement devient une ligne du rapport DORA, avec sa preuve horodatée on-chain, le registre des tiers (oracles, RPC, bridges) lu directement dans l'état du contrat.

**Technique.** Contrat vault + HoneyVault déployés sur Fuji → surveillance des blocs (webhooks AvaCloud, repli polling) → échelle de réponse signée à l'avance par la direction, reprise par multisig humain → classification déterministe RTS 2024/1772 → formulaire ITS 2025/302 pré-rempli, chaque champ pointant vers une transaction → scorecard de rejeu des hacks réels (Resolv, Drift, Kelp, Tectonic) sur fork. Hash du dossier ancré sur Fuji.

**Démo.** L'attaquant mord sur Fuji, la pause tombe en un bloc, le rapport DORA sort avec ses preuves, l'auditeur rejoue et retrouve les mêmes chiffres.

**Fin.** « Pas de modèle qui devine : un piège qui ne ment pas, et un rapport que le régulateur peut vérifier lui-même. »

---

## Réponse commune à « si votre modèle se trompe, qui est responsable ? »
La règle est déterministe et signée par la direction : c'est elle qui décide. Le modèle n'écrit que l'explication. Un humain valide toute action lourde. Chaque décision est journalisée, hachée et ancrée : l'auditeur rejoue et voit exactement pourquoi. Et toute action est réversible.
