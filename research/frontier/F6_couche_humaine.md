# F6 — Couche humaine et confiance à l'ère de l'IA générative

> [V] source primaire · [S] source secondaire, à vérifier · [Vendeur] étude d'un éditeur. Pistes : Track 3 piste 4, Track 1 piste 2.

## TL;DR
1. On ne perd pas par bêtise mais par **excitation émotionnelle** : peur et urgence court-circuitent le raisonnement. La détection « à l'œil » est perdue : 24,5 % de détection des deepfakes vidéo de qualité (iProov 2025, [Vendeur]) ; 70 % des Britanniques se trompent sur au moins une vidéo (Which?, mars 2026, [V]).
2. Ce qui marche est à **friction nulle ou ciblée** : passkeys (93 % de succès vs 63 %), Safe Browsing, détection d'arnaque on-device. Les formations (UCSD, 19 500 employés, effet de 1,7 %) et les avertissements génériques échouent.
3. **Le moment de vulnérabilité est mesurable par l'appareil** : appel d'un inconnu + ouverture de l'appli bancaire + partage d'écran. Google y déclenche une pause de 30 s — seule intervention récente à fort rapport efficacité/friction, mais limitée à Android et aux banques partenaires.
4. Des signaux déjà vus par les appareils ne sont **jamais croisés** entre appareils et organisations.
5. **Trou de marché** : les protections sont par plateforme (Google, Apple, banque) ; aucune ne couvre la PME (faux RIB, visio deepfake, Shadow AI).

## 1. Pourquoi les gens se font avoir
- Stajano & Wilson (Cambridge 2009) : distraction, autorité, effet de troupeau, et **pression du temps** qui fait basculer vers une décision sans raisonnement [V] https://www.cl.cam.ac.uk/~fms27/scams/
- ~200 000 plaintes d'usurpation de la Sécurité sociale US : l'excitation émotionnelle est « extrêmement efficace » ; les victimes emploient plus de mots de peur et de colère [S] https://mrdrc.isr.umich.edu/wp-content/uploads/2024/04/rb434.pdf
- C'est l'**intensité** de l'émotion, pas sa valence, qui augmente la crédulité (2017) [S].
- « Scam trance » n'est pas un concept formel : parler d'excitation émotionnelle et de suspension de la méfiance.
- Cybermalveillance (baromètre 2025) : 60 % des Français confrontés au phishing en 12 mois ; **29 % des 18-34 ans contre 8 % des 55-75 ans** ont reçu un appel de faux conseiller — les jeunes sont les plus exposés en volume ; seuls 24 % des virements vers un escroc donnent lieu à plainte [S].

## 2. Ampleur
- **FBI IC3 2025** : ~1 M de plaintes, **20,9 Md$** de pertes (+26 %) ; investissement 8,6 Md$ (dont crypto 7,2 Md$) ; BEC 3 Md$ ; plus de 60 ans : 7,75 Md$ (+59 %) [S].
- **UK Finance (année 2025)** : fraude APP 576,4 M£ (+19 %), 248 070 cas ; **17 % des cas naissent par télécom mais pèsent 28 % des pertes** [S]. Le remboursement obligatoire aurait réduit les pertes d'environ 73 M£/an (Frontier Economics) [S].
- Pig butchering : étude SOUPS 2025 sur le cycle de vie et les points d'intervention [S] https://arxiv.org/abs/2503.20821 ; 200 000+ personnes retenues dans des « scam compounds » (ONU 2024) [S]. Signal : le motif financier (dépôts réguliers croissants vers une plateforme récente), vu par la banque, pas par la victime.

## 3. Deepfakes
- Arup (Hong Kong 2024) : visio où tous les autres participants étaient générés, ~25 M$ [S].
- **Ferrari (2024)** : voix clonée du PDG déjouée par une **question dont seule la vraie personne connaissait la réponse** ; WPP déjoué aussi [S]. Preuve que la vérification hors-bande marche et que le détecteur humain ne marche pas.
- Les statistiques de « hausse de 1 100 % / 3 000 % » viennent d'éditeurs et ne sont pas comparables : ne pas les citer.
- **Implication** : ne pas demander à l'humain de repérer le faux ; concevoir une **preuve de présence** (challenge-réponse, canal connu, jeton lié à un compte) et une double validation des ordres hors norme.

