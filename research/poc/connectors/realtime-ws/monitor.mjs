// Usage: node monitor.mjs <name> <wsUrl> <seconds> [killAtSec] [usdcAddress]
import WebSocket from 'ws';
const [,, name, url, secs='60', killAt='0', addr='0x5425890298aed601595a70ab815c96711a31bc65'] = process.argv;
const DUR=+secs*1000, KILL=+killAt*1000;
const TRANSFER='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const httpUrl=url.replace(/^wss/,'https').replace(/^ws:/,'http').replace(/\/ws$/,'/rpc');
const t0=Date.now(), hexN=h=>parseInt(h,16);
const S={blocks:[],gaps:[],logs:{addrFilter:0,transferTopic:0,unfiltered:0},connects:0,disconnects:0,reconnects:[],recovered:0,errors:[]};
let ws,subs={},lastNum=null,closing=false,attempt=0,killedAt=null,firstAfter=null,idc=1;
function connect(){
  S.connects++; ws=new WebSocket(url,{handshakeTimeout:10000});
  ws.on('open',()=>{
    attempt=0; subs={};
    const sub=(k,p)=>{const id=idc++; subs[id]=k; ws.send(JSON.stringify({jsonrpc:'2.0',id,method:'eth_subscribe',params:p}));};
    sub('heads',['newHeads']); sub('addr',['logs',{address:addr}]);
    sub('transfer',['logs',{topics:[TRANSFER]}]); sub('all',['logs',{}]);
    if(S.connects>1) S.reconnects.push({atMs:Date.now()-t0,downMs:Date.now()-killedAt});
  });
  ws.on('message',d=>{
    const rx=Date.now(); let m; try{m=JSON.parse(d)}catch{return}
    if(m.id&&subs[m.id]!==undefined){ if(m.error)S.errors.push(m.error); else subs[m.result]=subs[m.id]; return; }
    if(m.method!=='eth_subscription')return;
    const k=subs[m.params.subscription], r=m.params.result;
    if(k==='heads'){
      const n=hexN(r.number);
      if(killedAt&&S.connects>1&&firstAfter===null) firstAfter=rx-killedAt;
      if(lastNum!==null&&n>lastNum+1){ S.gaps.push([lastNum+1,n-1]); backfill(lastNum+1,n-1); }
      if(lastNum===null||n>lastNum){ lastNum=n; S.blocks.push({n,ts:hexN(r.timestamp),rx}); }
    } else if(k==='addr') S.logs.addrFilter++;
    else if(k==='transfer') S.logs.transferTopic++;
    else if(k==='all') S.logs.unfiltered++;
  });
  ws.on('error',e=>S.errors.push(String(e.message||e)));
  ws.on('close',()=>{ if(closing)return; S.disconnects++; setTimeout(connect,Math.min(500*2**attempt++,8000)); });
}
// recover missed blocks over HTTPS so a reconnect never leaves a hole
async function backfill(from,to){
  for(let n=from;n<=to;n++){
    try{ const r=await fetch(httpUrl,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_getBlockByNumber',params:['0x'+n.toString(16),false]})}).then(r=>r.json());
      if(r.result) S.recovered++; else S.errors.push('backfill '+n+' empty'); }catch(e){S.errors.push(String(e))}
  }
}
connect();
if(KILL) setTimeout(()=>{killedAt=Date.now(); S.killedAtMs=killedAt-t0; ws.terminate();},KILL);
setTimeout(async()=>{
  closing=true; try{ws.close()}catch{}
  await new Promise(r=>setTimeout(r,1500));
  const b=S.blocks, rxI=[], tsI=[], lat=[];
  b.forEach((x,i)=>{ lat.push(x.rx-x.ts*1000); if(i){rxI.push(x.rx-b[i-1].rx); tsI.push((x.ts-b[i-1].ts)*1000);} });
  const st=a=>a.length?{n:a.length,min:Math.min(...a),avg:Math.round(a.reduce((x,y)=>x+y,0)/a.length),p50:[...a].sort((x,y)=>x-y)[a.length>>1],max:Math.max(...a)}:null;
  const f=b[0]?.n,l=b.at(-1)?.n;
  console.log(JSON.stringify({name,url,seconds:+secs,blocksReceivedLive:b.length,firstBlock:f,lastBlock:l,blocksMissingInRange:f?l-f+1-b.length:0,
    blocksRecoveredByHttpsBackfill:S.recovered,arrivalIntervalMs:st(rxI),headerTsIntervalMs:st(tsI),latencyMs_rxMinusHeaderTs_1sResolution:st(lat),
    logs:S.logs,connects:S.connects,disconnects:S.disconnects,killedAtMs:S.killedAtMs??null,reconnects:S.reconnects,msKillToFirstNewHeadAfterReconnect:firstAfter,
    gaps:S.gaps,errors:S.errors.slice(0,5)},null,1));
  process.exit(0);
},DUR+500);
