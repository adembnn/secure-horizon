# U. Textes utilisateur par menace (Hold up)

Date : 11/10/2026 (v2 après test de compréhension en aveugle; ancienne version : `U_textes_utilisateur_v1.json`). Source de vérité : `U_textes_utilisateur.json`. Contrôle : `node check_textes.mjs`.

Règles : 12 mots maximum par ligne (une variable compte pour un mot), tutoiement, aucun jargon, jamais de message vert ni de « OK ». Périmètre : 42 fiches (F31 à F42 ajoutées le 11/10/2026 : envoi vers une adresse nouvelle, droit limité, jeton non reconnu, échange, etc.), à l’origine 30 fiches tirées de SYNTHESE.md (R1 à R5), du banc E2E (44 familles, non toutes couvertes une à une) et des scénarios d'escroc S1 à S7.

Variables : `{montant}` (ex. 2 480), `{jeton}` (ex. USDC), `{site}` (ex. uniswap.org), `{site_reel}` (ex. unlswap-app.com), `{adresse_debut}` (ex. 0x7a3F), `{adresse_fin}` (ex. c91E), `{jours}` (ex. 90), `{nombre}` (ex. 12), `{montant_recu}` (ex. 310 USDC), `{contact}` (ex. Paul), `{reseau_demande}` (ex. Ethereum), `{reseau_reel}` (ex. Polygon), `{prix_vente}` (ex. 0,001 ETH), `{valeur_nft}` (ex. 4 ETH), `{duree}` (ex. pendant 90 jours, ou sans date de fin), `{recu}` (ex. au moins 310 USDC).

## 1. Fiches

