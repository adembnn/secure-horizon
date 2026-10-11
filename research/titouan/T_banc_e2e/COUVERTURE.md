# COUVERTURE du banc E2E

Généré par run/run_loop.mjs, tour R003, 2026-10-11T00:25:21.926Z. Hash règles f952f3fb298f (rules.mjs + compare.ts), hash code be6db0705432. TEST OUVERT à ce tour (ouverture n°1) ; ouvertures cumulées : 1.

**Lecture** : "attrapé" = malveillant avec verdict final critical ou warn ; "raté" = malveillant avec verdict ok ; "inconnu" = méthode non gérée ou erreur du moteur (compté à part, NON attrapé dans le rappel) ; "fraude conforme" = transfert légitime à l'intention honnête, hors portée par construction (rapportée à part). Les intervalles sont de Wilson 95 %, avec k/n. Le catalogue est synthétique, écrit par un auteur non aveugle : les chiffres mesurent la couverture et la non-régression, pas la robustesse face à un attaquant réel.

Bras : `reference_simulation` = seul le mouvement d'actifs immédiat décodé (sortie sans entrée => warn) ; `sans_intention` = plancher objectif du moteur ; `intention_honnete` = max(plancher, Adem avec une intention dérivée des effets) ; `intention_mensongere` = max(plancher, Adem avec l'intention du catalogue : celle qui a été soufflée à la victime pour les malveillants, honnête pour les bénins).

## DEV (n=385; la famille eip7702 est hors DEV)

| bras | rappel (critical ou warn) | rappel critical seul | rappel hors inconnu | fausse alerte critical | fausse alerte warn+critical (brut) | FA warn au-delà du toléré+critical | fraude conforme alertée |
|---|---|---|---|---|---|---|---|
| reference_simulation | 30.2% [24.8-36.1] (76/252) | 0.0% [0.0-1.5] (0/252) | 31.5% [26.0-37.6] (76/241) | 0.0% [0.0-4.1] (0/90) | 38.9% [29.5-49.2] (35/90) | 38.9% [29.5-49.2] (35/90) | 100.0% [86.2-100.0] (24/24) |
| sans_intention | 85.3% [80.4-89.2] (215/252) | 63.1% [57.0-68.8] (159/252) | 89.2% [84.7-92.5] (215/241) | 5.6% [2.4-12.3] (5/90) | 26.7% [18.6-36.6] (24/90) | 26.7% [18.6-36.6] (24/90) | 54.2% [35.1-72.1] (13/24) |
| intention_honnete | 88.1% [83.5-91.5] (222/252) | 63.1% [57.0-68.8] (159/252) | 92.1% [88.0-94.9] (222/241) | 5.6% [2.4-12.3] (5/90) | 26.7% [18.6-36.6] (24/90) | 26.7% [18.6-36.6] (24/90) | 87.5% [69.0-95.7] (21/24) |
| intention_mensongere | 89.3% [84.9-92.5] (225/252) | 79.0% [73.5-83.5] (199/252) | 93.4% [89.5-95.9] (225/241) | 21.1% [14.0-30.6] (19/90) | 26.7% [18.6-36.6] (24/90) | 26.7% [18.6-36.6] (24/90) | 87.5% [69.0-95.7] (21/24) |

### Matrice catégorie × (attrapé / raté / fausse alerte), bras intention_mensongere

| catégorie | n total | n malv. | attrapé critical | attrapé warn | raté | inconnu | n bénin | fausse alerte critical | fausse alerte warn (au-delà du toléré) | warn toléré | n ambigu (ok/warn/crit) | n fraude conforme (passée/alertée) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1_droits_depense_directs | 33 | 33 | 33 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 (0/0/0) | 0 (0/0) |
| 2_signatures_hors_chaine | 91 | 85 | 62 | 12 | 6 | 8 | 0 | 0 | 0 | 0 | 6 (0/3/0) | 0 (0/0) |
| 3_controle_et_roles | 35 | 33 | 25 | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 2 (0/0/2) | 0 (0/0) |
| 4_execution_indirecte | 10 | 10 | 4 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 (0/0/0) | 0 (0/0) |
| 6_contrepartie | 26 | 23 | 19 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 3 (0/3/0) | 0 (0/0) |
| 7_tokens | 10 | 10 | 0 | 0 | 10 | 0 | 0 | 0 | 0 | 0 | 0 (0/0/0) | 0 (0/0) |
| 8_swaps_et_ponts | 20 | 12 | 12 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8 (0/8/0) | 0 (0/0) |
| 9_faux_frontend_et_sites | 14 | 14 | 12 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 (0/0/0) | 0 (0/0) |
| 11_parcours_conformes | 56 | 32 | 32 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 (0/0/0) | 24 (3/21) |
| benin | 90 | 0 | 0 | 0 | 0 | 3 | 90 | 19 | 5 | 0 | 0 (0/0/0) | 0 (0/0) |

