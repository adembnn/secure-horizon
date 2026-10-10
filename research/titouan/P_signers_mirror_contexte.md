# P. Contexte : « Signer's Mirror » et l'écart entre ce qui est affiché et ce qui s'exécute (Claude-Titouan, 11/10/2026)

Origine : la première session de stratégie du hackathon (cherchée dans la transcription, piste B). Titouan veut la remettre au centre : « il y a écrit ça, mais le code derrière exécute autre chose ». Statut : contexte pour Adem, non figé.

## 1. L'idée d'origine (piste B, « Signer's Mirror »)
- Problème : Bybit et Drift, des signatures piégées ou préparées à l'avance.
- Produit : un vérificateur local, INDÉPENDANT de l'interface, qui décode et simule la transaction, puis compare avec ce que l'interface affiche.
- Dépôt de l'intention : un contrat impose un timelock ET l'intention déclarée. Avant de signer, on a donc déposé « ce qu'on veut faire » (c'est le « dépôt » dont parle Titouan), et le vérificateur contrôle que ce qu'on signe y correspond.
- Démo imaginée : rejeu d'une attaque de type Bybit sur Anvil. L'interface montre « transfert » ; le vérificateur montre « delegatecall vers un contrat malveillant ».
- Risque noté à l'époque : visuellement austère ; concurrence directe Candide, Blockaid. Cette session recommandait d'abord la piste A (arène agent IA), B en second.

## 2. Pourquoi ça recoupe D-007
La barrière d'intention d'Adem (D-007) contient déjà le comparateur « dit / fait ». Signer's Mirror ajoute une TROISIÈME source à comparer :
1. ce que l'interface (le site) AFFICHE ou prétend ;
2. ce que l'utilisateur a DIT vouloir faire (intention déposée) ;
3. ce que la transaction ou la signature FAIT réellement (décodage + simulation).
L'écart 1 contre 3 attrape un site ou une interface compromise (cas Bybit, où les signataires voyaient une opération légitime). L'écart 2 contre 3 attrape l'utilisateur trompé. Le Snap lit le payload brut, indépendamment du site : c'est sa force.

## 3. Faits à garder (étiquettes à revérifier)
- Bybit (février 2025, environ 1,46 à 1,5 Md$ selon sources) : les signataires voyaient une opération apparemment légitime ; l'opération réelle changeait le comportement du portefeuille (appel délégué). Détail technique : voir nos fichiers I_incidents/.
- Radiant (cité dans O1, blog Fondation Ethereum du 5 oct. 2026 [P]) : la simulation montrait la transaction voulue alors que la transaction signée différait : « intent mismatch » contre « outcome mismatch ».
- Un Snap lit transaction et signature mais ne bloque pas (OB) ; limite à afficher dans la démo.

## 4. Ce que ça change dans le contrat (propositions à Adem)
1. Ajouter dans Effects les opérations dangereuses indépendantes de l'intention : delegatecall (operation=1 d'un Safe), changement d'implémentation ou de propriétaire (setOwner, enableModule, upgrade), délégation 7702. Elles sont critical même sans intention.
2. Ajouter dans Intent un « dépôt » horodaté et signé (EIP-712) : l'intention déclarée avant le site ; le Snap compare à la signature demandée. Un dépôt on-chain avec timelock n'est utile que pour un compte à contrat ; sur MetaMask classique, le dépôt reste local et signé.
3. Capter ce que l'interface affiche (titre, description, origine fournis par le site) pour mesurer l'écart « affiché contre exécuté » : le Snap voit l'origine et le payload, pas forcément le texte de l'interface ; à tester.
4. Banc : ajouter les cas « interface compromise » (affichage rassurant, effet différent) et « Bybit-like » (appel délégué).

## 5. Limites honnêtes
- Si l'interface ET le Snap sont trompés par la même source, il n'y a plus de miroir : l'indépendance du décodeur est la condition (code local, pas un service du site).
- Un appareil compromis qui modifie ce que le Snap affiche annule le miroir.
- Nouveauté faible à moyenne : les briques existent (simulation, alertes) ; l'assemblage « affiché / dit / fait » mesuré est l'apport.
