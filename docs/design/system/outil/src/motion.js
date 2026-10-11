/* Hold up : page des animations. Joue chaque séquence comme l'extension la jouera : les mêmes classes d'état, les mêmes durées.
 * window.huMotion = { names, play(name), playAll() } sert aussi à l'outil de mesure (outil/mesurer.mjs). */
(() => {
  'use strict';
  const STOP = Symbol('stop');
  const runs = new Map();
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const fill = (slot, v) => { $('.hu-slot-v', slot).textContent = v; slot.classList.add('is-filled'); slot.classList.remove('is-missing'); };

  const demos = {
    glove: { rest: 'n-montant', run: async ({ put, wait }) => { put('n-montant').classList.add('hu-is-entering'); await wait(460); } },
    open: { rest: 'q-vide', run: async ({ put, wait }) => { put('q-vide').classList.add('hu-is-opening'); await wait(220); } },
    question: { rest: 'q-vide', run: async ({ put, wait }) => { put('q-vide').classList.add('hu-is-entering'); await wait(320); } },
    slots: {
      rest: 'q-complet',
      run: async ({ put, wait }) => {
        const w = put('q-vide'), field = $('.hu-field', w), slots = $$('.hu-slot', w), cuff = $('.hu-cuff', w);
        const text = 'échanger 50 USDC contre AVAX';
        await wait(300);
        for (let i = 1; i <= text.length; i++) {
          field.value = text.slice(0, i);
          if (i === 1) cuff.removeAttribute('aria-disabled');
          if (i === 8) { fill(slots[0], 'échanger'); $('.hu-slot-q', slots[2]).textContent = 'contre quoi'; }
          if (i === 16) fill(slots[1], '50 USDC');
          if (i === text.length) fill(slots[2], 'contre AVAX');
          await wait(45);
        }
        await wait(400);
      }
    },
    verdict: {
      rest: 'c-simple',
      run: async ({ put, wait }) => {
        const w = put('q-complet'), cuff = $('.hu-cuff', w), field = $('.hu-field', w);
        await wait(400);
        cuff.classList.add('is-press'); await wait(90); cuff.classList.remove('is-press');
        cuff.setAttribute('aria-disabled', 'true'); field.readOnly = true;
        await wait(150);                       // rien ne change avant 150 ms
        w.classList.add('hu-is-busy'); cuff.textContent = 'Je compare…';
        await wait(450);                       // une fois montré, l'état reste au moins 400 ms
        w.classList.add('hu-is-leaving'); await wait(80);
        put('c-simple').classList.add('hu-is-entering'); await wait(320);
      }
    },
    match: {
      rest: 'c-simple',
      run: async ({ put, wait, clear }) => {
        const w = put('c-simple'); w.classList.add('hu-is-entering', 'hu-is-departing');
        await wait(1000);
        w.classList.remove('hu-is-entering'); w.classList.add('hu-is-closing'); await wait(130);
        clear(); await wait(700);
      }
    },
    relance: {
      rest: 'r-combien',
      run: async ({ put, wait }) => {
        const w = put('q-complet'), slots = $$('.hu-slot', w), cuff = $('.hu-cuff', w);
        $('.hu-field', w).value = 'échanger des USDC contre AVAX'; slots[1].classList.remove('is-filled');
        const from = $('.hu-got-from', w); if (from) from.remove();
        await wait(500);
        cuff.classList.add('is-press'); await wait(90); cuff.classList.remove('is-press');
        w.classList.add('hu-is-leaving'); await wait(80);
        put('r-combien').classList.add('hu-is-entering'); await wait(320);
      }
    },
    count: {
      rest: 'n-montant',
      run: async ({ put, wait }) => {
        const w = put('n-montant'), num = $('.hu-num', w), word = $('.hu-wait .hu-word', w);
        for (let n = 5; n > 0; n--) { num.textContent = String(n); await wait(1000); }
        num.textContent = '0'; w.classList.add('hu-is-ready'); word.removeAttribute('aria-disabled');
        await wait(400);
      }
    },
    next: {
      rest: 'c-etape2',
      run: async ({ put, wait }) => {
        const w = put('c-etape1'); w.classList.add('hu-is-departing'); await wait(1000);
        w.classList.add('hu-is-leaving'); await wait(80);
        put('c-etape2').classList.add('hu-is-next'); await wait(320);
      }
    },
    cancel: {
      rest: 'n-montant',
      run: async ({ put, wait, clear }) => {
        const w = put('n-montant'), cuff = $('.hu-cuff', w);
        await wait(500);
        cuff.classList.add('is-press'); await wait(90); cuff.classList.remove('is-press');
        w.classList.add('hu-is-leaving'); await wait(80);
        const e = put('end-cancel'); e.classList.add('hu-is-entering'); await wait(800);
        e.classList.remove('hu-is-entering'); e.classList.add('hu-is-closing'); await wait(130);
        clear(); await wait(700);
      }
    },
    cuff: {
      rest: 'cuff-row',
      run: async ({ put, wait }) => {
        const c = $('.hu-cuff', put('cuff-row'));
        await wait(250); c.classList.add('is-hover'); await wait(450);
        c.classList.add('is-press'); await wait(140); c.classList.remove('is-press');
        await wait(350); c.classList.remove('is-hover'); await wait(250);
      }
    },
    switch: {
      rest: 'pop-actif',
      run: async ({ put, wait }) => {
        const p = put('pop-actif'), input = $('input', p), state = $('.hu-state', p);
        await wait(350); input.checked = false; state.textContent = 'En pause sur ce site.';
        await wait(700); input.checked = true; state.textContent = 'Je vérifie ce site.';
        await wait(400);
      }
    },
    popup: { rest: 'pop-actif', run: async ({ put, wait }) => { put('pop-actif').classList.add('hu-is-opening'); await wait(220); } },
    panel: { rest: 'pan-journal', run: async ({ put, wait }) => { put('pan-journal').classList.add('hu-is-opening'); await wait(220); } },
    entry: {
      rest: 'pan-journal',
      run: async ({ put, wait }) => {
        const p = put('pan-journal'), list = $('ol', p);
        await wait(400);
        const li = list.firstElementChild.cloneNode(true);
        $('time', li).textContent = '14:41'; $('.hu-entry-what', li).textContent = 'Ça correspondait.';
        const after = $$('li', list); for (let n = list.nextElementSibling; n; n = n.nextElementSibling) after.push(n);
        list.prepend(li);
        const dy = -li.getBoundingClientRect().height;
        after.forEach((n) => { n.style.setProperty('--hu-dy', dy + 'px'); n.classList.add('is-pushed'); });
        li.classList.add('is-arriving');
        await wait(260);
        after.forEach((n) => { n.classList.remove('is-pushed'); n.style.removeProperty('--hu-dy'); }); li.classList.remove('is-arriving');
        await wait(300);
      }
    }
  };

  function ctx(name) {
    const stage = $('[data-demo="' + name + '"] .mo-stage');
    const id = (runs.get(name) || 0) + 1; runs.set(name, id);
    const alive = () => runs.get(name) === id;
    return {
      stage,
      put: (tpl) => { stage.replaceChildren(document.getElementById('t-' + tpl).content.cloneNode(true)); return stage.firstElementChild; },
      clear: () => stage.replaceChildren(),
      wait: (ms) => new Promise((res, rej) => setTimeout(() => (alive() ? res() : rej(STOP)), ms)),
      alive
    };
  }
  function rest(name) { const c = ctx(name); c.put(demos[name].rest); }
  async function play(name) {
    const c = ctx(name);
    try { await demos[name].run(c); if (c.alive()) c.put(demos[name].rest); } catch (e) { if (e !== STOP) throw e; }
  }
  const names = Object.keys(demos).filter((n) => $('[data-demo="' + n + '"]'));
  async function playAll() { for (const n of names) { $('[data-demo="' + n + '"]').scrollIntoView({ block: 'nearest' }); await play(n); } }

  names.forEach(rest);
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-replay]'); if (b) play(b.closest('[data-demo]').dataset.demo);
    if (e.target.closest('#mo-all')) playAll();
  });
  const red = document.getElementById('mo-reduced');
  if (red) red.addEventListener('change', () => { if (red.checked) document.documentElement.dataset.motion = 'reduced'; else delete document.documentElement.dataset.motion; });
  window.huMotion = { names, play, playAll, rest };
})();
