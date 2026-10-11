# Résultat du jeu aveugle decalage

**aucun réglage après ouverture; chiffres publiés tels quels.**

- Ouverture : 2026-10-11T07:10:52.843Z
- Cas : 250 (150 malveillants, 100 bénins)
- sha256 des cas : ab3dcab945af0a75fab45f05138a8d608886dbcd4d945ab5a47d3c627ee79fd2
- sha256 du moteur : a5b19d8375014f2859e0372b6b6f6f90ba677b74233ab2720aeb2cae16732dfe
- sha256 du lanceur : 901cb7c1a93a03a11cdb6c5d264d6466c9434152d0cba5cd26311c6f5310acf9
- git HEAD : 74203dae38e08bcefab17b8fb6308893160a6c1c (arbre de travail modifié, 3 fichiers)
- Clef : 151 appels réels, 99 réponses du cache, 0 erreurs

Définitions. Signalé = niveau warn ou critical. Rouge = niveau critical. Rappel = malveillants signalés. Fausse alerte rouge = bénin en critical. Fausse alerte warn+rouge = bénin en warn ou critical. Intervalles de Wilson à 95 %. Invérifiable et « ne correspond pas » sont les décisions à trois valeurs des bras (a) et (b).

## Verdict global

Critères publiés avant ouverture : rappel >= 80.0 % et fausses alertes rouges <= 10.0 % (estimation ponctuelle).

- (a) code seul : CRITÈRES NON ATTEINTS (rappel 87.3 % >= 80.0 % ; faux rouges 15.0 % > 10.0 %)
- (b) Clef classe, le code compare : CRITÈRES NON ATTEINTS (rappel 88.7 % >= 80.0 % ; faux rouges 16.0 % > 10.0 %)
- (c) sans intention (plancher) : CRITÈRES NON ATTEINTS (rappel 64.7 % < 80.0 % ; faux rouges 15.0 % > 10.0 %)
- Monotonie (aucun bras sous le plancher) : respectée
- Gain de la phrase sur le plancher, bras (a) : +34 malveillants signalés de plus que (c) ; bras (b) : +36

## Tous cas confondus

| Bras | Rappel (signalé) | Rouge seul | Fausse alerte rouge (bénins) | Fausse alerte warn+rouge (bénins) | Invérifiable (mal.) | Invérifiable (bénins) | Décision « ne correspond pas » (mal.) | Décision « ne correspond pas » (bénins) |
|---|---|---|---|---|---|---|---|---|
| (a) code seul | 131/150 = 87.3 % [81.1 % ; 91.7 %] | 114/150 = 76.0 % [68.6 % ; 82.1 %] | 15/100 = 15.0 % [9.3 % ; 23.3 %] | 30/100 = 30.0 % [21.9 % ; 39.6 %] | 33/150 | 43/100 | 106/150 | 13/100 |
| (b) Clef classe, le code compare | 133/150 = 88.7 % [82.6 % ; 92.8 %] | 117/150 = 78.0 % [70.7 % ; 83.9 %] | 16/100 = 16.0 % [10.1 % ; 24.4 %] | 29/100 = 29.0 % [21.0 % ; 38.5 %] | 46/150 | 39/100 | 93/150 | 3/100 |
| (c) sans intention (plancher) | 97/150 = 64.7 % [56.7 % ; 71.9 %] | 80/150 = 53.3 % [45.4 % ; 61.1 %] | 15/100 = 15.0 % [9.3 % ; 23.3 %] | 27/100 = 27.0 % [19.3 % ; 36.4 %] | | | | |

## Matrice par famille

### swap_droit_illimite