### Même matrice, plancher seul (sans intention)

| catégorie | n total | n malv. | attrapé critical | attrapé warn | raté | inconnu | n bénin | fausse alerte critical | fausse alerte warn (au-delà du toléré) | warn toléré | n ambigu (ok/warn/crit) | n fraude conforme (passée/alertée) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1_droits_depense_directs | 33 | 33 | 31 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 (0/0/0) | 0 (0/0) |
| 2_signatures_hors_chaine | 91 | 85 | 53 | 21 | 6 | 8 | 0 | 0 | 0 | 0 | 6 (0/3/0) | 0 (0/0) |
| 3_controle_et_roles | 35 | 33 | 25 | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 2 (0/0/2) | 0 (0/0) |
| 4_execution_indirecte | 10 | 10 | 4 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 (0/0/0) | 0 (0/0) |
| 6_contrepartie | 26 | 23 | 16 | 0 | 7 | 0 | 0 | 0 | 0 | 0 | 3 (3/0/0) | 0 (0/0) |
| 7_tokens | 10 | 10 | 0 | 0 | 10 | 0 | 0 | 0 | 0 | 0 | 0 (0/0/0) | 0 (0/0) |
| 8_swaps_et_ponts | 20 | 12 | 12 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8 (0/8/0) | 0 (0/0) |
| 9_faux_frontend_et_sites | 14 | 14 | 6 | 5 | 3 | 0 | 0 | 0 | 0 | 0 | 0 (0/0/0) | 0 (0/0) |
| 11_parcours_conformes | 56 | 32 | 12 | 20 | 0 | 0 | 0 | 0 | 0 | 0 | 0 (0/0/0) | 24 (11/13) |
| benin | 90 | 0 | 0 | 0 | 0 | 3 | 90 | 5 | 19 | 0 | 0 (0/0/0) | 0 (0/0) |

### Même matrice, référence simulation seule

| catégorie | n total | n malv. | attrapé critical | attrapé warn | raté | inconnu | n bénin | fausse alerte critical | fausse alerte warn (au-delà du toléré) | warn toléré | n ambigu (ok/warn/crit) | n fraude conforme (passée/alertée) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1_droits_depense_directs | 33 | 33 | 0 | 0 | 33 | 0 | 0 | 0 | 0 | 0 | 0 (0/0/0) | 0 (0/0) |
| 2_signatures_hors_chaine | 91 | 85 | 0 | 11 | 69 | 8 | 0 | 0 | 0 | 0 | 6 (3/0/0) | 0 (0/0) |
| 3_controle_et_roles | 35 | 33 | 0 | 0 | 33 | 0 | 0 | 0 | 0 | 0 | 2 (2/0/0) | 0 (0/0) |
| 4_execution_indirecte | 10 | 10 | 0 | 0 | 10 | 0 | 0 | 0 | 0 | 0 | 0 (0/0/0) | 0 (0/0) |
| 6_contrepartie | 26 | 23 | 0 | 23 | 0 | 0 | 0 | 0 | 0 | 0 | 3 (0/3/0) | 0 (0/0) |
| 7_tokens | 10 | 10 | 0 | 4 | 6 | 0 | 0 | 0 | 0 | 0 | 0 (0/0/0) | 0 (0/0) |
| 8_swaps_et_ponts | 20 | 12 | 0 | 12 | 0 | 0 | 0 | 0 | 0 | 0 | 8 (8/0/0) | 0 (0/0) |
| 9_faux_frontend_et_sites | 14 | 14 | 0 | 6 | 8 | 0 | 0 | 0 | 0 | 0 | 0 (0/0/0) | 0 (0/0) |
| 11_parcours_conformes | 56 | 32 | 0 | 20 | 12 | 0 | 0 | 0 | 0 | 0 | 0 (0/0/0) | 24 (0/24) |
| benin | 90 | 0 | 0 | 0 | 0 | 3 | 90 | 0 | 35 | 0 | 0 (0/0/0) | 0 (0/0) |

### Par famille (DEV)

