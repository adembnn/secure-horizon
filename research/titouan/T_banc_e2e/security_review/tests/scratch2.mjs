import { evaluate } from '../../server/server.mjs';
const A='0x'+'a'.repeat(40), ATT='0x'+'bad0'.repeat(10), USDC='0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const td=JSON.stringify({types:{Permit:[{name:'owner',type:'address'},{name:'spender',type:'address'},{name:'value',type:'uint256'},{name:'nonce',type:'uint256'},{name:'deadline',type:'uint256'}]},primaryType:'Permit',domain:{name:'USDC',version:'2',chainId:1,verifyingContract:USDC},message:{owner:A,spender:ATT,value:'115792089237316195423570985008687907853269984665640564039457584007913129639935',nonce:0,deadline:'99999999999'}});
for (const [t,b] of [['from ok',{from:A,params:[A,td]}],['from null',{from:null,params:[A,td]}]]) { const v=evaluate({origin:'https://evil.example',chainId:'0x1',method:'eth_signTypedData_v4',...b}); console.log(t,v.level,v.fiche,v.codes); }
// typed sans from, mais permit2 / sans primaryType
