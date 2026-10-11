/* Hold up - journal chaîné par hachage. Module ES pur (crypto.subtle, aucun réseau), partagé par les deux builds et par tools/verify_journal.mjs.
 * Chaque entrée : { n, t, o, type, m, l, c, d, v, prev, hash }
 *   n numéro, t heure (ms), o site (hôte coupé par le milieu), type (verdict, decision...), m type de demande (méthode),
 *   l niveau, c codes du moteur (8 au plus), d décision, v version du build, prev hachage de l'entrée précédente,
 *   hash = SHA-256(prev + contenu canonique de l'entrée).
 * JAMAIS la phrase écrite, JAMAIS une adresse : seuls ces champs sont retenus, quoi que contienne l'entrée d'origine.
 * Taille bornée : MAX_ENTRIES. À la troncature, la dernière entrée retirée devient le point d'ancrage { n, hash } :
 * la chaîne restante reste vérifiable à partir de lui.
 * Limite honnête (dite par verifyChain) : sans ancrage externe, une réécriture complète de la chaîne, ou la suppression des
 * dernières lignes, ne se détecte pas. La chaîne prouve qu'une ligne a été changée, retirée au milieu ou déplacée. Rien de plus. */
export const MAX_ENTRIES = 500;
export const GENESIS = '0'.repeat(64);
export const KEY = 'chain';
export const LIMIT_NOTE = 'Limite : sans ancrage externe (une copie du dernier hachage gardée ailleurs), une réécriture complète de la chaîne ou la suppression des dernières lignes ne se détecte pas.';

const hex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
export async function sha256(text) { return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))); }

function site(origin) {
  let host = ''; try { host = new URL(String(origin)).host; } catch (_) { host = String(origin || '').replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').split(/[/?#]/)[0]; }
  if (!host) return '';
  if (host.length <= 40) return host;
  const labels = host.split('.'); let tail = labels.slice(-2).join('.');
  for (let i = 3; i <= labels.length; i++) { const t = labels.slice(-i).join('.'); if (t.length > 24) break; tail = t; }
  const room = 40 - tail.length - 1;
  return (room > 0 ? host.slice(0, room) : '') + '…' + tail;
}
const str = (x, max) => (typeof x === 'string' ? x.slice(0, max) : '');
// the only content kept from a journal line
export function contentOf(entry, version) {
  const e = entry && typeof entry === 'object' ? entry : {};
  return {
    t: Number.isFinite(e.ts) ? Math.round(e.ts) : 0, o: site(e.origin), type: str(e.type, 20), m: str(e.method, 40), l: str(e.level, 20),
    c: Array.isArray(e.codes) ? e.codes.filter((x) => typeof x === 'string' && /^[A-Za-z0-9_:.-]{1,40}$/.test(x) && !/[0-9a-fA-F]{20}/.test(x)).slice(0, 8) : [],
    d: str(e.decision, 20), v: str(version, 20)
  };
}
// fixed order, no ambiguity : the text that is hashed
export const canonical = (n, c) => JSON.stringify([n, c.t, c.o, c.type, c.m, c.l, c.c, c.d, c.v]);
export async function seal(prev, n, c) { return Object.assign({ n }, c, { prev, hash: await sha256(prev + canonical(n, c)) }); }

const empty = () => ({ anchor: null, entries: [] });
// Adds one line. `storage` : a chrome.storage area. Never throws. Callers must not run two appends at once (gatekeeper.js serialises its journal).
export async function chainAppend(storage, entry, version) {
  try {
    let chain = (await storage.get(KEY))[KEY];
    if (!chain || !Array.isArray(chain.entries)) chain = empty();
    const last = chain.entries.length ? chain.entries[chain.entries.length - 1] : chain.anchor;
    const next = await seal(last ? last.hash : GENESIS, last ? last.n + 1 : 1, contentOf(entry, version));
    chain.entries.push(next);
    while (chain.entries.length > MAX_ENTRIES) { const gone = chain.entries.shift(); chain.anchor = { n: gone.n, hash: gone.hash }; }
    await storage.set({ [KEY]: chain });
    return next;
  } catch (_) { return null; }
}

// -> { ok, checked, problems: [text], note }. Detects a modified line, a line removed in the middle, a reordered line.
export async function verifyChain(chain) {
  const problems = [];
  if (!chain || typeof chain !== 'object' || !Array.isArray(chain.entries)) return { ok: false, checked: 0, problems: ['Format inconnu : ce n’est pas un journal de Hold up.'], note: LIMIT_NOTE };
  let prevHash = chain.anchor && typeof chain.anchor.hash === 'string' ? chain.anchor.hash : GENESIS;
  let prevN = chain.anchor && Number.isInteger(chain.anchor.n) ? chain.anchor.n : 0;
  let checked = 0;
  for (const e of chain.entries) {
    checked++;
    if (!e || typeof e !== 'object' || !Number.isInteger(e.n) || typeof e.hash !== 'string' || typeof e.prev !== 'string') { problems.push('Ligne ' + checked + ' : forme invalide.'); continue; }
    if (e.prev !== prevHash) problems.push('Ligne n° ' + e.n + ' : le lien avec la ligne précédente est rompu (ligne retirée ou déplacée).');
    if (e.n !== prevN + 1) problems.push('Ligne n° ' + e.n + ' : le numéro attendu était ' + (prevN + 1) + ' (ligne retirée ou déplacée).');
    const c = { t: e.t, o: e.o, type: e.type, m: e.m, l: e.l, c: Array.isArray(e.c) ? e.c : [], d: e.d, v: e.v };
    if (await sha256(e.prev + canonical(e.n, c)) !== e.hash) problems.push('Ligne n° ' + e.n + ' : son contenu ne correspond plus à son hachage (ligne modifiée).');
    prevHash = e.hash; prevN = e.n;
  }
  return { ok: problems.length === 0, checked, problems, note: LIMIT_NOTE };
}
export const exportChain = (chain) => JSON.stringify({ format: 'holdup-journal', version: 1, anchor: chain.anchor || null, entries: chain.entries || [] }, null, 1);
export function parseExport(text) { const j = JSON.parse(text); return { anchor: j.anchor || null, entries: Array.isArray(j.entries) ? j.entries : [] }; }
