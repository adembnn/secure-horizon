// Contrôle de structure du panel, indépendant du générateur : relit chaque demande avec un décodeur écrit ici et la compare
// à l'effet annoncé. Ne lit que la moitié demandée (par défaut : réglage ; --moitie=controle ne regarde QUE la structure et
// n'affiche aucune phrase ni aucun résultat de mesure).
//   node preuves/panel/valide_panel.mjs [--moitie=reglage|controle|reserve]
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const moitie = (process.argv.find((a) => a.startsWith('--moitie=')) || '--moitie=reglage').slice(9);
const NOM = { controle: 'CONTROLE', reserve: 'RESERVE', reglage: 'REGLAGE' }[moitie];
const file = join(HERE, NOM + '.jsonl');
const brut = readFileSync(file);
const attendu = readFileSync(join(HERE, NOM + '_SHA256.txt'), 'utf8').split(/\s+/)[0];
const sha = createHash('sha256').update(brut).digest('hex');
// Seconde table de sélecteurs, écrite à la main, séparée de celle du générateur.
const TABLE = { '0x095ea7b3': 'approve(address,uint256)', '0x39509351': 'increaseAllowance(address,uint256)', '0xa9059cbb': 'transfer(address,uint256)', '0xa22cb465': 'setApprovalForAll(address,bool)',
  '0x38ed1739': 'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)', '0x7ff36ab5': 'swapExactETHForTokens(uint256,address[],address,uint256)', '0xf2fde38b': 'transferOwnership(address)', '0x0d582f13': 'addOwnerWithThreshold(address,uint256)' };
