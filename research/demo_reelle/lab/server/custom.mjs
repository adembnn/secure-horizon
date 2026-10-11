// Hold up Lab - "test anything": a juror gives any wallet request. Same verdict path as the catalogue; the ground truth is executed
// only when the request is a transaction (or a recognised permit) of the lab victim, on the lab chain. Everything is validated first.
import { ethers, ABI, lc, isAddr, hexQ, ethCall, sendAs, sendRaw, signAsVictim } from './chain.mjs';
import { LabError, DOORS, INTENT_KINDS } from './ops.mjs';
import { RAW } from './product.mjs';
import { runScenario } from './run.mjs';
import { finalize } from './scenarios/index.mjs';

export const MAX_REQUEST_BYTES = 64 * 1024;
const METHODS = ['eth_sendTransaction', 'wallet_sendCalls', 'eth_sendRawTransaction', 'eth_signTypedData_v4', 'personal_sign', 'eth_sign'];
const HEX = /^0x([0-9a-fA-F]{2})*$/;
const chainOf = (v) => { try { return v === undefined || v === null || v === '' ? undefined : Number(BigInt(v)); } catch { return NaN; } };
const quantity = (v, what) => { try { const n = BigInt(v === undefined || v === null || v === '' ? 0 : v); if (n < 0n) throw new Error(); return n; } catch { throw new LabError(`Champ « ${what} » illisible : un nombre (0x…) est attendu.`); } };

function checkChain(ctx, v) {
  const n = chainOf(v);
  if (n === undefined) return;
  if (n !== ctx.chainId) throw new LabError(`Demande refusée : elle vise le réseau ${Number.isNaN(n) ? 'illisible' : n}, le lab ne travaille que sur sa propre chaîne (${ctx.chainId}). Rien n'est jamais envoyé ailleurs.`);
}
function cleanCall(ctx, t, what) {
  if (!t || typeof t !== 'object' || Array.isArray(t)) throw new LabError(`${what} : un objet { to, data, value } est attendu.`);
  if (!isAddr(t.to)) throw new LabError(`${what} : « to » doit être une adresse (la création de contrat n'est pas acceptée).`);
  const data = t.data === undefined ? (t.input === undefined ? '0x' : t.input) : t.data;
  if (typeof data !== 'string' || !HEX.test(data)) throw new LabError(`${what} : « data » doit être de l'hexadécimal.`);
  return { to: ethers.getAddress(lc(t.to)), data, value: quantity(t.value, 'value') };
}
function knownGood(ctx) {
  const a = ctx.accounts, c = ctx.c;
  return new Set([a.victim, a.own2, a.exchange, a.contact, c.vault, c.router, c.nft, c.wavax, c.permit2, c.multicall3, ctx.merchant, ethers.ZeroAddress, ...Object.values(ctx.tokens).map((t) => t.address)].filter(Boolean).map(lc));
}
function namedAddresses(request) {
  const s = JSON.stringify(request), out = new Set();
  for (const m of s.matchAll(/0x[0-9a-fA-F]{40}(?![0-9a-fA-F])/g)) out.add(lc(m[0]));
  for (const m of s.matchAll(/0{24}([0-9a-fA-F]{40})/g)) if (!/^0{30}/.test(m[1])) out.add('0x' + lc(m[1]));
  return [...out].slice(0, 24);
}
const res = (who, what, r) => ({ who, what, hash: r.hash, reverted: !!r.reverted, ...(r.error ? { error: r.error } : {}), gas: r.gasUsed !== undefined ? r.gasUsed * r.gasPrice : 0n });

