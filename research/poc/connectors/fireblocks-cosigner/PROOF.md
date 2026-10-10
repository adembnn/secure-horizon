# PROOF : handler de callback Co-Signer Fireblocks, en local (attempt-1)

## Approche
Réimplémentation Node fidèle (zéro dépendance, `node:crypto` + `node:http`) du dépôt officiel `fireblocks/plugin-based-callback-handler` (lu via `gh api` : `main.py`, `src/authenticate.py`, `src/callback_response.py`, `src/helpers.py`). Format repris à l'identique :
- `POST /v2/tx_sign_request`, corps = JWT brut RS256 signé par la clé privée du Co-Signer ; vérifié avec la clé publique du Co-Signer (403 si signature invalide ou illisible, 401 si expiré, comme `authenticate.py`).
- Réponse = JWT brut RS256 (`text/plain`) signé par la clé privée du handler : `{action, requestId, rejectionReason}`, `requestId` recopié (comme `callback_response.py`).
- Champs de la demande selon la doc developers.fireblocks.com (txId, requestId, operation, asset, amount/amountStr, sourceType, destAddress, signerId...). Actions documentées : APPROVE, REJECT, RETRY, IGNORE ; le handler n'émet que APPROVE/REJECT.
- Politique Sentinelle (`src/policy.mjs`) : APPROVE seulement si adresse dans la liste blanche synthétique ET `amountUSD` <= plafond 10 000 ; sinon REJECT avec raison.
- `src/fake-cosigner.mjs` : faux Co-Signer qui signe et envoie 2 demandes, vérifie les réponses (signature, requestId, action), plus 4 tests négatifs.
- Clés RSA-2048 jetables générées par `gen-keys.sh` (dossier `keys/`, gitignoré). Aucune clé existante lue. Aucun réseau externe, aucune chaîne, aucun Docker lancé (donc rien à `docker compose down`).

## Versions
Node v25.6.0, OpenSSL 3.5.5 (Git Bash, Windows 11), 0 paquet npm. Le dépôt officiel est en Python 3.11/FastAPI : non exécuté ici (voir limites).

## Rejouer
```
cd "C:/Users/Adem/AppData/Local/Temp/claude/C--Users-Adem-Secure-Horizon/1802da7a-af03-4cde-bcb5-fe043c52629b/scratchpad/connectors/fireblocks-cosigner/attempt-1"
bash run-proof.sh        # génère les clés, lance le handler (port 18000), lance le faux Co-Signer, vérifie avec openssl, arrête le handler
```
Code retour 0 = tout passe.

