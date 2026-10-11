#!/usr/bin/env node
// Joue une LISTE de parcours d'affilee dans le Chromium de Playwright, extension chargee, portefeuille simule.
// Usage : node jouer.mjs --id=N --parcours=fichier.json [--seulement=nom1,nom2] [--garder-profils]
// Sortie : %TEMP%/holdup-testeur-N/resultats.json, resultats.md, captures/<parcours>/NN_geste.png
// Chaine locale uniquement. Le portefeuille simule signe avec une cle neuve par parcours (jamais affichee).
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { arg, idDepuisArgs, lireEtat, dossier, requireEthers, requirePlaywright, CHROME_EXE, sleep, rpc } from './lib.mjs';

const n = idDepuisArgs();
const E = lireEtat(n), D = dossier(n);
const fichier = arg('parcours');
if (!fichier || fichier === true) { console.error('--parcours=fichier.json obligatoire'); process.exit(2); }
const liste = JSON.parse(readFileSync(resolve(fichier), 'utf8'));
const seulement = typeof arg('seulement') === 'string' ? arg('seulement').split(',') : null;
const parcoursAJouer = (Array.isArray(liste) ? liste : liste.parcours).filter((p) => !seulement || seulement.includes(p.nom));
const { chromium } = requirePlaywright();
const { ethers } = requireEthers();
const ADR = E.chaine.adresses, RPC = E.chaine.rpc, EXT_ID = E.extension.extension_id;
const EXT_ORIGIN = `chrome-extension://${EXT_ID}/`;
const UNLIMITED = 2n ** 128n;
const CTX_JETONS = [
  { address: ADR.usdc, symbol: 'USDC', decimals: 6, chainId: ADR.chainId },
  { address: ADR.wavax, symbol: 'WAVAX', decimals: 18, chainId: ADR.chainId }
];
const NOMS_CONTRATS = { usdc: ADR.usdc, wavax: ADR.wavax, nft: ADR.nft, routeur: ADR.router, routeur_habituel: ADR.vulnRouter, piege: ADR.drainer };
const nomCourt = (s) => (s || '').replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------- lecture de la chaine
const ERC20 = ['function balanceOf(address) view returns (uint256)', 'function allowance(address,address) view returns (uint256)', 'function mint(address,uint256)',
  'function permit(address,address,uint256,uint256,uint8,bytes32,bytes32)'];
const ERC721 = ['function ownerOf(uint256) view returns (address)', 'function getApproved(uint256) view returns (address)', 'function isApprovedForAll(address,address) view returns (bool)',
  'function mintBatch(address,uint256) returns (uint256)', 'function balanceOf(address) view returns (uint256)'];

async function etatChaine(ctx) {
  const { provider, wallet, usdc, wavax, nft, ids, noms } = ctx;
  const nomDe = (a) => { for (const [k, v] of Object.entries(noms)) if (v.toLowerCase() === a.toLowerCase()) return k; return a; };
  const e = { avax: Number(ethers.formatEther(await provider.getBalance(wallet.address))), usdc: Number(await usdc.balanceOf(wallet.address)) / 1e6,
    wavax: Number(ethers.formatEther(await wavax.balanceOf(wallet.address))), nft_proprietaires: {}, nft_approuve: {}, droits: {}, recus: {} };
  for (const id of ids) {
    try { e.nft_proprietaires[id] = nomDe(await nft.ownerOf(id)); const ap = await nft.getApproved(id); e.nft_approuve[id] = ap === ethers.ZeroAddress ? null : nomDe(ap); } catch { e.nft_proprietaires[id] = '(inexistant)'; }
  }
  for (const [nom, a] of Object.entries(noms)) {
    if (!a || nom === 'wallet' || ['usdc', 'wavax', 'nft'].includes(nom)) continue;
    const au = await usdc.allowance(wallet.address, a), aw = await wavax.allowance(wallet.address, a), ta = await nft.isApprovedForAll(wallet.address, a);
    e.droits[nom] = { usdc: au >= UNLIMITED ? 'illimite' : Number(au) / 1e6, wavax: aw >= UNLIMITED ? 'illimite' : Number(ethers.formatEther(aw)), nft_collection: ta };
    e.recus[nom] = { usdc: Number(await usdc.balanceOf(a)) / 1e6, avax: Number(ethers.formatEther(await provider.getBalance(a))) };
  }
  return e;
}

// ---------------------------------------------------------------- decodage de ce que le portefeuille recoit
const IFACE = new ethers.Interface(['function transfer(address,uint256)', 'function approve(address,uint256)', 'function transferFrom(address,address,uint256)',
  'function setApprovalForAll(address,bool)', 'function safeTransferFrom(address,address,uint256)', 'function permit(address,address,uint256,uint256,uint8,bytes32,bytes32)',
  'function increaseAllowance(address,uint256)']);
function decoder(ctx, tx) {
  const to = (tx.to || '').toLowerCase();
  const nom = (a) => { for (const [k, v] of Object.entries(ctx.noms)) if (v && v.toLowerCase() === String(a).toLowerCase()) return '@' + k; return a; };
  const r = { vers_contrat: nom(tx.to), valeur_avax: tx.value ? Number(ethers.formatEther(BigInt(tx.value))) : 0 };
  const data = tx.data || tx.input || '0x';
  if (data === '0x' || data === '') { r.methode = 'envoi natif'; r.destinataire = nom(tx.to); r.montant = r.valeur_avax + ' AVAX'; return r; }
  let d = null; try { d = IFACE.parseTransaction({ data }); } catch { /* inconnu */ }
  if (!d) { r.methode = 'appel inconnu ' + data.slice(0, 10); return r; }
  const dec = to === ADR.usdc.toLowerCase() ? [6, 'USDC'] : to === ADR.wavax.toLowerCase() ? [18, 'WAVAX'] : [0, ''];
  const fmt = (v) => (v >= UNLIMITED ? 'illimite' : dec[0] ? Number(ethers.formatUnits(v, dec[0])) + ' ' + dec[1] : String(v));
  const estNft = to === (ADR.nft || '').toLowerCase();
  r.methode = d.name + (estNft ? ' (NFT)' : '');
  if (d.name === 'transfer') { r.destinataire = nom(d.args[0]); r.montant = fmt(d.args[1]); }
  else if (d.name === 'approve' || d.name === 'increaseAllowance') { r.destinataire = nom(d.args[0]); if (estNft) r.nft = String(d.args[1]); else { r.droit_accorde = fmt(d.args[1]); r.montant = r.droit_accorde; } }
  else if (d.name === 'setApprovalForAll') { r.destinataire = nom(d.args[0]); r.droit_accorde = d.args[1] ? 'toute la collection' : 'retrait'; }
  else if (d.name === 'transferFrom' || d.name === 'safeTransferFrom') { r.destinataire = nom(d.args[1]); if (estNft) r.nft = String(d.args[2]); else r.montant = fmt(d.args[2]); }
  return r;
}

