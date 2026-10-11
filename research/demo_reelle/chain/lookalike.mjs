// Prop for the "address typed in the wallet" scene (address poisoning), on OUR OWN demo chain only.
//
//   node lookalike.mjs --network local|fuji          (--network is mandatory, never guessed)
//   env: DEMO_CONTACT=0x..  (the victim's real contact; default: addresses.<net>.json `contact`, else a
//                            fresh address is generated and stored; its key is discarded)
//        DEMO_CONTACT_LABEL (default "Paul")
//   opts: --prefix 3 --suffix 3   number of leading / trailing hex characters to copy (default 3 / 3)
//
// What it does, in order:
//  1. brute-forces a throwaway address sharing the first/last hex characters of the contact (worker threads);
//  2. gives that lookalike gas (local: hardhat_setBalance; Fuji: sent by the deployer);
//  3. local only: the victim (impersonated) sends the contact a past outgoing transfer so that the
//     contact is in the victim's history; on Fuji this step is skipped (no key for the victim);
//  4. the lookalike sends the victim a dust amount of DemoUSDC, so it shows up in the victim's history;
//  5. stores `contact` and `lookalike` ADDRESSES in addresses.<net>.json and writes context.local.json
//     (the victim's local context in the shape server.mjs `loadLocalContext` reads).
// The lookalike private key lives in memory only: never printed, never written, dropped at the end.
// Synthetic data only. Refuses any network other than local and Fuji.
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { Worker } from "node:worker_threads";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  ethers,
  ERC20_ABI,
  blockchainDir,
  makeContext,
  deployerSigner,
  parseNetwork,
  writeAddresses,
  writeJson,
  contextPath,
  setLocalBalance,
  asImpersonated,
  explorerTx,
} from "./lib.mjs";

export const DUST = 1000n; // 0.001 DemoUSDC (6 decimals): below the "dust" threshold of the product
export const PAST_TRANSFER = 120n * 10n ** 6n; // victim -> contact, 120 DemoUSDC (local only)
const workerFile = fileURLToPath(new URL("./lookalike_worker.mjs", import.meta.url));

/** Brute-force an address with the same first `prefix` and last `suffix` hex chars as `contact`. */
export async function mineLookalike(contact, { prefix = 3, suffix = 3, workers } = {}) {
  if (!ethers.isAddress(contact)) throw new Error("contact is not an address");
  if (!(prefix >= 1 && suffix >= 1 && prefix + suffix <= 8)) throw new Error("prefix and suffix must be >= 1 with prefix + suffix <= 8");
  const hex = contact.toLowerCase().slice(2);
  const pre = hex.slice(0, prefix);
  const suf = hex.slice(40 - suffix);
  const n = Math.max(1, workers || os.cpus().length - 1);
  const t0 = Date.now();
  return new Promise((resolve, reject) => {
    const pool = [];
    let done = false;
    const stopAll = () => pool.forEach((w) => w.terminate());
    for (let i = 0; i < n; i++) {
      const startKey = crypto.randomBytes(31).toString("hex"); // far below the curve order
      const w = new Worker(workerFile, {
        workerData: { pkgJson: path.join(blockchainDir, "package.json"), prefix: pre, suffix: suf, startKey },
      });
      pool.push(w);
      w.on("message", (m) => {
        if (done) return;
        done = true;
        stopAll();
        const privateKey = "0x" + m.key;
        const address = ethers.computeAddress(privateKey);
        const a = address.toLowerCase().slice(2);
        if (!a.startsWith(pre) || !a.endsWith(suf) || address.toLowerCase() === contact.toLowerCase()) {
          return reject(new Error("internal error: mined address does not match the contact"));
        }
        resolve({ address, privateKey, ms: Date.now() - t0, workers: n });
      });
      w.on("error", (e) => {
        if (!done) {
          done = true;
          stopAll();
          reject(e);
        }
      });
    }
  });
}

/**
 * Whole scene setup on an existing context (see makeContext). Returns the result summary.
 * ctx = { provider, addresses, kind, isLocal, equivalent }; signer = deployer signer (mint + Fuji gas).
 */
