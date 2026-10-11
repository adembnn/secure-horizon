# preuves/ : le banc de mesure de Hold up

**Ce dossier est un outil de travail. Ses chiffres bougent avec le code.** Le pitch et la vidéo citent le jeu aveugle figé, `research/titouan/T_banc_e2e/blind_decalage/run/RESULTAT.md` (250 cas d'un autre auteur, ouvert une fois), pas ce banc. Ce banc sert à savoir où le produit échoue et à vérifier une correction. Il ne corrige rien lui-même.

État des chiffres publiés ici : mesure du 11 octobre 2026 sur le build du commit `7a5eadc`, **qui tombait en panne** sur les envois (voir `CE_QUI_NE_MARCHE_PAS.md`, gravité 2). Le contrôle a donc été vu une fois sur un code en panne. La mesure finale après corrections se fait sur la réserve, jamais ouverte.

## Reproduire en une commande

Depuis la racine du dépôt, Node 22 ou plus :

```
node preuves/panel/gen_panel.mjs                 # une fois : recrée les trois parts du panel (mêmes octets, empreintes vérifiées ensuite)
node --no-warnings preuves/banc.mjs --bras=mots  # mesure le code présent, sans clé ni réseau, environ deux minutes
```

Avec le modèle : `node --env-file=.env --no-warnings preuves/banc.mjs` (Clef-flash, environ 10 000 appels la première fois, cadencés à 4 par seconde, repris où le cache s'arrête ; plafond 15 000). La clé n'est jamais affichée ni écrite.

Le banc commence par un contrôle préalable : si le moteur lève une exception sur une des 17 demandes d'essai, il refuse de mesurer. Il copie ensuite le build dans `out/instantane/<empreinte>/` et mesure cette copie : chaque résultat porte le commit, les fichiers modifiés hors commit avec leur empreinte, et l'empreinte du décideur.

La commande écrit `REGISTRE.json`, `out/RESULTATS.json`, `out/ERREURS.jsonl`, `out/detail/`, `CHIFFRES_TRACES.md`.

**Mesure finale après corrections**, une seule fois, quand le code est gelé et commité :

```
node --env-file=.env --no-warnings preuves/banc.mjs --ouvrir-reserve
```

Sans `--ouvrir-reserve`, le contrôle est remesuré et marqué `RE_MESURE_APRES_CHANGEMENT_DU_PRODUIT` : ses erreurs sont publiées, il ne vaut plus que réglage.

Pour retrouver les chiffres publiés ici : se placer sur le build du commit `7a5eadc` et lancer `node --no-warnings preuves/banc.mjs --mesurer-malgre-panne`. Le cache de Clef et les copies figées du code ne sont pas commités (`.gitignore`).

Autres options : `--jeux=a,b`, `--contexte=nu,cas`, `--sans-controle`, `--a-cote` (mesure un autre état sans toucher aux fichiers de référence), `--instantane=<empreinte>` (rejoue un état déjà copié). `node preuves/rapport.mjs` réécrit `CHIFFRES_TRACES.md` sans rien mesurer. `node preuves/panel/valide_panel.mjs --moitie=reglage` vérifie la structure du panel.

## Où lire

| Question | Fichier |
|---|---|
| Qu'est-ce qu'un faux positif, un faux négatif, un « pas pu vérifier », une panne ? D'où vient la vérité ? Quelles limites ? | `PROTOCOLE.md` |
| Les chiffres, avec commande, empreinte du jeu, état du code, date, intervalle, réglage ou contrôle | `CHIFFRES_TRACES.md` |
| Où le produit échoue, par gravité et par axe, avec exemples | `CE_QUI_NE_MARCHE_PAS.md` |
| Écarts avec `livrables/CHIFFRES.md` | `ECARTS_LIVRABLES.md` (repris à la fin de `CHIFFRES_TRACES.md`) |
| Quels jeux existent, lesquels sont lus, leur empreinte | `REGISTRE.json` |
| Tous les compteurs, par jeu, bras, contexte, vue et case | `out/RESULTATS.json` |
| La demande d'intention couvre-t-elle tout ce que fait un contrat ? (autre agent) | `exhaustivite/EXHAUSTIVITE_INTENTION.md` |

## Remonter d'un chiffre à un cas

1. Prendre le chiffre dans `CHIFFRES_TRACES.md` : la ligne donne le jeu, le bras, le contexte, la vue ou la case.
2. `out/RESULTATS.json` : `jeux.<jeu>.mesures["<bras>/<contexte>"].cases.<axe>.<valeur>` porte les mêmes compteurs.
3. Les erreurs de cette case : `out/ERREURS_panel_controle.jsonl` (commité : les 240 faux positifs et faux négatifs du contrôle) ou `out/ERREURS.jsonl` (tous les jeux, après une exécution). Filtrer sur `jeu`, `bras`, `type`, `cases.<axe>`. Chaque ligne donne l'identifiant, la phrase, l'effet de la demande, la vérité et sa raison, le verdict, ce que le produit a lu dans la phrase, et la règle ou le signal responsable.
4. Toutes les paires, abstentions et réussites comprises : `out/detail/<jeu>.<bras>.<contexte>.jsonl`, après une exécution.
5. La paire complète (demande encodée, affirmation, effet) : chercher l'identifiant dans `panel/CONTROLE.jsonl`, après `gen_panel.mjs`.

Exemple : les ratés de l'axe « droit durable » sur le contrôle, sans modèle.

```
node -e "for (const l of require('fs').readFileSync('preuves/out/ERREURS_panel_controle.jsonl','utf8').split('\n').filter(Boolean)) { const e = JSON.parse(l); if (e.bras==='mots' && e.type==='faux_negatif' && e.cases.ecart==='D1_duree') console.log(e.id, '|', e.phrase, '|', e.signal_responsable) }"
```

## Contenu

| Chemin | Rôle |
|---|---|
| `banc.mjs`, `rapport.mjs` | la commande unique ; la réécriture du tableau |
| `lib/decideur.mjs` | pilote le service worker du build livré sans navigateur ; dit ce qui tourne et ce qui ne tourne pas |
| `lib/clef.mjs` | appelle le vrai relais du produit ; cache, cadence, reprise, plafond |
| `lib/jeux.mjs` | inventaire des jeux ; les jeux interdits n'y ont pas de lecteur ; erratum E1 |
| `lib/stats.mjs`, `lib/rapport.mjs` | Wilson, quantiles, empreintes ; écriture de `CHIFFRES_TRACES.md` |
| `panel/gen_panel.mjs`, `panel/gabarits.mjs` | le grand panel : 8 896 paires, vérité par construction, graine fixe |
| `panel/*_SHA256.txt`, `panel/PANEL_STATS.json` | empreintes et composition des trois parts (réglage 3 561, contrôle 2 662, réserve 2 673) |
| `panel/OUVERTURES.log` | chaque mesure du contrôle ou de la réserve, avec l'empreinte du code |
| `panel/valide_panel.mjs` | second décodeur, indépendant du générateur |

Non commité, régénéré par les commandes ci-dessus : les trois fichiers du panel, `out/detail/`, `out/etats/`, `out/regen/`, `out/instantane/`, `out/cache_clef.json`, `out/ERREURS.jsonl`. Restes de mise au point à supprimer à la main : `out/_*.cjs`, `out/essai_decideur.mjs`, `out/journal_execution.txt`.