// ---------------------------------------------------------------- verdict mecanique (depuis la chaine)
function compiler(intention) {
  const i = intention || null; if (!i) return null;
  const e = { usdc_sorti_max: 0, usdc_vers: [], avax_sorti_max: 0, avax_vers: [], droits_usdc_max: 0, droits_vers: [], nft_ids: [], nft_vers: [], collection_vers: [] };
  const t = i.type || 'rien';
  if (t === 'echange') { e.usdc_sorti_max = i.usdc; e.usdc_vers = ['routeur', 'routeur_habituel']; e.droits_usdc_max = i.usdc; e.droits_vers = ['routeur', 'routeur_habituel']; }
  else if (t === 'envoi') {
    if (i.jeton === 'usdc') { e.usdc_sorti_max = i.montant; e.usdc_vers = [i.destinataire]; }
    else if (i.jeton === 'avax') { e.avax_sorti_max = i.montant; e.avax_vers = [i.destinataire]; }
    else if (i.jeton === 'nft') { e.nft_ids = [String(i.nft_id)]; e.nft_vers = [i.destinataire]; }
  } else if (t === 'approbation_nft') { e.nft_ids = [String(i.nft_id)]; e.nft_vers = [i.pour]; e.nft_approbation = true; }
  else if (t === 'approbation_collection') e.collection_vers = [i.pour];
  else if (t === 'libre') Object.assign(e, i.enveloppe || {});
  return e;
}
const sansArobase = (s) => String(s).replace(/^@/, '');
function verdict(ctx, avant, apres, signatures, intention) {
  const env = compiler(intention), v = [], delta = {};
  const dUsdc = avant.usdc - apres.usdc, dAvax = avant.avax - apres.avax, dWavax = avant.wavax - apres.wavax;
  if (Math.abs(dUsdc) > 1e-9) delta.usdc = -dUsdc; if (Math.abs(dAvax) > 0.02) delta.avax = -dAvax; if (Math.abs(dWavax) > 1e-9) delta.wavax = -dWavax;
  const droits = {};
  for (const [nom, d] of Object.entries(apres.droits)) {
    const b = avant.droits[nom] || {};
    if (d.usdc !== b.usdc && d.usdc !== 0) droits[nom + ' USDC'] = d.usdc;
    if (d.wavax !== b.wavax && d.wavax !== 0) droits[nom + ' WAVAX'] = d.wavax;
    if (d.nft_collection && !b.nft_collection) droits[nom + ' NFT toute la collection'] = true;
  }
  const nftBouges = {};
  for (const id of Object.keys(apres.nft_proprietaires)) if (apres.nft_proprietaires[id] !== avant.nft_proprietaires[id]) nftBouges[id] = apres.nft_proprietaires[id];
  const nftApprouves = {};
  for (const id of Object.keys(apres.nft_approuve)) if (apres.nft_approuve[id] && apres.nft_approuve[id] !== avant.nft_approuve[id]) nftApprouves[id] = apres.nft_approuve[id];
  const recus = {};
  for (const [nom, r] of Object.entries(apres.recus)) { const b = avant.recus[nom] || { usdc: 0, avax: 0 }; const du = r.usdc - b.usdc, da = r.avax - b.avax; if (du > 1e-9) recus[nom + ' USDC'] = du; if (da > 1e-9) recus[nom + ' AVAX'] = da; }
  const rien = !Object.keys(delta).length && !Object.keys(droits).length && !Object.keys(nftBouges).length && !Object.keys(nftApprouves).length;
  const bilan = { delta_wallet: delta, droits_nouveaux: droits, nft_deplaces: nftBouges, nft_approuves: nftApprouves, recus_par_adresse: recus, signatures_remises: signatures };
  if (rien) return { verdict: signatures.length ? 'rien n\'est parti sur la chaine, mais une signature a ete remise' : 'rien n\'est parti', ecarts: [], bilan };
  if (!env) return { verdict: 'quelque chose est parti (aucune intention fournie dans le parcours : comparaison impossible)', ecarts: [], bilan };
  const nomAdr = (x) => { const k = sansArobase(x); for (const [nm, a] of Object.entries(ctx.noms)) if (a && a.toLowerCase() === String(k).toLowerCase()) return nm; return k; };
  const ok = (nom, liste) => liste.map(nomAdr).includes(nom);
  if (-(delta.usdc || 0) > env.usdc_sorti_max + 1e-9) v.push(`${-(delta.usdc || 0)} USDC sortis, la phrase en voulait ${env.usdc_sorti_max}`);
  if (delta.usdc > 1e-9) v.push('le portefeuille a recu de l\'USDC en trop ?');
  if (-(delta.avax || 0) > env.avax_sorti_max + 0.02) v.push(`${-(delta.avax || 0)} AVAX sortis, la phrase en voulait ${env.avax_sorti_max}`);
  for (const [k, val] of Object.entries(recus)) { const [nom, jeton] = [k.slice(0, k.lastIndexOf(' ')), k.slice(k.lastIndexOf(' ') + 1)]; if (jeton === 'USDC' && !ok(nom, env.usdc_vers)) v.push(`${val} USDC arrives chez ${nom}, qui n'est pas le destinataire voulu`); if (jeton === 'AVAX' && !ok(nom, env.avax_vers) && val > 0.02) v.push(`${val} AVAX arrives chez ${nom}, qui n'est pas le destinataire voulu`); }
  for (const [k, val] of Object.entries(droits)) {
    const nom = k.replace(/ (USDC|WAVAX|NFT toute la collection)$/, '');
    if (k.endsWith('NFT toute la collection')) { if (!ok(nom, env.collection_vers)) v.push(`droit sur toute la collection NFT donne a ${nom}`); continue; }
    if (k.endsWith('WAVAX')) { v.push(`droit WAVAX ${val} donne a ${nom}`); continue; }
    if (!ok(nom, env.droits_vers)) v.push(`droit USDC ${val} donne a ${nom}, qui n'est pas dans la phrase`);
    else if (val === 'illimite' || val > env.droits_usdc_max + 1e-9) v.push(`droit USDC ${val} donne a ${nom}, la phrase en voulait ${env.droits_usdc_max}`);
  }
  for (const [id, qui] of Object.entries(nftBouges)) { if (!env.nft_ids.includes(id)) v.push(`le NFT ${id} a change de main (vers ${qui}) sans etre dans la phrase`); else if (!ok(qui, env.nft_vers)) v.push(`le NFT ${id} est alle chez ${qui}, pas chez le destinataire voulu`); }
  for (const [id, qui] of Object.entries(nftApprouves)) { if (!env.nft_ids.includes(id) || !env.nft_approbation) v.push(`le NFT ${id} est approuve pour ${qui} sans etre dans la phrase`); else if (!ok(qui, env.nft_vers)) v.push(`le NFT ${id} est approuve pour ${qui}, pas pour le bon destinataire`); }
  return { verdict: v.length ? 'quelque chose est parti qui ne correspond pas a la phrase' : 'ce qui est parti correspond a la phrase', ecarts: v, bilan };
}

