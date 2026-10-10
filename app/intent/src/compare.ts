/**
 * Sentinelle Intent Barrier - Comparator
 * Compares user intent with actual transaction effects
 * Rules based on docs/intent-barrier.md
 */

import type { Intent, Effects, Verdict, VerdictReason, VerdictLevel } from './types.js';

/** Minimum confidence threshold before escalating to warn */
const CONFIDENCE_THRESHOLD = 0.6;

/** Contract age threshold in blocks (roughly 10 minutes on most chains) */
const NEW_CONTRACT_THRESHOLD_BLOCKS = 50;

/** Balance share threshold for warning */
const HIGH_BALANCE_SHARE_PCT = 50;

/**
 * Check if an address is a lookalike of another (same first 4 and last 4 hex chars)
 */
function isLookalike(addr1: string, addr2: string): boolean {
  if (!addr1 || !addr2) return false;
  const a1 = addr1.toLowerCase();
  const a2 = addr2.toLowerCase();
  if (a1 === a2) return false; // Same address is not a lookalike
  return (
    a1.slice(0, 6) === a2.slice(0, 6) && // 0x + first 4 hex
    a1.slice(-4) === a2.slice(-4)
  );
}

/**
 * Check if there are any approvals/permits in the effects
 */
function hasApprovals(effects: Effects): boolean {
  return effects.approvals.length > 0;
}

/**
 * Check if there's a delegation (EIP-7702)
 */
function hasDelegation(effects: Effects): boolean {
  return effects.delegation !== undefined;
}

/**
 * Check if there are any outgoing transfers
 */
function hasOutgoing(effects: Effects): boolean {
  return effects.outgoing.length > 0;
}

/**
 * Check if there are any unlimited approvals
 */
function hasUnlimitedApproval(effects: Effects): boolean {
  return effects.approvals.some((a) => a.amount === 'unlimited');
}

/**
 * Check if there's a setApprovalForAll
 */
function hasSetApprovalForAll(effects: Effects): boolean {
  return effects.approvals.some((a) => a.via === 'setApprovalForAll');
}

/**
 * Create a reason in plain French for non-technical users
 */
function reason(code: string, said: string, does: string): VerdictReason {
  return { code, said, does };
}

/**
 * Format amount for display
 */
function formatAmount(amount: string, symbol?: string): string {
  const sym = symbol || 'tokens';
  return `${amount} ${sym}`;
}

/**
 * Compare user intent with transaction effects
 * Returns a verdict with level, reasons, and confidence
 */
export function compare(intent: Intent, effects: Effects): Verdict {
  const start = performance.now();
  const reasons: VerdictReason[] = [];
  let level: VerdictLevel = 'ok';
  let confidence = 1.0;

  // Helper to escalate level
  const escalate = (newLevel: VerdictLevel) => {
    if (newLevel === 'critical' || (newLevel === 'warn' && level === 'ok')) {
      level = newLevel;
    }
  };

  // Rule: asked_by_someone with any outgoing or approval is ALWAYS critical
  if (intent.kind === 'asked_by_someone') {
    if (hasOutgoing(effects) || hasApprovals(effects) || hasDelegation(effects)) {
      reasons.push(
        reason(
          'asked_by_someone_outgoing',
          `Tu as dit que quelqu'un t'a demandé de faire cette action`,
          `Aucun vrai support, conseiller ou ami ne te demandera jamais de déplacer tes fonds ou de signer une autorisation. C'est une arnaque.`
        )
      );
      escalate('critical');
    }
  }

  // Transversal signals

  // Check for new contracts (< N blocks old)
  for (const cp of effects.counterparties) {
    if (cp.ageBlocks !== undefined && cp.ageBlocks < NEW_CONTRACT_THRESHOLD_BLOCKS) {
      reasons.push(
        reason(
          'new_contract',
          `Tu veux interagir avec un contrat`,
          `Ce contrat vient d'être créé (moins de ${NEW_CONTRACT_THRESHOLD_BLOCKS} blocs). Les escrocs créent souvent des contrats éphémères pour voler des fonds.`
        )
      );
      escalate('warn');
    }
  }

  // Check for high balance share
  if (
    effects.shareOfBalancePct !== undefined &&
    effects.shareOfBalancePct > HIGH_BALANCE_SHARE_PCT
  ) {
    reasons.push(
      reason(
        'high_balance_share',
        `Tu veux envoyer une partie de tes fonds`,
        `Cette transaction représente plus de ${HIGH_BALANCE_SHARE_PCT}% de ton solde. Vérifie que c'est bien ce que tu veux.`
      )
    );
    escalate('warn');
  }

  // Check for lookalike addresses
  for (const cp of effects.counterparties) {
    if (cp.lookalikeOf) {
      reasons.push(
        reason(
          'lookalike_address',
          `Tu veux envoyer à une adresse connue`,
          `L'adresse ${cp.address.slice(0, 10)}... ressemble à une adresse que tu as utilisée avant, mais ce n'est pas la même. C'est une technique d'arnaque courante (empoisonnement d'adresse).`
        )
      );
      escalate('critical');
    }
  }

  // Intent-specific rules
  switch (intent.kind) {
    case 'pay_someone':
      checkPaySomeone(intent, effects, reasons, escalate);
      break;

    case 'send_to_my_account':
      checkSendToMyAccount(intent, effects, reasons, escalate);
      break;

    case 'buy_or_swap':
      checkBuyOrSwap(intent, effects, reasons, escalate);
      break;

    case 'connect_or_accept_offer':
      checkConnectOrAcceptOffer(intent, effects, reasons, escalate);
      break;

    // asked_by_someone is handled above
  }

  // If confidence < 0.6, escalate to at least warn
  if (confidence < CONFIDENCE_THRESHOLD && level === 'ok') {
    reasons.push(
      reason(
        'low_confidence',
        `Tu veux effectuer cette action`,
        `Je ne suis pas sûr de bien comprendre cette transaction. Vérifie attentivement avant de continuer.`
      )
    );
    escalate('warn');
  }

  const latencyMs = performance.now() - start;

  return {
    level,
    reasons,
    confidence,
    latencyMs,
  };
}

