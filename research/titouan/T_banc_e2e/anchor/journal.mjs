// Journal JSONL de verdicts, chaine par hash (keccak256), minimisation des donnees.
// Une entree = { index, ts, rulesVersion, modelVersion, level, reasons[], effectHash, decision, prevHash, hash }.
// AUCUN texte libre, AUCUNE adresse en clair : l'effet decode est reduit a un hash SALE (sel local secret).
//
// Interface pour l'extension :
//   const j = new Journal({ path, salt });
//   j.append({ rulesVersion, modelVersion, level, reasons, effect, decision, ts? })  // effect = objet decode (jamais ecrit)
//   j.verify() -> { ok, count, head, errors[] }
//   j.entries()  -> tableau d'entrees
//   j.rootOf(from, to) / j.proofOf(index, from, to)
import fs from 'node:fs';
import crypto from 'node:crypto';
import { keccakBytes, toHex, fromHex } from '../engine/src/keccak.mjs';
import { merkleRoot, merkleProof } from './merkle.mjs';

export const ZERO_HASH = '0x' + '00'.repeat(32);
export const LEVELS = ['info', 'low', 'medium', 'high', 'critical'];
export const DECISIONS = ['shown', 'proceeded', 'cancelled', 'waited', 'dismissed', 'none'];
const CODE_RE = /^[A-Za-z0-9_.-]{1,48}$/;
const VER_RE = /^[A-Za-z0-9_.+-]{1,32}$/;
const H32 = /^0x[0-9a-f]{64}$/;
const FIELDS = ['index', 'ts', 'rulesVersion', 'modelVersion', 'level', 'reasons', 'effectHash', 'decision', 'prevHash', 'hash'];

// JSON canonique : cles triees, sans espace -> hash reproductible.
export function canonical(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
}
const kHex = (s) => toHex(keccakBytes(new TextEncoder().encode(s)));
export const entryHash = (e) => { const { hash, ...rest } = e; return kHex(canonical(rest)); };

// Hash sale de l'effet decode. Sans le sel, impossible de retrouver une adresse par dictionnaire.
export function hashEffect(effect, saltHex) {
  const salt = fromHex(saltHex), body = new TextEncoder().encode(canonical(effect));
  const buf = new Uint8Array(salt.length + body.length); buf.set(salt); buf.set(body, salt.length);
  return toHex(keccakBytes(buf));
}
export const newSalt = () => '0x' + crypto.randomBytes(32).toString('hex');

export function validateFields(e) { // structure + minimisation. Renvoie une liste d'erreurs.
  const err = [];
  const keys = Object.keys(e).sort().join(',');
  if (keys !== [...FIELDS].sort().join(',')) err.push('champs inattendus ou manquants (' + keys + ')');
  if (!Number.isInteger(e.index) || e.index < 0) err.push('index invalide');
  if (!Number.isInteger(e.ts) || e.ts < 0) err.push('ts invalide');
  if (!VER_RE.test(String(e.rulesVersion))) err.push('rulesVersion invalide');
  if (!VER_RE.test(String(e.modelVersion))) err.push('modelVersion invalide');
  if (!LEVELS.includes(e.level)) err.push('level invalide');
  if (!Array.isArray(e.reasons) || !e.reasons.every((c) => typeof c === 'string' && CODE_RE.test(c))) err.push('reasons: codes uniquement (pas de texte libre)');
  if (!H32.test(e.effectHash)) err.push('effectHash invalide');
  if (!DECISIONS.includes(e.decision)) err.push('decision invalide');
  if (!H32.test(e.prevHash)) err.push('prevHash invalide');
  return err;
}

export class Journal {
  constructor({ path, salt } = {}) {
    if (!path) throw new Error('path requis');
    this.path = path; this.salt = salt || null;
  }
  _readLines() {
    if (!fs.existsSync(this.path)) return [];
    const txt = fs.readFileSync(this.path, 'utf8');
    return txt.split('\n').filter((l) => l.length > 0);
  }
  entries() { return this._readLines().map((l) => JSON.parse(l)); }
  count() { return this._readLines().length; }
  head() { const l = this._readLines(); return l.length ? JSON.parse(l[l.length - 1]).hash : ZERO_HASH; }