## 4. Mots de code familiaux / vérification hors-bande
- Conseil officiel relayé par la presse (FBI) : mot de code familial + rappel sur un autre appareil [S]. **Aucune mesure d'efficacité** ; sous émotion forte, la victime oublie la règle.
- **Lacune à exploiter** : automatiser le rappel hors-bande (bouton « vérifier cette personne » qui envoie un défi à l'appareil connu du contact).

## 5. Provenance du contenu (C2PA)
- C2PA v2.3, comité : Adobe, Amazon, BBC, Google, Meta, Microsoft, OpenAI, Sony, TikTok… [V] https://c2pa.org/
- Adoption [S] : Pixel 10 signe chaque photo, Samsung S25 seulement les images éditées par IA, Leica, Sony opt-in, Nikon suspendu après une faille. Maillon faible : les intermédiaires suppriment les métadonnées. **La provenance n'est pas l'authenticité.** AI Act art. 50 à partir d'août 2026.
- Piste : signaler « pas de provenance » comme signal faible, sans bloquer.

## 6. Vérification de l'interlocuteur
- **STIR/SHAKEN** (TNS S1 2026, [Vendeur]) : ~85 % du trafic des gros opérateurs US signé ; **plus de 50 % des appels d'arnaque portent une attestation de niveau A** → un numéro « vérifié » prouve le numéro, pas l'honnêteté.
- Ofcom : blocage des appels étrangers usurpant un fixe UK ; le cas des mobiles +447 en itinérance reste ouvert [V].
- Apple iOS 26 : Call Screening (nom + motif avant la sonnerie), en option [S]. RCS Verified Sender : aucune mesure indépendante.

## 7. Sextorsion (ados)
- NCMEC : 50 000+ signalements en 2025 (~137/jour) contre 36 000+ en 2024 ; bascule rapide vers des messageries chiffrées [V] https://us.missingkids.org/blog/2026/ncmec-releases-new-sextortion-data-2025
- Instagram floute la nudité par défaut pour les moins de 18 ans ; pas de mesure d'efficacité indépendante [S].

## 8. Ce qui échoue / ce qui marche
**Échoue** :
- Avertissements SSL de Chrome : 70,2 % de contournement ; l'**habituation** est la cause principale ; ajouter des clics n'aide pas (Akhawe & Felt, USENIX 2013, 25 M+ affichages) [V].
- Formation anti-phishing : essai randomisé sur 19 500+ employés (UCSD, Black Hat 2025) : formation annuelle sans effet, exercices intégrés −1,7 % [S].
- Avertissements bancaires : 33 % des Britanniques disent les lire [Vendeur]. **Aucun essai randomisé de pause/délai sur des victimes réelles trouvé.**
**Marche** :
- Confirmation of Payee UK : une **information concrète au bon moment** (« le nom ne correspond pas »), pas un avertissement générique [S].
- La pause de 30 s de Google dans le scénario appel + partage d'écran (« des milliers » d'appels arrêtés, qualitatif).

## 9. Sécurité invisible : exemples réussis
- **Passkeys** (FIDO Passkey Index oct. 2025) : 93 % de succès vs 63 % ; 8,5 s vs 31,2 s ; −81 % de tickets de support [V partiel].
- **Chrome Enhanced Protection + Gemini Nano** : 20x plus de pages frauduleuses détectées, −80 % d'usurpation du service client des compagnies aériennes (auto-déclaré) [V].
- **Google Scam Detection** (Messages / appels) : classification on-device, sans envoi de transcription ; 10 Md+ d'appels et messages suspects bloqués par mois ; pas de taux de faux positifs publié [S].
- **In-call scam protection** [V] https://blog.google/security/android-expands-pilot-in-call-scam-protection-financial-apps/ : se déclenche quand **appli financière + partage d'écran + appel d'un numéro hors contacts** ; alerte, bouton pour raccrocher, **attente de 30 s**. Pilotes UK (Monzo, NatWest, Revolut…), Brésil, Inde, US (Cash App, JPMorgan).

**Signaux déjà vus par les appareils et que personne ne fusionne** (inférence de l'agent) :
1. Appelant hors contacts, durée d'appel
2. Partage d'écran / accès à distance actif
3. Ouverture d'une appli bancaire pendant l'appel
4. Nouveau bénéficiaire ou hausse de plafond pendant l'appel
5. Installation d'une appli de source inconnue
6. Appelant revendiqué (« votre banque ») vs numéro réel
7. Absence de provenance C2PA sur un média
8. Outil IA personnel sur un poste pro

## 10. Communications d'entreprise
- **Faux fournisseur / changement de RIB** : 13,5 % des demandes d'assistance des professionnels en France, +93 % (Cybermalveillance 2025, via presse) ; Trustpair : 64 % des entreprises ciblées, 37 % victimes [Vendeur]. BEC US : 3 Md$.
- Défense réaliste : à chaque changement d'IBAN, rapprochement avec une source indépendante (registre, historique des factures, rappel sur un numéro déjà connu), sans friction pour le cas légitime.
- **Shadow AI** : IBM 2025 : 20 % des organisations ont subi une brèche liée au shadow AI, surcoût 670 000 $, 97 % sans contrôle d'accès IA [S] ; **Verizon DBIR 2026 : 67 % des utilisateurs d'IA passent par des comptes personnels sur des postes pro** (mesuré sur le trafic réseau) [S] ; Gartner T1 2026 : 88 % des salariés équipés d'un outil IA en utilisent aussi un personnel [S].

## 11. Pistes
1. **Pause intelligente** au moment d'un virement pendant un appel (conjonction de signaux ; friction seulement dans ce cas). Viser la PME ou les banques non couvertes par Google.
2. **Vérificateur d'ordre de paiement PME** : changement d'IBAN ou demande « urgente de la direction » → croisement de sources + vérification hors-bande automatique.
3. **Shadow AI en PME** : inventaire (DNS/proxy, extensions) puis redirection vers un outil autorisé plutôt que blocage.
4. **Challenge de présence en visio/appel** (anti-Arup) : jeton lié à un compte connu avant tout ordre sensible.
5. Pitch : « on n'ajoute **pas** d'avertissement générique » (70 % de contournement, 33 % de lecture) ; on n'intervient que sur la conjonction de signaux.

## Limites
PDF IC3 illisibles par l'outil (chiffres via médias). Plusieurs URL Google en 404. Non couverts : études SOUPS/CHI sur les nudges bancaires, contrôles anti-deepfake Teams/Zoom, Ofcom 2025-2026.
