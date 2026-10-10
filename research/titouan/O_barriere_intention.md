# O. Barrière d'intention : synthèse des 6 recherches (Claude-Titouan, 11/10/2026)

Statut : synthèse de O0, O1 (antériorité), O2 (vocabulaire), O3 (stress-test), OA (mesure), OB (Snaps), OC (Clef/Jev). Dossier O_barriere_intention/. Plusieurs faits viennent de pages lues via des résumés : à revérifier avant tout slide. Rien n'est figé.

## 1. Verdict franc
La barrière tient face au « c'est juste un pop-up » seulement si elle est (a) mesurée contre des références, (b) suivie d'une réponse graduée, (c) auditable. Seule, elle se fait battre sur la réputation des contrats par Blockaid ou MetaMask natif. Sa vraie valeur : comparer le DROIT accordé à l'INTENTION déclarée, ce qu'une simulation de solde ne voit pas (permit).

## 2. Ce qu'on sait
- Antériorité (O1) : aucun projet identique trouvé. TetraHelix Guard = politique figée hachée on-chain ; IntentGuard = objet signé sans simulation ; presign-guard = phrase d'intention comparée à l'effet, mais pour agents IA, côté serveur. Ne pas dire « premier ».
- Snaps (OB, O1) : onTransaction et onSignature donnent payload, chainId, origine ; onSignature couvre personal_sign, eth_sign, EIP-712 v3/v4 (permits inclus). Aucun blocage dur : friction seulement (modale, case à cocher SIP-11 en Draft). severity critical = Flask pour onTransaction ; onSignature non tranché. Dialogue interactif, formulaire, état persistant, appel réseau (fetch CORS) possibles ; Fuji, localhost et snap_dialog depuis onTransaction non documentés. Seule une extension peut bloquer.
- Victimes (O2) : elles déclarent sincèrement une intention banale. Ce qui trahit l'arnaque : destinataire, tiers qui guide, urgence.
- Mesure (OA) : aucun concurrent ne publie définition de FP ni jeu de test ; chiffres vendeur seulement. Aucun jeu public de signatures Permit malveillantes : à fabriquer. 0 FP sur n transactions donne une borne ~3/n, donc 3 000 transactions légitimes pour affirmer moins de 0,1 %.
- Fatigue (OB) : clic-through de 70 % (Chrome) contre 33 % (Firefox) selon le design ; avertissements actifs suivis à 79 % ; OBIE 2021 (laboratoire, hypothétique) : bouton d'annulation -12 points de fraude, avec ciblage par risque -18 points (4 % de fraude).
- Clef/Jev (OC) : choice/noul/score donnent probabilités et confiance ; aucune calibration publiée ; injection : un schéma contraint ne protège pas d'un verdict manipulé. Concevoir pour ~200 ms et le quota gratuit.

## 3. Positions que je propose à Adem
1. Le comparateur final est du CODE. Le modèle comprend la phrase et classe un message ; il ne débloque jamais seul, il ne peut qu'aggraver ou escalader.
2. Deux chemins : fork Anvil pour les transactions ; décodage du typed data (viem) pour les signatures.
3. Filet indépendant de l'intention (spender neuf, droit illimité, signature opaque) ; « on m'a demandé » = risque maximal avec délai de refroidissement.
4. Réponse graduée et journal de chaque verdict (Réponse 20, Conformité 15), API de contrôle avant retrait pour pont vers fintech/exchange (Faisabilité).
5. Banc à 3 bras (sans intention, intention honnête, intention mensongère), règles pré-enregistrées par hash, split par famille d'attaque, publier n et les échecs. Cibles proposées (non sourcées) : FP critical ≤1/1000 avec borne, rappel ≥90 % connues et ≥70 % familles inédites, verdict p50 <2 s.
6. Aveux à garder : fraude « conforme » invisible, pas de blocage dur, pas de taux de production mesurable sur Fuji.

## 4. À tester cette nuit (lève les inconnues)
Snap minimal sur Flask + Fuji : modale sur onTransaction ET onSignature ; severity critical en signature sur la stable ; snap_dialog depuis onTransaction ; fetch vers une API localhost ; latence Workers AI réelle (Clef-flash vs Clef).

## 5. Décisions qui reviennent à Titouan
- Garder la réponse graduée et le journal dans le périmètre (oui proposé).
- Accepter qu'on ne bloque pas, on ralentit et on informe (ou prévoir l'extension).
- Quel scénario unique pour la démo (le drainer neuf est le plus fort, mais le faux support est le plus fréquent).
