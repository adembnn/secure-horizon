/* Hold up - what the network itself says about a request, read DIRECTLY on the chain (not through the page, not through the wallet).
 * Pure ES module : no chrome.*, no DOM. The caller gives `fetchImpl` (the service worker's own fetch).
 *
 * Networks read : Avalanche C-Chain (43114) and Avalanche Fuji (43113), on the public RPC of the Avalanche documentation.
 * Read-only methods only (eth_getCode, eth_getBalance, eth_call). Never a key, never a transaction, never the written sentence.
 * What leaves the machine : the request the site made (account, called address, amount, data), to the node the wallet would use anyway.
 *
 *   chainFacts(body, { fetchImpl, timeoutMs }) -> null (not a transaction, network not read, no answer in time)
 *     or { chain, account, target, hasData, contract, balance, value, enough, runs, why }
 *        contract : true (the called address holds code), false (a plain address), null (not read)
 *        balance, value : wei, decimal strings ; enough : the account holds the amount the request sends (null : not read)
 *        runs : true (the same call, replayed on the node with the amount in hand, ends), false (it reverts : `why`), null (not replayed)
 *   withChainFacts(written, facts, intent, { service }) -> the answer of the written check, completed by these facts.
 *
 * What it proves : at this block, the called address holds code or not ; the account holds this balance ; the call ends or reverts.
 * What it does NOT prove : what the call does once it runs (the public RPC has no trace : debug_traceCall and eth_simulateV1 answer
 * "method does not exist", measured 11 Oct. 2026), nor that the answer is the same at execution time. A fact never turns a request that
 * could not be compared into a match : it only adds what was read, or says that nothing can come back. */
export const CHAIN_RPC = Object.freeze({ 43114: 'https://api.avax.network/ext/bc/C/rpc', 43113: 'https://api.avax-test.network/ext/bc/C/rpc' });
export const CHAIN_NATIVE = Object.freeze({ 43114: 'AVAX', 43113: 'AVAX' });
export const READ_MS = 2000; // the person is waiting for the answer : past this, nothing is said about the chain
const HEX20 = /^0x[0-9a-fA-F]{40}$/;
const HEXDATA = /^0x(?:[0-9a-fA-F]{2})*$/;
const UNIT = 10n ** 18n;
const big = (x) => { try { return x == null || x === '' ? 0n : BigInt(x); } catch (_) { return null; } };

export function chainOf(body) {
  try {
    const p = body && Array.isArray(body.params) ? body.params[0] : null;
    const c = body && body.chainId != null && body.chainId !== '' ? body.chainId : p && typeof p === 'object' ? p.chainId : null;
    return c == null || c === '' ? null : Number(BigInt(c));
  } catch (_) { return null; }
}

