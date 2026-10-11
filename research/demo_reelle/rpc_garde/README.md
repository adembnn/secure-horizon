# Hold up : la porte RPC

Deuxième porte d'entrée de Hold up, sur le même moteur que l'extension. L'extension ne voit que les demandes qu'une page web envoie au portefeuille. Elle ne voit pas un envoi tapé dans l'écran « Envoyer » du portefeuille, ni un portefeuille mobile, ni WalletConnect.

Ici, tu remplaces l'adresse RPC du réseau dans ton portefeuille par celle de Hold up. Chaque transaction que le portefeuille diffuse nous arrive en `eth_sendRawTransaction` avant d'atteindre la chaîne. Hold up la décode, retrouve l'expéditeur, la passe dans le pipeline du produit (`server/server.mjs`, fonction `evaluate`, importée telle quelle) et décide :

- aucun signal : la transaction part tout de suite, le portefeuille reçoit la réponse du nœud ;
- attention, danger, manipulation ou vérification impossible : la transaction **ne part pas**. Le portefeuille reçoit une erreur courte avec un lien vers la page de décision locale. Depuis cette page tu annules, ou tu continues une fois le délai passé.

Tout le reste (lectures, lots, identifiants, erreurs) est transmis sans modification.

## Lancer

Prérequis : Node 22 ou plus, `npm install` fait dans `blockchain/`, et un nœud local qui tourne (voir `research/demo_reelle/chain/README.md`).

```bash
# le proxy : 127.0.0.1:8555 vers le nœud local 127.0.0.1:8545
node research/demo_reelle/rpc_garde/proxy.mjs

# la démonstration sans portefeuille (dans un autre terminal)
node research/demo_reelle/rpc_garde/demo_send.mjs            # (a) envoi au vrai contact, puis (b) envoi à l'adresse sosie
node research/demo_reelle/rpc_garde/demo_send.mjs approve    # droit de dépense sans limite vers une adresse inconnue

# les tests (lancent puis arrêtent leur propre nœud jetable sur le port 8547)
node --test research/demo_reelle/rpc_garde/test/proxy.test.mjs
```

Pages : `http://127.0.0.1:8555/` liste les demandes retenues et ouvre chaque nouvelle demande dès qu'elle arrive (pratique pour présenter). `http://127.0.0.1:8555/hold/<id>?t=<jeton>` est la page de décision, avec la fenêtre de verdict de `ui_holdup` (« Tu crois / En vrai »), le compte à rebours, « Annuler » toujours actif et « Continuer quand même » après le délai. Sous le verdict, « Dire ce que je voulais faire » pose la question d'intention et relance la comparaison : la réponse peut durcir le verdict et rallonger l'attente, jamais l'inverse.

`demo_send.mjs` signe avec le compte de test public de Hardhat qui sert de victime dans `addresses.local.json`. Il refuse de tourner si le nœud derrière le proxy n'est pas un nœud Hardhat local. L'étape (a) écrit sur la chaîne locale (25 DemoUSDC partent chez Paul). L'étape (b) n'écrit rien tant que personne ne clique sur « Continuer quand même ».

## Réglages

| Variable | Défaut | Rôle |
|---|---|---|
| `HOLDUP_RPC_PORT` | `8555` | port du proxy (toujours sur 127.0.0.1) |
| `HOLDUP_UPSTREAM` | `http://127.0.0.1:8545` | nœud réel. Fonctionne aussi avec `https://api.avax-test.network/ext/bc/C/rpc` (lectures vérifiées en direct) |
| `HOLDUP_CONTEXT` | `context.local.json`, sinon `context.demo.json` | contacts et historique |
| `HOLDUP_ADDRESSES` | `../chain/addresses.local.json` | adresses de démo, pour afficher « DemoUSDC » |
| `HOLDUP_WAIT_DANGER_S` | `30` | attente avant de pouvoir continuer, niveau danger |
| `HOLDUP_WAIT_MANIPULATION_S` | `600` | idem, manipulation |
| `HOLDUP_WAIT_ATTENTION_S`, `HOLDUP_WAIT_UNKNOWN_S` | `0` | idem, attention et vérification impossible |
| `HOLDUP_HOLD_TTL_S` | `1800` | durée de vie d'une demande retenue |
| `HOLDUP_ASK_NEW_RECIPIENT` | `0` | `1` : retient aussi un envoi vers une adresse jamais utilisée (niveau information, sans attente), ce qui permet de poser la question d'intention |
| `HOLDUP_LIVE` | `1` | `0` : aucune lecture sur le nœud pour les faits |
| `HOLDUP_LIVE_PROVIDER` | `0` | `1` : faits lus par `context_live/provider.mjs` (âge du contrat, autorisations) au lieu du lecteur intégré |
| `HOLDUP_JOURNAL`, `HOLDUP_JOURNAL_FILE` | `1`, `journal/decisions.jsonl` | journal chaîné par hachage, une ligne par verdict et par décision |

