# Boucle 2 : résultats

Date : 11 octobre 2026. Le résultat du jeu aveugle `blind_decalage` reste celui publié (87,3 % d'écarts signalés, 15,0 % de fausses alertes rouges). Il n'a été ni rouvert ni rejoué.

Ce qui est mesuré ici : le décideur de l'extension (`gatekeeper.js`, `written_check.js`, `intent_text.js`, `outcome.js`) avec le moteur serveur, sans réseau. Une paire = une phrase écrite et une demande.
Trois réponses possibles : « correspond », « ne correspond pas », « pas pu vérifier ».
Signalé = « ne correspond pas », ou droit trop large avec limitation proposée. Raté = « correspond » sur un écart. Fausse alerte = « ne correspond pas » sur un conforme.
Intervalles de Wilson à 95 %.

## 1. Jeu de réglage (660 paires : 414 écarts, 240 conformes, 6 indécidables)

Bras « mots » (aucun modèle).

| | Avant la boucle | Après les corrections (tour 3) | Après les décisions de produit (final) |
|---|---|---|---|
| Écarts signalés | 199/414 = 48,1 % [43,3 ; 52,9] | 382/414 = 92,3 % [89,3 ; 94,5] | 358/414 = 86,5 % [82,8 ; 89,4] |
| Écarts ratés | 134/414 = 32,4 % [28,0 ; 37,0] | 0/414 = 0,0 % [0,0 ; 0,9] | 30/414 = 7,2 % [5,1 ; 10,2] |
| Écarts « pas pu vérifier » | 81/414 = 19,6 % [16,0 ; 23,7] | 32/414 = 7,7 % [5,5 ; 10,7] | 26/414 = 6,3 % [4,3 ; 9,0] |
| Fausses alertes | 17/240 = 7,1 % [4,5 ; 11,0] | 0/240 = 0,0 % [0,0 ; 1,6] | 0/240 = 0,0 % [0,0 ; 1,6] |
| Conformes « pas pu vérifier » | 61/240 = 25,4 % [20,3 ; 31,3] | 0/240 = 0,0 % [0,0 ; 1,6] | 0/240 = 0,0 % [0,0 ; 1,6] |
| Conformes reconnus | 162/240 = 67,5 % [61,3 ; 73,1] | 240/240 = 100 % [98,4 ; 100] | 240/240 = 100 % [98,4 ; 100] |

Les 30 ratés de la colonne finale sont voulus : 18 droits bornés au montant écrit mais valables longtemps, 12 droits bornés donnés à un contrat inconnu. Décision de produit du 11 octobre : ces demandes « correspondent » et la ligne affichée le dit. Mon jeu les étiquette « écart » : je laisse l'étiquette.
Bras « Clef » (Clef-flash classe la phrase, le code compare), final : signalés 360/414 = 87,0 % [83,4 ; 89,9] ; ratés 30/414 = 7,2 % ; fausses alertes 4/240 = 1,7 % [0,6 ; 4,2] ; conformes reconnus 236/240 = 98,3 %. Ce bras n'a pas été mesuré avant la boucle.
Ces chiffres de réglage disent seulement que les corrections tiennent sur ce qu'elles ont vu. Ne pas les citer.

## 2. Jeu de contrôle neuf, scellé, mesuré UNE fois (660 paires : 414 écarts, 240 conformes, 6 indécidables)

Empreinte scellée avant toute correction : `CONTROLE_SHA256.txt`. Verrous : `CONTROLE_OUVERT_mots.lock`, `_clef.lock`, `_banc.lock`. Chiffres publiés tels quels.
Réserve à dire : la mesure a eu lieu à 10 h 37. Deux retouches sont venues après, sans nouvelle mesure du contrôle (tour 5 du journal) : une règle d'alerte retirée (minimum entre deux jetons stables) et un mot masqué au moteur (« dollars » n'est pas un jeton). Elles ne peuvent qu'enlever des alertes. Le réglage rejoué après donne les mêmes chiffres. Le contrôle décrit donc le code à une règle près.

