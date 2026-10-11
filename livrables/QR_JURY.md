# Les questions les plus dures, réponses vraies en deux ou trois phrases

Produit : la personne écrit ce qu'elle veut faire, Hold up dit si la demande correspond, alerte sinon, et garde les signaux que le portefeuille donne déjà. Chiffres : `livrables/CHIFFRES.md` seulement. Sources des positions : `research/demo_reelle/RECHERCHE_metamask_couverture.md` (MM), `RECHERCHE_concurrents_particuliers.md` (CP), `RECHERCHE_these_moindre_privilege.md` (MP), `RECHERCHE_chiffres_douleur.md` (CD), `research/titouan/Y_typologie_demos.md` (Y), `X_scenarios_hors_metamask.md` (X).
Une mention « à mesurer » est voulue : si un chiffre arrive avant 12h00, le reprendre tel quel, bon ou mauvais.

## Les deux réponses préparées

**1. Et si MetaMask élargit son questionnaire ?**
Il a déjà l'écran, les questions et un délai de 10 secondes : un « Security check » de trois questions fermées, ouvert seulement quand Blockaid a classé un envoi malveillant ou que le site est sur une liste (MM, lu dans le code public). Élargir le déclencheur est un changement de réglage, nous le disons. Aujourd'hui, ses réponses sont des choix fermés qui ne sont jamais rapprochés du montant, du destinataire ou de l'appel. Notre apport tient à trois choses vérifiables aujourd'hui, pas à une barrière durable : une phrase libre, écrite avant de voir la demande, sur toute demande qui déplace de la valeur ou accorde un droit, et une comparaison avec l'effet réel. Si MetaMask le fait, la personne est mieux protégée, et c'est tant mieux ; notre intégration passerait alors par eux.

**2. Qui est responsable si le modèle se trompe ?**
Le modèle ne lit que la phrase de la personne. Les montants, jetons et adresses sont extraits par du code, et le comparateur est du code. Deux erreurs possibles : une fausse alerte coûte un clic et du temps ; une alerte manquée laisse la personne dans la situation où elle serait sans l'outil, avec les signaux de son portefeuille en plus. La personne garde le dernier geste, Annuler est visible, et quand le modèle hésite la réponse est « je n'ai pas pu vérifier », jamais « correspond » par défaut. La responsabilité du contenu des règles et du choix du modèle est celle de l'éditeur ; celle des réglages et du déploiement revient à la plateforme qui nous intègre ; la décision de signer reste à la personne. La précision du modèle sur la comparaison n'est pas mesurée par nous (pas de clé), la grille de 1 500 paires est en cours. Une règle est à tenir : une phrase ne doit jamais abaisser un plancher objectif ; le garde-fou est en cours d'application côté pipeline, non vérifié.

## Les autres

**3. Vos fausses alertes ?**
Trop hautes : en conditions produit, 13,9 % des opérations honnêtes reçoivent un écran rouge, 54,2 % au moins un avertissement (banc synthétique). Le jeu aveugle n'est pas passé. Le Neve en mode honnête montre un cas qui ne sonne pas.

**4. Vos mesures sont-elles indépendantes ?**
Non. Les cas et les règles sont écrits par nous : 228 écarts sur 228 est un test de couverture. Le jeu aveugle de 250 cas, dont le hash est publié, reste à passer, une seule fois.

**5. L'intention écrite apporte-t-elle vraiment quelque chose ?**
Sur nos cas actuels, presque rien : sur 298 arnaques vertes sans intention, la phrase libre n'en arrête aucune, parce que les textes se réduisent à « virement ». Il manque un jeu construit pour la thèse, c'est la grille en cours. Là où la phrase contient un montant, l'écart est mesurable (cas de décalage).

**6. Avez-vous essayé avec un vrai MetaMask ?**
Non, pas de résultat consigné. Notre démo tourne sur une chaîne locale, que l'API d'alertes de MetaMask ne sert pas : son silence là ne prouve rien. Notre affirmation sur l'illimité vient de son code public, lu le 11 oct. Un essai sur Sepolia est à faire.

