// Preuve, par lecture de la chaîne, de la scène « le site honnête est piraté plus tard ».
// Deux parcours, la MÊME phrase « échanger 50 USDC contre AVAX », un solde de départ de 100 :
//   a) SANS Hold up : droit ILLIMITÉ au routeur, échange de 50, puis compromission du routeur.
//   b) AVEC Hold up  : droit ramené à 50 (ce que fait l'extension : le même approve, montant limité),
//                      l'échange le consomme entièrement, puis la MÊME compromission.
// Le script lit soldes et droits à chaque étape et ÉCHOUE si un chiffre n'est pas celui attendu.
//
// Sécurité : ne parle qu'à 127.0.0.1 (garde assertSafeRpc de ../../chain/lib.mjs). Comptes de test
// ALÉATOIRES créés à l'exécution. Toute la scène est jouée entre evm_snapshot et evm_revert :
// l'état de la chaîne (répétition live) est restauré à la fin.
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const lib = await import(pathToFileURL(path.join(here, "..", "..", "chain", "lib.mjs")).href);
const { ethers, ERC20_ABI, makeContext, setLocalBalance } = lib;

const MAX = (1n << 256n) - 1n;
const AMOUNT = 50n * 10n ** 6n; // échange de 50 DUSDC
const START = 100n * 10n ** 6n; // solde de départ
const VULN_ROUTER_ABI = ["function swapUSDCforWAVAX(uint256,uint256) returns (uint256)", "function execute(address,bytes) returns (bytes)"];
const TRANSFER_FROM = new ethers.Interface(["function transferFrom(address,address,uint256)"]);
const f6 = (v) => ethers.formatUnits(v, 6);

let failures = 0;
function check(label, cond, detail) {
  console.log((cond ? "  PASS " : "  FAIL ") + label + (detail ? " -> " + detail : ""));
  if (!cond) failures++;
}

async function newUser(ctx) {
  // NonceManager : le nœud local, en automine, renvoie parfois un nonce périmé entre deux
  // transactions envoyées à la suite (cf. lib.mjs). Le gestionnaire de nonce l'évite.
  const base = ethers.Wallet.createRandom().connect(ctx.provider);
  const w = new ethers.NonceManager(base);
  w.address = base.address;
  await setLocalBalance(ctx.provider, base.address, 10n);
  const usdc = new ethers.Contract(ctx.addresses.usdc, ERC20_ABI, w);
  await (await usdc.mint(base.address, START)).wait();
  return w;
}

