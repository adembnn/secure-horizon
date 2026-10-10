const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(signer.address);
  const { chainId } = await hre.ethers.provider.getNetwork();
  console.log(`chainId ${chainId} | ${signer.address} | ${hre.ethers.formatEther(balance)} AVAX`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
