# Hold up (brouillon de README jury)

Statut : brouillon du 11 oct. 2026, repositionné selon la décision D-009 (`coord/DECISIONS.md`), écrit à partir des fichiers de mesure du repo. Les chemins sont relatifs à la racine du repo. Tout chiffre est suivi de sa source. Ce qui n'est pas mesuré est dit "non mesuré". Aucune promesse de résultat.

## 1. Problème

Un particulier qui signe dans son portefeuille voit des octets, pas des conséquences. Un faux support ou un faux concours lui fait signer un droit de dépense (approve, permit) alors qu'elle croit faire autre chose. Elle croit faire une chose simple. La transaction en fait une autre.

**MetaMask te prévient de ce qu'il reconnaît. Hold up vérifie ce que tu voulais faire.**

La personne écrit son intention. Hold up décode l'effet réel de la demande et compare les deux. La réponse est binaire : « ça correspond » ou « ça ne correspond pas », avec une ligne. S'ils ne correspondent pas, elle avertit en reprenant ses mots ("tu as dit X, ça fait Y") et elle ralentit la décision. Elle garde une preuve rejouable et ancrée de ce qui a été montré. Elle ne retire jamais le choix à l'utilisateur.

Scène type : une demande qu'un portefeuille juge banale mais qui ne correspond pas à l'intention écrite. Exemple : « échanger 50 USDC » qui donne en réalité un droit illimité sur tout le solde.

### 1.1 Ce que MetaMask fait déjà

On ne refait pas ce travail. Hold up ne présente pas ces points comme son apport.

| MetaMask fait déjà | Source |
|---|---|
| Alertes de sécurité sur les transactions et sur les demandes de signature, via Blockaid et d'autres fournisseurs, avec des niveaux Avertissement et Malveillant | Page d'aide MetaMask, lue le 11 oct. 2026 : https://support.metamask.io/configure/wallet/security-alerts/ |
| Activées par défaut dans l'extension et sur mobile (impossibles à couper pour les comptes créés par Google, Apple ou Telegram) | Même page |
| Avalanche figure dans la liste des réseaux couverts | Même page |
| Avertissement sur une adresse récemment déployée ou mal connue | Même page |
| Alerte d'empoisonnement d'adresse avec comparaison des deux adresses, en ligne depuis le 17 juin 2026 ; avertissement sur un envoi vers une adresse jamais vue ; Permit affiché en clair depuis la v12.2 | Constaté par Adem dans son MetaMask et rapporté dans `coord/INBOX.md` MSG-060 et MSG-061. **Ces trois points ne figurent pas sur la page d'aide lue : à vérifier dans les notes de version** |

Ce que la page ne dit pas : Avalanche Fuji et les chaînes locales ne figurent pas dans la liste des réseaux couverts (omis, pas déclarés exclus). La page ajoute que le signalement d'une alerte n'existe que pour les alertes de transaction.

**Garde-fou de langage.** Sur notre démo (Fuji ou chaîne locale), le silence de MetaMask ne prouve rien. On n'écrit jamais « MetaMask ne le voit pas » sans preuve.

### 1.2 Ce que Hold up ajoute

1. **Intention contre effet.** L'utilisateur écrit ce qu'il veut faire. Le moteur décode l'effet réel. Le comparateur dit « correspond » ou « ne correspond pas » et donne une ligne. Un portefeuille n'a pas cette information : il juge la demande seule.
2. **Un délai.** Plus l'écart est grand, plus la retenue est longue. Annuler reste toujours visible.
3. **Une preuve rejouable et ancrée.** Journal chaîné par hachage, version des règles, rejeu par le banc. L'ancrage sur chaîne est en cours (voir 3.1).

Ces trois points sont décrits, pas tous mesurés. Voir « Ce qui n'est pas mesuré » en section 5.

## 2. Cible

