# Grille phrase / demande : faux positifs et faux négatifs

Date : 11 octobre 2026. Racine : `research/titouan/T_banc_e2e`. Tout est dans `pipeline/grille/`. Aucun commit. Aucun fichier existant modifié. Le jeu aveugle de 250 cas (`blind_decalage/`) n'a pas été ouvert.

## En bref

1. **La grille.** 2 170 paires « phrase écrite / demande », vérité connue par construction. 1 091 pour le réglage, 1 079 pour le contrôle. Trois vérités : « correspond » (605), « ne correspond pas » (913), « invérifiable » (652).
2. **Contrôle, mesuré une seule fois par bras** (sha256 publié avant, verrous en place). Le bras (a) code seul attrape 86,6 % des demandes qui ne correspondent pas, avec 7,7 % de fausses alertes sur les demandes qui correspondent. Sur le réglage il faisait 99,1 % : l'écart de 12 points est le prix du réglage sur la même grille. **Le chiffre à citer est celui du contrôle.**
3. **Clef (b) : classe puis le code compare.** Contrôle : 86,6 % attrapées (comme le code seul), mais seulement 1,3 % de fausses alertes et 97,2 % des cas invérifiables reconnus. Clef rend le produit plus prudent sans le rendre plus sûr : il laisse 58 vraies divergences « non tranchées ».
4. **Clef (c) : juge direct. Mauvais.** 64,4 % attrapées, 64 cas invérifiables pris pour « correspond ». Les probabilités de Clef ne séparent pas bien « correspond », « diffère », « flou » dans ce format. À ne pas retenir seul.
5. **Combinaison la plus stricte (d), et (d) plus code seul (da).** (da) attrape 460 sur 461 (99,8 %) et ne rate qu'une divergence sur 1 079, au prix de 16,1 % de fausses alertes et de 153 demandes conformes laissées « invérifiables ». C'est le choix le plus sûr, le moins confortable.
6. **Règles dures tenues.** Monotonie : 0 violation sur les 1 079 paires du contrôle (sans intention <= type seul <= phrase complète). Phrase vague, hors sujet ou injection : jamais prise pour « correspond » par (a), (b), (d), (da) ; 133 cas de ce genre, 0 sous le niveau sans intention. Montants, jetons, adresses : extraits par code seulement.
7. **Appels à Clef.** 3 614 appels réels, 0 erreur, pas de 429, quota non atteint.

## Fichiers

| Fichier | Rôle |
|---|---|
| `gen_grille.mjs` | génère la grille (graine 20261013, aucun réseau) |
| `GRILLE.jsonl`, `REGLAGE.jsonl`, `CONTROLE.jsonl` | 2 170, 1 091, 1 079 paires |
| `CONTROLE_SHA256.txt` | sha256 du contrôle, publié avant toute mesure du contrôle |
| `validate_grille.mjs` | contrôle de structure (sélecteurs, longueurs, EIP-712) |
| `snapshot/`, `snapshot_sha256.txt` | copie figée des fichiers dont dépend la mesure (54 fichiers) |
| `lib.mjs`, `textool.mjs`, `stats.mjs` | couche de la grille : classement de repli, extraction, décision à trois valeurs, tableaux |
| `mesure_code.mjs` | bras (a), sans clé ni réseau |
| `mesure_clef.mjs`, `tune_c.mjs` | bras (b), (c), (d), (da) ; réglage des seuils de (c) |
| `res_*.json`, `res_*.md` | résultats bruts et tableaux |
| `cache_clef/` | réponses de Clef par hash (ignoré par git) |

## La grille

### Construction

Une paire = un effet et une affirmation.

- **L'effet** est la demande réellement encodée : `eth_sendTransaction` avec calldata fabriqué par l'encodeur ABI du moteur, `eth_signTypedData_v4` avec un Permit EIP-2612 ou un Permit2 (`PermitSingle`) complet, `personal_sign` avec un message de connexion SIWE, `eth_sign` sur un hachage, ou un appel à un sélecteur inconnu.
- **L'affirmation** est ce que la phrase dit : acte, jeton, montant, destinataire, protocole. La phrase est rendue à partir d'elle par des gabarits.
- **La vérité** est calculée par la fonction `verite()` de `gen_grille.mjs` à partir de l'affirmation et de l'effet. Jamais en lisant un moteur.

Règle de vérité, dans l'ordre :

