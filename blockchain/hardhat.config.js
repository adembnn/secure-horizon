require("@nomicfoundation/hardhat-toolbox");
const path = require("path");
const dotenv = require("dotenv");

// Repo-root .env first (FUJI_PRIVATE_KEY lives there), then blockchain/.env.
// dotenv never overrides a variable that is already set. Nothing is printed.
dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config({ path: path.join(__dirname, ".env") });

const { FUJI_RPC_URL } = process.env;

// FUJI_PRIVATE_KEY first, PRIVATE_KEY as legacy fallback. Ignore malformed
// values (placeholders such as "0x...") instead of crashing every command.
function pickKey() {
  for (const raw of [process.env.FUJI_PRIVATE_KEY, process.env.PRIVATE_KEY]) {
    const k = (raw || "").trim();
    if (/^(0x)?[0-9a-fA-F]{64}$/.test(k)) return k.startsWith("0x") ? k : "0x" + k;
  }
  return null;
}
const KEY = pickKey();

// HOLDUP_CHAIN_MODE: "fork" = local fork of Avalanche C-Chain (chainId 43114),
// anything else = plain offline local chain (chainId 31337 unless overridden).
const MODE = (process.env.HOLDUP_CHAIN_MODE || "plain").toLowerCase();
const FORK_URL = process.env.HOLDUP_FORK_URL || "https://api.avax.network/ext/bc/C/rpc";
const FORK_BLOCK = process.env.HOLDUP_FORK_BLOCK ? Number(process.env.HOLDUP_FORK_BLOCK) : undefined;

const hardhat = {};
if (MODE === "fork") {
  hardhat.chainId = Number(process.env.HOLDUP_CHAIN_ID || 43114);
  hardhat.forking = FORK_BLOCK ? { url: FORK_URL, blockNumber: FORK_BLOCK } : { url: FORK_URL };
} else if (process.env.HOLDUP_CHAIN_ID) {
  hardhat.chainId = Number(process.env.HOLDUP_CHAIN_ID);
}

module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat,
    localhost: { url: `http://127.0.0.1:${process.env.HOLDUP_PORT || 8545}` },
    fuji: {
      url: FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: KEY ? [KEY] : [],
    },
  },
};
