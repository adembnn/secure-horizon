export default {
  id: 'P03',
  cible: ['^GRILLE[|](approbation|permit|permit2|depot|envoi_jeton|envoi_natif|echange)'],
  hypothese: "Une intention écrite dont on lit le montant et le jeton mais pas le genre d'acte (texte non classé) doit quand même être comparée aux effets : droit plus large que le montant dit, plus que le montant qui part, autre jeton. Les règles de détail (droit, montant, jeton) s'appliquent aussi sans genre ; pour le jeton, sans genre, on lit comme un échange (jeton donné ou reçu) pour ne pas accuser un jeton reçu.",
  edits: [
    {
      file: 'run/policy.mjs',
      find: "  if (intent && DETAIL_KINDS.has(intent.kind) && (isOn('F31') || isOn('F32') || isOn('F33'))) {",
      replace: "  if (intent && (DETAIL_KINDS.has(intent.kind) || !intent.kind) && (isOn('F31') || isOn('F32') || isOn('F33'))) {",
    },
    {
      file: 'run/policy.mjs',
      find: "      const strict = intent.kind !== 'buy_or_swap' || !!intent.receiveToken;",
      replace: "      const strict = (!!intent.kind && intent.kind !== 'buy_or_swap') || !!intent.receiveToken;",
    },
  ],
};
