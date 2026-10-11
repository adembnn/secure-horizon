# check.mjs : boîte noire du moteur Sentinelle (red team)

Usage : `node research/titouan/T_banc_e2e/redteam/check.mjs <cas.jsonl>` (Node >= 22.6, sans dépendance ni réseau, n'écrit aucun fichier).
Entrée : un cas JSON par ligne au schéma de `attacks/README.md` : `request`, `context`, `intent`, plus en option `id`, `label` (`malveillant`/`benin`/...) et `expected_severity`.
Format de `context` : `victim` est une adresse (chaîne), `known_protocols` et `token_registry` sont des TABLEAUX d'objets `{address,...}`, `counterparty_facts` et `token_info` sont des objets indexés par adresse. Tout autre format (par ex. `victim` objet) produit `error`.
Méthodes : `eth_sendTransaction`, `wallet_sendCalls`, `eth_signTypedData_v4`, `personal_sign`, `eth_sign`, `wallet_switchEthereumChain`, `wallet_addEthereumChain`. Les autres renvoient `unsupported`.
Sortie : une ligne par cas `{id, level_final, level_sans_intention, reasons, unsupported?, error?, ms}`.
- `level_final` : verdict vu par l'utilisateur avec l'intention fournie (plancher du moteur, comparateur et politique) : `ok`, `warn`, `critical`, ou `unknown` si le cas n'est pas décodable.
- `level_sans_intention` : plancher du moteur seul. `reasons` : drapeaux `[warn]` et `[critical]`, raisons `[intention]` du comparateur, notes `[politique]`.
Si au moins un cas porte un `label`, la dernière ligne `{summary}` liste les arnaques ratées (malveillant non critical), les fausses alertes (bénin en critical) et le détail de chaque échec.
Exemple (`redteam/exemple.jsonl` : approve illimité de USDC alors que la victime croit payer Paul 50 USDC) :
`node redteam/check.mjs redteam/exemple.jsonl`
→ `{"id":"rt-1","level_final":"critical","level_sans_intention":"critical","reasons":["[critical] unlimited_allowance : droit illimité sur 0xa0b8… pour 0x2222…", "[warn] external_spender : …", "[intention] unexpected_approval : …"],"ms":4}` puis `{"summary":{...}}`.
Fidélité : chaîne copiée de `run/run_loop.mjs` (lignes citées en en-tête de check.mjs) ; verdicts identiques à `run_loop.mjs --dry` sur 385/385 cas de `attacks/DEV.jsonl` et 1397/1397 cas décodables de `blind_adem/v2/V2_DEV.jsonl`.
Écart volontaire : `context` ou `intent` absent ou `null` est remplacé par `{}` au lieu de faire planter le processus (run_loop plante).
