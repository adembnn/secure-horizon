# Ce qui ne marche pas

Mesuré sur la moitié contrôle du grand panel (2 662 paires, empreinte `5ff2096a9763…`), installation par défaut, build du commit `7a5eadc` (empreinte du décideur `38e3afdd56bd…`), le 11 octobre 2026. Commande : `node --no-warnings preuves/banc.mjs --instantane=38e3afdd56bd1918 --mesurer-malgre-panne`. Tous les intervalles sont de Wilson à 95 %. Définitions : `PROTOCOLE.md`. Tableaux complets : `CHIFFRES_TRACES.md`. Chaque exemple porte l'identifiant de la paire ; la ligne complète est dans `out/ERREURS_panel_controle.jsonl`.

Rien ici n'est corrigé. Rien n'est adouci.

## Vue d'ensemble

| | Sans modèle (mots-clés) | Avec Clef-flash |
|---|---|---|
| Non conformes attrapés | 866/1 752 = 49,4 % [47,1 ; 51,8] | 997/1 752 = 56,9 % [54,6 ; 59,2] |
| Non conformes ratés (« ça correspond ») | 47/1 752 = 2,7 % [2,0 ; 3,5] | 64/1 752 = 3,7 % [2,9 ; 4,6] |
| Non conformes laissés « pas pu vérifier » | 547/1 752 = 31,2 % | 399/1 752 = 22,8 % |
| Non conformes en panne du moteur | 292/1 752 = 16,7 % | 292/1 752 = 16,7 % |
| Fausses alertes sur conformes | 44/539 = 8,2 % [6,1 ; 10,8] | 85/539 = 15,8 % [12,9 ; 19,1] |
| Conformes reconnus (« ça correspond ») | 142/539 = 26,3 % | 197/539 = 36,5 % |
| Conformes laissés « pas pu vérifier » | 197/539 = 36,5 % | 101/539 = 18,7 % |
| Conformes en panne du moteur | 156/539 = 28,9 % | 156/539 = 28,9 % |
| Surconfiance sur indécidables | 0/371 [0 ; 1,0] | 0/371 [0 ; 1,0] |

Une demande conforme sur quatre seulement reçoit « ça correspond » sans modèle. Le modèle attrape plus et double les fausses alertes.

## Gravité 1 : le produit dit « ça correspond » à une demande qui trahit la personne

### 1.1 Droit durable ou sans échéance (D1)

Phrase respectée, signature valable dix ans ou sans fin. Attrapé : 0/43 [0 ; 8,2] sans modèle, 3/43 avec Clef. **Raté : 21/43 = 48,8 % [34,6 ; 63,2] sans modèle, 34/43 = 79,1 % [64,8 ; 88,6] avec Clef.** Le reste : « pas pu vérifier », parce que la phrase n'est pas comprise.

Exemple, P-07293 : « Swap de 100 USDC vers USDT » ; la demande est une signature qui donne à Uniswap le droit de dépenser 100 USDC sans échéance proche. Réponse : « ça correspond ». Signal : aucun, `written_check` ne lit que le montant. La durée n'est comparée nulle part. Mieux la phrase est comprise, plus ce trou s'ouvre : c'est pourquoi Clef fait pire.

### 1.2 Le droit va à une autre adresse que celle écrite ou nommée

« Autoriser Uniswap à utiliser 50 USDC », le droit part vers une adresse inconnue. Attrapé : 21/185 = 11,4 % [7,5 ; 16,7] sans modèle, 53/185 = 28,6 % avec Clef. **Raté : 10/185 = 5,4 % sans modèle, 17/185 = 9,2 % [5,8 ; 14,2] avec Clef.** Le reste : « pas pu vérifier » ou panne.

Exemple, P-01036 : « Accorder à Trader Joe un accès à 0,1 WAVAX » ; la demande donne le droit à 0x373f…9ddf, une adresse inconnue. Réponse : « ça correspond ». `written_check.js` compare le destinataire d'un paiement, jamais le bénéficiaire d'un droit. Le montant est juste, donc tout passe.

### 1.3 La signature vaut sur un autre réseau (D6)

Attrapé 42/51 = 82,4 % sans modèle. **Raté : 9/51 = 17,6 % [9,6 ; 30,3].** Le moteur voit l'écart (`domain_chain_mismatch`, niveau danger) et la fenêtre dit quand même « ça correspond » : dans `outcome.js`, `covers()` laisse passer un danger dès que la phrase parle d'autoriser. Exemple, P-07887 : « Je donne l'autorisation à Trader Joe pour 12,5 USDC ».

### 1.4 Minimum reçu presque nul dans un échange (D5)

