# Métriques de Hold up

Figé le 11 octobre 2026. Ce fichier fait foi pour tout chiffre cité dans le README, la fiche de défense, le deck et le pitch. Chaque ligne dit ce qui a été mesuré, sur quoi, et la commande qui le reproduit. Intervalles de Wilson à 95 %. Un chiffre absent est écrit « non mesuré ».

Deux objets différents ont été mesurés, à ne jamais mélanger :

- **Le moteur de comparaison** : la chaîne côté serveur (moteur d'effets + comparateur), lancée en Node. Ce n'est pas l'extension livrée.
- **L'extension** : le service worker du build livré (`research/titouan/T_banc_e2e/extension_standalone/extension/background.js`), piloté en Node sans navigateur.

## Chiffres clés

| Chiffre | Valeur exacte | Ce que ça mesure | Preuve |
|---|---|---|---|
| **34 %** | 7 103/20 753 = 34,2 % [33,6 ; 34,9] | part d'autorisations de dépense illimitées sur Avalanche C-Chain. Notre mesure, sur un échantillon de blocs : 40 fenêtres de 500 blocs, événements ERC-20 `Approval` non nuls, lecture seule. Des événements, pas des personnes | `research/titouan/Z_approbations/onchain/result_avax.json` |
| **87 %** | 131/150 = 87,3 % [81,1 ; 91,7] | écarts signalés avec la phrase. Moteur de comparaison, jeu aveugle | section 1.1 |
| **65 %** | 97/150 = 64,7 % [56,7 ; 71,9] | écarts signalés sans la phrase, même mesure | section 1.1 |
| **15 %** | 15/100 = 15,0 % [9,3 ; 23,3] | alertes rouges à tort, même mesure. Objectif de 10 % manqué | section 1.1 |

Ces trois derniers chiffres sont ceux du moteur de comparaison, pas de l'extension livrée. Le chiffre scellé de l'extension est en 1.2.

Mesuré aussi, non utilisé dans le discours : Ethereum, 10 420/21 866 = 47,6 % [46,9 ; 48,3] d'autorisations illimitées, 800 blocs isolés (`result_eth.json`, même dossier). Illimité veut dire : valeur au moins égale à 2^255 ou à l'offre totale du jeton. Méthode : `research/titouan/Z_approbations/onchain/Z4_illimite_par_plateforme.md`.

## 1. Efficacité de détection (30 %)

### 1.1 Moteur de comparaison, jeu aveugle

250 cas (150 malveillants, 100 bénins) écrits par un autre auteur, ouverts une seule fois le 11 oct. à 07:10 UTC, aucun réglage après. Preuve : `research/titouan/T_banc_e2e/blind_decalage/run/RESULTAT.md`. Le jeu ne se rejoue pas : il est consommé.

| Métrique | Valeur | Ce que ça mesure |
|---|---|---|
| Écarts signalés, avec la phrase | 131/150 = 87,3 % [81,1 ; 91,7] | malveillants en avertissement ou en rouge, code seul |
| Écarts signalés, sans la phrase | 97/150 = 64,7 % [56,7 ; 71,9] | le plancher de règles seul. Gain de la phrase : +34 cas |
| Malveillants en rouge | 114/150 = 76,0 % [68,6 ; 82,1] | niveau le plus haut seulement |
| Faux rouges | 15/100 = 15,0 % [9,3 ; 23,3] | bénins en rouge. **Objectif de 10 % publié avant l'ouverture : manqué** |
| Faux avertissement ou rouge | 30/100 = 30,0 % [21,9 ; 39,6] | bénins signalés à un niveau quelconque |
| « Pas pu vérifier » | 33/150 malveillants ; 43/100 bénins | décision à trois valeurs du même bras |
| Avec le modèle Clef | 133/150 = 88,7 % ; faux rouges 16/100 = 16,0 % | Clef classe, le code compare |

11 des 15 faux rouges sont des achats de NFT à prix presque nul. Familles faibles : jeton différent 12/19, autre réseau ou domaine 12/18.

### 1.2 Extension, moitié contrôle du panel

2 662 paires phrase / demande, vérité par construction, scellées par empreinte (`5ff2096a9763…`). **Mesure unique faite sur un build qui plantait** (commit `7a5eadc`) : 520/2 662 = 19,5 % [18,1 ; 21,1] des demandes levaient une exception. Preuve : `preuves/CHIFFRES_TRACES.md`, section 1. Commande : `node --no-warnings preuves/banc.mjs --mesurer-malgre-panne`, sur ce commit.

| Métrique | Sans modèle (mots-clés) | Avec Clef |
|---|---|---|
| Non conformes attrapés | 866/1 752 = 49,4 % [47,1 ; 51,8] | 997/1 752 = 56,9 % [54,6 ; 59,2] |
| Non conformes ratés (« ça correspond ») | 47/1 752 = 2,7 % [2,0 ; 3,5] | 64/1 752 = 3,7 % [2,9 ; 4,6] |
| Non conformes laissés « pas pu vérifier » | 547/1 752 = 31,2 % [29,1 ; 33,4] | 399/1 752 = 22,8 % [20,9 ; 24,8] |
| Non conformes en panne | 292/1 752 = 16,7 % [15,0 ; 18,5] | 292/1 752 = 16,7 % |
| Fausses alertes sur conformes | 44/539 = 8,2 % [6,1 ; 10,8] | 85/539 = 15,8 % [12,9 ; 19,1] |
| Conformes reconnus (« ça correspond ») | 142/539 = 26,3 % [22,8 ; 30,2] | 197/539 = 36,5 % |
| Conformes laissés « pas pu vérifier » | 197/539 = 36,5 % [32,6 ; 40,7] | 101/539 = 18,7 % [15,7 ; 22,2] |
| Précision des alertes (2/3 de non conformes dans le panel) | 866/910 = 95,2 % [93,6 ; 96,4] | 997/1 082 = 92,1 % [90,4 ; 93,6] |
| **Extension corrigée (commit `b42792d` ou suivant), réserve scellée de 2 673 paires** | **à mesurer** | **à mesurer** |

La panne est corrigée depuis (commit `b42792d`). Le contrôle est consommé : ses erreurs sont publiées. La réserve (empreinte `8531e6119af0…`) n'a jamais été ouverte. Elle sert à une seule mesure : `node --env-file=.env --no-warnings preuves/banc.mjs --ouvrir-reserve`.

À titre indicatif seulement (moitié réglage, état non commité du 11 oct. 07:58 UTC, sans modèle, après correction de la panne) : attrapé 1 597/2 370 = 67,4 %, raté 173/2 370 = 7,3 %, fausses alertes 109/702 = 15,5 %. Ce n'est pas un contrôle.

### 1.3 Temps de détection

| Métrique | Valeur | Ce que ça mesure | Preuve |
|---|---|---|---|
| Verdict local de l'extension | p50 2,0 ms ; p95 13,0 ms (n = 2 662) | code de décision sous Node, hors réseau, sans fenêtre | `preuves/CHIFFRES_TRACES.md` 1.5 |
| Verdict avec appel réel à Clef | p50 387 ms ; p95 1 436 ms (n = 2 101) | même code + appel au modèle par le relais | idem |
| Appels hors budget du relais (1 500 ms) | 96/2 101 = 4,6 % | ces phrases retombent sur les mots-clés | idem |
| Coût du modèle | 689 jetons d'entrée par phrase (p50), environ 0,000026 $ | prix public de `clef-flash` | idem |
| Demande du site → verdict affiché, dans un vrai navigateur | **non mesuré** de façon reproductible | un audit a observé une fenêtre ouverte 325 à 345 ms après le clic et un verdict environ 400 ms après Entrée (1,1 s avec Clef), dans Chromium avec un portefeuille simulé ; pilote hors dépôt, nombre d'essais non publié | `coord/reports/AUDIT_APPLICATION_FINIE.md` |

Le temps réel d'une décision est dominé par la personne qui écrit sa phrase. Ce temps n'est pas mesuré.

## 2. Qualité de la réponse (20 %)

| Élément | État | Preuve ou commande |
|---|---|---|
| Automatique : alerte d'une ligne (ce qui est écrit, ce que la demande donne), Annuler visible | fait | `livrables/PLAYBOOK_REPONSE.md` 2 |
| Automatique : droit plus large ramené au montant écrit (transaction, une seule somme lisible, jeton connu) | fait ; vu dans Chromium avec portefeuille simulé au commit `5602248`, jetons déclarés à la main | audit, section (b) |
| Automatique : ligne de journal pour chaque verdict et chaque décision | fait | `extension/journal_chain.js` |
| Humain : écrire la phrase, puis un geste (Annuler ou Continuer) | fait | |
| Humain : révoquer un droit déjà donné | bouton branché dans le panneau latéral, tests en Node, aucun essai dans un vrai Chrome | README, Limites |
| Signature (Permit) : le droit ne peut pas être limité | Hold up alerte et le dit, rien de plus | |
| Effet sur la scène « site honnête piraté plus tard » | sans Hold up, le compte passe de 50 à 0 après l'échange ; avec le droit ramené à 50, le pirate prend 0. Rejoué le 11 oct. sur une copie propre du dépôt : chaîne locale vide, puis copie locale d'Avalanche (`--fork`), 13 contrôles passés chaque fois. Le script rejoue le geste de l'extension (même `approve`, montant limité), il ne pilote pas l'extension | `node scripts/demo.mjs --fork`, puis dans un autre terminal `node research/demo_reelle/site_echange/test/preuve_piratage.mjs` |
| Temps de réponse automatique | celui du verdict (1.3) | |
| Temps de réponse humain | **non mesuré** : aucun essai avec des personnes | |
| Alerte poussée vers un tiers (équipe fraude, SIEM) | non fait | playbook 4 |

## 3. Faisabilité et intégration (20 %)

| Élément | État | Preuve ou commande |
|---|---|---|
| Lancement | 2 commandes après le clone : `node scripts/verifier_installation.mjs`, puis `node scripts/demo.mjs` (qui lance `npm install` dans `blockchain/` s'il manque). Ensuite, charger l'extension à la main. Relancée pour ce gel sur une copie propre, sur d'autres ports : chaîne, contrats, sites et console d'attaque démarrent ; l'extension n'a pas été chargée dans un navigateur à cette occasion | README, `livrables/INSTALLATION.md` |
| Ce qui tourne | chaîne locale, contrats de démo, site d'échange, relais du modèle, console d'attaque simulée, extension MV3 Chrome ou Edge 114+ | `scripts/demo.mjs` |
| Tests du code | `npm run verifier`. À remplir après la fusion : N tests, 0 échec. Ces tests valident le code, pas la détection | `scripts/verifier_installation.mjs` |
| Audit d'un clone neuf, commit `5602248`, 09h05 à 09h30 | verdict « non terminée » : parcours honnête en « pas pu vérifier » et piège non limité tant que les jetons de démo ne sont pas déclarés à la main. Corrections annoncées depuis (`b42792d` : lecture du jeton sur la chaîne), **non réauditées sur un clone neuf** | `coord/reports/AUDIT_APPLICATION_FINIE.md` |
| Vrai portefeuille (MetaMask, Core, Rabby) | **jamais essayé** | |
| Réseau public | **rien**. Déploiement Fuji préparé et répété sur une copie locale, non exécuté (D-016) | `blockchain/FUJI.md` |
| Intégration à un outil de banque ou de fintech | **non fait** : export JSON du journal, pas de connecteur | |
| Mobile, Ledger branché directement | hors périmètre | |

## 4. Conformité et explicabilité (15 %)

| Élément | État | Commande |
|---|---|---|
| Ce qui est tracé (extension) | une ligne datée par verdict et par décision, chaînée par sha256, 500 lignes, sans la phrase ni adresse en clair | export JSON depuis le panneau latéral |
| Vérifier qu'un journal exporté n'a pas été modifié | ligne changée, retirée ou déplacée au milieu : détectée | `node research/titouan/T_banc_e2e/extension/tools/verify_journal.mjs export.json` |
| Rejouer une décision et retrouver la règle (journal de la version serveur, pas de l'extension) | même niveau, même fiche, mêmes codes de règle, avec fichier et ligne | `cd research/demo_reelle/audit && node make_sample_journal.mjs && node verify_decision.mjs --journal sample/journal.jsonl --seq 1 --request sample/requests/01-permit-fake-reward.json --context sample/context.json --selftest` |
| Réécriture complète du journal, dernières lignes retirées | **non détecté** : pas d'ancrage externe (D-017) | |
| Rejeu à partir du journal seul | **impossible** : il ne garde qu'une empreinte des paramètres ; la version des règles n'est pas écrite dans la ligne | `livrables/EXPLICABILITE.md` 3 |
| Référentiels | NIST CSF 2.0 Detect et Respond, ATT&CK ; aucune conformité déclarée | `livrables/MAPPING_REFERENTIELS.md` |
| Où va la phrase | du navigateur au relais local, puis au modèle hébergé si le relais a une clé. Durée de conservation chez le fournisseur : non rédigée | README |

## 5. Comment ces chiffres ont été obtenus

1. Unité testée : une paire, soit une phrase et une demande d'un site au portefeuille. Réponses : alerte, « ça correspond », « pas pu vérifier ». Une panne est comptée à part.
2. Vérité du panel : par construction. La demande et la phrase sont fabriquées à partir de deux structures ; un second décodeur relit chaque demande (0 écart).
3. Vérité du jeu aveugle : par étiquette d'un autre auteur (malveillant ou bénin).
4. Le panel de 8 896 paires est coupé en trois par tirage fixe : réglage 3 561, contrôle 2 662, réserve 2 673.
5. Le réglage se regarde librement. Le contrôle et la réserve sont scellés par empreinte SHA-256 avant toute mesure.
6. Une seule ouverture par jeu scellé. Chaque ouverture est écrite dans `preuves/panel/OUVERTURES.log` avec l'empreinte du code.
7. Chaque résultat porte le commit, l'empreinte du code mesuré et celle du jeu (`preuves/REGISTRE.json`).
8. Le modèle est `clef-flash`, une seule passe ; ses réponses sont en cache, le banc se rejoue sans clé.
9. Ce qui a mal tourné : le contrôle a été ouvert sur un build en panne (`const` réaffecté dans le moteur embarqué). Le résultat est publié tel quel. Le banc refuse maintenant de mesurer un moteur qui lève une exception.
10. Suite : une mesure finale sur la réserve, une fois le code gelé. Détail : `preuves/PROTOCOLE.md`.

## 6. Ce que ces chiffres ne prouvent pas

- Rien sur un vrai portefeuille, ni sur un réseau public. Aucune paire n'est exécutée sur une chaîne.
- Les phrases de test sont écrites par des agents, pas par de vrais utilisateurs. Sur des phrases humaines, attendre moins de détection et plus de « pas pu vérifier ».
- Les jeux sont conçus par la même équipe que le produit. L'auteur du jeu aveugle est une IA de la même famille que celle qui a aidé à écrire le produit.
- Le 87,3 % est celui du moteur de comparaison. L'extension n'a pas été mesurée sur le jeu aveugle. Sa seule mesure scellée est le 49,4 % du build en panne.
- La vérification n'est pas exhaustive. Non comparés à la phrase : la durée d'un droit, le bénéficiaire d'un droit, le minimum reçu d'un échange, les opérations récurrentes, les frais (`preuves/exhaustivite/EXHAUSTIVITE_INTENTION.md`, `preuves/CE_QUI_NE_MARCHE_PAS.md`).
- Hold up ne reconnaît pas un contrat malveillant. Il borne ce qu'on lui laisse.
- La part de non conformes dans les jeux (60 % dans le jeu aveugle, environ deux tiers dans le panel) est sans rapport avec l'usage réel : la précision et la charge d'alertes réelles ne s'en déduisent pas.
- Aucune comparaison avec un portefeuille du commerce n'a été faite.
- Les lignes A5, A11 et A12 de `livrables/CHIFFRES.md` ne valent pas pour l'extension. La ligne A6 est à jour, mais elle ne dit pas que le chiffre est celui du moteur de comparaison (`preuves/ECARTS_LIVRABLES.md`).
