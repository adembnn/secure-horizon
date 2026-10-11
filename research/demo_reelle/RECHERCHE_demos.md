# Recherche : mettre en scène une démo réaliste de Hold up

Date : 2026-10-11. Légende : [V] vérifié sur page primaire (URL), [NV] non vérifié ou source secondaire.
Limites honnêtes : Reddit/X ne sont pas accessibles via l'outil ; pas de vidéo de démo visionnée (je n'ai lu que des pages texte). Les parties 2, 4 et 5 sont donc partiellement [NV].

## TL;DR
1. Tous les produits concurrents montrent la même chose : une fenêtre/overlay de l'extension qui s'ouvre AVANT la popup du wallet, avec une phrase claire ("withdraws all of your NFTs") [V Pocket Universe]. Ce modèle est celui à copier.
2. Le flux le plus reconnaissable et le plus honnête sur testnet : faux "airdrop claim" -> Connect -> "Verify/Claim" -> signature Permit (EIP-2612) ou approve illimité. Permit/Permit2 reste le vecteur n°1 en 2025 [V ScamSniffer].
3. Chiffres : 2025 = 83,85 M$ et 106 106 victimes (-83 % / -68 % vs 2024 : 494 M$, 332 000 victimes) [V]. Plus gros vol 2025 : 6,5 M$ par Permit [V].
4. Aucun concurrent n'a de contrefactuel "avant/après" documenté dans ce que j'ai pu lire [NV]. Notre contrefactuel (même scène, deux fois, avec puis sans) est donc un vrai différenciateur.
5. Reco : scène unique "Claim airdrop" sur testnet Fuji avec explorateur en preuve (voir fin), alternatives : setApprovalForAll faux mint, address poisoning.

## 1. Produits existants

