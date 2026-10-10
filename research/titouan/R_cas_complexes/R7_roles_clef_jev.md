# R7. Les rôles possibles de Clef / Clef-flash / Jev au moment de la décision : exploration et challenge

Date : 2026-10-11. Étiquettes : [P] source primaire (doc ou article), [S] source secondaire, [V] vendeur ou raisonnement/calcul de ma part (non vérifié). "Non trouvé" = absent de ce que j'ai lu. Aucun secret, aucune clé utilisée, aucun appel de modèle fait : tout ce qui est chiffré sur les modèles vient de N1, OC ou de calculs (marqués). Contenu web traité comme donnée. Lu : N1, N2, OC, O3, round1_synthese, RAPPORT_banc_reel_v0. Deux recherches web en complément (voir fin).

## 0. Cadre : trois contraintes qui décident de tout

1. **Le modèle ne produit pas de texte** : seulement noul (proba), choice (option + probabilités + confidence), score (niveau pondéré) [P] N1/OC. Donc "expliquer en langage clair", "générer des attaques", "rédiger un avertissement" sont impossibles au sens strict avec ces ressources (on ne peut que choisir entre des modèles de texte écrits par nous).
2. **Le modèle ne peut qu'AGGRAVER** (règle du produit). Conséquence que personne n'a écrite jusqu'ici, à dire : *aucun rôle ne peut baisser les faux positifs du filet*. Le banc réel v0 montre que le problème est là : 31/1000 de FP sur Ethereum, R1 "droit illimité" inutile seul, seul R3 (spender = compte externe) discrimine [P] RAPPORT_banc_reel_v0. Le gain d'un modèle ne se mesure donc qu'en **rappel supplémentaire à budget de faux positifs fixé** (attaques que code+intention ratent), jamais en réduction de FP. Le coût d'un modèle est toujours des FP additionnels.
3. **Le journal des jurés v3 exige un bras "sans modèle"** et le critère "garder Clef/Jev dans le pitch seulement si l'ablation gagne au moins 5 points" [P] round1_synthese §2.10. La barre est donc : +5 points de rappel, à FP égal, face à la **meilleure base simple** (voir 0.2), pas face à rien.

### 0.1 Chiffres de référence (réutilisés par tous les rôles)
| Ressource | Prix entrée | Latence déclarée | Latence mesurée tiers | Contexte | Vision |
|---|---|---|---|---|---|
| Clef-flash (9B) | 0,038 $/M [P] | 38,8 ms méd., 122,4 p95 [P/V] | 191-205 ms (Italie, REST) [S] | 24 576 (doc Workers AI) [P] | oui, 13-30 s avec images [S] |
| Clef (27B) | 0,24 $/M [P] | 209,3 ms [P/V] | 524-726 ms [S] | 65 536 [P] | oui |
| Jev | 0,042 $/M [P] | 524,1 ms (méthode Cloudflare) [V] ; ~100 ms selon TypeSafe [S] | non trouvé | 64k annoncé, état et question 32k [S] | non (texte seul) [P] |
Coût d'un appel de 800 jetons (état + 10 questions), calcul [V] : flash ≈ 0,00003 $, Jev ≈ 0,000034 $, Clef ≈ 0,00019 $. Mille vérifications : flash 0,03 $, Jev 0,03 $, Clef 0,19 $. Le coût n'est jamais le problème ; la **latence, la calibration et l'injection** le sont.
Non trouvé : calibration publiée de Clef/Jev, comportement en français, résistance à l'injection, limites de débit de Clef, définition exacte de `confidence` [P] N1/OC. Biais de position : un juge LLM changeait de verdict à l'inversion de l'ordre dans environ 35 % des cas pour le meilleur juge testé (65 % de cohérence) [S] résumé de https://arxiv.org/html/2306.05685v4 ; les variations jusqu'à 75 % selon l'ordre des options [P] OC.

### 0.2 Les bases simples à battre (sinon le modèle est décoratif)
- **B0 règle** : mots-clés/regex, listes, distances d'édition, seuils codés à la main.
- **B1 apprentissage léger** : régression logistique sur TF-IDF de caractères + les mêmes features de B0 (5 minutes, scikit-learn). C'est le vrai adversaire : un modèle de 9 milliards de paramètres qui ne bat pas B1 de 5 points n'a pas sa place [V].
- **M** : Clef-flash / Jev / Clef seul. **B0+M** : composition monotone (max des verdicts).

