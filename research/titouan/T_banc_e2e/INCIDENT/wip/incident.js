/* Hold up - fiche d'incident, APRES l'alerte. Module ES pur : aucun réseau, aucun chrome.*, aucun DOM, aucune dépendance.
 * L'horloge n'est lue que si l'appelant ne donne pas `context.generatedAt`.
 *
 *   buildIncident({ journal, decisionRef?, grant?, others?, context? }) -> { record, sha256, json, text, markdown, html, view }
 *
 *   journal     : lignes du journal chaîné. Deux formats acceptés, tels quels :
 *                   extension (journal_chain.js) : { n, t, o, type, m, l, c, d, v, prev, hash }
 *                   page de démo (webdemo/js/journal.js) : { seq, ts, prev, entry, hash }
 *                 ou un export { anchor, entries }.
 *   decisionRef : numéro (n ou seq) de la ligne de décision. Sinon : la dernière ligne où la personne a continué.
 *   grant       : le droit, tel que gatekeeper.js le garde ({ result, origin, at, wallet }) ou directement la sortie de revocationFor().
 *   others      : autres droits connus (même forme que grant), pour « Ce qui reste exposé ».
 *   context     : { generatedAt, tzOffsetMin, origin, signal, token: { symbol, decimals }, network, demo,
 *                   revocation: { state: signed|submitted|rejected|error, at, checked: zero|still_active|unknown, simulated } }
 *
 * RÈGLES
 *  1. Jamais la phrase écrite par la personne, jamais une clé : aucun champ libre n'est lu. Une ligne de journal qui contient
 *     un champ libre ou une adresse n'est pas recopiée (seule son empreinte est citée).
 *  2. Les adresses complètes n'apparaissent que dans le champ « à copier » (adresse qui reçoit le droit, contrat du jeton).
 *  3. Tout texte venu de l'extérieur est nettoyé (caractères de contrôle et d'inversion de sens retirés, longueur bornée),
 *     puis échappé dans le HTML et le Markdown. Le HTML n'a aucun script, aucune ressource externe, une CSP stricte.
 *  4. Aucun verdict vert, aucune promesse de récupération. Révoquer = reprendre un droit déjà donné (une transaction que le
 *     portefeuille signe et qui remet ce droit à zéro). Cela ne rend pas ce qui a déjà été pris.
 *  5. Déterministe : mêmes entrées, mêmes octets. L'empreinte de la fiche = SHA-256 du JSON canonique de `record`
 *     (clés triées, sans espace) : c'est exactement le contenu de `json`. */

export const SCHEMA = 'holdup.fiche_incident/1';

