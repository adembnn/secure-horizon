// Local Hardhat 2 node forking Avalanche Fuji (43113). FORK_BLOCK pins the fork block (optional).
const forking = { url: "https://api.avax-test.network/ext/bc/C/rpc" };
if (process.env.FORK_BLOCK) forking.blockNumber = Number(process.env.FORK_BLOCK);
module.exports = {
  solidity: { version: "0.8.24", settings: { evmVersion: "paris" } },
  networks: { hardhat: { chainId: 43113, hardfork: "cancun", forking, initialBaseFeePerGas: 1 } },
};
