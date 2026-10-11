// Classe les avertissements (niveau warn, mode A) par cause, AVANT et APRÈS F34, et liste les 30 sélecteurs inconnus les plus fréquents (avant).
// Usage : node classify_causes.mjs <cchain|eth>. Entrées : cache_/rows_<chaîne>_avant.json, cache_/rows_<chaîne>.json, out/signatures_openchain.json. Sortie : out/causes_<chaîne>.json
import fs from 'node:fs'; import path from 'node:path';
const HERE = path.resolve(import.meta.dirname); const CH = process.argv[2];
const rd = (f) => JSON.parse(fs.readFileSync(path.join(HERE, f), 'utf8'));
const sigs = rd('out/signatures_openchain.json').signatures;
const { ABI_EFFECT_SELECTORS } = await import(new URL('../engine/src/effects_abi.mjs', import.meta.url).href);
const { LIBRARY_SELECTORS } = await import(new URL('../engine/src/protocols_extra.mjs', import.meta.url).href);
const avant = rd(`cache_/rows_${CH}_avant.json`).A, apres = rd(`cache_/rows_${CH}.json`).A;
const sc = {}; for (const r of avant) sc[r.from] = (sc[r.from] || 0) + 1;
const isOpa = (r) => r.codes.includes('w:unknown_selector') || r.codes.includes('w:opaque');
function family(sel) {
  const s = sigs['0x' + sel] || sigs[sel]; if (s === undefined) return 'sélecteur non cherché dans la base';
  if (s === null) return 'sans nom public';
  const n = s[0];
  if (/mint/i.test(n)) return 'mint';
  if (/post|tune|publish|transmit|sweep|^run\(|liquidate|flush|IPredict|Brrr|Ape|ILove|Prompt|submit/i.test(n)) return 'entretien / oracle / robot (noms)';
  if (/swap|exactInput|exactOutput|route|transformERC20|unxswap|dagSwap|settle|fillRelay/i.test(n)) return 'échange / routeur';
  if (/deposit|bridge|CrossChain|supply/i.test(n)) return 'dépôt / pont / prêt';
  if (/multicall|batch|execute|^exec\(|forward|handleOps/i.test(n)) return 'exécution groupée / relais';
  return 'autre nom public';
}
function cause(r) {
  if (r.level !== 'warn') return null;
  if (r.codes.includes('w:contract_creation')) return 'création de contrat';
  if (r.codes.some((c) => /embedded_calls|external_spender|unlimited|nested_approval|batch_foreign|slippage|lookalike|control_change/.test(c)) && !isOpa(r)) return 'preuve d\'effet (droit, bénéficiaire, prix, sosie)';
  if (r.codes.includes('w:erc4337_handleOps')) return 'ERC-4337 handleOps';
  if (r.codes.includes('w:ur_command_opaque')) return 'Universal Router, commande non décodée';
  if (r.codes.includes('w:decode_error')) return 'calldata mal formé';
  if (isOpa(r)) {
    if (!r.sel) return 'opaque : donnée sans sélecteur (< 4 octets)';
    if (/^[0-9a-f]{2}000000$/.test(r.sel)) return 'opaque : préfixe non-sélecteur (octet de mode + zéros)';
    if (r.sel === '64617461') return 'opaque : texte ASCII « data » (inscription)';
    return 'opaque : sélecteur inconnu';
  }
  return 'autre';
}
const tally = (rows) => { const t = {}; for (const r of rows) { const c = cause(r); if (c) t[c] = (t[c] || 0) + 1; } return Object.fromEntries(Object.entries(t).sort((a, b) => b[1] - a[1])); };
// 30 sélecteurs inconnus les plus fréquents (avant)
const m = new Map();
for (const r of avant) if (r.level === 'warn' && r.codes.includes('w:unknown_selector') && r.sel) { const e = m.get(r.sel) || { n: 0, to: new Set(), from: new Set() }; e.n++; e.to.add(r.to); e.from.add(r.from); m.set(r.sel, e); }
const afterOpa = new Map(); for (const r of apres) if (r.level === 'warn' && r.codes.includes('w:unknown_selector') && r.sel) afterOpa.set(r.sel, (afterOpa.get(r.sel) || 0) + 1);
const top30 = [...m.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 30).map(([sel, e]) => ({ selecteur: '0x' + sel, n: e.n, pct_des_tx: +(100 * e.n / avant.length).toFixed(2), cibles_distinctes: e.to.size, expediteurs_distincts: e.from.size, signature_publique: (sigs['0x' + sel] || [null])[0] || null, famille: family(sel), lu_par_table_abi: ABI_EFFECT_SELECTORS.has('0x' + sel) || LIBRARY_SELECTORS.has('0x' + sel), encore_avertissement_apres: afterOpa.get(sel) || 0 }));
// avertissements opaques restants : concentration
const rest = apres.filter((r) => r.level === 'warn' && isOpa(r));
const tf = {}; for (const r of apres) (tf[r.to] = tf[r.to] || new Set()).add(r.from);
const part = (p) => +(100 * rest.filter(p).length / Math.max(1, rest.length)).toFixed(1);
const fam = {}; for (const r of avant) if (r.level === 'warn' && r.codes.includes('w:unknown_selector') && r.sel) { const f = family(r.sel); fam[f] = (fam[f] || 0) + 1; }
// appels connus (décodés, non warn) par nom de fonction
const known = {}; for (const r of avant) if (r.type === 'appel_connu' || r.type === 'erc20_transfer' || r.type === 'native') { const k = r.name || r.type; known[k] = (known[k] || 0) + 1; }
// lus par F34 : liste des fonctions
const lus = {}; for (let i = 0; i < apres.length; i++) if (avant[i].level === 'warn' && apres[i].level === 'info') { const k = avant[i].sel || '(vide)'; lus[k] = (lus[k] || 0) + 1; }
const out = {
  chaine: CH, n: avant.length,
  avertissements_par_cause_avant: tally(avant), avertissements_par_cause_apres: tally(apres),
  top30_selecteurs_inconnus_avant: top30,
  familles_des_selecteurs_inconnus_avant_selon_nom_public: Object.fromEntries(Object.entries(fam).sort((a, b) => b[1] - a[1])),
  appels_decodes_sans_alerte_ou_connus_avant: Object.fromEntries(Object.entries(known).sort((a, b) => b[1] - a[1]).slice(0, 20)),
  selecteurs_passes_de_warn_a_info: Object.fromEntries(Object.entries(lus).sort((a, b) => b[1] - a[1])),
  opaques_restants: { n: rest.length, part_expediteur_10tx_ou_plus_dans_echantillon_pct: part((r) => sc[r.from] >= 10), part_cible_3_expediteurs_ou_moins_pct: part((r) => tf[r.to].size <= 3), part_valeur_native_jointe_pct: part((r) => r.value && r.value !== '0x0') },
};
fs.writeFileSync(path.join(HERE, 'out', `causes_${CH}.json`), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ avant: out.avertissements_par_cause_avant, apres: out.avertissements_par_cause_apres, fam: out.familles_des_selecteurs_inconnus_avant_selon_nom_public, lus: out.selecteurs_passes_de_warn_a_info, restants: out.opaques_restants }, null, 1));
