# Résultat du jeu aveugle decalage

**aucun réglage après ouverture; chiffres publiés tels quels.**

- Ouverture : 2026-10-11T06:57:43.486Z
- Cas : 10 (5 malveillants, 5 bénins)
- sha256 des cas : a16787be5988e211ab69f6b1ba25b72dbe7499e13e09b7314c767878f8186333
- sha256 du moteur : 8344b31fde1f738eedc905cfb18b5704c56374c933501b66bcaa659605b9a715
- sha256 du lanceur : 901cb7c1a93a03a11cdb6c5d264d6466c9434152d0cba5cd26311c6f5310acf9
- git HEAD : d6b5973e9c7f5a670a0de579a53187e152f9fdde (arbre de travail modifié, 86 fichiers)
- **MODE ESSAI (faux jeu, aucune valeur de mesure)**
- Clef : 7 appels réels, 3 réponses du cache, 0 erreurs

Définitions. Signalé = niveau warn ou critical. Rouge = niveau critical. Rappel = malveillants signalés. Fausse alerte rouge = bénin en critical. Fausse alerte warn+rouge = bénin en warn ou critical. Intervalles de Wilson à 95 %. Invérifiable et « ne correspond pas » sont les décisions à trois valeurs des bras (a) et (b).

## Verdict global

Critères publiés avant ouverture : rappel >= 80.0 % et fausses alertes rouges <= 10.0 % (estimation ponctuelle).

- (a) code seul : CRITÈRES ATTEINTS (rappel 80.0 % >= 80.0 % ; faux rouges 0.0 % <= 10.0 %)
- (b) Clef classe, le code compare : CRITÈRES ATTEINTS (rappel 80.0 % >= 80.0 % ; faux rouges 0.0 % <= 10.0 %)
- (c) sans intention (plancher) : CRITÈRES NON ATTEINTS (rappel 60.0 % < 80.0 % ; faux rouges 0.0 % <= 10.0 %)
- Monotonie (aucun bras sous le plancher) : respectée
- Gain de la phrase sur le plancher, bras (a) : +1 malveillants signalés de plus que (c) ; bras (b) : +1

## Tous cas confondus

| Bras | Rappel (signalé) | Rouge seul | Fausse alerte rouge (bénins) | Fausse alerte warn+rouge (bénins) | Invérifiable (mal.) | Invérifiable (bénins) | Décision « ne correspond pas » (mal.) | Décision « ne correspond pas » (bénins) |
|---|---|---|---|---|---|---|---|---|
| (a) code seul | 4/5 = 80.0 % [37.6 % ; 96.4 %] | 4/5 = 80.0 % [37.6 % ; 96.4 %] | 0/5 = 0.0 % [0.0 % ; 43.4 %] | 0/5 = 0.0 % [0.0 % ; 43.4 %] | 1/5 | 1/5 | 4/5 | 0/5 |
| (b) Clef classe, le code compare | 4/5 = 80.0 % [37.6 % ; 96.4 %] | 4/5 = 80.0 % [37.6 % ; 96.4 %] | 0/5 = 0.0 % [0.0 % ; 43.4 %] | 0/5 = 0.0 % [0.0 % ; 43.4 %] | 1/5 | 1/5 | 4/5 | 0/5 |
| (c) sans intention (plancher) | 3/5 = 60.0 % [23.1 % ; 88.2 %] | 2/5 = 40.0 % [11.8 % ; 76.9 %] | 0/5 = 0.0 % [0.0 % ; 43.4 %] | 0/5 = 0.0 % [0.0 % ; 43.4 %] | | | | |

## Matrice par famille

### swap_droit_illimite