// ---------------------------------------------------------------- un parcours
async function jouerParcours(p, idx) {
  const t0 = Date.now(), nom = p.nom || 'parcours' + (idx + 1);
  const dirCap = join(D, 'captures', nom); rmSync(dirCap, { recursive: true, force: true }); mkdirSync(dirCap, { recursive: true });
  const profil = join(D, 'profils', nom);
  if (p.profil !== 'garde') rmSync(profil, { recursive: true, force: true, maxRetries: 5 });
  const provider = new ethers.JsonRpcProvider(RPC, undefined, { staticNetwork: true, batchMaxCount: 1, cacheTimeout: -1 });
  const snap = await provider.send('evm_snapshot', []);
  const wallet = ethers.Wallet.createRandom().connect(provider);
  const ami = ethers.Wallet.createRandom().address, ami2 = ethers.Wallet.createRandom().address, inconnu = ethers.Wallet.createRandom().address;
  await provider.send('hardhat_setBalance', [wallet.address, '0x' + (BigInt(p.solde_avax ?? 100) * 10n ** 18n).toString(16)]);
  const usdc = new ethers.Contract(ADR.usdc, ERC20, wallet), wavax = new ethers.Contract(ADR.wavax, ERC20, wallet), nft = new ethers.Contract(ADR.nft, ERC721, wallet);
  await (await usdc.mint(wallet.address, BigInt(Math.round((p.solde_usdc ?? 100) * 1e6)))).wait();
  const nbNft = p.nft ?? 3; let ids = [];
  if (nbNft > 0) { const first = await nft.mintBatch.staticCall(wallet.address, nbNft); await (await nft.mintBatch(wallet.address, nbNft)).wait(); ids = Array.from({ length: nbNft }, (_, i) => String(Number(first) + i)); }
  const noms = { wallet: wallet.address, usdc: ADR.usdc, wavax: ADR.wavax, nft: ADR.nft, routeur: ADR.router, routeur_habituel: ADR.vulnRouter, piege: ADR.drainer, collecteur: ADR.collector, ami, ami2, inconnu };
  const ctxChaine = { provider, wallet, usdc, wavax, nft, ids, noms };
  const sub = (s) => typeof s === 'string' ? s.replace(/@([a-z_0-9]+)/gi, (m, k) => (noms[k] ? noms[k] : m)) : s;
  const subDeep = (o) => Array.isArray(o) ? o.map(subDeep) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, subDeep(v)])) : sub(o);
  const avant = await etatChaine(ctxChaine);

  const R = { nom, description: p.description || '', config: { site: p.site, mode: p.mode, via: p.via, etat_extension: p.etat || 'T-', theme: p.theme || 'clair', zoom: p.zoom || 100, clavier_seul: !!p.clavier_seul, profil: p.profil || 'neuf' },
    adresses_utiles: { wallet: wallet.address, ami, ami2, inconnu }, etapes: [], portefeuille: [], erreurs_console: [], fenetres: [], chaine_avant: avant };
  const appels = R.portefeuille, clics = [];
  const S = { zoom: p.zoom || 100, theme: p.theme === 'sombre' ? 'dark' : 'light', tailleFen: p.taille_fenetre || null, ctx: null, site: null, onglets: [], ext: [], fen: [], cdp: new Map(), n: 0, signatures: [], tGeste: [] };
  const marqueGeste = { debut: 0 };

  // --- navigateur
  async function lancer() {
    const ext = E.extension.dossier;
    const ctx = await chromium.launchPersistentContext(profil, { executablePath: CHROME_EXE, headless: false, viewport: null, locale: 'fr-FR', colorScheme: S.theme,
      args: ['--window-size=1280,760', '--no-first-run', '--no-default-browser-check', `--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--headless=new'] });
    await ctx.exposeFunction('__hu_req', async (method, paramsJson) => {
      const params = JSON.parse(paramsJson), t = Date.now();
      const rec = { t_ms: t - t0, methode: method };
      appels.push(rec);
      try {
        if (method === 'eth_sendTransaction') {
          const tx = params[0]; Object.assign(rec, decoder(ctxChaine, tx));
          const r = await wallet.sendTransaction({ to: tx.to, data: tx.data || tx.input, value: tx.value ? BigInt(tx.value) : 0n }); const rc = await r.wait();
          rec.resultat = rc.status === 1 ? 'confirmee' : 'revert'; return r.hash;
        }
        if (method === 'eth_signTypedData_v4' || method === 'eth_signTypedData') {
          const td = JSON.parse(typeof params[1] === 'string' ? params[1] : JSON.stringify(params[1])); const types = { ...td.types }; delete types.EIP712Domain;
          const sig = await wallet.signTypedData(td.domain, types, td.message);
          const m = td.message || {}; const nomOf = (a) => { for (const [k, v] of Object.entries(noms)) if (a && v && v.toLowerCase() === String(a).toLowerCase()) return '@' + k; return a; };
          rec.methode = method + ' (' + td.primaryType + ')'; rec.destinataire = nomOf(m.spender || m.to || m.operator);
          if (m.value !== undefined) { const big = BigInt(m.value); rec.droit_accorde = big >= UNLIMITED ? 'illimite' : String(big); }
          rec.contrat_signature = nomOf(td.domain && td.domain.verifyingContract);
          S.signatures.push({ primaryType: td.primaryType, domain: td.domain, message: m, sig, rec }); rec.resultat = 'signee'; return sig;
        }
        if (method === 'personal_sign') { rec.resultat = 'signee'; const msg = params[0]; return wallet.signMessage(ethers.isHexString(msg) ? ethers.getBytes(msg) : msg); }
        throw new Error('methode non prise en charge par le portefeuille simule : ' + method);
      } catch (e) { rec.resultat = 'erreur : ' + String(e.message).split('\n')[0].slice(0, 160); throw e; }
    });
    await ctx.addInitScript(([victim, chainHex, rpcUrl]) => {
      if (window.top !== window) return;
      const rpc = (method, params) => fetch(rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }).then((r) => r.json()).then((j) => { if (j.error) throw new Error(j.error.message); return j.result; });
      const provider = { isMetaMask: false, request: async ({ method, params }) => {
        if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [victim];
        if (method === 'eth_chainId') return chainHex;
        if (method === 'net_version') return String(parseInt(chainHex, 16));
        if (method === 'wallet_switchEthereumChain' || method === 'wallet_addEthereumChain') return null;
        if (['eth_sendTransaction', 'eth_signTypedData_v4', 'eth_signTypedData', 'personal_sign'].includes(method)) return window.__hu_req(method, JSON.stringify(params || []));
        return rpc(method, params || []);
      }, on() {}, removeListener() {} };
      window.ethereum = provider;
      const announce = () => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze({ info: { uuid: '6f1c2a3e-0000-4000-8000-00000000d3a1', name: 'Portefeuille de test', icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>', rdns: 'test.local.wallet' }, provider }) }));
      window.addEventListener('eip6963:requestProvider', announce); announce();
    }, [wallet.address.toLowerCase(), '0x' + Number(ADR.chainId).toString(16), RPC]);
    ctx.on('page', (pg) => suivrePage(pg));
    ctx.on('serviceworker', (w) => ecouterSW(w));
    for (const w of ctx.serviceWorkers()) ecouterSW(w);
    for (const pg of ctx.pages()) suivrePage(pg);
    S.ctx = ctx;
    // etat de l'extension : T- (installation neuve) ou T+ (jetons de la chaine de test declares)
    const sw = ctx.serviceWorkers()[0] || await ctx.waitForEvent('serviceworker', { timeout: 10000 }).catch(() => null);
    if (sw) {
      R.config.extension_id_charge = (sw.url().match(/chrome-extension:\/\/([a-p]{32})\//) || [])[1];
      const reglages = p.reglages || null;
      const contexte = p.etat === 'T+' ? { tokens: CTX_JETONS } : p.etat === 'T+R' ? { tokens: CTX_JETONS, knownSpenders: [ADR.router] } : (p.contexte ? subDeep(p.contexte) : null);
      if (contexte || reglages) await sw.evaluate(async ([c, cfg]) => { if (c) await chrome.storage.local.set({ contexte: c }); if (cfg) await chrome.storage.local.set({ cfg }); }, [contexte, reglages]).catch((e) => R.erreurs_console.push({ source: 'outil', texte: 'etat extension non ecrit : ' + e.message }));
    } else R.erreurs_console.push({ source: 'outil', texte: 'service worker de l\'extension introuvable (extension non chargee ?)' });
    return ctx;
  }
  function ecouterSW(w) { try { w.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') R.erreurs_console.push({ source: 'service worker', type: m.type(), texte: m.text().slice(0, 300) }); }); } catch { /* ancienne version */ } }
  function suivrePage(pg) {
    const u = () => pg.url();
    pg.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test((m.location() || {}).url || '')) R.erreurs_console.push({ source: urlCourte(u()), texte: m.text().slice(0, 300) }); });
    pg.on('pageerror', (e) => R.erreurs_console.push({ source: urlCourte(u()), texte: 'exception : ' + String(e.message).slice(0, 300) }));
    const attente = async () => {
      for (let i = 0; i < 20 && !u().startsWith('chrome-extension://') && !u().startsWith('http'); i++) await sleep(100);
      if (u().startsWith(EXT_ORIGIN)) {
        const f = { page: pg, url: u(), ouvert_ms: Date.now() - t0, ferme_ms: null }; S.fen.push(f); S.ext.push(pg);
        pg.on('close', () => { f.ferme_ms = Date.now() - t0; });
        await appliquerAffichage(pg, true);
      } else if (u().startsWith('http')) { await appliquerAffichage(pg, false); }
    };
    attente().catch(() => {});
    pg.on('close', () => {});
  }
  const urlCourte = (u) => u.replace(EXT_ORIGIN, 'ext:/').replace(/^http:\/\/127\.0\.0\.1:/, ':');
  async function cdp(pg) { let c = S.cdp.get(pg); if (!c) { c = await S.ctx.newCDPSession(pg); S.cdp.set(pg, c); } return c; }
  async function appliquerAffichage(pg, estExt) {
    try { await pg.emulateMedia({ colorScheme: S.theme }); } catch { /* page fermee */ }
    if (!estExt) return;
    try {
      const c = await cdp(pg); const base = S.tailleFen || (await pg.evaluate(() => [window.innerWidth, window.innerHeight]).catch(() => null));
      if (!pg.__base && base) pg.__base = base;
      const [w, h] = S.tailleFen || (/window.html/.test(pg.url()) ? [440, 540] : pg.__base) || [440, 540];
      if (S.zoom !== 100 || S.tailleFen || /window.html/.test(pg.url())) await c.send('Emulation.setDeviceMetricsOverride', { width: Math.round(w * 100 / S.zoom), height: Math.round(h * 100 / S.zoom), deviceScaleFactor: S.zoom / 100, mobile: false });
    } catch { /* ignore */ }
  }

  // --- aides
  const siteConf = { echange: { btn: '#btn-swap', etat: '#state, #acct' }, leurre: { btn: '#btn-claim', connect: '#btn-connect', etat: '#connect-state, #claim-state' }, envois: { btn: '#envoyer', etat: '#etat, #recap' } }[p.site || 'echange'];
  function urlSite() {
    const s = p.site || 'echange';
    if (s === 'leurre') return E.sites.leurre + '/';
    if (s === 'envois') { const q = new URLSearchParams(subDeep(p.params || {})); return E.sites.envois + (q.toString() ? '?' + q : ''); }
    return E.sites.neve + '/?mode=' + (p.mode || 'honnete') + (p.via ? '&via=' + p.via : '');
  }
  const fenetreOuverte = () => [...S.fen].reverse().find((f) => !f.page.isClosed());
  async function attendreFenetre(ms = 6000) { const t = Date.now(); let f; while (!(f = fenetreOuverte()) && Date.now() - t < ms) await sleep(100); return f && f.page; }
  const tCliqueOperation = { t: 0 };
  async function clicSurBouton(pg, texte, double, attenteActif) {
    const loc = pg.locator('button, [role=button], a, input[type=button], input[type=submit]').filter({ hasText: new RegExp(texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).first();
    await loc.waitFor({ state: 'visible', timeout: 4000 });
    const off = await loc.evaluate((b) => !!b.disabled || b.getAttribute('aria-disabled') === 'true').catch(() => false);
    if (off && attenteActif) { const t = Date.now(); while (Date.now() - t < attenteActif * 1000 && await loc.evaluate((b) => !!b.disabled || b.getAttribute('aria-disabled') === 'true').catch(() => false)) await sleep(250); }
    const encore = await loc.evaluate((b) => !!b.disabled || b.getAttribute('aria-disabled') === 'true').catch(() => false);
    await (double ? loc.dblclick({ timeout: 3000, force: true }) : loc.click({ timeout: 3000, force: true }));
    if (encore) throw new Error('bouton « ' + texte + ' » inactif : le clic n a rien declenche');
  }
  async function tabVers(pg, texte, valider, attenteActif) {
    const re = new RegExp(texte, 'i');
    await pg.bringToFront();
    for (let i = 0; i < 15; i++) {
      const cur = await pg.evaluate(() => { const a = document.activeElement; return a ? (a.innerText || a.value || a.getAttribute('aria-label') || a.tagName) : ''; }).catch(() => '');
      if (re.test(cur)) {
        const off = () => pg.evaluate(() => { const a = document.activeElement; return !!a && (!!a.disabled || a.getAttribute('aria-disabled') === 'true'); }).catch(() => false);
        const t = Date.now(); while (attenteActif && Date.now() - t < attenteActif * 1000 && await off()) await sleep(250);
        const encore = await off();
        await pg.keyboard.press(valider === 'Espace' ? 'Space' : 'Enter');
        if (encore) throw new Error('bouton « ' + texte + ' » inactif : la touche n a rien declenche');
        return i;
      }
      await pg.keyboard.press('Tab'); await sleep(60);
    }
    throw new Error(`bouton « ${texte} » non atteint en 15 Tab`);
  }

  // --- instantane apres chaque geste
  async function instantane(label) {
    const f = fenetreOuverte(), cible = f ? f.page : (S.site && !S.site.isClosed() ? S.site : null), r = { fenetre_ouverte: !!f };
    if (!cible) return r;
    const png = `${String(++S.n).padStart(2, '0')}_${label.replace(/[^a-z0-9_]+/gi, '_').slice(0, 30)}.png`;
    try { await cible.screenshot({ path: join(dirCap, png), timeout: 8000 }); r.capture = `captures/${nom}/${png}`; } catch (e) { r.capture_erreur = String(e.message).split('\n')[0]; }
    r.vue = f ? 'fenetre extension' : 'site';
    try {
      Object.assign(r, await cible.evaluate(() => {
        const root = document.querySelector('[data-outcome]');
        const boutons = [...document.querySelectorAll('button, [role=button], a.hu-btn')].map((b) => ({ texte: (b.innerText || '').replace(/\s+/g, ' ').trim(), inactif: !!b.disabled || b.getAttribute('aria-disabled') === 'true' })).filter((b) => b.texte);
        const a = document.activeElement;
        return { texte: (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 700), verdict_ecran: root ? root.getAttribute('data-outcome') : null,
          notes: [...document.querySelectorAll('.hu-note')].map((x) => x.innerText.trim()), boutons, champ: (document.querySelector('textarea') || {}).value ?? null,
          focus: a && a !== document.body ? (a.tagName + ' ' + (a.innerText || a.value || '').slice(0, 30)).trim() : 'aucun', taille_px: [innerWidth, innerHeight], defilement: document.documentElement.scrollHeight > innerHeight + 2 || document.documentElement.scrollWidth > innerWidth + 2 };
      }));
    } catch (e) { r.lecture_erreur = String(e.message).split('\n')[0]; }
    if (S.site && !S.site.isClosed() && f) { r.site_texte = nomCourt(await S.site.evaluate((sel) => [...document.querySelectorAll(sel)].map((x) => x.innerText).join(' | '), siteConf.etat).catch(() => '')).slice(0, 250); }
    else if (S.site && !S.site.isClosed()) r.site_texte = nomCourt(await S.site.evaluate((sel) => [...document.querySelectorAll(sel)].map((x) => x.innerText).join(' | '), siteConf.etat).catch(() => '')).slice(0, 250);
    return r;
  }

  // --- gestes
  async function geste(g) {
    const nomG = g.g;
    const fen = async () => { const pg = await attendreFenetre(g.attente_fenetre_ms ?? 6000); if (!pg) throw new Error('aucune fenetre de l\'extension ouverte'); await pg.bringToFront().catch(() => {}); return pg; };
    const siteP = () => { if (!S.site || S.site.isClosed()) throw new Error('page du site fermee'); return S.site; };
    switch (nomG) {
      case 'ouvrir_site': { S.site = S.site && !S.site.isClosed() ? S.site : await S.ctx.newPage(); await S.site.goto(urlSite(), { waitUntil: 'domcontentloaded' }); await sleep(g.attendre_ms ?? 1800); return; }
      case 'operation': case 'relancer': {
        const pg = siteP(); await pg.bringToFront().catch(() => {});
        const clic = async (sel) => { clics.push(Date.now() - t0); tCliqueOperation.t = Date.now(); if (p.clavier_seul) { await pg.locator(sel).focus(); await pg.keyboard.press('Enter'); } else if (g.double) await pg.locator(sel).dblclick({ force: true, timeout: 3000 }); else await pg.locator(sel).click({ timeout: 5000 }); };
        if (nomG === 'relancer') { await clic(siteConf.btn); return; }
        if (siteConf.connect) { await clic(siteConf.connect); await sleep(1800); }
        else { const txt = await pg.locator(siteConf.btn).innerText().catch(() => ''); if (/connex|connect/i.test(txt)) { await clic(siteConf.btn); await sleep(2000); } }
        await clic(siteConf.btn); return;
      }
      case 'ecrire': {
        const pg = await fen(); const texte = sub(g.texte);
        const champ = pg.locator('textarea, input[type="text"], input:not([type])').first();
        if (!(await champ.count())) throw new Error('pas de champ de saisie dans la fenetre');
        const focus = await pg.evaluate(() => document.activeElement && document.activeElement.tagName).catch(() => '');
        if (focus !== 'TEXTAREA' && focus !== 'INPUT') { R.etapes.push({ remarque: 'le champ n\'avait pas le focus a l\'ouverture (focus: ' + focus + '), l\'outil le lui donne' }); await champ.focus(); }
        if (g.vitesse_ms > 0) await pg.keyboard.type(texte, { delay: g.vitesse_ms }); else await champ.fill(texte);
        return;
      }
      case 'entree': case 'echap': case 'espace': case 'tab': {
        const pg = await fen(); await pg.keyboard.press(nomG === 'entree' ? 'Enter' : nomG === 'echap' ? 'Escape' : nomG === 'espace' ? 'Space' : g.maj ? 'Shift+Tab' : 'Tab'); return;
      }
      case 'clic': case 'double_clic': {
        const pg = g.page === 'site' ? siteP() : await fen();
        if (p.clavier_seul && g.page !== 'site') { await tabVers(pg, g.texte, g.valider, g.attendre_actif_s); return; }
        await clicSurBouton(pg, g.texte, nomG === 'double_clic', g.attendre_actif_s); return;
      }
      case 'tab_vers': { const pg = g.page === 'site' ? siteP() : await fen(); await tabVers(pg, g.texte, g.valider, g.attendre_actif_s); return; }
      case 'fermer_fenetre': { const pg = await fen(); await pg.close(); return; }
      case 'recharger': { const pg = g.cible === 'site' ? siteP() : await fen(); await pg.reload({ waitUntil: 'domcontentloaded' }); await sleep(g.attendre_ms ?? 800); if (g.cible !== 'site') await appliquerAffichage(pg, true); return; }
      case 'attendre': { await sleep(Math.round((g.secondes ?? 1) * 1000)); return; }
      case 'second_onglet': { const pg = await S.ctx.newPage(); await pg.goto(g.url ? sub(g.url) : urlSite(), { waitUntil: 'domcontentloaded' }); S.onglets.push(pg); S.site = pg; await sleep(g.attendre_ms ?? 1500); return; }
      case 'onglet': { const l = [S.onglets[0], ...S.onglets.slice(1)].filter((x) => x && !x.isClosed()); const pg = l[(g.n ?? 1) - 1]; if (!pg) throw new Error('onglet ' + g.n + ' inexistant'); S.site = pg; await pg.bringToFront(); return; }
      case 'zoom': { S.zoom = g.pourcent; for (const pg of S.ext) if (!pg.isClosed()) await appliquerAffichage(pg, true); if (g.site) { const c = await cdp(siteP()); await c.send('Emulation.setDeviceMetricsOverride', { width: Math.round(1280 * 100 / S.zoom), height: Math.round(720 * 100 / S.zoom), deviceScaleFactor: S.zoom / 100, mobile: false }); } return; }
      case 'theme': { S.theme = g.valeur === 'sombre' ? 'dark' : 'light'; for (const pg of [...S.ext, ...S.onglets]) if (!pg.isClosed()) await pg.emulateMedia({ colorScheme: S.theme }); return; }
      case 'taille': { if (g.cible === 'site') await siteP().setViewportSize({ width: g.largeur, height: g.hauteur }); else { S.tailleFen = [g.largeur, g.hauteur]; for (const pg of S.ext) if (!pg.isClosed()) await appliquerAffichage(pg, true); } return; }
      case 'redemarrer_navigateur': {
        await S.ctx.close().catch(() => {}); S.ext = []; S.onglets = []; S.site = null; S.cdp = new Map();
        await lancer(); const pg = S.ctx.pages()[0] || await S.ctx.newPage(); S.site = pg; S.onglets = [pg];
        await pg.goto(urlSite(), { waitUntil: 'domcontentloaded' }); await sleep(1500); return;
      }
      case 'remplir': { await siteP().locator(g.selecteur).fill(sub(g.valeur)); return; }
      case 'choisir': { await siteP().locator(g.selecteur).selectOption(sub(g.valeur)); return; }
      case 'page_extension': { const pg = await S.ctx.newPage(); await pg.goto(EXT_ORIGIN + g.chemin, { waitUntil: 'domcontentloaded' }); await sleep(800); await pg.bringToFront(); return; }
      case 'capture': case 'lire': return;
      default: throw new Error('geste inconnu : ' + nomG);
    }
  }

  // --- deroulement
  let erreurFatale = null;
  try {
    await lancer();
    const pg0 = S.ctx.pages()[0] || await S.ctx.newPage(); S.site = pg0; S.onglets = [pg0];
    await sleep(600);
    await pg0.goto(urlSite(), { waitUntil: 'domcontentloaded' }); await sleep(p.attente_chargement_ms ?? 2200);
    R.etapes.push({ n: 0, geste: 'ouverture du site', url: urlSite().replace(/0x[0-9a-fA-F]{40}/g, (a) => a.slice(0, 8) + '…'), ...(await instantane('site')) });
    let i = 0;
    for (const g0 of p.gestes || []) {
      const g = subDeep(g0); i++; const tg = Date.now(); const etape = { n: i, geste: g.g, params: Object.fromEntries(Object.entries(g).filter(([k]) => k !== 'g')) };
      try { await geste(g); } catch (e) { etape.erreur = String(e.message).split('\n')[0].slice(0, 200); }
      etape.duree_geste_ms = Date.now() - tg; S.tGeste.push({ debut: tg - t0, fin: Date.now() - t0, g: g.g });
      await sleep(g.apres_ms ?? 400);
      Object.assign(etape, await instantane(`${i}_${g.g}`));
      R.etapes.push(etape);
    }
  } catch (e) { erreurFatale = String(e.message).split('\n')[0]; R.erreur_fatale = erreurFatale; }

  // --- fin : fermeture, mesures de la chaine, verdict
  await sleep(p.attente_fin_ms ?? 600);
  try { if (S.site && !S.site.isClosed()) { const png = `99_fin.png`; await S.site.screenshot({ path: join(dirCap, png), timeout: 5000 }); R.capture_fin_site = `captures/${nom}/${png}`; R.site_etat_fin = nomCourt(await S.site.evaluate((sel) => [...document.querySelectorAll(sel)].map((x) => x.innerText).join(' | '), siteConf.etat).catch(() => '')).slice(0, 300); } } catch { /* ignore */ }
  R.fenetres = S.fen.map((f) => ({ ouverte_a_ms: f.ouvert_ms, fermee_a_ms: f.ferme_ms, affichee_ms: f.ferme_ms != null ? f.ferme_ms - f.ouvert_ms : null, url: urlCourte(f.url) }));
  if (S.ctx) await S.ctx.close().catch(() => {});
  // revendication des signatures Permit : on joue ce que ferait le beneficiaire, pour mesurer le droit reel sur la chaine
  const permits = [];
  for (const s of S.signatures) {
    if (s.primaryType !== 'Permit') { permits.push({ type: s.primaryType, note: 'signature non verifiable mecaniquement' }); continue; }
    try {
      const m = s.message, sg = ethers.Signature.from(s.sig), relayeur = await provider.getSigner(ADR.deployer);
      await (await new ethers.Contract(ADR.usdc, ERC20, relayeur).permit(m.owner, m.spender, m.value, m.deadline, sg.v, sg.r, sg.s)).wait();
      permits.push({ type: 'Permit', revendique: true, beneficiaire: s.rec.destinataire, droit: s.rec.droit_accorde });
    } catch (e) { permits.push({ type: 'Permit', revendique: false, erreur: String(e.message).split('\n')[0].slice(0, 120) }); }
  }
  R.signatures = permits;
  const apres = await etatChaine(ctxChaine); R.chaine_apres = apres;
  const V = verdict(ctxChaine, avant, apres, permits, p.intention ? p.intention : null);
  R.verdict = V.verdict; R.ecarts = V.ecarts; R.bilan = V.bilan;
  // delai : dernier clic sur le site avant la 1re demande de signature/transaction, et ce delai sans les gestes de la personne
  const sign = appels.filter((a) => /eth_sendTransaction|signTypedData|personal_sign/.test(a.methode));
  if (sign.length && clics.length) {
    const first = sign[0].t_ms, last = Math.max(...clics.filter((c) => c <= first));
    const geste = S.tGeste.filter((x) => x.debut >= last && x.fin <= first).reduce((s, x) => s + (x.fin - x.debut), 0);
    R.delai = { clic_site_vers_demande_portefeuille_ms: first - last, dont_gestes_de_la_personne_ms: geste, ajoute_par_l_extension_et_l_outil_ms: first - last - geste, remarque: 'inclut l\'attente de la fenetre et les pauses de l\'outil (~400 ms par geste)' };
  }
  await provider.send('evm_revert', [snap]);
  provider.destroy();
  if (p.profil !== 'garde' && !arg('garder-profils', false)) rmSync(profil, { recursive: true, force: true, maxRetries: 5 });
  R.duree_s = Math.round((Date.now() - t0) / 100) / 10;
  return R;
}

// ---------------------------------------------------------------- rapport lisible
function md(res) {
  const L = [`# Resultats du testeur ${n}`, '', `Joue le ${res.joue_le}. Extension : ${res.extension.extension_id}, tree_sha256 \`${res.extension.build_info.tree_sha256}\`, total_bytes ${res.extension.build_info.total_bytes}. Fichier de parcours : ${res.fichier_parcours}.`, '',
    '## Synthese', '', '| Parcours | Verdict (depuis la chaine) | Ce que le portefeuille a recu | Duree |', '|---|---|---|---|'];
  for (const r of res.parcours) L.push(`| ${r.nom} | ${r.verdict || 'ERREUR ' + r.erreur_fatale} | ${r.portefeuille.map((a) => `${a.methode}${a.destinataire ? ' vers ' + a.destinataire : ''}${a.montant ? ' ' + a.montant : ''}${a.droit_accorde ? ' droit ' + a.droit_accorde : ''}`).join(' ; ') || 'rien'} | ${r.duree_s} s |`);
  L.push('');
  for (const r of res.parcours) {
    L.push(`## ${r.nom}`, '', r.description ? r.description + '\n' : '', `Configuration : \`${JSON.stringify(r.config)}\``, '', `**Verdict : ${r.verdict}**` + (r.ecarts && r.ecarts.length ? '\n\n- ' + r.ecarts.join('\n- ') : ''), '');
    if (r.erreur_fatale) L.push(`Erreur fatale de l'outil : ${r.erreur_fatale}`, '');
    L.push('Bilan chaine : `' + JSON.stringify(r.bilan) + '`', '');
    if (r.delai) L.push(`Delai clic site vers demande portefeuille : ${r.delai.clic_site_vers_demande_portefeuille_ms} ms (dont gestes de la personne ${r.delai.dont_gestes_de_la_personne_ms} ms, reste ${r.delai.ajoute_par_l_extension_et_l_outil_ms} ms).`, '');
    if (r.fenetres.length) L.push('Fenetres de l\'extension : ' + r.fenetres.map((f) => `ouverte a ${f.ouverte_a_ms} ms, ${f.affichee_ms != null ? 'affichee ' + f.affichee_ms + ' ms' : 'encore ouverte a la fin'}`).join(' ; '), '');
    L.push('### Etapes', '');
    for (const e of r.etapes) {
      if (e.remarque) { L.push(`- Remarque : ${e.remarque}`); continue; }
      L.push(`**${e.n}. ${e.geste}** ${e.params && Object.keys(e.params).length ? '`' + JSON.stringify(e.params) + '`' : ''}${e.erreur ? ' ERREUR : ' + e.erreur : ''} (${e.duree_geste_ms ?? 0} ms)`, '',
        `- vue : ${e.vue || 'rien'}${e.verdict_ecran ? ', verdict ecran : ' + e.verdict_ecran : ''}${e.focus ? ', focus : ' + e.focus : ''}${e.taille_px ? ', ' + e.taille_px.join('x') + ' px' : ''}${e.defilement ? ', DEFILEMENT' : ''}`,
        `- texte : ${(e.texte || '').slice(0, 400)}`, `- boutons : ${(e.boutons || []).map((b) => b.texte + (b.inactif ? ' (inactif)' : '')).join(' / ') || 'aucun'}`);
      if (e.notes && e.notes.length) L.push(`- notes : ${e.notes.join(' | ')}`);
      if (e.site_texte) L.push(`- site : ${e.site_texte}`);
      if (e.capture) L.push('', `![${e.geste}](${e.capture})`);
      L.push('');
    }
    if (r.capture_fin_site) L.push(`Fin, vue du site : ![fin](${r.capture_fin_site})`, '');
    L.push('### Portefeuille simule', '', r.portefeuille.length ? r.portefeuille.map((a) => '- ' + JSON.stringify(a)).join('\n') : 'Aucune demande recue.', '');
    if (r.signatures.length) L.push('Signatures : `' + JSON.stringify(r.signatures) + '`', '');
    L.push('### Chaine avant / apres', '', '```', 'avant : ' + JSON.stringify({ avax: r.chaine_avant.avax, usdc: r.chaine_avant.usdc, wavax: r.chaine_avant.wavax, nft: r.chaine_avant.nft_proprietaires }), 'apres : ' + JSON.stringify({ avax: r.chaine_apres.avax, usdc: r.chaine_apres.usdc, wavax: r.chaine_apres.wavax, nft: r.chaine_apres.nft_proprietaires, nft_approuve: r.chaine_apres.nft_approuve }),
      'droits : ' + JSON.stringify(r.chaine_apres.droits), '```', '');
    L.push('### Erreurs de console', '', r.erreurs_console.length ? r.erreurs_console.slice(0, 25).map((x) => `- [${x.source}] ${x.texte}`).join('\n') : 'Aucune.', '');
  }
  return L.join('\n');
}

// ---------------------------------------------------------------- main
const debut = Date.now();
const res = { joue_le: new Date().toISOString(), fichier_parcours: resolve(fichier), id: n, extension: E.extension, parcours: [] };
for (let i = 0; i < parcoursAJouer.length; i++) {
  const p = parcoursAJouer[i];
  let r; try { r = await jouerParcours(p, i); } catch (e) { r = { nom: p.nom, verdict: null, erreur_fatale: String(e.stack || e).split('\n').slice(0, 3).join(' / '), config: {}, etapes: [], portefeuille: [], signatures: [], fenetres: [], erreurs_console: [], bilan: {}, chaine_avant: { avax: 0, usdc: 0, wavax: 0, nft_proprietaires: {} }, chaine_apres: { avax: 0, usdc: 0, wavax: 0, nft_proprietaires: {}, droits: {} }, duree_s: 0 }; }
  res.parcours.push(r);
  console.log(`[${i + 1}/${parcoursAJouer.length}] ${r.nom} : ${r.verdict || 'ERREUR ' + r.erreur_fatale} (${r.duree_s} s)`);
  writeFileSync(join(D, 'resultats.json'), JSON.stringify(res, null, 2)); writeFileSync(join(D, 'resultats.md'), md(res)); // ecrit apres chaque parcours
}
res.duree_totale_s = Math.round((Date.now() - debut) / 100) / 10;
writeFileSync(join(D, 'resultats.json'), JSON.stringify(res, null, 2)); writeFileSync(join(D, 'resultats.md'), md(res));
if (!arg('garder-profils', false)) rmSync(join(D, 'profils'), { recursive: true, force: true, maxRetries: 5 });
console.log(`Termine en ${res.duree_totale_s} s. Lire : ${join(D, 'resultats.md')}`);
