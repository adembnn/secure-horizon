---
name: claim
description: Réserve une tâche coord/tasks/T-xxx de façon atomique (status todo→claimed, commit, push). Usage /claim T-112 [owner]
argument-hint: T-xxx [owner]
allowed-tools: Read, Edit, Bash(git *), Bash(node scripts/board.mjs)
---
Réserve la tâche `$ARGUMENTS` (premier mot = ID, second mot optionnel = owner, sinon `$CLAUDE_ACTOR`).

1. `git pull --rebase --autostash`. S'il échoue, arrête-toi et explique.
2. Ouvre `coord/tasks/<ID>-*.md`. Refuse et explique si :
   - status ≠ `todo` ;
   - une tâche de `depends_on` n'est pas `done` ;
   - l'ID n'appartient pas à ta lane (T-1xx = adem, T-2xx = titouan), sauf si un humain te l'a demandé.
3. Dans le frontmatter UNIQUEMENT : `status: claimed`, `owner: <owner>`, `updated: <maintenant ISO, ex. 2026-10-10T14:05+02:00>`.
4. `node scripts/board.mjs`, puis ajoute à la FIN de `coord/JOURNAL.md` : `<ISO> | claude-<acteur> | <ID> | claimed by <owner>`.
5. `git add coord && git commit -m "coord: claim <ID> by <owner>" && git push`.
   - Pas de remote (`git remote` vide) : garde le commit local et signale-le.
6. Si le push est rejeté : `git pull --rebase`.
   - Conflit sur le fichier de tâche → `git rebase --abort`, `git reset --soft HEAD~1`, `git checkout -- coord`, `git pull --rebase --autostash`, puis annonce « tâche déjà prise par <owner lu dans le fichier> ».
   - Pas de conflit → `git push` à nouveau.
7. Annonce le résultat en une ligne.
