// Usage : node score_verdicts.mjs verdicts.jsonl  (chaque ligne : {"address":"0x..","score":0..1}) -> métriques sur le TEST, comparables aux références.
import fs from "node:fs";
import { report } from "./metrics.mjs";
const idx = Object.fromEntries(fs.readFileSync("data/indices_spenders.jsonl", "utf8").trim().split("\n").map(l => JSON.parse(l)).map(r => [r.address.toLowerCase(), r]));
const v = fs.readFileSync(process.argv[2], "utf8").trim().split("\n").map(l => JSON.parse(l));
const rows = v.map(x => ({ label: idx[x.address.toLowerCase()]?.label, split: idx[x.address.toLowerCase()]?.split, score: Number(x.score) })).filter(r => r.label !== undefined && r.split === "test");
console.log(JSON.stringify(report(process.argv[3] || "modele", rows), null, 1));