Pour une démo, `HOLDUP_WAIT_DANGER_S=10` raccourcit l'attente.

### Le fichier de contexte

Même format que `server/context.example.json` :

```json
{
  "contacts": [{ "label": "Paul", "address": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" }],
  "history": [{ "address": "0x3C44…93BC", "direction": "sortie", "amount": "50", "minutes_ago": 20160 }],
  "protected": [],
  "knownSpenders": []
}
```

`contacts` est ton carnet d'adresses, `history` tes envois passés (c'est lui qui permet de repérer une adresse sosie), `knownSpenders` les contrats à qui tu donnes déjà des droits. `context.demo.json` est synthétique : Paul est le compte public n°2 de Hardhat. Pour tes propres contacts, copie-le en `context.local.json` (non versionné). Le fichier est relu à chaque transaction.

## Brancher un vrai portefeuille sur la chaîne locale

1. Lance le nœud local, déploie la démo (`research/demo_reelle/chain/README.md`), puis lance le proxy.
2. Dans MetaMask : Paramètres, Réseaux, Ajouter un réseau. Nom « Hold up local », URL RPC `http://127.0.0.1:8555`, ID de chaîne `43114` si le nœud est un fork d'Avalanche (`31337` pour une chaîne vide), symbole `AVAX`. Si MetaMask connaît déjà Avalanche, ajoute cette URL RPC au réseau existant et choisis-la par défaut.
3. Dans Core : Paramètres, Réseaux, ajouter un réseau personnalisé avec les mêmes valeurs.
4. Importe **un seul compte de test local** (une clé affichée par `npm run chain:local`, jamais la tienne).
5. Ouvre `http://127.0.0.1:8555/` dans un onglet et laisse-le ouvert.
6. Dans le portefeuille, envoie des DemoUSDC à Paul : l'envoi passe. Envoie-les à l'adresse sosie (affichée par `demo_send.mjs`) : l'envoi est retenu.

