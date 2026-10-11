// Essai complet du lanceur sur le FAUX jeu (essai/CASES.jsonl). Ne touche jamais blind_decalage/CASES.jsonl.
//   node --no-warnings blind_decalage/run/essai/tester.mjs
// Un seul processus node à la fois : les sous-processus sont lancés l'un après l'autre.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, statSync, rmSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ESS = dirname(fileURLToPath(import.meta.url)), RUN = join(ESS, '..'), BLIND = join(RUN, '..');
const LANCEUR = join(RUN, 'ouvrir_une_fois.mjs'), GARDE = join(ESS, 'garde_lecture.mjs'), MOCK = join(ESS, 'clef_mock.mjs');
const SORTIES = join(ESS, 'sorties');
const REEL = join(BLIND, 'CASES.jsonl');
const mtimeReel = () => (existsSync(REEL) ? statSync(REEL).mtimeMs : null);
const mt0 = mtimeReel();
const rd = (f) => { try { return readFileSync(f, 'utf8'); } catch { return ''; } };

if (existsSync(SORTIES)) rmSync(SORTIES, { recursive: true, force: true });
mkdirSync(SORTIES, { recursive: true });
let ok = 0, ko = 0;
const test = (nom, cond, detail = '') => { (cond ? ok++ : ko++); console.log((cond ? 'PASS ' : 'FAIL ') + nom + (cond ? '' : '  <- ' + detail)); };
const lance = (argv, { env = {}, garde = false } = {}) => {
  const r = spawnSync(process.execPath, ['--no-warnings', ...(garde ? ['--import', pathToFileURL(GARDE).href] : []), LANCEUR, ...argv], { encoding: 'utf8', env: { ...process.env, CF_ACCOUNT_ID: '', CF_API_TOKEN: '', ...env }, timeout: 300000 });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
};
const par = (nom) => { const out = join(SORTIES, nom); mkdirSync(out, { recursive: true }); return ['--cases=' + join(ESS, 'CASES.jsonl'), '--sha=' + join(ESS, 'SHA256.txt'), '--out=' + out, '--clef-mock=' + MOCK]; };
const dir = (nom) => join(SORTIES, nom);

// 0. le faux jeu est régénérable et son hash est cohérent
const txt = readFileSync(join(ESS, 'CASES.jsonl'), 'utf8');
test('faux jeu : 10 cas', txt.split('\n').filter(Boolean).length === 10);
test('faux jeu : sha256 cohérent', readFileSync(join(ESS, 'SHA256.txt'), 'utf8').startsWith(createHash('sha256').update(txt).digest('hex')));

// 1. --force n'existe pas
let r = lance(['--force']);
test('--force refusé', r.code === 2 && /force/.test(r.out), r.out);
r = lance(['--cases=' + join(ESS, 'CASES.jsonl'), '--force']);
test('--force refusé même en essai', r.code === 2, r.out);
r = lance(['--clef-mock=' + MOCK]);
test('--clef-mock refusé sur le vrai jeu', r.code === 2, r.out);

// 2. dry-run : ne lit pas CASES.jsonl (garde de lecture active), ne crée ni verrou ni journal
r = lance(['--dry-run'], { garde: true });
test('dry-run sur le chemin réel passe avec la garde de lecture', r.code === 0 && /DRY-RUN OK/.test(r.out), r.out.slice(-600));
test('dry-run : aucun verrou réel créé', !existsSync(join(RUN, 'OUVERT.lock')));
test('dry-run : aucun journal réel créé', !existsSync(join(RUN, 'JOURNAL_OUVERTURE.md')));
test('dry-run : le vrai CASES.jsonl est intact (mtime)', mtimeReel() === mt0);

// 3. hash modifié : abandon sans verrou
const fauxModif = join(SORTIES, 'CASES_modifie.jsonl');
writeFileSync(fauxModif, txt.replace('Paul', 'Pau1'));
mkdirSync(dir('hash'), { recursive: true });
r = lance(['--cases=' + fauxModif, '--sha=' + join(ESS, 'SHA256.txt'), '--out=' + dir('hash'), '--clef-mock=' + MOCK]);
test('fichier modifié : abandon (code 2)', r.code === 2 && /ne correspond pas/.test(r.out), r.out);
test('fichier modifié : aucun verrou posé', !existsSync(join(dir('hash'), 'OUVERT.lock')));
test('fichier modifié : aucun résultat', !existsSync(join(dir('hash'), 'RESULTAT.md')));
test('fichier modifié : abandon écrit au journal', existsSync(join(dir('hash'), 'JOURNAL_OUVERTURE.md')) && /Abandon/.test(readFileSync(join(dir('hash'), 'JOURNAL_OUVERTURE.md'), 'utf8')));

