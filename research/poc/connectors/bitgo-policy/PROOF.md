# BitGo policy webhook - preuve locale

## Approche
BitGo documente publiquement le mecanisme (https://developers.bitgo.com/docs/policies-webhook et .../policies-webhook-signing-keys, copies dans `bitgo-doc.md` et `signing.md`).
- Regle de politique `type: "webhook"`, `condition.url`, action `deny` ou `getApproval`.
- BitGo POSTe un JSON (`walletId, ruleId, type, spendAmount, approvalCount, halfSigned.txHex, outputs[{address,value,wallet}]`).
- Reponse HTTP 200 = la transaction continue. Tout autre statut = l'action de la regle (refus ou approbation manuelle). Le corps de reponse n'est pas specifie.
- Mode signe (active sur demande a support@bitgo.com) : BitGo envoie un JWT (JWKS publique https://app.bitgo.com/.well-known/jwks.json, kid + iss verifies). Nous repondons par un JWT signe `{evaluationId, statusCode}`.

Implementation : `server.mjs`, Node pur (module crypto, zero dependance). Logique Sentinelle : refus si `spendAmount` > plafond (MAX_SPEND), ou si une sortie n'est ni dans la liste blanche (ALLOWLIST) ni un retour de monnaie vers le meme wallet. Erreur ou corps invalide : non-200 (fail closed). Rejeu avec meme `evaluationId` : meme reponse (idempotent).

Le payload `fixtures/approve.json` est l'exemple verbatim de la doc BitGo. Les deux refus sont des variantes synthetiques du meme format.

## Versions
Node v25.6.0, Git Bash, Windows 11. Aucune dependance npm. Docker non utilise, rien a arreter.

## Rejouer
```
bash "C:/Users/Adem/AppData/Local/Temp/claude/C--Users-Adem-Secure-Horizon/1802da7a-af03-4cde-bcb5-fe043c52629b/scratchpad/connectors/bitgo-policy/attempt-1/run-proof.sh"
```
(Section C fait un GET en lecture seule sur la JWKS publique BitGo ; elle est ignoree sans reseau.)

## Sortie reelle observee (`run-output.txt`)
```
PASS  approve.json -> HTTP 200 got 200 {"approved":true}
PASS  deny-unknown-dest.json -> HTTP 403 got 403 {"approved":false,"reasons":["over_cap:900000000>1000000","dest_not_allowlisted:2N1SyntheticDrainAddr0000000000000"]}
PASS  deny-over-cap.json -> HTTP 403 ...
PASS  malformed body -> non-200 (fail closed) got 400
PASS  signed approve payload -> statusCode 200, evaluationId echoed
PASS  signed drain payload -> statusCode 403, evaluationId echoed
PASS  JWT signed with wrong key -> rejected (401)
PASS  untrusted iss -> rejected
PASS  retry with same evaluationId is idempotent
PASS  BitGo prod JWKS key importable kid=df290a3b-... alg=ES256
PASS  ES256 sign/verify roundtrip (BitGo prod key type)
RESULT: ALL PASSED
D. curl: approve -> 200 ; deny-unknown-dest -> 403 ; deny-over-cap -> 403
```

## Limites
- Aucun appel venant de BitGo reel : il faut un compte BitGo test, un wallet et une regle (non cree). Le test prouve la conformite au format documente, pas l'integration de bout en bout.
- Mode signe : la doc ne dit pas comment le JWT est transporte (corps brut ou en-tete). Le serveur accepte les deux (`Authorization: Bearer` ou corps). Les cles BitGo sont simulees par une paire Ed25519 locale ; la vraie JWKS de prod est ES256 (verifieur teste en aller-retour local, pas sur un vrai JWT BitGo). Les champs de transaction dans le JWT sont supposes identiques au payload en clair (non documente).
- Delai maximal de reponse non documente. Pas de HTTPS ni de liste blanche d'IP d'egress BitGo (requis en production). La liste blanche et le plafond sont statiques, pas de cumul journalier.
- `halfSigned.txHex` n'est pas decode (l'exemple de la doc est tronque) ; la decision repose sur `outputs` et `spendAmount`. `spendAmount` est en unites de base du coin (satoshis, wei) : le plafond doit etre regle par coin.
- Equivalents (Fordefi, Cobo, Turnkey) non necessaires : BitGo est documente.