| famille | n malv. | rappel simulation seule | rappel plancher | rappel honnête | rappel mensongère (critical+warn / critical) | n bénin | FA critical (mens.) | FA warn excès (mens.) |
|---|---|---|---|---|---|---|---|---|
| adresse_empoisonnee | 15 | 15/15 | 15/15 | 15/15 | 15/15 / 15 | 0 | 0 | 0 |
| approve_erc20 | 20 | 0/20 | 20/20 | 20/20 | 20/20 / 20 | 12 | 0 | 0 |
| blur | 4 | 0/4 | 4/4 | 4/4 | 4/4 / 0 | 2 | 0 | 2 |
| changement_reseau | 5 | 0/5 | 0/5 | 0/5 | 0/5 / 0 | 3 | 0 | 0 |
| controle_admin | 10 | 0/10 | 10/10 | 10/10 | 10/10 / 10 | 3 | 3 | 0 |
| cow_uniswapx | 11 | 5/11 | 5/11 | 5/11 | 5/11 / 5 | 7 | 0 | 0 |
| dai_permit | 8 | 0/8 | 8/8 | 8/8 | 8/8 / 8 | 0 | 0 | 0 |
| depot_exchange | 0 | 0/0 | 0/0 | 0/0 | 0/0 / 0 | 6 | 0 | 0 |
| domaine_sosie | 9 | 3/9 | 9/9 | 9/9 | 9/9 / 9 | 0 | 0 | 0 |
| ens_sosie | 4 | 4/4 | 0/4 | 4/4 | 4/4 / 0 | 0 | 0 | 0 |
| envoi_contact | 0 | 0/0 | 0/0 | 0/0 | 0/0 / 0 | 12 | 0 | 0 |
| erc4337_userop | 11 | 0/11 | 11/11 | 11/11 | 11/11 / 3 | 3 | 0 | 3 |
| eth_sign_aveugle | 6 | 0/6 | 6/6 | 6/6 | 6/6 / 6 | 0 | 0 | 0 |
| faux_airdrop | 5 | 2/5 | 5/5 | 5/5 | 5/5 / 5 | 0 | 0 | 0 |
| faux_concours | 4 | 3/4 | 4/4 | 4/4 | 4/4 / 4 | 0 | 0 | 0 |
| faux_proche | 5 | 3/5 | 5/5 | 5/5 | 5/5 / 5 | 0 | 0 | 0 |
| faux_recruteur | 2 | 0/2 | 2/2 | 2/2 | 2/2 / 2 | 0 | 0 | 0 |
| faux_remboursement | 4 | 3/4 | 4/4 | 4/4 | 4/4 / 4 | 0 | 0 | 0 |
| faux_support | 6 | 4/6 | 6/6 | 6/6 | 6/6 / 6 | 0 | 0 | 0 |
| faux_token | 4 | 4/4 | 0/4 | 0/4 | 0/4 / 0 | 0 | 0 | 0 |
| honeypot | 6 | 0/6 | 0/6 | 0/6 | 0/6 / 0 | 0 | 0 | 0 |
| increase_allowance | 4 | 0/4 | 4/4 | 4/4 | 4/4 / 4 | 0 | 0 | 0 |
| kit_drainer | 5 | 3/5 | 2/5 | 2/5 | 5/5 / 3 | 0 | 0 | 0 |
| mint_nft | 0 | 0/0 | 0/0 | 0/0 | 0/0 / 0 | 8 | 8 | 0 |
| multicall_cache | 10 | 0/10 | 4/10 | 4/10 | 4/10 / 4 | 0 | 0 | 0 |
| nouveau_contrat_legit | 0 | 0/0 | 0/0 | 0/0 | 0/0 / 0 | 6 | 6 | 0 |
| permit2_allowance | 12 | 0/12 | 12/12 | 12/12 | 12/12 / 11 | 0 | 0 | 0 |
| permit2_signature_transfer | 7 | 0/7 | 7/7 | 7/7 | 7/7 / 4 | 0 | 0 | 0 |
| permit_2612 | 12 | 0/12 | 12/12 | 12/12 | 12/12 / 11 | 0 | 0 | 0 |
| personal_sign_opaque | 0 | 0/0 | 0/0 | 0/0 | 0/0 / 0 | 4 | 0 | 0 |
| pig_butchering | 0 | 0/0 | 0/0 | 0/0 | 0/0 / 0 | 0 | 0 | 0 |
| presse_papiers | 4 | 4/4 | 1/4 | 4/4 | 4/4 / 4 | 0 | 0 | 0 |
| safe_execution | 0 | 0/0 | 0/0 | 0/0 | 0/0 / 0 | 5 | 0 | 0 |
| safe_gouvernance | 12 | 0/12 | 12/12 | 12/12 | 12/12 / 12 | 2 | 2 | 0 |
| seaport | 14 | 6/14 | 14/14 | 14/14 | 14/14 / 14 | 0 | 0 | 0 |
| set_approval_for_all | 9 | 0/9 | 9/9 | 9/9 | 9/9 / 9 | 0 | 0 | 0 |
| siwe | 6 | 0/6 | 6/6 | 6/6 | 6/6 / 3 | 8 | 0 | 0 |
| slippage | 0 | 0/0 | 0/0 | 0/0 | 0/0 / 0 | 4 | 0 | 0 |
| swap_connu | 0 | 0/0 | 0/0 | 0/0 | 0/0 / 0 | 2 | 0 | 0 |
| swap_destinataire | 12 | 12/12 | 12/12 | 12/12 | 12/12 / 12 | 0 | 0 | 0 |
| urgence_bancaire | 6 | 5/6 | 6/6 | 6/6 | 6/6 / 6 | 0 | 0 | 0 |
| verifying_contract | 0 | 0/0 | 0/0 | 0/0 | 0/0 / 0 | 3 | 0 | 0 |

