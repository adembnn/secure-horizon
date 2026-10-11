// Requetes types telles que bridge.js les envoie au service worker (corps de /check). Chaque entree : { name, body, expect } ou expect = classe attendue.
// expect : 'critical' | 'warn' | 'warn_or_critical' | 'any' (tout sauf ok) ; 'unknown' = verdict indetermine (niveau warn, level unknown)
const U = '0x' + 'a1'.repeat(20);                 // l'utilisateur
const SPENDER = '0x' + 'b2'.repeat(20);           // un inconnu
const PAUL = '0x13baa57127a952cc2065443714d4c823aacec5e7';
const PAUL_SOSIE = '0x13bac5ff9d0736535f7612edf967d189dd4ac5e7';
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
const w = (a) => a.replace(/^0x/, '').toLowerCase().padStart(64, '0');
const n = (x) => BigInt(x).toString(16).padStart(64, '0');
const MAX = 'f'.repeat(64);
const approve = (sp, amt) => '0x095ea7b3' + w(sp) + amt;
const tx = (to, data, value = '0x0', extra = {}) => ({ from: U, to, data, value, chainId: '0x1', ...extra });
const ORIGIN = 'https://app.exemple-defi.org';
const send = (name, t, expect, extra = {}) => ({ name, expect, body: { origin: ORIGIN, url: ORIGIN + '/swap', method: 'eth_sendTransaction', params: [t], chainId: '0x1', from: U, ...extra } });
const typed = (name, td, expect, extra = {}) => ({ name, expect, body: { origin: ORIGIN, method: 'eth_signTypedData_v4', params: [U, JSON.stringify(td)], chainId: '0x1', from: U, ...extra } });
const DOMAIN = [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }];