| Bras | Rappel (signalé) | Rouge seul | Fausse alerte rouge | Fausse alerte warn+rouge | Invérifiable (mal.) | Invérifiable (bénins) | « ne correspond pas » (mal.) | « ne correspond pas » (bénins) |
|---|---|---|---|---|---|---|---|---|
| (a) code seul | 18/19 = 94.7 % [75.4 % ; 99.1 %] | 5/19 = 26.3 % [11.8 % ; 48.8 %] | 0/13 = 0.0 % [0.0 % ; 22.8 %] | 1/13 = 7.7 % [1.4 % ; 33.3 %] | 3/19 | 5/13 | 16/19 | 1/13 |
| (b) Clef classe, le code compare | 18/19 = 94.7 % [75.4 % ; 99.1 %] | 6/19 = 31.6 % [15.4 % ; 54.0 %] | 1/13 = 7.7 % [1.4 % ; 33.3 %] | 1/13 = 7.7 % [1.4 % ; 33.3 %] | 3/19 | 4/13 | 16/19 | 1/13 |
| (c) sans intention (plancher) | 6/19 = 31.6 % [15.4 % ; 54.0 %] | 5/19 = 26.3 % [11.8 % ; 48.8 %] | 0/13 = 0.0 % [0.0 % ; 22.8 %] | 0/13 = 0.0 % [0.0 % ; 22.8 %] | | | | |

### jeton_different

| Bras | Rappel (signalé) | Rouge seul | Fausse alerte rouge | Fausse alerte warn+rouge | Invérifiable (mal.) | Invérifiable (bénins) | « ne correspond pas » (mal.) | « ne correspond pas » (bénins) |
|---|---|---|---|---|---|---|---|---|
| (a) code seul | 12/19 = 63.2 % [41.0 % ; 80.9 %] | 12/19 = 63.2 % [41.0 % ; 80.9 %] | 1/13 = 7.7 % [1.4 % ; 33.3 %] | 1/13 = 7.7 % [1.4 % ; 33.3 %] | 0/19 | 4/13 | 16/19 | 1/13 |
| (b) Clef classe, le code compare | 14/19 = 73.7 % [51.2 % ; 88.2 %] | 14/19 = 73.7 % [51.2 % ; 88.2 %] | 1/13 = 7.7 % [1.4 % ; 33.3 %] | 1/13 = 7.7 % [1.4 % ; 33.3 %] | 0/19 | 3/13 | 16/19 | 0/13 |
| (c) sans intention (plancher) | 6/19 = 31.6 % [15.4 % ; 54.0 %] | 4/19 = 21.1 % [8.5 % ; 43.3 %] | 1/13 = 7.7 % [1.4 % ; 33.3 %] | 1/13 = 7.7 % [1.4 % ; 33.3 %] | | | | |

### destinataire_tiers

| Bras | Rappel (signalé) | Rouge seul | Fausse alerte rouge | Fausse alerte warn+rouge | Invérifiable (mal.) | Invérifiable (bénins) | « ne correspond pas » (mal.) | « ne correspond pas » (bénins) |
|---|---|---|---|---|---|---|---|---|
| (a) code seul | 19/19 = 100.0 % [83.2 % ; 100.0 %] | 19/19 = 100.0 % [83.2 % ; 100.0 %] | 2/13 = 15.4 % [4.3 % ; 42.2 %] | 3/13 = 23.1 % [8.2 % ; 50.3 %] | 2/19 | 1/13 | 17/19 | 1/13 |
| (b) Clef classe, le code compare | 19/19 = 100.0 % [83.2 % ; 100.0 %] | 19/19 = 100.0 % [83.2 % ; 100.0 %] | 2/13 = 15.4 % [4.3 % ; 42.2 %] | 3/13 = 23.1 % [8.2 % ; 50.3 %] | 4/19 | 1/13 | 15/19 | 1/13 |
| (c) sans intention (plancher) | 19/19 = 100.0 % [83.2 % ; 100.0 %] | 14/19 = 73.7 % [51.2 % ; 88.2 %] | 2/13 = 15.4 % [4.3 % ; 42.2 %] | 3/13 = 23.1 % [8.2 % ; 50.3 %] | | | | |

### airdrop_sortie_ou_droit

