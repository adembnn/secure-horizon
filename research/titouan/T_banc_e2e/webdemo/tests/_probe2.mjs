import * as M from '../js/verdict_model.js';
import * as S from '../js/scenarios.js';
const pad = (h, n = 64) => h.replace(/^0x/, '').toLowerCase().padStart(n, '0');
const w = (n) => pad(BigInt(n).toString(16));
const bytes = (hex) => { const b = hex.replace(/^0x/, ''); const len = b.length / 2; return w(len) + b.padEnd(Math.ceil(b.length / 64) * 64, '0'); };
function execTransaction({ to, value = 0, data, operation, sigs }) {
  const dataEnc = bytes(data), sigEnc = bytes(sigs);
  const headWords = 10, off1 = headWords * 32, off2 = off1 + dataEnc.length / 2;
  const head = [pad(to), w(value), w(off1), w(operation), w(0), w(0), w(0), pad('0x0'), pad('0x0'), w(off2)].join('');
  return '0x6a761202' + head + dataEnc + sigEnc;
}
const SAFE='0x5afe000000000000000000000000000000000001', USDC='0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const PAUL='0x87ae6413d6a4cf008009eb1faee014d9b878bb2e', EVIL='0xbadc0de000000000000000000000000000000002';
const USER='0x69c52a49ea4a2d6e3a04624d28641e296c49a3dc';
const transferPaul='0xa9059cbb'+pad(PAUL)+w(20_000000); const sigs='0x'+'ab'.repeat(65*3);
const local={contacts:[{address:PAUL,label:'Paul'}],history:[],protected:[],knownSpenders:[]};
for (const [n,c] of [['conf',{to:USDC,data:transferPaul,operation:0}],['dele',{to:EVIL,data:transferPaul,operation:1}]])
 for (const intent of [null,'pay','other']) {
  const body={method:'eth_sendTransaction',params:[{from:USER,to:SAFE,value:'0x0',data:execTransaction({...c,sigs}),chainId:'0x1'}],origin:'https://app.safe.example',url:'https://app.safe.example/',chainId:1,from:USER};
  const b=intent&&intent!=='other'?M.withIntent(body,intent):body;
  const v=M.check(b,M.sanitizeLocalContext(local));
  console.log(n,intent,v.level,v.niveau,v.fiche,v.codes,JSON.stringify(v.texts));
  console.log(JSON.stringify(M.explain(b,local).lines));
}
// permit login
const sc=S.SCENARIOS.find(s=>s.id==='permit_piege');
for (const i of ['login','none']) { const v=M.check(M.withIntent(sc.body,i),M.sanitizeLocalContext(S.LOCAL)); console.log('permit',i,v.level,v.fiche,v.codes,JSON.stringify(v.texts)); }
// limited approve to known router
const USDCc='0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', R='0x'+'e5'.repeat(20);
const mk=(amt)=>({origin:'https://echange-demo.example',url:'https://echange-demo.example/',method:'eth_sendTransaction',params:[{from:S.USER,to:USDCc,data:'0x095ea7b3'+pad(R)+amt.toString(16).padStart(64,'0'),value:'0x0',chainId:'0x1'}],chainId:'0x1',from:S.USER});
for (const amt of [50_000000n, 2n**256n-1n]) for (const ks of [[R],[]]) {
 const v=M.check(M.withIntent(mk(amt),'swap',{token:'USDC',amount:'50',receiveToken:'ETH'}),M.sanitizeLocalContext({...S.LOCAL,knownSpenders:ks}));
 console.log('lim',amt>1n<<64n?'max':'50',ks.length,v.level,v.niveau,v.fiche,v.codes,JSON.stringify(v.texts));
}
