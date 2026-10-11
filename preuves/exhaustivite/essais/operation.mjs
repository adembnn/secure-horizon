// Une phrase, plusieurs demandes : la phrase écrite couvre les demandes suivantes du même onglet pendant 90 s (gatekeeper.js, OP).
// Essai : la personne écrit « échanger 50 USDC contre AVAX », la 1re demande est conforme (approve 50 USDC). Que dit la fenêtre pour la 2e
// demande, envoyée par le site sans nouvelle question ?   Sortie : sorties/operation.txt.   Usage : node operation.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BENCH, EXT, MOTEURS, tx, call, u, CTX, ME, OTHER, ROUTER, USDC, USDT, WAVAX, NFT, CHAIN, FR } from './harnais.mjs';
const imp = (p) => import(pathToFileURL(p).href);
const { makeChrome, fakeClock } = await imp(join(BENCH, 'extension', 'tests', 'unit', 'fake_chrome.mjs'));
const { createGatekeeper } = await imp(join(EXT, 'gatekeeper.js'));
const SOON = 1760001200n, AVAX = (n) => u(n, 18);
const approve = (token, spender, amount) => tx(token, call('approve(address spender,uint256 amount)', [spender, amount]));
const suites = [
  ['O1', 'swap conforme de 50 USDC', tx(ROUTER, call('swapExactTokensForAVAX(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)', [u(50), AVAX(1.8), [USDC, WAVAX], ME, SOON]))],
  ['O2', 'transfer de 50 USDC vers un tiers (pas un échange)', tx(USDC, call('transfer(address to,uint256 amount)', [OTHER, u(50)]))],
  ['O3', 'swap de 5 000 USDC', tx(ROUTER, call('swapExactTokensForAVAX(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)', [u(5000), AVAX(180), [USDC, WAVAX], ME, SOON]))],
  ['O4', 'setApprovalForAll sur une collection de NFT', tx(NFT, call('setApprovalForAll(address operator,bool approved)', [OTHER, true]))],
  ['O5', 'envoi de 2 AVAX (monnaie du réseau) vers un tiers', tx(OTHER, '0x', AVAX(2))],
  ['O6', 'second approve de 50 USDC pour une autre adresse', approve(USDC, OTHER, u(50))],
  ['O7', 'approve de 50 USDT', approve(USDT, ROUTER, u(50))]
];
const lines = ['phrase : « échanger 50 USDC contre AVAX »   1re demande : approve 50 USDC (conforme, continuée)   moteur : serveur'];
for (const [id, label, second] of suites) {
  const clock = fakeClock(); const F = makeChrome(); globalThis.chrome = F.chrome;
  try {
    await F.chrome.storage.local.set({ contexte: CTX });
    createGatekeeper({ check: async (body) => MOTEURS.serveur(body, (await F.chrome.storage.local.get('contexte')).contexte) });
    const page = F.page(321, 'https://app.exemple.org');
    const win = (rid) => { const w = [...F.state.windows].find(([, o]) => o.url.endsWith('#' + rid)); return F.win(w ? w[0] : 100, rid); };
    const r1 = 'rid-op-' + id + '-00001', r2 = 'rid-op-' + id + '-00002';
    await F.send({ type: 'gate', rid: r1, payload: Object.assign({ kind: 'gate', chainId: CHAIN, from: ME }, approve(USDC, ROUTER, u(50))) }, page);
    let v = (await F.send({ type: 'hu.view', rid: r1 }, win(r1))).view;
    clock.advance(1000);
    let a = await F.send({ type: 'hu.decision', rid: r1, seq: v.seq, decision: 'answer', text: 'échanger 50 USDC contre AVAX' }, win(r1));
    clock.advance(1500);
    const c = await F.send({ type: 'hu.decision', rid: r1, seq: a.view.seq, decision: 'continue', phraseOk: true }, win(r1));
    clock.advance(8000); // le temps de confirmer dans le portefeuille
    await F.send({ type: 'gate', rid: r2, payload: Object.assign({ kind: 'gate', chainId: CHAIN, from: ME }, second) }, page);
    v = (await F.send({ type: 'hu.view', rid: r2 }, win(r2))).view;
    const s = v.screen || {};
    lines.push(id + ' 1re : ' + FR[a.view.screen.outcome] + ' (' + c.status + ')  |  2e = ' + label + '  ->  ' + (v.stage === 'intent' ? 'QUESTION POSÉE DE NOUVEAU' : FR[s.outcome] + ' | « ' + s.line + ' »' + (s.autoMs ? ' | passe seul après 1 s, sans question' : ' | attente ' + (v.friction ? v.friction.waitMs / 1000 : '?') + ' s')));
  } catch (e) { lines.push(id + ' exception : ' + String(e && e.message || e)); } finally { clock.restore(); delete globalThis.chrome; }
}
const here = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(here, 'sorties'), { recursive: true });
writeFileSync(join(here, 'sorties', 'operation.txt'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
