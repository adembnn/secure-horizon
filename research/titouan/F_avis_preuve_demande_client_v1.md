# F. Avis sur "chaque sortie adossée à une preuve que le client l'a demandée" et sur le catalogue de détecteurs (Claude-Titouan, 11/10/2026 ~02h20)

Lu : T1_P4_preuve_demande_client.md (Adem) et T1_P4_catalogue_detecteurs.md. Avis critique, non validé par Titouan.

## 1. La preuve de demande client : ce qui est fort
- C'est la seule idée du dossier qui change la nature de la défense : on ne détecte plus un retrait suspect, on **refuse** un retrait qui n'a pas de demande client signée. Le cas Bitget (transferts sans demande de retrait client, d'après le CEO via la presse) devient évité par construction, pas détecté après coup.
- Elle donne la "source indépendante" que j'avais jugée difficile (G8, signal 2). Le précompile P-256 (ACP-204) a été testé sur Fuji en lecture seule : bon signe de faisabilité.
- Message simple pour un jury : "pas de sortie sans demande signée par le client, et jamais plus que le plafond".
- Antériorité : primitive connue en self-custody (Hyperliquid, StarkEx, Safe + passkeys, Gnosis Pay), application à un hot wallet omnibus de CASP non trouvée (confiance annoncée 70 %).

## 2. Ce qui m'inquiète
1. **Un second produit.** Registre de clés clients, enrôlement, signature à chaque retrait, lots de retraits : c'est beaucoup. Nos 7 jurés répètent "trop large". Risque de repartir vers l'idée écartée en début de journée ("sceau d'intention") sous un autre nom : à arbitrer par Titouan.
2. **Le registre déplace la confiance** (Adem le dit lui-même) : un backend compromis peut inscrire de faux clients. Il faut un enrôlement signé hors ligne par des humains, et un plafond par client et agrégé.
3. **Ne couvre pas** les flux de trésorerie sans client (market maker, OTC, rebalancement), ni l'interface client détournée qui fait signer l'adresse de l'attaquant (leçon Bybit), ni les chaînes non-EVM.
4. **Adoption** : un vrai exchange ne change pas son flux de retrait pour une démo. À présenter comme une option pour les produits on-chain, pas comme une exigence.
5. **Tests** : tout reste sur un coffre synthétique ; "refusé parce que sans demande" est vrai par construction et ne mesure rien de nouveau. Il faut la même discipline de banc d'essai (attaques en aveugle, ratés).

## 3. Ma recommandation
- Version minimale pour la démo : demande signée en EIP-712 par une clé ordinaire (vérifiée par ecrecover), pas par passkey P-256. Même effet de démonstration, trois fois moins de risque. Le P-256 reste une ligne de feuille de route, citée avec le test Fuji.
- Priorité P1, après le plafond en dur, la voie lente et le mandat. Ne pas toucher le P0.
- Dans le récit : "deux gardes indépendants du circuit d'approbation : un plafond, et une preuve de demande". Mais ne promettre que ce qui est démontré, et dire ce que ça ne couvre pas.
- Si le temps manque, c'est la première chose à couper après le leurre.

## 4. Catalogue de détecteurs : avis
- D'accord avec la règle de contexte : un contexte ne peut que **relever** la sévérité, jamais l'abaisser, sauf calendrier signé à l'avance (Drift a frappé juste après un test de retrait légitime et une migration planifiée). C'est cohérent avec "la machine ne fait que resserrer".
- Le catalogue ajoute 14 signaux utiles. Ma règle : en garder 4 à 5 au P0, choisis pour leur **indépendance du circuit menteur** (plafond de stock et part de réserve, destination jamais vue et âge, vidage à zéro, changements de pouvoirs, approbations vers un nouveau dépenseur). Le reste est du bruit tant que rien n'est mesuré.
- Chaque signal ajouté doit venir avec : sa variante d'évasion, sa part de faux positifs sur le trafic légitime, et la ligne qui le justifie dans le banc d'essai.
