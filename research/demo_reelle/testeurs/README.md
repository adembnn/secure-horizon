# Outillage des testeurs Hold up

Un testeur n'a plus qu'à écrire une liste de parcours et lire des résultats. Chaîne locale uniquement : jamais la chaîne partagée 8545, le relais 8789 (utilisé en lecture par l'extension, comme d'habitude) ni le site 8793. Aucune clé n'est affichée ni écrite ; le portefeuille simulé prend une clé neuve à chaque parcours.

## Trois commandes (depuis ce dossier, N = ton numéro, 1 à 40)

```
node monter.mjs --id=N                                   # ~5 s : chaîne, contrats, sites, extension
node jouer.mjs  --id=N --parcours=mes_parcours.json      # joue la liste ; options : --seulement=nom1,nom2  --garder-profils
node demonter.mjs --id=N                                 # arrête tout (--effacer supprime aussi le dossier)
```

Tout vit dans `%TEMP%/holdup-testeur-N/`. Ports : chaîne `8600+N`, site Neve `8700+N`, site leurre `8710+N`.
`monter.mjs` prend une copie de l'extension construite à cet instant et recopie son `BUILD_INFO.json` dans `etat.json` (et dans `resultats.json`). Pour tester une nouvelle construction : démonter, remonter.
Les adresses des contrats sont dans `%TEMP%/holdup-testeur-N/chain/addresses.local.json`, jamais dans `research/demo_reelle/chain/`.

## Où lire les résultats

