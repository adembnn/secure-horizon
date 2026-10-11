export default {
  id: 'P06',
  cible: ['^GRILLE[|](connexion|nft|depot|echange|envoi_jeton|envoi_natif|approbation|permit|permit2|setApprovalForAll)'],
  hypothese: "Le repli par mots-clés manque des verbes usuels (se connecter avec « sign in », vendre ou lister un NFT, déposer ou placer, autoriser ou laisser dépenser, échanger, transférer). Un repli par forme de phrase donne le genre d'acte quand les mots-clés n'en trouvent aucun, et « sign in with my wallet » n'est plus lu comme un envoi vers son propre compte. Le genre ne peut que préciser la comparaison : il n'abaisse jamais un verdict (monotonie).",
  edits: [
    { file: 'pipeline/intent_clef.mjs',
      find: "let kwLoaded = null;",
      replace: String.raw`// repli par FORME de phrase (verbes usuels FR/EN) quand les mots-clés d'extension ne donnent aucun genre ; « se connecter » l'emporte sur « mon portefeuille ».
export function kindHint(text) {
  const t = String(text || '');
  if (/\b(sign[\s-]?in|log[\s-]?in|login|se\s+connecter|connexion|connect)\b/i.test(t) && !/\d/.test(t)) return 'connect_or_accept_offer';
  if (/\b(sell(?:ing)?|list(?:ing)?|lister|vendre|vends|vnds|en\s+vente|on\s+sale|for\s+sale)\b/i.test(t)) return 'buy_or_swap';
  if (/\b(deposit|d[ée]pos\w*|stak\w+|suppl\w+|lend\w*|pr[êe]ter|placer?|putting|put|mets|mettre|copping|buy|achet\w+|purchase|prends|prendre|exchange|[ée]chang\w+|change|convert\w*|swap\w*|approve|approuv\w+|allow|autoris\w+|letting|let|laisse|spend|d[ée]penser|toucher)\b/i.test(t)) return 'buy_or_swap';
  if (/\b(pass|passe|transf[eè]r\w*|transfer|send|envoy\w+|envoie|virer|vire)\b/i.test(t)) return 'pay_someone';
  return null;
}
function refineKind(text, b) {
  if (b.asked || b.kind === 'asked_by_someone') return b;
  const h = kindHint(text);
  if (!h) return b;
  if (!b.kind) return { ...b, kind: h, confidence: 0.6 };
  if (b.kind === 'send_to_my_account' && h === 'connect_or_accept_offer') return { ...b, kind: h };
  return b;
}
let kwLoaded = null;` },
    { file: 'pipeline/intent_clef.mjs',
      find: "      return async (t) => { const r = await m.keywordClassify(t); return { kind: KINDS.includes(r.kind) ? r.kind : null, confidence: r.confidence, asked: !!(r.facts && r.facts.asked), receive: !!(r.facts && r.facts.receive), via: 'extension/intent_text.js' }; };",
      replace: "      return async (t) => { const r = await m.keywordClassify(t); return refineKind(t, { kind: KINDS.includes(r.kind) ? r.kind : null, confidence: r.confidence, asked: !!(r.facts && r.facts.asked), receive: !!(r.facts && r.facts.receive), via: 'extension/intent_text.js' }); };" },
  ],
};
