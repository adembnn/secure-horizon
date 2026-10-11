// Faux serveur /check pour tester l'extension seule. Usage : node mock_engine.mjs [port]  (defaut 8787)
// Ecoute uniquement sur 127.0.0.1. Aucune donnee reelle. Regles volontairement simples et deterministes.
import http from 'node:http';
import { fileURLToPath } from 'node:url';

export const CONTACTS = { '0x1234567890abcdef1234567890abcdef12345678': 'Paul' };
const UNLIMITED = 2n ** 128n;
const MANIP = /(support|conseiller|urgent|ne (le )?dis (rien|à personne|a personne)|anydesk|d[ée]place(r)? (tes|vos) fonds)/i;

function toBig(v) { try { return v ? BigInt(v) : 0n; } catch { return 0n; } }
function hexToText(h) { try { return Buffer.from(String(h).replace(/^0x/, ''), 'hex').toString('utf8'); } catch { return ''; } }
function lookalike(addr) {
  const a = addr.toLowerCase();
  for (const c of Object.keys(CONTACTS)) if (a !== c && a.slice(0, 6) === c.slice(0, 6) && a.slice(-4) === c.slice(-4)) return c;
  return null;
}
const APPROVE_MSG = { said_receive: { text: 'Je reçois', amount: '50 USDX', detail: 'un remboursement' } };

export function decide(body, mode = {}) {
  const { method, params = [], origin = '', intent, pageText = '' } = body;
  const host = (() => { try { return new URL(origin).hostname; } catch { return origin; } })();
  const out = { level: 'ok', engine: 'mock', reasons: [], effects: { grants_right: false, funds_out: false }, risk_signals: [] };
  const tx = (params && params[0] && typeof params[0] === 'object') ? params[0] : {};
  const data = String(tx.data || tx.input || '');
  const sel = data.slice(0, 10).toLowerCase();
  const danger = (r) => { out.level = 'danger'; out.reasons.push(...r); };

  if (method === 'eth_sendTransaction' || method === 'eth_signTransaction' || method === 'wallet_sendCalls' || method === 'eth_sendRawTransaction') {
    const calls = method === 'wallet_sendCalls' ? ((tx.calls) || []) : [tx];
    if (method === 'eth_sendRawTransaction') { out.level = 'attention'; out.effects.funds_out = true; out.reasons.push('Transaction déjà signée : impossible de la lire.'); }
    for (const c of calls) {
      const cd = String(c.data || c.input || ''), cs = cd.slice(0, 10).toLowerCase();
      if (cs === '0x095ea7b3') {
        out.effects.grants_right = true;
        const amt = BigInt('0x' + (cd.slice(74, 138) || '0'));
        if (amt >= UNLIMITED) {
          danger(["Aucun argent n'arrive chez toi.", 'Ce site obtient le droit de prendre tout ton solde, sans limite de temps.']);
          out.said = intent === 'receive' ? APPROVE_MSG.said_receive : { text: 'Le site affiche', amount: 'une action simple', detail: '' };
          out.real = { text: 'Ce site pourrait prendre', amount: '2 480 USDX', detail: "tout ton solde, sans limite de temps. Tu ne reçois rien." };
        } else if (out.level === 'ok') out.level = 'attention', out.reasons.push('Un droit limité est accordé à ce site.');
      } else if (cs === '0xa22cb465') {
        out.effects.grants_right = true;
        danger(['Ce site obtient le droit de déplacer tous tes objets.']);
        out.said = { text: 'Le site affiche', amount: 'une action simple', detail: '' };
        out.real = { text: 'Ce site pourrait déplacer', amount: 'tous tes objets', detail: 'sans te demander à nouveau.' };
      } else {
        const to = String(c.to || '').toLowerCase();
        const v = toBig(c.value);
        if (v > 0n || cs === '0xa9059cbb') {
          out.effects.funds_out = true;
          const dest = cs === '0xa9059cbb' ? '0x' + cd.slice(34, 74) : to;
          if (CONTACTS[dest]) { /* contact connu */ }
          else {
            const lk = lookalike(dest);
            if (lk) {
              out.risk_signals.push('lookalike', 'new_recipient');
              danger(['Cette adresse ressemble à celle de ' + CONTACTS[lk] + ' mais ce n\'est pas la même.']);
              out.address_diff = { expected: lk, actual: dest, expectedLabel: CONTACTS[lk] + ' (déjà utilisée par toi)' };
              out.said = { text: 'Tu veux payer', amount: CONTACTS[lk], detail: '' };
              out.real = { text: 'Ça part vers', amount: 'une autre adresse', detail: 'qui ressemble à la sienne' };
            } else {
              out.risk_signals.push('new_recipient');
              if (out.level === 'ok' && v >= 10n ** 18n) { out.level = 'attention'; out.reasons.push("Cette adresse n'a jamais reçu d'argent de ta part."); }
            }
          }
        }
      }
    }
  } else if (method.startsWith('eth_signTypedData')) {
    let td = params[1]; try { if (typeof td === 'string') td = JSON.parse(td); } catch { td = {}; }
    if (/permit/i.test((td && td.primaryType) || '')) {
      out.effects.grants_right = true;
      danger(['Cette signature donne le droit de prendre tes jetons, sans transaction visible.']);
      out.said = intent === 'receive' ? APPROVE_MSG.said_receive : { text: 'Le site affiche', amount: 'une signature', detail: '' };
      out.real = { text: 'Ce site pourrait prendre', amount: '2 480 USDX', detail: 'tout ton solde.' };
    } else { out.level = 'attention'; out.reasons.push('Signature de données structurées inconnue.'); }
  } else if (method === 'eth_sign') {
    out.effects.grants_right = true; danger(['Signature aveugle : elle peut autoriser n\'importe quoi.']);
  } else if (method === 'personal_sign') {
    const msg = hexToText(params[0]) || String(params[0]);
    if (/approve|transfer|autoris/i.test(msg)) { out.level = 'attention'; out.reasons.push('Le message parle de transfert ou d\'autorisation.'); }
  } else if (method === 'wallet_addEthereumChain' || method === 'wallet_requestPermissions') {
    out.level = 'attention'; out.reasons.push(method === 'wallet_addEthereumChain' ? 'Ajout d\'un réseau inconnu.' : 'Le site demande des permissions.');
  } // wallet_switchEthereumChain : ok

  if (/phish|remboursement/i.test(host) && (out.effects.funds_out || out.effects.grants_right || out.level !== 'ok')) {
    if (out.level !== 'danger') danger(['Ce site est connu pour des arnaques (liste du moteur de test).']);
  }
  if (MANIP.test(pageText) && (out.effects.funds_out || out.effects.grants_right)) {
    out.level = 'manipulation'; out.quote = (pageText.match(new RegExp('.{0,60}' + MANIP.source + '.{0,60}', 'i')) || [''])[0];
    out.reasons.unshift('Aucun vrai support ne demande ça.');
  }
  if (intent && (out.effects.grants_right || out.effects.funds_out) && (intent === 'receive' || intent === 'login')) out.intent_contradiction = true;
  if (mode.force) Object.assign(out, mode.force);
  return out;
}