| Id | Menace | Gravité | Tu crois | En réalité | D'où vient le danger | Que faire |
|---|---|---|---|---|---|---|
| F01 | Un site peut dépenser tous tes jetons sans limite | critical | Je veux seulement faire mon échange sur `{site}`. | Tu donnes à `{site}` le droit de prendre tes `{jeton}` sans limite. | Ce droit dure tant que tu ne le retires pas toi-même. | Refuse, ou autorise seulement `{montant}` `{jeton}`, pas plus. |
| F02 | Une signature gratuite autorise un site à prendre tes jetons | critical | Je signe un simple message, sans payer de frais. | Cette signature gratuite laisse `{site}` prendre tes `{montant}` `{jeton}` pendant `{jours}` jours. | Signer ne coûte rien, mais ça vaut une procuration signée. | Ne signe pas, sauf si tu as demandé cette autorisation. |
| F03 | Un site peut déplacer tous tes NFT d'une collection | critical | Je clique pour afficher mes NFT sur `{site}`. | Après ta signature, `{site}` pourra prendre tes `{nombre}` NFT et les futurs. | Ce droit couvre toute la collection, pas un seul NFT. | Refuse, sauf si tu veux vendre sur ce site précis. |
| F04 | Ton NFT part en vente presque gratuite, à ton insu | critical | Je mets mon NFT en vente au prix que j'ai choisi. | Tu recevras seulement `{prix_vente}` pour ton NFT, qui vaut `{valeur_nft}`. | N'importe qui pourra l'acheter à ce prix dès que tu signes. | Annule: ne signe pas une vente à un prix aussi bas. |
| F05 | Tu signes un message illisible | critical | Je signe un message pour prouver que c'est bien moi. | Ce texte illisible peut autoriser le retrait de tes `{montant}` `{jeton}`. | Même sur un site connu, un texte illisible peut cacher un piège. | Ne signe pas un texte que tu ne peux pas lire. |
| F06 | Un autre site que celui affiché te connecte à ton compte | warn | Je me connecte à `{site}` avec mon portefeuille. | Ce message te connecte à `{site_reel}`, pas à `{site}`. | Les deux adresses se ressemblent: `{site_reel}` copie `{site}` avec une lettre changée. | Ferme la page et ouvre `{site}` depuis tes favoris. |
| F07 | Quelqu'un d'autre devient propriétaire de ton compte | critical | Je mets à jour les réglages de mon compte. | Si tu signes, `{adresse_debut}`…`{adresse_fin}` contrôle ton compte et tes `{montant}` `{jeton}`. | Tu ne pourras plus reprendre le contrôle une fois la signature faite. | Annule, sauf si c'est toi qui as décidé ce changement. |
| F08 | Un accès secret est ajouté à ton compte partagé | critical | Je valide une opération de routine sur notre compte partagé. | Si tu signes, un inconnu pourra bouger les `{montant}` `{jeton}` du compte. | L'opération ajoute un accès secret à ce compte partagé. | Annule et demande aux autres membres s'ils connaissent cet ajout. |
| F09 | Un programme étranger prend les commandes de ton compte | critical | Je valide une opération normale sur mon compte partagé. | Ce programme étranger pourra agir à ta place sur tes `{montant}` `{jeton}`. | L'opération lui prête les pleins pouvoirs de ton compte, sans limite. | Annule et fais vérifier cette opération par quelqu'un de confiance. |
| F10 | Un service que tu utilises peut changer et te piéger | critical | Le service m'invite à valider une mise à jour. | Après ta signature, le service pourra prendre tes `{jeton}`, sans te demander. | Personne ne peut lire ce nouveau fonctionnement avant ta signature. | Prends le temps: cherche l'annonce officielle du service avant de signer. |
| F11 | Ton compte confie ses pouvoirs à un programme inconnu | critical | Je mets à niveau mon compte pour de nouvelles fonctions. | Si tu signes, ce programme pourra tout faire à ta place, partout. | Ce droit dure jusqu'à ce que tu le retires, sur plusieurs réseaux. | Refuse, sauf si tu as choisi toi-même ce programme. |
| F12 | Une seule signature cache plusieurs actions dont une dangereuse | critical | Je fais un seul échange, comme le montre l'écran. | Cet envoi groupé cache aussi une autorisation sur tes `{montant}` `{jeton}`. | L'écran montre une action, mais d'autres sont rangées derrière. | Annule et ne signe que l'action que tu as demandée. |
| F13 | Une fausse adresse presque identique à celle de ton contact | critical | J'envoie à l'adresse que j'ai déjà utilisée, copiée de mon historique. | Tes `{montant}` `{jeton}` partiraient vers `{adresse_debut}`…`{adresse_fin}`, pas vers ton contact. | Un inconnu a glissé dans ton historique une adresse presque identique. | Annule, puis recopie l'adresse depuis une source sûre, lettre par lettre. |
| F14 | Un inconnu glisse son adresse dans ton historique avec un envoi nul | warn | Cette ligne de mon historique vient de mon contact habituel. | Un inconnu t'a envoyé 0 `{jeton}` pour apparaître dans ton historique. | Il imite ton contact: ton prochain envoi risque d'aller chez lui. | Ne copie pas cette adresse; demande-la à ton contact. |
| F15 | Un faux jeton qui porte le même nom que le vrai | critical | J'achète le vrai `{jeton}`, celui que tout le monde connaît. | Tu paierais `{montant}` `{jeton}` pour une copie qui ne vaut rien. | Le nom et le logo se copient: seule l'adresse officielle prouve. | Annule et retrouve le vrai jeton depuis le site officiel du projet. |
| F16 | Un jeton que tu pourras acheter mais jamais revendre | critical | J'achète ce jeton et je pourrai le revendre quand je veux. | Tu paierais `{montant}` `{jeton}` pour un jeton impossible à revendre. | Dans notre test de revente, la vente a échoué. | Annule: n'achète pas un jeton que tu ne pourras pas revendre. |
| F17 | Ton échange envoie le résultat à une autre personne que toi | critical | Je change mes jetons et je les reçois sur mon compte. | Ton échange enverra les `{montant}` `{jeton}` reçus à `{adresse_debut}`…`{adresse_fin}`, pas à toi. | Le site a mis l'adresse d'une autre personne comme destinataire. | Annule et relance l'échange en vérifiant ta propre adresse. |
| F18 | Un échange te rend beaucoup moins que ce que tu donnes | critical | J'échange `{montant}` `{jeton}` contre à peu près la même valeur. | Tu donnes `{montant}` `{jeton}` et tu reçois seulement `{montant_recu}` en échange. | Des robots profitent des échanges où le prix peut beaucoup bouger. | Annule, puis relance l'échange avec une perte maximale très faible. |
| F19 | L'adresse que tu as collée n'est plus celle que tu as copiée | critical | Je colle l'adresse que j'ai copiée chez mon contact. | L'adresse collée a changé: tes `{montant}` `{jeton}` iraient à `{adresse_debut}`…`{adresse_fin}`. | Un logiciel espion peut remplacer l'adresse copiée par la sienne. | Annule, compare l'adresse complète avec celle de ton contact, par téléphone. |
| F20 | Un faux site qui ressemble au vrai | critical | Je suis sur le site officiel de `{site}`. | Ce site, `{site_reel}`, imite `{site}` pour vider tes `{montant}` `{jeton}`. | L'adresse du site ressemble à la vraie, avec une lettre changée. | Ferme la page et ouvre `{site}` depuis tes favoris. |
| F21 | Un faux support te guide pas à pas pour déplacer tes fonds | critical | Le support me guide pour protéger mes fonds. | Tu envoies `{montant}` `{jeton}` à un escroc: personne ne pourra les récupérer. | Un vrai support ne te demande jamais de signer ni d'envoyer. | Raccroche, puis rappelle toi-même le numéro officiel du service. |
| F22 | Un faux remboursement te demande de payer des frais d'avance | critical | Je paie de petits frais pour récupérer l'argent perdu. | Tu perds `{montant}` `{jeton}` de plus et ne récupères jamais rien. | Aucun vrai service ne te fait payer pour te rembourser. | Ne paie rien d'avance: un vrai remboursement n'est jamais payant. |
| F23 | Un faux recruteur te fait signer avec ton portefeuille | critical | Je valide mon embauche, comme me l'a dit le recruteur. | Tu donnes à ce site le droit de prendre tes `{montant}` `{jeton}`. | Un vrai employeur ne te demande jamais de signer pour t'embaucher. | Ne signe rien et vérifie l'entreprise sur son site officiel. |
| F24 | Un envoi important vers un nouveau contact qui te guide | warn | J'envoie de l'argent à quelqu'un en qui j'ai confiance. | Tu envoies `{montant}` `{jeton}` à une adresse neuve, sans retour possible. | Des escrocs gagnent ta confiance en ligne, puis demandent un gros envoi. | Tu décides: vérifie qui te demande cet envoi, et pourquoi. |
| F25 | Nous n'avons pas pu vérifier cette opération | warn | Aucune alerte ne s'affiche, donc je peux signer sans crainte. | Nous n'avons pas pu vérifier cette opération sur tes `{montant}` `{jeton}`. | Elle peut être piégée comme elle peut être normale: nous l'ignorons. | Réessaie dans un instant. Sans résultat, vérifie toi-même avant de signer. |
| F26 | Aucun piège repéré, mais la vérification reste limitée | info | Je fais l'opération simple que j'ai demandée. | Cette opération envoie `{montant}` `{jeton}` à `{contact}`, comme tu l'as dit. | Notre vérification est limitée: elle peut rater un piège. | Contrôle toi-même le montant et le destinataire avant de signer. |
| F27 | Un faux cadeau te fait donner accès à tes jetons | critical | Je réclame le cadeau gratuit annoncé par `{site}`. | Ce cadeau autorise `{site}` à prendre tes `{montant}` `{jeton}`. | Un vrai cadeau ne demande jamais l'accès à tes jetons. | Annule: personne ne donne de l'argent contre une signature. |
| F28 | Un faux proche te demande un envoi urgent | critical | Un proche me demande de l'aide pour un envoi urgent. | Tes `{montant}` `{jeton}` partiraient chez un inconnu, sans retour possible. | Un escroc peut écrire avec le nom et la photo d'un proche. | Appelle ton proche au numéro habituel avant d'envoyer quoi que ce soit. |
| F29 | Tes fonds arrivent sur un autre réseau que celui demandé | critical | Je déplace mes jetons vers `{reseau_demande}`, comme prévu. | Tes `{montant}` `{jeton}` arriveraient sur `{reseau_reel}`, pas sur `{reseau_demande}`. | Chaque réseau est séparé: un envoi au mauvais endroit est souvent perdu. | Annule et vérifie le réseau et l'adresse d'arrivée avant de recommencer. |
| F30 | Un site pourra te prélever de l'argent régulièrement | warn | J'autorise un paiement unique pour cet abonnement. | `{site}` pourra prélever `{montant}` `{jeton}` tous les `{jours}` jours. | L'autorisation se répète seule, tant que tu ne l'annules pas. | Continue seulement si tu veux vraiment un abonnement avec ce site. |
| F31 | Envoi vers une adresse nouvelle pour toi | warn | J'envoie à l'adresse que j'ai choisie. | Cette opération envoie `{montant}` `{jeton}` à `{adresse_debut}`…`{adresse_fin}`, une adresse nouvelle. | Un envoi vers une mauvaise adresse ne peut pas être récupéré. | Vérifie l'adresse, lettre par lettre, avant de signer. |
| F32 | Un site te fait ajouter un réseau qu'il contrôle | warn | Je change de réseau pour utiliser mon portefeuille. | Ce site te fait ajouter un réseau qu'il contrôle lui-même. | Il peut afficher de faux soldes et de fausses réponses. | Annule, sauf si tu connais ce réseau et ce site. |
| F33 | Un site te fait passer sur un réseau inconnu | warn | Je change de réseau pour utiliser mon portefeuille. | Ce site te fait passer sur un réseau que personne n'a vérifié. | Un réseau inconnu peut afficher de faux soldes. | Reste sur ton réseau habituel, sauf si tu connais celui-ci. |
| F34 | Un site peut dépenser un montant précis de tes jetons | info | Je veux seulement faire mon échange sur `{site}`. | Tu donnes à `{site}` le droit de prendre `{montant}` `{jeton}`, pas plus. | Seuls `{montant}` `{jeton}` peuvent partir, pas le reste de ton solde. | Vérifie que ce montant est bien celui que tu veux donner. |
| F35 | Une signature donne le droit de dépenser un montant précis | warn | Je signe un simple message, sans payer de frais. | Cette signature laisse `{site}` prendre `{montant}` `{jeton}`, pas plus. | Signer ne coûte rien, mais ça vaut une autorisation de dépenser. | Signe seulement si tu as demandé cette autorisation. |
| F36 | Jeton non reconnu : je n’ai pas pu le vérifier | warn | J’utilise un jeton que je connais, comme d’habitude. | Ce jeton m’est inconnu: je n’ai pas pu le vérifier. | Un faux jeton peut copier le nom d’un vrai. | Retrouve l’adresse officielle du jeton avant de signer. |
| F37 | Droit sans limite donné à un programme déjà connu | info | Je veux seulement faire mon échange sur `{site}`. | Un programme connu pourra prendre tous tes `{jeton}`, sans limite de montant. | Le droit reste ouvert tant que tu ne le retires pas. | Si tu peux, limite le droit au montant de ton échange. |
| F38 | Un échange: tu donnes un jeton, tu en reçois un autre | info | J’échange mes jetons contre ceux que le site annonce. | Tu donnes `{montant}` `{jeton}` et tu reçois `{recu}`. | Notre vérification est limitée: elle peut rater un piège. | Contrôle les deux montants avant de signer l’échange. |
| F39 | Cette adresse ressemble un peu à une adresse connue | warn | J’envoie à une adresse que j’ai déjà utilisée. | Tes `{montant}` `{jeton}` partiraient vers `{adresse_debut}`…`{adresse_fin}`, qui ressemble à une adresse connue. | Le début et la fin sont proches, mais le milieu change. | Compare l’adresse entière avec celle que tu connais. |
| F40 | Le message à signer cache un ordre déguisé | critical | Je signe un message pour prouver que c’est moi. | Ce n’est pas un texte: c’est un ordre déguisé en message. | Il peut donner à un inconnu le droit de prendre tes `{jeton}`. | Ne signe pas, et ferme la page. |
| F41 | Le texte que tu signes parle de donner tes fonds | critical | Je signe un texte pour me connecter ou prouver qui je suis. | Ce texte dit que tu donnes ou déplaces des actifs. | Une signature vaut accord, même si le texte est long. | Ne signe pas, sauf si tu veux vraiment ce transfert. |
| F42 | Ce message ne contient ni montant ni destinataire | info | Je signe un message pour utiliser ce site. | Ce message ne contient ni montant ni destinataire. | Notre vérification est limitée: elle peut rater un piège. | Vérifie que le site est bien celui que tu attends. |

