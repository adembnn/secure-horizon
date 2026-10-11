// actes/index.js : assemble les scenes enregistrees par actes/s*.js (charge en dernier). Personne n'edite ce fichier pendant le travail en parallele.
// Pose window.actAt, window.actOver, window.CUES (reperes de l'ouverture + reperes des scenes), window.CLES, window.SCENES et le signal window.ready.
'use strict';
(() => {
  SCENES.sort((a, b) => a.a - b.a);
  for (const id of Object.keys(BORNES)) { const n = SCENES.filter(s => s.id === id).length; if (n !== 1) console.error(`actes : la scene ${id} est enregistree ${n} fois (attendu : 1). Fichier actes/${id}.js en erreur ?`); }
  const FIN = SCENES[SCENES.length - 1], VIDE = { id: 'vide', draw() {}, blur: () => 1 };       // une scene absente rend du noir, sans texte
  const surveille = s => { let dit = false; const d = s.draw; s.draw = t => { d.call(s, t); if (!dit && X.globalAlpha !== 1) { dit = true; console.warn(`scene ${s.id} : globalAlpha laisse a ${X.globalAlpha} en fin de draw (t = ${t.toFixed(2)})`); } }; };
  SCENES.forEach(surveille);
  window.SCENES = SCENES.map(s => ({ id: s.id, a: +s.a.toFixed(3), b: +s.b.toFixed(3) }));
  window.actAt = t => t < T2 ? null : SCENES.find(a => t >= a.a && t < a.b) || (FIN && t >= FIN.b ? FIN : VIDE);
  // fin de l'ouverture : un noir de 0,12 s avant T2
  window.actOver = t => { if (t >= T2 - .12 && t < T2) { X.fillStyle = BLK; X.globalAlpha = seg(t, T2 - .12, T2); X.fillRect(0, 0, W, H); X.globalAlpha = 1; } };
  // reperes sonores : ceux de l'ouverture (film.js) puis ceux des scenes, dans l'ordre des scenes, tries par temps (tri stable)
  const c = window.CUES.cues; c.push(...SC_CUES);
  window.CUES.menace = [[0, T2], ...SC_MENACE]; window.CUES.dur = DUR; c.sort((a, b) => a.t - b.t);
  // images cles : celles de l'ouverture, puis celles des scenes
  window.CLES = { poche: 1.2, coup: +(T_HIT + .05).toFixed(2), vague: +(T_PULL + T_WAVE * .55).toFixed(2), resiste: +(LUNGE[2] + .1).toFixed(2), ...SC_CLES };
  Promise.all([document.fonts.load('700 68px Montserrat'), ...SC_IMAGES.map(i => i.decode().catch(() => 0))]).then(() => { draw(0); window.ready = true; });
})();
