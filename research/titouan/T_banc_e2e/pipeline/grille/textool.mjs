// Outils de texte de la couche « grille » : nombres en lettres, injections de consigne, fautes de frappe. Aucune dépendance.
export const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// nombres écrits en lettres (fr, en), jusqu'à 999 999 : « cinq cents » -> 500, « one hundred » -> 100
const NW = { zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16, vingt: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60,
  one: 1, two: 2, three: 3, four: 4, five: 5, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const val = (w) => (w === 'quatrevingt' ? 80 : NW[w]);
export function wordsToDigits(text) {
  const t = fold(text).replace(/quatre[ -]vingts?/g, 'quatrevingt');
  const toks = t.split(/([^a-z]+)/);
  const out = [];
  let i = 0;
  while (i < toks.length) {
    const w = toks[i];
    if (/^[a-z]+$/.test(w) && (val(w) !== undefined || ['cent', 'cents', 'hundred', 'mille', 'thousand'].includes(w))) {
      let j = i, cur = 0, tot = 0, any = false, last = i;
      while (j < toks.length) {
        const x = toks[j];
        if (/^[a-z]+$/.test(x)) {
          if (val(x) !== undefined) { cur += val(x); any = true; last = j; }
          else if (x === 'cent' || x === 'cents' || x === 'hundred') { cur = (cur || 1) * 100; any = true; last = j; }
          else if (x === 'mille' || x === 'thousand') { tot += (cur || 1) * 1000; cur = 0; any = true; last = j; }
          else if (x === 'et' || x === 'and') { /* liaison */ }
          else break;
        } else if (!/^[\s-]+$/.test(x)) break;
        j++;
      }
      // « un », « une », « one » isolés ne sont pas un montant
      if (any && !(last === i && (w === 'un' || w === 'une' || w === 'one'))) { out.push(String(tot + cur)); i = last + 1; continue; }
    }
    out.push(toks[i]);
    i++;
  }
  return out.join('');
}

// lexique d'injections de consigne (adressées au contrôleur) : on coupe la phrase au premier marqueur
const INJ = [
  /\bignor\w*\b.{0,40}\b(instruction|regle|rule|previous|precedent)/, /\b(oublie|forget|disregard)\b.{0,30}\b(regle|rule|instruction)/,
  /\bsysteme?\s*:/, /\bsystem\s*:/, /\bne signale rien\b/, /\bdo not flag\b/, /\bdon t flag\b/, /\byou are now\b/, /\btu es (maintenant|en mode)\b/,
  /\byou must (answer|say|reply|respond)\b/, /\b(reponds|answer|reply) (seulement |only )?(que|that|ok|match)\b/, /\bmarque[- ]la\b/, /\bmark (it|this)\b/, /\bmode (admin|administrateur)\b/, /\badmin mode\b/,
];
export function stripInjection(text) {
  const f = fold(text);
  let cut = -1;
  for (const re of INJ) { const m = re.exec(f); if (m && (cut < 0 || m.index < cut)) cut = m.index; }
  return cut < 0 ? { text, injection: false } : { text: text.slice(0, cut).trim(), injection: true };
}

// faute de frappe : distance de Damerau <= 1 (mots d'au moins 5 lettres)
export function near1(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1 || Math.min(a.length, b.length) < (a.length === b.length ? 5 : 6)) return false;
  if (a.length === b.length) {
    const d = [];
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d.push(i);
    return d.length === 1 || (d.length === 2 && d[1] === d[0] + 1 && a[d[0]] === b[d[1]] && a[d[1]] === b[d[0]]);
  }
  const [x, y] = a.length > b.length ? [a, b] : [b, a];
  for (let i = 0; i < x.length; i++) if (x.slice(0, i) + x.slice(i + 1) === y) return true;
  return false;
}
export const hasFuzzy = (t, list) => t.split(' ').some((w) => w.length >= 5 && list.some((k) => near1(w, k)));
export const CONNECT = '(en|to|for|into|contre|against|vers)';
