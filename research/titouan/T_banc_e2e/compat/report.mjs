// Usage: node report.mjs [--sites sites.json] [--results results] [--out COMPAT_REEL.md] [--title "..."]
// Lit les tours A1 (controle), B (test, enveloppe), A2 (controle bis = bruit A/A), H (optionnel, enveloppe durcie) et produit le rapport.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normErr } from './lib/visit.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const sites = JSON.parse(readFileSync(path.resolve(HERE, arg('sites', 'sites.json')), 'utf8'));
const resDir = path.resolve(HERE, arg('results', 'results'));
const outFile = path.resolve(HERE, arg('out', 'COMPAT_REEL.md'));
const title = arg('title', 'COMPAT_REEL - compatibilite reelle de la couche d\'interposition (window.ethereum + EIP-6963)');
const load = (round, id) => { const f = path.join(resDir, round, id + '.json'); return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; };

export function wilson(k, n, z = 1.96) {
  if (!n) return [0, 0];
  const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), a = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [Math.max(0, (c - a) / d), Math.min(1, (c + a) / d)];
}
const pct = (x) => (100 * x).toFixed(1) + ' %';
const ci = (k, n) => { const [lo, hi] = wilson(k, n); return `${k}/${n} = ${n ? pct(k / n) : 'n/a'} [IC95 Wilson ${pct(lo)} ; ${pct(hi)}]`; };

function feat(r) {
  if (!r) return null;
  const ev = (r.events || []).slice(0, r.evN == null ? undefined : r.evN);
  const accessible = !r.navError && !r.fatal && !!r.ui1 && !r.ui1.error && !r.botwall && !(r.main && r.main.status >= 400);
  const s1 = r.state1 || {};
  const detected = (s1.reads || 0) > 0 || (s1.req6963 || 0) > 0 || ev.some(e => e.t === 'read1' || e.t === 'req6963' || e.t === 'req');
  const reqAcc = ev.some(e => e.t === 'req' && e.m === 'eth_requestAccounts');
  const errs = new Set([...(r.console || []), ...(r.exceptions || [])].map(e => normErr(e.text)).concat((r.logErrors || []).map(e => normErr(e.source + ': ' + e.text + ' ' + e.url))));
  const frameUse = ev.filter(e => e.top === false && ['read1', 'req6963', 'req'].includes(e.t)).length;
  return { r, accessible, loaded: !r.navError && !r.fatal && !!r.ui1, status: r.main ? r.main.status : null, botwall: !!r.botwall, detected, reqAcc,
    connectedUI: !!(r.ui1 && r.ui1.connectedUI), clicked: !!r.clicked1, wc: !!(r.ui1 && r.ui1.wc), mm: !!(r.ui1 && r.ui1.mmListed),
    errs, frameUse, workers: (r.workers || []).length, popups: (r.popups || []).length, csp: r.csp || null, tamper: r.tamper || null,
    cspHeader: r.main && r.main.csp ? r.main.csp.slice(0, 160) : null, nodes: r.ui1 ? r.ui1.nodes : null, reason: r.navError || r.fatal || (r.botwall ? 'mur anti-bot / challenge' : (r.main && r.main.status >= 400 ? 'HTTP ' + r.main.status : '')) };
}
const WALLETERR = /illegal invocation|proxy|ethereum|provider|eip-?1193|eip-?6963|wallet|metamask|web3|\.request is not|is not a function|cannot read prop/i;

