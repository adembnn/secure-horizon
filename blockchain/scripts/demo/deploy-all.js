/**
 * Deploy all demo contracts and save addresses to deployments file.
 *
 * Usage:
 *   npx hardhat run scripts/demo/deploy-all.js --network hardhat
 *   npx hardhat run scripts/demo/deploy-all.js --network fuji
 *
 * Requires PRIVATE_KEY env var for Fuji deployment.
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const network = hre.network.name;
  console.log(`\n🚀 Deploying demo contracts to ${network}...\n`);

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${hre.ethers.formatEther(balance)} AVAX\n`);

  // Deploy DemoUSDC
  console.log("Deploying DemoUSDC...");
  const DemoUSDC = await hre.ethers.getContractFactory("DemoUSDC");
  const usdc = await DemoUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddr = await usdc.getAddress();
  console.log(`  DemoUSDC: ${usdcAddr}`);

  // Deploy DemoWAVAX
  console.log("Deploying DemoWAVAX...");
  const DemoWAVAX = await hre.ethers.getContractFactory("DemoWAVAX");
  const wavax = await DemoWAVAX.deploy();
  await wavax.waitForDeployment();
  const wavaxAddr = await wavax.getAddress();
  console.log(`  DemoWAVAX: ${wavaxAddr}`);

  // Deploy DemoNFT
  console.log("Deploying DemoNFT...");
  const DemoNFT = await hre.ethers.getContractFactory("DemoNFT");
  const nft = await DemoNFT.deploy();
  await nft.waitForDeployment();
  const nftAddr = await nft.getAddress();
  console.log(`  DemoNFT: ${nftAddr}`);

  // Deploy DemoRouter (USDC <-> WAVAX)
  console.log("Deploying DemoRouter...");
  const DemoRouter = await hre.ethers.getContractFactory("DemoRouter");
  const router = await DemoRouter.deploy(usdcAddr, wavaxAddr);
  await router.waitForDeployment();
  const routerAddr = await router.getAddress();
  console.log(`  DemoRouter: ${routerAddr}`);

  // Deploy FreshDrainer with deployer as collector
  console.log("Deploying FreshDrainer (collector: deployer)...");
  const FreshDrainer = await hre.ethers.getContractFactory("FreshDrainer");
  const drainer = await FreshDrainer.deploy(deployer.address);
  await drainer.waitForDeployment();
  const drainerAddr = await drainer.getAddress();
  console.log(`  FreshDrainer: ${drainerAddr}`);

  // Seed router with liquidity for demo
  console.log("\nSeeding router with liquidity...");
  const USDC_AMOUNT = hre.ethers.parseUnits("100000", 6); // 100k USDC
  const WAVAX_AMOUNT = hre.ethers.parseEther("1000"); // 1000 WAVAX

  await usdc.mint(deployer.address, USDC_AMOUNT);
  await wavax.mint(deployer.address, WAVAX_AMOUNT);
  await usdc.approve(routerAddr, USDC_AMOUNT);
  await wavax.approve(routerAddr, WAVAX_AMOUNT);
  await router.addLiquidity(USDC_AMOUNT, WAVAX_AMOUNT);
  console.log("  ✅ Router seeded with 100k DUSDC + 1000 DWAVAX\n");

  // Save deployments
  const deployments = {
    network,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      DemoUSDC: usdcAddr,
      DemoWAVAX: wavaxAddr,
      DemoNFT: nftAddr,
      DemoRouter: routerAddr,
      FreshDrainer: drainerAddr,
    },
  };

  const deploymentsPath = path.join(
    __dirname,
    `deployments.${network}.json`
  );
  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log(`📝 Deployments saved to: ${deploymentsPath}`);

  // Print explorer links for Fuji
  if (network === "fuji") {
    console.log("\n🔗 Snowtrace testnet links:");
    console.log(
      `  DemoUSDC: https://testnet.snowtrace.io/address/${usdcAddr}`
    );
    console.log(
      `  DemoWAVAX: https://testnet.snowtrace.io/address/${wavaxAddr}`
    );
    console.log(`  DemoNFT: https://testnet.snowtrace.io/address/${nftAddr}`);
    console.log(
      `  DemoRouter: https://testnet.snowtrace.io/address/${routerAddr}`
    );
    console.log(
      `  FreshDrainer: https://testnet.snowtrace.io/address/${drainerAddr}`
    );
  }

  console.log("\n✅ All demo contracts deployed successfully!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
