import * as M from '../js/verdict_model.js';
import * as S from '../js/scenarios.js';
for (const s of S.SCENARIOS) for (const i of [s.intentHonnete,'none']) {
  const v=M.check(M.withIntent(s.body,i==='none'?'none':i,i===s.intentHonnete?s.intentDetails:undefined),M.sanitizeLocalContext(S.localOf(s)));
  console.log(s.id.padEnd(24),i.padEnd(8),M.displayLevel(v).key.padEnd(12),v.niveau,v.fiche,(v.raisons||[]).map(r=>r.code).join(','));
}
