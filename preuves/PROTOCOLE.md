# Protocole de mesure de Hold up

Écrit le 11 octobre 2026, avant la mesure de la moitié contrôle, puis complété le même jour (contrôle vu sur un code en panne, erratum E1, règle de la réserve : section 5). Ce document dit ce qu'on mesure, pourquoi on peut croire la vérité de terrain, et ce que les chiffres ne disent pas. Les chiffres sont dans `CHIFFRES_TRACES.md`, les trous dans `CE_QUI_NE_MARCHE_PAS.md`.

Idée du produit, dans les mots du fondateur : « correspondre à l'intention », que « les gens ne signent qu'un contrat qu'ils veulent vraiment signer, en toute conscience ».

## 1. L'unité testée

Une **paire** : une phrase écrite par la personne, et une demande envoyée par un site au portefeuille (`method` et `params`, avant signature).

Le produit rend une réponse parmi trois, plus deux cas où il ne répond pas :

| Réponse | Ce que voit la personne | Nom dans les fichiers |
|---|---|---|
| Alerte | « Ça ne correspond pas à ce que tu as écrit. » | `mismatch` |
| Feu libre | « Ça correspond à ce que tu as écrit. » | `match` |
| Abstention | « Je n'ai pas pu vérifier cette demande. » (30 s d'attente) | `unverifiable` |
| Pas de fenêtre | message de connexion reconnu : la demande passe | `sans_question` |
| Pas intercepté | la méthode n'est pas dans la liste de `inject.js` : le produit ne voit rien | `non_intercepte` |
| Correction | le produit voit un droit plus large que le montant écrit et réécrit la demande (« Droit limité à 50 USDC ») | `corrige` : compté avec les alertes |
| Panne | le moteur lève une exception ; le produit affiche « Je n'ai pas pu vérifier » | `panne` : comptée à part, ni décision ni abstention |
| Hors mesure | bras Clef : aucune réponse du modèle pour cette phrase | `clef_non_mesure` : jamais comptée comme une décision |

## 2. Ce que « bon » et « mauvais » veulent dire

La vérité d'une paire a trois valeurs. Elle est posée avant toute mesure et ne dépend d'aucun moteur.

- **Non conforme (positif).** La demande ne fait pas ce que la phrase dit, ou trahit ce que la personne suppose sans l'écrire (section 4).
- **Conforme (négatif).** Tout ce que fait la demande est couvert par la phrase, et rien de ce que la personne suppose n'est trahi.
- **Indécidable.** Personne ne peut trancher avec ces deux éléments : la phrase ne dit rien de vérifiable (« ok », « valider »), il lui manque un élément nécessaire (montant, jeton, adresse du destinataire), ou la demande est illisible. La seule bonne réponse est l'abstention.

Les erreurs, avec leur nom :

| Vérité | Réponse du produit | Nom | Gravité |
|---|---|---|---|
| non conforme | alerte | vrai positif (attrapé) | |
| non conforme | feu libre, pas de fenêtre, pas intercepté | **faux négatif** | la plus grave : la personne signe ce qu'elle n'a pas écrit |
| non conforme | abstention | non conforme laissé « pas pu vérifier » | la personne n'est pas rassurée, mais pas avertie non plus |
| conforme | alerte | **faux positif** (fausse alerte) | use la confiance |
| conforme | feu libre, pas de fenêtre | vrai négatif | |
| conforme | abstention | conforme laissé « pas pu vérifier » | friction : 30 s d'attente pour rien |
| indécidable | abstention | reconnu | |
| indécidable | alerte | alerte prudente | ni juste ni fausse |
| indécidable | feu libre | **surconfiance** | grave : « ça correspond » sans rien pour le dire |

Règle dure : **l'abstention n'est jamais rangée avec les attrapés ni avec les ratés.** Pour les non conformes, attrapé + raté + abstention = 100 %. Idem pour les conformes. Un rappel de 49 % avec 2 % de ratés et 49 % d'abstentions ne se résume pas à « 49 % » ni à « 98 % ».