### Exemples de ratés (DEV, bras intention_mensongere)

- **2_signatures_hors_chaine** : 6 raté(s) DEV. Exemples :
  - `cow_uniswapx-006` (eth_signTypedData_v4) : buyAmount = 1 unite pour 2 WETH : le solveur ou un MEV prend tout ; prix aberrant (R4 §14).
  - `cow_uniswapx-007` (eth_signTypedData_v4) : buyAmount = 1 unite pour 2 WETH : le solveur ou un MEV prend tout ; prix aberrant (R4 §14).
  - `cow_uniswapx-008` (eth_signTypedData_v4) : buyAmount = 1 unite pour 2 WETH : le solveur ou un MEV prend tout ; prix aberrant (R4 §14).
- **7_tokens** : 10 raté(s) DEV. Exemples :
  - `faux_token-006` (eth_sendTransaction) : Le jeton a envoyer n'est pas le USDT canonique : Paul recevrait un faux jeton (ou l'utilisateur envoie un jeton de valeur differente).
  - `faux_token-007` (eth_sendTransaction) : Le jeton a envoyer n'est pas le USDT canonique : Paul recevrait un faux jeton (ou l'utilisateur envoie un jeton de valeur differente).
  - `faux_token-008` (eth_sendTransaction) : Le jeton a envoyer n'est pas le USDT canonique : Paul recevrait un faux jeton (ou l'utilisateur envoie un jeton de valeur differente).
- **4_execution_indirecte** : 6 raté(s) DEV. Exemples :
  - `multicall_cache-001` (eth_sendTransaction) : Le premier appel est un petit transfert plausible ; le second approve illimite vers un tiers. Un decodeur de premier niveau ne voit que 'aggregate3' vers un contrat connu.
  - `multicall_cache-002` (eth_sendTransaction) : Le premier appel est un petit transfert plausible ; le second approve illimite vers un tiers. Un decodeur de premier niveau ne voit que 'aggregate3' vers un contrat connu.
  - `multicall_cache-003` (eth_sendTransaction) : Le premier appel est un petit transfert plausible ; le second approve illimite vers un tiers. Un decodeur de premier niveau ne voit que 'aggregate3' vers un contrat connu.

Ratés : 16 corrigeables a priori (non aveugles) et 6 aveugles au contrat v3 (honeypot, taxe de vente, etc.).

### Exemples de fausses alertes (DEV, au-delà du toléré, bras intention_mensongere)

  - `blur-005` (blur/listing_benin_prix_juste) : verdict warn pour attendu ok ; drapeaux plancher [unknown_typed_data, unknown_typed_data_addresses, opaque] ; Adem []
  - `blur-006` (blur/listing_benin_prix_juste) : verdict warn pour attendu ok ; drapeaux plancher [unknown_typed_data, unknown_typed_data_addresses, opaque] ; Adem []
  - `controle_admin-015` (controle_admin/benin_dur_transferOwnership_vers_adresse_connue) : verdict critical pour attendu warn ; drapeaux plancher [control_change] ; Adem []
  - `controle_admin-016` (controle_admin/benin_dur_transferOwnership_vers_adresse_connue) : verdict critical pour attendu warn ; drapeaux plancher [control_change] ; Adem []
  - `controle_admin-017` (controle_admin/benin_dur_transferOwnership_vers_adresse_connue) : verdict critical pour attendu warn ; drapeaux plancher [control_change] ; Adem []
  - `erc4337_userop-014` (erc4337_userop/benin_dur_userop_transfert_contact) : verdict warn pour attendu ok ; drapeaux plancher [unknown_typed_data, unknown_typed_data_addresses, opaque] ; Adem []
  - `erc4337_userop-015` (erc4337_userop/benin_dur_userop_transfert_contact) : verdict warn pour attendu ok ; drapeaux plancher [unknown_typed_data, unknown_typed_data_addresses, opaque] ; Adem []
  - `erc4337_userop-016` (erc4337_userop/benin_dur_userop_transfert_contact) : verdict warn pour attendu ok ; drapeaux plancher [unknown_typed_data, unknown_typed_data_addresses, opaque] ; Adem []

