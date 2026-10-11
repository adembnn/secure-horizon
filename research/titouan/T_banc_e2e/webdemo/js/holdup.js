// La fenetre Hold up (structure R3 Figma) : retient la requete, pose la question d'intention (choix en pilules), puis montre le verdict : titre, ecart, Annuler.
// Annuler est toujours visible et ne coute jamais rien. "Continuer quand meme" attend un delai (configurable) et ne se debloque jamais plus tot.
import { h, clear, verdictParts, whyDetails } from './ui.js';
import { INTENTS, intentLabel } from './scenarios.js';
import { check, displayLevel, frictionSeconds, withIntent, sanitizeLocalContext } from './verdict_model.js';

const mmss = (s) => (s >= 60 ? Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') : s + ' s');

// Retourne une promesse { decision: 'cancel' | 'sign', intentKey, verdict, level, delaySec, ms }
// intentDetails (optionnel) : jeton, montant, jeton recu dits par la personne ; ecrit (optionnel) : l'intention en une phrase. Ils ne servent que si la reponse choisie est l'intention honnete du scenario (honnete).
export function holdRequest({ body, local, delaySec = 5, askIntent = true, siteLabel = '', intentDetails = null, ecrit = '', honnete = null }) {
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
      const f = [...win.querySelectorAll('button:not([disabled]), summary, [href], input:not([disabled])')]; if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);

    // body = ce qui defile ; dock = actions toujours visibles en bas ; focusSel = element qui prend le focus (sans faire defiler).
    const frame = (bodyKids, dockKids, focusSel) => {
      const b = h('div', { class: 'body' }, bodyKids), d = h('div', { class: 'dock' }, dockKids);
      clear(win); win.append(b, d, live);
      b.scrollTop = 0; win.scrollTop = 0; veil.scrollTop = 0;
      const a = (focusSel && win.querySelector(focusSel)) || win;
      a.focus({ preventScroll: true });
      b.scrollTop = 0;
    };
    const cancelBtn = (cls, attrs = {}) => h('button', { class: cls, type: 'button', onclick: () => finish('cancel'), ...attrs }, 'Annuler');

    function stepIntent() {
      const go = h('button', { class: 'btn-primary', type: 'button', 'aria-disabled': 'true', onclick: () => {
        const c = win.querySelector('input[name="intent"]:checked'); if (!c) return; // « Vérifier » reste inactif tant qu'aucun choix n'est fait
        state.intentKey = c.value; stepVerdict();
      } }, 'Vérifier');
      const fs = h('fieldset', { class: 'choices' },
        h('legend', {}, h('h1', { class: 'question', id: 'hu-title' }, 'Qu’essaies-tu de faire ?')),
        ecrit ? h('p', { class: 'written' }, 'Tu as écrit : « ' + ecrit + ' »') : null,
        INTENTS.map(([k, label]) => h('label', { class: 'choice' }, h('input', { type: 'radio', name: 'intent', value: k }), h('span', {}, label))));
      fs.addEventListener('change', () => go.removeAttribute('aria-disabled'));
      frame([
        fs,
        h('p', { id: 'hu-desc', class: 'reassure small' }, 'Ta demande est retenue. Rien n’a été envoyé' + (siteLabel ? ' à ' + siteLabel : '') + '.'),
      ], [h('div', { class: 'actions' }, go), h('div', { class: 'foot' }, cancelBtn('quiet'))], 'input[name="intent"]');
    }

    function stepVerdict() {
      // 'swap' est lu par le comparateur (toIntent) ; 'other' n'a pas de traduction : plancher objectif seul.
      const useDetails = !!intentDetails && !!ecrit && state.intentKey === honnete;
      const b0 = withIntent(body, state.intentKey === 'other' ? 'none' : state.intentKey);
      const b = useDetails ? { ...b0, intent_details: intentDetails } : b0;
      const v = check(b, sanitizeLocalContext(local));
      state.verdict = v;
      const lv = displayLevel(v);
      const delay = frictionSeconds(lv.key, delaySec); state.delay = delay;
      const parts = verdictParts(v, { body: b, local, intentKey: askIntent ? state.intentKey : null, ids: true, compare: useDetails ? { voulu: ecrit } : null });
      const bodyKids = [h('div', { id: 'hu-desc' }, parts.top)];
      let timerBig = null;
      if (lv.key === 'manipulation') {
        timerBig = h('div', { class: 'timer', role: 'timer', 'aria-live': 'off' }, h('span', { class: 't' }, mmss(delay)), h('span', { class: 's' }, 'Ta demande reste retenue. Annuler est possible à tout moment.'));
        bodyKids[0].insertBefore(timerBig, null);
      }
      bodyKids.push(whyDetails(parts.why));
      const calm = lv.key === 'info'; // aucun signal : « Continuer » devient l'action principale, jamais un vert ni un « OK »
      const cont = calm
        ? h('button', { class: 'btn-primary', type: 'button', onclick: () => finish('sign') }, 'Continuer')
        : h('button', { class: 'quiet', type: 'button', disabled: delay > 0, onclick: () => finish('sign') }, 'Continuer quand même');
      const timerLine = h('p', { class: 'timer-line', 'aria-hidden': 'true' });
      const dock = calm
        ? [h('div', { class: 'actions' }, cont, cancelBtn('btn-secondary'))]
        : [h('div', { class: 'actions' }, cancelBtn('btn-primary', { 'data-autofocus': '1' })), h('div', { class: 'foot' }, cont, timerLine)];
      frame(bodyKids, dock, calm ? '.btn-primary' : '[data-autofocus]');
      if (delay > 0 && !calm) {
        let left = delay;
        const tick = () => {
          if (left <= 0) { clearInterval(timer); timer = null; cont.disabled = false; timerLine.textContent = ''; if (timerBig) timerBig.querySelector('.t').textContent = mmss(0); live.textContent = 'Tu peux maintenant continuer, ou annuler.'; return; }
          timerLine.textContent = 'Tu pourras continuer dans ' + left + ' s.';
          if (timerBig) timerBig.querySelector('.t').textContent = mmss(left);
          left--;
        };
        live.textContent = 'Attends ' + delay + ' secondes avant de pouvoir continuer. Annuler reste possible.';
        tick(); timer = setInterval(tick, 1000);
      }
    }

    document.body.append(veil); veil.append(win);
    askIntent ? stepIntent() : stepVerdict();
  });
}

export { intentLabel };
