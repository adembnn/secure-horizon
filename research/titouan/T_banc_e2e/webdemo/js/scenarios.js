// Les 8 scenarios de la demo. TOUT est fictif : portefeuille fictif, adresses fictives, sites fictifs (domaines .example), aucune cle, rien n'est envoye.
// Chaque scenario donne la requete EXACTE qu'un site enverrait a un portefeuille (format JSON-RPC), telle que le moteur la lit.
export const USER = '0x' + 'a1'.repeat(20);            // adresse FICTIVE du faux portefeuille
export const PAUL = '0x13baa57127a952cc2065443714d4c823aacec5e7';        // contact fictif de l'utilisateur
export const PAUL_SOSIE = '0x13bac5ff9d0736535f7612edf967d189dd4ac5e7';  // sosie fictif (memes debut et fin)
const TRAP = '0x' + 'b2'.repeat(20);                   // adresse fictive du "site piege"
const TRAP_CONTRACT = '0x' + 'c3'.repeat(20);
const SWAP_SPENDER = '0x' + 'd4'.repeat(20);           // contrat fictif du faux "echange rapide"
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const COW = '0x9008D19f58AAbD9eD0D60971565AA8510560ab41';
export const ROUTER = '0x' + 'e5'.repeat(20);           // routeur FICTIF, présent dans la liste « contrats déjà utilisés » du faux utilisateur (scène 1, temps 1)
const SAFE = '0x5afe000000000000000000000000000000000001';       // coffre à signatures multiples FACTICE (scène 2)
const SAFE_EVIL = '0xbadc0de000000000000000000000000000000002';  // contrat inconnu FACTICE (scène 2)

const w = (a) => a.replace(/^0x/, '').toLowerCase().padStart(64, '0');
const n = (x) => BigInt(x).toString(16).padStart(64, '0');
const bytesEnc = (hex) => { const b = hex.replace(/^0x/, ''); return n(b.length / 2) + b.padEnd(Math.ceil(b.length / 64) * 64, '0'); };
// execTransaction(to, value, data, operation, ...) d'un coffre à signatures multiples : même encodage que demo_typologie/safe_signataire.mjs.
function execTransaction({ to, data, operation, sigs }) {
  const dataEnc = bytesEnc(data), sigEnc = bytesEnc(sigs);
  const off1 = 10 * 32, off2 = off1 + dataEnc.length / 2;
  return '0x6a761202' + [w(to), n(0), n(off1), n(operation), n(0), n(0), n(0), w('0x0'), w('0x0'), n(off2)].join('') + dataEnc + sigEnc;
}
const SAFE_SIGS = '0x' + 'ab'.repeat(65 * 3);
const SAFE_TRANSFER = '0xa9059cbb' + w(PAUL) + n(20_000000);   // transfer(Paul, 20 USDC)
const MAX = 'f'.repeat(64);
const tx = (to, data, value = '0x0') => ({ from: USER, to, data, value, chainId: '0x1' });
const send = (origin, t, extra = {}) => ({ origin, url: origin + '/', method: 'eth_sendTransaction', params: [t], chainId: '0x1', from: USER, ...extra });
const typed = (origin, td, extra = {}) => ({ origin, url: origin + '/', method: 'eth_signTypedData_v4', params: [USER, JSON.stringify(td)], chainId: '0x1', from: USER, ...extra });
const DOMAIN = [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }];

// Contexte "local" du faux utilisateur : un contact et un envoi passe (c'est ce qui permet de reperer un sosie ou un inconnu).
export const LOCAL = {
  contacts: [{ label: 'Paul', address: PAUL }],
  history: [{ address: PAUL, direction: 'sortie', minutes_ago: 50000, amount: '0.5' }],
  protected: [], knownSpenders: [],
};

// Faux solde du faux portefeuille (affichage seulement).
export const WALLET = { name: 'Portefeuille fictif', address: USER, balances: [['ETH', '2,40'], ['USDC', '2 480']] };