### 0.3 Protocole d'ablation commun (36 h)
- Jeu **gelé et haché** avant tout réglage (SHA-256 du fichier publié dans le dépôt), partagé DEV 50 % / TEST 50 %, une **famille d'attaque entière tenue hors DEV** (exigence jurés, round1 §2.2). Étiquettes par 2 humains (Titouan + un tiers) sur au moins 200 cas, kappa publié. Pas de cas générés par la même famille de modèle que celle qu'on teste (circularité).
- Bras : B0, B1, M (3 modèles), B0+M (composition aggravante). Décision d'un rôle fixée *avant* de voir TEST : seuil unique choisi sur DEV pour FP ≤ 1 % sur les légitimes.
- Mesure : rappel à FP égal, intervalles de Wilson, test pairé (McNemar ou bootstrap pairé 2 000 tirages, graine fixe).
- **Puissance (calcul [V])** : avec ~15 % de paires discordantes entre deux bras, l'écart-type de la différence pairée vaut sqrt(0,15/n_positifs) : 2,7 points pour n=200, 1,9 point pour n=400. Prouver +5 points avec confiance raisonnable demande **n_positifs ≥ 300-400** ; avec n=100 on ne prouve rien en dessous de +8. À 36 h : viser 300 positifs par rôle prioritaire, ou annoncer "non concluant".
- Tests transverses : 100 chaînes adverses d'injection (0 baisse de verdict final exigée, structurellement garantie par la monotonie, voir §5), 20 reformulations FR/EN/mélange, permutation des options (2 passes), panne injectée (timeout), coût et latence p50/p95 sur 200 appels.
- Critère de décision : le rôle est gardé dans le pitch s'il gagne ≥ 5 points de rappel sur B1 (pas seulement B0) à FP égal sur TEST, borne basse de l'IC95 de l'écart > 0 ; sinon "testé, non retenu" (résultat publiable).

## 1. Les 18 rôles

Format : apport face à une règle ; entrées ; sorties ; modèle ; latence/coût ; défaillance ; ablation ; place ; verdict.

### R1. Phrase libre vers intention structurée
- Apport : comprendre "envoie les 2 000 à Marc, comme d'hab" sans que l'utilisateur clique 5 boutons. Face à des boutons, apport réel faible tant que les boutons existent (OC : boutons par défaut, texte libre en option).
- Entrées : état = {phrase, entités extraites par code (montant, bénéficiaire, domaine), contexte local}. Les entités viennent du code, pas du modèle [P] OC §2.
- Sorties : choice `action` {payer, connexion, achat, réglage, autre/incertain} ; noul `bénéficiaire_connu` ; score `inhabituel`.
- Modèle : Clef-flash (rapide), Jev en second avis.
- Latence/coût : ~200 ms mesurés ; 0,00003 $.
- Défaillance : confusion payer/connexion ; biais de position des options ; injection par la phrase de l'utilisateur sous dictée de l'escroc ; pas de calibration FR ; **danger propre** : une mauvaise lecture élargit l'effet "permis" et fait taire l'alerte. Parade : l'intention effective = la plus stricte entre boutons et lecture du modèle (le modèle ne peut que resserrer ce qui est permis).
- Ablation : 200 phrases FR/EN étiquetées par 2 humains ; B0 = gabarits/regex, B1 = logistique ; mesure = exactitude de la catégorie ET taux de lectures "trop permissives" (doit être ≤ celui des boutons). Gain visé +5 points d'exactitude sur phrases hors gabarit.
- Place : avant le comparateur, chemin critique léger (si texte libre utilisé). Verdict : **utile, sous contrainte stricte (resserrement seulement)**.

