// Shared helpers for the demo chain scripts (drain.mjs, reset.mjs) and the Hardhat tests.
// SAFETY: every script that sends a transaction goes through assertSafeRpc(): only
// 127.0.0.1 (local Hardhat node, plain or Avalanche fork) or the public Fuji RPC are allowed.
// ethers / dotenv are taken from blockchain/node_modules (no new dependency).
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const chainDir = here;
export const repoRoot = path.resolve(here, "..", "..", "..");
export const blockchainDir = path.join(repoRoot, "blockchain");
const req = createRequire(path.join(blockchainDir, "package.json"));
export const ethers = req("ethers");

export const USDC_DECIMALS = 6;
export const VICTIM_AMOUNT = 2480n * 10n ** 6n; // 2 480 DemoUSDC
export const DEAD = "0x000000000000000000000000000000000000dEaD";
// Native USDC on Avalanche C-Chain (real code, used only inside the local fork).
export const REAL_USDC = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";
export const FUJI_CHAIN_ID = 43113;
export const FUJI_EXPLORER = "https://testnet.snowtrace.io";
export const FUJI_FAUCET = "https://build.avax.network/console/primary-network/faucet";
const FUJI_HOSTS = new Set(["api.avax-test.network"]);

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function nonces(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function transfer(address,uint256) returns (bool)",
  "function mint(address,uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];
export const DRAINER_ABI = [
  "function collector() view returns (address)",
  "function drainWithPermit(address token,address victim,uint256 amount,uint256 deadline,uint8 v,bytes32 r,bytes32 s)",
  "event DrainedERC20(address indexed victim, address indexed token, uint256 amount)",
];

export function loadEnv() {
  const dotenv = req("dotenv");
  dotenv.config({ path: path.join(repoRoot, ".env") });
  dotenv.config({ path: path.join(blockchainDir, ".env") });
}

/** Valid 32-byte hex key from FUJI_PRIVATE_KEY (first) or PRIVATE_KEY, else null. Never printed. */
export function fujiKey() {
  loadEnv();
  for (const raw of [process.env.FUJI_PRIVATE_KEY, process.env.PRIVATE_KEY]) {
    const k = (raw || "").trim();
    if (/^(0x)?[0-9a-fA-F]{64}$/.test(k)) return k.startsWith("0x") ? k : "0x" + k;
  }
  return null;
}

// Output directory of the generated files (addresses.<kind>.json, context.local.json).
// Default: this folder. HOLDUP_CHAIN_OUT_DIR redirects them (throwaway nodes, tests) so the
// files of the live rehearsal are never overwritten. Read at call time on purpose.
export function outDir() {
  return process.env.HOLDUP_CHAIN_OUT_DIR ? path.resolve(process.env.HOLDUP_CHAIN_OUT_DIR) : chainDir;
}
export function addressesPath(kind = "local") {
  return path.join(outDir(), `addresses.${kind}.json`);
}
export function contextPath() {
  return path.join(outDir(), "context.local.json");
}
export function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

/** Explicit network choice, never guessed: "--network local" or "--network fuji" (else throws). */
export function parseNetwork(argv) {
  const i = argv.lastIndexOf("--network");
  const v = i >= 0 ? argv[i + 1] : undefined;
  if (v !== "local" && v !== "fuji") {
    throw new Error(`Pass --network local or --network fuji explicitly (got ${v === undefined ? "nothing" : JSON.stringify(v)}). No other network is accepted.`);
  }
  return v;
}
export function readAddresses(kind = "local") {
  const p = addressesPath(kind);
  if (!fs.existsSync(p)) {
    throw new Error(`${path.basename(p)} not found. Run: cd blockchain && npm run ${kind === "fuji" ? "demo:fuji" : "demo:deploy -- --network localhost"}`);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
export function writeAddresses(kind, data) {
  writeJson(addressesPath(kind), data);
}
export function tryReadAddresses(kind = "local") {
  const p = addressesPath(kind);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
}

/** Throws unless the RPC is the local node (127.0.0.1) or the public Fuji RPC. */
export function assertSafeRpc(rpcUrl) {
  let u;
  try {
    u = new URL(rpcUrl);
  } catch {
    throw new Error(`Refused: invalid RPC url`);
  }
  const local = u.hostname === "127.0.0.1" && (u.protocol === "http:" || u.protocol === "https:");
  const fuji = FUJI_HOSTS.has(u.hostname) && u.protocol === "https:";
  if (!local && !fuji) {
    throw new Error(`Refused: RPC host "${u.hostname}" is neither 127.0.0.1 nor Fuji. This tool never talks to any other chain.`);
  }
  return { local, fuji };
}

/**
 * Build { provider, addresses, kind, isLocal, isFuji, equivalent } for addresses.<kind>.json after
 * safety checks. Behaviour follows `kind`, not the RPC host: kind "local" = local node (impersonation
 * allowed), kind "fuji" = Fuji rules (deployer key, no impersonation). A fuji file pointing at 127.0.0.1
 * is only accepted when it carries fujiEquivalent:true (written by `demo:fuji --network localhost`,
 * used to rehearse the Fuji code paths on a local node). `equivalent` = that case.
 */
export async function makeContext(kind = "local") {
  if (kind !== "local" && kind !== "fuji") throw new Error(`Refused: unknown network "${kind}" (local or fuji only).`);
  const addresses = readAddresses(kind);
  const { local } = assertSafeRpc(addresses.rpcUrl);
  if (kind === "local" && !local) throw new Error("Refused: addresses.local.json must point at 127.0.0.1.");
  const equivalent = kind === "fuji" && local;
  if (equivalent && addresses.fujiEquivalent !== true) {
    throw new Error("Refused: addresses.fuji.json points at 127.0.0.1 but is not a Fuji-equivalent test file.");
  }
  const provider = new ethers.JsonRpcProvider(addresses.rpcUrl, undefined, { batchMaxCount: 1 });
  const net = await provider.getNetwork().catch(() => {
    throw new Error(`RPC ${addresses.rpcUrl} unreachable. ${local ? "Start the node: cd blockchain && npm run chain:local" : ""}`);
  });
  if (Number(net.chainId) !== Number(addresses.chainId)) {
    throw new Error(`Chain id mismatch: RPC says ${net.chainId}, addresses file says ${addresses.chainId}. Redeploy.`);
  }
  if (kind === "fuji" && !equivalent && Number(net.chainId) !== FUJI_CHAIN_ID) {
    throw new Error(`Refused: chain id ${net.chainId} is not Fuji (${FUJI_CHAIN_ID}).`);
  }
  return { provider, addresses, isLocal: kind === "local", isFuji: kind === "fuji", equivalent, kind };
}

/** Deployer signer: unlocked account on a local node (or Fuji-equivalent test), FUJI key on Fuji. */
export async function deployerSigner(ctx) {
  if (ctx.isLocal || ctx.equivalent) {
    const accts = (await ctx.provider.send("eth_accounts", [])).map((a) => a.toLowerCase());
    if (!accts.includes(ctx.addresses.deployer.toLowerCase())) {
      throw new Error("Deployer account is not unlocked on this node. Redeploy with npm run demo:deploy.");
    }
    return ctx.provider.getSigner(ctx.addresses.deployer);
  }
  const key = fujiKey();
  if (!key) throw new Error("No FUJI_PRIVATE_KEY in environment: cannot send on Fuji.");
  const w = new ethers.Wallet(key, ctx.provider);
  if (ctx.addresses.deployer && w.address.toLowerCase() !== ctx.addresses.deployer.toLowerCase()) {
    throw new Error(`FUJI_PRIVATE_KEY is ${w.address}, but the contracts were deployed by ${ctx.addresses.deployer}. Use the same key or redeploy with --fresh.`);
  }
  return w;
}

/** Attacker side: unlocked collector account locally; on Fuji the deployer key plays the relayer. */
export async function attackerSigner(ctx) {
  if (ctx.isLocal) {
    const accts = (await ctx.provider.send("eth_accounts", [])).map((a) => a.toLowerCase());
    if (!accts.includes(ctx.addresses.collector.toLowerCase())) {
      throw new Error("Collector account is not unlocked on this node. Redeploy with npm run demo:deploy.");
    }
    return ctx.provider.getSigner(ctx.addresses.collector);
  }
  return deployerSigner(ctx);
}

/** Snowtrace link on Fuji (kind "fuji" or chain 43113), placeholder text on a local chain. */
export function explorerTx(chainId, hash, kind) {
  return kind === "fuji" || Number(chainId) === FUJI_CHAIN_ID ? `${FUJI_EXPLORER}/tx/${hash}` : "(local chain: no explorer)";
}
export function explorerAddress(chainId, address, kind) {
  return kind === "fuji" || Number(chainId) === FUJI_CHAIN_ID ? `${FUJI_EXPLORER}/address/${address}` : "(local chain: no explorer)";
}

export function loadArtifact(name) {
  const p = path.join(blockchainDir, "artifacts", "contracts", "demo", `${name}.sol`, `${name}.json`);
  if (!fs.existsSync(p)) throw new Error(`Artifact ${name} missing. Run: cd blockchain && npm run compile`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

/** Local only: give an address test gas via hardhat_setBalance. */
export async function setLocalBalance(provider, address, avax = 100n) {
  await provider.send("hardhat_setBalance", [address, "0x" + (avax * 10n ** 18n).toString(16)]);
}

/** Local only: run `fn(signer)` as `address` (impersonation, gas funded). */
export async function asImpersonated(provider, address, fn) {
  await setLocalBalance(provider, address, 10n);
  await provider.send("hardhat_impersonateAccount", [address]);
  try {
    return await fn(await provider.getSigner(address));
  } finally {
    await provider.send("hardhat_stopImpersonatingAccount", [address]);
  }
}

/**
 * Fork only: give `holder` an exact balance of the REAL USDC (real code) by writing its balance
 * storage slot on the LOCAL fork (nothing touches the real chain). Probes the common slots.
 * Returns the slot used.
 */
export async function setRealUsdcBalance(provider, holder, amount, token = REAL_USDC) {
  const c = new ethers.Contract(token, ERC20_ABI, provider);
  const coder = ethers.AbiCoder.defaultAbiCoder();
  const value = ethers.zeroPadValue(ethers.toBeHex(amount), 32);
  for (const slot of [9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 51, 52]) {
    const key = ethers.keccak256(coder.encode(["address", "uint256"], [holder, slot]));
    const old = await provider.getStorage(token, key);
    await provider.send("hardhat_setStorageAt", [token, key, value]);
    if ((await c.balanceOf(holder)) === amount) return slot;
    await provider.send("hardhat_setStorageAt", [token, key, ethers.zeroPadValue(old, 32)]);
  }
  throw new Error("Could not locate the balance slot of the real USDC on this fork.");
}