const SWAP_ORDER = {
  types: { EIP712Domain: DOMAIN, Order: [{ name: 'sellToken', type: 'address' }, { name: 'buyToken', type: 'address' }, { name: 'receiver', type: 'address' }, { name: 'sellAmount', type: 'uint256' }, { name: 'buyAmount', type: 'uint256' }, { name: 'validTo', type: 'uint32' }, { name: 'appData', type: 'bytes32' }, { name: 'feeAmount', type: 'uint256' }, { name: 'kind', type: 'string' }, { name: 'partiallyFillable', type: 'bool' }, { name: 'sellTokenBalance', type: 'string' }, { name: 'buyTokenBalance', type: 'string' }] },
  primaryType: 'Order',
  domain: { name: 'Gnosis Protocol', version: 'v2', chainId: 1, verifyingContract: COW },
  message: { sellToken: WETH, buyToken: USDC, receiver: USER, sellAmount: '100000000000000000', buyAmount: '300000000', validTo: Math.floor(Date.now() / 1000) + 1800, appData: '0x' + '00'.repeat(32), feeAmount: '0', kind: 'sell', partiallyFillable: false, sellTokenBalance: 'erc20', buyTokenBalance: 'erc20' },
};
const PERMIT = {
  types: { EIP712Domain: DOMAIN, Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
  primaryType: 'Permit',
  domain: { name: 'USD Coin', version: '2', chainId: 1, verifyingContract: USDC },
  message: { owner: USER, spender: TRAP, value: (2n ** 256n - 1n).toString(), nonce: '0', deadline: (2n ** 256n - 1n).toString() },
};

// intent : valeur honnete la plus probable (le jury peut en choisir une autre : menteuse ou "on m'a demande")
const BASE = [
  { id: 'envoi_simple', titre: 'Envoi simple', site: 'Mon appli de paiement (fictive)', resume: 'Envoyer 0,1 ETH à Paul', origin: 'https://paiement-demo.example', intentHonnete: 'pay',
    body: send('https://paiement-demo.example', tx(PAUL, '0x', '0x16345785d8a0000')) },
  { id: 'echange_legitime', titre: 'Échange légitime', site: 'Échange décentralisé (fictif)', resume: 'Échanger 0,1 WETH contre au moins 300 USDC, reçus sur ton compte', origin: 'https://echange-demo.example', intentHonnete: 'swap',
    body: typed('https://echange-demo.example', SWAP_ORDER) },
  { id: 'echange_droit_illimite', titre: 'Échanger 50 USDC : droit illimité demandé', site: 'Échange décentralisé (fictif)', resume: 'Tu veux échanger 50 USDC contre de l’ETH. Le site demande d’abord une « autorisation »', origin: 'https://echange-rapide-demo.example', intentHonnete: 'swap',
    ecrit: 'Échanger 50 USDC contre de l’ETH', intentDetails: { token: 'USDC', amount: '50', receiveToken: 'ETH' },
    body: send('https://echange-rapide-demo.example', tx(USDC, '0x095ea7b3' + w(SWAP_SPENDER) + MAX)) },
  { id: 'droit_illimite', titre: 'Droit illimité vers un site piège', site: 'Faux site de gains (fictif)', resume: '« Valider ton accès » pour recevoir 50 USDC', origin: 'https://gains-usdc-demo.example', intentHonnete: 'receive',
    body: send('https://gains-usdc-demo.example', tx(USDC, '0x095ea7b3' + w(TRAP) + MAX)) },
  { id: 'permit_piege', titre: 'Signature de permit piège', site: 'Faux site de remboursement (fictif)', resume: '« Signer pour te connecter » (aucun envoi visible)', origin: 'https://rembourse-demo.example', intentHonnete: 'login',
    body: typed('https://rembourse-demo.example', PERMIT) },
  { id: 'tous_les_nft', titre: 'Autorisation de tous les NFT', site: 'Faux « mint gratuit » (fictif)', resume: '« Réclamer ton NFT gratuit »', origin: 'https://mint-gratuit-demo.example', intentHonnete: 'receive',
    body: send('https://mint-gratuit-demo.example', tx(TRAP_CONTRACT, '0xa22cb465' + w(TRAP) + n(1))) },
  { id: 'adresse_sosie', titre: 'Adresse qui ressemble à la tienne', site: 'Mon appli de paiement (fictive)', resume: 'Envoyer 0,1 ETH à « Paul » (adresse collée depuis l\'historique)', origin: 'https://paiement-demo.example', intentHonnete: 'pay',
    body: send('https://paiement-demo.example', tx(PAUL_SOSIE, '0x', '0x16345785d8a0000')) },
  { id: 'changement_proprietaire', titre: 'Changement de propriétaire du compte', site: 'Faux outil de « mise à jour » (fictif)', resume: '« Mettre à jour la sécurité de ton compte »', origin: 'https://securite-compte-demo.example', intentHonnete: 'login',
    body: send('https://securite-compte-demo.example', tx(TRAP_CONTRACT, '0xf2fde38b' + w(TRAP))) },
  { id: 'faux_support', titre: 'Faux support', site: 'Faux conseiller « support » (fictif)', resume: 'Le « conseiller » te demande de déplacer tes fonds', origin: 'https://support-demo.example', intentHonnete: 'asked',
    body: send('https://support-demo.example', tx(TRAP, '0x', '0x2b5e3af16b1880000'), {
      pageText: 'Conseiller support : agissez vite, ne le dites à personne. Déplacez vos fonds vers le portefeuille sécurisé, dernier avertissement.' }) },
];

// ---- Les trois scènes du pitch + les cas du moteur. Champs ajoutés :
//   groupe      : titre de la rubrique dans la liste
//   ecrit       : la phrase que la personne aurait écrite (comparée à l'effet réel quand la réponse choisie est l'intention honnête)
//   intentDetails : jeton / montant / jeton reçu, lus par le comparateur (F31 à F33)
//   local       : contexte du faux utilisateur propre à la scène (sinon LOCAL)
//   corrige     : droit limité au montant écrit (ce que fait l'extension, Q17) ; jamais pour une signature
//   synthetique : scène à adresses factices, étiquetée comme telle
//   affiche     : ce que l'écran d'une interface (ici le coffre) montre à la personne, différent de ce qui part au portefeuille
//   brut        : lignes du faux portefeuille quand l'affichage par défaut ne convient pas
const approve = (spender, amount) => '0x095ea7b3' + w(spender) + (typeof amount === 'string' ? amount : n(amount));
const SWAP_TEXT = { ecrit: 'Échanger 50 USDC contre de l’ETH', intentDetails: { token: 'USDC', amount: '50', receiveToken: 'ETH' } };
const G1 = 'Scène 1 · Échanger 50 USDC', G2 = 'Scène 2 · Coffre à signatures multiples', G3 = 'Scène 3 · Me connecter', G4 = 'Autres cas du moteur';
const safeBody = (to, operation) => ({ origin: 'https://coffre-demo.example', url: 'https://coffre-demo.example/', method: 'eth_sendTransaction', chainId: '0x1', from: USER,
  params: [{ from: USER, to: SAFE, value: '0x0', data: execTransaction({ to, data: SAFE_TRANSFER, operation, sigs: SAFE_SIGS }), chainId: '0x1' }] });

const NEW = [
  { id: 'echange_honnete', groupe: G1, titre: 'Site honnête : droit de 50 USDC', site: 'Échange décentralisé (fictif)', origin: 'https://echange-demo.example', intentHonnete: 'swap',
    resume: 'Même phrase. Le site demande exactement 50 USDC à un routeur que tu as déjà utilisé', ...SWAP_TEXT, local: { ...LOCAL, knownSpenders: [ROUTER] },
    body: send('https://echange-demo.example', tx(USDC, approve(ROUTER, 50_000000))) },
  { id: 'echange_routeur_connu', groupe: G1, titre: 'Temps 1 · Droit illimité, routeur connu', site: 'Échange décentralisé (fictif)', origin: 'https://echange-demo.example', intentHonnete: 'swap',
    resume: 'Tu veux échanger 50 USDC. Le site demande un droit illimité à un routeur que tu as déjà utilisé', ...SWAP_TEXT, local: { ...LOCAL, knownSpenders: [ROUTER] },
    corrige: { label: 'Droit limité à 50 USDC', bouton: 'Limiter à 50 USDC', body: send('https://echange-demo.example', tx(USDC, approve(ROUTER, 50_000000))) },
    body: send('https://echange-demo.example', tx(USDC, approve(ROUTER, MAX))) },
  { id: 'echange_droit_illimite', groupe: G1, titre: 'Temps 2 · Même demande, adresse neuve', site: 'Échange décentralisé (fictif)', origin: 'https://echange-rapide-demo.example', intentHonnete: 'swap',
    resume: 'Même phrase, même droit illimité, mais vers une adresse que personne n’a listée', ...SWAP_TEXT,
    body: send('https://echange-rapide-demo.example', tx(USDC, approve(SWAP_SPENDER, MAX))) },
  { id: 'coffre_delegatecall', groupe: G2, synthetique: true, titre: 'Le virement cache un appel délégué', site: 'Interface de coffre à signatures multiples (fictive)', origin: 'https://coffre-demo.example', intentHonnete: 'pay',
    resume: 'L’écran du coffre affiche un virement de 20 USDC. La charge signée est un appel délégué vers un contrat inconnu', ecrit: 'Envoyer 20 USDC à Paul',
    affiche: [['Opération', 'Virement'], ['Montant', '20 USDC'], ['Destinataire', 'Paul'], ['Signatures', '3 sur 3']],
    brut: [['Réseau', 'Ethereum (fictif)'], ['À', SAFE], ['Fonction', 'execTransaction (coffre)'], ['Données', 'non décodées par le faux portefeuille']],
    body: safeBody(SAFE_EVIL, 1) },
  { id: 'coffre_conforme', groupe: G2, synthetique: true, titre: 'Version conforme : vrai virement de 20 USDC', site: 'Interface de coffre à signatures multiples (fictive)', origin: 'https://coffre-demo.example', intentHonnete: 'pay',
    resume: 'Même écran, même coffre. Cette fois la charge est bien un virement de 20 USDC à Paul', ecrit: 'Envoyer 20 USDC à Paul',
    affiche: [['Opération', 'Virement'], ['Montant', '20 USDC'], ['Destinataire', 'Paul'], ['Signatures', '3 sur 3']],
    brut: [['Réseau', 'Ethereum (fictif)'], ['À', SAFE], ['Fonction', 'execTransaction (coffre)'], ['Données', 'non décodées par le faux portefeuille']],
    body: safeBody(USDC, 0) },
];
const EDIT = {
  permit_piege: { groupe: G3, titre: 'La page réclame un Permit', site: 'Faux site de récompenses (fictif)', origin: 'https://recompenses-demo.example',
    resume: 'Tu veux seulement te connecter. La page demande de « signer pour te connecter » et n’affiche aucun envoi', ecrit: 'Me connecter à ce site',
    body: typed('https://recompenses-demo.example', PERMIT) },
  envoi_simple: { ecrit: 'Envoyer 0,1 ETH à Paul' },
  droit_illimite: { ecrit: 'Recevoir 50 USDC' },
  tous_les_nft: { ecrit: 'Réclamer un NFT gratuit' },
  changement_proprietaire: { ecrit: 'Me connecter pour mettre à jour mon compte' },
};
const ORDER = [G1, G2, G3, G4];
export const SCENARIOS = [...NEW, ...BASE.filter((s) => !NEW.some((x) => x.id === s.id)).map((s) => ({ groupe: G4, ...s, ...(EDIT[s.id] || {}) }))]
  .sort((a, b) => ORDER.indexOf(a.groupe) - ORDER.indexOf(b.groupe));
export const GROUPES = ORDER;
export const localOf = (s) => (s && s.local) || LOCAL;

// Intentions proposees par la fenetre (un seul libelle d'une ligne chacune ; 'swap' n'est pas transmis comme intention au comparateur : voir README, limite connue)
export const INTENTS = [
  ['receive', 'Recevoir de l\'argent'],
  ['pay', 'Payer quelqu\'un'],
  ['swap', 'Échanger une crypto'],
  ['login', 'Me connecter'],
  ['asked', 'On m\'a demandé de le faire'],
  ['other', 'Autre / je ne sais pas'],
];
export const intentLabel = (k) => (INTENTS.find((x) => x[0] === k) || [0, 'Pas de réponse'])[1];
