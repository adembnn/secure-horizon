import { launch, sleep, S } from './lib.mjs';
import { join } from 'node:path';
const h = await launch({ ext: join(S, 'ext_frais'), name: 'overlay', video: false, cfg: { askIntent: 'always', dangerWaitMs: 30000, manipulationHoldMs: 600000, verdictWindow: false, limitUnlimited: true } });
try {
  await sleep(1200); await h.page.setViewportSize({ width: 1280, height: 720 }); await h.page.goto('http://127.0.0.1:8793/?mode=piege&via=permit'); await sleep(2000);
  await h.page.locator('#btn-swap').click(); await sleep(2200);
  if (/connex|connect/i.test(await h.page.locator('#btn-swap').innerText().catch(() => ''))) { await h.page.locator('#btn-swap').click({ force: true, timeout: 2000 }).catch(() => {}); await sleep(2000); }
  await h.page.screenshot({ path: join(S, 'repli_page_1.png') });
  console.log('fenêtres:', h.popups.length);
  await h.page.keyboard.type('échanger 50 USDC contre AVAX'); await h.page.keyboard.press('Enter'); await sleep(1500);
  await h.page.screenshot({ path: join(S, 'repli_page_2.png') });
} catch (e) { console.log('ERREUR', e.message.split('\n')[0]); }
console.log(JSON.stringify(h.consoleLog)); await h.close();
