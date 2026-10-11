# Les questions les plus dures, réponses vraies en deux ou trois phrases

Base : `research/titouan/PITCH_V7_TITOUAN.md` (fusion avec le pitch d'Adem). Les réponses d'Adem (`livrables/pitch_v7/QR.md`) restent valables ; en cas d'écart de chiffre, `livrables/CHIFFRES.md` tranche. Produit : une extension devant le portefeuille. Étage un : la personne écrit ce qu'elle veut faire, du code compare avec l'effet de la demande. Étage deux : des règles de base qui ne dépendent pas de la phrase. Après l'alerte : révoquer en un clic, fiche d'incident, cahier rejouable. Chiffres : `livrables/CHIFFRES.md` seulement. Sources : `research/demo_reelle/RECHERCHE_metamask_couverture.md` (MM), `RECHERCHE_concurrents_particuliers.md` (CP), `RECHERCHE_these_moindre_privilege.md` (MP), `research/titouan/T_banc_e2e/blind_decalage/run/RESULTAT.md` (AVEUGLE), `webdemo/RAPPORT_REVOQUER.md` (REVOQUER), `extension/RAPPORT_SECURITE_CORRECTIFS.md` (CORRECTIFS), `security_review2/REVUE.md` (REVUE).

## La preuve (à savoir par coeur)

**1. Votre preuve est-elle indépendante ?**
Plus qu'avant, pas complètement. Le jeu aveugle (150 arnaques, 100 jumeaux honnêtes) a été écrit sans lire nos règles, scellé par une empreinte publiée, ouvert une seule fois, moteur figé (commit 74203da, avec trois fichiers modifiés non commités, notés au journal d'ouverture). Mais l'auteur est une IA de la même famille que celle qui nous a aidés, et les cas sont synthétiques. Il manque un jeu écrit par des personnes.

**2. Quels étaient vos critères, et sont-ils atteints ?**
Publiés avant l'ouverture : au moins 80 % d'arnaques signalées, au plus 10 % de rouges sur les honnêtes. Le premier est atteint : 87,3 % [81,1 ; 91,7]. Le second non : 15,0 % [9,3 ; 23,3]. Rien n'a été réglé après l'ouverture (AVEUGLE).

**3. D'où viennent les 15 % de faux rouges ?**
11 des 15 viennent d'une seule famille : un achat de NFT honnête à prix quasi nul, que nos règles lisent comme une vente bradée. Nous ne retirons pas cette famille du calcul pour afficher un meilleur taux. Avec les avertissements, 30 % des honnêtes reçoivent une alerte : c'est notre limite principale.

**4. Où ratez-vous ?**
Jeton différent de celui écrit : 63,2 % signalés. Chaîne ou domaine différent : 66,7 %, et 12 cas sur 18 restent invérifiables. Connexion qui signe un droit : 73,7 %. Les arnaques signalées seulement en avertissement (17) sont surtout des droits illimités vers un routeur.

**5. La phrase écrite sert-elle vraiment ?**
Sur le jeu aveugle, oui : le plancher sans phrase signale 64,7 %, le code avec la phrase 87,3 %, soit 34 arnaques de plus sur 150, sans aucun cas sous le plancher. Les faux rouges restent à 15 % dans les deux cas : la phrase ajoute des détections, pas de fausses alertes rouges.

**6. Et votre 1,3 % de fausses alertes ?**
Il vient de notre grille de contrôle de 1 079 paires, écrite par nous : nous ne le citons plus comme garantie. Sur le jeu aveugle, le modèle qui classe donne 16,0 % de faux rouges.

## Le produit

**7. C'est un MetaMask avec des fonctions en plus ?**
Non. Hold up ne tient aucune clé et ne signe rien. Il ajoute ce que la personne voulait faire, écrit avant de voir la demande, et des règles qui ne dépendent pas de cette phrase. Les portefeuilles font déjà une partie du travail (listes, simulations) et Hold up ne les remplace pas. Nous ne l'avons jamais essayé avec un vrai MetaMask.

**8. « Ça correspond », c'est un feu vert ?**
Non. L'écran dit : « Ça correspond, d'après ce que Hold up sait lire. Ce n'est pas une garantie. » Le portefeuille s'ouvre et demande toujours son geste.

