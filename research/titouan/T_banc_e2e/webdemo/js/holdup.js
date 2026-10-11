// La fenetre "Hold up !" : retient la requete, pose la question d'intention (une phrase, des boutons), puis montre "Tu as dit / En réalité".
// Annuler est toujours visible et ne coute jamais rien. "Continuer quand meme" attend un delai (configurable) et ne se debloque jamais plus tot.
import { h, clear, renderVerdict } from './ui.js';
import { INTENTS, intentLabel } from './scenarios.js';
import { check, displayLevel, frictionSeconds, withIntent, sanitizeLocalContext } from './verdict_model.js';

// Retourne une promesse { decision: 'cancel' | 'sign', intentKey, verdict, level, delaySec, ms }
export function holdRequest({ body, local, delaySec = 5, askIntent = true, siteLabel = '' }) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const previous = document.activeElement;
    const veil = h('div', { class: 'veil' });
    const win = h('section', { class: 'win', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'hu-title', 'aria-describedby': 'hu-desc', tabindex: '-1' });
    const live = h('p', { class: 'sr-only', 'aria-live': 'polite' });
    let timer = null, done = false, state = { intentKey: 'none', verdict: null };

    const finish = (decision) => {
      if (done) return; done = true;
      if (timer) clearInterval(timer);
      document.removeEventListener('keydown', onKey, true);
      veil.remove();
      try { if (previous && previous.focus) previous.focus(); } catch (_) { /* rien */ }
      resolve({ decision, intentKey: state.intentKey, verdict: state.verdict, level: state.verdict ? displayLevel(state.verdict).key : null, delaySec: state.delay, ms: Math.round(performance.now() - t0) });
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish('cancel'); return; }
      if (e.key !== 'Tab') return;
      const f = [...win.querySelectorAll('button:not([disabled]), summary, [href]')]; if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);

    const cancelBtn = (autofocus) => h('button', { class: 'btn btn-main', type: 'button', onclick: () => finish('cancel'), 'data-autofocus': autofocus ? '1' : null }, 'Annuler');
    const frame = (children) => { clear(win); win.append(h('h2', { id: 'hu-title', class: 'hu-title' }, 'Hold up !'), ...children, live); const a = win.querySelector('[data-autofocus]') || win; a.focus(); };

    function stepIntent() {
      frame([
        h('p', { id: 'hu-desc', class: 'hu-sub' }, 'Ta demande est retenue. Rien n’a été envoyé' + (siteLabel ? ' à ' + siteLabel : '') + '.'),
        h('p', { class: 'hu-q' }, 'Qu’essaies-tu de faire ?'),
        h('div', { class: 'choices', role: 'group', 'aria-label': 'Ton intention' }, INTENTS.map(([k, label]) => h('button', { class: 'btn btn-choice', type: 'button', onclick: () => { state.intentKey = k; stepVerdict(); } }, label))),
        h('div', { class: 'actions' }, cancelBtn(false)),
      ]);
      win.querySelector('.btn-choice').focus();
    }

    function stepVerdict() {
      const b = withIntent(body, state.intentKey === 'other' || state.intentKey === 'swap' ? 'none' : state.intentKey); // 'swap' et 'other' n'ont pas de traduction dans le comparateur : plancher objectif seul (voir README)
      const v = check(b, sanitizeLocalContext(local));
      state.verdict = v;
      const lv = displayLevel(v);
      const delay = frictionSeconds(lv.key, delaySec); state.delay = delay;
      const out = h('div', { class: 'verdict', id: 'hu-desc' });
      renderVerdict(out, v, { body: b, local, intentKey: askIntent ? state.intentKey : null });
      const cont = h('button', { class: 'btn btn-link', type: 'button', disabled: delay > 0, onclick: () => finish('sign') }, 'Continuer quand même');
      const timerLine = h('p', { class: 'timer', 'aria-hidden': 'true' });
      frame([
        out,
        h('div', { class: 'actions' }, cancelBtn(true)),
        h('div', { class: 'cont' }, cont, timerLine),
      ]);
      if (delay > 0) {
        let left = delay;
        const tick = () => {
          if (left <= 0) { clearInterval(timer); timer = null; cont.disabled = false; timerLine.textContent = ''; live.textContent = 'Tu peux maintenant continuer, ou annuler.'; return; }
          timerLine.textContent = 'Tu pourras continuer dans ' + left + ' s. Annuler reste possible à tout moment.';
          left--;
        };
        live.textContent = 'Attends ' + delay + ' secondes avant de pouvoir continuer. Annuler reste possible.';
        tick(); timer = setInterval(tick, 1000);
      } else {
        timerLine.textContent = '';
      }
    }

    document.body.append(veil); veil.append(win);
    askIntent ? stepIntent() : stepVerdict();
  });
}

export { intentLabel };
