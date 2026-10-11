// pipeline_audit/synthetic_lower.mjs - lecture seule. Cas SYNTHÉTIQUES construits ici (aucune donnée réelle, aucune clé) pour exercer les chemins qui peuvent baisser un niveau
// et que les jeux DEV n'exercent pas (loweredBy est vide sur les 10 293 cas). Chaque scénario imprime : verdict du serveur seul, verdict evaluatePlus, baisses.
// Usage : node pipeline_audit/synthetic_lower.mjs
const M = await import(new URL('../pipeline/measure.mjs', import.meta.url).href);
const { D } = M;
const { makeEvaluatePlus, benchLevel } = await import(new URL('../pipeline/evaluate_plus.mjs', import.meta.url).href);
const real = D.DETECTORS;
const runWith = (detectors) => makeEvaluatePlus({ ...D, DETECTORS: detectors });
const run = runWith(real);
const V = '0x1111111111111111111111111111111111111111'; // victime (synthétique)
const lc = (s) => s.toLowerCase();
const pad = (h) => h.replace(/^0x/, '').toLowerCase().padStart(64, '0');
const num = (n) => BigInt(n).toString(16).padStart(64, '0');
const hex = (n) => '0x' + BigInt(n).toString(16);
const line = (t) => console.log(t);
async function show(titre, body, local, opts = {}, detectors) {
  const prod = D.evaluate(JSON.parse(JSON.stringify(body)), { contacts: [], history: [], protected: [], knownSpenders: [], ...local });
  const v = await (detectors ? runWith(detectors) : run)(body, local, opts);
  const p = v.plus;
  line(`\n## ${titre}\n  serveur seul=${benchLevel(prod)} (${(prod.codes || []).join(',')})  |  evaluatePlus=${benchLevel(v)} chemin=${p.path} produit interne=${p.product} relaxé=${p.relaxedByFacts}`);
  line(`  loweredBy=${JSON.stringify((p.loweredBy || []).map((l) => ({ par: l.by, de: l.from, vers: l.to })))} signaux=${(p.signals || []).map((s) => s.by + ':' + s.code + ':' + s.severity).join(', ') || '(aucun)'}`);
  return { prod: benchLevel(prod), plus: benchLevel(v), v };
}

// ---------------------------------------------------------------- 1. dust_guard : contact légitime + expéditeur de poussière sosie
const Y = '0xAbCd1234567890aBcDef1234567890aBCdEf9876'; // contact (carnet)
const X = '0xAbCd12' + '0000000000000000000000000000000000'.slice(0, 28) + 'Ef9876'; // sosie : mêmes 6 premiers et 6 derniers caractères
const body1 = { method: 'eth_sendTransaction', params: [{ from: V, to: Y, value: hex(10n ** 17n), data: '0x', chainId: '0xa86a' }], origin: 'https://app.example', chainId: 43114, from: V };
const local1 = { contacts: [{ address: lc(Y), label: 'Paul' }], history: [{ address: lc(X), direction: 'entrée', amount: '0.001', minutes_ago: 120 }] };
await show('1a. dust_guard : paiement au contact réel alors qu\'un sosie a envoyé de la poussière (cas légitime), intention "pay"', { ...body1, intent: 'pay' }, local1);
// 1b. même cas, mais un autre détecteur (factice) lève un warn : la baisse l'efface-t-elle ?
const fakeWarn = { id: 'autre_detecteur_factice', run: () => ({ flags: [{ code: 'avertissement_factice', severity: 'warn', detail: 'un autre détecteur a vu quelque chose' }] }) };
const dust = real.find((d) => d.id === 'dust_guard');
await show('1b. dust_guard + un autre détecteur qui lève un WARN (ordre : factice puis dust_guard)', { ...body1, intent: 'pay' }, local1, {}, [fakeWarn, dust]);
// 1c. dust_guard : l'attaquant est le contact (déjà payé une fois, donc "de confiance") et le sosie est son propre envoi de poussière
const A = '0x9999aaaa00000000000000000000000000bbbb77'; // adresse de l'attaquant, payée une fois par la victime
const A2 = '0x9999aaaa11111111111111111111111111bbbb77'; // son sosie (envoie de la poussière)
const body1c = { method: 'eth_sendTransaction', params: [{ from: V, to: A, value: hex(10n ** 18n), data: '0x', chainId: '0xa86a' }], origin: 'https://app.example', chainId: 43114, from: V };
await show('1c. dust_guard : destinataire déjà payé une fois (donc "connu") + sosie poussière : baisse sur 1 AVAX vers une adresse de l\'attaquant', { ...body1c, intent: 'pay' },
  { contacts: [], history: [{ address: A, direction: 'sortie', amount: '0.01', minutes_ago: 60 * 24 * 30 }, { address: A2, direction: 'entrée', amount: '0.0001', minutes_ago: 120 }] });

