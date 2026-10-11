# Deck Hold up : 9 slides

Produit figé : la personne écrit ce qu'elle veut faire, Hold up dit si la demande correspond, alerte sinon, et garde les signaux du portefeuille. Chiffres : `livrables/CHIFFRES.md` seulement. Le fichier `holdup.pptx` est généré par `livrables/deck/build_deck.js` (`NODE_PATH=<dossier node_modules avec pptxgenjs> node livrables/deck/build_deck.js`). Les notes orateur du pptx sont celles de ce fichier. Les numéros de slide sont ceux cités dans `PITCH_5MIN.md` et `PITCH_3MIN.md`.

1. **Camille veut échanger 50 USDC** (problème). Site fictif Neve, bouton « Autoriser ». À droite : 83,85 M$ perdus par 106 106 adresses en 2025 en signant sur un site de phishing (ScamSniffer, éditeur, EVM, borne basse).
2. **Tu écris. Hold up compare** (produit). Trois cases : j'écris, la demande arrive, Hold up. Trois issues : correspond (le portefeuille s'ouvre seul après une seconde), ne correspond pas (alerte, Annuler), pas pu vérifier. Mention : on garde les signaux du portefeuille.
3. **Le signataire aveugle (cas Bybit)** (second exemple). « J'ai écrit : virer 20 USDC à Paul » contre « appel délégué vers un contrat inconnu ». Légende : scène synthétique, adresses factices, décodage et non attaque.
4. **« Me connecter » qui signe un droit.** MetaMask affiche une demande de plafond ; Hold up : une connexion ne devrait pas donner un droit de dépense. Pied : démo locale, aucun enseignement sur MetaMask en production.
5. **Ce que nous mesurons** (détection). Tableau de quatre lignes : 228 sur 228 (couverture), 71,3 % et 13,9 % (conditions produit), 0 contre 34 (phrase libre contre intention structurée), jeu aveugle et grille à mesurer.
6. **Après l'alerte, la personne décide** (réponse). Transaction : la ligne dit comment ramener le plafond au montant écrit. Signature : elle ne peut pas être limitée. Journal chaîné.
7. **Une décision, une trace, un rejeu** (conformité). DORA, MiCA et LCB-FT, AI Act, auditeur. Bandeau d'identifiants vérifiés : DE.AE-02, DE.AE-07, DE.CM-09, RS.MI-01, T1657, T1566, T1204.
8. **Ce qu'on ne couvre pas.** Fraude consentie, intention vague, contrat qui change à l'exécution, Ledger direct.
9. **Deux ingénieurs, des limites écrites.** Gratuit pour les personnes, partenaires ensuite, sans prix. Liste de ce qui n'est pas fait.

Contrôles avant d'ouvrir le pptx : aucune slide ne contient « EN ATTENTE » ni un chiffre absent de `CHIFFRES.md`. Le rendu image n'a pas été vérifié (aucun LibreOffice sur la machine) : ouvrir dans PowerPoint avant 12h00.
