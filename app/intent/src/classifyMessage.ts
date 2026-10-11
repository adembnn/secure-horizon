/**
 * Classify a message (text or image) for scam detection
 * Labels: seed_phishing, fake_support, fake_refund_or_gift, fake_job, investment_pitch, legit
 */

import type { ClassificationResult, MessageLabel } from './types.js';
import { classifyMessageWithChain } from './providers/index.js';

/** Confidence threshold for warnings */
const CONFIDENCE_THRESHOLD = 0.6;

/**
 * Classify a message for potential scam content
 *
 * @param text - The message text to classify
 * @param imageBase64 - Optional base64-encoded image
 * @returns Promise<ClassificationResult> - Label and confidence score
 */
export async function classifyMessage(
  text: string,
  imageBase64?: string
): Promise<ClassificationResult> {
  const result = await classifyMessageWithChain(text, imageBase64);

  // Return the classification result
  return {
    label: result.label,
    confidence: result.confidence,
  };
}

/**
 * Classify message with provider info (for debugging)
 */
export async function classifyMessageWithProvider(
  text: string,
  imageBase64?: string
): Promise<ClassificationResult & { provider: string }> {
  return classifyMessageWithChain(text, imageBase64);
}

/**
 * Check if a classification result indicates a scam
 */
export function isScamLabel(label: MessageLabel): boolean {
  return label !== 'legit';
}

/**
 * Get human-readable description for a label
 */
export function getLabelDescription(label: MessageLabel): string {
  switch (label) {
    case 'seed_phishing':
      return 'Tentative de vol de phrase de récupération (seed phrase)';
    case 'fake_support':
      return 'Faux support technique';
    case 'fake_refund_or_gift':
      return 'Faux remboursement ou cadeau';
    case 'fake_job':
      return 'Fausse offre d\'emploi';
    case 'investment_pitch':
      return 'Proposition d\'investissement douteuse';
    case 'legit':
      return 'Message légitime';
    default:
      return 'Classification inconnue';
  }
}

/**
 * Get warning message for a classification result
 */
export function getWarningMessage(result: ClassificationResult): string | null {
  if (result.label === 'legit' && result.confidence >= CONFIDENCE_THRESHOLD) {
    return null; // No warning needed
  }

  const description = getLabelDescription(result.label);

  if (result.confidence < CONFIDENCE_THRESHOLD) {
    return `⚠️ ${description} (confiance faible: ${Math.round(result.confidence * 100)}%). Vérifie attentivement.`;
  }

  if (result.label !== 'legit') {
    return `🚨 Attention : ${description} (confiance: ${Math.round(result.confidence * 100)}%)`;
  }

  return null;
}

export default classifyMessage;
