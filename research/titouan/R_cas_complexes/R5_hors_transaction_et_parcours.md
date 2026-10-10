# R5 - Ce qui échappe au modèle "intention dite vs transaction réelle" + parcours d'arnaque complets

Date de recherche : 2026-10-11. Langue : français.

## 0. Conventions et honnêteté des sources

Étiquettes :
- [P] = source primaire consultée directement (page Chainalysis lue via WebFetch ; documentation MetaMask lue via WebFetch).
- [S] = source secondaire (presse, blogs, agrégateurs) : je n'ai PAS ouvert le rapport d'origine ; chiffres à re-vérifier.
- [V] = ma propre inférence / analyse de conception, ou point à vérifier. Ce n'est PAS un fait sourcé.
- "non trouvé" = recherché, absent des résultats.

Limites globales : les chiffres des différentes sociétés (Chainalysis, TRM, FBI IC3, Scam Sniffer) n'ont pas les mêmes périmètres et ne s'additionnent pas. Aucun de ces jeux de données ne classe les pertes selon "la transaction était-elle analysable ?" : la répartition par "catégorie d'attaque vue par l'outil" est donc une reconstruction [V], jamais une mesure.

Modèle de l'outil (rappel, tel que compris) : Snap MetaMask qui reçoit une transaction (ou signature) AVANT confirmation, compare avec l'intention déclarée par l'utilisateur et affiche un avertissement. Ce que la doc MetaMask confirme [P] : `onTransaction` reçoit la transaction brute non signée, le chain ID, et optionnellement l'origine (`allowTransactionOrigin: true`) ; il renvoie une UI affichée dans la confirmation ; la sévérité "critical" (modale d'avertissement) est expérimentale et réservée à MetaMask Flask. La page ne dit pas qu'un Snap peut bloquer une transaction. La doc consultée ne mentionne pas `onSignature` (non trouvé sur cette page ; à vérifier sur la référence des exports).

Conséquence structurelle [V] : l'outil ne voit que ce qui passe par l'extension MetaMask. Tout ce qui ne passe pas par `onTransaction`/signature est hors périmètre par construction.

---

## 1. Partie A : attaques sans transaction analysable par le Snap

### A1. Saisie de la phrase secrète (SRP) sur faux site / faux support / faux wallet / QR / faux courrier
- Faits : faux e-mails "fuite de données Ledger" demandant de "vérifier" les 24 mots (fin 2023) [S : Cointelegraph/TechRadar via recherche] ; lettres papier à en-tête Ledger avec QR code menant à la saisie de la phrase (avril 2025) [S]. Faux Snap "wallet-monitor-snap" affichant une fausse alerte dans l'UI de confiance de MetaMask pour demander la SRP, transmise ensuite à toute dapp appelant le Snap [S : OSV MAL-2026-xxxx, via recherche ; portée réelle non vérifiée].
- Victime croit : "je valide / je sécurise / je restaure mon wallet".
- Ce que fait l'acte : zéro transaction ; l'attaquant importe la SRP et vide plus tard, depuis SON propre appareil.
- Case d'intention : aucune pertinente (rien n'est signé dans MetaMask de la victime).
- Outil voit : rien au moment du vol de la SRP. Il pourrait voir (hors intention) le vidage ensuite seulement si la victime utilisait encore ce wallet, ce qui n'arrive pas.
- Signal indépendant : aucun dans MetaMask. Seul levier : détection de saisie de SRP dans une page web (hors périmètre d'un Snap : un Snap n'a pas accès au DOM des pages) [V].

### A2. Extensions de navigateur malveillantes / faux wallet / mise à jour piégée
- Faits : extension "Safery: Ethereum Wallet" restée dans le Chrome Web Store ~sept.-nov. 2025, vol de SRP [S, source de faible qualité] ; campagne "FoxyWallet" Firefox, 40+ extensions (juillet 2025) [S] ; extensions Chrome/Edge rachetées puis infectées par mise à jour automatique (Socket) [S]. Trust Wallet, extension officielle Chrome v2.68 compromise (24-26 déc. 2025) via secrets GitHub volés puis clé API Chrome Web Store : environ 7 M$ à 8,5 M$ volés, 2 520 adresses vidées vers au moins 17 adresses [S : BleepingComputer, The Hacker News, SecurityAffairs ; écart 7 vs 8,5 M$ = estimation initiale vs post-mortem].
- Victime croit : utiliser son wallet normalement.
- Ce que fait l'acte : l'extension exfiltre la SRP (pas de transaction côté victime).
- Outil voit : rien (la transaction est forgée ailleurs avec la clé volée). Cas particulier : une extension malveillante dans le MÊME navigateur peut aussi altérer ou masquer l'UI du Snap ou la page [V].
- Signal indépendant : aucun côté Snap. Côté hygiène : liste des extensions installées (non accessible à un Snap) [V].