### Règle de vérité du panel (fonction `verite()` de `panel/gen_panel.mjs`), dans l'ordre

1. Demande illisible (fonction inconnue, hachage à signer, message libre) : **indécidable**.
2. Phrase sans contenu vérifiable : **indécidable**.
3. Nature. La phrase annonce un acte, la demande en contient un autre : **non conforme**. Se connecter, récupérer ou regarder n'autorise ni envoi ni droit. Payer n'autorise qu'un envoi. Échanger autorise un droit préparatoire et un échange, pas un envoi sec. Autoriser ou déposer n'autorise qu'un droit.
4. Contenu. Une chose écrite est contredite : **non conforme**. Autre jeton ; même symbole mais autre adresse ; droit supérieur au montant écrit ou illimité ; envoi d'un montant différent ; autre destinataire que l'adresse collée ; droit donné à une autre adresse que le protocole nommé ; second droit ou second envoi non annoncé.
5. Élément manquant. Montant, jeton, adresse du destinataire (un prénom ne suffit pas), bénéficiaire d'un droit pour « autoriser » : **indécidable**. La contradiction (règle 4) passe avant le manque : « envoyer des USDC à 0xA » face à un envoi vers 0xB est non conforme.
6. Attente par défaut trahie alors que tout l'écrit est respecté (section 4) : **non conforme**.
7. Sinon : **conforme**.

Trois choix discutables, dits ici pour qu'on puisse les contester :

- « 50 dollars » face à un jeton dollar reconnu (USDC, USDT, DAI) compte comme montant et jeton écrits. Lecture stricte possible : indécidable. Notre lecture rend le produit moins bon, pas meilleur.
- Un droit **inférieur** au montant écrit est conforme. Un envoi doit être du montant exact.
- Une **phrase dictée** (« on m'a dit d'envoyer 50 USDC à 0x… ») reçoit la vérité de son contenu. Le produit, lui, alerte exprès dès qu'un tiers a dicté l'opération (règle de plancher, indépendante de la phrase). Ces alertes sont comptées comme fausses alertes au sens phrase / demande, mais elles sont voulues. C'est pourquoi les chiffres principaux sont donnés **hors phrases dictées**, et les phrases dictées dans une ligne à part.

## 3. D'où vient la vérité, et pourquoi la croire

| Source | Où | Pourquoi on peut la croire | Limite |
|---|---|---|---|
| **Par construction** | grand panel (`panel/`), grille existante (`pipeline/grille/`) | On fabrique la demande à partir d'une structure (« droit de 500 USDC à telle adresse ») et la phrase à partir d'une autre (« échanger 50 USDC »). La vérité est une fonction de ces deux structures. `panel/valide_panel.mjs` relit chaque demande avec un second décodeur et la compare à la structure : 0 écart sur les trois parts. | La vérité est notre définition de « correspond » (section 2). L'encodage est le nôtre : une erreur commune au générateur et au validateur passerait. |
| **Par étiquetage** | jeux `jury_*`, `V2_DEV`, `attacks_DEV`, `decalage` | Un auteur a écrit « malveillant » ou « bénin » avec une raison. | Autre question : malveillant ne veut pas dire « ne correspond pas à la phrase ». Une fraude voulue correspond à la phrase. Ces jeux sont rapportés à part. |
| **Par exécution sur chaîne locale** | aucun jeu de ce banc | Ce serait la preuve que la demande fait vraiment ce qu'on dit : on l'exécute et on lit les soldes. | **Non fait ici.** Aucune paire n'a été exécutée. Conséquence : la branche du produit qui mesure l'effet d'un appel illisible (`effect_sim.js`) ne tourne pas dans ce banc. |

## 4. Les axes du panel