**9. Que se passe-t-il après l'alerte ?**
La personne annule ou continue. Si elle a continué par erreur, un bouton « Révoquer ce droit » prépare la demande de retrait ; le portefeuille la signe, jamais Hold up. Une fiche d'incident dit ce qui a été demandé, montré et décidé, et chaque ligne citée se rejoue. Dans la démo web, le portefeuille est simulé ; 25 tests du module et 135 vérifications de la démo (REVOQUER). Le branchement dans l'extension reste à faire.

**10. Tout se révoque en un clic ?**
Non. Un clic seulement si une transaction suffit : approve, increaseAllowance, setApprovalForAll, Permit2.approve. Un Permit EIP-2612 ou DAI, ou un Permit2 signé, demande plusieurs étapes ou l'échéance : pas de bouton, nous l'expliquons.

**11. Où va la phrase ?**
Dans le build livré (décision D-015), la phrase seule part vers le modèle Clef, par un relais sur la machine qui garde la clé ; jamais les montants, les jetons ni les adresses, lus par du code sur place. Base légale et durée de conservation chez le fournisseur ne sont pas rédigées : à faire avant tout service hébergé. Une option sans réseau lit la phrase par mots-clés et comprend moins de tournures.

**12. Qui est responsable si le modèle se trompe ?**
Le modèle ne décide ni du montant ni de l'adresse : du code les lit et compare. Il ne peut pas baisser une alerte du code. Une erreur de sens peut manquer une alerte de comparaison ; une fausse alerte coûte un clic. La personne garde le dernier geste, le cahier dit ce qui lui a été montré. Pour l'AI Act : une décision, une ligne, l'humain tranche, sans qualification juridique établie. Les obligations des plateformes régulées restent à la plateforme qui déploie : nous ne revendiquons aucune conformité.

**13. À quoi sert le modèle, alors ?**
À comprendre un français familier. Sur le jeu aveugle, il n'apporte pas de gain net mesurable (88,7 % contre 87,3 %, 16 % contre 15 % de faux rouges). Il est optionnel ; ce qui compte, c'est la phrase et le code qui compare.

**14. Le cahier peut-il être réécrit ?**
Il est chaîné par hachage, aussi dans le build autonome : une ligne changée, retirée ou déplacée au milieu se voit (7 tests). La suppression des dernières lignes ou une réécriture complète ne se voit pas sans ancrage externe ; l'ancrage sur Fuji n'est pas déployé. Le cahier ne garde ni la phrase ni une adresse. L'audit a relevé deux inexactitudes : le passage automatique de la deuxième demande est noté comme une confirmation humaine, et la limitation à 50 USDC n'y figure pas. À corriger avant de parler d'auditeur.

**15. C'est sécurisé ?**
Nous ne le disons pas. Une revue interne a trouvé des contournements, dont un critique (une page qui remplace des fonctions natives). Les correctifs sont écrits et testés en Node (CORRECTIFS), pas vérifiés dans un vrai Chrome. Compromis, Hold up ne peut rien signer : le pire est qu'il se taise ou affiche un faux écran.

## Les autres

**16. Avez-vous essayé avec un vrai MetaMask ?**
Non. Le protocole et la grille de résultats existent, vides. La démo tourne avec un portefeuille simulé sur une copie locale d'Avalanche, que l'API d'alertes de MetaMask ne sert pas : son silence là ne prouve rien. Notre phrase sur l'illimité vient de son code public. Fuji : déploiement préparé et répété, non exécuté (D-016).

**17. Et si MetaMask élargit son questionnaire ?**
Il a déjà l'écran et un « Security check » de questions fermées, ouvert quand un envoi est classé malveillant (MM). Élargir le déclencheur est un réglage. Notre avance tient à une phrase libre, sur toute demande, comparée à l'effet. Ce n'est pas une barrière durable ; si MetaMask le fait, tant mieux.

**18. Un escroc au téléphone dicte la phrase.**
Si la phrase est exacte, la comparaison ne voit rien. Les règles de base voient encore un droit illimité vers une adresse inconnue. Un envoi consenti vers une adresse neuve n'est pas couvert.

**19. Et la fraude que la personne veut faire ?**
Hors périmètre. La fraude à l'investissement pèse 7,2 Md$ de plaintes en 2025 (IC3) : nous ne la traitons pas.