### A3. Malware / infostealers / faux recrutement
- Faits : campagne "Contagious Interview" (MITRE G1052, ESET "DeceptiveDevelopment") : faux recruteurs, test de code ou faux outil de visio, malware BeaverTail/InvisibleFerret, vol de portefeuilles et mots de passe navigateur [S]. Radiant Capital (oct. 2024, environ 50 M$) : développeur reçoit un ZIP/PDF d'un faux ancien contractuel via Telegram ; sur 11 signataires, 3 clés compromises (forklog) ; la victime-signataire disait avoir simulé chaque transaction [S]. Chainalysis cite aussi Venus Protocol (sept. 2025) : client Zoom compromis [P].
- Victime croit : passer un entretien / relire un PDF.
- Ce que fait l'acte : prise de contrôle de la machine ; l'attaquant signe depuis la machine ou vole le fichier de clés.
- Outil voit : si le malware déclenche des signatures via l'extension locale, le Snap verrait une transaction sans cohérence avec une intention (utilisateur n'a rien déclaré) ; si les clés sont exfiltrées, rien du tout.
- Signal indépendant possible [V] : transaction proposée alors que l'utilisateur n'a déclaré aucune intention récente (absence d'intention = signal) ; heure inhabituelle ; destinataire neuf.

### A4. Clipboard hijackers et empoisonnement d'adresse
- Distinction : (a) clipper = malware qui remplace l'adresse copiée ; (b) address poisoning = pas de malware, adresse sosie injectée dans l'historique. Ma recherche n'a trouvé que (b) pour 2025, pas de chiffre propre au clipper : "non trouvé" pour (a).
- Chiffres (b) : un utilisateur a envoyé 49 999 950 USDT à une adresse sosie (déc. 2025) après avoir copié depuis l'historique ; 4 556 ETH (~12,25 M$) en février 2026 [S : Forklog, Scam Sniffer relayé] ; ~83,8 M$ cumulés sur Ethereum selon Blockeden [S, source faible] ; 270 M de tentatives sur ETH/BSC en deux ans [S].
- Victime croit : "j'envoie 50 000 USDT à mon exchange / à mon fournisseur" (son mot : "à X").
- Ce que fait la transaction : transfert USDT vers une adresse sosie (mêmes 4 premiers/6 derniers caractères).
- Case d'intention : "envoyer des USDT" + (si champ libre) "à X". Tout est cohérent avec la transaction, SAUF l'identité du destinataire.
- Outil voit : le destinataire exact, montant, token. Il PEUT détecter, sans l'intention : adresse jamais vue, ressemblant à une adresse connue de l'historique (distance d'édition faible), précédée d'un petit transfert-poison. C'est un cas où le signal indépendant fonctionne bien et où l'intention est presque inutile [V].
- Détail instructif [S] : dans le cas des 50 M$ la victime avait envoyé 50 USDT de test à la bonne adresse juste avant : le comportement "prudent" ne protège pas.
- Cas clipper (npm sept. 2025, voir A6) : l'adresse est remplacée AVANT que MetaMask ne la reçoive ; le Snap voit l'adresse finale (mauvaise) mais l'intention déclarée n'a pas d'adresse vérifiable.

### A5. Faux front-end qui substitue la transaction (Bybit/Safe, Radiant)
- Bybit (21 févr. 2025, ~1,46-1,5 Md$) : JavaScript malveillant injecté dans l'interface Safe{Wallet} via la machine d'un développeur compromise (crédentiels écriture sur l'infrastructure AWS/S3), code actif seulement pour l'adresse Bybit ; les signataires voyaient une transaction normale, le Ledger signait un payload différent ; attribution Lazarus (NCC/Fox-IT) [S : The Block, NCC, Cobo, Zealynx ; 4Pillars dit que le développeur aurait installé un faux logiciel de "simulation boursière" : à vérifier dans le rapport Safe, non confirmé]. Pas de rapport Verichains trouvé.
- Victime croit : "j'approuve le transfert de routine entre cold et warm wallet".
- Ce que fait la transaction : appel `delegatecall` changeant l'implémentation du wallet (détail technique de mémoire [V], non vérifié ici).
- Case d'intention : "transfert interne". Faux vis-à-vis de ce qui est signé.
- Outil voit : SI le Snap est branché sur le chemin de signature (Safe n'utilise pas MetaMask comme composant de confirmation de la même façon, et les signataires Bybit utilisaient des hardware wallets) : il verrait le vrai calldata, et pourrait signaler "delegatecall vers contrat inconnu / opération de type 1" sans connaître l'intention. Mais le Snap n'est pas dans le chemin d'un signataire Ledger via une UI Safe corrompue [V].
- Point clé : le Snap protège UNIQUEMENT si la couche qui lui transmet la transaction est honnête. Si l'UI substitue la transaction AVANT d'appeler le wallet, le Snap, qui reçoit la transaction substituée, compare l'intention à la mauvaise chose... sauf qu'ici c'est précisément la vraie transaction envoyée au wallet qui est analysée, donc il verrait le vrai contenu. Le risque est que l'intention capturée (saisie par l'UI ou par l'utilisateur) soit elle aussi falsifiée si capturée par la dapp [V].
- Signal indépendant : sélecteur/opération rare (`delegatecall`, changement d'implémentation), contrat cible jamais utilisé, montant = quasi totalité du solde.

### A6. Chaîne d'approvisionnement npm / CDN / bibliothèque
- Faits : 8 sept. 2025, compromission de 18 paquets npm (chalk, debug, etc.), mainteneur hameçonné via faux e-mail "reset 2FA" (domaine npmjs.help), ~2 h d'exposition, code clipper qui enveloppait fetch/XHR et les API wallet pour remplacer destinataires et approbations ; plus de 2 Md de téléchargements hebdomadaires cumulés [S : Semgrep, Cycode, Socura ; rekt.news titre "The Great npm Heist That Wasn't", impact financier faible mais je n'ai pas de chiffre]. Ledger Connect Kit (14 déc. 2023), versions 1.1.5-1.1.7 malveillantes, au moins ~600 000 $ volés, ex-employé hameçonné [S].
- Victime croit : "je me connecte à la dapp habituelle".
- Ce que fait l'acte : la dapp compromise propose des transactions/approbations vers l'attaquant.
- Case d'intention : celle de l'usage habituel ("swap", "stake").
- Outil voit : la transaction réelle envoyée à MetaMask (donc il peut détecter la divergence si l'intention déclarée est indépendante de la dapp). C'est son meilleur cas d'usage, A CONDITION que l'intention soit saisie hors de la page compromise.
- Signal indépendant : spender/destinataire jamais vu, `approve` illimité sur un token de valeur, première interaction avec ce contrat.

### A7. RPC malveillant
- Non trouvé de cas chiffré récent dans mes recherches. Mécanisme [V] : un RPC contrôlé par l'attaquant peut falsifier soldes, simulations et estimations ; une simulation faite via le même RPC est donc non fiable. Le Snap, s'il simule via le RPC de l'utilisateur, hérite du mensonge. Parade : simuler via un RPC indépendant et comparer.

### A8. Attaque sur le Snap lui-même / sa mise à jour
- Faits : documentation MetaMask [P] : Snaps utilisant des permissions "protégées" doivent être sur l'allowlist (revue MetaMask), les Snaps à permissions ouvertes peuvent être installés par tous ; l'allowlist "n'est pas une garantie de sécurité" ; audit tiers exigé pour les méthodes de gestion de clés ; code public sur npm exigé. Consentement aux permissions à l'installation [P]. Comment les mises à jour ajoutant des permissions sont traitées : page non lue, "non trouvé" dans mes sources.
- Cas réels [S : OSV, via recherche ; je n'ai pas vérifié leur présence dans le registre officiel ni leur nombre d'installations] : `tx-guard-snap`, vendu comme analyseur de transactions, exfiltrait from/to/value/data/chainId vers un endpoint codé en dur et affichait de fausses alertes critiques ; `wallet-monitor-snap` demandait la SRP via une fausse alerte. Illustre exactement le risque "Snap de sécurité = point d'entrée".
- Pour NOTRE outil [V] : (1) le Snap voit toutes les transactions (insight) = surface de fuite de vie privée ; (2) un compte npm/éditeur compromis (voir A6) peut pousser une version qui annule les avertissements ou en fabrique de faux ; (3) le Snap affiche dans l'UI de confiance de MetaMask : un faux avertissement "tout est sûr" est aussi dangereux qu'une absence d'outil (faux sentiment de sécurité). Mesures : build reproductible, signature des releases, épinglage de version, pas de réseau sortant (ou liste blanche minimale), audit, politique de mise à jour sans permission supplémentaire.

### A9. Wrench attacks (contrainte physique)
- Chiffres [S] : CertiK : 72 attaques vérifiées en 2025 (+75 %), >40,9 M$ de pertes, enlèvement la méthode la plus courante, France 19 attaques ; Decrypt/Chainalysis relayé : 41 M$ puis chiffre de 58 M$ cité par une autre source pour 2025 (les deux ne concordent pas : "écart non expliqué") ; Chainalysis S1 2026 : >30 M$, 12 paiements sur 46 tentatives (26 %), contre 49 % en 2025 et 67 % en 2024 [S ; je n'ai pas lu le rapport]. Cas Ledger/Balland, janvier 2025 [S].
- Victime croit : "on me force, je dois transférer".
- Ce que fait la transaction : transfert légitime signé par le propriétaire sous contrainte.
- Case d'intention : "envoyer à l'adresse X" (intention dite sous contrainte).
- Outil voit : transaction conforme à l'intention. Rien à détecter sur le fond. Seuls signaux indépendants : destinataire neuf + montant énorme + heure inhabituelle + vidage rapide de plusieurs actifs [V]. Option de conception : "code de contrainte" (PIN duress) ou délai de sécurité (time-lock) : ça relève d'un wallet, pas de l'analyse d'intention.

---

## 2. Partie B : parcours d'arnaque multi-étapes (chaque transaction légitime isolément)

Fait de base [S] : Chainalysis (2026) note que les catégories se mélangent : beaucoup de pig butchering/investissement comportent de l'usurpation, de l'ingénierie sociale, voire des volets techniques/wallet. Les usurpations d'identité (incidents) +1 400 % en glissement annuel, montant moyen volé +600 %.

### B1. Pig butchering / faux conseiller / faux investissement / romance
- Étapes : contact (réseau social, SMS, appli de rencontre) -> confiance sur semaines -> faux site de trading -> petits dépôts "gagnants" -> gros dépôt -> impossibilité de retirer, "taxe" à payer.
- Victime croit : "j'investis sur la plateforme de mon ami / conseiller, je dépose du USDT".
- Transaction : transfert d'USDT vers une adresse de dépôt de la plateforme frauduleuse (ou approbation à un contrat). Techniquement un simple `transfer`.
- Case d'intention : "envoyer / investir / déposer" : 100 % cohérent.
- Outil voit : transfert USDT vers une adresse neuve. Ne voit PAS : le faux site, la relation, la promesse de rendement.
- Signaux indépendants disponibles [V] : destinataire jamais vu (mais normal pour un exchange légitime aussi) ; montant croissant par paliers sur plusieurs jours ; adresse déjà signalée dans des listes d'adresses frauduleuses (si l'outil consulte des feeds : Chainalysis/TRM/ScamSniffer) ; réponse à "un tiers vous guide-t-il ?" (déclaratif).
- Chiffres : Chainalysis 2024 : pig butchering 33,2 % et HYIP 50,2 % des revenus de scams (base 2024) [S] ; 2025 : estimation >=14 Md$ on-chain, projection >17 Md$ ; paiement moyen 782 $ -> 2 764 $ [S] ; pas de pourcentage 2025 par sous-catégorie trouvé. FBI IC3 2025 : 20,877 Md$ de pertes déclarées totales, ~11,37 Md$ liés à la crypto (181 565 plaintes), investissement crypto ~7,2 Md$ [S, presse ; l'écart de périmètre entre sources est signalé par les articles eux-mêmes]. TRM : ~35 Md$ envoyés vers des schémas de fraude en 2025, stablecoins 84 % [S]. Ces totaux diffèrent d'un facteur 2 selon les sociétés : à citer comme fourchette, jamais comme valeur unique.

### B2. Faux support (Coinbase / Ledger / MetaMask) et "déplacez vos fonds vers un wallet sûr"
- FBI PSA I-080124 [S, ic3.gov listé dans les résultats, non ouvert] : appel/message non sollicité, urgence, "votre compte est compromis".
- Cas : faux support Coinbase, ~16 M$, environ 100 victimes (poursuites à Brooklyn) [S].
- Victime croit : "le support me fait passer mes fonds vers un coffre sécurisé, pour les protéger".
- Transaction : transfert de la quasi-totalité du solde vers une adresse neuve contrôlée par l'attaquant.
- Case d'intention : "transfert vers mon propre wallet sécurisé" ou "sécuriser mes fonds". C'est ici que le modèle d'intention est le plus vulnérable : l'utilisateur est convaincu que le destinataire EST à lui, donc la déclaration est de bonne foi et fausse.
- Outil voit : adresse neuve, montant = ~100 % du solde. Si l'outil vérifie "l'adresse m'appartient-elle ?" (appartenance à une clé dérivée du même wallet/hardware), il trouve non : signal très fort et indépendant de l'intention [V].
- Signaux indépendants : appartenance de l'adresse, ratio du solde, origine de la demande (appel téléphonique : non observable), questions de contexte "quelqu'un vous guide-t-il en direct ?".

### B3. Faux recrutement
- Cf. A3 pour la voie malware. Voie "paiement" : "frais de dossier / matériel / validation" payés en crypto. Transaction isolée : petit transfert vers adresse neuve. Pour l'outil : transfert simple, indistinguable d'un paiement légitime ; seul signal : destinataire neuf + origine de la demande déclarée "un recruteur".

### B4. Faux remboursement / faux "recovery" / faux avocat de récupération
- FBI IC3 2025 : plus de 10 500 plaintes de "recovery scams", ~1,4 Md$ [S]. Étapes : la victime d'un premier vol est recontactée par un "récupérateur" qui demande des frais d'avance. Victime croit : "je paie des frais pour récupérer mes fonds". Transaction : paiement de frais. Intention : cohérente. Signal : seconde victimisation = historique récent de perte (non vu par l'outil sauf si l'utilisateur le déclare).

### B5. Faux airdrop / claim / "validate your wallet" / dusting puis arnaque
- Mécanisme : page de claim imitant une marque, demande de connexion puis signature (Permit/Permit2/`setApprovalForAll`/ EIP-7702). Scam Sniffer 2025 [S, relayé par Cointelegraph/MEXC, rapport d'origine non ouvert] : pertes de phishing par signature 83,85 M$ (contre ~494 M$ en 2024, -83 %), ~106 000 victimes (-68 %), perte moyenne 790 $, 11 cas >1 M$ pesant 22,98 M$, plus gros vol 6,5 M$ via Permit (sept.), apparition d'EIP-7702 malveillant après Pectra (deux cas majeurs en août). Q3 le plus élevé (31 M$). Inferno Drainer : ~81 M$ / 134 000 victimes jusqu'à nov. 2023 [S], leurres : airdrop, compensation de panne, mint ; attente avant la première transaction.
- Victime croit : "je réclame mon airdrop / je valide mon wallet".
- Transaction : signature d'un Permit ou approbation de tokens vers un spender attaquant ; le vidage se fait plus tard, parfois sans nouvelle action de la victime.
- Case d'intention : "réclamer un airdrop" (rien de transférer) : la signature demandée est une AUTORISATION de dépense (donc incohérente avec "réclamer" = recevoir). C'est le cœur de cible naturelle de l'outil.
- Outil voit : type de signature, spender, montant (souvent illimité), échéance (`deadline`), token. Détecte l'incohérence "je veux recevoir" vs "j'autorise une dépense".
- Ne voit pas : la page frauduleuse, le fait que la marque est imitée (sauf liste de domaines).
- Dusting : petite quantité envoyée pour polluer l'historique (poisoning, A4) ou inciter à interagir avec un token piégé. Pas de chiffre propre trouvé hors poisoning.
- Signaux indépendants : spender sans historique, approbation illimitée, signature hors-chaîne sans transaction, `deadline` lointaine, sélecteur rare.

### B6. Vol sous couvert de "faux ATM / virement"
- Hors périmètre MetaMask (distributeurs de crypto). FBI IC3 : 13 460 plaintes, ~389 M$ [S]. À citer uniquement pour dimensionner ce que l'outil ne touche jamais.

---

## 3. Matrice par parcours : ce que la victime croit / fait / case / ce que l'outil voit / ne voit pas / signal indépendant

| Parcours | Victime croit | Transaction réelle | Case d'intention | Outil voit | Outil ne voit pas | Signal indépendant ? |
|---|---|---|---|---|---|---|
| A1 SRP sur faux site | "je valide mon wallet" | aucune | aucune | rien | tout | non (hors Snap) |
| A2 extension piégée | usage normal | aucune côté victime | aucune | rien | tout | non |
| A3 malware / faux recrutement | "entretien d'embauche" | signatures forgées ou clé volée | aucune ou incohérente | une partie éventuelle | machine, malware | oui si absence d'intention déclarée [V] |
| A4 poisoning / clipper | "j'envoie à X" | transfert vers adresse sosie | cohérente | adresse exacte | l'identité réelle | oui : nouvelle adresse + similarité |
| A5 faux front-end (Bybit) | transfert interne | `delegatecall` malveillant | fausse | calldata réel si dans le chemin | l'UI trompeuse | oui : opération rare |
| A6 npm / CDN | usage habituel | approbation/transfert détourné | habituelle | tx réelle | la dapp compromise | oui : spender neuf |
| A7 RPC malveillant | usage normal | variable | variable | simulation faussée | vérité de la chaîne | oui si 2e RPC |
| A8 Snap compromis | "mon outil de sécurité" | n/a | n/a | n/a | n/a | à construire (intégrité du Snap) |
| A9 wrench | "on me force" | transfert voulu | cohérente | tx conforme | la contrainte | faible : destinataire neuf + vidage |
| B1 pig butchering | "j'investis" | transfer USDT | cohérente | transfert + adresse neuve | la relation, le faux site | partiel : liste d'adresses, paliers |
| B2 faux support | "je sécurise mes fonds" | vidage vers adresse attaquant | "mon wallet sûr" (faux) | adresse neuve, ~100 % du solde | l'appel | oui : appartenance + ratio solde |
| B3 faux recrutement | "frais d'embauche" | petit transfert | cohérente | transfert | origine | faible |
| B4 faux recovery | "frais de récupération" | transfert | cohérente | transfert | historique de perte | faible |
| B5 airdrop / validate | "je réclame" | Permit / approve | incohérente avec "réclamer" | oui, le plus net | page de phishing | oui : spender, illimité |

---

## 4. Quantification (avec limites)

| Source | Chiffre | Périmètre / limite |
|---|---|---|
| Chainalysis 2026 [P, page blog lue] | >3,4 Md$ volés (janv.-début déc. 2025), dont Bybit 1,5 Md$ ; DPRK >=2,02 Md$ (76 % des compromissions de services) ; compromissions de portefeuilles personnels 713 M$ (~20 %, 37 % hors Bybit ; 44 % en 2024), 158 000 incidents, >=80 000 victimes | Bornes basses ; USD au moment du vol ; angles morts hors chaîne ; pas de ventilation par vecteur (phishing/malware/ingénierie sociale) |
| Chainalysis scams [S] | >=14 Md$ on-chain 2025, projection >17 Md$ ; usurpation +1 400 % ; paiement moyen 2 764 $ | Rapport d'origine non ouvert ; chiffres révisés à la hausse chaque année |
| TRM [S] | ~35 Md$ vers fraudes 2025 ; illicite total 158 Md$ | Périmètre plus large que Chainalysis ; révisions +69 % déjà observées sur 2023 |
| FBI IC3 2025 [S] | 20,877 Md$ total, ~11,37 Md$ crypto, ~7,2 Md$ investissement crypto, ~1,4 Md$ recovery, ~389 M$ ATM, ~893 M$ liés à l'IA | Déclaratif (victimes US), pas de chaîne, pas de notion de "vecteur technique" |
| Scam Sniffer 2025 [S] | 83,85 M$ de phishing par signature EVM (-83 %), 106 000 victimes | EVM seulement, signatures seulement ; non comparable à un total de scams |
| CertiK wrench 2025 [S] | 72 attaques, >40,9 M$ | Cas publics seulement ; sous-déclaration reconnue |

Lecture honnête pour l'outil [V] : même en prenant la fourchette haute des scams (14-35 Md$), la part clairement "signature/approbation malveillante analysable" (Scam Sniffer ~0,08 Md$) est 2 à 3 ordres de grandeur plus petite que le volume des scams "transferts légitimes isolément". Le Snap d'intention est le mieux placé pour la plus petite catégorie en valeur, et le moins bien placé pour la plus grande. Cela ne signifie pas qu'il est inutile : les arnaques par transfert simple restent atteignables par des signaux indépendants (destinataire neuf, appartenance, ratio du solde), pas par l'intention seule.

---

## 5. Matrice finale : catégorie d'attaque x action possible de l'outil

Légende : B = bloquer, A = avertir, D = documenter (journal, pour preuve/plainte/analyse), R = rien.
Note : l'outil ne peut techniquement pas bloquer (doc : pas de blocage ; "critical" expérimental, Flask) [P] ; "B" = au mieux modale d'avertissement forte.

| Catégorie | Capacité réelle | Ce qui manque pour couvrir le trou |
|---|---|---|
| Signature/Permit/approve malveillant (airdrop, drainers) | **A** fort ; D | Parsing EIP-712/Permit2/7702, base de spenders malveillants, simulation indépendante |
| Poisoning / sosie d'adresse | **A** fort | Historique local des adresses, distance d'édition, détection de micro-transfert entrant |
| Clipper (adresse remplacée avant MetaMask) | **A** partiel | Comparaison avec adresse saisie hors page (ex. contacts/ENS, confirmation sur un second canal) |
| Faux support "mets tes fonds en sécurité" | **A** (appartenance + ratio) ; D | Prouver l'appartenance de l'adresse destinataire, questions de contexte ("quelqu'un vous guide ?"), délai |
| Pig butchering / romance / faux conseiller | **A** faible ; D | Feeds d'adresses frauduleuses (TRM/Chainalysis/ScamSniffer), détection de paliers répétés, intervention de proche de confiance |
| Faux recrutement / faux recovery (paiement) | **D** ; A très faible | Déclaration d'origine de la demande ; aucun signal chaîne fiable |
| Faux front-end / UI substituée (Bybit, Radiant) | **A** partiel si Snap dans le chemin de signature | Décodage calldata indépendant de l'UI, règle "delegatecall / changement d'implémentation", vérification sur un appareil séparé |
| Supply chain npm/CDN de la dapp | **A** partiel | Intention saisie hors de la page compromise ; spender/dest. jamais vu |
| RPC malveillant | **R** sauf si 2e RPC | Simulation via RPC indépendant et comparaison |
| SRP saisie sur faux site / faux wallet / QR / courrier | **R** | Hors périmètre Snap ; éducation, détection côté navigateur ou OS |
| Extension malveillante / Trust Wallet v2.68 | **R** | Hors périmètre ; durcissement des extensions, hardware wallet |
| Malware / stealer / contrôle d'appareil | **R** ou D | Hors périmètre ; signal "tx sans intention déclarée" |
| Wrench attack | **D** ; R de fait | Mode contrainte (duress), time-lock : hors périmètre d'un Snap |
| Compromission du Snap lui-même | **R** (faille de l'outil) | Build reproductible, signatures, épinglage, pas de réseau, audit, revue des MAJ |
| ATM / virement fiat | **R** | Hors MetaMask |

---

## 6. Constats clés pour la conception [V]

1. La plus grosse perte en valeur (transferts "légitimes" sous manipulation) est la moins bien couverte par la comparaison d'intention : la victime déclare de bonne foi une intention qui lui a été soufflée.
2. Les signaux indépendants de l'intention les plus robustes : appartenance de l'adresse destinataire, ratio du solde vidé, destinataire/spender jamais vu, type de signature (autorisation vs réception), sélecteur/opération rare, similarité d'adresse, adresse présente dans un feed de fraude.
3. Les signaux comportementaux (urgence, tiers qui guide, heure, origine de la demande) ne sont pas observables par le Snap : ils ne peuvent venir que de questions posées à l'utilisateur (déclaratif, contournable par un attaquant qui coache la réponse).
4. Risque de coaching : un escroc qui guide en direct peut dicter la case à cocher. L'intention déclarée n'est donc pas une preuve ; elle doit être traitée comme un signal, pas comme une vérité.
5. L'outil est lui-même une surface d'attaque (A8) : les cas `tx-guard-snap` et `wallet-monitor-snap` montrent le scénario "faux Snap de sécurité".
6. Ne pas promettre de couverture : le Snap ne voit ni SRP, ni extension, ni malware, ni contrainte physique.

## Sources principales (liens recherchés)
- Chainalysis, "2025 Crypto Theft Reaches $3.4 Billion" : https://www.chainalysis.com/blog/crypto-hacking-stolen-funds-2026/ [P]
- MetaMask docs, Transaction insights : https://docs.metamask.io/snaps/features/transaction-insights/ [P]
- MetaMask docs, Get allowlisted : https://docs.metamask.io/snaps/how-to/get-allowlisted/ [S via résumé de recherche]
- Cointelegraph / Decrypt / Infosecurity (Chainalysis scams 2025) : https://cointelegraph.com/news/crypto-scams-2025-ai-impersonation-fraud-chainalysis [S]
- FBI IC3 2025 (couverture) : https://www.hstoday.us/subject-matter-areas/cybersecurity/cryptocurrency-and-ai-scams-cost-u-s-almost-21-billion-in-2025-according-to-new-fbi-internet-crime-report/ [S]
- FBI PSA I-080124 : https://www.ic3.gov/PSA/2024/PSA240801 [S, non ouvert]
- Scam Sniffer 2025 (couverture) : https://cointelegraph.com/news/crypto-phishing-losses-fell-83-percent-2025-wallet-drainers [S]
- TRM : https://www.trmlabs.com/resources/blog/trms-new-crypto-crime-report-shows-illicit-flows-hit-a-record-usd-158b-in-2025 [S]
- Bybit/Safe : https://www.nccgroup.com/research/in-depth-technical-analysis-of-the-bybit-hack/ ; https://www.theblock.co/post/343530 [S]
- npm chalk/debug : https://semgrep.dev/blog/2025/chalk-debug-and-color-on-npm-compromised-in-new-supply-chain-attack [S]
- Ledger Connect Kit : https://slowmist.medium.com/supply-chain-attack-on-ledger-connect-kit-analyzing-the-impact-and-preventive-measures-1005e39422fd [S]
- Trust Wallet : https://thehackernews.com/2025/12/trust-wallet-chrome-extension-hack.html [S]
- Radiant : https://decrypt.co/287162/radiant-capitals-50m-breach-among-most-sophisticated-hacks-in-defi-history [S]
- Snaps malveillants : https://osv.dev/vulnerability/MAL-2026-6943 ; https://api.osv.dev/v1/vulns/MAL-2026-11112 [S]
- Wrench : https://decrypt.co/356604 ; https://crypto.news/crypto-wrench-attacks-steal-30m-in-first-half-of-2026-chainalysis/ [S]

## Non trouvé / à compléter
- Chiffre dédié aux clippers (2025) ; pertes dues au RPC malveillant ; traitement exact des mises à jour de Snap ajoutant des permissions ; existence d'`onSignature` dans les docs consultées ; rapport Verichains sur Bybit ; ventilation Chainalysis par vecteur ; part 2025 du pig butchering.

## Résumé en 8 lignes
1. Une grande part des pertes échappe à une analyse de transaction : SRP saisie, extensions, malware et wrench ne passent jamais par `onTransaction` (Snap aveugle par construction).
2. Chainalysis 2025 : >3,4 Md$ volés ; portefeuilles personnels 713 M$ (~20 %, 37 % hors Bybit) ; scams >=14 Md$ (projection >17) ; FBI IC3 : ~11,4 Md$ crypto ; TRM ~35 Md$ : fourchettes non comparables.
3. Les signatures malveillantes analysables (Scam Sniffer) pèsent ~84 M$ en 2025, soit 2 à 3 ordres de grandeur de moins que les scams par transferts "légitimes" : le Snap est le mieux placé sur la plus petite catégorie.
4. Pig butchering, faux support, faux recrutement : transactions simples, intention déclarée de bonne foi et fausse ; l'intention ne protège pas, un escroc peut dicter la case.
5. Signaux indépendants les plus robustes : appartenance de l'adresse, ratio du solde, destinataire/spender neuf, type d'autorisation vs "réception", similarité d'adresse, feed de fraude.
6. Faux front-end (Bybit, Radiant) et supply chain npm : le Snap peut voir le vrai calldata seulement s'il est dans le chemin et si l'intention est saisie hors de la page compromise.
7. Le Snap est lui-même une cible : faux Snaps de sécurité documentés (`tx-guard-snap`, `wallet-monitor-snap`) ; il faut build reproductible, version épinglée, pas de réseau, audit.
8. Honnêteté : la plupart des chiffres sont secondaires [S], plusieurs lignes de la matrice sont des inférences [V] ; le Snap ne peut pas bloquer (doc), au mieux avertir et documenter.