**Nature de la demande** : approbation, augmentation de droit, signature Permit, signature Permit2, droit sur toute une collection de NFT, envoi de jeton, envoi de monnaie du réseau, échange, lot d'appels, appel illisible, message de connexion, message libre, hachage à signer, ordre de vente hors chaîne, délégation de compte (EIP-7702), permission périodique, ajout de réseau.

**Écart sur ce qui est écrit** : nature de l'opération ; montant ; droit illimité ; jeton ; destinataire (d'un envoi, d'un droit).

**Écart sur ce qui est supposé sans être écrit** (demande du fondateur ; la phrase est entièrement respectée, seul le défaut est trahi, et chaque paire a sa jumelle conforme). La colonne de droite renvoie aux 13 défauts de `exhaustivite/EXHAUSTIVITE_INTENTION.md`, section (d), qui conclut que la demande d'intention actuelle n'est pas exhaustive.

| Code | Défaut trahi | Forme dans le panel | Défaut n° dans l'analyse d'exhaustivité |
|---|---|---|---|
| D1 | droit durable ou sans échéance | Permit, Permit2 valables dix ans ou sans fin | 8, 9 |
| D2 (`jeton_sosie`) | même symbole, autre adresse | droit ou envoi sur un contrat qui s'appelle USDC | 3 |
| D3 | toute la collection au lieu d'un objet | `setApprovalForAll` face à « mon NFT n° 1234 » | 4 |
| D4 | ce qu'on obtient part ailleurs | bénéficiaire d'un échange différent du compte | 6 |
| D5 | minimum reçu presque nul, prix presque nul | échange avec minimum de 1 unité ; ordre de vente à 1 wei | 7 |
| D6 | autre réseau | signature dont le domaine vaut sur un autre réseau | 11 |
| D7 | opération de plus dans le lot | droit illimité ou second envoi glissé | 4 |
| D8 | monnaie du réseau en plus | valeur jointe à un envoi de jeton ou à une approbation | 5 |
| D9 | prise de contrôle du compte | délégation EIP-7702 ; changement de propriétaire, ajout de signataire dans un lot | 10 |
| D10 | opération récurrente | permission de prélever chaque jour au lieu d'un paiement | 8 |
| D11 | réglage du portefeuille changé | réseau ajouté face à « me connecter » | 12 |

**Façon d'écrire** : précise (français), anglais, familière, avec fautes, sans montant, « 50 dollars », montant en lettres, séparateurs (« 1 000 », « 12,5 », « 1,000 »), dictée par un tiers, destinataire nommé sans adresse, vague, droit illimité voulu.

Le panel croise nature × écart × façon d'écrire partout où le croisement a un sens : 634 cases. Les phrases sont écrites à la main (`panel/gabarits.mjs`), en phrases d'utilisateur ordinaires. Aucun texte d'arnaque, aucune consigne adressée à un modèle.

**Ce que le panel ne couvre pas** : les frais (défaut 13 de l'analyse d'exhaustivité) ; les ponts et le réseau de destination ; dépôt, emprunt, retrait, vote ; ERC-1155 ; ordres d'achat ; `increaseAllowance` sur un droit déjà existant ; plusieurs demandes pour une même phrase (la règle des 90 s du produit) ; le texte de la page (pression, faux support) ; les injections de consigne dans la phrase ; toute langue autre que le français et l'anglais ; les réseaux autres qu'Ethereum et Avalanche ; les NFT côté conforme sauf un jumeau. La conformité d'un droit sur une collection pour « vendre mon NFT » n'est jamais posée comme conforme : la question est disputée.

## 5. Règles d'hygiène

