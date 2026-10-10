# Boucle jurés (Claude-Titouan), tour 2 : synthèse

Plan jugé : plan_v1_2.md (intègre le tour 1 et D-004), presentation_plan_v1.md, spec DORA corrigée. Les jurés sont les mêmes sous-agents qu'au tour 1 (reprise de leur contexte), notes estimées, aucune recherche web.

## Notes
| Juré | Tour 1 | Tour 2 | Écart |
|---|---|---|---|
| 3 Kryptosphère | 68 | 73 | +5 |
| 7 Grand jury généraliste | 66 | 74 | +8 |
| 4 RSSI de CASP | 63 | 71 | +8 |
| 6 Superviseur AMF | 63 | 70 | +7 |
| 1 Avalanche / Team1 | 63 | 70 | +7 |
| 2 KPMG | 61 | 67 | +6 |
| 5 Chercheur attaquant | 59 | 66 | +7 |
| **Moyenne** | **63,3** | **70,1** | **+6,8** |

Détail tour 2 (moyennes arrondies) : détection ~20/30, réponse ~15/20, faisabilité ~12/20, conformité ~12/15, pitch ~11/15.

## Ce qui a vraiment progressé (ce que les 7 reconnaissent)
- L'écran partagé "sans Guard / avec Guard" avec compteur et clic vers l'explorateur : "le meilleur ajout du dossier" (Kryptosphère), "ce qui manquait" (généraliste).
- Le recentrage D-004 (circuit d'approbation détourné) : le RSSI s'y reconnaît ("ma hot wallet n'est pas un vault DeFi").
- La cohérence et l'honnêteté : interdits écrits, séparation direction / conformité / dépôt, "prêt à relire en 4 h", T3 corrigé.
- La note monte parce que la promesse est plus claire, pas parce que la preuve existe : tous le disent.

## Ce qui n'a PAS changé (le vrai plafond du plan)
1. **Aucun chiffre mesuré, aucune adresse Fuji, aucun lien explorateur** (7/7). Seul un banc d'essai exécuté fait monter la note ; le juré Avalanche : sans lien Snowtrace, sous 65-70.
2. **Le callback custodian est une hypothèse** et c'est la moitié du récit Bitget (5/7). Sans lui, un prestataire en MPC n'est protégé qu'en lecture. Remède unanime : le sortir du récit et de la démo tant qu'un test réel n'existe pas ; "seul le contrat est démontré".
3. **Le "X € sauvés" reste circulaire** tant qu'une attaque n'a pas été écrite par un tiers nommé (4/7). Le juré généraliste et Kryptosphère : un humain externe (juré, mentor) qui lance l'attaque en direct.
4. **Le responsable conformité de la démo n'existe pas** et le droit n'est pas lu à la source (AMF, KPMG).
5. **La deadline est toujours inconnue** (4/7).

## Nouveaux défauts introduits ou révélés
- **Voie lente non spécifiée** (durée, quota, ordre) et exposée à la saturation par du bruit (attaquant). Traité dans B_menaces_et_voie_lente_v1.md.
- **Budget global multi-chaînes** : argument central de Bitget (7 chaînes) classé P2, sans règle d'arbitrage (attaquant). Règle proposée : "le plus strict gagne" et plafond local autonome. Décision à prendre : le montrer sur 2 chaînes locales ou retirer "7 chaînes" du cœur du pitch.
- **Callback fermé = déni de service gratuit** : mode dégradé avec plafond de secours (B, section 4).
- **Fatigue d'alerte et mode ombre** : un attaquant présent pendant l'observation devient "normal" (B, section 4).
- **Spec DORA incohérente avec elle-même** (KPMG) : §2, T7 et en-tête. §2 et T7 corrigés ; l'en-tête reste vrai (JO non lu).
- **Ratio "N champs sur M prouvés"** lu comme indicateur de qualité (AMF) : l'écran doit dire qu'il mesure la traçabilité, pas l'exactitude. Un écran à deux boutons reste un tampon : mesurer et afficher le temps passé sur l'écran de qualification.
- **Plan de présentation** : promet un enregistrement vidéo cette nuit avec "le vrai produit" qui n'existe pas (Avalanche) ; la comparaison à Trustee est du bruit pour le jury (Avalanche, généraliste) ; "Watch" sur scène dilue le message (Kryptosphère, généraliste, AMF) ; 10 questions apprises par cœur se voient (Avalanche).
- **Faisabilité** (11-12/20) : P0 reste large ; "P0/P1/P2" est du jargon interne qui ne doit pas sortir.

## Décisions proposées pour le plan v1.3 (à valider par Titouan)
1. P0 = on-chain uniquement. Callback custodian et Watch sortent du récit de démo ; ils restent en limites écrites ("non testé, non vendu").
2. Un mandat minimal (plafond, durée de voie lente, qui libère) passe en P0.
3. Un contrat déployé sur Fuji dans les premières heures, adresse écrite dans le README, avant toute autre pièce.
4. Une attaque de test écrite par un tiers nommé, et si possible une attaque lancée en direct par un juré ou un mentor depuis un bouton (à préparer, avec plan B).
5. Écran partagé étiqueté "simulation" côté "sans Guard" ; comparaison Bitget présentée comme ordre de grandeur, jamais comme gain.
6. Ouverture avec une victime humaine concrète (387 M$ partis en 3 h, des clients à qui l'on devait leur argent), puis Léa.
7. Voie lente et saturation ajoutées au banc d'essai (attaque de saturation, petits retraits légitimes qui passent encore).
8. Un vrai relecteur humain (KPMG, mentor) pour jouer le responsable conformité en direct, sinon le mot "simulé" à l'écran.
9. Lire le Journal officiel (RTS 2024/1772, RTS 2025/301, ITS 2025/302) avant toute affichage des seuils ; sinon "format non validé" sur la page de sortie.

## Faut-il un tour 3 ?
Probablement non sur ce plan. Les 7 jurés répètent désormais "rien n'est mesuré" : plus aucune réécriture sur papier ne fera monter la note de façon significative. Les gains restants sont dans l'exécution : contrat déployé, banc d'essai exécuté, attaque en aveugle, démo répétée. Un tour 3 n'a de sens qu'après avoir tranché les décisions 1 à 9 et obtenu les résultats des tests de connecteurs d'Adem (callback custodian).
