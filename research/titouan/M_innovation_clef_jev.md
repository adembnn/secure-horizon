# M. Clef / Jev : ce qui est vérifié, ce qui est faisable (Claude-Titouan, 11/10/2026)

Statut : synthèse de N1 (doc Clef), N2 (usages particulier), N3 (jeux de données). N4 (gel des fonds) encore en cours, non incluse. Étiquettes [P] primaire, [S] presse, [V] vendeur. Réponse à MSG-024 (partie Clef/Jev).

## 1. Clef : les affirmations d'Adem, vérifiées (N1)
- Confirmé [P] : Apache-2.0, poids sur Hugging Face (Cloudflare/clef 27B, clef-flash 9B), disponibles sur Workers AI, encodeur vision, format d'API proche de Jev (state/questions, noul/choice/score).
- Nuancé : données d'entraînement non publiques, donc "poids ouverts" [S]. Le paramètre `model` n'accepte que clef/clef-flash : pas un remplacement strict de Jev.
- Corrigé : contexte de Clef-flash 24 576 tokens (Clef : 65 536).
- Latence : 38,8 ms médiane déclarée par Cloudflare [V] ; un testeur tiers mesure 191 à 205 ms depuis l'Italie [S].
- Prix [P] : Clef 0,24 $/M, Clef-flash 0,038 $/M, Jev 0,042 $/M. Gratuit : 10 000 Neurons/jour (environ 2,9 M tokens Clef-flash, calcul de l'agent).
- Local : GPU H200 testé, VRAM 41 Go (flash) et 85 Go (Clef) [S] : pas faisable sans GPU.
- Fine-tuning RL : service géré par Cloudflare, auto-service futur. Faisable ce week-end : non.
- Non trouvé : langues, biais, limites de débit.

## 2. Usages côté particulier (N2)
- Douleur chiffrée : Scam Sniffer 2025, 83,85 M$ et 106 106 victimes [P] ; Check Point, Inferno Drainer 30 000 portefeuilles et 9 M$ en six mois [P] ; empoisonnement d'adresse 83,8 M$ (USENIX) [P].
- Précision publiée : uniquement des chiffres vendeurs (Blockaid 97 % de détection, Kerberus 99,9 %). Aucun benchmark indépendant.
- Aucun usage de Jev/Clef sur arnaque crypto grand public trouvé. Seul cas proche : EmDash (phishing, seuil 0,45 vers relecture humaine) [S].
- Espace libre (aucun produit trouvé) : classer les messages entrants (Telegram, Discord, SMS, e-mail), riposte automatisée, score d'escalade vers l'humain.
- MetaMask classique, faisable : extension, appli compagnon, surveillance de chaîne, révocation signée par l'utilisateur si la clé est saine. Impossible : bloquer une signature, limite ou délai que la clé compromise ne lève pas, déplacer des fonds sans signature, révoquer si un balayeur contrôle la clé.

## 3. Jeux de données pour mesurer (N3)
- Domaines : ScamSniffer scam-database (GPL-3.0, 7 jours de retard) [V] ; Forta labelled-datasets (MIT, étiquettes bruitées) [V].
- Pages : PhreshPhish (666 315 pages, CC BY 4.0, 2026-02-07) [V], seul grand jeu propre.
- Transactions : PTXPHISH (5 000 tx, deux experts) [S] ; DeFiHackLabs (Apache-2.0, code, pas tabulaire) [V].
- Messages : UCI SMS (2012), jeux HF centrés Inde. Aucun jeu de faux support Telegram crypto.
- Manques : captures de faux sites crypto, négatifs réalistes, signatures Permit étiquetées, faux support Telegram, jeu à double relecture humaine.
- Plan : séparation temporelle et par marque, dédoublonnage, test gelé postérieur à T, relecture manuelle de 200 éléments par source.

## 4. Lecture (interprétation, à discuter)
1. Clef/Jev ne change pas l'architecture : c'est le "Classer" du cœur. Le code calcule (montants, similarité d'adresse), le modèle juge le sens (message, contexte). Sous le seuil de confiance, on envoie à l'humain.
2. Un A/B Jev vs Clef-flash vs Clef sur Workers AI gratuit est faisable ce week-end, si on a un jeu étiqueté. Comme aucun benchmark indépendant n'existe, mesurer nous-mêmes serait une vraie donnée (mais petite : à annoncer comme telle).
3. Le créneau "messages entrants + riposte + escalade" est libre et marche sur MetaMask classique : c'est compatible avec le cœur seul (Lire, Classer, Documenter, Prévenir).
4. Risques : injection de prompt dans les messages classés, biais vers la première option, jeux de données pauvres en faux supports crypto.

## 5. Gel des fonds (N4, ajouté après coup)
- Aucun acteur ne gèle sur simple demande d'une victime. Circle [P] et Binance [P] exigent une contrainte légale ou un ordre officiel. Tether gèle sur demande vérifiée d'agence, sans ordonnance, ce que conteste une plainte du 31 août 2026 [P Forkast].
- Délais en cas de hack : Tether environ 1 jour (Bybit), environ 7 h après Circle (Bitget) [P]. Circle plus de 24 h sur Bybit, 0 gel en 6 h sur Drift, environ 1 mois sur Cetus (selon ZachXBT, donc [V]). Gel de masse seulement par les validateurs Sui (162 M$ sur 223 M$).
- FBI Kill Chain 2025 [P] : 3 900 dossiers, 679 M$ gelés sur 1,164 Md$ tentés (58 %), surtout virements bancaires.
- SEAL 911 [P] : 3 300 tickets, plus de 180 M$ "sauvés" (auto-déclaré). Handle du bot à vérifier.
- Non trouvé : formulaire public de gel chez les émetteurs et grands exchanges ; cas français (plainte, parquet) non couvert.
- Paquet de preuves en 13 points (rapport de police, narratif daté, adresses et TxID, preuve de propriété, plainte IC3...) reconstitué, aucun émetteur ne publie sa liste (détail dans N4).
- Lecture : notre dossier automatique a de la valeur parce que le gel dépend d'un dossier judiciaire complet, mais on ne peut pas promettre un gel. Le produit prépare la demande, il ne la déclenche pas.
