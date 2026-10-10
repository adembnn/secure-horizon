# Signal de contrainte : critique red team / usable security (10 oct. 2026)

Statut des faits : [V] = vérifié sur page ouverte aujourd'hui ; [F] = repris de `wrench_attacks_factcheck.md` ; [AV] = à vérifier ; [INF] = inférence/calcul de ma part.

## TL;DR
- Idée d'Adem (modifier les 4 derniers caractères) : elle existe déjà et elle est livrée. Coldcard "Delta Mode" exige un PIN de contrainte de même longueur que le PIN principal, différant uniquement des 4 dernières positions [V]. Mais il connecte à la VRAIE seed et fait produire des signatures invalides : c'est un piège passif, pas un leurre de fonds.
- Appliquée telle quelle à une seed BIP-39, l'idée échoue : changer le 12e mot donne un checksum invalide 15 fois sur 16 (refus par le wallet du ravisseur) et, 1 fois sur 16, un wallet totalement sans rapport et vide (PBKDF2 : aucune proximité entre seeds proches) [V pour la règle checksum, INF pour le reste]. Elle ne marche que si le wallet de destination a été créé et financé à l'avance : d'où la version "passphrase dérivée par règle" (section b.3).
- Aucun signal de contrainte explicite n'est robuste contre un ravisseur informé (il exige "toutes les passphrases", vérifie sur son appareil, peut tester les deux codes : 50 % de réussite en devinant [V Wikipedia]). Prévalence ~très faible : un détecteur qui bloque ou alerte est inutilisable (calcul section 3).
- Recommandation : (g) délai par défaut sur les grosses sorties + veto des gardiens (e) comme mécanisme porteur ; un score contextuel on-device (c, f) qui ne bloque jamais mais module la durée du délai et déclenche l'alerte aux gardiens ; un code de contrainte (a/b) en canal secondaire optionnel, jamais comme seule défense. Pas de biométrie.
- Démo 2 min : ravisseur prend le téléphone, victime donne le "mauvais" PIN, le virement part dans la file avec compte à rebours, gardien reçoit l'alerte et fait veto, le ravisseur voit "retrait programmé dans 72 h".

