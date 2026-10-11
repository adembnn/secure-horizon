# Hold up : scènes de démo, scripts chronométrés, questions du jury, coupes

> **Mises à jour du 11 oct. après rédaction (à lire avant de répéter).**
> 1. Les scènes ont été rejouées dans le navigateur sur la démo web : permit piège = Danger, envoi simple = Aucun signal, sosie = Danger (8 scènes sur 8 conformes).
> 2. La démo web suit maintenant la direction R3-figma : les blocs s'appellent « Tu crois » et « En vrai » (et non « Tu as dit » / « En réalité »), et la question d'intention se valide avec « Vérifier ».
> 3. Le chiffre « 377 variantes EIP-2612 sur 377 en warn ou ok » est en grande partie un artefact du fuzzer : dans ces cas, le `owner` du permit n'est pas le signataire. Avec le vrai signataire, la chaîne du banc sort critical dans 306 cas sur 451 (EIP-2612 et DAI permit). Les vrais trous restants : type renommé, montant énorme vers un protocole connu, `personal_sign` déguisé. Ne pas citer « 377 sur 377 » sans cette précision.

> Rédigé le 11 oct. 2026 pour le round 1 (13h00, 5 min + 2 min de Q&R) et la finale (15h25, 3 min + 3 min de Q&R). Règlement : `context/notion_guide.md`.
> Règle : tout chiffre vient d'un fichier du repo, cité à côté. Ce qui n'est pas mesuré s'écrit « à mesurer ». Données fictives ou synthétiques uniquement.
> `T` = Titouan, `A` = Adem. La répartition de la parole est une proposition : on peut l'inverser.

## 0. Ce qui existe, ce qui manque (état au moment de l'écriture)

| Élément | État | Source |
|---|---|---|
| Démo web : 8 scènes fictives, moteur de l'extension dans la page, aucun appel réseau (CSP `connect-src 'none'`, contrôle « aucun appel réseau » passé) | existe, jouable hors ligne | `research/titouan/T_banc_e2e/webdemo/` (`index.html`, `js/scenarios.js`, `out/RESULTATS.json`) |
| Les 3 scènes jouées ci-dessous, avec la réponse d'intention prévue : niveaux attendus obtenus (permit piège : Danger ; envoi simple : Aucun signal trouvé ; adresse sosie : Danger) | mesuré dans les tests Node de la démo, pas dans un navigateur par nous | `webdemo/out/RESULTATS.json`, clé `niveaux_scenarios` |
| Extension autonome + page de test à 3 boutons (`standalone_test_page/index.html`) | existe, jamais chargée dans un vrai Chrome d'après son guide | `research/titouan/T_banc_e2e/INSTALL_STANDALONE_FR.md` |
| Extension version serveur, portefeuille simulé, Chrome 154 et Edge 155 : 64 PASS sur 66, 2 LIMITE | mesuré | `research/titouan/W_livrables/RESULTATS_A_JOUR.md`, section B |
| Vraie MetaMask sur Fuji | jamais essayé, protocole écrit pour un humain | `research/titouan/T_banc_e2e/essai_reel/ESSAI_REEL_METAMASK.md` |
| Contrats de démo sur Fuji (drainer neuf, routeur) | non listés : `blockchain/DEPLOYMENTS.md` ne contient que l'en-tête | `blockchain/DEPLOYMENTS.md` (à relire avant 13h00) |
| Vidéo de démo (plan B) | pas enregistrée : la tâche T-281 est `todo` et aucun fichier vidéo n'est dans le repo | `coord/BOARD.md`, recherche de fichiers |
| URL publique de la démo web | aucune notée (un `vercel.json` existe) | `webdemo/vercel.json` |
| Clef / Jev | non appelés, aucune clé dans l'environnement | `coord/HANDOFF_ADEM_SESSION.md` |

Ce que dit `webdemo/out/RESULTATS.json` d'autre, à connaître : 5 contrôles sur 34 échouent (équivalence avec la voie de référence 72/83, 129/144 et 319/385 ; l'exemple « signature de permit » de l'onglet « Colle une transaction » sort en Attention et non en Danger ; sept noms d'hôte non fictifs comme `app.uniswap.org` dans les exemples publics). Pour le permit piège, l'écart d'équivalence porte sur un autre champ que le niveau et la fiche (même triple Danger, critical, F02) : on ne l'a pas analysé. Aucun de ces échecs ne change le niveau des trois scènes jouées.

### Avant de monter (10 min, une fois)

