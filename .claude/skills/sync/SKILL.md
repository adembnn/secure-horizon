---
name: sync
description: Synchronise avec le repo partagé (pull, BOARD régénéré), résume les messages INBOX non acquittés qui me sont adressés et les PR ouvertes. Usage /sync
allowed-tools: Read, Bash(git *), Bash(node scripts/board.mjs), Bash(gh pr list*)
---
1. `git pull --rebase --autostash`. En cas de conflit :
   - sur `coord/BOARD.md` : `node scripts/board.mjs && git add coord/BOARD.md && git rebase --continue` ;
   - sur un fichier append-only (INBOX/JOURNAL/DECISIONS) : garder les lignes des deux côtés, `git add`, `git rebase --continue` ;
   - ailleurs : arrête-toi et explique à l'humain.
2. `node scripts/board.mjs`.
3. Lis `coord/INBOX.md` : liste les lignes `…→<CLAUDE_ACTOR>` dont l'ID `MSG-xxx` n'a pas de ligne `ACK MSG-xxx`.
4. Si `gh` est disponible et qu'un remote existe : `gh pr list --state open`.
5. Résumé en ≤ 10 lignes : tâches `doing`/`review`/`blocked`, messages à traiter, PR à revoir, prochaine action conseillée.
