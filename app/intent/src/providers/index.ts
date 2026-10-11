/**
 * Provider chain for AI-based intent parsing and message classification
 * Tries providers in order: Cloudflare Clef-flash -> Jev -> Keyword fallback
 */

import type {
  AIProvider,
  IntentKind,
  ClassificationResult,
} from '../types.js';

import { cloudflareClefFlashProvider } from './cloudflare.js';
import { jevProvider } from './jev.js';
import { keywordProvider } from './keyword.js';

export { cloudflareClefFlashProvider, cloudflareClefFlashProvider as cloudflareProvider } from './cloudflare.js';
export { jevProvider } from './jev.js';
export { keywordProvider } from './keyword.js';

/**
 * Get the first available provider from the chain
 */
export function getAvailableProvider(): AIProvider {
  // Try providers in priority order
  if (cloudflareClefFlashProvider.isAvailable()) {
    return cloudflareClefFlashProvider;
  }
  if (jevProvider.isAvailable()) {
    return jevProvider;
  }
  // Keyword provider is always available as fallback
  return keywordProvider;
}

/**
 * Get provider chain info (for debugging/logging)
 */
export function getProviderChainInfo(): {
  available: string[];
  active: string;
} {
  const available: string[] = [];
  let active = 'keyword-fallback';

  if (cloudflareClefFlashProvider.isAvailable()) {
    available.push('cloudflare-clef-flash');
    active = 'cloudflare-clef-flash';
  }
  if (jevProvider.isAvailable()) {
    available.push('jev');
    if (!cloudflareClefFlashProvider.isAvailable()) {
      active = 'jev';
    }
  }
  available.push('keyword-fallback'); // Always available

  return { available, active };
}

/**
 * Parse intent using the provider chain
 */
export async function parseIntentWithChain(
  freeText: string
): Promise<{ kind: IntentKind; confidence: number; provider: string }> {
  const provider = getAvailableProvider();
  const result = await provider.parseIntent(freeText);
  return { ...result, provider: provider.name };
}

/**
 * Classify message using the provider chain
 */
export async function classifyMessageWithChain(
  text: string,
  imageBase64?: string
): Promise<ClassificationResult & { provider: string }> {
  const provider = getAvailableProvider();
  const result = await provider.classifyMessage(text, imageBase64);
  return { ...result, provider: provider.name };
}
