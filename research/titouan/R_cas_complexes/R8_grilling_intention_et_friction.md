# R8 - Mini "grilling" d'intention et friction forcée

Date : 2026-10-11. Sources internes lues : docs/intent-barrier.md, O2 (vocabulaire victimes), O3 (stress test), OB (Snaps et avertissements). Recherche web complémentaire (WebSearch ; un PDF illisible par WebFetch).

Étiquettes : **[P]** primaire (doc officielle, étude d'origine, décision publique d'un organisme) ; **[S]** secondaire (presse, blog, résumé, ou chiffre repris d'un résumé de moteur) ; **[V]** à vérifier / proposition de conception de ma part, non prouvée. "Non trouvé" = absent des sources consultées. Aucun chiffre inventé : les seuils proposés sont des paramètres à calibrer, signalés [V]. Aucun secret lu ou écrit.

Limite générale : les résumés web viennent d'un moteur et d'un petit modèle ; les chiffres [S] sont à relire à la source avant d'être cités en pitch.

---

## 0. Principe directeur en 6 lignes

1. Le dialogue ne remplace pas le moteur d'effets ; il ajoute un second canal d'information. Le verdict objectif (droits accordés, destinataire inconnu, sosie, part du solde) existe AVANT toute réponse.
2. **Asymétrie** : une réponse peut seulement faire monter le niveau de risque, jamais le faire descendre sous le plancher objectif. Mentir pour rassurer ne rapporte donc rien.
3. Les questions n'ont de valeur que si la vérité les rend "bavardes" : on cherche des réponses honnêtes qui trahissent (tiers qui guide, urgence, inconnu) ou des réponses qui contredisent un fait vérifiable (historique, âge du contrat).
4. Déclenchement uniquement sur risque, 2 à 4 questions, arrêt dès que le niveau est tranché (inutile de laisser un escroc "répéter" des réponses).
5. Verdict noir = friction forcée proportionnée, sortie toujours visible, sans pénalité, sans vert "OK".
6. Contrainte technique forte (OB) : un Snap ne peut pas bloquer ; il ajoute de la friction dans son interface. La friction "forcée" au sens strict suppose une page compagnon ou une extension. À dire clairement au jury.

---

## 1. Conception du dialogue

### 1.1 Quand déclencher (et quand se taire)

Rappel du coût : une barrière appliquée à 100 % des transactions crée de l'habituation (O3 jury 2 ; PSR 2025 [P] parle de "fatigue cognitive et mémoire musculaire").

Déclencheurs de risque (reprennent les signaux de intent-barrier.md), un seul suffit :
- destinataire jamais vu par l'utilisateur (`firstSeenByUser = false`) ou sosie (`lookalikeOf`) ;
- approbation, permit, Permit2, setApprovalForAll, délégation 7702 ;
- signature opaque ou typed data inconnu ;
- contrat âgé de moins de N blocs ; part du solde sortant > 50 % ; montant au-dessus d'un seuil personnel [V] ;
- intention vague, contradictoire, ou "on m'a demandé de le faire" cochée ;
- message collé (`pastedMessage`) classé suspect par le classifieur fermé de Clef/Jev (le LLM ne décide pas : il classe dans un ensemble fermé, règle O3 jury 3).

Pas de dialogue : transfert vers contact déjà connu et utilisé, swap sur routeur connu avec approbation plafonnée, montant faible, aucune des conditions ci-dessus. Mesure obligatoire : taux d'interruption sur le jeu légitime (objectif O3 : FP critical < 2 % ; le taux d'interruption est à publier avec son dénominateur).

### 1.2 Format technique des questions (compatibilité API "choice" de Jev)

Je n'ai pas trouvé dans les fichiers lus le schéma exact de l'API choice de Jev : **non trouvé**. Hypothèse de contrat minimal, à aligner avec Jev [V] :

```json
{
  "stepId": "q_guidance",
  "prompt": "Quelqu'un te guide en ce moment (appel, chat, partage d'écran) ?",
  "options": [
    { "id": "no_alone",  "label": "Non, je fais ça seul(e)" },
    { "id": "yes_call",  "label": "Oui, quelqu'un me parle au téléphone" },
    { "id": "yes_chat",  "label": "Oui, par message ou chat" },
    { "id": "yes_screen","label": "Oui, il/elle voit mon écran" },
    { "id": "prefer_not","label": "Je préfère ne pas répondre" }
  ],
  "multi": false,
  "shuffle": false
}
```
Règles : choix fermés (pas de texte libre dans le dialogue, sauf l'intention initiale), toujours une option "je ne sais pas / je préfère ne pas répondre" (traitée comme un signal d'incertitude, pas comme un aveu), identifiants stables pour le journal local, ordre des options variable d'une session à l'autre quand c'est sans incidence (anti-habituation, cf. Vance et al. "polymorphes" [S] via OB). Dans le Snap : formulaire `Form` + `RadioGroup`/`Selector` + `onUserInput` [P] (OB 1.5) ; l'interface interactive dans l'onglet d'une transaction n'est pas documentée avec exemple : à tester [V].

### 1.3 Arbre de décision (2 à 4 questions)

Entrée : intention déclarée (ou absente) + Effects + signaux. Sortie : niveau final (`ok` / `warn` / `critical`) et raisons FR. Le niveau objectif N0 est calculé avant tout.

