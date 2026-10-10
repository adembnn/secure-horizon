# Boucle jurés v3 : tour 1, synthèse et version 3.1 (Claude-Titouan, 11/10/2026)

## 1. Notes du tour 1 (jugements de jurés simulés, pas des mesures)
| Juré | Détection /30 | Réponse /20 | Faisabilité /20 | Conformité /15 | Pitch /15 | Total |
|---|---|---|---|---|---|---|
| Team1 Avalanche | 17 | 12 | 10 | 10 | 9 | 58 |
| Assureur et régulateur | 18 | 12 | 11 | 8 | 10 | 59 |
| KPMG | 19 | 12 | 11 | 8 | 10 | 60 |
| Utopia (IA) | 17 | 13 | 11 | 10 | 9 | 60 |
| AWS | 18 | 12 | 11 | 10 | 10 | 61 |
| Kryptosphère | 18 | 12 | 11 | 10 | 10 | 61 |
Moyenne : environ 60/100. Faisabilité 10-11/20 partout : rien n'est mesuré, donc la note est plafonnée tant qu'aucun test réel n'a tourné. C'est le constat le plus important du tour.

## 2. Ce que les six jurés disent tous (convergences)
1. Le comparateur en code (le modèle ne peut qu'aggraver) est la bonne architecture : à garder.
2. ÉVALUATION CIRCULAIRE (KPMG, Utopia, Kryptosphère, AWS) : cas, étiquettes et intentions mensongères produits par nos agents ; « FN = 0 sur la démo » est un réglage, pas une mesure. Remède : jeu gelé externe, autre famille de modèles, famille d'attaque tenue hors DEV, cas tirés d'incidents publics rejoués, scripts de coaching tirés de témoignages réels.
3. FRAUDE « CONFORME » (KPMG, Kryptosphère, assureur) : faux conseiller, pig butchering, la victime envoie réellement. L'intention ne détecte rien. À mesurer à part avec les seuls signaux indépendants (adresse neuve, montant, délai), annoncer le chiffre même mauvais, ne pas vendre « grand public protégé ».
4. LE SNAP EST LE CHEMIN CRITIQUE ET NON PROUVÉ (AWS, Avalanche, Utopia, Kryptosphère) : test de 2 h, plan B (page compagnon), écrire que la démo tourne sur Flask, supprimer « bloque » et « barrière ».
5. JOURNAL NON DÉFENDABLE (KPMG, AWS, assureur) : chaînage de hash, horodatage externe, version des règles et du modèle, rejeu indépendant de 50 verdicts, minimisation du texte libre.
6. DONNÉES ET DÉPÔT D'INTENTION (assureur, AWS) : dépôt local, jamais transmis ; l'API ne reçoit que des catégories fermées et rend un verdict, jamais l'intention en clair ; texte libre et message collé seulement avec consentement ; Cloudflare = transfert hors UE à documenter ; aucune déclaration d'intention ne doit pouvoir être retournée contre la victime.
7. API « AVANT RETRAIT » INEXISTANTE (AWS, KPMG) : verdict signé lié au hash de la demande, expiration 60 s, clé par client, politique de panne (fail-closed pour la plateforme, fail-open avec bandeau pour le Snap), timeouts durs, verdict « indéterminé » traité comme warn au moins, jamais « ok » en panne.
8. PÉRIMÈTRE TROP LARGE POUR 36 h (AWS, KPMG) : un seul scénario complet ; le reste en feuille de route.
9. AVALANCHE (Team1) : Fuji est un décor, trafic légitime quasi nul ; rejouer en lecture seule des transactions réelles de la C-Chain mainnet (blocs épinglés) ; dire « testé sur Fuji, portable EVM » ; nommer un wallet cible (Core ou Rabby) et vérifier si Core supporte les Snaps.
10. IA PRESQUE DÉCORATIVE (Utopia) : ajouter un bras « sans modèle » (boutons seuls) ; garder Clef/Jev dans le pitch seulement si l'ablation gagne au moins 5 points ; calibration (ECE) sur 200 phrases étiquetées par 2 humains ; test d'injection (100 chaînes adverses, 0 baisse de risque, texte d'attaquant échappé à l'affichage).
11. Affirmations périmées ou risquées à retirer : « la simulation de solde ne voit pas les permits » (Rabby et Blockaid décodent déjà Permit/Permit2 : notre seule différence est intention + miroir affiché/exécuté) ; « premier » ; « FN = 0 » ; alerte d'un proche par défaut (option avec consentement) ; « gel » (on prépare des pièces utiles à un dépôt de plainte) ; MiCA/DORA pour un Snap non custodial ; références NIST/ATT&CK citées de mémoire ; sosie 4+4 caractères fixe (passer à une distance continue) ; classifieur « explicable » (l'explicabilité vient des règles).
12. Perte évitée (assureur) : exprimer aussi les résultats en part de pertes simulées évitées, avec le dénominateur incluant la fraude conforme.

## 3. Version 3.1 proposée (ce qui change)
- Positionnement : « comparateur dit / fait / affiché, consultatif, mesuré honnêtement » ; pas de blocage, pas « premier », pas « protège le grand public ».
- Scénario unique de bout en bout : drainer neuf (permit piège) présenté comme faux site, avec un faux support qui dicte la case ; les autres cas sont des lignes du banc, pas des démos.
- Deux canaux assumés : Snap (vitrine, Flask) et API avant retrait (le seul endroit où l'on peut vraiment retenir, au gré du client).
- Banc : 5 bras (sans intention ; intention honnête ; intention mensongère ; sans modèle ; référence « simulation seule »), jeu gelé externe haché, famille tenue hors DEV, ≥1 000 transactions légitimes C-Chain en lecture seule, cas APP à part, bornes de Wilson, injection, ECE, panne injectée, coût par vérification.
- Journal : hash chaîné, horodatage externe, rejeu de 50 lignes par un tiers.
- Données : dépôt local, API = catégories fermées + verdict signé, texte libre sur consentement.
- Cibles reformulées en hypothèses à mesurer, avec n et bornes.

## 4. Test qui lèverait le plus de points (priorité cette nuit)
1. Snap minimal sur Flask + Fuji (modale sur transaction ET signature, appel vers API locale, snap_dialog).
2. Premier rejeu réel : 500 transactions légitimes de la C-Chain en lecture seule + 40 attaques d'un autre modèle dont une famille tenue hors DEV, avec bras « simulation seule » en référence.
3. Latence et coût mesurés (fork à froid / à chaud, Workers AI).
Sans ces trois mesures, Faisabilité reste à 10-11/20 quel que soit le texte.
