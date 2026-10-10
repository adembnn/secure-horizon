# D. Carte de l'innovation : ce qui existe, ce qu'on reprend, ce qui est neuf (v1, Claude-Titouan, 11/10/2026 ~01h30)

Statut : analyse critique. Faits vérifiés par recherche web aujourd'hui ou par les sondes d'Adem ; le reste est étiqueté. Une absence dans mes recherches n'est pas une preuve d'absence.

## 1. Verdict honnête
Il n'y a pas d'algorithme nouveau dans le projet. L'innovation est dans l'assemblage vérifiable et dans la rigueur de la preuve. C'est une innovation réelle mais plus difficile à faire voir qu'un score d'IA. Il faut la montrer par des mesures et des garanties, pas par des mots.

## 2. Ce qui existe déjà (ne pas le vendre comme neuf)
| Brique | Ce qui existe | Source |
|---|---|---|
| Plafond de dépense indépendant dans un contrat | Safe Allowance Module (limite par période, appliquée en chaîne, contourne le seuil de signatures) ; Zodiac Roles v2 (permissions et allowances) ; Safe Guard (contrat qui refuse avant/après exécution) | docs Safe, ENS (EP 5.12) via recherche |
| Plafond par fenêtre | ERC-7265 (proposition de 2023, statut 2026 inconnu, implémentation CC0) | Magicians |
| Refus avant signature chez le custodian | Fireblocks API Co-Signer Callback (APPROVE / REJECT / RETRY, 30 s) ; BitGo politique webhook ; Cobo callback ; Copper et Ledger Enterprise sans veto synchrone ; Coinbase Prime absent | doc Fireblocks ; sondes d'Adem (callback testé en local, test réel bloqué par le compte) |
| Détection + pause automatique | Hypernative (pause en secondes, audit trail, discours DORA sans gabarit de rapport) ; Hexagate (gratuit pour builders Avalanche) ; ≥ 6 projets Chainlink 2026 | Hypernative, Chainalysis, recherche d'Adem |
| Classification DORA automatique | ServiceNow DRIR (rapport initial en 24 h, pas d'entrée on-chain) ; Incident Oracle (serveur MCP, classification et rapports ITS) ; D3 Security | docs éditeurs, recherche web |
| Ancrage d'un hash sur chaîne | Pratique courante | recherche d'Adem |
| Rejeu de hacks | DefiHackLabs, CyberChainBench ; AEGIS (rejeu d'Euler dans l'UI) | recherche d'Adem |
Attention : le Safe Guard 1.4.1 peut être contourné par un Module (donc par l'Allowance Module) : un plafond « dans le Guard » n'est pas suffisant seul (note d'Adem, sondes).

## 3. Ce qu'on reprend sans réécrire
Safe 1.4.1 + Guard (testé par le code sur Fuji), modèle de fenêtre d'ERC-7265, patron Hypernative « seuils d'alerte et de pause séparés », handler Fireblocks en simulation locale, instructions opérationnelles ESAs du 16/09/2026, ancrage Merkle simple.

## 4. Où est vraiment l'innovation (classée par solidité)
| # | Idée | Pourquoi c'est neuf ou rare | Preuve de l'absence | Coût | Solidité |
|---|---|---|---|---|---|
| 1 | **Garantie de perte maximale prouvée par test** : au lieu de promettre une détection, on énonce « aucune séquence d'approbations ne peut sortir plus de X par fenêtre » et on la teste par fuzzing d'invariants (Foundry/Echidna), y compris avec un approbateur qui ment | Les vendeurs affichent des taux de détection (99,x %) sans protocole reproductible ; une borne démontrée par propriété est d'un autre ordre | non trouvée chez les concurrents lus ; à vérifier | moyen (quelques heures) | forte |
| 2 | **Méthode d'évaluation pré-enregistrée** : hash des règles ancré avant l'écriture des attaques, attaques écrites en aveugle par un tiers nommé, ratés publiés, rejeu par l'auditeur | Aucune pratique de pré-enregistrement trouvée dans les outils de sécurité ; une revue 2026 réclame justement rejeu et délai d'action | non trouvée | faible | forte pour la crédibilité, modeste en technique |
| 3 | **Budget global multi-chaînes** avec règle « le plus strict gagne » et plafond local autonome | Bitget a vidé 7 chaînes en environ 3 h ; un plafond par contrat ne voit pas les autres ; je n'ai pas trouvé d'outil qui coordonne contrats et custodian | non trouvée | moyen à élevé | moyenne (à montrer sur 2 chaînes locales) |
| 4 | **Dossier de déclaration prouvé champ par champ + linter des 12 règles de qualité des ESAs** (unités en milliers, 2.5 toujours « services critiques », 2.6 sans pays de l'entité, 3.17 aussi aux rapports intermédiaire et final, etc.) | Les GRC ne les affichent pas ; correspond aux « erreurs de complétude » relevées par l'ACPR ; aucun outil lu ne prend l'on-chain en entrée | non trouvée (Incident Oracle et ServiceNow ne prennent pas l'on-chain) | moyen | moyenne : valeur forte pour KPMG, mais le droit n'est pas lu à la source |
| 5 | **La pause fait évoluer la classification** (indisponibilité > 2 h) et **la menace bloquée devient une notification volontaire** avec classification hypothétique | Détail réglementaire fin ; peu de plaquettes le disent | non trouvée | faible | moyenne |
| 6 | **Écart entre ce que le circuit annonce et ce que la chaîne montre** (signal clé d'Adem) | C'est la leçon Bitget ; mais en réel la « source indépendante » (demandes signées par chaque client) est difficile à obtenir | à voir | élevé | faible à moyenne en démo : risque de n'être qu'un simulacre |
| 7 | **Écran partagé « sans / avec »** et clic de preuve | Pas une innovation technique, une innovation de communication : rend la preuve lisible en 10 secondes | | faible | forte pour le pitch |

## 5. Ce qui n'est PAS de l'innovation, même s'il est utile
Pause automatique, plafond, moniteur on-chain, ancrage Merkle, classification par règles, texte rédigé par IA, journal chaîné.

## 6. Conséquence sur le message
- Remplacer « on détecte » par « on borne la perte, et on le prouve ». La détection reste nécessaire mais n'est pas le titre.
- Ouvrir sur la preuve : « voici la perte maximale garantie, voici la méthode scellée avant les tests, voici les ratés ».
- Citer les briques existantes (Safe, ERC-7265, Fireblocks, Hypernative) avec respect : « nous les assemblons, nous les mesurons, nous produisons la preuve ».
- Ne jamais écrire « personne ne fait ça ». Écrire « nous n'avons pas trouvé d'outil qui… ».

## 7. À vérifier avant d'afficher
Qu'aucun outil lu ne propose déjà une borne de perte prouvée par propriété ; que le fuzzing d'invariants (Foundry) tient dans le temps ; la lecture du Journal officiel pour les seuils DORA ; si Fireblocks ou un autre custodian est testable en sandbox.
