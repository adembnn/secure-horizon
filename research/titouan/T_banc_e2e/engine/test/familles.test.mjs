// Règles des familles (RAPPORT_FAMILLES.md) : achat NFT Seaport, jeton différent, réseau ou site différent, connexion qui signe un droit.
// Cas tirés du jeu de RÉGLAGE (attacks_familles/gen_familles.mjs, graine fixe) ; jamais le jeu de contrôle.
import test from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../../attacks_familles/gen_familles.mjs';
import * as A from '../../run/arms.mjs';
import { analyzeTypedData } from '../src/engine.mjs';
import { applyPolicy, monotoneGuard } from '../../run/policy.mjs';

const CASES = generate('reglage', 20261011);
const R = { ok: 0, unknown: 0.5, warn: 1, critical: 2 };
async function verdict(c) {
  const prep = A.prepare(A.normalizeCase(c));
  const o = { detectors: true, premiseCap: true, guard: true };
  const full = await A.runArm(prep, 'full', o), sans = await A.runArm(prep, 'none', { detectors: true, premiseCap: true });
  return { level: full.level, ecart: !prep.eff.opaque && R[full.level] >= 1 && (R[full.level] > R[sans.level] || full.reasons.some((x) => !sans.reasons.includes(x))), eff: prep.eff, reasons: full.reasons };
}
const firstOf = (fam, sub) => { const c = CASES.find((x) => x.family === fam && x.subfamily === sub); assert.ok(c, sub); return c; };

test('chaque sous-famille d écart du réglage : écart lu avec l intention (ne correspond pas), au moins orange', async () => {
  const subs = [...new Set(CASES.filter((c) => c.label === 'malveillant').map((c) => c.family + '|' + c.subfamily))];
  for (const s of subs) { const [f, sub] = s.split('|'); const v = await verdict(firstOf(f, sub)); assert.ok(v.ecart, `${sub} : pas d écart (${v.level})`); }
});
test('chaque sous-famille bénigne du réglage : jamais rouge, aucun écart d intention', async () => {
  const subs = [...new Set(CASES.filter((c) => c.label === 'benin').map((c) => c.family + '|' + c.subfamily))];
  for (const s of subs) { const [f, sub] = s.split('|'); const v = await verdict(firstOf(f, sub)); assert.notEqual(v.level, 'critical', `${sub} rouge : ${v.reasons}`); assert.ok(!v.ecart, `${sub} : écart inattendu ${v.reasons}`); }
});
test('Seaport : offre d achat (WETH contre NFT, commission 2,5 %) ne déclenche pas « produit détourné » ni « cède contre rien »', async () => {
  const v = await verdict(firstOf('nft_achat_seaport', 'offre_achat_avec_commission_2_5'));
  assert.ok(!v.eff.risk_flags.some((f) => f.code === 'seaport_proceeds_to_other'));
  assert.ok(!v.reasons.some((r) => r.includes('order_gives_assets_for_nothing')));
});
test('Seaport : « acheter » mais l ordre cède le NFT : raison nft_given_on_buy_intent', async () => {
  const v = await verdict(firstOf('nft_achat_seaport', 'vente_deguisee_nft_contre_natif_quasi_nul'));
  assert.ok(v.reasons.includes('nft_given_on_buy_intent'));
});
test('permit ERC-2612 au type renommé : lu par ses champs (droit décodé, non opaque, nom signalé)', () => {
  const c = firstOf('connexion_droit', 'permit_type_renomme');
  const eff = analyzeTypedData(c.request.params[1], { from: c.context.victim, chainId: c.context.chainId });
  assert.equal(eff.opaque, false); assert.equal(eff.approvals.length, 1); assert.equal(eff.signature.kind, 'permit2612.renamed');
  assert.ok(eff.risk_flags.some((f) => f.code === 'permit_type_renamed'));
});
test('jeton dit par son adresse : même adresse = conforme, autre jeton = écart', async () => {
  const ok = CASES.find((c) => c.subfamily === 'paie_le_meme_jeton' && /^0x/.test(c.intent.token));
  if (ok) assert.notEqual((await verdict(ok)).level, 'critical');
  const bad = CASES.find((c) => c.subfamily === 'paie_un_autre_jeton_du_registre' && /^0x/.test(c.intent.token));
  if (bad) assert.ok((await verdict(bad)).reasons.includes('token_differs_from_intent'));
});
test('natif et enveloppé du même réseau sont le même actif (ETH/WETH, AVAX/WAVAX)', async () => {
  for (const sub of ['natif_dit_enveloppe_vendu_meme_reseau', 'enveloppe_dit_natif_envoye_meme_reseau']) for (const c of CASES.filter((x) => x.subfamily === sub)) assert.ok(!(await verdict(c)).reasons.includes('token_differs_from_intent'), sub + ' ' + c.context.chainId);
});
test('réseau signé différent du réseau de la demande, avec intention : raison chain_differs_from_intent', async () => {
  assert.ok((await verdict(firstOf('chaine_domaine', 'permit_signe_pour_un_autre_reseau'))).reasons.includes('chain_differs_from_intent'));
  assert.ok((await verdict(firstOf('chaine_domaine', 'intention_nomme_un_autre_reseau_signature'))).reasons.includes('chain_differs_from_intent'));
});
test('SIWE pour un autre site : site_differs_from_intent ; SIWE valide pour se connecter : aucune raison', async () => {
  assert.ok((await verdict(firstOf('chaine_domaine', 'siwe_pour_un_autre_site'))).reasons.includes('site_differs_from_intent'));
  const v = await verdict(firstOf('connexion_droit', 'siwe_valide'));
  assert.equal(v.reasons.length, 0); assert.ok(R[v.level] < 1);
});
test('les nouvelles règles ne lisent que l intention : sans intention elles ne font rien (monotonie)', async () => {
  for (const c of CASES.slice(0, 80)) {
    const prep = A.prepare(A.normalizeCase(c));
    const pol = applyPolicy({ eff: prep.eff, adem: null, ctx: prep.ctx, intent: null, request: prep.c.request });
    assert.ok(!pol.reasons.some((r) => ['nft_given_on_buy_intent', 'chain_differs_from_intent', 'site_differs_from_intent', 'token_differs_from_intent'].includes(r.code)));
  }
  assert.equal(monotoneGuard('ok', 'warn'), 'warn');
});