// ---------------------------------------------------------------- 2. intent_guard : montant "1,000" lu 1 ou 1000
const body2 = { method: 'eth_sendTransaction', params: [{ from: V, to: Y, value: hex(1000n * 10n ** 18n), data: '0x', chainId: '0xa86a' }], origin: 'https://app.example', chainId: 43114, from: V };
await show('2a. intent_guard : intention OBJET {pay_someone, montant "1,000"}, la demande envoie 1000 AVAX (mille fois le montant tapé à la française)', body2,
  { contacts: [{ address: lc(Y), label: 'Paul' }], history: [] }, { intent: { kind: 'pay_someone', amount: '1,000', token: 'AVAX', counterpartyLabel: 'Paul', declaredAt: Date.now() } });
await show('2b. même chose avec l\'intention telle que le serveur la construit (chaîne "pay", sans montant)', { ...body2, intent: 'pay' }, { contacts: [{ address: lc(Y), label: 'Paul' }], history: [] });

// ---------------------------------------------------------------- 3. nft_orders : "listing honnête" qui est en fait un lot de 10 NFT
const SEAPORT = '0x0000000000000068F116a894984e2DB1123eB395'; // Seaport 1.6 (CANONICAL du produit)
const types = { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }],
  OrderComponents: [{ name: 'offerer', type: 'address' }, { name: 'zone', type: 'address' }, { name: 'offer', type: 'OfferItem[]' }, { name: 'consideration', type: 'ConsiderationItem[]' }, { name: 'orderType', type: 'uint8' }, { name: 'startTime', type: 'uint256' }, { name: 'endTime', type: 'uint256' }, { name: 'zoneHash', type: 'bytes32' }, { name: 'salt', type: 'uint256' }, { name: 'conduitKey', type: 'bytes32' }, { name: 'counter', type: 'uint256' }],
  OfferItem: [{ name: 'itemType', type: 'uint8' }, { name: 'token', type: 'address' }, { name: 'identifierOrCriteria', type: 'uint256' }, { name: 'startAmount', type: 'uint256' }, { name: 'endAmount', type: 'uint256' }],
  ConsiderationItem: [{ name: 'itemType', type: 'uint8' }, { name: 'token', type: 'address' }, { name: 'identifierOrCriteria', type: 'uint256' }, { name: 'startAmount', type: 'uint256' }, { name: 'endAmount', type: 'uint256' }, { name: 'recipient', type: 'address' }] };
const ZERO = '0x' + '0'.repeat(40), Z32 = '0x' + '0'.repeat(64);
const nft = (i) => ({ itemType: 2, token: '0x' + (0xA0 + i).toString(16).padStart(2, '0') + '00000000000000000000000000000000000000'.slice(0, 38), identifierOrCriteria: String(i), startAmount: '1', endAmount: '1' });
const mkOrder = (n) => ({ offerer: V, zone: ZERO, offer: Array.from({ length: n }, (_, i) => nft(i + 1)),
  consideration: [{ itemType: 0, token: ZERO, identifierOrCriteria: '0', startAmount: String(10n ** 18n), endAmount: String(10n ** 18n), recipient: V }], orderType: 0, startTime: '0', endTime: '9999999999', zoneHash: Z32, salt: '1', conduitKey: Z32, counter: '0' });