| Bras | Rappel (signalé) | Rouge seul | Fausse alerte rouge | Fausse alerte warn+rouge | Invérifiable (mal.) | Invérifiable (bénins) | « ne correspond pas » (mal.) | « ne correspond pas » (bénins) |
|---|---|---|---|---|---|---|---|---|
| (a) code seul | 19/19 = 100.0 % [83.2 % ; 100.0 %] | 19/19 = 100.0 % [83.2 % ; 100.0 %] | 0/13 = 0.0 % [0.0 % ; 22.8 %] | 5/13 = 38.5 % [17.7 % ; 64.5 %] | 5/19 | 13/13 | 14/19 | 0/13 |
| (b) Clef classe, le code compare | 19/19 = 100.0 % [83.2 % ; 100.0 %] | 19/19 = 100.0 % [83.2 % ; 100.0 %] | 0/13 = 0.0 % [0.0 % ; 22.8 %] | 5/13 = 38.5 % [17.7 % ; 64.5 %] | 4/19 | 13/13 | 15/19 | 0/13 |
| (c) sans intention (plancher) | 19/19 = 100.0 % [83.2 % ; 100.0 %] | 14/19 = 73.7 % [51.2 % ; 88.2 %] | 0/13 = 0.0 % [0.0 % ; 22.8 %] | 5/13 = 38.5 % [17.7 % ; 64.5 %] | | | | |

### login_signe_droit

| Bras | Rappel (signalé) | Rouge seul | Fausse alerte rouge | Fausse alerte warn+rouge | Invérifiable (mal.) | Invérifiable (bénins) | « ne correspond pas » (mal.) | « ne correspond pas » (bénins) |
|---|---|---|---|---|---|---|---|---|
| (a) code seul | 14/19 = 73.7 % [51.2 % ; 88.2 %] | 12/19 = 63.2 % [41.0 % ; 80.9 %] | 0/12 = 0.0 % [0.0 % ; 24.3 %] | 5/12 = 41.7 % [19.3 % ; 68.0 %] | 9/19 | 11/12 | 8/19 | 0/12 |
| (b) Clef classe, le code compare | 14/19 = 73.7 % [51.2 % ; 88.2 %] | 12/19 = 63.2 % [41.0 % ; 80.9 %] | 0/12 = 0.0 % [0.0 % ; 24.3 %] | 4/12 = 33.3 % [13.8 % ; 60.9 %] | 9/19 | 9/12 | 8/19 | 0/12 |
| (c) sans intention (plancher) | 14/19 = 73.7 % [51.2 % ; 88.2 %] | 12/19 = 63.2 % [41.0 % ; 80.9 %] | 0/12 = 0.0 % [0.0 % ; 24.3 %] | 4/12 = 33.3 % [13.8 % ; 60.9 %] | | | | |

### montant_plus_grand

| Bras | Rappel (signalé) | Rouge seul | Fausse alerte rouge | Fausse alerte warn+rouge | Invérifiable (mal.) | Invérifiable (bénins) | « ne correspond pas » (mal.) | « ne correspond pas » (bénins) |
|---|---|---|---|---|---|---|---|---|
| (a) code seul | 19/19 = 100.0 % [83.2 % ; 100.0 %] | 17/19 = 89.5 % [68.6 % ; 97.1 %] | 1/12 = 8.3 % [1.5 % ; 35.4 %] | 2/12 = 16.7 % [4.7 % ; 44.8 %] | 0/19 | 0/12 | 19/19 | 1/12 |
| (b) Clef classe, le code compare | 19/19 = 100.0 % [83.2 % ; 100.0 %] | 17/19 = 89.5 % [68.6 % ; 97.1 %] | 1/12 = 8.3 % [1.5 % ; 35.4 %] | 2/12 = 16.7 % [4.7 % ; 44.8 %] | 0/19 | 0/12 | 19/19 | 1/12 |
| (c) sans intention (plancher) | 3/19 = 15.8 % [5.5 % ; 37.6 %] | 1/19 = 5.3 % [0.9 % ; 24.6 %] | 1/12 = 8.3 % [1.5 % ; 35.4 %] | 1/12 = 8.3 % [1.5 % ; 35.4 %] | | | | |

### chaine_domaine_different