export function startMock(port = 8787) {
  const state = { requests: [], logs: [], mode: {} };
  const srv = http.createServer((req, res) => {
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
    let raw = ''; req.on('data', (c) => raw += c);
    req.on('end', () => {
      const send = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json', ...cors }); res.end(typeof obj === 'string' ? obj : JSON.stringify(obj)); };
      let body = {}; try { body = raw ? JSON.parse(raw) : {}; } catch {}
      if (req.url === '/check' && req.method === 'POST') {
        state.requests.push({ at: Date.now(), body });
        const m = state.mode;
        const go = () => {
          if (m.status) return send(m.status, { error: 'forced' });
          if (m.bad) return send(200, 'pas du json {');
          send(200, decide(body, m));
        };
        return m.delayMs ? setTimeout(go, m.delayMs) : go();
      }
      if (req.url === '/log' && req.method === 'POST') { state.logs.push(body); return send(200, { ok: true }); }
      if (req.url === '/_requests') return send(200, state.requests);
      if (req.url === '/_logs') return send(200, state.logs);
      if (req.url === '/_reset') { state.requests.length = 0; state.logs.length = 0; state.mode = {}; return send(200, { ok: true }); }
      if (req.url === '/_mode' && req.method === 'POST') { state.mode = body; return send(200, { ok: true }); }
      send(404, { error: 'not found' });
    });
  });
  return new Promise((resolve, reject) => {
    srv.once('error', reject);
    srv.listen(port, '127.0.0.1', () => resolve({ srv, state, close: () => new Promise((r) => { srv.closeAllConnections?.(); srv.close(r); }) }));
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] || 8787);
  await startMock(port);
  console.log('mock_engine sur http://127.0.0.1:' + port);
}
