// Read-only: scan recent Fuji blocks for a tx that sends AVAX to a contract with calldata
// (likely to move value internally). Writes real-tx.json {hash, block, raw}. No key involved.
const { ethers } = require("ethers");
const URL = "https://api.avax-test.network/ext/bc/C/rpc";
const rpc = async (method, params = []) => {
  const r = await fetch(URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  const j = await r.json(); if (j.error) throw new Error(j.error.message); return j.result;
};
(async () => {
  const head = parseInt(await rpc("eth_blockNumber"), 16);
  const cands = [];
  for (let n = head - 50; n > head - 4000 && cands.length < 1; n--) {
    const b = await rpc("eth_getBlockByNumber", ["0x" + n.toString(16), true]);
    for (const tx of b.transactions) {
      if (!tx.to || tx.input === "0x" || BigInt(tx.value) === 0n || tx.type !== "0x2" && tx.type !== "0x0") continue;
      if ((await rpc("eth_getCode", [tx.to, "latest"])) === "0x") continue;
      // must be the sender's first tx in this block and nonce must match state at n-1
      const nonce = parseInt(await rpc("eth_getTransactionCount", [tx.from, "0x" + (n - 1).toString(16)]), 16);
      if (nonce !== parseInt(tx.nonce, 16) || b.transactions.filter(t => t.from === tx.from).length !== 1) continue;
      const t = ethers.Transaction.from({
        type: parseInt(tx.type, 16), chainId: parseInt(tx.chainId, 16), nonce: parseInt(tx.nonce, 16), to: tx.to, value: tx.value, data: tx.input,
        gasLimit: tx.gas, gasPrice: tx.type === "0x0" ? tx.gasPrice : undefined,
        maxFeePerGas: tx.maxFeePerGas, maxPriorityFeePerGas: tx.maxPriorityFeePerGas, accessList: tx.accessList,
        signature: { r: tx.r, s: tx.s, v: parseInt(tx.v, 16) },
      });
      if (t.hash.toLowerCase() !== tx.hash.toLowerCase()) { console.error("hash mismatch, skip", tx.hash); continue; }
      cands.push({ hash: tx.hash, block: n, from: tx.from, to: tx.to, value: BigInt(tx.value).toString(), raw: t.serialized });
      break;
    }
  }
  if (!cands.length) { console.error("no candidate"); process.exit(1); }
  require("fs").writeFileSync(__dirname + "/../real-tx.json", JSON.stringify(cands[0], null, 1));
  console.log(JSON.stringify({ ...cands[0], raw: cands[0].raw.slice(0, 20) + "..." }));
})();