export const REQUESTS = [
  send('approve illimite USDC vers un inconnu', tx(USDC, approve(SPENDER, MAX)), 'critical'),
  send('approve limite 100 USDC vers un inconnu', tx(USDC, approve(SPENDER, n(100_000_000))), 'any'),
  send('approve illimite vers Permit2 (protocole connu)', tx(USDC, approve(PERMIT2, MAX)), 'any'),
  typed('permit EIP-2612 illimite', { types: { EIP712Domain: DOMAIN, Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] }, primaryType: 'Permit', domain: { name: 'USD Coin', version: '2', chainId: 1, verifyingContract: USDC }, message: { owner: U, spender: SPENDER, value: BigInt(2) ** 256n - 1n + '', nonce: '0', deadline: '115792089237316195423570985008687907853269984665640564039457584007913129639935' } }, 'critical'),
  typed('Permit2 PermitSingle illimite', { types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }], PermitSingle: [{ name: 'details', type: 'PermitDetails' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }], PermitDetails: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint160' }, { name: 'expiration', type: 'uint48' }, { name: 'nonce', type: 'uint48' }] }, primaryType: 'PermitSingle', domain: { name: 'Permit2', chainId: 1, verifyingContract: PERMIT2 }, message: { details: { token: USDC, amount: (2n ** 160n - 1n).toString(), expiration: '281474976710655', nonce: '0' }, spender: SPENDER, sigDeadline: '281474976710655' } }, 'critical'),
  send('envoi simple 0.5 ETH vers un inconnu', tx(PAUL, '0x', '0x6f05b59d3b20000'), 'any'),
  send('envoi simple 0.5 ETH vers un contact connu (contexte local)', tx(PAUL, '0x', '0x6f05b59d3b20000'), 'any', { _local: 'contact' }),
  send('transfer ERC-20 100 USDC', tx(USDC, '0xa9059cbb' + w(SPENDER) + n(100_000_000)), 'any'),
  send('setApprovalForAll(true) vers un inconnu', tx('0x' + 'c3'.repeat(20), '0xa22cb465' + w(SPENDER) + n(1)), 'critical'),
  send('changement de proprietaire (transferOwnership)', tx('0x' + 'c3'.repeat(20), '0xf2fde38b' + w(SPENDER)), 'critical'),
  send('sosie d adresse du carnet (empoisonnement)', tx(PAUL_SOSIE, '0x', '0x6f05b59d3b20000'), 'critical', { _local: 'contact' }),
  { name: 'eth_sign aveugle', expect: 'warn_or_critical', body: { origin: ORIGIN, method: 'eth_sign', params: [U, '0x' + 'ab'.repeat(32)], from: U } },
  { name: 'personal_sign texte banal', expect: 'any', body: { origin: ORIGIN, method: 'personal_sign', params: ['0x' + Buffer.from('Bienvenue sur le site').toString('hex'), U], from: U } },
  { name: 'personal_sign 32 octets (hash)', expect: 'warn_or_critical', body: { origin: ORIGIN, method: 'personal_sign', params: ['0x' + 'cd'.repeat(32), U], from: U } },
  { name: 'wallet_sendCalls avec approve illimite', expect: 'critical', body: { origin: ORIGIN, method: 'wallet_sendCalls', params: [{ version: '1.0', from: U, chainId: '0x1', calls: [{ to: USDC, data: approve(SPENDER, MAX), value: '0x0' }, { to: PAUL, data: '0x', value: '0x1' }] }], from: U } },
  { name: 'wallet_addEthereumChain avec RPC http', expect: 'warn_or_critical', body: { origin: ORIGIN, method: 'wallet_addEthereumChain', params: [{ chainId: '0x539', chainName: 'Reseau pirate', rpcUrls: ['http://rpc.pirate.example'], nativeCurrency: { name: 'E', symbol: 'ETH', decimals: 18 } }] } },
  { name: 'wallet_switchEthereumChain', expect: 'any', body: { origin: ORIGIN, method: 'wallet_switchEthereumChain', params: [{ chainId: '0x89' }] } },
  { name: 'eth_sendRawTransaction illisible', expect: 'unknown', body: { origin: ORIGIN, method: 'eth_sendRawTransaction', params: ['0xdeadbeef'] } },
  { name: 'MALFORMEE : pas de methode', expect: 'unknown', body: { origin: ORIGIN, params: [] } },
  { name: 'MALFORMEE : params n est pas un tableau', expect: 'unknown', body: { origin: ORIGIN, method: 'eth_sendTransaction', params: 'oups' } },
  { name: 'MALFORMEE : transaction nulle', expect: 'unknown', body: { origin: ORIGIN, method: 'eth_sendTransaction', params: [null] } },
  { name: 'MALFORMEE : corps null', expect: 'unknown', body: null },
  { name: 'MALFORMEE : corps tableau', expect: 'unknown', body: [1, 2, 3] },
  { name: 'MALFORMEE : adresse invalide', expect: 'any', body: { origin: ORIGIN, method: 'eth_sendTransaction', params: [{ from: 'pas-une-adresse', to: 'xyz', data: '0xzz', value: 'abc' }] } },
  { name: 'methode inconnue eth_foo', expect: 'unknown', body: { origin: ORIGIN, method: 'eth_foo', params: [] } },
  { name: 'eth_signTypedData v1 (tableau)', expect: 'unknown', body: { origin: ORIGIN, method: 'eth_signTypedData', params: [[{ type: 'string', name: 'a', value: 'b' }], U] } },
  { name: 'TROP VOLUMINEUSE : 300 Ko de calldata', expect: 'unknown', body: { origin: ORIGIN, method: 'eth_sendTransaction', params: [tx(SPENDER, '0x' + 'ab'.repeat(150_000))] } },
  { name: 'wallet_sendCalls 65 appels (borne)', expect: 'unknown', body: { origin: ORIGIN, method: 'wallet_sendCalls', params: [{ from: U, chainId: '0x1', calls: Array.from({ length: 65 }, () => ({ to: PAUL, value: '0x1' })) }] } },
  send('appel de contrat inconnu (selecteur inconnu)', tx('0x' + 'd4'.repeat(20), '0x12345678' + w(SPENDER)), 'warn_or_critical'),
  send('delegation EIP-7702 (liste d autorisations)', { from: U, to: U, value: '0x0', data: '0x', type: '0x4', chainId: '0x1', authorizationList: [{ chainId: '0x0', address: SPENDER, nonce: '0x1' }] }, 'warn_or_critical'),
  { name: 'approve illimite + page de pression (faux support)', expect: 'critical', body: { origin: ORIGIN, method: 'eth_sendTransaction', params: [tx(USDC, approve(SPENDER, MAX))], from: U, pageText: 'Conseiller support: agissez vite, ne le dites a personne, deplacez vos fonds maintenant' } },
  { name: 'approve illimite avec intention "payer quelqu un"', expect: 'critical', body: { origin: ORIGIN, method: 'eth_sendTransaction', params: [tx(USDC, approve(SPENDER, MAX))], from: U, intent: 'pay' } },
  { name: 'origine sosie punycode (xn--)', expect: 'any', body: { origin: 'https://xn--unswap-9ya.org', method: 'eth_sendTransaction', params: [tx(USDC, approve(SPENDER, n(5)))], from: U } },
  { name: 'origine absente', expect: 'any', body: { method: 'eth_sendTransaction', params: [tx(PAUL, '0x', '0x1')], from: U } },
  { name: 'chainId en decimal et methode tres longue tronquee', expect: 'unknown', body: { origin: ORIGIN, method: 'x'.repeat(5000), params: [], chainId: 1 } },
];

export const LOCALS = {
  contact: { contacts: [{ label: 'Paul', address: PAUL }], history: [{ address: PAUL, direction: 'sortie', minutes_ago: 50000, amount: '0.5' }], protected: [], knownSpenders: [] },
};
