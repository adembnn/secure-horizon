# Fiche de résultats de l'essai réel (à copier en RESULTATS_AAAA-MM-JJ.md)

Remplis avec ce que tu as **vu**. Une prévision n'est pas un résultat. "Pas testé" est une réponse valable. Jamais de clé privée ni de phrase de récupération dans ce fichier.

## A. Contexte

| Champ | Valeur |
|---|---|
| Date et heure | |
| Testeur | |
| Windows (version) | |
| Chrome (version, `chrome://version`) | |
| MetaMask (version, Paramètres, À propos) | |
| Hold up (version du panneau) | 0.3.0 ? |
| Node (`node -v`) | |
| Mode de la chaîne locale | plain 31337 / fork 43114 |
| Adresses locales : usdc, router, drainer | |
| Compte local (adresse publique) | |
| Compte Sepolia (adresse publique) | |
| ADRESSE_NEUVE (Sepolia) | |
| Durées Hold up | démo (10 s, 60 s) / produit |

## B. Installation (section 3)

| Contrôle | Résultat (OK / KO) | Remarque, capture |
|---|---|---|
| Carte sans bouton "Erreurs" | | `01_extension_carte.png` |
| Panneau latéral "Hold up est actif." | | `02_panneau_lateral_vide.png` |
| Version et "Aucune connexion réseau" affichées | | |

## C. Chaîne locale : une ligne par scène

Colonnes : MM = MetaMask seul (extension coupée). HU = avec Hold up.

| Scène | MM : écran (titre, montant) | MM : alerte (texte exact ou "aucune") | HU : question posée | HU : verdict et niveau | MetaMask ouvert avant Hold up ? | Résultat de la scène | Captures |
|---|---|---|---|---|---|---|---|
| S1-A honnête (routeur, 50) | | | | | | | |
| S1-B piège (illimité, adresse neuve) | | | | | | | |
| S1-C piège par Permit | | | | | | | |
| S6 "me connecter" (Permit) | | | | | | | |
| Coffre | non disponible (contrats absents) | | | | | | |

Détails S1-B (avec Hold up) :
- Proposition de plafond à 50 USDC : oui / non. Montant réellement envoyé à MetaMask si "Continuer" : ______
- Friction constatée (phrase à retaper, compte à rebours) : ______
- "Annuler" : le site a dit "Opération annulée." oui / non ; MetaMask resté fermé oui / non

Contrefactuel sans Hold up (section 7) :
- S1-B confirmé : le FreshDrainer a le droit illimité (lecture sur la chaîne ou le site) : oui / non
- S6 signé : solde DUSDC après (console `attaquant.html`) : ______ ; capture `NEG_S6_drain_console.png`

## D. Sepolia : ce que MetaMask affiche vraiment (le constat clé)

Extension coupée. Une ligne par bouton de la page testnet.

| Bouton | Titre de l'écran MetaMask | Montant affiché ("Unlimited" ?) | Alerte ? (texte exact) | Aperçu des changements | Délai / case à cocher | Capture |
|---|---|---|---|---|---|---|
| S1a approve 50, adresse connue | | | | | | `SEP_S1a_metamask.png` |
| S1b approve illimité, adresse connue | | | | | | `SEP_S1b_metamask.png` |
| S1c approve illimité, adresse neuve | | | | | | `SEP_S1c_metamask.png` |
| S1d envoi 0,0001 ETH, adresse neuve | | | | | | `SEP_S1d_metamask.png` |
| S6a Permit illimité, adresse neuve | | | | | | `SEP_S6a_metamask.png` |
| S6b Permit illimité, adresse connue | | | | | | `SEP_S6b_metamask.png` |
| S6c témoin message simple | | | | | | `SEP_S6c_metamask.png` |

Avec Hold up :

| Bouton | Verdict Hold up | Niveau | MetaMask ouvert avant Hold up ? | Capture |
|---|---|---|---|---|
| S1a | | | | `SEP_S1a_holdup.png` |
| S1b | | | | `SEP_S1b_holdup.png` |
| S1c | | | | `SEP_S1c_holdup.png` |
| S6a | | | | `SEP_S6a_holdup.png` |
| S6b | | | | `SEP_S6b_holdup.png` |

Constats qui remplacent les [NV] de `RECHERCHE_metamask_couverture.md` (une phrase chacun, copie du texte affiché) :

| Point [NV] | Constat sur Sepolia |
|---|---|
| Avertissement propre au montant illimité | |
| Alerte "1st interaction" pour une adresse neuve | |
| "Limited address signals" ou équivalent | |
| Affichage d'un Permit (titre, lignes) | |
| Une alerte bloque-t-elle ou laisse-t-elle passer (case à cocher, délai) | |
| "Security check unavailable" vu (oui / non) | |

## E. Fuji (si joué)

Décision : jouée / non jouée. Résumé : ______

## F. Questions de fond (réponse en une phrase)

1. Hold up a-t-il retenu chaque demande **avant** l'ouverture de MetaMask ? oui / non / parfois : ______
2. Par `window.ethereum` et par EIP-6963, même comportement ? ______
3. Une fausse alerte (verdict rouge sur une demande honnête) ? ______
4. Une demande piégée qui est passée sans verdict ? ______
5. Latence ressentie entre le clic du site et la fenêtre Hold up : ______ s
6. Ce qui t'a surpris : ______

## G. Pannes rencontrées

| Panne (n° de la liste) | Ce qui s'est passé | Solution qui a marché |
|---|---|---|
| | | |

## H. Journal de l'extension

- Lignes `ui_fallback` ou erreurs : ______
- Capture `99_journal_options.png` et `98_panneau_apres_essai.png` : faites / non

## I. Verdict global (une ligne par question du protocole)

- Installation : réussie / échouée
- Retenue avec un vrai MetaMask : constatée / non constatée / partielle
- Ce que MetaMask affiche seul sur Sepolia : ______
- Ce qui reste à corriger côté extension : ______
