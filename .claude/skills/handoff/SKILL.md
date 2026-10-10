---
name: handoff
description: Envoie un message à l'autre Claude ou à un humain via coord/INBOX.md (+ ligne JOURNAL), puis commit et push. Usage /handoff <destinataire> <message>
argument-hint: <adem|titouan> <message>
allowed-tools: Read, Bash(git *), Bash(node scripts/board.mjs)
---
Message : `$ARGUMENTS` (premier mot = destinataire, le reste = texte).

1. `git pull --rebase --autostash`.
2. Calcule le prochain numéro : plus grand `MSG-<n>` présent dans `coord/INBOX.md` + 1 (3 chiffres, ex. MSG-007).
3. Ajoute UNE ligne à la fin de `coord/INBOX.md` (n'en modifie aucune autre) :
   `<ISO> | <moi>→<destinataire> | MSG-<n> | <texte>`
   Pour répondre / acquitter : `<ISO> | <moi>→<destinataire> | ACK MSG-<k> | <texte>`.
   Si une action humaine est nécessaire, termine le texte par `[needs-human]`.
4. Ajoute à la fin de `coord/JOURNAL.md` : `<ISO> | claude-<moi> | MSG-<n> | handoff → <destinataire>`.
5. Vérifie que le texte ne contient AUCUN secret, puis `git add coord/INBOX.md coord/JOURNAL.md && git commit -m "coord: MSG-<n> <moi>→<destinataire>" && git push` (si pas de remote : commit local seulement, et dis-le).
