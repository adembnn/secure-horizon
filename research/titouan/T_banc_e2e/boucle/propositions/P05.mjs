export default {
  id: 'P05',
  cible: ['^GRILLE[|](approbation|permit|permit2|setApprovalForAll)'],
  hypothese: "Sans genre d'acte lu, un droit accordé sur un autre jeton que celui dit (jeton dit extrait par le code, côté dépensé pour un achat) est un écart : la lecture « stricte » du jeton s'applique aussi au texte sans genre. P03 l'avait mise en lecture d'échange, ce qui masquait les droits sur un mauvais jeton.",
  edits: [
    { file: 'run/policy.mjs',
      find: "      const strict = (!!intent.kind && intent.kind !== 'buy_or_swap') || !!intent.receiveToken;",
      replace: "      const strict = intent.kind !== 'buy_or_swap' || !!intent.receiveToken;" },
  ],
};
