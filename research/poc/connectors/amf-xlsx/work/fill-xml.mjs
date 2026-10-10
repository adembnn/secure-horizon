// LOSSLESS variant: same inputs as fill.mjs, but patches the cells directly in the sheet XML of the official
// .xlsx (via jszip), so dropdown validations (x14), defined names, workbook/sheet protection are kept byte-for-byte.
// exceljs is still used to read the template (headers, allowed lists) and to validate values.
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import fs from 'node:fs';
const [,, tpl, jsonPath, out] = process.argv;
const inc = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const wb = new ExcelJS.Workbook(); await wb.xlsx.readFile(tpl);
const lr = wb.getWorksheet('List reference');
const colVals = (L) => { const o = []; for (let r = 2; r < 80; r++) { const v = lr.getCell(L + r).value; if (v != null && v !== '') o.push(String(v).trim()); } return o; };
const LISTS = { '1.1': colVals('E'), '1.4': colVals('H'), '1.15': colVals('J'), '2.5': colVals('N'), '2.6': colVals('P'), '2.7': colVals('T'), '2.9': colVals('B') };
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/; const errors = [];
function check(code, val) {
  if (LISTS[code] && !LISTS[code].includes(val)) errors.push(`${code}: "${val}" not in template list`);
  if (['1.3a','1.6','1.14'].includes(code) && val && !/^[A-Z0-9]{20}$/.test(val)) errors.push(`${code}: LEI must be 20 alphanumeric`);
  if (['1.8','1.11'].includes(code) && !(/@/.test(val) && /\./.test(val) && !/ /.test(val))) errors.push(`${code}: invalid email`);
  if (['2.2','2.3'].includes(code) && !ISO.test(val)) errors.push(`${code}: need YYYY-MM-DDThh:mm:ssZ`);
}
const colLetter = (n) => { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
const ws = wb.getWorksheet('Initial notification'); const colOf = {};
ws.getRow(2).eachCell((c) => { colOf[String(c.value).trim()] = c.col; });

// map sheet name -> xml path
const zip = await JSZip.loadAsync(fs.readFileSync(tpl));
const wbxml = await zip.file('xl/workbook.xml').async('string');
const rels = await zip.file('xl/_rels/workbook.xml.rels').async('string');
const sheetPath = (name) => {
  const rid = new RegExp(`<sheet [^>]*name="${name}"[^>]*r:id="(rId\[0-9]+)"`).exec(wbxml)[1];
  const t = new RegExp(`<Relationship [^>]*Id="${rid}"[^>]*Target="([^"]+)"|<Relationship [^>]*Target="([^"]+)"[^>]*Id="${rid}"`).exec(rels);
  return 'xl/' + (t[1] || t[2]);
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
async function setCells(sheetName, cells) {   // cells: {A1: 'text'}
  const p = sheetPath(sheetName); let xml = await zip.file(p).async('string');
  for (const [addr, val] of Object.entries(cells)) {
    const re = new RegExp(`<c r="${addr}"( s="[0-9]+")?\s*/>`);
    if (!re.test(xml)) { errors.push(`${sheetName}!${addr}: empty template cell not found`); continue; }
    xml = xml.replace(re, (_m, s) => `<c r="${addr}"${s || ''} t="inlineStr"><is><t xml:space="preserve">${esc(val)}</t></is></c>`);
  }
  zip.file(p, xml);
}
check('1.1', inc['1.1']);
await setCells('Type of submission', { A4: inc['1.1'] });
const cells = {};
for (const [code, v] of Object.entries(inc)) {
  if (code.startsWith('_') || code === '1.1') continue;
  if (!colOf[code]) { errors.push(`${code}: column not found`); continue; }
  (Array.isArray(v) ? v : [v]).forEach((x, i) => { if (x === '' || x == null) return; check(code, x); cells[colLetter(colOf[code]) + (4 + i)] = x; });
}
await setCells('Initial notification', cells);
if (errors.length) { console.error('ERRORS:\n' + errors.join('\n')); process.exit(2); }
fs.writeFileSync(out, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
console.log(`wrote ${out}: ${Object.keys(cells).length + 1} cells -> ${Object.keys(cells).join(' ')}`);
