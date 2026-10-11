// pipeline_audit/dbg_order.mjs : vérifie si le résultat d'un cas dépend de l'ordre des appels (état partagé entre modes).
const M = await import(new URL('../pipeline/measure.mjs', import.meta.url).href);
const cases = M.readCases(new URL('../redteam/V2_DEV_norm.jsonl', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const t = cases.find((x) => x.id === 'V2-BENIGN_DEFI-00001').c;
const lv = async (m) => { const r = await M.runCase(t, m); return r.level + ' ' + (r.v.plus ? r.v.plus.signals.map((s) => s.code + ':' + s.severity).join(',') : ''); };
console.log('detectors seul        :', await lv('detectors'));
console.log('detectors encore      :', await lv('detectors'));
console.log('product               :', await lv('product'));
console.log('detectors après prod  :', await lv('detectors'));
console.log('live                  :', await lv('live'));
console.log('detectors après live  :', await lv('detectors'));
console.log('full                  :', await lv('full'));
console.log('detectors après full  :', await lv('detectors'));
console.log('det+known+intent+prem :', await lv('detectors+known+intent+premise'));
console.log('detectors après       :', await lv('detectors'));