| Bras | Rappel (signalé) | Rouge seul | Fausse alerte rouge | Fausse alerte warn+rouge | Invérifiable (mal.) | Invérifiable (bénins) | « ne correspond pas » (mal.) | « ne correspond pas » (bénins) |
|---|---|---|---|---|---|---|---|---|
| (a) code seul | 12/18 = 66.7 % [43.7 % ; 83.7 %] | 12/18 = 66.7 % [43.7 % ; 83.7 %] | 0/12 = 0.0 % [0.0 % ; 24.3 %] | 1/12 = 8.3 % [1.5 % ; 35.4 %] | 12/18 | 8/12 | 0/18 | 0/12 |
| (b) Clef classe, le code compare | 12/18 = 66.7 % [43.7 % ; 83.7 %] | 12/18 = 66.7 % [43.7 % ; 83.7 %] | 0/12 = 0.0 % [0.0 % ; 24.3 %] | 1/12 = 8.3 % [1.5 % ; 35.4 %] | 12/18 | 8/12 | 0/18 | 0/12 |
| (c) sans intention (plancher) | 12/18 = 66.7 % [43.7 % ; 83.7 %] | 12/18 = 66.7 % [43.7 % ; 83.7 %] | 0/12 = 0.0 % [0.0 % ; 24.3 %] | 1/12 = 8.3 % [1.5 % ; 35.4 %] | | | | |

### seaport_prix_quasi_nul

| Bras | Rappel (signalé) | Rouge seul | Fausse alerte rouge | Fausse alerte warn+rouge | Invérifiable (mal.) | Invérifiable (bénins) | « ne correspond pas » (mal.) | « ne correspond pas » (bénins) |
|---|---|---|---|---|---|---|---|---|
| (a) code seul | 18/18 = 100.0 % [82.4 % ; 100.0 %] | 18/18 = 100.0 % [82.4 % ; 100.0 %] | 11/12 = 91.7 % [64.6 % ; 98.5 %] | 12/12 = 100.0 % [75.7 % ; 100.0 %] | 2/18 | 1/12 | 16/18 | 9/12 |
| (b) Clef classe, le code compare | 18/18 = 100.0 % [82.4 % ; 100.0 %] | 18/18 = 100.0 % [82.4 % ; 100.0 %] | 11/12 = 91.7 % [64.6 % ; 98.5 %] | 12/12 = 100.0 % [75.7 % ; 100.0 %] | 14/18 | 1/12 | 4/18 | 0/12 |
| (c) sans intention (plancher) | 18/18 = 100.0 % [82.4 % ; 100.0 %] | 18/18 = 100.0 % [82.4 % ; 100.0 %] | 11/12 = 91.7 % [64.6 % ; 98.5 %] | 12/12 = 100.0 % [75.7 % ; 100.0 %] | | | | |

## Échecs (ids)

### (a) code seul

- Malveillants non signalés (19) : BD-CH-M01, BD-CH-M04, BD-CH-M07, BD-CH-M09, BD-CH-M12, BD-CH-M17, BD-LG-M01, BD-LG-M09, BD-LG-M10, BD-LG-M18, BD-LG-M19, BD-SW-M07, BD-TK-M02, BD-TK-M05, BD-TK-M07, BD-TK-M08, BD-TK-M13, BD-TK-M15, BD-TK-M16
- Malveillants signalés en warn seulement, pas en rouge (17) : BD-LG-M07, BD-LG-M16, BD-MT-M08, BD-MT-M16, BD-SW-M01, BD-SW-M02, BD-SW-M04, BD-SW-M05, BD-SW-M06, BD-SW-M09, BD-SW-M10, BD-SW-M11, BD-SW-M12, BD-SW-M13, BD-SW-M14, BD-SW-M17, BD-SW-M18
- Bénins en rouge, fausses alertes (15) : BD-DT-B03, BD-DT-B09, BD-MT-B03, BD-SP-B01, BD-SP-B02, BD-SP-B03, BD-SP-B04, BD-SP-B05, BD-SP-B06, BD-SP-B08, BD-SP-B09, BD-SP-B10, BD-SP-B11, BD-SP-B12, BD-TK-B03
- Bénins en warn (15) : BD-AD-B02, BD-AD-B03, BD-AD-B07, BD-AD-B10, BD-AD-B11, BD-CH-B08, BD-DT-B06, BD-LG-B04, BD-LG-B05, BD-LG-B07, BD-LG-B08, BD-LG-B11, BD-MT-B08, BD-SP-B07, BD-SW-B05

### (b) Clef classe, le code compare

