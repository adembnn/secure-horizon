# Jeu massif à l'aveugle v2 (consigne d'Adem : « ratisse tout, explose les compteurs »)

## But
Produire des MILLIERS de cas réalistes pour mesurer honnêtement le détecteur de Sentinelle. Chaque agent possède une famille et écrit un GÉNÉRATEUR paramétrique : combinatoire de variantes réalistes, graine fixe, aucun cas recopié à la main mille fois. L'objectif est de 600 à 1 500 cas par agent, tous différents et plausibles.

## Indépendance, non négociable
- INTERDIT de lire : `research/titouan/T_banc_e2e/engine/`, `run/`, `vendor_t103/`, `attacks/*.jsonl`, `attacks/*.mjs`, `app/`, les branches `t/T-10x`, ainsi que les autres fichiers de `blind_adem/` (y compris ceux des autres agents).
- Autorisé : la section « Schema d'un cas » de `research/titouan/T_banc_e2e/attacks/README.md`, la liste de ses catégories, le format `Intent` de `docs/intent-barrier.md`, ce fichier, tes connaissances et le web pour les faits publics (sélecteurs, adresses de protocoles, structures EIP-712, schémas d'arnaque documentés).

## Format
- JSONL, un cas par ligne, conforme au schéma du README.
- `synthetic: true`, `id: V2-<FAMILLE>-NNNNN`.
- `split` : `DEV` ou `TEST`, choisi par le hash de l'id. Le cas va en TEST si sha256(id) mod 10 < 3, sinon en DEV.
- Vrai calldata ou vrai typed data EIP-712, encodé avec ethers v6 importé par chemin absolu : `C:\Users\Adem\Secure Horizon\blockchain\node_modules\ethers\lib.esm\index.js`, ou le point d'entrée réel du paquet.
- `context.chainId` : surtout 43114 (Avalanche C-Chain) et 43113 (Fuji), environ 20 % de cas en 1 (Ethereum).
- Adresses : celles des protocoles publics réels quand tu en es sûr. Sinon, une adresse dérivée de la graine, et `approximation` est renseigné.
- Aucune clé réelle, aucun secret, aucune donnée personnelle réelle, marques fictives pour les messages d'escroc.
- `expected_severity` : malveillant = `critical` ; bénin = sévérité MAXIMALE tolérable (`ok` ou `warn`), justifiée ; ambigu = `warn` ; fraude conforme = sévérité réaliste, avec `ideal_severity: critical`.
- `reason` et `source` (motif public imité) remplis pour chaque cas.
- `intent` = ce que la personne croit faire. Varie l'intention : honnête, soufflée par l'escroc, vague, absente.

## Variations attendues (à combiner)
- Montants : poussière, petit montant, gros montant, illimité.
- Tokens : USDC, USDT, WAVAX, WETH, tokens obscurs.
- Contrepartie : contrat ou compte externe, âge du contrat, déjà vu ou pas.
- Origine du site : officielle, sosie, inconnue.
- Encodage : direct, imbriqué, multicall, lot.
- Langue et ton des messages collés : FR et EN, urgent, amical, autoritaire.
- Personas : retraité, étudiant, trader.

## Livrables (dans `research/titouan/T_banc_e2e/blind_adem/v2/<famille>/`)
- `gen.mjs`, le générateur, reproductible ;
- `cases.jsonl` ;
- `validate.mjs` : JSON valide, champs complets, ids uniques, calldata hex, typed data hachable, aucun doublon exact de requête ;
- `README.md` : 10 lignes, avec les familles, les comptes DEV/TEST et les approximations.

Pas de git commit. Réponse finale : les comptes par sous-famille, en 6 lignes maximum.
