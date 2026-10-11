# Pitch round 1 : 5 min + 2 min de questions (dimanche 13h00)

Produit : l'utilisateur écrit ce qu'il veut faire, avant de voir la demande. Hold up dit si la demande correspond ou non. Si non, il alerte. Si oui, il n'ajoute rien et le portefeuille s'ouvre seul après une seconde. Il garde aussi les signaux que le portefeuille donne déjà.

Répartition proposée : Titouan ouvre, tient les mesures, la conformité et la fin. Adem tient les scènes. À confirmer entre vous.
Grille : détection 30, réponse 20, faisabilité 20, conformité 15, pitch 15. Le temps suit : environ 2:00 de détection (scènes et mesures), 0:40 de réponse, 0:40 de conformité, 0:30 de faisabilité, le reste en récit.
Débit : moins de 18 mots par 10 secondes. Le texte dit fait environ 620 mots.
« Live » = exécuté pour de vrai sur la chaîne locale avec l'extension. Rien n'est joué sur Fuji. Fuji et les chaînes locales ne sont pas servis par l'API d'alertes de MetaMask : le silence d'un MetaMask sur notre démo ne prouve rien, nous ne le disons jamais.

| Temps | Qui | À l'écran | Live ou vidéo | Texte dit |
|---|---|---|---|---|
| 0:00 à 0:25 | Titouan | Slide 1 | Slide | « Camille veut échanger 50 USDC. Le site lui demande un droit sur tout son USDC. Ce n'est pas rare : en 2025, 106 106 adresses ont perdu 83,85 millions de dollars en signant sur un site de phishing. Chiffre d'un éditeur, sur les chaînes EVM, c'est une borne basse. » |
| 0:25 à 1:15 | Adem | Scène héros, site Neve, mode piège, fenêtre Hold up | Live | « Avant de voir la demande, j'écris : échanger 50 USDC contre de l'AVAX. Le site demande ensuite un droit illimité. Hold up répond : ça ne correspond pas. Tu as écrit 50 USDC, la demande donne accès à tout ton USDC. MetaMask affiche illimité sans alerte et ne sait ni combien tu voulais donner ni à qui. D'après son code public lu le 11 octobre, le montant illimité ne déclenche aucune alerte. » |
| 1:15 à 1:40 | Adem | Même scène, mode honnête | Live | « Même phrase, site honnête. La demande donne 50 USDC, pas plus. Hold up dit : ça correspond. Une seconde plus tard, le portefeuille s'ouvre tout seul. Rien à cliquer. » |
| 1:40 à 2:05 | Adem | Slide 3 : coffre à signatures multiples | Slide, rejeu du moteur | « Deuxième exemple, inspiré du cas Bybit de février 2025, analysé par NCC Group et BlockSec. L'interface affichait un virement légitime, la charge signée était autre. Chez nous, scène synthétique, adresses factices : j'écris un virement de 20 USDC, la demande est un appel délégué vers un contrat inconnu. Ça ne correspond pas. » |
| 2:05 à 2:20 | Adem | Site Glacier Rewards, « me connecter » | Live | « Troisième cas. J'écris : me connecter. La page demande une signature qui accorde un droit de dépense. MetaMask affiche une demande de plafond. Il ne sait pas que je voulais seulement me connecter. Ça ne correspond pas. » |
| 2:20 à 3:00 | Titouan | Slide 5 : un tableau, deux colonnes | Slide | « Nos mesures, avec leur jeu. Sur 410 cas d'écart que nous avons écrits, nos règles en signalent 228 sur 228. C'est un test de couverture : nous avons écrit les cas et les règles. Le jeu aveugle, 250 cas, hash publié, n'est pas encore passé. Autre limite : en conditions produit, 13,9 % d'opérations honnêtes reçoivent un écran rouge. Et l'intention écrite apporte peu sur nos cas actuels : il manque un jeu construit pour elle. » |
| 3:00 à 3:40 | Adem | Slide 6 : après l'alerte | Slide | « Après l'alerte, la personne décide. Annuler est toujours visible. Pour une transaction, Hold up dit comment ramener le droit au montant écrit. Pour une signature, il le dit : elle ne peut pas être limitée. Chaque décision laisse une ligne dans un journal chaîné par hachage. » |
| 3:40 à 4:20 | Titouan | Slide 7 : conformité | Slide | « Un particulier n'est pas une entité régulée. La plateforme qui nous intègre l'est. Pour elle, une décision, une ligne datée, rejouable par un auditeur. Si le modèle se trompe : les montants, jetons et adresses sont lus par du code, la personne garde le dernier geste, et le journal dit ce qui lui a été montré. Nous ne nous déclarons conformes à aucun texte. » |
| 4:20 à 4:45 | Titouan | Slide 8 : ce qu'on ne couvre pas | Slide | « Ce que nous ne couvrons pas : la fraude que la personne veut vraiment faire, une intention trop vague, un contrat qui change à l'exécution, un Ledger branché directement. Dans ces cas, nous disons que nous n'avons pas pu vérifier. » |
| 4:45 à 5:00 | Titouan | Slide 9 | Slide | « Gratuit pour les personnes, des partenaires ensuite, sans prix fixé. Nous sommes deux ingénieurs. Jamais essayé avec une vraie personne ni un vrai portefeuille. Attaquez notre grille. » |
| 5:00 à 7:00 | Les deux | Neve ouvert | Live | Questions. Réponses : `livrables/QR_JURY.md`. Proposer au jury d'écrire sa propre phrase. |

## Avant d'entrer (3 min)
1. Chaîne locale lancée (`npm run chain:local` puis `npm run demo:deploy` dans `blockchain/`). Site Neve sur le port 8793, trois modes : `?mode=honnete`, `?mode=piege`, `?mode=piege&via=permit`. Site Glacier Rewards servi (voir `livrables/INSTALLATION.md`).
2. Extension autonome reconstruite après le dernier correctif (`node research/titouan/T_banc_e2e/extension_standalone/build_standalone.mjs`) et chargée dans Chrome. Tests relancés avant de s'y fier (`node --test` dans `extension/tests/unit/`).
3. Rejouer une fois les trois modes. Si un verdict diffère de « ça correspond » en honnête ou de « ça ne correspond pas » en piège : le dire à voix haute et passer à la vidéo.
4. Vidéo de secours prête dans un onglet, sans le son (à enregistrer : voir `livrables/VIDEO_SCRIPT.md`).

## Si ça plante
- Chaîne locale morte ou extension instable : la vidéo unique, annoncée « enregistrement de la même scène ».
- Scène Bybit : c'est un rejeu du moteur sans portefeuille (`node research/titouan/T_banc_e2e/demo_typologie/safe_signataire.mjs`). Ne pas la présenter comme une attaque de bout en bout.
- Ne jamais improviser un chiffre. Les chiffres autorisés sont dans `livrables/CHIFFRES.md`.

## Phrases interdites
« MetaMask ne le voit pas » en général. « Personne ne protège les particuliers ». « L'idée n'existe pas ». « Premier ». « Bloque ». « À l'ère de l'IA ». Toute tendance en hausse. Le sosie d'adresse et le RPC de garde comme apport. Les chiffres retirés de `livrables/CHIFFRES.md`. « Clef classe l'intention » sans la mesure et sa réserve. La phrase sur MetaMask et l'illimité ne vaut que pour une adresse que MetaMask ne liste pas comme malveillante.