- Malveillants non signalés (17) : BD-CH-M01, BD-CH-M04, BD-CH-M07, BD-CH-M09, BD-CH-M12, BD-CH-M17, BD-LG-M01, BD-LG-M09, BD-LG-M10, BD-LG-M18, BD-LG-M19, BD-SW-M07, BD-TK-M02, BD-TK-M07, BD-TK-M08, BD-TK-M15, BD-TK-M16
- Malveillants signalés en warn seulement, pas en rouge (16) : BD-LG-M07, BD-LG-M16, BD-MT-M08, BD-MT-M16, BD-SW-M01, BD-SW-M02, BD-SW-M04, BD-SW-M05, BD-SW-M06, BD-SW-M09, BD-SW-M10, BD-SW-M11, BD-SW-M12, BD-SW-M14, BD-SW-M17, BD-SW-M18
- Bénins en rouge, fausses alertes (16) : BD-DT-B03, BD-DT-B09, BD-MT-B03, BD-SP-B01, BD-SP-B02, BD-SP-B03, BD-SP-B04, BD-SP-B05, BD-SP-B06, BD-SP-B08, BD-SP-B09, BD-SP-B10, BD-SP-B11, BD-SP-B12, BD-SW-B13, BD-TK-B03
- Bénins en warn (13) : BD-AD-B02, BD-AD-B03, BD-AD-B07, BD-AD-B10, BD-AD-B11, BD-CH-B08, BD-DT-B06, BD-LG-B04, BD-LG-B05, BD-LG-B07, BD-LG-B08, BD-MT-B08, BD-SP-B07

### (c) sans intention (plancher)

- Malveillants non signalés (53) : BD-CH-M01, BD-CH-M04, BD-CH-M07, BD-CH-M09, BD-CH-M12, BD-CH-M17, BD-LG-M01, BD-LG-M09, BD-LG-M10, BD-LG-M18, BD-LG-M19, BD-MT-M01, BD-MT-M02, BD-MT-M05, BD-MT-M06, BD-MT-M07, BD-MT-M08, BD-MT-M09, BD-MT-M10, BD-MT-M11, BD-MT-M13, BD-MT-M14, BD-MT-M15, BD-MT-M16, BD-MT-M17, BD-MT-M18, BD-MT-M19, BD-SW-M01, BD-SW-M02, BD-SW-M04, BD-SW-M05, BD-SW-M06, BD-SW-M07, BD-SW-M09, BD-SW-M10, BD-SW-M12, BD-SW-M13, BD-SW-M14, BD-SW-M17, BD-SW-M18, BD-TK-M01, BD-TK-M02, BD-TK-M05, BD-TK-M07, BD-TK-M08, BD-TK-M10, BD-TK-M11, BD-TK-M13, BD-TK-M15, BD-TK-M16, BD-TK-M17, BD-TK-M18, BD-TK-M19
- Malveillants signalés en warn seulement, pas en rouge (17) : BD-AD-M03, BD-AD-M04, BD-AD-M11, BD-AD-M12, BD-AD-M19, BD-DT-M04, BD-DT-M07, BD-DT-M08, BD-DT-M12, BD-DT-M16, BD-LG-M07, BD-LG-M16, BD-MT-M04, BD-MT-M12, BD-SW-M11, BD-TK-M06, BD-TK-M14
- Bénins en rouge, fausses alertes (15) : BD-DT-B03, BD-DT-B09, BD-MT-B03, BD-SP-B01, BD-SP-B02, BD-SP-B03, BD-SP-B04, BD-SP-B05, BD-SP-B06, BD-SP-B08, BD-SP-B09, BD-SP-B10, BD-SP-B11, BD-SP-B12, BD-TK-B03
- Bénins en warn (12) : BD-AD-B02, BD-AD-B03, BD-AD-B07, BD-AD-B10, BD-AD-B11, BD-CH-B08, BD-DT-B06, BD-LG-B04, BD-LG-B05, BD-LG-B07, BD-LG-B08, BD-SP-B07

## Monotonie

- Cas où le bras (a) est sous le plancher : 0 
- Cas où le bras (b) est sous le plancher : 0 

## Cas non pris en charge ou en erreur

- Méthode non prise en charge : aucun
- Erreurs internes : aucune

**aucun réglage après ouverture; chiffres publiés tels quels.**
