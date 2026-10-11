import fs from 'node:fs';
const L = fs.readFileSync(new URL('./malveillants.jsonl', import.meta.url), 'utf8').trim().split('\n');
const req = ['id','synthetic','notice','family','subfamily','request','context','intent','label','reason','expected_severity','ideal_severity','source','hard','split'];
const fam = {}; let hard = 0, bad = 0; const ids = new Set();
for (const [i, l] of L.entries()) {
  let o; try { o = JSON.parse(l); } catch { console.log('bad json', i); bad++; continue; }
  for (const k of req) if (!(k in o)) { console.log(o.id, 'missing', k); bad++; }
  if (o.synthetic !== true || o.split !== 'BLIND' || o.expected_severity !== 'critical' || !/^BLIND-M-\d{3}$/.test(o.id)) { console.log(o.id, 'bad const'); bad++; }
  if (ids.has(o.id)) { console.log('dup', o.id); bad++; } ids.add(o.id);
  if (!o.request.method || !o.request.params) { console.log(o.id, 'bad request'); bad++; }
  if (o.request.method === 'eth_signTypedData_v4') { try { const t = JSON.parse(o.request.params[1]); if (!t.types || !t.domain || !t.primaryType || !t.message) throw 0; } catch { console.log(o.id, 'bad typed'); bad++; } }
  if (![1,43113,43114].includes(o.context.chainId)) { console.log(o.id, 'chain'); bad++; }
  fam[o.family] = (fam[o.family] || 0) + 1; if (o.hard) hard++;
}
console.log(L.length, 'lines; hard', hard, 'bad', bad); console.log(fam);
const chains = {}; for (const l of L) { const c = JSON.parse(l).context.chainId; chains[c] = (chains[c]||0)+1; } console.log(chains);