- Le particulier crypto qui utilise une extension de portefeuille dans un navigateur de bureau (Chrome, Edge). Source du cadrage : `docs/intent-barrier.md`.
- Le mobile n'est pas couvert directement. Il peut l'être seulement via les portefeuilles eux-mêmes (module intégré par l'éditeur du portefeuille, ou Snap). Voir les limites, section 6, et `research/titouan/U_segment/U5a_extensions_mobile.md`, `U5b_signature_mobile.md`.
- Chaîne de démonstration : Avalanche Fuji (43113). Les données de couverture viennent surtout d'Ethereum (voir limites).
- Business : gratuit au départ, partenaires ensuite. Ce point est volontairement mis en parenthèse. Aucun modèle économique abouti n'est présenté.

## 3. Architecture

```
  Site web (dApp)
       |  window.ethereum / EIP-6963
       v
  [1 INTERCEPTION]  extension MV3 : enveloppe le fournisseur, retient la requête
       |            (extension/inject.js, bridge.js, background.js)
       v
  [2 INTENTION]     la personne dit en mots simples ce qu'elle veut faire
       |            (+ message collé, + 2 à 4 questions seulement si risque)
       v
  [3 MOTEUR D'EFFETS]  décode calldata et données typées (EIP-712),
       |               calcule : sorties, entrées, droits accordés, contrôle
       |               (engine/src/*.mjs)
       v
  [4 COMPARATEUR]   intention contre effets (engine/vendor/compare.ts)
       |            + règles supplémentaires (engine/src/rules_extra.mjs)
       v
  [5 POLITIQUE]     plancher objectif, jamais abaissé par l'intention
       |            (run/policy.mjs)
       v
  [6 VERDICT]       ok / warn / critical + phrases FR "tu as dit / ça fait"
       v
  [7 FRICTION]      délai, phrase à retaper, retenue configurable,
       |            "Annuler" toujours visible ; l'utilisateur peut passer outre
       v
  [8 JOURNAL]       ligne chaînée par hachage (sha256), sans texte libre
                    ancrage de la racine sur Fuji : EN COURS (voir 3.1)
```

Principes de conception :
- Le comparateur final est du code. Un modèle (optionnel) comprend une phrase ou classe un message collé. Il ne peut qu'aggraver un verdict, jamais le baisser (`research/titouan/O_barriere_intention.md`, position 1).
- Un échec, un délai ou une API absente donne "Non vérifié", jamais un feu vert (`research/titouan/T_banc_e2e/extension/COMPAT.md`).
- Le serveur écoute sur 127.0.0.1 uniquement. Pas de réseau sortant dans la version autonome prévue.

### 3.1 État réel des briques (à la rédaction)

| Brique | État | Source |
|---|---|---|
| Moteur d'effets, 447 tests unitaires | fait, 447/447 rejoués le 11 oct. | `research/titouan/T_banc_e2e/engine/test/` |
| Serveur local `/check`, journal chaîné par hachage, vérificateur | fait, 33/33 tests rejoués le 11 oct. Tests de présentation : 30/31 (le test 7a échoue : 7 codes de raison récents sans texte) | `research/titouan/T_banc_e2e/server/` |
| Extension MV3 (Chrome, Edge) avec portefeuille simulé | batterie de 66 tests : 64 PASS, 2 LIMITE (état d'avant les changements d'Adem : fenêtre de verdict séparée, retenue persistante, commit e0a89a7, non rejoués ici) | `research/titouan/T_banc_e2e/extension/COMPAT.md`, `coord/INBOX.md` MSG-056, MSG-057 |
| Extension autonome (moteur embarqué, sans réseau) | construite par Adem (fichiers générés présents) ; équivalence avec le serveur annoncée, non vérifiée ici | `research/titouan/T_banc_e2e/extension_standalone/`, `coord/INBOX.md` MSG-058 |
| Journal ancré : racine de Merkle, preuves, vérificateur | 42 vérifications OK. Contrat compilé et déployé sur un nœud local par Adem (`npm run anchor:local`). Pas compilé chez nous. Rejeu dans `coord/reports/critere_reponse.md`, non rejoué ici | `research/titouan/T_banc_e2e/anchor/ANCHOR_README.md`, `coord/INBOX.md` MSG-058 |
| Contrats déployés sur Fuji | aucun listé : `blockchain/DEPLOYMENTS.md` ne contient que l'en-tête. Le déployeur n'avait pas d'AVAX de test (MSG-057) | `blockchain/DEPLOYMENTS.md` |
| Démo réelle (décision D-009, qui remplace la partie « deux portes » de D-008) | un moteur et l'extension, réplique locale de la chaîne, vrai portefeuille. Le RPC de garde reste un prototype dans le dépôt. Il n'est plus présenté comme une seconde porte | `coord/DECISIONS.md` D-009 ; `coord/INBOX.md` MSG-056 à MSG-061 |
| Essai avec un vrai MetaMask | un envoi réel depuis le MetaMask d'Adem est passé par le RPC de garde sur la chaîne locale (MSG-060). Rien sur Fuji ; protocole écrit, non joué | `research/titouan/T_banc_e2e/essai_reel/ESSAI_REEL_METAMASK.md` ; `coord/INBOX.md` MSG-060 |

## 4. Installation

Prérequis : Node 22 ou plus (24 utilisé ici), Chrome ou Edge. Aucun `npm install` n'est nécessaire : le moteur et le serveur n'ont aucune dépendance.

Les guides `research/titouan/T_banc_e2e/INSTALL_FR.md` et `INSTALL_STANDALONE_FR.md` existent maintenant. Ils font foi. Les étapes ci-dessous viennent des scripts du repo et n'ont pas été relues contre ces guides.

### 4.1 Version avec serveur local

1. Démarrer le serveur (PowerShell, depuis `research/titouan/T_banc_e2e/`) :
   `powershell -File server\start.ps1`
   Il écoute sur `http://127.0.0.1:8787`. Option `--no-journal` pour désactiver le journal. Contrôle : `GET /health`.
2. Préparer le dossier de l'extension :
   `powershell -ExecutionPolicy Bypass -File server\package.ps1`
   Cela crée `dist\hold-up-extension` et `dist\hold-up-extension.zip` (sans tests, sans faux moteur).
3. Dans Chrome ou Edge : `chrome://extensions`, activer le mode développeur, "Charger l'extension non empaquetée", choisir `dist\hold-up-extension`.
4. Vérifier le journal à tout moment :
   `node server/server.mjs --verify-journal` affiche "journal OK" ou la ligne où la chaîne est cassée.

### 4.2 Version autonome

Moteur embarqué dans l'extension, aucun serveur, aucun réseau sortant. Code source : `research/titouan/T_banc_e2e/extension_standalone/src/` (le fichier du noyau garde l'ancien nom, `sentinelle_core.js`). Guide : `INSTALL_STANDALONE_FR.md`. Équivalence verdict par verdict avec la voie de référence : annoncée par Adem (`coord/INBOX.md` MSG-058), non vérifiée par l'auteur de ce brouillon.