// Worst case for the victim: every address that now holds a right over the victim's assets uses it at once.
async function useEveryRight(ctx, suspects) {
  const { rpc, c, accounts: a } = ctx, out = [];
  for (const s of suspects) {
    for (const t of Object.values(ctx.tokens)) {
      const [allow, bal] = await Promise.all([ethCall(rpc, t.address, ABI.erc20, 'allowance', [a.victim, s]), ethCall(rpc, t.address, ABI.erc20, 'balanceOf', [a.victim])]);
      const take = allow < bal ? allow : bal;
      if (take > 0n) out.push(res('attaquant', `utilise le droit obtenu sur ${t.symbol} (transferFrom)`, await sendAs(rpc, s, { to: t.address, data: ABI.erc20.encodeFunctionData('transferFrom', [a.victim, a.collector, take]) })));
    }
    if (await ethCall(rpc, c.nft, ABI.nft, 'isApprovedForAll', [a.victim, s])) for (const id of ctx.nftIds) out.push(res('attaquant', `prend le NFT n° ${id} (transferFrom)`, await sendAs(rpc, s, { to: c.nft, data: ABI.nft.encodeFunctionData('transferFrom', [a.victim, a.collector, id]) })));
    if (lc(await ethCall(rpc, c.vault, ABI.vault, 'owner')) === s) {
      const bal = await ethCall(rpc, c.usdc, ABI.erc20, 'balanceOf', [c.vault]);
      out.push(res('attaquant', 'devenu propriétaire, vide le coffre (withdraw)', await sendAs(rpc, s, { to: c.vault, data: ABI.vault.encodeFunctionData('withdraw', [c.usdc, a.collector, bal]) })));
    }
  }
  return out;
}

