# Create Webhook Policy Rules

Source: https://developers.bitgo.com/docs/policies-webhook

## Overview

You can create webhook policy rules to enforce custom business logic for approving or denying transactions. Unlike other policy conditions that evaluate against fixed thresholds, webhook policies call out to a URL that you control. This lets you make approval decisions in real time using your own systems.

Webhook policies are especially useful if you manage your own security layer — for example, Crypto-as-a-Service (CaaS) clients who need full programmatic control over which transactions proceed.

### How It Works

Each time a user initiates a transaction from a wallet that has a webhook policy rule, BitGo sends a POST request to the URL you define. The request body includes details about the transaction, such as the wallet ID, spend amount, and outputs. Your server evaluates the transaction and responds with an HTTP status code:

- **200** — BitGo continues processing the transaction.
- **Non-200** — BitGo triggers the action you defined in the policy rule, such as denying the transaction or requiring manual approval.

> 📘
>
> For testing, you can use third-party services such as [Webhook.site](https://webhook.site/) to receive webhook requests and control response codes.

## Prerequisites

- [Policies Overview](/docs/policies-overview) (understand policy rules)
- [Create Policy Rules](/docs/policies-create) (create other types of policy rules)
- [Webhooks Overview](/docs/webhooks-overview) (understand webhooks at BitGo)
- (Optional) [Set Up Webhook Signing Keys](/docs/policies-webhook-signing-keys) (enhanced webhook security)

## Cookbook

Need just the steps? Expand the cookbook below to get started:

<Cookbook slug="policies-webhook" title="Create Webhook Policy Rules" />

## 1. Create a Deny Policy

The following example creates a webhook policy rule that denies a transaction when your server returns a non-200 response.

> Endpoint: [Add wallet-policy rule](/reference/v2walletcreatepolicy)

```bash
export COIN="<ASSET_ID>"
export WALLET_ID="<YOUR_WALLET_ID>"
export ACCESS_TOKEN="<YOUR_ACCESS_TOKEN>"
export WEBHOOK_URL="<YOUR_WEBHOOK_URL>"

curl -X POST \
  https://app.bitgo-test.com/api/v2/$COIN/wallet/$WALLET_ID/policy/rule \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "id": "my-custom-webhook-deny-rule",
    "type": "webhook",
    "condition": {
      "url": "'"$WEBHOOK_URL"'"
    },
    "action": {
      "type": "deny"
    }
  }'
```

When you initiate a transaction from this wallet, BitGo sends a POST request to your webhook URL. If your server responds with anything other than HTTP 200, BitGo blocks the transaction.

## 2. Create an Approval Policy

The following example creates a webhook policy rule that requires approval from a specified user when your server returns a non-200 response.

> Endpoint: [Add wallet-policy rule](/reference/v2walletcreatepolicy)

```bash
export COIN="<ASSET_ID>"
export WALLET_ID="<YOUR_WALLET_ID>"
export ACCESS_TOKEN="<YOUR_ACCESS_TOKEN>"
export WEBHOOK_URL="<YOUR_WEBHOOK_URL>"
export APPROVER_USER_ID="<APPROVER_USER_ID>"

curl -X POST \
  https://app.bitgo-test.com/api/v2/$COIN/wallet/$WALLET_ID/policy/rule \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "id": "my-custom-webhook-approval-rule",
    "type": "webhook",
    "condition": {
      "url": "'"$WEBHOOK_URL"'"
    },
    "action": {
      "type": "getApproval",
      "approvalsRequired": 1,
      "userIds": ["'"$APPROVER_USER_ID"'"]
    }
  }'
```

If your server responds with a non-200 status code, the transaction enters a pending-approval state. It does not proceed until the specified user approves it. To learn how to resolve pending approvals, see [Update Policy Rules](/docs/policies-update).

## 3. Review the Webhook Request Payload

When a transaction triggers a webhook policy, BitGo sends a POST request to your URL. The following is an example of the payload that BitGo sends:

```json
{
  "walletId": "5fb34d22bbd86300328d60813fcd7906",
  "ruleId": "my-custom-webhook-deny-rule",
  "type": "webhook",
  "spendAmount": "200000",
  "approvalCount": 0,
  "halfSigned": {
    "txHex": "01000000000101c92fd8e311fe..."
  },
  "outputs": [
    {
      "address": "2MzVfLyXXXjLBQdA6D8gY6DM9hR1XdJkZjR",
      "value": 200000,
      "wallet": "5ef52bdc4ba8da93002ae504e3fa89d0"
    },
    {
      "address": "2NA5QxTc2rDi18fgWrZCNoaa9ktp5ucWeFC",
      "value": 814469,
      "wallet": "5fb34d22bbd86300328d60813fcd7906"
    }
  ]
}
```

The following table describes each field in the payload:

| Field | Description |
| --- | --- |
| `walletId` | The ID of the wallet initiating the transaction. |
| `ruleId` | The ID you assigned when you created the webhook policy rule. |
| `type` | The policy rule type. Always `webhook` for webhook policies. |
| `spendAmount` | The total amount being sent, in base units (for example, satoshis for BTC). |
| `approvalCount` | The number of approvals the transaction has received so far. |
| `halfSigned` | The half-signed transaction hex. |
| `outputs` | An array of transaction outputs, each including the destination address, value, and associated wallet ID. |

You can use this data to run custom checks — for example, verifying that the destination address exists in your internal allowlist, or that the spend amount falls within a limit that your system manages.

## Best Practices

- **Design for idempotency.** BitGo may retry the request if the initial attempt fails. Make sure your webhook handler can safely process the same request more than once.
- **Omit the coin field.** BitGo recommends using webhook policy rules without setting a coin, so that they apply to all coins and tokens in the wallet.
- **Respond quickly.** BitGo expects a timely response from your webhook endpoint. If your server is slow or unresponsive, it may delay transaction processing.
- **Use HTTPS.** Always use an HTTPS URL for your webhook endpoint to protect transaction data in transit.
- **Whitelist BitGo egress IPs.** If your infrastructure restricts inbound traffic, [download](https://assets.bitgo.com/downloads/bitgo_egress_ips.json) the list of BitGo egress IP addresses for testnet and production, and add them to your whitelist.

## See Also

- API Reference: [Add wallet-policy rule](/reference/v2walletcreatepolicy)
- API Reference: [Update pending approval](/reference/v2approvalupdate)
- API Reference: [Update wallet-policy rule](/reference/v2walletupdatepolicy)
- [Create Policy Rules](/docs/policies-create)
- [Deactivate Policy Rules](/docs/policies-deactivate)
- [Manage Policy Webhook Signing Keys](/docs/policies-webhook-signing-keys)
- [Policies Overview](/docs/policies-overview)
- [Update Policy Rules](/docs/policies-update)
- [Webhooks Overview](/docs/webhooks-overview)