```
N0 = verdict du moteur (règles déterministes, sans réponses)
Si aucun déclencheur : pas de dialogue, N0.

ÉTAPE A (0 ou 1 question) - CLARIFIER L'INTENTION, seulement si vague/contradictoire/absente
  A1 "Parmi ces phrases, laquelle ressemble le plus à ce que tu veux faire ?"
      [5 intentions fermées + "autre / je ne sais pas"]
  - "autre / je ne sais pas" -> intention = UNKNOWN : attentes les plus strictes
    (aucun droit accordé, aucune sortie vers destinataire inconnu). Jamais plus laxiste.
  - Si le texte libre contredit le choix (ex. texte "on m'a dit d'envoyer", choix "j'envoie vers mon compte") -> retenir le choix le plus suspect.

ÉTAPE B (1 à 3 questions) - CONTEXTE SOCIAL, choisies selon le déclencheur
  B1 Origine : "D'où vient cette demande ou cette adresse ?"
       moi-même / un contact enregistré / quelqu'un rencontré en ligne ou au téléphone / un site ou une appli / je ne sais plus
  B2 Familiarité : "As-tu parlé à cette personne ou cette organisation avant aujourd'hui ?"
       oui, depuis longtemps / oui, depuis quelques jours / non, c'est la première fois / ce n'est pas une personne
  B3 Pression : "Te demande-t-on d'aller vite ou de ne pas en parler ?"
       non / oui, d'aller vite / oui, de ne pas en parler / les deux
  B4 Guidage : "Quelqu'un te guide en direct ?" (options en 1.2)

ÉTAPE C - RÈGLE DE SORTIE (monotone : les réponses ne font que monter)
  réponse "à signal" (tiers inconnu qui guide, urgence, secret, première fois) = +1 cran
  réponse contradictoire avec un fait vérifiable = +2 crans (voir 1.5)
  "je préfère ne pas répondre" = +1 cran, mais jamais traité comme un aveu
  aucune réponse ne baisse le niveau sous N0
  deux signaux sociaux (guidage + urgence, ou secret + tiers inconnu) + sortie de fonds ou droit accordé = critical (noir)
  arrêt anticipé : dès que critical atteint, on passe à la friction (pas de question supplémentaire)
```

Choix des questions par déclencheur (pour rester à 2-4) :

| Déclencheur | Questions posées (ordre) |
|---|---|
| Nouveau destinataire + sortie | B1, B2, B3 |
| Approbation / permit / signature opaque | A1 si intention absente, B1, B4 |
| Intention "on m'a demandé" | B1, B4, B3 (qui, guidage, pression) |
| Intention vague | A1 puis déclencheur résiduel |
| Sosie d'adresse | aucune question sociale d'abord : alerte "cette adresse ressemble à X mais n'est pas X" (le fait objectif prime), puis B1 |

### 1.4 Exemples concrets par intention

Les exemples suivent les scénarios de O2 (S1 à S8). Les textes sont des propositions [V].

**1) "Je paie quelqu'un" - destinataire jamais vu, montant important**
- Écran : "Tu veux payer quelqu'un. Cette adresse n'a jamais reçu d'argent de toi."
- B1 "D'où vient cette adresse ?" : *quelqu'un me l'a envoyée par message / je l'ai copiée de mon historique / elle est dans mon carnet*.
- B2 "As-tu parlé à cette personne avant aujourd'hui ?" : *non, première fois*.
- Sortie : nouveau destinataire + première fois + montant élevé = critical -> friction. Contrepoint O2 S4 : si l'adresse est un sosie d'une adresse de l'historique, le fait objectif suffit, sans question.

**2) "J'envoie vers mon propre compte" - le piège du faux "compte sécurisé" (S1, S3)**
- Fait vérifiable : l'adresse est-elle liée à un compte de l'utilisateur (historique, carnet, exchange déclaré) ?
- B1 "D'où vient l'adresse de ce compte ?" : *je l'ai créée moi-même / l'appli de mon exchange me l'a affichée / quelqu'un m'a donné l'adresse ou un QR code*.
- Contradiction : intention "mon compte" + origine "quelqu'un m'a donné l'adresse" = +2 crans (on ne reçoit pas d'un tiers l'adresse de son propre compte). Critical, et message dédié : "Aucun vrai support ne demande de déplacer des fonds vers un autre portefeuille pour les protéger."

**3) "J'achète une crypto" - achat réel, livraison vers l'escroc (S3, S5, S6)**
- B4 "Quelqu'un te guide en direct ?" et B1 "Qui t'a conseillé d'acheter ?" : *moi-même / un ami / une personne rencontrée en ligne / un conseiller qui m'a contacté*.
- Une victime de pig butchering répond sincèrement "personne rencontrée en ligne" (O2 : Wilkerson, Mangum auraient coché "j'investis"). Signal : tiers inconnu + guidage. Sans cette réponse, la tx est conforme et invisible (cas B de O3).

**4) "Je me connecte / j'accepte une offre" - le faux airdrop (S7)**
- Fait objectif : une connexion légitime n'accorde aucune sortie ni droit. Si la transaction ou signature accorde une approbation, le moteur dit critical sans question (tu as dit "recevoir/te connecter", ça autorise un tiers à dépenser).
- Question utile uniquement si la signature est opaque : B1 "Comment as-tu trouvé ce site ?" : *je l'ai tapé / lien dans un message ou une pub / on me l'a envoyé*.

**5) "On m'a demandé de le faire" - le signal le plus riche (O3 6.1-D)**
- A1 inutile (intention claire). Enchaîner B1 "Qui te l'a demandé ?" (*banque / support d'un exchange ou d'un wallet / conseiller ou investisseur / recruteur ou employeur / ami ou famille / autre*), B4 guidage, B3 pression.
- Règle : support ou conseiller + sortie de fonds ou droit = critical sans autre condition (déjà dans intent-barrier.md). Le dialogue sert ici à choisir le message (vocabulaire de l'arnaque identifiée) et à lancer le refroidissement.

**6) Intention vague ou contradictoire**
- Texte libre : "je fais un truc", "pour mon wallet", ou "j'achète à un ami" avec un montant sans lien (swap).
- A1 : reformulation en 5 phrases fermées + "autre / je ne sais pas". Si "autre/je ne sais pas" : intention UNKNOWN, attentes strictes. Si la phrase libre contredit la case choisie, on garde le cas le plus suspect et on le dit : "Tu as écrit X et choisi Y. Ce n'est pas la même chose."
- Principe : la vague n'est jamais récompensée (voir réponse 5.2).

### 1.5 Questions de clarification qui piègent le faux conseiller sans le dire

