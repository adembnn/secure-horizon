/* Hold up Lab : petits composants partagés par les vues. */
(function (global) {
  'use strict';
  var D = global.Lab.dom, h = D.h;
  var uid = 0;
  function nextId(p) { uid++; return (p || 'f') + uid; }

  function tag(text, cls) { return h('span', { class: 'tag' + (cls ? ' ' + cls : '') }, text); }

  /* porte, famille, nature, puis références NIST CSF et menace */
  function tagsFor(sc) {
    var out = [tag(D.doorLabel(sc.door), 'tag-door'), tag(D.pretty(sc.family), 'tag-family'),
      tag(sc.label === 'malveillant' ? 'Attaque' : 'Opération honnête', sc.label === 'malveillant' ? 'tag-atk' : 'tag-ok')];
    D.asArray(sc.nist_csf).forEach(function (n) { out.push(tag('NIST CSF ' + n, 'tag-ref')); });
    D.asArray(sc.threat_refs).forEach(function (n) { out.push(tag(n, 'tag-ref mono')); });
    return h('p', { class: 'tags' }, out);
  }

  function field(labelText, control, hint) {
    var id = control.id || (control.id = nextId('c'));
    var kids = [h('label', { for: id }, labelText), control];
    if (hint) {
      var hid = id + '-h';
      kids.push(h('small', { class: 'hint', id: hid }, hint));
      control.setAttribute('aria-describedby', hid);
    }
    return h('div', { class: 'field' }, kids);
  }

  function select(options, value, onChange) {
    var s = h('select', null, options.map(function (o) { return h('option', { value: o.value }, o.label); }));
    s.value = value == null ? '' : value;
    if (onChange) s.addEventListener('change', function () { onChange(s.value); });
    return s;
  }

  function outcomePill(outcome) {
    var i = D.outcomeInfo(outcome);
    return h('span', { class: 'pill pill-' + i.cls }, i.word);
  }

  function reducedMotion() { return global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function scrollTo(el) {
    if (!el || !el.scrollIntoView) return;
    el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }

  /* groupe de radios sous forme de pastilles */
  function radioGroup(name, options, value, onChange, legendText) {
    var fs = h('fieldset', { class: 'radios' }, legendText ? h('legend', null, legendText) : null);
    options.forEach(function (o) {
      var id = nextId('r');
      var inp = h('input', { type: 'radio', name: name, value: o.value, id: id });
      if (String(o.value) === String(value)) inp.checked = true;
      inp.addEventListener('change', function () { if (inp.checked) onChange(o.value); });
      fs.appendChild(h('label', { class: 'radio', for: id }, inp, h('span', null, o.label)));
    });
    return fs;
  }

  function sampleBanner() {
    return h('span', { class: 'chip-sample' }, 'Données d’exemple');
  }

  global.Lab.ui = { tag: tag, tagsFor: tagsFor, field: field, select: select, outcomePill: outcomePill, scrollTo: scrollTo, radioGroup: radioGroup, nextId: nextId, sampleBanner: sampleBanner };
})(window);
