import fs from "node:fs";
const bl = new Set(JSON.parse(fs.readFileSync("data/address.json","utf8")).map(a=>a.toLowerCase()));
console.log("adresses liste ScamSniffer:", bl.size);
const txs = fs.readFileSync("data/cchain_sample.jsonl","utf8").trim().split("\n").map(l=>JSON.parse(l));
const w=(s,i)=>s.slice(10+i*64,10+(i+1)*64), A=x=>"0x"+x.slice(24);
let hit=[];
for(const t of txs){ const c=[t.from,t.to]; const s=(t.input||"").slice(2,10);
  if(["095ea7b3","a9059cbb","a22cb465"].includes(s)) c.push(A(w(t.input,0))); if(s==="d505accf") c.push(A(w(t.input,1)));
  if(c.some(a=>a&&bl.has(a.toLowerCase()))) hit.push(t.hash); }
console.log("tx de l'échantillon touchant une adresse listée:", hit.length, "/", txs.length, hit.slice(0,5));