  append({ rulesVersion, modelVersion, level, reasons, effect, effectHash, decision = 'shown', ts = Date.now() }) {
    const lines = this._readLines();
    const prev = lines.length ? JSON.parse(lines[lines.length - 1]) : null;
    if (!effectHash) {
      if (!this.salt) throw new Error('sel requis pour hasher l\'effet');
      effectHash = hashEffect(effect, this.salt);
    }
    const e = { index: lines.length, ts, rulesVersion: String(rulesVersion), modelVersion: String(modelVersion), level, reasons: [...reasons].sort(), effectHash, decision, prevHash: prev ? prev.hash : ZERO_HASH };
    const errs = validateFields({ ...e, hash: ZERO_HASH });
    if (errs.length) throw new Error('entree refusee: ' + errs.join('; '));
    e.hash = entryHash(e);
    fs.appendFileSync(this.path, JSON.stringify(e) + '\n');
    return e;
  }

  // Verification d'integrite. opts.expectedCount / expectedHead : points de controle externes (ex. ancrages on-chain)
  // qui permettent de detecter une troncature en queue, impossible a voir par la seule chaine.
  verify({ expectedCount, expectedHead } = {}) {
    const errors = []; let prev = ZERO_HASH, n = 0;
    const lines = this._readLines();
    for (let i = 0; i < lines.length; i++) {
      let e; try { e = JSON.parse(lines[i]); } catch { errors.push({ line: i, code: 'JSON_ILLISIBLE' }); break; }
      const fe = validateFields(e);
      if (fe.length) errors.push({ line: i, code: 'CHAMPS', detail: fe });
      if (e.index !== i) errors.push({ line: i, code: 'INDEX', detail: `attendu ${i}, lu ${e.index}` });
      if (e.prevHash !== prev) errors.push({ line: i, code: 'CHAINE_ROMPUE', detail: 'prevHash different du hash precedent (suppression, insertion ou reordonnancement)' });
      if (e.hash !== entryHash(e)) errors.push({ line: i, code: 'HASH_INVALIDE', detail: 'contenu modifie' });
      prev = e.hash; n++;
    }
    if (expectedCount !== undefined && n < expectedCount) errors.push({ line: n, code: 'TRONCATURE', detail: `${n} entrees, ${expectedCount} attendues` });
    if (expectedHead !== undefined && n === expectedCount && prev !== expectedHead) errors.push({ line: n - 1, code: 'TETE_DIFFERENTE' });
    return { ok: errors.length === 0, count: n, head: prev, errors };
  }

  // Racine de Merkle des entrees d'indices [from, to] inclus.
  rootOf(from, to) {
    const es = this.entries();
    if (from < 0 || to < from || to >= es.length) throw new Error(`intervalle [${from},${to}] hors journal (${es.length} entrees)`);
    return merkleRoot(es.slice(from, to + 1).map((e) => e.hash));
  }
  proofOf(index, from, to) {
    const es = this.entries().slice(from, to + 1);
    return { ...merkleProof(es.map((e) => e.hash), index - from), index, from, to, entry: this.entries()[index] };
  }
}

// ---- CLI : node journal.mjs verify <fichier> | root <fichier> <from> <to> ----
if (process.argv[1] && process.argv[1].endsWith('journal.mjs')) {
  const [cmd, file, a, b] = process.argv.slice(2);
  if (!cmd || !file) { console.log('usage: node journal.mjs verify <journal.jsonl> | root <journal.jsonl> <from> <to>'); process.exit(2); }
  const j = new Journal({ path: file });
  if (cmd === 'verify') { const r = j.verify(); console.log(JSON.stringify(r, null, 2)); process.exit(r.ok ? 0 : 1); }
  if (cmd === 'root') { console.log(j.rootOf(Number(a), Number(b))); }
}
