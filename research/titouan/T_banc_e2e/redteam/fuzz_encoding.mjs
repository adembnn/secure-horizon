// fuzz_encoding.mjs — red-team fuzzer, agent "fuzz_encoding".
// Surface: ENCODING & BATCHES. Generates thousands of synthetic wallet requests that bury a
// dangerous call (approve/transferFrom/setApprovalForAll/transfer) inside a batch/encoding wrapper
// while the declared intent is benign (swap / connect / receive). A malicious case is a BYPASS when
// check.mjs returns level_final != 'critical'. A benign case is a BYPASS when it returns 'critical'.
// EVERYTHING IS SYNTHETIC: no real key, no secret, no real victim address. Chains: Avalanche 43114 / Fuji 43113.
// No network, no file outside the given out dir. No git.
//
// Usage: node fuzz_encoding.mjs            (runs the full loop, writes jury_fuzz_encoding.*)
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AbiCoder, Interface, id as ethId, getAddress } from 'file:///C:/Users/Adem/Secure%20Horizon/blockchain/node_modules/ethers/lib.esm/index.js';

const HERE = 'C:/Users/Adem/Secure Horizon/research/titouan/T_banc_e2e/redteam';
const CHECK = join(HERE, 'check.mjs');
const abi = AbiCoder.defaultAbiCoder();

