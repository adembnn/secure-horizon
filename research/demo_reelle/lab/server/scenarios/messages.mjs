// Message texts shown on a lure or pasted by the victim. NONE is written here: they are read, by case id, from the existing
// catalogues of the repo (attacks/cases.jsonl and redteam/jury_social.jsonl). Only texts without a real brand name are listed.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BANC = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'titouan', 'T_banc_e2e');
const SOURCES = { 'attacks/cases.jsonl': join(BANC, 'attacks', 'cases.jsonl'), 'redteam/jury_social.jsonl': join(BANC, 'redteam', 'jury_social.jsonl') };
const PICK = [
  ['faux_airdrop-001', 'attacks/cases.jsonl', 'Faux airdrop'],
  ['faux_remboursement-001', 'attacks/cases.jsonl', 'Faux remboursement'],
  ['urgence_bancaire-001', 'attacks/cases.jsonl', 'Faux service anti-fraude'],
  ['faux_recruteur-001', 'attacks/cases.jsonl', 'Faux recruteur'],
  ['faux_proche-001', 'attacks/cases.jsonl', 'Faux proche'],
  ['faux_concours-001', 'attacks/cases.jsonl', 'Faux concours'],
  ['pig_butchering-001', 'attacks/cases.jsonl', 'Faux placement'],
  ['J-18', 'redteam/jury_social.jsonl', 'Message sans mot d’alerte (mise à niveau)'],
  ['J-24', 'redteam/jury_social.jsonl', 'Faux proche, ton familier'],
  ['J-27', 'redteam/jury_social.jsonl', 'Faux cabinet de recouvrement'],
];

function load() {
  const out = {};
  const byFile = {};
  for (const [id, src, label] of PICK) {
    try {
      byFile[src] ??= readFileSync(SOURCES[src], 'utf8').split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      const c = byFile[src].find((x) => x.id === id && x.intent && typeof x.intent.pastedMessage === 'string');
      if (c) out[id] = { id, source: src, label, text: c.intent.pastedMessage };
    } catch { /* catalogue absent: the message is simply not offered */ }
  }
  return out;
}
export const MESSAGES = load();
export const messageText = (id) => (MESSAGES[id] ? MESSAGES[id].text : null);