const typed = (n) => ({ method: 'eth_signTypedData_v4', params: [V, JSON.stringify({ types, primaryType: 'OrderComponents', domain: { name: 'Seaport', version: '1.6', chainId: 43114, verifyingContract: SEAPORT }, message: mkOrder(n) })], origin: 'https://market.example', chainId: 43114, from: V });
const sellIntent = { kind: 'connect_or_accept_offer', freeText: 'je veux vendre mon NFT 1 AVAX', amount: 1, token: 'AVAX', declaredAt: Date.now() };
await show('3a. nft_orders : listing d\'UN NFT pour 1 AVAX, intention "vendre" montant 1 (cas honnête)', typed(1), {}, { intent: sellIntent });
await show('3b. nft_orders : le MÊME ordre mais 10 NFT de 10 collections différentes dans l\'offre, toujours 1 AVAX', typed(10), {}, { intent: sellIntent });
await show('3c. référence : le même ordre à 10 NFT sans intention de vente', typed(10), {}, {});

// ---------------------------------------------------------------- 4. liste de protocoles connus (known_protocols.json) : appels à un protocole connu avec un bénéficiaire contrôlé par l'attaquant
const ATT = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
const AAVE_POOL = '0x794a61358D6845594F94dc1DB02A252b5b4814aD', GATEWAY = '0x2825cE5921538d17cc15Ae00a8B24fF759C6CDaE', USDC = '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E';
const call = (to, data, value = '0x0') => ({ method: 'eth_sendTransaction', params: [{ from: V, to, data, value, chainId: '0xa86a' }], origin: 'https://app.aave.example', chainId: 43114, from: V });
await show('4a. Aave Pool.supply(USDC, 5000, onBehalfOf=ATTAQUANT, 0) : le dépôt est crédité à l\'attaquant', call(AAVE_POOL, '0x617ba037' + pad(USDC) + num(5000n * 10n ** 6n) + pad(ATT) + num(0)), {});
await show('4b. Aave Pool.withdraw(USDC, max, to=ATTAQUANT) : retrait envoyé à l\'attaquant', call(AAVE_POOL, '0x69328dec' + pad(USDC) + num(2n ** 256n - 1n) + pad(ATT)), {});
await show('4c. WrappedTokenGateway.depositETH(pool, onBehalfOf=ATTAQUANT, 0) avec 100 AVAX', call(GATEWAY, '0x474cf53d' + pad(AAVE_POOL) + pad(ATT) + num(0), hex(100n * 10n ** 18n)), {});
await show('4d. référence : même appel 4a vers un contrat INCONNU', call('0x7777777777777777777777777777777777777777', '0x617ba037' + pad(USDC) + num(5000n * 10n ** 6n) + pad(ATT) + num(0)), {});

// ---------------------------------------------------------------- 5. effet de la liste known_protocols.json (injectée dans le "produit" interne de evaluatePlus, pas dans server.evaluate seul)
const SAVAX = '0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE', UR = '0x94b75331ae8d42c1b61065089b7d48fe14aa73b7';
await show('5a. sAVAX (protocole connu) avec un sélecteur inconnu 0xdeadbeef et 100 AVAX', call(SAVAX, '0xdeadbeef', hex(100n * 10n ** 18n)), {});
await show('5b. sAVAX.submit() avec 100 AVAX', call(SAVAX, '0x5bcb2fc6', hex(100n * 10n ** 18n)), {});
await show('5c. USDC.approve(UniversalRouter connu, illimité)', call(USDC, '0x095ea7b3' + pad(UR) + 'f'.repeat(64)), {});
await show('5d. référence : USDC.approve(ATTAQUANT, illimité)', call(USDC, '0x095ea7b3' + pad(ATT) + 'f'.repeat(64)), {});
await show('5e. sélecteur inconnu 0xdeadbeef + 100 AVAX vers un contrat INCONNU', call('0x7777777777777777777777777777777777777777', '0xdeadbeef', hex(100n * 10n ** 18n)), {});
