/* Hold up - what the person WROTE against what the request really carries. Pure ES module : no chrome.*, no network, no DOM.
 * Shared by both builds (server mode and standalone), so the answer does not depend on which engine runs.
 *
 *   signIn(method, params, origin)   -> true when the request is a "Sign-In with Ethereum" message for THIS site (no window)
 *   relance(intent)                  -> the one follow-up question when the sentence is too vague, else null
 *   requestFacts(body)               -> { grants: [{ token, spender, raw, unlimited }], sends: [{ token, to, raw }] }
 *   writtenCheck(body, intent, tokens) -> null, or { outcome: 'match' | 'mismatch' | 'unverifiable', line, address_diff? }
 *   effectCheck(effect, intent)      -> the same answer, from the MEASURED effect of a call nobody can read (effect_sim.js)
 *   usedBy(body, effect)             -> what one request takes from the written amount : { grants, out } (storable, no bigint)
 *   operationCheck(used, mine, intent, tokens) -> null, or a mismatch when the requests of ONE written intent, added up, exceed it
 *
 * Rules :
 *   - a written amount against a spending right : the right must not exceed it. Unlimited, or more than written, is a mismatch,
 *     whatever the site or the contract (known or not) ;
 *   - a payment : the recipient and the amount of the request must be the ones written. The address is pasted in the sentence ;
 *     a name without an address cannot be checked, and the window says so ;
 *   - a right given by a SIGNATURE (Permit, Permit2) has no ceiling the person can edit in the wallet : the line says so and
 *     gives no advice nobody can follow ;
 *   - no address is known here : token decimals come from the optional local context (`tokens`), else from the usual
 *     decimals of the symbol the person wrote. */
const HEX20 = /^0x[0-9a-fA-F]{40}$/;
const lc = (a) => String(a).toLowerCase();
const UNLIMITED_FROM = 2n ** 128n; // nobody owns that much of anything : from here on the right is "everything"
const SYMBOL_DECIMALS = { USDC: 6, USDT: 6, WBTC: 8, BTC: 8 };
const TOKEN_ONLY = new Set(['USDC', 'USDT', 'DAI', 'WETH', 'WBTC', 'WAVAX']); // never the network's own currency
const PAY_KINDS = new Set(['pay_someone', 'send_to_my_account']);

// ---------------------------------------------------------------- Sign-In with Ethereum (EIP-4361)
function messageText(m) {
  if (typeof m !== 'string') return '';
  if (!/^0x([0-9a-fA-F]{2})*$/.test(m)) return m;
  try { const b = new Uint8Array((m.length - 2) / 2); for (let i = 0; i < b.length; i++) b[i] = parseInt(m.substr(2 + 2 * i, 2), 16); return new TextDecoder('utf-8', { fatal: true }).decode(b); } catch (_) { return ''; }
}
const SIWE_HEAD = /^(?:[a-z][a-z0-9+.-]*:\/\/)?([^\s/]+) wants you to sign in with your Ethereum account:\n(0x[0-9a-fA-F]{40})\n\n/;
// Recognised only when the message names the real site (origin given by the browser) in its domain AND in its URI.
export function signIn(method, params, origin) {
  if (method !== 'personal_sign' || !Array.isArray(params)) return false;
  let url; try { url = new URL(origin); } catch (_) { return false; }
  if (!/^https?:$/.test(url.protocol) || !url.host) return false;
  const a = params[0], b = params[1];
  const msg = HEX20.test(String(a)) && typeof b === 'string' && !HEX20.test(b) ? b : a, account = msg === a ? b : a;
  const text = messageText(msg);
  if (!text || text.length > 4000) return false;
  const head = text.match(SIWE_HEAD);
  if (!head || head[1].toLowerCase() !== url.host.toLowerCase()) return false;
  if (HEX20.test(String(account)) && lc(account) !== lc(head[2])) return false;
  const field = (name) => { const m = text.match(new RegExp('^' + name + ': (.+)$', 'm')); return m ? m[1].trim() : ''; };
  let uri; try { uri = new URL(field('URI')); } catch (_) { return false; }
  return uri.origin === url.origin && field('Version') === '1' && /^[A-Za-z0-9]{8,}$/.test(field('Nonce'));
}

