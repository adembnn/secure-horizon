const $ = (id) => document.getElementById(id);
async function load() {
  const { cfg, log } = await chrome.storage.local.get(['cfg', 'log']);
  $('cfg').value = JSON.stringify(cfg || { arm: 'A', frictionMs: 30000 }, null, 2);
  $('log').textContent = (log || []).slice(-30).map((e) => JSON.stringify(e)).join('\n');
}
$('save').onclick = async () => { try { await chrome.storage.local.set({ cfg: JSON.parse($('cfg').value) }); $('msg').textContent = 'Enregistré.'; } catch (e) { $('msg').textContent = 'JSON invalide : ' + e.message; } };
$('clearlog').onclick = async () => { await chrome.storage.local.set({ log: [] }); load(); };
load();
