// Console du présentateur (attaquant.html). Sondage de GET /state uniquement : aucune
// transaction n'est envoyée depuis cette page, elle ne fait qu'afficher ce que le service
// local de la chaîne (127.0.0.1:8792, dossier chain/ d'un autre agent) rapporte.
// Forme confirmée de GET /state (drain.mjs, stateOf()) : { balances:{victim,collector},
// victim, collector, chainId, lastDrains:[{txHash,drained,before,after,at}], events:[...] }.
"use strict";

(function () {
  const $ = (id) => document.getElementById(id);
  const STATE_ENDPOINT = "http://127.0.0.1:8792/state";
  let addresses = null;
  let seenKeys = new Set();
  let timelineEntries = [];
  let lastVictimBal = null, lastAttackerBal = null;

  function setStatus(text, cls) {
    const row = $("service-status");
    row.className = "c-service" + (cls ? " " + cls : "");
    row.querySelector("span").textContent = text;
  }
  function setPill(text, cls) {
    const pill = $("chain-pill");
    pill.className = "c-net" + (cls ? " " + cls : "");
    $("chain-pill-text").textContent = text;
  }
  function short(addr) { return addr ? addr.slice(0, 8) + "…" + addr.slice(-6) : "—"; }

  // ---------- sélecteur de réseau (côté présentateur uniquement) ----------
  function paintNetButtons(net) {
    $("net-local").classList.toggle("active", net === "local");
    $("net-fuji").classList.toggle("active", net === "fuji");
  }
  function goToNet(net) {
    rememberNet(net);
    const url = new URL(location.href);
    url.searchParams.set("reseau", net);
    location.href = url.toString();
  }
  $("net-local").addEventListener("click", () => goToNet("local"));
  $("net-fuji").addEventListener("click", () => goToNet("fuji"));

  // ---------- extraction de l'état du service ----------
  // lastDrains = historique des contrefactuels effectivement exécutés, le plus récent en premier.
  function eventsFromState(data) {
    const drains = Array.isArray(data?.lastDrains) ? data.lastDrains.slice().reverse() : [];
    const out = [];
    for (const d of drains) {
      if (!d || !d.txHash) continue;
      out.push({ type: "signature", at: d.at, txHash: d.txHash });
      out.push({ type: "mined", at: d.at, txHash: d.txHash, amount: d.drained });
    }
    return out;
  }

  function timeLabel(at) {
    try {
      const d = new Date(at);
      if (isNaN(d.getTime())) return "—";
      return d.toTimeString().slice(0, 8);
    } catch (e) { return "—"; }
  }

  function renderTimeline() {
    const el = $("timeline");
    if (!timelineEntries.length) { el.innerHTML = '<li class="c-empty">En attente d\'une signature…<small>Ouvrez index.html et cliquez « Réclamer ma récompense ».</small></li>'; return; }
    el.innerHTML = timelineEntries.map((e) => {
      const mined = e.type === "mined";
      const label = mined ? "Transaction minée" : "Signature reçue";
      const extra = mined && e.amount ? "<em>" + formatUsdc(e.amount) + " DemoUSDC transférés</em>" : "";
      const link = mined && addresses ? explorerTxUrl(addresses.chainId, e.txHash) : null;
      const linkHtml = link ? ' <a href="' + link + '" target="_blank" rel="noopener">voir sur l\'explorateur</a>' : "";
      return '<li class="' + (mined ? "mined" : "sig") + '">' +
        '<span class="t">' + timeLabel(e.at) + "</span>" +
        '<span class="what">' + label + extra + linkHtml + "</span>" +
        (e.txHash ? '<span class="hash">' + e.txHash + "</span>" : "") +
        "</li>";
    }).join("");
  }

  function mergeEvents(events) {
    let changed = false;
    for (const e of events) {
      const key = e.type + "|" + e.txHash;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      timelineEntries.push(e);
      changed = true;
    }
    if (changed) {
      timelineEntries.sort((a, b) => new Date(a.at) - new Date(b.at));
      renderTimeline();
    }
  }

  // ---------- signal cross-onglet : la victime a connecté un compte différent de celui configuré ----------
  function paintDemoError() {
    const err = readDemoError();
    const box = $("victim-mismatch-warn");
    if (!err) { box.hidden = true; return; }
    box.hidden = false;
    if (err.code === "victim-mismatch") {
      box.textContent = "Le compte connecté sur index.html n'est pas la victime configurée (" + (addresses ? short(addresses.victim) : "—") + "). " +
        "Le service a refusé la demande. Relancez le déploiement avec DEMO_VICTIM=<adresse connectée>, ou reconnectez le bon compte.";
    } else {
      box.textContent = "Le service a refusé la dernière demande : " + (err.detail || err.code) + ".";
    }
  }
  window.addEventListener("storage", (ev) => { if (ev.key === "glacier.demoError") paintDemoError(); });

  // ---------- montée des soldes ----------
  function paintAmount(prefix, bal, prevBal) {
    $(prefix + "-amount").innerHTML = (bal != null ? formatUsdc(bal) : "—") + "<small>USDC</small>";
    const card = $(prefix + "-card");
    const delta = $(prefix + "-delta");
    if (bal != null && prevBal != null && BigInt(bal) !== BigInt(prevBal)) {
      const diff = BigInt(bal) - BigInt(prevBal);
      delta.textContent = (diff > 0n ? "+" : "") + formatUsdc(diff) + " USDC à l'instant";
      card.classList.toggle("hot", prefix === "attacker" && diff > 0n);
      setTimeout(() => card.classList.remove("hot"), 2600);
    }
  }

  async function poll() {
    try {
      const res = await fetch(STATE_ENDPOINT, { cache: "no-store" });
      if (!res.ok) throw new Error("http " + res.status);
      const data = await res.json();
      setStatus("Connecté au service local.", "ok");

      const victimBal = data?.balances?.victim ?? null;
      const attackerBal = data?.balances?.collector ?? null;
      paintAmount("victim", victimBal, lastVictimBal);
      paintAmount("attacker", attackerBal, lastAttackerBal);
      lastVictimBal = victimBal; lastAttackerBal = attackerBal;

      $("victim-addr").textContent = "adresse : " + short(data?.victim || addresses?.victim);
      $("attacker-addr").textContent = "adresse : " + short(data?.collector || addresses?.collector);

      mergeEvents(eventsFromState(data));
      paintDemoError();
    } catch (e) {
      setStatus("Service local introuvable sur 127.0.0.1:8792. Démarrez-le, puis cette page se mettra à jour seule.", "bad");
    }
  }

  async function init() {
    const res = await resolveNet();
    paintNetButtons(explicitNet() || storedNet() || "local");
    if (res.ok) {
      addresses = res.data;
      rememberNet(res.net);
      paintNetButtons(res.net);
      setPill(isFuji(addresses.chainId) ? "Réseau : Avalanche Fuji" : "Réseau : chaîne locale", "ok");
      $("victim-addr").textContent = "adresse : " + short(addresses.victim);
      $("attacker-addr").textContent = "adresse : " + short(addresses.collector);
      if (res.fellBack) setStatus("Réseau « " + res.requested + " » indisponible ici (fichier d'adresses absent) ; repli automatique sur « " + res.net + " ».", "bad");
    } else {
      setPill("Réseau : non configuré", "bad");
      setStatus("Aucun fichier d'adresses trouvé pour local ou fuji. Lancez le déploiement de démo, puis « node config.js » dans research/demo_reelle/site/.", "bad");
    }
    paintDemoError();
    poll();
    setInterval(poll, 1000);
  }

  init();
})();