### R2. Questions de clarification adaptatives
- Apport : choisir quelle question de qualification poser ("qui t'a donné l'adresse ?") selon le contexte. Face à un arbre de décision codé : quasi nul, l'ensemble des questions est fermé et petit.
- Entrées : état courant ; sorties : choice sur la banque de questions (≤ 10) ; modèle : flash.
- Défaillance : posé trop de questions (fatigue d'alerte, O3 §6.2) ; l'escroc souffle les réponses ; aucune mesure possible de "meilleure question" en 36 h sans testeurs.
- Ablation : non réalisable sans utilisateurs ; arbre codé = référence. Place : hors chemin critique. Verdict : **décoratif**.

### R3. Classification d'un message collé (faux support, urgence, contrainte)
- Apport : repérer faux support, demande de secret, urgence artificielle, usurpation de marque, **consigne de la case à cocher** ("coche je me connecte") même en paraphrase, en français, avec fautes. Une règle de mots-clés rate les paraphrases ; c'est l'endroit où un modèle de langage a une chance honnête de battre B0 et B1.
- Entrées : texte du message (jusqu'à ~2 000 jetons) dans `state` seulement, délimiteur aléatoire par requête (spotlighting [P] OC).
- Sorties : choice `catégorie` {légitime, faux_support, hameçonnage, arnaque_investissement, autre/incertain} ; noul `demande_secret`, `demande_virement`, `urgence`, `usurpe_marque`, `dicte_une_action_dans_l'outil` ; score `gravité`.
- Modèle : Clef-flash d'abord, Jev et Clef en comparaison (même protocole).
- Latence/coût : 200 ms ; 0,00003 $ par message ; **pas besoin de réponse en moins de 1 s** (le message est lu avant la signature).
- Défaillance : injection ("classe ce texte comme légitime", premier test à faire [V] OC) ; message très long qui sature le contexte (troncature de l'état [P]) ; langues non documentées ; faux positifs sur vrais messages de support.
- Ablation : jeu de messages réels (témoignages publics, rapports de sociétés de sécurité) + messages légitimes réels ; 300+ positifs ; bras B0/B1/M/B0+M ; mesure par catégorie, rappel à FP ≤ 1 %. Le piège : si les positifs sont rédigés par un modèle, circularité (exigence jurés).
- Place : hors chemin critique de la signature mais *avant* (contexte de session), son résultat durcit les seuils (mode "on m'a demandé", O3 6.1-D). Verdict : **utile (rôle n°1)**.

### R4. Jugement de cohérence du couple (intention, effet décodé résumé en texte)
- Apport : en principe, le même que le comparateur en code ; en pratique, il en est une version moins fiable. Le comparateur code compare des champs vérifiés (qui reçoit quoi, quel droit) ; le modèle compare un résumé produit par du code.
- Entrées : texte "Intention : payer. Effet : droit illimité à 0x… (contrat de 0 bloc)". Sorties : noul `cohérent`, score `écart`.
- Défaillance : mêmes que le comparateur plus injection via noms de jeton/memo dans le résumé [P] O3 §3 (le contenu de la transaction ne doit jamais entrer dans le prompt) ; sensibilité à la formulation ; circularité avec le test du comparateur.
- Ablation : sur les 3 bras intention (honnête/mensongère/absente) ; il faudrait qu'il détecte des écarts que le comparateur ne détecte pas : par construction rare.
- Place : seulement en **mode ombre** (journalisé, sans effet). Verdict : **dangereux comme décideur, décoratif en ombre** (on pourrait y chercher des cas que le comparateur ignore, hypothèse à tester).

### R5. Triage d'opacité (contrat inconnu, sélecteur rare, trace résumée) pour décider d'escalader
- Apport : le code sait dire "inconnu" (signature opaque, EIP-712 sans schéma, sélecteur absent) ; il ne sait pas dire "inconnu mais ressemble à un forwarder/vidangeur" vs "inconnu mais ressemble à un routeur". C'est le cas dur des multicall et des contrats neufs [P] O3 §1, §6.3 ; le banc montre 34 % de tx "other" invisibles au décodeur [P] RAPPORT.
- Entrées : un résumé **fabriqué par le code** : âge du contrat en blocs, source vérifiée oui/non, taille du bytecode, présence de delegatecall/selfdestruct/tx.origin, nombre d'appelants distincts, sélecteurs, proportion de tokens de la victime concernés. Pas de texte libre d'attaquant.
- Sorties : score `suspicion` (4 niveaux), noul `ressemble_à_un_vidangeur`, choice `famille` {routeur/agrégateur, pont, coffre, forwarder, inconnu}.
- Modèle : Clef-flash ou Jev ; comparaison avec B1 (logistique/arbre sur ces features).
- Défaillance : le modèle n'a pas vu ces contrats pendant l'entraînement et "connaît" mal les adresses (hallucination de réputation) ; sur des features numériques, un arbre de décision fait aussi bien (soupçon fort) ; évasion de fork et proxys upgradeables ne se voient pas dans les features [P] O3.
- Ablation : contrats du jeu ScamSniffer (170 spenders, concentration 33 % sur 5, indépendance faible [P] RAPPORT) contre 200 contrats légitimes tirés au hasard ; **séparer par spender, pas par transaction** ; gain vs B1 ≥ 5 points de rappel à FP égal. Risque d'échec réel : B1 gagnera probablement.
- Place : décide seulement *l'ordre et le canal* de l'escalade (warn → délai, warn → deuxième avis) parmi les cas déjà jugés opaques par le code ; ne peut pas rendre un "opaque" plus sûr. Verdict : **utile mais pari** (il perd contre B1 dans mon pronostic [V], il faut le dire).

### R6. Notation d'une contrepartie en texte
- Apport attendu : "ce destinataire a-t-il l'air fiable ?" à partir d'une description (nom, pseudo, site). Face à des listes et à l'historique d'adresses (âge, interactions) : le modèle n'a pas de connaissance du monde à jour (poids figés, pas de recherche) et la description est fournie par l'attaquant.
- Défaillance : hallucination de réputation, biais de marque, injection dans la description, aucune donnée d'étalonnage. Ablation : pas de jeu étiqueté de contreparties ; non réalisable. Place : aucune. Verdict : **dangereux** (donne une fausse assurance sur un champ contrôlé par l'adversaire).

### R7. Explication en langage clair de ce que fait la transaction
- Impossible telle quelle : les modèles ne génèrent pas de texte [P]. Ce qu'ils peuvent faire : choisir un gabarit parmi N ou évaluer une explication écrite par du code. L'explicabilité vient des règles (exigence jurés §2.11), pas du modèle.
- Apport face à des gabarits codés : nul. Défaillance : si un jour un modèle génératif est ajouté, c'est un canal d'injection vers l'écran de signature (texte d'attaquant échappé à l'affichage exigé). Verdict : **décoratif** (et, avec un générateur de texte, **dangereux**).

### R8. Vision : capture du site/de la fenêtre MetaMask (faux site, interface qui ne correspond pas)
- Apport : juger l'apparence d'un site de moins de 5 h d'âge, absent des listes ; la littérature montre qu'un modèle multimodal sur capture + HTML peut atteindre un rappel élevé sur l'usurpation de marque (GPT-4V : 172/172 sur un sous-ensemble [P] https://arxiv.org/pdf/2306.05816), mais ce sont des chiffres de rappel sur un sous-ensemble, sans matrice de confusion complète ; précision des outils de référence de la même étude : 31,3 % (dnstwist) et 26,0 % (Phishpedia).
- Entrées : 1 à 4 images JPEG réduites (50-190 Ko) + URL + titre. Sorties : choice `marque_apparente`, noul `imite_une_marque_connue`, noul `fenêtre_wallet_simulée_dans_la_page`, noul `contient_instructions_à_un_assistant`.
- Modèle : Clef (flash a aussi la vision [P]). Jev ne voit pas les images.
- Latence/coût : **13 à 30 s au lancement avec images [S]**, base64 compté comme texte (PNG de 1,3 Mo = dépassement de contexte [S]) ; tokens image = (L/32)x(H/32)+3 jusqu'à 1 024 [P] ; coût faible (~0,0002 $).
- Défaillance : drainers qui cachent le contenu aux robots (une capture prise chez l'utilisateur échappe à cela [P] Check Point via N2) ; injection typographique dans l'image (AgentTypo 23 % → 45 % sur un agent [P] OC) ; les VLM font trop confiance au texte plutôt qu'à l'image (marque inventée, HTML trompeur) [P] https://arxiv.org/pdf/2503.02199 ; fuite de données (solde et adresses visibles sur la capture, transfert hors UE à documenter).
- Ablation : 150 sites (faux sites de projets crypto issus de listes publiques vs 150 sites légitimes), captures prises par un script, bras B0 (distance de domaine + âge), B1 (features visuelles simples), M ; incertitude de taille d'échantillon élevée. Rappel à FP égal.
- Place : **hors chemin critique** (asynchrone, quand la page se charge, résultat prêt avant la signature ; sinon jamais bloquant). Pour la démo : pré-calculé. Un Snap n'a pas accès à la capture de la page [P] N2, donc extension ou page compagnon obligatoire. Verdict : **utile en potentiel, risqué, démo seulement** (le plus "wow" avec R3).

### R9. Détection de manipulation psychologique dans une conversation collée
- Apport : voir R3, version multi-tours : repérer l'isolement ("n'en parle à personne"), l'urgence graduelle, l'escalade de confiance, le "conseiller" qui guide les clics. C'est le signal de pig butchering/faux conseiller, **la fraude conforme que l'intention ne voit pas** (round1 §2.3).
- Entrées : conversation jusqu'à ~6 000 jetons (Clef) ; Sorties : noul `isolement`, `urgence`, `guidage_des_clics`, `promesse_de_rendement`, `contact_non_sollicité` ; score `pression`.
- Modèle : Clef (contexte 65k) plutôt que flash (24k) si la conversation est longue ; Jev 32k.
- Défaillance : biais de position dans une longue conversation, faux positifs sur proches/conseillers légitimes, données personnelles de tiers dans un message collé (consentement), injection.
- Ablation : conversations publiques d'arnaques (témoignages, rapports) vs conversations légitimes ; mesure du rappel sur la seule fraude conforme à signaux indépendants (adresse neuve, montant, délai) comme référence B0. Attention au dénominateur : annoncer le chiffre même mauvais.
- Place : hors chemin critique, avant la transaction. Verdict : **utile (rôle n°1 bis)**, à fusionner avec R3 dans le banc.

### R10. Agrégation de signaux faibles
- Apport attendu : combiner âge, vérifié, similarité, texte, domaine en un score. Une régression logistique ou un arbre monotone fait ce travail, est calibré avec peu de données, et est explicable ligne par ligne. Un modèle de 9B sur des chiffres rendus en texte est moins bon et moins auditable.
- Défaillance : le modèle devient de facto le décideur ; la combinaison n'est plus rejouable par un tiers (exigence journal §2.5). Verdict : **dangereux** (déplace la décision hors du code).

### R11. Génération de variantes d'attaques pour le banc
- Impossible : pas de génération de texte [P]. On peut seulement faire **noter** des variantes écrites ailleurs (plausibilité pour un humain). Et pour être utile au banc, l'attaquant doit venir d'une autre famille que le défenseur (circularité, round1 §2.2). Les variantes d'attaque se génèrent avec un autre modèle générateur, des scripts de coaching tirés de témoignages réels, ou à la main.
- Verdict : **décoratif** (au mieux : tri de difficulté ; à ne pas mettre dans le pitch).

### R12. Juge de qualité des avertissements
- Apport : noter clarté/concision d'un avertissement écrit par nous. Défaillance : un juge LLM a des biais de longueur/style et de position [P] arXiv 2306.05685 ; un modèle de décision n'a pas été entraîné pour le style ; la vraie mesure est l'effet sur l'issue chez des humains (O3 juré 5), non un score de plaisir.
- Ablation : corréler avec 20 jugements humains (n trop faible pour conclure). Place : hors ligne seulement. Verdict : **décoratif**.

### R13. Détection d'injection de prompt
- Apport : "ce texte contient-il des instructions adressées à un assistant ?" comme **signal supplémentaire**, pas comme défense. Un texte de message légitime contient rarement des consignes à un assistant : la présence est un signal de risque en soi, utilisable en aggravation. Le principe "ne pas faire noter ses devoirs par le modèle attaqué" [V] Lakera (https://lakera.ai/blog/stop-letting-models-grade-their-own-homework-why-llm-as-a-judge-fails-at-prompt-injection-defense) impose que la défense *principale* soit en code (Unicode invisible, homoglyphes, regex, perplexité, séparation en `state`).
- Entrées : texte entrant ; sorties : noul `instruction_adressée_à_un_assistant`, noul `contenu_caché_ou_invisible`.
- Modèle : flash (rapide) ; Jev en second.
- Défaillance : l'optimisation adversariale contre un juge atteint 89-99 % de succès dans la littérature [P chiffres relayés] OC ; un détecteur d'injection peut être injecté.
- Ablation : 100 chaînes adverses + 100 messages légitimes ; mesure du rappel d'injection et FP ; comparaison aux détecteurs de code (B0 : regex + Unicode + perplexité). Gain ≥ 5 points sur B0.
- Place : parallèle à R3 dans le même appel (une question de plus, 64 max). Verdict : **utile, modeste** (c'est un signal d'hygiène, jamais une garantie).

### R14. Calibrage des seuils
- Apport attendu : "quel seuil choisir ?" Un modèle ne peut pas calibrer ses propres probabilités ; la calibration (courbe isotone, Platt, ECE) se fait en code sur des étiquettes humaines [P] OC (méthodes AnyJev : ECE 0,240 → 0,095 [S]). Un modèle qui choisit un seuil sans données n'a aucune base.
- Verdict : **dangereux** (donne une apparence de rigueur sans mesure ; casse la reproductibilité). À remplacer par un script de calibration.

### R15. Classification de l'origine (domaine/URL sosie)
- Apport : la distance d'édition (B0) trouve `metamsk.io` mais pas `metamask-support-help.io`, `secure-login-metamask.app`, ni les sosies de marque inventés (combosquatting) ; juger "ce domaine imite-t-il une marque connue de la liste ?" est un classement flou court, et c'est exactement le genre de tâche où un modèle peut ajouter du rappel. Les jurés demandent de toute façon de remplacer "4+4 caractères fixe" par une distance continue [P] round1.
- Entrées : domaine, sous-domaines, TLD, chemin ; liste de marques de référence (dans `state`, fixée par le code) ; âge du domaine (code). Sorties : choice `marque_imitée` {liste fixe + aucune + incertain}, noul `sosie`, score `similarité`.
- Modèle : flash ; entrée de ~60 jetons : très rapide et bon marché.
- Défaillance : domaine homoglyphe (Unicode) non rendu correctement ; faux positifs sur sites légitimes de la marque (partenaires) ; injection par le nom de domaine/sous-domaine (rare mais possible).
- Ablation : domaines sosies publics (PhishTank/OpenPhish ou équivalents) et domaines légitimes ; B0 = distance continue + combosquatting par motifs ; B1 = logistique sur n-grammes ; M. Beaucoup de positifs disponibles (milliers) : seul rôle où n≥400 est facile.
- Place : **chemin critique possible** (court, bon marché, flash). Verdict : **utile**.

### R16. Tri des incidents pour le dossier de preuve
- Apport : classer chaque incident (type, gravité, canal) pour préremplir le dossier utile à un dépôt de plainte. Les champs sont déjà connus du code (verdict, règle déclenchée) ; le modèle n'ajoute que de l'interprétation, dans un document à portée juridique.
- Défaillance : erreur de classement dans une pièce qui peut être opposée ; pas de valeur de preuve (journal haché + rejeu indépendant, round1 §2.5).
- Place : hors chemin ; verdict : **décoratif** pour 36 h (le code remplit tous les champs).

### R17. Désaccord entre modèles comme signal (Jev vs Clef-flash vs Clef)
- Apport : un signal d'incertitude pas cher : si deux modèles de familles différentes ne s'accordent pas sur un message ou un domaine, escalader d'un cran. C'est le "trois avis, un désaccord = on demande" de OC §4 idée 3. Les modèles partagent peut-être des faiblesses [V] OC ; le gain est donc incertain.
- Sorties : désaccord booléen (choice différent) et écart de probabilités. Latence = la plus lente (Jev 524 ms déclaré).
- Défaillance : désaccord fréquent sur cas légitimes → FP ; coût : une clé Jev à fournir par l'utilisateur.
- Ablation : sur le jeu de R3/R15 ; mesure = le désaccord prédit-il les erreurs de M ? (AUC de désaccord vs erreur) ; B0 = marge de probabilité d'un seul modèle (top moins second). Si AUC n'est pas supérieure à la marge seule, retirer.
- Place : composition de R3/R15/R13. Verdict : **utile (hypothèse à tester)**.

### R18. Contrôle de dérive d'intention le long du flux (la phrase de départ est-elle toujours respectée ?)
- Apport : noul "l'étape en cours correspond-elle à la phrase de départ ?" (OC §4 idée 4). Face au comparateur par étape : quasi nul si l'intention est structurée ; utile seulement si l'intention reste en texte libre.
- Défaillance : l'intention de départ peut provenir d'un message piégé ; faux positifs ; demande un flux multi-étapes à fabriquer (5-8 h).
- Ablation : scénarios scriptés, n faible, non concluant. Place : scénario scripté. Verdict : **décoratif** pour la démo (un scénario scripté ne mesure rien).

## 2. Tableau de synthèse

| # | Rôle | Modèle | Chemin | Gain face à B1 plausible | Verdict |
|---|---|---|---|---|---|
| R1 | Phrase → intention | flash (+Jev) | critique léger | modéré, resserrement seul | utile sous contrainte |
| R2 | Questions adaptatives | flash | hors | nul | décoratif |
| R3 | Message collé | flash/Clef/Jev | avant signature | oui (paraphrase, FR) | **utile** |
| R4 | Cohérence (intention, effet) | Clef | ombre | non | dangereux / décoratif |
| R5 | Triage d'opacité | flash/Jev | escalade | douteux (B1 probable) | utile mais pari |
| R6 | Notation de contrepartie | – | – | aucun | dangereux |
| R7 | Explication | – | – | aucun (pas de texte) | décoratif |
| R8 | Vision | Clef | hors (asynchrone) | oui en théorie | utile, risqué |
| R9 | Manipulation (conversation) | Clef | avant signature | oui | **utile** |
| R10 | Agrégation | – | – | non (logistique) | dangereux |
| R11 | Génération d'attaques | – | – | impossible | décoratif |
| R12 | Juge d'avertissements | – | hors ligne | non | décoratif |
| R13 | Détection d'injection | flash | parallèle | modeste | utile modeste |
| R14 | Calibrage de seuils | – | – | aucun | dangereux |
| R15 | Domaine sosie | flash | critique possible | oui | **utile** |
| R16 | Tri des incidents | – | hors | aucun | décoratif |
| R17 | Désaccord de modèles | 2-3 modèles | composé | à tester | utile (hypothèse) |
| R18 | Dérive d'intention | flash | scénario | non mesurable | décoratif |

## 3. Les 5 usages qui valent vraiment le coup (classés)

1. **R3 + R9 : analyse du message/conversation collé** (faux support, urgence, "dicte la case", isolement). Raison : seul endroit où le texte libre est inévitable, où B0 manque les paraphrases et le français, où l'erreur "aggraver à tort" coûte une friction, pas un blocage, et où le résultat sert au durcissement des seuils (mode "on m'a demandé", cooling-off) face à la fraude conforme que l'intention ne voit pas. Risque : injection (fausse alerte seulement, voir §5). Condition : 300+ positifs réels, bras B1.
2. **R15 : origine domaine/URL sosie.** Court, bon marché, chemin critique possible, beaucoup de données publiques pour l'ablation. Gain probable sur combosquatting face à la distance seule. Condition : liste de marques fixée par le code.
3. **R5 : triage d'opacité** pour ordonner l'escalade. Pertinent pour les cas complexes (multicall, contrat neuf, signature opaque), mais mon pronostic est que B1 sur les mêmes features l'égale ; le publier comme résultat s'il perd.
4. **R1 : phrase libre → intention, strictement resserrante** (l'intention effective = la plus stricte entre boutons et modèle). C'est le **plus risqué du top 5** : il touche l'entrée du comparateur ; une erreur élargit le permis. À réserver à l'option "texte libre" et à bornes strictes.
5. **R13 + R17 : hygiène (détection d'injection et désaccord de modèles)** comme signaux supplémentaires parallèles au R3 et R15. Peu coûteux (questions supplémentaires dans le même appel), faciles à ablater (100 chaînes adverses). Ne vend pas une garantie.

**Le plus "wow"** : R8 (vision, capture d'un faux site ou d'une fausse fenêtre wallet) montré en démo pré-enregistrée ; à l'intérieur du top 5, le "wow" est R3 en direct (coller un message de faux support, voir la jauge et les deux signaux qui pèsent, OC idée 1). **Le plus risqué** : R1 pour la sécurité, R8 pour la faisabilité (13-30 s, base64, fuite de capture).

## 4. Les 5 usages à ABANDONNER et pourquoi

1. **R14 calibrage de seuils par modèle** : la calibration est une procédure statistique sur étiquettes, pas une opinion ; un modèle qui choisit un seuil ruine la reproductibilité (jury : "jeu gelé", ECE sur 200 phrases).
2. **R10 agrégation des signaux faibles par modèle** : déplace la décision hors du code, non rejouable ; une logistique/arbre monotone fait mieux, est calibrée et explicable.
3. **R6 notation de contrepartie en texte** : le modèle ne connaît pas le monde, le texte est contrôlé par l'adversaire ; fausse assurance.
4. **R7 explication en langage clair** : impossible sans génération de texte ; et un générateur de texte sur l'écran de signature est un canal d'injection. Gabarits codés.
5. **R4 jugement de cohérence (intention, effet) comme décideur** (et R11 génération d'attaques, R12 juge d'avertissements, R16, R18, R2 au rang "décoratif") : doublon du comparateur en code, moins fiable, circulaire. R4 se garde en mode ombre pour explorer les cas que le comparateur rate, sans effet sur le verdict.

## 5. Sécurité : pourquoi jamais seul garde-fou, et comment le contraindre

**Pourquoi** : (a) un verdict manipulé reste un verdict valide ("légitime" à 0,99) ; la littérature d'attaque vise le verdict [P] OC ; (b) pas de calibration, d'étalon FR ni de test d'injection publiés pour Clef/Jev (non trouvé) ; (c) biais de position et sensibilité à la formulation [P/S] ; (d) les VLM font confiance au texte plutôt qu'à l'image [P] arXiv 2503.02199 ; (e) l'entrée (message, domaine, capture) est contrôlée par l'adversaire ; (f) un modèle partage ses défauts d'un appel à l'autre : les décisions répétées ne sont pas indépendantes ; (g) un juge ne doit pas noter ses propres devoirs (Lakera [V]). Un garde-fou unique est aussi un point unique de panne (quota de 10 000 Neurons/jour, latence variable en première semaine).

**Comment (cinq contraintes de conception)** :
1. **Sortie énumérée** : seuls noul/choice/score, options fermées avec toujours "autre/incertain" ; aucune valeur libre n'atteint une action ; entités (IBAN, domaine, bénéficiaire) extraites par code et vérifiées contre des listes de confiance.
2. **Monotonie** : verdict_final = max(verdict_code, f(modèle)) avec f ≥ "ok". Le modèle ne peut pas descendre un verdict. Conséquence structurelle : **une injection réussie ne fait pas passer un drainer** (0 baisse de risque garantie par construction, pas par test) ; son pire effet est une fausse alerte (déni de service par fatigue). Il faut donc un **budget de friction** : plafond de verdicts aggravés par le modèle par fenêtre de temps, taux d'interruption mesuré (O3 §6.2). Exception à surveiller : R1 (intention) et le tri R5 ; règle : le modèle ne peut que *resserrer* l'intention permise et ne peut jamais pousser un cas sous son rang par défaut dans la file d'escalade.
3. **Accord de plusieurs signaux pour le niveau le plus fort** : le modèle seul plafonne à `warn` (friction) ; `block`/retenue exige un signal de code indépendant (adresse neuve, spender externe R3, droit illimité, similarité d'adresse) ou l'accord de deux modèles de familles différentes. Le banc a déjà un signal de code robuste (spender compte externe : 80,4 % de rappel pour 0,23 % de trafic légitime [P] RAPPORT) ; le modèle ne doit servir qu'à ajouter du rappel.
4. **Isolation** : l'entrée non fiable va dans `state` avec délimiteur aléatoire, jamais dans les `instructions` ; le contenu de la transaction (nom de jeton, memo) n'entre jamais dans un prompt de décision [P] O3 §3 ; sortie du modèle jamais affichée en texte libre ; texte d'attaquant échappé à l'affichage ; images recompressées, OCR séparé en code.
5. **Panne et latence** : timeouts durs (≈ 800 ms pour flash, abandon sans effet), "indéterminé" = au moins `warn`, jamais `ok` par défaut ; en panne, le verdict du code s'applique seul (monotonie = repli sûr). Journal : version du modèle, version des questions, probabilités brutes, seed, hachage chaîné.

**Contrôle continu** : ablation avant chaque version, 100 chaînes adverses, 2 passes avec options mélangées (accord exigé, sinon abstention), seuil et calibration en code, publication des résultats négatifs.

## 6. Plan 36 h (ordre des tests)
1. Heure 0-4 : constituer le jeu gelé haché (messages réels, domaines sosie publics, 100 chaînes d'injection), double étiquetage, kappa.
2. Heure 4-12 : bras B0, B1 sur R3/R15/R13 (aucun appel de modèle nécessaire) → plancher.
3. Heure 12-24 : appels Clef-flash, Jev, Clef (quota gratuit ≈ 7 000 requêtes de 400 jetons par jour sur flash [calcul N1] : prévoir le cache et ne pas dépasser) ; mesurer latence réelle, `confidence`, injection, français.
4. Heure 24-32 : composition monotone, tableaux de rappel à FP égal, IC de Wilson, test pairé.
5. Heure 32-36 : retenir ce qui passe la barre +5 points sur B1 ; le reste en "testé, non retenu".
À fournir par l'utilisateur : identifiant de compte et jeton Cloudflare (jamais par moi), clé Jev éventuelle.

## Sources
- Lus localement : N1, N2, OC, O3, round1_synthese, RAPPORT_banc_reel_v0 (voir en-tête). Les URL Cloudflare/HF/Register/flaviocopes citées sont celles de N1 et OC, non relues ici.
- Nouveau (résumés de recherche, pages non lues en entier) : https://arxiv.org/pdf/2306.05816 [P], https://arxiv.org/pdf/2503.02199 [P], https://arxiv.org/html/2306.05685v4 [P, chiffres de cohérence 65 % via résumé [S]], https://oar.a-star.edu.sg/communities-collections/articles/21628 [S], https://lakera.ai/blog/stop-letting-models-grade-their-own-homework-why-llm-as-a-judge-fails-at-prompt-injection-defense [V via OC].
- Non trouvé : toute évaluation publique de Clef ou Jev sur la fraude crypto, sur le français, sur l'injection ; toute précision/FP publiée pour un classifieur de captures de faux sites crypto sur une matrice de confusion complète.

## Résumé en 8 lignes
1. 18 rôles examinés ; Clef/Jev ne génèrent pas de texte : explication, génération d'attaques et rédaction d'avertissements sont impossibles ou inutiles.
2. Règle clé : le modèle ne peut qu'aggraver, donc il n'abaisse jamais les faux positifs (31/1000 Ethereum au banc) : son seul gain mesurable est du rappel à FP égal.
3. Barre d'ablation : +5 points de rappel à FP égal face à B1 (logistique TF-IDF), pas face à une règle ; il faut 300-400 positifs pour le prouver (calcul), sinon "non concluant".
4. Top 5 : message/conversation collé (R3+R9), domaine sosie (R15), triage d'opacité (R5), intention libre resserrante (R1), hygiène injection+désaccord (R13+R17).
5. Plus risqué : R1 (touche l'entrée du comparateur) ; plus "wow" : vision de la capture (R8, démo pré-enregistrée, 13-30 s) et le message collé en direct.
6. À abandonner : calibrage par modèle, agrégation par modèle, notation de contrepartie, explication, jugement de cohérence comme décideur.
7. Sécurité : sortie énumérée, monotonie (une injection ne peut produire qu'une fausse alerte, d'où un budget de friction), `block` exigeant un signal de code ou deux modèles, entrée isolée, panne = verdict du code seul.
8. Honnêteté : aucun appel de modèle fait ici, rien de mesuré sur Clef/Jev ; calibration, français et injection restent "non trouvé" ; pronostic : B1 battra probablement le modèle sur R5.
