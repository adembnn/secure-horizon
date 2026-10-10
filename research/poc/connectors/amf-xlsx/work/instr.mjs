import ExcelJS from 'exceljs';
const wb=new ExcelJS.Workbook(); await wb.xlsx.readFile('../dl/dora-incident-reporting-template-v1.2.xlsx');
const ws=wb.getWorksheet('Reporting instructions');
const txt=(c)=>{let v=c.value;if(v&&v.richText)v=v.richText.map(t=>t.text).join('');return v==null?'':String(v).replace(/\s+/g,' ')};
const hdr=[];ws.getRow(20).eachCell(c=>hdr.push(c.address+':'+txt(c).slice(0,25)));console.log(hdr.join(' | '));
ws.eachRow((r,n)=>{const a=txt(r.getCell(1)); if(/^[12]\.\d+[ab]?$/.test(a)){
  const seen=new Set(),out=[];r.eachCell(c=>{if(c.isMerged&&c.master!==c)return;const t=txt(c);if(t)out.push(t.slice(0,230))});console.log(n,out.join(' || '));}});
const lr=wb.getWorksheet('List reference');
const col=(L)=>{const o=[];for(let r=2;r<60;r++){const v=lr.getCell(L+r).value;if(v)o.push(String(v).trim())}return o};
for(const L of ['E','H','N','T','AF','AI'])console.log(L,col(L).join(' ; '));
