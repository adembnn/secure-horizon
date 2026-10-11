// Hardhat config used ONLY by `npm run anchor:local` / `anchor:fuji`.
// It compiles research/titouan/T_banc_e2e/anchor/contracts/EvidenceAnchor.sol WITHOUT touching that
// folder: the file is copied into blockchain/cache/anchor/ (cache/ is gitignored) and compiled there,
// with its own artifacts and cache. Networks and keys come from hardhat.config.js unchanged.
const fs = require("fs");
const path = require("path");
const base = require("./hardhat.config.js");

const root = path.join(__dirname, "cache", "anchor");
const src = path.join(root, "contracts");
fs.mkdirSync(src, { recursive: true });
fs.copyFileSync(
  path.join(__dirname, "..", "research", "titouan", "T_banc_e2e", "anchor", "contracts", "EvidenceAnchor.sol"),
  path.join(src, "EvidenceAnchor.sol")
);

module.exports = {
  ...base,
  paths: { sources: src, artifacts: path.join(root, "artifacts"), cache: path.join(root, "hh-cache") },
};
