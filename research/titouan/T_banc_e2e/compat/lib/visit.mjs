// Une visite = un site x un bras (control | test | hardened), dans un contexte de navigateur vierge.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { sleep } from './cdp.mjs';
import { FIND_CONNECT, FIND_OPTION, SNAPSHOT_UI, SNAPSHOT_STATE, TAMPER_PROBE, CSP_PROBE } from './pagejs.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = readFileSync(path.join(HERE, 'inject.template.js'), 'utf8');
const BIND = '__cx' + Math.random().toString(36).slice(2, 8);
export const buildInjector = (mode) => TEMPLATE.replaceAll('__MODE__', mode).replaceAll('__BIND__', BIND);

const BOTWALL = /just a moment|attention required|access denied|verify you are human|are you a robot|checking your browser|ddos protection|security check|forbidden|request blocked|captcha/i;

export function normErr(t) {
  return String(t || '').replace(/https?:\/\/([^\/\s'")]+)[^\s'")]*/g, '$1').replace(/0x[0-9a-f]{6,}/gi, '0x#').replace(/[0-9a-f]{16,}/gi, '#')
    .replace(/\d{3,}/g, '#').replace(/\s+/g, ' ').trim().slice(0, 170);
}

export async function visit(conn, site, arm, opts = {}) {
  const T = Object.assign({ loadTimeout: 35000, settle: 4000, afterClick: 3000, hardCap: 110000 }, opts);
  const rec = { siteId: site.id, url: site.url, arm, started: new Date().toISOString(), events: [], console: [], exceptions: [], logErrors: [], docs: [],
    frames: 0, frameKinds: [], workers: [], popups: [], dialogs: 0, mainFrameId: null, loadFired: false, navError: null, steps: [] };
  const injector = buildInjector(arm === 'ext' ? 'control' : arm);   // bras ext = meme fournisseur non enveloppe + VRAIE extension Hold up chargee dans Chrome
  const t0 = Date.now();
  let ctxId = null, targetId = null, topSid = null;
  const sessions = new Set();
  const popupIds = [];
  const send = (m, p, s, to) => conn.send(m, p, s, to);

  async function setup(sid, top) {
    sessions.add(sid);
    const safe = (m, p) => send(m, p, sid, 15000).catch(() => null);
    await safe('Page.enable'); await safe('Runtime.enable');
    await safe('Runtime.addBinding', { name: BIND });
    await safe('Page.addScriptToEvaluateOnNewDocument', { source: injector, runImmediately: true });
    if (top) {
      await safe('Network.enable'); await safe('Log.enable');
      await safe('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
      const ver = await send('Browser.getVersion').catch(() => ({}));
      const ua = String(ver.userAgent || '').replace('HeadlessChrome', 'Chrome');
      if (ua) await safe('Emulation.setUserAgentOverride', { userAgent: ua, acceptLanguage: 'en-US,en' });
    }
    await safe('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true });
    await safe('Runtime.runIfWaitingForDebugger');
  }

  const off = conn.on((m) => {
    const sid = m.sessionId; const p = m.params || {};
    if (m.method === 'Target.targetCreated') {
      const ti = p.targetInfo;
      if (ti && ti.type === 'page' && ti.openerId && ti.openerId === targetId) { rec.popups.push(String(ti.url).slice(0, 120)); popupIds.push(ti.targetId); send('Target.closeTarget', { targetId: ti.targetId }).catch(() => {}); }
      return;
    }
    if (!sid || !(sid === topSid || sessions.has(sid))) return;
    switch (m.method) {
      case 'Target.attachedToTarget': {
        const ti = p.targetInfo; const child = p.sessionId;
        if (ti.type === 'iframe' || ti.type === 'page') { rec.frames++; rec.frameKinds.push('iframe'); setup(child, false); }
        else { rec.workers.push(ti.type); send('Runtime.runIfWaitingForDebugger', {}, child).catch(() => {}); }
        break; }
      case 'Runtime.bindingCalled':
        if (p.name === BIND) { try { const e = JSON.parse(p.payload); if (rec.events.length < 600) rec.events.push(e); } catch (_) {} }
        break;
      case 'Runtime.consoleAPICalled':
        if (p.type === 'error' || p.type === 'assert') rec.console.push({ top: sid === topSid, text: (p.args || []).map(a => a.value ?? a.description ?? a.type).join(' ').slice(0, 300) });
        break;
      case 'Runtime.exceptionThrown': {
        const d = p.exceptionDetails || {}; rec.exceptions.push({ top: sid === topSid, text: ((d.exception && d.exception.description) || d.text || '').split('\n')[0].slice(0, 300) });
        break; }
      case 'Log.entryAdded':
        if (p.entry && p.entry.level === 'error') rec.logErrors.push({ source: p.entry.source, text: String(p.entry.text).slice(0, 200), url: String(p.entry.url || '').slice(0, 120) });
        break;
      case 'Page.loadEventFired': if (sid === topSid) rec.loadFired = true; break;
      case 'Page.frameNavigated': if (sid === topSid && p.frame && !p.frame.parentId) rec.mainFrameId = p.frame.id; break;
      case 'Page.javascriptDialogOpening':
        rec.dialogs++; send('Page.handleJavaScriptDialog', { accept: false }, sid).catch(() => {}); break;
      case 'Network.responseReceived':
        if (sid === topSid && p.type === 'Document') {
          const h = {}; for (const [k, v] of Object.entries(p.response.headers || {})) h[k.toLowerCase()] = v;
          rec.docs.push({ frameId: p.frameId, status: p.response.status, url: p.response.url, mime: p.response.mimeType,
            csp: h['content-security-policy'] || null, cspRO: h['content-security-policy-report-only'] || null, xfo: h['x-frame-options'] || null, server: h['server'] || null });
        }
        break;
    }
  });

  const ev = async (expr, to = 20000) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, topSid, to);
    if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.text || '') + ' ' + ((r.exceptionDetails.exception || {}).description || '').slice(0, 120));
    return r.result.value;
  };
  const evJson = async (expr) => { try { return JSON.parse(await ev(expr)); } catch (e) { return { error: String(e.message).slice(0, 160) }; } };
  const click = async (x, y) => {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, topSid);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }, topSid);
    await sleep(60);
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }, topSid);
  };
  const waitFor = async (fn, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (fn()) return true; await sleep(150); } return false; };

  const body = async () => {
    ({ targetId } = await send('Target.createTarget', { url: 'about:blank' }));   // contexte par defaut (les extensions ne s'injectent pas dans un contexte prive)
    ({ sessionId: topSid } = await send('Target.attachToTarget', { targetId, flatten: true }));
    await setup(topSid, true);
    await send('Browser.setDownloadBehavior', { behavior: 'deny' }).catch(() => {});
    const nav = await send('Page.navigate', { url: site.url }, topSid, 40000);
    rec.navError = nav.errorText || null;
    if (!rec.navError) { await waitFor(() => rec.loadFired, T.loadTimeout); rec.loadTimedOut = !rec.loadFired; }
    await sleep(rec.navError ? 300 : T.settle);
    const main = rec.docs.filter(d => d.frameId === rec.mainFrameId).pop() || rec.docs[0] || null;
    rec.main = main ? { status: main.status, url: main.url, mime: main.mime, csp: main.csp, cspRO: main.cspRO, xfo: main.xfo, server: main.server } : null;
    if (rec.navError) { rec.steps.push('navError'); return; }
    rec.ui0 = await evJson(SNAPSHOT_UI);
    rec.state0 = await evJson(SNAPSHOT_STATE);
    const title = (rec.ui0 && rec.ui0.title) || '';
    rec.botwall = BOTWALL.test(title) || (rec.main && [403, 429, 503].includes(rec.main.status) && (rec.ui0.bodyLen || 0) < 2500) || false;
    if (rec.botwall) { rec.steps.push('botwall: pas d interaction'); }
    else {
      // 1) bouton de connexion (heuristique sure: texte "Connect wallet" & co, visible, non masque, non destructif)
      const f1 = await evJson(FIND_CONNECT); rec.find1 = f1;
      if (f1.pick) {
        rec.steps.push('click:' + f1.pick.text); rec.clicked1 = f1.pick.text; rec.clickedTier = f1.pick.tier;
        await click(f1.pick.x, f1.pick.y); await sleep(T.afterClick);
        // 2) option de portefeuille injecte dans la fenetre modale (MetaMask / Browser wallet / Injected) - jamais autre chose
        const f2 = await evJson(FIND_OPTION); rec.find2 = f2;
        if (f2.pick) { rec.steps.push('option:' + f2.pick.text); rec.clicked2 = f2.pick.text; await click(f2.pick.x, f2.pick.y); await sleep(T.afterClick); }
        else if (f1.pick.tier === 2) {
          const f3 = await evJson(FIND_CONNECT); rec.find3 = f3;   // apres "Launch app": un second bouton Connect peut apparaitre
          if (f3.pick && f3.pick.tier === 1) { rec.steps.push('click2:' + f3.pick.text); rec.clicked3 = f3.pick.text; await click(f3.pick.x, f3.pick.y); await sleep(T.afterClick);
            const f4 = await evJson(FIND_OPTION); if (f4.pick) { rec.steps.push('option:' + f4.pick.text); rec.clicked2 = f4.pick.text; await click(f4.pick.x, f4.pick.y); await sleep(T.afterClick); } }
        }
      }
    }
    rec.ui1 = await evJson(SNAPSHOT_UI);
    rec.state1 = await evJson(SNAPSHOT_STATE); rec.evN = rec.events.length;   // les sondes ci-dessous lisent window.ethereum: ne pas les compter
    rec.csp = await evJson(CSP_PROBE);
    rec.tamper = await evJson(TAMPER_PROBE);
    rec.finalUrl = await ev('location.href').catch(() => null);
  };

  try {
    await Promise.race([body(), new Promise((_, rej) => setTimeout(() => rej(new Error('plafond de visite depasse')), T.hardCap))]);
  } catch (e) { rec.fatal = String(e.message).slice(0, 200); }
  try { await send('Target.closeTarget', { targetId }, undefined, 5000); } catch (_) {}
  for (const id of popupIds) send('Target.closeTarget', { targetId: id }).catch(() => {});
  try { for (const o of new Set([site.url, rec.finalUrl].filter(Boolean).map(u => { try { return new URL(u).origin; } catch (_) { return null; } }).filter(Boolean))) await send('Storage.clearDataForOrigin', { origin: o, storageTypes: 'all' }, undefined, 8000); await send('Storage.clearCookies', {}, undefined, 8000); } catch (_) {}
  off();
  rec.ms = Date.now() - t0;
  return rec;
}
