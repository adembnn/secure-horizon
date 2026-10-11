# Slide conformité (Track 1)

Titre de la slide : **Une décision, une trace, un rejeu. Ce que Hold up apporte à celui qui est régulé.**

## Contenu de la slide

Le porteur de portefeuille n'est pas une entité régulée. Le lecteur régulé est la plateforme (prestataire de services sur crypto-actifs, banque, fintech) qui intègre le moteur.

| Texte | Qui est concerné | Ce que Hold up lui donne | Ce que nous ne disons pas |
|---|---|---|---|
| **DORA** (UE 2022/2554) | Entités financières, dont les prestataires MiCA (art. 2 §1 f). Applicable depuis le 17 janv. 2025 (art. 64). | Une ligne horodatée par décision, chaînée par hachage, rejouable : matière pour le registre des incidents (art. 17 §2) quand l'événement en est un. Pour la plateforme, le moteur est un service TIC fourni par un tiers (art. 3 point 19, art. 28 et 30). | Pas de classification (art. 18), pas de déclaration (art. 19). Une victime d'hameçonnage ne compromet pas les systèmes de la plateforme, donc ce n'est pas en soi un incident TIC (art. 3 point 8). |
| **MiCA** (UE 2023/1114) | Prestataires autorisés (art. 3 §1 point 15 et art. 59 §1). Hors champ : service totalement décentralisé sans intermédiaire (considérant 22). | Un complément aux obligations de l'art. 68 §7 à 9 (systèmes TIC résilients, intégrité des données, conservation des enregistrements 5 ans) : la trace des avertissements montrés. | Ne remplace pas les enregistrements des ordres et transactions de l'art. 68 §9. Ne vaut pas autorisation. |
| **LCB-FT** (UE 2024/1624 ; UE 2023/1113) | Entités assujetties : établissements financiers, dont les prestataires crypto (art. 2 §1 point 6 i et art. 3 point 2). Application au 10 juil. 2027 (art. 90). | Une preuve datée qu'un avertissement a été montré avant un envoi, utile au dossier d'un client trompé. | Aucun filtrage de sanctions, aucune surveillance de transactions, aucune déclaration de soupçon (art. 69). Aucune vérification de propriété d'adresse auto-hébergée (règl. 2023/1113 art. 14 §5). |
| **AI Act** (UE 2024/1689, modifié par UE 2026/1744) | Fournisseurs et déployeurs de systèmes d'IA (art. 2). Obligations « haut risque » de l'annexe III repoussées au 2 déc. 2027 (art. 113 modifié). | Le moteur est un ensemble de règles écrites par des personnes : le considérant 12 les exclut de la définition du système d'IA (art. 3 point 1). Le classifieur de message, s'il est branché, ne peut qu'aggraver un verdict ; l'intention reste un choix de la personne. | Pas de qualification juridique établie. Journalisation et supervision humaine (art. 12 et 14) sont des exigences des systèmes à haut risque : nous nous en inspirons sans prétendre l'être. |

**Comment un auditeur vérifie une décision** : `node verify_decision.mjs --journal j.jsonl --seq N --request r.json` recalcule la chaîne de hachage, rejoue le moteur sur la requête, retrouve quelle règle a produit quelle raison. Limites dites : sans ancrage, une réécriture complète du journal reste possible. L'ancrage sur Fuji n'est pas encore fait.

## Notes de l'orateur (environ 75 secondes)

