# Fiche de défense : Hold up (Track 1)

**Menace.** Camille reçoit un faux message de support. Elle veut échanger 50 USDC. La demande, banale pour un portefeuille, lui fait signer un droit de dépense illimité. Hold up décode l'effet réel, le compare à l'intention qu'elle a écrite, répond « ça ne correspond pas » avec une ligne ("tu as dit X, ça fait Y") et ralentit. Elle garde la décision. Aucune garantie.

**Positionnement (D-009).** MetaMask te prévient de ce qu'il reconnaît. Hold up vérifie ce que tu voulais faire.

**Ce que MetaMask fait déjà.** Alertes de sécurité sur transactions et signatures (Blockaid), actives par défaut, Avalanche dans la liste des réseaux couverts. Source : https://support.metamask.io/configure/wallet/security-alerts/ (page lue le 11 oct. 2026). Selon Adem (`coord/INBOX.md` MSG-060, MSG-061) : alerte d'empoisonnement d'adresse depuis le 17 juin 2026, avertissement sur une adresse jamais vue, Permit en clair depuis la v12.2. Ces trois points ne sont pas sur la page lue : à vérifier avant de les citer. Fuji et les chaînes locales ne sont pas dans la liste de la page. Le silence de MetaMask sur notre démo ne prouve rien.

**Ce que Hold up ajoute.** (1) La comparaison intention écrite contre effet réel, réponse « ça correspond / ça ne correspond pas ». (2) Un délai proportionné à l'écart. (3) Une preuve rejouable et ancrée.

**Référentiels, identifiants à vérifier.** NIST CSF 2.0 : DE.AE, DE.CM, RS.MA, PR.AT (à vérifier). ATT&CK : T1566, T1656, T1657 (à vérifier). ATLAS AML.T0051 (à vérifier). OWASP Agentic ASI01 (à vérifier). D3FEND : identifiants à retrouver.

| Colonne synthétique (cas écrits par nous) | Colonne données réelles |
|---|---|
| **V2_DEV, 5 927 cas, SYNTHÉTIQUE ET RÉGLÉ.** Attaques attrapées 99,7 % [99,5 ; 99,9] (2922/2930). Fausses alertes critical 1,0 % [0,7 ; 1,6] (20/1976). Warn ou critical brut sur bénins 19,2 %. Plancher seul : 0,0 % et 14,7 %. `T_banc_e2e/run/out/v2/MESURE_FINAL.md` | **Trafic réel C-Chain, 6 325 transactions.** Critical sur 0,30 % [0,19 ; 0,47]. 96 % des alertes sont de l'opacité ("je n'ai pas pu décoder"). Ethereum : 3,33 %. `realtraffic/REALTRAFFIC.md` |
| Fixtures publiques : 95,4 % attrapées (62/65). Fausses alertes critical 7,5 % avant les correctifs, 1,5 % après. `attacks_public/out/MESURE_001.md`, `run/out/JOURNAL.md` | Droits de dépense réels (Ethereum, **n = 33**) : le filet v0 en retrouve 24/33, soit 72,7 % [55,8 ; 84,9]. Étiquettes d'un tiers. `bench/RAPPORT_banc_reel_v0.md` |
| **Conditions produit** (contexte du banc retiré, tous jeux, 3 254 malveillants et 2 136 bénins) : rappel 99,2 % → 83,8 % [82,5 ; 85,0], fausses alertes critical 0,9 % → 13,9 % [12,5 ; 15,4], warn ou critical sur bénins 15,4 % → 54,2 %. `banc_realiste/BANC_REALISTE.md` | Compatibilité, 96 sites : 0 casse sur 89 [0 ; 4,1 %], avec un Proxy du banc, pas l'extension réelle. `compat/COMPAT_REEL.md` |
| Ancien TEST, ouvert une fois : 94,5 % attrapées, 23,1 % de fausses alertes critical. **Contaminé**, cité comme tel. `COUVERTURE.md` | Essai réel MetaMask, utilisateurs réels : non mesurés (un envoi d'Adem est passé par le RPC de garde sur chaîne locale, MSG-060) |
| **Produit livré contre banc** (synthétique, 6 191 arnaques, 2 695 bénins) : le produit d'aujourd'hui attrape 41,2 % (3 643 ratées), 16,3 % de fausses alertes. Avec détecteurs sans liste de protocoles : 90,4 % mais 41,8 % de fausses alertes, chiffre non retenu. Avec liste et contexte live : 896 ratées, 458 fausses alertes. `redteam/PRODUIT_VS_BANC.md`, photo du 11 oct. | Scan C-Chain, 300 000 blocs : des paires d'adresses qui se ressemblent existent. **Contexte seulement** : la menace existe. Ni différenciateur, ni perte évitée. `realscan/out/summary.json` |

Le test indépendant est V2_TEST, à ouvrir une seule fois, à la fin. Les 99,7 % ne sont pas un test indépendant.

**Détection et réponse.** Le verdict local sort en environ 30 ms (médiane 30,5 ms, p95 35,8 ms, 400 requêtes synthétiques, hors ligne). Un doute donne "Non vérifié", jamais un feu vert. Le modèle, s'il est utilisé, ne peut qu'aggraver un verdict. Le journal est chaîné par hachage. Son ancrage sur Fuji n'est pas livré : 42 vérifications locales, contrat compilé et déployé sur un nœud local par Adem (`anchor/ANCHOR_README.md`, `coord/INBOX.md` MSG-058). Temps de décision humain : non mesuré.

**Tests.** Moteur 447/447. Serveur 33/33. Présentation 30/31 (un test échoue : sept codes de raison sans texte).

**Ce qui n'est pas mesuré.** L'intention en texte libre (les mesures utilisent des cases). Clef et Jev : jamais appelés faute de clé, donc on ne dit pas « Clef classe l'intention ». Le comparateur sur les cas revendiqués (droit plus large que le montant voulu, jeton différent, destinataire tiers d'un échange).

**Limites.** Envois depuis l'interface du portefeuille et mobile non couverts. Fraude conforme invisible. Fausses alertes encore hautes hors réglage du banc. Catalogues écrits par nous. Données réelles surtout Ethereum. Pas d'EIP-7702 sur la C-Chain. Extension jamais essayée avec un vrai portefeuille. Le produit livré rate 58,8 % des arnaques du jeu de 6 191 tant que les détecteurs ne sont pas branchés.