// ---------------------------------------------------------------- too vague : one follow-up question, never two
export const ASK = { pay: 'Combien, et à qui ?', who: 'À qui ? Colle l’adresse dans ta phrase.', swap: 'Combien, et de quel jeton ?', what: 'Que veux-tu faire, et pour combien ?' };
export function relance(intent) {
  if (!intent || !intent.clear) return ASK.what;
  if (PAY_KINDS.has(intent.kind)) return !intent.amount ? ASK.pay : !(intent.address || intent.named) ? ASK.who : null;
  if (intent.kind === 'buy_or_swap') return intent.amount ? null : ASK.swap;
  return null;
}

// ---------------------------------------------------------------- what the request carries (only the shapes this file needs)
const big = (v) => { try { return typeof v === 'bigint' ? v : v == null || v === '' ? 0n : BigInt(v); } catch (_) { return null; } };
const word = (data, i) => data.slice(10 + 64 * i, 74 + 64 * i);
const addrOf = (w) => '0x' + w.slice(24);
function txFacts(tx, out) {
  if (!tx || typeof tx !== 'object') return;
  const to = HEX20.test(String(tx.to || '')) ? lc(tx.to) : null;
  const data = typeof tx.data === 'string' && tx.data.length > 2 ? tx.data : typeof tx.input === 'string' ? tx.input : '0x';
  const value = big(tx.value);
  if (!to) return;
  if (!/^0x[0-9a-fA-F]*$/.test(data) || data.length < 10) { if (value && value > 0n) out.sends.push({ token: null, to, raw: value }); return; }
  const sel = data.slice(0, 10).toLowerCase(), args = (data.length - 10) / 64;
  const amount = (i) => { try { return BigInt('0x' + word(data, i)); } catch (_) { return null; } };
  if ((sel === '0x095ea7b3' || sel === '0x39509351') && args >= 2) { // approve(spender, amount), increaseAllowance(spender, added)
    const raw = amount(1); if (raw != null && raw > 0n) out.grants.push({ token: to, spender: addrOf(word(data, 0)), raw, unlimited: raw >= UNLIMITED_FROM });
  } else if (sel === '0xa9059cbb' && args >= 2) { const raw = amount(1); if (raw != null) out.sends.push({ token: to, to: addrOf(word(data, 0)), raw }); } // transfer(to, amount)
  else if (sel === '0x23b872dd' && args >= 3) { const raw = amount(2); if (raw != null) out.sends.push({ token: to, to: addrOf(word(data, 1)), raw }); } // transferFrom(from, to, amount)
}
function typedFacts(params, out) {
  let td = params.find((p) => (p && typeof p === 'object' && !Array.isArray(p)) || (typeof p === 'string' && !HEX20.test(p)));
  if (typeof td === 'string') { try { td = JSON.parse(td); } catch (_) { return; } }
  if (!td || typeof td !== 'object') return;
  const m = td.message && typeof td.message === 'object' ? td.message : {}, d = td.domain && typeof td.domain === 'object' ? td.domain : {};
  const grant = (token, spender, v) => {
    const raw = big(v); if (raw == null || raw <= 0n || !HEX20.test(String(token || ''))) return;
    out.grants.push({ token: lc(token), spender: HEX20.test(String(spender || '')) ? lc(spender) : null, raw, unlimited: raw >= UNLIMITED_FROM, signed: true });
  };
  const each = (x) => (Array.isArray(x) ? x : x && typeof x === 'object' ? [x] : []);
  if (td.primaryType === 'Permit') {
    if (m.value != null) grant(d.verifyingContract, m.spender, m.value);
    else if (m.allowed === true || m.allowed === 'true') grant(d.verifyingContract, m.spender, UNLIMITED_FROM); // DAI-style permit : all or nothing
  } else if (td.primaryType === 'PermitSingle' || td.primaryType === 'PermitBatch') for (const x of each(m.details)) grant(x.token, m.spender, x.amount);
  else if (/^Permit(Batch)?(Witness)?TransferFrom$/.test(String(td.primaryType))) for (const x of each(m.permitted)) grant(x.token, m.spender, x.amount);
}
export function requestFacts(body) {
  const out = { grants: [], sends: [] };
  const method = body && typeof body.method === 'string' ? body.method : '', params = body && Array.isArray(body.params) ? body.params : [];
  try {
    if (method === 'eth_sendTransaction' || method === 'eth_signTransaction') txFacts(params[0], out);
    else if (method === 'wallet_sendCalls') { const calls = params[0] && Array.isArray(params[0].calls) ? params[0].calls.slice(0, 64) : []; for (const c of calls) txFacts(c, out); }
    else if (/^eth_signTypedData/.test(method)) typedFacts(params, out);
  } catch (_) { /* unreadable : no fact, the engine verdict stands */ }
  return out;
}