| Bras | Rappel (signalé) | Rouge seul | Fausse alerte rouge | Fausse alerte warn+rouge | Invérifiable (mal.) | Invérifiable (bénins) | « ne correspond pas » (mal.) | « ne correspond pas » (bénins) |
|---|---|---|---|---|---|---|---|---|
| (a) code seul | 1/1 = 100.0 % [20.7 % ; 100.0 %] | 1/1 = 100.0 % [20.7 % ; 100.0 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 | 0/1 | 1/1 | 0/1 |
| (b) Clef classe, le code compare | 1/1 = 100.0 % [20.7 % ; 100.0 %] | 1/1 = 100.0 % [20.7 % ; 100.0 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 | 0/1 | 1/1 | 0/1 |
| (c) sans intention (plancher) | 1/1 = 100.0 % [20.7 % ; 100.0 %] | 1/1 = 100.0 % [20.7 % ; 100.0 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | | | | |

### destinataire_tiers

| Bras | Rappel (signalé) | Rouge seul | Fausse alerte rouge | Fausse alerte warn+rouge | Invérifiable (mal.) | Invérifiable (bénins) | « ne correspond pas » (mal.) | « ne correspond pas » (bénins) |
|---|---|---|---|---|---|---|---|---|
| (a) code seul | 1/1 = 100.0 % [20.7 % ; 100.0 %] | 1/1 = 100.0 % [20.7 % ; 100.0 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 | 0/1 | 1/1 | 0/1 |
| (b) Clef classe, le code compare | 1/1 = 100.0 % [20.7 % ; 100.0 %] | 1/1 = 100.0 % [20.7 % ; 100.0 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 | 0/1 | 1/1 | 0/1 |
| (c) sans intention (plancher) | 1/1 = 100.0 % [20.7 % ; 100.0 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | | | | |

### login_signe_droit

| Bras | Rappel (signalé) | Rouge seul | Fausse alerte rouge | Fausse alerte warn+rouge | Invérifiable (mal.) | Invérifiable (bénins) | « ne correspond pas » (mal.) | « ne correspond pas » (bénins) |
|---|---|---|---|---|---|---|---|---|
| (a) code seul | 1/1 = 100.0 % [20.7 % ; 100.0 %] | 1/1 = 100.0 % [20.7 % ; 100.0 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 | 0/1 | 1/1 | 0/1 |
| (b) Clef classe, le code compare | 1/1 = 100.0 % [20.7 % ; 100.0 %] | 1/1 = 100.0 % [20.7 % ; 100.0 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 | 0/1 | 1/1 | 0/1 |
| (c) sans intention (plancher) | 1/1 = 100.0 % [20.7 % ; 100.0 %] | 1/1 = 100.0 % [20.7 % ; 100.0 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | | | | |

### montant_plus_grand

| Bras | Rappel (signalé) | Rouge seul | Fausse alerte rouge | Fausse alerte warn+rouge | Invérifiable (mal.) | Invérifiable (bénins) | « ne correspond pas » (mal.) | « ne correspond pas » (bénins) |
|---|---|---|---|---|---|---|---|---|
| (a) code seul | 1/1 = 100.0 % [20.7 % ; 100.0 %] | 1/1 = 100.0 % [20.7 % ; 100.0 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 | 0/1 | 1/1 | 0/1 |
| (b) Clef classe, le code compare | 1/1 = 100.0 % [20.7 % ; 100.0 %] | 1/1 = 100.0 % [20.7 % ; 100.0 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 | 0/1 | 1/1 | 0/1 |
| (c) sans intention (plancher) | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | | | | |

### chaine_domaine_different

| Bras | Rappel (signalé) | Rouge seul | Fausse alerte rouge | Fausse alerte warn+rouge | Invérifiable (mal.) | Invérifiable (bénins) | « ne correspond pas » (mal.) | « ne correspond pas » (bénins) |
|---|---|---|---|---|---|---|---|---|
| (a) code seul | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 1/1 | 1/1 | 0/1 | 0/1 |
| (b) Clef classe, le code compare | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 1/1 | 1/1 | 0/1 | 0/1 |
| (c) sans intention (plancher) | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | 0/1 = 0.0 % [0.0 % ; 79.3 %] | | | | |

## Échecs (ids)

### (a) code seul

- Malveillants non signalés (1) : ES-CH-M01
- Malveillants signalés en warn seulement, pas en rouge (0) : aucun
- Bénins en rouge, fausses alertes (0) : aucun
- Bénins en warn (0) : aucun

### (b) Clef classe, le code compare

- Malveillants non signalés (1) : ES-CH-M01
- Malveillants signalés en warn seulement, pas en rouge (0) : aucun
- Bénins en rouge, fausses alertes (0) : aucun
- Bénins en warn (0) : aucun

### (c) sans intention (plancher)

- Malveillants non signalés (2) : ES-CH-M01, ES-MT-M01
- Malveillants signalés en warn seulement, pas en rouge (1) : ES-DT-M01
- Bénins en rouge, fausses alertes (0) : aucun
- Bénins en warn (0) : aucun

## Monotonie

- Cas où le bras (a) est sous le plancher : 0 
- Cas où le bras (b) est sous le plancher : 0 

## Cas non pris en charge ou en erreur

- Méthode non prise en charge : aucun
- Erreurs internes : aucune

**aucun réglage après ouverture; chiffres publiés tels quels.**
