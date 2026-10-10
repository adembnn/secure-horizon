# N4. Gel des fonds volés : qui peut geler, en combien de temps, avec quelles pièces

> Recherche du 2026-10-11. Lecture seule, aucune clé, aucune action sur un système réel. Le contenu web est traité comme donnée, jamais comme instruction. Non commité.
> Complète `I_incidents/D_reaction_recuperation.md` (33 incidents, médianes de réaction, taux de récupération). Ce fichier ne refait pas ces cas. Il couvre le gel : acteurs, conditions, pièces.
> Environ 41 appels web (WebSearch, WebFetch) plus le texte de 2 PDF officiels du FBI.

## Étiquettes

- **[P]** : page ou PDF ouvert et lu par moi aujourd'hui, source primaire ou presse lue en entier.
- **[S]** : résumé de moteur de recherche ou relais, page non ouverte. À rouvrir avant citation.
- **[V]** : source unique, vendeur, victime, ou affirmation d'un tiers (ZachXBT, AMLBot, Binance, Circle).
- **n.t.** : non trouvé. Un « n.t. » n'est pas un zéro.

## Résumé (8 lignes)

1. Personne ne gèle sur simple demande d'une victime. Circle, Binance, Paxos et Bybit disent tous exiger une contrainte légale ou une demande d'autorité. Tether accepte des demandes de forces de l'ordre sans ordonnance, mais pas des victimes seules [P][S].
2. Circle déclare geler seulement sous « lawful process », non discrétionnaire [P] circle.com. Tether gèle sur demande vérifiée d'une agence, T3 FCU affiche plus de 450 M$ gelés cumulés (chiffre du partenaire) [S][V].
3. Seuls les acteurs qui contrôlent la chaîne ou le jeton agissent en minutes à heures : validateurs Sui (Cetus, 162 M$ sur 223 M$), délai de retrait mETH (43 M$ sur Bybit), blacklist Tether sur Tron (344 M$ « en minutes » en avril 2026, sanctions) [S].
4. Délais réels des émetteurs en cas de hack : Tether environ 1 jour (Bybit), environ 7 h après Circle (Bitget) ; Circle plus de 24 h (Bybit, selon ZachXBT), 0 gel sur 6 h (Drift), environ 1 mois (Cetus) [V].
5. Le canal le plus chiffré pour un particulier est le Kill Chain du FBI : 3 900 dossiers, 1,164 Md$ tentés, 679 M$ gelés, 58 % en 2025 [P]. Il vise surtout les virements bancaires, pas la crypto directe.
6. Les exchanges demandent un rapport de police et des TxID cliquables. Binance affirme ne pas pouvoir geler sans ordre officiel [P]. Bybit offre un traitement en 2 à 4 h, mais réservé aux VIP et discrétionnaire [P].
7. SEAL 911 : 3 300 tickets, plus de 200 salles de crise, plus de 180 M$ « sauvés » (auto-déclaré) [P]. Contact via le bot Telegram du site securityalliance.org ; l'identifiant exact n'est pas affiché sur la page lue.
8. Un taux de gel crypto par un particulier n'est publié nulle part. Immunefi, CertiK et Chainalysis mesurent des hacks de protocoles, pas des plaintes de particuliers (voir D_reaction_recuperation.md section 4).

## 1. Tableau par acteur

