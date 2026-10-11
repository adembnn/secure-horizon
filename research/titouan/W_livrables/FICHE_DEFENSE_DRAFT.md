# Fiche de défense : Sentinelle (Track 1)

**Scénario de menace.** Camille reçoit un faux message de "support" et croit annuler un paiement. Le site sosie lui fait signer un droit de dépense illimité vers un compte externe, ou envoyer des fonds vers une adresse sosie. Sentinelle décode l'effet réel, le compare à l'intention déclarée, avertit ("tu as dit X, ça fait Y") et ralentit. Camille garde la décision.

**NIST CSF 2.0 (identifiants à vérifier).** Detect : DE.AE (analyse d'événements), DE.CM (surveillance). Respond : réponse graduée, journal des décisions (RS.MA, à vérifier). Protect : PR.AT (sensibilisation au moment de l'action, à vérifier).

**Référentiels (à vérifier).** ATT&CK T1566, T1656, T1657. ATLAS AML.T0051 (injection dans un message collé). OWASP Agentic ASI01. D3FEND : catégories Detect et Harden, identifiants à retrouver. Le modèle ne peut qu'aggraver un verdict.

| Couverture sur cas synthétiques | Taux mesurés sur données réelles |
|---|---|
| TEST, ouvert une fois, avant correctifs (n = 110 malveillants, 78 bénins) : rappel 94,5 % [88,6 ; 97,5] (104/110) ; fausses alertes critical 23,1 % [15,1 ; 33,6] (18/78). `COUVERTURE.md` | C-Chain réelle, 6 325 transactions : filet v0 sans intention, 0,28 % [0,18 ; 0,45] d'alertes sur trafic présumé légitime. `bench/RAPPORT_banc_reel_v0.md` |
| Plancher sans intention, même jeu : rappel 91,8 % [85,2 ; 95,6] (101/110) ; fausses alertes critical 5,1 % (4/78). `COUVERTURE.md` | Droits réels vers adresses listées (Ethereum, n = 33) : filet v0 retrouve 24/33 = 72,7 % [55,8 ; 84,9]. Étiquettes d'un tiers. Même rapport |
| Fixtures publiques (n = 65 malveillants, 67 bénins) : rappel 95,4 % [87,3 ; 98,4] ; fausses alertes critical 3,0 % (2/67). `attacks_public/out/MESURE_001.md` | Compatibilité, 96 sites réels : 0 casse sur 89 accessibles [0 ; 4,1 %], avec un Proxy du banc, pas l'extension réelle. `compat/COMPAT_REEL.md` |
| Jeu aveugle V2 d'Adem (8 425 cas) : non mesuré, à ouvrir une seule fois | Fausses alertes de l'outil complet sur trafic réel : non mesuré |

Chemins relatifs à `research/titouan/T_banc_e2e/` (sauf `bench/`, sous `research/titouan/`). Rappel du filet v0 : les anciens 80,4 % et 81,9 % sont retirés (révocations comptées à tort), voir `RESULTATS_A_JOUR.md`.

**Temps de détection et de réponse.** Verdict du serveur local : médiane 25,9 ms, p95 38,7 ms, 400 requêtes synthétiques, hors ligne, sans RPC ni fork (`server/test/results.json`). API absente ou lente (plus de 3 s) : verdict "Non vérifié", jamais vert (`extension/COMPAT.md`). Temps de décision de l'utilisateur : journalisé, non mesuré sur des personnes. Retenue de 10 minutes : testée avec 2 s seulement. Détection sur Fuji et temps de réponse humaine : non mesurés.

**Limites connues.** Envois depuis l'interface du portefeuille et mobile non couverts. Fraude conforme invisible. On avertit et on ralentit, rien n'est imposé. Catalogues synthétiques écrits par nous. Données d'attaque réelles surtout Ethereum. Pas d'EIP-7702 sur la C-Chain. Fausses alertes élevées sur TEST. Extension jamais essayée avec un vrai portefeuille. Ancrage Fuji du journal : en cours.