1. **Trois parts par tirage fixe**, case par case : réglage (3 561 paires), contrôle (2 662), réserve (2 673). Les gabarits placés après le séparateur `|` dans `gabarits.mjs` ne vont jamais au réglage : le contrôle et la réserve contiennent des tournures que le réglage n'a pas.
2. **Le réglage** se regarde librement. Il a servi à mettre au point le banc et à relire la règle de vérité.
3. **Le contrôle** est scellé par son empreinte (`panel/CONTROLE_SHA256.txt`), écrite avant toute mesure. Il est mesuré une fois par bras. Chaque mesure est écrite dans `panel/OUVERTURES.log` avec l'empreinte du code. Une nouvelle mesure avec un code différent est marquée `RE_MESURE_APRES_CHANGEMENT_DU_PRODUIT` : ce n'est plus un contrôle, parce que `out/ERREURS.jsonl` publie ses erreurs.
4. **La réserve** n'a de lecteur que derrière `--ouvrir-reserve`. Elle sert à une seule mesure, après correction du produit. C'est elle qui dira si une correction généralise.
5. **Interdiction de corriger en regardant le contrôle.** Cette mission ne corrige rien. Qui corrige ensuite le produit en lisant les erreurs du contrôle doit mesurer sur la réserve.
6. **Empreinte SHA-256 de chaque jeu** dans `REGISTRE.json`. Les jeux interdits (`blind_decalage/CASES.jsonl`, `V2_TEST.jsonl`, `attacks/TEST.jsonl`) et ceux qui les contiennent n'ont pas de lecteur : chemin et empreinte par flux d'octets seulement.
7. **Graine fixe** : `holdup-preuves-panel-A-2026-10-11`. Deux générations donnent les mêmes octets.
8. **Version du code.** Chaque résultat porte le commit, la liste des fichiers du code de décision modifiés hors commit avec leur empreinte, et l'empreinte du décideur. Le banc copie d'abord le build dans `out/instantane/<empreinte>/` et ne mesure que cette copie : un autre agent peut modifier le produit pendant la mesure sans mélanger deux états.
9. **Version du modèle** : `clef-flash` (Cloudflare Workers AI), sans numéro de version exposé. Les réponses sont en cache par empreinte de la requête : le banc se rejoue à l'identique sans clé.
10. **Horloge figée** au 11 octobre 2026 06:26:40 UTC.
11. **Le jeu aveugle `blind_decalage`** a été ouvert une fois le 11 octobre à 07:10 UTC par son propre lanceur. Ce banc ne le touche pas.

### Le contrôle a été vu une fois, sur un code en panne

La mesure unique du contrôle a eu lieu le 11 octobre à 07:45 UTC, sur le build du commit `7a5eadc` (empreinte du décideur `38e3afdd56bd…`). Ce build plantait : dans `engine/sentinelle_core.js`, `const niveau` est réaffecté à la ligne 512, ce qui lève une exception pour toute demande que le moteur classe au niveau le plus bas. Tous les envois de jeton (202 sur 202) et tous les envois de monnaie du réseau (114 sur 114) du contrôle sont tombés en panne, ainsi qu'une part des échanges et des lots. Le produit affiche alors « Je n'ai pas pu vérifier ».

Conséquences, sans rien adoucir :

- Ce résultat est gardé tel quel, avec sa cause. Il décrit ce que faisait le build livré à cette heure. Il **ne mesure pas la décision** du produit pour les demandes en panne.
- Les pannes sont comptées dans une colonne à part, distincte de « pas pu vérifier ».
- Le contrôle est **consommé** : ses erreurs sont publiées dans `out/ERREURS.jsonl`, n'importe qui peut corriger le produit en les lisant. Toute nouvelle mesure du contrôle sur un code corrigé est une mesure de réglage, et le banc la marque `RE_MESURE_APRES_CHANGEMENT_DU_PRODUIT`.
- **Règle pour la suite : la mesure finale se fait sur la RÉSERVE**, jamais ouverte (2 673 paires, empreinte `8531e6119af0…`, même générateur, même tirage, mêmes gabarits tenus à part). Elle s'ouvre une seule fois, par `node --no-warnings preuves/banc.mjs --ouvrir-reserve`, quand les corrections sont gelées et commitées. Son résultat, bon ou mauvais, est publié tel quel. Si la réserve est consommée à son tour, il faut tirer un nouveau jeu avec une autre graine et d'autres gabarits : relancer le même générateur ne suffit pas, ses gabarits sont connus.
- Pour que cela ne se reproduise pas, `banc.mjs` fait un **contrôle préalable** : une demande de chaque nature (17 formes de la moitié réglage) passe par le moteur ; si une seule lève une exception, le banc refuse de mesurer. `--mesurer-malgre-panne` passe outre pour documenter un état en panne, et le résultat le porte alors en tête.

