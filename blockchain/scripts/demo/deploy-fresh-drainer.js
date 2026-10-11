/**
 * Deploy a single fresh FreshDrainer contract.
 * Used for live demo - deploying a brand-new drainer in < 10s.
 *
 * Usage:
 *   npx hardhat run scripts/demo/deploy-fresh-drainer.js --network hardhat
 *   npx hardhat run scripts/demo/deploy-fresh-drainer.js --network fuji
 *
 * Optional: Set COLLECTOR_ADDRESS env var to specify collector.
 *           Defaults to deployer address.
 */

const hre = require("hardhat");

async function main() {
  const network = hre.network.name;
  const startTime = Date.now();

  console.log(`\n🦠 Deploying fresh drainer to ${network}...`);

  const [deployer] = await hre.ethers.getSigners();
  const collector = process.env.COLLECTOR_ADDRESS || deployer.address;

  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  Collector: ${collector}`);

  const FreshDrainer = await hre.ethers.getContractFactory("FreshDrainer");
  const drainer = await FreshDrainer.deploy(collector);
  await drainer.waitForDeployment();

  const address = await drainer.getAddress();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n✅ FreshDrainer deployed in ${elapsed}s`);
  console.log(`   Address: ${address}`);

  if (network === "fuji") {
    console.log(
      `   Snowtrace: https://testnet.snowtrace.io/address/${address}`
    );
  }

  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
