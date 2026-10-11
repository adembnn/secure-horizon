/**
 * Voie B (Hardhat) : deploie EvidenceAnchor sur Fuji. Style de blockchain/scripts/demo/deploy-all.js.
 *
 * Mise en place (sans toucher au dossier blockchain/ existant a part la copie du .sol) :
 *   copy research\titouan\T_banc_e2e\anchor\contracts\EvidenceAnchor.sol  blockchain\contracts\anchor\EvidenceAnchor.sol
 *   copy research\titouan\T_banc_e2e\anchor\hardhat\deploy_anchor.js       blockchain\scripts\anchor\deploy_anchor.js
 * Puis, dans blockchain\ (PRIVATE_KEY dans .env, comme hardhat.config.js existant) :
 *   npx hardhat run scripts/anchor/deploy_anchor.js --network fuji
 * Ensuite, pour consigner : node deploy_anchor.mjs --record <adresse> <txHash>   (dans anchor\)
 */
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const network = hre.network.name;
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying EvidenceAnchor to ${network} from ${deployer.address}`);
  const F = await hre.ethers.getContractFactory("EvidenceAnchor");
  const c = await F.deploy();
  await c.waitForDeployment();
  const addr = await c.getAddress();
  const tx = c.deploymentTransaction().hash;
  console.log(`  EvidenceAnchor: ${addr}\n  tx: ${tx}\n  https://testnet.snowtrace.io/address/${addr}`);
  const out = path.join(__dirname, "..", "..", "anchor_deployment.json");
  fs.writeFileSync(out, JSON.stringify({ network, address: addr, txHash: tx }, null, 2));
  console.log(`Saved ${out}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