## Sortie réelle observée (proof-output.txt, dernière exécution)
```
node v25.6.0 / OpenSSL 3.5.5 27 Jan 2026 (Library: OpenSSL 3.5.5 27 Jan 2026)
keys generated: _msg _sig callback_private.pem callback_public.pem cosigner_private.pem cosigner_public.pem rogue_private.pem rogue_public.pem 

== 1. Under cap, known address -> APPROVE
   request payload: {"txId":"bb8202c7-7241-4b08-b520-470c15ca6be5","requestId":"d2475b62-35a3-4772-9246-ec5beb5fd7e3","operation":"TRANSFER","asset":"USDC_AVAX_FUJI","sourceType":"VAULT","sourceId":"0","sourceName":"Synthetic treasury vault","destType":"ONE_TIME_ADDRESS","destAddressType":"ONE_TIME","signerId":"synthetic-api-user-1","fee":"0.0001","amount":"2500","amountStr":"2500","amountUSD":2500,"destAddress":"0x1111111111111111111111111111111111111111"}
PASS  HTTP 200 (got 200)
   response JWT header + payload: {"alg":"RS256","typ":"JWT"}  {"action":"APPROVE","requestId":"d2475b62-35a3-4772-9246-ec5beb5fd7e3","rejectionReason":null}
PASS  response signature verified with callback public key 
PASS  requestId echoed 
PASS  action === APPROVE (got APPROVE; reason: null)

== 2. Unknown address, above cap -> REJECT
   request payload: {"txId":"0acc6028-6f3c-449a-9b50-59e2bd065a97","requestId":"e7a73ad4-0934-4222-a170-e3538eb175e7","operation":"TRANSFER","asset":"USDC_AVAX_FUJI","sourceType":"VAULT","sourceId":"0","sourceName":"Synthetic treasury vault","destType":"ONE_TIME_ADDRESS","destAddressType":"ONE_TIME","signerId":"synthetic-api-user-1","fee":"0.0001","amount":"250000","amountStr":"250000","amountUSD":250000,"destAddress":"0x9999999999999999999999999999999999999999"}
PASS  HTTP 200 (got 200)
   response JWT header + payload: {"alg":"RS256","typ":"JWT"}  {"action":"REJECT","requestId":"e7a73ad4-0934-4222-a170-e3538eb175e7","rejectionReason":"Sentinelle: destination not in allowlist; amountUSD 250000 exceeds cap 10000"}
PASS  response signature verified with callback public key 
PASS  requestId echoed 
PASS  action === REJECT (got REJECT; reason: Sentinelle: destination not in allowlist; amountUSD 250000 exceeds cap 10000)

== 3. Negative: authentication of the request
PASS  JWT signed by a rogue key is refused (403) (got 403: {"detail":"Token signature is invalid."})
PASS  tampered payload (swapped destination) is refused (403) (got 403: {"detail":"Token signature is invalid."})
PASS  expired JWT is refused (401) (got 401: {"detail":"Token has expired."})

== 4. Negative: a response forged by a rogue key must not verify on the co-signer side
PASS  forged APPROVE response rejected by co-signer verification 

RESULT: ALL CHECKS PASSED

== independent check of the APPROVE response signature with the openssl CLI (not our code)
Verified OK

== handler log
[handler] {"event":"listening","port":18000}
[handler] {"event":"decision","txId":"bb8202c7-7241-4b08-b520-470c15ca6be5","requestId":"d2475b62-35a3-4772-9246-ec5beb5fd7e3","dest":"0x1111111111111111111111111111111111111111","amountUSD":2500,"action":"APPROVE","reason":null}
[handler] {"event":"decision","txId":"0acc6028-6f3c-449a-9b50-59e2bd065a97","requestId":"e7a73ad4-0934-4222-a170-e3538eb175e7","dest":"0x9999999999999999999999999999999999999999","amountUSD":250000,"action":"REJECT","reason":"Sentinelle: destination not in allowlist; amountUSD 250000 exceeds cap 10000"}
[handler] {"event":"auth_failed","status":403,"detail":"Token signature is invalid."}
[handler] {"event":"auth_failed","status":403,"detail":"Token signature is invalid."}
[handler] {"event":"auth_failed","status":401,"detail":"Token has expired."}
```

## Résultat
- Requête 1 (2 500 USD, adresse connue) : APPROVE, signature de la réponse vérifiée par le faux Co-Signer (clé publique du handler) ET par la CLI `openssl dgst -verify` ("Verified OK").
- Requête 2 (250 000 USD, adresse inconnue) : REJECT avec raison, signature vérifiée.
- Côté handler : JWT de clé inconnue, payload modifié (destination échangée) -> 403 ; JWT expiré -> 401. Côté Co-Signer : un APPROVE forgé par une autre clé est refusé.
- 13 contrôles PASS, 0 FAIL.

## Limites (honnêtes)
- Ce n'est PAS le code officiel Python exécuté : réimplémentation du format lu dans le dépôt et la doc. Le conteneur officiel n'a pas été construit (il faut un `.env`, un plugin et une base ; son `main.py` fait aussi `exit(1)` dans le `finally` du lifespan, à vérifier avant de s'y fier).
- Le faux Co-Signer est notre code : il prouve la conformité au format documenté, pas la compatibilité avec un vrai Co-Signer Fireblocks (image SGX/Nitro, HTTPS, clés enregistrées côté Fireblocks). Pas de compte ni sandbox Fireblocks utilisés.
- Les champs exacts du JWT d'entrée (noms, `exp`/`nonce`) sont reconstitués d'après la doc ; la liste complète n'a pas pu être lue (pages de référence partiellement indisponibles).
- HTTP clair en local ; un vrai déploiement exige HTTPS. Pas de gestion RETRY/anti-rejeu (nonce non mémorisé). Le plafond/liste blanche sont codés en dur, `amountUSD` est fourni par le Co-Signer.
- Pas de lien avec la garde on-chain : ici seulement la couche « refus avant signature ».
- Bug rencontré et corrigé : `process.exit()` avec fetch en cours provoquait une assertion libuv sur Node 25/Windows ; remplacé par `process.exitCode`.