1. « Un particulier qui signe avec son portefeuille n'est soumis à aucun de ces textes : il ne figure pas dans la liste des entités de DORA, ni parmi les assujettis de la lutte contre le blanchiment, et MiCA exclut les services sans intermédiaire. Celui qui est régulé, c'est la plateforme qui intègre notre moteur. C'est pour lui que nous gardons une trace. »
2. « À chaque décision, une ligne : l'heure, le niveau, les codes de règle, l'empreinte des paramètres, chaînée à la précédente. L'auditeur lance une commande. Elle recalcule la chaîne, rejoue le moteur et dit quelle règle a produit quelle raison. Nous l'avons exécutée sur un journal de test de six décisions. »
3. « Ce que la trace ne prouve pas : que les règles étaient bonnes. Elle prouve ce qui a été décidé et par quelle règle. Aujourd'hui, le journal ne garde pas la requête entière, seulement une empreinte de ses paramètres. Nous avons un correctif de dix lignes, pas encore appliqué, qui ajoute l'empreinte complète de la requête, du contexte et de la version des règles. »
4. « Sur l'IA : le verdict vient de règles écrites à la main. Si un modèle lit un message collé, il peut seulement monter le niveau d'alerte. Il n'y a pas de modèle dans la version que vous voyez. »
5. « Nous ne déclarons Hold up conforme à aucun de ces textes. Nous donnons à un prestataire les éléments de preuve qu'il pourra verser à son propre dossier. »

Question probable : « Et l'ancrage sur Avalanche ? » Réponse : la racine du journal peut être écrite sur Fuji pour qu'un tiers détecte une réécriture complète. Le contrat et le vérificateur existent ; à la rédaction, aucune transaction n'est dans le repo. Fuji est un réseau de test : cela montre le mécanisme, pas une valeur légale.

Question probable : « Si votre modèle se trompe, qui est responsable ? » Voir `livrables/EXPLICABILITE.md`, section 5 : le verdict vient de code déterministe, la personne garde le dernier geste, un modèle branché ne fait qu'aggraver.

## Sources primaires

Textes lus dans le Journal officiel (versions publiées par l'Office des publications de l'UE, la même base que EUR-Lex), le 11 oct. 2026. Les numéros d'articles sont ceux du texte lu.

| Texte | Passages utilisés | Adresse |
|---|---|---|
| Règlement (UE) 2022/2554 (DORA) | art. 2 §1 f ; art. 3 points 8 et 19 ; art. 17 §2 ; art. 18 ; art. 19 §1 ; art. 28 ; art. 30 ; art. 64 | https://eur-lex.europa.eu/eli/reg/2022/2554/oj |
| Règlement (UE) 2023/1114 (MiCA) | considérant 22 ; art. 3 §1 point 15 ; art. 59 §1 ; art. 68 §7, §8, §9 | https://eur-lex.europa.eu/eli/reg/2023/1114/oj |
| Règlement (UE) 2024/1624 (LCB-FT) | art. 2 §1 point 6 i ; art. 3 point 2 ; art. 69 ; art. 90 (application au 10 juillet 2027) | https://eur-lex.europa.eu/eli/reg/2024/1624/oj |
| Règlement (UE) 2023/1113 (transferts de fonds et de crypto-actifs) | art. 14 §5 | https://eur-lex.europa.eu/eli/reg/2023/1113/oj |
| Règlement (UE) 2024/1689 (AI Act) | considérant 12 ; art. 2 ; art. 3 point 1 ; art. 12 ; art. 14 ; annexe III point 5 b (hors détection de fraude financière) ; art. 113 | https://eur-lex.europa.eu/eli/reg/2024/1689/oj |
| Règlement (UE) 2026/1744 (« Digital Omnibus » sur l'IA, JO du 24.7.2026) | modifie l'art. 113 : systèmes de l'annexe III au 2 décembre 2027, annexe I au 2 août 2028 | https://eur-lex.europa.eu/eli/reg/2026/1744/oj |

Méthode : EUR-Lex a refusé la récupération automatique (réponse d'attente sans contenu). Les textes ont été obtenus par le résolveur de l'Office des publications (`publications.europa.eu/resource/celex/<numéro CELEX>`, format XHTML) puis lus en local. Je n'ai pas consulté de texte de l'ESMA ni de l'ABE : aucune des affirmations de la slide n'en dépend, et aucune n'est citée de mémoire.

Non vérifié, donc non écrit : toute obligation chiffrée de délai de notification DORA (les délais sont fixés par des normes techniques, art. 20), tout statut juridique d'un éditeur de logiciel de portefeuille au regard de MiCA (le texte lu ne le traite pas expressément), toute qualification de Hold up au regard de l'AI Act.
