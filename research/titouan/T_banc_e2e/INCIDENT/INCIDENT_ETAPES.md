# Fiche incident Hold up : que faire après une signature piégée

Public : particulier résidant en France ou dans l'UE. Cas couverts : un droit de dépense trop large a été donné (approve, setApprovalForAll, Permit, Permit2), ou des fonds ont été perdus après une signature piégée.

Pages lues le 2026-10-11 (lecture seule, aucun compte, aucune saisie, aucun message envoyé).

Légende :
- [V] : l'information a été lue sur la page officielle citée.
- [NV] : non vérifiée sur une page officielle (page bloquée, page vide ou source secondaire). À vérifier avant impression.
- introuvable : rien trouvé sur une page officielle.

Règle de la fiche : aucun numéro, aucune adresse e-mail, aucun lien qui n'ait été lu sur une page officielle. Les numéros cités ci-dessous ont tous été lus à l'URL indiquée.

---

## Ordre des étapes (résumé imprimable)

1. Arrêter toute signature et tout échange avec l'escroc.
2. Révoquer les droits accordés, depuis un appareil sain.
3. Si la phrase de récupération ou la clé a fuité : nouveau portefeuille, puis transfert de ce qui reste.
4. Conserver les preuves (hash, adresses, captures, heures UTC).
5. Porter plainte (commissariat, gendarmerie ou courrier au procureur).
6. Signaler aux services publics compétents (AMF, Info Escroqueries, 17Cyber).
7. Prévenir le site ou le protocole, les exchanges destinataires, l'émetteur du stablecoin, l'explorateur.
8. Ignorer toute offre de « récupération de fonds ».

---

## Étape 1. Arrêter l'hémorragie : révoquer les droits

### 1a. Révoquer les approbations sur chaîne (approve, setApprovalForAll)

**Pourquoi.** Un droit de dépense reste actif tant qu'il n'est pas retiré. L'attaquant peut s'en servir à tout moment, y compris sur des fonds reçus plus tard.

**Comment, avec Revoke.cash.**
- Saisir son adresse (ou son nom ENS) dans la barre de recherche, ou connecter son portefeuille. Choisir le réseau. Trier « Newest to Oldest » si l'on soupçonne une approbation récente. Cliquer « Revoke » (ou le crayon pour réduire le montant). [V] https://revoke.cash/learn/approvals/how-to-revoke-token-approvals
- Moment où l'on signe : la consultation peut se faire en saisissant une adresse, sans connexion. Le clic « Revoke » ouvre le portefeuille pour confirmer une transaction de révocation, qui coûte « a small gas fee ». [V] https://revoke.cash/token-approval-checker/avalanche

