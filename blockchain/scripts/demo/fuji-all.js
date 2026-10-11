/**
 * ONE command for Avalanche Fuji (testnet, chain id 43113):   npm run fuji:all
 *
 *   1. preflight: key present (never printed), deployer address, chain id, compilation, balance.
 *      Stops with the exact amount required when the balance is too low.
 *   2. deploys DemoUSDC, DemoWAVAX, DemoNFT, DemoRouter (+ liquidity), FreshDrainer, EvidenceAnchor
 *   3. gives the victim 2 480 DemoUSDC (+ a little test AVAX when the victim is another wallet)
 *   4. anchors the Merkle root of the current product journal in EvidenceAnchor
 *   5. writes research/demo_reelle/chain/addresses.fuji.json and blockchain/DEPLOYMENTS.md
 *   6. tries source verification on the explorer (keyless, never fatal)
 *   7. reads the chain back with a fresh connection (code at every address, anchored root readable)
 *
 * Idempotent: the state is saved after every transaction and every step first looks at the chain.
 * Running it again deploys only what is missing; a second run of a finished deployment sends nothing.
 *
 * Options:  --check       preflight only, sends nothing (exit 0 = ready, 2 = not ready)
 *           --fresh       ignore the previous deployment, redeploy everything
 *           --no-verify   skip source verification
 *           --journal <file.jsonl>   journal to anchor (default: HOLDUP_JOURNAL_FILE, else the RPC guard
 *                                    journal, else the audit sample journal)
 * Env:      FUJI_PRIVATE_KEY (or PRIVATE_KEY) in .env, never printed.
 *           DEMO_VICTIM=0x...        wallet that plays the victim (default: the deployer address)
 *           DEMO_VICTIM_AVAX=0.2     test AVAX sent to the victim (default: automatic, never blocking)
 *           FUJI_TIP_GWEI=...        force the priority fee if the network rejects the default one
 *
 * Rehearsal without any real transaction: start a local FORK of Fuji, then
 *   FUJI_RPC_URL=http://127.0.0.1:<port> HOLDUP_CHAIN_OUT_DIR=<throwaway dir> npm run fuji:all
 * (same key, same code path; outputs go to the throwaway dir; source verification is skipped).
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { pathToFileURL } = require("url");

const BLOCKCHAIN = path.join(__dirname, "..", "..");
const REPO = path.join(BLOCKCHAIN, "..");
const DEMO = path.join(REPO, "research", "demo_reelle");
const FUJI = 43113;
// Written in addresses.fuji.json (a tracked file read by the demo sites): always the public URL, never a custom one from .env.
const PUBLIC_RPC = "https://api.avax-test.network/ext/bc/C/rpc";
const NL = "\n";

// Gas measured on a local fork of Fuji (see blockchain/FUJI.md), used for the budget. +30 % margin below.
const GAS = {
  DemoUSDC: 1_720_000, DemoWAVAX: 942_000, DemoNFT: 1_814_000, DemoRouter: 900_000, FreshDrainer: 1_049_000, EvidenceAnchor: 543_000,
  mint: 75_000, approve: 50_000, addLiquidity: 120_000, transfer: 21_000, anchor: 140_000,
};
const LIQ_USDC = 100_000n * 10n ** 6n;
const LIQ_WAVAX = 1_000n * 10n ** 18n;

function parseArgs(argv) {
  const o = { check: false, fresh: false, verify: true, journal: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--check") o.check = true;
    else if (argv[i] === "--fresh") o.fresh = true;
    else if (argv[i] === "--no-verify") o.verify = false;
    else if (argv[i] === "--journal") o.journal = argv[++i];
    else throw new Error(`Unknown argument ${argv[i]}. Accepted: --check, --fresh, --no-verify, --journal <file>.`);
  }
  return o;
}

class Stop extends Error {
  constructor(message, code = 2) { super(message); this.code = code; }
}

const hardhatCli = () => require.resolve("hardhat/internal/cli/bootstrap");
/** Runs a Hardhat CLI command in a child process. Judged on its output, not on the exit status alone:
 *  under Node 25 on Windows Hardhat can abort at exit AFTER having done the work. */
