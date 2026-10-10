# D3 — Cas réels : fraude au faux fournisseur et agents IA (relevé du 2026-10-10)

Légende :
- [V] : source primaire, ou plusieurs sources de référence concordantes.
- [S] : une seule source secondaire.
- [?] : non trouvé.

Les jugements n'ont pas été lus en PDF. Revérifier chaque chiffre avant le deck.

## Cas de référence pour la démo
| Cas | Ce qui s'est passé | Contrôle qui a échoué | Source |
|---|---|---|---|
| **Rimasauskas, Google + Facebook, ~121 M$ (2013-2015)** [V] | Société lettone **homonyme** d'un vrai fournisseur asiatique ; comptes ouverts **au nom correct** ; fausses factures envoyées depuis des domaines sosies | Aucune vérification hors bande. Le nom correspondait, donc **VoP aurait dit « match »** | https://www.justice.gov/usao-sdny/pr/lithuanian-man-sentenced-5-years-prison-theft-over-120-million-fraudulent-business |
| **Norfund, 10 M$ (mars 2020)** [V] | Messagerie surveillée pendant des mois ; échanges falsifiés ; prêt versé sur un compte au Mexique au **même nom** que l'emprunteur cambodgien | Aucun contrôle de la provenance du changement de coordonnées | https://www.norfund.no/wp-content/uploads/2020/05/Press-release-13052020.pdf |
| **Armateur grec, 4 M€ (2025)** [S] | Échanges avec la banque compromis ; fausses instructions envoyées depuis une adresse sosie | Récupéré à 100 % grâce au gel rapide (banques + Europol) : **le temps de réponse est décisif** | https://www.marineinsight.com/greek-police-recover-e4-million-stolen-from-shipping-company-in-business-email-compromise-scam/ |
| **Pärnu (Estonie), 1,6 M€** [S] | « Payez les futures factures sur un autre compte » | Changement de RIB accepté sur un simple e-mail | https://news.err.ee/1610001925/parnu-county-company-loses-over-1-6-million-to-invoice-fraud |
| **Orion S.A., ~60 M$ (août 2024)** [V, 8-K] | Virements « frauduleusement induits » | Mécanisme non publié | https://www.infosecurity-magazine.com/news/manufacturing-loses-60m-bec/ |
| **Address poisoning WBTC, 68 M$ (mai 2024)** [V] | Adresse sosie déposée dans l'historique de la victime, puis copiée par elle | Aucun contrôle de **l'origine** de l'adresse | https://cointelegraph.com/news/wbtc-address-poisoner-all-funds-negotiations |
| **Address poisoning USDT, 50 M$ (déc. 2025)** [V] | Envoi test de 50 USDT vers la bonne adresse, puis envoi principal 26 min plus tard vers la sosie | **L'envoi test ne protège pas** | https://www.theblock.co/post/383423/crypto-trader-loses-50-million-in-address-poisoning-attack-offers-1-million-bounty-for-return |

Hors périmètre fournisseur : **Ubiquiti** (46,7 M$) et **Pathé** (19 M€) sont des fraudes au faux dirigeant. À citer comme telles.

## Droit français : qui paie ? [V]
- **Cass. com., 17 juin 2026** : l'usurpateur n'est pas un « créancier apparent ». Le débiteur qui a payé sur le faux RIB **doit payer une seconde fois**. https://kohenavocats.fr/2026/07/02/fraude-rib-creancier-apparent-com-17-juin-2026/
- **TJ Lille, 14 oct. 2025** : la banque et le fournisseur de messagerie sont condamnés in solidum.
- **Mobius v Inoteq** (Australie) : un contre-appel jugé insuffisant engage la responsabilité du payeur.

## Agents IA : réel ou démonstration
| Cas | Nature | Leçon |
|---|---|---|
| **Freysa** (nov. 2024, ~47 k$) [V] | Jeu public | La sémantique de l'outil `approveTransfer` a été redéfinie par le prompt. **Seul un contrôle hors LLM tient** |
| **AIXBT** (mars 2025, ~106 k$) [V] | Incident réel, mais par le dashboard et non par l'IA | Le canal de commande de l'agent est une surface d'attaque |
| **Grok × Bankrbot** (mai 2026, 150 à 200 k$) [V, montant S] | Incident réel : injection d'agent à agent, en morse | Bankrbot a exécuté sans contrôle. **On ne dit plus « 215 k$ »** |
| **Bankr, 20 mai 2026** (14 portefeuilles, ~440 k$) [S] | Incident réel, cause non confirmée | — |
| **Princeton, fausses mémoires sur ElizaOS** (arXiv 2503.16248) [V] | Recherche | Une mémoire empoisonnée détourne de façon persistante un futur transfert légitime |
| **Zscaler ThreatLabz** (juil. 2026) [V] | Campagne réelle sur le web, paiement testé seulement en bac à sable | 4 modèles sur 26 ont payé |
| **Agent AP réel piégé par une facture** | **Aucun cas trouvé** [?] | À présenter comme une **menace plausible**, jamais comme un fait |

## Comment ça se passe en vrai dans un service comptes fournisseurs
1. **Fiche fournisseur** : une personne modifie l'IBAN, une **autre** valide (quatre yeux). Le changement est journalisé, et le premier paiement après changement est souvent surveillé.
2. **Callback** : on rappelle le fournisseur sur un numéro **déjà connu**, jamais celui de l'e-mail (Bpifrance, DGFiP). Contrôle humain, qui se dégrade avec le volume.
3. **Rapprochement à trois voies** (bon de commande, réception, facture) : **il ne vérifie pas l'IBAN**. Une vraie facture dont seul l'IBAN a changé passe.
4. **VoP** (UE, depuis le 9 oct. 2025) : réponses match, close match ou no match. **Le payeur peut passer outre**, et les entreprises peuvent y **renoncer** pour les paiements en masse. VoP vérifie le nom, pas qui contrôle le compte.
   - https://www.ecb.europa.eu/paym/retail/instant_payments/html/instant_payments_regulation.so.html

## Agents AP sur le marché
| Éditeur | Qui libère les fonds | Garde-fous publiés | Source |
|---|---|---|---|
| **Ramp** | Paie seul par carte ; paiement automatique des factures QuickBooks | Plus de 60 signaux de fraude ; rien sur les changements d'IBAN | https://ramp.com/blog/ramp-ap-agents-announcement |
| **Coupa** | Humain (l'agent prépare 2 395 paiements, 20,1 M$) | — | https://pymnts.com/news/artificial-intelligence/2026/one-ai-agent-2395-payments-still-no-final-say/ |
| **SAP Joule, Stampli** | Humain | Supervision humaine | — |
| **Basware** | — | « Policy engine » et « autonomy gates » avant chaque action | — |
| **Request Finance** (crypto) | Signature humaine dans le portefeuille | L'adresse vient de la facture : **surface de substitution directe** | — |

Aucun éditeur ne publie de contrôle sur **le changement d'IBAN ou d'adresse fait par l'agent**, ni sur l'injection de prompt dans les documents. C'est une absence de publication, pas une preuve d'absence.

## À ne pas affirmer
- Bankr à 215 k$.
- Le mécanisme de Toyota Boshoku.
- Un cas français nommé.
- Un agent AP réel piégé.
- Un cas B2B en stablecoin.
- Le FNC-RF.
- Le chiffre OSMP de 183 M€.