// ------------------------------------------------------------------ SHA-256 (pur, synchrone, vérifié contre node:crypto dans les tests)
const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];
const ror = (x, n) => (x >>> n) | (x << (32 - n));
export function sha256Hex(input) {
  const msg = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const len = msg.length, blocks = (len + 9 + 63) >> 6, w = new Uint32Array(blocks * 16);
  for (let i = 0; i < len; i++) w[i >> 2] |= msg[i] << (24 - (i & 3) * 8);
  w[len >> 2] |= 0x80 << (24 - (len & 3) * 8);
  w[w.length - 1] = (len * 8) >>> 0; w[w.length - 2] = Math.floor((len * 8) / 0x100000000);
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const W = new Uint32Array(64);
  for (let off = 0; off < w.length; off += 16) {
    for (let t = 0; t < 16; t++) W[t] = w[off + t];
    for (let t = 16; t < 64; t++) { const x = W[t - 15], y = W[t - 2]; W[t] = (W[t - 16] + (ror(x, 7) ^ ror(x, 18) ^ (x >>> 3)) + W[t - 7] + (ror(y, 17) ^ ror(y, 19) ^ (y >>> 10))) | 0; }
    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      const t1 = (h + (ror(e, 6) ^ ror(e, 11) ^ ror(e, 25)) + ((e & f) ^ (~e & g)) + K[t] + W[t]) | 0;
      const t2 = ((ror(a, 2) ^ ror(a, 13) ^ ror(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0; H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  return H.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

// JSON canonique : clés triées, aucun espace, `undefined` omis. C'est le texte haché pour l'empreinte de la fiche.
export function canonicalJson(x) {
  if (x === null || x === undefined) return 'null';
  if (typeof x === 'bigint') return JSON.stringify(x.toString());
  if (typeof x !== 'object') return JSON.stringify(x) ?? 'null';
  if (Array.isArray(x)) return '[' + x.map(canonicalJson).join(',') + ']';
  return '{' + Object.keys(x).filter((k) => x[k] !== undefined).sort().map((k) => JSON.stringify(k) + ':' + canonicalJson(x[k])).join(',') + '}';
}

// ------------------------------------------------------------------ nettoyage, échappement
// contrôle, largeur nulle, inversion de sens : construit par codes pour ne mettre aucun caractère invisible dans ce fichier
const CTRL = new RegExp('[' + [[0x00, 0x1f], [0x7f, 0x9f], [0x200b, 0x200f], [0x2028, 0x202e], [0x2060, 0x206f], [0xfeff, 0xfeff]].map(([a, b]) => String.fromCharCode(a) + '-' + String.fromCharCode(b)).join('') + ']', 'g');
export function clean(s, max = 200) {
  let t = String(s === null || s === undefined ? '' : s).replace(CTRL, ' ').replace(/\s+/g, ' ').trim();
  if (t.length > max) t = t.slice(0, max - 1) + '…';
  return t;
}
export const esc = (s) => String(s === null || s === undefined ? '' : s).replace(/[&<>"'`]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[c]));
const mdEsc = (s) => String(s === null || s === undefined ? '' : s).replace(/[\\`*_{}[\]()#+!|<>~&]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '\\' + c));

const HEX20 = /^0x[0-9a-fA-F]{40}$/;
const isAddr = (a) => typeof a === 'string' && HEX20.test(a);
export const shortAddr = (a) => (isAddr(a) ? a.slice(0, 6) + '…' + a.slice(-4) : 'adresse illisible');
const HOST_OK = /^[a-z0-9.-]+(:\d{1,5})?$|^\[[0-9a-f:.]+\](:\d{1,5})?$/i;

// Le site, coupé au MILIEU : le domaine (deux derniers labels au moins) reste toujours entier.
export function siteOf(origin) {
  const raw = clean(origin, 400);
  if (!raw) return 'site inconnu';
  let host = '';
  try { host = new URL(raw).host; } catch (_) { host = ''; }
  if (!host) host = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').split(/[/?#\s]/)[0];
  if (!host) return 'site inconnu';
  const odd = !HOST_OK.test(host);
  let out = host;
  if (host.length > 40) {
    const labels = host.split('.');
    let tail = labels.slice(-2).join('.');
    for (let i = 3; i <= labels.length; i++) { const t = labels.slice(-i).join('.'); if (t.length > 24) break; tail = t; }
    const room = 40 - tail.length - 1;
    out = (room > 0 ? host.slice(0, room) : '') + '…' + tail;
  }
  return odd ? 'nom de site inhabituel : ' + out : out;
}

const pad = (n) => String(n).padStart(2, '0');
const MAX_MS = 8.64e15;
export function fmtDate(ms, tz = 0) {
  if (typeof ms !== 'number' || !Number.isFinite(ms) || Math.abs(ms) > MAX_MS - 1e12) return 'heure inconnue';
  const z = Number.isInteger(tz) && Math.abs(tz) <= 14 * 60 ? tz : 0;
  const d = new Date(ms + z * 60000);
  const off = z === 0 ? 'UTC' : 'UTC' + (z > 0 ? '+' : '-') + pad(Math.floor(Math.abs(z) / 60)) + ':' + pad(Math.abs(z) % 60);
  return pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear() + ' à ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + ' (' + off + ')';
}
const iso = (ms) => (typeof ms === 'number' && Number.isFinite(ms) && Math.abs(ms) < MAX_MS - 1e12 ? new Date(ms).toISOString() : null);

// ------------------------------------------------------------------ libellés
export const LEVEL_FR = { info: 'Aucun signal trouvé', unknown: 'Non vérifié', attention: 'Attention', danger: 'Danger', manipulation: 'Manipulation' };
const SIGNAL_DEFAULT = {
  info: 'Hold up n’avait trouvé aucun signal, ce qui ne prouve rien.',
  unknown: 'Hold up n’avait pas pu vérifier cette demande.',
  attention: 'Hold up avait vu un point à vérifier avant de signer.',
  danger: 'Hold up avait jugé que cette demande pouvait te faire perdre des fonds.',
  manipulation: 'Hold up avait vu des signes de manipulation : quelqu’un te guidait peut-être.'
};
export const KIND_FR = {
  erc20_approve: 'Droit de dépenser des jetons', erc20_increaseAllowance: 'Droit de dépenser des jetons (augmenté)', erc20_permit_call: 'Droit de dépenser des jetons (permit envoyé sur le réseau)',
  erc721_approve: 'Droit sur un objet (NFT)', setApprovalForAll: 'Droit sur toute une collection (NFT)',
  eip2612_permit: 'Signature hors chaîne de type Permit', dai_permit: 'Signature hors chaîne de type Permit (DAI)',
  permit2_approve: 'Droit de dépense auprès de Permit2', permit2_permit_call: 'Droit de dépense auprès de Permit2 (envoyé sur le réseau)',
  permit2_signature: 'Signature hors chaîne de type Permit2', permit2_batch_signature: 'Signature hors chaîne de type Permit2 (plusieurs jetons)',
  permit2_transfer_signature: 'Signature de transfert Permit2', approve_ambiguous: 'Droit de dépense (jeton ou NFT, non déterminé)', unknown_signature: 'Signature hors chaîne inconnue'
};
const METHOD_FR = {
  eth_sendTransaction: 'Transaction', eth_signTransaction: 'Transaction signée', eth_sendRawTransaction: 'Transaction signée', wallet_sendCalls: 'Lot de transactions',
  eth_sign: 'Signature', personal_sign: 'Message signé', eth_signTypedData: 'Signature de données', eth_signTypedData_v3: 'Signature de données', eth_signTypedData_v4: 'Signature de données'
};
const CONTINUED = new Set(['confirm', 'sign', 'continue', 'continuer_limite']);
const CANCELLED = new Set(['cancel']);

export const REVOKE_DEF = 'Révoquer, c’est reprendre un droit déjà donné : ton portefeuille signe une transaction qui remet ce droit à zéro, comme on résilie une autorisation de prélèvement. Cela ne rend pas ce qui a déjà été pris.';

// Étapes et numéros repris de INCIDENT/INCIDENT_ETAPES.md (pages officielles lues le 11/10/2026, points [V]). Aucun numéro ni
// lien n'est ajouté ici. Les sources sont citées par leur nom de domaine, sans lien cliquable. Un point marqué [NV] dans le
// fichier resterait marqué [NV] ici ; aucun n'est repris. La fiscalité est omise, comme dans le fichier.
export const LOSS_STEPS_SOURCE = 'INCIDENT/INCIDENT_ETAPES.md, pages officielles lues le 11/10/2026';
export const LOSS_STEPS = [
  'Porte plainte au commissariat ou à la gendarmerie de ton choix, ou par courrier au procureur de la République. Apporte cette fiche et les identifiants de transaction. (source : service-public.gouv.fr, fiche F1435)',
  'La plainte en ligne et THESEE ne couvrent pas une perte par signature piégée : va au commissariat ou en gendarmerie. (source : masecurite.interieur.gouv.fr)',
  'Si les fonds sont arrivés sur une plateforme d’échange ou en USDT : un gel n’est possible que sur demande des forces de l’ordre. Binance et Tether l’exigent. Donne à l’enquêteur les identifiants de transaction. (sources : binance.com, tether.to)',
  'Conseil et orientation : Info Escroqueries, 0 805 805 817, appel gratuit depuis la France, du lundi au vendredi de 9 h à 18 h 30. (source : justice.fr)',
  'Aide aux victimes : France Victimes, 116 006, gratuit, 7 jours sur 7, de 9 h à 19 h. (source : cybermalveillance.gouv.fr)',
  'Si c’était une offre d’investissement : AMF Épargne Info Service, +33 1 53 45 62 00, du lundi au vendredi de 9 h à 12 h 30. (source : amf-france.org)',
  'Urgence : 17. (source : service-public.gouv.fr)',
  'Si une page publique de phishing est visible de tous, tu peux aussi la signaler sur PHAROS. Ce n’est pas une plainte. (source : service-public.gouv.fr, fiche F31979)',
  'Personne ne peut te promettre de récupérer tes fonds. L’AMF ne récupère pas de fonds et ne demande jamais d’argent. Ceux qui proposent de le faire sont souvent d’autres escrocs : ne donne pas suite. (sources : amf-france.org, cybermalveillance.gouv.fr)'
];

// ------------------------------------------------------------------ journal : lecture, rejeu
const FORMULA = {
  page: 'SHA-256 du texte « empreinte précédente | numéro | heure | contenu JSON », dans cet ordre, séparés par « | ».',
  chain: 'SHA-256 du texte « empreinte précédente » suivi du JSON [n, t, o, type, m, l, c, d, v] de la ligne.'
};
function rowsOf(journal) {
  const list = Array.isArray(journal) ? journal : journal && typeof journal === 'object' && Array.isArray(journal.entries) ? journal.entries : [];
  return list.slice(0, 5000).filter((r) => r && typeof r === 'object' && typeof r.hash === 'string' && typeof r.prev === 'string' && (Number.isInteger(r.seq) || Number.isInteger(r.n)));
}
const fmtOf = (r) => (Number.isInteger(r.seq) && r.entry && typeof r.entry === 'object' ? 'page' : 'chain');
function norm(r) {
  if (fmtOf(r) === 'page') {
    const e = r.entry;
    return { fmt: 'page', ref: r.seq, ts: r.ts, type: e.type === 'revocation' ? 'revocation' : typeof e.decision === 'string' ? 'decision' : String(e.type || ''), decision: e.decision, level: e.level, site: e.origin || null, scenario: e.scenario || null, method: e.method || null, wallet: e.wallet || null, simulated: e.simulated === true, waitS: e.delay_s, ms: e.ms, shortcut: e.raccourci === true, raw: r };
  }
  return { fmt: 'chain', ref: r.n, ts: r.t, type: r.type, decision: r.d, level: r.l, site: r.o || null, scenario: null, method: r.m || null, wallet: r.type === 'revocation' ? r.d : null, simulated: false, raw: r };
}
export function replayRow(r) {
  try {
    if (fmtOf(r) === 'page') { const input = r.prev + '|' + r.seq + '|' + r.ts + '|' + JSON.stringify(r.entry); const computed = sha256Hex(input); return { ok: computed === r.hash, computed, input, formula: FORMULA.page }; }
    const input = r.prev + JSON.stringify([r.n, r.t, r.o, r.type, r.m, r.l, Array.isArray(r.c) ? r.c : [], r.d, r.v]); const computed = sha256Hex(input);
    return { ok: computed === r.hash, computed, input, formula: FORMULA.chain };
  } catch (_) { return { ok: false, computed: null, input: null, formula: null }; }
}
// La première ligne gardée peut pointer sur une ligne retirée (fenêtre glissante) ; ensuite chaque ligne doit pointer sur la précédente.
export function verifyRows(journal) {
  const rows = rowsOf(journal);
  let prev = null;
  for (const r of rows) {
    const ref = Number.isInteger(r.seq) ? r.seq : r.n;
    if (prev !== null && r.prev !== prev) return { ok: false, records: rows.length, broken_at: ref, head: null };
    if (!replayRow(r).ok) return { ok: false, records: rows.length, broken_at: ref, head: null };
    prev = r.hash;
  }
  return { ok: true, records: rows.length, broken_at: null, head: rows.length ? rows[rows.length - 1].hash : null };
}
// Une ligne n'est recopiée que si elle ne contient ni champ libre ni adresse : la fiche ne doit jamais porter la phrase écrite.
const FREE_KEY = /^(ecrit|phrase|sentence|texte?|intent_?text|intent_?details|details|facts|quote|seed|mnemonic|private_?key|secret|password|passphrase|cle|key|why|note)$/i;
function unsafeRow(r) {
  let s; try { s = JSON.stringify(r); } catch (_) { return 'illisible'; }
  if (s.length > 4000) return 'trop longue';
  if (/0x[0-9a-fA-F]{40}/.test(s)) return 'contient une adresse';
  let bad = false;
  const walk = (x, depth) => { if (bad || depth > 6 || !x || typeof x !== 'object') return; for (const k of Object.keys(x)) { if (FREE_KEY.test(k)) { bad = true; return; } walk(x[k], depth + 1); } };
  walk(r, 0);
  return bad ? 'contient un champ de texte libre' : null;
}
const copyRow = (r) => JSON.parse(JSON.stringify(r)); // ordre des clés conservé : la ligne se rejoue telle quelle

// ------------------------------------------------------------------ droit
function grantOf(input) {
  if (!input || typeof input !== 'object') return { result: null, origin: null, at: null, wallet: null };
  if (typeof input.status === 'string') return { result: input, origin: null, at: null, wallet: null };
  return { result: input.result && typeof input.result === 'object' ? input.result : null, origin: input.origin || null, at: typeof input.at === 'number' ? input.at : null, wallet: typeof input.wallet === 'string' ? input.wallet : null };
}
function tokenInfo(t) {
  if (!t || typeof t !== 'object') return null;
  const symbol = typeof t.symbol === 'string' && /^[A-Za-z0-9.$-]{1,12}$/.test(t.symbol) ? t.symbol : null;
  const decimals = Number.isInteger(t.decimals) && t.decimals >= 0 && t.decimals <= 36 ? t.decimals : null;
  return symbol ? { symbol, decimals } : null;
}
function units(n, dec) {
  if (dec === null || dec === 0) return n.toString();
  const base = 10n ** BigInt(dec), whole = n / base, frac = (n % base).toString().padStart(dec, '0').replace(/0+$/, '');
  return whole.toString() + (frac ? ',' + frac.slice(0, 6) : '');
}
function amountText(g, tok) {
  if (!g || typeof g !== 'object') return 'non lu';
  if (g.all) return 'tous les objets de la collection';
  if (g.unlimited) return 'illimité';
  if (g.tokenId !== undefined) return 'l’objet numéro ' + clean(g.tokenId, 80);
  if (g.amount === undefined || g.amount === null) return 'non lu';
  try { const n = BigInt(String(g.amount)); return tok ? units(n, tok.decimals) + ' ' + tok.symbol : n.toString() + ' (unité brute du jeton)'; } catch (_) { return clean(g.amount, 80); }
}
function endText(result, tz) {
  const x = result && result.expiry;
  if (!x || typeof x !== 'object') return 'non lue par Hold up';
  if (x.never === true) return 'sans date de fin';
  if (typeof x.at === 'number' && Number.isFinite(x.at)) { const ms = x.at * 1000; return Math.abs(ms) < MAX_MS - 1e12 ? fmtDate(ms, tz) : 'sans date de fin réaliste'; }
  return 'non lue par Hold up';
}

// ------------------------------------------------------------------ étapes
const SEED_LEAK = 'Si tu as tapé ta phrase de récupération ou ta clé sur un site : révoquer ne suffit pas. Crée un nouveau portefeuille sur un autre appareil et envoie-y ce qui reste. (source : support.metamask.io)';
const stripN = (t) => clean(String(t).replace(/^\d+\.\s*/, ''), 400);
function stepRevoke({ result, continued, cancelled, done, rev, simulated, tz }) {
  const base = { n: 1, id: 'revoke', title: 'Révoquer ce droit', text: '', sub: [], done: false, applies: true, action: null };
  if (!result || !result.status || result.status === 'not_a_grant' || !result.grant) return { ...base, applies: false, text: 'Hold up n’a pas vu de droit accordé par cette demande. Rien à révoquer ici. Si tu as signé autre chose, passe à l’étape 2.' };
  if (cancelled) return { ...base, applies: false, text: 'Tu as annulé : cette demande n’a pas atteint ton portefeuille. Elle n’a donné aucun droit.' };
  if (done) return { ...base, done: true, text: 'Fait : le droit relu est à zéro' + (simulated ? ' (simulation)' : '') + '. ' + REVOKE_DEF };
  const at = rev && rev.at ? ' (' + fmtDate(rev.at, tz) + ')' : '';
  const state = !rev ? '' : rev.state === 'submitted' ? ' Une révocation a été envoyée à ton portefeuille' + at + '. Le droit reste actif tant qu’elle n’est pas confirmée sur le réseau : vérifie-le à l’étape 2.'
    : rev.state === 'rejected' ? ' Tu as rejeté la révocation dans ton portefeuille' + at + '. Le droit est toujours actif.'
    : rev.state === 'error' ? ' La dernière révocation n’a pas abouti' + at + '. Le droit est toujours actif.' : '';
  const s = result.status;
  if (s === 'revocable' && result.oneClick === true) {
    return { ...base, action: 'revoke', text: 'Utilise le bouton « Révoquer ce droit » de Hold up. Ton portefeuille te montre une transaction qui remet le droit à zéro. C’est toi qui signes, Hold up ne signe jamais. Elle coûte des frais réseau : il faut un peu de la monnaie du réseau (ETH par exemple) sur ton compte.' + state + ' ' + REVOKE_DEF, sub: [SEED_LEAK] };
  }
  if (s === 'two_steps' || s === 'revocable') {
    const sub = (Array.isArray(result.steps) ? result.steps : []).slice(0, 6).map(stripN);
    if (result.expiry && typeof result.expiry.at === 'number') sub.push('Si la date de fin est proche, attendre qu’elle passe rend aussi la signature inutilisable.');
    sub.push('Si la signature a déjà été utilisée, le droit existe sur le jeton : une transaction qui le remet à zéro le retire (outil de l’étape 2).');
    const race = (Array.isArray(result.limits) ? result.limits : []).find((t) => /course/i.test(String(t)));
    if (race) sub.push(clean(race, 300));
    if (/^permit2/.test(String(result.kind))) sub.push('Permit2 prévoit trois fonctions pour cela : lockdown, invalidateNonces, invalidateUnorderedNonces. Elles s’appellent depuis ton compte, avec des frais. Aucune interface grand public officielle n’a été trouvée pour les appeler. (source : dépôt Uniswap permit2)');
    else sub.push('La norme Permit (EIP-2612) ne prévoit aucune fonction d’annulation : la signature cesse de valoir quand son numéro (nonce) est consommé ou quand sa date limite passe. (source : eips.ethereum.org)');
    sub.push('Revoke.cash permet parfois d’invalider une signature avant qu’elle serve, mais c’est très difficile : les escrocs l’utilisent vite. (source : revoke.cash)', SEED_LEAK);
    return { ...base, title: 'Révoquer ce droit (signature hors chaîne : pas en un clic)', text: 'Ce droit vient d’une signature hors chaîne (Permit). Elle n’est pas encore sur le réseau, mais celui qui la détient peut s’en servir jusqu’à sa date de fin. Un seul clic ne suffit pas. Voici quoi faire, dans l’ordre.' + state, sub };
  }
  if (s === 'not_revocable_by_click') {
    return { ...base, title: 'Révoquer ce droit (Hold up ne sait pas le faire)', text: 'Hold up ne sait pas défaire cette signature hors chaîne. Elle reste utilisable jusqu’à sa date de fin. Préviens la plateforme (étape 3) et vérifie tes droits (étape 2).', sub: (Array.isArray(result.steps) ? result.steps : []).slice(0, 4).map(stripN) };
  }
  return { ...base, title: 'Révoquer ce droit (information manquante)', text: 'Hold up ne peut pas préparer la révocation seul : il ne sait pas s’il s’agit d’un jeton ou d’un objet (NFT), ou il manque le compte. Utilise l’outil de l’étape 2 pour retirer ce droit.' };
}
function steps(ctx) {
  return [
    stepRevoke(ctx),
    { n: 2, id: 'check_others', title: 'Vérifier les autres droits', done: false, applies: true, action: null, sub: [],
      text: 'Depuis un appareil sain, ouvre toi-même, en tapant l’adresse, un outil public de vérification des autorisations : Revoke.cash (revoke.cash) ou le « Token Approval Checker » d’Etherscan (etherscan.io/tokenapprovalchecker). Sur Revoke.cash, tu peux consulter en tapant l’adresse de ton compte, sans connecter ton portefeuille ; il ne sert qu’à signer une révocation, qui coûte des frais réseau. (source : revoke.cash) Hold up n’y envoie rien. Révoque tout droit que tu ne reconnais pas, en commençant par les montants illimités. Un faux site « revoke » est un piège courant : tape l’adresse toi-même.' },
    { n: 3, id: 'tell_platform', title: 'Prévenir la plateforme', done: false, applies: true, action: null, sub: [],
      text: 'Contacte le site ou le projet concerné par son domaine officiel, tapé toi-même (sa page « Security », ou son fichier security.txt), jamais par un contact reçu en message privé. Préviens aussi la plateforme d’échange si des fonds y sont passés. Joins cette fiche. Ne donne jamais ta phrase de récupération ni ta clé.' },
    { n: 4, id: 'keep_proof', title: 'Conserver la preuve', done: false, applies: true, action: null, sub: [],
      text: 'Enregistre cette fiche (PDF ou .html) et son fichier JSON, sans les modifier. Note son empreinte SHA-256 (section Preuve). Exporte ton journal Hold up. Ne supprime aucun message. Garde l’adresse exacte du site, les captures de la fenêtre de signature, le réseau, et pour chaque transaction son identifiant (hash) et son heure UTC. (source : cybermalveillance.gouv.fr)' },
    { n: 5, id: 'if_loss', title: 'Si une perte a eu lieu', done: false, applies: true, action: null, sub: LOSS_STEPS.slice(), source: LOSS_STEPS_SOURCE,
      text: 'Si des fonds sont déjà partis, révoquer ne les ramène pas. Fais aussi ceci, dans l’ordre :' }
  ];
}

// ------------------------------------------------------------------ construction
export function buildIncident(input = {}) {
  const inp = input && typeof input === 'object' ? input : {};
  const ctx = inp.context && typeof inp.context === 'object' ? inp.context : {};
  const tz = Number.isInteger(ctx.tzOffsetMin) && Math.abs(ctx.tzOffsetMin) <= 840 ? ctx.tzOffsetMin : 0;
  const generatedAt = typeof ctx.generatedAt === 'number' && Number.isFinite(ctx.generatedAt) ? ctx.generatedAt : Date.now();
  const demo = ctx.demo === true;
  const rows = rowsOf(inp.journal);
  const N = rows.map(norm);

  // la ligne de décision, puis la dernière révocation qui la suit (même site, ou même scène dans la démo)
  let di = -1;
  if (inp.decisionRef !== undefined && inp.decisionRef !== null) di = N.findIndex((x) => x.ref === inp.decisionRef && x.type === 'decision');
  if (di < 0) for (let i = N.length - 1; i >= 0; i--) if (N[i].type === 'decision' && CONTINUED.has(N[i].decision)) { di = i; break; }
  if (di < 0) for (let i = N.length - 1; i >= 0; i--) if (N[i].type === 'decision' && CANCELLED.has(N[i].decision)) { di = i; break; }
  const D = di >= 0 ? N[di] : null;
  let R = null;
  if (D) for (let i = N.length - 1; i > di; i--) { const x = N[i]; if (x.type === 'revocation' && x.site === D.site && (!x.scenario || !D.scenario || x.scenario === D.scenario)) { R = x; break; } }

  const g = grantOf(inp.grant);
  const result = g.result && typeof g.result.status === 'string' ? g.result : null;
  const gr = result && result.grant && typeof result.grant === 'object' ? result.grant : null;
  const tok = tokenInfo(ctx.token);
  const continued = D ? CONTINUED.has(D.decision) : !!gr;
  const cancelled = D ? CANCELLED.has(D.decision) : false;

  // révocation : la ligne du journal, complétée par ce que l'appelant sait (relecture du droit)
  const rc = ctx.revocation && typeof ctx.revocation === 'object' ? ctx.revocation : null;
  const STATES = new Set(['signed', 'submitted', 'rejected', 'error']);
  let rev = null;
  if (R || rc || (g.wallet && STATES.has(g.wallet))) {
    const state = rc && STATES.has(rc.state) ? rc.state : R && STATES.has(R.wallet) ? R.wallet : STATES.has(g.wallet) ? g.wallet : null;
    rev = { state, at: rc && typeof rc.at === 'number' ? rc.at : R ? R.ts : null, checked: rc && ['zero', 'still_active', 'unknown'].includes(rc.checked) ? rc.checked : null, simulated: !!((rc && rc.simulated === true) || (R && R.simulated)), journal_ref: R ? R.ref : null };
    if (!rev.state && !rev.checked) rev = null;
  }
  const oneClick = !!(result && result.status === 'revocable' && result.oneClick === true);
  const done = !!(gr && continued && rev && (rev.checked === 'zero' || (rev.simulated && rev.state === 'signed' && oneClick)));

  const site = siteOf(ctx.origin || g.origin || (D && D.site) || '');
  const level = D && typeof D.level === 'string' && LEVEL_FR[D.level] ? D.level : typeof ctx.level === 'string' && LEVEL_FR[ctx.level] ? ctx.level : null;
  const method = D && D.method ? clean(D.method, 40) : null;
  const kindLabel = result && KIND_FR[result.kind] ? KIND_FR[result.kind] : gr ? 'Droit accordé' : null;
  const amount = gr ? amountText(gr, tok) : null;

  const record = {
    schema: SCHEMA,
    id: D ? sha256Hex(D.raw.hash + '|' + (R ? R.raw.hash : '')).slice(0, 16) : sha256Hex(canonicalJson({ g: result, at: generatedAt })).slice(0, 16),
    generated_at: iso(generatedAt), tz_offset_min: tz, generated_on: 'demande de la personne', demo,
    lead: '',
    what: {
      what: gr ? kindLabel + ' : ' + amount : method ? 'Une demande de type « ' + (METHOD_FR[method] || method) + ' »' : 'Une demande de signature',
      when: D ? iso(D.ts) : g.at ? iso(g.at) : null, when_text: D ? fmtDate(D.ts, tz) : g.at ? fmtDate(g.at, tz) : 'heure inconnue',
      site, request: method ? METHOD_FR[method] || method : null, network: ctx.network ? clean(ctx.network, 60) : null
    },
    right: gr ? {
      kind: result.kind ? clean(result.kind, 40) : null, label: kindLabel, status: clean(result.status, 30), one_click: oneClick, off_chain: !!gr.offChain,
      token: isAddr(gr.token) ? gr.token.toLowerCase() : null, token_symbol: tok ? tok.symbol : null,
      amount, unlimited: !!gr.unlimited, end: endText(result, tz),
      spender: isAddr(gr.spender) ? gr.spender.toLowerCase() : null
    } : null,
    signal: { level, level_label: level ? LEVEL_FR[level] : 'Niveau non enregistré', line: ctx.signal ? clean(ctx.signal, 220) : level ? SIGNAL_DEFAULT[level] : 'Hold up n’a pas noté de signal pour cette demande.' },
    action: {
      decision: continued ? 'continued' : cancelled ? 'cancelled' : 'unknown',
      decision_text: continued ? 'Continuer quand même' + (D && D.decision === 'continuer_limite' ? ' (avec le droit limité)' : '') : cancelled ? 'Annuler' : 'Décision non enregistrée',
      at: D ? iso(D.ts) : g.at ? iso(g.at) : null, at_text: D ? fmtDate(D.ts, tz) : g.at ? fmtDate(g.at, tz) : 'heure inconnue',
      time_on_alert_s: D && typeof D.ms === 'number' && D.ms >= 0 ? Math.round(D.ms / 100) / 10 : null,
      imposed_wait_s: D && typeof D.waitS === 'number' && D.waitS > 0 ? D.waitS : null,
      shortcut: !!(D && D.shortcut), journal_ref: D ? D.ref : null
    },
    revocation: rev,
    exposed: [], exposed_note: '',
    steps: [],
    proof: { rows: [], withheld: [], rows_replay: [], formula: rows.length ? FORMULA[fmtOf(rows[0])] : null, chain: rows.length ? verifyRows(rows) : null, chain_line: '' },
    proves: [], does_not_prove: [], limits: []
  };

  // lead
  record.lead = cancelled ? 'Tu as annulé. Cette demande n’a pas atteint ton portefeuille.'
    : !gr ? 'Tu as continué malgré l’alerte. Hold up n’a pas vu de droit accordé par cette demande.'
    : done ? 'Tu as continué malgré l’alerte. Le droit a ensuite été remis à zéro' + (rev && rev.simulated ? ', dans la simulation.' : '.')
    : rev && rev.state === 'submitted' ? 'Tu as continué malgré l’alerte. Une révocation a été envoyée à ton portefeuille : tant qu’elle n’est pas confirmée, le droit reste actif.'
    : 'Tu as continué malgré l’alerte. Le droit donné est toujours actif.';

  // ce qui reste exposé : autres droits connus, puis autres demandes où la personne a continué
  const others = Array.isArray(inp.others) ? inp.others.slice(0, 20) : [];
  for (const o of others) {
    const x = grantOf(o); const r = x.result, xg = r && r.grant;
    if (!xg || (result && r === result)) continue;
    if (gr && xg.spender === gr.spender && xg.token === gr.token && x.at === g.at) continue;
    record.exposed.push({ what: (KIND_FR[r.kind] || 'Droit accordé') + ' : ' + amountText(xg, null), site: siteOf(x.origin || ''), to: shortAddr(xg.spender), at_text: x.at ? fmtDate(x.at, tz) : 'heure inconnue', revocation: STATES.has(x.wallet) ? x.wallet : null });
    if (record.exposed.length >= 10) break;
  }
  for (let i = N.length - 1; i >= 0 && record.exposed.length < 10; i--) {
    const x = N[i]; if (i === di || x.type !== 'decision' || !CONTINUED.has(x.decision)) continue;
    record.exposed.push({ what: 'Autre demande où tu as continué malgré une alerte' + (x.level && LEVEL_FR[x.level] ? ' (' + LEVEL_FR[x.level] + ')' : ''), site: x.site ? siteOf(x.site) : x.scenario ? 'scène ' + clean(x.scenario, 60) : 'site non noté', to: null, at_text: fmtDate(x.ts, tz), revocation: null, journal_ref: x.ref });
  }
  record.exposed_note = record.exposed.length
    ? 'Le journal ne garde pas les droits eux-mêmes, seulement les décisions. Vérifie chacun avec l’outil de l’étape 2.'
    : 'Hold up ne connaît pas d’autre droit. Cela ne veut pas dire qu’il n’y en a pas : vérifie avec l’outil de l’étape 2.';

  record.steps = steps({ result, continued, cancelled, done, rev, simulated: !!(rev && rev.simulated), tz });

  // preuve
  for (const x of [D, R].filter(Boolean)) {
    const why = unsafeRow(x.raw);
    const rp = replayRow(x.raw);
    record.proof.rows_replay.push({ ref: x.ref, ok: rp.ok });
    if (why) record.proof.withheld.push({ ref: x.ref, hash: clean(x.raw.hash, 64), why });
    else record.proof.rows.push(copyRow(x.raw));
  }
  const ch = record.proof.chain;
  record.proof.chain_line = !ch ? 'Chaîne du journal : aucune ligne fournie.'
    : ch.ok ? 'Chaîne du journal : intacte, ' + ch.records + (ch.records > 1 ? ' lignes' : ' ligne') + ', tête ' + String(ch.head).slice(0, 16) + '…'
    : 'Chaîne du journal : cassée à la ligne ' + ch.broken_at + '. Cette fiche n’a pas de valeur d’intégrité.';
  record.proves = [
    'Ce journal Hold up a enregistré, à l’heure de cet ordinateur, une alerte de ce niveau et ta décision.',
    'Les lignes citées se rejouent : leur empreinte se recalcule hors ligne avec la formule indiquée.',
    ...(rev ? ['Une révocation a été présentée à ton portefeuille, avec la réponse notée.'] : [])
  ];
  record.does_not_prove = [
    ...(ch && !ch.ok ? ['La chaîne du journal est cassée à la ligne ' + ch.broken_at + ' : cette fiche n’a pas de valeur d’intégrité.'] : []),
    ...(demo ? ['Qu’une vraie transaction a eu lieu : le portefeuille et le réseau de cette démonstration sont simulés.'] : []),
    'Qui était devant l’écran, ni qui est derrière le site ou l’adresse.',
    'Qu’aucune perte n’a eu lieu par un autre chemin.',
    'L’heure exacte : c’est celle de l’ordinateur. Sans copie du dernier maillon gardée ailleurs, tout le journal peut être réécrit.'
  ];
  record.limits = [
    'Hold up n’est pas un service juridique. Cette fiche décrit ce que Hold up a vu. Elle ne qualifie pas les faits.',
    'Hold up ne promet aucune récupération. Révoquer un droit ne ramène pas ce qui est déjà parti.',
    'Ce qui ne peut pas être défait : ce qui a déjà été pris avant la révocation, et une signature hors chaîne déjà utilisée par quelqu’un d’autre.',
    'Hold up ne connaît que ce qu’il a vu passer dans ce navigateur. D’autres droits peuvent exister.',
    'Une révocation coûte des frais réseau. Elle ne compte qu’une fois confirmée sur le réseau.'
  ];

  const json = canonicalJson(record);
  const sha256 = sha256Hex(json);
  const view = viewOf(record);
  return { record, sha256, json, view, text: renderText(view, sha256), markdown: renderMarkdown(view, sha256), html: renderHtml(view, sha256) };
}

// ------------------------------------------------------------------ vue : sections ordonnées, communes aux quatre rendus (texte, Markdown, HTML, DOM)
const REV_FR = { signed: 'signée dans ton portefeuille', submitted: 'envoyée à ton portefeuille, pas encore relue', rejected: 'rejetée dans ton portefeuille : le droit est toujours actif', error: 'n’a pas abouti : le droit est toujours actif' };
const CHECK_FR = { zero: 'droit relu : zéro', still_active: 'droit relu : encore actif', unknown: 'Hold up n’a pas pu relire le droit' };
export function viewOf(rec) {
  const r = rec.right, a = rec.action, rv = rec.revocation, tz = rec.tz_offset_min;
  const row = (label, value, opt = {}) => (value === null || value === undefined || value === '' ? null : { label, value: String(value), ...opt });
  const revText = !rv ? 'Pas encore demandée.'
    : [rv.state ? REV_FR[rv.state] + (rv.simulated ? ' (simulation)' : '') : null, rv.at ? fmtDate(rv.at, tz) : null, rv.checked ? CHECK_FR[rv.checked] : null].filter(Boolean).join(', ') + '.';
  const sections = [
    { id: 'passe', title: 'Ce qui s’est passé', rows: [row('Quoi', rec.what.what), row('Quand', rec.what.when_text), row('Site', rec.what.site), row('Demande', rec.what.request), row('Réseau', rec.what.network)].filter(Boolean) },
    { id: 'droit', title: 'Le droit donné', rows: r ? [
      row('Droit', r.label), row('Jeton', r.token_symbol || (r.token ? shortAddr(r.token) : 'non lu')), row('Contrat du jeton (à copier)', r.token, { copy: true }),
      row('Montant', r.amount), row('Date de fin', r.end), row('Adresse qui reçoit le droit (à copier)', r.spender || 'non lue', { copy: !!r.spender })
    ].filter(Boolean) : [row('Droit', 'Hold up n’a pas vu de droit accordé par cette demande.')] },
    { id: 'signal', title: 'Ce que Hold up avait signalé', rows: [row('Niveau d’alerte', rec.signal.level_label), row('En une ligne', rec.signal.line)].filter(Boolean) },
    { id: 'geste', title: 'Ce que tu as fait', rows: [row('Décision', a.decision_text), row('Heure', a.at_text),
      row('Temps sur l’alerte', a.shortcut ? 'raccourci de démonstration : la fenêtre n’a pas été traversée' : a.time_on_alert_s !== null ? a.time_on_alert_s + ' s' + (a.imposed_wait_s ? ', dont une attente imposée de ' + a.imposed_wait_s + ' s' : '') : null),
      row('Révocation', revText)].filter(Boolean) },
    { id: 'expose', title: 'Ce qui reste exposé', items: rec.exposed.map((x) => [x.what, x.site, x.to ? 'vers ' + x.to : null, x.at_text, x.revocation ? 'révocation : ' + x.revocation : null].filter(Boolean).join(' · ')), note: rec.exposed_note },
    { id: 'faire', title: 'Ce qu’il faut faire maintenant', intro: 'Ce qui reste à faire, dans l’ordre.', steps: rec.steps },
    { id: 'preuve', title: 'Preuve', rows: [row('Empreinte SHA-256 de la fiche', '(calculée sur le fichier JSON de la fiche)'), row('Identifiant', rec.id), row('Formule des lignes', rec.proof.formula)].filter(Boolean),
      chainLine: rec.proof.chain_line, lines: rec.proof.rows, withheld: rec.proof.withheld.map((w) => 'Ligne ' + w.ref + ' non recopiée (' + w.why + '), empreinte ' + w.hash), proves: rec.proves, doesNotProve: rec.does_not_prove },
    { id: 'limites', title: 'Limites', items: rec.limits }
  ];
  return { id: rec.id, generatedText: fmtDate(Date.parse(rec.generated_at), tz), lead: rec.lead, demo: rec.demo, sections };
}

// ------------------------------------------------------------------ rendus
const DEMO_LINE = 'Démonstration : le portefeuille et le réseau sont simulés. Aucune transaction n’existe.';
const FOOT = 'Produite par Hold up à ta demande, à partir de ton journal local. Aucun nom, aucun texte saisi, aucune clé. Rien n’est envoyé.';
const REPLAY = 'Pour rejouer le calcul hors ligne : l’empreinte de la fiche est le SHA-256 du fichier JSON de la fiche, tel qu’exporté (clés triées, sans espace). Chaque ligne de journal se rejoue avec la formule indiquée.';

export function renderText(view, sha) {
  const L = ['FICHE D’INCIDENT HOLD UP', 'N° ' + view.id + ' · produite le ' + view.generatedText, '', view.lead];
  if (view.demo) L.push(DEMO_LINE);
  for (const s of view.sections) {
    L.push('', '== ' + s.title + ' ==');
    for (const r of s.rows || []) L.push(r.label + ' : ' + (r.label.startsWith('Empreinte') ? sha : r.value));
    if (s.items) { if (!s.items.length && s.id === 'expose') L.push('(aucun)'); for (const i of s.items) L.push('- ' + i); }
    if (s.note) L.push(s.note);
    if (s.intro) L.push(s.intro);
    for (const st of s.steps || []) { L.push((st.done ? '[x] ' : '[ ] ') + st.n + '. ' + st.title + (st.applies ? '' : ' (sans objet)'), '    ' + st.text); for (const x of st.sub) L.push('    - ' + x); }
    if (s.chainLine) L.push(s.chainLine);
    for (const ln of s.lines || []) L.push('Ligne ' + (ln.seq ?? ln.n) + ' : ' + JSON.stringify(ln));
    for (const w of s.withheld || []) L.push(w);
    if (s.id === 'preuve') { L.push(REPLAY, 'Ce que cette fiche établit :'); for (const p of s.proves) L.push('- ' + p); L.push('Ce qu’elle n’établit pas :'); for (const p of s.doesNotProve) L.push('- ' + p); }
  }
  L.push('', FOOT);
  return L.join('\n') + '\n';
}

export function renderMarkdown(view, sha) {
  const L = ['# Fiche d’incident Hold up', '', 'N° `' + view.id + '` · produite le ' + mdEsc(view.generatedText), '', mdEsc(view.lead)];
  if (view.demo) L.push('', '> ' + mdEsc(DEMO_LINE));
  for (const s of view.sections) {
    L.push('', '## ' + mdEsc(s.title), '');
    for (const r of s.rows || []) L.push('- **' + mdEsc(r.label) + '** : ' + (r.label.startsWith('Empreinte') ? '`' + sha + '`' : r.copy ? '`' + r.value + '`' : mdEsc(r.value)));
    if (s.items) { if (!s.items.length && s.id === 'expose') L.push('- (aucun)'); for (const i of s.items) L.push('- ' + mdEsc(i)); }
    if (s.note) L.push('', mdEsc(s.note));
    if (s.intro) L.push(mdEsc(s.intro), '');
    for (const st of s.steps || []) { L.push('- [' + (st.done ? 'x' : ' ') + '] **' + st.n + '. ' + mdEsc(st.title) + '**' + (st.applies ? '' : ' (sans objet)') + ' : ' + mdEsc(st.text)); for (const x of st.sub) L.push('  - ' + mdEsc(x)); }
    if (s.chainLine) L.push('', mdEsc(s.chainLine));
    for (const ln of s.lines || []) L.push('', 'Ligne ' + (ln.seq ?? ln.n) + ' :', '', '    ' + JSON.stringify(ln)); // bloc de code indenté : rien ne peut en sortir
    for (const w of s.withheld || []) L.push('', mdEsc(w));
    if (s.id === 'preuve') { L.push('', mdEsc(REPLAY), '', '**Ce que cette fiche établit**', ''); for (const p of s.proves) L.push('- ' + mdEsc(p)); L.push('', '**Ce qu’elle n’établit pas**', ''); for (const p of s.doesNotProve) L.push('- ' + mdEsc(p)); }
  }
  L.push('', '---', '', mdEsc(FOOT));
  return L.join('\n') + '\n';
}

const CSS = [
  '@page{size:A4;margin:12mm}*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#171717}',
  'body{font:12px/1.4 "Segoe UI",system-ui,-apple-system,Roboto,sans-serif}',
  '.page{max-width:186mm;margin:0 auto;padding:10mm 0}',
  'header{display:flex;justify-content:space-between;align-items:baseline;gap:12px;border-bottom:1px solid #171717;padding-bottom:6px}',
  'h1{font-size:22px;font-weight:400;margin:0}.id{font:10px ui-monospace,Consolas,monospace;color:#5c5c5c;text-align:right}',
  '.lead{font-size:15px;margin:8px 0 2px}.demo{border:1px solid #8c8c8c;padding:4px 8px;margin:6px 0}',
  'h2{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#5c5c5c;margin:12px 0 4px}',
  'dl{margin:0}dl>div{display:grid;grid-template-columns:44mm 1fr;gap:8px;padding:2px 0;border-bottom:1px solid #e5e5e5}dt{color:#5c5c5c}dd{margin:0;overflow-wrap:anywhere}',
  'code,.copy{font:10.5px ui-monospace,Consolas,monospace;word-break:break-all}.copy{user-select:all;border:1px solid #8c8c8c;padding:1px 4px}',
  'ol.steps{list-style:none;margin:0;padding:0}ol.steps>li{display:grid;grid-template-columns:18px 1fr;gap:6px;margin:4px 0}ol.steps input{margin:2px 0 0}',
  'ol.steps b{font-weight:600}ul{margin:2px 0;padding-left:16px}li{margin:1px 0}.note{color:#5c5c5c;font-size:10.5px;margin:3px 0}',
  '.line{margin:3px 0}.line code{display:block;border-left:2px solid #e5e5e5;padding-left:6px}',
  '.cols{display:grid;grid-template-columns:1fr 1fr;gap:16px}footer{margin-top:10px;border-top:1px solid #171717;padding-top:4px;color:#5c5c5c;font-size:10px}',
  '@media print{.page{padding:0}}'
].join('\n');

export function renderHtml(view, sha) {
  const o = [];
  for (const s of view.sections) {
    o.push('<section><h2>' + esc(s.title) + '</h2>');
    if (s.rows && s.rows.length) o.push('<dl>' + s.rows.map((r) => '<div><dt>' + esc(r.label) + '</dt><dd>' + (r.label.startsWith('Empreinte') ? '<span class="copy">' + esc(sha) + '</span> <span class="note">' + esc(r.value) + '</span>' : r.copy ? '<span class="copy">' + esc(r.value) + '</span>' : esc(r.value)) + '</dd></div>').join('') + '</dl>');
    if (s.items) o.push(s.items.length ? '<ul>' + s.items.map((i) => '<li>' + esc(i) + '</li>').join('') + '</ul>' : '');
    if (s.note) o.push('<p class="note">' + esc(s.note) + '</p>');
    if (s.intro) o.push('<p>' + esc(s.intro) + '</p>');
    if (s.steps) o.push('<ol class="steps">' + s.steps.map((st) => '<li><input type="checkbox"' + (st.done ? ' checked' : '') + ' aria-label="' + esc('Étape ' + st.n) + '"><div><b>' + st.n + '. ' + esc(st.title) + '</b>' + (st.applies ? '' : ' <span class="note">(sans objet)</span>') + '<br>' + esc(st.text) + (st.sub.length ? '<ul>' + st.sub.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') + '</div></li>').join('') + '</ol>');
    if (s.chainLine) o.push('<p>' + esc(s.chainLine) + '</p>');
    for (const ln of s.lines || []) o.push('<div class="line">Ligne ' + esc(ln.seq ?? ln.n) + ' :<code>' + esc(JSON.stringify(ln)) + '</code></div>');
    for (const w of s.withheld || []) o.push('<p class="note">' + esc(w) + '</p>');
    if (s.id === 'preuve') o.push('<p class="note">' + esc(REPLAY) + '</p><div class="cols"><div><h2>Ce que cette fiche établit</h2><ul>' + s.proves.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul></div><div><h2>Ce qu’elle n’établit pas</h2><ul>' + s.doesNotProve.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul></div></div>');
    o.push('</section>');
  }
  return '<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'
    + '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'">\n<meta name="referrer" content="no-referrer">\n'
    + '<title>Fiche d’incident ' + esc(view.id) + '</title>\n<style>\n' + CSS + '\n</style>\n</head>\n<body>\n<div class="page">\n'
    + '<header><h1>Fiche d’incident</h1><div class="id">N° ' + esc(view.id) + '<br>' + esc(view.generatedText) + '</div></header>\n'
    + '<p class="lead">' + esc(view.lead) + '</p>\n' + (view.demo ? '<p class="demo">' + esc(DEMO_LINE) + '</p>\n' : '')
    + o.join('\n') + '\n<footer>' + esc(FOOT) + '</footer>\n</div>\n</body>\n</html>\n';
}