/**
 * Rules for pay_someone intent
 * Expected: 1 outgoing of declared token, <= declared amount, to declared contact
 * Critical: any approval/permit/delegation; recipient != contact; lookalike; amount > declared
 */
function checkPaySomeone(
  intent: Intent,
  effects: Effects,
  reasons: VerdictReason[],
  escalate: (level: VerdictLevel) => void
): void {
  // Check for unexpected approvals/permits/delegations
  if (hasApprovals(effects)) {
    const approval = effects.approvals[0];
    const amountText =
      approval.amount === 'unlimited'
        ? 'tous tes tokens, sans limite'
        : `${approval.amount} tokens`;
    reasons.push(
      reason(
        'unexpected_approval',
        `Tu veux simplement envoyer ${intent.amount || 'des'} ${intent.token || 'tokens'} à ${intent.counterpartyLabel || 'quelqu\'un'}`,
        `En réalité, ce site obtiendrait le droit de prendre ${amountText}, sans te redemander.`
      )
    );
    escalate('critical');
  }

  if (hasDelegation(effects)) {
    reasons.push(
      reason(
        'unexpected_delegation',
        `Tu veux simplement envoyer des fonds`,
        `En réalité, tu donnerais le contrôle total de ton compte à un autre contrat.`
      )
    );
    escalate('critical');
  }

  // Check recipient
  if (intent.counterpartyAddress && effects.outgoing.length > 0) {
    for (const out of effects.outgoing) {
      if (out.to.toLowerCase() !== intent.counterpartyAddress.toLowerCase()) {
        reasons.push(
          reason(
            'wrong_recipient',
            `Tu veux envoyer à ${intent.counterpartyLabel || intent.counterpartyAddress.slice(0, 10) + '...'}`,
            `En réalité, les fonds iraient à une autre adresse : ${out.to.slice(0, 10)}...`
          )
        );
        escalate('critical');
      }
    }
  }

  // Check amount
  if (intent.amount && effects.outgoing.length > 0) {
    const declaredAmount = parseFloat(intent.amount);
    for (const out of effects.outgoing) {
      const actualAmount = parseFloat(out.amount);
      if (!isNaN(declaredAmount) && !isNaN(actualAmount) && actualAmount > declaredAmount * 1.01) {
        // 1% tolerance for rounding
        reasons.push(
          reason(
            'amount_exceeded',
            `Tu veux envoyer ${formatAmount(intent.amount, intent.token)}`,
            `En réalité, tu enverrais ${formatAmount(out.amount, out.symbol)}, plus que prévu.`
          )
        );
        escalate('critical');
      }
    }
  }
}

/**
 * Rules for send_to_my_account intent
 * Expected: 1 outgoing to an address already used by the user
 * Critical: recipient never seen or lookalike; any approval/permit
 */
function checkSendToMyAccount(
  intent: Intent,
  effects: Effects,
  reasons: VerdictReason[],
  escalate: (level: VerdictLevel) => void
): void {
  // Check for unexpected approvals/permits
  if (hasApprovals(effects)) {
    reasons.push(
      reason(
        'unexpected_approval',
        `Tu veux transférer tes fonds vers ton propre compte`,
        `En réalité, tu signerais une autorisation permettant à un tiers de prendre tes tokens.`
      )
    );
    escalate('critical');
  }

  // Check for first seen recipient
  for (const cp of effects.counterparties) {
    if (cp.firstSeenByUser) {
      reasons.push(
        reason(
          'first_seen_recipient',
          `Tu veux envoyer à ton propre compte (que tu as déjà utilisé)`,
          `En réalité, tu enverrais à une adresse que tu n'as jamais utilisée avant.`
        )
      );
      escalate('critical');
    }
  }
}

