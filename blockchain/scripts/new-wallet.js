// Generates a dedicated hackathon wallet and writes it to .env (never committed).
const fs = require("fs");
const path = require("path");
const { Wallet } = require("ethers");

const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath) && /PRIVATE_KEY=0x/.test(fs.readFileSync(envPath, "utf8"))) {
  console.error(".env already holds a PRIVATE_KEY — refusing to overwrite.");
  process.exit(1);
}
const wallet = Wallet.createRandom();
fs.writeFileSync(
  envPath,
  `# Hackathon-only wallet (Fuji testnet). Never put real funds here.\n` +
    `PRIVATE_KEY=${wallet.privateKey}\n` +
    `WALLET_ADDRESS=${wallet.address}\n` +
    `FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc\n`
);
console.log(wallet.address);