**20. Et sur Avalanche ?**
Sur 6 325 transactions réelles : 0,30 % de rouges, mais 76,84 % d'avertissements, surtout des appels que le moteur ne sait pas lire. Démonstration sur une copie locale d'Avalanche ; déploiement Fuji préparé et répété, non exécuté.

**21. Un Ledger branché directement ?**
Une extension ne voit que ce qui passe par le navigateur. Si la page parle au matériel en direct, nous ne voyons rien.

**22. Pour une banque ou un exchange ?**
Le même moteur pourrait répondre avant un retrait, via une API de verdict sans état. Non construit.

**23. MetaMask permet déjà de modifier le plafond.**
Oui, et d'autres outils sont au montant fini par défaut (MP). Notre ajout est étroit : le montant de référence vient de la phrase que la personne vient d'écrire, sur tout site.

**24. Quelqu'un fait déjà ça ?**
Le principe « dire d'abord, valider après » a été décrit publiquement en février 2026 (CP). Nous n'avons trouvé aucun outil grand public qui fasse écrire la phrase libre avant la demande puis la compare à l'effet, dans les documents lus. Notre apport est l'assemblage, pas le principe.

**25. Votre modèle économique ? Qui paie ?**
Pas le particulier : c'est gratuit pour lui. Paient ceux qui portent la perte : exchanges et fintechs, avec une API « verdict avant retrait » (premier revenu visé) ; portefeuilles et plateformes, avec une licence SDK (premier pilote, peut-être non payé) ; plus tard, plateformes d'agents, avec des mandats écrits. Nous cherchons des pilotes B2B maintenant. Aucun client, aucun prix de marché comparable : nos prix sont des hypothèses (`research/titouan/BM2/BM_MODELE.md`). Repère : MetaMask vend une couverture à 9,99 $ par mois (B15).

**25 bis. Pourquoi ne pas finir comme Harpie ou Wallet Guard ?**
Harpie était payée après le vol. Nous visons un service continu, avant la signature, vendu à des plateformes. L'issue probable du secteur est l'intégration ou le rachat : nous le savons.

**26. Latence ?**
Verdict local en médiane sous 50 millisecondes, sans le modèle.

## La scène d'Adem (deux fenêtres)

**27. Dans votre scène, les 50 USDC partent chez le pirate.**
Oui. La perte est bornée, pas évitée : Hold up ne contrôle pas encore à qui le droit est donné. Nous ne disons jamais « le pirate ne prend rien ». Le cas LI.FI montre le mécanisme dans la vraie vie : les droits limités n'ont rien perdu, selon le rapport de LI.FI.

**28. « Cent, zéro », c'est dans le navigateur ?**
Non. C'est un script qui envoie sur la chaîne locale les mêmes demandes que la page, sur un compte de test neuf, et lit les soldes. La légende le dit à l'écran.

**29. Votre vérification couvre-t-elle tout ?**
Non. Sur 58 paires d'essai, 18 sont contrôlées, 7 en partie, 20 non, 13 non distinguées. Contrôlé : le montant d'un droit, un paiement (montant, jeton, destinataire), un second droit glissé dans un lot, une prise de contrôle du compte. Pas encore : le sens d'un échange, la contrepartie, le minimum reçu, la durée d'un droit, la deuxième demande d'une même phrase. Dans la scène, « ça correspond » porte sur le droit de 50 USDC, pas sur l'échange.

**30. 87 %, c'est en rouge ?**
Non, rouge ou avertissement. En rouge seul : 76,0 %. Sur la famille de la scène (droit illimité sur un échange) : 18 sur 19 signalés, 5 sur 19 en rouge, 6 sur 19 sans la phrase ; 0 faux rouge sur 13 honnêtes.

**31. Aerodrome, le NIST, l'IA d'Anthropic ?**
Retirés du texte dit, gardés en réserve dans `livrables/pitch_v7/QR.md` avec leurs réserves : Aerodrome (81 minutes, mesure de Blockaid sur lui-même), NIST SP 800-207 (posture d'entreprise, pas les portefeuilles, référence absente du dépôt), essai d'Anthropic (207 contrats sur 405, simulation, aucun vol réel attribué à une IA).
