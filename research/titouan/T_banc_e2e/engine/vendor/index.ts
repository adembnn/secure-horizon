/**
 * Sentinelle Intent Barrier
 * Core decision engine for intent-vs-effects comparison
 *
 * @module @sentinelle/intent
 */

// Re-export types
export type {
  Intent,
  IntentKind,
  AskedBy,
  Effects,
  ApprovalVia,
  Verdict,
  VerdictLevel,
  VerdictReason,
  MessageLabel,
  ClassificationResult,
  AIProvider,
} from './types.ts';

// Export main functions
export { compare } from './compare.ts';
export { parseIntent, parseIntentWithConfidence } from './parseIntent.ts';
export {
  classifyMessage,
  classifyMessageWithProvider,
  isScamLabel,
  getLabelDescription,
  getWarningMessage,
} from './classifyMessage.ts';

// Export server
export { startServer } from './server.ts';

// Export provider utilities
export {
  getAvailableProvider,
  getProviderChainInfo,
} from './providers/index.ts';
