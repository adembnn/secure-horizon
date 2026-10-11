// Replay the rehearsal in ~10 s:  node reset.mjs --network local|fuji   (--network is mandatory)
// - victim balance set back to exactly 2 480 DemoUSDC (minted up; burned down on the local node only)
// - victim's allowance to the previous drainer contract revoked (local node only; on Fuji it needs the
//   victim's own wallet: the script says what to do)
// - previous drainer's token balance returned to a burn address (local node only)
// - a fresh FreshDrainer contract is redeployed (new address) and the addresses file updated
// Only ever talks to 127.0.0.1 or the public Fuji RPC (same guard as drain.mjs). On Fuji the deployer
// key (FUJI_PRIVATE_KEY) signs and pays; Snowtrace links are printed.
import {
  ethers,
  ERC20_ABI,
  VICTIM_AMOUNT,
  DEAD,
  makeContext,
  deployerSigner,
  parseNetwork,
  loadArtifact,
  writeAddresses,
  setLocalBalance,
  asImpersonated,
  setRealUsdcBalance,
  explorerTx,
  explorerAddress,
  REAL_USDC,
} from "./lib.mjs";

const t0 = Date.now();
const log = (m) => console.log(m);

async function main() {
  const kind = parseNetwork(process.argv.slice(2));
  const ctx = await makeContext(kind);
  const { provider, addresses, isLocal } = ctx;
  const link = (hash) => (isLocal ? "" : `  ${explorerTx(addresses.chainId, hash, kind)}`);

  const sender = await deployerSigner(ctx);
  const usdc = new ethers.Contract(addresses.usdc, ERC20_ABI, sender);
  const victim = addresses.victim;

  if (isLocal) await setLocalBalance(provider, victim, 100n);

  const bal = await usdc.balanceOf(victim);
  if (bal < VICTIM_AMOUNT) {
    const tx = await usdc.mint(victim, VICTIM_AMOUNT - bal);
    await tx.wait();
    log(`victim: minted ${ethers.formatUnits(VICTIM_AMOUNT - bal, 6)} DUSDC${link(tx.hash)}`);
  } else if (bal > VICTIM_AMOUNT && isLocal) {
    await asImpersonated(provider, victim, async (s) => {
      await (await usdc.connect(s).transfer(DEAD, bal - VICTIM_AMOUNT)).wait();
    });
    log(`victim: sent excess ${ethers.formatUnits(bal - VICTIM_AMOUNT, 6)} DUSDC to the burn address`);
  } else if (bal > VICTIM_AMOUNT) {
    log(`victim: holds ${ethers.formatUnits(bal, 6)} DUSDC (> 2480, e.g. the lookalike dust). Nothing to burn from here on Fuji: harmless for the demo.`);
  }

  const allowance = await usdc.allowance(victim, addresses.drainer);
  if (allowance > 0n) {
    if (isLocal) {
      await asImpersonated(provider, victim, async (s) => {
        await (await usdc.connect(s).approve(addresses.drainer, 0n)).wait();
      });
      log("allowance to previous drainer contract: revoked");
    } else {
      log(
        `HUMAN ACTION (Fuji): the victim still has an allowance of ${ethers.formatUnits(allowance, 6)} DUSDC to the previous drainer ${addresses.drainer}.\n` +
          `  Only the victim's own wallet can revoke it: call approve(${addresses.drainer}, 0) on DemoUSDC ${addresses.usdc}\n` +
          `  (Snowtrace > Contract > Write Contract > approve, or any token-approval revoke tool on Fuji).\n` +
          `  Not required for the next run: the new drainer below is a different spender.`
      );
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
  } else {
    const cb = await usdc.balanceOf(addresses.collector);
    if (cb > 0n) log(`collector (keyless, cannot be emptied): holds ${ethers.formatUnits(cb, 6)} DUSDC of previous runs. Harmless.`);
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
  writeAddresses(kind, addresses);

  log(`new drainer contract: ${addresses.drainer}`);
  if (!isLocal) log(`  ${explorerAddress(addresses.chainId, addresses.drainer, kind)}`);
  log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e.message || e);
  process.exit(1);
});