function hardhat(args, { anchorConfig = false } = {}) {
  const full = [hardhatCli(), ...(anchorConfig ? ["--config", "hardhat.anchor.config.js"] : []), ...args];
  const r = spawnSync(process.execPath, full, { cwd: BLOCKCHAIN, encoding: "utf8", env: process.env, timeout: 240_000 });
  return { status: r.status, out: (r.stdout || "") + (r.stderr || "") };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  process.env.HARDHAT_NETWORK = "fuji";
  const hre = require("hardhat");
  const { ethers } = hre;
  const lib = await import(pathToFileURL(path.join(DEMO, "chain", "lib.mjs")).href);
  const url = hre.network.config.url;
  const rehearsal = lib.assertRehearsalOutDir(url); // refuses any host but 127.0.0.1 / Fuji
  const say = (s = "") => console.log(s);
  const fmt = (wei) => ethers.formatEther(wei);

  // ---------------------------------------------------------------- 1. preflight
  say(`== Fuji, all in one ${rehearsal ? "(REHEARSAL on a local fork: no real transaction)" : "(real Fuji testnet)"} ==`);
  const accounts = hre.network.config.accounts;
  if (!accounts || accounts.length === 0) {
    throw new Stop("No usable deployer key. Put FUJI_PRIVATE_KEY=0x<64 hex> in blockchain/.env (never committed), then rerun.");
  }
  const [deployer] = await ethers.getSigners();
  const provider = ethers.provider;
  const chainId = Number((await provider.getNetwork()).chainId);
  if (chainId !== FUJI) throw new Stop(`Refused: the RPC answers chain id ${chainId}, not Fuji (${FUJI}). Nothing sent.`);
  say(`key            defined: yes (value never shown)`);
  say(`deployer       ${deployer.address}`);
  if (process.env.WALLET_ADDRESS && ethers.isAddress(process.env.WALLET_ADDRESS) && ethers.getAddress(process.env.WALLET_ADDRESS) !== deployer.address) {
    say(`  WARNING: WALLET_ADDRESS in .env is another address. Fund the deployer address printed above, not that one.`);
  }
  say(`rpc            ${new URL(url).host}  chain ${chainId}`);

  await hre.run("compile", { quiet: true });
  const anchorArtifactPath = path.join(BLOCKCHAIN, "cache", "anchor", "artifacts", "cache", "anchor", "contracts", "EvidenceAnchor.sol", "EvidenceAnchor.json");
  const c = hardhat(["compile", "--quiet"], { anchorConfig: true });
  if (!fs.existsSync(anchorArtifactPath)) throw new Stop("EvidenceAnchor did not compile:" + NL + c.out.slice(-600), 1);
  const anchorArtifact = JSON.parse(fs.readFileSync(anchorArtifactPath, "utf8"));
  say(`compilation    ok (5 demo contracts + EvidenceAnchor)`);

  let victim = deployer.address;
  if (process.env.DEMO_VICTIM) {
    if (!ethers.isAddress(process.env.DEMO_VICTIM)) throw new Stop("DEMO_VICTIM is set but is not a valid 0x address. Fix it or remove it.");
    victim = ethers.getAddress(process.env.DEMO_VICTIM);
  }
  const victimIsDeployer = victim === deployer.address;
  say(`victim         ${victim}${victimIsDeployer ? "  (DEMO_VICTIM not set: the deployer plays the victim; rerun later with DEMO_VICTIM=0x... to fund another wallet)" : ""}`);

  // ---- journal to anchor (only a 32-byte root goes on chain: no address, no site, no text)
  const journalInfo = await pickJournal(args, say);

  // ---- previous state
  const statePath = lib.addressesPath("fuji");
  const prev = lib.tryReadAddresses("fuji");
  const sameKind = prev && Number(prev.chainId) === chainId && !prev.fujiEquivalent && !!prev.fujiRehearsal === rehearsal;
  if (prev && !sameKind && !args.fresh) say(`previous file  ${path.basename(statePath)} belongs to another kind of chain: ignored`);
  const st = sameKind && !args.fresh ? { ...prev } : {};
  st.deployments = st.deployments || {};
  const hasCode = async (a) => !!a && ethers.isAddress(a) && (await provider.getCode(a)) !== "0x";
  const have = {};
  for (const k of ["usdc", "wavax", "nft", "router", "drainer", "anchor"]) have[k] = await hasCode(st[k]);
  if (!have.usdc || !have.wavax) have.router = false; // the router is bound to these two tokens
  if (!st.collector || !ethers.isAddress(st.collector) || st.collector.toLowerCase() === deployer.address.toLowerCase()) {
    st.collector = ethers.Wallet.createRandom().address; // attacker's collector: a fresh address, its key is dropped here
    have.drainer = false;
  }

  // ---- what is left to do
  const erc20 = (a) => new ethers.Contract(a, lib.ERC20_ABI, deployer);
  const todo = [];
  const plan = (label, gas) => todo.push([label, gas]);
  if (!have.usdc) plan("deploy DemoUSDC", GAS.DemoUSDC);
  if (!have.wavax) plan("deploy DemoWAVAX", GAS.DemoWAVAX);
  if (!have.nft) plan("deploy DemoNFT", GAS.DemoNFT);
  if (!have.router) plan("deploy DemoRouter", GAS.DemoRouter);
  let liquidityDone = false;
  // "has liquidity" = at least half of the initial deposit: demo swaps move the two balances around
  const hasLiquidity = async (prov) => (await new ethers.Contract(st.usdc, lib.ERC20_ABI, prov).balanceOf(st.router)) >= LIQ_USDC / 2n && (await new ethers.Contract(st.wavax, lib.ERC20_ABI, prov).balanceOf(st.router)) >= LIQ_WAVAX / 2n;
  if (have.router) liquidityDone = await hasLiquidity(provider);
  if (!liquidityDone) plan("router liquidity (2 mints, 2 approvals, addLiquidity)", GAS.mint * 2 + GAS.approve * 2 + GAS.addLiquidity);
  if (!have.drainer) plan("deploy FreshDrainer", GAS.FreshDrainer);
  if (!have.anchor) plan("deploy EvidenceAnchor", GAS.EvidenceAnchor);
  let victimMint = lib.VICTIM_AMOUNT;
  if (have.usdc) {
    const b = await erc20(st.usdc).balanceOf(victim);
    victimMint = b >= lib.VICTIM_AMOUNT ? 0n : lib.VICTIM_AMOUNT - b;
  }
  if (victimMint > 0n) plan("mint DemoUSDC to the victim", GAS.mint);
  const anchorAbi = anchorArtifact.abi;
  let anchoredSeq = null;
  if (journalInfo && have.anchor) anchoredSeq = await findAnchored(new ethers.Contract(st.anchor, anchorAbi, provider), journalInfo);
  if (journalInfo && anchoredSeq === null) plan("anchor the journal root", GAS.anchor);
  const explicitVictimAvax = !victimIsDeployer && process.env.DEMO_VICTIM_AVAX ? ethers.parseEther(process.env.DEMO_VICTIM_AVAX) : null;
  const victimBal = victimIsDeployer ? 0n : await provider.getBalance(victim);
  const victimAvaxFixed = explicitVictimAvax !== null && victimBal < explicitVictimAvax ? explicitVictimAvax : 0n;
  if (!victimIsDeployer) plan("send test AVAX to the victim", GAS.transfer);

  // ---- fees and budget
  const block = await provider.getBlock("latest");
  const baseFee = block.baseFeePerGas ?? 0n;
  let tip;
  if (process.env.FUJI_TIP_GWEI) tip = ethers.parseUnits(process.env.FUJI_TIP_GWEI, "gwei");
  else {
    try { tip = BigInt(await provider.send("eth_maxPriorityFeePerGas", [])) * 2n; } catch { tip = 10n ** 9n; }
    if (tip < 1n) tip = 1n;
  }
  const maxFee = baseFee * 4n + tip; // ceiling; the network charges baseFee + tip, the rest is not spent
  const fees = { maxFeePerGas: maxFee, maxPriorityFeePerGas: tip, type: 2 };
  const gasBudget = (todo.reduce((s, [, g]) => s + BigInt(g), 0n) * 130n) / 100n;
  const required = gasBudget * maxFee + victimAvaxFixed;
  const balance = await provider.getBalance(deployer.address);
  say(`gas price      base ${baseFee} wei + tip ${tip} wei (ceiling ${maxFee} wei per gas)`);
  say(todo.length ? "to do:" : "to do: nothing, everything is already on chain");
  for (const [l, g] of todo) say(`  - ${l.padEnd(55)} ~${g} gas`);
  say(`required       ${fmt(required)} AVAX  (= ${gasBudget} gas with +30 % margin x ${maxFee} wei${victimAvaxFixed ? ` + ${fmt(victimAvaxFixed)} AVAX for the victim` : ""})`);
  say(`balance        ${fmt(balance)} AVAX`);
  if (balance < required || (balance === 0n && todo.length)) {
    throw new Stop(
      `NOT READY: the deployer holds ${fmt(balance)} AVAX on Fuji, ${fmt(required)} AVAX are required (missing ${fmt(required - balance)} AVAX).` + NL +
      `Send test AVAX to ${deployer.address} (faucet, see blockchain/FUJI.md), then rerun: npm run fuji:all` + NL +
      `Nothing was sent.`
    );
  }
  if (args.check) {
    say(NL + "READY: the balance covers the plan. Run: npm run fuji:all");
    return;
  }

  // ---------------------------------------------------------------- 2. execution
  const save = () => {
    Object.assign(st, { chainId, rpcUrl: rehearsal ? url : PUBLIC_RPC, mode: rehearsal ? "fuji-rehearsal" : "fuji", victim, deployer: deployer.address });
    if (rehearsal) st.fujiRehearsal = true; else delete st.fujiRehearsal;
    delete st.fujiEquivalent;
    lib.writeAddresses("fuji", st);
  };
  let nonce = await provider.getTransactionCount(deployer.address, "pending");
  const gasLog = [];
  let spent = 0n;
  /** Sends one transaction with an explicit nonce and explicit fees, waits for the receipt. */
  const send = async (label, txReq) => {
    let tx;
    try {
      tx = await deployer.sendTransaction({ ...txReq, ...fees, nonce });
    } catch (e) {
      throw new Stop(`"${label}" was refused by the node: ${e.shortMessage || e.message}` + NL + `Nothing is lost: rerun npm run fuji:all (it resumes where it stopped).`, 1);
    }
    nonce++;
    const rc = await tx.wait(1, 180_000).catch((e) => { throw new Stop(`"${label}": no receipt after 180 s (tx ${tx.hash}): ${e.shortMessage || e.message}. Rerun npm run fuji:all.`, 1); });
    if (!rc || rc.status !== 1) throw new Stop(`"${label}" reverted (tx ${tx.hash}).`, 1);
    const cost = rc.gasUsed * (rc.gasPrice ?? 0n);
    spent += cost;
    gasLog.push({ label, gasUsed: Number(rc.gasUsed), tx: tx.hash, block: rc.blockNumber });
    say(`  ${label.padEnd(36)} gas ${String(rc.gasUsed).padStart(8)}  ${rehearsal ? tx.hash : lib.explorerTx(chainId, tx.hash, "fuji")}`);
    return rc;
  };
  const deploy = async (name, key, factory, ...ctorArgs) => {
    const rc = await send(`deploy ${name}`, await factory.getDeployTransaction(...ctorArgs));
    st[key] = rc.contractAddress;
    st.deployments[name] = { address: rc.contractAddress, tx: rc.hash, block: rc.blockNumber, gasUsed: Number(rc.gasUsed), args: ctorArgs, at: new Date().toISOString() };
    delete (st.verified || {})[name];
    save();
    say(`      -> ${rc.contractAddress}`);
  };
  const factory = (name) => ethers.getContractFactory(name, deployer);
  const call = async (label, contract, fn, ...a) => send(label, await contract[fn].populateTransaction(...a));

  say(NL + "transactions:");
  save();
  if (!have.usdc) await deploy("DemoUSDC", "usdc", await factory("DemoUSDC"));
  if (!have.wavax) await deploy("DemoWAVAX", "wavax", await factory("DemoWAVAX"));
  if (!have.nft) await deploy("DemoNFT", "nft", await factory("DemoNFT"));
  if (!have.router) await deploy("DemoRouter", "router", await factory("DemoRouter"), st.usdc, st.wavax);
  const usdc = erc20(st.usdc);
  const wavax = erc20(st.wavax);
  if (!liquidityDone) {
    const router = await ethers.getContractAt("DemoRouter", st.router, deployer);
    // each sub-step looks at the chain first, so an interrupted run resumes cleanly
    if ((await usdc.balanceOf(deployer.address)) < LIQ_USDC) await call("mint DemoUSDC (liquidity)", usdc, "mint", deployer.address, LIQ_USDC);
    if ((await wavax.balanceOf(deployer.address)) < LIQ_WAVAX) await call("mint DemoWAVAX (liquidity)", wavax, "mint", deployer.address, LIQ_WAVAX);
    if ((await usdc.allowance(deployer.address, st.router)) < LIQ_USDC) await call("approve DemoUSDC -> router", usdc, "approve", st.router, LIQ_USDC);
    if ((await wavax.allowance(deployer.address, st.router)) < LIQ_WAVAX) await call("approve DemoWAVAX -> router", wavax, "approve", st.router, LIQ_WAVAX);
    await call("router.addLiquidity", router, "addLiquidity", LIQ_USDC, LIQ_WAVAX);
  }
  if (!have.drainer) await deploy("FreshDrainer", "drainer", await factory("FreshDrainer"), st.collector);
  const anchorFactory = new ethers.ContractFactory(anchorAbi, anchorArtifact.bytecode, deployer);
  if (!have.anchor) await deploy("EvidenceAnchor", "anchor", anchorFactory);
  if (!have.usdc) victimMint = lib.VICTIM_AMOUNT; // a new token: the victim starts from zero
  if (victimMint > 0n) await call("mint 2480 DemoUSDC to the victim", usdc, "mint", victim, victimMint);

  const anchorC = new ethers.Contract(st.anchor, anchorAbi, deployer);
  if (journalInfo) {
    if (!have.anchor) anchoredSeq = null;
    if (anchoredSeq === null) {
      const rc = await call("anchor the journal root", anchorC, "anchor", journalInfo.root, journalInfo.from, journalInfo.to, 0);
      const ev = rc.logs.map((l) => { try { return anchorC.interface.parseLog(l); } catch { return null; } }).find((e) => e && e.name === "Anchored");
      st.anchorRecord = {
        root: journalInfo.root, fromSeq: journalInfo.from, toSeq: journalInfo.to, count: journalInfo.count, ruleVersion: 0,
        seq: ev ? Number(ev.args.seq) : null, tx: rc.hash, block: rc.blockNumber, blockTime: ev ? new Date(Number(ev.args.blockTime) * 1000).toISOString() : null,
        journal: journalInfo.label, sender: deployer.address,
      };
      save();
    } else say(`  journal root already anchored (rank ${anchoredSeq}): nothing sent`);
  }

  if (!victimIsDeployer) {
    // Explicit DEMO_VICTIM_AVAX: that amount (already in the budget). Otherwise automatic and never blocking:
    // top the victim up to 0.2 AVAX, capped at half of what the deployer has left.
    const bal = await provider.getBalance(deployer.address);
    const reserve = BigInt(GAS.transfer) * maxFee * 2n;
    const target = explicitVictimAvax ?? ethers.parseEther("0.2");
    let amount = victimBal >= target ? 0n : explicitVictimAvax ?? target - victimBal;
    if (explicitVictimAvax === null && amount > (bal - reserve) / 2n) amount = bal > reserve ? (bal - reserve) / 2n : 0n;
    if (amount > 0n) await send(`send ${fmt(amount)} AVAX to the victim`, { to: victim, value: amount });
    else say(`  victim already holds ${fmt(victimBal)} AVAX: no transfer`);
  }
  st.deployedAt = st.deployedAt && gasLog.length === 0 ? st.deployedAt : new Date().toISOString();
  st.blockNumber = await provider.getBlockNumber();
  save();
  const gasTotal = gasLog.reduce((s, g) => s + g.gasUsed, 0);
  say(`gas used this run: ${gasTotal}  (${gasLog.length} transactions, ${fmt(spent)} AVAX spent)`);

  // ---------------------------------------------------------------- 3. source verification (never fatal)
  st.verified = st.verified || {};
  const targets = [
    ["DemoUSDC", st.usdc, []], ["DemoWAVAX", st.wavax, []], ["DemoNFT", st.nft, []],
    ["DemoRouter", st.router, [st.usdc, st.wavax]], ["FreshDrainer", st.drainer, [st.collector]], ["EvidenceAnchor", st.anchor, []],
  ];
  say(NL + "source verification:");
  if (rehearsal) say("  skipped: these addresses exist only on the local fork, the public explorer cannot know them");
  else if (!args.verify) say("  skipped (--no-verify)");
  else {
    for (const [name, addr, ctor] of targets) {
      if (st.verified[name] === addr) { say(`  ${name.padEnd(15)} already verified`); continue; }
      let ok = false, last = "";
      for (let attempt = 1; attempt <= 4 && !ok; attempt++) {
        const r = hardhat(["verify", "--network", "fuji", addr, ...ctor], { anchorConfig: name === "EvidenceAnchor" });
        ok = /successfully verified|already been verified|already verified/i.test(r.out);
        last = r.out.split(/\r?\n/).filter((l) => l.trim() && !/WARNING|deprecated|Node\.js/i.test(l)).slice(-2).join(" ").slice(0, 240);
        if (!ok && attempt < 4) await new Promise((res) => setTimeout(res, 15_000)); // the explorer indexes a new contract after a few seconds
      }
      if (ok) st.verified[name] = addr;
      say(`  ${name.padEnd(15)} ${ok ? "verified  " + lib.explorerAddress(chainId, addr, "fuji") + "#code" : "NOT verified (" + last + ")"}`);
    }
    save();
    if (targets.some(([n, a]) => st.verified[n] !== a)) say("  -> not blocking. Retry later with: npm run fuji:all   (only the verification is redone)");
  }

  // ---------------------------------------------------------------- 4. read the chain back (fresh connection)
  say(NL + "read-back from the chain:");
  const fresh = new ethers.JsonRpcProvider(url, undefined, { batchMaxCount: 1 });
  const checks = [];
  const check = (name, ok, detail = "") => { checks.push(ok); say(`  ${ok ? "ok  " : "FAIL"} ${name}${detail ? "  " + detail : ""}`); };
  const retry = async (fn) => { // a load-balanced public RPC can lag a block behind
    let v;
    for (let i = 0; i < 10; i++) { try { v = await fn(); if (v) return v; } catch { /* retry */ } await new Promise((r) => setTimeout(r, 1500)); }
    return v;
  };
  check("chain id is 43113", Number((await fresh.getNetwork()).chainId) === FUJI);
  for (const [name, addr] of targets) check(`code at ${name}`, !!(await retry(async () => (await fresh.getCode(addr)) !== "0x")), addr);
  const rUsdc = new ethers.Contract(st.usdc, lib.ERC20_ABI, fresh);
  check("DemoUSDC answers name/decimals", (await rUsdc.name()) === "Demo USDC" && Number(await rUsdc.decimals()) === 6);
  check("DemoUSDC supports permit (nonces)", (await rUsdc.nonces(victim)) >= 0n);
  check("router holds its liquidity", await hasLiquidity(fresh));
  check("FreshDrainer collector is the recorded address", (await new ethers.Contract(st.drainer, lib.DRAINER_ABI, fresh).collector()).toLowerCase() === st.collector.toLowerCase());
  check("victim holds at least 2 480 DemoUSDC", (await rUsdc.balanceOf(victim)) >= lib.VICTIM_AMOUNT);
  if (journalInfo) {
    const seq = await retry(() => findAnchored(new ethers.Contract(st.anchor, anchorAbi, fresh), journalInfo).then((s) => (s === null ? null : { s })));
    check("journal root is anchored and readable", !!seq, seq ? `rank ${seq.s}, root ${journalInfo.root}` : "root not found in EvidenceAnchor");
  } else say("  (no journal anchored: no readable journal file was found)");
  const allOk = checks.every(Boolean);

  // ---------------------------------------------------------------- 5. files
  const mdPath = writeDeploymentsMd({ lib, st, targets, chainId, rehearsal, allOk });
  say(NL + `written: ${statePath}`);
  say(`written: ${mdPath}`);
  if (!rehearsal) {
    for (const dir of ["site", "site_echange"]) {
      const r = spawnSync(process.execPath, [path.join(DEMO, dir, "config.js")], { encoding: "utf8", timeout: 20_000 });
      say(`copied for ${dir}: ${r.status === 0 ? "ok" : "FAILED, run: node research/demo_reelle/" + dir + "/config.js"}`);
    }
  }
  if (!allOk) throw new Stop("At least one read-back check failed (see FAIL above). Rerun npm run fuji:all.", 1);
  say(NL + `DONE. ${rehearsal ? "Rehearsal complete: nothing touched the real network." : "Everything is on Fuji: " + lib.explorerAddress(chainId, deployer.address, "fuji")}`);
}

