/* Hold up - journal chaîné par hachage. Module ES pur (crypto.subtle, aucun réseau), partagé par les deux builds et par tools/verify_journal.mjs.
 * Chaque entrée : { n, t, o, type, m, l, c, d, v, by, limited?, rules, prev, hash } (les lignes plus anciennes, sans by/limited/rules, restent vérifiables)
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
/* Champs ajoutés (format 2), compris dans le hachage :
 *   by      'humain' (clic Continuer/Annuler, réponse écrite, fenêtre ou onglet fermé), 'auto' (passage sans clic : même opération déjà
 *           couverte, envoi seul après « Ça correspond », expiration, page quittée, verdict calculé), 'holdup' (demande émise par Hold up :
 *           révocation, ou verdict où Hold up a limité le droit).
 *   limited 'USDC:50' quand Hold up a limité un droit au montant écrit (Q17), sinon absent. Jamais d'adresse, jamais la phrase.
 *   rules   version du build, suivie de '+' et d'une empreinte courte (12 hex) des règles quand le build la fournit. */
// Empreinte des fichiers de règles embarqués : ligne réécrite par tools/gen_rules_fingerprint.mjs (à lancer avant chaque build final).
// Ici et non dans un module à part : journal_chain.js est déjà copié par les deux builds, aucun changement de build n'est nécessaire.
export const RULES_FINGERPRINT = '067bb3ba44cb'; export const RULES_FILES = 26; // @RULES_FINGERPRINT@
export const BY = ['humain', 'auto', 'holdup'];
const HUMAN_BY = new Set(['human', 'window-closed', 'tab-closed']);
export function byOf(e) {
  if (BY.includes(e.actor)) return e.actor;
  if (e.type === 'revocation' || (e.type === 'verdict' && limitedOf(e.limited))) return 'holdup';
  if (e.type === 'decision') return HUMAN_BY.has(e.by) || (e.by == null && e.decision !== 'same_intent') ? 'humain' : 'auto';
  return 'auto';
}
// 'USDC:50' : a short symbol and a plain amount, nothing else (a long hex run = an address : refused)
export function limitedOf(x) {
  let s = '';
  if (typeof x === 'string') s = x;
  else if (x && typeof x === 'object' && x.symbol != null && x.amount != null) s = String(x.symbol) + ':' + String(x.amount);
  return /^[A-Za-z0-9.$_-]{1,16}:[0-9][0-9.,]{0,29}$/.test(s) && !/[0-9a-fA-F]{20}/.test(s) ? s : '';
}
export const rulesTag = (version, fp) => str(version, 20) + (typeof fp === 'string' && /^[0-9a-f]{12}$/.test(fp) ? '+' + fp : '');
// the only content kept from a journal line. `rules` : rulesTag(...) ; absent = the build version alone.
export function contentOf(entry, version, rules) {
  const e = entry && typeof entry === 'object' ? entry : {};
  const c = {
    t: Number.isFinite(e.ts) ? Math.round(e.ts) : 0, o: site(e.origin), type: str(e.type, 20), m: str(e.method, 40), l: str(e.level, 20),
    c: Array.isArray(e.codes) ? e.codes.filter((x) => typeof x === 'string' && /^[A-Za-z0-9_:.-]{1,40}$/.test(x) && !/[0-9a-fA-F]{20}/.test(x)).slice(0, 8) : [],
    d: str(e.decision, 20), v: str(version, 20), by: byOf(e)
  };
  const lim = limitedOf(e.limited); if (lim) c.limited = lim;
  c.rules = typeof rules === 'string' && /^[0-9A-Za-z.+-]{1,40}$/.test(rules) ? rules : c.v;
  return c;
}
// fixed order, no ambiguity : the text that is hashed. Format 1 (lines written before by/limited/rules) is hashed as it was :
// a line carrying none of the three still verifies. Removing the three from a new line, or adding one to an old line,
// changes the text hashed : the line reads as modified.
const isV1 = (c) => c.by === undefined && c.limited === undefined && c.rules === undefined;
const nul = (x) => (x === undefined ? null : x);
export const canonical = (n, c) => JSON.stringify(isV1(c) ? [n, c.t, c.o, c.type, c.m, c.l, c.c, c.d, c.v]
  : [n, c.t, c.o, c.type, c.m, c.l, c.c, c.d, c.v, 2, nul(c.by), nul(c.limited), nul(c.rules)]);
export async function seal(prev, n, c) { return Object.assign({ n }, c, { prev, hash: await sha256(prev + canonical(n, c)) }); }

const empty = () => ({ anchor: null, entries: [] });
// Adds one line. `storage` : a chrome.storage area. Never throws. Callers must not run two appends at once (gatekeeper.js serialises its journal).
export async function chainAppend(storage, entry, version, rules) {
  try {
    let chain = (await storage.get(KEY))[KEY];
    if (!chain || !Array.isArray(chain.entries)) chain = empty();
    const last = chain.entries.length ? chain.entries[chain.entries.length - 1] : chain.anchor;
    const next = await seal(last ? last.hash : GENESIS, last ? last.n + 1 : 1, contentOf(entry, version, rules));
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
    const c = { t: e.t, o: e.o, type: e.type, m: e.m, l: e.l, c: Array.isArray(e.c) ? e.c : [], d: e.d, v: e.v, by: e.by, limited: e.limited, rules: e.rules };
    if (await sha256(e.prev + canonical(e.n, c)) !== e.hash) problems.push('Ligne n° ' + e.n + ' : son contenu ne correspond plus à son hachage (ligne modifiée).');
    prevHash = e.hash; prevN = e.n;
  }
  return { ok: problems.length === 0, checked, problems, note: LIMIT_NOTE };
}
export const exportChain = (chain) => JSON.stringify({ format: 'holdup-journal', version: 1, anchor: chain.anchor || null, entries: chain.entries || [] }, null, 1);
export function parseExport(text) { const j = JSON.parse(text); return { anchor: j.anchor || null, entries: Array.isArray(j.entries) ? j.entries : [] }; }
