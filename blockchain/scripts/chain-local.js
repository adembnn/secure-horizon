/**
 * Local EVM node for rehearsals: `npm run chain:local`
 *
 *   HOLDUP_CHAIN_MODE=fork   local FORK of Avalanche C-Chain (chainId 43114). Real public
 *                            contracts (USDC, routers...) exist locally with real code/state.
 *                            Only READS the public RPC; nothing is ever sent to the real chain.
 *   HOLDUP_CHAIN_MODE=plain  empty offline chain (chainId 31337, override with HOLDUP_CHAIN_ID).
 *   (unset)                  tries fork, falls back to plain if the public RPC is unreachable.
 *
 * Optional: HOLDUP_FORK_URL, HOLDUP_FORK_BLOCK (pin a recent block), HOLDUP_PORT (default 8545).
 * The node listens on 127.0.0.1 only.
 */
const { spawn } = require("child_process");

const DEFAULT_RPC = "https://api.avax.network/ext/bc/C/rpc";

async function probe(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 10000);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
      signal: ctl.signal,
    });
    const j = await r.json();
    return j && j.result ? parseInt(j.result, 16) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  let mode = (process.env.HOLDUP_CHAIN_MODE || "").toLowerCase();
  const url = process.env.HOLDUP_FORK_URL || DEFAULT_RPC;
  const port = process.env.HOLDUP_PORT || "8545";

  if (mode !== "plain") {
    const head = await probe(url);
    if (head) {
      mode = "fork";
      console.log(`[chain:local] public RPC reachable, head block ${head}`);
    } else if (mode === "fork") {
      console.error(`[chain:local] fork requested but ${url} is unreachable. Use HOLDUP_CHAIN_MODE=plain for offline.`);
      process.exit(1);
    } else {
      console.log("[chain:local] public RPC unreachable -> falling back to plain offline chain.");
      mode = "plain";
    }
  }

  const env = { ...process.env, HOLDUP_CHAIN_MODE: mode };
  const chainId = mode === "fork" ? env.HOLDUP_CHAIN_ID || "43114" : env.HOLDUP_CHAIN_ID || "31337";
  console.log(
    `[chain:local] mode=${mode} chainId=${chainId} rpc=http://127.0.0.1:${port}` +
      (mode === "fork" ? ` fork_block=${env.HOLDUP_FORK_BLOCK || "latest"}` : "")
  );
  console.log("[chain:local] Hardhat default accounts are PUBLIC: never put real funds on them, never use them on Fuji/mainnet.");

  const cli = require.resolve("hardhat/internal/cli/bootstrap");
  const child = spawn(process.execPath, [cli, "node", "--hostname", "127.0.0.1", "--port", port], {
    env,
    stdio: "inherit",
  });
  const stop = () => child.kill();
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  child.on("exit", (code) => process.exit(code ?? 0));
}

main();
