const R='https://api.avax.network/ext/bc/C/rpc';
const rpc=async(m,p)=>{const r=await fetch(R,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:m,params:p})});return r.json()};
const b=parseInt((await rpc('eth_blockNumber',[])).result,16);console.log('head',b);
const T='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const C=['0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E','0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7'];
for(const n of [2000,10000]){const t=Date.now();const r=await rpc('eth_getLogs',[{fromBlock:'0x'+(b-n).toString(16),toBlock:'0x'+b.toString(16),address:C,topics:[T]}]);console.log(n,r.error||r.result.length,Date.now()-t,'ms');await new Promise(s=>setTimeout(s,1500));}