Fonction de chaque question, et pourquoi la réponse honnête trahit :

| Question | Pourquoi elle trahit | Contradiction vérifiable associée |
|---|---|---|
| "Qui t'a demandé ça ?" (avec options explicites et neutres) | Un faux support/banquier/conseiller est un tiers qui a pris l'initiative ; la victime sincère le nomme | intention "mon compte" + "quelqu'un m'a donné l'adresse" |
| "As-tu parlé à cette personne avant aujourd'hui ?" | Contact initié par l'escroc, souvent récent ; "première fois / depuis quelques jours" coïncide avec nouveau destinataire | `firstSeenByUser = false` et "depuis longtemps" -> contradiction (+2) |
| "Te demande-t-on d'aller vite ou de ne pas en parler ?" | L'urgence et le secret sont les deux ressorts documentés (Which? [S], FTC/Michigan via O2 : thème "ne dites rien à la banque") | aucune ; signal pur |
| "Quelqu'un te guide en direct ?" | Le guidage téléphonique/partage d'écran est le marqueur du faux support (O2 S1, S2, S3 ; UK Finance Toolkit [S] : les fraudeurs coachent) | aucune ; signal pur |
| "As-tu déjà envoyé à cette adresse ?" | La réponse "oui" est vérifiable contre l'historique | contradiction directe avec `firstSeenByUser` |

Règles de formulation :
- Ne jamais écrire "es-tu victime d'une arnaque ?" ni "est-ce un escroc ?" : on ne nomme pas le diagnostic, on décrit des faits observables.
- Options plausibles des deux côtés (pas de réponse "évidemment correcte") : si une seule option est visiblement la bonne, le coach souffle "réponds non".
- Polarité mélangée : parfois l'option rassurante est en tête, parfois non ; libellés alternés [V].
- Une seule question par écran, pas de retour arrière silencieux (un retour est journalisé comme signal).
- Introduction courte, honnête : "Quelques questions de plus parce que cette opération sort de tes habitudes." Pas de menace.

### 1.6 Ce qu'on fait des réponses

- Elles alimentent un score monotone (§1.3) et le choix du message : l'écran final reprend les mots de l'utilisateur ("tu as dit : on m'a demandé / un conseiller te guide ; ça envoie 80 % de ton solde à une adresse jamais vue").
- Stockage : état local `snap_manageState`, chiffré, TTL court (comme `declaredAt` 10 min), aucun envoi au serveur du texte libre sans consentement (O3 jury 3). Journal local pour la mesure uniquement, avec accord du testeur.
- Les réponses ne servent jamais à "débloquer" : elles ne changent pas N0 vers le bas.
- "Je préfère ne pas répondre" : +1 cran et le message l'explique ("sans réponse, on applique la règle prudente"). Pas de reproche.
- Hors transaction (S2, phrase secrète) : le dialogue ne couvre rien ; message statique dans l'onHomePage : "Aucun support légitime ne demande ta phrase secrète" (O2 : intention peu discriminante).

---

## 2. Ce que disent les preuves

### 2.1 Ce qui marche (avec niveau de preuve)

