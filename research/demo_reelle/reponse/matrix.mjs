// Hold up - graded response matrix : (verdict level, threat family, door, decision) -> what happens.
// Pure function over matrix.json. No I/O besides loading the data file once.
//
// OBJECTION (stated on purpose) : "a matrix is a slide, not a response". Answer : every cell quotes the
// product code that enforces it (field `source`), test/matrix.test.mjs checks the waits against the
// running defaults of rpc_garde/proxy.mjs and that every fiche of U_textes_utilisateur.json has exactly
// one family. What the matrix cannot do : it does not ACT. Acting is the wallet's job (signing a
// revocation) and the user's job (cancelling) ; the matrix only says which of the two applies.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const MATRIX = JSON.parse(readFileSync(join(HERE, 'matrix.json'), 'utf8'));

export const LEVELS = Object.keys(MATRIX.levels);
export const DOORS = ['extension', 'rpc'];
// journal decision words of both doors -> one vocabulary
const DECISIONS = { cancel: 'cancelled', expire: 'expired', confirm: 'signed', continue: 'signed', continue_failed: 'not_sent' };
export const normalizeDecision = (d) => DECISIONS[d] || null;

const FICHE_FAMILY = Object.fromEntries(Object.entries(MATRIX.families).flatMap(([k, f]) => f.fiches.map((id) => [id, k])));
// A verdict without a fiche (fallback texts) is classified from its effect flags, else "unverified".
export function familyOf({ fiche, level, effects } = {}) {
  if (level === 'manipulation') return 'pressure'; // the pressure is the threat, whatever the technical vehicle
  if (fiche && FICHE_FAMILY[fiche]) return FICHE_FAMILY[fiche];
  if (effects && effects.grants_right) return 'spending_right';
  if (effects && effects.funds_out) return 'recipient';
  return 'unverified';
}

/**
 * respond({ level, fiche, door, decision, effects }) -> plan
 *   level    : 'attention' | 'unknown' | 'danger' | 'manipulation' (verdict.level of server.mjs)
 *   door     : 'extension' | 'rpc'
 *   decision : journal word ('cancel', 'confirm', 'continue', 'expire', 'continue_failed') or undefined (not decided yet)
 * Throws on an unknown level or door : an unknown level must never fall back to a softer response.
 */
export function respond({ level, fiche = null, door, decision, effects } = {}) {
  const L = MATRIX.levels[level];
  if (!L) throw new Error(`unknown level "${level}"`);
  if (!DOORS.includes(door)) throw new Error(`unknown door "${door}"`);
  const family = familyOf({ fiche, level, effects });
  const F = MATRIX.families[family];
  const outcome = decision === undefined ? 'pending' : normalizeDecision(decision);
  if (outcome === null) throw new Error(`unknown decision "${decision}"`);
  const signed = outcome === 'signed';
  // "signed" on the extension door means the wallet was allowed to open, not that the user signed in it :
  // the journal cannot tell. The plan says so instead of pretending.
  const caveat = signed && door === 'extension' ? "Le journal dit que la personne a passé outre l'avertissement, pas qu'elle a signé ensuite dans le portefeuille." : null;
  return {
    level, rank: L.rank, family, family_label: F.label, door, outcome,
    wait_s: L.wait_s[door], phrase: door === 'extension' ? L.phrase : false, // the RPC decision page has no phrase to retype
    automatic: L.automatic, user_must: L.user_must,
    told: L.told.map((k) => ({ who: k, how: MATRIX.told[k] })),
    not_told: MATRIX.told.nobody_else,
    recorded: MATRIX.recorded[door], never_recorded: MATRIX.recorded.never,
    next: outcome === 'pending' ? [] : signed ? F.after_sign.steps : F.after_cancel,
    tool: signed ? F.after_sign.tool : (outcome === 'pending' ? null : 'incident'), // incident record : only if the user asks for it
    cannot_undo: signed ? F.cannot_undo : [],
    caveat,
  };
}