Ce que le portefeuille devrait afficher (**à vérifier avec un vrai portefeuille**, rien de ceci n'a été testé hors script) :

- l'envoi retenu apparaît comme une transaction échouée, avec notre message : « Hold up a retenu cette opération. … Rien n'est parti. Pour décider, ouvre http://127.0.0.1:8555/hold/… » ;
- le message peut être coupé ou caché derrière « détails », et le lien n'est sans doute pas cliquable. C'est pour cela que la liste `http://127.0.0.1:8555/` existe ;
- après « Continuer quand même », la transaction part vraiment, mais le portefeuille peut continuer à l'afficher comme échouée jusqu'à ce qu'il relise la chaîne ;
- si le portefeuille renvoie tout seul la même transaction, elle retombe sur la même demande retenue (ou reçoit son hash si tu as déjà continué). À vérifier : le rythme de ces renvois, et le numéro d'ordre (nonce) que le portefeuille choisit pour l'opération suivante ;
- MetaMask accepte une URL RPC en `http://` pour 127.0.0.1. Core : à vérifier.

## Ce que le proxy fait exactement

- **Types de transaction lus** : ancienne forme avec identifiant de chaîne (EIP-155), `0x1` (EIP-2930), `0x2` (EIP-1559), `0x4` (EIP-7702). Le décodage des champs est celui du moteur (`engine/src/rlp.mjs`). `rawtx.mjs` ajoute le hachage de signature et la récupération de l'expéditeur (secp256k1). **Refusés** : `0x3` (blobs, absents de la C-Chain), tout autre type, l'ancienne forme sans identifiant de chaîne.
- **Chaînes** : 31337, 43113 et 43114, monnaie affichée AVAX. Une transaction signée pour une autre chaîne que celle du nœud est refusée. Le pipeline du produit, lui, ne regarde pas l'identifiant de chaîne : sur une chaîne inconnue il rend le même verdict et écrit « unités du réseau » à la place du symbole (c'est aussi le cas pour 31337, corrigé ici à l'affichage).
- **Erreur renvoyée** : HTTP 200 et `{"error":{"code":-32000,"message":…}}`, la forme que geth et la C-Chain utilisent pour une transaction refusée (vérifié sur Fuji). Hardhat utilise le même code pour un nonce trop bas.
- **Même transaction renvoyée** : même demande retenue, même lien, jamais une deuxième. Après une annulation ou une expiration, les mêmes octets ouvrent une nouvelle demande : ils ne passent jamais tout seuls.
- **Décisions** : `POST /holds/:id/continue`, `/cancel`, `/intent`, avec le jeton aléatoire de la demande (128 bits), donné seulement dans le lien de décision. Le serveur écoute sur 127.0.0.1, vérifie l'en-tête `Host` (pas de rebond DNS), refuse toute requête d'une autre origine, exige `application/json`, n'envoie aucun en-tête CORS et interdit l'affichage en cadre. Une page web ne peut ni lire une demande ni la libérer.
- **Panne** : toute erreur interne sur `eth_sendRawTransaction` donne un refus, jamais un envoi. Une lecture, elle, part vers le nœud quoi qu'il arrive. Les demandes retenues vivent en mémoire : si le proxy redémarre, elles sont perdues et rien ne part.
- **Faits lus sur le nœud** (lecture seule, 1,2 s au plus) : le destinataire est-il un contrat, solde de l'expéditeur, symbole et décimales du jeton. Ils sont passés à `evaluate` en troisième argument, dans la forme prévue par `context_live/server_integration.diff`. **Tant que ce correctif n'est pas appliqué à `server.mjs`, le pipeline les ignore** : ils servent seulement à écrire « 25 DemoUSDC » au lieu de « 25000000 jetons » et à ajouter une ligne sous « Pourquoi ? » (part du solde, destinataire qui est un programme).

## Limites

- **La transaction est déjà signée quand nous la voyons.** Nous pouvons refuser de la relayer, pas la modifier. Elle reste valide : le portefeuille, ou n'importe qui la détenant, peut la diffuser par un autre nœud tant que son numéro d'ordre n'a pas servi. Annuler chez nous efface notre copie, pas la signature.
- **Un portefeuille qui a plusieurs URL RPC ou un nœud de secours peut nous contourner** sans le dire. À vérifier pour chaque portefeuille.
- **Les signatures hors chaîne ne passent jamais par un RPC** : Permit, Permit2, ordres Seaport, connexion par message. Le vol par signature reste invisible ici, l'extension reste nécessaire.
- **Pas de page, pas de site.** Cette porte ne connaît ni le site d'origine ni le texte affiché : le niveau « manipulation » n'apparaît jamais tout seul, et les fiches du produit parlent parfois de « ce site » alors qu'il n'y en a pas.
- **L'intention arrive après la signature**, sur la page de décision, et seulement pour une opération déjà retenue.
- **Un envoi vers une adresse nouvelle passe sans attente par défaut** : le produit le classe « information ». `HOLDUP_ASK_NEW_RECIPIENT=1` le retient.
- **Un appel que le moteur ne sait pas lire est retenu comme « non vérifié »**, sans attente. Avec une vraie application, cela peut faire beaucoup de demandes retenues.
- **Une version hébergée verrait tes adresses et ton adresse IP**, comme tout fournisseur RPC. Ici tout reste sur ta machine.
- **Mobile** : le proxy n'écoute que sur 127.0.0.1. Un téléphone a besoin d'un hôte joignable, donc d'une version en réseau, avec les protections à revoir.
- **Les retraits depuis une plateforme d'échange sont hors de portée** : ils ne passent pas par ton portefeuille.
- **Seul HTTP est géré** (pas de WebSocket). `eth_sendTransaction` (compte géré par le nœud) est transmis tel quel. Les variantes comme `eth_sendRawTransactionSync` sont refusées.
- **Le symbole d'un jeton hors fichier d'adresses est celui que le jeton déclare** : un faux jeton peut s'appeler USDC.
- **Continuer après une longue attente peut échouer** si les frais ont monté ou si le numéro d'ordre a servi entre-temps. La page le dit, rien ne part.
- **Le site qui a demandé la transaction peut lire le message d'erreur**, donc le lien de décision. Il peut l'ouvrir dans un onglet, pas cliquer à ta place.
- **Les programmes locaux sont considérés comme sûrs** : un script sur ta machine peut lire `GET /holds`.
- **Chaque envoi attend la lecture des faits** (quelques millisecondes en local, jusqu'à 1,2 s sur un nœud public lent).

## Fichiers

| Fichier | Rôle |
|---|---|
| `proxy.mjs` | le proxy, les demandes retenues, les pages |
| `rawtx.mjs` | transaction signée vers champs et expéditeur |
| `decision.html`, `decision.js`, `decision.css` | page de décision (la fenêtre vient de `ui_holdup/verdict.js`) |
| `holds.html`, `holds.js` | liste « Hold up : demandes retenues » |
| `demo_send.mjs`, `demo_lib.mjs` | démonstration sans portefeuille, signature avec les comptes publics de Hardhat |
| `context.demo.json` | contexte synthétique de la démo |
| `test/proxy.test.mjs` | 15 tests de bout en bout sur un nœud jetable |
