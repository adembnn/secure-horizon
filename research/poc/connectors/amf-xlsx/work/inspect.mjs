import ExcelJS from 'exceljs';
const wb=new ExcelJS.Workbook(); await wb.xlsx.readFile(process.argv[2]);
for(const ws of wb.worksheets){
  console.log(`\n=== [${ws.name}] state=${ws.state} rows=${ws.rowCount} cols=${ws.columnCount} dv=${Object.keys(ws.dataValidations?.model||{}).length}`);
  const max=+process.argv[3]||12;
  ws.eachRow({includeEmpty:false},(r,n)=>{ if(n>max) return;
    const cells=[];r.eachCell({includeEmpty:false},(c)=>{let v=c.value; if(v&&typeof v==='object') v=v.richText?v.richText.map(t=>t.text).join(''):JSON.stringify(v); cells.push(`${c.address}=${String(v).replace(/\s+/g,' ').slice(0,70)}`)});
    console.log(cells.join(' | '));});
}