| Produit | Ce que montre la source primaire | Où apparaît l'UI | Moment "sauvé" |
|---|---|---|---|
| Pocket Universe | Trois scams : faux listings NFT (vide les NFT des collections OpenSea/Blur), faux ordres DEX (drain ERC20), contrats voleurs d'ETH déguisés en airdrop/claim/mint. Captures : popup "withdraws all of your NFTs", aperçu d'un swap Uniswap, alerte rug. 200 000+ users, 1 Md$+ protégés, couverture 30 000 $ [V https://www.pocketuniverse.app/] | Popup navigateur qui s'ouvre avant MetaMask/Coinbase/Rabby ; ne marche pas avec WalletConnect/OKX [V même URL] | Lecture claire des actifs qui sortent + Reject. Racheté par Kerberus août 2025 [NV, https://www.cbinsights.com/compare/pocket-universe-vs-wallet-guard] |
| Wallet Guard | Site : drainers, faux sites, mints/claims, honeypots, faux airdrops ; traduit les signatures illisibles en langage clair ; "sunset" le 31/03/2025 ; 100K+ wallets, 40 M$+ sauvés [V https://www.walletguard.app/] | Non décrit sur la page [V] | Non décrit |
| Revoke.cash | Extension Chrome qui avertit avant d'approuver un contrat ; la doc cite aussi Pocket Universe [V https://revoke.cash/learn/approvals/what-are-token-approvals] ; doc sur approve()/setApprovalForAll [V même URL] | Non précisé | Avertissement avant approbation |
| Kerberus Sentinel3 | Extension qui scanne sites et transactions, silencieuse sauf alerte ; "transaction translation" avant chaque signature ; couverture 30 000 $ via Fairside ; ce sont des claims société (99,9 % détection) [NV, via https://docs.kerberus.com et https://decrypt.co/250717/kerberus-formerly-mintdefense-acquires-fire-launches-sentinel3-with-transaction-coverage-from-30000-to-100-eth] | Alerte seulement quand site non sûr | Blocage du site avant connexion |
| Fire | Racheté par Kerberus (simulation de transactions) [V https://decrypt.co/250717/kerberus-formerly-mintdefense-acquires-fire-launches-sentinel3-with-transaction-coverage-from-30000-to-100-eth] | NV | NV |
| MetaMask / Blockaid, Rabby, Scam Sniffer, Web3 Antivirus, Harpie | Pages fetchées en 404 ou sans contenu ; rien de fiable lu. MetaMask Snaps offre "transaction and signature insights" affichés dans MetaMask [V https://docs.metamask.io/snaps/] | Dans la fenêtre de confirmation MetaMask (Snaps) | NV |

Constat : aucune vidéo avant/après visionnée. Durées des vidéos des concurrents : [NV] non mesurées.

## 2. Hackathons (très partiel)
- FireWalt, ETHGlobal Waterloo 2023 : dApp React qui vide un wallet compromis ; pas de prix ni vidéo mentionnés [V https://ethglobal.com/showcase/firewalt-5dvq6]. Approche réactive, pas pré-signature.
- Drain't (HackQuest) : agent IA anti-drainer, MetaMask Snap qui avertit avant signature, classifieur IA, rescue gasless, enforcer sur Sepolia ; hackathon et prix non indiqués [V https://www.hackquest.io/projects/Draint]. Proche de Hold up : à connaître en cas de question du jury.
- Absynth (ETHGlobal Taipei, prix Circle "Best Smart Wallet with Security Controls") et Messiah (DeFiHackLabs, HashKey) cités par la recherche web [NV, pas de page ouverte].
- Structure type d'une vidéo de 2-3 min, critiques de jurys : [NV] non trouvées. Je ne les invente pas. Règle générale à appliquer : problème en 15 s, démo live, preuve on-chain, limites.

## 3. Flux de drain réels

Séquence typique (airdrop-claim) : message sur X/Discord/Telegram ou token "bonus" déposé dans le wallet -> lien vers un faux site -> "Connect wallet" -> bouton "Claim / Verify" -> popup du wallet avec signature Permit ou approve -> fonds partis en secondes [NV, synthèse de https://www.dextools.io/tutorials/fake-airdrop-claim-site-scam et Elliptic https://www.elliptic.co/corpus/gen-2785/project-horned-owl/on-chain-detection-of-fake-token-airdrops-and-approval-phishing-permit-scams-for-wallet-screening.html ; Elliptic [V] : l'airdrop est l'appât, l'exploit est la signature ou l'approbation suivante].

Chiffres (ScamSniffer, rapport 2025 : https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/) [V] :
- 83,85 M$, 106 106 victimes en 2025 ; 494 M$ et 332 000 victimes en 2024.
- 11 cas >1 M$ (30 en 2024). Plus gros : 6,5 M$ par Permit (sept.), 3,13 M$ increaseApproval (mai), 3,05 M$ Transfer (août).
- Permit/Permit2 = environ 38 % des pertes des cas >1 M$.
- EIP-7702 : signatures malveillantes après Pectra, 2 cas août pour 2,54 M$.
- Drainers : Inferno, MS, Pink majeurs en 2023 ; Inferno et Angel en 2024 ; aucun nommé en 2025.
- Cas permit 440 358 $ USDC (nov. 2024) [V https://decrypt.co/351651/what-a-440000-hack-shows-about-the-rising-threat-of-ethereum-permit-scams] ; Nov. : 7,77 M$, plus de 6 000 victimes [V même URL].
- Address poisoning : cas 50 M$ USDT en déc. 2025 et 12,25 M$ en jan. 2026 [NV, via recherche web ; https://forklog.com/en/investor-loses-nearly-50-million-in-address-spoofing-attack/ non ouvert]. Le rapport 2025 ScamSniffer ne le mentionne pas [V].

Quel flux démontrer ? Le faux "airdrop claim" avec signature Permit/approve : le plus reconnaissable (tout le monde a vu "Claim your airdrop"), vrai sur testnet (on peut déployer un faux token test et un contrat "spender" attaquant sur Fuji ; l'approbation et le transferFrom sont réels, seuls les fonds sont fictifs). Address poisoning est très parlant mais exige un historique empoisonné, moins "wallet popup".

## 4. Témoignages de victimes
Reddit/X inaccessibles. Je n'ai trouvé aucun récit à la première personne vérifiable. À la place, cas documentés (anonymes, pas de citation) :
- Trader ~1 M$, a signé un message Permit2 qui a donné les clés à un contrat malveillant [NV, https://cryptobriefing.com/trader-loses-1m-phishing-token-approval/].
- Détenteur USDC, 440 K$, a signé un "permit" sans le savoir [V https://decrypt.co/351651/what-a-440000-hack-shows-about-the-rising-threat-of-ethereum-permit-scams].
- Détenteur de PEPE, ~1,39 M$, signature Permit2 [NV, https://web3isgoinggreat.com/single/pepe-token-permit-phishing].
Ligne de victime à écrire nous-mêmes (reformulation, pas une citation) : "Je croyais juste signer pour recevoir mon airdrop, pas autoriser quelqu'un à vider mon wallet." Cette phrase est une synthèse, à ne pas présenter comme un verbatim. Pour de vrais verbatims : chercher r/CryptoScams et r/ethereum à la main ("permit", "drained", "signed").

## 5. Conseils de mise en scène (expérience générale, [NV] : pas de source primaire)
- Écran : navigateur plein écran, faux site à gauche, explorateur (Snowtrace testnet) dans un 2e onglet prêt ; agrandir le zoom Chrome à 125 %.
- Wallet pré-financé en AVAX Fuji + faux token test ; deux comptes (un "sans protection", un avec Hold up) ou un profil Chrome sans extension pour le contrefactuel.
- L'overlay in-page de Hold up doit apparaître avant la popup MetaMask ; la popup MetaMask s'ouvre dans une fenêtre séparée qui peut masquer l'UI : l'ordre "Hold up d'abord" règle ça (comme Pocket Universe [V]).
- Fallback : vidéo pré-enregistrée de la même scène, prête dans un onglet ; tx déjà minées en réserve.
- Pièges : RPC Fuji lent (utiliser un RPC fiable, pré-chauffer avec une tx), service worker MV3 qui s'endort (déclencher une action juste avant, ou garder un port ouvert), nonce bloqué, popup MetaMask derrière la fenêtre.

## Recommandation : UNE scène (environ 8 plans)

Scène : "Airdrop claim" sur Fuji.
1. (10 s) Cadre : "Un message sur X : 'Claim your airdrop'". Capture du post (synthétique), lien vers le faux site.
2. (10 s) Le faux site s'ouvre : design crédible, bouton "Connect wallet", puis "Verify & Claim".
3. (15 s) CONTREFACTUEL, profil sans Hold up : clic sur Claim, popup MetaMask avec la signature/approbation. Montrer ce que la victime lit : texte anodin.
4. (15 s) Elle signe. Basculer sur l'explorateur : le token test a été transféré à l'attaquant, hash de transaction réel. "C'est ça sans Hold up."
5. (10 s) Rejouer (wallet rechargé) avec Hold up activé : même site, même clic.
6. (25 s) L'overlay Hold up s'affiche avant MetaMask : "Vous croyez : recevoir un airdrop. Réalité : autoriser 0xAAAA à dépenser TOUS vos tokens, sans limite." Bouton Retenir / Annuler en premier.
7. (15 s) La victime clique Annuler. Explorateur : aucune transaction, allowance = 0.
8. (20 s) Fiche de défense : temps de détection mesuré, faux positifs, mapping NIST CSF 2.0 (Detect, Respond) + ATT&CK/ATLAS/OWASP ASI/D3FEND, limites.

Alternatives :
- A. Faux mint NFT avec setApprovalForAll : même structure, mais l'overlay dit "autorise le transfert de TOUS vos NFT de la collection" (cas Pocket Universe [V]).
- B. Address poisoning : l'historique contient une adresse quasi identique ; Hold up compare l'adresse collée à l'adresse déjà connue et alerte (cas 50 M$ [NV]).

À exclure : tout discours "100 % de détection" ; citer les limites (simulation décalée de l'exécution, vu dans la littérature générale [NV]).
