// gen_fuzz_control.mjs — red team fuzzer "fuzz_control"
// Surface: control-plane & chain ops — ownership/admin takeover, Safe admin, proxy upgrade,
//          role grants, vote delegation (benign), wallet_* chain/permission RPCs,
//          eth_signTransaction, EIP-7702 on chain 1.
// Black box: the ONLY engine tool used is check.mjs. This file never reads
//            engine/ run/ detectors_adem/ vendor_t103/.
// All synthetic: no real key, no real victim address, nothing signed, no network.
// Deliverables written to redteam/: jury_fuzz_control.jsonl, jury_fuzz_control.md,
//            and a registry line appended to BYPASS_REGISTRY.md.
// Usage: node gen_fuzz_control.mjs
import { writeFileSync, mkdtempSync, appendFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ETHERS = 'C:/Users/Adem/Secure Horizon/blockchain/node_modules/ethers/lib.esm/index.js';
const { AbiCoder, id, getAddress } = await import(pathToFileURL(ETHERS).href);
const abi = AbiCoder.defaultAbiCoder();
const CHECK = join(import.meta.dirname, 'check.mjs');
const HERE = import.meta.dirname;
const TMP = mkdtempSync(join(tmpdir(), 'fuzzctl-'));

// deterministic PRNG
let _s = 20261011 >>> 0;
const rnd = () => { _s |= 0; _s = (_s + 0x6D2B79F5) | 0; let t = Math.imul(_s ^ (_s >>> 15), 1 | _s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const hex = (n) => Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(rnd() * 16)]).join('');
const addr = () => getAddress('0x' + hex(40));
const lookalike = (src) => { const s = src.toLowerCase().replace('0x', ''); return getAddress('0x' + s.slice(0, 4) + hex(32) + s.slice(-4)); };
const enc = (sig, t, v) => id(sig).slice(0, 10) + (t.length ? abi.encode(t, v).slice(2) : '');
const DEFAULT_ADMIN = '0x' + '0'.repeat(64);
const now = 1760140800000;
let seq = 0;
const mkId = (t) => `FC-${t}-${String(++seq).padStart(5, '0')}`;

// ----- control-takeover calldata builders: attacker address -> calldata -----
// Group A: selectors the engine's registry is expected to KNOW (control checks, should stay critical).
const KNOWN = {
  transferOwnership: (a) => enc('transferOwnership(address)', ['address'], [a]),
  setOwner: (a) => enc('setOwner(address)', ['address'], [a]),
  renounceOwnership: () => enc('renounceOwnership()', [], []),
  addOwnerWithThreshold: (a) => enc('addOwnerWithThreshold(address,uint256)', ['address', 'uint256'], [a, 1n]),
  swapOwner: (a) => enc('swapOwner(address,address,address)', ['address', 'address', 'address'], ['0x0000000000000000000000000000000000000001', addr(), a]),
  upgradeTo: (a) => enc('upgradeTo(address)', ['address'], [a]),
  upgradeToAndCall: (a) => enc('upgradeToAndCall(address,bytes)', ['address', 'bytes'], [a, '0x8129fc1c']),
  grantRole: (a) => enc('grantRole(bytes32,address)', ['bytes32', 'address'], [DEFAULT_ADMIN, a]),
  changeAdmin: (a) => enc('changeAdmin(address)', ['address'], [a]),
};
// Group B: REAL-WORLD control-takeover selectors outside the canonical registry (the bypass).
const BYPASS_SEL = {
  nominateNewOwner: (a) => enc('nominateNewOwner(address)', ['address'], [a]),        // Synthetix
  setPendingAdmin: (a) => enc('_setPendingAdmin(address)', ['address'], [a]),         // Compound Comptroller
  setPendingOwner: (a) => enc('setPendingOwner(address)', ['address'], [a]),
  proposeOwner: (a) => enc('proposeOwner(address)', ['address'], [a]),
  pushOwner: (a) => enc('pushOwner(address)', ['address'], [a]),                      // Yearn-style two-step
  pushManagement: (a) => enc('pushManagement(address)', ['address'], [a]),
  transferOwnershipDelayed: (a) => enc('transferOwnership(address,uint256)', ['address', 'uint256'], [a, 0n]),
  transferOwnership2: (a) => enc('transferOwnership(address,address)', ['address', 'address'], [addr(), a]),
  setAdmin: (a) => enc('setAdmin(address)', ['address'], [a]),
  addOwner1: (a) => enc('addOwner(address)', ['address'], [a]),
  setImplementation: (a) => enc('setImplementation(address)', ['address'], [a]),      // non-UUPS proxy impl swap
  setGovernance: (a) => enc('setGovernance(address)', ['address'], [a]),
  transferManagement: (a) => enc('transferManagement(address)', ['address'], [a]),
  setPendingDefaultAdmin: (a) => enc('beginDefaultAdminTransfer(address)', ['address'], [a]), // AccessControlDefaultAdminRules
};
const execTransaction = (to, data) => enc(
  'execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)',
  ['address', 'uint256', 'bytes', 'uint8', 'uint256', 'uint256', 'uint256', 'address', 'address', 'bytes'],
  [to, 0n, data, 0, 0n, 0n, 0n, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', '0x']);

const obf = {
  none: (d) => d,
  trailing: (d) => d + hex(64),
  pad: (d) => d + '00'.repeat(32),
  dirtyUpper: (d) => d.slice(0, 10) + d.slice(10).toUpperCase(),
};

const kinds = ['connect_or_accept_offer', 'asked_by_someone', 'pay_someone', 'send_to_my_account', 'buy_or_swap', null];
const askedBys = ['support', 'advisor', 'recruiter', 'friend'];
const originKinds = ['official', 'unknown', 'lookalike', 'suspicious'];
const chainIds = [1, 43114, 43113];
const cpProfiles = ['eoa_new', 'lookalike', 'contract_new', 'contract_old_known'];
const obfs = ['none', 'trailing', 'pad', 'dirtyUpper'];

function ctxFor(victim, originKind, chainId, cpProfile, attacker, target, extra = {}) {
  const origins = { official: 'https://app.gmx.io', unknown: 'https://claim-rewards-portal.app', lookalike: 'https://app-gmx.io-login.app', suspicious: 'https://metamask-security-check.net' };
  const cp = {};
  if (cpProfile === 'contract_old_known') cp[target] = { isContract: true, ageBlocks: 9_000_000, firstSeenByUser: false, label: 'protocole connu' };
  else if (cpProfile === 'eoa_new') cp[attacker] = { isContract: false, ageBlocks: 0, firstSeenByUser: true };
  else if (cpProfile === 'lookalike') cp[attacker] = { isContract: false, firstSeenByUser: true, lookalikeOf: victim };
  else if (cpProfile === 'contract_new') cp[attacker] = { isContract: true, ageBlocks: 12, firstSeenByUser: true };
  return { chainId, victim, origin: origins[originKind], claimed_site: origins[originKind], origin_kind: originKind,
    address_book: [{ label: 'Paul', address: addr() }, { label: 'mon exchange', address: addr() }],
    known_protocols: [], token_registry: [], counterparty_facts: cp, share_of_balance_pct: 100, token_info: {}, ...extra };
}
function intentFor(kind, askedBy) {
  if (kind === null) return {};
  const b = { kind, declaredAt: now };
  if (kind === 'connect_or_accept_offer') { b.freeText = pick(['Valider la migration de mon compte', 'Me connecter au site', 'Reclamer mon airdrop']); b.askedBy = 'support'; }
  else if (kind === 'asked_by_someone') { b.askedBy = askedBy; b.freeText = 'On me demande de valider une operation'; b.pastedMessage = 'Our team needs you to confirm this to secure your account.'; }
  else if (kind === 'pay_someone') { b.freeText = 'Je paie Paul 50 USDC'; b.token = 'USDC'; b.amount = '50'; b.counterpartyLabel = 'Paul'; }
  else if (kind === 'send_to_my_account') { b.freeText = 'Envoyer vers mon exchange'; b.counterpartyLabel = 'mon exchange'; }
  else if (kind === 'buy_or_swap') { b.freeText = 'Echanger 1 ETH contre USDC'; b.token = 'ETH'; b.amount = '1'; }
  return b;
}

function buildTx(group, tech, k) {
  const victim = addr(), attacker = k.attacker || addr(), target = k.target || addr();
  const fn = (group === 'known' ? KNOWN : BYPASS_SEL)[tech];
  let data = obf[k.obf](fn(attacker));
  let to = target, method = 'eth_sendTransaction', params;
  if (k.wrap === 'exec') { data = execTransaction(target, data); to = k.safe || addr(); }
  if (k.wrap === 'sendCalls') { method = 'wallet_sendCalls'; params = [{ version: '1.0', chainId: '0x' + k.chainId.toString(16), from: victim, calls: [{ to: target, value: '0x0', data }] }]; }
  else params = [{ from: victim, to, value: '0x0', data, chainId: '0x' + k.chainId.toString(16) }];
  return { id: mkId(tech), request: { method, params }, context: ctxFor(victim, k.originKind, k.chainId, k.cpProfile, attacker, target),
    intent: intentFor(k.kind, k.askedBy), label: 'malveillant', expected_severity: 'critical',
    technique: `ownership/${tech}` + (k.wrap !== 'direct' ? '+' + k.wrap : '') };
}
function build7702(k) {
  const victim = addr(), attacker = k.attacker || addr(), c = k.chainId;
  return { id: mkId('eip7702'), request: { method: 'eth_sendTransaction', params: [{ from: victim, to: victim, value: '0x0', type: '0x4', chainId: '0x' + c.toString(16), authorizationList: [{ chainId: '0x' + c.toString(16), address: attacker, nonce: '0x0' }] }] },
    context: ctxFor(victim, k.originKind, c, 'eoa_new', attacker, attacker), intent: intentFor(k.kind, k.askedBy),
    label: 'malveillant', expected_severity: 'critical', technique: `eip7702/chain${c}` };
}
function buildAddChain(k, malicious) {
  const victim = addr();
  const p = malicious
    ? { chainId: '0xa86a', chainName: pick(['Avalanche C-Chain', 'Avalanche Network', 'Avalanche Mainnet']), rpcUrls: [pick(['https://avax-rpc-fast.xyz', 'https://rpc.avalanche-secure.app', 'http://185.220.101.44:9650/ext/bc/C/rpc'])], nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 }, blockExplorerUrls: [pick(['https://snowtrace.io', 'https://avax-explorer.app'])] }
    : pick([{ chainId: '0xa86a', chainName: 'Avalanche C-Chain', rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'], nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 }, blockExplorerUrls: ['https://snowtrace.io'] },
            { chainId: '0xa4b1', chainName: 'Arbitrum One', rpcUrls: ['https://arb1.arbitrum.io/rpc'], nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, blockExplorerUrls: ['https://arbiscan.io'] }]);
  return { id: mkId('addChain'), request: { method: 'wallet_addEthereumChain', params: [p] },
    context: ctxFor(victim, k.originKind, k.chainId, 'contract_old_known', addr(), addr(), { requestedChainId: parseInt(p.chainId, 16), chain_known_to_wallet: !malicious }),
    intent: intentFor(k.kind, k.askedBy), label: malicious ? 'malveillant' : 'benin', expected_severity: malicious ? 'critical' : 'ok',
    technique: malicious ? 'chain/addEthereumChain_malicious_rpc' : 'benign/addEthereumChain_real_l1' };
}
function buildSwitch(k, malicious) {
  const victim = addr(), target = parseInt(k.switchTo, 16);
  return { id: mkId('switch'), request: { method: 'wallet_switchEthereumChain', params: [{ chainId: k.switchTo }] },
    context: ctxFor(victim, k.originKind, k.chainId, 'eoa_new', addr(), addr(), { currentChainId: k.chainId, requestedChainId: target, chain_known_to_wallet: !malicious }),
    intent: intentFor(k.kind, k.askedBy), label: malicious ? 'malveillant' : 'benin', expected_severity: malicious ? 'critical' : 'ok',
    technique: malicious ? 'chain/switchEthereumChain_to_signature' : 'benign/switchEthereumChain' };
}
function buildUnsupported(method, k) {
  const victim = addr(), attacker = k.attacker || addr();
  const params = method === 'wallet_requestPermissions'
    ? [{ eth_accounts: {}, endowment: { permissions: ['all'] } }]
    : [{ from: victim, to: attacker, value: '0x16345785d8a0000', data: KNOWN.transferOwnership(attacker) }];
  return { id: mkId(method === 'wallet_requestPermissions' ? 'reqPerm' : 'signTx'), request: { method, params },
    context: ctxFor(victim, k.originKind, k.chainId, 'eoa_new', attacker, attacker), intent: intentFor(k.kind, k.askedBy),
    label: 'malveillant', expected_severity: 'critical', technique: `method/${method}` };
}
// benign self-admin of your OWN Safe (contract expects warn; critical = false positive)
function benignSafe(tech) {
  const victim = addr(), safe = addr(), co = addr();
  // genuinely benign maintenance params: raise threshold to 2, add/swap a KNOWN co-signer
  const fnData = { changeThreshold: enc('changeThreshold(uint256)', ['uint256'], [2n]), enableModule: enc('enableModule(address)', ['address'], [co]),
    setGuard: enc('setGuard(address)', ['address'], [co]), addOwnerWithThreshold: enc('addOwnerWithThreshold(address,uint256)', ['address', 'uint256'], [co, 2n]),
    swapOwner: enc('swapOwner(address,address,address)', ['address', 'address', 'address'], ['0x0000000000000000000000000000000000000001', victim, co]) }[tech];
  const ctx = ctxFor(victim, 'official', 1, 'contract_old_known', safe, safe);
  ctx.origin = 'https://app.safe.global'; ctx.claimed_site = ctx.origin; ctx.share_of_balance_pct = 0;
  ctx.known_protocols = [{ name: 'mon Safe', address: safe }];
  ctx.counterparty_facts[safe] = { isContract: true, ageBlocks: 5_000_000, firstSeenByUser: false, label: 'mon Safe' };
  ctx.counterparty_facts[co] = { isContract: false, ageBlocks: 8_000_000, firstSeenByUser: false, label: 'co-signataire connu' };
  return { id: mkId('benignSafe'), request: { method: 'eth_sendTransaction', params: [{ from: victim, to: safe, value: '0x0', data: execTransaction(safe, fnData), chainId: '0x1' }] },
    context: ctx, intent: { kind: 'connect_or_accept_offer', declaredAt: now, freeText: 'Administrer mon propre Safe : maintenance de routine' },
    label: 'benin', expected_severity: 'warn', technique: `benign/self_safe_admin/${tech}` };
}
function benignDelegate() {
  const victim = addr(), gov = addr();
  const ctx = ctxFor(victim, 'official', 1, 'contract_old_known', gov, gov);
  ctx.origin = 'https://app.aave.com/governance'; ctx.claimed_site = ctx.origin; ctx.share_of_balance_pct = 0;
  ctx.known_protocols = [{ name: 'governance', address: gov }];
  ctx.counterparty_facts[gov] = { isContract: true, ageBlocks: 20_000_000, firstSeenByUser: false, label: 'governance token' };
  return { id: mkId('benignDelegate'), request: { method: 'eth_sendTransaction', params: [{ from: victim, to: gov, value: '0x0', data: enc('delegate(address)', ['address'], [addr()]), chainId: '0x1' }] },
    context: ctx, intent: { kind: 'connect_or_accept_offer', declaredAt: now, freeText: 'Deleguer mon pouvoir de vote' }, label: 'benin', expected_severity: 'ok', technique: 'benign/gov_delegate' };
}

// ---------- baseline generation ----------
const cases = [];
const WRAPS = ['direct', 'exec', 'sendCalls'];
function sweep(group, tech) {
  for (const kind of kinds) for (const originKind of originKinds) for (const chainId of chainIds)
    for (const cpProfile of cpProfiles) for (const wrap of WRAPS) for (const o of obfs) {
      if (rnd() > 0.35) continue;
      cases.push(buildTx(group, tech, { kind, askedBy: pick(askedBys), originKind, chainId, cpProfile, wrap, obf: o }));
    }
}
for (const t of Object.keys(KNOWN)) sweep('known', t);
for (const t of Object.keys(BYPASS_SEL)) sweep('bypass', t);
for (const kind of kinds) for (const originKind of originKinds) for (const chainId of [1, 43114, 43113, 10, 137]) {
  cases.push(buildAddChain({ kind, askedBy: pick(askedBys), originKind, chainId }, true));
  cases.push(buildSwitch({ kind, askedBy: pick(askedBys), originKind, chainId, switchTo: pick(['0xa86a', '0xa869', '0x1', '0x89']) }, true));
  cases.push(buildUnsupported('wallet_requestPermissions', { kind, originKind, chainId }));
  cases.push(buildUnsupported('eth_signTransaction', { kind, originKind, chainId }));
}
for (const kind of kinds) for (const originKind of originKinds) for (const c of [1, 43114]) cases.push(build7702({ kind, askedBy: pick(askedBys), originKind, chainId: c }));
// benign (hard)
for (const t of ['changeThreshold', 'enableModule', 'setGuard', 'addOwnerWithThreshold', 'swapOwner']) for (let i = 0; i < 12; i++) cases.push(benignSafe(t));
for (let i = 0; i < 24; i++) cases.push(buildAddChain({ kind: 'connect_or_accept_offer', originKind: 'official', chainId: 1 }, false));
for (let i = 0; i < 24; i++) cases.push(buildSwitch({ kind: 'connect_or_accept_offer', originKind: 'official', chainId: 1, switchTo: pick(['0xa86a', '0xa869']) }, false));
for (let i = 0; i < 30; i++) cases.push(benignDelegate());

console.error(`baseline cases: ${cases.length}`);

// ---------- runner ----------
function runCheck(list) {
  if (!list.length) return new Map();
  const f = join(TMP, `b${rnd().toString(36).slice(2)}.jsonl`);
  writeFileSync(f, list.map((c) => JSON.stringify(c)).join('\n') + '\n');
  const out = execFileSync('node', [CHECK, f], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  const m = new Map();
  for (const line of out.split(/\r?\n/)) { if (!line.trim()) continue; let o; try { o = JSON.parse(line); } catch { continue; } if (o.summary || o.id === undefined) continue; m.set(o.id, o); }
  return m;
}
const isBypass = (c, r) => !r ? false : (c.label === 'malveillant' ? r.level_final !== 'critical' : r.level_final === 'critical');

const results = new Map(), byId = new Map(cases.map((c) => [c.id, c]));
const BATCH = 2500;
for (let i = 0; i < cases.length; i += BATCH) { const m = runCheck(cases.slice(i, i + BATCH)); for (const [k, v] of m) results.set(k, v); console.error(`  checked ${Math.min(i + BATCH, cases.length)}/${cases.length}`); }

// baseline per-technique stats (honest, non-inflated)
const baseStat = new Map();
for (const c of cases) { const r = results.get(c.id); const s = baseStat.get(c.technique) || { pass: 0, test: 0, label: c.label, ex: null }; s.test++; if (isBypass(c, r)) { s.pass++; if (!s.ex) s.ex = c.id; } baseStat.set(c.technique, s); }

let tested = cases.length;
let bypasses = cases.filter((c) => isBypass(c, results.get(c.id)));
console.error(`baseline tested=${tested} bypasses=${bypasses.length}`);

// ---------- bounded mutation around bypass seeds ----------
function mutate(c) {
  const d = JSON.parse(JSON.stringify(c)); d.id = mkId('mut');
  const p = d.request.params[0];
  if (p && typeof p.data === 'string' && p.data.length > 10 && rnd() < 0.5) p.data = pick([obf.trailing, obf.pad, obf.dirtyUpper])(p.data.replace(/(.{10}).*/, '$1') + p.data.slice(10, 10 + 64));
  if (d.context) { d.context.origin_kind = pick(originKinds); if (rnd() < 0.5) d.context.chainId = pick(chainIds); d.context.share_of_balance_pct = pick([0, 49, 50, 100]); }
  if (d.intent && rnd() < 0.5) d.intent = intentFor(pick(kinds), pick(askedBys));
  return d;
}
// cap seeds per technique so mutation does not explode or bias toward one family
function capSeeds(list, perTech) { const by = new Map(); for (const c of list) { const a = by.get(c.technique) || []; if (a.length < perTech) a.push(c); by.set(c.technique, a); } return [...by.values()].flat(); }
let frontier = capSeeds(bypasses, 8);
const mutStat = new Map();
for (let round = 0; round < 2 && frontier.length; round++) {
  const muts = []; for (const c of frontier) for (let i = 0; i < 12; i++) muts.push(mutate(c));
  const m = runCheck(muts); tested += muts.length;
  const newBp = [];
  for (const mc of muts) { byId.set(mc.id, mc); const r = m.get(mc.id); const s = mutStat.get(mc.technique) || { pass: 0, test: 0 }; s.test++; if (isBypass(mc, r)) { s.pass++; newBp.push(mc); results.set(mc.id, r); } mutStat.set(mc.technique, s); }
  bypasses.push(...newBp);
  console.error(`mutation round ${round + 1}: +${muts.length} tested, +${newBp.length} bypasses`);
  frontier = capSeeds(newBp, 8);
}

// ---------- clean dedup: coarse key, cap examples per technique ----------
const PER_TECH = 8, seen = new Set(), perTechCount = new Map(), jury = [];
for (const c of bypasses) {
  const r = results.get(c.id); if (!r) continue;
  const method = c.request.method, sel = (c.request.params[0]?.data || c.request.params[0]?.calls?.[0]?.data || '').slice(0, 10);
  const key = `${c.technique}|${method}|${sel}|${c.intent?.kind || 'none'}|${c.context?.origin_kind}|${c.context?.chainId}|${r.level_final}`;
  if (seen.has(key)) continue; seen.add(key);
  const n = (perTechCount.get(c.technique) || 0); if (n >= PER_TECH) continue; perTechCount.set(c.technique, n + 1);
  jury.push({ id: c.id, label: c.label, expected_severity: c.expected_severity, bypass: true, technique: c.technique,
    level_final: r.level_final, level_sans_intention: r.level_sans_intention, unsupported: r.unsupported, error: r.error,
    reason_sample: (r.reasons || [])[0], request: c.request, context: c.context, intent: c.intent });
}

// merge baseline+mutation stats per technique for honest n_pass/n_test
const allStat = new Map();
for (const [t, s] of baseStat) allStat.set(t, { ...s });
for (const [t, s] of mutStat) { const a = allStat.get(t) || { pass: 0, test: 0, label: 'malveillant', ex: null }; a.pass += s.pass; a.test += s.test; allStat.set(t, a); }

writeFileSync(join(HERE, 'jury_fuzz_control.jsonl'), jury.map((c) => JSON.stringify(c)).join('\n') + '\n');

const bypassTechs = [...allStat.entries()].filter(([, s]) => s.pass > 0).sort((a, b) => (b[1].pass / b[1].test) - (a[1].pass / a[1].test) || b[1].pass - a[1].pass);
const caughtTechs = [...baseStat.entries()].filter(([t, s]) => s.label === 'malveillant' && s.pass === 0 && t.startsWith('ownership/'));

writeFileSync(join(TMP, 'summary.json'), JSON.stringify({ tested, jury: jury.length,
  bypass: bypassTechs.map(([t, s]) => [t, s.pass, s.test, s.label, s.ex]),
  caught: caughtTechs.map(([t, s]) => [t, s.test]) }, null, 2));
console.log(JSON.stringify({ tested, juryLines: jury.length, tmp: TMP,
  bypassTechniques: bypassTechs.map(([t, s]) => `${t} ${s.pass}/${s.test} [${s.label}]`),
  caughtControl: caughtTechs.map(([t]) => t) }, null, 2));