// 4. sha publié absent ou illisible
writeFileSync(join(SORTIES, 'SHA_mauvais.txt'), 'pas un hash\n');
mkdirSync(dir('shabad'), { recursive: true });
r = lance(['--cases=' + join(ESS, 'CASES.jsonl'), '--sha=' + join(SORTIES, 'SHA_mauvais.txt'), '--out=' + dir('shabad')]);
test('SHA256.txt illisible : arrêt sans verrou', r.code === 2 && !existsSync(join(dir('shabad'), 'OUVERT.lock')), r.out);

// 5. exécution complète sur le faux jeu (bras a, b avec faux Clef, c)
r = lance(par('plein'));
const rp = dir('plein');
test('exécution : verrou posé', existsSync(join(rp, 'OUVERT.lock')), r.out.slice(-800));
test('exécution : sortie (code 0 ou 3)', r.code === 0 || r.code === 3, 'code ' + r.code + ' ' + r.out.slice(-800));
test('exécution : RESULTAT.md et resultat.json écrits', existsSync(join(rp, 'RESULTAT.md')) && existsSync(join(rp, 'resultat.json')));
let J = null; try { J = JSON.parse(readFileSync(join(rp, 'resultat.json'), 'utf8')); } catch {}
test('résultat : 3 bras mesurés', J && ['a', 'b', 'c'].every((k) => J.global[k] && J.global[k].non_mesures === 0), J && JSON.stringify(J.global));
test('résultat : 5 malveillants et 5 bénins', J && J.global.c.n_mal === 5 && J.global.c.n_ben === 5);
test('résultat : monotonie respectée', J && !J.monotonie.a_sous_plancher.length && !J.monotonie.b_sous_plancher.length, J && JSON.stringify(J.monotonie));
test('résultat : phrase de rappel présente', /aucun réglage après ouverture; chiffres publiés tels quels/.test(rd(join(rp, 'RESULTAT.md'))) && J && J.phrase.includes('aucun réglage après ouverture'));
const jr = existsSync(join(rp, 'JOURNAL_OUVERTURE.md')) ? readFileSync(join(rp, 'JOURNAL_OUVERTURE.md'), 'utf8') : '';
test('journal : date, sha256 moteur, git HEAD, résultat', /Ouverture 20\d\d-/.test(jr) && /sha256 du moteur[^\n]*[0-9a-f]{64}/.test(jr) && /Git HEAD : /.test(jr) && /### Fin/.test(jr), jr.slice(0, 500));
test('journal : verrou posé avant lecture noté', /posé avant toute lecture/.test(jr));

// 6. second lancement : refusé, rien ne change
const avant = rd(join(rp, 'RESULTAT.md'));
r = lance(par('plein'));
test('second lancement refusé (code 2)', r.code === 2 && /déjà été ouvert/.test(r.out), r.out);
test('second lancement : résultat inchangé', rd(join(rp, 'RESULTAT.md')) === avant);
r = lance([...par('plein'), '--reprise']);
test('reprise refusée quand le résultat est complet', r.code === 2 && /Reprise refusée/.test(r.out), r.out);

// 7. quota Clef au 4e appel : résultat incomplet, verrou posé, puis reprise à l'identique
r = lance(par('quota'), { env: { MOCK_QUOTA_APRES: '4' } });
let Jq = null; try { Jq = JSON.parse(readFileSync(join(dir('quota'), 'resultat.json'), 'utf8')); } catch {}
test('quota : arrêt propre, résultat marqué incomplet (code 3)', r.code === 3 && Jq && Jq.complet === false && Jq.clef.quota === true, 'code ' + r.code + ' ' + r.out.slice(-500));
r = lance([...par('quota'), '--reprise']);
Jq = null; try { Jq = JSON.parse(readFileSync(join(dir('quota'), 'resultat.json'), 'utf8')); } catch {}
test('reprise après quota : résultat complet, réponses du cache réutilisées', (r.code === 0) && Jq && Jq.complet === true && Jq.clef.cache >= 4, 'code ' + r.code + ' ' + r.out.slice(-500));
r = lance([...par('quota'), '--reprise']);
test('seconde reprise refusée', r.code === 2, r.out);

// 8. le vrai jeu n'a pas bougé et aucun verrou réel
test('vrai CASES.jsonl : mtime inchangé', mtimeReel() === mt0);
test('aucun OUVERT.lock dans blind_decalage/run', !existsSync(join(RUN, 'OUVERT.lock')));
console.log(`\n${ok} PASS, ${ko} FAIL`);
process.exit(ko ? 1 : 0);
