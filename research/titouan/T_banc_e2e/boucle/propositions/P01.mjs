export default {
  id: 'P01',
  cible: ['^GRILLE[|]'],
  hypothese: "Un texte écrit par l'utilisateur mais non compris (hors sujet, vague, injection) ne prouve rien : verdict jamais plus bas que « non vérifié » (unknown), jamais vert ; le plancher sans intention est conservé s'il est plus haut.",
  edits: [{
    file: 'pipeline/intent_clef.mjs',
    find: "  if (!hasDetail) return { ...f, floorLevel: f.level, rawLevel: f.level, path: 'floor' };",
    replace: `  if (!hasDetail) {
    // texte écrit mais non compris : invérifiable (orange), jamais vert ; le plancher plus haut est conservé
    const written = cls && cls.reason && cls.reason !== 'empty' && !cls.classified;
    if (written && rankOf(f.level) < rankOf('unknown')) return { ...f, level: 'unknown', floorLevel: f.level, rawLevel: f.level, path: 'not_understood' };
    return { ...f, floorLevel: f.level, rawLevel: f.level, path: 'floor' };
  }`,
  }],
};