**7. MetaMask permet déjà de modifier le plafond.**
Oui, et Talisman plafonne au solde, Matcha et LI.FI sont au montant fini par défaut (MP). Le principe n'est pas de nous. Ce que nous ajoutons est étroit : le montant de référence vient de la phrase que la personne vient d'écrire, sur tout site, y compris ceux qui demandent l'illimité. Que les gens gardent le plafond n'est pas mesuré.

**8. Pocket Universe, Rabby, Revoke ou Vitalik font déjà ça ?**
Vitalik a décrit le principe le 22 février 2026 (CP, relais de presse), IntentGuard compare des résultats attendus saisis après coup, des projets de hackathon le font pour des agents. Nous n'avons trouvé aucun outil grand public qui fasse écrire la phrase libre avant la demande puis la compare à l'effet (« non trouvé dans les docs lues »). Notre apport est l'assemblage et le geste, pas le principe.

**9. Et la fraude que la personne veut faire ?**
Hors périmètre. Si elle écrit « envoyer 5 000 USDC à cette adresse » sous la dictée d'un escroc, la demande correspond. La fraude à l'investissement pèse 7,2 Md$ de plaintes en 2025 (IC3), nous ne la traitons pas.

**10. Un escroc au téléphone dicte la phrase.**
Alors elle décrira la demande piégée sans écart, ou restera vague. Nous disons « je n'ai pas pu vérifier » pour le vague. Pour une phrase dictée et exacte, rien ne l'arrête : limite assumée.

**11. Un contrat qui change à l'exécution ?**
MetaMask traite mieux ce cas avec Added Protection (revert si l'effet diffère de l'aperçu, MM). Nous ne le revendiquons pas.

**12. Une signature Permit peut-elle être réécrite ?**
Non : le site construit le message, un changement invaliderait la signature. Nous alertons et le disons. Pour une transaction, la ligne explique comment ramener le droit au montant écrit.

**13. La phrase part chez un tiers ?**
Elle est lue par un modèle (Clef) hébergé. Minimisation et durée de conservation ne sont pas rédigées. Le montant, le jeton et l'adresse sont lus localement par du code. À traiter avant tout service hébergé.

**14. Pourquoi un modèle ?**
Pour comprendre un français familier et des fautes, là où les mots-clés échouent : 72,8 % de type juste sur leurs propres tournures, 38,0 % sur des tournures jamais vues. Clef-flash fait mieux sur le jeu de réglage (67,5 % contre 48,0 %), mesuré par Adem avec sa clé, non rejoué chez nous.

**15. Un Ledger branché directement ?**
Une extension ne voit que ce qui passe par `window.ethereum`. Si la page parle au matériel en direct, nous ne voyons rien. Les analyses publiques du cas Bybit ne disent pas ce qu'affichait l'écran du matériel : nous ne l'affirmons pas.

**16. Pourquoi une chaîne de blocs ?**
Le moteur n'en a pas besoin. L'ancrage sert à détecter une réécriture complète du journal ; il n'est pas déployé sur Fuji. Sans lui, le journal détecte une ligne modifiée ou retirée au milieu.

**17. La douleur est-elle réelle ?**
En 2025, 106 106 adresses ont perdu 83,85 M$ en signant sur un site de phishing (ScamSniffer, éditeur, EVM, borne basse). C'est moins de 1 % de la fraude crypto totale (CD, calcul à périmètres différents). Aucune source ne mesure combien de victimes avaient une alerte et ont signé quand même.

**18. Votre modèle économique ?**
Gratuit pour les personnes, des partenaires ensuite. Pas de prix, pas de client, pas de taille de marché sourcée. Harpie et Wallet Guard ont fermé en mars 2025 : le modèle reste une question ouverte.