const rows = []; const tamperAgg = {}; let noiseNewErrs = 0, noiseN = 0, bNewErrs = 0, bN = 0;
for (const s of sites) {
  const A1 = feat(load('A1', s.id)), B = feat(load('B', s.id)), A2 = feat(load('A2', s.id)), H = feat(load('H', s.id));
  const row = { site: s, A1, B, A2, H, label: '', reasons: [], causes: [], notes: [] };
  const accA = [A1, A2].filter(x => x && x.accessible);
  if (!accA.length) {
    row.label = 'SITE INACCESSIBLE';
    const f = A1 || A2 || B; row.reasons.push(f ? (f.reason || 'non charge') : 'aucune donnee');
    rows.push(row); continue;
  }
  const ref = accA[0];
  const stable = (f) => A1 && A2 && A1.accessible && A2.accessible && f(A1) === f(A2);
  const sig = { break: [], soft: [] };
  if (!B || !B.accessible) { sig.break.push(B ? `bras test: page non chargee (${B.reason || 'echec'}) alors que le controle charge` : 'bras test manquant'); }
  else {
    const brk = [['detected', 'detection du portefeuille'], ['reqAcc', 'appel eth_requestAccounts'], ['connectedUI', 'UI affiche l\'etat connecte']];
    for (const [k, lab] of brk) if (stable(x => x[k]) && A1[k] !== B[k]) (A1[k] ? sig.break : sig.soft).push((A1[k] ? 'perte: ' : 'gain: ') + lab);
    for (const [k, lab] of [['clicked', 'bouton de connexion trouve/clique'], ['wc', 'fenetre WalletConnect'], ['mm', 'MetaMask liste dans la modale']])
      if (stable(x => x[k]) && A1[k] !== B[k]) sig.soft.push('difference: ' + lab);
    const base = new Set([...(A1 ? A1.errs : []), ...(A2 ? A2.errs : [])]);
    const newB = [...B.errs].filter(e => !base.has(e));
    bN++; if (newB.length) bNewErrs++;
    if (A1 && A2 && A1.accessible && A2.accessible) { noiseN++; if ([...A2.errs].some(e => !A1.errs.has(e))) noiseNewErrs++; }
    const w = newB.filter(e => WALLETERR.test(e));
    if (w.length) sig.break.push('erreurs nouvelles liees au portefeuille: ' + w.slice(0, 2).join(' | '));
    else if (newB.length) sig.soft.push(`${newB.length} erreur(s) console nouvelle(s) hors portefeuille (ex: ${newB[0].slice(0, 90)})`);
    if (B.tamper && B.tamper.overwritten && !(A1 && A1.tamper && A1.tamper.overwritten)) sig.soft.push('le site remplace window.ethereum dans le bras test uniquement');
    row.newErrs = newB;
    // empreinte d'alteration
    if (B.tamper && ref.tamper) for (const k of ['tag', 'own', 'proto', 'reqNative', 'reqName', 'reqLen', 'reqStable', 'onReturnsSelf', 'same6963', 'isMetaMask', 'ours'])
      if (String(B.tamper[k]) !== String(ref.tamper[k])) tamperAgg[k] = (tamperAgg[k] || 0) + 1;
  }
  row.label = sig.break.length ? 'CASSE' : sig.soft.length ? 'DIFFÉRENCE' : 'PASS';
  row.reasons = [...sig.break, ...sig.soft];
  // causes
  const awareA = accA.some(x => x.detected);
  row.aware = awareA;
  if (accA.some(x => x.csp && x.csp.inlineExecuted === false)) row.causes.push('CSP (injection par <script> en ligne bloquee)');
  if (accA.some(x => x.frameUse > 0)) row.causes.push('iframes (le fournisseur est lu dans un sous-cadre)');
  if (accA.some(x => x.workers > 0)) row.causes.push('worker (' + accA.find(x => x.workers).workers + ' worker(s): hors portee d\'une injection)');
  if (!awareA) {
    if (accA.some(x => x.wc)) row.causes.push('WalletConnect uniquement');
    else row.causes.push('aucun support d\'injection observe (ni window.ethereum ni EIP-6963 avant/apres clic' + (accA.some(x => x.clicked) ? '' : '; bouton de connexion non trouve') + ')');
  } else if (accA.some(x => x.wc) && !accA.some(x => x.reqAcc)) row.causes.push('WalletConnect propose, pas d\'appel eth_requestAccounts');
  if (row.label === 'CASSE' && B && B.accessible && ref.reqAcc && !B.reqAcc && !(B.errs.size && row.newErrs.length)) row.causes.push('detection de proxy (hypothese: perte d\'eth_requestAccounts sans erreur)');
  rows.push(row);
}

const acc = rows.filter(r => r.label !== 'SITE INACCESSIBLE');
const cnt = (l) => rows.filter(r => r.label === l).length;
const aware = acc.filter(r => r.aware);
const broke = acc.filter(r => r.label === 'CASSE'), diff = acc.filter(r => r.label === 'DIFFÉRENCE');
const awareBroke = aware.filter(r => r.label === 'CASSE');
const hardenedRows = rows.filter(r => r.H);
const yn = (b) => b ? 'oui' : 'non';
const cell = (x, f) => x ? (x.accessible ? f(x) : 'x') : '-';

