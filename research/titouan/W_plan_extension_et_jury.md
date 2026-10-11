# W. Plan : l'extension demain et la remise au jury (Claude-Titouan, 11/10/2026)

## Réponse courte
Oui, demain on aura une extension qui fonctionne dans Chrome, installée à la main en « mode développeur » (aucun drapeau, aucun piratage). Pour le jury, la voie sûre est : démonstration en direct sur notre ordinateur + vidéo de 2-3 min + dépôt GitHub avec le zip et un guide d'installation. Le Chrome Web Store n'est pas réaliste avant dimanche 12h.

## 1. Trois états de l'extension
| État | Contenu | Statut |
|---|---|---|
| A. Extension + serveur local | l'extension parle à un petit serveur Node sur 127.0.0.1:8787 qui contient le vrai moteur | en construction (agent « serveur et paquet d'installation ») |
| B. Extension autonome | le moteur (JavaScript pur, sans dépendance) embarqué dans l'extension : plus de serveur à lancer | À FAIRE après A ; c'est ce qui rend l'installation par le jury triviale |
| C. Chrome Web Store | publication publique | non réaliste avant le gel (compte développeur, revue de Google : délai de plusieurs jours, à vérifier) ; à présenter comme « prochaine étape » |

## 2. Comment le jury la voit (par ordre de fiabilité)
1. DÉMO EN DIRECT sur l'ordinateur de l'équipe (round 1 : 5 min + 2 min de questions ; finale : 3 min + 3 min). Chrome avec l'extension déjà chargée, serveur déjà lancé (ou version autonome), page de test locale prête, connexion internet non nécessaire (contexte hors ligne). Prévoir un second profil Chrome vierge pour montrer l'installation en 3 clics.
2. VIDÉO de 2 à 3 min (livrable obligatoire, filet de sécurité si la démo plante).
3. DÉPÔT GITHUB (livrable obligatoire, accessible au jury) : README (problème, architecture, installation, limites), dossier extension/, zip dans dist/ ou en « Release », guide INSTALL_FR.md, page de test locale, résultats du banc (COUVERTURE.md) et fiche de défense d'une page.
4. HÉBERGEMENT : le code et le zip vivent dans le dépôt GitHub. Aucun serveur public n'est nécessaire (le moteur tourne chez l'utilisateur), donc rien à héberger ni de données à envoyer ; un argument de confidentialité.

## 3. Installation côté jury (2 minutes)
chrome://extensions, activer le mode développeur, « Charger l'extension non empaquetée », choisir le dossier dézippé. (Version A: lancer d'abord la commande du serveur ; version B: rien d'autre.) Chrome affichera un avertissement « extensions en mode développeur » : normal.

## 4. Planning jusqu'au gel (dimanche 12h00, démo interne figée à 08h00 selon Adem)
| Quand | Quoi | Qui |
|---|---|---|
| Maintenant | serveur local + zip + INSTALL_FR.md + page de test | agent local |
| Ensuite | extension autonome (moteur dans le service worker), tests | agent local |
| Ensuite | brancher l'interface choisie par Adem (docs/design/v4) | Adem / agent |
| Avant 08h | essai à blanc complet sur un Chrome vierge (installation + 3 scénarios) | Titouan |
| 08h-12h | gel du code, vidéo, README, fiche de défense, release GitHub | tous |

## 5. Ce qu'il faut dire honnêtement
- L'extension couvre les flux depuis une page web (dApps), pas les envois lancés depuis l'interface du portefeuille, pas le mobile.
- Elle avertit et ralentit, elle ne garantit rien.
- Installation en mode développeur pour la démo ; le magasin Chrome est la suite.
