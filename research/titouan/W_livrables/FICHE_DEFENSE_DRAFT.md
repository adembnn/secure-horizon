# Fiche de défense : Hold up (Track 1)

**Menace.** Camille reçoit un faux message de support. Un site sosie lui fait signer un droit de dépense illimité, ou envoyer des fonds vers une adresse sosie. Hold up décode l'effet réel, le compare à ce qu'elle voulait faire, avertit ("tu as dit X, ça fait Y") et ralentit. Elle garde la décision. Aucune garantie.

**Référentiels, identifiants à vérifier.** NIST CSF 2.0 : DE.AE, DE.CM, RS.MA, PR.AT (à vérifier). ATT&CK : T1566, T1656, T1657 (à vérifier). ATLAS AML.T0051 (à vérifier). OWASP Agentic ASI01 (à vérifier). D3FEND : identifiants à retrouver.

| Colonne synthétique (cas écrits par nous) | Colonne données réelles |
|---|---|
| **V2_DEV, 5 927 cas, SYNTHÉTIQUE ET RÉGLÉ.** Attaques attrapées 99,7 % [99,5 ; 99,9] (2922/2930). Fausses alertes critical 1,0 % [0,7 ; 1,6] (20/1976). Warn ou critical brut sur bénins 19,2 %. Plancher seul : 0,0 % et 14,7 %. `T_banc_e2e/run/out/v2/MESURE_FINAL.md` | **Trafic réel C-Chain, 6 325 transactions.** Critical sur 0,30 % [0,19 ; 0,47]. 96 % des alertes sont de l'opacité ("je n'ai pas pu décoder"). Ethereum : 3,33 %. `realtraffic/REALTRAFFIC.md` |
| Fixtures publiques : 95,4 % attrapées (62/65). Fausses alertes critical 7,5 % avant les correctifs, 1,5 % après. `attacks_public/out/MESURE_001.md`, `run/out/JOURNAL.md` | Droits de dépense réels (Ethereum, **n = 33**) : le filet v0 en retrouve 24/33, soit 72,7 % [55,8 ; 84,9]. Étiquettes d'un tiers. `bench/RAPPORT_banc_reel_v0.md` |
| Au réglage produit par défaut, sans le contexte du banc : fausses alertes critical 14,4 % sur V2_DEV. Provisoire. `banc_realiste/out/` | Compatibilité, 96 sites : 0 casse sur 89 [0 ; 4,1 %], avec un Proxy du banc, pas l'extension réelle. `compat/COMPAT_REEL.md` |
| Ancien TEST, ouvert une fois : 94,5 % attrapées, 23,1 % de fausses alertes critical. **Contaminé**, cité comme tel. `COUVERTURE.md` | Essai réel MetaMask, utilisateurs réels : non mesurés |

Le test indépendant est V2_TEST, à ouvrir une seule fois, à la fin. Les 99,7 % ne sont pas un test indépendant.

**Détection et réponse.** Le verdict local sort en environ 30 ms (médiane 30,5 ms, p95 35,8 ms, 400 requêtes synthétiques, hors ligne). Un doute donne "Non vérifié", jamais un feu vert. Le modèle, s'il est utilisé, ne peut qu'aggraver un verdict. Le journal est chaîné par hachage. Son ancrage sur Fuji n'est pas livré : 42 vérifications locales, contrat compilé et déployé sur un nœud local par Adem (`anchor/ANCHOR_README.md`, `coord/INBOX.md` MSG-058). Temps de décision humain : non mesuré.

**Tests.** Moteur 447/447. Serveur 33/33. Présentation 30/31 (un test échoue : sept codes de raison sans texte).

**Limites.** Envois depuis l'interface du portefeuille et mobile non couverts. Fraude conforme invisible. Fausses alertes encore hautes hors réglage du banc. Catalogues écrits par nous. Données réelles surtout Ethereum. Pas d'EIP-7702 sur la C-Chain. Extension jamais essayée avec un vrai portefeuille.
