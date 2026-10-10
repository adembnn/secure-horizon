# Secure Horizon

Hackathon 36 h (10–11 oct. 2026), par Adem et Titouan.
**Projet : pas encore choisi.** Voir `coord/DECISIONS.md` (D-001). Pitch et commande de démo à ajouter ici une fois le projet tranché.

Ce repo sert aussi de **bus de coordination** entre deux sessions Claude Code (une par humain) et des workers headless sur AWS Bedrock. Le design complet est dans `research/07_harness_design.md`, et les règles communes dans `CLAUDE.md`.

## Règlement (source de vérité : `context/notion_guide.md`)

- Gel définitif **dimanche 12h00**. Le cœur du code doit être écrit entre samedi 11h30 et dimanche 12h00. Une seule track, confirmée au checkpoint de samedi 18h30.
- Hackathon blue team : chaque fonctionnalité est mappée sur NIST CSF 2.0 (Detect/Respond) et sur OWASP Agentic (`ASIxx`), MITRE ATLAS, ATT&CK ou D3FEND.
- Zéro secret dans le repo, et les jurys vérifient. Uniquement des données synthétiques. Aucune action contre un système réel.
- Livrables suivis dans `coord/tasks/` : T-180 README jury, T-181 livrable de track, T-280 deck (8 slides max), T-281 vidéo de 2 à 3 min, T-282 fiche de défense d'une page, T-283 pitch (round 1 en 5+2 min, finale en 3+3 min).

## Ce qu'il y a dedans

| Chemin | Rôle |
|---|---|
| `CLAUDE.md` | Règles lues par tous les Claude (lanes, workflow, sécurité) |
| `.claude/agents/` | 6 agents : researcher, builder-backend, builder-frontend, security-reviewer, pitch-writer, demo-tester |
| `.claude/skills/` | `/claim T-xxx`, `/sync`, `/handoff <dest> <msg>` |
| `.claude/settings.json` | Permissions (deny `.env*`, force-push, `--no-verify`…) + hooks |
| `scripts/hooks/` | `secret-guard` (bloque commit/push avec secret), `file-guard` (bloque lecture/écriture de `.env*`/clés et contenu secret), `session-sync` (pull + INBOX au démarrage), `coord-sync` (push auto de `coord/`, no-op sans remote) |
| `coord/` | `tasks/` (1 fichier par tâche, modèle `T-000-template.md`), `BOARD.md` (généré), `INBOX.md` / `JOURNAL.md` / `DECISIONS.md` (append-only, `merge=union`), `reports/` |
| `scripts/board.mjs` | Régénère `coord/BOARD.md` |
| `scripts/bedrock-env.*`, `check-bedrock.*` | Charge `.env.bedrock` puis teste la connexion Bedrock |
| `scripts/swarm.sh` / `swarm.ps1` / `swarm-report.mjs` | Lance N workers `claude -p` en parallèle (1 tâche = 1 worktree `../wt/<ID>` = 1 PR), puis fait le rapport coûts/statuts |

## Setup : checklist (Adem ET Titouan)

1. [ ] `claude update`, puis `claude --version` (≥ 2.1.280 attendu ; la machine d'Adem était en 2.1.34). Vérifier ensuite que `claude --help` liste bien `--agent`, `--max-budget-usd` et `--permission-prompts`.
2. [ ] `git config --global core.longpaths true`
3. [ ] Installer **gitleaks** (`winget install gitleaks.gitleaks` ou `scoop install gitleaks`), puis vérifier avec `gitleaks version`.
4. [ ] Installer **pre-commit** : `python -m pip install pre-commit`, puis dans le repo `pre-commit install`.
5. [ ] `gh auth login` (gh est déjà installé chez Adem).
6. [ ] (Recommandé, nécessaire pour lister les IDs de modèles) installer **AWS CLI v2** : `winget install Amazon.AWSCLI`.
7. [ ] Créer `.claude/settings.local.json` (gitignoré) :
   - Adem : `{ "env": { "CLAUDE_ACTOR": "adem" } }`
   - Titouan : `{ "env": { "CLAUDE_ACTOR": "titouan" } }`
8. [ ] Clés Bedrock, **à la réception des clés des orgas** :
   - `cp .env.bedrock.example .env.bedrock`, puis remplir la région et **une** option de credentials. Le plus simple : `aws configure --profile hackathon` avec `AWS_PROFILE=hackathon`.
   - Lancer `bash scripts/check-bedrock.sh` ou `.\scripts\check-bedrock.ps1`.
   - **Corriger les IDs marqués « À VÉRIFIER »** dans `.env.bedrock` d'après la sortie de `aws bedrock list-inference-profiles`. Si la région est en `eu-*`, utiliser le préfixe `eu.` ou `global.`.
   - Noter l'heure d'expiration des clés dans `coord/JOURNAL.md`. Les clés courtes durent 12 h au plus.
   - Ne jamais coller une clé dans un chat, une issue, une PR ou un fichier suivi par git.

Adem seulement (lead) :

9. [ ] Créer le repo GitHub privé, inviter Titouan, ajouter le remote, faire le premier commit puis push.
10. [ ] Activer Secret scanning + Push protection (si le plan le permet) et protéger `main` (pas de force-push). Créer les labels : `gh label create lane:tech`, `lane:biz`, `agent`, `needs-human`, `blocked`, `decision`, `demo-critical`.
11. [ ] Test de fuite volontaire : un commit contenant une fausse clé AWS (`AKIA` suivi de 16 caractères majuscules) **doit être bloqué**. Supprimer le fichier ensuite.
12. [ ] Swarm à blanc avec 2 tâches jouets à créer (`T-190`, `T-191`) : `.\scripts\swarm.ps1 -Tasks T-190,T-191 -J 2 -DryRun`, puis sans `-DryRun`.

Titouan :

13. [ ] Cloner le repo, faire les étapes 1 à 8, puis lancer `/sync` dans Claude Code et répondre à MSG-001 avec `/handoff adem …`.

## Utilisation au quotidien

- Début de session : automatique (hook). Ensuite `/sync`.
- Prendre une tâche : `/claim T-1xx`. Parler à l'autre : `/handoff titouan "…"`.
- Lancer des workers : `bash scripts/swarm.sh -j 3 T-112 T-113`. Ajouter `-n` pour un dry-run. Les logs vont dans `logs/swarm/<run>/` (gitignoré).
- Tableau : `node scripts/board.mjs`, puis ouvrir `coord/BOARD.md`.
