// Re-read the produced file; compare template vs output; list filled fields by code.
import ExcelJS from 'exceljs';
import fs from 'node:fs';
const [,, tpl, out, jsonPath] = process.argv;
const inc = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const A = new ExcelJS.Workbook(), B = new ExcelJS.Workbook();
await A.xlsx.readFile(tpl); await B.xlsx.readFile(out);
console.log('sheets:', B.worksheets.map(w => `${w.name}`).join(' | '));
let ok = true;
const norm = (v) => v == null ? '' : (v && v.richText ? v.richText.map(t => t.text).join('') : (typeof v === 'object' ? JSON.stringify(v) : String(v)));
// 1) diff every cell of every sheet
let diffs = [];
for (const wa of A.worksheets) { const wb2 = B.getWorksheet(wa.name);
  const rows = Math.max(wa.rowCount, wb2.rowCount), cols = Math.max(wa.columnCount, wb2.columnCount);
  for (let r = 1; r <= rows; r++) for (let c = 1; c <= cols; c++) { const a = norm(wa.getCell(r, c).value), b = norm(wb2.getCell(r, c).value); if (a !== b) diffs.push(`${wa.name}!${wb2.getCell(r, c).address}: "${a.slice(0,20)}" -> "${b.slice(0,60)}"`); } }
console.log(`cells that differ from the official template: ${diffs.length}`); diffs.forEach(d => console.log('  ' + d));
// 2) by field code
const ts = B.getWorksheet('Type of submission'); const ws = B.getWorksheet('Initial notification');
const got = { '1.1': ts.getCell('A4').value };
const colOf = {}; ws.getRow(2).eachCell(c => colOf[String(c.value).trim()] = c.col);
for (const code of Object.keys(colOf)) { const vs = []; for (let r = 4; r < 40; r++) { const v = ws.getCell(r, colOf[code]).value; if (v != null && v !== '') vs.push(v); } if (vs.length) got[code] = vs.length === 1 ? vs[0] : vs; }
for (const [code, exp] of Object.entries(inc)) { if (code.startsWith('_')) continue;
  const e = Array.isArray(exp) ? exp : (exp === '' ? [] : [exp]); const g = got[code] == null ? [] : [].concat(got[code]);
  const same = JSON.stringify(e) === JSON.stringify(g); if (!same) ok = false;
  console.log(`${same ? 'OK  ' : 'FAIL'} ${code.padEnd(5)} ${(code === '1.1' ? 'Type of submission' : String(ws.getCell(3, colOf[code]).value).trim().slice(0, 55)).padEnd(55)} = ${JSON.stringify(g)}`); }
const extra = Object.keys(got).filter(k => !(k in inc)); if (extra.length) { ok = false; console.log('unexpected filled fields:', extra); }
console.log(ok ? 'READBACK: ALL FIELDS MATCH' : 'READBACK: MISMATCH'); process.exit(ok ? 0 : 1);
