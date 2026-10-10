require("@nomicfoundation/hardhat-ethers");
module.exports = {
  solidity: { compilers: [{ version: "0.8.21", settings: { evmVersion: "shanghai", optimizer: { enabled: true, runs: Number(process.env.RUNS || 100) } } }] },
  networks: { hardhat: { allowUnlimitedContractSize: !process.env.OFFICIAL, accounts: { count: 6 }, ...(process.env.FORK ? { forking: { url: "https://api.avax-test.network/ext/bc/C/rpc" }, chainId: 43113 } : {}) } },
  mocha: { timeout: 120000 },
};
