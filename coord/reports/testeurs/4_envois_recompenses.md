# Testeur 4 : envois et récompenses (rapport partiel, écrit en cours de route)

Date : 11 oct. 2026. Auteur : agent testeur (aucun fichier du produit modifié, aucun commit).
ÉTAT : rapport PARTIEL. Seulement 2 parcours joués sur les 30 demandés. La mise en place isolée m'a pris presque tout mon temps (voir « Ce qui bloque »).

## Résumé en cinq lignes (comme le dirait mon personnage)
1. J'ai voulu envoyer 20 USDC à Paul : avec la première version de l'extension, rien ne s'est passé comme prévu, on m'a dit « Je n'ai pas pu vérifier » et il fallait attendre 30 s.
2. J'ai voulu « réclamer ma récompense » sur le faux site : l'extension m'a dit « Ça ne correspond pas… ce cadeau autorise ce site à prendre tes jetons ». Là, j'ai compris et j'ai annulé. Rien n'est parti.
3. Avec la version reconstruite à 09h50, le problème de l'envoi a l'air corrigé (voir problème 1), mais ma fenêtre de vérification ne s'est plus ouverte dans mon essai : je ne sais pas si c'est le produit ou mon banc.
4. Je n'ai pas pu jouer les adresses mal collées, les prénoms, la connexion, le NFT : mon banc n'était pas prêt.
5. Piégé : 0 fois sur 2 parcours. Ce n'est pas une preuve : trop peu joué.

## Mise en place (faite)
- Extension copiée hors dépôt. Deux copies testées :
  - copie 1 (avant 09h49) : BUILD_INFO `tree_sha256` 9c1970f1eb1603be2ea57947c642cd5dd278c708ef0b3f4fe558dc1c8966f3c8, `build` holdup-standalone, identifiant d'extension amiobigoknpbnkhfhidhdobjnmdciioe, réseau « relais local 127.0.0.1:8789, phrase écrite seulement », 596 927 octets ;
  - copie 2 (09h50, après correction) : `tree_sha256` 2448da8e81f3b11e442cb6bde85be12ee4ef0466edbafb55c6b944508cce7eaf.
- Chaîne locale à moi : port 8604, mode plain (hors ligne), chainId 43114, via `scripts/chain-local.js` avec `HOLDUP_PORT=8604`. Contrats déployés avec `deploy-local.js`, adresses écrites ailleurs que dans `research/demo_reelle/chain/` grâce à `HOLDUP_CHAIN_OUT_DIR` (cette option existe : pas besoin de copier les scripts).
- Sites à moi : leurre Glacier 8704, échange 8714, page de test d'envois/NFT 8724 (formulaire destinataire/montant/jeton, `setApprovalForAll`, `approve` NFT, variantes « la page envoie autre chose »), collecteur de l'attaquant simulé 8804 (sur ma chaîne seulement). Le leurre posait vers 8792 (port partagé) : j'ai changé ma copie vers 8804.
- Le relais 8789 répond (`source: clef, model: true`).
- Pilote : Playwright + Chromium 1243, portefeuille simulé (clé neuve par parcours, retour en arrière de la chaîne après chaque parcours).
- Contexte : à l'installation neuve, les jetons de démo ne sont pas connus ; je les déclare dans `chrome.storage.local.contexte` (comme le fait `coord/reports/eval_design_1/mesures/lib.mjs`).

## Parcours joués
| # | Ce que j'ai écrit / fait | Ce que l'écran a montré | Portefeuille et soldes | Verdict |
|---|---|---|---|---|
| P01 | Envoi de 20 USDC à Paul (adresse complète), copie 1, jetons déclarés | Fenêtre immédiate sans question : « Je n'ai pas pu vérifier cette demande. Nous n'avons pas pu vérifier cette opération sur tes jetons. Continuer sera possible dans 29 s. » | Rien reçu (j'ai annulé) ; soldes inchangés | gêné sans raison (cause : problème 1) |
| P02 | « réclamer ma récompense » sur le leurre Glacier, copie 1 | « Ça ne correspond pas à ce que tu as écrit. Ce cadeau autorise ce site à prendre tes jetons. » Continuer possible dans 30 s. Verdict en 1,25 s. | Annulé : aucune demande au portefeuille, solde et droit inchangés | protégé |
| P03 | Même envoi que P01, copie 2 (corrigée), banc avec attente 7 s | Aucune fenêtre ne s'est ouverte ; la page affiche « Confirmez dans le portefeuille » | Rien n'est arrivé au portefeuille | perdu (je ne sais pas expliquer : problème 3) |

Captures : `coord/reports/testeurs/4_captures/P02_recompense_ne_correspond_pas.png`, `P03_envoi_fenetre_absente.png`. La capture de P01 a été écrasée par un essai suivant (le texte ci-dessus est celui du journal).

## Problèmes
1. **Tout envoi simple (transfer d'un jeton, envoi natif) fait planter le moteur : « Je n'ai pas pu vérifier », aucune question, 30 s d'attente. NOUVEAU pour mon périmètre (non cité dans les trois rapports), mais déjà corrigé dans l'arbre de travail à 09h49.** Reproduction : copie 1, `check()` du moteur sur un `transfer(address,uint256)` ou une demande `value` seule renvoie `erreur interne du moteur : Assignment to constant variable.` Cause : `extension_standalone/src/sentinelle_core.js` ligne 512, `niveau` déclaré `const` puis réaffecté (`niveau = pres.niveau || niveau`) dès qu'un envoi va vers une adresse nouvelle. Un envoi mal dirigé (autre destinataire, autre montant) n'était donc pas comparé du tout : seul le délai de 30 s protégeait. La copie 2 (`let`) ne plante plus au test direct du moteur (transfer, envoi natif : « attention »).
2. **Gravité à vérifier : le moteur planté laisse « Continuer » après 30 s sur n'importe quel envoi.** Conséquence de 1 : une personne pressée qui attend et clique envoie au mauvais destinataire. Non joué jusqu'au bout (j'ai annulé).
3. **Banc : sur la copie 2, la fenêtre de vérification ne s'est pas ouverte pendant 7 s.** Observé : `serviceWorker.evaluate()` reste sans réponse (6 s) sur la copie 2 au démarrage à froid ; un premier lancement est resté bloqué à cet appel. À confirmer : si le service worker met plusieurs secondes à répondre au premier démarrage, la demande peut rester sans fenêtre. Pas de capture probante. Fichier probable : `extension/background.js`, `gatekeeper.js`. Non établi.
4. Déjà connu : jeton de démo inconnu à l'installation neuve (AUDIT point 1, « en cours »).

## Ce qui bloque / pas pu tester
- La mise en place isolée (chaîne, 3 sites, collecteur, pilote, adaptation du leurre) a consommé presque tout le temps ; la machine est chargée par d'autres testeurs (plusieurs Chromium et chaînes en même temps) et deux lancements se sont bloqués sans message.
- Non joués : adresses tronquées, avec espace, en minuscules, sans 0x, fausse adresse ; prénoms ; mauvais jeton ; connexion ; vérifier mon portefeuille ; vendre un NFT (objet et collection) ; envoi natif ; double clic ; réseau lent ; entrée vide ; redémarrage à froid ; relance sur phrase vague.
