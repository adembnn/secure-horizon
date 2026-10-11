// node sheet.mjs out.png cols scale file1[=label] file2 ...   -> contact sheet (images at `scale`)
// node sheet.mjs --video out.png video.webm cols crop_w crop_h t1,t2,t3...  -> frames of a video at given seconds
import { chromium, EXE } from './lib.mjs';
import { pathToFileURL } from 'node:url';
import { basename, resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
const tmp = resolve('sheet_tmp_' + process.pid + '.html');
const setC = async (html) => { writeFileSync(tmp, '<!doctype html><meta charset=utf-8>' + html); await p.goto(pathToFileURL(tmp).href); };
const a = process.argv.slice(2);
const b = await chromium.launch({ executablePath: EXE, headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
if (a[0] === '--video') {
  const [, out, video, cols, cw, ch, times] = a; const ts = times.split(',').map(Number);
  await setC(`<body style="margin:0;background:#888;font:12px Segoe UI"><div id="g" style="display:grid;grid-template-columns:repeat(${cols},max-content);gap:6px;padding:6px;width:max-content"></div><video id="v" muted src="${pathToFileURL(resolve(video))}" style="position:absolute;left:-5000px"></video></body>`);
  const info = await p.evaluate(async ({ ts, cw, ch }) => {
    const v = document.getElementById('v'); await new Promise((r) => { v.onloadedmetadata = r; if (v.readyState >= 1) r(); });
    const g = document.getElementById('g'); const dur = v.duration;
    for (const t of ts) { await new Promise((r) => { v.onseeked = r; v.currentTime = t; }); const c = document.createElement('canvas'); c.width = cw; c.height = ch; c.getContext('2d').drawImage(v, 0, 0, cw, ch, 0, 0, cw, ch);
      const d = document.createElement('div'); d.style.background = '#fff'; d.appendChild(c); const l = document.createElement('div'); l.textContent = t.toFixed(2) + ' s'; l.style.padding = '2px 4px'; d.appendChild(l); g.appendChild(d); }
    return { dur, w: v.videoWidth, h: v.videoHeight };
  }, { ts, cw: +cw, ch: +ch });
  console.log(JSON.stringify(info));
  await p.locator('#g').screenshot({ path: out });
} else {
  const [out, cols, scale, ...files] = a;
  const items = files.map((f) => { const [path, label] = f.split('='); return { src: pathToFileURL(resolve(path)).href, label: label || basename(path) }; });
  await setC(`<body style="margin:0;background:#888;font:12px Segoe UI"><div id="g" style="display:grid;grid-template-columns:repeat(${cols},max-content);gap:6px;padding:6px;width:max-content">${items.map((i) => `<div style="background:#fff"><img src="${i.src}" style="display:block;zoom:${scale}"><div style="padding:2px 4px">${i.label}</div></div>`).join('')}</div></body>`);
  await p.waitForFunction(() => [...document.images].every((i) => i.complete));
  await p.locator('#g').screenshot({ path: out });
}
await b.close();