### 4.3 Réglages de test

Le mode automatique (`testMode` + `auto`) n'existe que pour les tests et doit être retiré du build de production (`extension/COMPAT.md`).

## 5. Mesures : ce qu'elles disent, en deux colonnes séparées

Les deux colonnes ne se mélangent jamais. Détail, statut et réserves de chaque chiffre : `RESULTATS_A_JOUR.md`. Chemins sous `research/titouan/T_banc_e2e/` sauf mention.

**Colonne synthétique** (cas écrits par nous ou par des agents, jamais du trafic réel) :
- **V2_DEV (5 927 cas), état final des règles, SYNTHÉTIQUE ET RÉGLÉ.** Attaques attrapées (warn ou critical) : 99,7 % [99,5 ; 99,9] (2922/2930). Rappel critical : 95,1 %. Fausses alertes critical : 1,0 % [0,7 ; 1,6] (20/1976). Warn ou critical brut sur bénins : 19,2 %. Plancher seul (sans intention) : 98,9 % attrapées, 0,0 % de fausses alertes critical, 14,7 % brut. Source : `run/out/v2/MESURE_FINAL.md`. **Ces règles ont été ajustées sur ce jeu. Ce n'est pas un test indépendant.** Le test indépendant est V2_TEST (2 498 cas), ouvert une seule fois, à la fin. Il n'est pas encore ouvert.
- Fixtures publiques (144, dont 134 exécutables) : 95,4 % attrapées (62/65). Fausses alertes critical 7,5 % avant les correctifs de la boucle V2, 1,5 % après. Sources : `attacks_public/out/MESURE_001.md` (état d'avant), `run/out/JOURNAL.md` (état final).
- **Mesure « conditions produit ».** Le banc donne aux règles un contexte que le produit n'a pas. On le retire. Bras « intention produit » (l'intention est réduite à ce que le produit sait exprimer), tous jeux confondus, 3 254 malveillants et 2 136 bénins :

