/**
 * Tests for compare function
 * Based on rules from docs/intent-barrier.md
 */

import { describe, it, expect } from 'vitest';
import { compare } from './compare.js';
import type { Intent, Effects } from './types.js';

// Helper to create a base intent
function createIntent(overrides: Partial<Intent> = {}): Intent {
  return {
    kind: 'connect_or_accept_offer',
    declaredAt: Date.now(),
    ...overrides,
  };
}

// Helper to create base effects
function createEffects(overrides: Partial<Effects> = {}): Effects {
  return {
    chainId: 43113, // Fuji
    from: '0x1234567890123456789012345678901234567890',
    kind: 'transaction',
    outgoing: [],
    incoming: [],
    approvals: [],
    counterparties: [],
    raw: {},
    ...overrides,
  };
}

describe('compare - pay_someone rules', () => {
  it('should return ok for valid payment to declared recipient', () => {
    const intent = createIntent({
      kind: 'pay_someone',
      token: 'USDC',
      amount: '100',
      counterpartyLabel: 'Paul',
      counterpartyAddress: '0xaaaa567890123456789012345678901234567890',
    });

    const effects = createEffects({
      outgoing: [{
        token: '0xusdc',
        symbol: 'USDC',
        amount: '100',
        to: '0xaaaa567890123456789012345678901234567890',
      }],
      counterparties: [{
        address: '0xaaaa567890123456789012345678901234567890',
        isContract: false,
        firstSeenByUser: false,
      }],
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('ok');
    expect(verdict.reasons).toHaveLength(0);
  });

  it('should return critical for unexpected approval during payment', () => {
    const intent = createIntent({
      kind: 'pay_someone',
      token: 'USDC',
      amount: '100',
      counterpartyLabel: 'Paul',
    });

    const effects = createEffects({
      approvals: [{
        token: 'USDC',
        spender: '0xbbbb567890123456789012345678901234567890',
        amount: 'unlimited',
        via: 'approve',
      }],
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('critical');
    expect(verdict.reasons.some(r => r.code === 'unexpected_approval')).toBe(true);
    expect(verdict.reasons[0].does).toContain('prendre');
  });

  it('should return critical for wrong recipient', () => {
    const intent = createIntent({
      kind: 'pay_someone',
      token: 'USDC',
      amount: '100',
      counterpartyAddress: '0xaaaa567890123456789012345678901234567890',
    });

    const effects = createEffects({
      outgoing: [{
        token: '0xusdc',
        symbol: 'USDC',
        amount: '100',
        to: '0xcccc567890123456789012345678901234567890', // Different address
      }],
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('critical');
    expect(verdict.reasons.some(r => r.code === 'wrong_recipient')).toBe(true);
  });

  it('should return critical for amount exceeding declared', () => {
    const intent = createIntent({
      kind: 'pay_someone',
      token: 'USDC',
      amount: '100',
      counterpartyAddress: '0xaaaa567890123456789012345678901234567890',
    });

    const effects = createEffects({
      outgoing: [{
        token: '0xusdc',
        symbol: 'USDC',
        amount: '200', // Double the declared amount
        to: '0xaaaa567890123456789012345678901234567890',
      }],
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('critical');
    expect(verdict.reasons.some(r => r.code === 'amount_exceeded')).toBe(true);
  });

  it('should return critical for unexpected delegation during payment', () => {
    const intent = createIntent({
      kind: 'pay_someone',
      token: 'USDC',
      amount: '100',
    });

    const effects = createEffects({
      delegation: {
        to: '0xdddd567890123456789012345678901234567890',
        via: 'eip7702',
      },
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('critical');
    expect(verdict.reasons.some(r => r.code === 'unexpected_delegation')).toBe(true);
  });
});

describe('compare - send_to_my_account rules', () => {
  it('should return ok for transfer to known own address', () => {
    const intent = createIntent({
      kind: 'send_to_my_account',
      token: 'ETH',
      amount: '1',
    });

    const effects = createEffects({
      outgoing: [{
        token: 'ETH',
        amount: '1',
        to: '0xeeee567890123456789012345678901234567890',
      }],
      counterparties: [{
        address: '0xeeee567890123456789012345678901234567890',
        isContract: false,
        firstSeenByUser: false, // Not first time = known address
      }],
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('ok');
  });

  it('should return critical for approval during self-transfer', () => {
    const intent = createIntent({
      kind: 'send_to_my_account',
    });

    const effects = createEffects({
      approvals: [{
        token: 'USDC',
        spender: '0xffff567890123456789012345678901234567890',
        amount: '1000',
        via: 'permit',
      }],
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('critical');
    expect(verdict.reasons.some(r => r.code === 'unexpected_approval')).toBe(true);
  });

  it('should return critical for first-seen recipient', () => {
    const intent = createIntent({
      kind: 'send_to_my_account',
    });

    const effects = createEffects({
      outgoing: [{
        token: 'ETH',
        amount: '1',
        to: '0x1111567890123456789012345678901234567890',
      }],
      counterparties: [{
        address: '0x1111567890123456789012345678901234567890',
        isContract: false,
        firstSeenByUser: true, // Never used before
      }],
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('critical');
    expect(verdict.reasons.some(r => r.code === 'first_seen_recipient')).toBe(true);
  });
});

describe('compare - buy_or_swap rules', () => {
  it('should return ok for valid swap with incoming tokens', () => {
    const intent = createIntent({
      kind: 'buy_or_swap',
      token: 'USDC',
    });

    const effects = createEffects({
      outgoing: [{
        token: 'USDC',
        amount: '100',
        to: '0x2222567890123456789012345678901234567890',
      }],
      incoming: [{
        token: 'WETH',
        amount: '0.05',
        from: '0x2222567890123456789012345678901234567890',
      }],
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('ok');
  });

  it('should return warn for unlimited approval during swap', () => {
    const intent = createIntent({
      kind: 'buy_or_swap',
    });

    const effects = createEffects({
      outgoing: [{
        token: 'USDC',
        amount: '100',
        to: '0x3333567890123456789012345678901234567890',
      }],
      incoming: [{
        token: 'WETH',
        amount: '0.05',
        from: '0x3333567890123456789012345678901234567890',
      }],
      approvals: [{
        token: 'USDC',
        spender: '0x3333567890123456789012345678901234567890',
        amount: 'unlimited',
        via: 'approve',
      }],
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('warn');
    expect(verdict.reasons.some(r => r.code === 'unlimited_approval_swap')).toBe(true);
  });

  it('should return critical for swap with no incoming tokens', () => {
    const intent = createIntent({
      kind: 'buy_or_swap',
    });

    const effects = createEffects({
      outgoing: [{
        token: 'USDC',
        amount: '100',
        to: '0x4444567890123456789012345678901234567890',
      }],
      incoming: [], // No incoming!
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('critical');
    expect(verdict.reasons.some(r => r.code === 'no_incoming')).toBe(true);
  });

  it('should return critical for permit to new contract during swap', () => {
    const intent = createIntent({
      kind: 'buy_or_swap',
    });

    const effects = createEffects({
      incoming: [{
        token: 'WETH',
        amount: '0.05',
        from: '0x5555567890123456789012345678901234567890',
      }],
      approvals: [{
        token: 'USDC',
        spender: '0x5555567890123456789012345678901234567890',
        amount: '100',
        via: 'permit',
      }],
      counterparties: [{
        address: '0x5555567890123456789012345678901234567890',
        isContract: true,
        ageBlocks: 10, // Very new contract
        firstSeenByUser: true,
      }],
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('critical');
    expect(verdict.reasons.some(r => r.code === 'permit_new_contract')).toBe(true);
  });
});

describe('compare - connect_or_accept_offer rules', () => {
  it('should return ok for pure connection (no outgoing, no approvals)', () => {
    const intent = createIntent({
      kind: 'connect_or_accept_offer',
    });

    const effects = createEffects({
      kind: 'signature',
      outgoing: [],
      incoming: [],
      approvals: [],
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('ok');
    expect(verdict.reasons).toHaveLength(0);
  });

  it('should return critical for any outgoing during connection', () => {
    const intent = createIntent({
      kind: 'connect_or_accept_offer',
    });

    const effects = createEffects({
      outgoing: [{
        token: 'ETH',
        amount: '0.1',
        to: '0x6666567890123456789012345678901234567890',
      }],
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('critical');
    expect(verdict.reasons.some(r => r.code === 'unexpected_outgoing')).toBe(true);
  });

  it('should return critical for approve during connection', () => {
    const intent = createIntent({
      kind: 'connect_or_accept_offer',
    });

    const effects = createEffects({
      approvals: [{
        token: 'USDC',
        spender: '0x7777567890123456789012345678901234567890',
        amount: '1000',
        via: 'approve',
      }],
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('critical');
    expect(verdict.reasons.some(r => r.code === 'unexpected_approval_connect')).toBe(true);
    expect(verdict.reasons[0].does).toContain('permission');
  });

  it('should return critical for permit during connection', () => {
    const intent = createIntent({
      kind: 'connect_or_accept_offer',
    });

    const effects = createEffects({
      approvals: [{
        token: 'USDC',
        spender: '0x8888567890123456789012345678901234567890',
        amount: '1000',
        via: 'permit',
      }],
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('critical');
    expect(verdict.reasons[0].does).toContain('permit');
  });

  it('should return critical for setApprovalForAll during connection', () => {
    const intent = createIntent({
      kind: 'connect_or_accept_offer',
    });

    const effects = createEffects({
      approvals: [{
        token: 'NFT Collection',
        spender: '0x9999567890123456789012345678901234567890',
        amount: 'unlimited',
        via: 'setApprovalForAll',
      }],
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('critical');
    expect(verdict.reasons[0].does).toContain('NFTs');
  });

  it('should return critical for delegation during connection', () => {
    const intent = createIntent({
      kind: 'connect_or_accept_offer',
    });

    const effects = createEffects({
      delegation: {
        to: '0xaaaa567890123456789012345678901234567890',
        via: 'eip7702',
      },
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('critical');
    expect(verdict.reasons.some(r => r.code === 'unexpected_delegation_connect')).toBe(true);
  });
});

describe('compare - asked_by_someone rules', () => {
  it('should return critical for ANY outgoing when asked by someone', () => {
    const intent = createIntent({
      kind: 'asked_by_someone',
      askedBy: 'support',
    });

    const effects = createEffects({
      outgoing: [{
        token: 'ETH',
        amount: '0.001', // Even small amount
        to: '0xbbbb567890123456789012345678901234567890',
      }],
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('critical');
    expect(verdict.reasons.some(r => r.code === 'asked_by_someone_outgoing')).toBe(true);
    expect(verdict.reasons[0].does).toContain('arnaque');
  });

  it('should return critical for ANY approval when asked by someone', () => {
    const intent = createIntent({
      kind: 'asked_by_someone',
      askedBy: 'advisor',
    });

    const effects = createEffects({
      approvals: [{
        token: 'USDC',
        spender: '0xcccc567890123456789012345678901234567890',
        amount: '10',
        via: 'approve',
      }],
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('critical');
    expect(verdict.reasons[0].does).toContain('vrai support');
  });

  it('should return critical for delegation when asked by someone', () => {
    const intent = createIntent({
      kind: 'asked_by_someone',
      askedBy: 'friend',
    });

    const effects = createEffects({
      delegation: {
        to: '0xdddd567890123456789012345678901234567890',
        via: 'eip7702',
      },
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('critical');
  });

  it('should NOT flag pure signature when asked by someone', () => {
    const intent = createIntent({
      kind: 'asked_by_someone',
      askedBy: 'recruiter',
    });

    const effects = createEffects({
      kind: 'signature',
      outgoing: [],
      approvals: [],
    });

    const verdict = compare(intent, effects);
    // No outgoing, no approvals, no delegation = no flag
    expect(verdict.level).toBe('ok');
  });
});

describe('compare - transversal signals', () => {
  it('should warn for new contract (< 50 blocks)', () => {
    const intent = createIntent({
      kind: 'buy_or_swap',
    });

    const effects = createEffects({
      incoming: [{
        token: 'WETH',
        amount: '0.05',
        from: '0xeeee567890123456789012345678901234567890',
      }],
      counterparties: [{
        address: '0xeeee567890123456789012345678901234567890',
        isContract: true,
        ageBlocks: 20, // Very new
        firstSeenByUser: true,
      }],
    });

    const verdict = compare(intent, effects);
    expect(verdict.reasons.some(r => r.code === 'new_contract')).toBe(true);
  });

  it('should warn for high balance share (> 50%)', () => {
    const intent = createIntent({
      kind: 'pay_someone',
      counterpartyAddress: '0xffff567890123456789012345678901234567890',
    });

    const effects = createEffects({
      shareOfBalancePct: 75, // 75% of balance
      outgoing: [{
        token: 'ETH',
        amount: '10',
        to: '0xffff567890123456789012345678901234567890',
      }],
    });

    const verdict = compare(intent, effects);
    expect(verdict.reasons.some(r => r.code === 'high_balance_share')).toBe(true);
  });

  it('should return critical for lookalike address', () => {
    const intent = createIntent({
      kind: 'pay_someone',
      counterpartyAddress: '0x1234567890123456789012345678901234561234',
    });

    const effects = createEffects({
      outgoing: [{
        token: 'ETH',
        amount: '1',
        to: '0x1234bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb1234', // Lookalike
      }],
      counterparties: [{
        address: '0x1234bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb1234',
        isContract: false,
        firstSeenByUser: true,
        lookalikeOf: '0x1234567890123456789012345678901234561234', // Looks like known address
      }],
    });

    const verdict = compare(intent, effects);
    expect(verdict.level).toBe('critical');
    expect(verdict.reasons.some(r => r.code === 'lookalike_address')).toBe(true);
    expect(verdict.reasons.find(r => r.code === 'lookalike_address')?.does).toContain('empoisonnement');
  });
});

describe('compare - confidence handling', () => {
  it('should include latency in verdict', () => {
    const intent = createIntent();
    const effects = createEffects();

    const verdict = compare(intent, effects);
    expect(verdict.latencyMs).toBeGreaterThanOrEqual(0);
    expect(typeof verdict.latencyMs).toBe('number');
  });

  it('should return confidence of 1.0 for deterministic comparisons', () => {
    const intent = createIntent({
      kind: 'connect_or_accept_offer',
    });
    const effects = createEffects();

    const verdict = compare(intent, effects);
    expect(verdict.confidence).toBe(1.0);
  });
});

describe('compare - reason messages are in plain French', () => {
  it('should not contain jargon like permit/approve in user-facing text', () => {
    const intent = createIntent({
      kind: 'connect_or_accept_offer',
    });

    const effects = createEffects({
      approvals: [{
        token: 'USDC',
        spender: '0x0000567890123456789012345678901234567890',
        amount: 'unlimited',
        via: 'approve',
      }],
    });

    const verdict = compare(intent, effects);

    for (const reason of verdict.reasons) {
      // Check that jargon is not in the user-facing "does" message
      expect(reason.does.toLowerCase()).not.toContain('approve');
      expect(reason.does.toLowerCase()).not.toContain('permit ');
      // "permission" is OK in French
    }
  });

  it('should use "tu" (informal French) in messages', () => {
    const intent = createIntent({
      kind: 'asked_by_someone',
      askedBy: 'support',
    });

    const effects = createEffects({
      outgoing: [{
        token: 'ETH',
        amount: '1',
        to: '0x1111567890123456789012345678901234567890',
      }],
    });

    const verdict = compare(intent, effects);
    // French messages should use informal "tu" not "vous"
    const allText = verdict.reasons.map(r => r.said + ' ' + r.does).join(' ');
    expect(allText).not.toContain(' vous ');
  });
});