async function main() {
  const ctx = await makeContext("local");
  const { provider, addresses } = ctx;
  if (!addresses.vulnRouter || !ethers.isAddress(addresses.vulnRouter)) {
    console.error("addresses.local.json ne contient pas vulnRouter. Redeploie la chaîne de démo (npm run demo:deploy -- --network localhost).");
    process.exit(1);
  }
  const usdc = new ethers.Contract(addresses.usdc, ERC20_ABI, provider);
  const wavax = new ethers.Contract(addresses.wavax, ERC20_ABI, provider);

  console.log("Chaîne : chainId " + addresses.chainId + " via " + addresses.rpcUrl);
  console.log("Routeur (honnête puis compromis) " + addresses.vulnRouter + " / pirate " + addresses.collector);

  const snapshot = await provider.send("evm_snapshot", []);
  console.log("evm_snapshot = " + snapshot + "\n");

  async function piratage(victim) {
    // La compromission : le pirate fait exécuter au routeur un transferFrom sur la victime,
    // dans la limite du droit qu'elle lui a laissé (min du droit et du solde).
    const allo = await usdc.allowance(victim.address, addresses.vulnRouter);
    const bal = await usdc.balanceOf(victim.address);
    const amount = allo < bal ? allo : bal;
    if (amount <= 0n) return 0n;
    const data = TRANSFER_FROM.encodeFunctionData("transferFrom", [victim.address, addresses.collector, amount]);
    const attacker = await provider.getSigner(addresses.collector);
    const router = new ethers.Contract(addresses.vulnRouter, VULN_ROUTER_ABI, attacker);
    try { await (await router.execute(addresses.usdc, data)).wait(); return amount; }
    catch { return 0n; }
  }

  try {
    // ---------- a) SANS Hold up : droit illimité au routeur ----------
    console.log("a) SANS Hold up (le site demande un droit ILLIMITÉ à son propre routeur)");
    {
      const u = await newUser(ctx);
      const start = await usdc.balanceOf(u.address);
      check("solde de départ = 100", start === START, f6(start));

      await (await usdc.connect(u).approve(addresses.vulnRouter, MAX)).wait();
      check("droit accordé = illimité", (await usdc.allowance(u.address, addresses.vulnRouter)) === MAX, "2^256-1");

      const router = new ethers.Contract(addresses.vulnRouter, VULN_ROUTER_ABI, u);
      await (await router.swapUSDCforWAVAX(AMOUNT, 0n)).wait();
      const afterSwap = await usdc.balanceOf(u.address);
      check("après l'échange de 50, il reste 50", afterSwap === START - AMOUNT, f6(afterSwap));
      check("l'échange a bien rendu de l'AVAX", (await wavax.balanceOf(u.address)) > 0n, f6(afterSwap) + " restants");
      check("le droit illimité n'a pas été entamé", (await usdc.allowance(u.address, addresses.vulnRouter)) === MAX, "toujours illimité");

      const collBefore = await usdc.balanceOf(addresses.collector);
      const took = await piratage(u);
      const afterHack = await usdc.balanceOf(u.address);
      const collAfter = await usdc.balanceOf(addresses.collector);
      check("piratage : le compte passe à 0", afterHack === 0n, f6(START - AMOUNT) + " -> " + f6(afterHack));
      check("le pirate prend les 50 restants (50 de plus que l'échange)", took === AMOUNT && collAfter - collBefore === AMOUNT, "+" + f6(collAfter - collBefore) + " DUSDC");
    }

    // ---------- b) AVEC Hold up : droit ramené à 50 ----------
    console.log("\nb) AVEC Hold up (le droit est ramené à 50 : le même approve, montant limité)");
    {
      const u = await newUser(ctx);
      const start = await usdc.balanceOf(u.address);
      check("solde de départ = 100", start === START, f6(start));

      // Hold up réécrit approve(routeur, illimité) en approve(routeur, 50) — même demande, montant limité.
      await (await usdc.connect(u).approve(addresses.vulnRouter, AMOUNT)).wait();
      check("droit ramené à 50", (await usdc.allowance(u.address, addresses.vulnRouter)) === AMOUNT, f6(AMOUNT) + " DUSDC");

      const router = new ethers.Contract(addresses.vulnRouter, VULN_ROUTER_ABI, u);
      await (await router.swapUSDCforWAVAX(AMOUNT, 0n)).wait();
      const afterSwap = await usdc.balanceOf(u.address);
      check("après l'échange de 50, il reste 50", afterSwap === START - AMOUNT, f6(afterSwap));
      check("l'échange a consommé tout le droit (droit restant 0)", (await usdc.allowance(u.address, addresses.vulnRouter)) === 0n, "0 DUSDC");

      const collBefore = await usdc.balanceOf(addresses.collector);
      const took = await piratage(u);
      const afterHack = await usdc.balanceOf(u.address);
      const collAfter = await usdc.balanceOf(addresses.collector);
      check("piratage : le compte garde ses 50", afterHack === START - AMOUNT, f6(afterHack));
      check("le pirate ne prend RIEN", took === 0n && collAfter - collBefore === 0n, "+" + f6(collAfter - collBefore) + " DUSDC");
    }
  } finally {
    const reverted = await provider.send("evm_revert", [snapshot]);
    console.log("\nevm_revert = " + reverted + " (état de la chaîne restauré)");
  }

  console.log("\nCe qui reste exposé dans le cas b) : rien de plus que l'opération elle-même. Les 50 du droit");
  console.log("sont exposés UNIQUEMENT entre le moment où ils sont accordés et l'échange qui les consomme ;");
  console.log("si l'utilisateur s'arrête là, ces 50 restent à la portée du routeur. Une fois l'échange fait,");
  console.log("le droit restant est 0 : le piratage ne prend rien.");
  console.log(failures === 0 ? "\nTOUT VERT" : "\n" + failures + " vérification(s) en échec");
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error("Erreur:", e.message || e); process.exit(1); });
