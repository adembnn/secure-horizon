# Challenge de l'architecture v0 d'Adem (docs/architecture.md, commit 7b2b2fe)

Rédigé par Claude (session Titouan) le 10/10/2026, après git pull. À transmettre à Adem seulement sur feu vert de Titouan. Rien n'a été poussé sur son repo.

## Ce qui est bon, à garder
- L'invariant dans le contrat (sortie <= réserve, prix borné) : seule parade crédible contre une attaque en une seule transaction.
- Le journal chaîné et ancré, avec "rejouer comme un auditeur".
- Le banc d'essai avec graine fixe et gros retraits légitimes dans le trafic normal.
- Le tableau de bord autoporteur (chaque panneau a un titre et une phrase).
- Les limites connues écrites noir sur blanc.

## Urgent
1. **Temps.** Il est samedi soir. Le code gèle dimanche 12h00 : il reste environ 14 h, dont la nuit. Le périmètre v0 est celui de 3 jours. Il faut couper maintenant.
2. **Checkpoint 18h30.** Adem demande si le formulaire a été soumis (MSG-002, [needs-human]). Titouan doit répondre.

## Incohérence pitch / architecture
Le pitch (track1_4_pitches.md) vend un **leurre** ("un piège qui ne ment pas", zéro faux positif) et un **rejeu de hacks réels sur fork**. L'architecture v0 ne contient ni leurre ni fork : elle a un simulateur Hardhat et 3 attaques. Il faut choisir. Ma recommandation : garder le leurre comme **couche bonus** (une fonction jamais appelée et une règle, environ 1 h), ne pas en faire le titre, et changer la phrase de fin.

## Failles et corrections

| # | Faille | Correction proposée |
|---|---|---|
| 1 | Périmètre trop large : traceur, demande de gel, registre des tiers, webhooks SIEM, MockBridge, simulateur, React/Tailwind, Bedrock | Couper : traceur, webhooks, MockBridge, SIEM. Registre des tiers réduit à 1 panneau lisant rôles et oracle. Tableau de bord = une page statique qui lit un JSON de rejeu |
| 2 | Le traceur sur Fuji avec adresses simulées est du théâtre : il ne prouve rien | Supprimer. Garder un "paquet de gel" généré en document, sans prétendre tracer |
| 3 | Le bot a le rôle pauser : s'il est compromis ou en panne, tout tombe (leçon Bitget) | Mettre le **plafond de sortie (L2) en dur dans le contrat**, actif sans la Hold up. La Hold up ne fait que resserrer. Pause pauser-only avec expiration |
| 4 | Détection triviale : un drain rapide (type Drift) se détecte avec n'importe quelle limite de débit. Le jury pondère la détection à 30 % | Ajouter des variantes difficiles : drain lent sous le seuil, fractionnement sur plusieurs adresses, changement de rôle légitime. Publier les ratés |
| 5 | Circularité : on écrit les attaques et les règles | **Pré-enregistrer** le hash des règles sur Fuji avant d'écrire les attaques. Attaques écrites en aveugle |
| 6 | Pas de précurseurs | Règle "changement de signataire / seuil / module / rôle hors timelock" avant le drain (Drift : nonces visibles le 23 mars, vol le 1er avril) |
| 7 | Persona flou : un CASP stocke ses fonds en MPC, pas dans un vault maison | Dire explicitement : un prestataire agréé qui opère un produit on-chain (staking, earn, token) ou un émetteur de token sur Avalanche. Ne pas citer BUIDL comme assujetti DORA |
| 8 | Humain : "RSSI + direction" sans astreinte. Que se passe-t-il si personne ne répond ? | Chaîne d'escalade dans un **mandat EIP-712 signé on-chain** (qui est d'astreinte, qui peut lever). Le système reste au palier atteint, ne passe pas en pause globale sans humain |
| 9 | Bedrock obligatoire pour le texte libre : coût, clé, réseau, panne en démo | Gabarit déterministe par défaut ; LLM en option avec sorties pré-calculées en cache |
| 10 | Règles figées : rien pour apprendre d'une attaque | Boucle : proposition, rejeu, mode ombre, nouvelle version signée. Une slide suffit |
| 11 | Chrono DORA : le schéma écrit "4 h / 72 h / 1 mois" | Ajouter le plafond de **24 h après la prise de connaissance**. Le délai de 4 h part de la classification |
| 12 | Notification volontaire citée "art. 10" | Numérotation à confirmer dans le texte officiel (sources divergentes : art. 19(2) ou 19(4) de DORA, contenu dans le RTS 2025/301) |

## Chiffres à ne pas afficher tels quels
- Bitget "0,08 % gelés" : les sources divergent (318 k$ / 0,08 %, 840 k$ / 0,2 %, jusqu'à 1,1 M$). Écrire "moins de 0,3 %" avec la source.
- Parallel : source vendeur (Hypernative), à signaler.
- 33 incidents AMF : surtout des sociétés de gestion, pas des CASP.
- Tectonic : ne pas dire "une seule transaction" ; l'invariant en contrat reste valable pour la manipulation en boucle.
- "Aucun outil ne relie la chaîne à la déclaration" : dire "nous n'en avons pas trouvé".

## Périmètre minimal proposé pour dimanche 12h
Vault avec plafond en dur, pause avec expiration et invariant ; 4 règles ; échelle L1 à L3 ; moteur DORA à 6 à 8 champs avec preuve ; journal et ancre ; mandat EIP-712 ; pré-enregistrement ; rejeu de 1 scénario principal et 1 secondaire, avec ratés ; page statique de démonstration. Le reste en slide "suite".