// ---------------------------------------------------------------- amounts
function toRaw(amount, decimals) {
  const m = String(amount).match(/^(\d+)(?:\.(\d+))?$/); if (!m) return null;
  const frac = (m[2] || '').replace(/0+$/, ''); if (frac.length > decimals) return null;
  return BigInt(m[1]) * 10n ** BigInt(decimals) + BigInt((frac || '0').padEnd(decimals, '0') || '0');
}
function fromRaw(raw, decimals) {
  const base = 10n ** BigInt(decimals), int = raw / base;
  const frac = (raw % base).toString().padStart(decimals, '0').slice(0, 6).replace(/0+$/, '');
  if (int === 0n && !frac && raw > 0n) return 'moins de 0,000001';
  return int.toString().replace(/\B(?=(\d{3})+$)/g, ' ') + (frac ? ',' + frac : '');
}
const fr = (amount) => String(amount).replace('.', ',');
export function tokensOf(contexte, chainId) {
  let chain; try { chain = chainId == null || chainId === '' ? undefined : Number(BigInt(chainId)); } catch (_) { chain = undefined; }
  const list = contexte && typeof contexte === 'object' && Array.isArray(contexte.tokens) ? contexte.tokens.slice(0, 5000) : [];
  const map = {};
  for (const t of list) {
    if (!t || !HEX20.test(String(t.address || '')) || typeof t.symbol !== 'string' || !/^[A-Za-z0-9.$_-]{1,12}$/.test(t.symbol) || !Number.isInteger(t.decimals) || t.decimals < 0 || t.decimals > 36) continue;
    let own; try { own = t.chainId == null || t.chainId === '' ? undefined : Number(BigInt(t.chainId)); } catch (_) { own = undefined; }
    if (own === undefined || chain === undefined || own === chain) map[lc(t.address)] = { symbol: t.symbol, decimals: t.decimals };
  }
  return map;
}
// The asset of the request, as the person can read it. A token the local context does not know is read with the symbol written.
function assetOf(token, written, tokens) {
  if (token == null) return TOKEN_ONLY.has(written) ? { symbol: null, decimals: 18, other: true } : { symbol: written, decimals: 18 };
  const known = tokens && tokens[token];
  if (known) return { symbol: known.symbol, decimals: known.decimals, other: known.symbol.toUpperCase() !== written };
  return { symbol: written, decimals: SYMBOL_DECIMALS[written] != null ? SYMBOL_DECIMALS[written] : 18 };
}

