---
id: T-000
title: Modèle de tâche (copier en T-1xx-<slug>.md ou T-2xx-<slug>.md)
lane: tech                 # tech | biz
status: todo               # todo | claimed | doing | review | done | blocked
owner: none                # adem | titouan | agent:<nom-agent> | none
agent: builder-backend     # researcher | builder-backend | builder-frontend | security-reviewer | pitch-writer | demo-tester
branch: t/T-000
depends_on: []             # ex. [T-110]
files: ["app/example/**"]  # périmètre autorisé (anti-conflit) — disjoint des autres tâches doing
test: "npm test"           # commande de vérification
nist_csf: [Detect]        # NIST CSF 2.0 : Govern | Identify | Protect | Detect | Respond | Recover
threat_refs: []            # ex. [ASI02, AML.T0051, T1078, D3-UAP] (OWASP Agentic / ATLAS / ATT&CK / D3FEND)
deadline: 2026-10-11T12:00+02:00   # gel définitif
budget_usd: 3
created_by: claude-adem
updated: 2026-10-10T00:00+02:00
---
## Objectif
Une phrase.

## Critères d'acceptation (DoD)
- [ ] ...
- [ ] tests verts via `test`

## Contexte / liens
- coord/DECISIONS.md#D-001
