import ExcelJS from 'exceljs';
const wb=new ExcelJS.Workbook(); await wb.xlsx.readFile('../dl/dora-incident-reporting-template-v1.2.xlsx');
const t=wb.getWorksheet('Type of submission'); t.eachRow((r,n)=>r.eachCell(c=>console.log('TYPE',c.address,JSON.stringify(c.value))));
console.log('TYPE dv',JSON.stringify(t.dataValidations.model));
const w=wb.getWorksheet('Initial notification');
console.log('merges',JSON.stringify(w.model.merges));
for(let r=1;r<=8;r++){const row=w.getRow(r);console.log('row',r,'h=',row.height,'hidden=',row.hidden);}
w.getRow(3).eachCell(c=>console.log(w.getRow(2).getCell(c.col).value, '|', String(c.value).replace(/\s+/g,' ')));
console.log('DV',JSON.stringify(w.dataValidations.model,null,0));
for(const r of [4,5,6]) w.getRow(r).eachCell({includeEmpty:true},c=>{if(c.value!==null)console.log('data',c.address,JSON.stringify(c.value))});
console.log('defined names',JSON.stringify(wb.definedNames.model).slice(0,1500));
console.log('protection',JSON.stringify(w.sheetProtection));
const ref=wb.getWorksheet('List reference');
