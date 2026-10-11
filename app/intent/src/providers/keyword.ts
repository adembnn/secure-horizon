/**
 * Keyword-based fallback provider for intent parsing and message classification
 * Used when no API keys are configured (offline mode)
 */

import type {
  AIProvider,
  IntentKind,
  MessageLabel,
  ClassificationResult,
} from '../types.js';

// Keyword patterns for intent detection (FR/EN)
// Priority order matters - higher priority intents should be checked first
const INTENT_PATTERNS: { kind: IntentKind; patterns: RegExp[]; priority: number }[] = [
  {
    kind: 'asked_by_someone',
    priority: 5, // Highest priority - safety critical
    patterns: [
      /\b(demandé|asked|dit\s+de|told\s+(me\s+)?to|conseillé|advised)\b/i,
      /\b(support|conseiller|advisor|ami|friend|recruteur|recruiter)\s+.*(m'?a|has|dit|said|demandé|asked|told)/i,
      /\b(quelqu'?un|someone)\s+(m'?a|has|dit|said|demandé|asked)\b/i,
      /\b(my|mon)\s*(advisor|conseiller|friend|ami)\s*(told|dit|demandé|asked)/i,
    ],
  },
  {
    kind: 'send_to_my_account',
    priority: 4,
    patterns: [
      /\b(vers|to|toward)\s+(mon|my)\s*(propre\s*)?(compte|account|wallet|portefeuille|ledger|exchange)/i,
      /\b(déplacer|move)\s+.*\b(mon|my|propre|own)\s*(compte|account|wallet)/i,
      /\bmon\s*(propre\s*)?(compte|wallet|ledger|exchange)\b/i,
      /\bmy\s*(own\s*)?(account|wallet|ledger|exchange)\b/i,
    ],
  },
  {
    kind: 'buy_or_swap',
    priority: 3,
    patterns: [
      /\b(buy|acheter|purchase)\b/i,
      /\b(swap|échanger)\b/i,
      /\b(trade|convertir|convert)\b/i,
      /\b(contre|for)\s+(de\s+l'?|du\s+)?(eth|btc|usdc|usdt|avax)/i,
    ],
  },
  {
    kind: 'connect_or_accept_offer',
    priority: 2,
    patterns: [
      /\b(connect|connecter|connexion|login|se\s+connecter)\b/i,
      /\b(accept|accepter|offre|offer)\b/i,
      /\b(claim|réclamer)\s*(my|mon|the|l[ea]|un|airdrop|reward|récompense)/i,
      /\b(voir|see|view|consulter|check)\s*(my|mon|le|la|the)/i,
    ],
  },
  {
    kind: 'pay_someone',
    priority: 1, // Default for send/transfer to others
    patterns: [
      /\b(pay|payer)\b/i,
      /\b(envoyer|envoi|send|transfer|transférer|virement)\s+.*(à|to)\s+(?!(mon|my))/i,
      /\b(envoyer|send)\s+\d+/i, // "send 50 ETH"
      /\bto\s+(my\s+)?friend\b/i,
    ],
  },
];

// Keyword patterns for message classification
const MESSAGE_PATTERNS: { label: MessageLabel; patterns: RegExp[]; weight: number }[] = [
  {
    label: 'seed_phishing',
    weight: 1.0,
    patterns: [
      /\b(seed|phrase|recovery|récupération|mots?|words?|12|24)\s*(phrase|secrète?|secret|backup|sauvegarde)/i,
      /\b(entrez?|enter|tapez?|type|saisir|input)\s*.*(phrase|mots?|words?|seed)/i,
      /\b(phrase|seed)\s*(de|d')?\s*(récupération|recovery|restauration|restore)/i,
      /\bvalidate\s*(your)?\s*wallet/i,
      /\bverify\s*(your)?\s*seed/i,
    ],
  },
  {
    label: 'fake_support',
    weight: 0.95,
    patterns: [
      /\b(support|assistance|aide)\s*(officiel|official|technique|technical)/i,
      /\b(contact(ez)?|appelez?|call)\s*(le\s*)?(support|assistance)/i,
      /\b(problème|problem|issue|erreur|error)\s*.*(résoudre|resolve|fix|corriger)/i,
      /\b(metamask|coinbase|binance|trust\s*wallet)\s*(support|team|équipe)/i,
      /\bwe\s*(have\s*)?(detected|noticed|found)\s*(an?\s*)?(issue|problem|error)/i,
      /\byour\s*(account|wallet)\s*(is|has\s*been)\s*(compromised|hacked|at\s*risk)/i,
      /\bsecure\s*your\s*(funds|wallet|account)/i,
      /\b(admin|modérateur|moderator)\s*(du\s*)?(groupe|group|channel)/i,
      /\b(activité|activity)\s*(suspecte?|suspicious|unusual)/i,
      /\b(sécuriser|secure)\s*(ton|your|votre)\s*(wallet|portefeuille)/i,
      /\bcliquez?\s*(sur|on)\s*(ce\s*)?(lien|link)\s*(pour|to)\s*(sécuriser|secure|vérifier|verify)/i,
    ],
  },
  {
    label: 'fake_refund_or_gift',
    weight: 0.9,
    patterns: [
      /\b(remboursement|refund|cashback|cadeau|gift|gratuit|free)\b/i,
      /\b(gagné|won|winner|gagnant|congratulations|félicitations)\b/i,
      /\b(réclamer|claim|récupérer|collect)\s*.*(reward|récompense|prize|prix)/i,
      /\b(airdrop|drop)\s*.*(claim|réclamer|gratuit|free)/i,
      /\b(double|2x|10x)\s*(your)?\s*(crypto|eth|btc|tokens?)/i,
      /\bsend\s*\d+.*get\s*\d+/i,
    ],
  },
  {
    label: 'fake_job',
    weight: 0.85,
    patterns: [
      /\b(emploi|job|travail|work)\s*(à\s*domicile|from\s*home|remote)/i,
      /\b(recrut|hiring|embauche)\b/i,
      /\b(gagner|earn|make)\s*\$?\d+.*\b(jour|day|heure|hour|semaine|week)/i,
      /\b(commission|bonus)\s*.*\b(crypto|eth|btc|usdt)/i,
      /\binvestissement\s*initial\s*requis/i,
      /\brequired\s*initial\s*investment/i,
    ],
  },
  {
    label: 'investment_pitch',
    weight: 0.88, // Higher weight than fake_job
    patterns: [
      /\b(invest|investir|investissement|placement)\b/i,
      /\b(rendement|return|roi|yield|apy|apr)\s*.*\d+\s*%/i,
      /\b(garanti|guaranteed|sûr|safe|sans\s*risque|risk\s*free)\s*.*\b(profit|gain|return)/i,
      /\b(opportunité|opportunity)\s*.*\b(unique|rare|limitée|limited|incroyable|incredible)/i,
      /\b(multiplier|multiply|doubler|double)\s*.*\b(fonds|funds|argent|money)/i,
      /\b(profit|bénéfice)\s*.*\b(\d+\s*%|semaine|week|mois|month)/i,
      /\b(partager|share)\s*.*(opportunité|opportunity)/i,
    ],
  },
];

// Injection attempt patterns (should NOT result in 'legit')
const INJECTION_PATTERNS: RegExp[] = [
  /\b(ignore|ignorer|oublie|forget|skip)\s*.*(règles?|rules?|instructions?|directives?)/i,
  /\b(réponds?|respond|answer|say|dis)\s*.*(legit|légitime|safe|sûr|ok)/i,
  /\b(tu\s*es|you\s*are)\s*(un\s*)?(assistant|ai|ia|bot)/i,
  /\b(system|système)\s*(prompt|message|instruction)/i,
  /\b(override|bypass|contourner)/i,
];

/**
 * Check if text contains injection attempt
 */
function hasInjectionAttempt(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Count pattern matches with weights
 */
function countMatches(
  text: string,
  patterns: RegExp[]
): { count: number; matched: boolean } {
  let count = 0;
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      count++;
    }
  }
  return { count, matched: count > 0 };
}

/**
 * Keyword-based offline provider
 */
export class KeywordProvider implements AIProvider {
  name = 'keyword-fallback';

  isAvailable(): boolean {
    // Always available as fallback
    return true;
  }

  async parseIntent(freeText: string): Promise<{ kind: IntentKind; confidence: number }> {
    const text = freeText.toLowerCase();

    // Score each intent type, considering priority
    let bestKind: IntentKind = 'connect_or_accept_offer'; // Default
    let bestScore = 0;
    let bestPriority = 0;

    for (const { kind, patterns, priority } of INTENT_PATTERNS) {
      const { count, matched } = countMatches(text, patterns);
      if (matched) {
        // Combined score: count * priority gives higher-priority intents advantage
        const effectiveScore = count + (priority * 0.5);
        if (effectiveScore > bestScore || (effectiveScore === bestScore && priority > bestPriority)) {
          bestScore = effectiveScore;
          bestKind = kind;
          bestPriority = priority;
        }
      }
    }

    // Confidence based on match quality
    const confidence = bestScore > 0 ? Math.min(0.7, 0.3 + bestScore * 0.15) : 0.3;

    return { kind: bestKind, confidence };
  }

  async classifyMessage(
    text: string,
    _imageBase64?: string
  ): Promise<ClassificationResult> {
    // Check for injection attempts first
    if (hasInjectionAttempt(text)) {
      // Return fake_support as it's likely trying to manipulate
      return { label: 'fake_support', confidence: 0.9 };
    }

    // Score each label
    let bestLabel: MessageLabel = 'legit';
    let bestScore = 0;

    for (const { label, patterns, weight } of MESSAGE_PATTERNS) {
      const { count, matched } = countMatches(text, patterns);
      if (matched) {
        const score = count * weight;
        if (score > bestScore) {
          bestScore = score;
          bestLabel = label;
        }
      }
    }

    // Calculate confidence
    let confidence: number;
    if (bestScore === 0) {
      // No scam patterns found
      confidence = 0.5; // Low confidence for legit (we're not sure)
    } else {
      // Scam patterns found
      confidence = Math.min(0.95, 0.5 + bestScore * 0.15);
    }

    return { label: bestLabel, confidence };
  }
}

export const keywordProvider = new KeywordProvider();