## 1. Rappel des faits qui contraignent le design
- Taux de paiement des tentatives : 26 % S1 2026, 49 % en 2025, 67 % en 2024 [V] https://theblock.co/post/410984/more-than-30-million-stolen-in-violent-crypto-attacks-in-2026-as-france-emerges-as-wrench-attack-hotspot-chainalysis
- Chainalysis relie la baisse à la vague moins ciblée en France (attaquants moins renseignés). Cause racine probable : fuites de données (agent fiscal accusé d'avoir vendu des dossiers ; fuite Waltio ~50 000 utilisateurs) ; 93 % des victimes françaises sont locales (repérage préalable) [V, même source]. Conséquence design : le ravisseur peut connaître l'ordre de grandeur du patrimoine ; un leurre trop pauvre sera détecté.
- Lopp : "il devrait être volontairement difficile de déplacer de gros montants" ; escalade de violence si pas de remise immédiate ; 66 % de réussite, 20-25 % de signalement, 2-3 semaines de torture dans un cas (la victime n'a rien donné) [V] https://www.lopp.net/transcripts/presentations/Bitcoin_2025-Wrench_Attacks.txt . Sa conférence ne traite NI des leurres NI des PIN de contrainte : l'affirmation "Lopp n'a aucune donnée d'efficacité" vient de l'article Cointelegraph repris dans le fact-check [F, non rouvert ici]. Ne pas l'attribuer à la conférence.
- Wikipedia "Duress code" : aucune statistique d'usage ni de fausses alarmes publiée ; la FTC 2010 a conclu qu'aucun distributeur n'avait déployé de PIN de contrainte et que le coût dépasserait la valeur dissuasive ; un adversaire qui connaît le système peut forcer à tester les deux codes (50 % en devinant) [V] https://en.wikipedia.org/wiki/Duress_code . Il ne faut donc pas promettre un "taux d'usage réel des codes d'alarme" : je n'ai trouvé aucune donnée primaire.

## 2. Grille d'évaluation (1 = mauvais, 5 = bon)
Colonnes : FP = faible faux positif ; FN = faible faux négatif ; SF = faible sang-froid exigé ; IND = indétectable/non contournable par un ravisseur informé ; REP = faible risque de représailles ; DEMO.

| Candidat | FP | FN | SF | IND | REP | DEMO | Verdict |
|---|---|---|---|---|---|---|---|
| a. PIN/passphrase de contrainte | 5 | 2 | 2 | 1-2 | 1 | 5 | Canal secondaire seulement |
| b. 4 derniers caractères modifiés (brut) | 4 | 1 | 3 | 1 | 1 | 4 | Inutilisable tel quel ; viable en variante b.3 |
| c. Signaux contextuels on-device | 2 | 3 | 5 | 3-4 | 4 | 5 | Retenu comme score (module le délai) |
| d. Biométrie passive | 1 | 2 | 5 | 2 | 3 | 2 | Rejeté |
| e. Dead man / gardiens / veto | 4 | 3 | 5 | 4 | 3 | 4 | Retenu (porteur) |
| f. Signaux chaîne | 3 | 3 | 5 | 4 | 4 | 4 | Retenu (post-tx, alerte) |
| g. Délai par défaut | 5 | 4 | 5 | 4 | 3 | 5 | Retenu (porteur) |

Notes de notation : ce sont des jugements d'expert (INF), pas des mesures.

## a. PIN / passphrase de contrainte
Faits [V] https://coldcard.com/docs/settings/ :
- Duress Wallet : le PIN ouvre directement un wallet de contrainte (BIP-85 #1-3 ou Legacy), "sans effet de bord" ; la doc dit que l'appareil "fonctionne comme d'habitude" mais qu'"un attaquant techniquement compétent pourrait détecter la différence" ; conseil : n'y mettre que ce qu'on peut perdre.
- Autres Trick PIN : Brick Self (irréversible), Wipe Seed (4 variantes dont Silent Wipe et Wipe vers wallet de contrainte), Login Countdown (simule 1 h), Look Blank (apparence d'un appareil vidé), Delta Mode, brick automatique après 13 essais faux.
- BIP-39 : toute passphrase produit une seed valide "et donc un wallet déterministe" ; seule la bonne révèle le wallet voulu [V] https://raw.githubusercontent.com/bitcoin/bips/master/bip-0039.mediawiki . Il n'y a donc aucun message d'erreur pour une passphrase fausse : bon pour le déni plausible, mauvais pour les fautes de frappe.
- Trezor : passphrase non stockée, mauvais passphrase = wallet vide, pas de preuve d'existence [F] ; le Labeling de Suite peut mémoriser le wallet caché [F].

Critique :
- FN : le ravisseur qui sait ("toutes les passphrases", "montre-moi les 2 wallets") ou qui compare au patrimoine connu (fuites de données) démasque un leurre pauvre. Lopp/Cointelegraph : un cas d'échec de leurre et un cas de torture malgré coopération [F].
- Représailles : élevées si découvert (wallet vide = victime soupçonnée de mentir). Coldcard donne le piège de Wipe/Brick : irréversible, la victime perd ses fonds sans retenir l'agresseur.
- Sang-froid : il faut se rappeler un second code différent du premier sous stress. La littérature de psychologie (stress aigu et récupération mnésique/mémoire de travail préfrontale : de Quervain et al. 1998 Nature Neuroscience ; Arnsten 2009 Nature Reviews Neuroscience) va dans ce sens, mais je n'ai pas pu ouvrir ces pages (redirections/paywall) : [AV] à citer comme pistes, pas comme faits vérifiés.
- Pas d'efficacité mesurée publiquement [F].

## b. L'idée d'Adem, à fond

### b.1 Ce qui existe déjà
Coldcard Delta Mode [V] https://coldcard.com/docs/settings/ : le Trick PIN "doit avoir la même longueur que le PIN principal et ne différer que dans les 4 dernières positions" ; il connecte à la vraie seed, laisse l'attaquant faire "la plupart des choses" mais "produit des transactions et des signatures de messages dérivées de la seed invalides" ; certaines actions qui révéleraient des secrets effacent la seed ; mode "avancé, plus risqué, pas une session normale". Donc l'intuition (PIN proche du vrai, règle mémorisable) est validée par un fabricant, avec la bonne contrainte (variation limitée aux 4 derniers).
Limites : (i) la tx signée est invalide : le ravisseur le voit à la diffusion (rejet réseau) en quelques secondes à minutes et revient, éventuellement violent ; (ii) un seul niveau de leurre, il ne produit pas de fonds crédibles ; (iii) il faut le matériel Coldcard.

### b.2 Ce qui se passe techniquement avec une seed ou un PIN "modifié"
- PIN modifié sur un appareil classique : erreur, compteur d'essais décrémenté ; sur Coldcard, brick à 13 faux [V]. Le ravisseur voit immédiatement l'échec.
- Seed BIP-39 de 12 mots : 128 bits d'entropie + 4 bits de checksum (= ENT/32, issus de SHA-256) [V BIP-39]. Le 12e mot porte 7 bits d'entropie + 4 bits de checksum [INF dérivé] : sur 2048 mots, 128 sont valides, soit 1 sur 16. En changeant le dernier mot : 15/16 de chances de checksum invalide → l'appareil/appli du ravisseur affiche une erreur ou refuse (UI selon le logiciel, non testé ici [AV]) ; 1/16 : seed valide mais sans lien avec la vraie, donc wallet vide. La dérivation passe par PBKDF2-HMAC-SHA512, 2048 itérations, sel "mnemonic"+passphrase [V] : une seed proche n'est pas un wallet proche.
- Pour la "clé" (clé privée brute / xprv) : un octet modifié donne une autre clé valide, adresse sans fonds. Même résultat que le wallet vide.
- Le ravisseur vérifie-t-il ? Oui, très probablement : importer une seed dans une appli et consulter un explorateur prend quelques minutes, et il peut le faire sur son propre appareil [INF]. Un wallet vide ou une erreur = échec, donc représailles.

### b.3 Versions qui marchent
1. Passphrase de contrainte dérivée par règle (25e mot) : la seed 12/24 mots est identique ; le wallet réel = seed + P ; le wallet leurre = seed + f(P) où f est la règle de la victime (ex. 4 derniers caractères inversés, ou +1 sur chaque). Le wallet leurre est créé et financé à l'avance (montant plausible et historique de quelques tx). Avantages : un seul secret à retenir plus une règle courte ; BIP-39 n'émet jamais d'erreur [V] ; le ravisseur qui ouvre le leurre sur son appareil voit un solde non nul. Limites : (i) la règle f ne doit PAS apparaître dans la doc publique du produit sous forme paramétrique fixe (sinon, "essaie f(P)" ; choisir une règle par utilisateur, stockée uniquement dans la tête) ; (ii) l'attaquant qui exige P, f(P) et "toutes les variantes" voit la seed entière ; (iii) toujours le problème du solde plausible face aux fuites de données.
2. Seed de contrainte avec derniers mots choisis : pour obtenir une seed leurre valide, on fait varier le 12e mot jusqu'à obtenir un checksum valide (1 chance sur 16 par essai) : le wallet associé est sans lien avec le vrai, créé et financé à l'avance. Cela revient à posséder une seconde seed ; la règle mnémotechnique sert uniquement à s'en souvenir (mots 1-8 identiques, 9-12 différents). Risque : les 8 premiers mots identiques à la vraie seed ne réduisent pas la sécurité de la vraie seed car 4 mots × 11 bits seulement sont connus, mais révèlent 88 bits de la vraie seed si le ravisseur voit les deux [INF] : à éviter, mieux vaut une seed leurre totalement indépendante.
3. PIN de contrainte Coldcard (duress wallet BIP-85) : même idée au niveau du PIN, solde leurre, sans trace visible ; règle "4 derniers chiffres" imposée seulement par Delta Mode.
4. Dans notre produit (logiciel) : la règle f(PIN) alimente un mode "wallet leurre" avec un état simulé (solde crédible, historique synthétique) ; la validation d'une tx dans ce mode crée une entrée en file d'attente avec alerte silencieuse. Le ravisseur ne voit aucune différence d'interface.

Verdict : ne pas livrer l'idée brute ; la présenter comme "règle de dérivation personnelle d'un code de contrainte, mappée sur un wallet leurre financé" et montrer le calcul BIP-39 1/16 en démo (c'est un fait vérifiable en direct).

## c. Signaux comportementaux / contextuels on-device
Calculables en 24 h sur données synthétiques (générateur de profils avec transactions, géoloc, heure, appareils) :
- Montant relatif à la médiane de l'utilisateur (z-score / rang) ; destinataire jamais vu ; heure hors habitudes ; vitesse de vidage (part du solde sortie en < 1 h) ; nombre de tx successives ; appareil de confiance absent ; montre BT absente ; géoloc inhabituelle ; vitesse de déplacement impossible. Tous simples (règles ou régression logistique), explicables au jury.
- Peu fiables / hors portée 24 h : cadence de frappe (nécessite capture réelle, bruitée), "jamais la nuit" comme règle dure (un retrait légitime nocturne existe).
- Faux positifs : forts. Voyages, téléphone neuf, achat important légitime déclenchent tous ces signaux. Prévalence quasi nulle (calcul ci-dessous).
- Contournement par le ravisseur : il force la victime à ne virer qu'à un destinataire connu (peu probable : il veut ses propres adresses), à faire des tx en journée, à fractionner. Il peut emmener le téléphone chez la victime (contexte "normal"), et lui imposer l'appareil de confiance : les signaux d'appareil/montre sont donc contournables, les signaux de destinataire neuf et de montant sont les plus durs à éviter pour lui.
- D3FEND : D3-UBA (User Behavior Analysis) [V https://d3fend.mitre.org/technique/d3f:UserBehaviorAnalysis/], D3-UGLPA (User Geolocation Logon Pattern Analysis) [V https://d3fend.mitre.org/technique/d3f:UserGeolocationLogonPatternAnalysis/], D3-ANET (Authentication Event Thresholding) [V https://d3fend.mitre.org/technique/d3f:AuthenticationEventThresholding/].

Calcul de la base rate [INF, hypothèses explicites, à ne pas présenter comme donnée] : soit une tx "grosse" sur 10 000 qui est sous contrainte (p = 1e-4, déjà très généreux), taux de vrais positifs 90 %, taux de faux positifs 1 % : précision = 0,9e-4 / (0,9e-4 + 0,01 × 0,9999) ≈ 0,9 %. Il faut donc que la décision soit réversible et peu coûteuse (délai, alerte à un gardien), jamais un blocage définitif.

Courbe présentable au jury : précision/rappel et FP par utilisateur-mois sur un jeu synthétique mixte (profils sains + scénarios de contrainte injectés). Honnêteté obligatoire : les scénarios de contrainte sont écrits par nous (circularité) ; l'annoncer, montrer plusieurs seuils et la précision à prévalence réaliste (≈1e-4 ou moins), pas seulement sur un jeu équilibré.

## d. Biométrie passive
- État de l'art [F] : aucune validation produit ; brevets (voix, GSR, pupille, rythme cardiaque) ; étude insider-threat ECG/EEG 86 % de précision de détection du stress avec matériel spécialisé https://arxiv.org/pdf/2005.02862 ; aucun taux de faux positifs duress publié. Spoofing GAN >50 % de trompés en ≤10 essais [F, source primaire non ouverte].
- Pourquoi c'est un piège : effort, urgence, émotion légitime ressemblent à la contrainte (FP) ; à la base rate ci-dessus, précision de quelques pourcents ; le ravisseur peut rassurer la victime ou la droguer (scopolamine citée par Lopp [V]) ; et surtout, une victime calme et soumise ne génère pas de signal. Aucune mesure défendable en 24 h sans données réelles. À écarter ; en parler seulement comme limite.

## e. Dead man's switch, check-in, gardiens
- Absence de check-in : un ravisseur qui séquestre contrôle aussi l'agenda ; il peut faire répondre la victime ; les proches, eux, voient une absence. Bon pour la détection d'une séquestration longue (enlèvements = 52 % des incidents 2026 [F]), mauvais pour une prise de 20 minutes.
- Gardiens et veto : Argent (escape ~1 semaine selon un audit 2023 [F]) ; Safe + Zodiac Delay (file d'attente, saut de nonce pour annuler) [F https://github.com/gnosisguild/zodiac-modifier-delay] ; ERC-8238 brouillon (solde chaud plafonné, coffre froid timelock 24-72 h, bypass 2-sur-3, annulation) [F https://ethereum-magicians.org/t/erc-8238-coercion-resistant-vault/28130].
- Contournements : ravisseur qui cible les gardiens (la cible de proches/connaissances = 25-30 % des cas, >40 % en France [F]) ; gardiens identifiés par fuite ; victime obligée d'appeler les gardiens pour "approuver" (contrainte à distance). Parade : gardiens non identifiables par la victime seule (au moins un gardien institutionnel/anonyme) et délai que personne ne peut raccourcir.
- FP : un gardien qui rejette une tx légitime ; coût modéré avec un délai (la tx repart après l'attente). Sang-froid : aucun, la victime n'a rien à faire de particulier.

## f. Signaux côté chaîne
- Destinataire jamais vu, vidage total, tx en dehors des horaires, sortie vers bridge/DEX/exchange sans KYC dans l'heure. Chainalysis : les fonds bougent vite on-chain, certains vers des CEX sans dissimulation, d'autres via DEX, bridges et services de blanchiment [V The Block ci-dessus].
- Sert deux usages : (1) pré-tx comme composante du score ; (2) post-tx pour la réponse : alerte, notification d'exchange, dossier de traçage pour la police (affaire Balland : traçage et gel via plateforme [F]). Pas de promesse de récupération : le gel exige réquisition judiciaire [F].
- FN : le ravisseur envoie à une adresse neuve (c'est justement ce qu'on détecte) ou la victime est forcée à un hop intermédiaire.
- Calculable en 24 h : oui, sur une chaîne de test ou des données synthétiques ; ne pas utiliser de vraies adresses de victimes (règle projet : aucune donnée personnelle réelle).

## g. Inversion : délai par défaut, sans signal
- Binance Withdraw Protection (1-7 jours, mode strict sans annulation anticipée, le support ne peut pas lever) [F https://coinmarketcap.com/academy/article/bbinance-withdrawal-lock-wrench-attacks] ; SwissBorg 1-90 jours, annoncé le 10 fév. 2026 [F https://www.theblock.co/post/389265/swissborg-introduces-withdrawal-protection-to-safeguard-against-physical-attacks].
- Psychologie du ravisseur [INF] : si le produit est connu, il sait qu'il n'y a rien à obtenir sur place ; l'attaque perd son intérêt. Le recul du taux de paiement (67 % → 26 %) est observé [V], mais Chainalysis l'explique par la vague moins ciblée en France, pas par ces protections : ne pas présenter la corrélation comme preuve d'effet dissuasif.
- Limites : séquestration pendant la durée du délai (72 h) ; ciblage des gardiens ; il faut activer en amont ; l'utilisateur légitime subit un coût (pas de retrait urgent) → prévoir un plafond "chaud" pour les petits montants (idée de ERC-8238 [F]) ; risque de représailles si le ravisseur apprend qu'il n'y a rien à gagner et décide d'être violent pour punir [INF, aucune donnée].
- Aucun signal à détecter : pas de faux positif ni de sang-froid. Le délai est un contrôle de politique, pas un détecteur ; pour la note "détection 30 %" il faut donc lui adjoindre le score (c, f) qui décide de la durée et de l'alerte.

## 3. Recommandation
(i) Sécurité réelle de la victime :
1. Délai par défaut au-delà d'un plafond chaud, avec veto de gardiens (g + e). Compatible avec le délai on-chain que la victime ne peut pas raccourcir [F].
2. Aucune action de la victime qui puisse la mettre en danger : un seul PIN en usage normal, un code de contrainte facultatif (variante b.3 : wallet leurre financé, jamais Wipe/Brick par défaut).
3. Alerte silencieuse aux gardiens, sans notification visible sur l'écran du ravisseur.
4. Hygiène des données : réduire ce qui fuit (cause racine Chainalysis) ; hors périmètre code mais à mentionner.

(ii) Note "efficacité de détection 30 %" : mesurer sur scénario réaliste (enlèvement avec virement vers adresse neuve de 80 % du solde, de nuit, depuis un lieu inhabituel) :
- score contextuel (montant relatif, destinataire neuf, vitesse de vidage, heure, appareil/lieu) ;
- métriques : précision, rappel, FP/utilisateur-mois, temps de détection (de la soumission à l'alerte), temps de réponse (de l'alerte au gel/veto) ;
- rapport honnête à prévalence réaliste ; la valeur du système = temps de détection court + FP à coût faible (délai, pas blocage).

(iii) Démo de 2 min :
0:00 contexte (30 s, ravisseur à l'écran) ; 0:30 la victime entre le code de contrainte (règle personnelle) → wallet leurre financé, calcul BIP-39 1/16 affiché ; 1:00 le ravisseur ordonne un virement : tx en file avec compte à rebours, score affiché (montant, destinataire neuf) ; 1:30 le gardien reçoit l'alerte et fait veto ; 1:50 tableau des métriques.

Mapping des signaux retenus :

| Signal | NIST CSF 2.0 | ATT&CK / D3FEND |
|---|---|---|
| Score contextuel (c) | DE.CM (surveillance continue), DE.AE (analyse des événements anormaux) | T1078 Valid Accounts (usage de comptes valides par contrainte) ; T1657 Financial Theft ; D3-UBA, D3-UGLPA, D3-ANET |
| Signaux chaîne (f) | DE.CM, DE.AE, RS.AN (analyse d'incident) | T1657 ; D3FEND : pas d'ID vérifié trouvé pour l'analyse de transaction blockchain [AV] |
| Délai + veto gardiens (g, e) | RS.MI (atténuation), RS.MA (gestion d'incident), PR.AA (contrôle d'accès) | T1657 ; D3-UAP et D3-ACH [AV, déjà signalés à confirmer dans le fact-check] |
| Alerte aux gardiens | RS.CO (communication de la réponse) | n/a |
| Code de contrainte (a/b) | PR.AA | T1078 ; leurre : famille D3FEND "Decoy" (D3-DE...) [AV] |
Notes : [V] pour les sous-catégories NIST citées par leur nom : à confirmer sur la publication NIST CSWP 29 avant le rapport [AV]. Les références ATT&CK n'incluent aucune technique spécifique "coercition physique" [AV, non vérifié ici] ; OWASP Agentic (ASI) : sans objet sauf si un agent déclenche le repli (ASI03) [F].

## 4. Objections du jury et réponses
1. "Le ravisseur lit votre doc et exige toutes les passphrases." → Le code de contrainte n'est pas la défense principale ; la défense est le délai que personne ne peut raccourcir. Un ravisseur qui exige tout obtient une file d'attente, pas des fonds.
2. "Votre précision sur données synthétiques ne prouve rien." → Exact : scénarios écrits par nous, le dire ; on rapporte la précision à prévalence réaliste (≈1e-4) et l'impact opérationnel (FP = délai, pas blocage).
3. "Prévalence trop faible, vous allez alerter à tort." → Alerte aux gardiens seulement au-dessus d'un seuil élevé ; seuil bas = juste un délai ; calcul de base rate montré.
4. "Il séquestre la victime 72 h." → Limite connue. Le délai raccourcit l'intérêt économique ; les gardiens signalent à la police ; le vidage ne se fait pas sous la main du ravisseur. Pas de promesse de sécurité physique.
5. "Il cible les gardiens." → Gardiens multiples, dont un non identifiable par la victime ; seuil 2-sur-3 ; limite admise.
6. "Et la biométrie ?" → Aucun produit validé, FP et spoofing [F] ; écartée.
7. "Votre idée de 4 derniers caractères, Coldcard le fait déjà." → Oui (Delta Mode) ; nous la rendons utile en la reliant à un wallet leurre financé ; nous citons Coldcard.
8. "Représailles si le leurre est découvert." → Oui, risque réel ; c'est pourquoi le leurre n'est pas la défense principale et que le montant doit être plausible.
9. "Pourquoi pas Binance Withdraw Protection ?" → Excellent mais custodial et à activer en amont ; nous portons la même idée en self-custody avec gardiens et score contextuel.
10. "Quelle preuve d'efficacité dissuasive ?" → Aucune ; la baisse du taux de paiement a une autre explication selon Chainalysis. Nous ne revendiquons que le temps de détection et de réponse.

## Sources
- BIP-39 : https://raw.githubusercontent.com/bitcoin/bips/master/bip-0039.mediawiki
- Coldcard Trick PINs / Delta Mode : https://coldcard.com/docs/settings/
- Lopp, conférence Bitcoin 2025 : https://www.lopp.net/transcripts/presentations/Bitcoin_2025-Wrench_Attacks.txt
- Chainalysis via The Block : https://theblock.co/post/410984/more-than-30-million-stolen-in-violent-crypto-attacks-in-2026-as-france-emerges-as-wrench-attack-hotspot-chainalysis
- Wikipedia, Duress code : https://en.wikipedia.org/wiki/Duress_code
- D3FEND : https://d3fend.mitre.org/technique/d3f:UserBehaviorAnalysis/ ; .../d3f:UserGeolocationLogonPatternAnalysis/ ; .../d3f:AuthenticationEventThresholding/
- Autres : voir `research/docs/wrench_attacks_factcheck.md`.

## Non vérifié (honnêteté)
Pages Trezor support, Ring, PubMed/Nature (stress et mémoire) inaccessibles (redirections/paywall) ; références de Quervain 1998 et Arnsten 2009 citées de mémoire. Aucune donnée primaire sur l'usage réel des codes de contrainte d'alarmes. Comportement d'erreur des wallets face à un checksum invalide non testé.