| | Bras mots | Bras Clef |
|---|---|---|
| Écarts signalés | 352/414 = 85,0 % [81,3 ; 88,1] | 360/414 = 87,0 % [83,4 ; 89,9] |
| Écarts ratés | 19/414 = 4,6 % [3,0 ; 7,1] | 23/414 = 5,6 % [3,7 ; 8,2] |
| Écarts « pas pu vérifier » | 43/414 = 10,4 % [7,8 ; 13,7] | 31/414 = 7,5 % [5,3 ; 10,4] |
| Fausses alertes | 0/240 = 0,0 % [0,0 ; 1,6] | 4/240 = 1,7 % [0,6 ; 4,2] |
| Conformes « pas pu vérifier » | 64/240 = 26,7 % [21,5 ; 32,6] | 17/240 = 7,1 % [4,5 ; 11,0] |
| Conformes reconnus | 176/240 = 73,3 % [67,4 ; 78,5] | 219/240 = 91,3 % [87,0 ; 94,2] |
| Indécidables dits « correspond » | 0/6 | 0/6 |

Lecture franche :
- Les ratés du bras mots (19) sont tous dans deux scénarios : durée (15) et bénéficiaire du droit (4). Ce sont les demandes que la décision de produit accepte en le disant.
- Le point faible est la compréhension de la phrase. Avec d'autres formulations que celles du réglage, les mots-clés laissent 64 conformes sur 240 en « pas pu vérifier » (0 sur le réglage). Clef en laisse 17. La comparaison par code, elle, tient : aucune fausse alerte et aucun raté hors décisions sur 414 écarts avec les mots-clés.
- Bras Clef : 48 lectures sur 660 n'ont pas eu de réponse de Clef dans le délai et sont retombées sur les mots-clés. Le chiffre est publié avec ce défaut.

Même jeu de contrôle par la chaîne de banc du jeu aveugle (niveaux du moteur, bras « code seul ») : écarts signalés 337/414 = 81,4 % [77,4 ; 84,9] ; fausses alertes rouges 0/240 = 0,0 % [0,0 ; 1,6] ; fausses alertes orange ou rouges 19/240 = 7,9 % [5,1 ; 12,0].
Sur le réglage, cette même chaîne donnait 12/240 = 5,0 % de fausses alertes rouges avant, toutes sur les offres d'achat de NFT, et 0/240 après.
Ces 0 % ne remplacent pas les 15,0 % du jeu aveugle : autre jeu, autre auteur, autres proportions.

## 3. Jeux de réglage existants, rejoués avant et après (non-régression)

| Jeu | | Avant | Après |
|---|---|---|---|
| Panel `preuves/`, moitié réglage, installation nue | Écarts signalés | 1 499/2 370 = 63,2 % | 1 820/2 370 = 76,8 % |
| | Écarts ratés | 130/2 370 = 5,5 % | 109/2 370 = 4,6 % |
| | Fausses alertes | 117/702 = 16,7 % | 81/702 = 11,5 % |
| | Conformes reconnus | 321/702 = 45,7 % | 487/702 = 69,4 % |
| Grille, moitié réglage, contexte du cas | Écarts signalés | 213/452 = 47,1 % | 292/452 = 64,6 % |
| | Écarts ratés | 70/452 = 15,5 % | 35/452 = 7,7 % |
| | Fausses alertes | 4/307 = 1,3 % | 1/307 = 0,3 % |
| | Conformes reconnus | 82/307 = 26,7 % | 116/307 = 37,8 % |
| | Indécidables dits « correspond » | 41/332 | 58/332 |
| 58 paires de `preuves/exhaustivite/` | Contrôlées | 18 | 35 (38 avant les décisions de produit) |
| | Non contrôlées | 20 | 7, toutes par décision de produit |

Deux réserves. « Avant » a tourné avec le `gatekeeper.js` du commit de départ, « après » avec celui du moment (un autre agent le modifiait) : une petite part de l'écart vient de lui. La hausse des indécidables de la grille dits « correspond » (41 -> 58) vient des montants en dollars, désormais comparés à un jeton stable connu : la grille les étiquetait « invérifiable », la règle demandée les compare.
Sur le panel, 14 des 109 ratés sont une erreur d'étiquette du panel (« AVAX » contre « NATIF »), et le reste des ratés est fait d'écarts de durée et de bénéficiaire acceptés par décision.

## 4. Causes traitées et gain (réglage, bras mots)

