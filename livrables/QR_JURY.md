# Les questions les plus dures, réponses vraies en deux ou trois phrases

Produit : une couche indépendante devant le portefeuille. Étage un : la personne écrit ce qu'elle veut faire, du code compare avec l'effet de la demande, alerte sinon. Étage deux : un plancher de règles qui ne dépend pas de la phrase. Chiffres : `livrables/CHIFFRES.md` seulement. Sources des positions : `research/demo_reelle/RECHERCHE_metamask_couverture.md` (MM), `RECHERCHE_concurrents_particuliers.md` (CP), `RECHERCHE_these_moindre_privilege.md` (MP), `RECHERCHE_chiffres_douleur.md` (CD), `research/titouan/Y_typologie_demos.md` (Y), `X_scenarios_hors_metamask.md` (X), `research/titouan/T_banc_e2e/security_review2/REVUE.md` (REVUE).
Une mention « à mesurer » est voulue : si un chiffre arrive avant 12h00, le reprendre tel quel, bon ou mauvais.

## Les questions du pitch V3 (à savoir par coeur)

**1. C'est un MetaMask avec des fonctions en plus ?**
Non. Hold up ne remplace pas le portefeuille, ne tient aucune clé et ne signe rien. C'est une couche qui se place devant celui que la personne a déjà. Elle ajoute deux choses que, d'après le code public de MetaMask, un portefeuille n'a pas aujourd'hui : ce que la personne voulait faire, écrit avant de voir la demande, et un plancher de règles qui ne dépend pas de cette phrase. Les portefeuilles font déjà une partie du travail (listes, simulations, Added Protection) et Hold up ne les remplace pas. Nous ne l'avons jamais essayée avec un vrai MetaMask.

**2. Et si tout est compromis demain ?**
C'est le point de départ : tout service peut l'être, y compris le nôtre. D'où le principe du moindre privilège : Hold up ne tient ni clé ni fonds, donc compromis il ne peut rien signer ; le pire est qu'il se taise, affiche un faux écran ou modifie la demande avant le portefeuille (il réécrit déjà un droit trop large), et le portefeuille affiche alors la demande telle qu'elle lui arrive et demande toujours son geste. Mais ne pas dire « sécurisé » : notre revue interne a trouvé des contournements, dont un critique (une page peut remplacer des fonctions natives du navigateur et laisser passer une demande sans fenêtre Hold up). Les corrections sont en cours, non vérifiées dans un vrai navigateur. Le build autonome n'a aucun réseau, donc aucun service distant à compromettre ; avec le relais Clef, il y en a un.

**3. Pourquoi une extension et pas un portefeuille ?**
Parce que la personne garde son portefeuille, ses clés et ses habitudes, et que nous n'avons rien à garder : pas de garde de fonds, pas de clés à protéger. C'est aussi le prix : une extension ne voit que ce qui passe par `window.ethereum`, ni un Ledger branché en direct, ni le mobile, et une page hostile peut essayer de la contourner (REVUE S1, S6). Un portefeuille ferait mieux ; si MetaMask intègre l'idée, tant mieux.

**4. Où va la phrase ?**
Dans le build autonome (`dist\hold-up-standalone.zip`) : nulle part. Il n'a aucun accès réseau (aucune permission d'hôte, `connect-src 'none'`) et lit la phrase par mots-clés dans le navigateur. Si on branche le relais Clef, la phrase part vers un modèle hébergé, via un relais local qui garde la clé. Minimisation et durée de conservation chez le fournisseur ne sont pas rédigées. Les montants, jetons et adresses sont lus localement par du code. À traiter avant tout service hébergé.

**5. Les fausses alertes ?**
Trop hautes, et nous le disons en premier. Banc synthétique en conditions produit : 13,9 % des honnêtes reçoivent un écran rouge, 54,2 % au moins un avertissement. Trafic réel Avalanche : 19 rouges sur 6 325 (0,30 %), mais 76,84 % d'avertissements, surtout parce que le moteur ne sait pas lire 74,5 % des appels ; sur les 19 rouges relus, 2 sont de fausses alertes confirmées, 2 de vraies, 15 indéterminées. Sur Ethereum, 13 des 20 rouges relus sont de fausses alertes. Sur la grille phrase contre demande (contrôle scellé), le code seul fait 7,7 % de fausses alertes, dues à une tournure mal lue (« donner à X le droit ») ; avec un modèle qui classe, 1,3 %. Le mode honnête de Neve montre un cas qui ne sonne pas.

