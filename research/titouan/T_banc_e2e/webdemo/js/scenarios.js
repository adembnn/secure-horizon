// Les 8 scenarios de la demo. TOUT est fictif : portefeuille fictif, adresses fictives, sites fictifs (domaines .example), aucune cle, rien n'est envoye.
// Chaque scenario donne la requete EXACTE qu'un site enverrait a un portefeuille (format JSON-RPC), telle que le moteur la lit.
export const USER = '0x' + 'a1'.repeat(20);            // adresse FICTIVE du faux portefeuille
export const PAUL = '0x13baa57127a952cc2065443714d4c823aacec5e7';        // contact fictif de l'utilisateur
export const PAUL_SOSIE = '0x13bac5ff9d0736535f7612edf967d189dd4ac5e7';  // sosie fictif (memes debut et fin)
const TRAP = '0x' + 'b2'.repeat(20);                   // adresse fictive du "site piege"
const TRAP_CONTRACT = '0x' + 'c3'.repeat(20);
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const COW = '0x9008D19f58AAbD9eD0D60971565AA8510560ab41';

const w = (a) => a.replace(/^0x/, '').toLowerCase().padStart(64, '0');
const n = (x) => BigInt(x).toString(16).padStart(64, '0');
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
export const SCENARIOS = [
  { id: 'envoi_simple', titre: 'Envoi simple', site: 'Mon appli de paiement (fictive)', resume: 'Envoyer 0,1 ETH à Paul', origin: 'https://paiement-demo.example', intentHonnete: 'pay',
    body: send('https://paiement-demo.example', tx(PAUL, '0x', '0x16345785d8a0000')) },
  { id: 'echange_legitime', titre: 'Échange légitime', site: 'Échange décentralisé (fictif)', resume: 'Échanger 0,1 WETH contre au moins 300 USDC, reçus sur ton compte', origin: 'https://echange-demo.example', intentHonnete: 'swap',
    body: typed('https://echange-demo.example', SWAP_ORDER) },
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
