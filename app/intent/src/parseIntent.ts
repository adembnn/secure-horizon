/**
 * Parse free text into a structured Intent
 * Uses AI providers when available, falls back to keyword matching
 */

import type { Intent, IntentKind, AskedBy } from './types.js';
import { parseIntentWithChain } from './providers/index.js';

// Keywords to detect "asked by someone" pattern
const ASKED_BY_PATTERNS: { askedBy: AskedBy; patterns: RegExp[] }[] = [
  {
    askedBy: 'support',
    patterns: [/\b(support|assistance|aide|helpdesk)\b/i],
  },
  {
    askedBy: 'advisor',
    patterns: [/\b(conseiller|advisor|consultant|coach|expert)\b/i],
  },
  {
    askedBy: 'friend',
    patterns: [/\b(ami|friend|pote|copain|copine|mate)\b/i],
  },
  {
    askedBy: 'recruiter',
    patterns: [/\b(recruteur|recruiter|rh|hiring|employeur|employer)\b/i],
  },
];

// Token pattern to extract from text
const TOKEN_PATTERN = /\b(ETH|BTC|USDT|USDC|AVAX|SOL|MATIC|DAI|WETH|WBTC|\$\w+)\b/i;

// Amount pattern to extract from text
const AMOUNT_PATTERN = /\b(\d+(?:[.,]\d+)?)\s*(?:ETH|BTC|USDT|USDC|AVAX|SOL|MATIC|DAI|WETH|WBTC|\$|€|tokens?|coins?)?\b/i;

/**
 * Extract token symbol from free text
 */
function extractToken(text: string): string | undefined {
  const match = text.match(TOKEN_PATTERN);
  return match ? match[1].toUpperCase() : undefined;
}

/**
 * Extract amount from free text
 */
function extractAmount(text: string): string | undefined {
  const match = text.match(AMOUNT_PATTERN);
  return match ? match[1].replace(',', '.') : undefined;
}

/**
 * Detect who asked the user to do this action
 */
function detectAskedBy(text: string): AskedBy | undefined {
  for (const { askedBy, patterns } of ASKED_BY_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return askedBy;
      }
    }
  }
  return 'other';
}

/**
 * Parse free text into a structured Intent
 *
 * @param freeText - The user's description of what they want to do
 * @returns Promise<Intent> - Structured intent with kind, token, amount, etc.
 */
export async function parseIntent(freeText: string): Promise<Intent> {
  // Use AI provider chain to determine intent kind
  const { kind, confidence } = await parseIntentWithChain(freeText);

  // Extract additional details from the text
  const token = extractToken(freeText);
  const amount = extractAmount(freeText);

  // Build the intent object
  const intent: Intent = {
    kind,
    freeText,
    declaredAt: Date.now(),
  };

  // Add optional fields if detected
  if (token) {
    intent.token = token;
  }
  if (amount) {
    intent.amount = amount;
  }

  // For asked_by_someone, detect who asked
  if (kind === 'asked_by_someone') {
    intent.askedBy = detectAskedBy(freeText);
  }

  return intent;
}

/**
 * Parse intent with confidence score (for internal use)
 */
export async function parseIntentWithConfidence(
  freeText: string
): Promise<{ intent: Intent; confidence: number; provider: string }> {
  const { kind, confidence, provider } = await parseIntentWithChain(freeText);

  const token = extractToken(freeText);
  const amount = extractAmount(freeText);

  const intent: Intent = {
    kind,
    freeText,
    declaredAt: Date.now(),
  };

  if (token) {
    intent.token = token;
  }
  if (amount) {
    intent.amount = amount;
  }

  if (kind === 'asked_by_someone') {
    intent.askedBy = detectAskedBy(freeText);
  }

  return { intent, confidence, provider };
}

export default parseIntent;
