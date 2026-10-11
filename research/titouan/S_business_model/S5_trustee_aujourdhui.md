# S5. Trustee aujourd'hui : périmètre réel, trajectoire, recouvrement avec Sentinelle

Date : 11 oct. 2026. Complète S4 (non refait). Aucun secret, aucune inscription, aucun téléchargement.
Étiquettes : **[P]** source primaire lue par moi (page fetchée) ; **[S]** presse, résumé de moteur de recherche ou page tierce ; **[V]** jugement. "Non trouvé" = cherché sans résultat.

## 0. Limite majeure de cette recherche (à lire d'abord)
Le site officiel **usetrustee.com** (pages /en, /faq) n'a PAS pu être lu directement : le domaine ne se résout pas depuis le réseau ESSEC (nslookup : "Non-existent domain") et l'outil de lecture et le navigateur intégré ont échoué (ENOTFOUND, navigation refusée). Tout ce que je dis du site vient donc de **résumés renvoyés par le moteur de recherche (donc [S])**, qui citent la page d'accueil et la FAQ. Les CGU, mentions légales et politique de confidentialité du site : **non trouvés**. À revérifier depuis un autre réseau avant toute diapositive.

## 1. Site officiel et pages
- Domaine : **usetrustee.com** (confirmé par la fiche App Store [P] et par Pépites [P]). Pages indexées : accueil (/en) et /faq [S]. Homonymes à ne pas confondre : trustee.io (portefeuille crypto "Trustee Plus", sans rapport [S]), Trustee/TrustPort (2012), Trusteer (IBM).
- Accueil [S] : produit B2B "Trustee permet aux marketplaces de réduire leur taux d'arnaque et de renforcer la fidélité"; détection automatisée "en temps réel avec analyse comportementale", alertes, système qui "s'améliore à chaque décision"; section "Impact prouvé" : **"plus de 100 arnaques déjà évitées"** (période, plateforme, méthode non précisées) ; onboarding en 3 étapes : POC sur les cas et l'historique du client, phase d'analyse, phase de mesure (délai de revue, priorisation) ; intégration "légère"; un volet B2C séparé.
- FAQ [S] : fonctionne sur "Facebook Marketplace, Vinted, Leboncoin, eBay et la plupart des marketplaces"; l'utilisateur colle le lien de l'annonce ; analyse en 4 étapes en moins de 5 s : contenu (prix, description, langage), recherche d'image inversée (photos volées), comparaison au prix du marché, vérification du profil vendeur. La FAQ pose "Trustee est-il gratuit ?" et "peut-il garantir 100 % ?" mais les réponses ne sont pas visibles dans ce que j'ai obtenu.
- Blog, page tarifs dédiée, CGU, confidentialité : non trouvés.
- Contact (App Store [P]) : contact@usetrustee.com ; politique de confidentialité de l'app hébergée sur Pastebin (signalé par la fiche App Store) [P].