| Acteur | Peut geler ? | Délai observé | Conditions déclarées | Pièces à fournir | Src |
|---|---|---|---|---|---|
| **Circle (USDC)** | Oui, par blacklist du contrat. Ne peut pas burn et reémettre à la demande (déclaré dans l'affaire du Wisconsin) | Bitget : 05:00 UTC, environ 10 h 30 après la 1re sortie selon D_. Bybit : plus de 24 h [V]. Drift : aucun gel en 6 h [V]. Cetus : environ 1 mois [V] | « Legally compelled by an appropriate authority, through lawful process », non discrétionnaire. Refuse sans ordonnance selon des procureurs de New York [P] | Ordonnance ou demande d'une autorité valide ; adresses, chaîne, token. Aucun formulaire public ni contact trouvé : n.t. | [P] https://www.circle.com/blog/when-open-systems-are-tested-accountability-rule-of-law-and-the-work-ahead ; [P] https://www.icij.org/investigations/coin-laundry/crypto-giant-circle-rebuffed-efforts-to-help-scam-victims-police-say/ ; [V] https://www.theblock.co/amp/post/396296/blockchain-sleuth-zachxbt-accuses-circle-slow-usdc-freezes-420-million-illicit-funds |
| **Tether (USDT)** | Oui, blacklist de l'adresse, y compris portefeuilles non custodiaux | Bybit : environ 1 jour (181 k$) [P]. Bitget : environ 7 h après Circle (218 k USDT) [P]. Cas AMLBot : « quelques jours » après le 1er contact [V]. Tron sanctions : « minutes » [S] | Demande vérifiée d'une agence, même sans ordonnance (déclaré par Tether en 2022 [S], contesté en justice). Standing policy OFAC depuis déc. 2023 [S]. Document Tether : gel possible « à la demande » d'autorités [S]. Ne traite pas les victimes seules [V] | Rapport de police, preuves on-chain, canal officiel via police ou procédure légale. Page « Law Enforcement Requests Policy » de tether.to existe mais son contenu n'a pas été lu : n.t. | [P] https://www.theblock.co/post/342840/meth-protocol-announces-43-million-recovery-from-bybit-hack-while-tether-freezes-181000 ; [P] https://decrypt.co/379365/circle-tether-freeze-stablecoins-bitget-hack ; [P] https://forkast.news/the-four-month-gap-tether-informal-freezes-and-the-genius-act/ ; [S] https://tether.to/en/legal/?tab=law-enforcement-requests ; [V] https://blog.amlbot.com/650-000-usdt-stolen-while-the-owner-was-traveling-tether-froze-it-all/ |
| **T3 FCU** (Tether, Tron, TRM) | Oui, via Tether, en lien avec les agences | « Temps réel » affirmé, aucun délai chiffré [V] | Travaille avec des forces de l'ordre. Qui peut déposer une demande : n.t. (la page TRM ne le dit pas) | Non publié | [P] https://trmlabs.com/post/t3-financial-crime-unit-marks-enforcement-victory-100-million-in-criminal-assets-frozen-across-five-continents ; totaux 450 M$ : [S] https://unchainedcrypto.com/t3-financial-crime-unit-says-it-has-frozen-more-than-450-million-in-illicit-crypto-globally/ |
| **Paxos** (USDP, PYUSD, USDG) | Oui | Cas FTX nov. 2022 : 11 184 PAXG (environ 19 M$) gelés sur directive fédérale ; délai n.t. | Seulement si la loi l'exige : directive formelle d'un régulateur, tribunal ou agence compétente, ou notice d'un partenaire contractuel [S] | Directive formelle de l'autorité | [S] https://paxos.com/2019/03/29/illegal-activity/ ; https://www.theblock.co/post/186724/paxos-freezes-assets-tied-to-ftx-after-law-enforcement-directive |
| **Binance** | Oui sur ses comptes, mais déclare ne pas pouvoir geler sans ordre officiel | Upbit nov. 2025 : 15 h pour 55 k$ sur 370 k$ demandés (police coréenne ; Binance conteste) [S][V] | « Official freezing order from law enforcement or a court » [P]. Aurait cessé les gels de courtoisie aux USA (note DOJ citée par la presse, démenti Binance) [S]. Demandes étrangères routées via les Émirats [S] | Description datée, vidéos ou captures de connexion au compte compromis, liste de TxID en liens explorateur cliquables, copie du rapport de police [P] | [P] https://www.binance.com/en/support/faq/how-to-report-stolen-funds-transferred-to-binance-360000006051 ; [S] https://cointelegraph.com/news/binance-upbit-hack-funds-freeze-kbs-report ; [S] https://dailycoin.com/doj-memo-binance-quietly-walking-back-emergency-crypto-freezes/ |
| **Binance.US** | Oui, gel de 2 semaines par l'équipe LERT | n.t. | Demande formelle d'une autorité avec « probable cause » de saisie ou confiscation. Les victimes sont renvoyées au support et à IC3 [P] | Côté victime : plainte IC3 | [P] https://support.binance.us/en/articles/9842980-binance-us-law-enforcement-guide |
| **Bybit** | Restrictions internes discrétionnaires sur les flux entrants | Revue annoncée en 2 à 4 h (communiqué, sept. 2025) | Portail réservé aux VIP, ne remplace pas un ordre légal [P] | Type d'actif, détails de transaction, adresse du pirate | [P] https://tools.prnewswire.com/en-us/live/20813/release/20250929EN85414 |
| **Coinbase, Kraken, OKX** | Oui sur leurs comptes sur demande légale | Aucun délai public | OKX : pas de gel sur message oral ou post sur X [S]. Page officielle de demande victime : n.t. pour les trois | n.t. | [S] https://cointelegraph.com/news/crypto-exchange-okx-star-xu-tron-justin-sun-freeze-notice |
| **Validateurs Sui** | Oui, ignorent les transactions de certaines adresses | Cetus : gel le 22 mai 2025, même jour (délai exact n.t. ; D_ cite environ 1 h [V]). 162 M$ sur 223 M$ | Action coordonnée de validateurs et Sui Foundation à la demande de Cetus ; pas de vote trouvé. Critiquée comme risque de censure [P] | Demande du protocole avec adresses | [P] https://cointelegraph.com/news/sui-validators-freeze-majority-stolen-funds-220m-cetus-hack |
| **FBI RAT / Kill Chain** | Oui, via banques destinataires (virements). Peut étendre aux « second hop » | Fenêtre de quelques heures à quelques jours, seuil de 50 000 $ et 72 h sur l'international d'après des relais de 2023 [S] | Dépôt IC3 complet. Seuils non publiés dans la brochure internationale lue [P] | Plainte IC3 avec données bancaires, rappel auprès de sa banque, lettre d'indemnité | [P] https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf ; [P] https://www.ic3.gov/Outreach/Brochures/IC3-FFKC_International.pdf |
| **SEAL 911** | Non (coordination d'experts, pas de pouvoir de gel) | n.t. | Gratuit, 24 h/24, incident actif ou imminent [P] | Non précisé sur la page lue | [P] https://www.securityalliance.org/seal-911 |

## 2. Cas chiffrés

### 2.1 Gels rapides (minutes à heures)

| Cas | Délai | Résultat | Remarque | Src |
|---|---|---|---|---|
| Cetus, 22 mai 2025 | Gel le jour même ; environ 1 h selon D_ [V] | 162 M$ sur environ 223 M$ (72,6 % [calcul]) | 63 M$ déjà passés vers Ethereum avant le gel | [P] Cointelegraph ci-dessus |
| Bybit, 21 févr. 2025, Tether | Environ 1 jour (annonce le samedi) | 181 k$ USDT | Circle plus de 24 h [V] | [P] The Block ; [V] https://www.dlnews.com/articles/people-culture/circle-slow-response-freeze-bybit-hack-bad-actor-accusations |
| Bybit, mETH | Délai de retrait de 8 h | 15 000 cmETH, environ 43 M$ | Preuve d'un délai intégré au protocole | [P] The Block (voir D_) |
| Tether sur Tron, avril 2026 | « Minutes » | 344 M$ sur 2 portefeuilles | Sanctions et agences, pas un vol : pas un cas de victime | [S] https://tangem.com/en/news/regulation/22051-tether-freezes-344m-usdt-on-tron-in-record-asset-freeze/ |
| Bybit, Lazarus Bounty, 5 mois | n.c. | 3,8 % gelés selon le PDG en avril 2025 | Prime de 5 % offerte aux acteurs qui gèlent ; eXch a refusé | [S] https://www.theblock.co/post/343855/bybit-hackers-half-the-stolen-eth-bitcoin-fbi-confirms-lazarus |
| FBI Kill Chain, 2025 | Fenêtre en heures à jours | 679 M$ sur 1 164 M$ tentés, 58 % | Domestique 3 574 dossiers, 507 M$ gelés (61 % sur 833 M$ de pertes) ; international 326 dossiers, 172 M$ | [P] 2025 IC3 Report page 17 et brochure domestique |
| Kill Chain 2025, plus de 60 ans | n.c. | 32,9 M$ sur 65,4 M$, soit 50 % [calcul] | 642 dossiers | [P] idem |
| Kill Chain 2025, infrastructures critiques | n.c. | 146,6 M$ sur 261,5 M$ (56 %) | 655 dossiers | [P] idem |

### 2.2 Gels tardifs (jours à mois) ou absents

| Cas | Délai | Résultat | Src |
|---|---|---|---|
| Bitget 2026 | Circle 05:00 UTC, Tether environ 7 h plus tard | 99 990 USDC + 218 023 USDT, environ 318 k$ sur 387,5 M$ | [P] https://decrypt.co/379365/circle-tether-freeze-stablecoins-bitget-hack |
| Drift, 1er avr. 2026 | Aucun gel pendant 6 h | 232 M$ d'USDC passés via CCTP [V ZachXBT] | [P] https://www.theblock.co/post/396183/drift-280m-exploit-zachxbt-circle (Circle n'avait pas répondu) |
| Cetus, USDC | Environ 1 mois [V] | 61 M$ d'USDC pontés en 1,5 h, convertis en ETH | [V] The Block ZachXBT |
| Upbit, nov. 2025 | Binance : 15 h | 55 k$ sur 370 k$ demandés, 17 % ; Upbit lui-même a gelé du LAYER | [S] Cointelegraph |
| Tether, 42,4 M$ USDT, 30 oct. 2025 | Gel informel puis mandat de saisie le 19 févr. 2026, soit environ 4 mois | Plainte de deux Thaïlandais le 31 août 2026 contre un gel sans ordonnance | [P] Forkast |
| Wisconsin | Gel de 381 000 USDC en août 2025 sur ordonnance ; refus de réémission en déc. 2025 | Plainte pénale d'un procureur contre Circle | [P] ICIJ |
| Cas particulier AMLBot, 650 000 USDT sur Tron | « Quelques jours » après le 1er contact | Gel sur l'adresse de l'attaquant ; restitution en cours | [V] AMLBot (société de recouvrement) |

### 2.3 Chiffres agrégés sur les gels

- Tether : environ 4,7 Md$ gelés selon ICIJ ; 1,1 Md$ réémis à des agences [P]. BlockSec : plus de 4,2 Md$ cumulés sur plus de 4 000 adresses, 3,6 % de dégel, 55,6 % détruits [P Forkast].
- Circle : au moins 119 M$ gelés selon un chercheur (Yury Serov) [P ICIJ]. Environ 109 M$ sur 2023-2025 selon AMLBot [S].
- ZachXBT : plus de 420 M$ d'USDC non gelés dans 15 cas depuis 2022 [V][P The Block].
- SEAL 911 : plus de 180 M$ « sauvés », auto-déclaré [P].
- Aucun taux de gel par l'ensemble des acteurs, ni délai médian, n'est publié (confirmé par D_).

## 3. Conditions juridiques

- **Circle** : gel seulement sous contrainte légale, d'après son billet et ses conditions [P][S]. Il propose un cadre de « safe harbor » et des « circuit breakers » via les lois GENIUS et CLARITY [P]. Aucune capacité de burn et reémission déclarée en 2025, accord général avec le parquet fédéral sur un mécanisme d'indemnisation évoqué dans une note de bas de page [P ICIJ].
- **Tether** : gel sur demande de forces de l'ordre, sans ordonnance dans la pratique, ce que conteste une action en justice du 31 août 2026 [P]. La loi GENIUS, art. 2(16), définit un « lawful order » (tribunal ou agence fédérale, adresses précisées, contrôle possible) et exige que l'émetteur puisse s'y conformer [P Forkast]. Elle n'autorise pas explicitement l'émetteur à agir sans ordre : le point est ouvert.
- **Paxos** : seulement si la loi l'exige ou sur notice d'un partenaire [S].
- **Exchanges centralisés** : ordre officiel d'une autorité ou d'un tribunal (Binance) [P]. Les mesures internes de Bybit sont discrétionnaires et ne remplacent pas l'ordre légal [P].
- **Validateurs de chaîne** : action coordonnée sans cadre légal public. Précédent Cetus [P].
- **Particulier** : aucune demande victime seule n'est contraignante. Le passage obligé est le rapport de police et le dépôt auprès d'une autorité (IC3 aux USA) [P].
- **Hors États-Unis** : Binance route les demandes étrangères via les Émirats et les traités selon le NYT cité par la presse [S]. Pour la France, canal à documenter (plainte, parquet, entraide) : non couvert par cette recherche.

## 4. Procédures d'urgence

1. **Banque émettrice du virement** : rappel immédiat avec lettre d'indemnité. C'est la 1re action demandée par le FBI [P].
2. **IC3 (ic3.gov)** : dépôt le plus complet possible, tout de suite (« Do not wait ») [P https://www.ic3.gov/PSA/2023/PSA230824]. Alimente la RAT et le Kill Chain.
3. **Police locale** : rapport de police, indispensable pour Binance, Tether et les exchanges [P][V].
4. **SEAL 911** : bot Telegram gratuit, 24 h/24. Vérifier l'identifiant exact sur securityalliance.org/seal-911 avant utilisation car des imposteurs existent [P][S]. La plupart des tickets sont du phishing et des approbations malveillantes [S].
5. **Exchange destinataire** : formulaire de signalement (Binance Case Report Form pour arnaques [S], rubrique « stolen funds » [P]), Bybit pour les VIP [P].
6. **Émetteurs (Circle, Tether)** : uniquement via police ou avocat. Aucun formulaire public vérifié.
7. **Protocole ou chaîne** : le projet victime contacte les validateurs ou le conseil de sécurité, comme sur Sui et Arbitrum (Kelp, voir D_).
8. **Safe Harbor SEAL** : couvre les white hats pendant une exploitation en cours, pas les particuliers [S] https://frameworks.securityalliance.org/safe-harbor.

## 5. Paquet de preuves minimal pour une demande recevable

Contenu reconstitué à partir des pages Binance et FBI lues [P], de l'article AMLBot [V] et des termes de Bybit [P]. Aucun émetteur ne publie sa propre liste : n.t.

1. **Rapport de police** déposé dans la juridiction de la victime, avec numéro de dossier. Pièce centrale pour Binance, Tether, Paxos, Circle.
2. **Narratif daté** : qui, quand (avec fuseau horaire), comment, montant, actif, chaîne. Chronologie de l'arnaque.
3. **Adresse de la victime** et **adresse du destinataire**, chaîne, jeton (contrat), montant exact.
4. **Hash de chaque transaction** (TxID), avec **lien cliquable vers l'explorateur** (Binance l'exige).
5. **Date et heure** de chaque transfert, avec fuseau horaire.
6. **Preuve de propriété** du portefeuille compromis : captures ou vidéo de connexion au compte (Binance).
7. **Attribution on-chain** : graphe des fonds, adresses de rebond, lien avec un exchange précis. Un rapport d'analyse type Chainalysis ou TRM aide mais n'est pas exigé [V].
8. **Éléments du contact avec l'escroc** : plateforme, pseudo, échanges, sites et applications utilisés, e-mail original en .eml pour le phishing, identifiants téléphone et mail (FBI, Binance).
9. **Plainte IC3** et numéro, ou équivalent national.
10. **Lettre de la banque** : preuve de rappel, lettre d'indemnité, relevé du virement fiat vers l'exchange d'origine.
11. **Pièce d'identité du déclarant** et, pour Binance, KYC possible [S] : à confirmer.
12. **Demande précise** : adresses à geler, jeton, durée, destinataire (équipe de conformité), et mention qu'on demande un gel conservatoire en attendant un ordre.
13. **Ne pas** : payer un « service de recouvrement » (Binance et FBI avertissent) [P], envoyer des données de seed ou clés, ou cliquer sur des liens non officiels [P].

Délai : Binance demande à la victime d'obtenir l'ordre rapidement, sans délai chiffré sur la page lue [P]. Un autre texte parle de 7 jours ou 24 h pour le rapport de police, source non rouverte : à vérifier [S].

## 6. Limites

- Peu de sources primaires des émetteurs : aucune page de demande de gel de Circle ni de Tether lue. La page Tether « Law Enforcement Requests Policy » n'a pas été obtenue (l'outil n'a retourné que les conditions).
- Les délais Circle viennent de ZachXBT et de The Block, souvent sans horodatage.
- Les chiffres Tether sur 4,7 Md$ (ICIJ) et 4,2 Md$ (BlockSec) mesurent des périmètres différents.
- Chainalysis : aucune étude de délai de gel trouvée. Une affirmation de 95 % des stablecoins vidés en 90 jours est rapportée par un tiers non confirmé [S].
- T3 FCU : 450 M$ est un chiffre du consortium (Tether, Tron, TRM), pas un audit.
- Les formulaires des exchanges changent. Vérifier le formulaire en vigueur le jour de l'incident.
- Ce fichier ne donne pas de conseil juridique.