| | Banc complet | Produit, réglage par défaut | Avec carnet et historique saisis | Avec liste statique livrée (borne haute) |
|---|---|---|---|---|
| Rappel (warn ou critical) | 99,2 % | 83,8 % [82,5 ; 85,0] | 91,9 % | 90,1 % |
| Rappel critical | 92,0 % | 71,3 % | 79,5 % | 80,5 % |
| Fausses alertes critical | 0,9 % | 13,9 % [12,5 ; 15,4] | 13,7 % | 0,9 % |
| Fausses alertes warn ou critical | 15,4 % | 54,2 % | 54,2 % | 17,1 % |

  Source : `banc_realiste/BANC_REALISTE.md`, section 2. Sur V2_DEV seul, au réglage produit par défaut : fausses alertes critical 14,4 %, rappel 84,0 % (même source). Le « warn » devient presque inutile : 54 % des requêtes bénignes en warn ou critical. Cas synthétiques.
- **Produit livré contre banc.** Source : `redteam/PRODUIT_VS_BANC.md`, mesure du 11 oct. 2026 à 05 h 00, 6 191 arnaques et 2 695 bénins, `V2_TEST` non lu. Chiffres d'une photo, le moteur change.

| | Produit aujourd'hui | Produit + contexte live | + détecteurs | Banc |
|---|---|---|---|---|
| Rappel | 41,2 % (3 643 arnaques ratées) | 43,2 % (3 514) | 90,4 % (593) | 86,6 % (832) |
| Fausses alertes | 16,3 % (440) | 16,3 % (440) | 41,8 % (1 127) | 12,2 % (329) |

  Le rappel de 90,4 % n'est pas un vrai résultat : sans liste de protocoles connus, tout bénéficiaire est inconnu et 42 % des bénins passent en rouge. Avec la liste et le contexte live (configuration cible) : 896 arnaques ratées et 458 fausses alertes. Le produit livré aujourd'hui rate donc plus de la moitié des arnaques de ce jeu.
- Ancien jeu TEST, ouvert une fois avant les correctifs : 94,5 % attrapées, 23,1 % [15,1 ; 33,6] de fausses alertes critical (18/78). **Contaminé**, cité comme ancien état seulement. Source : `COUVERTURE.md`.
- 6 456 scénarios exportés (60,9 % sur Avalanche, 14 inutilisables). Source : `scenarios_export/README_EXPORT_FR.md`.

