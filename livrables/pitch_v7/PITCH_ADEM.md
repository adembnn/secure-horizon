# Pitch Hold up, trame d'Adem (11 oct. 2026)

Trame dictée par Adem, mise en ordre. Chaque chiffre renvoie à sa source en bas de page. Durée visée : 5 minutes avec la démonstration, 3 minutes en retirant le bloc 5.

## 1. Le postulat (30 s)

En 2026, on ne peut plus promettre qu'un site est sûr. Les attaquants vont plus vite que ceux qui les cherchent.

En novembre 2025, le site d'Aerodrome est détourné. Il faut 81 minutes pour que quelqu'un le signale. Pendant 81 minutes, le site est piégé et personne ne le sait.

Alors on part d'un postulat simple : tout service en ligne finira par être compromis. La question n'est plus « comment le sécuriser ». C'est « qu'est-ce que je lui ai laissé le droit de prendre, le jour où ça arrive ».

## 2. Le constat (45 s)

Sur une blockchain, quand tu utilises un site, tu signes un contrat. Ce contrat dit ce que le site a le droit de prendre dans ton portefeuille. Presque personne ne le lit, et il n'est pas écrit pour être lu.

On a mesuré. Sur Ethereum, 47,6 % des droits accordés sont illimités. Sur Avalanche, 34,2 %. Tu veux échanger 50 dollars, tu signes un accès à tout, sans date de fin.

Et ce droit reste. Des mois plus tard, le site se fait pirater, et le pirate se sert dans les portefeuilles de tous ceux qui ont laissé la porte ouverte.

Juillet 2024, LI.FI, un service connu : 11,6 millions de dollars, 153 portefeuilles vidés. Tous avaient laissé un droit illimité. Ceux qui avaient limité leur droit n'ont rien perdu.

## 3. Hold up (30 s)

Un contrat que tu signes doit dire ce que tu voulais, noir sur blanc, et rien de plus.

Avant de signer, tu écris ce que tu veux faire : « échanger 50 USDC contre AVAX ». Hold up lit le contrat que le site te présente et le compare à ta phrase.

Si ça correspond, ça passe. Si le site demande plus que ce que tu as écrit, Hold up ramène le droit à ton montant. Si ça ne colle pas, il lève la main.

## 4. La démonstration (1 min 30)

- Un site d’échange honnête. J’écris « échanger 50 USDC contre AVAX ». Le site demande un accès à tout mon USDC, comme beaucoup de services. Hold up affiche : « Droit limité à 50 USDC. Le site demandait un accès sans limite. » L’échange se fait.
- « Maintenant, on pirate ce site. » Même site, même phrase, deux portefeuilles partis de 100.
- Sans Hold up : le droit était illimité. Le jour où le site est piraté, le compte passe de 50 à zéro.
- Avec Hold up : le droit a été ramené à 50, l’échange l’a entièrement utilisé. Le même piratage ne prend rien. Il reste 50.

Chiffres lus sur la chaîne locale par . Prouvé dans un vrai navigateur avec l’extension : le parcours « avec Hold up ». Le parcours « sans Hold up » est prouvé sur la chaîne seulement. Seule exposition qui reste avec Hold up : les 50 du droit, entre l’accord du droit et l’échange qui le consomme. Déroulé geste par geste : .

## 5. La preuve et les limites (30 s)

250 cas écrits sans voir nos règles, ouverts une seule fois. Sans la phrase écrite, on signale 64,7 % des contrats qui ne correspondent pas. Avec la phrase, 87,3 %.

Ce qui ne va pas encore : 15 % d'alertes à tort, notre objectif était 10 %. Et la vérification ne couvre pas tout ce qu'un contrat peut contenir. On sait lesquels, la liste est dans le dépôt.

## 6. La fin (10 s)

On ne sait pas quel site sera piraté. On décide de ce qu'on lui laisse.

---

## Ce qui a été modifié par rapport à la dictée, et pourquoi

- « La plupart des drainages ont lieu sur d'anciens contrats » : NON repris. Nos chiffres disent l'inverse : les vols par signature piégée pèsent plus lourd (494 M$ en 2024) que les vols par droits anciens sur un service piraté (79,5 M$ en 2024 d'après la liste Revoke.cash recomptée). Remplacé par un cas précis et vérifié, LI.FI.
- « Tout ce qui est en ligne est une fuite » : gardé comme postulat, pas comme fait. Une fuite de données ne vide pas un portefeuille ; ce qui le vide est un contrat ou un site compromis qui utilise un droit accordé. Le texte dit « compromis ».
- « Les attaquants sont en avance » : appuyé sur un cas daté (Aerodrome, 81 minutes) plutôt que sur une affirmation générale.

## Sources

- Aerodrome, 81 minutes : `research/demo_reelle/RECHERCHE_douleurs_secondaires.md` (chiffre publié par Blockaid sur son propre délai : source intéressée, à dire si on nous le demande).
- 47,6 % et 34,2 % de droits illimités : `research/titouan/Z_approbations/onchain/Z4_illimite_par_plateforme.md`, repris dans `livrables/CHIFFRES.md`. Vérifier le libellé exact (période, échantillon) avant la slide.
- LI.FI : `research/demo_reelle/RECHERCHE_douleurs_secondaires.md` et `RECHERCHE_these_moindre_privilege.md` (post-mortem officiel).
- Jeu aveugle : `research/titouan/T_banc_e2e/blind_decalage/run/RESULTAT.md`.
- Postulat de compromission : NIST SP 800-207, section 2.2 (vérifié dans le PDF officiel par un agent, pas encore consigné dans le dépôt).
