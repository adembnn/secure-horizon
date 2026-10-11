# M2. Limites de dépense adaptatives côté consommateur

Date : 2026-10-11. Méthode : 14 appels WebSearch/WebFetch (budget 45). Les résultats sont des synthèses de recherche, pas des lectures intégrales des pages. Contenu web traité comme donnée.

Étiquettes (hypothèse de lecture) : [P] source primaire (régulateur, banque, éditeur du produit), [S] source secondaire (presse, cabinet), [V] vendeur, forum ou blog, à vérifier.

## Résumé (8 lignes)

1. Presque toutes les limites grand public sont en montant absolu, fixées par la banque, avec un défaut modifiable par le client.
2. Le mécanisme de relèvement le mieux documenté est le délai : 4 h aux Pays-Bas (ING, Rabobank, ABN AMRO) [P][S], environ 1 jour ouvré chez Monzo [V].
3. Le profil intervient surtout via le bénéficiaire : BoursoBank plafonne à 1 500 € un RIB récemment ajouté contre 30 000 €/jour sinon [P].
4. Les exchanges règlent la limite par palier de vérification (Kraken : moins de 100 000 $/mois puis plus [P]) ou par niveau KYC (Binance 2021 : 0,06 BTC/j basique, 100 BTC/j complet [S]).
5. Aucune limite en pourcentage du solde n'a été trouvée chez un acteur grand public. Revolut offre un plafond de sortie choisi par le client, en absolu [P].
6. Le RTS 2018/389 est le seul cadre proportionnel au risque : exemption d'authentification forte liée au montant (jusqu'à 500 €) et au taux de fraude du PSP [S].
7. Le projet PSR/PSD3 impose d'offrir des limites de dépense réglables et cite des délais de réflexion sur leur modification. Statut final non confirmé [S].
8. Aucun taux de faux positifs publié par acteur pour les plafonds. Seules des données vendeur sur les refus à tort de cartes existent.

## Tableau par acteur