## 2. Stores
- **App Store** [P] (https://apps.apple.com/fr/app/trustee-ia-anti-scam/id6757202153) : "Trustee - IA Anti Scam", éditeur "Trustee, Inc." (vendeur Usetrustee, France), catégorie Utilitaires, gratuit avec achat intégré **Trustee Premium 2,99 €**, 5 analyses gratuites. Version 1.0 le 30 janv. (2026), 1.1 le 23 fév., **1.1.1 le 12 avril (version actuelle ; année non écrite, 2026 par déduction [V])** : "amélioration UI, historique ajouté". **4 notes, toutes 5 étoiles** (voiture, billets de concert, partage de liens depuis d'autres apps). Description : annonces, conversations, images, pages web ; "avant de payer" ; exemples Vinted et Leboncoin ; score de fiabilité + explications + conseils, "la décision vous appartient". Confidentialité : "aucune donnée collectée" déclaré.
- **Chrome Web Store** : fiche **non trouvée** (recherches par nom, par domaine chromewebstore, sans résultat). Donc nom exact, utilisateurs, avis, date de mise à jour, permissions, "matches" : **non trouvés**. L'interview de janv. 2026 et Dealroom affirment l'existence de l'extension [P/S]; je ne peux pas la lire. Le sujet reste ouvert : elle peut être non publique, non indexée ou renommée [V].
- **Google Play** : non trouvé (Pépites : "l'app n'est pas encore sur les stores" dit un avis ancien [S]). **Firefox, Edge** : non trouvés.
- **Product Hunt** [P] : page forum "Trustee, Trust AI. Use Trustee", 0 avis, 3 abonnés (en [S] : "détecteur d'arnaques IA pour places de marché et plateformes sociales" : formulation non vérifiée dans la page lue).

## 3. Plateformes et signaux couverts : tableau de recouvrement

| Domaine | Trustee aujourd'hui | Preuve | Fiabilité |
|---|---|---|---|
| eBay | Oui (origine du hackathon ; cité dans la FAQ) | TSE [P], FAQ [S] | haute |
| Vinted, Leboncoin | Oui (App Store les nomme) | App Store [P] | haute |
| Facebook Marketplace | Oui | FAQ [S] | moyenne |
| Airbnb, Booking | Annoncé par l'équipe (agrégateur de recherche) ; non confirmé sur page officielle | [S] | basse |
| Amazon, Etsy | Non trouvé (peut-être inclus dans "la plupart des marketplaces") | | |
| Messageries (WhatsApp, Telegram), SMS | Non trouvé ; analyse de "conversations" (messages collés ou de la plateforme) | Pépites [P] | moyenne pour "conversations", rien sur ces apps |
| E-mails | Dealroom [S] dit "messages et e-mails" ; Pépites et App Store ne le disent pas | | basse |
| Réseaux sociaux | Pépites : non mentionné ; Product Hunt [S] "plateformes sociales" | | basse |
| Sites de rencontres, banques/hameçonnage | Non trouvé. "Pages web, URL suspectes, pages frauduleuses" génériques | App Store [P] | |
| Voyages, immobilier | Airbnb/Booking seulement (voir plus haut) ; location immobilière non trouvé | | |
| **Crypto, portefeuilles, transactions on-chain, signatures, dApps** | **Non trouvé.** Aucune mention dans Pépites [P], App Store [P], page projet 2025 [P], TSE [P], FAQ [S]. Pépites écrit que d'autres solutions sont "historiquement positionnées sur le paiement ou la fintech" et que Trustee se place sur les échanges entre particuliers [P] | | haute pour l'absence dans ces sources |
| Paiements | Aucune fonction de paiement ; le produit sert "avant de payer" | App Store [P] | haute |

Signaux : texte d'annonce, prix vs marché, **recherche d'image inversée**, profil vendeur, conversations, URL et pages web [P/S]. Pas de lecture de transaction ni de données signées.

## 4. Fonctionnement technique et mesures
- Déclaré : "plusieurs briques d'IA complémentaires organisées en agents spécialisés" dont les signaux sont combinés ; explicabilité = pilier ("expliquer pourquoi une situation est risquée") [P Pépites]. Mistral AI, React, Node, AWS, NVIDIA en 2025 [P page projet]. RAG : mentionné en 2025 (TSE/SCAMLENS) ; données du RAG non trouvées. Sortie : score de fiabilité + explications + conseils ; aucun blocage.
- Précision : **aucune mesure publiée** (ni faux positifs, ni rappel, ni jeu de test). Seul chiffre : "100+ arnaques évitées" [S, non défini]. Avis App Store (4 notes) et Pépites (10 avis, 5/5, 36 votes) = [S] anecdotiques.

## 5. Modèle économique, traction, financement
- B2C : freemium 5 requêtes puis 2,99 €/mois [P Pépites ; App Store P]. B2B : "copilote" pour équipes Trust & Safety, POC puis abonnement au volume ; prix non communiqués [P].
- Clients nommés : **non trouvé**. Partenariats : aucun annoncé ; objectifs à un an : communauté, clients C2C, partenariats publics/institutionnels [P].
- Levée, subvention (Bpifrance, French Tech Tremplin), incubateur officiel : **non trouvés** pour USETRUSTEE. Un post (Mohand Boughanem, probablement proche d'Anaïs, non confirmé) évoque une incubation à ESSEC Entrepreneurship & Innovation [S, non lu : LinkedIn bloqué]. Station F, Maddyness, Frenchweb : non trouvé.
- Presse : Les Pépites Tech, 5e du top 10 de janv. 2026 et en tête du classement 12-18 janv. [S/P] ; fiche Pépites (36 votes, 10 avis) [P] ; TSE [P]. Dealroom [S, 403 à la lecture] : créée 2025, 2-10 personnes, "liste d'attente pour accès anticipé" (daté ou périmé : contredit l'App Store).
- Société [S Pappers/Pépites] : SAS USETRUSTEE créée le 20-21/11/2025, DG Jordan Baumard, capital 1 000 €, aucun salarié déclaré en 2026 ; siège indiqué Paris (Pépites) mais commune Pompertuzat (Haute-Garonne) au registre ; rattachée à French Tech Toulouse. Statut "Bêta".
- Recrutements : non trouvé. Traction chiffrée (utilisateurs, requêtes, revenus) : non trouvée. Réalité probable : très petit (4 notes sur iOS) [V].

## 6. Feuille de route et signaux crypto/paiement
- Annoncée : communauté d'utilisateurs, clients B2B plateformes C2C, partenariats publics [P]. Ajouts constatés : application iOS (janv. 2026), historique (avril 2026), recherche d'image inversée.
- Signes d'extension vers la crypto ou les paiements : **aucun trouvé**. Le seul lien crypto est le nom de l'organisateur de 2025 (KRYPTOSPHERE) et le sponsor Morpho Labs, sans rôle dans le produit [P page projet]. Trustee se définit même par opposition à la fintech et au paiement [P Pépites]. Extension plausible : plus de plateformes, pages web, messages, B2B [V].

## 7. Fondateurs (profils publics, LinkedIn non lu : 999/403)
- **Anaïs Boughanem** : M2 D3S à TSE ; modèle IA, RAG, raisonnement LLM [P TSE] ; auteure de la fiche Pépites (13 janv. 2026) [P] ; profil LinkedIn "Trustee" [S]. Rôle exact (CEO ?) non confirmé.
- **Imane Ourdane** : "COO & Co-Fondatrice de Trustee" [S, titre LinkedIn] ; Skema au hackathon [P TSE].
- **Jordan Baumard** : DG légal depuis 21/11/2025 [S Pappers] ; IMT Atlantique [P TSE] ; profil LinkedIn "Software Engineer @ Renault Group" [S] : donc possiblement salarié à côté (Software Lab Renault à Toulouse, lien non vérifié) [V].
- Jad (Albert School) et Clément (ESSEC/ENSAE) : cités en 2025 [P], absents de la startup.
- Lecture [V] : profil data/ML et produit grand public, pas de background blockchain ou sécurité transactionnelle visible. Équipe quasi bénévole, à temps partiel possible.

## 8. Table "Trustee aujourd'hui"

| Fonction | Preuve | Source | Fiabilité |
|---|---|---|---|
| Score de fiabilité d'annonce sur marketplaces C2C | App Store, Pépites | [P] | haute |
| eBay, Vinted, Leboncoin, Facebook Marketplace | App Store (Vinted, Leboncoin), FAQ (4 plateformes) | [P]+[S] | haute/moyenne |
| Analyse de conversations vendeur | Pépites, TSE | [P] | haute (périmètre technique exact inconnu) |
| Image inversée, comparaison prix, profil vendeur | FAQ | [S] | moyenne |
| URL / pages web suspectes | App Store, Pépites | [P] | haute (méthode inconnue) |
| Extension Chrome | Pépites, TSE ; fiche store introuvable | [P] / non trouvé | moyenne |
| App mobile iOS (v1.1.1) | App Store | [P] | haute |
| Android, Firefox, Edge | rien | non trouvé | |
| Outil B2B Trust & Safety | Pépites, accueil | [P]+[S] | moyenne (aucun client) |
| Freemium 5 requêtes puis 2,99 € | Pépites, App Store | [P] | haute |
| "100 arnaques évitées" | accueil | [S] | basse (non défini) |
| Mesures de précision | aucune | non trouvé | |
| Crypto, on-chain, signatures, dApps | aucune | non trouvé | haute pour l'absence |
| Levée, clients nommés, subventions | aucune | non trouvé | |

## 9. Conclusion franche
**Trustee reste sur les marketplaces C2C et les "échanges entre particuliers" : il ne fait pas plus, sur ce qui est vérifiable.** Son élargissement est horizontal (autres marketplaces, pages web, application mobile, B2B Trust & Safety), pas vertical vers la crypto ou le paiement. Je n'ai trouvé aucun indice de pivot crypto, mais mes sources sur le site officiel sont des résumés [S] et l'extension n'a pas été lue.

**Recouvrement avec notre projet** : particulier non expert ; avertissement AVANT l'acte ; canal extension/appli ; explication lisible ; score/verdict. Rien de plus. **Différences entières** : (1) objet analysé : discours d'un vendeur (texte, prix, photo, profil) contre effet exécutable décodé (droit de dépense, destinataire, typed data) ; (2) nature : probabiliste/LLM contre noyau déterministe ; (3) moment : avant un achat contre à la signature, avec friction ; (4) mesure : aucune publiée contre un banc chiffré ; (5) risque couvert : fraude à la livraison de bien contre perte irréversible on-chain ; (6) marché et client : C2C et plateformes contre portefeuilles/exchanges. Un score de texte ne voit pas un permit sans montant [V]. Les deux mondes se rencontrent seulement si un faux vendeur demande un paiement crypto : hors de leur périmètre déclaré.

Pour le pitch : on peut dire "un outil qui lit l'annonce ; nous calculons ce que la signature fait" sans nommer Trustee ; ne pas dire "Trustee ne fait rien en crypto" comme preuve définitive (seulement "non trouvé").

## Résumé en 12 lignes
1. Site officiel : usetrustee.com (illisible depuis le réseau ESSEC, contenu connu par résumés de recherche [S]) ; CGU et confidentialité du site : non trouvées.
2. Produit actuel : score de fiabilité d'annonces, conversations, images, URL/pages web ; image inversée, prix du marché, profil vendeur ; aucun blocage.
3. Plateformes : eBay, Vinted, Leboncoin, Facebook Marketplace, "la plupart des marketplaces" ; Airbnb/Booking seulement annoncés.
4. Crypto, portefeuilles, on-chain, signatures, dApps, messageries, SMS, réseaux sociaux, banques, rencontres : non trouvés.
5. App Store [P] : v1.1.1 (12 avril 2026), 2,99 €, 5 analyses gratuites, 4 notes 5/5 ; Chrome Web Store, Google Play, Firefox, Edge : fiches non trouvées.
6. Technique : briques IA et agents spécialisés, explicabilité en pilier, Mistral/AWS en 2025 ; aucune précision publiée ; "100+ arnaques évitées" non défini.
7. Économie : freemium B2C, B2B Trust & Safety par POC puis abonnement ; aucun client nommé, aucune levée ni subvention trouvée, traction non communiquée.
8. Société : SAS créée en nov. 2025, capital 1 000 €, 2-10 personnes ; presse limitée (Pépites, 5e de janvier 2026, et TSE).
9. Feuille de route : plus d'utilisateurs, clients C2C, partenariats publics ; aucun signe crypto ou paiement (Trustee se positionne contre la fintech).
10. Fondateurs : Boughanem (TSE, ML/RAG), Ourdane (COO), Baumard (DG légal, ingénieur logiciel Renault selon LinkedIn) ; pas de profil blockchain.
11. Recouvrement avec Sentinelle : particulier, avertissement avant l'acte, extension, explicabilité ; tout le reste diffère (texte de vendeur contre effet on-chain, probabiliste contre déterministe, aucune mesure contre banc chiffré).
12. À faire : relire le site, la FAQ et la fiche Chrome depuis un autre réseau avant d'afficher quoi que ce soit en slide ; ne pas conclure "Trustee ne mesure rien" ni "Trustee ne fera pas de crypto", seulement "non trouvé".

## Sources
- [P] https://apps.apple.com/fr/app/trustee-ia-anti-scam/id6757202153 ; https://apps.apple.com/us/app/trustee-ia-anti-scam/id6757202153
- [P] https://lespepitestech.com/blog/2026/01/28/364-interview-des-pepites-usetrustee ; https://lespepitestech.com/startup-de-la-french-tech/usetrustee ; https://lespepitestech.com/blog/2026/02/02/top-10-des-startups-du-mois-de-janvier-2026
- [P] https://tse-fr.eu/fr/anais-boughanem-etudiante-en-master-d3s-remporte-le-premier-prix-dun-hackathon-sur-lia ; https://jaddevvv.github.io/Hackathon-From-LLM-To-Agentic-AI/ ; https://www.producthunt.com/p/trustee
- [S] https://www.usetrustee.com/en ; https://www.usetrustee.com/faq (via moteur de recherche, non lus) ; https://app.dealroom.co/companies/trustee_7 (403) ; https://www.pappers.fr/dirigeant/jordan_baumard_2003-02 ; LinkedIn (Boughanem, Ourdane, Baumard : 999/403, via extraits de recherche)