let md = `# ${title}\n\nGenere le ${new Date().toISOString()} par \`report.mjs\` a partir de \`${path.relative(HERE, resDir)}/\`. Donnees brutes: un JSON par site et par tour.\n\n`;
md += `## Methode (resume)\n\n- Chrome installe, \`--headless=new\`, CDP brut (WebSocket Node), profil temporaire, contexte de navigateur vierge par visite, UA = celui de Chrome sans le jeton "Headless". Aucune installation.\n`;
md += `- Injection par \`Page.addScriptToEvaluateOnNewDocument\` (tous les cadres, y compris les iframes hors-processus via auto-attach). Fournisseur EIP-1193 SIMULE (adresse de test 0x1111...1111, reponses fictives, se presente comme MetaMask / rdns io.metamask pour que les sites le listent). Toute demande de signature ou de transaction est rejetee (code 4001); aucune transaction n'est creee.\n`;
md += `- Trois visites par site, espacees (tours complets l'un apres l'autre): **A1** controle (fournisseur non enveloppe), **B** test (meme fournisseur enveloppe par un Proxy transparent qui journalise), **A2** controle bis. A1 vs A2 mesure le bruit propre au site (pub, A/B tests, horloge): un ecart n'est retenu que si A1 = A2 et B different.\n`;
md += `- Clic: uniquement un bouton de connexion (heuristique: texte "Connect wallet"/"Connect", sinon "Launch app"/"Log in"; visible, non masque par un bandeau, jamais de texte d'achat/swap/signature), puis au plus l'option "MetaMask / Browser wallet / Injected" de la modale. Pas de bandeau cookies accepte, pas de formulaire, pas de saisie.\n`;
md += `- Criteres de casse (par site, controle stable): la page ne charge plus; le site ne detecte plus le portefeuille (lecture de window.ethereum / requete EIP-6963); \`eth_requestAccounts\` n'est plus appele; l'UI n'affiche plus l'etat connecte; erreur console nouvelle liee au portefeuille. DIFFÉRENCE = ecart mineur (bouton, modale, erreurs hors portefeuille). Les ecarts de controle sont traites comme du bruit.\n\n`;

md += `## Resultats chiffres\n\n`;
md += `| Mesure | Valeur |\n|---|---|\n`;
md += `| Sites testes | ${rows.length} |\n| PASS | ${cnt('PASS')} |\n| DIFFÉRENCE | ${cnt('DIFFÉRENCE')} |\n| CASSE | ${cnt('CASSE')} |\n| SITE INACCESSIBLE | ${cnt('SITE INACCESSIBLE')} |\n`;
md += `| **Taux de casse** (CASSE / sites accessibles) | ${ci(broke.length, acc.length)} |\n`;
md += `| Taux de casse ou difference | ${ci(broke.length + diff.length, acc.length)} |\n`;
md += `| Sites qui detectent un portefeuille (bras controle) | ${ci(aware.length, acc.length)} |\n`;
md += `| **Taux de casse parmi les sites sensibles au portefeuille** | ${ci(awareBroke.length, aware.length)} |\n`;
md += `| Bruit A/A: sites avec >=1 erreur console de A2 absente de A1 | ${ci(noiseNewErrs, noiseN)} |\n| Bras test: sites avec >=1 erreur console absente de A1 et A2 | ${ci(bNewErrs, bN)} |\n\n`;
md += `Lecture: le "bruit A/A" donne la part de "erreurs nouvelles" qui apparait SANS aucune difference d'injection; seule la part excedentaire du bras test est attribuable a l'enveloppe.\n\n`;

md += `## Tableau par site\n\nColonnes: Charge / Detecte / Req = eth_requestAccounts / UI = etat connecte affiche, en A1, B, A2 (oui, non, x = inaccessible, - = pas de donnee). "Bouton" = texte clique en A1.\n\n`;
md += `| Site | Categorie | Verdict | Charge A1/B/A2 | Detecte A1/B/A2 | Req A1/B/A2 | UI A1/B/A2 | Bouton | Causes / raisons |\n|---|---|---|---|---|---|---|---|---|\n`;
const tri = (r, f) => [r.A1, r.B, r.A2].map(x => cell(x, f)).join('/');
for (const r of rows) {
  const a = r.A1 || r.A2;
  md += `| ${r.site.name} | ${r.site.category} | **${r.label}** | ${tri(r, x => yn(x.loaded))} | ${tri(r, x => yn(x.detected))} | ${tri(r, x => yn(x.reqAcc))} | ${tri(r, x => yn(x.connectedUI))} | ${a && a.r.clicked1 ? String(a.r.clicked1).replace(/\|/g, '/') : '-'} | ${[...r.reasons, ...r.causes].join(' ; ').replace(/\|/g, '/')} |\n`;
}

