# Y. Typologie de démos : où les filtres d'un portefeuille échouent (Claude-Titouan, 11/10/2026)

Principe : une démo convaincante montre un cas où **le portefeuille a, par construction, rien à signaler**, et où Hold up voit l'écart. Elle ne prétend jamais que MetaMask "se trompe" sur Fuji ou en local (ces chaînes ne sont pas servies par son API d'alertes ; voir `demo_reelle/RECHERCHE_metamask_couverture.md`).

## Types
| Type | Idée | Pourquoi les filtres du portefeuille échouent | Preuve disponible | État |
|---|---|---|---|---|
| T1 Silence documenté | Un vrai MetaMask sur Sepolia (chaîne servie) face à S1 : approbation illimitée à un routeur légitime | Routeur connu, jeton légitime : verdict Benign, aucun questionnaire (réf. couverture) | Captures d'écran à prendre (le texte exact de MetaMask est [NV] tant qu'on ne l'a pas vu) | À faire (Titouan, avec un peu d'ETH de test) |
| T2 Signataire aveugle (type Bybit) | Le coffre à signatures multiples affiche un virement de 20 USDC, la charge signée est un `delegatecall` qui change le code du coffre | Le piège est dans l'interface du coffre, pas dans un site que le portefeuille peut juger. Bybit, févr. 2025 : l'interface affichait une transaction légitime, une autre charge allait aux signataires (NCC Group, BlockSec, Check Point, Cyfrin) | Scène rejouable : `T_banc_e2e/demo_typologie/safe_signataire.mjs`. Résultat mesuré : virement conforme = "aucun piège repéré mais vérification limitée" (jamais vert) ; delegatecall vers contrat inconnu = **critical**, fiche F09, avec ou sans intention | Moteur : fait. Version jouable avec un vrai portefeuille : à bâtir (chaîne et contrats d'Adem) |
| T3 Connexion qui signe un droit | "Me connecter" demande un Permit | MetaMask affiche "Spending cap request" mais ne le compare pas à "me connecter" | Site Glacier Rewards (Adem), cas `connexion_droit_signe` | Jouable |
| T4 Écart d'intention sur flux légitime | S1 à S4 : mauvais montant, mauvais jeton, sortie à un tiers, droit trop large | L'aperçu est exact ; rien de malveillant ; c'est juste pas ce que tu voulais | Cas de décalage (410, les nôtres) + jeu aveugle (250, pas encore passé) | S1 jouable (démo web), S2-S4 à construire |
| T5 Fraude consentie (négatif honnête) | Tu veux vraiment faire ce paiement (arnaque romantique) | L'intention correspond à l'effet | Aucune détection par comparaison ; questions et délai seulement | À présenter comme limite |

## Le plus fort : T2
Raison : c'est un incident réel, très grand, où personne n'a été piégé par un "faux site", mais par l'écart entre ce qui est affiché et ce qui est signé. C'est l'idée Signer's Mirror du début, et elle parle à KPMG, Team1 et Avalanche.

### Résultat mesuré (`node demo_typologie/safe_signataire.mjs`)
- Virement conforme (opération normale, 20 USDC à Paul) : niveau info, fiche F26 "aucun piège repéré, mais la vérification reste limitée". Jamais de vert.
- Même virement habillé en `delegatecall` vers un contrat inconnu : **critical**, fiche F09 "un programme étranger prend les commandes de ton compte", codes `delegatecall_unknown_target`, `delegatecall`, `opaque`. Identique avec ou sans intention : c'est un plancher, pas la comparaison.

### Limites à dire
- Dans Bybit, les signataires utilisaient des clés matérielles via l'interface du coffre. Une extension de navigateur ne voit que ce qui passe par `window.ethereum`. Si la page parle directement au matériel (WebHID/USB), l'extension ne voit rien. Le périmètre honnête : "signature via un portefeuille de navigateur". Les analyses publiques ne confirment pas ce qu'affichait l'écran du matériel (NCC, Cyfrin) : ne pas l'affirmer.
- La scène est synthétique (adresses factices). Elle montre le décodage, pas l'attaque de bout en bout.
- Le plancher `delegatecall` inconnu est une règle générale, pas une règle écrite pour Bybit.

## Ordre de démo conseillé
1. T4/S1 : "échanger 50" donne tout (la comparaison, notre cœur).
2. T2 : le coffre qui affiche un virement et signe un delegatecall (l'incident réel).
3. T3 : "me connecter" (le site Glacier Rewards).
4. T5 : ce qu'on ne couvre pas (honnêteté).
T1 sert de preuve en annexe si on prend les captures.

## À bâtir (propriétaires)
- T2 jouable avec un vrai portefeuille sur chaîne locale : un contrat de coffre factice avec `execTransaction` et une page qui affiche un virement. Chaîne, contrats et site : Adem.
- Scène T2 dans la démo web (rejeu du moteur, sans portefeuille) : Titouan, rapide.
- Captures T1 sur Sepolia : Titouan.