## Les deux réponses préparées

**6. Et si MetaMask élargit son questionnaire ?**
Il a déjà l'écran, les questions et un délai de 10 secondes : un « Security check » de trois questions fermées, ouvert seulement quand Blockaid a classé un envoi malveillant ou que le site est sur une liste (MM, lu dans le code public). Élargir le déclencheur est un changement de réglage, nous le disons. Aujourd'hui, ses réponses sont des choix fermés qui ne sont jamais rapprochés du montant, du destinataire ou de l'appel. Notre apport tient à trois choses vérifiables aujourd'hui, pas à une barrière durable : une phrase libre, écrite avant de voir la demande, sur toute demande qui déplace de la valeur ou accorde un droit, et une comparaison avec l'effet réel. Si MetaMask le fait, la personne est mieux protégée, et c'est tant mieux ; notre intégration passerait alors par eux.

**7. Qui est responsable si le modèle se trompe ?**
Le modèle ne lit que la phrase de la personne, et seulement si le relais Clef est branché. Les montants, jetons et adresses sont extraits par du code, et le comparateur est du code. Mesure de la grille (contrôle scellé, même auteur que les règles) : quand Clef juge seul, 64,4 % des écarts attrapés et 64 invérifiables pris pour « correspond » ; quand il classe et que le code compare, 86,6 % attrapés, 4 ratés sur 461. Deux erreurs possibles : une fausse alerte coûte un clic ; une alerte manquée laisse la personne dans la situation où elle serait sans l'outil. La personne garde le dernier geste, Annuler est visible, et quand le modèle hésite la réponse est « je n'ai pas pu vérifier », jamais « correspond » par défaut. La responsabilité du contenu des règles et du choix du modèle est celle de l'éditeur ; celle des réglages et du déploiement revient à la plateforme qui nous intègre ; la décision de signer reste à la personne. Une règle tenue : une phrase ne baisse jamais un plancher objectif. Mesuré : 0 violation sur 1 079 paires (bras code) et aucun cas sous le serveur seul sur 10 437 cas du pipeline strict ; non vérifié dans l'extension elle-même, et la revue note qu'un modèle abusé peut alléger certains faits (REVUE S14).

## Les autres

**8. Vos mesures sont-elles indépendantes ?**
Non. Les cas et les règles sont écrits par nous. Le 228 sur 228 est un test de couverture. Le contrôle scellé de la grille (1 079 paires, sha256 publié avant la mesure, une seule mesure par bras) est plus honnête que le réglage (99,1 % contre 86,6 %), mais même auteur pour les phrases et pour les règles, un seul modèle (Clef-flash), un seul contexte par famille. Le jeu aveugle de 250 cas, d'un autre auteur, hash publié, reste à passer, une seule fois.

**9. L'intention écrite apporte-t-elle vraiment quelque chose ?**
Sur les arnaques vertes sans intention (298), la phrase libre n'en arrête aucune : les textes se réduisent à « virement ». Il manque un jeu d'arnaques construit pour la thèse. Ce que la grille mesure, c'est la comparaison phrase contre demande, pas l'apport sur de vraies arnaques. Là où la phrase contient un montant, l'écart est mesurable.

**10. Avez-vous essayé avec un vrai MetaMask ?**
Non, pas de résultat consigné. Notre démo tourne sur une chaîne locale, que l'API d'alertes de MetaMask ne sert pas : son silence là ne prouve rien. Notre affirmation sur l'illimité vient de son code public, lu le 11 oct. Un essai sur Sepolia est à faire.

**11. MetaMask permet déjà de modifier le plafond.**
Oui, et Talisman plafonne au solde, Matcha et LI.FI sont au montant fini par défaut (MP). Le principe n'est pas de nous. Ce que nous ajoutons est étroit : le montant de référence vient de la phrase que la personne vient d'écrire, sur tout site, y compris ceux qui demandent l'illimité. Que les gens gardent le plafond n'est pas mesuré.

