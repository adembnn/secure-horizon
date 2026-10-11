# MESURE 001 - jeu REGRESSION_PUBLIQUE

```
MESURE 001 du jeu REGRESSION_PUBLIQUE (144 fixtures : 134 executables, 10 non executables) ; regles f952f3fb298f code 6abffda9d346 ; 199 ms
Jeu distinct de DEV et de TEST ; non ecrit dans run/out/TACHES.md. Lecture : attrape = malveillant en warn ou critical ; rate = ok ; inconnu = methode non geree (compte NON attrape) ; FA = benin au-dela du toleré.

## Totaux par sous-ensemble et par bras (Wilson 95 %)

### TOUT executable  (malveillants 65, benins 67, fraude conforme 2)
- plancher  attrape(crit+warn) 87.7% [77.5-93.6] (57/65) | critical 66.1% [54.0-76.5] (43/65) | au niveau attendu 70.8% [58.8-80.4] (46/65) | rate 6 | inconnu 4 | FA critical 0.0% [0.0-5.4] (0/67) | FA warn+crit 35.8% [25.4-47.8] (24/67) | FA au-dela du tolere 13.4% [7.2-23.6] (9/67) | fraude conforme alertee 50.0% [9.4-90.5] (1/2)
- honnete   attrape(crit+warn) 95.4% [87.3-98.4] (62/65) | critical 66.1% [54.0-76.5] (43/65) | au niveau attendu 70.8% [58.8-80.4] (46/65) | rate 1 | inconnu 4 | FA critical 3.0% [0.8-10.3] (2/67) | FA warn+crit 35.8% [25.4-47.8] (24/67) | FA au-dela du tolere 13.4% [7.2-23.6] (9/67) | fraude conforme alertee 50.0% [9.4-90.5] (1/2)
- catalogue attrape(crit+warn) 95.4% [87.3-98.4] (62/65) | critical 84.6% [73.9-91.4] (55/65) | au niveau attendu 89.2% [79.4-94.7] (58/65) | rate 1 | inconnu 4 | FA critical 7.5% [3.2-16.3] (5/67) | FA warn+crit 37.3% [26.7-49.3] (25/67) | FA au-dela du tolere 14.9% [8.3-25.3] (10/67) | fraude conforme alertee 50.0% [9.4-90.5] (1/2)

### C-Chain applicable (hors ethereum_seulement)  (malveillants 56, benins 58, fraude conforme 2)
- plancher  attrape(crit+warn) 85.7% [74.3-92.6] (48/56) | critical 60.7% [47.6-72.4] (34/56) | au niveau attendu 66.1% [53.0-77.1] (37/56) | rate 6 | inconnu 4 | FA critical 0.0% [0.0-6.2] (0/58) | FA warn+crit 34.5% [23.6-47.3] (20/58) | FA au-dela du tolere 15.5% [8.4-26.9] (9/58) | fraude conforme alertee 50.0% [9.4-90.5] (1/2)
- honnete   attrape(crit+warn) 94.6% [85.4-98.2] (53/56) | critical 60.7% [47.6-72.4] (34/56) | au niveau attendu 66.1% [53.0-77.1] (37/56) | rate 1 | inconnu 4 | FA critical 3.5% [0.9-11.7] (2/58) | FA warn+crit 34.5% [23.6-47.3] (20/58) | FA au-dela du tolere 15.5% [8.4-26.9] (9/58) | fraude conforme alertee 50.0% [9.4-90.5] (1/2)
- catalogue attrape(crit+warn) 94.6% [85.4-98.2] (53/56) | critical 82.1% [70.2-90.0] (46/56) | au niveau attendu 87.5% [76.4-93.8] (49/56) | rate 1 | inconnu 4 | FA critical 8.6% [3.7-18.6] (5/58) | FA warn+crit 36.2% [25.1-49.1] (21/58) | FA au-dela du tolere 17.2% [9.6-28.9] (10/58) | fraude conforme alertee 50.0% [9.4-90.5] (1/2)

### ethereum seulement (7702)  (malveillants 9, benins 9, fraude conforme 0)
- plancher  attrape(crit+warn) 100.0% [70.1-100.0] (9/9) | critical 100.0% [70.1-100.0] (9/9) | au niveau attendu 100.0% [70.1-100.0] (9/9) | rate 0 | inconnu 0 | FA critical 0.0% [0.0-29.9] (0/9) | FA warn+crit 44.4% [18.9-73.3] (4/9) | FA au-dela du tolere 0.0% [0.0-29.9] (0/9) | fraude conforme alertee n/a
- honnete   attrape(crit+warn) 100.0% [70.1-100.0] (9/9) | critical 100.0% [70.1-100.0] (9/9) | au niveau attendu 100.0% [70.1-100.0] (9/9) | rate 0 | inconnu 0 | FA critical 0.0% [0.0-29.9] (0/9) | FA warn+crit 44.4% [18.9-73.3] (4/9) | FA au-dela du tolere 0.0% [0.0-29.9] (0/9) | fraude conforme alertee n/a
- catalogue attrape(crit+warn) 100.0% [70.1-100.0] (9/9) | critical 100.0% [70.1-100.0] (9/9) | au niveau attendu 100.0% [70.1-100.0] (9/9) | rate 0 | inconnu 0 | FA critical 0.0% [0.0-29.9] (0/9) | FA warn+crit 44.4% [18.9-73.3] (4/9) | FA au-dela du tolere 0.0% [0.0-29.9] (0/9) | fraude conforme alertee n/a

### domaine A (TI_001)  (malveillants 48, benins 48, fraude conforme 0)
- plancher  attrape(crit+warn) 89.6% [77.8-95.5] (43/48) | critical 70.8% [56.8-81.8] (34/48) | au niveau attendu 77.1% [63.5-86.7] (37/48) | rate 3 | inconnu 4 | FA critical 0.0% [0.0-7.4] (0/48) | FA warn+crit 33.3% [21.7-47.5] (16/48) | FA au-dela du tolere 12.5% [5.9-24.7] (6/48) | fraude conforme alertee n/a
- honnete   attrape(crit+warn) 93.8% [83.2-97.9] (45/48) | critical 70.8% [56.8-81.8] (34/48) | au niveau attendu 77.1% [63.5-86.7] (37/48) | rate 1 | inconnu 4 | FA critical 4.2% [1.1-14.0] (2/48) | FA warn+crit 33.3% [21.7-47.5] (16/48) | FA au-dela du tolere 12.5% [5.9-24.7] (6/48) | fraude conforme alertee n/a
- catalogue attrape(crit+warn) 93.8% [83.2-97.9] (45/48) | critical 85.4% [72.8-92.8] (41/48) | au niveau attendu 91.7% [80.5-96.7] (44/48) | rate 1 | inconnu 4 | FA critical 8.3% [3.3-19.6] (4/48) | FA warn+crit 33.3% [21.7-47.5] (16/48) | FA au-dela du tolere 12.5% [5.9-24.7] (6/48) | fraude conforme alertee n/a

### domaine B (TI_002)  (malveillants 17, benins 19, fraude conforme 2)
- plancher  attrape(crit+warn) 82.3% [59.0-93.8] (14/17) | critical 52.9% [31.0-73.8] (9/17) | au niveau attendu 52.9% [31.0-73.8] (9/17) | rate 3 | inconnu 0 | FA critical 0.0% [0.0-16.8] (0/19) | FA warn+crit 42.1% [23.1-63.7] (8/19) | FA au-dela du tolere 15.8% [5.5-37.6] (3/19) | fraude conforme alertee 50.0% [9.4-90.5] (1/2)
- honnete   attrape(crit+warn) 100.0% [81.6-100.0] (17/17) | critical 52.9% [31.0-73.8] (9/17) | au niveau attendu 52.9% [31.0-73.8] (9/17) | rate 0 | inconnu 0 | FA critical 0.0% [0.0-16.8] (0/19) | FA warn+crit 42.1% [23.1-63.7] (8/19) | FA au-dela du tolere 15.8% [5.5-37.6] (3/19) | fraude conforme alertee 50.0% [9.4-90.5] (1/2)
- catalogue attrape(crit+warn) 100.0% [81.6-100.0] (17/17) | critical 82.3% [59.0-93.8] (14/17) | au niveau attendu 82.3% [59.0-93.8] (14/17) | rate 0 | inconnu 0 | FA critical 5.3% [0.9-24.6] (1/19) | FA warn+crit 47.4% [27.3-68.3] (9/19) | FA au-dela du tolere 21.1% [8.5-43.3] (4/19) | fraude conforme alertee 50.0% [9.4-90.5] (1/2)

## Par famille (att = attrape crit+warn, c = dont critical, r = rate, i = inconnu ; FA c/w = fausse alerte critical / warn au-dela du tolere ; Wilson 95 % sur le bras catalogue)
fiche  famille                                        plat  | n_mal | plancher att/n | honnete att/n | catalogue att(c)/n r i  Wilson          | n_ben FA c/w (plancher|honnete|catalogue) | n_fc
A01   delegation_7702                                ETH  |  2    |   2/2          |   2/2         |  2/2(2) 2 r0 i0  100% [34-100] | 2  0/0 | 0/0 | 0/0 | 0
A02   batch_execute_7702                             ETH  |  2    |   2/2          |   2/2         |  2/2(2) 2 r0 i0  100% [34-100] | 2  0/0 | 0/0 | 0/0 | 0
A03   delegation_7702_chain0                         ETH  |  2    |   2/2          |   2/2         |  2/2(2) 2 r0 i0  100% [34-100] | 2  0/0 | 0/0 | 0/0 | 0
A04   signature_opaque_eth_sign                      ETH  |  2    |   2/2          |   2/2         |  2/2(2) 2 r0 i0  100% [34-100] | 2  0/0 | 0/0 | 0/0 | 0
A05   permit_2612                                    EVM  |  2    |   2/2          |   2/2         |  2/2(2) 2 r0 i0  100% [34-100] | 2  0/0 | 0/0 | 0/0 | 0
A06   permit2_allowance                              EVM  |  2    |   2/2          |   2/2         |  2/2(2) 2 r0 i0  100% [34-100] | 2  0/0 | 0/0 | 0/0 | 0
A07   permit2_signature_transfer                     EVM  |  2    |   2/2          |   2/2         |  2/2(2) 2 r0 i0  100% [34-100] | 2  0/1 | 0/1 | 0/1 | 0
A08   signature_differee                             EVM  |  1    |   1/1          |   1/1         |  1/1(1) 1 r0 i0  100% [21-100] | 1  0/0 | 0/0 | 0/0 | 0
A09   simulation_evasion                             EVM  |  2    |   1/2          |   1/2         |  1/2(1) 2 r1 i0  50% [9-91] | 2  0/0 | 0/0 | 0/0 | 0
A11   empoisonnement_adresse                         EVM  |  2    |   2/2          |   2/2         |  2/2(2) 2 r0 i0  100% [34-100] | 2  0/2 | 2/0 | 2/0 | 0
A12   empoisonnement_safe_imbrique                   EVM  |  2    |   2/2          |   2/2         |  2/2(2) 2 r0 i0  100% [34-100] | 2  0/0 | 0/0 | 0/0 | 0
A13   clipper_remplacement                           EVM  |  2    |   0/2          |   2/2         |  2/2(2) 2 r0 i0  100% [34-100] | 2  0/0 | 0/0 | 0/0 | 0
A14   origine_legitime_charge_malveillante           EVM  |  2    |   2/2          |   2/2         |  2/2(2) 2 r0 i0  100% [34-100] | 2  0/0 | 0/0 | 0/0 | 0
A15   faux_revoke                                    EVM  |  4    |   4/4          |   4/4         |  4/4(4) 4 r0 i0  100% [51-100] | 4  0/0 | 0/0 | 0/0 | 0
A16   chaine_neuve                                   EVM  |  2    |   2/2          |   2/2         |  2/2(2) 2 r0 i0  100% [34-100] | 2  0/0 | 0/0 | 0/0 | 0
A18   siwe_detourne                                  EVM  |  2    |   2/2          |   2/2         |  2/2(1) 2 r0 i0  100% [34-100] | 2  0/0 | 0/0 | 0/0 | 0
A19   nft_listing_zero                               EVM  |  2    |   2/2          |   2/2         |  2/2(2) 2 r0 i0  100% [34-100] | 2  0/2 | 0/2 | 2/0 | 0
A20   batch_massif_troncature                        EVM  |  1    |   1/1          |   1/1         |  1/1(0) 1 r0 i0  100% [21-100] | 1  0/0 | 0/0 | 0/0 | 0
A21   wallet_sendCalls_lot                           EVM  |  2    |   2/2          |   2/2         |  2/2(2) 2 r0 i0  100% [34-100] | 2  0/0 | 0/0 | 0/0 | 0
A22   permission_7715                                EVM  |  2    |   0/2          |   0/2         |  0/2(0) 2 r0 i4  0% [0-66] | 2  0/0 | 0/0 | 0/0 | 0
A23   module_compte                                  EVM  |  4    |   4/4          |   4/4         |  4/4(4) 4 r0 i0  100% [51-100] | 4  0/0 | 0/0 | 0/0 | 0
A24   faux_jeton_appat                               EVM  |  2    |   2/2          |   2/2         |  2/2(2) 2 r0 i0  100% [34-100] | 2  0/0 | 0/0 | 0/0 | 0
A25   pont_destinataire                              EVM  |  2    |   2/2          |   2/2         |  2/2(0) 2 r0 i0  100% [34-100] | 2  0/1 | 0/1 | 0/1 | 0
T2A1  faux_support_voix_clonee                       EVM  |  1    |   1/1          |   1/1         |  1/1(1) 1 r0 i0  100% [21-100] | 1  0/0 | 0/0 | 0/0 | 0
T2A2  victime_coachee_fraude_conforme                EVM  |  0    |   0/0          |   0/0         |  0/0(0) 0 r0 i0  n/a | 1  0/0 | 0/0 | 0/0 | 1
T2A3  pig_butchering_fraude_conforme                 EVM  |  0    |   0/0          |   0/0         |  0/0(0) 0 r0 i0  n/a | 1  0/0 | 0/0 | 0/0 | 1
T2A4  faux_agent_trading_permit                      EVM  |  2    |   2/2          |   2/2         |  2/2(2) 2 r0 i0  100% [34-100] | 2  0/0 | 0/0 | 0/0 | 0
T2A5  faux_bot_arbitrage                             EVM  |  2    |   1/2          |   2/2         |  2/2(1) 2 r0 i0  100% [34-100] | 2  0/0 | 0/0 | 1/0 | 0
T2B2  bitb_relais_permit                             EVM  |  1    |   1/1          |   1/1         |  1/1(1) 1 r0 i0  100% [21-100] | 1  0/0 | 0/0 | 0/0 | 0
T2B3  clickjacking_overlay                           EVM  |  1    |   1/1          |   1/1         |  1/1(1) 1 r0 i0  100% [21-100] | 1  0/0 | 0/0 | 0/0 | 0
T2B4  faux_popup_cadeau                              EVM  |  2    |   2/2          |   2/2         |  2/2(2) 2 r0 i0  100% [34-100] | 2  0/1 | 0/1 | 0/1 | 0
T2C1  cloaking_extension                             EVM  |  2    |   2/2          |   2/2         |  2/2(2) 2 r0 i0  100% [34-100] | 2  0/2 | 0/2 | 0/2 | 0
T2C2  toctou_proxy                                   EVM  |  1    |   1/1          |   1/1         |  1/1(0) 1 r0 i0  100% [21-100] | 1  0/0 | 0/0 | 0/0 | 0
T2C5  desactivation_sur_ordre                        EVM  |  1    |   1/1          |   1/1         |  1/1(1) 1 r0 i0  100% [21-100] | 1  0/0 | 0/0 | 0/0 | 0
T2D1  injection_pastedMessage                        EVM  |  1    |   0/1          |   1/1         |  1/1(0) 1 r0 i0  100% [21-100] | 0  0/0 | 0/0 | 0/0 | 0
T2D2  injection_cachee_page                          EVM  |  1    |   1/1          |   1/1         |  1/1(1) 1 r0 i0  100% [21-100] | 1  0/0 | 0/0 | 0/0 | 0
T2D3  paraphrase_llm_evasion_mots_cles               EVM  |  1    |   1/1          |   1/1         |  1/1(1) 1 r0 i0  100% [21-100] | 1  0/0 | 0/0 | 0/0 | 0
T2D4  injection_memoire_agent                        EVM  |  1    |   0/1          |   1/1         |  1/1(1) 1 r0 i0  100% [21-100] | 1  0/0 | 0/0 | 0/0 | 0
T2D5  benin_dur_phrase_ressemblant_a_injection       EVM  |  0    |   0/0          |   0/0         |  0/0(0) 0 r0 i0  n/a | 1  0/0 | 0/0 | 0/0 | 0

## Ratés (malveillants en 'ok', bras catalogue) : 1
- P-A09-M2 (simulation_evasion/bytecode_lit_ORIGIN_COINBASE_TIMESTAMP) [aveugle par construction] : plancher=ok honnete=ok ; drapeaux plancher [aucun] ; Adem [aucun]

## Attrapes mais SOUS le niveau attendu (malveillant en warn alors que critical attendu, bras catalogue) : 4
- P-A20-M1 (batch_massif_troncature/aggregate3_257_appels_256_approve) : plancher=warn honnete=warn catalogue=warn (attendu critical) ; drapeaux [batch_foreign_unlimited_approval] ; Adem [aucun]
- P-T2A5-M1 (faux_bot_arbitrage/creation_contrat_bot) : plancher=warn honnete=warn catalogue=warn (attendu critical) ; drapeaux [contract_creation, opaque] ; Adem [aucun]
- P-T2C2-M1 (toctou_proxy/proxy_modifiable_apercu_50_usdc_paul) : plancher=warn honnete=warn catalogue=warn (attendu critical) ; drapeaux [unknown_selector, opaque] ; Adem [aucun]
- P-T2D1-M1 (injection_pastedMessage/transfert_2000_usdc_message_colle_injecte) : plancher=ok honnete=warn catalogue=warn (attendu critical) ; drapeaux [aucun] ; Adem [new_contract]

## Inconnus (methode non geree ou erreur du moteur) : 4
- P-A22-B1 (benin, wallet_requestExecutionPermissions) : methode wallet_requestExecutionPermissions non geree par le moteur d'effets
- P-A22-B2 (benin, wallet_requestExecutionPermissions) : methode wallet_requestExecutionPermissions non geree par le moteur d'effets
- P-A22-M1 (malveillant, wallet_requestExecutionPermissions) : methode wallet_requestExecutionPermissions non geree par le moteur d'effets
- P-A22-M2 (malveillant, wallet_requestExecutionPermissions) : methode wallet_requestExecutionPermissions non geree par le moteur d'effets

## Fausses alertes au-dela du tolere (benins, bras catalogue) : 10 ; benins non-ok au total : 25
- P-A07-B1 (permit2_signature_transfer/permitTransferFrom_routeur_connu_borne) : warn pour attendu ok ; plancher=warn honnete=warn ; drapeaux [permit2_transfer_destination_chosen_by_spender] ; Adem [aucun]
- P-A11-B1 (empoisonnement_adresse/bon_contact_malgre_dust_sosie_4_4) : critical pour attendu ok ; plancher=warn honnete=critical ; drapeaux [address_poisoning] ; Adem [lookalike_address]
- P-A11-B2 (empoisonnement_adresse/bon_contact_malgre_dust_sosie_5_5) : critical pour attendu ok ; plancher=warn honnete=critical ; drapeaux [address_poisoning] ; Adem [lookalike_address]
- P-A19-B1 (nft_listing_zero/listing_prix_juste_frais_marketplace) : critical pour attendu ok ; plancher=warn honnete=warn ; drapeaux [far_expiry] ; Adem [unexpected_outgoing]
- P-A19-B2 (nft_listing_zero/listing_prix_juste_frais_marketplace) : critical pour attendu ok ; plancher=warn honnete=warn ; drapeaux [far_expiry] ; Adem [unexpected_outgoing]
- P-A25-B1 (pont_destinataire/jumeau_benin_deposit_token_recipient_tiers) : warn pour attendu ok ; plancher=warn honnete=warn ; drapeaux [unknown_selector, opaque] ; Adem [aucun]
- P-T2A5-B2 (faux_bot_arbitrage/depot_0_5_eth_staking_connu) : critical pour attendu ok ; plancher=ok honnete=ok ; drapeaux [aucun] ; Adem [no_incoming]
- P-T2B4-B2 (faux_popup_cadeau/claim_recompenses_coffre_connu) : warn pour attendu ok ; plancher=warn honnete=warn ; drapeaux [unknown_selector, opaque] ; Adem [aucun]
- P-T2C1-B1 (cloaking_extension/claim_officiel_protocole_connu) : warn pour attendu ok ; plancher=warn honnete=warn ; drapeaux [unknown_selector, opaque] ; Adem [aucun]
- P-T2C1-B2 (cloaking_extension/claim_officiel_protocole_connu_bis) : warn pour attendu ok ; plancher=warn honnete=warn ; drapeaux [unknown_selector, opaque] ; Adem [aucun]

## Fraude conforme (rapportee a part) : P-T2A2-F1 -> catalogue=critical plancher=warn ; P-T2A3-F1 -> catalogue=ok plancher=ok

## Non executables (10, hors mesure)
- P-A08-B2 [hors_perimetre_evm] signature_differee/solana_nonce_durable_autorite_soi : nonce durable Solana (AdvanceNonceAccount) : hors perimetre EVM ; aucune requete EVM a decoder
- P-A08-M2 [hors_perimetre_evm] signature_differee/solana_nonce_durable_authority_tiers : nonce durable Solana (AdvanceNonceAccount) : hors perimetre EVM ; aucune requete EVM a decoder
- P-A10-M1 [sans_requete_wallet] evasion_interception/provider_surcharge_postMessage : infrastructure : window.ethereum.request surchargee cote page, aucune requete wallet a decoder (domaine extension/Adem) ; consequence = ne pas dependre d'un seul point d'interception
- P-A17-B1 [hors_perimetre_evm] solana_tron_autorite/solana_transfert_spl_contact : SetAuthority Solana / AccountPermissionUpdate Tron : hors perimetre EVM ; aucun decodeur EVM applicable
- P-A17-B2 [hors_perimetre_evm] solana_tron_autorite/tron_transfert_simple : SetAuthority Solana / AccountPermissionUpdate Tron : hors perimetre EVM ; aucun decodeur EVM applicable
- P-A17-M1 [hors_perimetre_evm] solana_tron_autorite/solana_setauthority_account_owner : SetAuthority Solana / AccountPermissionUpdate Tron : hors perimetre EVM ; aucun decodeur EVM applicable
- P-A17-M2 [hors_perimetre_evm] solana_tron_autorite/tron_account_permission_update : SetAuthority Solana / AccountPermissionUpdate Tron : hors perimetre EVM ; aucun decodeur EVM applicable
- P-T2B1-M1 [sans_requete_wallet] bitb_seed_phrase/fausse_fenetre_html_demande_seed : aucune requete wallet : la page 'claim-drop.test' dessine une fausse fenetre et demande la seed phrase (12 mots synthetiques) ; Sentinelle (onTransaction/onSignature) ne voit rien ; hors perimetre declare
- P-T2C3-M1 [sans_requete_wallet] extension_clone_sentinelle/paquet_sentinelle_guard_test : extension clone ('sentinelle-guard.test', host_permissions <all_urls>) : aucune requete wallet a analyser ; le clone REMPLACE la barriere (hors barriere)
- P-T2C4-M1 [sans_requete_wallet] mise_a_jour_piegee/version_2_68_cle_de_publication_fuitee : chaine d'approvisionnement (mise a jour piegee v2.68 exfiltrant vers collect.test) : aucune requete wallet
```