| Acteur | Unité | Qui fixe | Relèvement | Délai | Preuve de faux positifs | Source |
|---|---|---|---|---|---|---|
| ING (NL), virement en ligne | Absolu (montant/jour) | Client dans l'app, défaut banque | Dans l'app | 4 h après toute hausse, baisse immédiate | Non trouvé | [S] https://radar.avrotros.nl/nieuws/item/klant-van-ing-voortaan-moet-je-vier-uur-wachten-na-het-verhogen-van-je-overboekingslimiet/ |
| Rabobank (NL) | Absolu, max 50 000 €. Défaut baissé de 50 000 à 5 000 € en avril 2023 | Banque (défaut), client (réglage) | Dans l'app | 4 h pour une hausse. Motif : arnaques où l'on pousse le client à relever sa limite | Non trouvé | [P] https://www.rabobank.nl/particulieren/service/online-bankieren/limiet-overboeking-wijzigen ; https://www.rabobank.nl/particulieren/service/online-bankieren/veranderingen-standaardlimiet-overboeking |
| ABN AMRO (NL) | Absolu, max 250 000 €/jour. Achat en ligne carte débit : 500 € défaut, jusqu'à 10 000 € (Mastercard) | Client | Dans l'app, date de fin obligatoire au-dessus de 2 500 € | 4 h, relancé à chaque hausse | Non trouvé | [P] https://abnamro.nl/en/personal/payments/debit-card/change-limit.html ; https://www.abnamro.nl/en/personal/payments/debit-card/limits-faq.html |
| BoursoBank (FR), virement | Absolu et profil du bénéficiaire : 30 000 €/jour instantané, 1 500 € si RIB récemment ajouté | Banque (règle), client (plafonds réglables) | Réglage dans l'app. Contournement : virement SEPA classique | Durée de la période « récente » non trouvée | Non trouvé | [P] https://www.boursobank.com/aide-en-ligne/banque/virement/virement-instantane/question/comment-effectuer-un-virement-instantane-47477150 ; [S] https://banque.meilleurtaux.com/frais-bancaires/actualites/2024-juillet/boursobank-virement-instantane-passe-vitesse-superieure.html |
| BoursoBank, carte | Absolu par carte (paiement, retrait), sur 30 jours | Client, dans les bornes de la carte | Menu Cartes, Plafonds | Non trouvé | Non trouvé | [V] https://www.detective-banque.fr/banque/boursorama-banque/plafond-boursorama/ |
| Revolut | Absolu : plafond de sortie « protection des avoirs » et plafond mensuel par carte | Client | Au-delà du plafond : authentification biométrique | Se renouvelle toutes les 24 h | Non trouvé. Page officielle illisible (403), résumé via recherche | [P] https://help.revolut.com/fr-FR/help/security-logging-in/question-what-are-wealth-protection-limits/ |
| Monzo (UK) | Absolu, 10 000 £/jour par défaut selon tiers | Banque, relèvement sur demande | Chat dans l'app | « 1 jour ouvré » cité par un agent, jusqu'à 24 h rapportées | Plaintes de clients sur forum (anecdotique) | [V] https://community.monzo.com/t/faster-payment-limit/73573 |
| NatWest (UK) | Absolu, 1 000 £ pour nouveau bénéficiaire | Banque | Après ajout à la liste de confiance | Non trouvé | Non trouvé | [V] https://developer.banked.com/merchant/faqs/payment-limits |
| Binance | Palier KYC (absolu en BTC), puis niveau VIP | Binance | Vérification complète, volume de trading | Remise à zéro quotidienne (00:00 selon annonce 2021) | Non trouvé | [S] https://cointelegraph.com/news/binance-cuts-withdrawal-limits-rolls-out-tax-reporting-tool ; https://www.theblock.co/linked/112664/security (chiffres 2021, possiblement obsolètes) |
| Kraken | Palier de vérification : moins de 100 000 $/mois (cash), ou plus avec le niveau « limites élevées » | Kraken | Passer au niveau supérieur | Non trouvé | Non trouvé | [P] https://support.kraken.com/hc/en-us/articles/360001395743-Verification-levels-explained |
| Coinbase (compte) | Profil : vérification, ancienneté, historique, moyen de paiement | Coinbase | Vérification, historique propre, demande au support | Non trouvé | Non trouvé. Chiffres seulement sur blogs douteux, non retenus | [V] https://contra.com/community/CydIZ5Ap-how-to-increase-coinbase-sending-and |
| Coinbase Vault | Pas de plafond trouvé. Délai plutôt que montant | Utilisateur (approbateurs) | Approbation d'un tiers désigné | Retrait annulé si non approuvé sous 24 h (aide actuelle). Fenêtre d'annulation 48 h (page produit et lancement 2014, possiblement ancien) | Non trouvé | [P] https://help.coinbase.com/en/coinbase/getting-started/other/vaults-faq ; https://www.coinbase.com/vault ; [S] https://techcrunch.com/2014/07/02/coinbase-vault/ |
| SwissBorg | Aucun palier de montant trouvé. Verrou de retrait optionnel de 1 à 90 jours (février 2026). Accès aux paliers lié au blocage de BORG | Utilisateur (verrou) | Non trouvé | Choisi par l'utilisateur | Non trouvé | [S] https://coinbureau.com/review/swissborg-chsb |
| Argent (marque Ready selon une seule source) | Limite quotidienne absolue contractuelle, gardiens | Utilisateur | Approbation des gardiens (montant par défaut non trouvé) | Non trouvé | Non trouvé | [S] https://forum.safe.global/t/is-there-an-example-of-a-wallet-using-daily-limits-yet/3769 ; https://tech.eu/2018/11/20/london-based-argent-raises-4-million-for-its-smart-cryptocurency-wallet/ |
| Bitkey | Absolu quotidien, signé par clé mobile et serveur. Modification via la clé matérielle | Utilisateur | Appareil matériel | Réinitialisation à 3 h locale. Plafond de 200 $/jour sans matériel (anecdote, version ancienne) | Non trouvé | [P] https://support.bitkey.world/hc/en-us/articles/18800126247060 (lecture 403, via recherche) |
| Casa | Pas de plafond de dépense trouvé. Politique de clés 2 sur 3 ou 3 sur 5 | Utilisateur | Sans objet | Sans objet | Non trouvé | [P] https://support.casa.io/knowledge/casa-membership-levels-an-overview |
| Ledger | Pas de plafond natif trouvé. Recovery Key = sauvegarde, pas un contrôle de dépense | Sans objet | Sans objet | Sans objet | Non trouvé | [P] https://www.ledger.com/academy/what-is-ledger-recovery-key |
| Safe (module d'allocation) | Absolu par jeton et par période (unique, jour, semaine, mois) pour un délégué | Propriétaires du coffre | Modification ou retrait par les propriétaires | Non trouvé | Sans objet | [P] https://help.safe.global/en/articles/40842-set-up-and-use-spending-limits |
| Squads (Solana) | Absolu par période, sans approbation multisig dans la limite | Membres | Transaction de configuration | Time locks disponibles | Sans objet | [P] https://docs.squads.so/main/development/typescript/instructions/controlled-multisig-instructions/add-spending-limit |
| Carte sans contact (FR) | Absolu : 50 € par opération, cumul fixé par chaque banque (en général 70 à 150 €), puis code | Réglementation et banque | Non | Sans objet | Non trouvé | [P] https://www.assemblee-nationale.fr/dyn/15/questions/QANR5L15QE41409.pdf |

## Cadre réglementaire et anti-fraude

| Cadre | Contenu | Source |
|---|---|---|
| RTS 2018/389 (PSD2), analyse de risque de transaction | Exemption d'authentification forte si le taux de fraude du PSP reste sous un taux de référence, par tranche de montant jusqu'à 500 €. Fenêtre glissante de 90 jours. Chaque PSP est jugé sur son propre taux. Valeurs exactes des taux de référence non vérifiées (page EUR-Lex vide à la lecture) | [S] https://eba.europa.eu/single-rule-book-qa/-/qna/view/publicId/2018_4045 ; https://www.eba.europa.eu/single-rule-book-qa/qna/view/publicId/2018_4034 |
| EBA, clause de revue | Taux de référence jugés peu représentatifs, revue prévue 18 mois après application | [S] mêmes pages EBA |
| PSR/PSD3 (proposition, statut final non confirmé) | Obligation d'offrir au client des limites de dépense et le blocage de moyens de paiement. Délais de réflexion cités pour les changements de limite, expérience néerlandaise jugée positive. Vérification IBAN-nom étendue. Remboursement en cas d'usurpation de la banque | [S] https://www.digiteal.eu/psd3-psr/ ; https://www.dlapiper.com/en/insights/publications/2026/03/psd3-and-psr ; https://www.bindergroesswang.at/en/insights/law-blog/2023/psd3-psr-improvements-in-consumer-protection-fraud-prevention-security-and-increased-transparency |
| Instant Payments Regulation | Vérification du bénéficiaire (VOP) déjà en vigueur pour les virements instantanés en euros | [S] https://www.boursobank.com/aide-en-ligne/banque/virement/generalites/question/qu-est-ce-la-verification-des-beneficiaires-et-de-l-iban-verification-of-payee-et-quand-sera-t-elle-mise-en-place-58004388 |
| Banque de France, OSMP 2025 | Fraude carte en baisse historique, fraude au virement en hausse, fraude par manipulation de l'utilisateur à 516 M€ en 2025 (384 M€ en 2024). Mesure citée : plafond d'usage à 500 € par jour et par commerçant (type de paiement non précisé). 2024 : fraude carte 53 € pour 100 000 €, virement 1 € pour 100 000 € | [P] https://www.banque-france.fr/system/files/2026-09/OSMP_Presentation_du_rapport_annuel_2025.pdf ; [S] https://www.lafinancepourtous.com/2025/09/12/moyens-de-paiement-vigilance-sur-les-risques-de-fraude/ |
| Assureurs | Non trouvé | n/a |
| Recherche publiée | arXiv 1710.07709 : faux positifs en détection de fraude carte (précision de 0,1166 à 0,41). Ne traite pas les limites adaptatives. Aucun article sur plafonds adaptatifs ou vélocité relative au profil trouvé | [S] https://arxiv.org/pdf/1710.07709 |
| Industrie, refus à tort | Stripe : les limites protègent mais frustrent l'achat légitime élevé. Checkout.com : seuils dynamiques selon l'historique, vérification renforcée plutôt que refus sec. Fiserv : 20 % des porteurs cesseraient d'utiliser leur carte après plus d'un refus à tort en six mois (donnée vendeur) | [V] https://stripe.com/en-at/resources/more/false-declines-explained ; https://support.checkout.com/hc/en-us/articles/32311303862546-How-to-reduce-false-positive-risk-declines ; https://www.paymentsjournal.com/financial-institutions-ease-cardholder-frustration-by-addressing-transaction-false-declines-with-new-fiserv-technology/amp/ |

## Leçons d'ergonomie

1. Le délai vaut mieux qu'un plafond bas. Les banques néerlandaises laissent le client choisir sa limite, mais imposent 4 h avant qu'une hausse prenne effet. Cela casse le scénario du faux conseiller qui presse la victime.
2. Asymétrie : baisse immédiate, hausse différée (Rabobank, ING).
3. Le profil du bénéficiaire est un signal léger et lisible : limite basse pour un RIB neuf, haute ensuite, avec une issue claire (virement SEPA classique chez BoursoBank).
4. Prévoir une sortie de secours : biométrie au-dessus du plafond (Revolut), date de fin obligatoire pour les gros montants (ABN AMRO), approbation d'un tiers (Coinbase Vault, gardiens Argent, clé matérielle Bitkey).
5. Le relèvement par support humain est lent (Monzo : jusqu'à 24 h rapportées) et c'est le canal que les fraudeurs imitent. Préférer un parcours dans l'app.
6. Les paliers de vérification (Kraken, Binance) sont lisibles mais grossiers. Aucun ne s'exprime en pourcentage du solde.
7. Un verrou de retrait choisi par l'utilisateur (SwissBorg 1 à 90 jours, Coinbase Vault 24 à 48 h) protège contre la contrainte physique, au prix de la liquidité.
8. Proportionnel au solde : idée absente du marché trouvé. Un pourcentage s'effondre pour les petits soldes et s'ouvre pour les gros. Une combinaison plancher absolu + pourcentage + délai de hausse reste à tester.
9. Mesurer les faux positifs dès le départ : aucun acteur ne publie de taux de blocages légitimes sur les plafonds (demandes de relèvement, abandons, contacts support).

## Lacunes

- Taux de plaintes ou de faux positifs par acteur : non trouvé.
- Rôle des assureurs : non trouvé.
- Taux de référence exacts du RTS : non vérifiés.
- Durée de « RIB récent » chez BoursoBank, limites par défaut d'Argent, Casa, SwissBorg : non trouvées.
- Binance : chiffres de 2021, à actualiser.
- Statut final de PSR/PSD3 : non confirmé.
