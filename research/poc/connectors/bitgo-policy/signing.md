# Set Up Webhook Signing Keys

Source: https://developers.bitgo.com/docs/policies-webhook-signing-keys

## Overview

When you [Create Webhook Policy Rules](/docs/policies-webhook), BitGo sends a signed `POST` request to your server each time a transaction triggers the policy. The request includes a JSON Web Token (JWT) that enables you to verify the webhook originates from BitGo before you approve or deny the transaction.

When you use webhook signing keys, your server must also respond with a signed JWT that includes the original `evaluationId` and a `statusCode` in the payload. BitGo uses the `evaluationId` to prevent replay attacks and the `statusCode` to determine whether to approve or deny the transaction.

BitGo publishes its public keys through a standard JSON Web Key Set (JWKS) endpoint. You can also register, list, and revoke the webhook signing keys for your enterprise using the [Revoke a webhook signing key](/reference/v1enterprisewebhookskeysrevoke) endpoint.

### Webhook Signing Keys vs Webhook Secrets

* Webhook signing keys apply specifically to policy rule webhooks. When a transaction triggers a policy, BitGo asks you to approve or deny it. BitGo signs the request with a JWT so you can confirm the authenticity before acting. Your response carries consequences — an approval or rejections. This is a two-way enforcement system.
* [Webhook secrets](/reference/v2webhooksecretcreate) utilize a shared secret so you can verify inbound webhook notifications from BitGo. These webhooks handle general wallet and enterprise events. When BitGo sends notifications to you, no response is required, and verification is optional. It's a one-way, passive system.

When you use webhook signing keys, you don't need to use webhook secrets.

### How It Works

1. BitGo sends a signed JWT to your webhook URL when a transaction triggers a policy.
2. Your server verifies the BitGo JWT signature using the JWKS endpoint.
3. Your server evaluates the transaction and builds a response JWT that includes:
   - `evaluationId` — Echo back the evaluation ID from the BitGo request to prevent replay attacks.
   - `statusCode` — Set to `200` to approve the transaction, or a non-200 value to trigger the policy action (deny or require approval).
4. Your server signs the response JWT with your registered signing key and returns it to BitGo.
5. BitGo verifies your response JWT using the public key you registered and reads the `statusCode` to proceed.

### Best Practices

- **Cache the JWKS response** - The BitGo public keys are immutable and safe to cache. This reduces latency when verifying policy webhook signatures.
- **Rotate keys proactively** - Register a new key before revoking an old one to avoid downtime in signature verification.
- **Validate both `kid` and `iss`** - Always check that the JWT's key ID matches a key in the JWKS response and that the issuer is a trusted BitGo domain.
- **Use HTTPS for JWKS URIs** - If you register a hosted JWKS endpoint, always use HTTPS to protect key material in transit.
- **Monitor key status** - Periodically list your registered keys to confirm their status and remove any that are no longer in use.

## Prerequisites

- [Policies Overview](/docs/policies-overview)
- [Create Webhook Policy Rules](/docs/policies-webhook)
- Enable this feature by contacting support@bitgo.com.

## 1. Get BitGo Public Keys

Get the JWKS from BitGo using a well-known endpoint that's publicly accessible and doesn't require authentication.

```shell cURL
curl -X GET https://app.bitgo.com/.well-known/jwks.json
```

#### Step Result

The JWKS returns keys in standard <a href="https://datatracker.ietf.org/doc/html/rfc7517" target="_blank" rel="noreferrer">RFC 7517</a> format.

> 📘 **Note**
>
> The BitGo public keys are immutable and safe to cache. You can cache the JWKS response to reduce latency when verifying policy webhook signatures.

```json JSON
{
  "keys": [
    {
      "kty": "OKP",            // Key type. `OKP` for EdDSA keys, `EC` for ECDSA keys.
      "use": "sig",            // Key usage. Always `sig` (signature).
      "kid": "bitgo-key-v1",   // Key ID. Must match the `kid` in the JWT header to select the correct verification key.
      "alg": "EdDSA",          // Signing algorithm. For example, `EdDSA`.
      "crv": "Ed25519",        // Cryptographic curve. For example, `Ed25519` for EdDSA.
      "x": "<base64url-encoded-public-key>"   // The base64url-encoded public key.
    }
  ]
}
```