**Colonne données réelles** :
- Trafic réel C-Chain, 6 325 transactions, moteur actuel sans intention ni contexte : critical sur 0,30 % [0,19 ; 0,47]. 96 % des alertes sont de l'opacité seule (le moteur dit qu'il n'a pas pu décoder), aucune preuve de risque. Ethereum, 6 000 transactions : critical sur 3,33 %. Revue manuelle des 19 critical C-Chain : 2 fausses alertes confirmées, 2 utiles, 15 indéterminées. Trafic de blocs aléatoires, "légitime" présumé, avec des robots. Source : `realtraffic/REALTRAFFIC.md`.
- **Contexte, pas différenciateur.** Un scan de 300 000 blocs C-Chain montre que des paires d'adresses qui se ressemblent existent (`realscan/out/summary.json`, résumé machine, détail dans `RESULTATS_A_JOUR.md` R4). Cela dit seulement que la menace existe. Ce n'est ni un taux de détection, ni une perte évitée, et MetaMask traite déjà ce cas.
- Droits de dépense réels vers des adresses listées (Ethereum, **n = 33**) : le filet v0 en retrouve 24/33 = 72,7 % [55,8 ; 84,9]. Petit n, étiquettes d'un tiers. Source : `research/titouan/bench/RAPPORT_banc_reel_v0.md`, section "CORRECTION MAJEURE".
- Compatibilité de la couche d'interposition sur 96 sites réels : 0 casse sur 89 sites accessibles [0,0 ; 4,1 %]. Le bras test était un **Proxy de substitution** du banc, pas l'extension réelle. Source : `compat/COMPAT_REEL.md`.

