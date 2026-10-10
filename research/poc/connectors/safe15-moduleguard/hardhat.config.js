require("@nomicfoundation/hardhat-ethers");
const FORK = process.env.FORK === "1";
module.exports = {
  solidity: { version: "0.8.24", settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "paris" } },
  networks: {
    hardhat: {
      chainId: 43113,
      ...(FORK ? { forking: { url: "https://api.avax-test.network/ext/bc/C/rpc" }, hardfork: "cancun",
                   chains: { 43113: { hardforkHistory: { cancun: 0 } } } } : {}),
    },
  },
  mocha: { timeout: 300000 },
};