/**
 * Rules for buy_or_swap intent
 * Expected: outgoing token A + incoming token B, recipient = self
 * Critical: unlimited approval outside known router; no incoming; recipient != self; permit to new contract
 */
function checkBuyOrSwap(
  intent: Intent,
  effects: Effects,
  reasons: VerdictReason[],
  escalate: (level: VerdictLevel) => void
): void {
  // Check for unlimited approvals (warn if not to a known router - we can't check this without router list)
  if (hasUnlimitedApproval(effects)) {
    reasons.push(
      reason(
        'unlimited_approval_swap',
        `Tu veux échanger des tokens`,
        `Cette opération demande une autorisation illimitée sur tes tokens. Si ce site n'est pas fiable, il pourrait tout prendre.`
      )
    );
    escalate('warn');
  }

  // Check that there's incoming
  if (effects.incoming.length === 0 && effects.outgoing.length > 0) {
    reasons.push(
      reason(
        'no_incoming',
        `Tu veux acheter ou échanger des tokens`,
        `En réalité, tu enverrais des fonds sans rien recevoir en retour.`
      )
    );
    escalate('critical');
  }

  // Check recipient is self
  for (const inc of effects.incoming) {
    if (inc.from.toLowerCase() !== effects.from.toLowerCase()) {
      // This is fine - incoming comes from the swap contract
    }
  }

  // Check for permits to new contracts
  for (const approval of effects.approvals) {
    if (approval.via === 'permit' || approval.via === 'permit2') {
      const spenderCp = effects.counterparties.find(
        (cp) => cp.address.toLowerCase() === approval.spender.toLowerCase()
      );
      if (
        spenderCp &&
        spenderCp.ageBlocks !== undefined &&
        spenderCp.ageBlocks < NEW_CONTRACT_THRESHOLD_BLOCKS
      ) {
        reasons.push(
          reason(
            'permit_new_contract',
            `Tu veux échanger des tokens`,
            `Cette signature permit va à un contrat très récent. Les drainers utilisent des permits pour voler des fonds.`
          )
        );
        escalate('critical');
      }
    }
  }
}

/**
 * Rules for connect_or_accept_offer intent
 * Expected: no outgoing, no approvals (at most a connection signature)
 * Critical: any outgoing, approval, permit, setApprovalForAll, delegation
 */
function checkConnectOrAcceptOffer(
  intent: Intent,
  effects: Effects,
  reasons: VerdictReason[],
  escalate: (level: VerdictLevel) => void
): void {
  // Any outgoing is critical
  if (hasOutgoing(effects)) {
    const total = effects.outgoing.reduce((sum, o) => sum + parseFloat(o.amount || '0'), 0);
    const symbol = effects.outgoing[0]?.symbol || 'tokens';
    reasons.push(
      reason(
        'unexpected_outgoing',
        `Tu veux juste te connecter ou accepter une offre`,
        `En réalité, tu enverrais ${total} ${symbol}.`
      )
    );
    escalate('critical');
  }

  // Any approval is critical
  if (hasApprovals(effects)) {
    const approval = effects.approvals[0];
    const method = approval.via;
    let description: string;

    switch (method) {
      case 'approve':
      case 'increaseAllowance':
        description = `tu donnerais la permission de dépenser tes tokens`;
        break;
      case 'permit':
      case 'permit2':
        description = `tu signerais un permit qui permet de prendre tes tokens sans nouvelle confirmation`;
        break;
      case 'setApprovalForAll':
        description = `tu donnerais accès à TOUS tes NFTs de cette collection`;
        break;
      default:
        description = `tu accorderais un droit sur tes tokens`;
    }

    reasons.push(
      reason(
        'unexpected_approval_connect',
        `Tu veux juste te connecter ou accepter une offre`,
        `En réalité, ${description}. Ce site obtiendrait le droit de prendre tous tes ${approval.token || 'tokens'}, sans te redemander.`
      )
    );
    escalate('critical');
  }

  // Delegation is critical
  if (hasDelegation(effects)) {
    reasons.push(
      reason(
        'unexpected_delegation_connect',
        `Tu veux juste te connecter ou accepter une offre`,
        `En réalité, tu déléguerais le contrôle complet de ton compte à un autre contrat.`
      )
    );
    escalate('critical');
  }
}

export default compare;
