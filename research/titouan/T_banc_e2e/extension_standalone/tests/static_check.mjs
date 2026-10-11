// Controle statique du dossier extension/ : aucun secret, aucun eval / new Function / import dynamique, aucune URL externe, aucune API reseau, manifeste minimal.
// Usage : node tests/static_check.mjs                (build livre par defaut, dossier extension/ : un seul appel reseau, vers le relais local)
//         node tests/static_check.mjs --no-network   (build de repli, dossier extension_sans_reseau/ : aucun reseau)
//         (code retour 1 si un controle echoue)
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const NO_NETWORK = process.argv.includes('--no-network');
const EXT = join(resolve(HERE, '..'), NO_NETWORK ? 'extension_sans_reseau' : 'extension');
const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : files.push(p); } })(EXT);
const rel = (p) => relative(EXT, p).replace(/\\/g, '/');
const findings = []; const info = [];
const add = (kind, p, line, txt) => findings.push({ kind, file: rel(p), line, txt: txt.trim().slice(0, 140) });

const RULES = [
  ['secret', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['secret', /\b(AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['secret', /\bsk-[A-Za-z0-9_-]{20,}/],
  ['secret', /\bgh[pousr]_[A-Za-z0-9]{30,}/],
  ['secret', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['secret', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['secret', /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/],           // JWT
  ['secret', /(api[_-]?key|secret|token|passw(or)?d|mnemonic|seed ?phrase|private[_-]?key)\s*[:=]\s*['"`][^'"`\s]{12,}['"`]/i],
  ['secret', /(private|secret|mnemonic|seed)\w*\s*[:=]\s*['"`]0x[0-9a-fA-F]{64}['"`]/i],
  ['code_dynamique', /\beval\s*\(/],
  ['code_dynamique', /\bnew\s+Function\s*\(/],
  ['code_dynamique', /(^|[^.\w])Function\s*\(\s*['"`]/],
  ['code_dynamique', /\bset(Timeout|Interval)\s*\(\s*['"`]/],
  ['code_dynamique', /\bimportScripts\s*\(/],
  ['code_dynamique', /(^|[^.\w$])import\s*\(/],                                              // import() dynamique
  ['code_dynamique', /\bdocument\.write(ln)?\s*\(/],
  ['code_distant', /<script[^>]+src\s*=\s*['"]?https?:/i],
  ['reseau', /\bfetch\s*\(/],
  ['reseau', /\bXMLHttpRequest\b/],
  ['reseau', /\bnew\s+WebSocket\b/],
  ['reseau', /\bEventSource\b/],
  ['reseau', /\bsendBeacon\b/],
  ['reseau', /chrome\.(webRequest|declarativeNetRequest|proxy|cookies|history|downloads)/],
];
// URL externe = schema http(s)/ws(s)/ftp suivi d'un nom d'hote. "https://" tout seul (comparaison de prefixe) n'en est pas une.
const URL_RE = /\b(?:https?|wss?|ftp):\/\/[A-Za-z0-9[][^\s'"`<>)\\]*/g;
const HEX64 = /\b0x[0-9a-fA-F]{64}\b/g;
let hex64 = 0;
// Seule exception reseau : la phrase ecrite par la personne part vers le relais local de classification (boucle locale), depuis classifier_client.js.
const RELAY_URL = 'http://127.0.0.1:8789', RELAY_FILE = 'classifier_client.js';
let relayFetch = 0;

for (const p of files) {
  if (/\.(png|jpg|ico|zip)$/.test(p)) continue;
  const txt = readFileSync(p, 'utf8');
  txt.split('\n').forEach((ln, i) => {
    for (const [k, re] of RULES) if (re.test(ln)) {
      if (k === 'reseau' && rel(p) === RELAY_FILE && /\bfetch\s*\(\s*RELAY \+ '\/classify'/.test(ln)) { relayFetch++; continue; } // le seul appel reseau admis
      // fetch( dans engine : uniquement s'il s'agit de l'API reseau ; aucune exception necessaire attendue.
      add(k, p, i + 1, ln);
    }
    for (const m of ln.matchAll(URL_RE)) { if ((m[0] === RELAY_URL && rel(p) === RELAY_FILE) || (rel(p) === 'manifest.json' && (m[0] === RELAY_URL || m[0] === RELAY_URL + '/*'))) continue; add('url_externe', p, i + 1, m[0]); }
    hex64 += (ln.match(HEX64) || []).length;
  });
}
// manifeste
const mf = JSON.parse(readFileSync(join(EXT, 'manifest.json'), 'utf8'));
const mcheck = [];
const m = (name, cond, d = '') => mcheck.push({ name, pass: !!cond, detail: d });
m('manifest_version 3', mf.manifest_version === 3);
m('service worker de type module', mf.background && mf.background.type === 'module' && mf.background.service_worker === 'background.js');
// storage : reglages, journal local et demandes retenues (storage.session) ; alarms : echeances de la retenue quand le service worker est arrete.
// La fenetre de verdict (chrome.windows.create d'une page de l'extension) et les messages vers l'onglet demandeur ne demandent aucune permission.
// activeTab : le popup de la barre d'outils lit le site de l'onglet courant, au clic sur l'icone seulement (aucun acces permanent a un site, pas de permission "tabs").
m('permissions = [storage, alarms, sidePanel, activeTab] seulement (ni "tabs", ni acces permanent a un site)', JSON.stringify(mf.permissions) === '["storage","alarms","sidePanel","activeTab"]', JSON.stringify(mf.permissions));
if (NO_NETWORK) {
  m('aucune host_permission', !('host_permissions' in mf) && !('optional_host_permissions' in mf), JSON.stringify(mf.host_permissions));
  m('aucun appel reseau dans le dossier (le client du relais est un stub)', relayFetch === 0, String(relayFetch));
  m('aucune cle d identifiant dans le manifeste', !('key' in mf));
} else {
  m('une seule host_permission : le relais local', JSON.stringify(mf.host_permissions) === JSON.stringify([RELAY_URL + '/*']) && !('optional_host_permissions' in mf), JSON.stringify(mf.host_permissions));
  m('un seul appel reseau dans le dossier livre : fetch(RELAY + /classify) dans ' + RELAY_FILE, relayFetch === 1, String(relayFetch));
  const client = readFileSync(join(EXT, RELAY_FILE), 'utf8');
  m('le client du relais n envoie que { text } : ni en-tete d autorisation, ni cookie, ni cle', client.includes('body: JSON.stringify({ text: cleanText(text) })') && client.includes("credentials: 'omit'") && client.includes("redirect: 'error'") && !/authorization|bearer|api[_-]?key|cookie/i.test(client));
  m('cle du manifeste : cle PUBLIQUE seulement (SubjectPublicKeyInfo RSA), aucune cle privee dans le dossier', typeof mf.key === 'string' && /^MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A[A-Za-z0-9+/]+=*$/.test(mf.key) && mf.key.length < 400);
}
m('aucune permission optionnelle', !('optional_permissions' in mf));
m('pas de externally_connectable / web_accessible_resources / update_url', !('externally_connectable' in mf) && !('web_accessible_resources' in mf) && !('update_url' in mf));
const csp = (mf.content_security_policy || {}).extension_pages || '';
if (NO_NETWORK) m("CSP : script-src self, connect-src 'none'", /script-src 'self'/.test(csp) && /connect-src 'none'(;|$)/.test(csp) && !/https?:|unsafe-eval|unsafe-inline|wasm-unsafe/.test(csp), csp);
else m('CSP : script-src self, connect-src ' + RELAY_URL + ' et rien d autre', csp === "script-src 'self'; object-src 'self'; connect-src " + RELAY_URL, csp);
m('seuls bridge.js / inject.js en scripts de contenu, fichiers presents', (mf.content_scripts || []).every((c) => c.js.every((f) => files.some((p) => rel(p) === f))));

// pages de l'extension : scripts locaux seulement, aucun script en ligne, aucun gestionnaire en attribut
for (const p of files.filter((x) => x.endsWith('.html'))) {
  const t = readFileSync(p, 'utf8');
  const scripts = [...t.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  m('page ' + rel(p) + ' : scripts locaux, rien en ligne', scripts.every((s) => /\bsrc\s*=\s*"[\w./-]+\.js"/.test(s[1]) && !s[2].trim()) && !/\son[a-z]+\s*=/i.test(t));
}
// aucun mode test ni reponse automatique dans le dossier livre : le crochet n'existe que dans le build --test-hook (dossier extension_test/)
const bgTxt = readFileSync(join(EXT, 'background.js'), 'utf8');
m('aucun crochet de test dans le service worker livre', !/testHook|TEST_HOOK|__holdupTestHook/.test(bgTxt) && /createGatekeeper\(\{ check: localCheck, classify: classifyViaRelay\s*\}\)/.test(bgTxt));
m('aucun fichier ne pose le crochet de test ni un mode auto', files.filter((p) => /\.(js|html|json)$/.test(p) && !/BUILD_INFO\.json$/.test(p)).every((p) => !/__holdupTestHook|testMode|cfg\.auto\b/.test(readFileSync(p, 'utf8'))));
m('fenetre presente (window.html + ui/screen.js + feuilles du systeme)', ['window.html', 'window.js', 'window.css', 'ui/screen.js', 'ui/tokens.css', 'ui/components.css', 'ui/motion.css', 'popup.html', 'welcome.html', 'gatekeeper.js', 'hold_core.js', 'intent_text.js', 'outcome.js'].every((f) => files.some((p) => rel(p) === f)));

// chaque module du dossier livre doit se charger : une erreur de syntaxe dans une source du moteur rend le service worker inchargeable
{
  const { pathToFileURL } = await import('node:url');
  let err = '';
  try { const core = await import(pathToFileURL(join(EXT, 'engine', 'sentinelle_core.js')).href); const v = core.check({ origin: 'https://x.test', method: 'personal_sign', params: ['0x00', '0x' + '1'.repeat(40)] }); if (!v || v.level === 'ok') err = 'verdict invalide'; }
  catch (e) { err = String(e && e.message || e).slice(0, 160); }
  m('le moteur embarque se charge et repond (aucune erreur de syntaxe dans engine/)', !err, err);
}
// Le moteur embarque est EXECUTE sur un petit lot de demandes variees, dont des demandes sans aucun signal (envoi simple, droit borne) :
// une exception dans evaluate() ne se voit pas a l'import, elle donne un verdict « erreur interne du moteur » (donc « pas pu verifier »
// sans question pour tout le monde). Bug du 11 oct. : `const niveau` reaffecte. Aucun paquet n'est produit si ce controle echoue.
{
  const { pathToFileURL } = await import('node:url');
  const A = '0x' + 'a1'.repeat(20), B = '0x' + 'b2'.repeat(20), T = '0x' + 'c3'.repeat(20), w = (x) => String(x).replace(/^0x/, '').padStart(64, '0');
  const tx = (o) => ({ origin: 'https://site.exemple', method: 'eth_sendTransaction', chainId: '0xa86a', from: A, params: [Object.assign({ from: A }, o)] });
  const typed = (primaryType, message, domain) => ({ origin: 'https://site.exemple', method: 'eth_signTypedData_v4', chainId: '0x1', from: A, params: [A, JSON.stringify({ types: { EIP712Domain: [] }, primaryType, domain, message })] });
  const LOT = {
    'envoi simple de monnaie du reseau (aucun signal)': tx({ to: B, value: '0x2386f26fc10000' }),
    'envoi sans valeur ni donnees': tx({ to: B, value: '0x0', data: '0x' }),
    'transfert de jeton': tx({ to: T, data: '0xa9059cbb' + w(B) + w('0x2faf080') }),
    'droit borne': tx({ to: T, data: '0x095ea7b3' + w(B) + w('0x2faf080') }),
    'droit illimite': tx({ to: T, data: '0x095ea7b3' + w(B) + 'f'.repeat(64) }),
    'droit sur une collection': tx({ to: T, data: '0xa22cb465' + w(B) + w('0x1') }),
    'appel inconnu': tx({ to: B, data: '0x5c11d795' + w('0x1') }),
    'signature Permit': typed('Permit', { owner: A, spender: B, value: '50000000', nonce: '0', deadline: '1999999999' }, { name: 'USD Coin', version: '2', chainId: 1, verifyingContract: T }),
    'message signe': { origin: 'https://site.exemple', method: 'personal_sign', chainId: '0x1', from: A, params: ['0x626f6e6a6f7572', A] },
    'eth_sign': { origin: 'https://site.exemple', method: 'eth_sign', chainId: '0x1', from: A, params: [A, '0x' + '11'.repeat(32)] },
    'lot de deux appels': { origin: 'https://site.exemple', method: 'wallet_sendCalls', chainId: '0x1', from: A, params: [{ from: A, calls: [{ to: T, data: '0x095ea7b3' + w(B) + w('0x1') }, { to: B, value: '0x1' }] }] },
    'avec une phrase ecrite': Object.assign(tx({ to: B, value: '0x2386f26fc10000' }), { intent: 'pay', intent_kind: 'pay_someone', intent_text: 'envoyer 0,01 AVAX à ' + B, intent_amount: '0.01', intent_symbol: 'AVAX' })
  };
  const bad = [];
  try {
    const core = await import(pathToFileURL(join(EXT, 'engine', 'sentinelle_core.js')).href);
    for (const name of Object.keys(LOT)) {
      let v; try { v = core.check(LOT[name], core.emptyLocal()); } catch (e) { bad.push(name + ' : exception ' + String(e && e.message || e).slice(0, 80)); continue; }
      if (!v || !['attention', 'danger', 'manipulation', 'unknown'].includes(v.level)) bad.push(name + ' : verdict invalide');
      else if (/erreur interne du moteur|verdict invalide|moteur indisponible/.test(String(v.why || ''))) bad.push(name + ' : ' + String(v.why).slice(0, 100));
    }
  } catch (e) { bad.push('chargement : ' + String(e && e.message || e).slice(0, 120)); }
  m('le moteur embarque s execute sans exception sur ' + Object.keys(LOT).length + ' demandes variees (dont des demandes sans aucun signal)', bad.length === 0, bad.join(' | '));
}

const byKind = {}; for (const f of findings) (byKind[f.kind] = byKind[f.kind] || []).push(f);
const kinds = ['secret', 'code_dynamique', 'code_distant', 'reseau', 'url_externe'];
const res = { fichiers_analyses: files.length, constantes_64_hex_publiques: hex64, constats: byKind, manifeste: mcheck };
let fail = 0;
for (const k of kinds) { const n = (byKind[k] || []).length; console.log(`${n === 0 ? 'ok    ' : 'ECHEC '} ${k} : ${n} occurrence(s)`); if (n) { fail++; byKind[k].slice(0, 15).forEach((f) => console.log(`        ${f.file}:${f.line}  ${f.txt}`)); } }
for (const c of mcheck) { console.log(`${c.pass ? 'ok    ' : 'ECHEC '} manifeste : ${c.name}${c.detail ? ' (' + c.detail + ')' : ''}`); if (!c.pass) fail++; }
console.log(`info : ${files.length} fichiers analyses ; ${hex64} constante(s) 0x+64 hex (aucune n'est assignee a un nom de secret)`);
writeFileSync(join(resolve(HERE, '..'), 'out', NO_NETWORK ? 'STATIC_sans_reseau.json' : 'STATIC.json'), JSON.stringify(res, null, 1));
process.exit(fail ? 1 : 0);