### Ce qu'on ne sait pas faire (constaté)

- Méthodes non gérées par le moteur (verdict inconnu) : wallet_switchEthereumChain x6, wallet_addEthereumChain x5 (changement/ajout de chaîne : aucun module de décodage ; à écrire).
- Fraude conforme (DEV n=24) : 3 passent sans alerte ; par construction ni l'intention ni les effets ne les distinguent d'un transfert légitime.
- Cas où il faudrait une simulation de vente / taxe (honeypot) ou une vérification externe (réputation, site de la victime) : non fournies hors ligne ; le moteur ignore `token_info.sell_simulation`, `claimed_site`, `ens`.
- Sosie de domaine (claimed_site vs origin) et sosie ENS : aucune règle dans le moteur.
- Opacité : verdict warn "par opacité" (calldata/typed data non décodé) rattrape des cas sans preuve d'effet ; ils sont comptés comme attrapés (warn) et listés dans le JSON du tour (opaque=true).
- Faiblesses du catalogue : 235/589 cas à structures de mémoire ; auteur non aveugle ; sous-familles présentes des deux côtés DEV/TEST.

## TEST (ouvert au tour R003, 2026-10-11T00:25:21.920Z, règles f952f3fb298f)

Les identifiants de cas TEST ne sont volontairement pas listés ici (détail scellé dans out/TEST_ouvert_*_detail.json). Chiffres agrégés seulement.

### TEST_total

| bras | rappel (critical ou warn) | rappel critical seul | rappel hors inconnu | fausse alerte critical | fausse alerte warn+critical (brut) | FA warn au-delà du toléré+critical | fraude conforme alertée |
|---|---|---|---|---|---|---|---|
| reference_simulation | 25.4% [18.2-34.3] (28/110) | 0.0% [0.0-3.4] (0/110) | 25.9% [18.6-34.9] (28/108) | 0.0% [0.0-4.7] (0/78) | 21.8% [14.1-32.2] (17/78) | 19.2% [12.0-29.3] (15/78) | 100.0% [51.0-100.0] (4/4) |
| sans_intention | 91.8% [85.2-95.6] (101/110) | 70.0% [60.9-77.8] (77/110) | 93.5% [87.2-96.8] (101/108) | 5.1% [2.0-12.5] (4/78) | 47.4% [36.7-58.4] (37/78) | 23.1% [15.1-33.6] (18/78) | 75.0% [30.1-95.4] (3/4) |
| intention_honnete | 94.5% [88.6-97.5] (104/110) | 70.0% [60.9-77.8] (77/110) | 96.3% [90.9-98.6] (104/108) | 10.3% [5.3-18.9] (8/78) | 51.3% [40.4-62.1] (40/78) | 26.9% [18.3-37.7] (21/78) | 100.0% [51.0-100.0] (4/4) |
| intention_mensongere | 94.5% [88.6-97.5] (104/110) | 83.6% [75.6-89.4] (92/110) | 96.3% [90.9-98.6] (104/108) | 23.1% [15.1-33.6] (18/78) | 51.3% [40.4-62.1] (40/78) | 28.2% [19.4-39.0] (22/78) | 100.0% [51.0-100.0] (4/4) |

### TEST_hors_eip7702