export async function runLookalike(ctx, signer, opts = {}) {
  const log = opts.log || (() => {});
  const { provider, addresses, kind, isLocal } = ctx;
  const link = (h) => (isLocal ? "" : `  ${explorerTx(addresses.chainId, h, kind)}`);
  const usdc = new ethers.Contract(addresses.usdc, ERC20_ABI, signer);

  const envContact = opts.contact || process.env.DEMO_CONTACT;
  let contact = envContact || addresses.contact;
  if (contact) {
    if (!ethers.isAddress(contact)) throw new Error("DEMO_CONTACT is not a valid 0x address");
    contact = ethers.getAddress(contact);
  } else {
    contact = ethers.Wallet.createRandom().address; // key dropped immediately
    log(`contact: generated a fresh address ${contact} (its key was discarded)`);
  }
  if (contact.toLowerCase() === addresses.victim.toLowerCase()) throw new Error("The contact cannot be the victim itself.");
  const label = opts.label || process.env.DEMO_CONTACT_LABEL || "Paul";

  // Fuji: check the deployer can pay before doing anything.
  let gasFunding = 0n;
  if (!isLocal) {
    const fee = await provider.getFeeData();
    const price = fee.maxFeePerGas || fee.gasPrice || 50n * 10n ** 9n;
    gasFunding = 90_000n * price * 2n; // plenty for one ERC-20 transfer
    const needs = gasFunding + (21_000n + 80_000n) * price * 2n;
    const have = await provider.getBalance(await signer.getAddress());
    log(`estimated cost: ~${ethers.formatEther(needs)} AVAX (deployer holds ${ethers.formatEther(have)})`);
    if (have < needs) {
      throw new Error(`Deployer balance ${ethers.formatEther(have)} AVAX is below the estimated cost ${ethers.formatEther(needs)} AVAX. Faucet: https://build.avax.network/console/primary-network/faucet`);
    }
  }

  log(`mining a lookalike of ${contact} (${opts.prefix || 3} first + ${opts.suffix || 3} last hex chars)...`);
  const mined = await mineLookalike(contact, { prefix: opts.prefix || 3, suffix: opts.suffix || 3, workers: opts.workers });
  let key = mined.privateKey; // memory only
  const lookalike = mined.address;
  log(`lookalike: ${lookalike}  (found in ${(mined.ms / 1000).toFixed(1)} s on ${mined.workers} threads; key stays in memory only)`);

  // 2. gas for the lookalike
  if (isLocal) await setLocalBalance(provider, lookalike, 1n);
  else {
    const tx = await signer.sendTransaction({ to: lookalike, value: gasFunding });
    await tx.wait();
    log(`lookalike gas funded by the deployer${link(tx.hash)}`);
  }

  // 3. contact in the victim's history (local: impersonation)
  let contactTx = null;
  if (isLocal) {
    await (await usdc.mint(addresses.victim, PAST_TRANSFER)).wait(); // keeps the victim at exactly 2 480
    await asImpersonated(provider, addresses.victim, async (s) => {
      const tx = await usdc.connect(s).transfer(contact, PAST_TRANSFER);
      await tx.wait();
      contactTx = tx.hash;
    });
    log(`victim -> contact: ${ethers.formatUnits(PAST_TRANSFER, 6)} DUSDC (past outgoing transfer, local impersonation)`);
  } else {
    log("Fuji: step skipped (the victim's key is not ours). Optional: from the demo wallet, send 1 DUSDC to the contact so it shows in the wallet history.");
  }

  // 4. dust from the lookalike to the victim
  await (await usdc.mint(lookalike, DUST)).wait();
  const wallet = new ethers.Wallet(key, provider);
  const dustTx = await new ethers.Contract(addresses.usdc, ERC20_ABI, wallet).transfer(addresses.victim, DUST);
  await dustTx.wait();
  key = null; // eslint-disable-line no-useless-assignment
  log(`lookalike -> victim: ${ethers.formatUnits(DUST, 6)} DUSDC dust${link(dustTx.hash)}`);

  // 5. files
  addresses.contact = contact;
  addresses.lookalike = lookalike;
  writeAddresses(kind, addresses);
  const context = {
    _aide: "Contexte local SYNTHETIQUE genere par research/demo_reelle/chain/lookalike.mjs. A pointer avec SENTINELLE_CONTEXT ou copier dans server/context.local.json. Aucune donnee reelle.",
    contacts: [{ label, address: contact }],
    history: [
      { address: contact, direction: "sortie", amount: String(PAST_TRANSFER / 10n ** 6n), minutes_ago: 4320 },
      { address: lookalike, direction: "entree", amount: ethers.formatUnits(DUST, 6), minutes_ago: 8 },
    ],
    protected: [],
    knownSpenders: [],
  };
  writeJson(contextPath(), context);

  return { contact, lookalike, dustTx: dustTx.hash, contactTx, minedMs: mined.ms, contextFile: contextPath() };
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith("--")) o[argv[i].slice(2)] = argv[++i];
  return o;
}

async function main() {
  const argv = process.argv.slice(2);
  const kind = parseNetwork(argv);
  const args = parseArgs(argv);
  const ctx = await makeContext(kind);
  const signer = await deployerSigner(ctx);
  const res = await runLookalike(ctx, signer, {
    log: console.log,
    prefix: args.prefix ? Number(args.prefix) : 3,
    suffix: args.suffix ? Number(args.suffix) : 3,
  });
  console.log(`\ncontact    ${res.contact}\nlookalike  ${res.lookalike}\nwritten    addresses.${kind}.json (contact, lookalike) and ${path.basename(res.contextFile)}`);
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((e) => {
    console.error("Error:", e.message || e);
    process.exit(1);
  });
}
