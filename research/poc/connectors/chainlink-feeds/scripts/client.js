// ONE client function reads ANY Chainlink AggregatorV3 feed (real Fuji or local mock).
const { JsonRpcProvider, Contract } = require("ethers");
const fs = require("fs");
const ABI = [
  "function decimals() view returns (uint8)",
  "function description() view returns (string)",
  "function latestRoundData() view returns (uint80 roundId,int256 answer,uint256 startedAt,uint256 updatedAt,uint80 answeredInRound)",
];
async function readFeed(label, rpc, address) {
  const p = new JsonRpcProvider(rpc);
  const net = await p.getNetwork();
  const c = new Contract(address, ABI, p); // read-only: no signer, eth_call only
  const [dec, desc, r] = await Promise.all([c.decimals(), c.description(), c.latestRoundData()]);
  const out = {
    label, chainId: Number(net.chainId), address, description: desc, decimals: Number(dec),
    roundId: r.roundId.toString(), answerRaw: r.answer.toString(),
    answerHuman: Number(r.answer) / 10 ** Number(dec),
    updatedAt: Number(r.updatedAt), updatedAtISO: new Date(Number(r.updatedAt) * 1000).toISOString(),
    ageSeconds: Math.floor(Date.now() / 1000) - Number(r.updatedAt),
  };
  console.log(JSON.stringify(out, null, 2));
  return out;
}
(async () => {
  const FUJI = "https://api.avax-test.network/ext/bc/C/rpc";
  const FUJI_AVAXUSD = "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD"; // docs.chain.link, Avalanche Fuji AVAX/USD
  const LOCAL = "http://127.0.0.1:8545";
  const mock = fs.readFileSync("mock-address.txt", "utf8").trim();
  const a = await readFeed("REAL Fuji AVAX/USD", FUJI, FUJI_AVAXUSD);
  const b = await readFeed("MOCK local (synthetic PoR)", LOCAL, mock);
  if (a.chainId !== 43113) throw new Error("not Fuji");
  if (b.chainId !== 31337) throw new Error("not local");
  console.log("OK: same readFeed() code read both feeds");
})().catch(e => { console.error("FAIL", e); process.exit(1); });