// ---------- deterministic PRNG ----------
let S = 0x9e3779b9 ^ 20261011;
const rng = () => { S |= 0; S = (S + 0x6D2B79F5) | 0; let t = Math.imul(S ^ (S >>> 15), 1 | S); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ri = (n) => Math.floor(rng() * n);
const pick = (a) => a[ri(a.length)];
const DECLARED_AT = 1760000000000;

// ---------- synthetic addresses (fixed, PRNG-derived, never a real key) ----------
function mkAddr(seed) { let h = ''; let x = seed >>> 0; for (let i = 0; i < 20; i++) { x = (Math.imul(x ^ (x >>> 13), 0x5bd1e995) + 0x9e37) >>> 0; h += (x & 0xff).toString(16).padStart(2, '0'); } return getAddress('0x' + h); }
const VICTIM   = mkAddr(1);
const ATTACKER = mkAddr(2);
const PAUL     = mkAddr(3);
const MUM      = mkAddr(4);
const EXCH     = mkAddr(5);        // my own exchange deposit
const ROUTER_V2 = mkAddr(10);
const ROUTER_V3 = mkAddr(11);
const UNIVERSAL = mkAddr(12);
const FORWARDER = mkAddr(13);      // generic forwarder contract (not in known list)
const FORWARDER2 = mkAddr(14);
const PROXY     = mkAddr(15);      // upgradeable proxy (not in known list)
const SAFE      = mkAddr(16);      // user's Safe
const EVIL_IMPL = mkAddr(17);      // attacker implementation / sweeper

// canonical real-of-memory addresses (same the bench was built/tested with)
const MULTICALL3 = getAddress('0xcA11bde05977b3631167028862bE2a173976CA11');
const PERMIT2    = getAddress('0x000000000022D473030F116dDEE9F6B43aC78BA3');
const MULTISEND  = getAddress('0x40A2aCCbd92BCA938b02010E17A5b8929b49130D');

const TOK = {
  USDC: { addr: getAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'), dec: 6 },
  USDT: { addr: getAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7'), dec: 6 },
  DAI:  { addr: getAddress('0x6B175474E89094C44Da98b954EedeAC495271d0F'), dec: 18 },
  WETH: { addr: getAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'), dec: 18 },
};
const units = (n, sym) => (BigInt(Math.round(n * 1e6)) * 10n ** BigInt(TOK[sym].dec - 6)).toString();
const MAXU = ((1n << 256n) - 1n).toString();

const KNOWN = [
  { label: 'Multicall3', address: MULTICALL3, provenance: 'R[V]' },
  { label: 'Permit2 (canonique)', address: PERMIT2, provenance: 'R[V]' },
  { label: 'Safe MultiSendCallOnly 1.3.0', address: MULTISEND, provenance: 'R[V]' },
  { label: 'Routeur swap V2 (connu)', address: ROUTER_V2, provenance: 'S' },
  { label: 'Routeur swap V3 (connu)', address: ROUTER_V3, provenance: 'S' },
  { label: 'Universal Router (connu)', address: UNIVERSAL, provenance: 'S' },
];
const TOKEN_REGISTRY = Object.entries(TOK).map(([symbol, v]) => ({ symbol, address: v.addr, decimals: v.dec, canonical: true }));

// ---------- encoders ----------
const SEL = {}; // signature -> 4byte selector
function encodeCall(sig, args) {
  const iface = new Interface(['function ' + sig]);
  const fn = iface.getFunction(sig.slice(0, sig.indexOf('(')));
  return iface.encodeFunctionData(fn, args);
}
// raw selector + abi encode (so we can mutate pointers/padding without ethers validation)
function rawCall(sig, types, args) {
  const sel = ethId(sig).slice(0, 10);
  return sel + abi.encode(types, args).slice(2);
}

// dangerous inner calls (these are what the barrier MUST catch)
const DANGER = {
  approve_unlimited: (sym) => encodeCall('approve(address,uint256)', [ATTACKER, MAXU]),
  approve_big:       (sym) => encodeCall('approve(address,uint256)', [ATTACKER, units(1e9, sym)]),
  setApprovalForAll: ()    => encodeCall('setApprovalForAll(address,bool)', [ATTACKER, true]),
  transferFrom:      (sym) => encodeCall('transferFrom(address,address,uint256)', [VICTIM, ATTACKER, units(5000, sym)]),
  transfer_drain:    (sym) => encodeCall('transfer(address,uint256)', [ATTACKER, units(5000, sym)]),
};
const DANGER_KINDS = Object.keys(DANGER);

// benign decoys
const decoyTransfer = (sym) => encodeCall('transfer(address,uint256)', [PAUL, units(1, sym)]);
const decoyRefund = () => encodeCall('refundETH()', []);
const decoyUnwrap = () => encodeCall('unwrapWETH9(uint256,address)', ['1', VICTIM]);
const decoyExactIn = (sym) => encodeCall('exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))', [[TOK[sym].addr, TOK.WETH.addr, 500, VICTIM, units(10, sym), 1, 0]]);
const DECOYS = (sym) => [decoyTransfer(sym), decoyRefund(), decoyUnwrap(), decoyExactIn(sym)];

// ---------- intents (swap / connect / receive) ----------
function mkIntent(flavor, sym, amt) {
  if (flavor === 'swap') return { kind: 'buy_or_swap', freeText: `Je veux echanger ${amt} ${sym} contre de l'ETH`, token: sym, amount: String(amt), declaredAt: DECLARED_AT };
  if (flavor === 'connect') return { kind: 'connect_or_accept_offer', freeText: pick(['Je me connecte au site', 'Je signe pour me connecter', 'Je me connecte pour voir mon solde']), declaredAt: DECLARED_AT };
  // receive
  return pick([
    { kind: 'connect_or_accept_offer', freeText: pick(['Je reclame mon airdrop', 'Je reclame mon cadeau', "J'accepte une offre sur mon NFT"]), declaredAt: DECLARED_AT },
    { kind: 'send_to_my_account', freeText: `Je recois ${amt} ${sym} sur mon Coinbase`, token: sym, amount: String(amt), counterpartyLabel: 'Mon Coinbase', counterpartyAddress: EXCH, declaredAt: DECLARED_AT },
  ]);
}
const FLAVORS = ['swap', 'connect', 'receive'];

// ---------- context ----------
function mkCtx(chainId) {
  return {
    chainId,
    origin: pick(['app.uniswap.org', 'app.1inch.io', 'app.safe.global', 'opensea.io', 'bridge.example-official.org']),
    victim: VICTIM,
    address_book: [
      { label: 'Paul', address: PAUL, kind: 'eoa' },
      { label: 'Maman', address: MUM, kind: 'eoa' },
      { label: 'Mon Coinbase (depot)', address: EXCH, kind: 'exchange_deposit' },
    ],
    known_protocols: KNOWN,
    token_registry: TOKEN_REGISTRY,
    history: [],
    counterparty_facts: {
      [ATTACKER.toLowerCase()]: { isContract: false, firstSeenByUser: true, ageBlocks: 20 },
      [FORWARDER.toLowerCase()]: { isContract: true, firstSeenByUser: true, ageBlocks: 90 },
      [FORWARDER2.toLowerCase()]: { isContract: true, firstSeenByUser: true, ageBlocks: 90 },
      [PROXY.toLowerCase()]: { isContract: true, firstSeenByUser: true, ageBlocks: 90 },
      [EVIL_IMPL.toLowerCase()]: { isContract: true, firstSeenByUser: true, ageBlocks: 30 },
    },
    native_balance_eth: pick(['0.8', '2.4', '7.1', '31.0']),
  };
}
const CHAINS = [43114, 43114, 43114, 43113, 1];

// ---------- case assembly ----------
let CASES = [];
const counters = {};
function addCase(technique, req, flavor, sym, amt, chainId, label, sev, note) {
  counters[technique] = (counters[technique] || 0) + 1;
  CASES.push({
    id: `fe-${technique}-${String(counters[technique]).padStart(4, '0')}`,
    synthetic: true,
    notice: 'SYNTHETIQUE : jeu de test defensif red team, jamais contre un systeme reel',
    technique,
    request: req,
    context: mkCtx(chainId),
    intent: mkIntent(flavor, sym, amt),
    label,
    expected_severity: sev,
    _note: note || '',
  });
}

// ---- Multicall3 nested 1..4 levels ----
function multicall3Wrap(variant, innerCalls) {
  // innerCalls: array of {target, data}
  if (variant === 'aggregate') return rawCall('aggregate((address,bytes)[])', ['tuple(address,bytes)[]'], [innerCalls.map(c => [c.target, c.data])]);
  if (variant === 'aggregate3') return rawCall('aggregate3((address,bool,bytes)[])', ['tuple(address,bool,bytes)[]'], [innerCalls.map(c => [c.target, false, c.data])]);
  if (variant === 'aggregate3Value') return rawCall('aggregate3Value((address,bool,uint256,bytes)[])', ['tuple(address,bool,uint256,bytes)[]'], [innerCalls.map(c => [c.target, false, 0, c.data])]);
  if (variant === 'tryAggregate') return rawCall('tryAggregate(bool,(address,bytes)[])', ['bool', 'tuple(address,bytes)[]'], [false, innerCalls.map(c => [c.target, c.data])]);
}
function genMulticall3() {
  const variants = ['aggregate', 'aggregate3', 'aggregate3Value', 'tryAggregate'];
  for (const variant of variants) {
    for (let depth = 1; depth <= 4; depth++) {
      for (const dk of DANGER_KINDS) {
        for (const flavor of FLAVORS) {
          for (let rep = 0; rep < 3; rep++) {
            const sym = pick(['USDC', 'USDT', 'DAI']); const amt = pick([50, 100, 500, 2500]); const chainId = pick(CHAINS);
            const dec = DECOYS(sym);
            // innermost dangerous call buried among decoys
            let inner = [
              { target: TOK[sym].addr, data: pick(dec) },
              { target: TOK[sym].addr, data: DANGER[dk](sym) },   // middle
              { target: TOK[sym].addr, data: pick(dec) },
            ];
            let data = multicall3Wrap(variant, inner);
            // nest: wrap previous encoded blob as a sub-call targeting multicall3 again
            for (let d = 1; d < depth; d++) {
              data = multicall3Wrap(variant, [
                { target: TOK[sym].addr, data: pick(dec) },
                { target: MULTICALL3, data },
                { target: TOK[sym].addr, data: pick(dec) },
              ]);
            }
            const req = { method: 'eth_sendTransaction', params: [{ from: VICTIM, to: MULTICALL3, value: '0x0', data, chainId: '0x' + chainId.toString(16) }] };
            addCase(`mc3_${variant}_d${depth}`, req, flavor, sym, amt, chainId, 'malveillant', 'critical', `${dk} buried at depth ${depth}`);
          }
        }
      }
    }
  }
}

// ---- Router multicall(bytes[]) and multicall(uint256,bytes[]) and multicall(bytes32,bytes[]) ----
function genRouterMulticall() {
  const forms = ['multicall(bytes[])', 'multicall(uint256,bytes[])', 'multicall(bytes32,bytes[])'];
  for (const form of forms) {
    for (const dk of DANGER_KINDS) {
      for (const flavor of FLAVORS) {
        for (let rep = 0; rep < 6; rep++) {
          const sym = pick(['USDC', 'USDT', 'DAI']); const amt = pick([50, 100, 500, 2500]); const chainId = pick(CHAINS);
          const dec = DECOYS(sym);
          const sub = [pick(dec), DANGER[dk](sym), pick(dec)];
          let data;
          if (form === 'multicall(bytes[])') data = rawCall(form, ['bytes[]'], [sub]);
          else if (form === 'multicall(uint256,bytes[])') data = rawCall(form, ['uint256', 'bytes[]'], [DECLARED_AT / 1000 + 900, sub]);
          else data = rawCall(form, ['bytes32', 'bytes[]'], ['0x' + '00'.repeat(32), sub]);
          const to = pick([ROUTER_V3, ROUTER_V2]);
          const req = { method: 'eth_sendTransaction', params: [{ from: VICTIM, to, value: '0x0', data, chainId: '0x' + chainId.toString(16) }] };
          addCase(`router_${form.replace(/[^a-z]/gi, '').slice(0, 14)}`, req, flavor, sym, amt, chainId, 'malveillant', 'critical', `${dk} via ${form}`);
        }
      }
    }
  }
}

// ---- Universal Router execute(commands, inputs) ----
function genUniversalRouter() {
  // UR command bytes: a sequence of 1-byte opcodes. 0x0a = PERMIT2_PERMIT, 0x08 = V2_SWAP, 0x00 = V3_SWAP, 0x05 = TRANSFER, 0x0c=PERMIT2_TRANSFER_FROM
  const forms = ['execute(bytes,bytes[])', 'execute(bytes,bytes[],uint256)'];
  for (const form of forms) {
    for (const dk of ['approve_unlimited', 'transferFrom', 'transfer_drain', 'setApprovalForAll']) {
      for (const flavor of FLAVORS) {
        for (let rep = 0; rep < 8; rep++) {
          const sym = pick(['USDC', 'USDT', 'DAI']); const amt = pick([50, 100, 500, 2500]); const chainId = pick(CHAINS);
          // commands: a swap opcode + a transfer/permit opcode in the middle
          const cmds = pick(['0x000c00', '0x080a08', '0x000500', '0x0a0c08']);
          // inputs: the dangerous one encoded as the UR TRANSFER/PERMIT input (address token, address recipient, uint256 amount)
          const dangerInput = dk === 'transfer_drain'
            ? abi.encode(['address', 'address', 'uint256'], [TOK[sym].addr, ATTACKER, units(5000, sym)])
            : dk === 'transferFrom'
            ? abi.encode(['address', 'address', 'address', 'uint256'], [TOK[sym].addr, VICTIM, ATTACKER, units(5000, sym)])
            : DANGER[dk](sym); // approve/setApprovalForAll as raw calldata embedded as an input
          const swapInput = abi.encode(['address', 'uint256', 'uint256', 'bytes', 'bool'], [VICTIM, units(amt, sym), 1, '0x', true]);
          const inputs = [swapInput, dangerInput, swapInput];
          let data = form === 'execute(bytes,bytes[])'
            ? rawCall(form, ['bytes', 'bytes[]'], [cmds, inputs])
            : rawCall(form, ['bytes', 'bytes[]', 'uint256'], [cmds, inputs, DECLARED_AT / 1000 + 900]);
          const req = { method: 'eth_sendTransaction', params: [{ from: VICTIM, to: UNIVERSAL, value: '0x0', data, chainId: '0x' + chainId.toString(16) }] };
          addCase(`univ_router_${form.includes('uint256') ? 'deadline' : 'plain'}`, req, flavor, sym, amt, chainId, 'malveillant', 'critical', `${dk} in UR inputs, cmds=${cmds}`);
        }
      }
    }
  }
}

// ---- wallet_sendCalls with 2..20 calls, danger buried in the middle ----
function genSendCalls() {
  for (let n = 2; n <= 20; n++) {
    for (const dk of DANGER_KINDS) {
      for (const flavor of FLAVORS) {
        const sym = pick(['USDC', 'USDT', 'DAI']); const amt = pick([50, 100, 500, 2500]); const chainId = pick(CHAINS);
        const dec = DECOYS(sym);
        const calls = [];
        const dangerIdx = Math.max(1, Math.floor(n / 2));
        for (let i = 0; i < n; i++) {
          if (i === dangerIdx) calls.push({ to: TOK[sym].addr, value: '0x0', data: DANGER[dk](sym) });
          else calls.push({ to: pick([TOK[sym].addr, ROUTER_V2, ROUTER_V3]), value: '0x0', data: pick(dec) });
        }
        const req = { method: 'wallet_sendCalls', params: [{ version: '2.0.0', from: VICTIM, chainId: '0x' + chainId.toString(16), atomicRequired: true, calls }] };
        addCase(`sendcalls_n${n}`, req, flavor, sym, amt, chainId, 'malveillant', 'critical', `${dk} at idx ${dangerIdx}/${n}`);
      }
    }
  }
}

// ---- proxy selectors: wrap danger inside upgradeToAndCall / unknown proxy selectors ----
function genProxy() {
  const wrappers = [
    (inner) => encodeCall('upgradeToAndCall(address,bytes)', [EVIL_IMPL, inner]),
    (inner) => rawCall('delegate(address,bytes)', ['address', 'bytes'], [EVIL_IMPL, inner]),
    (inner) => rawCall('fallback(bytes)', ['bytes'], [inner]),
    (inner) => rawCall('execute(address,bytes)', ['address', 'bytes'], [PROXY, inner]),
  ];
  for (let wi = 0; wi < wrappers.length; wi++) {
    for (const dk of DANGER_KINDS) {
      for (const flavor of FLAVORS) {
        for (let rep = 0; rep < 4; rep++) {
          const sym = pick(['USDC', 'USDT', 'DAI']); const amt = pick([50, 100, 500]); const chainId = pick(CHAINS);
          const data = wrappers[wi](DANGER[dk](sym));
          const req = { method: 'eth_sendTransaction', params: [{ from: VICTIM, to: PROXY, value: '0x0', data, chainId: '0x' + chainId.toString(16) }] };
          addCase(`proxy_w${wi}`, req, flavor, sym, amt, chainId, 'malveillant', 'critical', `${dk} via proxy wrapper ${wi}`);
        }
      }
    }
  }
}

// ---- calldata padding / extra trailing bytes ----
function padVariant(hexData, kind) {
  const body = hexData.slice(2);
  if (kind === 'trailing_junk') return '0x' + body + 'de'.repeat(16 + ri(48));
  if (kind === 'trailing_zeros') return '0x' + body + '00'.repeat(32 * (1 + ri(3)));
  if (kind === 'overpad_word') return '0x' + body + 'ff'.repeat(32); // extra word after valid args
  if (kind === 'leading_pad_arg') return hexData; // handled by raw offset games below
  return hexData;
}
function genPadding() {
  const kinds = ['trailing_junk', 'trailing_zeros', 'overpad_word'];
  for (const dk of DANGER_KINDS) {
    for (const pk of kinds) {
      for (const flavor of FLAVORS) {
        for (let rep = 0; rep < 6; rep++) {
          const sym = pick(['USDC', 'USDT', 'DAI']); const amt = pick([50, 100, 500]); const chainId = pick(CHAINS);
          // (a) bare dangerous call + padding
          const bare = padVariant(DANGER[dk](sym), pk);
          addCase(`pad_bare_${pk}`, { method: 'eth_sendTransaction', params: [{ from: VICTIM, to: TOK[sym].addr, value: '0x0', data: bare, chainId: '0x' + chainId.toString(16) }] }, flavor, sym, amt, chainId, 'malveillant', 'critical', `${dk} + ${pk}`);
          // (b) multicall3 wrapper with padded sub-call
          const dec = DECOYS(sym);
          const inner = [{ target: TOK[sym].addr, data: pick(dec) }, { target: TOK[sym].addr, data: padVariant(DANGER[dk](sym), pk) }, { target: TOK[sym].addr, data: pick(dec) }];
          const wrapped = multicall3Wrap('aggregate3', inner);
          addCase(`pad_mc3_${pk}`, { method: 'eth_sendTransaction', params: [{ from: VICTIM, to: MULTICALL3, value: '0x0', data: wrapped, chainId: '0x' + chainId.toString(16) }] }, flavor, sym, amt, chainId, 'malveillant', 'critical', `${dk} padded sub ${pk}`);
        }
      }
    }
  }
}

// ---- declared delegatecall (Safe execTransaction op=1, multiSend op=1) ----
function packMulti(inner) {
  // Safe MultiSend packed encoding: for each op: 1B operation, 20B to, 32B value, 32B len, data
  let out = '';
  for (const c of inner) {
    const d = c.data.slice(2);
    out += (c.op === 1 ? '01' : '00')
      + c.to.slice(2).toLowerCase()
      + BigInt(c.value || 0).toString(16).padStart(64, '0')
      + BigInt(d.length / 2).toString(16).padStart(64, '0')
      + d;
  }
  return '0x' + out;
}
function genDelegatecall() {
  for (const dk of ['approve_unlimited', 'transferFrom', 'transfer_drain', 'setApprovalForAll']) {
    for (const flavor of FLAVORS) {
      for (let rep = 0; rep < 10; rep++) {
        const sym = pick(['USDC', 'USDT', 'DAI']); const amt = pick([50, 100, 500]); const chainId = pick(CHAINS);
        const inner = DANGER[dk](sym);
        const form = ri(3);
        let req;
        if (form === 0) {
          // Safe execTransaction with operation=1 (delegatecall) to attacker impl, data = danger
          const data = encodeCall('execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)',
            [EVIL_IMPL, 0, inner, 1, 0, 0, 0, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', '0x' + '00'.repeat(65)]);
          req = { method: 'eth_sendTransaction', params: [{ from: VICTIM, to: SAFE, value: '0x0', data, chainId: '0x' + chainId.toString(16) }] };
        } else if (form === 1) {
          // MultiSend with op=1 entries
          const ms = encodeCall('multiSend(bytes)', [packMulti([
            { op: 0, to: TOK[sym].addr, data: decoyTransfer(sym) },
            { op: 1, to: EVIL_IMPL, data: inner },
          ])]);
          req = { method: 'eth_sendTransaction', params: [{ from: VICTIM, to: MULTISEND, value: '0x0', data: ms, chainId: '0x' + chainId.toString(16) }] };
        } else {
          // Safe execTransaction wrapping a MultiSend that itself delegatecalls
          const ms = encodeCall('multiSend(bytes)', [packMulti([{ op: 1, to: EVIL_IMPL, data: inner }])]);
          const data = encodeCall('execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)',
            [MULTISEND, 0, ms, 1, 0, 0, 0, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', '0x' + '00'.repeat(65)]);
          req = { method: 'eth_sendTransaction', params: [{ from: VICTIM, to: SAFE, value: '0x0', data, chainId: '0x' + chainId.toString(16) }] };
        }
        addCase(`delegatecall_f${form}`, req, flavor, sym, amt, chainId, 'malveillant', 'critical', `${dk} via declared delegatecall form ${form}`);
      }
    }
  }
}

// ---- non-zero value with empty calldata to a contract ----
function genValueEmpty() {
  for (const flavor of FLAVORS) {
    for (let rep = 0; rep < 30; rep++) {
      const chainId = pick(CHAINS); const amt = pick([0.5, 1, 2.4, 7.1]);
      const val = '0x' + (BigInt(Math.round(amt * 1e6)) * 10n ** 12n).toString(16);
      const to = pick([EVIL_IMPL, FORWARDER, PROXY, ATTACKER]);
      const req = { method: 'eth_sendTransaction', params: [{ from: VICTIM, to, value: val, data: '0x', chainId: '0x' + chainId.toString(16) }] };
      addCase('value_empty_calldata', req, flavor, 'WETH', amt, chainId, 'malveillant', 'critical', `native value ${amt} to contract, empty data`);
    }
  }
}

// ---- forwarding contract (execute(address,uint256,bytes) / forward(address,bytes), multi-hop) ----
function genForwarder() {
  for (const dk of DANGER_KINDS) {
    for (const flavor of FLAVORS) {
      for (let rep = 0; rep < 8; rep++) {
        const sym = pick(['USDC', 'USDT', 'DAI']); const amt = pick([50, 100, 500]); const chainId = pick(CHAINS);
        const inner = DANGER[dk](sym);
        const hops = 1 + ri(3);
        let data = pick([
          encodeCall('execute(address,uint256,bytes)', [TOK[sym].addr, 0, inner]),
          encodeCall('forward(address,bytes)', [TOK[sym].addr, inner]),
          rawCall('relay(address,bytes)', ['address', 'bytes'], [TOK[sym].addr, inner]),
        ]);
        let target = FORWARDER;
        for (let h = 1; h < hops; h++) {
          data = encodeCall('execute(address,uint256,bytes)', [target, 0, data]);
          target = h % 2 ? FORWARDER2 : FORWARDER;
        }
        const req = { method: 'eth_sendTransaction', params: [{ from: VICTIM, to: target, value: '0x0', data, chainId: '0x' + chainId.toString(16) }] };
        addCase(`forwarder_h${hops}`, req, flavor, sym, amt, chainId, 'malveillant', 'critical', `${dk} via ${hops}-hop forwarder`);
      }
    }
  }
}

// ---- BENIGN legit batches (false-positive hunting) ----
function genBenign() {
  for (let rep = 0; rep < 120; rep++) {
    const sym = pick(['USDC', 'USDT', 'DAI']); const amt = pick([50, 100, 500]); const chainId = pick(CHAINS);
    const form = ri(4);
    let req; let to;
    if (form === 0) {
      // Multicall3 aggregate3: bounded approve to KNOWN router + swap (receiver self)
      const inner = [
        { target: TOK[sym].addr, data: encodeCall('approve(address,uint256)', [ROUTER_V3, units(amt, sym)]) },
        { target: ROUTER_V3, data: decoyExactIn(sym) },
      ];
      req = { method: 'eth_sendTransaction', params: [{ from: VICTIM, to: MULTICALL3, value: '0x0', data: multicall3Wrap('aggregate3', inner), chainId: '0x' + chainId.toString(16) }] };
    } else if (form === 1) {
      // router multicall(uint256,bytes[]) : exactInputSingle + unwrapWETH9 to self
      const data = rawCall('multicall(uint256,bytes[])', ['uint256', 'bytes[]'], [DECLARED_AT / 1000 + 900, [decoyExactIn(sym), decoyUnwrap()]]);
      req = { method: 'eth_sendTransaction', params: [{ from: VICTIM, to: ROUTER_V3, value: '0x0', data, chainId: '0x' + chainId.toString(16) }] };
    } else if (form === 2) {
      // wallet_sendCalls: bounded approve to known router + swap
      const calls = [
        { to: TOK[sym].addr, value: '0x0', data: encodeCall('approve(address,uint256)', [ROUTER_V2, units(amt, sym)]) },
        { to: ROUTER_V2, value: '0x0', data: encodeCall('swapExactTokensForTokens(uint256,uint256,address[],address,uint256)', [units(amt, sym), 1, [TOK[sym].addr, TOK.WETH.addr], VICTIM, DECLARED_AT / 1000 + 900]) },
      ];
      req = { method: 'wallet_sendCalls', params: [{ version: '2.0.0', from: VICTIM, chainId: '0x' + chainId.toString(16), atomicRequired: true, calls }] };
    } else {
      // Universal Router legit swap (no transfer-out)
      const inputs = [abi.encode(['address', 'uint256', 'uint256', 'bytes', 'bool'], [VICTIM, units(amt, sym), 1, '0x', true])];
      const data = rawCall('execute(bytes,bytes[],uint256)', ['bytes', 'bytes[]', 'uint256'], ['0x00', inputs, DECLARED_AT / 1000 + 900]);
      req = { method: 'eth_sendTransaction', params: [{ from: VICTIM, to: UNIVERSAL, value: '0x0', data, chainId: '0x' + chainId.toString(16) }] };
    }
    addCase(`benign_batch_f${form}`, req, 'swap', sym, amt, chainId, 'benin', 'ok', 'legit bounded batch to known router');
  }
}

// ---- STAGE 2: mutate around full-blind (ok) winners: FINITE-large approve & drains in wrappers ----
// Root hypothesis: the batch approval rule only fires on UNLIMITED (MAXU). A large *finite* approve,
// or a plain transfer drain, buried in an opaque wrapper is not flagged at all -> ok.
function approveAmt(mag) { return (10n ** BigInt(mag)).toString(); }           // 10^mag
const NEARMAX = [
  ((1n << 256n) - 2n).toString(),                 // MAXU-1
  (((1n << 256n) - 1n) / 2n).toString(),          // MAXU/2
  (1n << 255n).toString(),                        // 2^255
  (1n << 200n).toString(),                        // 2^200
  ((1n << 96n) - 1n).toString(),                  // uint96 max (common "effectively unlimited")
];
function wrapOne(wrapper, sym, innerData) {
  const dec = DECOYS(sym);
  if (wrapper === 'mc3_agg3') return { to: MULTICALL3, data: multicall3Wrap('aggregate3', [{ target: TOK[sym].addr, data: pick(dec) }, { target: TOK[sym].addr, data: innerData }, { target: TOK[sym].addr, data: pick(dec) }]) };
  if (wrapper === 'mc3_agg') return { to: MULTICALL3, data: multicall3Wrap('aggregate', [{ target: TOK[sym].addr, data: pick(dec) }, { target: TOK[sym].addr, data: innerData }]) };
  if (wrapper === 'mc3_try') return { to: MULTICALL3, data: multicall3Wrap('tryAggregate', [{ target: TOK[sym].addr, data: innerData }, { target: TOK[sym].addr, data: pick(dec) }]) };
  if (wrapper === 'fwd') return { to: FORWARDER, data: encodeCall('execute(address,uint256,bytes)', [TOK[sym].addr, 0, innerData]) };
  if (wrapper === 'fwd2') return { to: FORWARDER, data: encodeCall('execute(address,uint256,bytes)', [FORWARDER2, 0, encodeCall('execute(address,uint256,bytes)', [TOK[sym].addr, 0, innerData])]) };
  if (wrapper === 'pad') return { to: MULTICALL3, data: multicall3Wrap('aggregate3', [{ target: TOK[sym].addr, data: pick(dec) }, { target: TOK[sym].addr, data: padVariant(innerData, 'trailing_junk') }]) };
}
function genStage2() {
  const wrappers = ['mc3_agg3', 'mc3_agg', 'mc3_try', 'fwd', 'fwd2', 'pad'];
  // finite-large approve sweep: magnitudes 7..30 decimals, plus near-max probes
  for (const wrapper of wrappers) {
    for (const flavor of FLAVORS) {
      for (const sym of ['USDC', 'USDT', 'DAI']) {
        // magnitude sweep
        for (const mag of [7, 9, 12, 15, 18, 24, 30, 40, 60]) {
          const amt = approveAmt(mag);
          const inner = encodeCall('approve(address,uint256)', [ATTACKER, amt]);
          const w = wrapOne(wrapper, sym, inner);
          addCase(`s2_approveFinite_${wrapper}`, { method: 'eth_sendTransaction', params: [{ from: VICTIM, to: w.to, value: '0x0', data: w.data, chainId: '0x' + (43114).toString(16) }] }, flavor, sym, 100, 43114, 'malveillant', 'critical', `approve 10^${mag} to attacker via ${wrapper}`);
        }
        // near-max probes (is the "unlimited" rule an exact MAXU check?)
        for (let i = 0; i < NEARMAX.length; i++) {
          const inner = encodeCall('approve(address,uint256)', [ATTACKER, NEARMAX[i]]);
          const w = wrapOne(wrapper, sym, inner);
          addCase(`s2_approveNearMax_${wrapper}`, { method: 'eth_sendTransaction', params: [{ from: VICTIM, to: w.to, value: '0x0', data: w.data, chainId: '0x' + (43114).toString(16) }] }, flavor, sym, 100, 43114, 'malveillant', 'critical', `approve nearmax#${i} via ${wrapper}`);
        }
        // transfer drains of varying size
        for (const amt of [500, 5000, 50000, 500000]) {
          const inner = encodeCall('transfer(address,uint256)', [ATTACKER, units(amt, sym)]);
          const w = wrapOne(wrapper, sym, inner);
          addCase(`s2_drain_${wrapper}`, { method: 'eth_sendTransaction', params: [{ from: VICTIM, to: w.to, value: '0x0', data: w.data, chainId: '0x' + (43114).toString(16) }] }, flavor, sym, amt, 43114, 'malveillant', 'critical', `drain ${amt} ${sym} via ${wrapper}`);
        }
      }
    }
  }
}

// ================= run =================
genMulticall3();
genStage2();
genRouterMulticall();
genUniversalRouter();
genSendCalls();
genProxy();
genPadding();
genDelegatecall();
genValueEmpty();
genForwarder();
genBenign();

console.error(`generated ${CASES.length} cases`);

// write to temp, run check.mjs in chunks, collect verdicts
const dir = mkdtempSync(join(tmpdir(), 'fe-'));
const CHUNK = 1000;
const verdicts = {};
for (let i = 0; i < CASES.length; i += CHUNK) {
  const slice = CASES.slice(i, i + CHUNK);
  const f = join(dir, `chunk_${i}.jsonl`);
  // strip our private _note before sending to check.mjs (keep id/label/expected_severity)
  writeFileSync(f, slice.map(c => JSON.stringify({ id: c.id, request: c.request, context: c.context, intent: c.intent, label: c.label, expected_severity: c.expected_severity })).join('\n') + '\n');
  const out = execFileSync('node', [CHECK, f], { encoding: 'utf8', maxBuffer: 1 << 28 });
  for (const line of out.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    if (o.summary) continue;
    if (o.id) verdicts[o.id] = o;
  }
  console.error(`checked ${Math.min(i + CHUNK, CASES.length)}/${CASES.length}`);
}

// classify bypasses
const byTech = {};
const bypasses = [];
for (const c of CASES) {
  const v = verdicts[c.id];
  if (!v) continue;
  const lvl = v.level_final;
  const isMal = c.label === 'malveillant';
  const bypass = isMal ? (lvl !== 'critical') : (lvl === 'critical');
  const t = c.technique;
  byTech[t] = byTech[t] || { n: 0, pass: 0, mal: isMal, examples: [] };
  byTech[t].n++;
  if (bypass) {
    byTech[t].pass++;
    if (byTech[t].examples.length < 1) byTech[t].examples.push(c.id);
    bypasses.push({ ...c, level_final: lvl, level_sans_intention: v.level_sans_intention, reasons: v.reasons, error: v.error, unsupported: v.unsupported });
  }
}

writeFileSync(join(HERE, '_fuzz_verdicts.json'), JSON.stringify({ total: CASES.length, byTech }, null, 2));
writeFileSync(join(HERE, '_fuzz_bypasses.jsonl'), bypasses.map(b => JSON.stringify(b)).join('\n') + '\n');

// summary to stdout
const techSorted = Object.entries(byTech).sort((a, b) => (b[1].pass / b[1].n) - (a[1].pass / a[1].n));
console.log(`\n=== FUZZ_ENCODING RESULTS ===`);
console.log(`tested: ${CASES.length}, bypasses: ${bypasses.length}`);
console.log(`\nper fine technique (pass/tested):`);
for (const [t, s] of techSorted) console.log(`  ${s.pass}/${s.n}\t${(100 * s.pass / s.n).toFixed(0)}%\t${t}\t${s.mal ? 'MAL' : 'BEN'}\t${s.examples[0] || ''}`);

// ---------- consolidate fine techniques into named jury techniques ----------
function groupOf(t) {
  if (t.startsWith('s2_approveFinite')) return 'encodage_approve_fini_dans_lot_cecite_totale';
  if (t.startsWith('s2_approveNearMax') || t.startsWith('s2_drain')) return 'encodage_lot_rabaisse_critical_en_warn';
  if (t.startsWith('mc3_')) return 'multicall3_imbrique_1_4_niveaux';
  if (t.startsWith('pad_mc3')) return 'calldata_padding_sous_appel_de_lot';
  if (t.startsWith('pad_bare')) return 'calldata_padding_appel_direct';
  if (t.startsWith('router_')) return 'routeur_multicall_bytes';
  if (t.startsWith('univ_router')) return 'universal_router_execute_inputs';
  if (t.startsWith('sendcalls')) return 'wallet_sendCalls_2_20_appels';
  if (t.startsWith('proxy_')) return 'selecteurs_de_proxy';
  if (t.startsWith('forwarder')) return 'contrat_forwarder_multi_hop';
  if (t.startsWith('delegatecall')) return 'delegatecall_declare';
  if (t.startsWith('value_empty')) return 'value_non_nulle_calldata_vide';
  if (t.startsWith('benign_batch')) return 'faux_positif_lot_legitime';
  return t;
}
const groups = {};
for (const [t, s] of Object.entries(byTech)) {
  const g = groupOf(t);
  groups[g] = groups[g] || { n: 0, pass: 0, mal: s.mal, okBlind: 0, warn: 0, ex: null };
  groups[g].n += s.n; groups[g].pass += s.pass;
}
for (const b of bypasses) {
  const g = groupOf(b.technique);
  if (b.level_final === 'ok') groups[g].okBlind++; else if (b.level_final === 'warn') groups[g].warn++;
  if (!groups[g].ex) groups[g].ex = b.id;
}

// ---------- dedup + write jury jsonl (bypasses only) ----------
const seen = new Set();
const jury = [];
for (const b of bypasses) {
  const g = groupOf(b.technique);
  const dk = (b._note.match(/^(\w+)/) || [])[1] || '';
  const magB = (b._note.match(/10\^(\d+)/) || [,''])[1];
  const sig = [g, dk, b.level_final, b.intent.kind, b.context.chainId, magB, b.technique].join('|');
  if (seen.has(sig)) continue;   // keep one representative per (group,danger,level,intent,chain,magnitude,fineTech)
  seen.add(sig);
  jury.push({
    id: b.id, technique: g, technique_detail: b.technique, note: b._note,
    label: b.label, expected_severity: b.expected_severity,
    level_final: b.level_final, level_sans_intention: b.level_sans_intention,
    bypass: true, reasons: b.reasons,
    request: b.request, context: b.context, intent: b.intent,
  });
}
writeFileSync(join(HERE, 'jury_fuzz_encoding.jsonl'), jury.map(j => JSON.stringify(j)).join('\n') + '\n');

// ---------- jury md (3 lines per winning technique) ----------
const DESC = {
  encodage_approve_fini_dans_lot_cecite_totale: ['approve(attaquant, montant GRAND mais FINI) ~10^7..10^30 enfoui dans un lot Multicall3/forwarder/padding, intention declaree « me connecter / echanger / recevoir ».', 'level_final = ok (aucune raison) : cecite totale, aucune alerte.', 'La regle de lot ne se declenche que sur un droit ILLIMITE (MAXU) ; un montant fini enorme (ex. 1 000 000 USDC) passe sous le radar, alors que le meme approve envoye en direct est critical.'],
  encodage_lot_rabaisse_critical_en_warn: ['approve quasi-illimite (MAXU-1, 2^255, 2^200, uint96max) ou transfer de drain, enfoui dans un lot.', 'level_final = warn au lieu de critical.', 'Dans un lot, le droit etranger plafonne a warn (batch_foreign_unlimited_approval) ; le chemin direct, lui, dit critical. Le decodage recursif perd un cran de severite.'],
  multicall3_imbrique_1_4_niveaux: ['Multicall3 aggregate/aggregate3/aggregate3Value/tryAggregate imbrique 1 a 4 niveaux, approve/transferFrom/setApprovalForAll au milieu.', 'level_final = warn (unknown_selector + opaque + batch_foreign_unlimited_approval), jamais critical.', 'Le moteur decode partiellement, voit un droit etranger mais ne monte pas a critical dans un contexte de lot ; l imbrication ajoute des selecteurs « hors registre ».'],
  calldata_padding_sous_appel_de_lot: ['Sous-appel d un lot Multicall3 avec octets en trop (junk/zeros/mot ff) apres les arguments valides.', 'level_final = warn ou ok.', 'Le padding casse le decodage strict du sous-appel (opaque), ce qui empeche la montee a critical ; combine a un approve fini, cecite totale.'],
  routeur_multicall_bytes: ['multicall(bytes[]) / multicall(bytes32,bytes[]) d un routeur connu, sous-appel dangereux parmi des leurres.', 'level_final = warn (surtout transfer/transferFrom de drain).', 'La forme sans deadline (bytes[]) et la forme bytes32 sont moins bien decodees que multicall(uint256,bytes[]) ; le drain par transfer n est pas traite comme un approve.'],
  universal_router_execute_inputs: ['Universal Router execute(commands,inputs) et execute(commands,inputs,deadline), charge dangereuse dans un input.', 'level_final = warn (decode_error UR + opaque).', 'Le decodeur UR echoue sur des inputs forges (lecture hors limites) et retombe en opaque au lieu de critical.'],
  wallet_sendCalls_2_20_appels: ['wallet_sendCalls (EIP-5792) de 2 a 20 appels, drain/transferFrom au milieu.', 'level_final = warn (l approve enfoui, lui, est bien attrape en critical).', 'Le drain par transfer vers un tiers n est pas traite comme un transfert sortant non desire au niveau critical dans un lot.'],
  selecteurs_de_proxy: ['upgradeToAndCall / delegate / fallback / execute(address,bytes) d un proxy enveloppant un approve.', 'level_final = warn (unknown_selector + embedded_calls heuristique + opaque).', 'Le moteur detecte « approve » par heuristique sans le decoder strictement, donc reste a warn.'],
  contrat_forwarder_multi_hop: ['execute(address,uint256,bytes) / forward / relay, 1 a 3 sauts, inner = approve/transfer.', 'level_final = warn ou ok.', 'Le forwarder masque la cible reelle ; au-dela d un saut le moteur perd le fil et ne monte pas a critical (ok si approve fini).'],
};
let md = `# jury_fuzz_encoding — contournements de Hold up par l'encodage et les lots\n\n`;
md += `Agent : **fuzz_encoding**. Surface : encodage & lots. Tout synthetique (Avalanche 43114 / Fuji 43113). Outil unique : check.mjs (boite noire).\n\n`;
md += `**Teste : ${CASES.length} attaques. Contournements : ${bypasses.length}.** Un malveillant contourne si level_final != critical ; un benin contourne si level_final == critical.\n\n`;
md += `Verdict transversal : **dans un lot/encodage indirect, un droit ou un transfert etranger ne depasse jamais \`warn\`** ; pire, un \`approve\` au montant **fini mais enorme** (sous ~2^128) ne declenche **aucune** alerte (\`ok\`), alors que le meme appel en direct est \`critical\`. Le chemin de decodage recursif applique une regle strictement plus faible que le chemin direct.\n\n`;
const gSorted = Object.entries(groups).filter(([, s]) => s.pass > 0).sort((a, b) => (b[1].pass / b[1].n) - (a[1].pass / a[1].n));
for (const [g, s] of gSorted) {
  const d = DESC[g] || ['(voir cas)', `level_final majoritaire`, '(cause externe non detaillee)'];
  md += `## ${g} — ${s.pass}/${s.n} (${(100 * s.pass / s.n).toFixed(0)}%)  [ok=${s.okBlind}, warn=${s.warn}]  ex: \`${s.ex}\`\n`;
  md += `- Attaque : ${d[0]}\n- Verdict obtenu : ${d[1]}\n- Raison probable (vue de l'exterieur) : ${d[2]}\n\n`;
}
md += `## Surfaces ou la barriere TIENT (0 contournement, a son credit)\n`;
for (const [g, s] of Object.entries(groups).filter(([, x]) => x.pass === 0)) md += `- \`${g}\` : 0/${s.n} — appel direct padde, delegatecall declare (Safe/MultiSend op=1), value+calldata vide, et les lots legitimes bornes (aucun faux positif) sont correctement classes.\n`;
writeFileSync(join(HERE, 'jury_fuzz_encoding.md'), md);

// ---------- append registry lines (one per winning group) ----------
let reg = readFileSync(join(HERE, 'BYPASS_REGISTRY.md'), 'utf8').replace(/\s*$/, '') + '\n';
for (const [g, s] of gSorted) reg += `| fuzz_encoding | ${g} | ${s.pass}/${s.n} | ${s.ex} |\n`;
writeFileSync(join(HERE, 'BYPASS_REGISTRY.md'), reg);

console.log(`\nwrote jury_fuzz_encoding.jsonl (${jury.length} dedup), jury_fuzz_encoding.md, appended ${gSorted.length} registry lines`);
console.log(`\nTOP groups:`); for (const [g, s] of gSorted.slice(0, 6)) console.log(`  ${s.pass}/${s.n}\t${g}`);
