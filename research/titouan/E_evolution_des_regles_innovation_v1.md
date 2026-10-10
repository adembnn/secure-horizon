# E. Faire évoluer les règles après une attaque (IA propose, humain valide, direction signe) : est-ce innovant ? (v1, Claude-Titouan, 11/10/2026 ~02h00)

Statut : réflexion annexe demandée par Titouan. Faits vérifiés par recherche web aujourd'hui, sources secondaires pour l'essentiel ; je n'ai pas lu les textes officiels. Le cycle imaginé : incident, l'IA propose une règle ou un seuil, rejeu, mode ombre, validation humaine, signature de la direction, nouvelle version scellée.

## 1. Verdict
Le concept n'est pas nouveau : chacun de ses morceaux est une pratique établie dans la finance ou la détection. Ce qui n'a pas été trouvé, c'est la combinaison appliquée aux règles de limitation de sorties d'un coffre on-chain, avec version scellée sur chaîne et preuve de rejeu. Innovation : faible à moyenne. Valeur : réelle, mais surtout comme preuve de gouvernance et de conformité que comme "wow" technique. À ne pas présenter comme "IA qui apprend".

## 2. Ce qui existe déjà, morceau par morceau
| Morceau | Pratique existante | Source |
|---|---|---|
| Un modèle propose, des humains approuvent, un contrat exécute | Gauntlet et Chaos Labs recommandent des paramètres de risque à l'Aave DAO par simulation (LTV, seuils, plafonds) ; vote (ARFC) puis exécution ; Chaos Labs initiait plus de 230 propositions | forum Aave |
| Mise à jour automatique bornée | Chaos Labs Risk Oracles et le Risk Steward d'Aave (BGD Labs) appliquent des changements "dans des bornes raisonnables" sans nouveau vote ; délai moyen de 96 h à moins d'une minute (source Unchained, date non confirmée) | Aave, Chaos Labs |
| Ajuster un seuil, tester l'effet, documenter | Réglage de seuils de surveillance AML par tests "above-the-line / below-the-line" (faux positifs contre faux négatifs), pratique standard | Abrigo, Deloitte, Protiviti |
| Champion / challenger et mode ombre | Le nouveau modèle tourne en parallèle sans effet, puis une part du trafic, puis promotion si preuve ; promotion = décision gouvernée avec preuves, retour arrière, versions conservées | éditeurs AML et fraude |
| L'IA génère une règle de détection, l'humain relit | Google SecOps : Gemini génère une règle YARA-L, ouverte dans l'éditeur pour modification (règles à événement unique) ; Detection Engineering Agent ; recherche AUTOSIGMA (règles Sigma depuis des rapports, validation par un juge LLM) | Google, arXiv |
| Politiques de sécurité on-chain définies par l'utilisateur | Hypernative Guardian (Safe Transaction Guard) : approuve, signale ou bloque selon des politiques ; agents sur changements de rôle | Safe, Hypernative |
| Multisig + timelock pour les changements d'autorisation, enregistrés on-chain | pattern de gouvernance courant | docs de gouvernance |

## 3. Ce qui est rendu obligatoire ou attendu par la réglementation (angle de conformité)
- DORA art. 9(4)(e) : politiques et contrôles de gestion du changement TIC, y compris les changements de paramètres de sécurité : risque évalué, enregistrés, testés, approuvés, mis en œuvre, vérifiés. Source secondaire ; la signature de l'organe de direction n'est pas confirmée par mes recherches.
- DORA art. 13 : revue après incident majeur, cause racine, leçons intégrées aux politiques et procédures.
Lecture : le cycle n'est pas un gadget, c'est la preuve que l'entité fait ce que DORA lui demande. C'est un argument pour le juré KPMG, pas pour le critère d'innovation.

## 4. Ce qui n'a pas été trouvé (à dire comme tel)
Un flux où une règle de limitation de sorties d'un coffre est proposée après incident, rejouée sur une suite d'attaques scellée avant, passée en mode ombre, signée par la direction, puis publiée en version de hash ancrée sur chaîne, avec lien vers le dossier de déclaration. Hypernative n'expose pas ce flux dans ce que j'ai lu. Absence de résultat ne vaut pas preuve d'absence.

## 5. Ce qui pourrait en faire une vraie innovation, si on le choisit
1. **Gouvernance asymétrique** : resserrer vite et automatiquement, dans des bornes, comme les Risk Stewards d'Aave ; assouplir lentement, avec signature. Cela rejoint déjà notre principe "la machine ne fait que resserrer", avec un précédent accepté par un DAO.
2. **Porte de non-régression** : aucune version de règles n'est promue si elle échoue à la suite d'attaques scellée ou dépasse le budget de faux positifs. C'est de la "détection en tant que code" avec intégration continue ; courante en SIEM, rare appliquée aux limites de sortie on-chain.
3. **Lien incident, règle, dossier** : le dossier DORA cite la règle active au moment de l'incident (version, hash, mandat) et la leçon retenue (art. 13). Rien de comparable trouvé.
4. **Preuve de ce qui a changé** : pour chaque version, le hash, la diff, le résultat de rejeu, le nom du signataire, la date. L'auditeur peut reconstruire ce qui était actif à n'importe quelle date (exigence relevée dans la gouvernance de modèles AML).

## 6. Risques à nommer
- Surapprentissage de la dernière attaque ("on combat la guerre précédente") : la porte de non-régression et la suite d'évasions de C_banc_essai_evasions_v1.md servent à ça.
- Empoisonnement : un attaquant qui nourrit le système d'incidents factices pour déplacer les règles. Parade : seul un humain décide qu'un incident est réel ; l'IA ne lit que des incidents qualifiés.
- Hallucination : une règle proposée qui semble plausible et est fausse. Parade : rejeu obligatoire, la règle n'a aucun effet sans signature.
- Surcharge : trop de règles, fatigue d'alerte. Parade : budget d'alertes par règle, retrait des règles inutiles.
- Le mot "IA qui évolue" attire le scepticisme du superviseur : dire "l'IA propose, jamais n'applique".

## 7. Recommandation
- Ne pas en faire un titre du pitch. L'angle d'innovation le plus solide reste la perte bornée prouvée et la méthode pré-enregistrée (D_innovation_carte_v1.md).
- Garder ce cycle comme priorité P1 sous le nom "gestion du changement des règles" : une slide, et une démo minimale si le temps le permet (incident qualifié, règle proposée, rejeu qui passe ou échoue, signature, nouvelle version scellée).
- L'utiliser comme réponse à deux questions pièges : "qui met à jour les règles quand Drift devient Drift 2 ?" (RSSI) et "qui répond si les règles ratent une attaque ?" (KPMG).
- Dans le pitch : "l'IA propose, le rejeu tranche, la direction signe, l'auditeur rejoue".

## 8. Sources principales
Forum de gouvernance Aave (Gauntlet, Chaos Labs, Risk Steward) ; Chaos Labs (Slope2 Risk Oracle) ; Unchained (délais) ; Abrigo, Deloitte, Protiviti (tuning AML) ; documentation Google SecOps (génération de règles YARA-L) ; arXiv AUTOSIGMA ; documentation Safe et Hypernative (Guardian) ; guides DORA art. 9 et 13 (secondaires).
