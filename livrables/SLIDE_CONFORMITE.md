# Slide conformité (Track 1)

Titre de la slide : **Une décision, une trace, un rejeu. Ce que Hold up apporte à celui qui est régulé.**

## Contenu de la slide

Le porteur de portefeuille n'est pas une entité régulée. Le lecteur régulé est la plateforme (prestataire de services sur crypto-actifs, banque, fintech) qui intégrerait Hold up. **Nous ne revendiquons aucune conformité DORA, MiCA, LCB-FT ou AI Act** : les obligations restent à la plateforme qui déploie. Le tableau dit seulement quelle matière Hold up peut lui fournir.

| Texte | Qui est concerné | Ce que Hold up lui donne | Ce que nous ne disons pas |
|---|---|---|---|
| **DORA** (UE 2022/2554) | Entités financières, dont les prestataires MiCA (art. 2 §1 f). Applicable depuis le 17 janv. 2025 (art. 64). | Une ligne horodatée par décision, chaînée par hachage dans la version serveur comme dans le build autonome (500 entrées, puis point d'ancrage) : matière possible pour le registre des incidents (art. 17 §2) quand l'événement en est un. Pour la plateforme, Hold up est un service TIC fourni par un tiers (art. 3 point 19, art. 28 et 30). | Pas de classification (art. 18), pas de déclaration (art. 19). Une victime d'hameçonnage ne compromet pas les systèmes de la plateforme, donc ce n'est pas en soi un incident TIC (art. 3 point 8). |
| **MiCA** (UE 2023/1114) | Prestataires autorisés (art. 3 §1 point 15 et art. 59 §1). Hors champ : service totalement décentralisé sans intermédiaire (considérant 22). | Un complément aux obligations de l'art. 68 §7 à 9 (systèmes TIC résilients, intégrité des données, conservation des enregistrements 5 ans) : la trace de ce que la personne a écrit et de ce qui lui a été répondu. | Ne remplace pas les enregistrements des ordres et transactions de l'art. 68 §9. Ne vaut pas autorisation. |
| **LCB-FT** (UE 2024/1624 ; UE 2023/1113) | Entités assujetties : établissements financiers, dont les prestataires crypto (art. 2 §1 point 6 i et art. 3 point 2). Application au 10 juil. 2027 (art. 90). | Une preuve datée qu'une alerte a été montrée avant une signature, utile au dossier d'un client trompé. | Aucun filtrage de sanctions, aucune surveillance de transactions, aucune déclaration de soupçon (art. 69). Aucune vérification de propriété d'adresse auto-hébergée (règl. 2023/1113 art. 14 §5). |
| **AI Act** (UE 2024/1689, modifié par UE 2026/1744) | Fournisseurs et déployeurs de systèmes d'IA (art. 2). Obligations « haut risque » de l'annexe III repoussées au 2 déc. 2027 (art. 113 modifié). | Dans le build livré (D-015), un modèle de langage hébergé (Clef) lit la phrase écrite par la personne, via un relais local qui garde la clé. Une option sans réseau lit la phrase par mots-clés. Les montants, jetons et adresses sont lus par du code, jamais par le modèle. | Pas de qualification juridique établie. Le considérant 12 exclut les règles écrites par des personnes de la définition du système d'IA, mais il ne couvre plus l'étape qui lit la phrase. Journalisation et supervision humaine (art. 12 et 14) sont des exigences des systèmes à haut risque : nous nous en inspirons sans prétendre l'être. |

**Comment un auditeur vérifie une décision** : `node verify_decision.mjs --journal j.jsonl --seq N --request r.json` recalcule la chaîne de hachage, rejoue le moteur sur la requête et retrouve quelle règle a produit quelle raison. Exécuté sur un journal de test de six décisions : 6 sur 6 rejouées. Limites dites : sans ancrage, une réécriture complète du journal reste possible, et une page qui boucle sur demande et annulation peut pousser d'anciennes lignes hors de l'anneau de 500 lignes (revue de sécurité, S19). L'ancrage externe n'est pas fait (démonstration sur une copie locale d'Avalanche ; déploiement Fuji préparé et répété, non exécuté). L'audit a relevé deux inexactitudes du journal de l'extension : le passage automatique de la deuxième demande est noté comme une confirmation humaine, et la limitation à 50 USDC n'y figure pas. Le rejeu est partiel.
**Ce que le journal garde aujourd'hui** : l'heure, le niveau, les codes de règle, l'empreinte des paramètres. Il ne garde pas encore la phrase écrite ni la réponse du modèle : à ajouter avant de parler de rejeu complet de la comparaison.

## Notes de l'orateur (environ 75 secondes)

1. « Un particulier qui signe avec son portefeuille n'est soumis à aucun de ces textes. Celui qui est régulé, c'est la plateforme qui nous intègre. C'est pour lui que nous gardons une trace. »
2. « À chaque décision, une ligne dans un cahier numéroté : l'heure, le niveau, les codes de règle. Elle est chaînée à la précédente, aussi dans la version autonome : une page changée ou arrachée au milieu se voit. Dans la version serveur, l'auditeur lance une commande qui recalcule la chaîne et rejoue le moteur. Nous l'avons exécutée sur un journal de test. »
3. « Ce que la trace ne prouve pas : que les règles étaient bonnes. Elle prouve ce qui a été décidé et par quelle règle. »
4. « Sur l'IA : un modèle hébergé lit la phrase, seule. Il ne lit pas les montants ni les adresses, du code s'en charge, et il ne peut pas baisser une alerte du code. Sur notre jeu aveugle, il n'apporte pas de gain net mesurable : ce qui compte est la phrase et le code qui compare. Quand il hésite, la réponse est : je n'ai pas pu vérifier. »
5. « Nous ne déclarons Hold up conforme à aucun de ces textes. Nous donnons à un prestataire des éléments de preuve pour son propre dossier. »

Question probable : « Et l'ancrage sur Avalanche ? » Réponse : la racine du journal peut être écrite sur Fuji pour qu'un tiers détecte une réécriture complète. Le contrat et le vérificateur existent, testés sur une copie locale ; le déploiement Fuji est préparé et répété, non exécuté (D-016). Ce serait un réseau de test : le mécanisme, pas une valeur légale.

Question probable : « Si votre modèle se trompe, qui est responsable ? » Voir `livrables/QR_JURY.md`, question 12, et `livrables/EXPLICABILITE.md` section 5.

## Sources primaires

Textes lus dans le Journal officiel (Office des publications de l'UE, même base qu'EUR-Lex) par une session précédente le 11 oct. 2026, non relus dans cette mise à jour. Les numéros d'articles sont ceux du texte lu.

| Texte | Passages utilisés | Adresse |
|---|---|---|
| Règlement (UE) 2022/2554 (DORA) | art. 2 §1 f ; art. 3 points 8 et 19 ; art. 17 §2 ; art. 18 ; art. 19 §1 ; art. 28 ; art. 30 ; art. 64 | https://eur-lex.europa.eu/eli/reg/2022/2554/oj |
| Règlement (UE) 2023/1114 (MiCA) | considérant 22 ; art. 3 §1 point 15 ; art. 59 §1 ; art. 68 §7, §8, §9 | https://eur-lex.europa.eu/eli/reg/2023/1114/oj |
| Règlement (UE) 2024/1624 (LCB-FT) | art. 2 §1 point 6 i ; art. 3 point 2 ; art. 69 ; art. 90 | https://eur-lex.europa.eu/eli/reg/2024/1624/oj |
| Règlement (UE) 2023/1113 | art. 14 §5 | https://eur-lex.europa.eu/eli/reg/2023/1113/oj |
| Règlement (UE) 2024/1689 (AI Act) | considérant 12 ; art. 2 ; art. 3 point 1 ; art. 12 ; art. 14 ; annexe III ; art. 113 | https://eur-lex.europa.eu/eli/reg/2024/1689/oj |
| Règlement (UE) 2026/1744 | modifie l'art. 113 : annexe III au 2 déc. 2027, annexe I au 2 août 2028 | https://eur-lex.europa.eu/eli/reg/2026/1744/oj |

Non vérifié, donc non écrit : tout délai de notification DORA chiffré (fixé par des normes techniques, art. 20), tout statut juridique d'un éditeur de logiciel de portefeuille au regard de MiCA, toute qualification de Hold up au regard de l'AI Act.