**Comment, avec l'explorateur Etherscan.**
- Menu « More », page « Token Approvals ». Saisir l'adresse, choisir le type de jeton (ERC20, ERC721, ERC1155), activer « Show all approvals », cliquer « Revoke ». [V] https://revoke.cash/learn/approvals/how-to-revoke-token-approvals (procédure décrite par Revoke.cash)
- La page de l'outil demande « Connect Wallet » pour révoquer et indique que la connexion sert à signer des messages pour interagir avec les contrats. [V] https://etherscan.io/tokenapprovalchecker
- Gaz : la page Etherscan ne le dit pas explicitement. Elle affiche un prix du gaz et une colonne « Transaction Hash », ce qui indique une transaction sur chaîne. [V pour l'absence de mention ; le coût en gaz est [NV] sur cette page]

**Comment, avec Snowtrace (Avalanche C-Chain).**
- Une page intitulée « Token Approval Checker » (revue et révocation des approbations Avalanche C-Chain) existe. Le texte lisible ne décrit ni la connexion ni la signature. [V pour l'existence de la page] https://snowtrace.io/tokenapprovalchecker
- Mode d'emploi détaillé : introuvable sur la page. Revoke.cash couvre aussi Avalanche (voir plus haut). [V]

**Limites.**
- Révoquer coûte du gaz. Il faut donc un peu de jeton natif (ETH, AVAX...) sur l'adresse. [V] (Revoke.cash, page Avalanche)
- Révoquer n'annule pas un transfert déjà fait. Les fonds partis restent partis.
- Si un robot « sweeper » vide l'adresse, envoyer du gaz peut être perdu (voir 1c). [V] MetaMask, lien en 1c.
- Ne révoquer que depuis l'URL tapée soi-même. Un faux site « revoke » est un piège classique. (Conseil de prudence, pas de source officielle.)

### 1b. Permit signés hors chaîne (EIP-2612) et Permit2

**Pourquoi.** Un Permit est une signature, pas une transaction. Tant que personne ne l'a soumis, il n'apparaît pas dans la liste des approbations. Revoke.cash précise qu'il ne peut pas savoir quelles signatures vous avez données ; son onglet « Signatures » montre seulement des signatures possibles. [V] https://revoke.cash/learn/approvals/what-are-eip2612-permit-signatures

**Permit EIP-2612 : ce que dit la norme.** [V] https://eips.ethereum.org/EIPS/eip-2612
- Chaque Permit porte un nonce. Un appel réussi incrémente le nonce. Une ancienne signature au même nonce ne passe plus.
- Le Permit expire après sa date limite (`deadline`). Une date à `uint(-1)` n'expire jamais en pratique.
- La norme ne définit aucune fonction d'annulation.
- La section sécurité indique qu'un signataire qui a de l'ETH peut soumettre le Permit lui-même, ce qui rend les Permit signés auparavant invalides.

**Permit EIP-2612 : comment faire en pratique.**
- Revoke.cash : on peut « cancel » ou « invalidate » une signature avant qu'elle soit utilisée, via l'onglet « Signatures » de la page du compte. Il prévient que c'est « generally very hard to do » car les escrocs l'activent vite. [V] https://revoke.cash/learn/approvals/what-are-eip2612-permit-signatures
- Une fois le Permit activé sur chaîne, il devient une approbation normale, à révoquer comme en 1a. [V] même page.
- Attention (déduction, [NV]) : consommer le nonce en soumettant soi-même le Permit de l'attaquant lui donne l'approbation. Il faut alors la révoquer aussitôt (étape 1a).

**Permit2 (contrat Uniswap).**
- Deux couches : l'approbation donnée au contrat Permit2 lui-même, et les sous-approbations que Permit2 accorde à d'autres contrats. Revoke.cash recommande de révoquer l'approbation à Permit2 quand on n'en a plus besoin. Les sous-approbations expirent souvent seules ; sinon on les révoque avec Revoke.cash. [V] https://revoke.cash/learn/approvals/what-is-permit2
- `lockdown(TokenSpenderPair[] approvals)` : « lockdown » de l'identité Permit2 de l'appelant, par révocation groupée d'approbations. [V] https://raw.githubusercontent.com/Uniswap/permit2/main/src/interfaces/IAllowanceTransfer.sol
- `invalidateNonces(address token, address spender, uint48 newNonce)` : invalide tous les nonces inférieurs à `newNonce` pour une paire (jeton, dépenseur). Limite : pas plus de 2^16 nonces par transaction (erreur `ExcessiveInvalidation`). Le nouveau nonce doit être strictement supérieur à l'ancien. [V] même fichier et https://raw.githubusercontent.com/Uniswap/permit2/main/src/AllowanceTransfer.sol
- `invalidateUnorderedNonces(uint256 wordPos, uint256 mask)` : pour les signatures « SignatureTransfer » (nonces non ordonnés). Invalide les bits du masque dans le bitmap de nonces. [V] https://raw.githubusercontent.com/Uniswap/permit2/main/src/interfaces/ISignatureTransfer.sol
- La documentation développeur Uniswap renvoie vers ces fichiers sources ; les pages de concept lues ne décrivent pas ces trois fonctions. [V] https://developers.uniswap.org/llms.mdx/docs/protocols/permit2/concepts/allowance-transfer

**Limites.**
- Ces fonctions s'appellent depuis l'adresse victime : il faut du gaz et un appel de contrat. Interface grand public pour `lockdown` ou `invalidateNonces` : introuvable sur une page officielle.
- Si la signature a déjà été utilisée, invalider le nonce ne sert plus à rien. Il faut révoquer l'approbation qui en résulte.
- Course de vitesse : l'attaquant peut soumettre avant vous.

### 1c. Déplacer les fonds restants vers un nouveau portefeuille

**Pourquoi.** Si la phrase de récupération ou la clé privée a été saisie sur un faux site, l'adresse est perdue pour toujours. Révoquer ne suffit pas.

**Comment.** [V] https://support.metamask.io/stay-safe/protect-yourself/ive-been-hacked-scammed-unauthorized-transactions-on-my-account/
- Installer le portefeuille sur un autre navigateur, un autre profil, ou un autre appareil (mobile : un second appareil).
- Y créer un nouveau portefeuille. Ne pas le lier au même compte Google ou Apple que l'ancien.
- Noter la nouvelle phrase de récupération dans l'ordre, la ranger en lieu sûr, ne la donner à personne.
- Envoyer les fonds restants vers la nouvelle adresse.
- Si un script « sweeper » est suspecté : ne pas envoyer d'ETH ou de jetons en plus pour payer le gaz.
- Cesser d'utiliser l'ancien portefeuille et tous les comptes issus de la phrase compromise.
- Ne pas créer de nouveaux comptes dans la phrase compromise : ils seraient compromis aussi. [V] https://support.metamask.io/stay-safe/protect-yourself/fighting-back-against-sweeper-bots/ (lu via résultat de recherche, [NV] pour le détail)

**Ne jamais saisir la phrase de récupération ailleurs.** Aucun support officiel ne la demande. MetaMask : aucun représentant ne vous demandera votre phrase. [NV, lu dans un résultat de recherche sur support.metamask.io] Binance : le support ne demande jamais d'informations sensibles ni d'envoi d'argent. [NV, résultat de recherche sur binance.com]

**Limites.** Les transactions ne peuvent pas être annulées, et un portefeuille non dépositaire ne peut pas récupérer les fonds pour vous. [V] MetaMask, lien ci-dessus.

---

## Étape 2. Conserver les preuves

**Pourquoi.** Plainte, signalement et demande de gel exigent des éléments précis. Binance exige notamment les TxID avec lien vers un explorateur et une copie de la plainte (voir étape 4).

**Comment.**
- Arrêter tout échange avec l'escroc, mais ne rien effacer. [V] https://www.cybermalveillance.gouv.fr/tous-nos-contenus/fiches-reflexes/escroquerie-placement-financier
- Garder : coordonnées du site, de la société et des interlocuteurs ; copies des e-mails et captures des messages ; contrats et ordres de virement ; relevés ; l'annonce ou le message qui a déclenché l'opération. [V] même page.
- Kraken conseille de garder messages, adresses de portefeuille, identifiants de transaction et liens. [V] https://blog.kraken.com/product/security/crypto-investment-scams-how-to-protect-yourself
- Ajouter, pour la crypto : hash de chaque transaction, adresses (la vôtre, celle du dépenseur, celles qui ont reçu les fonds), réseau, heure en UTC, capture de la fenêtre de signature du portefeuille, URL exacte du site. (Liste de bon sens, voir la section « Données à mettre dans la fiche ».)

**Limite.** Une capture d'écran seule ne prouve pas grand-chose. Le hash de transaction, lui, est vérifiable par tous sur l'explorateur.

---

## Étape 3. Signaler et porter plainte

### Ce que chaque plateforme couvre réellement pour une perte en crypto

| Service | Couvre une perte crypto par signature piégée ? | Source |
|---|---|---|
| Plainte au commissariat, en gendarmerie ou courrier au procureur | Oui. C'est la voie de droit commun. | [V] service-public F1435 |
| Plainte en ligne (ex pré-plainte) | Non. Atteintes aux biens à auteur inconnu, escroquerie « hors Internet » seulement. | [V] masecurite |
| THESEE | Non dans la plupart des cas. Liste fermée ; les faux investissements sur internet vont au commissariat. | [V] masecurite |
| PHAROS | Non pour sa propre perte. Contenus publics illicites ; la page dit ne pas traiter les arnaques. | [V] service-public F31979 |
| Perceval | Non. Fraude à la carte bancaire seulement. | [V] service-public F31324 |
| Info Escroqueries | Conseil et orientation par téléphone. | [V] justice.fr |
| Cybermalveillance.gouv.fr / 17Cyber | Diagnostic, conseils, accompagnement. | [V] cybermalveillance |
| AMF Epargne Info Service | Questions et signalement d'arnaques à l'investissement, crypto-actifs compris. | [V] amf-france.org |
| AMF listes noires | Vérifier un site ; une liste « Crypto-actifs » existe. | [V] amf-france.org |
| Signal Arnaques | Site communautaire, non officiel. | [V] signal-arnaques.com |

### 3a. Porter plainte (prioritaire)

**Pourquoi.** Sans plainte, pas d'enquête, et pas de demande de gel par les autorités. Binance et Tether conditionnent leur action à une démarche des forces de l'ordre (étape 4).

**Comment.** [V] https://www.service-public.gouv.fr/particuliers/vosdroits/F1435
- Au commissariat ou à la gendarmerie de son choix. On reçoit un récépissé. Apporter les preuves.
- Ou par courrier au procureur de la République du tribunal judiciaire du lieu des faits ou du domicile de l'auteur. Modèle de lettre : https://www.service-public.gouv.fr/particuliers/vosdroits/R11469
- Visioplainte pour certaines infractions, avec FranceConnect : https://www.service-public.gouv.fr/particuliers/vosdroits/R77529
- Qualification à évoquer : escroquerie, article 313-1 du Code pénal (cinq ans d'emprisonnement et 375 000 euros d'amende). [V] fiche Cybermalveillance citée en étape 2.

**Plainte en ligne : ne convient pas.** Elle couvre les atteintes aux biens quand « l'auteur est inconnu », avec « Escroquerie (hors Internet) ». [V] https://www.masecurite.interieur.gouv.fr/fr/demarches-en-ligne/plainte-en-ligne (l'ancienne adresse pre-plainte-en-ligne.gouv.fr redirige vers cette page [V]).

**THESEE : rarement adapté.** [V] https://www.masecurite.interieur.gouv.fr/fr/demarches-en-ligne/plainte-en-ligne-arnaques-internet-thesee
- Liste couverte : piratage de messagerie et de compte de réseau social, escroquerie aux sentiments, petites annonces, chantage en ligne avec demande d'argent, rançongiciel, faux sites de vente.
- Pour « escroquerie aux faux investissements sur internet » : se déplacer en commissariat ou en brigade.
- La page ne cite pas les cryptomonnaies. Elle exige l'IBAN utilisé pour le paiement, ce qui ne colle pas à une perte par signature sur chaîne.
- Réservé aux personnes majeures (particuliers). Gratuit.
- Limite : une signature piégée qui vide un portefeuille n'entre dans aucune case de la liste. Sauf si l'arnaque est passée par un piratage de compte ou une escroquerie aux sentiments, aller au commissariat.

**Limites.** Délais d'enquête non indiqués sur les pages lues. Une plainte ne garantit aucun remboursement.

### 3b. Info Escroqueries et Cybermalveillance.gouv.fr (conseil, orientation)

- Info Escroqueries : 0 805 805 817, numéro vert gratuit depuis la France, du lundi au vendredi de 9 h à 18 h 30. [V] https://www.justice.fr/je-suis-victime/atteintes-biens/arnaque-fraude-escroquerie
- 17Cyber (Cybermalveillance.gouv.fr) : service public d'assistance en ligne pour les particuliers. Diagnostic par questions, conseils, accompagnement par un policier ou un gendarme « lorsque la menace le nécessite ». [V] https://www.cybermalveillance.gouv.fr/17cyber
- Fiche réflexe « escroquerie au placement financier » : cite les cryptomonnaies parmi les appâts. Renvoie vers l'AMF pour les placements financiers dont les cryptomonnaies. Aide aux victimes : France Victimes au 116 006 (gratuit, 7 j/7, 9 h-19 h). [V] https://www.cybermalveillance.gouv.fr/tous-nos-contenus/fiches-reflexes/escroquerie-placement-financier
- Limite : fiche réflexe dédiée aux signatures piégées ou aux droits de dépense crypto : introuvable sur Cybermalveillance.gouv.fr.

### 3c. AMF : liste noire et signalement

- Listes noires : catégories « Crypto-actifs » et « Produits dérivés sur crypto-actifs », entre autres. Les listes « ne peuvent être exhaustives » : être absent ne prouve rien. [V] https://www.amf-france.org/fr/espace-epargnants/proteger-son-epargne/listes-noires-et-mises-en-garde
- Test « suis-je victime d'une arnaque » : https://protectepargne.amf-france.org/verifier/suis-je-victime-dune-arnaque [V, lien lu sur la page ci-dessus]
- AMF Epargne Info Service : questions et « possibles arnaques à l'investissement ». Les signalements peuvent alimenter mises en garde et listes noires. Formulaire en ligne. Téléphone : +33 (0)1 53 45 62 00, du lundi au vendredi de 9 h à 12 h 30. [V] https://www.amf-france.org/fr/espace-epargnants/lamf-et-vous/epargne-info-service
- Limite : l'AMF ne récupère pas les fonds (voir étape 5). Son champ se limite aux produits financiers ; un drainer sans offre d'investissement peut sortir de son périmètre. (Déduction, [NV].)

### 3d. PHAROS : seulement pour le contenu public

- PHAROS reçoit des signalements de contenus publics illicites. Ce n'est pas une plainte. La page indique qu'elle « ne traite pas des moyens pour signaler une arnaque sur internet ». Elle ne traite pas les urgences (appeler le 17). Contenu reçu en privé : hors champ. [V] https://www.service-public.gouv.fr/particuliers/vosdroits/F31979
- Usage utile ici : signaler une page publique de phishing ou une publicité frauduleuse visible de tous. Lien vers le signalement : https://www.service-public.gouv.fr/particuliers/vosdroits/R17674 [V, lien lu sur la page]
- La page d'accueil https://www.internet-signalement.gouv.fr/PharosS1/ n'a pas pu être lue (contenu vide). [NV]

### 3e. Perceval : hors sujet sauf carte bancaire

- Perceval sert à signaler une fraude à la carte bancaire : coordonnées utilisées pour des achats en ligne non faits par vous, carte toujours en votre possession. Les cryptomonnaies et les virements ne sont pas mentionnés. [V] https://www.service-public.gouv.fr/particuliers/vosdroits/F31324
- Utile seulement si la carte a été saisie sur le faux site.

### 3f. Signal Arnaques : non officiel

- Se présente comme « un site communautaire français » de partage d'expériences. Aucun lien déclaré avec une administration. La page ne dit pas que les signalements vont à la police. [V] https://www.signal-arnaques.com/
- Limite : ne remplace ni la plainte ni un signalement officiel.

### 3g. Niveau UE et hors France

- Europol ne traite pas les signalements des particuliers. Il renvoie vers la police nationale ou le site de signalement de chaque pays. [NV] La page https://www.europol.europa.eu/report-a-crime/report-cybercrime-online n'a pas pu être lue (application qui ne se charge pas) ; information issue de résultats de recherche sur europol.europa.eu.
- Infographie Europol sur les arnaques à l'investissement crypto : « report it to your national police ». [NV, résultat de recherche]
- IC3 (FBI), pour mémoire, hors France : formulaire principal pour divers types de plaintes. IC3 ne travaille avec aucune entité privée (cabinet, service crypto) pour récupérer des fonds et ne vous contactera jamais directement pour demander informations ou argent. [V] https://www.ic3.gov/
- Éligibilité des victimes hors États-Unis : introuvable sur la page lue (la FAQ renvoie une erreur 404).

---

## Étape 4. Prévenir les acteurs techniques

### 4a. Le site, la dApp ou le protocole usurpé

**Pourquoi.** Le vrai projet peut alerter ses utilisateurs, faire fermer le faux site, partager des adresses.

**Comment.**
- Chercher le fichier `security.txt` à l'adresse `https://<domaine>/.well-known/security.txt`. Le champ `Contact` est obligatoire (e-mail, téléphone ou page web) ; `Expires` aussi. [V] https://www.rfc-editor.org/rfc/rfc9116
- Sinon, chercher sur le site officiel une page « Security », « Bug bounty » ou « Responsible disclosure ». (Conseil général, [NV].)
- N'utiliser que le domaine officiel tapé soi-même. Ne jamais suivre un contact donné dans un message privé.

**Limite.** `security.txt` vise d'abord la divulgation de failles, pas l'aide aux victimes. Le projet n'a aucune obligation de répondre.

### 4b. Les exchanges qui ont reçu les fonds (demande de gel)

**Pourquoi.** Si les fonds arrivent sur un exchange centralisé, un gel est possible tant qu'ils n'en sont pas ressortis.

**Binance.**
- Victime : fournir un récit détaillé, des captures ou vidéos de connexion au compte, le portefeuille compromis et le compte destinataire, la liste des TxID avec lien cliquable vers un explorateur, une copie de la plainte. Binance « is unable to unilaterally freeze » sans ordre officiel des forces de l'ordre ou d'un tribunal. Obtenir cet ordre est de la responsabilité de la victime. [V] https://www.binance.com/en/support/faq/how-to-report-stolen-funds-transferred-to-binance-360000006051
- Forces de l'ordre : système LERS, « For Government and Law Enforcement Agencies only », portail hébergé chez Kodex. [V] https://www.binance.com/en/support/law-enforcement
- Le particulier n'utilise pas le portail Kodex : c'est l'enquêteur qui le fait.

**Coinbase.**
- Les demandes pénales et assignations passent par un portail réservé aux forces de l'ordre. [NV] https://help.coinbase.com/en/coinbase/other-topics/legal-policies/who-do-i-contact-for-a-subpoena-request-or-dispute-or-to-send-a-legal-document (erreur 403 à la lecture ; résumé issu d'un résultat de recherche).
- Victime : contacter immédiatement les autorités locales ; Coinbase coopère avec elles. [NV] https://help.coinbase.com/en/coinbase/privacy-and-security/account-compromised/how-do-i-report-an-unauthorized-transaction (erreur 403).
- Formulaire public de gel pour une victime extérieure : introuvable.

