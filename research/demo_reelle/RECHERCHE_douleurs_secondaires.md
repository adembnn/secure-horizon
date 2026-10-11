# Hold up : quelles autres douleurs le contrôle « intention écrite contre effet » traite-t-il ?

Date de lecture : 2026-10-11. Toutes les URL ont été lues ce jour.
Ce fichier complète `RECHERCHE_chiffres_douleur.md` (phishing par signature). Il ne le refait pas.

Légende de fiabilité (la même que dans l'autre fichier) :
- [A] source publique ou évaluée par les pairs, ou post-mortem officiel du projet touché, lu à la source.
- [B] page d'un éditeur ou d'un acteur intéressé, lue à la source. Conflit d'intérêt signalé.
- [C] presse spécialisée ou résultat de recherche. Non vérifié à la source primaire.
- [calcul] addition faite par moi à partir de chiffres sourcés. Pas dans la source.

Réserve de méthode : l'outil de lecture résume les pages. Relire la phrase exacte à l'URL avant toute slide. Les post-mortems publiés sur X (CoW Swap, Aave) n'ont pas pu être lus directement : ils sont cités via un relais.

## TL;DR
1. Douleur C (site de confiance détourné) : c'est la plus solide. Incidents officiels chaque année de 2021 à 2026. Derniers : CoW Swap, 14 avril 2026, environ 1,2 M USDC en 4,5 heures ; Aerodrome/Velodrome, 21 nov. 2025, environ 700 000 $. Les listes ont mis 81 minutes à signaler Aerodrome. Le contrôle d'intention aide vraiment ici, mais pas à 100 %.
2. Douleur A (sur-autorisation chez un service honnête, piraté plus tard) : réelle et documentée, mais petite. LI.FI, 16 juillet 2024 : 11,6 M$, 153 portefeuilles, seulement ceux en approbation illimitée (post-mortem officiel). SwapNet, 25 janv. 2026 : 13,43 M$. Liste Revoke.cash : environ 7,4 M$ en 2025 et 24,1 M$ en 2026 à ce jour [calcul]. Le contrôle borne la perte, à condition que l'utilisateur réduise le plafond.
3. Douleur B (erreur honnête) : la moins bien chiffrée. Aucune statistique d'ensemble sur les erreurs faites depuis un portefeuille de navigateur. Des cas isolés spectaculaires (50,4 M$ échangés contre environ 36 000 $ sur Aave, 12 mars 2026) et un sondage (21 % ont déjà envoyé à une mauvaise adresse, 789 détenteurs américains). Le contrôle attrape le mauvais montant et le mauvais jeton, pas la mauvaise adresse.
4. Trois données cherchées et non retrouvées : la part actuelle des approbations illimitées (dernier chiffre : 60 %, données de 2021), l'usage réel de la modification du plafond dans les portefeuilles, l'effet mesuré de Permit2.
5. À ne pas croire couvert : adresse collée déjà remplacée, empoisonnement d'adresse, phrase secrète saisie sur un faux site, fonds déposés dans un protocole piraté, fraude où la victime fait ce qu'elle veut.

---

## Douleur A. Sur-autorisation chez un service honnête, piraté plus tard

### A.1 Incidents

| Incident | Date | Montant | Victimes | Source | L'intention l'aurait-elle arrêté ? |
|---|---|---|---|---|---|
| LI.FI (agrégateur de ponts) | 16 juil. 2024 | environ 11,6 M$ | 153 portefeuilles | Post-mortem officiel : https://li.fi/knowledge-hub/incident-report-16th-july/ [A] | Oui, si le plafond avait été réduit. LI.FI écrit que la faille était « limited to infinite approvals » et n'a pas touché les approbations finies, « which is the default setting ». Les 153 victimes avaient donc choisi ou accepté l'illimité. |
| SwapNet (via Matcha) | 25 janv. 2026 | 13,43 M$ | Non retrouvé | https://revoke.cash/exploits/swapnet [B]. Post-mortem Matcha non lu (erreur 429) : https://meta.matcha.xyz/SwapNet-Incident-Post-Mortem | En partie. Les victimes avaient désactivé l'approbation à usage unique de Matcha et donné une approbation directe, « often unlimited ». La part des victimes en illimité n'est pas donnée. La page prévient qu'une approbation au montant exact jamais consommée reste exploitable. |
| Radiant Capital (prêt) | 16 oct. 2024, puis en continu | 60 M$ au total. Part prise dans les portefeuilles par les approbations : environ 10 M$ selon Revoke.cash ; 7,7 M$ pour 2024 et 1,2 M$ pour le T1 2025 selon Radiant | Non retrouvé. « tens of thousands of approvals remain live ». Vols encore observés en juillet 2026 | https://revoke.cash/exploits/radiant [B] ; forum Radiant : https://community.radiant.capital/t/feedback-104-survey-remediation-of-unlimited-allowance-exploit-losses/2222 [A] | En partie. Pour la part « approbations » (7,7 à 10 M$) : oui si le plafond avait été limité au dépôt. Pour les 50 M$ déposés dans les pools : non. Les deux chiffres (10 M$ et 7,7 M$) ne concordent pas. |
| Socket / Bungee (pont) | 16 janv. 2024 | au moins 3,3 M$ selon PeckShield ; Revoke.cash affiche 1 M$ | Non retrouvé | https://www.theblock.co/post/272986/socket-says-bungee-protocol-exploited [C] ; https://revoke.cash/exploits [B] | Oui en principe. Socket a dit que l'incident touchait les portefeuilles en approbation infinie. Post-mortem officiel non retrouvé. Les deux montants ne concordent pas. |
| Autres cas de la liste Revoke.cash : Unizen (8 mars 2024, 3,2 M$), Seneca (28 fév. 2024, 1,3 M$), ParaSwap (20 mars 2024, 324 000 $), Dexible (17 fév. 2023, 2 M$), SushiSwap (9 avril 2023, 1,7 M$), Transit Swap (1er oct. 2022, 5 M$), Arcadia (15 juil. 2025, 3,6 M$), Aperture (25 janv. 2026, 3,7 M$), Ekubo (5 mai 2026, 1,42 M$), Magic Eden / Limit Break (24 sept. 2026, 2,8 M$) | 2022-2026 | voir liste | Non retrouvé pour chacun | https://revoke.cash/exploits [B] | Non vérifié cas par cas. Je n'ai pas lu chaque post-mortem. Ne pas affirmer « illimité » pour ces lignes sans relire. |

### A.2 Statistiques

| Statistique | Chiffre | Périmètre et méthode | Source | Fiab. |
|---|---|---|---|---|
| Total de la liste Revoke.cash | « Over $355M stolen since 2020 », 71 incidents | Liste tenue à la main. Elle mélange trois choses : contrats piratés (douleur A), interfaces détournées (douleur C : BadgerDAO 111,1 M$, Ledger, Galxe, Curve, CoW Swap) et « rug pulls ». Aucun nombre de victimes | https://revoke.cash/exploits | B (Revoke.cash vit de la révocation) |
| Somme par année de cette liste | 2024 : 13 incidents, environ 79,5 M$ (dont 60 M$ Radiant, dont 50 M$ ne viennent pas des approbations). 2025 : 9 incidents, environ 7,4 M$. 2026 jusqu'au 24 sept. : 9 incidents, environ 24,1 M$ (dont 1,2 M$ CoW Swap, qui relève de C) | Addition des montants de la ligne de résumé de chaque incident. À recompter sur la page avant usage | même URL | [calcul] |
| Part des approbations ERC-20 illimitées | 60 % (15,2 M sur 25,4 M) | Ethereum, jusqu'au 31 juillet 2021. Wang et al., RAID 2022 | https://arxiv.org/abs/2207.01790 | A, donnée de 2021 |
| Part actuelle (2023-2026) | Non retrouvé | Deux recherches (Dune, arXiv, études récentes). Aucun tableau Dune ni article trouvé | — | — |
| Usage réel de la modification du plafond | Non retrouvé | MetaMask documente la fonction, sans chiffre d'usage. En 2021 : 5 interfaces sur 31 permettaient de modifier, 0,2 % des utilisateurs suivaient la bonne pratique (RAID 2022) | https://support.metamask.io/configure/tokens/how-to-customize-token-approvals-with-a-spending-cap ; https://arxiv.org/abs/2207.01790 | B ; A (2021) |
| Défaut de MetaMask Swaps | Illimité par défaut sur les réseaux chers en frais (« default to 'unlimited' to save unnecessary gas costs »), modifiable. Limité par défaut sur les réseaux de seconde couche | Page d'aide, sans date | https://support.metamask.io/stay-safe/safety-in-web3/why-does-swaps-use-unlimited-token-approvals | B |
| Effet de Permit2 | Non mesuré. Aucun chiffre d'adoption trouvé | Annonce Uniswap du 17 nov. 2022 : approbations « time-bound », signature à usage unique. Un guide tiers dit que l'utilisateur approuve Permit2 « once per token, for unlimited amount » : l'illimité est déplacé vers le contrat Permit2, pas supprimé | https://blog.uniswap.org/permit2-and-universal-router [B] ; https://eco.com/support/en/articles/12005545-what-is-permit2-a-2026-guide-to-token-approvals [C] | B / C |

### A.3 Verdict sur A

- Chiffrée ? Oui par incident, non en total propre. Le « 355 M$ » ne peut pas servir tel quel : il contient BadgerDAO (111,1 M$, interface détournée) et 50 M$ de fonds de pools Radiant.
- Tendance ? Pas de tendance nette. 2025 faible (environ 7,4 M$), 2026 plus haut (environ 24,1 M$, tiré par SwapNet) [calcul]. Flux régulier de 9 à 13 incidents par an.
- Le contrôle l'aurait-il empêchée ? En partie. Au moment de signer, il n'y a pas d'attaquant. Hold up voit seulement l'écart « vous voulez échanger 50, vous accordez l'illimité ». Si l'utilisateur réduit le plafond à 50, la perte future est bornée à ce qui reste non consommé. LI.FI est la preuve la plus nette : zéro perte pour les approbations finies.
- Objection de praticien, à donner nous-mêmes : cet écart existe sur une grande part des échanges légitimes (MetaMask Swaps met lui-même l'illimité par défaut sur Ethereum). Si Hold up dit « ne correspond pas » à chaque fois, l'utilisateur s'habitue et passe outre. Il faut un verdict distinct (« correspond, mais le droit dépasse votre montant ») et un bouton qui réduit le plafond. Sinon c'est un générateur de faux positifs.
- Seconde objection : les portefeuilles affichent déjà le plafond et permettent de le modifier. Aucune donnée ne dit si les gens le font. Nous ne pouvons pas prouver que notre écran change ce comportement.

Mapping. NIST CSF 2.0 : PR.AA (moindre privilège sur les droits accordés), DE.CM, DE.AE, RS.MI (réduction du plafond). ATT&CK : T1199 (Trusted Relationship), T1657 (Financial Theft). D3FEND : à valider (famille « durcissement des autorisations »). OWASP Agentic : ASI03 seulement si c'est un agent qui accorde le droit. ATLAS : non pertinent.

---

## Douleur B. Erreurs honnêtes, sans attaquant

### B.1 Incidents et statistiques

| Incident ou statistique | Chiffre | Périmètre et méthode | Source | L'intention l'aurait-elle arrêté ? |
|---|---|---|---|---|
| Échange Aave / CoW Swap | 12 mars 2026. Plus de 50 M$ (50,4 M$) en aEthUSDT échangés contre environ 36 000 $ d'aEthAAVE. Frais perçus par Aave : 110 368 $ | Un seul utilisateur. L'interface affichait « High price impact (99.9%) » et une case à cocher acceptant jusqu'à 100 % de perte. L'utilisateur l'a cochée sur mobile | The Block, 15 mars 2026 : https://www.theblock.co/post/393621/aave-and-cow-swap-publish-dueling-post-mortems-after-50-million-defi-swap-disaster [C]. Post-mortems officiels sur X, non lus : https://x.com/aave/status/2032959512244518962 ; https://x.com/CoWSwap/status/2032959076502581623 | En partie. Hold up peut comparer la valeur reçue à la valeur envoyée. Mais une alerte existait déjà et l'utilisateur l'a validée. Rien ne prouve qu'une alerte de plus aurait changé son geste. Aave a répondu en bloquant par défaut les échanges à plus de 25 % d'impact (« Aave Shield », d'après Cointelegraph [C]). |
| Échange de stablecoins sur Uniswap v3 | 12 mars 2025. Environ 220 764 $ d'USDC contre 5 271 USDT (5 273 selon EigenPhi) | Un cas. Tolérance de prix laissée ouverte. Uniswap dit que la transaction ne venait pas de son interface. Certains soupçonnent du blanchiment | Relais de Cointelegraph, résultat de recherche [C] | En partie, et seulement si la transaction passe par un portefeuille de navigateur. Cause réelle : aucune protection de prix dans la transaction. |
| Attaques « sandwich » sur Ethereum | Près de 40 M$ en 2025 ; 60 000 à 90 000 attaques par mois | Données EigenPhi rapportées par un tiers. Méthode non lue | Résultat de recherche (mexc.com/news/339517) [C] | En partie. Il y a un attaquant, mais la porte est une tolérance de prix trop large. Hold up la voit s'il compare le minimum reçu au montant attendu. À ne pas citer sans relire la source EigenPhi. |
| Jetons ERC-20 envoyés à des contrats qui ne peuvent pas les rendre | 103 787 241,54 $ au 23 oct. 2025, sur 2 409 jetons. En tête : BNB 25,8 M$, USUAL 25,5 M$, MNTx 12,7 M$, DAI 4,8 M$ | Script qui additionne les soldes bloqués dans des contrats de jetons. Valorisé au cours du jour du calcul, pas au jour de l'erreur. Deux jetons font la moitié du total : rien ne dit que ce sont des erreurs de particuliers | https://dexaran.github.io/erc20-losses/ [B]. Conflit d'intérêt : l'auteur milite pour remplacer ERC-20 par ERC-223 | Oui pour l'envoi d'un jeton à l'adresse du contrat du jeton lui-même : c'est une règle simple (« le destinataire est un contrat de jeton »). Mais ce n'est pas un écart d'intention : l'utilisateur a bien écrit « envoyer ». C'est une règle sur le destinataire. |
| Jetons OP bloqués | 173 515 OP, environ 279 358 $ au 3 oct. 2024, dans 45 contrats. 120 adresses ont perdu 50 $ ou plus en envoyant des OP au contrat OP | Analyse financée par Optimism, contrats vérifiés à la main | https://gov.optimism.io/t/token-resurrection-analysis-of-locked-op-tokens-season-6-mission-grantee/9056 [A] | Oui pour ces 120 cas, par la même règle. Montant faible. |
| Jetons envoyés sur un réseau non pris en charge vers une adresse de dépôt Coinbase | Plus de 160 M$ récupérés pour plus de 10 000 utilisateurs, entre déc. 2022 et fév. 2024 | Chiffre déclaré par Coinbase (Vignesh Muralidharan). Ce sont des fonds récupérés, pas perdus. Frais de 5 % au-dessus de 100 $ selon la presse | The Block, 27 fév. 2024 : https://www.theblock.co/post/279371/coinbase-recover-unsupported-tokens-bnb-smart-chain-polygon [C] ; Cointelegraph, 13 avril 2023 (150 M$) : https://cointelegraph.com/news/erc-20-tool-recovers-150m-coinbase-exec-explains-how [C] | Non. L'envoi est correct côté portefeuille. Le problème est que la plateforme qui reçoit ne gère pas ce réseau ou ce jeton. Hold up ne sait pas qu'une adresse est une adresse de dépôt, ni ce que la plateforme accepte. |
| Sondage Kraken | 21 % ont déjà envoyé à une mauvaise adresse. 24 % ont oublié ou égaré des clés. 67 % ont fait au moins une erreur courante. 48 % craignent plus leurs propres erreurs que le vol | 789 détenteurs américains, SurveyMonkey Audience, terminé le 1er avril 2025. Déclaratif. Aucun montant | https://www.kraken.com/learn/crypto-safety-survey [B]. Conflit d'intérêt modéré : Kraken vend la garde des fonds | Non pour la mauvaise adresse (voir B.2). Non pour les clés perdues. Utile seulement pour dire que la peur de l'erreur est répandue. |
| Ether perdu à jamais | 636 000 ETH (1,15 Md$ au cours de mars 2023). Dont environ 24 000 ETH envoyés à une adresse de destruction. La part due au bogue Parity varie selon les relais (514 000 ou 306 000 ETH) | Décompte personnel de Conor Grogan (Coinbase), publié sur un réseau social en mars 2023. Surtout des bogues de contrats, peu d'erreurs de saisie | The Block : https://www.theblock.co/post/221453/over-1-billion-of-ether-lost-forever-bugs-human-error [C] | Non pour l'essentiel (bogues). Ne pas utiliser ce chiffre comme « erreurs d'utilisateurs ». |
| Frais aberrants sur Bitcoin | 83,6 BTC de frais le 23 nov. 2023 (environ 3,1 M$), remboursement proposé par AntPool. 19,8 BTC (environ 500 000 $) payés par Paxos le 10 sept. 2023, rendus par F2Pool le 15 sept. | Deux cas. Paxos est une entreprise et parle d'un bogue. Pour le premier, un demandeur dit avoir été piraté | Résultats de recherche (Decrypt, The Block) [C] | Non pour ces cas : Bitcoin, pas un portefeuille de navigateur EVM, et pas des particuliers. Sur EVM, comparer les frais au montant est faisable, mais je n'ai trouvé aucun incident EVM chiffré. |
| « Étude académique 2025 : 681 transferts accidentels, 5,5 M$ » | Non retrouvé à la source | Cité par un relais d'un article DailyCoin. Ni titre, ni auteurs, ni revue | Résultat de recherche (mexc.com/news/781780) [C] | Ne pas utiliser. |

### B.2 Raisonnement cas par cas

| Erreur | Détectée par « intention contre effet » ? | Pourquoi |
|---|---|---|
| Mauvais montant (un zéro en trop) | Oui | L'utilisateur écrit « 50 », la demande porte sur 500. C'est le cas le plus net. Aucune statistique de fréquence trouvée. |
| Mauvais jeton | Oui | « USDC » écrit, autre jeton dans la demande. Aucune statistique trouvée. |
| Mauvais réseau | En partie | Seulement si l'utilisateur écrit le réseau et que le portefeuille est sur un autre. Le cas coûteux (dépôt vers une plateforme qui ne gère pas ce réseau) n'est pas visible. |
| Mauvaise adresse | Non | L'utilisateur écrit « envoyer à Paul » ou colle la même adresse fausse. L'outil compare une adresse à elle-même. Exception possible : nom lisible (ENS) écrit dans l'intention et résolu vers une autre adresse. |
| Adresse collée remplacée par un logiciel malveillant | Non | L'adresse fausse est déjà dans la demande et l'utilisateur ne la connaît pas par cœur. Même limite pour l'empoisonnement d'adresse. |
| Envoi à un contrat de jeton | Oui, par une règle | Ce n'est pas un écart d'intention, c'est un contrôle du destinataire. |
| Frais aberrants | Oui en principe sur EVM | Comparaison frais contre montant. Aucun cas EVM chiffré trouvé. |
| Prix d'échange catastrophique | En partie | Détectable. Mais l'exemple à 50,4 M$ montre qu'une alerte validée d'une case ne suffit pas. |

### B.3 Verdict sur B

- Chiffrée ? Non comme catégorie. Des cas isolés, un sondage déclaratif, deux décomptes de jetons bloqués qui mélangent erreurs et bogues. Aucune source ne mesure les erreurs de montant ou de jeton, qui sont pourtant celles que Hold up attrape le mieux.
- Tendance ? Inconnue.
- Le contrôle l'aurait-il empêchée ? Oui pour le montant et le jeton, non pour l'adresse et pour le réseau côté plateforme. Les plus gros chiffres trouvés (160 M$ Coinbase, 103,8 M$ de jetons bloqués) tombent surtout dans ce que Hold up ne couvre pas ou couvre par une simple règle.
- Problème de règlement : c'est un hackathon blue team. Une erreur sans adversaire ne se mappe sur aucune technique ATT&CK. À présenter comme un bénéfice secondaire, pas comme un scénario de menace.

Mapping. NIST CSF 2.0 : PR.AT (l'utilisateur formule ce qu'il veut), DE.AE (écart détecté), RS.MI (demande retenue). ATT&CK, ATLAS, D3FEND : aucun mapping honnête, sauf le cas « sandwich » (attaquant opportuniste, sans technique ATT&CK propre). OWASP Agentic : ASI02 si c'est un agent qui se trompe d'outil ou de paramètre.

---

## Douleur C. Site de confiance détourné

### C.1 Incidents

| Incident | Date | Montant | Victimes | Délai d'alerte | Source | L'intention l'aurait-elle arrêté ? |
|---|---|---|---|---|---|---|
| CoW Swap (domaine cow.fi détourné auprès du registre, faux papiers d'identité) | 14 avril 2026, environ 4,5 heures | environ 1,2 M USDC. Plus grosse perte : 219 ETH selon la presse | Non retrouvé | Réponse de l'équipe en 19 minutes. Délai des listes : non retrouvé | Forum CoW DAO (CIP-86) : https://forum.cow.fi/t/cip-86-discretionary-grants-program-for-victims-of-the-cow-fi-domain-hijacking/3431 [A] ; https://revoke.cash/exploits/cowswap [B] ; https://domainnamewire.com/2026/04/17/domain-hijack-led-to-crypto-heist/ [C] | En partie. Le faux site demandait « approve tokens or sign messages » : oui, l'écart avec « échanger X contre Y » est visible. Il demandait aussi la phrase secrète : non, Hold up ne voit pas un champ de saisie. Ces victimes-là ont été exclues du remboursement. |
| Aerodrome et Velodrome (DNS modifié) | 21 nov. 2025, moins de 4 heures | environ 700 000 $ (9 adresses d'attaquant) | Non retrouvé. 408 utilisateurs avertis à la connexion et 491 à la signature par Blockaid | 81 minutes entre le changement DNS (20h11 UTC) et le signalement du domaine (21h32). Premier signalement d'un utilisateur à 22h07 | https://www.blockaid.io/blog/how-blockaids-customer-data-network-contained-the-aerodrome-dns-attack [B, Blockaid vend cette protection] | Oui en principe pour les signatures faites pendant les 81 minutes. Non vérifié : le texte ne dit pas ce que le faux site faisait signer. |
| Campagne de février 2026 : OpenEden, Curvance, Smithii, Avantis, Nerochain | 16 au 23 fév. 2026 | Non retrouvé. Blockaid dit avoir détecté « before funds were lost », sans le démontrer | Non retrouvé | Signalement le jour même pour OpenEden ; environ 5 jours de campagne au total | https://www.blockaid.io/blog/frontend-hijacking-and-the-web2-attack-surface-threatening-web3-protocols [B] | Oui en principe : les utilisateurs « were prompted to sign what appeared to be normal transactions ». Aucune perte chiffrée, donc aucune preuve de douleur en dollars. |
| Curve (domaine .fi détourné chez le bureau d'enregistrement) | 12 mai 2025, vers 20h55 UTC ; découvert à 21h20 | Aucune perte rapportée par Curve | — | 25 minutes avant la découverte par l'équipe. Listes : non mentionné | Post officiel : https://news.curve.finance/curve-domain-incident/ [A] | Oui en principe (la fausse page ne faisait que demander des signatures). Sans perte, ce cas ne prouve pas la douleur. |
| Squarespace : Compound, Celer, Pendle (et dYdX selon Blockaid) | juillet 2024 | Non retrouvé | Non retrouvé. « Plus de 220 » protocoles exposés selon la presse | Non retrouvé | https://blockaid.io/blog/squarespace-defi-domain-hijack-incident [B] ; Decrypt [C] | Oui en principe. Aucune perte chiffrée. |
| Ledger Connect Kit (dépendance JavaScript piégée, compte npm d'un ancien employé) | 14 déc. 2023. Fichier en ligne environ 5 heures ; vol sur moins de 2 heures | 610 000 $ selon Revoke.cash. Ledger ne donne pas de montant | Non retrouvé. Plus de 100 interfaces touchées selon Blockaid | 6 minutes selon Blockaid (2h37 à 2h43), auto-déclaré. Correctif Ledger 40 minutes après en avoir eu connaissance | Ledger : https://www.ledger.com/blog/a-letter-from-ledger-chairman-ceo-pascal-gauthier-regarding-ledger-connect-kit-exploit [A] ; https://www.blockaid.io/blog/attack-report-ledger-connect-kit [B] | Oui en principe : le code volait par « direct approvals/permits ». Cas important : le site visité était le vrai, l'adresse était la bonne, seule une dépendance était piégée. |
| Galxe (bureau d'enregistrement trompé par de faux documents) | 6 oct. 2023, quelques heures | plus de 270 000 $ | Non retrouvé | Non retrouvé | https://revoke.cash/exploits/galxe [B] ; déclaration Galxe non lue : https://help.galxe.com/en/articles/8452958-oct-6th-dns-security-incident-statement-guide | Oui : les visiteurs « were asked to approve their tokens to the attacker ». Galxe a remboursé à 110 %. |
| Balancer (DNS, bureau EuroDNS) | 19-20 sept. 2023 | environ 238 000 $ (non confirmé par Balancer) | Non retrouvé | L'avertissement « Deceptive site ahead » du navigateur s'affichait encore après la reprise du domaine : les listes sont lentes dans les deux sens | Cointelegraph : https://cointelegraph.com/news/balancer-social-engineering-attack-dns-provider-frontend-hijack [C]. Post-mortem Balancer non lu (erreur 403) | Oui : les utilisateurs devaient approuver un transfert vers l'attaquant. |
| Curve (DNS), Celer, PREMINT, Namecheap | 2022 | 610 000 $, 240 000 $, 400 000 $, 550 000 $ | Non retrouvé | Non retrouvé | https://revoke.cash/exploits [B] | Non vérifié cas par cas. |
| BadgerDAO (script injecté, sans doute via le compte Cloudflare) | 2 déc. 2021 ; code présent par intermittence depuis novembre 2021 | 111,1 M$ nets (plus de 120 M$ volés, environ 9,2 M$ récupérés) | Non retrouvé. Le code visait surtout les gros portefeuilles | Plusieurs semaines sans être vu | https://revoke.cash/exploits/badger [B] ; post-mortem archivé non lu : https://web.archive.org/web/20221214005715/https://badger.com/technical-post-mortem | Oui en principe : des approbations illimitées vers l'adresse de l'attaquant étaient ajoutées à des opérations normales. Hors période demandée (2021), mais c'est le plus gros cas. |
| Bybit / Safe (interface de signature piégée) | 21 fév. 2025 | environ 1,4 à 1,5 Md$ selon les relais | 1 (une plateforme) | Script malveillant en place 2 jours avant | The Block : https://www.theblock.co/post/343530/lazarus-appears-to-compromise-safe-developer-machine-in-lead-up-to-1-5-billion-bybit-hack-report [C] | En partie, et hors cible. Les signataires pensaient faire un transfert de routine. Un contrôle indépendant de l'interface aurait montré un autre effet. Mais ce sont des signataires d'entreprise, pas des particuliers, et le détail de ce qu'ils voyaient n'a pas été vérifié à la source. |

### C.2 Verdict sur C

- Chiffrée ? Oui par incident, avec des sources officielles. Pas de total annuel trouvé. Les montants sont modestes : de 0 à 1,2 M$ par incident depuis 2022. Le seul gros cas grand public (BadgerDAO, 111,1 M$) date de 2021. Nombre de victimes : presque jamais publié.
- Tendance ? La fréquence ne baisse pas : juillet 2024 (Squarespace), mai 2025 (Curve), nov. 2025 (Aerodrome), fév. 2026 (cinq protocoles en une semaine), avril 2026 (CoW Swap). Blockaid signale aussi des sous-domaines de Gitcoin et Yield Yak en juin 2026 [C]. Je n'ai pas de série en dollars pour dire « en hausse ».
- Délai avant alerte : deux mesures seulement, toutes deux de Blockaid sur lui-même. 6 minutes (Ledger, 2023) et 81 minutes (Aerodrome, 2025). Aucune mesure indépendante. Pour CoW Swap : non retrouvé.
- Le contrôle l'aurait-il empêchée ? Oui dans la plupart des cas, et c'est ici que le mécanisme a un vrai avantage : il ne dépend pas de la réputation du site. L'adresse est la bonne, le site est connu, la liste ne dit rien, mais la demande ne correspond pas à « échanger 50 USDC contre AVAX ».
- Trois limites honnêtes :
  1. Un échange normal commence lui aussi par une approbation. Si le faux site demande « approuver 50 USDC » à une adresse inconnue, la forme de la demande colle à l'intention. Hold up ne tranche que s'il sait reconnaître le bon contrat du service, ce qui redevient une liste. Dans ce cas la perte reste bornée à 50 USDC : l'intention écrite sert de plafond.
  2. La phrase secrète demandée par le faux site (CoW Swap) n'est pas une demande de signature. Non couvert.
  3. Les portefeuilles équipés de Blockaid avertissaient déjà (899 avertissements sur Aerodrome). Le reste à couvrir, ce sont les premières minutes et les portefeuilles sans cette protection. Sa taille n'est pas mesurée.

Mapping. NIST CSF 2.0 : DE.CM (surveillance des demandes), DE.AE (écart intention contre effet), RS.MI (demande retenue), ID.RA (risque de chaîne d'approvisionnement web). ATT&CK : T1584.001 et T1584.002 (domaines et serveurs DNS compromis), T1195.001 / T1195.002 (dépendance ou chaîne logicielle compromise), T1189 (Drive-by Compromise), T1204 (User Execution), T1657 (Financial Theft). Identifiants à revalider dans le référentiel avant la fiche de défense. D3FEND : candidat à valider. OWASP Agentic : ASI01 et ASI02 si un agent navigue et signe à la place de l'humain. ATLAS : non pertinent.

---

## Autres douleurs

### Traitées par le mécanisme et pas encore vues

| Douleur | Ce que le mécanisme apporte | Preuve | Réserve |
|---|---|---|---|
| Plafond de perte | Même quand la demande piégée a la bonne forme, l'intention écrite donne un montant maximal. Une approbation ou un Permit au-delà de ce montant ne correspond pas | Découle des cas LI.FI (illimité seul touché) et des détournements de site | C'est un raisonnement, pas une mesure. Suppose que l'outil propose de réduire le plafond |
| Dépendance piégée sur le vrai site | Aucune liste d'adresses de sites ne peut aider : l'adresse est la bonne | Ledger Connect Kit, plus de 100 interfaces, 14 déc. 2023 | Montant faible (610 000 $) |
| Signataires qui signent à l'aveugle (trésoreries, multisignatures) | Écrire l'intention avant de signer et la comparer à l'effet, hors de l'interface piégée | Bybit (fév. 2025), Radiant (trois développeurs, oct. 2024) | Hors cible « particulier ». Si l'appareil est infecté, l'outil peut l'être aussi |
| Agent qui signe pour l'utilisateur | L'intention écrite par l'humain devient la référence contre laquelle on juge l'action de l'agent | Aucun incident chiffré trouvé | Pas une douleur vécue aujourd'hui à grande échelle. À ne pas mettre en avant |

### Qu'on pourrait croire couvertes, et qui ne le sont pas

| Douleur | Pourquoi non |
|---|---|
| Adresse collée remplacée par un logiciel malveillant | L'utilisateur ne connaît pas l'adresse attendue. L'outil n'a rien à comparer |
| Empoisonnement d'adresse (au moins 83,8 M$ sur deux ans, USENIX 2025, voir l'autre fichier) | Même raison. Seul un contrôle d'historique aide, et MetaMask le fait déjà |
| Phrase secrète ou clé saisie sur un faux site | Ce n'est pas une demande de signature. Cas réel : CoW Swap, avril 2026 |
| Vol de clés par une dépendance piégée | Rien n'est présenté à l'utilisateur |
| Fonds déposés dans un protocole piraté (50 M$ des pools Radiant) | L'intention et l'effet correspondaient au dépôt |
| Approbation au montant exact, jamais consommée, vers un contrat piraté plus tard | La perte est bornée, pas évitée (avertissement de Revoke.cash sur SwapNet) |
| Simulation trompée (état du contrat modifié après le contrôle) | L'« effet » que nous calculons vient d'une simulation. Même limite que les autres outils |
| Dépôt vers une plateforme sur un réseau qu'elle ne gère pas (plus de 160 M$ récupérés par Coinbase) | Côté portefeuille, tout est correct |
| Fraude à l'investissement, faux support | La victime écrit l'intention que l'escroc lui dicte |

---

## Classement par solidité de la preuve

| Rang | Douleur | Preuve | Taille mesurée | Le contrôle aide | Verdict |
|---|---|---|---|---|---|
| 1 | C. Site de confiance détourné | Forte : post-mortems officiels, tous les ans, deux cas en 2026 | Petite par incident (0 à 1,2 M$) ; un cas à 111,1 M$ en 2021 | Oui, c'est le meilleur terrain du mécanisme, avec trois limites | Tient. Meilleur argument « pourquoi les listes ne suffisent pas » : 81 minutes sur Aerodrome |
| 2 | A. Sur-autorisation | Moyenne à forte : un post-mortem officiel très net (LI.FI), une liste d'éditeur | Petite : environ 7,4 M$ en 2025, 24,1 M$ en 2026 [calcul] | En partie : borne la perte, si le plafond est réduit | Tient comme fonction secondaire. Tombe comme douleur principale. Risque de faux positifs |
| 3 | B. Mauvais montant, mauvais jeton | Faible : aucun chiffre d'ensemble | Inconnue | Oui, nettement | Tient par logique, pas par les chiffres. À montrer en démo, pas à chiffrer |
| 4 | B. Prix d'échange catastrophique | Faible : cas isolés (50,4 M$, 220 764 $) | Inconnue ; 40 M$ de « sandwich » en 2025 non vérifié | En partie ; l'alerte existante a été ignorée | Fragile |
| 5 | B. Mauvaise adresse, mauvais réseau, envoi à un contrat | Moyenne sur l'existence (sondage 21 %, 160 M$ récupérés, 103,8 M$ bloqués) | Notable, mais mal attribuée | Non, sauf règle simple sur le destinataire | Tombe pour notre mécanisme |

## Chiffres à ne pas utiliser

| Chiffre | Pourquoi |
|---|---|
| 355 M$ (Revoke.cash) comme « pertes par sur-autorisation » | Mélange contrats piratés, interfaces détournées et rug pulls. Contient 50 M$ de fonds de pools |
| 60 % d'approbations illimitées, au présent | Donnée arrêtée au 31 juillet 2021 |
| 3,5 M$ « évités » sur Aerodrome ; 6 minutes de détection sur Ledger | Chiffres de Blockaid sur lui-même |
| 1,15 Md$ d'ether perdu par « erreur humaine » | Surtout des bogues de contrats |
| 103,8 M$ de jetons « perdus par erreur » | Deux jetons font la moitié ; valorisé au cours du jour ; auteur militant |
| 160 M$ comme « pertes » | Ce sont des fonds récupérés, et le cas n'est pas couvert par Hold up |
| 681 transferts accidentels, 5,5 M$ | Étude non retrouvée |
| 40 M$ de « sandwich » en 2025 | Relais de presse, source EigenPhi non lue |
| 230 portefeuilles touchés chez Socket | Non retrouvé dans les sources lues |
| 1,46 Md$ pour Bybit | Les relais lus donnent 1,4 ou 1,5 Md$ |

## Sources

Post-mortems et sources officielles [A] :
- LI.FI, rapport d'incident du 16 juillet 2024 : https://li.fi/knowledge-hub/incident-report-16th-july/
- CoW DAO, CIP-86 (avril-mai 2026) : https://forum.cow.fi/t/cip-86-discretionary-grants-program-for-victims-of-the-cow-fi-domain-hijacking/3431
- Curve, incident de domaine du 12 mai 2025 : https://news.curve.finance/curve-domain-incident/
- Ledger, lettre du 14 déc. 2023 : https://www.ledger.com/blog/a-letter-from-ledger-chairman-ceo-pascal-gauthier-regarding-ledger-connect-kit-exploit
- Radiant, forum de remédiation : https://community.radiant.capital/t/feedback-104-survey-remediation-of-unlimited-allowance-exploit-losses/2222
- Optimism, analyse des OP bloqués (16 oct. 2024) : https://gov.optimism.io/t/token-resurrection-analysis-of-locked-op-tokens-season-6-mission-grantee/9056
- Wang et al., RAID 2022 : https://arxiv.org/abs/2207.01790

Éditeurs et acteurs intéressés [B] :
- Revoke.cash (vit de la révocation) : https://revoke.cash/exploits ; https://revoke.cash/exploits/swapnet ; https://revoke.cash/exploits/radiant ; https://revoke.cash/exploits/cowswap ; https://revoke.cash/exploits/badger ; https://revoke.cash/exploits/galxe
- Blockaid (vend la détection) : https://www.blockaid.io/blog/how-blockaids-customer-data-network-contained-the-aerodrome-dns-attack ; https://www.blockaid.io/blog/frontend-hijacking-and-the-web2-attack-surface-threatening-web3-protocols ; https://www.blockaid.io/blog/attack-report-ledger-connect-kit ; https://blockaid.io/blog/squarespace-defi-domain-hijack-incident
- MetaMask : https://support.metamask.io/stay-safe/safety-in-web3/why-does-swaps-use-unlimited-token-approvals ; https://support.metamask.io/configure/tokens/how-to-customize-token-approvals-with-a-spending-cap
- Uniswap, annonce Permit2 (17 nov. 2022) : https://blog.uniswap.org/permit2-and-universal-router
- Kraken, sondage (1er avril 2025) : https://www.kraken.com/learn/crypto-safety-survey
- Dexaran, jetons ERC-20 bloqués (23 oct. 2025) : https://dexaran.github.io/erc20-losses/

Presse spécialisée [C] :
- The Block : https://www.theblock.co/post/393621/aave-and-cow-swap-publish-dueling-post-mortems-after-50-million-defi-swap-disaster ; https://www.theblock.co/post/279371/coinbase-recover-unsupported-tokens-bnb-smart-chain-polygon ; https://www.theblock.co/post/272986/socket-says-bungee-protocol-exploited ; https://www.theblock.co/post/221453/over-1-billion-of-ether-lost-forever-bugs-human-error ; https://www.theblock.co/post/343530/lazarus-appears-to-compromise-safe-developer-machine-in-lead-up-to-1-5-billion-bybit-hack-report
- Cointelegraph : https://cointelegraph.com/news/balancer-social-engineering-attack-dns-provider-frontend-hijack ; https://cointelegraph.com/news/erc-20-tool-recovers-150m-coinbase-exec-explains-how
- DL News (sondage Kraken) : https://www.dlnews.com/articles/web3/your-worst-crypto-fear-isnt-hackers-its-you-kraken-report
- Domain Name Wire (CoW Swap) : https://domainnamewire.com/2026/04/17/domain-hijack-led-to-crypto-heist/
- Guide tiers sur Permit2 : https://eco.com/support/en/articles/12005545-what-is-permit2-a-2026-guide-to-token-approvals

## Non lu ou non retrouvé
- Post-mortems CoW Swap et Aave publiés sur X (non lisibles par l'outil).
- Post-mortem Matcha / SwapNet (erreur 429), post-mortem Balancer (erreur 403), post-mortem BadgerDAO archivé, déclaration Galxe.
- Post-mortem officiel de Socket.
- Nombre de victimes pour presque tous les incidents de A et de C (seul LI.FI le donne : 153).
- Part actuelle des approbations illimitées ; usage de la modification du plafond ; adoption et effet de Permit2.
- Toute statistique sur les erreurs de montant ou de jeton.
- Tout total annuel des pertes par interface détournée.
- Toute mesure indépendante du délai entre un détournement et l'alerte des portefeuilles.
- Source primaire EigenPhi sur les attaques « sandwich » 2025.
- Incidents non cherchés faute de source primaire rapide : CoinMarketCap et Cointelegraph (juin 2025), Lottie Player (oct. 2024), paquets npm (sept. 2025), Bonk.fun (mars 2026, relais de blog seulement), erreurs de prix sur les ventes de NFT, envoi JUNO à une mauvaise adresse (2022).
