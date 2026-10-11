# Script de la vidéo de démo : 2 min 45

Format : 1280x720, navigateur sans interface (headless), 30 images par seconde, lisible sans son : chaque plan porte une légende en bas de l'image (22 px minimum, fond uni). La voix off est facultative et reprend la légende mot pour mot.
Règle de vérité : la vidéo montre ce qui tourne réellement. Aucun plan du Lab avec le bandeau « Données d'exemple » (serveur factice). Aucun plan de la démo autonome au portefeuille simulé, sauf s'il porte la légende « démo autonome, portefeuille simulé ».

## Ce qui est déjà enregistré dans `livrables/video/` (relevé à 04h40)
- `1_sans_holdup_le_vol.mp4` (30 s, 1280x720, légendes françaises) : leurre Glacier Rewards, console attaquant, 2 480 USDC de test qui passent chez l'attaquant sur la réplique locale. Réel. Sert de plans 1 à 3.
- `3_envoi_depuis_le_portefeuille_rpc.mp4` (35 s) : envoi tapé dans le portefeuille vers une adresse sosie, page de décision du RPC de garde, Annuler, rien n'est parti. Réel (porte RPC). Sert de plan 7.
- `2_avec_holdup_les_alertes.mp4` (72 s) : c'est la démo autonome avec faux portefeuille (bandeau « tout est fictif »). Le propriétaire a écarté cette démo comme démo du jury. À ne pas monter, sauf légendée comme ci-dessus.

## Plans

| # | Durée | Source | Légende à l'image (et voix) |
|---|---|---|---|
| 1 à 3 | 0:00 à 0:30 | `1_sans_holdup_le_vol.mp4` tel quel | Légendes de la prise. Vérifier que la première dit « compte de test, argent fictif ». |
| 4 | 0:30 à 0:45 | À enregistrer : même parcours `http://localhost:8791/index.html`, extension Hold up chargée, écran Danger avant la fenêtre du wallet. Si l'extension n'est pas stable : même requête dans le Lab (plan 5). | « Avec Hold up. Tu crois : un message sans frais. En vrai : le site prend tes jetons. » |
| 5 | 0:45 à 0:58 | Clic « Annuler », puis `http://localhost:8791/attaquant.html` : soldes inchangés (état remis à zéro avant la prise : `reset.mjs`, puis `node research/demo_reelle/site/config.js`) | « Annuler : rien n'a bougé. Continuer reste retardé. » |
| 6 | 0:58 à 1:20 | À enregistrer : Lab `http://127.0.0.1:8801`, un scénario malveillant, les deux colonnes | « Hold up Lab. À gauche, ce que Hold up dit. À droite, ce qui arrive sur la chaîne si on signe. » |
| 7 | 1:20 à 1:55 | `3_envoi_depuis_le_portefeuille_rpc.mp4` tel quel | Légendes de la prise, plus au début : « Deuxième porte : envoi tapé dans le portefeuille, après la signature, avant la diffusion. » |
| 8 | 1:55 à 2:10 | À enregistrer : Lab, scénario honnête, puis un cas manqué, deux plans de 7 s | « La moitié des scénarios sont honnêtes. Une fausse alerte, une attaque manquée : comptées. » (écrire la légende après avoir vu l'écran ; couper le plan si le Lab n'en produit pas) |
| 9 | 2:10 à 2:30 | À enregistrer : Lab, résumé « tout jouer » | « X scénarios : rappel Y, fausses alertes Z. Mesuré sur nos scénarios. » Chiffres lus à l'écran, jamais saisis de mémoire. |
| 10 | 2:30 à 2:45 | Slide 5 du deck (`livrables/deck/holdup.pptx`), exportée en image 1280x720 | « Mesuré sur nos jeux, pas sur de vrais utilisateurs. Ancrage Fuji non déployé. Attaquez le Lab. » |

Si le serveur du Lab (8800) ne répond pas : couper les plans 6, 8 et 9, la vidéo tombe à 1 min 55 et reste valable (consigne : 2 à 3 minutes). Dans ce cas, garder la slide 5 et ajouter la slide 4 (deux portes) pendant 10 s.
Montage : coupes sèches, ni musique ni transition. Titre fixe de 2 s en tête (« Hold up, Track 1 Fintech Security ») seulement si la durée reste sous 3 min.
Prérequis avant chaque prise live : `curl http://127.0.0.1:8800/api/health` ; chaîne locale lancée ; leurre servi sur 8791 (`node docs/demo/serve_static.mjs research/demo_reelle/site 8791`).