| Cause | Correction, en une phrase | Gain |
|---|---|---|
| Un échange lisible n'était comparé à rien | Le code lit l'appel du routeur et compare montant, jeton donné, jeton reçu, sens, minimum, compte d'arrivée, échéance | 64 écarts ratés -> signalés |
| Ce qui sort en plus n'était regardé que pour un paiement | Tout envoi ou valeur jointe à côté d'un droit ou d'un échange est un écart ; un simple envoi n'est pas un échange | 26 ratés -> signalés |
| Montants en dollars, en lettres, avec séparateur de milliers | L'extraction les lit ; « dollars » ne se compare qu'à un jeton stable connu par son adresse | 61 « pas pu vérifier » -> décidés, 5 fausses alertes et 7 ratés supprimés |
| « vendre », « mettre en vente », « autoriser », « offre » non compris | Vocabulaire des mots-clés ; une phrase qui donne un droit est comprise | 40 « pas pu vérifier » -> décidés |
| Vente et achat d'un NFT par ordre signé | Le code lit l'ordre : objet, prix total, compte payé, compte qui reçoit le NFT, durée | 18 écarts -> signalés, 8 conformes reconnus |
| Offre d'achat d'un NFT lue comme « céder contre rien » | Un NFT reçu n'est pas rien (même correction chez le coéquipier, gardée) | 12 fausses alertes sur 12 -> 0 |
| Réseau ou compte de la transaction, frais gonflés | Comparés à ceux du portefeuille ; plafond de frais | 3 paires d'essai contrôlées |

## 5. Causes NON traitées, et pourquoi

- Jeton inconnu au même nom, jeton reçu inconnu : « pas pu vérifier ». Sans liste, rien ne prouve que ce n'est pas le bon jeton. Irréductible sans information de plus.
- Droit borné donné à une adresse quelconque ; droit borné valable des années : « correspond », dit sur la ligne. Décision de produit. Un contrat piégé qui reçoit exactement le montant écrit est indiscernable d'un service honnête inconnu.
- Dépôt, retrait, emprunt, pont : phrases non comprises par les mots-clés. Essayé, retiré : sans comparaison propre à ces opérations, comprendre la phrase fait dire « correspond » à tort (grille : ratés 34 -> 70).
- Fausses alertes du panel dues au moteur : droit signé borné vers Trader Joe v1, absent de la liste publique (environ 60 sur 702). Il faut la source primaire de l'adresse. Non ajoutée de mémoire.
- « On m'a dit de… » : alerte voulue par le produit, étiquetée conforme par le panel (environ 30).
- Le moteur serveur ne reçoit pas le type « échange » ni le montant de la phrase (`evaluate_plus.mjs`, `toIntent`). La comparaison est faite par `written_check.js`.
- Quand une simulation réussit, `gatekeeper.js` n'appelle plus `writtenCheck` : minimum, compte d'arrivée, échéance ne sont pas comparés dans ce cas. Hors de mon périmètre.
- Multicall illisible par le moteur : la demande conforme reste « pas pu vérifier » même quand `written_check.js` l'a lue en entier (paires D5c, D8c).
- Réseau ajouté, permission récurrente, opération de compte programmable : « pas pu vérifier ».

## 6. Ce que ces chiffres ne prouvent pas

- Les deux jeux sont écrits par moi, l'agent qui a écrit les corrections. Le contrôle a d'autres phrases, d'autres montants, d'autres adresses, mais les MÊMES formes de demande. Il mesure la tenue sur des formulations nouvelles, pas sur des formes de demande nouvelles.
- Les phrases sont des phrases d'agent, pas de vraies personnes. 73 % de conformes reconnus avec les mots-clés est sans doute optimiste pour de vrais utilisateurs.
- Les routeurs des jeux sont dans la liste publique ou déclarés dans les réglages. Un service réel hors liste donne « correspond » avec la mention « contrat inconnu » si le droit est borné.
- Aucune demande ne vient du trafic réel. Les routeurs agrégateurs, Universal Router, les ordres Seaport en lot ne sont pas dans les jeux.
- Le résultat aveugle publié ne bouge pas. Rien ici ne dit ce que donnerait un nouveau jeu aveugle écrit par quelqu'un d'autre.