async function rpc(url, fetchImpl, method, params, signal) {
  const res = await fetchImpl(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
  const j = await res.json();
  if (!j || typeof j !== 'object') throw new Error('unreadable answer');
  if (j.error) { const e = new Error(String((j.error && j.error.message) || 'error').slice(0, 200)); e.node = true; throw e; } // the node answered, and refused
  return j.result;
}

export async function chainFacts(body, { fetchImpl = null, timeoutMs = READ_MS } = {}) {
  if (!body || body.method !== 'eth_sendTransaction' || typeof fetchImpl !== 'function') return null;
  const tx = Array.isArray(body.params) && body.params[0] && typeof body.params[0] === 'object' ? body.params[0] : null;
  const chain = chainOf(body), url = chain != null ? CHAIN_RPC[chain] : null;
  if (!tx || !url) return null;
  const from = String(tx.from || body.from || ''), to = String(tx.to || '');
  const value = big(tx.value), data = typeof tx.data === 'string' && tx.data ? tx.data : typeof tx.input === 'string' && tx.input ? tx.input : '0x';
  if (!HEX20.test(from) || !HEX20.test(to) || value == null || value < 0n || !HEXDATA.test(data)) return null;
  const account = from.toLowerCase(), target = to.toLowerCase(), hasData = data.length > 2;
  const ctl = new AbortController();
  const timer = setTimeout(() => { try { ctl.abort(); } catch (_) {} }, timeoutMs);
  const ask = (m, p) => rpc(url, fetchImpl, m, p, ctl.signal).then((v) => ({ v }), (e) => ({ e }));
  try {
    // The call is replayed with the amount in hand : a balance too small must not hide what the contract itself answers.
    const funded = { [account]: { balance: '0x' + (value + UNIT).toString(16) } };
    const [code, bal, run] = await Promise.all([
      ask('eth_getCode', [target, 'latest']),
      ask('eth_getBalance', [account, 'latest']),
      hasData ? ask('eth_call', [{ from: account, to: target, value: '0x' + value.toString(16), data }, 'latest', funded]) : Promise.resolve(null)
    ]);
    if (code.e && bal.e) return null; // the network did not answer : nothing is said
    const contract = code.e || typeof code.v !== 'string' || !HEXDATA.test(code.v) ? null : code.v.length > 2;
    const balance = bal.e ? null : big(bal.v);
    const runs = !run ? null : run.e ? (run.e.node ? false : null) : true;
    return { chain, account, target, hasData, contract, balance: balance == null ? null : balance.toString(), value: value.toString(),
      enough: balance == null ? null : balance >= value, runs, why: run && run.e && run.e.node ? String(run.e.message || '').slice(0, 120) : '' };
  } catch (_) { return null; } finally { clearTimeout(timer); }
}

// 50000000000000000000 -> "50" ; 1234500000000000000 -> "1,2345" (four decimals at most, French comma, thin groups of three)
export function units(wei) {
  let b; try { b = BigInt(wei); } catch (_) { return ''; }
  const whole = (b / UNIT).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const frac = (b % UNIT).toString().padStart(18, '0').slice(0, 4).replace(/0+$/, '');
  return whole + (frac ? ',' + frac : '');
}

// `written` : what written_check.js answered ({ outcome, line, ... }) or null. `service` : the public name of the called contract, when the
// list of known contracts has it on this network. Returns the same answer, completed ; `written` itself is never modified.
export function withChainFacts(written, facts, intent, { service = null } = {}) {
  if (!facts) return written;
  const symbol = CHAIN_NATIVE[facts.chain] || 'unités du réseau';
  const sends = (() => { try { return BigInt(facts.value) > 0n; } catch (_) { return false; } })();
  // 1) The person wrote an exchange (or a permission) and the request calls an address that holds no code : nothing can be exchanged,
  //    nothing can come back. A fact read on the chain, whatever the data of the request claims.
  const wantsContract = !!(intent && intent.clear && (intent.kind === 'buy_or_swap' || (intent.facts && intent.facts.grant)));
  if (facts.hasData && facts.contract === false && wantsContract) {
    return { outcome: 'mismatch', chain: facts, line: (intent.kind === 'buy_or_swap' ? 'Tu as écrit un échange. ' : 'Tu as écrit une autorisation. ')
      + 'La demande appelle une adresse qui n’est pas un contrat : ' + (sends ? 'tes ' + units(facts.value) + ' ' + symbol + ' partent et rien ne peut revenir.' : 'elle ne peut rien exécuter.') };
  }
  if (!written || typeof written.line !== 'string' || !written.line) return written; // nothing was compared : the facts alone prove no match
  const said = [];
  if (service && facts.contract === true) said.push('Le contrat appelé est ' + service + '.');
  if (facts.runs === false) said.push('Rejouée sur le réseau, cette demande échoue.');
  if (sends && facts.enough === false) said.push('Ton compte détient ' + units(facts.balance) + ' ' + symbol + ' : il n’a pas les ' + units(facts.value) + ' ' + symbol + ' de cette demande.');
  return Object.assign({}, written, { chain: facts }, said.length ? { line: (written.line + ' ' + said.join(' ')).trim() } : {});
}
