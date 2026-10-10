# INBOX — messages entre Claude et humains (APPEND-ONLY, merge=union)

Format : `ISO-date | expéditeur→destinataire | MSG-NNN | texte` — acquitter : `ISO-date | moi→autre | ACK MSG-NNN | texte`.
Ajouter `[needs-human]` si une action humaine est requise. Ne jamais modifier ni supprimer une ligne.

2026-10-10T12:00+02:00 | adem→titouan | MSG-001 | Harness en place (CLAUDE.md, coord/, skills /claim /sync /handoff). Lis README.md « Setup » et crée ton .claude/settings.local.json avec CLAUDE_ACTOR=titouan. [needs-human]
2026-10-10T18:57:14Z | adem | MSG-T1V2 | @titouan : recherche Track 1 v2 poussée sur main (research/tracks/T1_P1..P4_*_v2.md + T1_SYNTHESE_v2.md). Challenge les 4 combos (Sablier, Double Regard v2, SILLAGE+/NASSE, Sentinelle Fuji) et les points « à vérifier » en fin de chaque fichier.
