# Round 1 : avocat du produit

## Thèse

La fiche d'incident complète est secondaire. Le journal chaîné, les raisons de chaque verdict, le playbook et la slide couvrent déjà le critère. Le temps rapporte plus dans un outil qui marche.

## Cinq arguments

**1. Le guide ne demande pas de fiche.** Livrables Track 1 : PoC, playbook, slide (notion_guide.md, l. 60). Le playbook dit « qui est alerté, ce qui est automatique, ce qui reste humain » (l. 60). Aucun rapport d'incident n'est cité.

**2. Le critère porte sur la trace.** Le jury regarde des « Décisions traçables et défendables devant un régulateur ou un auditeur » (l. 67). `extension/journal_chain.js` chaîne chaque verdict par SHA-256, dans les deux builds. Le panneau exporte le journal, `tools/verify_journal.mjs` le vérifie hors ligne, sept tests (RAPPORT_SECURITE_CORRECTIFS.md, l. 123 à 130).

**3. Les raisons sont affichées et rejouables.** Code de règle, fichier et ligne pour chaque raison ; rejeu déterministe, 6 décisions sur 6 (EXPLICABILITE.md, l. 73).

**4. Les jurés simulés n'ont jamais demandé la fiche.** Round 3 : 11, 11, 12, 12, 13 sur 15. Leurs demandes : version du modèle (jury_aws.md, l. 35), registre d'incidents (jury_kpmg.md, l. 35), ancrage (jury_team1.md, l. 25).

**5. La fiche existe déjà.** La démo web en contient une, 135 vérifications vertes (webdemo/RAPPORT_REVOQUER.md, l. 7 et 28). `incident.mjs` existe en prototype. La refaire dans l'extension coûte 6 à 10 heures, prises sur la faisabilité (20 %, « Le PoC marche-t-il ? », l. 66) et la démo (15 %).

## Ce qu'on perd quand même

- Rejeu partiel : ni phrase écrite ni paramètres dans le journal de l'extension.
- Version des règles absente : `v` donne la version du build, pas une empreinte des règles.
- Journal non ancré : réécriture complète ou suppression des dernières lignes invisible (journal_chain.js, l. 14).
- Deux inexactitudes du journal : confirmation humaine notée à tort, limitation à 50 USDC absente (SLIDE_CONFORMITE.md, l. 16).
- Documents contradictoires : PLAYBOOK_REPONSE.md (l. 17) et MAPPING_REFERENTIELS.md (l. 17) disent le build autonome « non chaîné ». C'est faux depuis le correctif.

## Version minimale (3,5 heures)

1. Corriger les deux lignes fausses du playbook et du mapping. 0,25 h.
2. Playbook d'une page en quatre titres : qui est alerté (la personne seule), automatique (verdict, limitation à 50 USDC), humain (annuler, continuer, révoquer), documenté (export JSON, vérification, limites). Citer la fiche de la démo web comme exemple. 1 h.
3. Slide : ajouter la commande d'export et de vérification. 0,5 h.
4. Démo de 20 secondes : exporter, changer une ligne, vérifier, montrer « ROMPUE ». 1 h avec répétition.
5. Oral : « Une plateforme branche ce journal à son registre d'incidents. » 0,25 h.
6. Corriger les deux inexactitudes si moins de 0,5 h. Sinon, les dire.

## Ce qu'il ne faut pas faire

- Porter la fiche dans l'extension avec bouton et HTML.
- Générer un PDF.
- Classer selon DORA : seule la plateforme a les critères (PLAYBOOK, l. 55).
- Ancrer sur Fuji en direct.
- Unifier les trois formats de journal.
- Mettre la phrase écrite dans le journal.

## Note de conformité estimée sur 15

| Cas | Note |
|---|---|
| État actuel | 11 à 11,5 |
| Version minimale, sans fiche | 12 à 12,5 |
| Fiche complète en plus | 12,5 à 13 |

La fiche vaut environ 0,5 point sur 100. Le même temps rapporte plus en faisabilité et en démo.