## 2. Calibrage de la gravité

| Id | Niveau | Phrase de calibrage | Nom technique (interne, jamais affiché) |
|---|---|---|---|
| F01 | critical | Tu peux perdre tout ce jeton: on te retient et on explique. | approve illimité (ERC-20) |
| F02 | critical | Gratuit en apparence, mais ton solde peut partir: on te retient. | permit / Permit2 / DAI permit (signature hors chaîne) |
| F03 | critical | Toute ta collection peut disparaître: on te retient. | setApprovalForAll (autorisation de tous les NFT) |
| F04 | critical | Tu peux perdre un NFT de valeur pour rien: on te retient. | offre Seaport à zéro (ordre de vente) |
| F05 | critical | Impossible de savoir ce que tu autorises: on te retient. | signature aveugle (eth_sign / message opaque) |
| F06 | warn | Aucun argent ne bouge, mais ta connexion peut être volée. | connexion SIWE d'un autre domaine |
| F07 | critical | Perte de contrôle durable de ton compte: on te retient longtemps. | transferOwnership / changement de propriétaire |
| F08 | critical | Un inconnu peut vider le compte partagé: on te retient. | Safe: addOwner / enableModule / changement de seuil |
| F09 | critical | Un programme inconnu a tous les pouvoirs: on te retient. | delegatecall (appel délégué) |
| F10 | critical | Le service peut devenir piégé du jour au lendemain: on te retient. | mise à jour d'un contrat intermédiaire (upgrade de proxy) |
| F11 | critical | Un programme garde la main sur ton compte durablement: on te retient. | délégation EIP-7702 |
| F12 | critical | L'écran du site cache une action grave: on te retient. | appel caché dans un envoi groupé (Multicall / MultiSend) |
| F13 | critical | Ton envoi partira chez un escroc, sans retour: on te retient. | empoisonnement d'adresse (sosie dans l'historique) |
| F14 | warn | Rien n'est perdu encore, mais le piège est posé. | empoisonnement par transfert de valeur nulle |
| F15 | critical | Tu paies pour une copie sans valeur: on te retient. | faux token (symbole usurpé) |
| F16 | critical | Ton achat serait coincé pour toujours: on te retient. | honeypot (vente impossible) |
| F17 | critical | Tout ce que tu reçois part chez un autre: on te retient. | swap avec destinataire différent de soi |
| F18 | critical | Tu perds une grosse part de ton montant: on te retient. | glissement de prix énorme (slippage) |
| F19 | critical | Ton envoi part chez un voleur, sans retour: on te retient. | adresse copiée remplacée (clipper) |
| F20 | critical | Tout ce que tu signes ici profite à un escroc. | domaine sosie / ENS sosie |
| F21 | critical | Quelqu'un te dicte quoi faire: on te retient et on explique. | faux support (scénario S1, S5) |
| F22 | critical | Tu perds de l'argent de plus, sans rien récupérer: on te retient. | faux remboursement / recouvrement (scénario S2) |
| F23 | critical | Ta signature donne accès à tes jetons: on te retient. | faux recruteur (scénario S3) |
| F24 | warn | Aucun piège technique, mais le schéma ressemble à une arnaque. | pig butchering / parcours conforme (scénario S4) |
| F25 | warn | Aucune conclusion possible: on le dit clairement, sans te rassurer. | vérification impossible (jamais OK) |
| F26 | info | Rien d'anormal repéré: message discret, sans promesse de sécurité. | cas bénin (aucun signal, jamais un feu vert) |
| F27 | critical | Ta signature vide ton portefeuille: on te retient. | faux airdrop (scénario S7) |
| F28 | critical | Tu envoies à un inconnu, sans retour possible: on te retient. | faux proche (scénario S6) |
| F29 | critical | Un envoi vers le mauvais réseau est souvent irrécupérable. | pont inter-réseaux, destination inattendue |
| F30 | warn | Dépenses répétées possibles: on te prévient, tu décides. | permission récurrente (prélèvements répétés) |

