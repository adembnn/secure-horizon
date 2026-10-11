# Pitch round 1 : 5 min + 2 min de questions (dimanche 13h00)

Répartition proposée, à confirmer entre vous : Titouan ouvre et ferme, Adem tient la démo et les chiffres. Deux écrans : le deck (HDMI) et un navigateur sur le Lab et le leurre. Ordre des fenêtres préparé avant d'entrer.
« Live » = réellement exécuté sur la chaîne locale (copie d'Avalanche sur le portable). « Vidéo » = filet de sécurité (`livrables/VIDEO_SCRIPT.md`), lancé seulement si la chaîne ou le navigateur plante, annoncé comme enregistrement.
Poids de la grille : détection 30, réponse 20, faisabilité 20, conformité 15, pitch 15. Les temps suivent : 1:45 de détection (lignes 1:20 à 3:05), 0:30 de réponse, 0:35 de conformité, 0:30 de faisabilité (dans la démo), le reste en récit.

| Temps | Qui | À l'écran | Live ou vidéo | Texte dit |
|---|---|---|---|---|
| 0:00 à 0:35 | Titouan | Slide 1, puis `lure.html` | Slide, puis live | « Camille a un wallet normal. Un message lui promet une récompense. Le site lui fait signer un message : gratuit, aucun frais. Elle signe, son USDC part. En 2025, ce genre de signature a coûté 83,85 millions de dollars à 106 106 victimes, selon ScamSniffer. » |
| 0:35 à 1:20 | Adem | `lure.html` → `index.html`, console `attaquant.html` en second écran | Live | « Voici le même parcours, sans protection, sur notre copie locale d'Avalanche. Je clique sur Réclamer. Une signature, aucune transaction de ma part. Regardez la console de l'attaquant : 2 480 USDC de test viennent de partir. » (Annoncer : compte de test, argent fictif.) |
| 1:20 à 2:05 | Adem | Même parcours, Hold up actif : écran Danger, puis Annuler. Si l'extension n'est pas stable : la même requête dans le Lab | Live, sinon Lab | « Même clic, avec Hold up. Avant la fenêtre du wallet : Tu crois, je signe un message sans frais. En vrai, cette signature laisse le site prendre tes jetons. Je lis, j'annule. Console de l'attaquant : rien n'a bougé. Si je veux continuer quand même, il faut attendre. » |
| 2:05 à 3:05 | Adem | Hold up Lab (port 8801) : choisir un scénario honnête, un malveillant, un cas manqué ; puis slide 5 | Live | « Le Lab vous laisse jouer. Je choisis une attaque : à gauche ce que Hold up dit, à droite ce qui arrive sur la chaîne si on signe, mesuré par exécution puis retour en arrière. La moitié des scénarios sont honnêtes. Voici une fausse alerte, voici une attaque manquée : on les compte. Nos chiffres : sur le jeu TEST ouvert une fois, 94,5 % de rappel mais 23,1 % de fausses alertes critiques. C'est trop. Le jeu aveugle, dont le hash est publié, reste à mesurer. » |
| 3:05 à 3:35 | Adem | Slide 4 (deux portes), puis l'envoi vers l'adresse sosie par le RPC de garde (`livrables/video/3_envoi_depuis_le_portefeuille_rpc.mp4`, 35 s, ou en live si le RPC tourne) | Slide, puis film ou live | « Un moteur, deux portes. L'extension agit avant la signature, c'est la seule qui voit un Permit. Le RPC de garde agit après la signature et avant la diffusion, pour les envois tapés dans le wallet. Aucun des deux ne voit un retrait de plateforme : là, la personne colle l'adresse et vérifie. » |
| 3:35 à 4:10 | Titouan | Slide 6 | Slide | « Un auditeur peut rejouer un verdict : journal chaîné, version des règles, rejeu du banc. Si le modèle se trompe, qui est responsable ? Le verdict vient de règles versionnées, la personne garde la décision, et le journal prouve ce qui lui a été montré. L'ancrage sur Fuji n'est pas déployé, nous ne l'affirmons pas. » |
| 4:10 à 4:40 | Titouan | Slides 7 et 8 | Slide | « Gratuit pour les personnes, intégration payante pour les wallets et les plateformes. Pas de prix fixé, pas de client. Nous sommes deux ingénieurs, Adem et moi. » |
| 4:40 à 5:00 | Titouan | Slide 8 | Slide | « Ce qu'on ne fait pas encore : testé avec un vrai MetaMask, mesuré sur de vrais utilisateurs. Ce qu'on vous demande : attaquez le Lab. » |
| 5:00 à 7:00 | Les deux | Lab ouvert | Live | Questions. Réponses : `livrables/QR_JURY.md`. Proposer au jury de construire sa propre attaque dans le Lab. |

## Avant d'entrer (3 min)
1. `curl http://127.0.0.1:8800/api/health` répond ; `/api/scenarios` compte 30 scénarios ou plus. Ne dire « la moitié sont honnêtes » que si la liste le confirme. Sinon : ne pas présenter le Lab comme prêt, jouer le leurre et les films 1 et 3 de `livrables/video/`.
2. Chaîne locale lancée, adresses recopiées (`node research/demo_reelle/site/config.js`), console attaquant à 2 480 USDC côté victime.
3. Vidéo prête dans un onglet, sans le son.

## Si ça plante
- Verdict différent de Danger sur le leurre : le dire, ouvrir le panneau technique, passer au Lab.
- Chaîne locale morte : `livrables/video/1_sans_holdup_le_vol.mp4`, annoncée « enregistrement de la même scène ».
- Ne pas jouer `2_avec_holdup_les_alertes.mp4` : c'est la démo autonome au portefeuille simulé, écartée comme démo du jury.
- Rien ne s'affiche : slide 5 et réponses orales. Ne jamais improviser un chiffre.
