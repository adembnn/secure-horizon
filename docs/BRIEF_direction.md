# Brief de direction : Hold up, barrière d'intention (D-007 à D-009)

> Pour Adem, Titouan et tous les agents. Contrat technique : `docs/intent-barrier.md`. Décisions : `coord/DECISIONS.md` D-007 (barrière d'intention), D-008 (un moteur, deux portes), D-009 (cœur = intention écrite contre effet réel, ce que MetaMask couvre déjà sort du cœur).
>
> Ancien nom : Sentinelle. C'est le même projet.

## 1. En une phrase
Avant qu'un particulier envoie ou signe quoi que ce soit avec son wallet normal, il dit en mots simples ce qu'il veut faire. Hold up calcule ce que l'opération fait **vraiment**. Si les deux ne correspondent pas, il retient la demande avec un message qui reprend ses propres mots : « Tu as écrit : je paie Paul. En réalité : ce site obtiendrait le droit de prendre tous tes USDC. »

Positionnement (D-009) : **« MetaMask te prévient de ce qu'il reconnaît ; Hold up vérifie ce que tu voulais faire. »**

## 2. Pour qui
- **Utilisateur** : le grand public, avec un wallet normal (MetaMask, Rabby, Core). Pas de Safe, pas d'EIP-7702, aucune migration.
- **Payeur** : les wallets et les exchanges qui l'intègrent (B2B2C), sur le modèle de Blockaid avec MetaMask. L'utilisateur n'installe qu'une extension.
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
| Arnaque | Ce que la victime croit faire | Ce qui se passe | Pourquoi un scanner de réputation ne suffit pas |
|---|---|---|---|
| **Signature piégée** | « Je récupère un cadeau / un remboursement » | Elle signe un permit qui donne au pirate le droit de prendre tous ses USDC | À la signature, le solde ne bouge pas : la simulation affiche « 0 changement ». Un contrat de drainer créé il y a 10 min n'est dans aucune liste noire |
| **Adresse piégée** | « J'envoie vers mon compte Coinbase » | Elle envoie vers une adresse sosie (mêmes premiers et derniers caractères) | La simulation affiche « −2 000 USDC », exactement ce qu'elle attend : rien ne choque. MetaMask couvre déjà ce cas par défaut (D-009), donc ce n'est plus notre scène cœur |
| **Faux support / manipulation** | « Le support m'a dit de sécuriser mes fonds » | Elle envoie tout à l'escroc | La transaction est techniquement normale. Mais **l'intention elle-même est le signal** : aucun vrai support ne demande ça |

## 5. Ce qui est neuf, et ce qui ne l'est pas (honnêteté)
- **Existe** :
  - les scanners de transaction et les simulateurs (Blockaid, MetaMask, Rabby, Hypernative Wallet Protect) ;
  - MetaMask couvre déjà, par défaut, l'adresse sosie (alerte bloquante), le premier envoi vers une adresse jamais vue, les alertes de sécurité sur transactions et signatures, et l'affichage lisible des Permit (D-009) : **on ne creuse plus ces directions** ;
  - deux prototypes « intention vs effet » : TetraHelix Guard (projet de hackathon HackQuest) et IntentGuard (papier étudiant ITB 2026) ;
  - dans les banques britanniques : Confirmation of Payee et questions de finalité contre la fraude au virement « autorisé ».
- **Notre différence, à confirmer par la recherche O_** :
  1. l'intention « on m'a demandé de le faire », qui attaque la manipulation et pas seulement le code ;
  2. les mots du grand public au lieu du jargon ;
  3. un modèle de décision (Clef de Cloudflare, sorti le 1er oct. 2026, ou Jev de TypeSafe) qui comprend la phrase libre et classe le message collé ;
  4. la mesure publique de nos faux positifs et faux négatifs ;
  5. l'attaque zéro-jour : on juge l'effet et la cohérence avec l'intention, pas la réputation.
- Aucun grand wallet ne pose la question de l'intention écrite aujourd'hui (non contredit à ce stade).

## 6. Comment ça marche (technique, vulgarisé)
La mécanique réelle est une **extension navigateur Manifest V3** (`research/titouan/T_banc_e2e/extension/`), pas un Snap MetaMask. Elle injecte son interface dans la page via Shadow DOM et intercepte la requête que le site envoie au portefeuille **avant** que la fenêtre du portefeuille s'ouvre. C'est aussi la seule porte qui voit les signatures hors chaîne. Détails : `docs/intent-barrier.md` et `docs/architecture.md`.

1. **Capter l'intention écrite.** Quand une opération donne un droit ou fait sortir des fonds, l'extension demande en mots simples ce que la personne veut faire, avec cinq familles :
   - « Je paie quelqu'un »
   - « J'envoie vers mon compte »
   - « J'achète ou j'échange une crypto »
   - « Je me connecte à un site / j'accepte une offre »
   - « On m'a demandé de le faire »

   L'utilisateur peut aussi taper une phrase libre ou coller le message reçu. Le texte est **une donnée**, jamais une instruction.
2. **Calculer l'effet réel.** Le moteur lit la transaction ou la signature sans l'exécuter : qui reçoit quoi, qui obtient quel droit (et s'il est **illimité**), l'âge du contrat, la part du solde engagée. Signatures lues dans les données typées EIP-712 (`written_check.js`) ; transactions rejouées en lecture seule via `debug_traceCall` sur le nœud du portefeuille (`effect_sim.js`).
3. **Comparer.** Des règles déterministes écrites (tableau dans `docs/intent-barrier.md`). Par exemple, « Je paie quelqu'un » ne doit jamais accorder de droit. Il existe un plancher objectif que l'intention écrite ne peut jamais abaisser.
4. **Comprendre ce qui est flou.** Clef ou Jev transforme la phrase libre en famille d'opération et classe le message collé (faux support, demande de seed, faux remboursement, faux recruteur). En dessous de 0,6 de confiance, l'intention est non classée : le moteur garde le plus strict des deux verdicts. Ce classifieur n'est **pas encore branché** dans le produit livré ; le repli par mots-clés, lui, est présent dans l'extension.
5. **Afficher.** Un écran binaire « Ça correspond / Ça ne correspond pas à ce que tu as écrit », avec les blocs « Tu crois » et « En vrai », une friction par niveau (attention, danger avec phrase à retaper puis délai, manipulation avec délai long), jamais de vert, et **Annuler toujours visible**.

**Limite réelle** : une extension peut retenir et exiger une attente, mais elle ne peut pas interdire physiquement de cliquer, ni voir un envoi lancé depuis le bouton « Envoyer » du wallet, le mobile ou WalletConnect. C'est la même limite d'ergonomie que Blockaid côté interface.

## 7. Démo (3 min, en live sur Avalanche Fuji)
Scène cœur (D-009) : une demande qu'un portefeuille juge banale mais qui ne correspond pas à l'intention écrite. On ne met plus l'adresse sosie en scène cœur (MetaMask la couvre déjà).

1. On déploie un **drainer tout neuf** devant le jury, en une commande. Il n'est dans aucune liste noire.
2. **Faux site « remboursement »** : un juré écrit « je récupère mon remboursement de 50 USDC ». Hold up retient : « Tu as écrit : recevoir 50 USDC. En réalité : ce site obtiendrait le droit de prendre tous tes USDC. »
3. **Faux support** : conversation scriptée, marques fictives. L'utilisateur choisit « On m'a demandé de le faire » et colle le message. Il est classé en faux support, et c'est retenu.
4. **Témoin** : un vrai swap passe sans alerte, ce qui prouve qu'on ne bloque pas tout.
5. **Les chiffres** du banc d'essai : faux positifs, faux négatifs, latence (lus depuis les fichiers de mesure, voir `README.md`).
6. **Final** : « Essayez de me piéger. »

## 8. Mesure : aucun chiffre en dur, tout sort d'un test réel
- Plus de 120 cas : 60 arnaques qui reproduisent les vrais schémas, 60 opérations honnêtes, et 30 messages. Chaque cas porte l'intention que la personne croyait avoir.
- **Faux négatif** : arnaque sans avertissement critique. **Faux positif** : opération honnête avec avertissement critique. **Fatigue** : opération honnête avec un avertissement quelconque. **Latence** : p50 et p95.
- Objectifs : 0 faux négatif sur la démo, moins de 2 % de faux positifs critiques, p95 sous 1,5 s sans Clef et sous 3 s avec.
- Les chiffres mesurés renvoient à leurs fichiers sources (voir `README.md`) ; aucun résultat n'est écrit à la main.
- Ensuite : rejouer des jeux publics (PTXPHISH, PhreshPhish, base Scam Sniffer) sur une copie locale de la chaîne.

## 9. Lots de construction
| Lot | Contenu | Qui |
|---|---|---|
| Contrats de démo | faux USDC avec permit, drainer redéployable, vrai routeur, générateur d'adresse sosie | Bedrock (Adem) |
| Moteur d'effets | décodage et simulation en lecture seule | **Titouan** |
| Comparateur, Clef/Jev, API locale | règles déterministes, plancher objectif, serveur de vérification | Bedrock (Adem) |
| Extension navigateur MV3 | injection Shadow DOM, interception, écrans de retenue | **Titouan** |
| Sites de démo et console du jury | faux sites, drainer Fuji | **Titouan** |
| Banc d'essai FP/FN | mesure sur le code réel | **Titouan** |

## 10. La boucle d'amélioration (à faire tourner toute la nuit)
1. **Construire** : les lots ci-dessus.
2. **Tester en vrai** : le banc d'essai tourne sur le code réel (aucune valeur en dur), les tests unitaires, la démo rejouée sur Fuji.
3. **Attaquer** : des agents red team écrivent de nouvelles arnaques pour contourner la barrière (multicall caché, permit déguisé, injection de prompt dans le message collé). Chaque contournement trouvé devient un cas du banc.
4. **Juger** : des juges sans contexte (critères du jury : détection 30 %, faisabilité, innovation, clarté, conformité) notent à partir des résultats réels du banc, pas du discours.
5. **Corriger** : les lots se mettent à jour, puis on reprend à l'étape 2.

On arrête une boucle quand le banc ne progresse plus et que les juges ne trouvent plus de défaut nouveau.

## 11. Questions ouvertes pour le brainstorm Adem/Titouan
- Quelle idée « wow » ne marche qu'avec un modèle de décision qui répond en quelques dizaines de ms ?
- Comment rendre le « Tu crois / En vrai » impossible à ignorer sans agacer ?
- Quel avertissement pour une autorisation illimitée vers un routeur connu (le cas limite) ?
- Faut-il un contact de confiance qu'on prévient pour l'intention « on m'a demandé » ?
- Qui paie, en une phrase pour le jury ?

## 12. Référentiels
NIST CSF 2.0 : DE.CM, DE.AE, PR.AT. MITRE ATT&CK : T1566 (phishing), T1656 (usurpation d'identité), T1657 (vol financier).