## 2 bis. Variantes courtes (niveau info, site ou contact déjà connu)

Pour un envoi ou un échange habituel vers un site connu, deux lignes discrètes remplacent la fiche complète, afin de ne pas lasser les utilisateurs avertis.

| Id | Cas | Niveau | Ligne 1 | Ligne 2 |
|---|---|---|---|---|
| F01 | site connu, droit déjà utilisé avant | info | Droit sans limite demandé à `{site}`, site que tu utilises déjà. | Tu peux le limiter à `{montant}` `{jeton}` avant de signer. |
| F02 | site connu, signature déjà utilisée avant | info | Signature gratuite: `{site}` pourra prendre tes `{jeton}` pendant `{jours}` jours. | Vérifie que tu l'as demandée toi-même. |
| F03 | site connu où tu vends déjà tes NFT | info | `{site}` pourra déplacer tous tes NFT de la collection. | Tu peux refuser si tu ne vends rien. |
| F26 | envoi habituel vers un contact connu | info | Envoi de `{montant}` `{jeton}` à `{contact}`. | Vérification limitée: contrôle toi-même le destinataire. |

## 3. Questions de compréhension (bonne réponse en gras)

### F01. Un site peut dépenser tous tes jetons sans limite

1. Que peut faire ce site si tu signes ?
   - A) Rien du tout
   - B) T'envoyer des jetons
   - C) **Dépenser tes jetons quand il veut**
