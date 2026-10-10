// Pre-check: is the USDC address a contract on Fuji? (read-only eth_call over HTTPS)
const rpc='https://api.avax-test.network/ext/bc/C/rpc';
const USDC='0x5425890298aed601595a70ab815c96711a31bc65';
const call=async(m,p)=>(await (await fetch(rpc,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:m,params:p})})).json()).result;
const code=await call('eth_getCode',[USDC,'latest']);
const sym=await call('eth_call',[{to:USDC,data:'0x95d89b41'},'latest']);
const hex=sym.slice(2); const len=parseInt(hex.slice(64,128),16);
console.log(JSON.stringify({chainId:parseInt(await call('eth_chainId',[]),16),codeBytes:(code.length-2)/2,symbol:Buffer.from(hex.slice(128,128+len*2),'hex').toString()}));
