/**
 * Hold up Intent Barrier - Core Types
 * Based on docs/intent-barrier.md specification
 */

/** Types of user intent */
export type IntentKind =
  | 'pay_someone'
  | 'send_to_my_account'
  | 'buy_or_swap'
  | 'connect_or_accept_offer'
  | 'asked_by_someone';

/** Who asked the user to perform an action (for asked_by_someone) */
export type AskedBy = 'support' | 'advisor' | 'friend' | 'recruiter' | 'other';

/**
 * User's declared intent before performing an action
 */
export interface Intent {
  kind: IntentKind;
  /** Free text phrase from the user */
  freeText?: string;
  /** Token symbol or address */
  token?: string;
  /** Amount in human-readable units */
  amount?: string;
  /** Label for counterparty (e.g., "Paul", "my Coinbase") */
  counterpartyLabel?: string;
  /** Counterparty address if selected from address book */
  counterpartyAddress?: `0x${string}`;
  /** Who asked the user to do this (for asked_by_someone) */
  askedBy?: AskedBy;
  /** Pasted message that prompted the action (optional) */
  pastedMessage?: string;
  /** When the intent was declared (ms epoch, TTL 10 min) */
  declaredAt: number;
}

/** Type of approval mechanism */
export type ApprovalVia =
  | 'approve'
  | 'permit'
  | 'permit2'
  | 'setApprovalForAll'
  | 'increaseAllowance';

/**
 * Computed effects of a transaction or signature
 */
export interface Effects {
  chainId: number;
  from: `0x${string}`;
  kind: 'transaction' | 'signature';
  outgoing: {
    token: string;
    symbol?: string;
    amount: string;
    to: `0x${string}`;
    usd?: number;
  }[];
  incoming: {
    token: string;
    symbol?: string;
    amount: string;
    from: `0x${string}`;
  }[];
  approvals: {
    token: string;
    spender: `0x${string}`;
    amount: string | 'unlimited';
    via: ApprovalVia;
    expiry?: number;
  }[];
  delegation?: {
    to: `0x${string}`;
    via: 'eip7702';
  };
  counterparties: {
    address: `0x${string}`;
    isContract: boolean;
    ageBlocks?: number;
    firstSeenByUser: boolean;
    lookalikeOf?: `0x${string}`;
  }[];
  /** Share of balance being transferred (0-100) */
  shareOfBalancePct?: number;
  raw: {
    to?: string;
    selector?: string;
    primaryType?: string;
  };
}

/** Verdict level */
export type VerdictLevel = 'ok' | 'warn' | 'critical';

/**
 * Reason for a verdict, in plain French for non-technical users
 */
export interface VerdictReason {
  /** Internal reason code */
  code: string;
  /** What the user said they wanted */
  said: string;
  /** What the transaction actually does */
  does: string;
}

/**
 * Result of comparing intent vs effects
 */
export interface Verdict {
  level: VerdictLevel;
  reasons: VerdictReason[];
  /** Confidence score 0..1; < 0.6 triggers escalation */
  confidence: number;
  /** Processing time in milliseconds */
  latencyMs: number;
}

/** Classification labels for messages */
export type MessageLabel =
  | 'seed_phishing'
  | 'fake_support'
  | 'fake_refund_or_gift'
  | 'fake_job'
  | 'investment_pitch'
  | 'legit';

/**
 * Result of classifying a message
 */
export interface ClassificationResult {
  label: MessageLabel;
  confidence: number;
}

/**
 * Provider interface for intent parsing and message classification
 */
export interface AIProvider {
  name: string;
  isAvailable(): boolean;
  parseIntent(freeText: string): Promise<{ kind: IntentKind; confidence: number }>;
  classifyMessage(
    text: string,
    imageBase64?: string
  ): Promise<ClassificationResult>;
}
