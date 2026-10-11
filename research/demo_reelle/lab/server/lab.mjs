// Hold up Lab - server. One command: node research/demo_reelle/lab/server/lab.mjs
//   - starts the lab's own local chain on 127.0.0.1:8560 (fork of the Avalanche C-Chain, plain chain when offline),
//   - deploys the demo contracts and funds the lab victim (a public Hardhat test account),
//   - plugs the product's protective RPC on that chain (127.0.0.1:8561) for the "wallet" door,
//   - serves the API on 127.0.0.1:8800 (JSON; CORS for http://localhost:8801 and http://127.0.0.1:8801 only).
// Env: LAB_PORT (8800), LAB_CHAIN_PORT (8560), LAB_GUARD_PORT (8561), LAB_CHAIN_MODE (fork | plain, default: fork then plain),
//      LAB_LIVE (1; 0 = the second column gets no fact read on the chain), LAB_CLASSIFIER (keyword), LAB_JURY_FILE.
// Nothing is ever sent to a public chain; the API only listens on the loopback interface.
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureNode, setupLab, resetLab } from './chain.mjs';
import { BANC, DETECTOR_IDS, hasGuard, startGuard, stopGuard, refreshGuardContext, localContext } from './product.mjs';
import { CATALOGUE, byId, publicScenario, available } from './scenarios/index.mjs';
import { runScenario, summarize, exclusive, OUTCOME_RULE, LabError } from './run.mjs';
import { runCustom } from './custom.mjs';
import { options, buildAttack, rebuild, publicBuilt, saveAttack, readLog, recordOutcome, runSaved, sweep } from './attack.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const MAX_BODY = 128 * 1024;
const num = (v, d) => (v === undefined || v === '' || !Number.isFinite(Number(v)) ? d : Number(v));

function engineVersion() {
  try { return JSON.parse(readFileSync(join(BANC, 'engine', 'package.json'), 'utf8')).version || null; } catch { return null; }
}