### Erratum E1 sur la vérité

Trouvé sur la moitié réglage, après le scellement : le générateur donnait le symbole interne « NATIF » à un envoi de monnaie du réseau, alors que la phrase dit « ETH » ou « AVAX ». La règle de vérité y voyait un autre jeton et marquait « non conforme » des paires conformes (envoi natif sans écart). Les fichiers scellés ne sont pas modifiés. Le lecteur du banc (`lib/jeux.mjs`, `erratumE1`) recalcule la vérité de ces paires avec la même fonction, après remplacement du symbole. La règle ne lit aucun résultat du produit et s'applique aux trois parts. Le nombre de paires corrigées est écrit dans `RESULTATS.json` (`verites_corrigees_par_erratum_E1`). Au moment de la mesure du contrôle, ces paires étaient toutes en panne : l'erreur de vérité n'avait changé aucun compte d'attrapés ni de ratés, seulement le classement de ces pannes.

### Le bras Clef

Les appels au modèle sont cadencés (au plus 4 par seconde), ralentis et repris sur limite de débit, et reprennent où le cache s'arrête. Un arrêt est toujours nommé. Le résultat dit combien de paires ont eu une réponse du modèle, combien n'en demandaient pas, combien sont restées sans réponse. Une paire sans réponse est hors mesure.

Écarts à ces règles pendant cette mission, dits ici :

- La première exécution du bras Clef s'est arrêtée au premier refus de débit (HTTP 429) : 1 252 paires du contrôle sont d'abord restées sans réponse du modèle. Le cache a été complété ensuite sur le même code figé ; ces exécutions sont notées `rejeu_a_l_identique` dans `panel/OUVERTURES.log`.

- Pendant l'inventaire, un script a compté les lignes, les étiquettes et les méthodes de `blind_adem/BLIND_v1.jsonl` (jeu aveugle v1, jamais passé), et le début de son premier cas a été affiché. Aucun détecteur n'a été lancé dessus. Il est enregistré comme non rejoué.
- Le panel a été généré trois fois avant d'être scellé (ajout des attentes par défaut, puis de la réserve). Aucune de ces versions du contrôle n'a été mesurée ni lue.

## 6. Le décideur mesuré

Le service worker du build livré : `research/titouan/T_banc_e2e/extension_standalone/extension/background.js`. Il compose `engine/sentinelle_core.js` (plancher), `gatekeeper.js` (`understand`, `judgeWithIntent`), `intent_text.js` (lecture de la phrase), `written_check.js` (phrase contre demande) et `outcome.js` (`outcomeOf` : les trois réponses). Le banc lui envoie les mêmes messages que la page et la fenêtre (`gate`, `hu.view`, `hu.decision`) et lit `view.screen.outcome`.

Deux bras :

- **sans modèle** : le relais est absent, le produit se replie sur ses mots-clés. C'est le build « sans réseau ».
- **avec Clef-flash** : le saut vers le relais appelle la fonction `classify()` du vrai relais (`research/demo_reelle/classifieur/relay.mjs`).