/** Journal to anchor -> { root, from, to, count, label } or null. Never throws: anchoring is skipped with a message. */
async function pickJournal(args, say) {
  const candidates = [
    args.journal,
    process.env.HOLDUP_JOURNAL_FILE,
    path.join(DEMO, "rpc_garde", "journal", "decisions.jsonl"),
    path.join(DEMO, "audit", "sample", "journal.jsonl"),
  ].filter(Boolean).map((f) => path.resolve(f));
  let R, A;
  try {
    R = await import(pathToFileURL(path.join(DEMO, "reponse", "incident.mjs")).href);
    A = await import(pathToFileURL(path.join(DEMO, "reponse", "anchor_evidence.mjs")).href);
  } catch (e) {
    say(`journal        anchoring code not loadable (${e.message}): anchoring skipped`);
    return null;
  }
  for (const f of candidates) {
    if (!fs.existsSync(f)) continue;
    try {
      const j = A.journalRoot(R.readJournal(f)); // refuses a broken hash chain
      const label = path.relative(REPO, f).split(path.sep).join("/");
      say(`journal        ${label}  lines ${j.from}..${j.to}  root ${j.root}`);
      return { ...j, label };
    } catch (e) {
      say(`journal        ${path.basename(f)} unusable (${e.message}), trying the next one`);
    }
  }
  say("journal        no readable journal found: the contract is deployed, nothing is anchored");
  return null;
}

