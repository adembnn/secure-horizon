> **PÉRIMÉ (11 oct. 2026).** Direction D-007 (retenue graduée, deux portes, démo sur Fuji). Produit figé actuel : `coord/HANDOFF_ADEM_SESSION_2.md` et `README.md`. Fuji n'est pas déployé.

# Brief de direction : Sentinelle, barrière d'intention (D-007, 11 oct. 2026, 01h)

> Pour Adem, Titouan et tous les agents. Contrat technique : `docs/intent-barrier.md`. Décision : `coord/DECISIONS.md` D-007.

## 1. En une phrase
Avant qu'un particulier envoie ou signe quoi que ce soit avec son wallet normal, il dit en mots simples ce qu'il veut faire. Sentinelle calcule ce que l'opération fait **vraiment**. Si les deux ne correspondent pas, elle l'arrête avec un message qui reprend ses propres mots : « Tu as dit : je paie Paul. En réalité : cette adresse n'est pas celle de Paul. »

## 2. Pour qui
- **Utilisateur** : le grand public, avec un wallet normal (MetaMask et équivalents). Pas de Safe, pas d'EIP-7702, aucune migration.
- **Payeur** : les wallets et les exchanges qui l'intègrent (B2B2C), sur le modèle de Blockaid avec MetaMask. L'utilisateur n'installe rien de compliqué.
- Les institutions et DORA sortent du cœur : une slide au maximum.

## 3. Le problème, chiffré
| Fait | Chiffre | Source |
|---|---|---|
| Vols sur wallets personnels, 2025 | 158 000 incidents, 713 M$ | Chainalysis [S] |
| Drainers (signature piégée), 2025 | 83,85 M$, 106 106 victimes, 790 $ en moyenne | Scam Sniffer [P] |
| Mécanisme des gros vols par drainer | permit/Permit2 : 38 % (2025) à 57 % (2024) | Scam Sniffer, via K_delais_drainers |
| Adresse piégée (empoisonnement) | 6 633 victimes réelles, 83,8 M$ en 2 ans ; un cas à 68 M$ (mai 2024) | étude CMU/USENIX [P] |
| Faux support | 1re source de pertes ; cas de 330 M$ (avril 2025) ; fuite Coinbase de mai 2025, coût estimé à 180-400 M$ | ZachXBT [S], Coinbase |
| Gel des fonds après coup | ~2 % gelés sur les 330 M$ ; aucun émetteur ne gèle sur simple demande | N4_gel_des_fonds |

Conclusion : une fois l'argent parti, presque rien ne revient. **Il faut agir avant.**

## 4. Les trois arnaques visées et pourquoi les outils actuels les ratent
| Arnaque | Ce que la victime croit faire | Ce qui se passe | Pourquoi MetaMask/Blockaid ne suffit pas |
|---|---|---|---|
| **Signature piégée** | « Je récupère un cadeau / un remboursement » | Elle signe un permit qui donne au pirate le droit de prendre tous ses USDC | À la signature, le solde ne bouge pas : la simulation affiche « 0 changement ». Un contrat de drainer créé il y a 10 min n'est dans aucune liste noire |
| **Adresse piégée** | « J'envoie vers mon compte Coinbase » | Elle envoie vers une adresse sosie (mêmes premiers et derniers caractères) | La simulation affiche « −2 000 USDC », exactement ce qu'elle attend : rien ne choque |
| **Faux support / manipulation** | « Le support m'a dit de sécuriser mes fonds » | Elle envoie tout à l'escroc | La transaction est techniquement normale. Mais **l'intention elle-même est le signal** : aucun vrai support ne demande ça |

## 5. Ce qui est neuf, et ce qui ne l'est pas (honnêteté)
- **Existe** :
  - les scanners de transaction et les simulateurs (Blockaid, MetaMask, Hypernative Wallet Protect) ;
  - deux prototypes « intention vs effet » : TetraHelix Guard (projet de hackathon HackQuest) et IntentGuard (papier étudiant ITB 2026) ;
  - dans les banques britanniques : Confirmation of Payee et questions de finalité contre la fraude au virement « autorisé ».
- **Notre différence, à confirmer par la recherche O_** :
  1. l'intention « on m'a demandé de le faire », qui attaque la manipulation et pas seulement le code ;
  2. les mots du grand public au lieu du jargon ;
  3. un modèle de décision (Clef de Cloudflare, sorti le 1er oct. 2026, ou Jev de TypeSafe) qui comprend la phrase libre et classe le message collé ;
  4. la mesure publique de nos faux positifs et faux négatifs ;
  5. l'attaque zéro-jour : on juge l'effet, pas la réputation.
- Aucun grand wallet ne pose la question de l'intention aujourd'hui (non contredit à ce stade).

## 6. Comment ça marche (technique, vulgarisé)
1. **Capter l'intention.** Un Snap MetaMask (extension officielle qui s'affiche dans MetaMask) propose 5 choix en mots simples :
   - « Je paie quelqu'un »
   - « J'envoie vers mon compte »
   - « J'achète ou j'échange une crypto »
   - « Je me connecte à un site / j'accepte une offre »
   - « On m'a demandé de le faire »

   L'utilisateur peut aussi taper une phrase libre ou coller le message reçu.
