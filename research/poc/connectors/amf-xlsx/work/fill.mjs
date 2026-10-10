// Fill the official AMF DORA incident template (v1.2) from a JSON of fields 1.x / 2.x.
import ExcelJS from 'exceljs';
import fs from 'node:fs';
const [,, tpl, jsonPath, out] = process.argv;
const inc = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(tpl);

// --- list reference: allowed labels per dropdown (columns read from the template itself)
const lr = wb.getWorksheet('List reference');
const colVals = (L) => { const o = []; for (let r = 2; r < 80; r++) { const v = lr.getCell(L + r).value; if (v != null && v !== '') o.push(String(v).trim()); } return o; };
const LISTS = { '1.1': colVals('E'), '1.4': colVals('H'), '1.15': colVals('J'), '2.5': colVals('N'), '2.6': colVals('P'), '2.7': colVals('T'), '2.9': colVals('B') };

const errors = [];
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
function check(code, val) {
  if (LISTS[code] && !LISTS[code].includes(val)) errors.push(`${code}: "${val}" not in template list (${LISTS[code].length} options)`);
  if (['1.3a','1.6','1.14'].includes(code) && val && !/^[A-Z0-9]{20}$/.test(val)) errors.push(`${code}: LEI must be 20 alphanumeric`);
  if (['1.8','1.11'].includes(code) && !(/@/.test(val) && /\./.test(val) && !/ /.test(val))) errors.push(`${code}: invalid email`);
  if (['2.2','2.3'].includes(code) && !ISO.test(val)) errors.push(`${code}: need YYYY-MM-DDThh:mm:ssZ`);
}

// --- 1.1 on 'Type of submission' (row 4)
const ts = wb.getWorksheet('Type of submission');
check('1.1', inc['1.1']); ts.getCell('A4').value = inc['1.1'];

// --- 1.2..2.10 on 'Initial notification': find the column of each code in row 2, data starts row 4
const ws = wb.getWorksheet('Initial notification');
const colOf = {};
ws.getRow(2).eachCell((c) => { colOf[String(c.value).trim()] = c.col; });
const written = [];
for (const [code, v] of Object.entries(inc)) {
  if (code.startsWith('_') || code === '1.1') continue;
  if (!colOf[code]) { errors.push(`${code}: column not found in template`); continue; }
  const vals = Array.isArray(v) ? v : [v];            // multi-select: one value per row
  vals.forEach((x, i) => {
    if (x === '' || x == null) return;
    check(code, x);
    ws.getCell(4 + i, colOf[code]).value = x;
    written.push(`${ws.getCell(4 + i, colOf[code]).address}<=${code}`);
  });
}
if (errors.length) { console.error('VALIDATION ERRORS:\n' + errors.join('\n')); process.exit(2); }
await wb.xlsx.writeFile(out);
console.log(`wrote ${out}: ${written.length} cells (+1.1) -> ${written.join(' ')}`);