Attrapé : 0/16 [0 ; 19,4]. Raté : 3/16 sans modèle, 5/16 avec Clef. Panne : 11/16. Exemple, P-07798 : « allez on échange 2500 USDC contre du DAI », minimum reçu : 1 unité de base. Réponse : « ça correspond ». Sur l'état intermédiaire du code, où la panne est corrigée, la moitié réglage donne 13 ratés sur 13 : c'est un trou entier, que la panne cachait.

### 1.5 L'échange rend un autre jeton que celui écrit

Écart « jeton » : attrapé 151/251 = 60,2 %, raté 4/251. Les ratés sont tous des échanges dont le jeton reçu diffère. Exemple, P-06424 : « Je souhaite convertir 50 USDC en WAVAX », l'échange rend des USDT. Le jeton reçu n'est comparé à rien.

## Gravité 2 : le build livré tombe en panne

`extension_standalone/extension/engine/sentinelle_core.js`, ligne 497 : `const niveau`. Ligne 512 : `niveau = …`. Exception pour toute demande que le moteur classe au niveau le plus bas, c'est-à-dire les demandes les plus banales.

- Envoi de jeton : 202/202 en panne. Envoi de monnaie du réseau : 114/114. Échange : 93/148. Lot : 70/186.
- Au total 520/2 662 = 19,5 % des paires.
- La personne voit « Je n'ai pas pu vérifier cette demande » et attend 30 secondes pour envoyer 20 USDC à un ami. Un envoi vers une mauvaise adresse reçoit la même réponse qu'un envoi juste : le produit ne distingue plus rien sur ces demandes.
- Le serveur (`server/server.mjs`) a `let` : la panne est propre au build autonome, celui qui est livré.
- Corrigé depuis dans le code vivant par un autre agent. Non remesuré sur un jeu scellé : c'est le rôle de la réserve.

## Gravité 3 : la personne n'est pas avertie (« pas pu vérifier » sur une demande non conforme)

| Case | Attrapé | « Pas pu vérifier » | Cause |
|---|---|---|---|
| Opération récurrente au lieu d'un paiement (D10) | 0/11 [0 ; 25,9] | 11/11 | `wallet_grantPermissions` est retenu mais pas lu : aucune phrase ne dit « chaque jour pendant un an » |
| Réseau ajouté face à « me connecter » (D11) | 0/8 [0 ; 32,4] | 8/8 | idem pour `wallet_addEthereumChain` |
| Jeton de même symbole, autre adresse (D2) | 36/335 = 10,7 % [7,9 ; 14,5] | 271/335 = 80,9 % | « Je ne connais pas ce jeton ». Le produit ne dit pas « ce n'est pas le vrai USDC » ; il s'abstient, exactement comme pour un vrai jeton hors de sa liste |
| Phrase sans montant | 10/115 = 8,7 % [4,8 ; 15,3] | 79/115 | sans montant, `writtenCheck` ne compare rien, même quand le jeton ou le destinataire sont faux |
| Montant en lettres (« cinquante USDC ») | 26/131 = 19,8 % [13,9 ; 27,5] | 80/131 | les nombres en lettres ne sont pas lus |
| « 50 dollars », « 50 $ » | 53/145 = 36,6 % [29,2 ; 44,6] | 73/145 | pas de jeton collé au montant |
| Monnaie du réseau envoyée en plus (D8) | 11/37 = 29,7 % | 14/37, panne 12/37 | |
| Nature de l'opération | 166/284 = 58,5 % | 20/284, panne 98/284 | |
| Montant plus grand | 165/255 = 64,7 % | 43/255, panne 47/255 | |

## Gravité 4 : fausses alertes et friction sur des demandes conformes

- **« 50 USD » lu comme un jeton nommé USD.** « Placer 750 USD sur Aave » face à un droit de 750 USDC : « Tu as écrit 750 USD. La demande donne accès à 750 USDC. » (P-00121). Style « dollars » : fausses alertes 8/34 = 23,5 % [12,4 ; 40,0] sans modèle, 13/34 avec Clef.
- **« 1,500 USDC » lu 1,5.** « I am turning 1,500 USDC into USDT » face à un droit de 1 200 USDC, inférieur au montant écrit : alerte (P-02682). Style « séparateurs » : 7/30 = 23,3 %.
- **Droit illimité voulu et écrit** : 3/3 en alerte (P-05083, « Allow Uniswap to spend all my DAI, no limit »). Voulu par la règle de plancher, mais c'est une alerte sur ce que la personne a demandé.
- **Phrase dictée par un tiers** : 26/38 = 68,4 % d'alertes sur des demandes conformes. Voulu : le produit alerte dès que « on m'a dit de ». À savoir avant qu'un juré écrive « mon comptable m'a demandé de payer ».
- **Clef ajoute 25 fausses alertes** sur « Je donne l'autorisation à Trader Joe pour 1500 USDC » face au droit exact (P-00009) : le modèle classe la phrase « payer quelqu'un », le comparateur du moteur lève `unexpected_approval`. Approbations : fausses alertes 11/69 sans modèle, 19/69 = 27,5 % avec Clef ; Permit : 10/96 contre 25/96.
- **Friction** : 36,5 % des demandes conformes reçoivent « pas pu vérifier » sans modèle, et 28,9 % tombent en panne. Jumeau « un seul NFT » (D3) : 12/12 en « pas pu vérifier ». Jeton réel hors liste (LINK, UNI) : 14/14 en panne ici ; sur l'état intermédiaire, 16/18 en fausse alerte « plus que le montant annoncé » (décimales inconnues).

