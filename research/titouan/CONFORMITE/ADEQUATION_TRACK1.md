# Adéquation de Hold up à la Track 1 (Guardians of Value)

Rédigé le 11 oct. 2026 à 10h40. Il reste environ 1 h 20 avant le gel de 12h00.
Source de vérité : `context/notion_guide.md` (cité « l.N »). Les slides du kick-off (`context/kickoff_slides.md`) disent la même chose pour la Track 1, sauf le format des passages.
Hors périmètre de ce document, à la demande de Titouan : le modèle économique (aucun poids dans la grille de la Track 1) et la vidéo (Adem).
Faits du dépôt vérifiés en lecture le 11 oct. à 10h35 (commit `78cbbee`). Aucun fichier `.env` lu.

## En une phrase

Nous couvrons les trois livrables de la Track 1 et les cinq critères, mais deux trous peuvent coûter très cher en une heure : **le dépôt GitHub est privé** et **la slide conformité n'est pas dans le deck**.

---

## 1. Livrables exigés

| # | Livrable | Ce que dit le texte | Notre fichier | État | Effort restant |
|---|---|---|---|---|---|
| C1 | Dépôt Git avec README | « Repo Git accessible au jury, avec un README clair » (l.18) | `README.md` : problème, prototype, installation en 3 commandes, tests, limites, carte du dépôt. Architecture : `livrables/ARCHITECTURE.md` | **Partiel** : le contenu est fait, mais le dépôt `adembnn/secure-horizon` est **privé** (vérifié par `gh repo view`). Quatre fichiers modifiés non commités (README, CHIFFRES, INSTALLATION, QR_JURY) | 0,15 h (commit, push, rendre public ou inviter le jury : geste d'Adem, propriétaire) |
| C2 | Vidéo de démo | « Vidéo de démo de 2 à 3 min » (l.19) | Gérée par Adem | Hors périmètre | Hors périmètre |
| C3 | Pitch deck | « Pitch deck (8 slides max recommandé) » (l.20) | `livrables/deck/holdup.pptx`, plan dans `DECK.md` | **Partiel** : 9 slides (une de trop par rapport à la recommandation). Pas de slide ni de ligne « équipe ». Rendu jamais vérifié dans PowerPoint (`DECK.md` l.16) | 0,25 h |
| C4 | Fiche de défense | « Fiche de défense (1 page) » avec « métriques » (l.21) | `livrables/FICHE_DEFENSE.md` | **Fait sur le fond**. Scénario, NIST, ATT&CK, détection, faux positifs, temps de détection, limites : présents. Deux faiblesses : 769 mots (dépasse sans doute une page imprimée) et le **temps de réponse** n'a pas de ligne propre | 0,15 h (couper le paragraphe « Modèle économique », qui n'est pas demandé l.21, et ajouter une ligne temps de réponse) |
| T1 | PoC de bout en bout | « PoC de bout en bout, de la détection à la réponse » (l.60) | Extension `research/titouan/T_banc_e2e/extension_standalone/extension/`, site Neve, chaîne locale, `scripts/demo.mjs` | **Fait, avec réserves** : scène jouée dans un vrai Chromium par script, portefeuille simulé. Tapée à la main : non prouvé. Installation neuve sans jetons déclarés : scène cassée (`DEMO_DEROULE.md` l.16). Révocation : démo web seulement | 0,5 h (deux répétitions à la main sur le build actuel) |
| T2 | Playbook de réponse | « qui est alerté, ce qui est automatique, ce qui reste humain » (l.60) | `livrables/PLAYBOOK_REPONSE.md` | **Fait, mais se contredit** : l.17 dit le build autonome chaîné ; l.38 dit « version serveur seulement » ; l.52 dit « pas de chaîne du tout ». Le code donne raison à l.17 (`journal_chain.js` présent dans le build livré) | 0,1 h |
| T3 | Slide conformité | « slide conformité (DORA, AML/CFT, MiCA, AI Act » (l.60) | `livrables/SLIDE_CONFORMITE.md` (texte complet, articles sourcés) | **Partiel** : le contenu existe en Markdown, **pas comme slide du deck**. La slide 7 du deck dit « Aucune conformité déclarée » sans nommer DORA, MiCA, LCB-FT ni AI Act, ni le geste de l'auditeur | 0,4 h |

Ce que le guide **ne demande pas** à la Track 1 (vérifié ligne par ligne) :
- Aucune fiche ou rapport d'incident. La « déclaration pré-remplie » (l.58) appartient à la piste 4 (DeFi + DORA), pas à nous.
- Pas de slide « why this problem » ni « what's next » (Track 3, l.117), pas de section « comment l'humain garde le contrôle » (Track 2, l.91). Utiles en réponse, pas exigées.
- Pas de document en plus du README, du deck, de la fiche et des trois livrables de track.

Règles et jalons qui conditionnent le rendu :
- Une seule track, confirmée au checkpoint de samedi 18h30 (l.13, l.35). README l.7 dit Track 1. À confirmer par Adem que le formulaire est parti.
- Code écrit entre samedi 11h30 et dimanche 12h00 (l.14) : premier commit le 10 oct. à 11h52. Conforme.
- NIST CSF 2.0, idéalement Detect ou Respond (l.8) : `MAPPING_REFERENTIELS.md`, Detect (DE.AE-02, DE.AE-07, DE.CM-09) et Respond (RS.MI-01 au sens large, RS.AN-06). Conforme.
- Référentiels (l.9) : ATT&CK retenu (T1657, T1566, T1204, T1684.001, T1070). ATLAS, D3FEND et OWASP Agentic : examinés et écartés, avec la raison écrite (`MAPPING_REFERENTIELS.md` l.22 à 24). C'est défendable : la fiche demande « ATT&CK/ATLAS ou risques OWASP » (l.21), le « ou » nous couvre.

Format des passages (l.25 et l.26) : Round 1 à 13h00, **5 min de pitch et 2 min de questions**. Finale à 15h25, **3 min et 3 min**. Les photos du kick-off disaient 4 + 2 (l.27 du guide le note). `PITCH_5MIN.md` dure 4 min 18 s de texte plus 40 s de gestes : il passe à 5 min, pas à 4. `livrables/pitch_v7/PITCH_3MIN.md` existe pour la finale.

---

## 2. Les cinq critères de la grille (l.62 à 68)

Notes estimées pour un passage aujourd'hui, avec les fichiers tels qu'ils sont. Hypothèses communes : trois experts au moins (l.25), cinq minutes, jugement sur le pitch, la démo, la fiche et un coup d'œil au dépôt. Les notes des simulations précédentes (`pitch_v7/AUTOCRITIQUE.md` : 69 sur 100 ; trois analyses ROUND1 : 9,5 à 12,5 sur 15 en conformité) servent de point de départ.

| Critère (poids) | Ce que le texte demande | Nos preuves | Nos trous | Note estimée | Le geste qui rapporte le plus |
|---|---|---|---|---|---|
| **Efficacité de détection (30)** | « Précision, taux de faux positifs, temps de détection » sur un scénario réaliste (l.64) | Jeu aveugle A6 (`blind_decalage/run/RESULTAT.md`) : rappel 87,3 % [81,1 ; 91,7], faux rouges 15,0 %, critère publié avant. Gain de la phrase : 64,7 % vers 87,3 %. Temps : verdict local médian sous 50 ms (A16), environ 400 ms dans la scène (A21). Trafic réel Avalanche (B11). Tout dans `livrables/CHIFFRES.md` | Seuil de 10 % de faux rouges manqué. 30 % de bénins avec une alerte. Auteur du jeu : IA de la même famille. Mesuré en Node, pas dans Chrome. **Le mot « précision » de la grille n'a aucun chiffre chez nous** | **19 / 30** (fourchette 17 à 22). Hypothèse basse : un juré lit 15 % comme « trop d'alertes pour un client ». Haute : le protocole aveugle (empreinte publiée, ouverture unique) impressionne KPMG | Donner la précision, calculée sur le même jeu : 131 signalés justes sur 161 signalés, soit **81,4 %** ; en rouge, 114 sur 129, soit **88,4 %**. À dire avec sa limite : 60 % d'arnaques dans le jeu, donc pas la précision du monde réel. L'ajouter d'abord à CHIFFRES.md (règle : rien hors de ce tableau) |
| **Qualité de la réponse (20)** | « Proportionnée, actionnable, utile à l'analyste » (l.65) | Réponse graduée : information, attention, danger, manipulation. Trois verdicts, Annuler toujours visible. Droit ramené automatiquement à 50 USDC (prouvé dans Chromium, A21). Révocation et fiche dans la démo web (A18). Playbook | Pas d'« analyste » visible : notre utilisateur est un particulier. Révocation hors extension. Rien à corriger sur une signature (Permit). La perte est bornée, pas évitée. La deuxième demande d'une même phrase n'est pas comparée | **14 / 20** (12 à 16). Basse : le juré cherche un poste d'analyste et ne le trouve pas. Haute : il retient la limitation automatique, rare et proportionnée | Nommer l'analyste : l'équipe fraude de la plateforme qui intègre Hold up lit le journal exporté (panneau latéral, export JSON, `incident.mjs --list --stats`). Une phrase au pitch, une ligne dans le playbook |
| **Faisabilité et intégration (20)** | « Le PoC marche-t-il ? » et intégration à une « banque, fintech ou protocole » (l.66) | Vrai Chromium, extension MV3 livrée, `scripts/demo.mjs`, `verifier_installation.mjs`, tests. Interception EIP-1193 : marche devant n'importe quel site, donc n'importe quel protocole. Compatibilité 96 sites (B10, ancienne couche) | **Dépôt privé.** Jamais essayé avec un vrai portefeuille. Portefeuille simulé. Scène cassée sur installation neuve sans jetons déclarés. Rien sur Fuji. Contournements de la revue non vérifiés dans Chrome. Pas d'API pour une banque ou une fintech | **11 / 20** (8 à 13). Basse : la démo casse en salle ou le jury ne peut pas ouvrir le dépôt. Haute : démo fluide à la main, intégration dite clairement | Rendre le dépôt accessible, puis jouer la scène deux fois à la main, sur le build actuel, avant 12h00 |
| **Conformité et explicabilité (15)** | « Décisions traçables et défendables devant un régulateur ou un auditeur » (l.67) ; « explicable à un régulateur, un auditeur ou un assureur » (l.52) | `SLIDE_CONFORMITE.md` (DORA, MiCA, LCB-FT, AI Act, articles, refus de revendiquer). `EXPLICABILITE.md` : rejeu 6 sur 6 par `verify_decision.mjs`. Journal chaîné dans le build livré, export JSON, `verify_journal.mjs`, 7 tests (A19). Réponse « qui est responsable ? » (`QR_JURY.md`, `EXPLICABILITE.md` §5) | Slide absente du deck. Documents contradictoires (playbook, PRODUCT.md l.53). Deux inexactitudes du journal (passage automatique noté comme confirmation humaine ; limitation à 50 non notée). Rejeu complet seulement sur la version serveur. Journal d'exemple ignoré par git (`.gitignore` l.23) : la commande de la slide échoue sur un clone. Pas d'ancrage | **10,5 / 15** (9,5 à 12). Basse : un juré KPMG trouve la contradiction du playbook. Haute : la slide est projetée et le rejeu montré | Mettre la slide conformité dans le deck et corriger les trois phrases contradictoires (voir section 4) |
| **Pitch et démo (15)** | Pas de détail dans le texte (l.68). Conseil : « un seul scénario traité parfaitement » (l.71) | Un seul scénario (Neve piraté), deux fenêtres, chiffres sourcés, limites dites. `PITCH_5MIN.md`, `PITCH_3MIN.md`, `DEMO_DEROULE.md` (état de chaque geste) | Scène tapée à la main non prouvée. Pitch à 4 min 58 s si les gestes sont lents. Deck à 9 slides, rendu non vérifié | **12 / 15** (10 à 13,5). Basse : panne en direct. Haute : scène fluide, aveu des 15 % bien placé | Répéter la scène deux fois en entier, chronomètre en main |
| **Total** | | | | **66,5 / 100** (fourchette 57 à 76,5) | |

Gain réaliste en une heure de travail bien choisie (section 5) : environ +4 à +7 points, surtout en faisabilité, conformité et détection.

---

## 3. Quelle sous-piste nous correspond

Le guide liste quatre pistes (l.54 à 58).

| Piste | Ce qu'elle décrit | Ce qui nous colle | Ce qui ne colle pas |
|---|---|---|---|
| 1. Analyste AML/CFT (l.55) | Réseaux de mules, graphes, score de risque | Rien | Pas de graphe, pas d'AML. Nous refusons même tout filtrage LCB-FT (`SLIDE_CONFORMITE.md`) |
| **2. SOC anti-fraude IA générative (l.56)** | Détection de fraude et « réponse graduée » : renforcement, mise en attente, gel, « alerte client » | **La réponse graduée** (attention, danger, retenue), **l'alerte client**, la fraude par interface détournée ou faux support. C'est notre vocabulaire | Pas de voix clonée, pas de faux KYC, pas de prise de contrôle de compte bancaire. Côté client, pas côté SOC |
| 3. Supervision des agents IA financiers (l.57) | Chaîne d'autorité, actions hors périmètre, autorisations courtes et révocables, validation humaine | Moindre privilège : droit ramené au montant écrit. Validation humaine. Révocation. L'intention écrite joue le rôle d'un mandat | Aucun agent dans le produit. Notre mapping dit lui-même « ASI par analogie » (`MAPPING_REFERENTIELS.md` l.23) |
| 4. DeFi + DORA (l.58) | Monitoring on-chain d'un contrat, Fuji, pause, classification DORA | Avalanche, copie locale de la C-Chain, contrats de démo | Abandonnée comme cœur (D-003 à D-007). Rien déployé sur Fuji. Pas de classification DORA |

**Celle qui nous colle le mieux : la piste 2**, par la réponse graduée et l'alerte client, avec un emprunt à la piste 3 (moindre privilège et autorisation limitée).
**Celle qu'un jury nous attribuera** : probablement « DeFi, côté utilisateur », donc un mélange des pistes 2 et 4. Team1 Avalanche verra la piste 4 et demandera Fuji. KPMG cherchera la piste 2 et le régulé.

**Risque de hors-sujet : moyen.** Le texte ne réserve pas la Track 1 aux institutions : elle couvre « de la banque à la DeFi » (l.46) et la piste 2 nomme « l'alerte client » (l.56). Mais deux critères parlent la langue des institutions : intégration « aux outils d'une banque, d'une fintech ou d'un protocole » (l.66) et défense « devant un régulateur ou un auditeur » (l.67). Un juré peut aussi penser à la piste 4 de la Track 3 (« détection d'arnaques » pour les citoyens, l.115). Contre-argument écrit dans le guide : la Track 3 doit vérifier que le projet « ne relève pas plutôt de la Track 1 ou 2 » (l.128). Un contrôle sur des signatures qui déplacent de l'argent relève de la Track 1.

Comment rester dans le track : toujours nommer le régulé qui intègre (exchange, fintech, portefeuille), jamais le particulier seul. `SLIDE_CONFORMITE.md` l.7 le fait déjà. Le pitch V7 ne le dit pas dans le texte principal (seulement en questions).

**Phrase d'ancrage à dire au début ou à la fin du pitch** (15 mots environ, à placer après la démo) :
« C'est un contrôle anti-fraude de dernier mètre : réponse graduée, alerte client, trace vérifiable pour la plateforme régulée. »

Réponse prête si un juré dit « c'est pour des particuliers, pas pour une banque » :
« Le particulier voit l'écran. Le client, c'est l'exchange, la fintech ou le portefeuille qui l'intègre : il garde la trace, l'auditeur la rejoue. Le même moteur pourrait répondre avant un retrait ; non construit, c'est l'objet des pilotes. »

---

## 4. Conformité (15 %) sans fiche d'incident complète

### Ce que le texte exige vraiment
- Le critère : « décisions traçables et défendables devant un régulateur ou un auditeur » (l.67).
- Le playbook : « comment c'est documenté » (l.60).
- La slide : « comment un auditeur vérifie les décisions » (l.60).
- L'enjeu : explicable « à un régulateur, un auditeur ou un assureur » (l.52).
- Le conseil : « si votre modèle se trompe, qui est responsable ? » (l.71).
Le mot « fiche d'incident » n'apparaît nulle part. Les trois analyses ROUND1 concluent pareil : sans fiche, on perd environ 0,5 à 1,5 point sur 15, pas le critère.

### Ce qui est déjà couvert
| Exigence | Ce qui la couvre aujourd'hui | Fichier |
|---|---|---|
| Traçable | Une ligne datée par décision, chaînée par SHA-256, dans le build livré ; borne de 500 lignes avec point d'ancrage ; ni phrase ni adresse (minimisation) | `extension/journal_chain.js`, A19 |
| Vérifiable par un tiers | Export JSON depuis le panneau latéral, puis `node extension/tools/verify_journal.mjs export.json` (0 cohérent, 1 rompu). Rejeu complet du moteur sur la version serveur : 6 décisions sur 6 | `PLAYBOOK_REPONSE.md` §3, `EXPLICABILITE.md` §2 |
| Défendable | Quelle règle a produit quelle raison, avec fichier et ligne. Limites dites (réécriture complète non détectée sans ancrage) | `EXPLICABILITE.md` §2 et §3 |
| Régulateur | DORA, MiCA, LCB-FT, AI Act : qui est concerné, ce que Hold up apporte, ce que nous ne disons pas. Articles relus | `SLIDE_CONFORMITE.md` |
| Responsable si erreur | Le modèle ne lit que la phrase ; le code lit montants et adresses ; la personne garde le geste ; partage éditeur, plateforme, personne | `EXPLICABILITE.md` §5, `QR_JURY.md` |
| Documenté (playbook) | Qui est alerté, automatique, humain, après la décision, temps | `PLAYBOOK_REPONSE.md` |

### Version minimale, chiffrée (environ 1 h)
| # | Geste | Temps | Effet |
|---|---|---|---|
| 1 | Aligner les documents sur le code : `PLAYBOOK_REPONSE.md` l.38 (« version serveur seulement ») et l.52 (« pas de chaîne du tout ») ; `PRODUCT.md` l.53 (« version serveur seulement »). Écrire : chaîné dans les deux builds, non ancré | 0,1 h | Supprime la contradiction qu'un juré KPMG cherche. Évite le cas « 9,5 sur 15 » |
| 2 | Slide conformité dans le deck : transformer la slide 7, ou ajouter une slide de réserve après la 9. Quatre lignes (DORA : matière pour le registre art. 17 §2 ; MiCA : complément art. 68 ; LCB-FT : preuve datée d'une alerte, aucun filtrage ; AI Act : modèle limité à la phrase, humain au dernier geste). Une ligne « l'auditeur exporte le journal et lance la vérification ». Une ligne « aucune conformité revendiquée » | 0,4 h | Livrable exigé l.60, aujourd'hui absent en tant que slide |
| 3 | Rendre la commande de la slide reproductible : forcer l'ajout du journal d'exemple (`git add -f research/demo_reelle/audit/sample/journal.jsonl`) ou écrire dans la slide de lancer `make_sample_journal.mjs` d'abord | 0,05 h | Un juré qui clone ne tombe pas sur une erreur |
| 4 | Préparer le geste de 20 secondes, en démo ou en question : exporter le journal, changer une ligne, vérifier, montrer « rompu » | 0,25 h | Rend la trace visible. Ramène l'écart dû à la fiche vers zéro selon `ROUND1_ANALYSTE.md` |
| 5 | Phrase pour l'assureur : « la pièce, c'est la ligne datée, son empreinte et le résultat de la vérification ; la plateforme la verse à son registre d'incidents » | 0,05 h | Répond au mot « assureur » (l.52) sans fiche |
| 6 | Dire les deux inexactitudes du journal au lieu de les corriger (le correctif touche `gatekeeper.js`, trop risqué avant le gel) | 0 h | Honnêteté déjà écrite dans la slide et le pitch |

Note estimée sur 15 : aujourd'hui **10,5** (9,5 à 12). Après la version minimale : **12** (11 à 13). Fiche d'incident complète en plus : 12,5 à 13, pour 3 à 10 heures selon les analyses : hors délai.

À ne pas faire avant 12h00 : porter la fiche dans l'extension, générer un PDF, classer selon DORA (seule la plateforme a les critères), ancrer sur Fuji, unifier les formats de journal.

---

## 5. Top 10 des écarts à combler avant dimanche 12h00

Classés par points gagnés par heure. Temps total : environ 2 h 10. Il reste environ 1 h 20 : à deux, les lignes 1 à 8 tiennent ; seul, s'arrêter après la ligne 6.

| Rang | Écart | Geste | Temps | Points gagnés (estimés) | Points par heure |
|---|---|---|---|---|---|
| 1 | Dépôt privé, fichiers non commités | Commit et push des 4 fichiers modifiés. Adem rend `adembnn/secure-horizon` public ou invite les jurés. Avant : relancer le contrôle de secrets (section 6) | 0,15 h | Évite une perte de 5 à 15 points (faisabilité, voire disqualification du livrable C1) | plus de 30 |
| 2 | Documents qui se contredisent sur le journal | Corriger `PLAYBOOK_REPONSE.md` l.38 et l.52, `PRODUCT.md` l.53 | 0,1 h | +1 à +1,5 (conformité) | 10 à 15 |
| 3 | « Précision » de la grille sans chiffre | Ajouter à `CHIFFRES.md` (ligne A6) : précision 81,4 % (signalé) et 88,4 % (rouge), avec « 60 % d'arnaques dans le jeu ». La reporter dans la fiche | 0,15 h | +1 à +1,5 (détection) | 7 à 10 |
| 4 | Fiche de défense trop longue, temps de réponse absent | Couper le paragraphe « Modèle économique » (non demandé l.21). Ajouter « Temps de réponse : fenêtre ouverte en 325 à 345 ms, verdict et limitation à 50 USDC au même instant, environ 400 ms (A21) » | 0,15 h | +0,5 à +1 (détection, pitch) | 3 à 7 |
| 5 | Phrase d'ancrage track absente du texte dit | Ajouter la phrase de la section 3 dans `PITCH_5MIN.md` et `PITCH_3MIN.md`, plus la réponse « particuliers ou banque » dans `QR_JURY.md` | 0,1 h | +0,5 à +1,5 (faisabilité et intégration, risque hors-sujet) | 5 à 15 |
| 6 | Slide conformité absente du deck | Voir section 4, geste 2 | 0,4 h | +1 à +2 (conformité) | 2,5 à 5 |
| 7 | Commande d'audit qui échoue sur un clone | `git add -f` du journal d'exemple, ou préciser `make_sample_journal.mjs` dans la slide | 0,05 h | +0,2 à +0,5 (conformité) | 4 à 10 |
| 8 | Démo jamais tapée à la main sur le build actuel | Préparation P1 à P9 de `DEMO_DEROULE.md`, jetons déclarés, puis deux passages complets chronométrés | 0,5 h | +1 à +3 (pitch et démo, faisabilité) | 2 à 6 |
| 9 | Analyste invisible dans la réponse | Une ligne au playbook (§4) et une phrase en question : l'équipe fraude de la plateforme lit l'export du journal | 0,1 h | +0,3 à +0,8 (qualité de la réponse) | 3 à 8 |
| 10 | Deck : 9 slides, pas d'équipe, rendu non vérifié | Ajouter « Adem et Titouan » sur la slide 1 ou 9, ouvrir le fichier dans PowerPoint, vérifier les slides 6 et 9 | 0,25 h | +0,3 à +0,5 (pitch) | 1 à 2 |

Hors classement mais utiles si une minute reste : remplir la section « Projet / Stack » de `CLAUDE.md` (encore à TODO l.54 à 57, lisible par un juré qui ouvre le dépôt) ; préparer une coupe à 4 min du pitch au cas où le format serait celui du kick-off (couper « Le fait » LI.FI, comme prévu dans `PITCH_5MIN.md` l.9).

---

## 6. Risques de disqualification ou de pénalité, vérifiés dans le dépôt

| Risque | Règle | Vérification faite le 11 oct. à 10h35 | Verdict |
|---|---|---|---|
| **Dépôt non accessible** | « Repo Git accessible au jury » (l.18) | `gh repo view adembnn/secure-horizon` : `"visibility":"PRIVATE"`. Branche `main` à jour avec `origin/main`, mais 4 fichiers modifiés et 2 non suivis pas encore poussés | **Risque élevé.** À régler en premier. Rendre public est un réglage du compte d'Adem : lui seul doit le faire |
| **Secrets dans le dépôt** | « Zéro secret dans les repos » (l.15), « the juries will check » | `git ls-files` (2 757 fichiers) : aucun `.env` suivi, seulement des `*.env.example`. Aucun `.env` ajouté dans l'historique. Recherche par motifs sans copier de valeur : clé AWS, clé Anthropic, jeton GitHub, jeton Slack, clé Google, bloc de clé privée, `CF_API_TOKEN=`, `PRIVATE_KEY=` suivi de 64 caractères hexadécimaux, `Bearer` : **0 fichier**. Le motif `sk-` ne sort que dans des mots du texte (précédés d'une lettre). Un workflow gitleaks tourne à chaque push (`.github/workflows/secrets-scan.yml`) | **Pas de secret trouvé.** Point d'attention : 7 fichiers contiennent une constante nommée `..._KEY` ou `CONDUIT_KEY` avec 64 caractères hexadécimaux. C'est la « conduit key » publique d'OpenSea (commentée « public (OpenSea docs) » dans `detectors_adem/nft_orders.mjs` l.18). Un scanner naïf peut la signaler : avoir la réponse prête |
| **Données non synthétiques** | « Pas de données personnelles réelles » (l.15) | Jeux de test synthétiques (README l.127). Mais `realscan/out/campaign_tx_senders.json`, `candidates.json` et `sample.json` sont suivis : adresses publiques de vrais portefeuilles mainnet (déjà relevé par `redteam/angles_morts/02_conformite_jury.md` point 11). Courriels : seulement des contacts d'entreprise publics (ESSEC Ventures, Trustee, Spiko, Gnosis), aucun particulier | **Risque faible.** Données publiques de chaîne, pas de nom. Réponse prête : « lecture publique, en lecture seule, hors produit figé ». Option : retirer ces trois fichiers du suivi si une minute reste |
| **Action contre un système réel** | « aucune action contre un système réel sans autorisation écrite » (l.15) | Attaques jouées sur chaîne locale. Lectures de RPC publics en lecture seule. `compat/` a chargé 96 sites réels en lecture (B10) | **Risque faible**, déjà noté. Dire « lecture seule, aucune transaction » |
| **Hors-sujet** | Une seule track (l.13), critères tournés vers l'institution (l.66, l.67) | Voir section 3 | **Risque moyen.** Phrase d'ancrage à dire |
| **Livrable manquant** | Livrables communs et de track (l.17 à 22, l.60) | Slide conformité absente du deck (fichier Markdown seulement). Vidéo : Adem. Tout le reste existe | **Risque moyen** sur la slide. 0,4 h pour le fermer |
| **Démo qui plante** | Conseil l.71, filet de la vidéo l.19 | Scène prouvée par script, pas à la main. Cassée sur installation neuve sans jetons déclarés. Build actuel (Clef par défaut, icônes) pas retesté par l'audit. Relais sans clé : repli par mots-clés, affiché | **Risque moyen à élevé.** Répéter deux fois ; garder la vidéo d'Adem prête ; dire la phrase exacte `échanger 50 USDC contre AVAX` |
| Cœur codé hors fenêtre | l.14 | Premier commit 10 oct. 11h52, après 11h30 | Conforme |
| Fichiers trop lourds pour un clone | Pas une règle, mais un dépôt qui ne se clone pas équivaut à un dépôt inaccessible | Plus gros fichiers suivis : 26,8 Mo (`scenarios_export/scenarios.json`) et 20,4 Mo (`V2_DEV.jsonl`). Rien au-dessus de 100 Mo | Conforme |
| Mots interdits ou promesses non tenues | Défendable devant un auditeur (l.67) | Les livrables évitent « sécurisé », « bloque », « conforme ». La fiche d'incident n'est promise qu'avec « démo web, portefeuille simulé » | Conforme. Garder cette discipline à l'oral |

## Ce qui reste incertain

- Le format exact du Round 1 (5 min selon le Notion, 4 min selon les photos) : à confirmer sur place.
- Si le formulaire du checkpoint de samedi 18h30 a bien confirmé la Track 1 : à demander à Adem.
- Les notes sont des estimations à partir de simulations de jurés, pas des mesures. La fourchette compte plus que le point central.
