---
id: T-180
title: README final (problème, architecture, installation, limites connues)
lane: tech
status: todo
owner: none
agent: builder-backend
branch: t/T-180
depends_on: []
files: ["README.md", "docs/**"]
test: "relecture humaine"
nist_csf: [Detect, Respond]
threat_refs: []
deadline: 2026-10-11T12:00+02:00
budget_usd: 3
created_by: claude-adem
updated: 2026-10-10T12:00+02:00
---
## Objectif
Remplacer le README de setup par le README jury : problème, architecture (schéma), installation reproductible, commande de démo, limites connues, mapping NIST CSF / OWASP / ATLAS. Le setup harness passe dans docs/harness.md.

## Critères d'acceptation (DoD)
- [ ] Sections problème / architecture / installation / limites connues présentes
- [ ] Installation testée from scratch sur une machine propre
- [ ] Aucun secret, aucune donnée personnelle réelle
- [ ] Livré avant le gel définitif (dimanche 12h00)

## Contexte / liens
- context/notion_guide.md (règlement officiel, source de vérité)
- coord/DECISIONS.md#D-001