// body = { door, request, intent?, pastedMessage?, context?: { label?, origin?, pageText? } }
export async function runCustom(ctx, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new LabError('Corps attendu : { door, request, intent?, pastedMessage?, context? }.');
  const door = body.door === undefined ? 'site' : String(body.door);
  if (!DOORS.includes(door)) throw new LabError(`Porte inconnue. Choix possibles : ${DOORS.join(', ')}.`);
  const request = body.request;
  if (!request || typeof request !== 'object' || Array.isArray(request)) throw new LabError('« request » : un objet est attendu (la demande telle que le portefeuille la reçoit).');
  if (Buffer.byteLength(JSON.stringify(request)) > MAX_REQUEST_BYTES) throw new LabError('Demande trop volumineuse (64 Ko au plus).', 413);
  const k = body.context && typeof body.context === 'object' && !Array.isArray(body.context) ? body.context : {};
  const label = k.label === undefined || k.label === null || k.label === '' ? undefined : String(k.label);
  if (label !== undefined && label !== 'malveillant' && label !== 'benin') throw new LabError('« context.label » : malveillant ou benin.');
  let origin;
  if (k.origin !== undefined) { try { const u = new URL(String(k.origin).slice(0, 300)); if (!/^https?:$/.test(u.protocol)) throw new Error(); origin = u.origin; } catch { throw new LabError('« context.origin » : une adresse de site http(s) est attendue.'); } }
  let intent;
  if (body.intent !== undefined && body.intent !== null) {
    const it = typeof body.intent === 'string' ? { kind: body.intent } : body.intent;
    if (!it || typeof it !== 'object' || !INTENT_KINDS.includes(it.kind)) throw new LabError(`« intent.kind » : ${INTENT_KINDS.join(', ')}.`);
    intent = { kind: it.kind, ...(typeof it.freeText === 'string' ? { freeText: it.freeText.slice(0, 500) } : {}) };
  }
  if (body.pastedMessage !== undefined && typeof body.pastedMessage !== 'string') throw new LabError('« pastedMessage » : du texte est attendu.');
  if (typeof body.pastedMessage === 'string' && body.pastedMessage.length > 4000) throw new LabError('Message collé trop long (4 000 caractères au plus).', 413);
  const params = body.pastedMessage ? { pastedMessage: body.pastedMessage } : {};
  const V = ctx.accounts.victim;
  const base = { id: 'custom', door, family: 'custom', label, title: 'Demande libre', story: 'Demande saisie par le juré.', staging: { kind: 'site', brand: 'Demande libre', origin, pitch: typeof k.pageText === 'string' ? k.pageText.slice(0, 4000) : '' }, intent: intent || { kind: 'other' } };

  // ---- a withdrawal from a platform: address + amount, checked by the paste path
  if (door === 'exchange') {
    if (!isAddr(request.address)) throw new LabError("Retrait de plateforme : « request.address » doit être l'adresse de destination.");
    const token = request.asset === undefined ? 'dusdc' : String(request.asset).toLowerCase();
    if (token !== 'avax' && !ctx.tokens[token]) throw new LabError(`Actif inconnu. Choix possibles : avax, ${Object.keys(ctx.tokens).join(', ')}.`);
    const sc = finalize({ ...base, staging: { ...base.staging, kind: 'exchange_withdraw' }, label: label || undefined, recipe: { technique: 'transfer', params: { token, amount: String(request.amount ?? '100'), recipient: request.address } }, editable: [] });
    if (!label) { sc.label = knownGood(ctx).has(lc(request.address)) ? 'benin' : 'malveillant'; sc.labelInferred = true; }
    return runScenario(ctx, sc, { params, intent });
  }

  const method = String(request.method || '');
  if (!METHODS.includes(method)) throw new LabError(`Méthode non acceptée par le lab. Méthodes possibles : ${METHODS.join(', ')}.`);
  const P = Array.isArray(request.params) ? request.params : [];
  if (!P.length) throw new LabError('« request.params » : une liste non vide est attendue.');
  let calls = null, raw = null, typed = null, from = V, noTruth = null, clean;

  if (method === 'eth_sendTransaction') {
    const t = P[0];
    checkChain(ctx, t && t.chainId);
    calls = [cleanCall(ctx, t, 'Transaction')];
    if (t.from !== undefined && !isAddr(t.from)) throw new LabError('Transaction : « from » doit être une adresse.');
    if (t.from) from = ethers.getAddress(lc(t.from));
    clean = { method, params: [{ from, to: calls[0].to, data: calls[0].data, value: hexQ(calls[0].value), chainId: hexQ(ctx.chainId) }] };
  } else if (method === 'wallet_sendCalls') {
    const b = P[0];
    if (!b || typeof b !== 'object' || !Array.isArray(b.calls) || !b.calls.length || b.calls.length > 16) throw new LabError('Lot : entre 1 et 16 appels attendus dans « calls ».');
    checkChain(ctx, b.chainId);
    if (b.from !== undefined && !isAddr(b.from)) throw new LabError('Lot : « from » doit être une adresse.');
    if (b.from) from = ethers.getAddress(lc(b.from));
    calls = b.calls.map((x, i) => { checkChain(ctx, x && x.chainId); return cleanCall(ctx, x, `Appel n° ${i + 1} du lot`); });
    clean = { method, params: [{ version: '1.0', from, chainId: hexQ(ctx.chainId), calls: calls.map((x) => ({ to: x.to, data: x.data, value: hexQ(x.value) })) }] };
  } else if (method === 'eth_sendRawTransaction') {
    let tx;
    try { tx = RAW.parseSignedTx(P[0]); } catch (e) { throw new LabError(`Transaction signée illisible (${String(e.code || 'format')}).`); }
    checkChain(ctx, tx.chainId);
    if (!tx.to) throw new LabError("Transaction signée : la création de contrat n'est pas acceptée.");
    raw = P[0]; from = ethers.getAddress(tx.from);
    clean = { method, params: [raw] };
  } else if (method === 'eth_signTypedData_v4') {
    let td = P[1] !== undefined && !isAddr(P[1]) ? P[1] : P[0];
    if (typeof td === 'string') { try { td = JSON.parse(td); } catch { throw new LabError('Message typé : JSON illisible.'); } }
    if (!td || typeof td !== 'object' || !td.types || !td.primaryType || !td.message) throw new LabError('Message typé : { types, primaryType, domain, message } attendu.');
    checkChain(ctx, td.domain && td.domain.chainId);
    const signer = [P[0], P[1]].find(isAddr);
    if (signer) from = ethers.getAddress(lc(signer));
    typed = td;
    clean = { method, params: [from, JSON.stringify(td)] };
  } else { // personal_sign, eth_sign
    if (P.some((x) => typeof x !== 'string')) throw new LabError('Signature de message : des chaînes de caractères sont attendues.');
    const signer = P.find(isAddr);
    if (signer) from = ethers.getAddress(lc(signer));
    clean = { method, params: P.slice(0, 3) };
    noTruth = "Signature de message : sans transaction qui l'utilise, il n'y a rien à exécuter sur la chaîne.";
  }
  const isVictim = lc(from) === lc(V);
  const isSig = !calls && !raw;
  if (door === 'wallet' && isSig) throw new LabError("L'écran « Envoyer » d'un portefeuille n'émet pas de signature de message : choisis la porte site ou walletconnect.");
  if ((door === 'wallet' || door === 'walletconnect') && calls && calls.length > 1) throw new LabError('Par cette porte, le portefeuille envoie une seule opération signée à la fois : pas de lot.');
  if ((calls || raw) && !isVictim) noTruth = "La transaction ne vient pas de la victime du lab : le lab ne l'exécute pas (il ne signe que pour son propre compte de test).";

  const good = knownGood(ctx);
  const suspects = label === 'benin' ? [] : namedAddresses(clean).filter((x) => !good.has(x));
  const compileWith = async () => {
    let path = 'extension', covered = true, coverageNote, reqOut = clean, rawOut = raw;
    if (door === 'wallet' || door === 'walletconnect') {
      if (isSig) { path = 'none'; covered = false; coverageNote = "Par WalletConnect, une signature hors chaîne passe par le relais WalletConnect, pas par le RPC du portefeuille : le RPC protecteur ne la voit jamais."; }
      else {
        if (!rawOut && !isVictim) throw new LabError("Par cette porte il faut une transaction signée (eth_sendRawTransaction), ou une transaction de la victime du lab que le lab signera.");
        if (!rawOut) rawOut = await signAsVictim(ctx, calls[0]);
        path = 'rpc'; reqOut = { method: 'eth_sendRawTransaction', params: [rawOut] };
      }
    }
    let permit = null;
    if (typed && isVictim && typed.primaryType === 'Permit' && typed.domain && isAddr(typed.domain.verifyingContract) && typed.message && isAddr(typed.message.spender) && lc(typed.message.owner || '') === lc(V)) {
      const token = Object.values(ctx.tokens).find((t) => lc(t.address) === lc(typed.domain.verifyingContract) && t.permitName);
      if (token) permit = { token, spender: ethers.getAddress(lc(typed.message.spender)) };
    }
    if (typed && !permit && !noTruth) noTruth = "Signature arbitraire : le lab ne sait l'exécuter que si c'est un « permit » de la victime sur un jeton du lab.";
    const victimSteps = async (env) => {
      if (noTruth) return [];
      if (permit) {
        const types = { ...typed.types }; delete types.EIP712Domain;
        try { env.signature = await ctx.victimWallet.signTypedData(typed.domain, types, typed.message); } catch { throw new LabError('Message typé incohérent : impossible de le signer.'); }
        return [{ who: 'victime', what: 'signe le message (rien ne part sur la chaîne à cet instant)', hash: null, reverted: false, gas: 0n }];
      }
      if (rawOut) return [res('victime', 'envoie la transaction signée', await sendRaw(ctx.rpc, rawOut))];
      const out = [];
      for (const x of calls) out.push(res('victime', calls.length > 1 ? 'envoie une opération du lot' : 'envoie la transaction', await sendRaw(ctx.rpc, await signAsVictim(ctx, x))));
      return out;
    };
    const exploit = noTruth || label === 'benin' ? null : async (env) => {
      const out = [];
      if (permit) {
        const s = ethers.Signature.from(env.signature), m = typed.message;
        out.push(res('attaquant', 'présente la signature au jeton (permit)', await sendAs(ctx.rpc, permit.spender, { to: permit.token.address, data: ABI.erc20.encodeFunctionData('permit', [V, permit.spender, m.value, m.deadline, s.v, s.r, s.s]) })));
      }
      out.push(...(await useEveryRight(ctx, suspects)));
      return out;
    };
    return { request: reqOut, path, covered, coverageNote, checked: null, raw: rawOut, setupTxs: [], victimSteps, exploit, attackers: suspects, watch: namedAddresses(clean), signatureOnly: isSig && !permit, mode: 'custom', resolved: { from }, noTruth, labelGiven: !!label };
  };
  return runScenario(ctx, base, { params, intent, compileWith, from });
}