2. Combien de temps ce droit dure-t-il ?
   - A) Pendant une heure seulement
   - B) Jusqu'à la fin de l'échange
   - C) **Jusqu'à ce que tu le retires toi-même**
3. Que fais-tu pour limiter le risque ?
   - A) **J'autorise seulement le montant utile**
   - B) J'autorise un montant illimité
   - C) Je signe vite

### F02. Une signature gratuite autorise un site à prendre tes jetons

1. Pourquoi cette signature est-elle risquée, même gratuite ?
   - A) Elle efface ton compte
   - B) Elle coûte très cher en frais
   - C) **Elle peut valoir un chèque signé**
2. Pendant combien de temps ce site peut-il agir ?
   - A) Une seconde
   - B) **Jusqu'à la date indiquée**
   - C) Jamais
3. Que fais-tu si tu n'as rien demandé ?
   - A) Je signe pour voir
   - B) Je pose la question au site
   - C) **Je ne signe pas**

### F03. Un site peut déplacer tous tes NFT d'une collection

1. Combien de NFT ce site pourrait-il prendre ?
   - A) Un seul
   - B) **Tous ceux de la collection**
   - C) Aucun
2. Cela inclut-il les NFT reçus plus tard ?
   - A) Seulement la moitié
   - B) Non
   - C) **Oui**
3. Que fais-tu si tu veux juste regarder tes NFT ?
   - A) Je signe
   - B) J'attends un peu
   - C) **Je refuse**

### F04. Ton NFT part en vente presque gratuite, à ton insu

1. Que reçois-tu en échange de ton NFT si tu signes ?
   - A) Le double
   - B) Sa valeur réelle
   - C) **Presque rien**
2. Qui peut acheter ton NFT à ce prix ?
   - A) Seulement toi
   - B) Personne
   - C) **N'importe qui**
3. Que fais-tu si le prix te paraît faux ?
   - A) Je signe quand même
   - B) Je vends vite
   - C) **J'annule**

### F05. Tu signes un message illisible

1. Pourquoi ce message est-il dangereux ?
   - A) Il est trop court
   - B) **On ne peut pas lire ce qu'il autorise**
   - C) Il est gratuit
2. Peux-tu savoir ce qu'il autorise ?
   - A) Oui, facilement
   - B) Oui, en payant
   - C) **Non**
3. Le site est connu, le texte est illisible. Que fais-tu ?
   - A) **Je refuse de signer**
   - B) Je signe, le site est connu
   - C) Je signe en lisant en diagonale

### F06. Un autre site que celui affiché te connecte à ton compte

1. Ce message déplace-t-il ton argent ?
   - A) **Non, mais il te connecte**
   - B) Oui, tout
   - C) Oui, un peu
2. À quel site es-tu vraiment connecté ?
   - A) **À `{site_reel}`**
   - B) À `{site}`
   - C) À aucun des deux
3. Que fais-tu face à cette alerte ?
   - A) Je continue
   - B) Je recommence
   - C) **Je ferme et j'ouvre mes favoris**

### F07. Quelqu'un d'autre devient propriétaire de ton compte

1. Qui contrôle ton compte après la signature ?
   - A) Toi seul
   - B) **L'adresse inconnue**
   - C) Ton portefeuille
2. Peux-tu annuler après avoir signé ?
   - A) Oui, toujours
   - B) Oui, dans un jour
   - C) **Non, souvent plus du tout**
3. Tu n'as pas demandé ce changement. Que fais-tu ?
   - A) Je signe
   - B) **J'annule et je préviens un proche**
   - C) J'attends demain

### F08. Un accès secret est ajouté à ton compte partagé

1. Que fait cette opération ?
   - A) **Elle ajoute un accès au compte partagé**
   - B) Elle ferme le compte
   - C) Elle change ton mot de passe
2. Qui devrait être au courant ?
   - A) Personne
   - B) **Tous les membres du compte**
   - C) Seulement toi
3. Personne n'a demandé ça. Que fais-tu ?
   - A) Je signe
   - B) J'attends
   - C) **J'annule**

### F09. Un programme étranger prend les commandes de ton compte

1. Que reçoit le programme étranger ?
   - A) Un simple reçu
   - B) **Les pleins pouvoirs sur ton compte**
   - C) Un message
2. Est-ce une opération de routine ?
   - A) Oui
   - B) Oui, tous les jours
   - C) **Non, c'est rare et risqué**
3. Que fais-tu face à cette alerte ?
   - A) **J'annule**
   - B) Je signe vite
   - C) Je signe deux fois

### F10. Un service que tu utilises peut changer et te piéger

1. Que change cette opération ?
   - A) **Le fonctionnement du service**
   - B) Ton mot de passe
   - C) Ton adresse
2. Peux-tu lire ce que le service fera après ?
   - A) **Non, c'est caché pour l'instant**
   - B) Oui, c'est affiché ici
   - C) Oui, en entier sur le site
3. Que fais-tu face à cette alerte ?
   - A) Je signe vite
   - B) **Je regarde l'annonce officielle d'abord**
   - C) Je demande un remboursement

### F11. Ton compte confie ses pouvoirs à un programme inconnu

1. Combien de temps dure ce droit ?
   - A) Une minute
   - B) Une journée
   - C) **Jusqu'à ce que tu le retires**
2. Que peut faire ce programme ?
   - A) Rien
   - B) **Tout faire à ta place**
   - C) Seulement regarder