## Résultat par axe d'attente par défaut (contrôle, sans modèle | avec Clef)

Phrase entièrement respectée, seul le défaut est trahi. Les jumelles conformes ne reçoivent aucune fausse alerte sans modèle (0/243), 14/243 avec Clef.

| Axe | Paires | Attrapé | Raté | « Pas pu vérifier » | Panne |
|---|---|---|---|---|---|
| D1 droit durable | 43 | 0 \| 3 | **21 \| 34** | 22 \| 6 | 0 |
| D2 jeton sosie | 335 | 36 \| 80 | 0 \| 0 | 271 \| 227 | 28 |
| D3 collection entière | 12 | 12 \| 12 | 0 | 0 | 0 |
| D4 bénéficiaire d'un échange | 12 | 12 \| 12 | 0 | 0 | 0 |
| D5 minimum reçu presque nul | 16 | 0 \| 0 | **3 \| 5** | 2 \| 0 | 11 |
| D5 prix de vente presque nul (ordre hors chaîne) | 3 | 3 \| 3 | 0 | 0 | 0 |
| D6 autre réseau | 51 | 42 \| 49 | **9 \| 2** | 0 | 0 |
| D7 opération de plus dans le lot | 25 | 23 \| 23 | 0 | 0 | 2 |
| D8 monnaie du réseau en plus | 37 | 11 \| 22 | 0 | 14 \| 3 | 12 |
| D9 prise de contrôle du compte | 23 | 23 \| 23 | 0 | 0 | 0 |
| D10 opération récurrente | 11 | 0 \| 0 | 0 | 11 \| 11 | 0 |
| D11 réglage du portefeuille | 8 | 0 \| 0 | 0 | 8 \| 8 | 0 |
| **Ensemble** | 576 | 162 = 28,1 % [24,6 ; 31,9] \| 227 = 39,4 % | 33 = 5,7 % \| 41 = 7,1 % | 328 \| 255 | 53 |

Les axes D3, D4, D5 prix et D9 ont entre 3 et 23 paires : un 100 % sur 12 a un intervalle qui descend à 75,8 %. D3, D4, D7 et D9 sont attrapés par le plancher du moteur, pas par la comparaison à la phrase : le produit alerterait aussi sans phrase.

Cela rejoint `exhaustivite/EXHAUSTIVITE_INTENTION.md`, qui conclut que la demande d'intention n'est pas exhaustive : durée (ses défauts 8 et 9), minimum reçu (7), bénéficiaire d'un droit, réglages (12) et récurrence (8) ne sont comparés à rien. Les frais (13) ne sont pas dans ce panel.

## Ce que la correction de la panne a ouvert (état intermédiaire, moitié réglage, à titre indicatif)

Code vivant du 11 octobre 07:58 UTC (commit `f1ca0ec` + 63 fichiers non commités, empreinte `c21809a218cc…`), sans modèle. Plus de panne, mais : ratés 173/2 370 = 7,3 % (contre 2,1 %), fausses alertes 109/702 = 15,5 % (contre 7,3 %), surconfiance 12/489 = 2,5 % (contre 0). Les 12 surconfiances : « Connecter mon portefeuille » face à un message libre à signer reçoit « ça correspond » avec la ligne « Nous n'avons trouvé aucun signal dangereux ». Détail dans `CHIFFRES_TRACES.md`, section 6. Ce n'est pas un contrôle.

## Ce qui n'est pas mesuré

Le produit dans un navigateur (interception, fenêtre, portefeuille réel). Des phrases écrites par de vraies personnes. La simulation d'effet sur un nœud. Les frais, les ponts, les dépôts, plusieurs demandes pour une phrase. La comparaison avec un portefeuille du commerce. Le code corrigé sur un jeu scellé : la réserve attend.