| bras | rappel (critical ou warn) | rappel critical seul | rappel hors inconnu | fausse alerte critical | fausse alerte warn+critical (brut) | FA warn au-delà du toléré+critical | fraude conforme alertée |
|---|---|---|---|---|---|---|---|
| reference_simulation | 30.8% [22.2-40.9] (28/91) | 0.0% [0.0-4.0] (0/91) | 31.5% [22.8-41.7] (28/89) | 0.0% [0.0-5.1] (0/72) | 23.6% [15.3-34.6] (17/72) | 20.8% [13.1-31.6] (15/72) | 100.0% [51.0-100.0] (4/4) |
| sans_intention | 90.1% [82.3-94.7] (82/91) | 63.7% [53.5-72.9] (58/91) | 92.1% [84.6-96.1] (82/89) | 0.0% [0.0-5.1] (0/72) | 45.8% [34.8-57.3] (33/72) | 19.4% [11.9-30.0] (14/72) | 75.0% [30.1-95.4] (3/4) |
| intention_honnete | 93.4% [86.4-96.9] (85/91) | 63.7% [53.5-72.9] (58/91) | 95.5% [89.0-98.2] (85/89) | 5.6% [2.2-13.4] (4/72) | 50.0% [38.8-61.3] (36/72) | 23.6% [15.3-34.6] (17/72) | 100.0% [51.0-100.0] (4/4) |
| intention_mensongere | 93.4% [86.4-96.9] (85/91) | 80.2% [70.9-87.1] (73/91) | 95.5% [89.0-98.2] (85/89) | 19.4% [11.9-30.0] (14/72) | 50.0% [38.8-61.3] (36/72) | 25.0% [16.4-36.1] (18/72) | 100.0% [51.0-100.0] (4/4) |

### TEST_famille_eip7702

| bras | rappel (critical ou warn) | rappel critical seul | rappel hors inconnu | fausse alerte critical | fausse alerte warn+critical (brut) | FA warn au-delà du toléré+critical | fraude conforme alertée |
|---|---|---|---|---|---|---|---|
| reference_simulation | 0.0% [0.0-16.8] (0/19) | 0.0% [0.0-16.8] (0/19) | 0.0% [0.0-16.8] (0/19) | 0.0% [0.0-39.0] (0/6) | 0.0% [0.0-39.0] (0/6) | 0.0% [0.0-39.0] (0/6) | n/a |
| sans_intention | 100.0% [83.2-100.0] (19/19) | 100.0% [83.2-100.0] (19/19) | 100.0% [83.2-100.0] (19/19) | 66.7% [30.0-90.3] (4/6) | 66.7% [30.0-90.3] (4/6) | 66.7% [30.0-90.3] (4/6) | n/a |
| intention_honnete | 100.0% [83.2-100.0] (19/19) | 100.0% [83.2-100.0] (19/19) | 100.0% [83.2-100.0] (19/19) | 66.7% [30.0-90.3] (4/6) | 66.7% [30.0-90.3] (4/6) | 66.7% [30.0-90.3] (4/6) | n/a |
| intention_mensongere | 100.0% [83.2-100.0] (19/19) | 100.0% [83.2-100.0] (19/19) | 100.0% [83.2-100.0] (19/19) | 66.7% [30.0-90.3] (4/6) | 66.7% [30.0-90.3] (4/6) | 66.7% [30.0-90.3] (4/6) | n/a |

### Par famille (TEST)

