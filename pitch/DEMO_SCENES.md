# Hold up : scènes de démo (produit figé, 11 oct. 2026)

Remplace la version précédente (leurre Glacier avec retenue, sosie d'adresse, RPC de garde), qui décrivait l'ancien produit : voir l'historique git. Scripts chronométrés : `livrables/PITCH_5MIN.md` et `livrables/PITCH_3MIN.md`. Vidéo : `livrables/VIDEO_SCRIPT.md`. Chiffres : `livrables/CHIFFRES.md`.

Règle commune : la démo tourne sur une chaîne locale. Fuji et les chaînes locales ne sont pas servis par l'API d'alertes de MetaMask : ce que MetaMask affiche ou n'affiche pas sur notre démo ne prouve rien. Notre affirmation sur MetaMask vient de son code public, lu le 11 oct. 2026 (`research/demo_reelle/RECHERCHE_metamask_couverture.md`, ajout du 11 oct.). Un essai réel sur Sepolia, chaîne servie par l'API, reste à faire.

## Scène 1, héros : « échanger 50 USDC » face à un droit illimité
- Site : Neve, `research/demo_reelle/site_echange/`, port 8793.
- Je tape : « échanger 50 USDC contre AVAX » avant de voir la demande.
- Mode `?mode=piege` : le site demande `approve` illimité au routeur. Attendu : « Ça ne correspond pas à ce que tu as écrit. », ligne : tu as écrit 50 USDC, la demande donne accès à tout ton USDC, comment ramener le plafond à 50 USDC. Le portefeuille ne s'ouvre pas.
- Mode `?mode=piege&via=permit` : même demande par signature. Attendu : « Ça ne correspond pas », avec la ligne « cette signature ne peut pas être limitée ».
- Mode `?mode=honnete` : le site demande 50 USDC, pas plus. Attendu : « Ça correspond », le portefeuille s'ouvre seul après une seconde. Une première demande correcte, puis la seconde (l'échange) couverte par la même phrase.
- Phrase sûre, à dire seulement pour une adresse que MetaMask ne liste pas comme malveillante : « MetaMask affiche illimité sans alerte et ne sait ni combien tu voulais donner ni à qui. »
- Ce que la scène prouve : l'écart entre une phrase et un droit. Ce qu'elle ne prouve pas : le comportement de MetaMask en production, la précision de Clef, l'acceptation par des personnes.
- État : scène jouée dans un Chromium avec l'extension avant les derniers correctifs (piège et piège par signature : « ne correspond pas », honnête : première demande correcte, seconde en « pas pu vérifier »). Correctifs en cours, non vérifiés : relancer les tests de l'extension et rejouer les trois modes avant de présenter.

## Scène 2, signataire aveugle (type Bybit)
- Source publique : Bybit, février 2025. L'interface du coffre affichait une transaction légitime, une autre charge allait aux signataires (analyses de NCC Group, BlockSec, Check Point, Cyfrin). Pas de montant cité ici : non relu dans cette mise à jour.
- Scène : `node research/titouan/T_banc_e2e/demo_typologie/safe_signataire.mjs`, adresses factices. Je veux virer 20 USDC à Paul. Un virement conforme donne « aucun piège repéré mais vérification limitée » (jamais vert). Le même virement habillé en appel délégué vers un contrat inconnu donne « Ça ne correspond pas » (niveau critique du moteur, avec ou sans phrase).
- À dire : scène synthétique, elle montre le décodage et pas l'attaque de bout en bout. Une extension ne voit que ce qui passe par `window.ethereum` : si la page parle au matériel en direct, elle ne voit rien. Ce qu'affichait l'écran du matériel n'est pas établi par les analyses publiques : ne pas l'affirmer.
- À bâtir, non fait : version jouable avec un vrai portefeuille sur chaîne locale (contrat de coffre factice et page qui affiche un virement).

## Scène 3 : « me connecter » qui signe un droit
- Site : Glacier Rewards, `research/demo_reelle/site/`, port 8791 (demande `eth_signTypedData_v4`).
- Je tape : « me connecter ». La page demande une signature qui accorde un droit de dépense. Attendu : « Ça ne correspond pas » : une connexion ne devrait pas donner un droit de dépense.
- Ce que MetaMask fait, d'après son code public : il décode un Permit en demande de plafond de dépense et informe. Il ne compare pas avec « me connecter ». Les messages de connexion valides (SIWE) ne passent pas par l'analyse Blockaid.

## Diapo « ce qu'on ne couvre pas » (slide 8)
- Fraude consentie : la personne veut vraiment faire le paiement, la demande correspond. Hors périmètre.
- Intention vague : « payer » sans montant ni destinataire. Une relance, puis « Je n'ai pas pu vérifier cette demande ».
- Contrat qui change à l'exécution : Added Protection de MetaMask le traite mieux (revert sur la chaîne si l'effet diffère de l'aperçu). Ne pas le revendiquer.
- Ledger direct : la page parle au matériel, l'extension ne voit rien.

## Ordre conseillé
1. Scène 1 en piège, puis en honnête (contraste obligatoire).
2. Scène 2 (slide, rejeu du moteur).
3. Scène 3 si le temps le permet.
4. Slide 8 pour terminer honnêtement.

## À ne pas montrer ni dire
Le sosie d'adresse et le RPC de garde comme apport. « MetaMask ne le voit pas » en général. Le Lab et ses 14 scénarios sur 16 (ancien produit). Toute tendance de pertes. « À l'ère de l'IA ».