/** Rank of the record that carries this root for this interval, or null. */
async function findAnchored(anchor, j) {
  const n = Number(await anchor.count());
  for (let i = n - 1; i >= 0; i--) {
    const r = await anchor.get(i);
    if (r.root.toLowerCase() === j.root.toLowerCase() && Number(r.fromIndex) === j.from && Number(r.toIndex) === j.to) return i;
  }
  return null;
}

/** Rewrites the generated block of DEPLOYMENTS.md (between two markers). Lines added below it by
 *  demo:fuji / anchor:fuji are kept. */
function writeDeploymentsMd({ lib, st, targets, chainId, rehearsal, allOk }) {
  const p = lib.deploymentsMdPath();
  const START = "<!-- fuji-all:start (generated by npm run fuji:all, do not edit by hand) -->";
  const END = "<!-- fuji-all:end -->";
  const ex = lib.FUJI_EXPLORER;
  const rows = targets.map(([name, addr, ctor]) => {
    const d = (st.deployments[name] || {}).address === addr ? st.deployments[name] : {}; // "?" = redeployed since by reset.mjs / demo:fuji
    const ver = rehearsal ? "n/a (rehearsal)" : (st.verified || {})[name] === addr ? "yes" : "no";
    return `| ${name} | \`${addr}\` | ${d.tx ? `[${d.tx.slice(0, 10)}…](${ex}/tx/${d.tx})` : "?"} | ${d.block ?? "?"} | ${d.gasUsed ?? "?"} | ${ctor.length ? ctor.map((a) => "`" + a + "`").join(", ") : "none"} | ${ver} | ${ex}/address/${addr} |`;
  });
  const a = st.anchorRecord;
  const block = [
    START,
    `Network: Avalanche Fuji C-Chain (chain id ${chainId})${rehearsal ? " — REHEARSAL on a local fork, these addresses do NOT exist on the real network" : ""}`,
    `Deployer: \`${st.deployer}\` — ${ex}/address/${st.deployer}`,
    `Last run: ${new Date().toISOString()} — read-back from the chain: ${allOk ? "all checks passed" : "FAILED"}`,
    "",
    "| Contract | Address | Deployment tx | Block | Gas used | Constructor arguments | Source verified | Explorer |",
    "|---|---|---|---|---|---|---|---|",
    ...rows,
    "",
    `Collector of FreshDrainer (address only, its key was never stored): \`${st.collector}\``,
    `Victim wallet (2 480 DemoUSDC): \`${st.victim}\``,
    "",
    a
      ? `Journal anchor: root \`${a.root}\`, journal lines ${a.fromSeq}..${a.toSeq} (${a.count} lines, \`${a.journal}\`), rank ${a.seq} in EvidenceAnchor, tx [${a.tx.slice(0, 10)}…](${ex}/tx/${a.tx}), block ${a.block}, block time ${a.blockTime}. Only this 32-byte root is on chain.`
      : "Journal anchor: none yet.",
    END,
  ].join(NL);
  let md = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
  const legacyHeader = /^# Fuji deployments\s*\n\s*\| Contract \| Address \| Snowtrace \|\s*\n\|---\|---\|---\|\s*\n/;
  if (md.includes(START) && md.includes(END)) {
    md = md.slice(0, md.indexOf(START)) + block + md.slice(md.indexOf(END) + END.length);
  } else {
    const rest = md.replace(legacyHeader, "").trim();
    md = ["# Fuji deployments", "", block, "", "## Later redeployments (rows appended by demo:fuji, anchor:fuji)", "", "| Contract | Address | Snowtrace |", "|---|---|---|", rest].join(NL).trimEnd() + NL;
  }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, md);
  return p;
}

main()
  .then(() => setImmediate(() => process.exit(0)))
  .catch((e) => {
    console.error(NL + (e instanceof Stop ? e.message : "Error: " + (e && (e.shortMessage || e.message) || e)));
    setImmediate(() => process.exit(e instanceof Stop ? e.code : 1));
  });