export function writtenCheck(body, intent, tokens = {}) {
  if (!intent || !intent.amount || !intent.symbol) return null;
  const facts = requestFacts(body);
  const said = 'Tu as écrit ' + fr(intent.amount) + ' ' + intent.symbol + '.';
  const reduce = ' Réduis le plafond à ' + fr(intent.amount) + ' ' + intent.symbol + ' dans ton portefeuille.';
  let line = null;
  // 1) a spending right against the written amount
  for (const g of facts.grants) {
    const a = assetOf(g.token, intent.symbol, tokens), want = toRaw(intent.amount, a.decimals);
    // A transaction's ceiling can be edited in the wallet before confirming ; a signature's cannot.
    if (g.unlimited) return { outcome: 'mismatch', line: said + (g.signed ? ' Cette signature donne accès à tout ton ' + a.symbol + ' et ne peut pas être limitée.' : ' La demande donne accès à tout ton ' + a.symbol + '.' + reduce) };
    if (a.other) return { outcome: 'mismatch', line: said + ' La demande donne accès à ' + fromRaw(g.raw, a.decimals) + ' ' + a.symbol + '.' };
    if (want == null || g.raw > want) return { outcome: 'mismatch', line: said + (g.signed ? ' Cette signature donne accès à ' + fromRaw(g.raw, a.decimals) + ' ' + a.symbol + ' et ne peut pas être limitée.' : ' La demande donne accès à ' + fromRaw(g.raw, a.decimals) + ' ' + a.symbol + '.' + reduce) };
    line = 'La demande donne accès à ' + fromRaw(g.raw, a.decimals) + ' ' + a.symbol + ', pas plus.';
  }
  // 2) a payment : recipient and amount must be the ones written
  if (PAY_KINDS.has(intent.kind)) {
    if (!facts.sends.length) return facts.grants.length ? { outcome: 'match', line } : { outcome: 'unverifiable', line: 'Je ne retrouve pas ce paiement dans la demande.' };
    for (const s of facts.sends) {
      const a = assetOf(s.token, intent.symbol, tokens), want = toRaw(intent.amount, a.decimals);
      if (a.other) return { outcome: 'mismatch', line: said + ' La demande envoie ' + (a.symbol ? fromRaw(s.raw, a.decimals) + ' ' + a.symbol : 'la monnaie du réseau') + '.' };
      if (want == null || s.raw !== want) return { outcome: 'mismatch', line: said + ' La demande envoie ' + fromRaw(s.raw, a.decimals) + ' ' + a.symbol + '.' };
      if (intent.address && lc(s.to) !== lc(intent.address)) return { outcome: 'mismatch', line: 'Le destinataire de la demande n’est pas l’adresse que tu as écrite.', address_diff: { expected: intent.address, actual: s.to } };
    }
    if (!intent.address) return { outcome: 'unverifiable', line: 'Tu n’as pas écrit d’adresse : je ne peux pas vérifier le destinataire.' };
    return { outcome: 'match', line: null };
  }
  return facts.grants.length ? { outcome: 'match', line } : null;
}

// ---------------------------------------------------------------- the measured effect of an unreadable call (effect_sim.js)
// The token is named by the chain (or by the local context when it knows the address). The written symbol must be that name, or
// part of it ("USDC" for "USDC.e", "AVAX" for "WAVAX") : a valuable token carries its own name, a copy that borrows it is worth nothing.
const sameSymbol = (asset, written) => {
  if (!asset.symbol) return false;
  const s = asset.symbol.toUpperCase();
  return asset.known ? s === written : s === written || (written.length >= 3 && s.includes(written)) || (s.length >= 3 && written.includes(s));
};
const list = (items) => (items.length < 2 ? items.join('') : items.slice(0, -1).join(', ') + ' et ' + items[items.length - 1]);
export function effectCheck(effect, intent) {
  if (!effect || !effect.ok || !intent || !intent.amount || !intent.symbol) return null;
  const said = 'Tu as écrit ' + fr(intent.amount) + ' ' + intent.symbol + '.';
  const name = (a) => (a.token == null ? 'de la monnaie du réseau' : a.decimals == null || !a.symbol ? 'un jeton que je ne sais pas lire' : fromRaw(BigInt(a.raw), a.decimals) + ' ' + a.symbol);
  if (effect.nftRight) return { outcome: 'mismatch', line: said + ' La demande donne aussi accès à tes NFT.' };
  if (effect.grants.length) { const g = effect.grants[0]; return { outcome: 'mismatch', line: said + ' La demande donne aussi accès à ' + (g.unlimited ? 'tout ton ' + (g.symbol || 'jeton') : name(g)) + '.' }; }
  if (effect.nftOut) return { outcome: 'mismatch', line: said + ' La demande fait sortir un NFT de ton compte.' };
  if (!effect.out.length) return { outcome: 'unverifiable', line: 'D’après la simulation, rien ne sort de ton compte avec cette demande.' };
  if (effect.out.length > 1) return { outcome: 'mismatch', line: said + ' La demande fait sortir ' + list(effect.out.map(name)) + ' de ton compte.' };
  const o = effect.out[0];
  const native = o.token == null, a = native ? assetOf(null, intent.symbol, {}) : o;
  if (native && a.other) return { outcome: 'mismatch', line: said + ' La demande fait sortir de la monnaie du réseau de ton compte.' };
  if (!native && (!o.symbol || o.decimals == null)) return { outcome: 'unverifiable', line: 'Je ne sais pas lire le jeton qui sort de ton compte.' };
  const shown = fromRaw(BigInt(o.raw), a.decimals) + ' ' + (native ? intent.symbol : o.symbol);
  if (!native && !sameSymbol(o, intent.symbol)) return { outcome: 'mismatch', line: said + ' La demande fait sortir ' + shown + ' de ton compte.' };
  const want = toRaw(intent.amount, a.decimals), raw = BigInt(o.raw);
  const pay = PAY_KINDS.has(intent.kind);
  if (want == null || raw > want || (pay && raw !== want)) return { outcome: 'mismatch', line: said + ' La demande fait sortir ' + shown + ' de ton compte.' };
  if (pay) {
    if (!intent.address) return { outcome: 'unverifiable', line: 'Tu n’as pas écrit d’adresse : je ne peux pas vérifier le destinataire.' };
    const other = o.to.find((x) => lc(x) !== lc(intent.address));
    if (other) return { outcome: 'mismatch', line: 'Le destinataire de la demande n’est pas l’adresse que tu as écrite.', address_diff: { expected: intent.address, actual: other } };
    if (!o.to.length) return { outcome: 'unverifiable', line: 'Je ne peux pas vérifier le destinataire de cette demande.' };
    return { outcome: 'match', measured: true, line: 'D’après la simulation, ' + shown + ' sortent de ton compte vers l’adresse que tu as écrite.' };
  }
  if (intent.kind !== 'buy_or_swap') return { outcome: 'mismatch', line: said + ' La demande fait sortir ' + shown + ' de ton compte.' };
  // an exchange : something else must come back
  const back = effect.in.filter((x) => x.token !== o.token);
  if (!back.length && !effect.nftIn) return { outcome: 'mismatch', line: said + ' La demande fait sortir ' + shown + ' de ton compte et rien n’y entre en échange.' };
  const got = back.length ? list(back.slice(0, 2).map((x) => (x.token == null ? 'de la monnaie du réseau' : x.symbol && x.decimals != null ? fromRaw(BigInt(x.raw), x.decimals) + ' ' + x.symbol : 'un autre jeton'))) : 'un NFT';
  return { outcome: 'match', measured: true, line: 'D’après la simulation, ' + shown + ' sortent de ton compte et ' + got + (back.length > 1 ? ' y entrent.' : ' y entre.') };
}