3. Un inconnu te l'a proposé. Que fais-tu ?
   - A) Je signe
   - B) **Je refuse**
   - C) Je teste avec un peu d'argent

### F12. Une seule signature cache plusieurs actions dont une dangereuse

1. Combien d'actions contient cet envoi ?
   - A) Une seule
   - B) **Plusieurs, dont une cachée**
   - C) Aucune
2. Que permet l'action cachée ?
   - A) **Dépenser tes jetons**
   - B) Changer la langue
   - C) Voir ton solde
3. Que fais-tu face à cette alerte ?
   - A) Je signe, l'écran semble normal
   - B) Je continue sans lire
   - C) **J'annule**

### F13. Une fausse adresse presque identique à celle de ton contact

1. D'où vient cette adresse ressemblante ?
   - A) De ta banque
   - B) **D'un inconnu, glissée dans ton historique**
   - C) De ton contact
2. Ses premières et dernières lettres sont-elles identiques ?
   - A) **Oui, c'est le piège**
   - B) Non, jamais
   - C) Seulement les dernières
3. Où retrouves-tu la bonne adresse ?
   - A) Dans mon historique
   - B) Sur un forum
   - C) **Auprès de mon contact, par un autre moyen**

### F14. Un inconnu glisse son adresse dans ton historique avec un envoi nul

1. Pourquoi un inconnu t'envoie-t-il un montant de zéro ?
   - A) **Pour apparaître dans ton historique**
   - B) Pour te faire un cadeau
   - C) Par erreur
2. Que perds-tu si tu envoies à cette adresse ?
   - A) Rien
   - B) Un peu de frais
   - C) **Tout l'envoi**
3. Où prends-tu l'adresse de ton contact ?
   - A) Dans l'historique
   - B) **Auprès de lui, par un autre moyen**
   - C) Dans un e-mail reçu

### F15. Un faux jeton qui porte le même nom que le vrai

1. Ce jeton est-il le vrai ?
   - A) Oui, il a le même nom
   - B) **Non, c'est une copie**
   - C) Oui, il est très connu
2. Qu'est-ce qui prouve qu'un jeton est le vrai ?
   - A) **Son adresse sur le site officiel**
   - B) Son nom
   - C) Son logo
3. Que fais-tu face à cette alerte ?
   - A) **Je cherche le vrai jeton sur le site officiel**
   - B) J'achète un peu
   - C) J'achète beaucoup

### F16. Un jeton que tu pourras acheter mais jamais revendre

1. Que pourras-tu faire de ce jeton après l'achat ?
   - A) Le revendre
   - B) **Rien, il reste coincé chez toi**
   - C) L'échanger
2. Comment l'avons-nous su ?
   - A) **Par un test de revente**
   - B) Au hasard
   - C) Par son nom
3. Que fais-tu face à cette alerte ?
   - A) J'achète peu
   - B) J'achète beaucoup
   - C) **J'annule**

### F17. Ton échange envoie le résultat à une autre personne que toi

1. Qui reçoit le résultat de l'échange ?
   - A) Toi
   - B) **Une autre adresse**
   - C) Le site officiel
2. Où apparaît le problème ?
   - A) Dans le montant
   - B) **Dans le destinataire**
   - C) Dans le prix
3. Que fais-tu face à cette alerte ?
   - A) Je signe
   - B) J'attends
   - C) **J'annule et je relance en vérifiant mon adresse**

### F18. Un échange te rend beaucoup moins que ce que tu donnes

1. Combien reçois-tu vraiment ?
   - A) Autant que tu donnes
   - B) **Beaucoup moins que tu donnes**
   - C) Le double
2. Qui profite de la différence ?
   - A) Toi
   - B) **Des robots**
   - C) Ton portefeuille
3. Que fais-tu face à cette alerte ?
   - A) Je signe
   - B) J'achète plus
   - C) **Je baisse la perte acceptée et je relance**

### F19. L'adresse que tu as collée n'est plus celle que tu as copiée

1. Qu'est-ce qui a changé ?
   - A) Le montant
   - B) **L'adresse collée**
   - C) Le jeton
2. Qui a pu la changer ?
   - A) **Un logiciel espion**
   - B) Ton contact
   - C) Ton portefeuille
3. Que fais-tu ensuite ?
   - A) J'envoie quand même
   - B) Je recopie vite
   - C) **Je compare l'adresse avec mon contact**

### F20. Un faux site qui ressemble au vrai

1. Ce site est-il le vrai ?
   - A) Oui
   - B) **Non, c'est un sosie**
   - C) Peut-être, il est joli
2. Comment un faux site trompe-t-il ?
   - A) **Avec une adresse presque identique**
   - B) En te téléphonant seulement
   - C) Avec un virus obligatoire
3. Que fais-tu face à cette alerte ?
   - A) Je continue
   - B) Je recharge la page
   - C) **Je ferme et j'ouvre mes favoris**

### F21. Un faux support te guide pas à pas pour déplacer tes fonds

1. Un vrai support te demande-t-il de signer ou d'envoyer ?
   - A) **Jamais**
   - B) Parfois
   - C) Toujours
2. Pourquoi cette personne te presse-t-elle ?
   - A) **Pour t'empêcher de réfléchir**
   - B) Pour t'aider vite
   - C) Par politesse
3. Que fais-tu face à cette alerte ?
   - A) Je continue la ligne
   - B) Je donne ma phrase secrète
   - C) **Je raccroche et je rappelle le numéro officiel**

### F22. Un faux remboursement te demande de payer des frais d'avance

1. Un vrai remboursement demande-t-il des frais d'avance ?
   - A) Oui, toujours
   - B) **Jamais**
   - C) Parfois
