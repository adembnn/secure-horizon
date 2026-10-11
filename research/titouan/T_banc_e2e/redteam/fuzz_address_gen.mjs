// fuzz_address_gen.mjs - red team fuzzer, surface "addresses" (agent fuzz_address).
// SYNTHETIC ONLY: every address is derived from a seeded PRNG, no real victim, no key, no network.
// Usage: node fuzz_address_gen.mjs <out.jsonl> <mode> [n] [seed]
//   mode = grid   : systematic grid over the dimensions (prefix/suffix 1..8, vectors, timings...)
//   mode = random : n random combinations
//   mode = benign : hard benign cases (contacts sharing a few chars by chance)
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const ethers = await import(pathToFileURL('C:\\Users\\Adem\\Secure Horizon\\blockchain\\node_modules\\ethers\\lib.esm\\index.js').href);

const [, , OUT, MODE = 'grid', N = '2000', SEED = '7'] = process.argv;
let s = BigInt(SEED) * 2654435761n + 1n;
const rnd = () => { s = (s * 6364136223846793005n + 1442695040888963407n) & ((1n << 64n) - 1n); return Number(s >> 11n) / 2 ** 53; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const hexc = '0123456789abcdef';
const rhex = (n) => Array.from({ length: n }, () => hexc[Math.floor(rnd() * 16)]).join('');
const raddr = () => '0x' + rhex(40);
const cks = (a) => ethers.getAddress(a);

// lookalike: same p first and s last hex chars as target, middle differs, and char p / char 40-s-1 forced different
function lookalike(target, p, sfx) {
  const t = target.slice(2).toLowerCase();
  let mid = rhex(40 - p - sfx).split('');
  const diff = (c) => { let x; do { x = hexc[Math.floor(rnd() * 16)]; } while (x === c); return x; };
  if (mid.length) {
    if (p < 40) mid[0] = diff(t[p]);
    if (sfx > 0 && mid.length) mid[mid.length - 1] = diff(t[40 - sfx - 1]);
  }
  const body = t.slice(0, p) + mid.join('') + (sfx ? t.slice(40 - sfx) : '');
  if (body === t) return lookalike(target, p, sfx);
  return '0x' + body;
}
function caseify(a, mode) {
  const b = a.slice(2).toLowerCase();
  if (mode === 'lower') return '0x' + b;
  if (mode === 'upper') return '0x' + b.toUpperCase();
  if (mode === 'checksum') return cks('0x' + b);
  return '0x' + b.split('').map((c) => (rnd() < 0.5 ? c.toUpperCase() : c)).join('');
}
const pad = (h) => h.replace(/^0x/, '').toLowerCase().padStart(64, '0');
const CH = {
  43114: { usdc: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', usdt: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', wavax: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', router: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4' },
  43113: { usdc: '0x5425890298aed601595a70AB815c96711a31Bc65', usdt: '0x70CFD88633850EcadeDF1765B950e43B4ff7CBb2', wavax: '0xd00ae08403B9bbb9124bB305C09058E32C39A48c', router: '0x51E16d1A3D06F056E3349212941D549a2f7E9E6F' },
};
const registry = (c) => [{ symbol: 'USDC', decimals: 6, address: CH[c].usdc }, { symbol: 'USDT', decimals: 6, address: CH[c].usdt }, { symbol: 'WAVAX', decimals: 18, address: CH[c].wavax }];
const ROLES = {
  contact: { label: 'Paul', kind: 'pay_someone', free: ['Payer Paul', 'Je paie Paul pour le resto', 'send to Paul'] },
  exchange: { label: 'mon Binance', kind: 'send_to_my_account', free: ['Envoyer à mon compte Binance', 'Je dépose sur mon Binance'] },
  own: { label: 'mon Ledger', kind: 'send_to_my_account', free: ['Envoyer à mon compte', 'Je mets mes fonds sur mon Ledger'] },
  self: { label: 'mon compte', kind: 'send_to_my_account', free: ['Envoyer à mon compte', 'Je bouge mes fonds sur mon autre compte'] },
};
const DEC = { native: 18, usdc: 6 };
const units = (amt, d) => ethers.parseUnits(amt, d);

let idn = 0;
function build(o) {
  const chain = o.chain;
  const victim = cks(raddr());
  const target = o.role === 'self' ? victim : cks(raddr());
  const other = cks(raddr());
  const L = o.benign ? null : lookalike(o.role === 'self' ? victim : target, o.p, o.s);
  const dest = o.destKind === 'token' ? CH[chain].usdc.toLowerCase() : o.destKind === 'router' ? CH[chain].router.toLowerCase() : o.benign ? (o.benignDest || target) : L;
  const destCased = caseify(dest, o.caseMode);
  const usual = o.asset === 'native' ? '2.5' : '150';
  const amount = o.amount === 'usual' ? usual : o.asset === 'native' ? '48' : '9800';
  const tokSym = o.asset === 'native' ? 'AVAX' : 'USDC';
  // request
  let tx;
  if (o.asset === 'native') tx = { from: victim, to: destCased, value: '0x' + units(amount, 18).toString(16), data: '0x', chainId: '0x' + chain.toString(16) };
  else tx = { from: victim, to: CH[chain].usdc, value: '0x0', data: '0xa9059cbb' + pad(dest) + units(amount, 6).toString(16).padStart(64, '0'), chainId: '0x' + chain.toString(16) };
  // address book
  const book = [];
  const r = ROLES[o.role];
  if (o.role !== 'self') book.push({ label: r.label, address: o.vector === 'book_poisoned' ? caseify(L, o.caseMode) : caseify(target, o.bookCase || 'checksum'), kind: o.role === 'contact' ? 'contact' : 'own' });
  if (o.vector === 'book_poisoned' && o.keepRealInBook) book.push({ label: r.label + ' (ancien)', address: target });
  book.push({ label: 'Mamie', address: other, kind: 'contact' });
  if (o.sibShare) book.push({ label: o.sibLabel || 'Pauline', address: cks(lookalike(target, o.sibShare[0], o.sibShare[1])), kind: 'contact' });
  // history
  const hist = [];
  if (o.realHistory !== false) {
    hist.push({ address: caseify(o.role === 'self' ? other : target, o.histCase || 'lower'), minutes_ago: o.minutes + 3, direction: 'sortie', amount: usual, kind: 'out', token: tokSym });
    hist.push({ address: caseify(o.role === 'self' ? other : target, 'lower'), minutes_ago: o.minutes + 30000, direction: 'sortie', amount: usual, kind: 'out', token: tokSym });
  }
  if (o.role === 'self') hist.push({ address: caseify(victim, 'lower'), minutes_ago: o.minutes + 50000, direction: 'entree', amount: '100', kind: 'in', token: 'USDC' });
  const fakeTok = cks(raddr());
  const token_info = {};
  if (!o.benign || o.noiseDust) {
    const pa = o.benign ? lookalike(target, 4, 4) : L;
    const v = o.vector;
    if (v === 'dust_native') hist.push({ address: caseify(pa, o.histCase || 'lower'), minutes_ago: o.minutes, direction: 'entree', amount: o.dustAmt ?? '0.000001', kind: 'dust_transfer', token: 'AVAX' });
    if (v === 'dust_usdc') hist.push({ address: caseify(pa, o.histCase || 'lower'), minutes_ago: o.minutes, direction: 'entree', amount: o.dustAmt ?? '0.000001', kind: 'dust_transfer', token: 'USDC' });
    if (v === 'zero_transferFrom') hist.push({ address: caseify(pa, o.histCase || 'lower'), minutes_ago: o.minutes, direction: 'entree', amount: '0', kind: 'transferFrom_zero_value', token: CH[chain].usdc });
    if (v === 'fake_token') { hist.push({ address: caseify(pa, o.histCase || 'lower'), minutes_ago: o.minutes, direction: 'entree', amount: o.dustAmt ?? '0', kind: 'fake_token_transfer', token: fakeTok }); token_info[fakeTok] = { symbol: o.fakeSym || 'USDC', decimals: 6 }; }
    if (v === 'zero_transferFrom_out') hist.push({ address: caseify(pa, o.histCase || 'lower'), minutes_ago: o.minutes, direction: 'sortie', amount: '0', kind: 'transferFrom_zero_value', token: CH[chain].usdc });
  }
  const facts = {};
  if (!o.noFacts) {
    const f = { isContract: !!o.recipientContract, firstSeenByUser: o.benign ? false : !['dust_native', 'dust_usdc', 'zero_transferFrom', 'fake_token', 'book_poisoned'].includes(o.vector) };
    if (o.recipientContract) f.ageBlocks = o.ageBlocks ?? 40;
    if (o.hint && !o.benign) f.lookalikeOf = o.role === 'self' ? victim : target;
    facts[cks(dest)] = f;
  }
  const context = { chainId: chain, victim, origin: o.origin || 'core-wallet://send', address_book: book, known_protocols: [{ name: 'router', address: CH[chain].router }], token_registry: registry(chain), history: hist, counterparty_facts: facts, share_of_balance_pct: o.share ?? (o.amount === 'usual' ? 8 : 70) };
  if (Object.keys(token_info).length) context.token_info = token_info;
  if (o.vector === 'clipboard') context.clipboard = { copied: o.role === 'self' ? victim : target, pasted: dest, hijack_mode: o.p + o.s === 0 ? 'random' : 'lookalike' };
  if (o.vector === 'ens_label') context.ens = { name: o.ensName || 'paul.avax', resolved: dest };
  // intent
  const intent = { declaredAt: 1791720000000, kind: o.intentKind || r.kind, freeText: o.freeText || pick(r.free), token: tokSym, amount, counterpartyLabel: o.cpLabel || (o.ensName && o.vector === 'ens_label' ? o.ensName : r.label) };
  if (o.intentAddr === 'real') intent.counterpartyAddress = caseify(o.role === 'self' ? victim : target, o.intentCase || 'checksum');
  if (o.intentAddr === 'dest') intent.counterpartyAddress = caseify(dest, o.intentCase || 'checksum');
  if (o.dropAmount) { delete intent.amount; }
  if (o.dropToken) delete intent.token;
  const tech = o.tech || (o.benign ? `benign_${o.benignKind}` : `${o.vector}|${o.role}|p${o.p}s${o.s}`);
  return {
    id: `fa-${MODE}-${SEED}-${String(++idn).padStart(5, '0')}`, synthetic: true, notice: 'SYNTHETIQUE - red team fuzz_address',
    request: { method: 'eth_sendTransaction', params: [tx] }, context, intent,
    label: o.benign ? 'benin' : 'malveillant', expected_severity: o.benign ? 'ok' : 'critical',
    technique: tech, dims: { ...o, extraBook: undefined },
  };
}

const out = [];
const VECTORS = ['dust_native', 'dust_usdc', 'zero_transferFrom', 'fake_token', 'clipboard', 'book_poisoned', 'ens_label', 'none'];
const ROLE_L = ['contact', 'exchange', 'own', 'self'];
const MINS = [1, 20, 120, 43200];
const CASES = ['lower', 'checksum', 'upper', 'random'];
const base = () => ({ chain: pick([43114, 43113]), asset: pick(['native', 'usdc']), amount: pick(['usual', 'unusual']), minutes: pick(MINS), caseMode: pick(CASES), recipientContract: rnd() < 0.15, intentAddr: pick(['none', 'none', 'real']) });

if (MODE === 'grid') {
  // full prefix/suffix grid x vectors x roles (one random fill for the other dims)
  for (const vector of VECTORS) for (const role of ROLE_L) for (let p = 0; p <= 8; p++) for (let sx = 0; sx <= 8; sx++) {
    if (p + sx === 0) continue;
    if (p === 0 && sx === 0) continue;
    if ((p < 1 || p > 8) && sx === 0) continue;
    const o = { ...base(), vector, role, p, s: sx };
    if (vector === 'book_poisoned') o.intentAddr = pick(['none', 'dest']);
    if (vector === 'clipboard') o.intentAddr = 'none';
    out.push(build(o));
  }
} else if (MODE === 'random') {
  for (let i = 0; i < Number(N); i++) {
    const o = { ...base(), vector: pick(VECTORS), role: pick(ROLE_L), p: 1 + Math.floor(rnd() * 8), s: Math.floor(rnd() * 9) };
    if (rnd() < 0.3) o.dustAmt = pick(['0', '0.000001', '0.01', '0.0100001', '0.5', '1000']);
    if (rnd() < 0.2) o.histCase = pick(CASES);
    if (rnd() < 0.15) o.hint = true;
    if (rnd() < 0.15) o.realHistory = false;
    if (rnd() < 0.1) o.noFacts = true;
    if (rnd() < 0.1) o.intentKind = pick(['pay_someone', 'send_to_my_account']);
    if (rnd() < 0.1) o.dropAmount = true;
    if (rnd() < 0.1) o.dropToken = true;
    if (o.vector === 'book_poisoned') o.intentAddr = pick(['none', 'dest']);
    if (o.vector === 'clipboard') o.intentAddr = 'none';
    if (rnd() < 0.15) o.intentCase = pick(['lower', 'upper', 'random']);
    out.push(build(o));
  }
} else if (MODE === 'benign') {
  for (let i = 0; i < Number(N); i++) {
    const o = { ...base(), benign: true, role: pick(['contact', 'exchange', 'own']), vector: 'none', p: 0, s: 0 };
    const kind = pick(['contact_prefix3', 'contact_suffix3', 'contact_p2s1', 'contact_p1s2', 'contact_p3s0_new', 'real_with_dust_noise', 'real_case_mismatch', 'p4_only']);
    o.benignKind = kind;
    // the genuine destination is the real target; we add another genuine contact sharing a few chars by chance
    const share = { contact_prefix3: [3, 0], contact_suffix3: [0, 3], contact_p2s1: [2, 1], contact_p1s2: [1, 2], contact_p3s0_new: [3, 0], p4_only: [4, 0], real_with_dust_noise: [3, 0], real_case_mismatch: [3, 0] }[kind];
    o.sibShare = share; o.sibLabel = pick(['Pauline', 'Paulo', 'Léa', 'Marc']);
    if (kind === 'real_with_dust_noise') { o.noiseDust = true; o.vector = pick(['dust_native', 'dust_usdc', 'zero_transferFrom', 'fake_token']); }
    if (kind === 'real_case_mismatch') { o.intentAddr = 'real'; o.intentCase = pick(['lower', 'upper', 'random']); o.bookCase = pick(['lower', 'upper', 'random']); }
    if (kind === 'contact_p3s0_new') { o.realHistory = false; }
    out.push(build(o));
    // also: pay the sibling (a real contact) directly: book contains both, history contains sibling
  }
} else if (MODE === 'r2') {
  const VEC_D = ['dust_native', 'dust_usdc', 'zero_transferFrom', 'fake_token', 'none', 'clipboard', 'ens_label'];
  for (let i = 0; i < Number(N); i++) {
    const T = pick(['T1_label_only_random_recipient', 'T3_sosie_p3plus_s3minus', 'T4_sosie_p2minus_s4plus', 'T5_book_poisoned_no_history', 'T6_send_to_contract', 'T7_pay_kind_on_own_account', 'T8_p0s0_dust_exchange']);
    const o = { ...base(), tech: T, role: 'contact', intentAddr: 'none', vector: pick(VEC_D), p: 0, s: 0 };
    if (T === 'T1_label_only_random_recipient') { o.vector = pick(['clipboard', 'ens_label', 'none', 'dust_native', 'fake_token']); if (o.vector === 'ens_label') { o.ensName = pick(['paul.avax', 'paul-dupont.eth', 'Paul']); } if (rnd() < 0.3) o.cpLabel = pick(['Paul', 'paul', 'PAUL', 'Paul D.']); }
    if (T === 'T3_sosie_p3plus_s3minus') { o.p = 3 + Math.floor(rnd() * 6); o.s = Math.floor(rnd() * 4); o.role = pick(['contact', 'contact', 'exchange', 'own']); }
    if (T === 'T4_sosie_p2minus_s4plus') { o.p = Math.floor(rnd() * 3); o.s = 4 + Math.floor(rnd() * 5); o.role = pick(['contact', 'contact', 'exchange', 'own']); }
    if (T === 'T5_book_poisoned_no_history') { o.vector = 'book_poisoned'; o.realHistory = false; o.p = 4 + Math.floor(rnd() * 5); o.s = 4 + Math.floor(rnd() * 5); o.role = pick(['contact', 'exchange', 'own']); o.intentAddr = pick(['none', 'dest']); }
    if (T === 'T6_send_to_contract') { o.destKind = pick(['token', 'router']); o.vector = 'none'; o.role = pick(['contact', 'exchange']); }
    if (T === 'T7_pay_kind_on_own_account') { o.role = pick(['exchange', 'own']); o.intentKind = 'pay_someone'; o.p = Math.floor(rnd() * 9); o.s = Math.floor(rnd() * 9); }
    if (T === 'T8_p0s0_dust_exchange') { o.role = pick(['exchange', 'own']); o.vector = pick(['dust_native', 'fake_token', 'zero_transferFrom']); }
    if (rnd() < 0.2) o.histCase = pick(CASES);
    out.push(build(o));
  }
} else if (MODE === 'r2benign') {
  for (let i = 0; i < Number(N); i++) {
    const T = pick(['B1_real_target_after_poison_dust', 'B2_real_contact_shares3', 'B3_new_exchange_deposit_address']);
    const o = { ...base(), benign: true, tech: T, role: pick(['contact', 'exchange', 'own']), vector: 'none', p: 0, s: 0, benignKind: T };
    if (T === 'B1_real_target_after_poison_dust') { o.noiseDust = true; o.vector = pick(['dust_native', 'dust_usdc', 'zero_transferFrom', 'fake_token']); }
    if (T === 'B2_real_contact_shares3') { o.sibShare = pick([[3, 0], [0, 3], [3, 1], [1, 3], [2, 2], [3, 2], [2, 3], [3, 3]]); o.sibLabel = pick(['Pauline', 'Paulo', 'Léa']); }
    if (T === 'B3_new_exchange_deposit_address') { o.role = 'exchange'; o.benignDest = '0x' + rhex(40); o.realHistory = pick([true, false]); }
    out.push(build(o));
  }
} else if (MODE === 'r3') {
  // mutate around T1 (label-only intent) and T6 (contract recipient): push risk signals up and see what still passes
  for (let i = 0; i < Number(N); i++) {
    const T = pick(['T1_label_only_random_recipient', 'T1_label_only_random_recipient', 'T6_send_to_contract', 'T3_sosie_p3plus_s3minus']);
    const o = { ...base(), tech: T, role: 'contact', intentAddr: 'none', vector: pick(['clipboard', 'none', 'dust_native', 'fake_token', 'ens_label']), p: 0, s: 0 };
    if (T === 'T3_sosie_p3plus_s3minus') { o.p = 3 + Math.floor(rnd() * 6); o.s = Math.floor(rnd() * 4); }
    if (T === 'T6_send_to_contract') { o.destKind = pick(['token', 'router']); o.role = pick(['contact', 'exchange', 'own']); o.vector = 'none'; }
    o.share = pick([5, 49, 51, 90, 100]);
    o.recipientContract = rnd() < 0.3; o.ageBlocks = pick([1, 10, 1000, 100000]);
    if (rnd() < 0.3) o.origin = pick(['https://pangolin-airdrop.xyz', 'https://app.traderjoexyz.com', 'metamask://send']);
    if (rnd() < 0.2) o.dropAmount = true;
    if (rnd() < 0.2) o.dropToken = true;
    if (rnd() < 0.2) o.freeText = pick(['Payer Paul', 'Rembourser Paul', 'pay Paul back', 'Envoyer à mon compte']);
    out.push(build(o));
  }
}
writeFileSync(OUT, out.map((c) => JSON.stringify(c)).join('\n') + '\n');
console.error(`wrote ${out.length} cases to ${OUT}`);