md += `\n## Classification des causes\n\n`;
const causeCount = {}; const bump = (k, r) => { (causeCount[k] = causeCount[k] || []).push(r.site.id); };
for (const r of acc) for (const c of r.causes) bump(c.split(' (')[0], r);
md += `| Cause | Sites accessibles concernes | Liste |\n|---|---|---|\n`;
for (const [k, v] of Object.entries(causeCount).sort((a, b) => b[1].length - a[1].length)) md += `| ${k} | ${v.length} | ${v.join(', ')} |\n`;
md += `\nSites CASSE: ${broke.map(r => r.site.id).join(', ') || 'aucun'}.\nSites DIFFÉRENCE: ${diff.map(r => r.site.id).join(', ') || 'aucun'}.\nSites INACCESSIBLES: ${rows.filter(r => r.label === 'SITE INACCESSIBLE').map(r => `${r.site.id} (${r.reasons[0]})`).join(', ') || 'aucun'}.\n`;
md += `\nNotes sur les causes: "CSP" est mesure par une sonde reelle (un <script> en ligne est-il execute dans la page ?) donc un injecteur de type content-script qui insere une balise <script> serait bloque; l'injection CDP (utilisee ici) et un content-script "world: MAIN" d'une extension MV3 ne le sont pas. "worker": window.ethereum n'existe pas dans un worker, aucune extension n'y injecte; la ligne ne signale que la presence de workers. "detection de proxy" est une HYPOTHESE (perte d'appel sans erreur), pas une preuve.\n`;

md += `\n## Detection d'alteration (empreinte identique sur tous les sites)\n\nChamps de l'empreinte qui different entre bras controle et bras test, sur les sites ou les deux ont ete mesures:\n\n`;
const nT = acc.filter(r => r.B && r.B.accessible && r.B.tamper).length;
md += `| Champ | Sites ou B differe de A1 (sur ${nT}) |\n|---|---|\n`;
for (const k of ['tag', 'own', 'proto', 'reqNative', 'reqName', 'reqLen', 'reqStable', 'onReturnsSelf', 'same6963', 'isMetaMask', 'ours']) md += `| ${k} | ${tamperAgg[k] || 0} |\n`;
const ex = acc.find(r => r.B && r.B.tamper && r.A1 && r.A1.tamper);
if (ex) md += `\nExemple (${ex.site.id}): controle \`${JSON.stringify(ex.A1.tamper)}\`\n\ntest \`${JSON.stringify(ex.B.tamper)}\`\n`;
md += `\nLe champ attendu est \`reqNative\`: \`Function.prototype.toString.call(window.ethereum.request)\` d'un Proxy de fonction renvoie "[native code]" alors que le vrai \`request\` renvoie son source. C'est la seule trace non triviale de l'enveloppe qu'un site peut tester sans cooperation.\n`;

if (hardenedRows.length) {
  md += `\n## Bras durci (H: Proxy + Function.prototype.toString corrige)\n\nTour optionnel, execute sur: ${hardenedRows.map(r => r.site.id).join(', ')}.\n\n| Site | Verdict B | reqNative B / H | Req A1/B/H | UI A1/B/H |\n|---|---|---|---|---|\n`;
  for (const r of hardenedRows) md += `| ${r.site.id} | ${r.label} | ${r.B && r.B.tamper ? r.B.tamper.reqNative : '-'} / ${r.H.tamper ? r.H.tamper.reqNative : '-'} | ${[r.A1, r.B, r.H].map(x => x ? yn(x.reqAcc) : '-').join('/')} | ${[r.A1, r.B, r.H].map(x => x ? yn(x.connectedUI) : '-').join('/')} |\n`;
}