2. Qui cible les gens qui ont déjà perdu de l'argent ?
   - A) **Des escrocs**
   - B) La police
   - C) Ta banque
3. Que fais-tu face à cette alerte ?
   - A) Je paie un peu
   - B) Je paie vite
   - C) **Je ne paie rien**

### F23. Un faux recruteur te fait signer avec ton portefeuille

1. Un vrai employeur te demande-t-il de signer pour t'embaucher ?
   - A) **Jamais**
   - B) Souvent
   - C) Toujours
2. Que gagnes-tu si tu signes ?
   - A) Un salaire
   - B) **Rien, tu perds tes jetons**
   - C) Un cadeau
3. Que fais-tu face à cette alerte ?
   - A) Je signe pour vérifier
   - B) Je donne mon adresse
   - C) **Je vérifie l'entreprise, sans signer**

### F24. Un envoi important vers un nouveau contact qui te guide

1. Pourquoi cette alerte alors que rien n'est faux ?
   - A) **L'adresse est neuve, le montant grand, quelqu'un te guide**
   - B) Le site est lent
   - C) Ton solde est bas
2. Une personne rencontrée en ligne peut-elle être un escroc ?
   - A) Non, jamais
   - B) **Oui, même si elle est gentille**
   - C) Seulement si elle demande ta phrase secrète
3. Que fais-tu face à cette alerte ?
   - A) **Je vérifie qui me demande cet envoi, et pourquoi**
   - B) J'envoie tout
   - C) J'envoie la moitié

### F25. Nous n'avons pas pu vérifier cette opération

1. Cette opération est-elle sûre ?
   - A) Oui
   - B) **On ne le sait pas**
   - C) Non, c'est certain
2. Aucune alerte affichée veut-il dire que tout va bien ?
   - A) **Non**
   - B) Oui
   - C) Parfois
3. Que fais-tu face à cette alerte ?
   - A) **Je réessaie, puis je vérifie moi-même**
   - B) Je signe vite
   - C) J'ignore le message

### F26. Aucun piège repéré, mais la vérification reste limitée

1. Notre vérification peut-elle rater un piège ?
   - A) **Oui, elle peut en rater**
   - B) Non, jamais
   - C) Seulement le week-end
2. Que vérifies-tu toi-même ?
   - A) Rien
   - B) **Le montant et le destinataire**
   - C) La météo
3. Quelqu'un te presse. Que fais-tu ?
   - A) J'accélère
   - B) Je signe
   - C) **Je m'arrête et je réfléchis**

### F27. Un faux cadeau te fait donner accès à tes jetons

1. Un vrai cadeau demande-t-il l'accès à tes jetons ?
   - A) Oui
   - B) **Jamais**
   - C) Parfois
2. Que reçoit réellement le site ?
   - A) **Le droit de prendre tes jetons**
   - B) Un merci
   - C) Rien
3. Que fais-tu face à cette alerte ?
   - A) Je signe vite
   - B) Je signe avec un petit montant
   - C) **J'annule**

### F28. Un faux proche te demande un envoi urgent

1. Qui t'écrit peut-il être un escroc ?
   - A) **Oui, même avec le nom d'un proche**
   - B) Non, jamais
   - C) Seulement un inconnu
2. Pourquoi te dit-on que c'est urgent ?
   - A) Pour te laisser réfléchir
   - B) **Pour t'empêcher de vérifier**
   - C) Pour t'aider
3. Que fais-tu face à cette alerte ?
   - A) J'envoie tout de suite
   - B) Je réponds par message
   - C) **J'appelle mon proche au numéro habituel**

### F29. Tes fonds arrivent sur un autre réseau que celui demandé

1. Où risquent d'arriver tes jetons ?
   - A) **Sur `{reseau_reel}`, pas où tu voulais**
   - B) Chez toi, sur `{reseau_demande}`
   - C) Dans ton portefeuille
2. Peut-on les récupérer facilement ensuite ?
   - A) Oui
   - B) Toujours
   - C) **Rarement**
3. Que fais-tu face à cette alerte ?
   - A) **Je vérifie l'arrivée avant de recommencer**
   - B) Je signe
   - C) J'envoie deux fois

### F30. Un site pourra te prélever de l'argent régulièrement

1. Combien de fois ce site peut-il te prélever ?
   - A) Une seule fois
   - B) **Plusieurs fois, sans te redemander**
   - C) Jamais
2. Quand cela s'arrête-t-il ?
   - A) Tout seul, très vite
   - B) **Quand tu annules**
   - C) Jamais pour personne
3. Tu ne veux pas d'abonnement. Que fais-tu ?
   - A) **Je refuse**
   - B) Je signe
   - C) J'attends sans rien faire

### F31. Envoi vers une adresse nouvelle pour toi

1. Peut-on récupérer un envoi fait à une mauvaise adresse ?
   - A) Oui, toujours
   - B) **Non, c'est presque toujours perdu**
   - C) Oui, en appelant le site
2. Comment vérifies-tu une adresse nouvelle ?
   - A) Je regarde les premières lettres
   - B) **Je la compare en entier avec la source**
   - C) Je fais confiance au site
3. Quelqu'un te presse d'envoyer. Que fais-tu ?
   - A) J'envoie vite
   - B) **Je m’arrête et je vérifie**
   - C) Je demande un code

### F32. Un site te fait ajouter un réseau qu'il contrôle

1. Que peut faire un réseau contrôlé par un site ?
   - A) **Afficher de faux soldes**
   - B) Rien du tout
   - C) Protéger tes fonds