**Ce qui n'est pas mesuré** :
- **L'intention en texte libre.** Les chiffres ci-dessus utilisent des intentions à choix fermé (cases), pas du texte écrit par une personne. La précision de l'extraction du type, du montant, du jeton et du destinataire n'est pas mesurée.
- **Clef et Jev.** Aucun appel réel n'a été fait faute de clé. Le classement de l'intention n'est testé qu'avec des mots-clés. On n'écrit pas « Clef classe l'intention » sans mesure.
- **Le comparateur sur les cas que Hold up revendique** : autorisation plus large que le montant voulu, jeton différent, destinataire tiers d'un échange, « me connecter » qui signe un droit. Cas à écrire et à chiffrer.
- Aussi non mesurés : V2_TEST à venir, essai réel avec MetaMask, extension réelle dans Chrome sur des sites réels, utilisateurs réels (le test de compréhension avec personas simulés est non concluant, aucun taux n'est cité), rappel sur un drainer neuf réel, latence avec RPC et simulation.

## 6. Limites connues (honnêtes)

1. **Envois lancés depuis l'interface du portefeuille** (bouton Envoyer, Swap, Bridge de MetaMask, Rabby) : la page n'est pas dans le chemin, l'extension ne voit rien. Idem applications natives et scripts. `extension/COMPAT.md`, limite 2.
2. **Mobile** : pas d'extension sur les navigateurs mobiles courants, WalletConnect passe par un relais chiffré. Une couverture mobile exige l'intégration par l'éditeur du portefeuille. `U_segment/U5a`, `U5b`.
3. **Fraude conforme invisible** : si la victime fait un transfert valide, vers une adresse qu'elle a choisie, sous la guidance d'un escroc (faux conseiller, pig butchering), ni l'intention ni les effets ne la distinguent d'un envoi honnête. Sur DEV, 3 des 24 cas passent sans alerte ; sur TEST, 4/4 alertés, mais n est minuscule. `COUVERTURE.md`.
4. **Pas de refus imposé** : on avertit et on ralentit. Un utilisateur déterminé, ou coaché au téléphone, peut passer outre. Seule une extension pourrait retenir une requête, jamais un Snap (`O_barriere_intention.md`).
5. **EIP-7702 absent de la C-Chain** : les règles 7702 sont mesurées sur des cas Ethereum, pas sur Avalanche (`research/titouan/U_segment/U4_menaces_avalanche.md`, ACP-209 non activé).
6. **Données d'attaque étiquetées surtout Ethereum** : la liste ScamSniffer n'a pas de chaîne, et seulement 2 approbations C-Chain vers des adresses listées ont été trouvées (`coord/INBOX.md`, POINT-20MIN 02h23). Pas de jeu d'attaques réelles étiqueté Avalanche.
7. **Catalogues synthétiques écrits par nous, et réglés dessus** : V2_DEV a servi à ajuster les règles. Auteur non aveugle pour DEV/TEST, adresses et ABI souvent écrites de mémoire dans V2 (champ `approximation`), proportions des familles non réalistes, messages d'escroc écrits par une IA. Les chiffres mesurent la couverture et la non-régression, pas la robustesse face à un attaquant réel.
8. **Fausses alertes : le bon chiffre dépend du contexte.** Sur V2_DEV, 1,0 % de critical, mais avec le contexte complet du banc et sur un jeu réglé. Au réglage produit par défaut (sans âge du contrat, solde, liste de protocoles) : 14,4 % (`banc_realiste/out/TAB_TOTAUX_produit.md`, provisoire). Sur le trafic réel Ethereum, 3,33 % de critical, dont 13 sur 20 relus sont de fausses alertes. Sur l'ancien TEST (contaminé) : 23,1 %. Le warn ou critical brut sur bénins est de 19,2 % sur V2_DEV, au-dessus de la cible de 15 %.
9. **Extension jamais testée avec un vrai portefeuille** : seulement un portefeuille simulé. MetaMask enveloppe déjà `request` ; comportement non testé (`extension/COMPAT.md`, limite 11). L'essai réel d'Adem est passé par le RPC de garde, pas par l'extension.
10. **Détectabilité** : une page motivée peut détecter l'enveloppe (iframe vierge, descripteur de `window.ethereum`) (`extension/COMPAT.md`, G2 et G3).
11. **Retenue de 10 minutes** : le service worker MV3 peut s'arrêter avant. Testée avec 2 s seulement. Adem a livré une retenue persistante (chrome.alarms, stockage) : je ne l'ai pas rejouée (`extension/COMPAT.md`, limite 13 ; `coord/INBOX.md` MSG-056).
12. **Hors transaction** : phrase secrète saisie sur un faux site, extension clone, mise à jour piégée, malware. Hors périmètre (`attacks_public/out/MESURE_001.md`, cas non exécutables).
13. **Aucun test avec des personnes** : la compréhension des écrans n'est pas mesurée sur de vrais utilisateurs. Aucun taux n'est présenté comme preuve.
14. **Latence mesurée seulement en local** : médiane 30,5 ms, p95 35,8 ms (`server/test/results.json`, 400 requêtes synthétiques, hors ligne). Pas de mesure avec simulation sur fork ni RPC réel.
15. **Opacité** : sur la C-Chain réelle, 96 % des alertes disent seulement que le moteur n'a pas pu décoder (`realtraffic/REALTRAFFIC.md`). C'est un avertissement honnête, pas une détection.
16. **Test de présentation** : 30/31, un test échoue (sept codes de raison du moteur sans texte dans la table).
17. **Le silence de MetaMask ne prouve rien sur notre démo.** Fuji et les chaînes locales ne sont pas dans la liste des réseaux couverts par ses alertes. On ne conclut rien de l'absence d'alerte.
18. **Le produit livré rate beaucoup** : 41,2 % de rappel sur 6 191 arnaques (`redteam/PRODUIT_VS_BANC.md`), tant que les détecteurs et la liste de protocoles ne sont pas branchés.

## 7. Rejouer les mesures

Toutes les commandes lancent un seul processus Node. Aucun `npm install`. Depuis `research/titouan/T_banc_e2e/` sauf indication.

| Pour rejouer | Commande | Réseau | Notes |
|---|---|---|---|
| Tests du moteur (447) | `cd engine` puis `node --test test/*.test.mjs` | non | rejoué : 447 pass, 0 fail |
| Tests du serveur local (33) + latence | `node server/test/server.test.mjs` | non | écrit `server/test/results.json` |
| Banc V2_DEV (état final, 5 927 cas) | `node run/run_v2.mjs` | non | écrit `run/out/v2/MESURE_*.md`. V2_TEST jamais lu |
| Banc en conditions produit | `node banc_realiste/run_realiste.mjs` puis `node banc_realiste/analyse.mjs` | non | rapport : `banc_realiste/BANC_REALISTE.md` |
| Produit livré contre banc | `node redteam/check_product.mjs redteam/V2_DEV_norm.jsonl redteam/jury_*.jsonl --quiet` (options en fin de `PRODUIT_VS_BANC.md`) | non | chiffres d'une photo, le moteur change |
| Trafic réel, moteur actuel | `node realtraffic/run_real.mjs` | oui (RPC publics, lecture seule) | graine 20261011 |
| Tests de présentation (30/31 au 11 oct.) | `node server/test/presentation.test.mjs` | non | un test échoue (7a) |
| Banc synthétique DEV | `node run/run_loop.mjs` | non | TEST jamais lu par défaut |
| Ouvrir TEST (une fois) | `node run/run_loop.mjs --open-test` | non | journalisé dans `run/out/TEST_OUVERTURES.json`, réouverture refusée sans `--allow-reopen`. Déjà ouvert une fois (R003). Ne pas rouvrir. |
| Comparer un correctif sur DEV | `node run/ab.mjs <label> <fixes>` | non | jamais TEST |
| Fixtures publiques | `node attacks_public/run_public.mjs` | non | écrit `attacks_public/out/MESURE_*` |
| Régénérer les catalogues | `node attacks/gen.mjs` puis `node attacks/validate.mjs` | non | graine fixe 20261011 |
| Jeu aveugle v1 (sha256 attendu `38ebd60c...590aa`) | dans `blind_adem/` : `node gen_malveillants.mjs`, `node gen_benins.mjs`, `node gen_fraudes.mjs`, puis concaténer dans cet ordre | non | `coord/INBOX.md` MSG-050. Les générateurs importent ethers par un chemin absolu de la machine d'Adem : à adapter. |
| Boîte noire sur un jeu de cas | `node redteam/check.mjs <cas.jsonl>` | non | verdicts identiques à `run_loop --dry` sur 385/385 cas DEV (`redteam/README.md`) |
| Filet v0 sur trafic réel (C-Chain, Ethereum) | depuis `research/titouan/bench/` : `node sample_cchain.mjs 1500`, `node eval_legit_eth.mjs 200`, `node eval_attacks.mjs` | oui (RPC publics, lecture seule) | graine 20261011, blocs épinglés dans `data/*.meta.json`. Le rapport cite aussi `decode_rules.mjs`, absent du dossier : à confirmer. |
| Compatibilité sur 96 sites | `node compat/run_all.mjs` puis `node compat/report.mjs` | oui | Chrome installé requis, pilotage CDP. Validation du harnais : `node compat/selftest.mjs` |
| Tests de l'extension (66) | `node extension/mock_engine.mjs` dans un terminal, puis `node extension/tests/run_tests.mjs chrome` (ou `edge`) | local | Chrome ou Edge requis, environ 3 minutes. Non rejoué pour ce brouillon. |
| Vérifier le journal | `node server/server.mjs --verify-journal` | non | |

## 8. Référentiels (à vérifier avant publication)

NIST CSF 2.0 : Detect (DE.AE, DE.CM), Respond, Protect (PR.AT). ATT&CK : T1566, T1656, T1657. Détail et marquage "à vérifier" : `FICHE_DEFENSE_DRAFT.md`.

## 9. Sécurité du repo

Aucun secret dans le repo. Les clés (`FUJI_PRIVATE_KEY`, jetons Cloudflare ou Jev) vivent dans des variables d'environnement, jamais commitées (`docs/intent-barrier.md`). Données synthétiques ou publiques uniquement, aucune action contre un système réel.