1. Servir la démo par HTTP, pas par `file://` : la page charge des modules ES. Commande générique, non documentée dans le repo, à tester : dans `webdemo/`, `python -m http.server 8080`, puis `http://127.0.0.1:8080/`.
2. Jouer les trois scènes une fois, dans l'ordre. Si un niveau diffère de celui annoncé plus bas, le noter et adapter la phrase dite ; ne pas jouer la scène à l'aveugle.
3. Onglet « Journal » : « Effacer ». Réglages de la démo : délai 5 s (défaut), case « Poser d'abord la question d'intention » cochée. Le niveau Danger impose au moins 10 s avant « Continuer quand même », le niveau Manipulation 30 s.
4. Ouvrir la page dans un second onglet déjà chargé, et avoir la vidéo prête (section 1, plan B). Zoom du navigateur à 125 ou 150 % pour la projection.
5. Imprimer le tableau des 25 attaques de `pitch/JURY_ATTAQUES.md` section 2 et les chiffres de la section 5 de ce fichier.

## 1. Les trois scènes

Ordre : permit piège (accroche), envoi simple (témoin), adresse sosie (même envoi, autre adresse). Les scènes 2 et 3 se jouent dans la même appli de paiement, avec le même montant et la même réponse : seule l'adresse change.

Étiquettes de référentiel : elles ne s'affichent pas dans la démo web. On les met sur la slide « démo » ou en bandeau sous l'écran. L'attribution scène par scène est de notre fait ; les identifiants viennent de `docs/BRIEF_direction.md` section 12. Pour Respond, l'identifiant CSF 2.0 reste à confirmer (la fiche de défense brouillon écrit RS.MA « à vérifier »).

### Scène 1. Signature piégée : le permit « pour te connecter »

**Histoire.** Camille a déjà perdu de l'argent ; un faux site de remboursement lui demande de signer un message gratuit pour « se connecter », et cette signature donne au site le droit de vider ses USDC. Les drainers de signature ont pris 83,85 M$ à 106 106 victimes en 2025 (Scam Sniffer, `docs/BRIEF_direction.md` section 3).

**Clics.**
1. Onglet « Démo ». Dans la liste « 1. Le faux site propose », cliquer « Signature de permit piège ».
2. Le panneau de droite montre « Faux site de remboursement (fictif) », `Type : Message à signer (EIP-712)`, `Application : USD Coin`. Aucun montant d'envoi.
3. Cliquer « Signer » dans le faux portefeuille.
4. La fenêtre « Hold up ! » s'ouvre : « Ta demande est retenue. Rien n'a été envoyé à Faux site de remboursement (fictif). » puis « Qu'essaies-tu de faire ? ». Cliquer « Me connecter » (un juré peut choisir une autre réponse : « Payer quelqu'un », « Recevoir de l'argent », « Autre » et l'absence de réponse sortent aussi en Danger dans les tests ; « On m'a demandé de le faire » n'a pas été relevé pour cette scène, et une réponse ne peut que relever le niveau).
5. Verdict. Ouvrir « Ce que le moteur a vu ».
6. Cliquer sur « Continuer quand même » : il est grisé, avec « Tu pourras continuer dans N s. Annuler reste possible à tout moment. »
7. Cliquer « Annuler » (ou Échap).

**À l'écran.** Pastille « Danger », phrase « Ce n'est pas ce que tu as demandé. », bloc « Tu as dit » (« Je signe un simple message, sans payer de frais. », avec « Ton intention : Me connecter ») et bloc « En réalité » (« Cette signature gratuite laisse … prendre tes … pendant … jours. », variables remplies par le moteur). Puis « Signer ne coûte rien, mais ça vaut une procuration signée. » et « Ne signe pas, sauf si tu as demandé cette autorisation. » (fiche F02, `engine/textes.js`). Le panneau technique liste le droit de dépense décodé. Après « Annuler » : « Annulé avec Hold up : la demande n'a pas atteint le portefeuille. Rien n'a été signé. » Lire le texte exact à l'écran pendant la répétition.

**Phrase dite.** « Il croyait signer un message gratuit ; en réalité, cette signature laisse le site prendre ses USDC. Annuler marche tout de suite, Continuer attend dix secondes. »

**Référentiels.** NIST CSF 2.0 : Detect (DE.AE) et PR.AT, retenue côté Respond. ATT&CK : T1566 (phishing), T1657 (vol financier).

**Limite à connaître avant de jouer.** La scène envoie un permit dont la valeur est exactement 2^256-1. Les montants énormes mais différents (2^256-2, 2^255, 10^30) sortent en warn ou ok sur les 377 variantes EIP-2612 du fuzz (`research/titouan/T_banc_e2e/redteam/jury_fuzz_sig.md`) ; le détecteur par forme d'Adem n'est pas dans le build de la démo (absent des sources de `webdemo/BUILD_INFO.json`). Ne pas inviter un juré à saisir son propre montant. L'alerte du 11 oct. (« la scène héros sort toujours en warn ») portait sur ces variantes ; la scène de la démo est le cas sentinelle, vérifié Danger dans `RESULTATS.json`, à revérifier à l'écran.