md += `\n## Correctifs que l'injecteur devrait faire\n\n1. **Masquer le Proxy de fonction**: patcher \`Function.prototype.toString\` (lui-meme proxifie, WeakMap proxy -> original, y compris pour lui-meme) pour que \`request\`, \`on\`, etc. renvoient le source d'origine; verifie par le bras H. Preferer ne pas proxifier: poser directement des fonctions liees sur l'objet.\n`;
md += `2. **Ne jamais fuiter l'objet brut**: toute methode qui renvoie \`this\` (\`on\`, \`once\`, \`removeListener\`) doit renvoyer l'enveloppe (corrige dans l'injecteur: verifie par \`onReturnsSelf\`).\n`;
md += `3. **Identite unique**: \`window.ethereum\`, le \`provider\` annonce en EIP-6963 et \`providers[]\` doivent etre le meme objet (\`same6963\`); annoncer a l'initialisation ET en reponse a chaque \`eip6963:requestProvider\`.\n`;
md += `4. **Injection au bon moment et dans tous les cadres**: \`world: "MAIN"\`, \`run_at: document_start\`, \`all_frames: true\`, \`match_about_blank: true\` (les sous-cadres lisent le fournisseur: voir la cause iframes); ne pas utiliser de balise <script> en ligne (cause CSP). Pas d'injection possible dans les workers: documenter.\n`;
md += `5. **Garder window.ethereum inscriptible/remplacable** comme MetaMask (plusieurs portefeuilles, \`window.ethereum.providers\`), et ne pas lever d'exception si un site reaffecte la propriete.\n`;
md += `6. **Prevoir le cas "portefeuille absent"**: les sites WalletConnect-only ou non-EVM (Solana) n'utilisent pas l'injection; l'extension ne peut pas y etre "interposee" sans cibler WalletConnect/relais, ce qui est une autre couche.\n`;
md += `7. **Ne rien journaliser de sensible** et ne jamais signer: la couche de test rejette tout (4001); en production, l'enveloppe doit transmettre sans modifier \`params\`.\n`;

md += `\n## Limites et ce qui n'a pas pu etre teste\n\n`;
md += `- Fournisseur simule: il valide l'absence de casse due a l'ENVELOPPE, pas le comportement du vrai portefeuille ni de la chaine reelle (aucune lecture RPC reelle: eth_call renvoie 0x).\n`;
md += `- Aucune connexion reelle, aucune signature: les flux apres connexion (approbations, swaps, SIWE) ne sont pas testes.\n`;
md += `- Les boutons de connexion dans des iframes hors-processus ou dans des shadow DOM fermes ne sont pas atteints; les modales exigeant defilement/survol non plus. Un site peut etre "PASS" parce que le bouton n'a pas ete trouve; la colonne Bouton et la cause "bouton non trouve" le signalent.\n`;
md += `- Sites derriere mur anti-bot ou redirection de geolocalisation: marques INACCESSIBLES (aucun contournement tente). Chrome headless a ete lance avec le meme UA que Chrome sans jeton "Headless".\n`;
md += `- Un seul poste, un seul reseau, une journee: les echecs reseau transitoires peuvent classer un site INACCESSIBLE; l'echantillon (${rows.length} sites) est de commodite, pas aleatoire, donc l'IC de Wilson mesure l'incertitude d'echantillonnage seulement.\n`;
md += `- Rejouer: \`node run_all.mjs\` puis \`node report.mjs\`; validation du harnais: \`node selftest.mjs\`.\n`;

writeFileSync(outFile, md);
writeFileSync(path.join(path.dirname(outFile), path.basename(outFile, '.md') + '.csv'),
  'id;categorie;verdict;charge_A1;charge_B;charge_A2;detecte_A1;detecte_B;req_A1;req_B;req_A2;ui_A1;ui_B;causes\n' +
  rows.map(r => [r.site.id, r.site.category, r.label, ...[r.A1, r.B, r.A2].map(x => x ? x.loaded : ''), ...[r.A1, r.B].map(x => x ? x.detected : ''), ...[r.A1, r.B, r.A2].map(x => x ? x.reqAcc : ''), ...[r.A1, r.B].map(x => x ? x.connectedUI : ''), [...r.reasons, ...r.causes].join(' / ').replace(/;/g, ',')].join(';')).join('\n'));
console.log(JSON.stringify({ total: rows.length, pass: cnt('PASS'), diff: cnt('DIFFÉRENCE'), casse: cnt('CASSE'), inacc: cnt('SITE INACCESSIBLE'), aware: aware.length, awareBroke: awareBroke.length,
  casseRate: ci(broke.length, acc.length), awareRate: ci(awareBroke.length, aware.length), noise: ci(noiseNewErrs, noiseN), bnew: ci(bNewErrs, bN) }, null, 1));