**12. Pocket Universe, Rabby, Revoke ou Vitalik font déjà ça ?**
Vitalik a décrit le principe le 22 février 2026 (CP, relais de presse), IntentGuard compare des résultats attendus saisis après coup, des projets de hackathon le font pour des agents. Nous n'avons trouvé aucun outil grand public qui fasse écrire la phrase libre avant la demande puis la compare à l'effet (« non trouvé dans les docs lues »). Notre apport est l'assemblage et le geste, pas le principe.

**13. Et la fraude que la personne veut faire ?**
Hors périmètre. Si elle écrit « envoyer 5 000 USDC à cette adresse » sous la dictée d'un escroc, la demande correspond. La fraude à l'investissement pèse 7,2 Md$ de plaintes en 2025 (IC3), nous ne la traitons pas.

**14. Un escroc au téléphone dicte la phrase.**
Alors elle décrira la demande piégée sans écart, ou restera vague. Nous disons « je n'ai pas pu vérifier » pour le vague (sur la grille, 133 phrases vagues, hors sujet ou injection : jamais prises pour « correspond » par le code). Pour une phrase dictée et exacte, rien ne l'arrête : limite assumée. Le plancher de règles, lui, ne dépend pas de la phrase.

**15. Un contrat qui change à l'exécution ?**
MetaMask traite mieux ce cas avec Added Protection (revert si l'effet diffère de l'aperçu, MM). Nous ne le revendiquons pas.

**16. Une signature Permit peut-elle être réécrite ? Hold up modifie-t-il ma transaction ?**
Une signature, non : le site construit le message, un changement invaliderait la signature. Nous alertons et le disons. Pour une transaction (approve, increaseAllowance), Hold up peut remplacer lui-même le droit trop large par le montant écrit avant le portefeuille, seulement si la phrase contient une seule somme lisible, que le jeton est connu et que rien d'autre ne sort (ligne affichée : « Droit limité à 50 USDC »). Prouvé en Node, pas dans un vrai Chrome. La revue relève qu'un faux jeton qui annonce le symbole USDC peut rassurer à tort (REVUE S15) ; le montant, lui, ne monte jamais.

**17. Pourquoi un modèle ?**
Pour comprendre un français familier et des fautes, là où les mots-clés échouent. Mesure de la grille, contrôle scellé : mêmes 86,6 % attrapés avec ou sans modèle, mais 1,3 % de fausses alertes contre 7,7 % et 97,2 % d'invérifiables reconnus contre 91,6 %. Les mots-clés ne généralisent pas : 33,6 % avant correction sur le réglage, 99,1 % après, 86,6 % sur le contrôle ; les ratés viennent de verbes jamais listés (« lend », « stake », « acquérir »). Clef-flash lit aussi le genre de l'intention (67,5 % contre 48,0 % sur le jeu de réglage, mesuré par Adem). Le modèle est absent du build autonome.

**18. Un Ledger branché directement ?**
Une extension ne voit que ce qui passe par `window.ethereum`. Si la page parle au matériel en direct, nous ne voyons rien. Les analyses publiques du cas Bybit ne disent pas ce qu'affichait l'écran du matériel : nous ne l'affirmons pas.

**19. Pourquoi une chaîne de blocs ?**
Le moteur n'en a pas besoin. Le journal de la version autonome est une liste locale de 500 lignes, non chaînée. Celui de la version serveur est chaîné par hachage : une ligne modifiée ou retirée au milieu se détecte. L'ancrage sert à détecter une réécriture complète ; il n'est pas déployé sur Fuji. La revue note aussi qu'une page qui boucle sur demande et annulation peut repousser d'anciennes lignes hors du journal (REVUE S19).

**20. La douleur est-elle réelle ?**
En 2025, 83,85 M$ perdus par 106 106 victimes en signant sur un site de phishing, perte moyenne 790 $ (ScamSniffer, éditeur, EVM, borne basse). Parmi les 11 vols de plus d'un million, un Permit ou Permit2 pèse 38 % du montant. Aucune source ne mesure combien de victimes avaient une alerte et ont signé quand même.

**21. Votre modèle économique ?**
Gratuit pour les personnes, des partenaires ensuite. Pas de prix, pas de client, pas de taille de marché sourcée. Harpie et Wallet Guard ont fermé en mars 2025 : le modèle reste une question ouverte.
