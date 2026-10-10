# OB - Snaps MetaMask et efficacité des avertissements (barrière d'intention avant signature)

Date de recherche : 2026-10-11. Méthode : WebSearch/WebFetch uniquement. Aucun secret lu ou recopié.

Étiquettes : **[P]** = documentation officielle MetaMask (ou source primaire : article/rapport d'origine) ; **[S]** = source secondaire (presse, blog, résumé) ; **[V]** = à vérifier / déduction ou test à faire. "Non trouvé" = absent des pages consultées.

Limite : WebFetch résume les pages via un petit modèle ; les formulations ci-dessous sont des paraphrases de ces résumés. Vérifier les points critiques sur la page source avant de s'y engager.

---

## 1. Snaps MetaMask

### 1.1 onTransaction (transaction insights)
- [P] Permission `endowment:transaction-insight`. Appelé quand l'utilisateur soumet une transaction depuis l'extension MetaMask. Reçoit : `transaction` (payload brut non signé), `chainId` (format CAIP-2 ; pour EVM, la référence est un entier base 10), `transactionOrigin` (seulement si `allowTransactionOrigin: true`, défaut `false`). (docs.metamask.io/snaps/reference/entry-points/, /features/transaction-insights/, /reference/permissions/)
- [P] Retour : `content` (UI affichée dans l'onglet "Snap" de la fenêtre de confirmation) ou `id` d'une interface créée par `snap_createInterface`. Option `severity`.
- [P] Accès décrit comme "lecture seule" du payload brut avant signature. Le décodage (calldata, ABI) n'est pas fourni par MetaMask : le Snap reçoit le payload brut et doit décoder lui-même. [V] (déduction : la doc ne mentionne aucun décodeur intégré).
- [P] Le handler ne s'exécute que pour les transactions soumises via l'extension MetaMask.

### 1.2 onSignature (signature insights)
- [P] Permission `endowment:signature-insight`, option `allowSignatureOrigin` (défaut `false`). Entrée `signature` avec `from`, `data`, `signatureMethod` ; `signatureOrigin` si autorisé.
- [P] Méthodes prises en charge (Ethereum et compatibles) : `personal_sign`, `eth_sign`, `eth_signTypedData`, `eth_signTypedData_v3`, `eth_signTypedData_v4`. Donc **oui, l'EIP-712 et les permits (typed data v4) passent par onSignature** ; le Snap doit lire `signatureMethod` et décoder `data` selon la méthode. Aucune mention spécifique de "permit" ou Permit2 dans la doc : [V] à tester avec un permit réel.
- [P] Retour : `null` (rien à montrer) ou `{ content, severity? }`.
- [P] Limite de l'UI de signature : le contenu n'est affiché que si `severity` est `SeverityLevel.Critical` ; dans ce cas il apparaît dans une modale **après** que l'utilisateur a cliqué sur "Sign". Sans severity critical, un insight de signature n'est donc pas montré.
- [P] `endowment:signature-insight` n'est pas listée comme acceptant le caveat `maxRequestTime` (à la différence de `transaction-insight`).

### 1.3 severity "critical" : Flask ou stable ?
- [P] Pour `onTransaction` : la page transaction-insights marque `severity: "critical"` comme **expérimental et disponible uniquement dans MetaMask Flask**. Effet : une modale d'avertissement que l'utilisateur doit franchir avant de confirmer.
- [P] Pour `onSignature` : les pages consultées n'affichent pas de mention "Flask uniquement". Le statut stable n'est **pas confirmé** : non trouvé. [V] tester sur MetaMask stable ; consulter release notes / changelog du dépôt MetaMask/snaps.
- [S] SIP-11 (github.com/MetaMask/SIPs, sip-11.md) : statut Draft (2023). Champ `severity` optionnel, seul niveau défini `critical`. La modale "exigera de cocher une case avant de poursuivre".

### 1.4 Afficher vs bloquer
- [P] Aucune page consultée ne décrit un mécanisme permettant à un Snap de **refuser/bloquer** une transaction ou signature. Les insights sont en lecture seule et additifs.
- [S/V] Avec severity critical, le mécanisme est de la **friction** (modale + case à cocher d'après SIP-11) : l'utilisateur peut passer outre. Conclusion : un Snap ne peut pas empêcher la signature ; il informe et ajoute de la friction (friction forte en onTransaction seulement en Flask). Pas de "reject" documenté.
- Conséquence : aucun moyen documenté de rendre obligatoire une réponse du Snap avant que MetaMask n'autorise la signature.

### 1.5 UI interactive, dialogues, home
- [P] Composants Snaps UI (JSX) : Box, Section, Container, Footer, Divider, Card, Row, Value, Heading, Text, Bold, Italic, Link, Icon, Image, Address, Avatar, Copyable, Banner, Spinner, Skeleton, Tooltip, Button, Form, Field, Input (text/number/password), Checkbox, Dropdown, RadioGroup, Selector, FileInput. JSX seulement en `.jsx/.tsx`, extension / Flask 12+. Liens `https:`, `mailto:`, `metamask:` seulement (pas `http:`). Image = SVG inline seulement. `snap_createInterface`, `snap_getInterfaceState`, `snap_updateInterface` n'exigent pas de permission manifest. (features/custom-ui/)
- [P] `onUserInput` : reçoit `id`, `event` (`ButtonClickEvent`, `FormSubmitEvent`, `InputChangeEvent`, `FileInputEvent`) et `context`. Permet formulaires et champ de saisie libre (ex. "pourquoi faites-vous cette transaction ?"). [V] la doc consultée ne montre pas d'exemple explicite d'UI interactive dans l'onglet d'une transaction ; à tester.
- [P] `snap_dialog` (permission `"snap_dialog": {}`) : types `alert` (acquittement), `confirmation` (true/false), `prompt` (champ texte, renvoie une chaîne), et "custom" (Footer + `snap_resolveInterface` depuis `onUserInput`). Ne fonctionne pas si MetaMask est verrouillé. (features/custom-ui/dialogs)
- [V] Peut-on appeler `snap_dialog` depuis `onTransaction` ? La doc consultée ne le dit pas : non trouvé. À tester.
- [P] `onHomePage` : permission `endowment:page-home`, appelé quand l'utilisateur ouvre le Snap depuis le menu Snaps ; retourne `content` ou `id`. Accepte `maxRequestTime`.
- [P] `snap_notify` et `endowment:cronjob` sont des permissions "ouvertes" (installables sans allowlist). (get-allowlisted)

### 1.6 Persistance (snap_manageState)
- [P] Permission `"snap_manageState": {}`. Opérations `get`, `update`, `clear`. Chiffré par défaut (clé propre au Snap) ; `encrypted: false` possible pour données non sensibles accessibles même MetaMask verrouillé. Jusqu'à 100 Mo sur disque. Données propres à l'instance MetaMask mais partagées entre dapps. L'état chiffré exige MetaMask déverrouillé. (features/data-storage)
- Utilité : mémoriser l'intention déclarée, un journal local, des seuils personnalisés.

### 1.7 Réseau (endowment:network-access)
- [P] Expose `fetch` global. Le Snap tourne dans une iframe sandboxée : l'en-tête `Origin` envoyé est `null`. Le serveur doit répondre `Access-Control-Allow-Origin: *` (ou `null`), sinon prévoir un proxy. `XMLHttpRequest` indisponible. (features/network-access)
- Localhost / HTTP en dev : **non trouvé** dans la doc officielle consultée (aucune règle explicite) ; une recherche n'a trouvé aucune règle interdisant `http://localhost`. [V] Hypothèse : possible si le serveur local envoie les bons en-têtes CORS ; à tester (blocage mixed-content/CSP non documenté).
- [P] Bonnes pratiques : demander cette permission seulement si nécessaire, informer l'utilisateur, fournir une politique de confidentialité (concepts/security-guidelines).

### 1.8 Limites d'exécution
- [P] Délai par défaut 60 000 ms ; caveat `maxRequestTime` de 5 000 à 180 000 ms, accepté par cronjob, keyring, lifecycle-hooks, name-lookup, page-home, rpc, transaction-insight. (reference/permissions)
- Mémoire : **non trouvé** (la page "execution environment" ne donne ni limite mémoire ni durée d'inactivité). Environnement SES / Hardened JS, sans DOM ni modules Node ; polyfills pour certains modules.
- [V] Une UI interactive avec saisie dans onTransaction peut se heurter au délai de 60 s ; prévoir `maxRequestTime` ou une UI asynchrone via `onUserInput`.

### 1.9 Réseaux supportés / Avalanche Fuji (43113)
- [P] La doc dit seulement que le handler reçoit le `chainId` (CAIP-2, EVM = base 10). Aucune liste de chaînes supportées.
- Fuji / 43113 : **non trouvé**. [V] Le déclenchement sur un réseau personnalisé ajouté à MetaMask n'est pas documenté. Le chainId attendu serait `eip155:43113` (0xa869). À tester dans Flask sur Fuji. Aucune source ne dit que les réseaux personnalisés sont exclus.

### 1.10 Distribution et installation
- [P] Permissions "ouvertes" (ex. `snap_dialog`, `snap_notify`, `endowment:cronjob`) : installables sans allowlist. Permissions "protégées" (toute autre) : allowlist requise ; tant que non allowlisté, seuls les Snaps revus par MetaMask s'installent sur l'extension standard. [V] La page ne liste pas explicitement `transaction-insight`, `signature-insight`, `network-access` comme protégées ; la règle est "toute permission non ouverte". (how-to/get-allowlisted)
- [P] Audit tiers exigé uniquement si le Snap utilise `snap_getBip32Entropy`, `snap_getBip32PublicKey`, `snap_getBip44Entropy`, `snap_getEntropy` ou `snap_manageAccounts`. Un Snap d'insight sans ces méthodes n'a donc pas d'audit obligatoire d'après cette page.
- [P] Prérequis allowlist : code public, publié sur npm, retrait des console.log, scan Snapper, formulaire Snaps Directory, revue (au moins deux approbations). Chaque nouvelle version npm doit être re-soumise.
- [P] En développement, MetaMask Flask est requis pour la dapp ; Flask est la build canary de développement.
- [P] Installation : Snaps Directory (snaps.metamask.io) pour les Snaps allowlistés, ou via une dapp compagnon qui déclenche l'installation.
- Pour une démo hackathon : Flask (dev) est la voie réaliste ; la stable exige l'allowlist. [V]

### 1.11 Capter l'intention AVANT la transaction : options avec Snaps
1. **Écran home (onHomePage)** : formulaire "Que comptez-vous faire ?" rempli à l'avance, stocké via snap_manageState ; onTransaction compare ensuite la transaction à l'intention déclarée. Faible friction, mais dépend de l'utilisateur qui ouvre spontanément le Snap (pas d'événement déclencheur). [V]
2. **Notification (snap_notify)** : aucun déclencheur lié à la transaction ; rappel seulement. Non documenté comme barrière.
3. **UI interactive dans onTransaction** (`id` + `onUserInput`) : champ de saisie dans l'onglet Snap de la confirmation. Moment juste-à-temps, mais rien de documenté ne force MetaMask à attendre la réponse avant d'autoriser Confirmer ; l'utilisateur peut ignorer l'onglet. [V]
4. **snap_dialog** : bloque l'exécution du Snap tant que l'utilisateur répond, pas la confirmation MetaMask ; usage depuis onTransaction non documenté. [V]
5. **Page web compagnon** : recueille l'intention avant que la dapp cible lance `eth_sendTransaction` et la transmet au Snap via RPC (`endowment:rpc`, état partagé). Seule option qui précède réellement la fenêtre MetaMask. [V] (déduction d'architecture ; l'API `endowment:rpc` n'a pas été relue en détail).

---

## 2. Fatigue d'avertissement et efficacité

Valeurs issues de résumés web ; les articles originaux n'ont pas été relus en entier sauf indication.

- **Akhawe & Felt (USENIX Security 2013, "Alice in Warningland")** [P/S] : télémétrie, plus de 25 millions d'impressions. Clic-through des avertissements SSL : 70,2 % Chrome, 33,0 % Firefox ; malware/phishing : environ 9 à 23 %. Écart attribué au design (bypass en 1 clic vs 3, ton plus ferme, image, vocabulaire "untrusted"). [S] Suite CHI 2018 (Reeder, Felt et al.) : après refonte, jusqu'à 70 % des utilisateurs suivent l'avertissement HTTPS de Chrome.
- **Egelman, Cranor, Hong (CHI 2008)** [S] : 60 participants ; 97 % ont cédé à au moins un hameçonnage. Avertissements actifs suivis par 79 % ; indicateur passif efficace pour un seul participant. Conclusion : interrompre la tâche et donner des options claires.
- **Anderson, Vance et al. (fMRI) et Vance, Jenkins et al. (MIS Quarterly 2018, "Tuning Out Security Warnings")** [S] : l'exposition répétée réduit fortement l'activité visuelle cérébrale (chute dès la 2e exposition d'après la presse) ; l'attention décline sur une semaine et récupère partiellement entre les jours. Avertissements "polymorphes" (apparence variable, 4 variantes suffisent d'après un résumé) : moins d'habituation ; test terrain de 3 semaines : adhésion qui baisse moins qu'avec un avertissement standard. Tailles d'effet non trouvées. Le titre de presse "ne les perçoit même pas" est jugé exagéré par la source consultée.
- **Bravo-Lillo et al. (SOUPS 2013/2014, "attractors")** [S] : des attracteurs "inhibiteurs" (retardent l'action ou forcent à interagir avec le texte clé) rendent les participants 2 à 3 fois plus susceptibles de décider en connaissance de cause ; sans attracteur, l'habituation divise par 3 la proportion de participants qui remarquent un changement de message. Les attracteurs forçant l'interaction avec le champ de texte n'ont pas montré de baisse avec l'habituation. Pertinent pour "reprendre les mots de l'utilisateur" et "friction".
- **OBIE / Open Banking, expériences randomisées (février 2021, analyse préliminaire, ~8 600 participants analysés sur 10 000 visés)** [P] : groupe témoin : 22 % réalisent un paiement frauduleux. Boutons d'appel à l'action (annuler, mettre de côté, appeler la banque) : -12 points ; CTA + texte comportemental (aversion à la perte) : -14 points ; approche basée sur le risque + CTA : -18 points (4 % tombent dans la fraude). Texte comportemental seul : -4 points ; approche basée sur le risque seule : effet non significatif sur la fraude (mais +8 points de paiements légitimes complétés). Effet secondaire : les CTA réduisent aussi les paiements légitimes (-14 points). Scénario d'achat Facebook Marketplace : jusqu'à -26 points. Laboratoire, scénarios hypothétiques à incitations monétaires fictives ; les auteurs notent que les effets réels peuvent différer.
- **Akesson, Gathergood, Quispe-Torreblanca (Nottingham, discussion paper 2023-08)** [S, résumé] : dans une appli bancaire expérimentale, des appels à l'action redessinés réduisent "dramatiquement" le succès de la fraude ; les avertissements comportementaux ou basés sur le risque traditionnels ont des effets bien plus faibles. Tailles d'effet : non trouvées (seul le résumé lu).
- **PSR, "Using Behavioural Economics to Understand and Prevent APP Fraud" (octobre 2025)** [P] : risque de "fatigue cognitive et mémoire musculaire" si on avertit trop ; recommande ciblage par risque (bénéficiaire, motif du paiement, montant), avertissements "juste à temps" selon le contexte, prise en compte de l'hétérogénéité des clients ; les victimes peuvent être déjà engagées au moment du paiement ("douleur de payer"). Rapport surtout conceptuel sur ces points.
- **UK Finance / Thinks Insight, "Effective Warnings Toolkit" (mai 2024)** [S] : un avertissement unique ne suffit plus ; personnaliser selon client, type de paiement et canal ; renouveler régulièrement ; rompre le style habituel (sinon "papier peint") ; des questions spécifiques ou personnelles créent une pause (les fraudeurs coachent les victimes). Aucun effet mesuré publié.
- **Which? (psychologie des arnaques, 20 entretiens)** [S] : les fraudeurs créent l'urgence et coachent les victimes pour contourner les avertissements de la banque.
- Enquêtes [S, non causales] : Tunic Pay/Opinium (2 000 adultes UK) : 33 % lisent les avertissements ; 75 % jugent inefficace un retard de paiement jusqu'à 72 h (opinion déclarée). Cash App (auto-déclaré) : près de 50 % des paiements abandonnés après avertissement.

Synthèse [V, ma lecture] : les effets les plus nets viennent de (a) l'interruption active plutôt que passive, (b) la friction ciblée forçant l'interaction avec l'information clé, (c) le ciblage par risque pour limiter l'habituation, (d) des actions simples d'annulation. L'effet isolé d'un avertissement "reprenant les mots de l'utilisateur" n'a pas été retrouvé comme mesure : non trouvé.

---

## 3. Exemples bancaires

- **Confirmation of Payee (CoP), Royaume-Uni** [S] : Pay.UK annonce 2 milliards de vérifications (mars 2024) ; le PSR a imposé l'extension à environ 400 PSP (échéance 31 octobre 2024, Specific Direction 17). Pay.UK cite une baisse de 2 % de la fraude totale et 1 % de l'APP au S1 2023, attribuée à l'ensemble des mesures et non à CoP seul. Aucune évaluation avant/après isolant CoP trouvée. La décision reste à l'expéditeur après un "no match".
  - Enquête commanditée par Lloyds [S] : environ 8 % des adultes ont poursuivi un virement malgré un nom non concordant ; 24 % reconnaîtraient un "no match" comme signal d'arnaque. Lloyds : transactions vers des entreprises sans CoP jusqu'à 100 fois plus souvent signalées frauduleuses. Statistique officielle "proceed after mismatch" : non trouvée.
  - OBIE expérience 2 [P] : CoP côté appli PISP plutôt que banque : environ +6 points de chute dans la fraude (variante 2) ; scinder les responsabilités semble défavorable. Échantillon partiel (~1 478 sur 3 000).
  - Limites de CoP [S] : n'aide pas contre les arnaques d'achat (le bénéficiaire existe) ni les fraudeurs utilisant un vrai nom.
- **Régime de remboursement APP (UK, depuis le 7 octobre 2024)** [S] : le PSR parle d'"interventions" plutôt que d'"avertissements" ; elles doivent être sur mesure (client, arnaque, transaction) et activement portées à l'attention du client ; elles comptent dans l'exception "négligence grave". Age UK reproche l'absence d'obligation de prouver l'efficacité ; la FCA (revue de novembre 2023) attend des firmes qu'elles conçoivent, testent, adaptent et surveillent leurs alertes.
- **Questions de finalité du paiement** : mentionnées dans le Toolkit UK Finance (le toolkit pose des questions sur le motif du paiement pour concevoir des avertissements). Taux mesurés (réduction des pertes, taux de contournement, part de faux motifs choisis) : **non trouvés**. Le coaching des victimes (Which?, UK Finance) est signalé comme risque de contournement. Données de Monzo, Barclays, Starling, Revolut sur ce point : non trouvées. Revolut dit avoir réduit de plus de 20 % les transactions frauduleuses UK en 2023 [S], sans lien établi avec des questions de finalité.
- Autres [S] : Hong Kong, 20 à 30 % des utilisateurs FPS ont poursuivi malgré une alerte ; GAO (États-Unis) cite qu'après intervention d'un tiers, 51 % des victimes ont évité la perte (conception de l'étude non claire).

---

## 4. Alternative si le Snap est trop limité

Comparaison [V, mon analyse] :

| Option | Avantages | Inconvénients |
|---|---|---|
| Snap seul (Flask) | Dans la fenêtre MetaMask, juste à temps, payload brut, état persistant | Ne peut pas bloquer ; friction forte (severity) Flask-only pour les transactions ; installation Flask/allowlist ; UI contrainte ; chainId Fuji non confirmé |
| Page compagnon + Snap | Capte l'intention avant la transaction, UI libre, backend possible ; le Snap compare ensuite | L'utilisateur doit passer par la page ; contournable en allant directement sur la dapp ; liaison compagnon/Snap à concevoir |
| Extension navigateur (wrapper de `window.ethereum.request`) | Peut intercepter avant MetaMask et bloquer réellement ; UI libre ; marche avec MetaMask stable | Hors périmètre MetaMask ; installation d'une extension aux permissions larges (confiance, revue de store) ; risque de conflit avec d'autres injecteurs ; maintenance par navigateur |
| Proxy RPC | Blocage possible côté RPC | Changer le RPC dans MetaMask ; ne voit ni origine ni UI ; ne couvre pas les signatures hors chaîne (typed data) |

Recommandation de travail [V] : Snap pour l'insight (transaction + signature, permits inclus), plus page compagnon ou extension si un blocage obligatoire avant signature est requis, ce que le Snap ne peut pas fournir d'après la doc.

---

## Points à tester en priorité (non tranchés par la doc)
1. onTransaction sur Fuji (43113), en Flask et en stable ; valeur de `chainId` reçue.
2. `severity: critical` en onSignature sur MetaMask stable ; affichage des permits (typed data v4).
3. UI interactive (`onUserInput`) dans l'onglet d'une transaction ; `snap_dialog` appelé depuis onTransaction.
4. `fetch` vers `http://localhost` depuis un Snap (CORS `*`/`null`).
5. Allowlist requise ou non pour `transaction-insight`/`signature-insight` sur MetaMask stable.

## Sources principales
- https://docs.metamask.io/snaps/reference/entry-points/
- https://docs.metamask.io/snaps/features/transaction-insights/
- https://docs.metamask.io/snaps/features/signature-insights/
- https://docs.metamask.io/snaps/reference/permissions/
- https://docs.metamask.io/snaps/features/network-access.md
- https://docs.metamask.io/snaps/features/custom-ui/ et /custom-ui/dialogs.md
- https://docs.metamask.io/snaps/features/data-storage.md
- https://docs.metamask.io/snaps/how-to/get-allowlisted/
- https://docs.metamask.io/snaps/concepts/execution-environment/
- https://github.com/MetaMask/SIPs/blob/main/SIPS/sip-11.md
- https://www.usenix.org/conference/usenixsecurity13/technical-sessions/presentation/akhawe
- https://misq.org/tuning-out-security-warnings-a-longitudinal-examination-of-habituation-through-fmri-eye-tracking-and-field-experiments.html
- https://www.usenix.org/conference/soups2014/proceedings/presentation/bravo-lillo
- https://www.openbanking.org.uk/wp-content/uploads/2021/04/Preliminary-Analysis-Effective-Warning-20210201.pdf
- https://www.psr.org.uk/media/efpdiwpk/using-behavioural-economics-to-understand-and-prevent-app-fraud.pdf
- https://ideas.repec.org/p/not/notcdx/2023-08.html
- https://thinksinsight.com/blog/uk-finance-effective-warnings-research
- https://newseventsinsights.wearepay.uk/media-centre/press-releases/confirmation-of-payee-reaches-two-billion-checks-helping-protect-uk-consumers-against-fraud/

## Résumé (8 lignes)
1. onTransaction et onSignature donnent le payload brut, chainId et origine optionnelle ; onSignature couvre personal_sign, eth_sign, eth_signTypedData v3/v4 (EIP-712 et permits inclus) [P].
2. `severity: critical` est Flask-only pour onTransaction [P] ; pour onSignature le statut stable n'est pas confirmé, et l'UI de signature n'affiche le contenu que si severity critical, après le clic Sign [P].
3. Aucun mécanisme documenté de blocage : un Snap informe et ajoute de la friction (modale, case à cocher selon SIP-11), il ne peut pas empêcher la signature [P/V].
4. UI interactive possible (formulaires, onUserInput, snap_dialog, onHomePage, snap_manageState jusqu'à 100 Mo) ; timeout 60 s par défaut, 5 à 180 s via maxRequestTime ; limite mémoire non trouvée [P].
5. network-access : fetch avec CORS (Origin null) ; localhost, Fuji (43113) et dialog depuis onTransaction non documentés, à tester [V]. Flask pour dev, allowlist pour la stable ; audit exigé seulement pour les méthodes d'entropie/comptes [P].
6. Avertissements : habituation forte, actifs bien meilleurs que passifs (79 % vs 1 cas sur 60), attracteurs x2 à x3, clic-through SSL 70 % vs 33 % selon le design [S].
7. OBIE 2021 (lab) : boutons d'annulation -12 points de fraude (jusqu'à -18 avec ciblage risque, 22 % -> 4 %), au prix de paiements légitimes en baisse ; texte comportemental seul -4 points [P].
8. CoP et finalité du paiement : aucune évaluation isolée ni taux de contournement publié ; coaching des victimes documenté ; si le Snap est trop limité, page compagnon ou extension navigateur (seule à pouvoir bloquer), avec coût de confiance et de maintenance [V].