| Constat | Source | Étiquette |
|---|---|---|
| Expériences randomisées OBIE (fév. 2021, ~8 600 analysés sur 10 000 visés) : témoin 22 % de paiements frauduleux ; boutons d'appel à l'action (annuler, mettre de côté, appeler la banque) -12 pts ; CTA + texte comportemental -14 pts ; approche basée sur le risque + CTA -18 pts (4 % de fraude) ; texte comportemental seul -4 pts ; risque seul non significatif sur la fraude. Effet secondaire : les CTA réduisent aussi les paiements légitimes (jusqu'à -14 pts). Laboratoire, gains fictifs | Repris de OB (document OBIE), non relu ici | [P], conditions de laboratoire |
| CeDEx Nottingham (discussion paper 2023-08) : ~10 000 adultes UK, 8 conditions, app bancaire simulée. D'après le résumé lu : les avertissements comportementaux réduisent la part de victimes (~18 %) mais l'effet s'estompe quand le participant rencontre plus d'arnaques ; l'appel à l'action garde son effet (un résumé cite -94 % de paiements frauduleux au 3e scénario : chiffre NON vérifié, PDF illisible par l'outil) | résumé de moteur ; fichier enregistré dans le dossier tool-results mais non lu | [S], à relire avant citation |
| Interruption active > passive (79 % suivent un avertissement actif, Egelman 2008) ; attracteurs "inhibiteurs" x2 à x3 sur les décisions informées, sans baisse due à l'habituation quand ils forcent l'interaction avec le texte clé (Bravo-Lillo SOUPS) ; clic-through SSL 70 % vs 33 % selon le design (Akhawe & Felt 2013) | repris de OB | [S]/[P] |
| Avertissements "polymorphes" : moins d'habituation sur 3 semaines (Vance et al., MISQ 2018) | repris de OB | [S] |
| Singapour : délai de 12 h pour tout nouveau bénéficiaire chez DBS (et chez d'autres banques) ; depuis le 15 oct. 2025, retenue de 24 h ou rejet pour les vidages rapides de comptes (solde >= 50 000 S$, plus de la moitié sortie) ; l'ABS dit que les mesures cumulées ont évité 78 M S$ en 7 mois (chiffre auto-déclaré, non attribuable au seul délai). Les régulateurs parlent de "cognitive break" | blogs financiers, communiqués ABS (résumés) | [S], aucun avant/après isolé trouvé |
| Australie : NAB signale ~240 000 $/jour de paiements abandonnés grâce aux alertes de paiement ; baisse ~25 % des pertes sur T4 2023, attribuée à plusieurs mesures. CBA a posé un délai de 24 h sur certains paiements vers des échanges crypto. ANZ : -24 % de pertes (oct. 2025 à juin 2026), mesures groupées | communiqués des banques via résumé | [S], auto-déclaré, non isolé |
| Revolut : appel in-app pour "casser le sort" des usurpations (janv. 2025) | presse tech | [S], aucun chiffre |
| Une étude 2025 (n = 137, Arabie saoudite et RU) : annulations 57,4 % sans avertissement -> 96,1 % avec avertissements cumulés | résumé de moteur ; petit échantillon, hypothétique | [S], faible |

Ce qui ressort : l'ingrédient commun aux effets les plus nets est **une action simple d'annulation proposée au bon moment** plus de l'interruption active, pas le texte d'avertissement seul. Les questions n'ont pas de mesure d'effet propre.

### 2.2 Questions de finalité de paiement : preuve manquante

- Questions de finalité, taux de contournement, part de faux motifs choisis : **non trouvé** (même conclusion que OB). Les banques (Monzo, Starling, Barclays, Revolut, Wise) ne publient pas d'évaluation isolée que j'aie pu trouver.
- Ce qui existe, ce sont des décisions du Financial Ombudsman Service britannique, **[P] en tant que documents, mais ce sont des cas individuels et non des statistiques** : elles décrivent des flux "avertissement -> motif du paiement -> avertissement personnalisé -> chat" et montrent que (a) un avertissement générique ou "qui ressemble à une étape administrative" est jugé inefficace, (b) l'avertissement doit "faire vivre" l'arnaque (safe account, usurpation de police), (c) le coaching est un fait connu : l'ombudsman écrit que les banques doivent s'attendre à ce que les fraudeurs poussent la victime à tromper la banque, et dans un cas la victime avait été briefée à l'avance sur les avertissements et sur le motif à donner. Un flux Starling affiche déjà "Fraudsters will tell you how to answer these questions" : c'est un prebunking déjà en production, dont je n'ai pas trouvé l'effet mesuré.
- Confirmation of Payee : 2 milliards de vérifications (Pay.UK, mars 2024) [S] ; baisse de 2 % de la fraude totale et 1 % de l'APP S1 2023 attribuée à l'ensemble des mesures [S] ; ~8 % des adultes continuent malgré un "no match" (enquête commanditée par Lloyds) [S] ; CoP n'aide pas contre les arnaques où le bénéficiaire existe vraiment (achat, faux conseiller avec vrai compte) [S]. Équivalent pour nous : le "no match" correspond à l'écart intention/adresse ; son plafond est le même.
- "Warning with friction" (régime APP UK depuis oct. 2024 [S]) : le PSR emploie "interventions", sur mesure et activement portées à l'attention du client ; elles comptent dans l'exception de négligence grave. Age UK reproche l'absence d'obligation de prouver l'efficacité ; la FCA attend conception, test, adaptation, suivi [S]. Utile pour notre argumentaire : mesurer est attendu par les régulateurs.

### 2.3 Messages personnalisés

- Preuve directe de l'effet de "reprendre les mots de l'utilisateur" : **non trouvé** (déjà noté dans OB). Preuves indirectes : tailoring et contextualisation recommandés par UK Finance/Thinks Insight (2024) et par le PSR (2025) [S]/[P] ; décisions d'ombudsman qui sanctionnent la généricité [P, cas individuels] ; OBIE : le ciblage par risque seul ne suffit pas, il faut l'action d'annulation [P].
- Conclusion de travail [V] : la personnalisation sert à (1) faire lire (varier, rompre le "papier peint"), (2) rendre l'écart indéniable (la phrase de la victime en regard de l'effet), mais l'effet comportemental vient du **geste** proposé (annuler, attendre, appeler quelqu'un), pas de la phrase seule.

### 2.4 Délais de refroidissement

- Pour : mécanisme plausible (la fraude repose sur l'urgence ; un délai la brise ; les fonds crypto partis ne reviennent pas) ; adopté par plusieurs banques à Singapour et en Australie [S]. Pour nous, le cas B de O3 (fraude "conforme", effet = intention) n'a pas d'autre parade.
- Contre / incertain : aucune évaluation isolée trouvée ; coût en paiements légitimes (la CBA et d'autres l'admettent) ; Tunic Pay/Opinium : 75 % jugent un retard jusqu'à 72 h inefficace (opinion déclarée, [S] via OB) ; MAS réexamine l'équilibre protection/ralentissement [S].
- Délai court recommandé pour un wallet [V] : l'utilisateur crypto, lui, peut simplement refaire la transaction ailleurs (aucune autorité n'impose). Le délai est donc un outil de refroidissement volontaire, pas un blocage.

### 2.5 Dark patterns, fatigue, friction éthique

- Les régulateurs distinguent friction utile et "sludge" : le Consumer Duty de la FCA attend que les firmes prouvent par tests (A/B, audit de sludge) que le design aide les décisions ; la friction trop forte décourage de bonnes décisions, trop faible laisse passer les mauvaises [S via cabinets d'avocats, FCA non lu directement].
- Typologie des dark patterns (confirmshaming, obstruction, questions pièges, interface interference) [S, revue de 642 sites, FTC-ICPEN-GPEN] : **notre friction touche trois d'entre eux** si elle est mal conçue : (1) confirmshaming (texte honteux sur le bouton de sortie : "Non, je préfère perdre mon argent"), (2) obstruction (rendre le contournement impossible), (3) trick questions (négations, double négations). À proscrire explicitement.
- Fatigue : voir §2.1 (Vance, Bravo-Lillo, PSR). Parades déjà listées dans O3 : conditionnel, gradué, varié, rare.
- Risque propre au grilling : l'interrogatoire peut être vécu comme infantilisant ou accusateur et être contourné ("clique n'importe quoi"). Mesure : temps de réponse anormalement court, réponses identiques répétées -> indicateur de fatigue [V].

### 2.6 Coaching par l'escroc : concevoir des questions robustes

Faits : les fraudeurs briefent les victimes sur les avertissements et le motif à donner [P/S : ombudsman, Which?, UK Finance]. Une question simple ("c'est pour quoi ?") se contourne ; une question dont la bonne réponse est évidente aussi.

Principes de conception [V], ordonnés du plus solide au plus fragile :

1. **Ne pas dépendre de la réponse** : plancher objectif N0 + montée seule (§0). Le coaching ne peut qu'enlever des signaux supplémentaires, jamais fabriquer un "ok".
2. **Contradiction avec un fait vérifiable** : le coach doit connaître le compte de la victime. Il ne sait pas si l'adresse a déjà reçu un envoi, quand le contrat a été déployé, ni ce que dit l'historique ; la victime qui répond "oui, depuis longtemps" sur une adresse neuve se trahit par la machine, pas par la question.
3. **Questions factuelles ouvertes à plusieurs bonnes réponses plausibles** : l'escroc ne peut pas souffler "la" réponse sûre. Exemple : "Comment as-tu reçu cette adresse ?" avec 5 options toutes plausibles ; seule l'option "quelqu'un me l'a donnée" accuse, et l'escroc ne sait pas laquelle l'application sanctionne.
4. **Variation** : ordre des options, reformulation, sous-ensemble de questions variable d'une session à l'autre. Un script appris par cœur ("réponds non à tout") ne marche plus si "non" n'est pas toujours la bonne réponse.
5. **Prebunking intégré à l'écran** : "Si quelqu'un te dicte quoi répondre, c'est un signal d'arnaque." Existe en production chez Starling (cité par l'ombudsman) ; effet mesuré : non trouvé. Je le propose comme hypothèse à tester, avec le risque connu de n'être pas lu sous panique.
6. **Rompre le guidage** : la meilleure question est un geste qui interrompt l'appel ("pose ton téléphone une minute, relis ceci"). L'escroc demandera de ne pas le faire : la réaction (refus/abandon) est elle-même mesurable en test. Hypothèse, non prouvée.
7. **Ne pas demander de la sincérité aux seuls mots** : privilégier des champs qui obligent à regarder l'écran (retaper les 4 derniers caractères de l'adresse, voir §3).

Limite assumée : un escroc qui connaît le système peut préparer des réponses cohérentes avec les faits ; il ne peut pas masquer ce qui est objectivement dangereux. Reste la fraude conforme (O3 cas B) : seul le refroidissement agit.

---

## 3. Conception de la friction forcée (verdict noir)

### 3.1 Formes, de la plus douce à la plus forte

| Forme | Description | Pourquoi | Limite |
|---|---|---|---|
| F1 Attente chronométrée | Bouton "Continuer malgré l'alerte" grisé N secondes, "Annuler" actif tout de suite ; le compte à rebours affiche une phrase utile, pas un écran vide | Retarde l'action (attracteur "inhibiteur", Bravo-Lillo [S]) ; brise l'urgence | Contournable en attendant ; N à calibrer [V] (ordre de 10 à 30 s pour l'in-session, bien plus pour un refroidissement) |
| F2 Retaper une partie de l'adresse | Saisir les 4 premiers et 4 derniers caractères du destinataire, ou le montant | Force la lecture ; fait échouer le copier-coller aveugle ; contre sosies | L'escroc peut dicter les caractères ; ça ralentit mais ne prouve pas la compréhension |
| F3 Relire une phrase et la confirmer | "Je comprends que ceci envoie X à une adresse que je n'ai jamais utilisée." Case non pré-cochée, ou choix entre 2 phrases dont une est fausse | Force l'interaction avec le texte clé (attracteurs forçant l'interaction, sans habituation [S]) | Si la phrase est toujours la même, elle devient réflexe : la varier |
| F4 Confirmation à deux temps | Deux écrans séparés par une action différente (ex. 1: cocher + attendre, 2: saisie adresse), ou deuxième confirmation 15-30 min plus tard | Casse le rythme du guidage | Coût de friction ; seuil de déclenchement strict |
| F5 Appel d'un proche, optionnel | "Veux-tu prévenir quelqu'un de confiance avant de continuer ?" lien vers un message prérédigé à envoyer, ou numéro enregistré | Appelle un tiers qui n'est pas sous l'influence de l'escroc ; recommandé par Revolut dans sa logique d'appel (non mesuré) [S] | Optionnel seulement : forcer un contact peut être vécu comme intrusif/inacceptable, et l'escroc coache le silence |
| F6 Refroidissement | Reporter l'action : "Revenir dans 1 h / demain", rappel via notification | Réponse aux fraudes conformes (O3 B) ; équivalent des délais SG/AU | Un Snap ne peut pas bloquer ; seul un contournement plus coûteux ; adoption volontaire [V] |

Combinaison conseillée pour "noir" [V] : F3 (phrase variable) + F2 (retaper fragment) + F1 court, F5 en offre ; F6 proposé à l'utilisateur, jamais imposé. Pour "gris foncé/warn" : F3 seul ou aucun.

### 3.2 Réalité technique (à ne pas surestimer)

Sources OB : un Snap ne peut ni refuser une transaction ni obliger MetaMask à attendre ; `severity: critical` en onTransaction est Flask-only ; en onSignature le contenu s'affiche seulement avec severity critical et après le clic "Sign" ; SIP-11 (Draft) exige de cocher une case [S]. Donc :
- **Dans le Snap** : friction réelle dans NOTRE modale (F1 à F3 faisables si l'UI interactive fonctionne dans ce contexte : à tester), mais l'utilisateur peut encore cliquer "Confirmer" dans MetaMask. La friction est un obstacle, pas un verrou.
- **Verrou réel** : page compagnon qui précède la dapp (§1.11 option 5 d'OB) ou extension qui enveloppe `window.ethereum.request`. Coût : confiance, installation, maintenance.
- Dans le pitch : "friction forte dans le Snap, blocage réel via la page compagnon ; nous n'affirmons pas que le Snap interdit la signature".

### 3.3 Seuils (paramètres à calibrer sur le banc, pas des vérités)

- Noir (friction forcée) : (droit illimité ou persistant) + spender/contrat neuf ; OU intention "on m'a demandé" + support/conseiller + sortie ou droit ; OU destinataire sosie ; OU contradiction vérifiable (+2) + montant significatif ; OU signature opaque sans intention de connexion. Ensemble étroit pour que le rouge garde du poids (O3 6.2).
- Jaune/ambre : écart intention/effet sans danger objectif (voir 5.2), nouveau destinataire de petit montant, 1 signal social isolé.
- Part de solde (50 %), N blocs, seuil de montant : valeurs de départ de intent-barrier.md (50 % existe déjà) ; le reste est à choisir sur le jeu de test [V].
- Objectif de fatigue : FP critical < 2 % sur le jeu légitime (déjà fixé). Taux d'interruption total à publier.

### 3.4 Sortie, ton, vocabulaire

- **Sortie toujours visible** : bouton "Annuler, je ne fais rien" à gauche, même taille, actif immédiatement, jamais grisé, jamais après un compte à rebours. "Continuer malgré l'alerte" existe, sans honte, sans texte culpabilisant, sans pénalité (pas de verrouillage ultérieur, pas de message "tu as ignoré").
- **Jamais de vert "OK"** : pas de vert sur un verdict, même le plus bas. Palette : gris neutre (rien détecté à ce stade), ambre, rouge. "Rien d'anormal détecté" plutôt que "OK" ou "Sûr" ; ne jamais écrire "transaction sûre". Raison : l'absence d'alerte ne vaut pas garantie (fraude conforme).
- Libellés actifs et factuels : "Annuler" / "Continuer quand même" (pas "Confirmer" tout court, pas "OK"). Pas de double négation, pas de bouton de sortie en petit gris (obstruction/dark pattern, §2.5).
- Phrase type : "Tu as dit : [phrase]. Cette opération : [effet]. Une personne qui te guide en direct est un signal courant d'arnaque." Pas de mot "arnaque" affirmé : on décrit des faits et un signal ("courant dans les arnaques").
- Ne pas bloquer la personne dans une boucle : maximum une friction par transaction.

### 3.5 Mesurer le contournement

Événements journalisés localement (avec accord) : `friction_shown(form, level)`, `exit_cancel`, `exit_continue`, `time_to_decision_ms`, `retype_errors`, `answers_changed`, `back_pressed`, `phone_call_pause_accepted`. Indicateurs, avec dénominateur :
- Taux de contournement = continuations malgré friction / frictions affichées, par scénario (piège vs légitime).
- Temps médian d'arrêt (si ~0 s sur la friction, c'est de l'habituation).
- Taux de contournement parmi les cas piège (nous voulons bas) et parmi les cas légitimes (acceptable plus haut ; l'écart entre les deux mesure l'utilité).
- Taux d'abandon légitime (coût, cf. OBIE : -14 pts de paiements légitimes) : à publier à côté du gain.

---

## 4. Mesurer l'effet en 36 h

### 4.1 Hypothèses à tester

- H1 : la combinaison intention + grilling + friction réduit la part de testeurs piégés par rapport à un wallet seul.
- H2 : la friction forcée (F1-F3) réduit le contournement plus qu'un avertissement affiché seul (c'est la préférence de Titouan ; à tester, pas à supposer).
- H3 : une partie de la valeur vient de l'intention (écart détecté), une autre du dialogue (signaux sociaux), une autre de la friction : on veut les séparer.

### 4.2 Protocole (testeurs, scénarios, contrôle)

- Testeurs : 24 à 40 personnes si possible, entre-sujets (un testeur ne voit qu'un bras, pour éviter l'apprentissage ; l'apprentissage est le biais principal de la répétition). Recrutement hors équipe, non experts crypto en majorité. Consentement écrit, débriefing, fonds fictifs ou testnet Fuji, jamais de vrais fonds. Les testeurs savent qu'il s'agit d'un test de sécurité (comme dans OBIE), pas quel scénario est piégé.
- Scénarios : 4 piégés + 4 légitimes mélangés ; chaque piégé dérivé de O2 : (S1) faux support qui demande de "mettre à l'abri" ; (S4) adresse sosie ; (S7) faux airdrop avec permit ; (S3/S5) "on m'a demandé" + achat ; contrôles légitimes : envoi à contact, swap routeur connu, connexion SIWE, dépôt exchange. Ordre randomisé.
- **Faux conseiller joué par un membre de l'équipe**, avec carte de consignes : urgence, "dis que c'est pour toi", "réponds non à tout". C'est le test du coaching. Un script écrit à l'avance, identique pour tous les bras. Aucun vrai nom d'organisation, aucune vraie marque (cf. règle de ne pas usurper).
- Bras :
  - A. MetaMask seul (contrôle).
  - B. Snap : intention + verdict d'écart + avertissement simple (niveau actuel).
  - C. B + grilling.
  - D. C + friction forcée (F1-F3).
  Option 2x2 pour séparer intention et dialogue si le nombre de testeurs le permet : (sans/avec intention) x (sans/avec grilling) avec verdict objectif constant.
- Analyse hors humain (banc, bon marché, sans testeurs) : rejouer tous les cas du jeu de test avec des "répondants simulés" (honnête, coaché cohérent, menteur incohérent, absent) pour mesurer la contribution des règles : détection par N0 seul, N0 + intention honnête / mensongère / absente, + dialogue honnête / coaché. C'est le tableau à bras de O3 6.4 étendu au dialogue.
- Métriques principales : % piégés (transaction du scénario piégé confirmée), % abandons légitimes, temps ajouté et clics ajoutés par transaction, taux de contournement (§3.5), compréhension (une question à choix après coup : "que faisait la transaction ?"). Référence externe : le témoin OBIE à 22 % [P] n'est pas transposable (population, tâche) ; ne pas s'y comparer sans le dire.
- Statistique honnête : avec 8 à 10 testeurs par bras, l'intervalle de confiance à 95 % sur une proportion est d'environ plus ou moins 30 points (ex. 2/10 -> intervalle de Wilson environ 6 % à 51 %). On ne détectera que de très gros effets. Présenter comme **illustratif**, publier n, intervalles et non des "%" nus. Test exact de Fisher possible sur 2x2 ; pas de p-valeur annoncée sans calcul. Pas de généralisation à la production.

### 4.3 Quelle part de la valeur vient de l'intention vs du dialogue ?

Ablation en cascade sur le banc (déterministe) puis confirmation en test humain :

| Configuration | Ce qu'elle isole |
|---|---|
| E0 règles seules (sans intention ni dialogue) | filet indépendant de l'intention |
| E1 = E0 + intention honnête | gain d'intention quand elle est vraie |
| E2 = E0 + intention mensongère/dictée | gain d'intention sous coaching (cas A de O3) |
| E3 = E1 + dialogue honnête | gain additionnel du dialogue |
| E4 = E2 + dialogue coaché | robustesse du dialogue sous coaching |
| E5 = E4 + friction forcée | gain de la friction sur le comportement humain (test humain seulement) |

Lecture : incrément d'intention = (E1 vs E0) et (E2 vs E0) ; incrément du dialogue = (E3 vs E1) et (E4 vs E2) ; incrément de friction = comportement humain D vs C. Possible résultat honnête (O3 6.4) : l'intention apporte peu contre l'escroc et l'essentiel de la valeur vient du plancher objectif plus du geste d'annulation (cohérent avec OBIE : l'action d'annulation porte l'effet). À publier tel quel si c'est le cas. Un cas non détecté assumé : fraude conforme (O3 B) et fork qui triche (§5.1).

---

## 5. Réponses honnêtes aux deux questions pièges

### 5.1 "Si le contrat malveillant détecte le fork de simulation et masque son attaque ?"

Réponse courte : cela peut arriver, notre barrière ne prétend pas l'éliminer. Voici ce que nous faisons et ce que nous ne faisons pas.

Faits : les drainers "simulation-aware" existent, comportement bénin en simulation puis malveillant en exécution, et les simulateurs souffrent d'un écart temporel entre simulation et inclusion (TOCTOU) [S : Three Sigma, ryder.id, blogs sécurité]. Les pages consultées ne détaillent pas les contre-mesures de Blockaid/Pocket Universe : **non trouvé**. Les opcodes qu'un contrat peut utiliser pour distinguer un fork (CHAINID, TIMESTAMP, BLOCKHASH, ORIGIN, COINBASE, soldes) viennent de ma connaissance générale de la EVM, pas de ces sources [V].

Ce qui reste valable même si le contrat triche :
1. **Les droits sont lus dans les données signées, pas déduits de l'exécution.** Un `approve`, un `permit`, un Permit2, un `setApprovalForAll`, une délégation 7702 apparaissent dans le calldata ou le typed data. Un contrat peut cacher l'effet d'une fonction interne ; il ne peut pas cacher qu'on t'a fait signer "ce spender peut dépenser tout ton USDC". Cette partie ne dépend pas du fork.
2. **Simulation défensive** : fork au dernier bloc réel, `chainId` réel, `block.timestamp` proche de l'heure réelle, `tx.origin` et `from` réels, soldes réels ; plusieurs exécutions avec des environnements variés (timestamp, numéro de bloc, coinbase) ; **si le comportement diverge entre exécutions, c'est lui-même un signal** de niveau élevé (« ce contrat se comporte différemment selon l'environnement »). Hypothèse de conception, non prouvée contre un attaquant adaptatif [V].
3. **Signaux statiques indépendants de la simulation** : contrat neuf, source non vérifiée, proxy modifiable, bytecode contenant des opcodes d'environnement dans des branches conditionnelles, `delegatecall`/`selfdestruct`. Combinés (O3 jury 1).
4. **Règle de prudence** : contrat non qualifiable (simulation incohérente, bytecode opaque) + intention de type "paiement/connexion" qui n'attend aucun contrat = niveau élevé, jamais "rien détecté".
5. **Le dialogue n'a pas besoin de la simulation** : si l'utilisateur dit "un conseiller me guide", le niveau monte quelle que soit la sortie du fork.

Ce qui reste exposé (à avouer en une phrase) : un contrat qui n'accorde aucun droit visible dans la signature, qui ne trahit rien de statique, et dont l'effet réel (transfert vers un tiers via logique interne) est masqué à notre simulation, passera. Idem pour les mises à jour de proxy entre simulation et inclusion. Nous mesurons ce cas et le rapportons comme **non détecté** dans le banc (déjà prévu O3 6.4, cas 10). Aucune garantie.

### 5.2 "Si l'utilisateur tape une phrase vague ou se trompe ?"

Deux sous-cas :

**a) Phrase vague, absente ou incohérente.**
- On ne devine pas à sa place. Le classifieur (Clef/Jev) ne fait que ranger dans l'ensemble fermé ; sa confiance < 0,6 déclenche A1 (reformulation à choix) plutôt qu'une décision (règle intent-barrier.md : < 0,6 -> escalade).
- Si la vague persiste : intention UNKNOWN avec attentes les plus strictes. La vague ne rapporte jamais d'indulgence : elle n'abaisse aucun seuil, au pire elle ajoute 1 question. Un attaquant ne gagne rien à être flou.
- Contradiction (texte vs case) : on retient le cas le plus suspect et on l'affiche.

**b) L'utilisateur se trompe vraiment** (mauvaise case, mauvais mot, flemme).
- Conséquence : alerte d'écart (« tu as dit X, ça fait Y »). C'est un **faux positif causé par le design** ; O3 6.2 demande de le comptabiliser à part. Nous le disons : le coût du clic d'intention est celui-ci.
- Différencier la gravité : si l'effet est objectivement banal pour la nouvelle intention, l'écart est **ambre** (« Tu as dit "je paie" mais c'est un swap ; veux-tu corriger ? ») et non rouge. Le rouge est réservé aux effets dangereux par eux-mêmes (droit persistant, destinataire inconnu + montant, sosie).
- Lien "corriger mon intention" visible : l'utilisateur honnête corrige en un geste, la correction est journalisée (nombre de corrections = indicateur de friction mal placée). Une correction ne fait **jamais** redescendre un niveau fondé sur un fait objectif.
- Erreurs en retapant l'adresse (F2) : message d'erreur neutre, deux essais, puis proposition "annuler et recommencer" ; ne pas punir.
- Limite honnête : l'utilisateur qui se trompe et ne corrige pas reste protégé par le plancher objectif ; l'utilisateur qui se trompe dans le sens de l'escroc (déclare la bonne intention pour la mauvaise raison) n'est pas protégé par ses mots (cas B).

---

## 6. Limites et points non vérifiés

- Schéma réel de l'API choice de Jev : non trouvé ; contrat de §1.2 est une proposition.
- Interface interactive avec saisie dans l'onglet d'une transaction, `severity: critical` stable en onSignature, `snap_dialog` depuis onTransaction, Fuji 43113 : non tranchés par la doc (OB) ; à tester en priorité.
- CeDEx : chiffres (18 %, -94 %) issus de résumés, PDF non lu ; à relire. OBIE : chiffres repris de OB, non relus ici.
- Aucun taux de contournement ni de faux motif pour les questions de finalité bancaires : non trouvé.
- Aucune étude de l'effet d'un message reprenant les mots de l'utilisateur : non trouvé.
- Prebunking ("les fraudeurs te dicteront les réponses") : existe en production chez au moins Starling d'après une décision d'ombudsman ; effet non mesuré trouvé.
- Aucune recherche faite sur les alertes de Blockaid/Rabby/Pocket Universe côté dialogue.
- Seuils numériques (N secondes, montants, N blocs) : volontairement non fixés.

## Sources principales
- Financial Ombudsman Service (décisions DRN, exemples : 4016457, 4623098, 4629985) : https://www.financial-ombudsman.org.uk/decision/DRN-4016457.pdf
- Which?, The psychology of scams : https://www.which.co.uk/policy/money/9245/the-psychology-of-scams-understanding-why-consumers-fall-for-app-scams
- OBIE, analyse préliminaire (2021) : https://www.openbanking.org.uk/wp-content/uploads/2021/04/Preliminary-Analysis-Effective-Warning-20210201.pdf
- CeDEx Nottingham 2023-08 : https://www.nottingham.ac.uk/cedex/documents/papers/cedex-discussion-paper-2023-08.pdf
- PSR 2025, économie comportementale et fraude APP : https://www.psr.org.uk/media/efpdiwpk/using-behavioural-economics-to-understand-and-prevent-app-fraud.pdf
- UK Finance / Thinks Insight, Effective Warnings Toolkit : https://thinksinsight.com/blog/uk-finance-effective-warnings-research
- ABS Singapour, mesures du 15 oct. 2025 : https://abs.org.sg/docs/library/banks-to-launch-enhanced-safeguards-from-15-oct-2025-to-better-protect-accounts_.pdf
- DBS période de refroidissement : https://fintechnews.sg/126691/security/dbs-cooling-period/
- NAB alertes de paiement : https://news.nab.com.au/news/nab-payment-alerts-latest
- Three Sigma, anatomie d'un drainer : https://threesigma.xyz/blog/opsec/ai-phishing-wallet-drainers-eip7702-part-2
- Linklaters, dark patterns et Consumer Duty : https://financialregulation.linklaters.com/post/102iech/what-you-need-to-know-about-dark-patterns-and-the-consumer-duty
- Revolut, appel in-app : https://www.uktech.news/cybersecurity/revolut-launches-in-app-calling-feature-to-tackle-impersonation-fraud-20250117
- Docs Snaps MetaMask (via OB) : https://docs.metamask.io/snaps/features/transaction-insights/

---

## Résumé en 8 lignes
1. Le grilling ne se déclenche que sur risque (nouveau destinataire, droit, signature opaque, intention vague, "on m'a demandé") et pose 2 à 4 questions fermées, formatées pour une API choice (schéma proposé, à aligner avec Jev car non trouvé).
2. Règle d'or : les réponses ne font que monter le niveau (jamais sous le plancher objectif) ; une contradiction avec un fait vérifiable (historique, âge du contrat) compte double ; les réponses ne servent pas à débloquer.
3. Les questions "qui t'a demandé, as-tu parlé à cette personne avant, on te presse, on te guide en direct" trahissent par la réponse honnête, sans nommer l'arnaque ; options plausibles des deux côtés, ordre et libellés variés contre le coaching.
4. Preuves : l'effet vient surtout d'une action d'annulation et d'une interruption active (OBIE 2021 : 22 % de fraude témoin, -12 à -18 pts, avec perte de paiements légitimes), pas d'un texte seul ; aucune donnée publique sur les questions de finalité bancaires ni sur les messages reprenant les mots de l'utilisateur ; coaching bien documenté par les ombudsmans ; délais de refroidissement répandus (SG, AU) mais sans évaluation isolée.
5. Friction noire : phrase variable à confirmer, retaper un fragment d'adresse, attente courte, refroidissement et proche proposés en option ; sortie "Annuler" toujours visible et sans pénalité ; jamais de vert "OK", jamais de confirmshaming ; contournement mesuré par événements locaux.
6. Honnêteté technique : un Snap n'empêche pas la signature (severity critical Flask-only en onTransaction) ; la friction est un obstacle, le verrou réel exige une page compagnon ou une extension.
7. Mesure en 36 h : 4 bras (MetaMask seul, Snap simple, + grilling, + friction) entre-sujets avec faux conseiller scripté, plus ablation déterministe sur le banc (E0 à E5) pour séparer intention, dialogue et friction ; n petit donc illustratif, intervalles affichés.
8. Pièges : fork détecté = possible, couvert en partie (droits lus dans les données signées, simulation réaliste et multiple, divergence = signal, signaux statiques) mais pas garanti, mesuré comme non détecté ; phrase vague = intention UNKNOWN strictement protégée, erreur honnête = écart ambre corrigeable, comptée comme faux positif dû au design.
