// Journal local chaine par hachage (meme format que le journal du serveur local : hash = SHA-256(prev|seq|ts|entree)).
// Stocke dans le navigateur (localStorage) ; si le stockage est indisponible (navigation privee, etc.), repli en memoire. Rien ne quitte la page.
import { sha256hex } from './sha256.js';
export const KEY = 'holdup_journal_v1';
export const ZERO = '0'.repeat(64);
export const MAX_RECORDS = 500;

export function memoryStorage() { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } }; }
export function browserStorage() {
  try { const s = globalThis.localStorage; const t = '__holdup_probe__'; s.setItem(t, '1'); s.removeItem(t); return { storage: s, persistent: true }; } catch (_) { return { storage: memoryStorage(), persistent: false }; }
}
export const hashOf = (r) => sha256hex(r.prev + '|' + r.seq + '|' + r.ts + '|' + JSON.stringify(r.entry));

export function readAll(storage) {
  try { const j = JSON.parse(storage.getItem(KEY) || '[]'); return Array.isArray(j) ? j : []; } catch (_) { return []; }
}
function save(storage, rows) { try { storage.setItem(KEY, JSON.stringify(rows)); } catch (_) { /* quota : on garde ce qui est deja ecrit */ } }

export function append(storage, entry, ts = Date.now()) {
  const rows = readAll(storage);
  const last = rows[rows.length - 1];
  const rec = { seq: last ? last.seq + 1 : 1, ts, prev: last ? last.hash : ZERO, entry };
  rec.hash = hashOf(rec);
  rows.push(rec);
  if (rows.length > MAX_RECORDS) rows.splice(0, rows.length - MAX_RECORDS); // la fenetre glissante garde la chaine verifiable a partir du premier maillon conserve
  save(storage, rows);
  return rec;
}
// Verifie la chaine. Le premier maillon conserve peut avoir un `prev` quelconque (fenetre glissante) ; ensuite chaque maillon doit pointer sur le hash du precedent.
export function verify(rows) {
  let prev = null, n = 0;
  for (const r of rows) {
    if (prev !== null && r.prev !== prev) return { ok: false, n, brokenAt: r.seq, why: 'le lien avec la ligne précédente ne correspond plus' };
    if (r.hash !== hashOf(r)) return { ok: false, n, brokenAt: r.seq, why: 'le contenu de la ligne ne correspond plus à son empreinte' };
    prev = r.hash; n++;
  }
  return { ok: true, n };
}
export function clear(storage) { try { storage.removeItem(KEY); } catch (_) { /* rien */ } }
// Pour la demonstration : modifie le contenu d'une ligne SANS recalculer son empreinte (comme le ferait quelqu'un qui retouche le stockage).
export function tamper(storage) {
  const rows = readAll(storage); if (!rows.length) return false;
  const r = rows[Math.floor(rows.length / 2)];
  r.entry = { ...r.entry, decision: r.entry.decision === 'cancel' ? 'sign' : 'cancel', retouche: true };
  save(storage, rows); return r.seq;
}
