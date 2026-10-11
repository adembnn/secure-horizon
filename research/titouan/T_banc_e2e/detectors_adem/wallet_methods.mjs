// D-METHODE : wallet-level requests that move no value but change what the wallet will believe or allow.
//  (1) wallet_addEthereumChain for a PUBLIC chain id (Ethereum, Avalanche C-Chain, their testnets) with an RPC the wallet does not
//      list as official : the wallet already ships these chains, so a site-provided RPC has no honest reason to exist except to
//      control balances, simulations and the transactions the user then signs. The engine says warn (`chain_add_known_id_custom_rpc`) ;
//      we say critical. Objection : "a team may want its own private node" ; the user can decline and keep the built-in network ;
//      adding a chain with an official host stays info (engine), an Avalanche L1 with its own id is another rule (engine).
//  (2) wallet_requestPermissions (EIP-2255) naming a capability other than `eth_accounts` with a wildcard value ("all", "*") :
//      the standard flow asks for account visibility only. Objection : "Snaps ask for endowments" ; they use wallet_requestSnaps and
//      name the capability, never a wildcard.
// NIST CSF DE.AE-02, PR.AA-05 ; MITRE ATT&CK T1557 (adversary-in-the-middle, hostile RPC), T1548 ; OWASP ASI03 ; D3FEND D3-NTA (network traffic analysis, by analogy).
// public RPC hosts of the chains the wallet ships (public facts, same family as the engine's own list ; used so that an honest "add Avalanche" from chainlist stays quiet)
const OFFICIAL_RPC = { 1: ['eth.llamarpc.com', 'cloudflare-eth.com', 'ethereum-rpc.publicnode.com', 'rpc.ankr.com', 'eth.merkle.io'], 11155111: ['rpc.sepolia.org', 'ethereum-sepolia-rpc.publicnode.com', 'rpc.ankr.com'], 43114: ['api.avax.network', 'avalanche-c-chain-rpc.publicnode.com', 'rpc.ankr.com'], 43113: ['api.avax-test.network', 'avalanche-fuji-c-chain-rpc.publicnode.com'] };
const hostOf = (u) => { try { return new URL(String(u)).hostname.toLowerCase(); } catch { return ''; } };
const wild = (v) => (typeof v === 'string' ? /^(all|\*)$/i.test(v.trim()) : Array.isArray(v) ? v.some(wild) : v && typeof v === 'object' ? Object.values(v).some(wild) : false);

export const walletMethods = {
  id: 'wallet_methods',
  run({ eff, request }) {
    if (!request) return null;
    if (request.method === 'wallet_addEthereumChain' && eff && (eff.risk_flags || []).some((f) => f.code === 'chain_add_known_id_custom_rpc')) {
      const p = (request.params && request.params[0]) || {};
      const official = OFFICIAL_RPC[Number(p.chainId)] || [];
      const urls = Array.isArray(p.rpcUrls) ? p.rpcUrls : [];
      if (urls.length && urls.every((u) => official.includes(hostOf(u)))) return null; // every host is an official public one : honest add
      return { flags: [{ code: 'chain_public_id_foreign_rpc', severity: 'critical', detail: 'le site ajoute une chaîne publique que le portefeuille connaît déjà, avec un RPC qu\'il fournit lui-même : il peut falsifier soldes et simulations' }] };
    }
    if (request.method === 'wallet_requestPermissions') {
      const p = (request.params && request.params[0]) || {};
      for (const [name, val] of Object.entries(p)) {
        if (name !== 'eth_accounts' && wild(val)) return { flags: [{ code: 'permission_wildcard', severity: 'critical', detail: `la demande de permission « ${name} » vise « tout » (valeur générique) au lieu de la seule visibilité des comptes` }] };
      }
    }
    return null;
  },
};
