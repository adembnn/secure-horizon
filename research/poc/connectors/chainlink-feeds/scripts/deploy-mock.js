// Deploys MockV3Aggregator on the local Hardhat node using its unlocked dev account (no key in code).
const { JsonRpcProvider, ContractFactory } = require("ethers");
const fs = require("fs");
(async () => {
  const art = require("../artifacts/@chainlink/contracts/src/v0.8/shared/mocks/MockV3Aggregator.sol/MockV3Aggregator.json");
  const p = new JsonRpcProvider("http://127.0.0.1:8545");
  const signer = await p.getSigner(0);
  const m = await new ContractFactory(art.abi, art.bytecode, signer).deploy(8, 100000000000000n);
  await m.waitForDeployment();
  const addr = await m.getAddress();
  fs.writeFileSync("mock-address.txt", addr);
  console.log("MockV3Aggregator deployed at", addr, "(local chain 31337)");
})().catch(e => { console.error(e); process.exit(1); });
