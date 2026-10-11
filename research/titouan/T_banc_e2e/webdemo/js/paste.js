// Mode "colle une transaction" : transforme le texte colle en corps de requete pour le moteur. Aucune donnee ne quitte la page.
// Formes acceptees : requete JSON-RPC {method, params} ; transaction seule {to, data, value...} ; message EIP-712 seul {types, primaryType, domain, message}.
export const MAX_PASTE = 256 * 1024;
export function parsePasted(text, { origin, intent } = {}) {
  const t = String(text || '').trim();
  if (!t) return { error: 'Colle d’abord une requête (JSON).' };
  if (t.length > MAX_PASTE) return { error: 'Texte trop long (maximum 256 Ko).' };
  let j;
  try { j = JSON.parse(t); } catch (e) { return { error: 'Ce texte n’est pas du JSON valide : ' + String(e.message).slice(0, 100) }; }
  if (Array.isArray(j) && j.length === 1) j = j[0];
  if (!j || typeof j !== 'object' || Array.isArray(j)) return { error: 'Attendu : un objet JSON (requête du portefeuille).' };
  let body;
  if (typeof j.method === 'string') {
    body = { method: j.method, params: Array.isArray(j.params) ? j.params : [] };
    for (const k of ['origin', 'pageText', 'chainId', 'from']) if (j[k] !== undefined) body[k] = j[k];
  } else if (j.types && j.primaryType && j.message) {
    body = { method: 'eth_signTypedData_v4', params: ['0x' + '00'.repeat(20), JSON.stringify(j)] };
  } else if (typeof j.to === 'string' || typeof j.data === 'string' || j.value !== undefined) {
    body = { method: 'eth_sendTransaction', params: [j] };
  } else return { error: 'Forme non reconnue : donne une requête { "method": …, "params": […] } ou une transaction { "to": …, "data": … }.' };
  if (origin && String(origin).trim()) body.origin = String(origin).trim();
  if (intent && intent !== 'none') body.intent = intent;
  return { body };
}
const U = '0x' + 'a1'.repeat(20), SP = '0x' + 'b2'.repeat(20), USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', MAXU = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
export const EXEMPLE_TX = { method: 'eth_sendTransaction', params: [{ from: U, to: USDC, value: '0x0', data: '0x095ea7b3' + '000000000000000000000000' + 'b2'.repeat(20) + 'f'.repeat(64), chainId: '0x1' }] };
export const EXEMPLE_TYPED = {
  method: 'eth_signTypedData_v4',
  params: [U, JSON.stringify({
    types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }], Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
    primaryType: 'Permit', domain: { name: 'USD Coin', version: '2', chainId: 1, verifyingContract: USDC },
    message: { owner: U, spender: SP, value: MAXU, nonce: '0', deadline: MAXU } })],
};