export async function createLab(o = {}) {
  const port = o.port ?? num(process.env.LAB_PORT, 8800);
  const chainPort = o.chainPort ?? num(process.env.LAB_CHAIN_PORT, 8560);
  const guardPort = o.guardPort ?? num(process.env.LAB_GUARD_PORT, 8561);
  const mode = o.mode ?? (process.env.LAB_CHAIN_MODE || undefined);
  const uiOrigins = new Set(o.origins || ['http://localhost:8801', 'http://127.0.0.1:8801']);

  const node = await ensureNode({ port: chainPort, mode });
  const ctx = await setupLab(node.url);
  const guard = await startGuard(ctx, guardPort);

  async function health() {
    const block = Number(BigInt(await ctx.rpc('eth_blockNumber')));
    return {
      status: 'up',
      chain: { mode: ctx.mode, chainId: ctx.chainId, rpcUrl: ctx.url, block, forkBlock: ctx.forkBlock, note: ctx.mode === 'fork' ? "Copie locale d'Avalanche C-Chain : l'état public est seulement lu, rien n'est envoyé sur la vraie chaîne." : 'Chaîne locale vide (hors ligne).' },
      victim: { address: ctx.accounts.victim, note: 'Compte de test public de Hardhat, local uniquement : sa clé est publique, ne jamais y mettre de vrais fonds.' },
      contracts: { ...ctx.c, tokens: Object.fromEntries(Object.entries(ctx.tokens).map(([k, t]) => [k, { address: t.address, symbol: t.symbol, decimals: t.decimals }])) },
      accounts: { ...ctx.accounts, lookalikeOfContact: ctx.lookalikes.contact, lookalikeOfRouter: ctx.lookalikes.router, neverSeen: ctx.neverSeen, safeVault: ctx.safeVault, merchant: ctx.merchant },
      whatHoldUpKnows: localContext(ctx),
      product: { engineVersion: engineVersion(), detectors: DETECTOR_IDS.length, detectorIds: DETECTOR_IDS, guard: hasGuard() ? { url: guard.url, real: true } : { real: false, note: 'rpc_garde/proxy.mjs absent : porte « wallet » simulée par le même pipeline sur la transaction décodée' }, classifier: process.env.HOLDUP_CLASSIFIER, liveFacts: process.env.LAB_LIVE !== '0' },
      outcomeRule: OUTCOME_RULE,
      scenarios: { n: CATALOGUE.length, available: CATALOGUE.filter((s) => available(ctx, s).available).length },
    };
  }

  async function runAll(body) {
    const door = body.door === undefined || body.door === null || body.door === '' ? null : String(body.door);
    const family = body.family === undefined || body.family === null || body.family === '' ? null : String(body.family);
    const results = [], skipped = [];
    for (const sc of CATALOGUE) {
      if ((door && sc.door !== door) || (family && sc.family !== family)) continue;
      const av = available(ctx, sc);
      if (!av.available) { skipped.push({ id: sc.id, why: av.why }); continue; }
      try { const { request, checked, ...rest } = await runScenario(ctx, sc); results.push(rest); }
      catch (e) { results.push({ id: sc.id, door: sc.door, family: sc.family, label: sc.label, error: true, message: e.message }); }
    }
    const out = { results, summary: summarize(results), skipped };
    if (body.jury !== false && !door && !family) out.jury = await runSaved(ctx);
    return out;
  }

  const routes = {
    'GET /api/health': () => health(),
    'GET /api/scenarios': () => CATALOGUE.map((s) => publicScenario(ctx, s)),
    'GET /api/attack/options': () => options(ctx),
    'GET /api/attack/log': () => readLog(),
    'POST /api/run': async (b) => {
      const opts = { params: b.params && typeof b.params === 'object' && !Array.isArray(b.params) ? b.params : {}, intent: b.intent && typeof b.intent === 'object' ? { ...(typeof b.intent.kind === 'string' ? { kind: b.intent.kind } : {}), ...(typeof b.intent.freeText === 'string' ? { freeText: b.intent.freeText.slice(0, 500) } : {}) } : undefined };
      if (typeof opts.params.pastedMessage === 'string' && opts.params.pastedMessage.length > 4000) throw new LabError('Message collé trop long (4 000 caractères au plus).', 413);
      let sc;
      if (b.scenario !== undefined) sc = await rebuild(ctx, b.scenario);
      else {
        sc = byId(String(b.id || ''));
        if (!sc) { const saved = readLog().find((a) => a.id === b.id); if (saved) sc = await rebuild(ctx, saved.scenario); }
        if (!sc) throw new LabError('Scénario inconnu : donne « id » (voir /api/scenarios) ou « scenario » (voir /api/attack/build).', 404);
      }
      const av = available(ctx, sc);
      if (!av.available) throw new LabError(`Scénario indisponible sur cette chaîne : ${av.why}`, 409);
      const r = await runScenario(ctx, sc, opts);
      if (sc.built) recordOutcome(r);
      return r;
    },
    'POST /api/run-all': (b) => runAll(b),
    'POST /api/custom': (b) => runCustom(ctx, b),
    'POST /api/reset': () => exclusive(async () => { const drainer = await resetLab(ctx); refreshGuardContext(ctx); return { reset: true, drainer, block: Number(BigInt(await ctx.rpc('eth_blockNumber'))) }; }),
    'POST /api/attack/build': async (b) => publicBuilt(ctx, await buildAttack(ctx, b)),
    'POST /api/attack/save': (b) => saveAttack(ctx, b),
    'POST /api/attack/sweep': (b) => sweep(ctx, { door: typeof b.door === 'string' && b.door ? b.door : undefined, max: b.max === 1 ? 1 : 2 }),
  };

  const big = (k, v) => (typeof v === 'bigint' ? v.toString() : v);
  const srv = http.createServer((req, res) => {
    const origin = req.headers.origin;
    const cors = origin && uiOrigins.has(origin) ? { 'access-control-allow-origin': origin, vary: 'Origin', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '600' } : {};
    const reply = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...cors }); res.end(JSON.stringify(obj, big)); };
    const fail = (code, message) => reply(code, { error: true, message });
    const ra = req.socket.remoteAddress;
    if (ra !== '127.0.0.1' && ra !== '::ffff:127.0.0.1' && ra !== '::1') return fail(403, 'Adresse refusée : le lab ne répond que sur cette machine.');
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host || '')) return fail(403, 'Hôte refusé.');
    if (origin !== undefined && !uiOrigins.has(origin)) return fail(403, "Origine refusée : seule l'interface du lab (port 8801) peut appeler cette API depuis un navigateur.");
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
    const key = `${req.method} ${(req.url || '').split('?')[0].replace(/\/+$/, '')}`;
    const handler = routes[key];
    if (!handler) return fail(404, 'Route inconnue.');
    const chunks = []; let size = 0, tooBig = false;
    req.on('data', (c) => { if (tooBig) return; size += c.length; if (size > MAX_BODY) { tooBig = true; chunks.length = 0; fail(413, 'Requête trop volumineuse (128 Ko au plus).'); req.resume(); return; } chunks.push(c); });
    req.on('error', () => {});
    req.on('end', async () => {
      if (tooBig) return;
      let body = {};
      if (req.method === 'POST') {
        const text = Buffer.concat(chunks).toString('utf8').trim();
        if (text) { try { body = JSON.parse(text); } catch { return fail(400, 'JSON illisible.'); } }
        if (!body || typeof body !== 'object' || Array.isArray(body)) return fail(400, 'Un objet JSON est attendu.');
      }
      try { reply(200, await handler(body)); }
      catch (e) {
        if (e instanceof LabError) return fail(e.status || 400, e.message);
        console.error('[lab] ' + key + ' : ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e));
        fail(500, 'Erreur interne du lab : ' + String((e && e.message) || e).slice(0, 200));
      }
    });
  });
  srv.headersTimeout = 15000; srv.requestTimeout = 0; srv.keepAliveTimeout = 5000;
  await new Promise((ok, ko) => { srv.once('error', ko); srv.listen(port, '127.0.0.1', ok); });
  const url = `http://127.0.0.1:${srv.address().port}`;
  const close = async ({ stopNode = true } = {}) => {
    await new Promise((r) => { srv.closeAllConnections?.(); srv.close(r); });
    await stopGuard();
    if (stopNode) await node.stop();
  };
  return { ctx, srv, url, port: srv.address().port, node, guard, health, runAll, close };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log('Hold up Lab : démarrage de la chaîne locale et déploiement des contrats de démo…');
    const lab = await createLab();
    const h = await lab.health();
    console.log(`Hold up Lab prêt : ${lab.url}  (PID ${process.pid})`);
    console.log(`Chaîne du lab : ${h.chain.rpcUrl}  mode ${h.chain.mode}  chainId ${h.chain.chainId}  bloc ${h.chain.block}${lab.node.reused ? '  (nœud déjà lancé, réutilisé)' : ''}`);
    console.log(`Victime (compte de test public) : ${h.victim.address}   Scénarios : ${h.scenarios.available}/${h.scenarios.n}   Détecteurs : ${h.product.detectors}   RPC protecteur : ${h.product.guard.real ? h.product.guard.url : 'simulé'}`);
    console.log('Ctrl+C pour arrêter (la chaîne du lab est arrêtée aussi).');
    let stopping = false;
    const stop = async () => { if (stopping) return; stopping = true; try { await lab.close(); } finally { process.exit(0); } };
    process.on('SIGINT', stop); process.on('SIGTERM', stop);
  } catch (e) {
    console.error(e && e.code === 'EADDRINUSE' ? 'Port déjà utilisé : un autre Hold up Lab tourne peut-être déjà (ports 8800, 8561).' : 'Échec du démarrage : ' + ((e && e.message) || e));
    process.exit(1);
  }
}