**Si ça casse.**
- Page blanche ou fenêtre absente : F5, rejouer. Vérifier que la page est servie en HTTP.
- Niveau différent d'attendu (Attention au lieu de Danger) : le dire, garder l'écran, ouvrir le panneau technique, passer à la scène 2. Dire : « C'est un cas de nos limites, on l'ajoute au banc. »
- Rien ne repart après deux essais : lancer la vidéo de la scène 1 au timecode noté, sans commentaire improvisé.

### Scène 2. Le témoin : un envoi ordinaire passe sans alarme

**Histoire.** Camille paie 0,1 ETH à Paul, son contact habituel, depuis son appli de paiement, et rien d'anormal ne doit la ralentir.

**Clics.**
1. Liste de gauche : « Envoi simple » (« Mon appli de paiement (fictive) », « Envoyer 0,1 ETH à Paul »).
2. « Signer ». Question d'intention : cliquer « Payer quelqu'un ».
3. Verdict. Cliquer « Continuer quand même » (actif tout de suite).

**À l'écran.** Pastille « Aucun signal trouvé », phrase « Ce n'est pas une garantie : Hold up avertit et ralentit, il ne protège pas. », texte de la fiche F26 (« Cette opération envoie … à …, comme tu l'as dit. » puis « Notre vérification est limitée : elle peut rater un piège. »). Pas de rouge, pas de délai. Défaut connu : le jeton natif peut s'afficher « NATIVE » (`webdemo/limites.html`) ; le dire si ça arrive. Après « Continuer » : « Tu as choisi de continuer. Dans cette démo rien n'est signé ni envoyé… »

**Phrase dite.** « Aucun signal trouvé : pas de rouge, pas d'attente. Il y a quand même un écran, et il n'est jamais vert, parce que aucun signal ne veut pas dire sûr. »

**Ce que cette scène prouve, et ce qu'elle ne prouve pas.** Elle montre un cas. Elle ne mesure pas un taux : 23,1 % de fausses alertes critiques sur le seul jeu TEST ouvert (18/78, avant correctifs), 17,9 % (22/123) chez le juré faux positifs sur des opérations honnêtes Avalanche (`research/titouan/W_livrables/RESULTATS_A_JOUR.md` section B ; `coord/HANDOFF_ADEM_SESSION.md`). Ne pas dire « presque jamais dérangé » : aucune mesure ne le soutient. Ne pas laisser un juré tenter un listing Seaport, un mint NFT, du staking ou un 7702 honnête, qui sortent en critical ou en warn sur nos bancs.

**Référentiels.** NIST CSF 2.0 : Detect (DE.AE), le moteur n'a rien à signaler. Pas de technique ATT&CK : c'est le cas qui répond à la question des fausses alertes.

**Si ça casse.** Si la scène sort en Attention ou en Danger : « C'est une fausse alerte, on la compte. Notre taux mesuré est celui de la diapo, pas ce cas. » Si le juré répond « On m'a demandé de le faire » à la question d'intention, l'écran peut monter : c'est voulu, l'intention dit que quelqu'un dicte le geste. Plan B : vidéo de la scène 2.

### Scène 3. Adresse sosie : même envoi, autre adresse

**Histoire.** Camille copie l'adresse de Paul depuis son historique, mais un inconnu y a glissé un sosie : mêmes 4 premiers et 4 derniers caractères, milieu différent. Sur la C-Chain, une campagne d'empoisonnement d'adresse a volé 51 625,61 USDC d'août à décembre 2025 (source unique, non auditée ; 36 744 sont des adresses visées, pas des victimes ; `research/titouan/W_livrables/RESULTATS_A_JOUR.md` section A).

**Clics.**
1. Liste de gauche : « Adresse qui ressemble à la tienne » (même appli, « Envoyer 0,1 ETH à Paul (adresse collée depuis l'historique) »).
2. « Signer », puis « Payer quelqu'un » (même réponse qu'à la scène 2).
3. Verdict. Lire les deux adresses affichées l'une sous l'autre.
4. « Annuler ».

**À l'écran.** Pastille « Danger ». Bloc « Paul » (adresse du contact) et bloc « Adresse de la demande » (`0x13bac5ff…c5e7` contre `0x13baa571…c5e7` pour Paul). La démo web n'a pas de surlignage des caractères différents (il existe dans l'extension). Texte de la fiche « Une fausse adresse presque identique à celle de ton contact » (F13 attendue, à confirmer à l'écran). La scène est un sosie 4+4 : elle sort Danger que la règle 3+4 soit branchée ou non.

**Phrase dite.** « Même appli, même montant, même réponse. L'adresse vient de l'historique : c'est un sosie de Paul. Hold up affiche l'adresse de Paul et celle de la demande, l'une sous l'autre. »

**Référentiels.** NIST CSF 2.0 : Detect (DE.AE, DE.CM) et PR.AT. ATT&CK : T1656 (usurpation d'identité), T1657.

**À ne pas prétendre.** MetaMask bloque déjà le sosie 4+4 avec « jamais interagi » (`research/threat_coverage/07_concurrents_couverture.md`, source [V]) : cette scène ne nous distingue pas de MetaMask, elle montre le même cas dans notre format « Tu as dit / En réalité ». Le sosie 3+4 hors historique n'est pas démontré en live.

**Si ça casse.** Si l'écran sort sans la mention de Paul (contexte vide, l'onglet « Colle une transaction » n'a pas de contacts), revenir à l'onglet « Démo » et rejouer. Plan B : vidéo de la scène 3.

### Plan B : la vidéo

- Pas enregistrée à ce jour (T-281 `todo`). À enregistrer avant 12h00 avec cette page, scène par scène, trois fichiers courts plus un montage de 2 à 3 min (exigence de `context/notion_guide.md`). Noter le timecode de début de chaque scène sur la feuille du présentateur.
- Dire au jury que c'est un enregistrement de la même page. Ne pas la présenter comme du direct.
- Dernier recours si la vidéo ne s'ouvre pas : les quatre captures `research/titouan/T_banc_e2e/extension/tests/shots/` (`approve.png`, `lookalike.png`, `grill.png`, `unknown.png`). Elles montrent l'ancienne fenêtre nommée « Sentinelle », avec un moteur de test, un minuteur de 30 s : le dire.

### Scènes écartées

| Scène | Pourquoi on ne la joue pas |
|---|---|
| Faux support (`faux_support`) | Elle sort en Manipulation seulement avec la réponse « On m'a demandé de le faire ». Avec « Payer quelqu'un », elle sort en Aucun signal trouvé : la pression de la page n'est lue que si le moteur voit déjà un signal (`RESULTATS.json`, notes). Le classement du message collé par Clef ou Jev n'est pas branché. |
| Onglet « Colle une transaction » | Pas de contacts ni d'historique : le sosie n'est pas détecté. L'exemple « signature de permit » sort en Attention. |
| Drainer neuf déployé sur Fuji en direct | Contrats non déployés (`blockchain/DEPLOYMENTS.md` vide). |
| Essai avec un vrai MetaMask | Jamais fait. |
| Retenue de 10 minutes | Testée avec 2 s (`extension/COMPAT.md`). La démo web raccourcit à 30 s pour la Manipulation. |
| Droit illimité, tous les NFT, changement de propriétaire | Fonctionnent dans la démo (Danger attendu), redondants avec la scène 1. Réserve pour la Q&R. |
| Onglet « Journal » avec « Retoucher une ligne » | Pas une scène : 15 s utilisables en Q&R sur la question « pourquoi une chaîne » (chaîne de hachage locale, ligne retouchée détectée ; ancrage Fuji non fait). |

## 2. Script de 5 minutes (round 1)

Total : 300 s. Débit visé 130 mots par minute, soit environ 21 mots pour 10 s ; les segments de démo comptent aussi les secondes de clic. Nombres de mots comptés à la main sur les textes ci-dessous.

| Temps | Qui | Action à l'écran | Texte dit | Mots (≈) |
|---|---|---|---|---|
| 0:00 à 0:40 | T | Slide « problème » | « En 2025, 158 000 incidents ont touché des portefeuilles de particuliers, pour 713 millions de dollars (Chainalysis). Les drainers de signature en ont pris 83,85 millions à 106 106 victimes, 790 dollars en moyenne (Scam Sniffer). Dans ces vols, la victime signe elle-même : elle croit se connecter ou se faire rembourser, et la signature donne le droit de vider son solde. Après coup, presque rien ne revient : environ 2 % gelés sur un vol de 330 millions. » | 78 |
| 0:40 à 1:10 | T | Slide « solution » | « Hold up est une extension de navigateur. Elle retient la demande du site avant le portefeuille, demande ce que la personne veut faire, calcule ce que la demande fait vraiment, et affiche : Tu as dit X. En réalité, Y. Elle avertit et ralentit, elle ne bloque rien. Ce que vous allez voir : un faux site, un faux portefeuille, le moteur de l'extension dans la page, aucun réseau. » | 67 |
| 1:10 à 1:22 | A | Passer à la démo. Cliquer « Signature de permit piège » | « Scène 1. Un faux site de remboursement demande de signer pour se connecter. Le portefeuille ne montre aucun envoi. » | 19 |
| 1:22 à 1:34 | A | Clic « Signer », puis « Me connecter » | « Je signe. Hold up retient la demande avant le portefeuille et pose la question. Je réponds : me connecter. » | 18 |
| 1:34 à 1:48 | A | Verdict Danger à l'écran, silence de 3 s pour lire | « Danger. Il croyait signer un message gratuit. En réalité, cette signature laisse le site prendre ses USDC, sans limite de durée. » | 21 |
| 1:48 à 2:00 | A | Ouvrir « Ce que le moteur a vu », viser « Continuer » grisé, cliquer « Annuler » | « Le moteur a décodé un droit de dépense, pas une connexion. Continuer reste grisé dix secondes, Annuler marche tout de suite. Rien n'a atteint le portefeuille. » | 26 |
| 2:00 à 2:30 | A | Clic « Envoi simple », « Signer », « Payer quelqu'un », « Continuer quand même » | « Scène 2, le témoin. Même appli de paiement : 0,1 ETH à Paul, un contact connu. Je réponds : payer quelqu'un. Aucun signal trouvé. Pas de rouge, pas d'attente. Il y a quand même un écran, jamais vert : aucun signal ne veut pas dire sûr. » | 44 |
| 2:30 à 3:10 | A | Clic « Adresse qui ressemble à la tienne », « Signer », « Payer quelqu'un », lire les deux adresses, « Annuler » | « Scène 3. Même appli, même montant, même réponse. L'adresse vient de l'historique : un inconnu y a glissé un sosie de Paul, mêmes 4 premiers et 4 derniers caractères. Danger. Hold up affiche l'adresse de Paul et celle de la demande, l'une sous l'autre. Sur la C-Chain, une campagne d'empoisonnement a volé 51 625 USDC d'août à décembre 2025. Source unique, non auditée. » | 62 |
| 3:10 à 3:50 | A | Slide « mapping et chiffres » | « Référentiels : NIST CSF 2.0, Detect (DE.AE, DE.CM) et PR.AT, plus la retenue côté Respond ; ATT&CK T1566, T1656, T1657. Les chiffres, avec leur jeu : sur le seul jeu de test ouvert, avant correctifs, 94,5 % des attaques signalées, 104 sur 110, et 23,1 % de fausses alertes critiques, 18 sur 78. Sur le jeu de réglage, 252 sur 252 et 0 sur 90 : de la non-régression, pas de la robustesse. Le jeu aveugle de 2 498 cas est à mesurer. » | 80 |
| 3:50 à 4:20 | T | Slide « limites » | « Ce qu'on ne couvre pas : l'envoi depuis le bouton du portefeuille, le mobile, et la fraude conforme, où la victime envoie volontairement. L'extension n'a jamais tourné avec un vrai MetaMask, et la retenue de dix minutes n'a été testée que sur deux secondes. Les modèles Clef et Jev ne sont pas branchés, la démo n'en dépend pas. » | 57 |
| 4:20 à 5:00 | T | Slide « pourquoi nous, qui paie, ce qu'on cherche » | « Pourquoi nous : deux ingénieurs, un outil qui tourne. 447 tests du moteur passent, et 64 tests d'extension sur 66, avec un portefeuille simulé : ça valide la plomberie, pas la détection. Qui paie : l'hypothèse est un wallet ou un exchange qui l'intègre. Il n'y a ni client ni prix aujourd'hui. Ce qu'on cherche : un portefeuille partenaire pour l'essai réel, et vos attaques pendant les questions. » | 64 |

Marge : aucune. Si la démo prend plus de 3:10, couper dans l'ordre : la phrase C-Chain de la scène 3, le panneau technique de la scène 1, la ligne « pourquoi nous ».

Q&R de 2 min : A répond sur le banc, les trous du red team, MV3 et l'usurpation d'interface ; T répond sur les chiffres de la fiche, la démo web, le test avec un vrai MetaMask et le modèle économique.

## 3. Script de 3 minutes (finale)

Total : 180 s. Deux scènes jouées sur trois : scène 1 en entier, scènes 2 et 3 en paire (même envoi, deux adresses).

| Temps | Qui | Action à l'écran | Texte dit | Mots (≈) |
|---|---|---|---|---|
| 0:00 à 0:25 | T | Slide « problème » | « En 2025, les drainers de signature ont pris 83,85 millions de dollars à 106 106 victimes, 790 dollars en moyenne (Scam Sniffer). La victime signe elle-même : elle croit se connecter ou se faire rembourser. Après coup, environ 2 % seulement sont gelés sur un vol de 330 millions. » | 49 |
| 0:25 à 0:48 | T | Slide « solution » | « Hold up retient la demande avant le portefeuille, demande ce que la personne veut faire, calcule ce que la demande fait, et affiche : Tu as dit X. En réalité, Y. Il avertit et ralentit, il ne bloque rien. Démo : faux site, faux portefeuille, aucun réseau. » | 47 |
| 0:48 à 1:30 | A | « Signature de permit piège », « Signer », « Me connecter », ouvrir le panneau technique, « Annuler » | « Un faux site de remboursement demande de signer pour se connecter. Danger. Il croyait signer un message gratuit ; en réalité, le site pourrait prendre ses USDC sans limite de durée. Le moteur a décodé un droit de dépense, pas une connexion. Annuler marche tout de suite, Continuer attend dix secondes. » | 50 |
| 1:30 à 2:15 | A | « Envoi simple », « Signer », « Payer quelqu'un », « Continuer » ; puis « Adresse qui ressemble à la tienne », « Signer », « Payer quelqu'un », « Annuler » | « Même appli, 0,1 ETH à Paul, un contact connu. Aucun signal trouvé : pas de rouge, pas d'attente, et jamais de vert. Même envoi, mais l'adresse vient de l'historique : un sosie de Paul, mêmes 4 premiers et 4 derniers caractères. Danger. Les deux adresses sont l'une sous l'autre. » | 48 |
| 2:15 à 2:36 | A | Slide « mapping et chiffres » | « NIST CSF 2.0 : Detect et PR.AT ; ATT&CK T1566, T1656, T1657. Sur le seul jeu de test ouvert, avant correctifs : 94,5 % des attaques signalées, 23,1 % de fausses alertes critiques. Le jeu aveugle de 2 498 cas est à mesurer. » | 42 |
| 2:36 à 2:48 | T | Slide « limites » | « Non couverts : le bouton Envoyer du wallet, le mobile, la fraude conforme. Jamais testé avec un vrai MetaMask. » | 18 |
| 2:48 à 3:00 | T | Slide « ce qu'on cherche » | « Qui paie : un wallet ou un exchange partenaire, hypothèse, ni client ni prix aujourd'hui. On cherche un portefeuille pour l'essai réel. Attaquez-nous pendant les questions. » | 25 |

Q&R de 3 min : mêmes répartitions qu'au round 1. En finale, le grand jury reprend sans doute la question des fausses alertes : la réponse 1 de la section 4 est celle à avoir en tête.

## 4. Les 12 questions les plus probables du jury

Chaque réponse tient en deux phrases. Les jeux : DEV = jeu de réglage des règles ; TEST = jeu ouvert une fois (R003), avant les 10 correctifs ; V2_TEST = jeu aveugle gelé, SHA-256 publié avant tout run. Les chiffres viennent de `research/titouan/W_livrables/RESULTATS_A_JOUR.md`, `pitch/JURY_ATTAQUES.md` et `coord/HANDOFF_ADEM_SESSION.md`.

**Q1. Vos faux positifs ?** (répond T)
R. Sur le seul jeu TEST ouvert, 23,1 % de fausses alertes critiques [15,1 ; 33,6] (18/78, avant correctifs) ; sur DEV après correctifs 0/90, mais DEV a servi au réglage. Le juré faux positifs en trouve 22 sur 123 opérations honnêtes Avalanche (17,9 %), et le chiffre du jeu aveugle V2 est à mesurer.

**Q2. Un attaquant passe par une prise de contrôle ou par un protocole connu : vous le voyez ?** (répond A)
R. Pas toujours : les prises de contrôle sont reconnues par une liste de sélecteurs, donc `nominateNewOwner` ou `setImplementation` sortent en warn et non en critical (environ 26 200 contournements sur 38 251 cas du fuzz de contrôle), alors que `transferOwnership`, `upgradeTo` et `grantRole` tiennent. La liste blanche des routeurs compare l'adresse exacte, et le contrôle de sosie n'est pas appliqué au spender : à mesurer.

**Q3. Le service worker MV3 meurt vers 5 minutes : votre retenue de 10 minutes survit ?** (répond A)
R. Probablement pas : la retenue n'a été testée qu'avec 2 s, et l'attendu est un échec fermé (erreur 4900, le portefeuille ne s'ouvre jamais), à vérifier au scénario S13 de l'essai réel. Le correctif (stockage et alarme) n'est pas construit, et la démo web raccourcit la retenue à 30 s.

**Q4. Une page hostile peut imiter ou recouvrir votre fenêtre ?** (répond A)
R. Oui : la fenêtre vit dans la page, donc une page peut la recouvrir ou en dessiner une fausse. Hold up n'affiche jamais de vert, donc un écran vert est un faux ; la parade solide, une fenêtre d'extension séparée (side panel), n'est pas construite.

**Q5. Pourquoi une blockchain dans ce produit ?** (répond T)
R. La détection n'en a pas besoin. La chaîne sert à la preuve : un journal chaîné par hachage existe en local (une ligne retouchée est détectée), mais l'ancrage de sa racine sur Fuji n'est pas fait, et `blockchain/DEPLOYMENTS.md` n'a aucune adresse.

**Q6. Pourquoi pas Blockaid, Pocket Universe, Wallet Guard ou les alertes de MetaMask ?** (répond T)
R. Ils jugent la transaction contre des menaces connues ou affichent une simulation ; nous n'avons trouvé aucun outil grand public qui demande l'intention avant de comparer, d'après une recherche non exhaustive, et l'idée a une antériorité (Vitalik Buterin, 22 fév. 2026). Nous n'avons pas mesuré ces outils sur notre banc, donc aucun chiffre comparatif, et MetaMask bloque déjà le sosie 4+4 : notre scène 3 ne nous en distingue pas.

**Q7. Clef et Jev : branchés ou décoratifs ?** (répond A)
R. Pas branchés : aucune clé dans l'environnement, aucun appel dans la chaîne, et le classement du message collé n'est pas relié au banc (le juré social fait passer un faux support classique en ok). La démo n'en dépend pas ; le modèle n'entre dans le pitch que s'il bat les mots-clés avec un chiffre, à mesurer.

**Q8. Vos 100 % et vos 94,5 %, de quel jeu ?** (répond T)
R. Les 252/252 et 0/90 viennent de DEV, réglé par nous : ils mesurent la non-régression. Le seul jeu hors réglage ouvert est TEST (94,5 % des attaques signalées, 104/110, et 23,1 % de fausses alertes critiques, avant correctifs) ; le jeu aveugle v1 (150 cas) et V2_TEST (2 498 cas) sont à mesurer.

**Q9. Ça marche avec un vrai MetaMask ou Core ?** (répond T)
R. Non testé : 64 PASS sur 66 avec un portefeuille simulé sur Chrome 154 et Edge 155, et la version autonome n'a pas été chargée dans un vrai Chrome à la dernière mise à jour de son guide. Un protocole de 14 scénarios est écrit, à jouer à la main ; MetaMask enveloppe déjà `request`, effet inconnu.

**Q10. Je signe un permit avec un montant légèrement différent du maximum.** (répond A)
R. La scène joue la valeur sentinelle 2^256-1 (Danger) ; les montants énormes mais différents sortent en warn ou ok sur les 377 variantes EIP-2612 du fuzz. Un détecteur par forme existe côté red team, il n'est pas dans le build de la démo, et son gain est à mesurer.

**Q11. Les gens ne passent-ils pas outre vos avertissements ?** (répond T)
R. Aucune mesure sur des personnes : le temps de décision est journalisé, sans valeur. Les seuls chiffres sont de laboratoire, non revérifiés ici et sans lien avec Hold up : annulation de 1,3 % sans avertissement, 32,9 % avec un délai de 5 s, 48,6 % avec un geste actif sur le spender (`research/titouan/U_segment/U3_efficacite_interventions.md`).

**Q12. La démo est sur un Ethereum fictif : où est Avalanche ?** (répond T)
R. Exact : la démo web simule la chaîne 0x1, aucun contrat de démo n'est listé sur Fuji et rien n'est ancré. Sur la C-Chain réelle, le filet v0 (5 règles, sans intention) alerte sur 0,28 % [0,18 ; 0,45] de 6 325 transactions présumées légitimes, et la menace documentée est l'empoisonnement d'adresse (51 625,61 USDC, source unique).

Questions qui reviendront aussi, avec la réponse déjà écrite dans `pitch/JURY_ATTAQUES.md` : la fraude conforme (3 cas sur 24 passent sans alerte sur DEV, même avec l'intention), les ordres Seaport honnêtes, le honeypot (0 sur 5 sur TEST), « si votre modèle se trompe, qui est responsable ».

Règles pendant les questions : si une attaque proposée passe, le dire tout de suite (« raté, c'est le cas n° X de nos limites ») puis l'ajouter au banc devant le jury. Ne pas improviser un chiffre : si la réponse est absente de ce fichier, dire « à mesurer ».

## 5. Chiffres utilisés et leur source

| Chiffre | Valeur | Jeu ou statut | Source |
|---|---|---|---|
| Vols sur wallets personnels, 2025 | 158 000 incidents, 713 M$ | externe, Chainalysis | `docs/BRIEF_direction.md` section 3 |
| Drainers de signature, 2025 | 83,85 M$, 106 106 victimes, 790 $ en moyenne | externe, Scam Sniffer | `docs/BRIEF_direction.md` section 3 |
| Fonds gelés après coup | environ 2 % de 330 M$ | externe, vol par faux support d'avril 2025 | `docs/BRIEF_direction.md` section 3 (N4) |
| Empoisonnement d'adresse sur la C-Chain | 51 625,61 USDC volés, 36 744 adresses visées, août à déc. 2025 | externe, source unique, non auditée | `research/titouan/W_livrables/RESULTATS_A_JOUR.md` section A |
| Rappel, TEST ouvert une fois | 94,5 % [88,6 ; 97,5] (104/110) | synthétique, avant correctifs, non rouvert | `research/titouan/T_banc_e2e/COUVERTURE.md` |
| Fausses alertes critical, TEST | 23,1 % [15,1 ; 33,6] (18/78) | idem | idem |
| DEV après correctifs | rappel 252/252, fausses alertes critical 0/90 | réglage, pas de la robustesse | `coord/INBOX.md` (AMELIORATION-DEV), `RESULTATS_A_JOUR.md` section E |
| Jeu aveugle V2_TEST | 2 498 cas, résultat à mesurer | gelé, SHA-256 `ab2aa0b4…393c` | `coord/INBOX.md` MSG-052 |
| Juré faux positifs | 22 sur 123 opérations honnêtes Avalanche (17,9 %) | cas synthétiques d'un agent red team | `coord/HANDOFF_ADEM_SESSION.md` |
| Fuzz contrôle | environ 26 200 contournements sur 38 251 cas | red team synthétique | `coord/HANDOFF_ADEM_SESSION.md` |
| Fuzz signatures, EIP-2612 | 377 variantes sur 377 en warn ou ok | red team synthétique | `research/titouan/T_banc_e2e/redteam/jury_fuzz_sig.md` |
| Tests moteur, extension | 447 sur 447 ; 64 PASS sur 66 (2 LIMITE) | valident le code et la plomberie, pas la détection | `RESULTATS_A_JOUR.md` section B |
| Filet v0 sur la C-Chain réelle | 0,28 % [0,18 ; 0,45] sur 6 325 tx | trafic présumé légitime, sans intention | `RESULTATS_A_JOUR.md` section A |
| Fraude conforme sur DEV | 3 cas sur 24 passent sans alerte | synthétique | `pitch/JURY_ATTAQUES.md` Q3 du juré 1 |
| Effet d'un avertissement | 1,3 % ; 32,9 % ; 48,6 % d'annulation | littérature de laboratoire, non revérifiée | `RESULTATS_A_JOUR.md` section D |
| Latence du verdict | médiane 25,94 ms, p95 38,73 ms (400 requêtes) | serveur local, synthétique, sans RPC ni modèle | `RESULTATS_A_JOUR.md` section C |
| Retenue de 10 minutes, temps de décision d'un humain, détection sur Fuji | à mesurer | non mesurés | `RESULTATS_A_JOUR.md` section C |

## 6. Ce qu'il faut couper du récit, faute de preuve

| À couper | Pourquoi | À dire à la place |
|---|---|---|
| « Bloque », « protège », « FN = 0 », « premier » | Hold up avertit et ralentit ; FN = 0 est une cible, pas un résultat ; l'intention a des antériorités (Buterin, Blockaid, prototypes de hackathon) | « avertit et ralentit », « à notre connaissance, aucun outil grand public ne pose la question de l'intention » |
| Les 100 % de DEV cités seuls | Réglage sur le même jeu | Les deux colonnes : DEV (non-régression) et TEST (94,5 % et 23,1 %) |
| « Peu de faux positifs », « presque jamais dérangé » | 23,1 % sur TEST, 17,9 % chez le juré faux positifs, rien de mesuré sur du vrai trafic avec l'intention | Le chiffre TEST, et la scène 2 comme un cas |
| Clef ou Jev comprennent le message collé | Non branchés, ablation non mesurée | « Le modèle ne peut qu'aggraver ; il n'est pas branché dans la démo » |
| Drainer neuf déployé en direct sur Fuji | Contrats non listés | « Démo fictive dans la page, sur une chaîne simulée » |
| Fonctionne avec MetaMask ou Core | Jamais testé | « Portefeuille simulé, essai réel à faire » |
| Retenue de 10 minutes qui tient | Testée avec 2 s, service worker MV3 | « 10 minutes est la cible, 30 s dans la démo » |
| Journal ancré sur Fuji, preuve pour l'assureur | Ancrage non livré | « Chaîne de hachage locale ; l'ancrage est la prochaine étape » |
| Compréhension des écrans, effet sur les utilisateurs | Tests v1 et v2 faits avec des personas simulés ; aucune personne ; les chiffres de laboratoire ne mesurent pas Hold up | Aucun taux de compréhension ; la littérature, citée comme telle |
| Fraude conforme (faux conseiller, pig butchering) « arrêtée » | La victime envoie volontairement ; 3 cas sur 24 passent sur DEV | La lister dans les limites |
| Honeypot, faux token, 7702 sur Avalanche | Honeypot et faux token ratés (0 sur 5 sur TEST) ; 7702 inactif sur la C-Chain (ACP-209 proposé) | Les mettre dans les limites, aucun chiffre 7702 dans un discours Avalanche |
| Envoi depuis le bouton du wallet, mobile, WalletConnect | Hors du chemin de l'extension | Les lister dans les limites |
| Anciens chiffres 80,4 %, 81,9 %, 99 %, 89,3 % du filet | Retirés : des révocations comptées comme des droits | 24 sur 33 = 72,7 % [55,8 ; 84,9], Ethereum, n = 33, filet v0 |
| Taille du marché, revenus, prix | Aucun client, aucun témoignage, aucun modèle abouti dans le repo | « Hypothèse : un wallet ou un exchange l'intègre » |
| Latence « 39 ms de Clef » | Chiffre du fournisseur, un tiers a mesuré 191 à 205 ms ; notre bout en bout est à mesurer | Ne pas citer |
