const hre = require("hardhat");
const { ethers } = require("ethers");
const p = hre.network.provider;
const rpc = (m, a = []) => p.send(m, a);

// Extract internal value transfers from default structLogs (Hardhat 2 has no callTracer).
// Tracks the executing address per depth so "from" is the real caller frame.
function transfersFromStructLogs(logs, topTo) {
  const out = [], frames = [topTo.toLowerCase()];
  let pending = null;
  for (const l of logs) {
    if (pending && l.depth === pending.depth + 1) frames[l.depth - 1] = pending.addr;
    pending = null;
    frames.length = l.depth;
    const st = l.stack, n = st.length;
    const addr = (i) => "0x" + st[n - i].slice(-40);
    if (l.op === "CALL" || l.op === "CALLCODE") {
      const val = BigInt("0x" + st[n - 3]);
      if (val > 0n) out.push({ depth: l.depth, op: l.op, from: frames[l.depth - 1], to: addr(2), wei: val.toString() });
      pending = { depth: l.depth, addr: l.op === "CALL" ? addr(2) : frames[l.depth - 1] };
    } else if (l.op === "STATICCALL") pending = { depth: l.depth, addr: addr(2) };
    else if (l.op === "DELEGATECALL") pending = { depth: l.depth, addr: frames[l.depth - 1] };
    else if (l.op === "CREATE" || l.op === "CREATE2") {
      const val = BigInt("0x" + st[n - 1]);
      if (val > 0n) out.push({ depth: l.depth, op: l.op, from: frames[l.depth - 1], to: "(new contract)", wei: val.toString() });
    }
  }
  return out;
}
const maxDepth = (logs) => logs.reduce((m, l) => Math.max(m, l.depth), 0);
const opCounts = (logs) => { const c = {}; for (const l of logs) if (/CALL|CREATE/.test(l.op)) c[l.op] = (c[l.op] || 0) + 1; return c; };

(async () => {
  const bn = parseInt(await rpc("eth_blockNumber"), 16);
  console.log("forked chainId", await rpc("eth_chainId"), "block", bn);
  const [deployer, a, b] = await rpc("eth_accounts");
  const art = await hre.artifacts.readArtifact("Splitter");
  const iface = new ethers.Interface(art.abi);

  const dh = await rpc("eth_sendTransaction", [{ from: deployer, data: art.bytecode }]);
  const splitter = (await rpc("eth_getTransactionReceipt", [dh])).contractAddress;
  console.log("Splitter deployed in fork at", splitter);
  const th = await rpc("eth_sendTransaction", [{
    from: deployer, to: splitter, value: "0x" + (10n ** 18n).toString(16),
    data: iface.encodeFunctionData("split", [a, b]), gas: "0x100000",
  }]);
  console.log("local tx", th, "(1 AVAX sent to Splitter; a=" + a + " b=" + b + ")");

  console.log("\n=== A. debug_traceTransaction, LOCAL tx in Fuji fork ===");
  const s = await rpc("debug_traceTransaction", [th]);
  console.log("gas", s.gas, "failed", s.failed, "structLogs", s.structLogs.length, "maxDepth", maxDepth(s.structLogs), "call ops", JSON.stringify(opCounts(s.structLogs)));
  console.log("raw structLog sample (CALL step with value):");
  const callStep = s.structLogs.find(l => l.op === "CALL");
  console.log(JSON.stringify({ depth: callStep.depth, op: callStep.op, pc: callStep.pc, gas: callStep.gas, stack_top7: callStep.stack.slice(-7) }, null, 1));
  console.log("internal value transfers (extracted):");
  console.table(transfersFromStructLogs(s.structLogs, splitter));

  console.log("\n=== B. REAL Fuji tx, signed by its original sender, replayed in the fork (fork block = original block - 1) ===");
  const real = require("../real-tx.json");
  console.log("original tx", real.hash, "block", real.block, "to", real.to, "value(wei)", real.value);
  const rh = await rpc("eth_sendRawTransaction", [real.raw]);
  const rr = await rpc("eth_getTransactionReceipt", [rh]);
  console.log("replayed hash", rh, "same as original:", rh.toLowerCase() === real.hash.toLowerCase(), "status", rr.status, "gasUsed", parseInt(rr.gasUsed, 16));
  const rt = await rpc("debug_traceTransaction", [rh]);
  console.log("structLogs", rt.structLogs.length, "maxDepth", maxDepth(rt.structLogs), "call ops", JSON.stringify(opCounts(rt.structLogs)));
  const called = [];
  for (const l of rt.structLogs) if (/^(CALL|STATICCALL|DELEGATECALL|CALLCODE)$/.test(l.op)) called.push(l.depth + " " + l.op + " -> 0x" + l.stack[l.stack.length - 2].slice(-40));
  console.log("first internal calls:\n  " + called.slice(0, 8).join("\n  "));
  const tr = transfersFromStructLogs(rt.structLogs, real.to);
  console.log("internal value transfers (value>0):", tr.length ? "" : "none in this tx");
  if (tr.length) console.table(tr);
})().catch(e => { console.error("FATAL", e); process.exit(1); });
