// Replay the rehearsal in ~10 s: node reset.mjs [--fuji]
// - victim balance set back to exactly 2 480 DemoUSDC
// - victim's allowance to the previous drainer contract revoked (local node only)
// - previous drainer's token balance returned to a burn address (local node only)
// - a fresh FreshDrainer contract is redeployed (new address) and the addresses file updated
// Only ever talks to 127.0.0.1 or the public Fuji RPC (same guard as drain.mjs).
import {
  ethers,
  ERC20_ABI,
  VICTIM_AMOUNT,
  DEAD,
  makeContext,
  attackerSigner,
  fujiKey,
  loadArtifact,
  writeAddresses,
  setLocalBalance,
  asImpersonated,
  setRealUsdcBalance,
  REAL_USDC,
} from "./lib.mjs";

const fuji = process.argv.includes("--fuji");
const t0 = Date.now();
const log = (m) => console.log(m);

async function main() {
  const ctx = await makeContext(fuji ? "fuji" : "local");
  const { provider, addresses, isLocal } = ctx;

  let sender;
  if (isLocal) sender = await provider.getSigner(addresses.deployer);
  else {
    if (!fujiKey()) throw new Error("No FUJI_PRIVATE_KEY in environment: cannot reset on Fuji.");
    sender = await attackerSigner(ctx);
  }

  const usdc = new ethers.Contract(addresses.usdc, ERC20_ABI, sender);
  const victim = addresses.victim;

  if (isLocal) await setLocalBalance(provider, victim, 100n);

  const bal = await usdc.balanceOf(victim);
  if (bal < VICTIM_AMOUNT) {
    await (await usdc.mint(victim, VICTIM_AMOUNT - bal)).wait();
    log(`victim: minted ${ethers.formatUnits(VICTIM_AMOUNT - bal, 6)} DUSDC`);
  } else if (bal > VICTIM_AMOUNT && isLocal) {
    await asImpersonated(provider, victim, async (s) => {
      await (await usdc.connect(s).transfer(DEAD, bal - VICTIM_AMOUNT)).wait();
    });
    log(`victim: sent excess ${ethers.formatUnits(bal - VICTIM_AMOUNT, 6)} DUSDC to the burn address`);
  }

  const allowance = await usdc.allowance(victim, addresses.drainer);
  if (allowance > 0n) {
    if (isLocal) {
      await asImpersonated(provider, victim, async (s) => {
        await (await usdc.connect(s).approve(addresses.drainer, 0n)).wait();
      });
      log("allowance to previous drainer contract: revoked");
    } else {
      log("allowance to previous drainer still > 0 on Fuji (would need the victim's own key); redeploying a new drainer makes it moot");
    }
  }

  if (isLocal) {
    const cb = await usdc.balanceOf(addresses.collector);
    if (cb > 0n) {
      await asImpersonated(provider, addresses.collector, async (s) => {
        await (await usdc.connect(s).transfer(DEAD, cb)).wait();
      });
      log(`collector account: balance cleared (${ethers.formatUnits(cb, 6)} DUSDC)`);
    }
  }

  if (isLocal && addresses.mode === "fork") {
    await setRealUsdcBalance(provider, victim, VICTIM_AMOUNT, addresses.realUsdc || REAL_USDC);
    log("real USDC (fork): victim balance reset to 2480");
  }

  const art = loadArtifact("FreshDrainer");
  const factory = new ethers.ContractFactory(art.abi, art.bytecode, sender);
  const drainer = await factory.deploy(addresses.collector);
  await drainer.waitForDeployment();
  addresses.drainer = await drainer.getAddress();
  addresses.deployedAt = new Date().toISOString();
  addresses.blockNumber = await provider.getBlockNumber();
  writeAddresses(fuji ? "fuji" : "local", addresses);

  log(`new drainer contract: ${addresses.drainer}`);
  log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e.message || e);
  process.exit(1);
});