2. Quand acceptes-tu d'ajouter un réseau ?
   - A) Quand le site insiste
   - B) **Quand je le connais déjà**
   - C) Toujours
3. Le site te presse d'ajouter ce réseau. Que fais-tu ?
   - A) J'ajoute vite
   - B) **Je ferme et je vérifie**
   - C) Je demande au site

### F33. Un site te fait passer sur un réseau inconnu

1. Un réseau inconnu peut-il mentir sur tes soldes ?
   - A) **Oui, il le peut**
   - B) Non, jamais
   - C) Seulement la nuit
2. Sur quel réseau restes-tu par défaut ?
   - A) **Celui que je connais**
   - B) Celui que le site choisit
   - C) Le plus récent
3. Le site te presse de changer. Que fais-tu ?
   - A) Je change vite
   - B) **Je ferme et je vérifie**
   - C) Je demande au site

### F34. Un site peut dépenser un montant précis de tes jetons

1. Combien ce site peut-il prendre au plus ?
   - A) Tout ton solde
   - B) **Le montant écrit, pas plus**
   - C) Rien du tout
2. Que dois-tu contrôler avant de signer ?
   - A) La couleur du bouton
   - B) **Que le montant correspond à ton échange**
   - C) Rien, c’est limité
3. Le montant est plus grand que prévu. Que fais-tu ?
   - A) Je signe quand même
   - B) **Je refuse et je le corrige**
   - C) J’attends demain

### F35. Une signature donne le droit de dépenser un montant précis

1. Cette signature a-t-elle des conséquences ?
   - A) Non, c’est gratuit donc sans effet
   - B) **Oui, elle donne un droit de dépense**
   - C) Seulement si je paie
2. Combien le site peut-il prendre au plus ?
   - A) **Le montant écrit**
   - B) Tout ton solde
   - C) Rien
3. Tu n’as rien demandé à ce site. Que fais-tu ?
   - A) Je signe
   - B) **Je ne signe pas**
   - C) Je signe plus tard

### F36. Jeton non reconnu : je n’ai pas pu le vérifier

1. Un jeton inconnu est-il forcément sûr ?
   - A) Oui
   - B) **Non, il peut être faux**
   - C) Seulement s’il a un logo
2. Qu’est-ce qui prouve qu’un jeton est vrai ?
   - A) Son nom
   - B) **Son adresse officielle**
   - C) Son logo
3. Un site te presse d’accepter ce jeton. Que fais-tu ?
   - A) J’accepte
   - B) **Je vérifie son adresse officielle**
   - C) Je demande à un inconnu

### F37. Droit sans limite donné à un programme déjà connu

1. Ce droit a-t-il une limite de montant ?
   - A) Oui, celle de l’échange
   - B) **Non, il n’en a pas**
   - C) Oui, un petit montant
2. Que peux-tu faire pour réduire le risque ?
   - A) **Limiter le droit au montant utile**
   - B) Rien
   - C) Signer plus vite
3. Quand ce droit s’arrête-t-il ?
   - A) **Quand tu le retires**
   - B) Dès la fin de l’échange
   - C) Au bout d’une heure

### F38. Un échange: tu donnes un jeton, tu en reçois un autre

1. Que donnes-tu dans cet échange ?
   - A) Rien
   - B) **Le montant affiché**
   - C) Tout ton solde
2. La vérification peut-elle rater un piège ?
   - A) Non, jamais
   - B) **Oui, elle est limitée**
   - C) Seulement la nuit
3. Que contrôles-tu avant de signer ?
   - A) **Les deux montants**
   - B) La couleur
   - C) Rien

### F39. Cette adresse ressemble un peu à une adresse connue

1. Que compares-tu pour une adresse ?
   - A) Seulement le début
   - B) **L’adresse en entier**
   - C) Seulement la fin
2. Deux adresses se ressemblent. Sont-elles la même ?
   - A) Oui
   - B) **Non, pas forcément**
   - C) Toujours
3. Tu hésites sur l’adresse. Que fais-tu ?
   - A) J’envoie quand même
   - B) **Je la demande à la source**
   - C) Je devine

### F40. Le message à signer cache un ordre déguisé

1. Ce message est-il un simple texte ?
   - A) Oui
   - B) **Non, c’est un ordre caché**
   - C) Parfois
2. Que peut faire un ordre caché ?
   - A) Rien
   - B) **Donner un droit sur tes jetons**
   - C) Changer la couleur
3. Que fais-tu face à cette alerte ?
   - A) Je signe
   - B) **Je ferme la page**
   - C) Je signe plus tard

### F41. Le texte que tu signes parle de donner tes fonds

1. Que vaut une signature sous un texte ?
   - A) Rien
   - B) **Un accord**
   - C) Un essai
2. Le texte parle de déplacer tes actifs. Et alors ?
   - A) C’est sans importance
   - B) **Je ne signe que si je le veux**
   - C) Je signe vite
3. Que fais-tu face à cette alerte ?
   - A) Je signe
   - B) **J’annule**
   - C) J’attends

### F42. Ce message ne contient ni montant ni destinataire

1. Ce message envoie-t-il de l’argent ?
   - A) **Aucun montant n’a été repéré**
   - B) Il envoie tout
   - C) Je ne sais pas lire
2. Notre vérification peut-elle rater un piège ?
   - A) Non, jamais
   - B) **Oui, elle est limitée**
   - C) Seulement ce mois
3. Que contrôles-tu avant de signer ?
   - A) **Le site**
   - B) Rien
   - C) La météo