## 2. Verify JWT

Using the public keys you received in the prior step, you can verify the JWT included in each policy webhook request from BitGo by validating both the key ID (`kid`) and issuer (`iss`) claim.

* The JWT that BitGo signs includes a `kid` in the header. Match this `kid` against the BitGo public keys. If the key don't match, reject the request.
* The JWT payload includes an `iss` claim. Verify the issuer is a trusted BitGo domain (such as `https://app.bitgo.com`). If the issuer doesn't match, reject the request.

The following example shows the full round-trip, verifying incoming JWT from BitGo and building your signed response JWT with the required `evaluationId` and `statusCode` claims.

```js JavaScript
const jose = require("jose");
const crypto = require("crypto");

const TRUSTED_ISSUERS = [
  "https://app.bitgo.com",
  "https://app.bitgo-test.com",
];

async function handlePolicyWebhook(incomingToken, privateKey, keyId) {
  const JWKS = jose.createRemoteJWKSet(
    new URL("https://app.bitgo.com/.well-known/jwks.json")
  );

  const { payload } = await jose.jwtVerify(incomingToken, JWKS);

  if (!TRUSTED_ISSUERS.includes(payload.iss)) {
    throw new Error(`Untrusted issuer: ${payload.iss}`);
  }

  const evaluationId = payload.evaluationId;
  const approved = evaluateTransaction(payload);

  const responseJwt = await new jose.SignJWT({
    evaluationId: evaluationId,
    statusCode: approved ? 200 : 403,
  })
    .setProtectedHeader({ alg: "EdDSA", kid: keyId })
    .setIssuedAt()
    .sign(privateKey);

  return responseJwt;
}

function evaluateTransaction(payload) {
  // Add your custom business logic here
  return true;
}
```
```python Python
import jwt
import requests
import time

TRUSTED_ISSUERS = [
    "https://app.bitgo.com",
    "https://app.bitgo-test.com",
]

def handle_policy_webhook(incoming_token, private_key, key_id):
    JWKS_URL = "https://app.bitgo.com/.well-known/jwks.json"

    jwks_response = requests.get(JWKS_URL)
    jwks = jwks_response.json()

    unverified_header = jwt.get_unverified_header(incoming_token)
    kid = unverified_header.get("kid")

    matching_key = None
    for key in jwks["keys"]:
        if key["kid"] == kid:
            matching_key = key
            break

    if not matching_key:
        raise ValueError(f"No matching key found for kid: {kid}")

    public_key = jwt.algorithms.OKPAlgorithm.from_jwk(matching_key)

    payload = jwt.decode(
        incoming_token,
        public_key,
        algorithms=[matching_key["alg"]],
        options={"verify_iss": False},
    )

    if payload.get("iss") not in TRUSTED_ISSUERS:
        raise ValueError(f"Untrusted issuer: {payload.get('iss')}")

    evaluation_id = payload["evaluationId"]
    approved = evaluate_transaction(payload)

    response_jwt = jwt.encode(
        {
            "evaluationId": evaluation_id,
            "statusCode": 200 if approved else 403,
            "iat": int(time.time()),
        },
        private_key,
        algorithm="EdDSA",
        headers={"kid": key_id},
    )

    return response_jwt


def evaluate_transaction(payload):
    # Add your custom business logic here
    return True
```

## 3. Register Webhook Signing Key

You must be an enterprise owner to register a webhook signing key. Your webhook signing key is valid for your entire enterprise. You can provide the key inline as a JWKS payload or reference a hosted JWKS endpoint URI.

> 📘 **Note**
>
> This endpoint requires the `X-BitGo-OTP` header. Provide a one-time password from your 2FA device (e.g. BitGo Authenticator or your configured authenticator app).

> Endpoint: [Register a webhook signing key](/reference/v1enterprisewebhookskeysregister)

