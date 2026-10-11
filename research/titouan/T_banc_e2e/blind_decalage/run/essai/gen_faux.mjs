// Faux jeu de 10 cas (5 malveillants + 5 jumeaux bénins) écrit d'après le SCHÉMA de blind_decalage/README.md.
// Aucun cas n'est copié de CASES.jsonl (jamais lu). Adresses tirées d'un PRNG, domaines en .example.
//   node gen_faux.mjs   -> écrit CASES.jsonl et SHA256.txt dans ce dossier
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const addr = (tag) => '0x' + createHash('sha256').update('faux-jeu-' + tag).digest('hex').slice(0, 40);
const pad = (h) => h.replace(/^0x/, '').toLowerCase().padStart(64, '0');
const U = (n) => BigInt(n).toString(16).padStart(64, '0');
const MAX = 'f'.repeat(64);
const SEL = { approve: '0x095ea7b3', transfer: '0xa9059cbb' };
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const VICTIM = addr('victime'), PAUL = addr('paul'), ROUTER = addr('routeur'), ATTAQUANT = addr('attaquant');

const contexte = () => ({
  chainId: 1, origin: 'dex-demo.example', claimed_site: 'dex-demo.example', victim: VICTIM,
  address_book: [{ label: 'Paul', address: PAUL, kind: 'eoa' }],
  known_protocols: [{ label: 'Uniswap (routeur connu)', address: ROUTER, provenance: 'S' }],
  token_registry: [{ symbol: 'USDC', address: USDC, decimals: 6, canonical: true }, { symbol: 'WETH', address: WETH, decimals: 18, canonical: true }],
  history: [{ address: PAUL, minutes_ago: 4000, direction: 'sortie', amount: '20' }],
  counterparty_facts: { [ROUTER]: { isContract: true, firstSeenByUser: true, ageBlocks: 900000 }, [PAUL]: { isContract: false, firstSeenByUser: true }, [ATTAQUANT]: { isContract: false, firstSeenByUser: false } },
  native_balance_eth: '1.5',
});
const tx = (data) => ({ method: 'eth_sendTransaction', params: [{ from: VICTIM, to: USDC, value: '0x0', data, chainId: '0x1' }] });
const approve = (spender, amountHex) => tx(SEL.approve + pad(spender) + amountHex);
const transfer = (to, units) => tx(SEL.transfer + pad(to) + U(units));
const permit = (spender, value) => ({ method: 'eth_signTypedData_v4', params: [VICTIM, JSON.stringify({
  types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }], Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
  primaryType: 'Permit', domain: { name: 'USD Coin', version: '2', chainId: 1, verifyingContract: USDC }, message: { owner: VICTIM, spender, value, nonce: '0', deadline: '1760100000' } })] });
const siwe = () => ({ method: 'personal_sign', params: ['0x' + Buffer.from('dex-demo.example wants you to sign in with your Ethereum account:\n' + VICTIM + '\n\nConnexion au site\n\nURI: https://dex-demo.example\nVersion: 1\nChain ID: 1\nNonce: abcd1234\nIssued At: 2026-10-11T08:00:00Z').toString('hex'), VICTIM] });
const chaine = (id) => ({ method: 'wallet_switchEthereumChain', params: [{ chainId: id }] });

const paire = (fam, code, sub, v, texte, lang, intent, mal, ben, whyM) => [
  { id: 'ES-' + code + '-M01', synthetic: true, family: fam, subfamily: sub, variant: v, label: 'malicious', why: whyM, twin_of: 'ES-' + code + '-B01', request: mal, context: contexte(), intent: { ...intent, freeText: texte, declaredAt: 1760000000000 }, lang },
  { id: 'ES-' + code + '-B01', synthetic: true, family: fam, subfamily: sub, variant: v, label: 'benign', why: 'jumeau conforme', twin_of: 'ES-' + code + '-M01', request: ben, context: contexte(), intent: { ...intent, freeText: texte, declaredAt: 1760000000000 }, lang },
];
export function fauxCas() {
  return [
    ...paire('swap_droit_illimite', 'SW', 'approve_max', 1, 'Autorise Uniswap à dépenser 50 USDC', 'fr', { kind: 'buy_or_swap', token: 'USDC', amount: '50' }, approve(ATTAQUANT, MAX), approve(ROUTER, U(50_000_000)), 'approve illimité vers un spender inconnu'),
    ...paire('destinataire_tiers', 'DT', 'transfert_autre_adresse', 1, 'Envoie 10 USDC à Paul', 'fr', { kind: 'pay_someone', token: 'USDC', amount: '10', counterpartyLabel: 'Paul' }, transfer(ATTAQUANT, 10_000_000), transfer(PAUL, 10_000_000), 'le transfert part vers une autre adresse que Paul'),
    ...paire('montant_plus_grand', 'MT', 'x10', 1, 'Send 10 USDC to Paul', 'en', { kind: 'pay_someone', token: 'USDC', amount: '10', counterpartyLabel: 'Paul' }, transfer(PAUL, 100_000_000), transfer(PAUL, 10_000_000), 'montant dix fois plus grand que dit'),
    ...paire('login_signe_droit', 'LG', 'typed_permit', 1, 'Me connecter au site', 'fr', { kind: 'connect_or_accept_offer' }, permit(ATTAQUANT, '115792089237316195423570985008687907853269984665640564039457584007913129639935'), siwe(), 'connexion qui est en fait un permit illimité'),
    ...paire('chaine_domaine_different', 'CH', 'switch_autre_chaine', 1, 'Connect to dex-demo.example', 'en', { kind: 'connect_or_accept_offer', chainId: 1 }, chaine('0x89'), chaine('0x1'), 'demande de bascule vers une autre chaîne'),
  ].sort((a, b) => a.id.localeCompare(b.id));
}
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('gen_faux.mjs')) {
  const HERE = dirname(fileURLToPath(import.meta.url));
  const txt = fauxCas().map((c) => JSON.stringify(c)).join('\n') + '\n';
  writeFileSync(join(HERE, 'CASES.jsonl'), txt);
  writeFileSync(join(HERE, 'SHA256.txt'), createHash('sha256').update(txt).digest('hex') + '  CASES.jsonl\n');
  console.log('faux jeu écrit :', fauxCas().length, 'cas');
}
