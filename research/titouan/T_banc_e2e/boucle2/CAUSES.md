# Boucle 2 : tableau des causes

Date : 11 octobre 2026. Décideur mesuré : celui de l'extension (`extension/gatekeeper.js`, `written_check.js`, `intent_text.js`, `outcome.js`), moteur serveur `pipeline/evaluate_plus.mjs` sans réseau. Bras « mots » (mots-clés) sauf mention.
Les chiffres « réglage » viennent de `boucle2/REGLAGE.jsonl` (660 paires : 414 écarts, 240 conformes, 6 indécidables). Les chiffres « panel » viennent de la moitié réglage de `preuves/panel/` (2 370 écarts, 702 conformes), écrite par une autre session.

Vocabulaire. Écart = la demande ne fait pas ce que la phrase dit. Signalé = « ne correspond pas » (ou droit trop large avec limitation proposée). Raté = « correspond ». Fausse alerte = un conforme dit « ne correspond pas ».

## A. Écarts manqués (avant la boucle, sur le réglage : 134 ratés et 81 « pas pu vérifier » sur 414)

| N° | Cause racine | Poids avant | Traitée | Reste après |
|---|---|---|---|---|
| A1 | Un échange lisible dans l'appel n'était comparé à rien : ni montant, ni jeton donné, ni jeton reçu, ni sens, ni minimum, ni compte d'arrivée, ni échéance. `writtenCheck` ne lisait que approve et transfer. | 64 ratés (montant 12, jeton donné 6, contrepartie 12, sens 6, minimum 18, échéance 6, valeur jointe 4) | oui, tour 1 | 6 « pas pu vérifier » : jeton reçu inconnu |
| A2 | Hors paiement, ce qui sort en plus n'était pas regardé : envoi glissé dans un lot, monnaie du réseau jointe, simple envoi sous une phrase d'échange. | 26 ratés | oui, tour 1 | 0 |
| A3 | Durée : un droit signé ou une signature valable des années « correspondait ». | 18 ratés | tour 1 : écart ; tour 4 (décision produit) : dit sur la ligne, plus d'alerte | 18 comptés ratés par l'étiquette, acceptés par décision |
| A4 | À qui le droit est donné : n'importe quelle adresse « correspondait ». | 10 ratés | tour 1 : « pas pu vérifier » ; tour 4 (décision produit) : droit borné = « correspond » avec la mention « contrat inconnu » ; service nommé de la liste et adresse hors liste = écart | 12 comptés ratés par l'étiquette, acceptés par décision |
| A5 | Montants écrits comme les gens écrivent : « 50 dollars », « 50 $ », « 50 usd », « cinquante », « 1,500 » non lus ou mal lus. | 37 écarts et 24 conformes « pas pu vérifier », 5 fausses alertes, 7 ratés | oui, tour 1 | 0 |
| A6 | Vocabulaire des mots-clés : « vendre », « mettre en vente », « autoriser X à dépenser », « faire une offre » non compris. | 20 conformes et autant d'écarts « pas pu vérifier » | oui, tours 1 et 3 | 0 sur le réglage ; 64 conformes sur 240 sur le contrôle (autres formulations) |
| A7 | Ordre de vente d'un NFT : prix, deuxième NFT, collection entière, compte payé non comparés. | 6 ratés, 12 « pas pu vérifier » | oui, tour 1 | 0 |
| A8 | Réseau ou compte nommé dans la transaction différent de celui du portefeuille. | 2 paires d'essai (D6b, D7) | oui, tour 1 | 0 |
| A9 | Frais de réseau gonflés. | 1 paire d'essai (M4) | oui, tour 3 (ETH, AVAX, BNB seulement) | autres réseaux |
| A10 | Jeton inconnu au même nom (« sosie »). | 12 « pas pu vérifier » | non : voulu (S2). Sans liste, impossible de dire que ce n'est pas le bon jeton | 12 |
| A11 | Réseau ajouté avec un nœud inconnu. | 6 « pas pu vérifier » | non : la demande n'est pas une opération sur des jetons, le moteur la signale sans conclure | 6 |

## B. Fausses alertes (avant la boucle, sur le réglage : 17 sur 240)

| N° | Cause racine | Poids avant | Traitée | Reste après |
|---|---|---|---|---|
| B1 | Offre d'achat d'un NFT (je donne du WETH, je reçois le NFT) lue comme « céder contre rien » : le détecteur ne comptait que les jetons reçus. C'est la cause des 11 faux rouges sur 12 de la famille Seaport du jeu aveugle. | 12 sur 12 | oui, tour 1. Le coéquipier a corrigé la même cause dans le commit f52cf27 : c'est sa version qui reste (une seule logique) | 0 |
| B2 | « 1,500 USDC » lu 1,5 : le droit de 1 500 passait pour trop large. | 5 sur 12 | oui, tour 1 (deux lectures gardées) | 0 |
| B3 | Phrase claire non comprise : le conforme reste « pas pu vérifier » (retenue de 30 s). | 61 conformes sur 240 | en partie (A5, A6) | voir contrôle |

## C. Causes vues sur le panel `preuves/` (moitié réglage) et non réglées ici

| Cause | Poids (panel réglage, après) | Pourquoi elle reste |
|---|---|---|
| Le moteur met « danger » sans phrase sur un droit signé borné vers un routeur qu'il ne connaît pas (Trader Joe v1 n'est pas dans `pipeline/known_protocols.json`). Une phrase ne baisse jamais un verdict : l'alerte reste. | environ 60 fausses alertes sur 702 | Il faut la source primaire de l'adresse pour l'ajouter à la liste. La page officielle a refusé la lecture (HTTP 403). Je n'ajoute pas une adresse de mémoire |
| « On m'a dit de… » : le produit alerte par principe, le panel étiquette conforme. | environ 30 fausses alertes | Choix du produit, pas une erreur de comparaison |
| Minimum garanti de 19 % sur un échange entre deux jetons stables (5 USDC contre au moins 0,97 USDT), étiqueté conforme. | 13 à 17 fausses alertes au tour 3, 0 après | Ma règle « moins de la moitié entre deux jetons stables » signalait ces jumeaux conformes : retirée au tour 5. Un minimum de 19 % passe donc ; seuls un minimum nul, infime, ou sous le minimum écrit sont des écarts |
| « Je rembourse 0,5 AVAX à 0x… » + envoi de 0,5 AVAX, étiqueté non conforme (« AVAX » contre « NATIF »). | 14 « ratés » | Erreur d'étiquette du panel : la demande est conforme |
| Jeton sosie. | 345 « pas pu vérifier » | Voulu (A10) |
| Phrases de dépôt, de retrait, d'emprunt, de pont. | environ 75 conformes « pas pu vérifier » | Essayé au tour 3 et retiré : voir JOURNAL |
| Le moteur serveur ne lit pas `intent_kind`, `intent_amount`, `intent_symbol` pour une phrase d'échange (`pipeline/evaluate_plus.mjs`, `toIntent`) : son comparateur ne voit jamais l'intention d'échange. | non chiffré | La comparaison est faite par `written_check.js`. Le brancher change tous les niveaux du moteur : à faire avec une mesure à part |
| Quand la simulation réussit, `gatekeeper.js` appelle `effectCheck` à la place de `writtenCheck` : le minimum, le compte d'arrivée et l'échéance lus dans l'appel ne sont alors pas comparés. | non chiffré (aucun nœud public ne simule) | Une ligne dans `gatekeeper.js`, hors de mon périmètre |