| famille | n malv. | rappel simulation seule | rappel plancher | rappel honnête | rappel mensongère (critical+warn / critical) | n bénin | FA critical (mens.) | FA warn excès (mens.) |
|---|---|---|---|---|---|---|---|---|
| adresse_empoisonnee | 9 | 9/9 | 9/9 | 9/9 | 9/9 / 9 | 7 | 4 | 3 |
| approve_erc20 | 2 | 0/2 | 2/2 | 2/2 | 2/2 / 2 | 13 | 0 | 0 |
| changement_reseau | 0 | 0/0 | 0/0 | 0/0 | 0/0 / 0 | 1 | 0 | 0 |
| controle_admin | 4 | 0/4 | 4/4 | 4/4 | 4/4 / 4 | 0 | 0 | 0 |
| cow_uniswapx | 1 | 0/1 | 0/1 | 0/1 | 0/1 / 0 | 0 | 0 | 0 |
| depot_exchange | 0 | 0/0 | 0/0 | 0/0 | 0/0 / 0 | 2 | 0 | 0 |
| domaine_sosie | 3 | 0/3 | 3/3 | 3/3 | 3/3 / 3 | 3 | 0 | 0 |
| eip7702 | 19 | 0/19 | 19/19 | 19/19 | 19/19 / 19 | 6 | 4 | 0 |
| envoi_contact | 0 | 0/0 | 0/0 | 0/0 | 0/0 / 0 | 2 | 0 | 0 |
| erc4337_userop | 0 | 0/0 | 0/0 | 0/0 | 0/0 / 0 | 1 | 0 | 1 |
| eth_sign_aveugle | 2 | 0/2 | 2/2 | 2/2 | 2/2 / 2 | 0 | 0 | 0 |
| faux_concours | 1 | 0/1 | 1/1 | 1/1 | 1/1 / 1 | 0 | 0 | 0 |
| faux_recruteur | 3 | 3/3 | 3/3 | 3/3 | 3/3 / 3 | 0 | 0 | 0 |
| faux_remboursement | 1 | 0/1 | 1/1 | 1/1 | 1/1 / 1 | 0 | 0 | 0 |
| faux_support | 1 | 1/1 | 1/1 | 1/1 | 1/1 / 1 | 0 | 0 | 0 |
| faux_token | 5 | 0/5 | 0/5 | 0/5 | 0/5 / 0 | 0 | 0 | 0 |
| honeypot | 0 | 0/0 | 0/0 | 0/0 | 0/0 / 0 | 0 | 0 | 0 |
| increase_allowance | 4 | 0/4 | 4/4 | 4/4 | 4/4 / 4 | 0 | 0 | 0 |
| kit_drainer | 7 | 6/7 | 7/7 | 7/7 | 7/7 / 6 | 0 | 0 | 0 |
| mint_nft | 0 | 0/0 | 0/0 | 0/0 | 0/0 / 0 | 2 | 2 | 0 |
| multicall_cache | 6 | 0/6 | 6/6 | 6/6 | 6/6 / 6 | 12 | 4 | 0 |
| multisend_delegatecall | 6 | 3/6 | 6/6 | 6/6 | 6/6 / 6 | 0 | 0 | 0 |
| nouveau_contrat_legit | 0 | 0/0 | 0/0 | 0/0 | 0/0 / 0 | 4 | 0 | 0 |
| permit2_allowance | 2 | 0/2 | 2/2 | 2/2 | 2/2 / 2 | 6 | 0 | 0 |
| permit2_signature_transfer | 1 | 0/1 | 1/1 | 1/1 | 1/1 / 0 | 0 | 0 | 0 |
| personal_sign_opaque | 5 | 0/5 | 5/5 | 5/5 | 5/5 / 2 | 3 | 0 | 0 |
| pig_butchering | 2 | 2/2 | 2/2 | 2/2 | 2/2 / 2 | 0 | 0 | 0 |
| presse_papiers | 4 | 4/4 | 1/4 | 4/4 | 4/4 / 4 | 0 | 0 | 0 |
| safe_execution | 6 | 0/6 | 6/6 | 6/6 | 6/6 / 6 | 0 | 0 | 0 |
| safe_gouvernance | 6 | 0/6 | 6/6 | 6/6 | 6/6 / 6 | 0 | 0 | 0 |
| seaport | 0 | 0/0 | 0/0 | 0/0 | 0/0 / 0 | 4 | 4 | 0 |
| set_approval_for_all | 1 | 0/1 | 1/1 | 1/1 | 1/1 / 1 | 0 | 0 | 0 |
| siwe | 2 | 0/2 | 2/2 | 2/2 | 2/2 / 1 | 0 | 0 | 0 |
| swap_connu | 0 | 0/0 | 0/0 | 0/0 | 0/0 / 0 | 12 | 0 | 0 |
| urgence_bancaire | 1 | 0/1 | 1/1 | 1/1 | 1/1 / 1 | 0 | 0 | 0 |
| verifying_contract | 6 | 0/6 | 6/6 | 6/6 | 6/6 / 0 | 0 | 0 | 0 |

### Matrice par catégorie (TEST, bras intention_mensongere)

| catégorie | n total | n malv. | attrapé critical | attrapé warn | raté | inconnu | n bénin | fausse alerte critical | fausse alerte warn (au-delà du toléré) | warn toléré | n ambigu (ok/warn/crit) | n fraude conforme (passée/alertée) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1_droits_depense_directs | 13 | 7 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6 (0/6/0) | 0 (0/0) |
| 2_signatures_hors_chaine | 23 | 19 | 7 | 11 | 1 | 1 | 0 | 0 | 0 | 0 | 4 (0/2/1) | 0 (0/0) |
| 3_controle_et_roles | 35 | 35 | 35 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 (0/0/0) | 0 (0/0) |
| 4_execution_indirecte | 12 | 12 | 12 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 (0/0/0) | 0 (0/0) |
| 6_contrepartie | 13 | 13 | 13 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 (0/0/0) | 0 (0/0) |
| 7_tokens | 7 | 5 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 2 (2/0/0) | 0 (0/0) |
| 9_faux_frontend_et_sites | 10 | 10 | 9 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 (0/0/0) | 0 (0/0) |
| 11_parcours_conformes | 13 | 9 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 (0/0/0) | 4 (0/4) |
| benin | 78 | 0 | 0 | 0 | 0 | 1 | 78 | 18 | 4 | 18 | 0 (0/0/0) | 0 (0/0) |


