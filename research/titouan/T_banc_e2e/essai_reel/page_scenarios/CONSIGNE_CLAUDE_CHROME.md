# Consigne pour Claude dans le navigateur : tester Hold up

Copie le bloc ci-dessous dans Claude (extension Chrome). Quand il a fini, colle son rapport à Claude Code.

```
Tu testes une extension de sécurité appelée « Hold up » dans mon Chrome. Rien n'est réel : compte MetaMask de test, aucun fonds. Règles : tu ne signes JAMAIS, tu ne confirmes jamais une transaction dans MetaMask (toujours « Rejeter » ou « Annuler »), tu ne saisis aucune phrase de récupération ni clé, tu ne touches à aucun autre site.

Étape 1. Ouvre chrome://extensions. Dis-moi : (a) la carte « Hold up (autonome) » existe-t-elle ? (b) est-elle activée ? (c) y a-t-il un bouton « Erreurs » ? Si oui, ouvre-le et recopie le message. (d) MetaMask est-il installé et activé ?

Étape 2. Ouvre http://localhost:8810 et recharge la page (Ctrl+Maj+R). Lis le texte de la page. Dans la console de la page, exécute : typeof window.ethereum, et note le résultat.

Étape 3. Clique « Connecter ». Que se passe-t-il ? Une fenêtre MetaMask s'ouvre-t-elle ? Une fenêtre Hold up s'ouvre-t-elle ? Que dit le texte à côté du bouton ? Que dit le « Journal de la page » en bas ? Si MetaMask demande de connecter le compte, accepte uniquement la connexion (pas de signature).

Étape 4. Clique « Passer sur Avalanche ». Recopie ce que dit le « Journal de la page » (en bas). Une fenêtre MetaMask s'est-elle ouverte ? Si MetaMask propose de changer ou d'ajouter le réseau Avalanche, accepte.

Étape 5. Clique « Lancer » sur le scénario « Je veux échanger 50 USDC, le site demande tout ». Dis-moi, dans l'ordre : quelle fenêtre s'ouvre en premier (Hold up ou MetaMask) ? Que lit-on dans la fenêtre Hold up (recopie le texte exact : la question, le verdict, les boutons) ? Si Hold up demande « Que veux-tu faire ? », écris : échanger 50 USDC. Que montre ensuite Hold up ? Puis clique « Annuler » dans Hold up. Que dit le journal de la page ?

Étape 6. Refais l'étape 5 avec « Message de connexion sans danger » (phrase : me connecter). Même questions. À la fin, rejette dans MetaMask.

Étape 7. Ouvre la console de la page (F12), onglet Console, et recopie toute ligne rouge ou tout message contenant « Hold up » ou « holdup ». Ouvre aussi chrome://extensions, clique « service worker » sur la carte Hold up, et recopie les erreurs de sa console.

RAPPORT À ÉCRIRE : pour chaque étape, une ligne « OK » ou « KO » + ce que tu as vu, mot pour mot, sans interpréter. À la fin : à quelle étape ça s'arrête, et le premier message d'erreur exact. Ne devine pas ; si tu n'as pas pu voir quelque chose, écris « non vu ».
```
