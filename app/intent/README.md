# @sentinelle/intent

**Intent Barrier** - Core decision engine for Hold up.

Compares user intent with actual transaction effects to detect drainer attacks, phishing, and scams before they happen.

## Features

- **`compare(intent, effects)`** - Compare declared intent vs actual transaction effects
- **`parseIntent(freeText)`** - Parse natural language intent into structured format
- **`classifyMessage(text)`** - Classify messages for scam detection
- **HTTP Server** - REST API on `127.0.0.1:8787` for Snap integration

## Installation

```bash
cd app/intent
npm install
npm run build
```

## Usage

### As a library

```typescript
import { compare, parseIntent, classifyMessage } from '@sentinelle/intent';

// Compare intent with effects
const intent = {
  kind: 'connect_or_accept_offer',
  declaredAt: Date.now(),
};

const effects = {
  chainId: 43113,
  from: '0x...',
  kind: 'signature',
  outgoing: [],
  incoming: [],
  approvals: [{
    token: 'USDC',
    spender: '0x...',
    amount: 'unlimited',
    via: 'permit',
  }],
  counterparties: [],
  raw: {},
};

const verdict = compare(intent, effects);
// verdict.level: 'ok' | 'warn' | 'critical'
// verdict.reasons: [{ code, said, does }]

// Parse intent from text
const parsedIntent = await parseIntent("Je veux me connecter au site");
// parsedIntent.kind: 'connect_or_accept_offer'

// Classify a message
const result = await classifyMessage("MetaMask support here, your account is compromised");
// result.label: 'fake_support'
// result.confidence: 0.9
```

### As HTTP server

```bash
npm run dev  # Development with hot reload
npm start    # Production
```

#### Endpoints

- `POST /check` - Compare intent with effects
- `POST /classify` - Classify a message
- `POST /parse` - Parse free text into intent
- `GET /health` - Health check and provider info

#### Request examples

```bash
# Check intent vs effects
curl -X POST http://127.0.0.1:8787/check \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "Je veux me connecter",
    "input": {
      "chainId": 43113,
      "from": "0x1234...",
      "kind": "signature",
      "outgoing": [],
      "incoming": [],
      "approvals": [{"token": "USDC", "spender": "0x...", "amount": "unlimited", "via": "permit"}],
      "counterparties": [],
      "raw": {}
    }
  }'

# Classify a message
curl -X POST http://127.0.0.1:8787/classify \
  -H "Content-Type: application/json" \
  -d '{"text": "Enter your seed phrase to verify your wallet"}'
```

## AI Providers

The system uses a provider chain for AI-based intent parsing and message classification:

1. **Cloudflare Clef-flash** (if `CF_ACCOUNT_ID` and `CF_API_TOKEN` are set)
2. **Jev** (if `JEV_API_KEY` is set)
3. **Keyword fallback** (always available, offline)

Copy `.env.example` to `.env` and configure your API keys.

## Comparison Rules

Based on `docs/intent-barrier.md`:

| Intent | Expected | Critical if |
|--------|----------|-------------|
| `pay_someone` | 1 outgoing to declared recipient | approval/permit/delegation; wrong recipient; lookalike; amount exceeded |
| `send_to_my_account` | 1 outgoing to known own address | first-seen recipient; approval/permit |
| `buy_or_swap` | outgoing A + incoming B | unlimited approval; no incoming; permit to new contract |
| `connect_or_accept_offer` | no outgoing, no approvals | any outgoing, approval, permit, setApprovalForAll, delegation |
| `asked_by_someone` | — | **always critical** if any outgoing or approval |

Transversal signals (always checked):
- New contract (< 50 blocks)
- High balance share (> 50%)
- Lookalike address (address poisoning)

## Message Classification Labels

- `seed_phishing` - Seed phrase/recovery phrase requests
- `fake_support` - Fake tech support impersonation
- `fake_refund_or_gift` - Fake airdrops, refunds, doubler scams
- `fake_job` - Fake job offers with crypto payments
- `investment_pitch` - Ponzi/MLM investment schemes
- `legit` - Legitimate message

## Testing

```bash
npm test          # Run all tests
npm run test:watch  # Watch mode
```

## Security Mappings

- **NIST CSF 2.0**: DE.CM (surveillance), DE.AE (event analysis), PR.AT (awareness)
- **ATT&CK**: T1566 (Phishing), T1656 (Impersonation), T1657 (Financial Theft)
- **OWASP Agentic**: ASI01 (Prompt Injection prevented via data delimitation)

## License

MIT
