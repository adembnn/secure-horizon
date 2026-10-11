export default {
  id: 'P02',
  cible: ['^GRILLE[|]connexion', '^DECALAGE[|]connexion'],
  hypothese: "Une signature qui ne déplace rien, n'accorde rien et ne change aucun contrôle (message de connexion ou texte libre), alors que l'utilisateur dit vouloir payer, échanger ou envoyer : la demande ne fait pas ce qui est dit, à confirmer (warn). Jamais critical, car rien ne part.",
  edits: [
    {
      file: 'engine/src/fixes.mjs',
      find: "'F32', 'F33'];",
      replace: "'F32', 'F33', 'F34'];",
    },
    {
      file: 'run/policy.mjs',
      find: "  const floor = lvlOf(flags);",
      replace: `  // ---- F34 : l'intention dit un mouvement de valeur (payer, échanger, envoyer) mais la demande est une signature qui ne déplace rien, n'accorde aucun droit et ne change aucun contrôle
  // (connexion, texte libre) : elle ne fait pas ce qui est dit. À confirmer (warn), jamais critical (rien ne part). Sans type d'intention la règle ne fait rien (monotone).
  if (isOn('F34') && intent && DETAIL_KINDS.has(intent.kind) && eff.kind === 'signature' && !eff.opaque && !eff.delegation
    && ![eff.outgoing, eff.incoming, eff.approvals, eff.controlChange, eff.nested].some((x) => (x || []).length)) {
    reasons.push({ code: 'request_moves_nothing', sev: 'warn', said: 'Tu veux déplacer des fonds', does: 'Cette demande ne déplace rien : elle ne fait pas ce que tu as dit.' });
    notes.push('F34:signature_sans_mouvement_vs_intention_de_valeur');
  }

  const floor = lvlOf(flags);`,
    },
  ],
};
