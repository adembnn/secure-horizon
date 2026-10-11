import * as M from '../js/verdict_model.js';
import * as S from '../js/scenarios.js';
const USDC='0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const ROUTER='0xE592427A0AEce92De3Edee1F18E0157C05861564';
const w=(a)=>a.replace(/^0x/,'').toLowerCase().padStart(64,'0');
const MAX='f'.repeat(64);
const USER=S.USER;
const send=(origin,t)=>({origin,url:origin+'/',method:'eth_sendTransaction',params:[t],chainId:'0x1',from:USER});
const tx=(to,data,value='0x0')=>({from:USER,to,data,value,chainId:'0x1'});
const body=send('https://echange-demo.example',tx(USDC,'0x095ea7b3'+w(ROUTER)+MAX));
for (const ks of [[],[ROUTER.toLowerCase()]]) for (const intent of ['swap']) {
  const local={...S.LOCAL,knownSpenders:ks};
  const v=M.check(M.withIntent(body,intent,{token:'USDC',amount:'50',receiveToken:'ETH'}),M.sanitizeLocalContext(local));
  console.log(JSON.stringify({ks:ks.length,level:v.level,niveau:v.niveau,fiche:v.fiche,raisons:v.raisons,texts:v.texts,relief:v.relief,keys:Object.keys(v)},null,1));
}