// ---------------------------------------------------------------- one written intent, several requests
// What a request takes from the written amount. Read from the request when it is readable, else from its measured effect.
export function usedBy(body, effect) {
  const f = requestFacts(body), used = { grants: [], out: [] };
  for (const g of f.grants) used.grants.push({ token: g.token, spender: g.spender, raw: g.raw.toString() });
  for (const s of f.sends) used.out.push({ token: s.token, raw: s.raw.toString() });
  if (!used.grants.length && !used.out.length && effect && effect.ok) {
    for (const g of effect.grants) used.grants.push({ token: g.token, spender: g.spender, raw: g.raw });
    for (const o of effect.out) used.out.push({ token: o.token, raw: o.raw, decimals: o.decimals, symbol: o.symbol });
  }
  return used;
}
// The written intent is ONE budget. `used` : what the earlier requests of the same intent already took ; `mine` : this request.
// A second right, another token, or amounts that add up to more than what was written : it no longer matches.
export function operationCheck(used, mine, intent, tokens = {}) {
  if (!used || !mine || !intent || !intent.amount || !intent.symbol) return null;
  if (!used.grants.length && !used.out.length) return null;
  const said = 'Tu as écrit ' + fr(intent.amount) + ' ' + intent.symbol + '.';
  if (mine.grants.length && used.grants.length) return { outcome: 'mismatch', line: said + ' Tu as déjà donné une autorisation pour ça, et cette demande en ajoute une autre.' };
  const before = new Set(used.grants.concat(used.out).map((x) => x.token)), now = mine.grants.concat(mine.out).map((x) => x.token);
  if (now.some((t) => !before.has(t))) return { outcome: 'mismatch', line: said + ' Cette demande porte sur un autre jeton que la précédente.' };
  for (const o of mine.out) {
    const a = o.decimals != null && o.symbol ? o : assetOf(o.token, intent.symbol, tokens), want = toRaw(intent.amount, a.decimals);
    let sum = BigInt(o.raw); for (const u of used.out) if (u.token === o.token) sum += BigInt(u.raw);
    if (want == null || sum > want) return { outcome: 'mismatch', line: said + ' Avec cette demande, ' + fromRaw(sum, a.decimals) + ' ' + (a.symbol || intent.symbol) + ' seraient sortis de ton compte.' };
  }
  return null;
}
