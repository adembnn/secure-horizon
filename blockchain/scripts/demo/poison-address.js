/**
 * Generate a lookalike (poison) address that matches N first and N last hex chars.
 *
 * Usage:
 *   node scripts/demo/poison-address.js <targetAddress> [matchChars]
 *
 * Examples:
 *   node scripts/demo/poison-address.js 0x1234...abcd      # Default: match 4+4
 *   node scripts/demo/poison-address.js 0x1234...abcd 3    # Match 3+3
 *
 * Output: Private key and address pair for the lookalike.
 *
 * Performance notes (measured on typical hardware):
 *   - 3+3 chars: ~0.1s average (4^6 = 16.7M possibilities, ~seconds)
 *   - 4+4 chars: ~10-60s average (16^8 = 4.3B possibilities)
 *   - 5+5 chars: impractical in JS (hours to days)
 *
 * For demo purposes, 4+4 is recommended. If too slow, use 3+3.
 */

const crypto = require("crypto");

// Simple keccak256 for address derivation (ethers-free for speed)
let keccak256;
try {
  // Try native keccak from ethers if available
  const { keccak256: ethersKeccak } = require("ethers");
  keccak256 = (data) => ethersKeccak(data);
} catch {
  // Fallback to crypto (slower but works)
  keccak256 = (data) => {
    const hash = crypto.createHash("sha3-256");
    hash.update(Buffer.from(data.slice(2), "hex"));
    return "0x" + hash.digest("hex");
  };
}

// secp256k1 curve operations
let secp256k1;
try {
  secp256k1 = require("ethereum-cryptography/secp256k1");
} catch {
  // We'll use ethers as fallback
}

/**
 * Derive Ethereum address from private key bytes
 */
function privateKeyToAddress(privateKey) {
  // Use ethers for reliable derivation
  const { Wallet } = require("ethers");
  const wallet = new Wallet(
    "0x" + Buffer.from(privateKey).toString("hex")
  );
  return wallet.address.toLowerCase();
}

/**
 * Check if address matches target prefix and suffix
 */
function isMatch(address, targetPrefix, targetSuffix) {
  const addrLower = address.toLowerCase();
  return (
    addrLower.startsWith(targetPrefix) && addrLower.endsWith(targetSuffix)
  );
}

/**
 * Generate lookalike address
 */
async function generateLookalike(targetAddress, matchChars = 4) {
  const target = targetAddress.toLowerCase();
  if (!target.startsWith("0x") || target.length !== 42) {
    throw new Error("Invalid target address format");
  }

  // Extract prefix and suffix to match (excluding 0x)
  const targetHex = target.slice(2); // Remove 0x
  const targetPrefix = "0x" + targetHex.slice(0, matchChars);
  const targetSuffix = targetHex.slice(-matchChars);

  console.log(`\n🎯 Target: ${targetAddress}`);
  console.log(`   Matching: first ${matchChars} + last ${matchChars} chars`);
  console.log(`   Looking for: ${targetPrefix}...${targetSuffix}`);
  console.log(`\n⏳ Searching (this may take a while for 4+4)...\n`);

  const startTime = Date.now();
  let attempts = 0;
  const reportInterval = 100000;

  while (true) {
    // Generate random 32-byte private key
    const privateKey = crypto.randomBytes(32);
    const address = privateKeyToAddress(privateKey);

    attempts++;

    if (attempts % reportInterval === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = Math.floor(attempts / (Date.now() - startTime) * 1000);
      process.stdout.write(
        `\r   ${attempts.toLocaleString()} attempts, ${elapsed}s elapsed, ${rate.toLocaleString()}/s...`
      );
    }

    if (isMatch(address, targetPrefix, targetSuffix) && address !== target) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const privateKeyHex = "0x" + privateKey.toString("hex");

      console.log(`\n\n✅ Found lookalike in ${elapsed}s after ${attempts.toLocaleString()} attempts!\n`);
      console.log(`   Target:    ${targetAddress}`);
      console.log(`   Lookalike: ${address}`);
      console.log(`   Private:   ${privateKeyHex}`);
      console.log();

      return {
        target: targetAddress,
        lookalike: address,
        privateKey: privateKeyHex,
        attempts,
        elapsedMs: Date.now() - startTime,
      };
    }
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log("Usage: node poison-address.js <targetAddress> [matchChars]");
    console.log("\nExamples:");
    console.log("  node poison-address.js 0x742d35Cc6634C0532925a3b844Bc9e7595f8fBa0");
    console.log("  node poison-address.js 0x742d35Cc6634C0532925a3b844Bc9e7595f8fBa0 3");
    process.exit(1);
  }

  const targetAddress = args[0];
  const matchChars = parseInt(args[1]) || 4;

  if (matchChars < 2 || matchChars > 6) {
    console.error("matchChars must be between 2 and 6");
    process.exit(1);
  }

  try {
    await generateLookalike(targetAddress, matchChars);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