- `resultats.md` : lisible, avec les captures (`captures/<parcours>/NN_geste.png`, ouvre-les avec l'outil Read). Écrit après chaque parcours, donc lisible avant la fin.
- `resultats.json` : la même chose, pour calculer.
- Synthèse en haut du `.md` : un tableau parcours / verdict / ce que le portefeuille a reçu / durée.

Pour chaque parcours : une capture de la fenêtre de l'extension (ou du site si elle est fermée) après chaque geste, le texte affiché, les boutons et s'ils sont inactifs, le focus, la taille en px, si ça défile, le verdict affiché par l'extension (`data-outcome`), les lignes d'explication (`.hu-note`), la durée d'affichage de chaque fenêtre, ce que le portefeuille simulé a reçu (méthode, destinataire, montant décodé, droit accordé, résultat), les soldes et droits sur la chaîne avant et après, le délai entre le dernier clic sur le site et la demande reçue par le portefeuille (avec la part due aux gestes de la personne), et les erreurs de console de chaque page et du service worker (le 404 du favicon est ignoré).

### Le verdict mécanique

Calculé à partir de la CHAÎNE (soldes, droits, NFT) et jamais de l'écran :

- « rien n'est parti » ;
- « rien n'est parti sur la chaine, mais une signature a ete remise » (signature non vérifiable, hors Permit) ;
- « ce qui est parti correspond a la phrase » ;
- « quelque chose est parti qui ne correspond pas a la phrase » (avec la liste des écarts) ;
- « quelque chose est parti (aucune intention fournie…) » si le parcours n'a pas de champ `intention`.

Les signatures Permit sont « revendiquées » sur la chaîne à la fin du parcours (on joue ce que ferait le bénéficiaire) pour mesurer le droit réel. La chaîne est restaurée après chaque parcours (`evm_snapshot` / `evm_revert`), le navigateur repart d'un profil neuf (sauf `"profil": "garde"`).

Le verdict mesure ce qui est parti par rapport à la PHRASE : un droit illimité donné au routeur « habituel » pour un échange de 50 USDC est donc un écart (la thèse du produit). Limite : le portefeuille simule `eth_sendTransaction`, `eth_signTypedData_v4`, `personal_sign` ; une autre méthode est refusée et notée.

## Format d'un fichier de parcours

```json
{ "parcours": [ {
  "nom": "p01_exemple",
  "description": "texte libre",
  "site": "echange",            // echange (Neve) | leurre (Glacier Rewards) | envois (page_envois.html)
  "mode": "piege",              // echange : honnete | habituel | piege ; "via": "permit" pour la signature Permit
  "params": { "action": "envoyer", "dest": "@ami", "montant": "5", "jeton": "usdc", "piege": "destinataire" },   // site envois
  "etat": "T+",                 // T- (neuf, défaut) | T+ (jetons USDC et WAVAX déclarés) | T+R (T+ et routeur Neve connu)
  "contexte": { },              // ou un contexte libre écrit dans chrome.storage.local (remplace etat)
  "reglages": { "askIntent": "always", "dangerWaitMs": 5000, "manipulationHoldMs": 30000, "limitUnlimited": true },
  "theme": "clair", "zoom": 100, "taille_fenetre": [440, 540],
  "clavier_seul": false,        // vrai : "clic" devient Tab jusqu'au bouton puis Entree
  "profil": "neuf",             // "garde" : réutilise le profil du parcours précédent de même nom
  "solde_usdc": 100, "solde_avax": 100, "nft": 3,
  "intention": { "type": "echange", "usdc": 50 },
  "gestes": [ { "g": "operation" }, { "g": "ecrire", "texte": "echanger 50 USDC" }, { "g": "entree" } ]
} ] }
```

Dans toutes les chaînes (texte, params, destinataires) : `@wallet`, `@ami`, `@ami2`, `@inconnu` (adresses neuves à chaque parcours), `@collecteur`, `@piege`, `@routeur`, `@routeur_habituel`, `@usdc`, `@wavax`, `@nft` sont remplacés par l'adresse.

### Intentions (pour le verdict)

- `{"type":"echange","usdc":50}` : au plus 50 USDC sortent, vers un routeur ; droit sur l'USDC limité à 50, à un routeur.
- `{"type":"envoi","jeton":"usdc"|"avax"|"nft","montant":5,"destinataire":"@ami","nft_id":0}`
- `{"type":"approbation_nft","nft_id":0,"pour":"@ami"}` ; `{"type":"approbation_collection","pour":"@ami"}`
- `{"type":"rien"}` : la phrase ne demande rien de signable.
- `{"type":"libre","enveloppe":{...}}` : voir `compiler()` dans `jouer.mjs` (`usdc_sorti_max`, `usdc_vers`, `avax_sorti_max`, `avax_vers`, `droits_usdc_max`, `droits_vers`, `nft_ids`, `nft_vers`, `collection_vers`).

### Gestes (`"g"`)

| Geste | Paramètres | Effet |
|---|---|---|
| `operation` | `double` | clic sur le bouton du site (connexion puis action) |
| `relancer` | `double` | un seul clic sur le bouton principal du site |
| `ecrire` | `texte`, `vitesse_ms` (0 = collé) | frappe dans le champ de la fenêtre de l'extension |
| `entree`, `echap`, `espace` | | touche dans la fenêtre |
| `tab` | `maj` | Tab ou Maj+Tab |
| `clic`, `double_clic` | `texte`, `page` ("site"), `attendre_actif_s` | bouton par son texte ; si inactif, attend jusqu'à N s, sinon erreur « inactif » |
| `tab_vers` | `texte`, `valider` ("Entree" ou "Espace"), `attendre_actif_s` | Tab jusqu'au bouton puis validation (15 Tab au plus) |
| `fermer_fenetre` | | la croix : ferme la fenêtre de l'extension |
| `recharger` | `cible` ("fenetre" ou "site") | |
| `attendre` | `secondes` | |
| `second_onglet` | `url` | ouvre le site dans un deuxième onglet, qui devient le site actif |
| `onglet` | `n` | revient à l'onglet n |
| `zoom` | `pourcent` (100 à 200), `site` | zoom |
| `theme` | `valeur` ("clair"/"sombre") | |
| `taille` | `cible` ("fenetre"/"site"), `largeur`, `hauteur` | |
| `redemarrer_navigateur` | | ferme et relance Chromium sur le même profil (le service worker repart, `storage.session` est vidé), rouvre le site |
| `remplir`, `choisir` | `selecteur`, `valeur` | champs de la page du site (utile pour `envois`) |
| `page_extension` | `chemin` | ouvre `options.html`, `ui/sidepanel.html`… dans un onglet |
| `capture`, `lire` | | instantané sans geste |

Chaque geste accepte `apres_ms` (pause avant l'instantané, 400 ms par défaut). Un geste qui échoue est noté (`erreur`) et le parcours continue.

### La page d'envois (`site: "envois"`)

`page_envois.html` est un formulaire neutre (destinataire, montant, jeton, numéro de NFT, action : envoyer / autoriser un NFT / autoriser tous mes NFT). Paramètres d'URL, passés dans `params` : `action`, `dest`, `montant`, `jeton`, `nftid` pré-remplissent le formulaire ; `piege` fait envoyer autre chose que ce qui est affiché : `destinataire` (vers `autre`, par défaut le collecteur), `montant` (× `facteur`, 10 par défaut), `jeton` (`autre_jeton`), `nft` (`autre_nft`), `collection` (setApprovalForAll de toute la collection).

## Limites connues

- Le zoom est émulé par le navigateur (taille de page et facteur d'échelle de la fenêtre), pas par le réglage de zoom du profil : même mise en page, mais pas la barre de défilement native. La fenêtre de décision est ramenée à 440 x 540 px (taille demandée par `gatekeeper.js`) ; sa taille réelle dépend sinon du Chromium headless.
- Le délai « clic → demande portefeuille » inclut les pauses de l'outil (~400 ms par geste) ; seul l'ordre de grandeur compte.
- Le relais du modèle (8789) est partagé : s'il refuse l'extension de test, l'écran dit « intention classée sans modèle » et le résultat s'en ressent.
- Pas de second portefeuille dans la page, pas d'icône de barre d'outils cliquée (la fenêtre s'ouvre à la demande du site).
- Un état T+ ou T+R écrit `contexte` dans `chrome.storage.local` par le service worker avant le premier geste ; d'autres états sont possibles via `contexte`.