**Kraken.**
- Victime : arrêter d'envoyer des fonds, ne rien payer pour « débloquer » ou « récupérer », garder messages, adresses, TxID et liens, signaler aux canaux nationaux de cybercriminalité, prévenir le support Kraken. [V] https://blog.kraken.com/product/security/crypto-investment-scams-how-to-protect-yourself
- Page officielle de demandes des forces de l'ordre : introuvable (https://www.kraken.com/legal/law-enforcement renvoie 404).

**Limite.** Sans plainte puis demande d'un enquêteur, le gel est peu probable. Une adresse d'exchange se repère sur l'explorateur (étiquette), mais l'absence d'étiquette ne prouve rien.

### 4c. Émetteurs de stablecoins (USDT, USDC)

**Tether (USDT).**
- Conditions générales : Tether peut geler des jetons « as required by applicable Law » ou à sa seule discrétion, suspendre l'accès sur ordre d'un gouvernement, mettre une adresse en liste noire, saisir et remettre aux autorités. Il reçoit des demandes de gouvernements, forces de l'ordre et tribunaux, selon une « Law Enforcement Requests Policy » non reproduite sur la page. [V] https://tether.to/en/legal/
- Vols, piratages, arnaques, demandes des forces de l'ordre : à signaler à la « Tether Information requests team ». Aucune adresse e-mail n'est écrite sur la page ; seul un lien vers le support est donné. [V] https://tether.to/en/tether-token-recoveries/
- Récupération : discrétionnaire, compte vérifié obligatoire, montants au-delà de 1 000 dollars, frais jusqu'à 10 % du montant récupéré ou 1 000 dollars (le plus élevé), aucun délai garanti, « several months » courant, résultat non garanti. La page conseille d'abord de demander au destinataire. [V] même page.

