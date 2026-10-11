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
} from './types.js';

// Export main functions
export { compare } from './compare.js';
export { parseIntent, parseIntentWithConfidence } from './parseIntent.js';
export {
  classifyMessage,
  classifyMessageWithProvider,
  isScamLabel,
  getLabelDescription,
  getWarningMessage,
} from './classifyMessage.js';

// Export server
export { startServer } from './server.js';

// Export provider utilities
export {
  getAvailableProvider,
  getProviderChainInfo,
} from './providers/index.js';