```shell cURL (Inline JWKS)
export ENTERPRISE_ID="<YOUR_ENTERPRISE_ID>"
export ACCESS_TOKEN="<YOUR_ACCESS_TOKEN>"
export OTP="<YOUR_OTP>"

curl -X POST \
  "https://app.bitgo-test.com/api/v1/enterprise/$ENTERPRISE_ID/webhooks/keys" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-BitGo-OTP: $OTP" \
  -d '{
    "jwks": {
      "keys": [
        {
          "kty": "OKP",
          "use": "sig",
          "kid": "customer-prod-key-2026",
          "alg": "EdDSA",
          "crv": "Ed25519",
          "x": "<base64url-encoded-public-key>"
        }
      ]
    },
    "keyName": "Production Webhook Key"
  }'
```
```shell cURL (JWKS URI)
export ENTERPRISE_ID="<YOUR_ENTERPRISE_ID>"
export ACCESS_TOKEN="<YOUR_ACCESS_TOKEN>"
export OTP="<YOUR_OTP>"

curl -X POST \
  "https://app.bitgo-test.com/api/v1/enterprise/$ENTERPRISE_ID/webhooks/keys" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-BitGo-OTP: $OTP" \
  -d '{
    "jwksUri": "https://example.com/.well-known/jwks.json",
    "keyName": "Production Webhook Key"
  }'
```

#### Step Result

```json JSON
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "keyId": "customer-prod-key-2026",
  "algorithm": "EdDSA",
  "jwksUri": null,
  "status": "ACTIVE",
  "createdDate": "2026-01-12T10:30:00Z"
}
```

## 4. List Webhook Signing Keys

List all webhook signing keys registered to your enterprise. This endpoint returns key metadata only — public key material and JWK data aren't included.

> Endpoint: [List webhook signing keys](/reference/v1enterprisewebhookskeyslist)

```shell cURL
export ENTERPRISE_ID="<YOUR_ENTERPRISE_ID>"
export ACCESS_TOKEN="<YOUR_ACCESS_TOKEN>"

curl -X GET \
  "https://app.bitgo-test.com/api/v1/enterprise/$ENTERPRISE_ID/webhooks/keys?status=ACTIVE&limit=50" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### Step Result

```json JSON
{
  "keys": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "keyId": "customer-prod-key-2026",
      "algorithm": "EdDSA",
      "status": "ACTIVE",
      "createdDate": "2026-01-12T10:30:00Z"
    }
  ],
  "nextBatchPrevId": "1",
  "total": 1
}
```

## 5. (Optional) Revoke Webhook Signing Key

You can revoke a webhook signing key when you no longer need it or if you suspect it may be compromised. Revoking a key performs a soft delete — BitGo preserves the key record for audit purposes but marks the key as `REVOKED`. You can't use revoked keys for policy webhook signature verification.

> 🚧 **Warning**
>
> Revocation is permanent. To restore webhook signing capability after revoking a key, you must register a new key.

> 📘 **Note**
>
> This endpoint requires the `X-BitGo-OTP` header. Provide a one-time password from your 2FA device (e.g. BitGo Authenticator or your configured authenticator app).

> Endpoint: [Revoke a webhook signing key](/reference/v1enterprisewebhookskeysrevoke)

```shell cURL
export ENTERPRISE_ID="<YOUR_ENTERPRISE_ID>"
export KEY_ID="customer-prod-key-2026"
export ACCESS_TOKEN="<YOUR_ACCESS_TOKEN>"
export OTP="<YOUR_OTP>"

curl -X DELETE \
  "https://app.bitgo-test.com/api/v1/enterprise/$ENTERPRISE_ID/webhooks/keys/$KEY_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-BitGo-OTP: $OTP"
```

#### Step Result

```json JSON
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "keyId": "customer-prod-key-2026",
  "status": "REVOKED",
  "revokedDate": "2026-03-17T14:00:00Z"
}
```

## See Also

- [API Reference: Register a webhook signing key](/reference/v1enterprisewebhookskeysregister)
- [API Reference: List webhook signing keys](/reference/v1enterprisewebhookskeyslist)
- [API Reference: Revoke a webhook signing key](/reference/v1enterprisewebhookskeysrevoke)
- [Create Webhook Policy Rules](/docs/policies-webhook)
- [Policies Overview](/docs/policies-overview)
- [Create Policy Rules](/docs/policies-create)
- [RFC 7517 — JSON Web Key (JWK)](https://datatracker.ietf.org/doc/html/rfc7517)