**Circle (USDC).**
- Circle peut « block » certaines adresses USDC et geler, temporairement ou définitivement, l'USDC associé. Il peut être tenu de geler sur ordre légal d'une autorité gouvernementale valable. L'émission suit une politique de « blocklisting » (PDF lié, non lu). [V] https://www.circle.com/legal/usdc-terms
- Canal dédié aux forces de l'ordre : introuvable sur la page. Seul un portail de support est lié.
- L'USDC « bridgé » sur certains réseaux peut ne pas être gelable par Circle. [NV, résultat de recherche sur circle.com/legal/bridged-usdc-terms]

**Limite.** Le gel ne concerne que ces stablecoins, pas l'ETH ni les autres jetons. Il dépend d'une demande des autorités ou de la seule décision de l'émetteur.

### 4d. Explorateurs : étiquette d'adresse

- Etherscan : chercher l'adresse de l'escroc, menu « More » puis « Report/Flag Address », remplir le formulaire de phishing (e-mail de suivi, liens à l'appui). Si l'implication est prouvée, l'adresse est étiquetée et un avis public s'affiche. [V] https://info.etherscan.com/report-address/
- Limite : l'étiquette protège d'autres victimes, elle ne rend rien. Délai de traitement : introuvable.

---

## Étape 5. Ce qui n'est PAS promis

- **Récupération rare.** Les transactions sur chaîne sont irréversibles ; un portefeuille non dépositaire ne peut pas récupérer les fonds. [V] MetaMask (étape 1c). Tether : résultat « not, and cannot, be guaranteed ». [V] page Tether (étape 4c).
- **Délais.** Tether : pas de délai, souvent plusieurs mois. [V] Délais d'enquête pénale : introuvable.
- **Coûts.** Gaz pour révoquer [V] ; frais de récupération Tether jusqu'à 10 % ou 1 000 dollars [V]. Plainte et THESEE gratuits [V pour THESEE].
- **Faux récupérateurs de fonds.**
  - AMF : elle n'a aucun pouvoir pour récupérer ou restituer des fonds, ne demande jamais d'argent, ne contacte jamais un investisseur de sa propre initiative pour cela. Seuls les tribunaux peuvent intervenir. Des victimes d'arnaques crypto ont été rappelées par un prétendu « engineer » proposant de récupérer leurs crypto-actifs « directly on the Blockchain ». Le numéro affiché peut être usurpé. [V] https://www.amf-france.org/en/news-publications/news-releases/amf-warns-public-about-calls-fraudsters-claiming-help-recover-funds (13 janvier 2023)
  - Cybermalveillance.gouv.fr : ceux qui prétendent aider à récupérer les fonds sont souvent d'autres escrocs, dans les semaines ou mois suivants. Ne pas donner suite. [V] fiche réflexe (étape 2).
  - IC3 : ne travaille avec aucun service privé pour récupérer des fonds. [V] https://www.ic3.gov/
  - Kraken : ne rien payer pour « unlock » ou « recover ». [V] blog Kraken.
  - ACPR : alerte sur l'usurpation de l'ACPR, de la Banque de France et de l'AMF pour des demandes de « récupération de fonds ». [NV, résultat de recherche sur acpr.banque-france.fr]
  - Europol : rapport sur les escrocs se présentant comme avocats ou forces de l'ordre offrant de récupérer les fonds contre paiement. [NV, résultat de recherche sur europol.europa.eu]

---

## Étape 6. Fiscalité

Omise. Aucune page officielle lue (BOFiP, impots.gouv.fr) ne traite le vol ou la perte de crypto-actifs par escroquerie. Les pages trouvées ne visent que les cessions à titre onéreux.

---

## Étape 7. Ce que Hold up ne fait pas

Hold up analyse une demande de signature avant qu'elle parte et affiche un avertissement. Hold up ne révoque aucun droit à votre place. Il ne signe rien, ne déplace aucun fonds, ne gèle rien et ne récupère rien. Il ne connaît pas votre phrase de récupération et ne la demandera jamais. Il ne dépose pas plainte et ne contacte ni la police, ni un exchange, ni un émetteur. Ses alertes ont été mesurées sur un catalogue synthétique : il peut rater une attaque réelle ou alerter à tort. Une fois la signature donnée, Hold up ne peut plus l'annuler. Cette fiche vous dit quoi faire, mais c'est vous qui le faites, depuis un appareil sain.

---

## Données à mettre dans la fiche (pour les autorités et les plateformes)

À remplir avant la plainte. Heures en UTC (indiquer aussi l'heure de Paris si utile).

| Champ | Exemple de format | Utile pour |
|---|---|---|
| Nom, prénom, coordonnées de la victime | | Plainte |
| Réseau (chaîne) | Ethereum, Arbitrum, Avalanche C-Chain... | Tous |
| Adresse de la victime | 0x... | Tous |
| Adresse du dépenseur ou du contrat approuvé | 0x... | Révocation, explorateur, plainte |
| Adresses ayant reçu les fonds (chaque saut connu) | 0x... | Exchanges, émetteurs, plainte |
| Hash de la transaction d'approbation (si sur chaîne) | 0x... + lien explorateur | Plainte, Binance (TxID cliquable) |
| Type de signature | approve, setApprovalForAll, Permit, Permit2, autre | Révocation, plainte |
| Hash de chaque transaction de vol | 0x... + lien explorateur | Tous |
| Jeton, montant, valeur estimée en euros à la date | USDT 1 250,00 ; ETH 0,8 | Plainte, Tether (montant) |
| Date et heure UTC de la signature | AAAA-MM-JJ hh:mm:ss UTC | Plainte |
| Date et heure UTC de chaque sortie de fonds | AAAA-MM-JJ hh:mm:ss UTC | Plainte |
| URL exacte du site où la signature a eu lieu | https://... | PHAROS, plainte, projet usurpé, Etherscan |
| Comment le lien a été reçu | publicité, réseau social, message privé, e-mail | Plainte |
| Pseudonymes, comptes, numéros de l'escroc | | Plainte |
| Captures : fenêtre de signature, site, messages | fichiers datés | Plainte, Binance |
| Révocations faites | hash, date UTC | Preuve de diligence |
| Exchange de destination identifié | nom, adresse de dépôt | Demande de gel via l'enquêteur |
| Stablecoin concerné | USDT ou USDC, réseau | Tether, Circle |
| Numéro de plainte, service, date | | Exchanges, émetteurs |
| Signalements faits | AMF, Etherscan, projet : date et référence | Suivi |
