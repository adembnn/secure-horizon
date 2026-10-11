/* Hold up - settings page (shared by both builds). Only known keys are stored : nothing pasted here can add a test or automatic mode. */
const $ = (id) => document.getElementById(id);
const PRODUCT = { dangerWaitMs: 30000, manipulationHoldMs: 600000 };
const DEMO = { dangerWaitMs: 10000, manipulationHoldMs: 60000 };
const num = (id, lo, hi, dflt) => { const n = Math.round(Number($(id).value) * 1000); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt; };
// Q17 : "Hold up limite lui-même le droit au montant écrit". On par défaut. La case a l'id `limitUnlimited` dans options.html ;
// sans la case, la valeur déjà enregistrée est conservée telle quelle.
let kept = true;
function fill(cfg) {
  kept = cfg.limitUnlimited !== false;
  if ($('limitUnlimited')) $('limitUnlimited').checked = kept;
  $('askIntent').value = cfg.askIntent === true ? 'always' : cfg.askIntent === false ? 'never' : ['never', 'rights_or_funds', 'always'].includes(cfg.askIntent) ? cfg.askIntent : 'always';
  $('dangerWait').value = Math.round((cfg.dangerWaitMs ?? cfg.frictionMs ?? PRODUCT.dangerWaitMs) / 1000);
  $('manipHold').value = Math.round((cfg.manipulationHoldMs ?? PRODUCT.manipulationHoldMs) / 1000);
  $('window').checked = cfg.verdictWindow !== false;
}
function read() {
  return {
    askIntent: $('askIntent').value,
    dangerWaitMs: num('dangerWait', 5000, 600000, PRODUCT.dangerWaitMs),
    manipulationHoldMs: num('manipHold', 30000, 3600000, PRODUCT.manipulationHoldMs),
    verdictWindow: $('window').checked,
    limitUnlimited: $('limitUnlimited') ? $('limitUnlimited').checked : kept
  };
}
async function load() {
  const { cfg, contexte, log } = await chrome.storage.local.get(['cfg', 'contexte', 'log']);
  fill(cfg && typeof cfg === 'object' ? cfg : {});
  if ($('ctx')) $('ctx').value = JSON.stringify(contexte || { contacts: [], history: [], protected: [], knownSpenders: [] }, null, 2);
  $('log').textContent = (log || []).slice(-40).map((e) => JSON.stringify(e)).join('\n');
}
$('save').onclick = async () => {
  try {
    const out = { cfg: read() };
    if ($('ctx')) out.contexte = JSON.parse($('ctx').value);
    await chrome.storage.local.set(out);
    fill(out.cfg);
    $('msg').textContent = 'Enregistré.';
  } catch (e) { $('msg').textContent = 'Contexte JSON invalide : ' + e.message; }
};
$('demo').onclick = () => { $('dangerWait').value = DEMO.dangerWaitMs / 1000; $('manipHold').value = DEMO.manipulationHoldMs / 1000; $('msg').textContent = 'Durées de démo saisies. Clique sur Enregistrer.'; };
$('product').onclick = () => { $('dangerWait').value = PRODUCT.dangerWaitMs / 1000; $('manipHold').value = PRODUCT.manipulationHoldMs / 1000; $('msg').textContent = 'Durées du produit saisies. Clique sur Enregistrer.'; };
$('clearlog').onclick = async () => { await chrome.storage.local.set({ log: [] }); load(); };
load();