const HEX20 = /^0x[0-9a-f]{40}$/;
const toRaw = (s, d) => { const [i, f = ''] = String(s).split('.'); return BigInt(i) * 10n ** BigInt(d) + BigInt((f + '0'.repeat(d)).slice(0, d) || '0'); };
const word = (data, i) => data.slice(10 + 64 * i, 74 + 64 * i);
const errs = []; const ids = new Set(); let n = 0; const vus = {};
const bad = (p, m) => errs.push(p.id + ' : ' + m);
function checkCall(p, c, part) {
  if (!HEX20.test(c.to)) bad(p, 'adresse « to » invalide');
  const d = c.data || '0x';
  if (!/^0x[0-9a-f]*$/.test(d)) return bad(p, 'données non hexadécimales');
  if (d === '0x') { if (part && part.t === 'send' && part.sym === 'NATIF' && BigInt(c.value) !== toRaw(part.amount, 18)) bad(p, 'valeur native différente de l\'effet annoncé'); return; }
  if ((d.length - 10) % 64 !== 0) bad(p, 'longueur des données non multiple de 32 octets');
  const sel = d.slice(0, 10); vus[sel] = (vus[sel] || 0) + 1;
  if (!part) return;
  if (part.t === 'grant' && !part.sig) {
    if (!['0x095ea7b3', '0x39509351'].includes(sel)) return bad(p, 'droit annoncé mais sélecteur ' + sel);
    if ('0x' + word(d, 0).slice(24) !== part.spender) bad(p, 'bénéficiaire du droit différent de l\'effet annoncé');
    const raw = BigInt('0x' + word(d, 1));
    if (part.amount === 'max' ? raw < (1n << 128n) : raw !== toRaw(part.amount, part.d)) bad(p, 'montant du droit différent de l\'effet annoncé');
  }
  if (part.t === 'send' && part.sym !== 'NATIF') {
    if (sel !== '0xa9059cbb') return bad(p, 'envoi annoncé mais sélecteur ' + sel);
    if ('0x' + word(d, 0).slice(24) !== part.to) bad(p, 'destinataire différent de l\'effet annoncé');
    if (BigInt('0x' + word(d, 1)) !== toRaw(part.amount, part.d)) bad(p, 'montant envoyé différent de l\'effet annoncé');
  }
  if (part.t === 'swap') {
    if (sel === '0x38ed1739') { if (BigInt('0x' + word(d, 0)) !== toRaw(part.inAmount, part.inD)) bad(p, 'montant échangé différent'); if ('0x' + word(d, 3).slice(24) !== part.to) bad(p, 'bénéficiaire de l\'échange différent'); if ((part.minOut.startsWith('1 ')) !== (BigInt('0x' + word(d, 1)) === 1n)) bad(p, 'minimum reçu incohérent'); }
    else if (sel === '0x7ff36ab5') { if (BigInt(c.value) !== toRaw(part.inAmount, 18)) bad(p, 'valeur échangée différente'); if ('0x' + word(d, 2).slice(24) !== part.to) bad(p, 'bénéficiaire de l\'échange différent'); }
    else bad(p, 'échange annoncé mais sélecteur ' + sel);
  }
  if (part.t === 'nft_right' && sel !== '0xa22cb465') bad(p, 'droit sur collection annoncé mais sélecteur ' + sel);
  if (part.t === 'nft_one' && (sel !== '0x095ea7b3' || BigInt('0x' + word(d, 1)) !== BigInt(part.id))) bad(p, 'droit sur un NFT incohérent');
}
for (const line of brut.toString('utf8').split('\n')) {
  if (!line) continue; n++;
  const p = JSON.parse(line);
  if (ids.has(p.id)) bad(p, 'identifiant en double'); ids.add(p.id);
  if (p.moitie !== moitie) bad(p, 'mauvaise moitié');
  if (!['conforme', 'non_conforme', 'indecidable'].includes(p.verite)) bad(p, 'vérité inconnue');
  if (typeof p.phrase !== 'string' || !p.phrase.trim() || p.phrase.length > 300) bad(p, 'phrase vide ou trop longue');
  const c = p.affirmation, parts = p.effet.parts || [], m = p.request.method, q = p.request.params;
  // fidélité du rendu : ce que l'affirmation dit doit être dans la phrase
  if (c.dest && c.dest.kind === 'addr' && !p.phrase.includes(c.dest.addr)) bad(p, 'adresse affirmée absente de la phrase');
  if (c.dest && c.dest.kind === 'proto' && !p.phrase.toLowerCase().includes(c.dest.name.toLowerCase())) bad(p, 'protocole affirmé absent de la phrase');
  if (c.token && !p.phrase.toUpperCase().includes(c.token.toUpperCase())) bad(p, 'jeton affirmé absent de la phrase');
  if (c.amount && p.style !== 'lettres' && !/\d/.test(p.phrase)) bad(p, 'montant affirmé absent de la phrase');
  if (!c.amount && !c.nftId && !c.dest && /\d/.test(p.phrase) && c.act !== 'none') bad(p, 'chiffre dans une phrase sans montant affirmé');
  if (m === 'eth_sendTransaction') {
    const t = q[0]; if (!HEX20.test(t.from)) bad(p, 'from invalide');
    if (p.effet.lisible) checkCall(p, t, parts.find((x) => ['grant', 'send', 'swap', 'nft_right', 'nft_one'].includes(x.t)));
    else if (TABLE[(t.data || '').slice(0, 10)]) bad(p, 'appel annoncé illisible mais sélecteur connu');
    if (BigInt(t.value || '0x0') > 0n && p.effet.lisible && t.data !== '0x' && !parts.some((x) => x.sym === 'NATIF') && !/swapExactETH/.test(TABLE[t.data.slice(0, 10)] || '') && !(p.effet.defauts || []).includes('D8_valeur')) bad(p, 'valeur native non annoncée dans l\'effet');
  } else if (m === 'wallet_sendCalls') {
    const calls = q[0].calls; const real = parts.filter((x) => ['grant', 'send', 'swap', 'control'].includes(x.t));
    if (calls.length !== real.length) bad(p, `lot : ${calls.length} appels pour ${real.length} effets annoncés`);
    calls.forEach((c2, i) => checkCall(p, c2, real[i]));
  } else if (m === 'eth_signTypedData_v4') {
    let td; try { td = JSON.parse(q[1]); } catch { bad(p, 'JSON EIP-712 illisible'); continue; }
    if (!td.types || !td.types[td.primaryType] || !td.domain || !td.message) bad(p, 'EIP-712 incomplet');
    for (const f of td.types[td.primaryType] || []) if (!(f.name in td.message)) bad(p, 'champ EIP-712 manquant : ' + f.name);
    const g = parts.find((x) => x.t === 'grant');
    if (g) { const v = td.primaryType === 'Permit' ? td.message.value : td.message.details.amount; if (g.amount === 'max' ? BigInt(v) < (1n << 128n) : BigInt(v) !== toRaw(g.amount, g.d)) bad(p, 'montant signé différent de l\'effet annoncé'); if (td.message.spender !== g.spender) bad(p, 'bénéficiaire signé différent'); }
  } else if (!['personal_sign', 'eth_sign', 'wallet_grantPermissions', 'wallet_addEthereumChain'].includes(m)) bad(p, 'méthode inattendue ' + m);
}
for (const s of Object.keys(vus)) if (!TABLE[s]) errs.push('sélecteur hors table dans une demande lisible : ' + s);
console.log(JSON.stringify({ moitie, paires: n, sha256: sha, sha256_attendu: attendu, empreinte_ok: sha === attendu, ecarts: errs.length, exemples: errs.slice(0, 12) }, null, 1));
process.exit(errs.length || sha !== attendu ? 1 : 0);