2. **Calculer l'effet réel.** Le moteur lit la transaction ou la signature et répond : qui reçoit quoi, qui obtient quel droit, si le destinataire est nouveau ou sosie d'une adresse connue, l'âge du contrat, la part du solde engagée. Décodage avec viem, simulation sur une copie locale de Fuji.
3. **Comparer.** Des règles déterministes écrites (tableau dans `docs/intent-barrier.md`). Par exemple, « Je paie quelqu'un » ne doit jamais accorder de droit.
4. **Comprendre ce qui est flou.** Clef ou Jev transforme la phrase libre en intention et classe le message collé (faux support, demande de seed, faux remboursement, faux recruteur). En dessous de 0,6 de confiance, on prévient sans bloquer.
5. **Afficher.** Un avertissement critique dans MetaMask, avec deux blocs « Tu as dit » et « En réalité », et les caractères différents d'une adresse sosie surlignés.

**Limite réelle** : un Snap peut exiger une confirmation supplémentaire, mais il ne peut pas interdire physiquement de cliquer. C'est la même limite que pour Blockaid. Côté transactions, la sévérité « critique » n'existe que sur MetaMask Flask ; côté signatures, l'alerte s'affiche après le clic sur Signer.

## 7. Démo (3 min, en live sur Avalanche Fuji)
1. On déploie un **drainer tout neuf** devant le jury, en une commande. Il n'est dans aucune liste noire.
2. **Faux site « remboursement »** : un juré dit « je récupère mon remboursement ». Sentinelle bloque : « Tu as dit : recevoir 50 USDC. En réalité : ce site obtiendrait le droit de prendre tous tes USDC. »
3. **Faux support** : conversation scriptée, marques fictives. L'utilisateur choisit « On m'a demandé de le faire » et colle le message. Clef le classe en faux support, et c'est bloqué.
4. **Adresse piégée** : sosie généré en direct, caractères différents surlignés.
5. **Témoin** : un vrai swap passe sans alerte, ce qui prouve qu'on ne bloque pas tout.
6. **Les chiffres** du banc d'essai : faux positifs, faux négatifs, latence.
7. **Final** : « Essayez de me piéger. »

## 8. Mesure : aucun chiffre en dur, tout sort d'un test réel
- Plus de 120 cas : 60 arnaques qui reproduisent les vrais schémas, 60 opérations honnêtes, et 30 messages. Chaque cas porte l'intention que la personne croyait avoir.
- **Faux négatif** : arnaque sans avertissement critique. **Faux positif** : opération honnête avec avertissement critique. **Fatigue** : opération honnête avec un avertissement quelconque. **Latence** : p50 et p95.
- Objectifs : 0 faux négatif sur la démo, moins de 2 % de faux positifs critiques, p95 sous 1,5 s sans Clef et sous 3 s avec.
- Ensuite : rejouer des jeux publics (PTXPHISH, PhreshPhish, base Scam Sniffer) sur une copie locale de la chaîne.

## 9. Lots de construction (T-101 à T-106)
| Lot | Contenu | Qui |
|---|---|---|
| T-101 | Contrats de démo : faux USDC avec permit, drainer redéployable, vrai routeur, générateur d'adresse sosie | Bedrock (Adem), en cours |
| T-102 | Moteur d'effets | **Titouan** |
| T-103 | Comparateur, Clef/Jev, API locale | Bedrock (Adem), en cours |
| T-104 | Snap MetaMask | **Titouan** |
| T-105 | Sites de démo et console du jury | **Titouan** |
| T-106 | Banc d'essai FP/FN | **Titouan** |

## 10. La boucle d'amélioration (à faire tourner toute la nuit)
1. **Construire** : les lots ci-dessus.
2. **Tester en vrai** : le banc d'essai tourne sur le code réel (aucune valeur en dur), les tests unitaires, la démo rejouée sur Fuji.
3. **Attaquer** : des agents red team écrivent de nouvelles arnaques pour contourner la barrière (multicall caché, permit déguisé, sosie à 3 caractères, injection de prompt dans le message collé). Chaque contournement trouvé devient un cas du banc.
4. **Juger** : des juges sans contexte (critères du jury : détection 30 %, faisabilité, innovation, clarté, conformité) notent à partir des résultats réels du banc, pas du discours.
5. **Corriger** : les lots se mettent à jour, puis on reprend à l'étape 2.

On arrête une boucle quand le banc ne progresse plus et que les juges ne trouvent plus de défaut nouveau.

## 11. Questions ouvertes pour le brainstorm Adem/Titouan
- Quelle idée « wow » ne marche qu'avec un modèle de décision qui répond en 39 ms ?
- Faut-il capter l'intention avant même d'ouvrir le site (Snap) ou au moment de signer ?
- Comment rendre le « Tu as dit / En réalité » impossible à ignorer sans agacer ?
- Quel avertissement pour une autorisation illimitée vers un routeur connu (le cas limite) ?
- Faut-il un contact de confiance qu'on prévient pour l'intention « on m'a demandé » ?
- Qui paie, en une phrase pour le jury ?

## 12. Référentiels
NIST CSF 2.0 : DE.CM, DE.AE, PR.AT. MITRE ATT&CK : T1566 (phishing), T1656 (usurpation d'identité), T1657 (vol financier).
