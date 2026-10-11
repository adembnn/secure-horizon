# Hold up : scènes de démo (alignées sur PITCH_V6, 11 oct. 2026)

Source du récit : `research/titouan/PITCH_V6_TITOUAN.md`, section « 1:45 à 2:45. La démo » (la V7 pourra la remplacer : refaire cet alignement). Scripts chronométrés : `livrables/PITCH_5MIN.md` et `livrables/PITCH_3MIN.md`. Vidéo : `livrables/VIDEO_SCRIPT.md`. Chiffres : `livrables/CHIFFRES.md`. Décisions : `coord/DECISIONS.md` (D-009, D-013).

Règle commune : chaîne locale pour la démo, Fuji à décider (D-013). La phrase est lue en local par mots-clés, dans le navigateur. L'API d'alertes de MetaMask ne sert ni les chaînes locales ni Fuji : ce que MetaMask affiche ou n'affiche pas sur notre démo ne prouve rien. Notre affirmation sur MetaMask vient de son code public, lu le 11 oct. 2026 (`research/demo_reelle/RECHERCHE_metamask_couverture.md`). Un essai réel sur Sepolia, chaîne servie par l'API, reste à faire.

Trois scènes, dans cet ordre. Durée visée : 1 minute en tout.

## Scène 1 : « échanger 50 USDC » face à un droit illimité (en direct)
- Site : Neve, `research/demo_reelle/site_echange/`, port 8793.
- Je tape « échanger 50 USDC contre AVAX » avant de voir la demande.
- `?mode=piege` : le site demande un droit illimité au routeur. Attendu : « Ça ne correspond pas à ce que tu as écrit. » Ligne : tu as écrit 50 USDC, la demande donne accès à tout ton USDC. Le portefeuille ne s'ouvre pas. Selon PITCH_V6 : routeur connu, avertissement léger ; adresse neuve, rouge (à rejouer avant de le dire).
- `?mode=piege&via=permit` : même demande par signature. Attendu : « Ça ne correspond pas », avec la ligne « cette signature ne peut pas être limitée ».
- `?mode=honnete` : le site demande 50 USDC, pas plus. Attendu : « Ça correspond », le portefeuille s'ouvre seul après une seconde. La demande initiale est correcte, puis la seconde (l'échange) est couverte par la même phrase.
- Phrase sûre, seulement pour une adresse que MetaMask ne liste pas comme malveillante : « MetaMask affiche illimité sans alerte et ne sait ni combien tu voulais donner ni à qui. »
- Prouve : l'écart entre une phrase et un droit. Ne prouve pas : le comportement de MetaMask en production, la précision d'un modèle, l'acceptation par des personnes.
- État : jouée dans un Chromium avec l'extension avant les derniers correctifs. Relancer les tests de l'extension et rejouer les trois modes avant de présenter.

## Scène 2 : signataire aveugle, d'après Bybit (synthétique)
- Source publique : Bybit, février 2025, environ 1,5 milliard de dollars (`livrables/CHIFFRES.md`, B13). L'interface du coffre affichait une transaction légitime, une autre charge allait aux signataires.
- Commande : `node research/titouan/T_banc_e2e/demo_typologie/safe_signataire.mjs`, adresses factices. Un coffre affiche un virement de 20 USDC, la charge réelle donne le contrôle à un programme étranger. Un virement conforme donne « aucun piège repéré mais vérification limitée » (jamais vert). Le même virement habillé en appel délégué vers un contrat inconnu donne « Ça ne correspond pas » : danger, même sans phrase (règles de base).
- À dire : scène synthétique, elle montre le décodage et pas l'attaque de bout en bout. Une extension ne voit que ce qui passe par `window.ethereum` : si la page parle au matériel en direct, elle ne voit rien. Ce qu'affichait l'écran du matériel n'est pas établi par les analyses publiques : ne pas l'affirmer.

## Scène 3 : « me connecter » qui signe un droit
- Site : Glacier Rewards, `research/demo_reelle/site/`, port 8791 (demande `eth_signTypedData_v4`).
- Je tape « me connecter ». La page demande une signature qui accorde un droit de dépense. Attendu : « Ça ne correspond pas » : une connexion ne devrait pas donner un droit de dépense.
- MetaMask, d'après son code public : décode un Permit en demande de plafond de dépense et informe. Il ne compare pas avec « me connecter ». Les messages de connexion valides (SIWE) ne passent pas par l'analyse Blockaid.

## Après l'alerte
- La personne annule ou continue : elle garde le dernier geste, Annuler reste visible, aucun écran n'est vert.
- Chaque décision laisse une ligne datée. L'extension autonome garde 500 lignes locales, chaînées par hachage comme la version serveur (`journal_chain.js`, 7 tests, export JSON, `verify_journal.mjs`). Pas d'ancrage sur une blockchain (D-017).
- Révocation d'un droit en un clic et preuve ancrée : prototypes, pas dans la démo. Ne pas les montrer comme faits. L'ancrage sur Fuji est codé, pas déployé.
- Le panneau latéral (clic sur l'icône de l'extension) montre le journal des décisions.

## Limites (à dire pour finir, diapo « ce qu'on ne couvre pas »)
- Fraude voulue : la personne veut vraiment faire le paiement, la demande correspond. Hors périmètre.
- Intention vague : « payer » sans montant ni destinataire. Une relance, puis « Je n'ai pas pu vérifier cette demande ».
- Un escroc qui souffle la phrase exacte : la comparaison ne voit rien, les règles de base voient encore un droit illimité vers une adresse inconnue.
- Contrat qui change à l'exécution : Added Protection de MetaMask le traite mieux. Ne pas le revendiquer.
- Ledger direct, mobile, bouton Envoyer du portefeuille : hors périmètre.
- Point faible chiffré : 54,2 % des opérations honnêtes reçoivent au moins un avertissement (banc synthétique, A4). Objectif sous 10 %, non atteint.
- Pas d'essai avec un vrai portefeuille : ne pas montrer ce qui n'a pas été vu.

## À ne pas montrer ni dire
L'adresse sosie et le RPC de garde comme apport. « MetaMask ne le voit pas » en général. Le Lab et ses 14 scénarios sur 16 (ancien produit). Toute tendance de pertes. « À l'ère de l'IA ». Une démo « sur Fuji ».