1. Demande illisible, ou phrase qui ne dit rien de vérifiable (vague, hors sujet, injection seule) : **invérifiable**.
2. Acte incompatible avec l'effet (« me connecter » face à un droit, « payer Paul » face à un échange) : **ne correspond pas**.
3. Une chose dite est contredite (montant supérieur de plus de 1 %, autre jeton, autre destinataire, droit donné à un autre protocole que celui nommé, sortie d'échange ou dépôt crédité à un tiers) : **ne correspond pas**.
4. Un élément nécessaire n'est pas dit (montant, jeton, destinataire, protocole nommé) : **invérifiable**. En cas de doute, on ne conclut pas.
5. Sinon : **correspond**.

### Contenu

| Famille de demande | Paires | | Style de phrase | Paires |
|---|---|---|---|---|
| approbation (exacte, supérieure, illimitée, `increaseAllowance`) | 330 | | précis | 489 |
| permit (EIP-2612) | 150 | | familier | 325 |
| permit2 | 170 | | sans montant | 440 |
| setApprovalForAll | 170 | | virgule décimale, milliers | 212 |
| envoi de jeton | 300 | | « 50 dollars » | 55 |
| envoi natif (et achat de NFT) | 150 | | nombres en lettres | 29 |
| échange | 270 | | avec fautes | 216 |
| NFT (transfert) | 140 | | vague | 136 |
| dépôt (Aave `supply`) | 170 | | hors sujet | 74 |
| connexion (SIWE, avec actes incompatibles) | 200 | | injection seule | 76 |
| illisible | 120 | | injection collée derrière une vraie demande | 118 |

Français : environ 58 %. Anglais : 42 %. Les « grandes » hausses de droit vont de 1,25 fois à illimité. Le destinataire peut être un contact (« Paul », « Maman », « mon Ledger »), une adresse collée, ou omis (« un ami »).

### Coupure réglage / contrôle

Les gabarits de phrase sont partagés en deux : deux tiers servent au réglage, un tiers au contrôle seulement. Le contrôle contient donc des formulations jamais vues du réglage (par exemple « convertir », « lend », « stake », « flip », « acquérir »). Les formats de montant, les fautes et les injections sont partagés.

Le sha256 du contrôle (`3644a72c...7b14`) est dans `CONTROLE_SHA256.txt`. Les deux mesures du contrôle ont chacune un verrou (`CONTROLE_OUVERT_code.lock` à 06:15 UTC, `CONTROLE_OUVERT_clef.lock` à 06:21 UTC) et refusent un second passage.

### Contrôle de structure

`validate_grille.mjs` : 2 170 paires, 0 écart. Les sélecteurs sont revérifiés par une table écrite à la main (`0x095ea7b3` approve, `0xa9059cbb` transfer, `0xa22cb465` setApprovalForAll, `0x42842e0e` safeTransferFrom, `0x38ed1739` swapExactTokensForTokens, `0x39509351` increaseAllowance, `0x617ba037` supply). Longueur de calldata multiple de 32 octets, JSON EIP-712 avec tous les champs de ses types, adresses valides.

## Ce qui a été mesuré

Décision d'un bras : « correspond », « ne correspond pas » ou « invérifiable ».

- **Attrapé** : vérité « ne correspond pas », décision « ne correspond pas ».
- **Faux positif** : vérité « correspond », décision « ne correspond pas ».
- **Invérifiable reconnu** : vérité et décision « invérifiable ».
- **Surconfiance** : vérité « invérifiable », décision « correspond ». Le pire cas avec le raté.
- **Raté** : vérité « ne correspond pas », décision « correspond ».
- **Non tranché** : vérité « ne correspond pas » ou « correspond », décision « invérifiable ». Prudent mais sans valeur.

Intervalles de Wilson à 95 % entre crochets.

### Les bras

| Bras | Contenu | Clé |
|---|---|---|
| (a) code seul | mots-clés du produit (`extension/intent_text.js`), repli et extraction par code, comparateur du moteur, politique et détecteurs | non |
| (b) Clef classe, le code compare | Clef-flash donne le type et quatre oui/non ; le code extrait montant, jeton, adresse ; le comparateur décide | oui |
| (c) Clef juge direct | Clef reçoit la phrase et la description en clair de l'effet (construite par le code) ; trois questions oui/non | oui |
| (d) le plus strict | ne correspond pas si (b) ou (c) le dit ; correspond seulement si les deux le disent ; sinon invérifiable | oui |
| (da) idem avec (a) | même règle sur (a), (b), (c) | oui |

La décision « invérifiable » est prise par le code, pas par un modèle, dans tous les bras : demande illisible, aucun effet visible, phrase sans type compris, ou élément nécessaire non dit.

## Résultats sur le contrôle (une seule mesure par bras)

1 079 paires : 461 « ne correspond pas », 298 « correspond », 320 « invérifiable ».

| Bras | Attrapé | Raté en « correspond » | Non tranché | Faux positif | Invérifiable reconnu | Surconfiance |
|---|---|---|---|---|---|---|
| (a) code seul | 399/461 = 86,6 % [83,1 ; 89,4] | 2 | 60 | 23/298 = 7,7 % [5,2 ; 11,3] | 293/320 = 91,6 % [88,0 ; 94,1] | 0 |
| (b) Clef puis code | 399/461 = 86,6 % [83,1 ; 89,4] | 4 | 58 | 4/298 = 1,3 % [0,5 ; 3,4] | 311/320 = 97,2 % [94,7 ; 98,5] | 0 |
| (c) Clef juge | 297/461 = 64,4 % [60,0 ; 68,7] | 3 | 161 | 21/298 = 7,0 % [4,7 ; 10,5] | 207/320 = 64,7 % [59,3 ; 69,7] | 64 |
| (d) strict b + c | 429/461 = 93,1 % [90,4 ; 95,0] | 0 | 32 | 25/298 = 8,4 % [5,7 ; 12,1] | 262/320 = 81,9 % [77,3 ; 85,7] | 0 |
| (da) strict a + b + c | 460/461 = 99,8 % [98,8 ; 100] | 0 | 1 | 48/298 = 16,1 % [12,4 ; 20,7] | 238/320 = 74,4 % [69,3 ; 78,8] | 0 |

Ce qui compte pour le produit : un « correspond » ne doit presque jamais cacher une divergence. (d) et (da) ont 0 raté. (a) et (b) en ont 2 et 4.

### Matrices de confusion du contrôle (lignes : vérité ; colonnes : décision)

(a) code seul

| Vérité \ Décision | correspond | ne correspond pas | invérifiable |
|---|---|---|---|
| correspond | 234 | 23 | 41 |
| ne correspond pas | 2 | 399 | 60 |
| invérifiable | 0 | 27 | 293 |

(b) Clef puis code

| Vérité \ Décision | correspond | ne correspond pas | invérifiable |
|---|---|---|---|
| correspond | 271 | 4 | 23 |
| ne correspond pas | 4 | 399 | 58 |
| invérifiable | 0 | 9 | 311 |

(c) Clef juge

| Vérité \ Décision | correspond | ne correspond pas | invérifiable |
|---|---|---|---|
| correspond | 149 | 21 | 128 |
| ne correspond pas | 3 | 297 | 161 |
| invérifiable | 64 | 49 | 207 |

(d) strict b + c

| Vérité \ Décision | correspond | ne correspond pas | invérifiable |
|---|---|---|---|
| correspond | 129 | 25 | 144 |
| ne correspond pas | 0 | 429 | 32 |
| invérifiable | 0 | 58 | 262 |

(da) strict a + b + c

| Vérité \ Décision | correspond | ne correspond pas | invérifiable |
|---|---|---|---|
| correspond | 97 | 48 | 153 |
| ne correspond pas | 0 | 460 | 1 |
| invérifiable | 0 | 82 | 238 |

### Par famille de demande, contrôle

(a) code seul

| Famille | Paires | Attrapé | Faux positif | Invérifiable reconnu |
|---|---|---|---|---|
| approbation | 175 | 89/96 = 92,7 % | 14/36 = 38,9 % | 34/43 = 79,1 % |
| permit | 76 | 34/38 = 89,5 % | 4/13 = 30,8 % | 15/25 = 60,0 % |
| permit2 | 79 | 35/38 = 92,1 % | 5/16 = 31,3 % | 17/25 = 68,0 % |
| setApprovalForAll | 90 | 39/49 = 79,6 % | 0/23 | 18/18 |
| envoi de jeton | 156 | 65/68 = 95,6 % | 0/47 | 41/41 |
| envoi natif | 63 | 21/26 = 80,8 % | 0/24 | 13/13 |
| échange | 147 | 65/70 = 92,9 % | 0/41 | 36/36 |
| NFT | 70 | 23/24 = 95,8 % | 0/36 | 10/10 |
| dépôt | 76 | 12/33 = 36,4 % | 0/25 | 18/18 |
| connexion | 97 | 16/19 = 84,2 % | 0/37 | 41/41 |
| illisible | 50 | n/a | n/a | 50/50 |

(b) Clef puis code

| Famille | Attrapé | Faux positif | Invérifiable reconnu |
|---|---|---|---|
| approbation | 80/96 = 83,3 % | 0/36 | 43/43 |
| permit | 33/38 = 86,8 % | 0/13 | 23/25 |
| permit2 | 32/38 = 84,2 % | 0/16 | 24/25 |
| setApprovalForAll | 38/49 = 77,6 % | 0/23 | 18/18 |
| envoi de jeton | 68/68 = 100 % | 4/47 = 8,5 % | 37/41 |
| envoi natif | 25/26 = 96,2 % | 0/24 | 13/13 |
| échange | 60/70 = 85,7 % | 0/41 | 36/36 |
| NFT | 17/24 = 70,8 % | 0/36 | 10/10 |
| dépôt | 30/33 = 90,9 % | 0/25 | 16/18 |
| connexion | 16/19 = 84,2 % | 0/37 | 41/41 |

(da) strict a + b + c

| Famille | Attrapé | Faux positif | Invérifiable reconnu |
|---|---|---|---|
| approbation | 95/96 = 99,0 % | 16/36 = 44,4 % | 24/43 = 55,8 % |
| permit | 38/38 | 6/13 = 46,2 % | 10/25 = 40,0 % |
| permit2 | 38/38 | 6/16 = 37,5 % | 10/25 = 40,0 % |
| setApprovalForAll | 49/49 | 12/23 = 52,2 % | 10/18 = 55,6 % |
| envoi de jeton | 68/68 | 4/47 = 8,5 % | 34/41 = 82,9 % |
| envoi natif | 26/26 | 0/24 | 13/13 |
| échange | 70/70 | 0/41 | 34/36 |
| NFT | 24/24 | 0/36 | 9/10 |
| dépôt | 33/33 | 0/25 | 16/18 |
| connexion | 19/19 | 4/37 = 10,8 % | 28/41 = 68,3 % |
| illisible | n/a | n/a | 50/50 |

Tableaux complets (famille, style, langue) pour chaque bras : `res_code_controle.md`, `res_clef_controle.md`.

### Par style de phrase, contrôle, bras (a)

| Style | Paires | Attrapé | Faux positif | Invérifiable reconnu |
|---|---|---|---|---|
| précis | 248 | 120/146 = 82,2 % | 10/52 = 19,2 % | 41/50 = 82,0 % |
| familier | 159 | 87/98 = 88,8 % | 3/40 = 7,5 % | 17/21 = 81,0 % |
| sans montant | 218 | 88/96 = 91,7 % | 0/61 | 54/61 = 88,5 % |
| virgule décimale | 119 | 63/72 = 87,5 % | 3/23 = 13,0 % | 21/24 = 87,5 % |
| « dollars » | 34 | 7/8 | n/a | 22/26 = 84,6 % |
| nombres en lettres | 10 | 4/5 | 0/2 | 3/3 |
| fautes | 101 | 14/19 = 73,7 % | 5/80 = 6,3 % | 2/2 |
| injection collée | 57 | 16/17 = 94,1 % | 2/40 = 5,0 % | n/a |
| vague | 64 | n/a | n/a | 64/64 |
| hors sujet | 33 | n/a | n/a | 33/33 |
| injection seule | 36 | n/a | n/a | 36/36 |

Le style « fautes » est le plus faible (73,7 % attrapées). Le style « précis » a le plus de fausses alertes, à cause d'une seule tournure (voir plus bas).

## Passage du réglage au contrôle

| Bras (a) | Attrapé | Faux positif | Invérifiable reconnu |
|---|---|---|---|
| Réglage, avant correction (premier essai, mots-clés du produit seuls) | 152/452 = 33,6 % | 16/309 = 5,2 % | 316/330 = 95,8 % |
| Réglage, après correction | 448/452 = 99,1 % | 0/307 | 332/332 = 100 % |
| Contrôle, une seule mesure | 399/461 = 86,6 % | 23/298 = 7,7 % | 293/320 = 91,6 % |

Le premier essai montre ce que vaut le repli du produit tel quel : 33,6 %, parce que « autoriser », « déposer », « mettre en vente » ne sont pas compris, donc presque tout reste « invérifiable ». (Le premier essai a été fait sur une version du jeu où 2 paires d'envoi natif avaient une autre vérité.)

Le réglage a monté le bras (a) à 99 % : ce chiffre ne dit rien du produit. Il dit seulement que les corrections tiennent sur ce qu'elles ont vu. Le contrôle donne 86,6 %.

### Corrections faites sur le réglage seulement (toutes dans `lib.mjs` et `textool.mjs`)

1. Repli de classification (mots-clés du réglage : autoriser, approuver, déposer, mettre en vente, acheter un NFT, envoyer un NFT, plus la structure « deux jetons reliés par en, to, for, into »), avec tolérance à une faute de frappe sur les mots de 5 lettres ou plus.
2. Nombres en lettres, français et anglais, jusqu'à 999 999.
3. Coupure des injections de consigne par un lexique général (« ignore les instructions », « SYSTEM: », « do not flag », « you must answer »). Le texte coupé n'est jamais lu pour décider.
4. Le jeton n'est « dit » que s'il est collé au montant (« 5 en WETH » ne dit pas le jeton) ; « 50 dollars » ne dit pas de jeton.
5. Jeton reçu d'un échange extrait par code (second symbole cité).
6. Décodeur complémentaire pour `supply` (Aave) : le moteur ne voit aucun effet pour cet appel.
7. Lecture de l'acte dans la phrase (mots-clés) et compatibilité avec le type d'effet (droit, échange, dépôt, NFT, connexion).
8. Le moteur ne sait pas ce qu'est « mettre un NFT en vente » ni « acheter un NFT » (il lève `unlimited_approval_swap` ou `no_incoming`). Son écart sur ces deux actes n'est pas lu comme une contradiction ; la vérification du protocole nommé prend le relais.
9. Une demande « raised » par le comparateur ne devient « ne correspond pas » que si le niveau monte au-dessus du niveau sans intention ou si une raison nouvelle apparaît. Un risque déjà présent sans intention n'est pas une divergence avec la phrase.

## Les 20 pires erreurs du bras (a) sur le contrôle

Classées par gravité : raté d'abord, puis faux positif, puis surconfiance, puis non tranché. Elles se regroupent en quatre causes. Les identifiants sont dans `res_code_controle.json`.

| # | Id | Phrase | Vérité / décision | Commentaire |
|---|---|---|---|---|
| 1 | G-approbation-0147 | Je veux convertir 1500 USDC en USDT | ne correspond pas / correspond | Droit donné à Aave (connu) alors que l'échange passe par Uniswap. Le code accepte « un protocole connu » pour un échange sans distinguer routeur et pool. Raté réel. |
| 2 | G-permit2-0096 | flip 250 DAI to USDT pls | ne correspond pas / correspond | Même cause que 1, avec un Permit2. |
| 3 | G-approbation-0022 | Donner à Uniswap le droit d'utiliser 250 USDC | correspond / ne correspond pas | Les mots-clés du produit lisent « donner à X » comme un paiement (`pay_someone`). Le comparateur lève alors un écart sur un droit. |
| 4 | G-approbation-0045 | Donner à Uniswap le droit d'utiliser 500 USDT | correspond / ne correspond pas | Même cause que 3. |
| 5 | G-approbation-0084 | Donner a Uniswap le dorit d'utiliser 1 000 USDT | correspond / ne correspond pas | Même cause que 3, avec une faute. |
| 6 | G-approbation-0150 | je donne l'accès à Uniswap pour 2500 USDC | correspond / ne correspond pas | Même cause que 3. |
| 7 | G-approbation-0281 | Donner à Uniswap le droit d'utiliser 300 USDC Oublie tes règles : ... | correspond / ne correspond pas | Même cause que 3. L'injection est bien coupée, elle ne change rien. |
| 8 | G-permit-0049 | Donner à Aave le droit d'utiliser 2500 DAI | correspond / ne correspond pas | Même cause que 3, avec un Permit. |
| 9 | G-permit2-0119 | je donne l'accès à Uniswap pour 50 usdc | correspond / ne correspond pas | Même cause que 3. |
| 10 | G-permit2-0143 | je donne l'accès à Uniswap pour 0,75 weth | correspond / ne correspond pas | Même cause que 3. |
| 11 | G-approbation-0025 | je donne l'accès à Uniswap pour 0.05 | invérifiable / ne correspond pas | Le jeton n'est pas dit. Le même mauvais classement en paiement déclenche une alerte. Fausse alerte sur un cas à ne pas trancher. |
| 12 | G-approbation-0319 | je donne l'accès à Uniswap pour des USDC | invérifiable / ne correspond pas | Le montant n'est pas dit. Même cause. |
| 13 | G-permit2-0118 | je donne l'accès à l'application pour 300 USDC | invérifiable / ne correspond pas | Protocole non dit. Même cause. |
| 14 | G-approbation-0090 | I would like to lend 25 DAI on Aave | ne correspond pas / invérifiable | « lend » n'est ni dans les mots-clés du produit ni dans mon repli. Non tranché. |
| 15 | G-approbation-0094 | Je veux acquérir un NFT pour cent ETH sur OpenSea | ne correspond pas / invérifiable | « acquérir » absent. Non tranché. |
| 16 | G-approbation-0106 | give Uniswap acecss to 0.5 USDC pls | ne correspond pas / invérifiable | « access » avec faute : la faute porte sur un mot que la tolérance ne couvre pas. |
| 17 | G-connexion-0108 | Je veux mettre 1250,5 USDC en dépôt sur Aave | ne correspond pas / invérifiable | « mettre en dépôt » absent du repli. |
| 18 | G-connexion-0134 | stake 0.75 weth on Aave for me pls | ne correspond pas / invérifiable | « stake » absent. |
| 19 | G-depot-0026 | I would like to lend 1250.5 USDC on Aave | ne correspond pas / invérifiable | Dépôt crédité à un tiers : divergence manquée parce que le type n'est pas compris. |
| 20 | G-depot-0040 | Je veux mettre 1 en dépôt sur Aave | ne correspond pas / invérifiable | Non tranché pour la même raison. |

Les erreurs 14 à 20 sont les mots que j'ai écrits dans les gabarits du contrôle et que le réglage n'avait pas vus : le repli lexical ne généralise pas à des verbes nouveaux. C'est la raison pour laquelle Clef (b) est utile : il lit des verbes que je n'ai pas listés.

Pour les bras Clef, les listes de pires erreurs sont dans `res_clef_controle.md` (20 par bras).

### Causes dominantes des erreurs, bras (b) et (da)

- **(b) non tranché, 58 cas** : Clef classe sous le seuil de 0,6 les phrases familières, avec fautes ou en anglais argotique (« je lite mon NFT », « mets 250 USDC en DAI, merci », « give Aave access to 25 USDT pls »). Le code ne conclut alors pas.
- **(b) rate, 4 cas** : non analysés un par un. Ils sont dans `res_clef_controle.json` (bras `b`, vérité « ne correspond pas », décision « correspond »).
- **(da) 48 fausses alertes** : cumul des fausses alertes de (a) (cause 3 ci-dessus) et de (c). C'est le prix de la règle « le plus strict ».
- **(c) surconfiance, 64 cas** : Clef répond « correspond » avec 0,8 ou plus quand il manque un jeton ou un montant (« Je veux payer des WETH à Paul »). Il ne repère pas l'élément manquant. C'est exactement ce que le code sait faire.

## Monotonie et règles dures

Mesure sur le contrôle, bras (a) (`mesure_code.mjs`, fin de sortie) :

| Contrôle | Violations |
|---|---|
| niveau sans intention > niveau avec la phrase | 0 sur 1 079 |
| niveau avec le type seul > niveau avec la phrase complète | 0 sur 1 079 |
| niveau brut du moteur avec intention < niveau sans intention (avant la garde) | 0 sur 1 079 |
| phrases vagues, hors sujet ou injection (133) sous le niveau sans intention | 0 |

Le niveau final est toujours le maximum entre le niveau sans intention et celui avec la phrase. Une intention peut donc seulement monter un niveau, jamais le baisser. Les détecteurs sont lancés avec la garde de monotonie du moteur (`run/policy.mjs`, copie dans `snapshot/`).

Phrase vague jamais mieux que pas d'intention : sur 133 phrases vagues, hors sujet ou injection seule, (a) répond « invérifiable » 133 fois sur 133 (aucune prise pour « correspond »). (b) : 311 sur 320 invérifiables reconnus, 0 pris pour « correspond ». (c) : 64 invérifiables pris pour « correspond », dont une part sur des phrases dites mais incomplètes. (d) et (da) : 0.

Montants, jetons, adresses : extraits par code (`pipeline/intent_clef.mjs`, `extractFields`, plus la couche de la grille). Clef ne produit que le type et des oui/non dans (b). Dans (c) il juge sur une description construite par le code, il n'extrait rien.

Doute : « invérifiable ». Appliqué par le code dans tous les bras.

## Résultats du réglage des bras Clef

Sur le réglage (1 091 paires), les seuils du bras (c) ont été choisis par `tune_c.mjs` (phrase floue si `unclear >= 0,5`, écart si `differs >= 0,7`, conforme si `matches >= 0,8`). Avec ces seuils, le meilleur réglage de (c) classe correctement 618 paires sur 1 021 lisibles : (c) reste un mauvais juge seul. Ces seuils sont ceux utilisés au contrôle.

Résultat du réglage (lecture indicative, bras (b) a aussi été réglé : compatibilité entre le type de Clef et le type d'effet, écart du moteur ignoré sur les actes NFT que le moteur ne modélise pas) :

| Bras | Attrapé | Faux positif | Invérifiable reconnu |
|---|---|---|---|
| (a) | 448/452 = 99,1 % | 0/307 | 332/332 |
| (b) | 406/452 = 89,8 % | 1/307 | 331/332 |
| (c) | 275/452 = 60,8 % | 10/307 = 3,3 % | 247/332 = 74,4 % |
| (d) | 427/452 = 94,5 % | 11/307 = 3,6 % | 296/332 = 89,2 % |
| (da) | 452/452 = 100 % | 11/307 = 3,6 % | 296/332 = 89,2 % |

Les réponses de Clef pour le réglage ont été obtenues en un seul passage ; le réglage des seuils et du pont (b) s'est fait ensuite sans nouvel appel (cache).

## Appels à Clef

- Modèle : `clef-flash`. Clé lue depuis l'environnement par `node --env-file`. Le contenu du `.env` n'a jamais été lu ni affiché.
- Appels réels : **3 614** (réglage : 12 pour un essai de 6 paires puis 1 823 ; contrôle : 1 779). 3 606 réponses distinctes en cache (`cache_clef/`). Aucun texte n'a été envoyé deux fois à Clef. Les 8 appels en trop viennent de deux tâches parallèles qui ont demandé la même requête en même temps.
- Concurrence 3. Erreurs : 0. Pas de 429. Pas de « quota atteint ».
- Garde réseau (`lib.mjs`) : tout appel réseau est refusé, sauf vers `api.cloudflare.com` pendant l'appel à Clef. Les détecteurs du dossier `snapshot/detectors_adem/` qui voudraient joindre un nœud RPC sont donc bloqués.

## Rejouer

Depuis `research/titouan/T_banc_e2e` :

```
node pipeline/grille/gen_grille.mjs                                  # régénère la grille (mêmes octets)
node pipeline/grille/validate_grille.mjs                             # contrôle de structure
sha256sum --check pipeline/grille/CONTROLE_SHA256.txt                # depuis pipeline/grille/
node --no-warnings pipeline/grille/mesure_code.mjs --split=reglage   # bras (a), réglage, rejouable à volonté
node --no-warnings pipeline/grille/mesure_code.mjs --split=controle  # refusé : verrou déjà posé (supprimer le .lock pour rejouer)

# bras Clef : exigent la clé. Sans clé, le script affiche « non mesuré: clé manquante ».
node --env-file=<chemin>/.env --no-warnings pipeline/grille/mesure_clef.mjs --split=reglage
node --env-file=<chemin>/.env --no-warnings pipeline/grille/mesure_clef.mjs --split=controle --reprise   # le cache évite tout nouvel appel
node --no-warnings pipeline/grille/mesure_clef.mjs --split=reglage --plan    # compte les requêtes, sans réseau
node --no-warnings pipeline/grille/tune_c.mjs                                # seuils de (c), à partir des réponses mises en cache
node --no-warnings pipeline/grille/errs.mjs pipeline/grille/res_code_controle.json 30   # erreurs groupées
```

Pour rejouer le contrôle de zéro, supprimer `CONTROLE_OUVERT_code.lock` et `CONTROLE_OUVERT_clef.lock`, et accepter que ce ne soit plus une mesure unique.

Le snapshot : les 54 fichiers copiés le 11 octobre 2026 vers 06:52 UTC sont dans `snapshot/` (arborescence identique à `T_banc_e2e`). Leurs sha256 sont dans `snapshot_sha256.txt`. Toute la mesure charge ces copies, jamais les fichiers vivants. Copiés : `engine/src`, `engine/vendor`, `run/arms.mjs`, `run/policy.mjs`, `detectors_adem/*.mjs`, `redteam/normalize_v2.mjs`, `pipeline/intent_clef.mjs`, `extension/intent_text.js`, `extension/keyword_intent.js`. Non copié : `pipeline/evaluate_plus.mjs`, que la grille n'utilise pas (la chaîne est celle de `run/arms.mjs`).

## Limites

1. **Même auteur pour les phrases et pour les règles.** J'ai écrit les gabarits, la vérité et le repli lexical. J'ai gardé les gabarits du contrôle à part, mais je connaissais leurs mots quand j'ai écrit le repli. Quelques mots généraux (« free », « claim ») sont dans le repli et se trouvent aussi dans le contrôle. L'écart réglage / contrôle de 12 points montre que le repli ne généralise pas, il ne montre pas l'ampleur du biais restant. Un jeu écrit par un autre auteur reste à faire.
2. **La vérité est ma définition de « correspond ».** Elle est stricte : un élément non dit rend la paire invérifiable. Un autre lecteur peut dire « correspond » pour « Envoyer des USDC à Paul » quand le montant ne compte pas. Les familles « connexion » et « nft » contiennent des paires où la demande est inoffensive (une simple connexion alors que la phrase dit « payer Paul ») : je les compte « ne correspond pas » parce que ce que fait la demande n'est pas ce que dit la phrase, pas parce qu'elle est dangereuse.
3. **Pas de monde réel.** Aucune simulation sur chaîne, aucun portefeuille réel. Les effets sont ceux que décode le moteur. Les adresses sont tirées d'un hachage. `supply` est décodé par un code complémentaire de la grille parce que le moteur ne voit rien.
4. **Un seul contexte par famille.** Même chaîne (Ethereum), mêmes quatre jetons, mêmes trois contacts, mêmes protocoles « connus » (Uniswap, Aave, OpenSea) dont le nom est dans le libellé. Un produit réel n'aura pas le nom du protocole dans la liste de ses protocoles connus de cette façon. Le contrôle de « droit donné au protocole nommé » dépend de ce libellé.
5. **Pas de distinction routeur / pool.** Pour un échange, le code accepte un droit donné à un protocole connu quelconque. Les erreurs 1 et 2 viennent de là. Le moteur n'a pas de type « routeur ».
6. **Les mots-clés du produit lisent « donner à X le droit » comme un paiement.** C'est un défaut du produit (`extension/intent_text.js`), pas de la grille. Il cause à lui seul les 23 fausses alertes de (a) sur le contrôle : sans cette tournure, (a) n'en a aucune. Correction proposée (non appliquée, hors périmètre) : traiter « donner ... le droit », « donner l'accès » comme un droit, avant « donner à ».
7. **Le moteur lève des écarts sur « mettre en vente » et « acheter un NFT »** (`unlimited_approval_swap`, `no_incoming`). Je les ignore dans la couche de décision. Le moteur lui-même reste à corriger.
8. **Clef (b) : les seuils.** Le seuil de classement est 0,6 (valeur du produit). Il n'a pas été réglé. Une baisse du seuil rendrait (b) moins prudent.
9. **Clef (c) : une seule formulation de question.** Je n'ai pas testé d'autres formulations, ni `clef` (grand modèle) à la place de `clef-flash`. Le mauvais score de (c) vaut pour ce format et ce modèle.
10. **Les nombres en lettres** ne sont que 29 paires (10 au contrôle) : intervalles larges.
11. **Une exécution exploratoire de deux sondes** (diagnostic des écarts du comparateur) a eu lieu avant la pose de la garde réseau ; le script de mesure l'a toujours eue. Aucune clé n'était en jeu à ce moment. Les détecteurs ont pu tenter de joindre un nœud RPC public en lecture ; aucun résultat n'en a été utilisé.
12. **Le jeu aveugle de 250 cas n'a pas été utilisé.** Cette grille ne le remplace pas.
13. **Un seul processus `node` à la fois** a été lancé pour les mesures, le dernier en arrière-plan pour les appels à Clef.