Deux contextes : **nu** (installation par défaut, aucun contexte local) et **cas** (contacts, protocoles connus et jetons du cas versés dans le réglage « contexte » de l'extension).

Ce que le banc ne fait pas tourner : l'interception dans la page (`inject.js`, `bridge.js`), la fenêtre, la simulation d'effet sur un nœud.

Différence avec les mesures existantes : les lignes A11 à A14 de `livrables/CHIFFRES.md` et le jeu aveugle ont été mesurés par une chaîne de banc (`pipeline/grille/lib.mjs`) qui ajoute son propre repli lexical et son propre comparateur. Ce n'est pas le code que l'extension exécute.

Choix de modélisation : quand le produit pose sa question de relance (« Combien, et de quel jeton ? »), le banc renvoie la même phrase. La personne simulée n'a rien d'autre à dire.

## 7. Les métriques et comment les lire

- **Rappel** = attrapés / non conformes. **Faux négatifs** = ratés / non conformes. **Non conformes laissés « pas pu vérifier »** = le reste.
- **Taux de fausses alertes** = alertes / conformes. **Conformes laissés « pas pu vérifier »** à côté.
- **Précision** = attrapés / (attrapés + fausses alertes). Elle dépend du mélange du jeu, fixé par construction (ici environ deux tiers de non conformes). Elle ne dit rien de la précision en usage réel, où presque toutes les demandes sont conformes.
- **Surconfiance** = « ça correspond » / indécidables.
- **Taux d'invérifiable** = abstentions / toutes les paires.
- **Intervalle de confiance** : Wilson à 95 %, sur chaque taux. Il mesure l'incertitude de tirage à l'intérieur du panel, pas l'écart entre le panel et le monde.
- **Dénominateur** toujours affiché : `k/n = taux [bas ; haut]`.
- **Par case et au global.** Le global est une moyenne pondérée par notre choix de cases : une case de 20 paires pèse peu, même si elle est grave. Lire les cases.
- **Latence** : p50 et p95 du verdict local (plancher, lecture de la phrase, comparaison), mesurés sous Node. Pour le bras Clef, le temps de l'appel réel enregistré au moment de la mise en cache est ajouté. Ni la fenêtre, ni la frappe de la phrase ne sont comptées : le temps réel d'une décision est celui que met la personne à écrire.
- **Coût** : jetons d'entrée par phrase × prix public du modèle.

## 8. Menaces sur la validité

1. **Les phrases sont écrites par un agent, pas par de vrais utilisateurs.** Elles sont plus propres, plus complètes et moins variées que ce que des gens tapent. Le rappel réel sur des phrases humaines est probablement plus bas ; le taux d'abstention probablement plus haut. Aucun essai avec des personnes n'existe.
2. **Les demandes sont générées.** Dix-sept formes, un encodage propre. Les sites réels passent par des routeurs, des multicalls et des contrats que le panel ne contient pas : sur du trafic réel, le moteur ne décode pas la plupart des appels (ligne B11 des livrables).
3. **Même équipe pour le produit et pour les jeux existants.** Le panel de cette mission a un autre auteur que les règles, et son auteur n'a modifié aucune règle. Mais il a lu le code du produit avant d'écrire les cas : il savait où regarder. Ce n'est pas un test indépendant au sens d'un tiers.
4. **Aucune comparaison avec un portefeuille du commerce.** On ne sait pas ce que MetaMask, Rabby ou Core affichent sur ces mêmes paires. Aucun chiffre ne permet de dire « mieux que ».
5. **Pas de chaîne.** Aucune paire n'est exécutée. La branche de simulation du produit est hors mesure. Les adresses de protocoles (Uniswap, Aave, OpenSea, Trader Joe) sont écrites de mémoire et n'ont pas été vérifiées sur une source officielle : la vérité n'en dépend pas, mais un produit qui connaîtrait ces adresses serait jugé sur des adresses peut-être fausses.
6. **Prévalence artificielle.** Deux tiers de non conformes. En usage, la part est infime : la précision et la charge d'alertes réelles ne se déduisent pas de ce panel.
7. **Une phrase, une demande.** La relance est simulée en répétant la phrase. Le contexte de la page est absent.
8. **Un seul modèle, une seule passe.** `clef-flash`, sans répétition : la variance du modèle n'est pas mesurée.
9. **Le code bouge.** Le produit est modifié pendant la mission. Chaque chiffre vaut pour une empreinte de code, écrite à côté.