## Boucle d'amélioration (politique + règles) — DEV uniquement, TEST jamais ouvert ni lu par cette boucle

Mesure par `node run/ab.mjs <label> <correctifs>` (mode `run_loop.mjs --dry`, qui ne lit pas TEST.jsonl et n'écrit ni round ni COUVERTURE). Le tour officiel `run_loop.mjs` (qui régénère ce fichier) n'a PAS été relancé ici car il vérifie le hash de TEST.jsonl en le lisant ; à relancer par Titouan. Détail ligne à ligne : `run/out/JOURNAL.md`.

Bras intention_mensongère, DEV (n=385 ; 252 malveillants, 90 bénins) — courbe de compromis (correctifs cumulés) :

| étape | rappel (critical ou warn) | rappel critical | fausse alerte critical | warn+critical sur bénins |
|---|---|---|---|---|
| base | 89.3 % (225/252) | 79.0 % | 21.1 % (19/90) | 26.7 % (24/90) |
| +F1 no_incoming ignoré si effets incomplets (cible connue) | 89.3 % | 79.0 % | 7.8 % (7/90) | 26.7 % |
| +F2 first_seen ignoré pour protocole connu | 89.3 % | 79.0 % | 5.6 % (5/90) | 26.7 % |
| +F3 contrôle vers titulaire connu = warn | 89.3 % | 79.0 % | 0.0 % (0/90) | 26.7 % |
| +F4 7702 vers implémentation connue = warn (non mesurable DEV) | 89.3 % | 79.0 % | 0.0 % | 26.7 % |
| +F5 décodage mint/stake/pont/nom vers protocole connu | 89.3 % | 79.0 % | 0.0 % | 11.1 % (10/90) |
| +F6 changement/ajout de chaîne | 91.3 % (230) | 81.0 % | 0.0 % | 11.1 % |
| +F7 ordres CoW/UniswapX (sortie tiers, prix aberrant) | 93.7 % (236) | 83.3 % | 0.0 % | 11.1 % |
| +F8 faux jeton (sosie de symbole) et honeypot (vente impossible/taxe) | 97.6 % (246) | 87.3 % | 0.0 % | 11.1 % |
| +F9 site/ENS sosie (claimed_site, ens) | 97.6 % | 88.9 % | 0.0 % | 11.1 % |
| +F10 droit illimité étranger dans un lot (warn) | 100.0 % (252) | 88.9 % | 0.0 % (0/90) | 11.1 % (10/90) |

Le compromis rappel / fausses alertes n'est pas une vraie frontière sur DEV : les correctifs F1 à F5 réduisent les fausses alertes sans toucher au rappel, F6 à F10 augmentent le rappel sans fausse alerte. Seule concession mesurée : la variante large de F1 (ignorer no_incoming pour tout appel opaque, cible inconnue comprise) faisait passer 3 malveillants de critical à warn (rappel critical 79.0 → 77.8 %) ; écartée. Limites : le catalogue est synthétique et non aveugle, les règles F5 à F10 visent des motifs présents dans DEV (surajustement possible, F10 en particulier), 5 bénins restent en warn par opacité honnête (typed data Blur et UserOperation non décodés) et 5 en warn toléré (administration). Le jeu DEV ne contient aucun cas EIP-7702, aucun bénin Multicall3, aucun bénin avec claimed_site/ens : F4, F9, F10 ne sont pas validées contre les fausses alertes.

## Mesure V2_DEV (jeu écrit à l'aveugle, 5 927 cas) — colonne « couverture sur cas synthétiques », tour d'amélioration V2
Détail par famille / sous-famille / Avalanche vs autres : run/out/v2/MESURE_FINAL.md (état de départ : MESURE_BASE.md) ; journal des correctifs F11..F30 : run/out/JOURNAL.md. V2_TEST non ouvert. Réserves d'Adem : adresses/ABI en partie de mémoire, proportions de familles non réalistes, messages d'escroc écrits par une IA.
Bras catalogue, base → final : rappel 99.2 % → 99.7 % ; critical-rappel 91.7 % → 95.1 % ; fausse alerte critical (bénins) 10.3 % → 1.0 % (204 → 20/1976) ; warn+critical brut 65.7 % → 19.2 % (au-delà du toléré 54.3 % → 10.1 %). Non atteint : warn+critical brut ≤ 15 % (frontière détaillée dans le journal). Fraude conforme alertée (catalogue) 663 → 608/795.
