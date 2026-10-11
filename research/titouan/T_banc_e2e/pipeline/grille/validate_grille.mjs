// Contrôles de structure de la grille (sans moteur de détection) : sélecteurs revérifiés par une table écrite à la main,
// longueur du calldata, JSON EIP-712 cohérent, adresses valides, comptes. Sort 1 au moindre écart.
//   node pipeline/grille/validate_grille.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const SEL = { approve: '0x095ea7b3', increaseAllowance: '0x39509351', transfer: '0xa9059cbb', setApprovalForAll: '0xa22cb465', safeTransferFrom: '0x42842e0e', swapV2: '0x38ed1739', supply: '0x617ba037' };
const known = new Set(Object.values(SEL));
const cases = readFileSync(join(HERE, 'GRILLE.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
let bad = 0; const err = (id, m) => { bad++; if (bad < 30) console.log('ECART', id, m); };
const isA = (a) => /^0x[0-9a-fA-F]{40}$/.test(a);
const WANT = { approve: SEL.approve, transfer: SEL.transfer, setAll: SEL.setApprovalForAll, nft: SEL.safeTransferFrom, swap: SEL.swapV2, deposit: SEL.supply };
for (const c of cases) {
  const { method, params } = c.request;
  if (method === 'eth_sendTransaction') {
    const d = params[0].data;
    if (!/^0x([0-9a-f]{2})*$/i.test(d)) err(c.id, 'hex');
    if (d.length > 2) {
      if ((d.length - 2 - 8) % 64 !== 0) err(c.id, 'longueur non multiple de 32 octets');
      const sel = d.slice(0, 10);
      if (c.effect.k !== 'opaque') { const want = c.effect.k === 'approve' && c.effect.method === 'increase' ? SEL.increaseAllowance : WANT[c.effect.k]; if (sel !== want) err(c.id, `sélecteur ${sel} attendu ${want}`); }
      else if (known.has(sel)) err(c.id, 'illisible avec un sélecteur connu');
    }
    if (!isA(params[0].from) || !isA(params[0].to)) err(c.id, 'adresse');
  } else if (method === 'eth_signTypedData_v4') {
    const td = JSON.parse(params[1]);
    if (!td.primaryType || !td.types[td.primaryType] || !td.types.EIP712Domain) err(c.id, 'EIP-712 incomplet');
    for (const f of td.types[td.primaryType]) if (!(f.name in td.message)) err(c.id, 'champ manquant ' + f.name);
    for (const f of td.types.EIP712Domain) if (!(f.name in td.domain)) err(c.id, 'domaine ' + f.name);
  } else if (method === 'personal_sign') { if (!Buffer.from(params[0].slice(2), 'hex').toString().includes('wants you to sign in')) err(c.id, 'SIWE'); }
  else if (method === 'eth_sign') { if (!/^0x[0-9a-f]{64}$/.test(params[1])) err(c.id, 'hash'); }
  if (!['correspond', 'ne_correspond_pas', 'inverifiable'].includes(c.truth)) err(c.id, 'vérité');
}
console.log(`${cases.length} paires, ${bad} écart(s)`);
process.exit(bad ? 1 : 0);
