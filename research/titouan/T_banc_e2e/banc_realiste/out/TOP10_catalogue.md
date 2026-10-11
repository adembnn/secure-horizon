
#### Top 10 par écart en points (n malveillants >= 5)

| # | unité | n malv. | FULL | B | C | écart FULL-B (pts) | perdus | autre bras (intention_produit) FULL/B | rest. C | rest. S_code | rest. S_age | rest. S_tok | rest. S_bal | rest. S_look | rest. S_site | rest. S_sim | rest. S_quote | rest. D | rest. O4 | rest. D_O4 | coût moyen/vérif. (code, âge, jeton, solde) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | V2_DEV:onchain/multicall_depth2_transferFrom_aggregate3 | 11 | 11 | 0 | 0 | 100 | 11 | 11/0 | 0 | 0 | 0 | 0 | 11 | 11 | 0 | 0 | 0 | 0 | 11 | 11 | 1.0, 1.0, 1.1, 1.0 |
| 2 | DEV:honeypot | 6 | 6 | 0 | 0 | 100 | 6 | 6/0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 1.0, 1.0, 2.0, 1.0 |
| 3 | V2_DEV:poison_sites_tokens/token_sell_tax_99 | 51 | 51 | 36 | 36 | 29 | 15 | 51/28 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 15 | 0 | 0 | 0 | 0 | 1.0, 1.0, 1.4, 1.0 |
| 4 | V2_DEV:poison_sites_tokens/token_honeypot | 52 | 52 | 38 | 38 | 27 | 14 | 52/27 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 14 | 0 | 0 | 0 | 0 | 1.0, 1.0, 1.4, 1.0 |
| 5 | V2_DEV:poison_sites_tokens/addressbook_poisoned | 76 | 74 | 59 | 71 | 20 | 15 | 74/27 | 14 | 14 | 14 | 14 | 16 | 14 | 14 | 14 | 14 | 14 | 16 | 16 | 1.4, 1.4, 1.0, 1.0 |
| 6 | V2_DEV:poison_sites_tokens/clipboard_swap | 97 | 93 | 77 | 77 | 16 | 16 | 90/39 | 0 | 0 | 0 | 0 | 12 | 12 | 0 | 0 | 0 | 0 | 12 | 12 | 1.1, 1.1, 0.5, 1.0 |
| 7 | V2_DEV:poison_sites_tokens/addr_poison_zero_transferFrom | 87 | 87 | 74 | 87 | 15 | 13 | 87/29 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 1.3, 1.3, 0.8, 1.0 |
| 8 | V2_DEV:poison_sites_tokens/addr_poison_fake_token_lookalike | 91 | 91 | 78 | 91 | 14 | 13 | 91/30 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 1.3, 1.3, 1.0, 1.0 |
| 9 | V2_DEV:sig/personal_sign_tx_hex | 58 | 57 | 49 | 49 | 14 | 8 | 57/49 | 0 | 0 | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 0 | 0 | 0 | 0.0, 0.0, 0.0, 0.0 |
| 10 | V2_DEV:poison_sites_tokens/addr_poison_dust_after_send | 93 | 93 | 82 | 93 | 12 | 11 | 93/28 | 11 | 11 | 11 | 11 | 11 | 11 | 11 | 11 | 11 | 11 | 11 | 11 | 1.3, 1.3, 0.8, 1.0 |

#### Top 10 par nombre absolu de détections perdues

| # | unité | n malv. | FULL | B | C | écart FULL-B (pts) | perdus | autre bras (intention_produit) FULL/B | rest. C | rest. S_code | rest. S_age | rest. S_tok | rest. S_bal | rest. S_look | rest. S_site | rest. S_sim | rest. S_quote | rest. D | rest. O4 | rest. D_O4 | coût moyen/vérif. (code, âge, jeton, solde) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | V2_DEV:poison_sites_tokens/clipboard_swap | 97 | 93 | 77 | 77 | 16 | 16 | 90/39 | 0 | 0 | 0 | 0 | 12 | 12 | 0 | 0 | 0 | 0 | 12 | 12 | 1.1, 1.1, 0.5, 1.0 |
| 2 | V2_DEV:poison_sites_tokens/token_sell_tax_99 | 51 | 51 | 36 | 36 | 29 | 15 | 51/28 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 15 | 0 | 0 | 0 | 0 | 1.0, 1.0, 1.4, 1.0 |
| 3 | V2_DEV:poison_sites_tokens/addressbook_poisoned | 76 | 74 | 59 | 71 | 20 | 15 | 74/27 | 14 | 14 | 14 | 14 | 16 | 14 | 14 | 14 | 14 | 14 | 16 | 16 | 1.4, 1.4, 1.0, 1.0 |
| 4 | V2_DEV:poison_sites_tokens/token_honeypot | 52 | 52 | 38 | 38 | 27 | 14 | 52/27 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 14 | 0 | 0 | 0 | 0 | 1.0, 1.0, 1.4, 1.0 |
| 5 | V2_DEV:poison_sites_tokens/addr_poison_zero_transferFrom | 87 | 87 | 74 | 87 | 15 | 13 | 87/29 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 1.3, 1.3, 0.8, 1.0 |
| 6 | V2_DEV:poison_sites_tokens/addr_poison_fake_token_lookalike | 91 | 91 | 78 | 91 | 14 | 13 | 91/30 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 1.3, 1.3, 1.0, 1.0 |
| 7 | V2_DEV:onchain/multicall_depth2_transferFrom_aggregate3 | 11 | 11 | 0 | 0 | 100 | 11 | 11/0 | 0 | 0 | 0 | 0 | 11 | 11 | 0 | 0 | 0 | 0 | 11 | 11 | 1.0, 1.0, 1.1, 1.0 |
| 8 | V2_DEV:poison_sites_tokens/addr_poison_dust_after_send | 93 | 93 | 82 | 93 | 12 | 11 | 93/28 | 11 | 11 | 11 | 11 | 11 | 11 | 11 | 11 | 11 | 11 | 11 | 11 | 1.3, 1.3, 0.8, 1.0 |
| 9 | V2_DEV:sig/personal_sign_tx_hex | 58 | 57 | 49 | 49 | 14 | 8 | 57/49 | 0 | 0 | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 0 | 0 | 0 | 0.0, 0.0, 0.0, 0.0 |
| 10 | DEV:honeypot | 6 | 6 | 0 | 0 | 100 | 6 | 6/0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 1.0, 1.0, 2.0, 1.0 |

#### Fausses alertes critical créées par la perte de contexte (bénins critical en B mais pas dans le banc complet), unités à n bénin >= 5

**Bras intention_mensongere** (supprimé par : nombre de ces faux critical qui disparaissent quand on ajoute C = carnet+historique, D = liste statique livrée, O4 = lectures RPC)

| unité | n bénin | critical FULL | critical B | critical C | nouveaux critical en B | supprimés par C | par D | par O4 | par D+O4 |
|---|---|---|---|---|---|---|---|---|---|
| V2_DEV:benign_everyday/self_transfer_large | 75 | 0 | 75 | 0 | 75 | 75 | 75 | 75 | 75 |
| V2_DEV:benign_everyday/nft_listing_seaport | 75 | 0 | 75 | 75 | 75 | 0 | 75 | 0 | 75 |
| V2_DEV:benign_everyday/exchange_deposit_known | 74 | 0 | 74 | 0 | 74 | 74 | 74 | 74 | 74 |
| V2_DEV:benign_everyday/nft_setapprovalforall_marketplace | 60 | 0 | 60 | 60 | 60 | 0 | 60 | 0 | 60 |
| V2_DEV:benign_defi/liquidity_approve_lp | 10 | 0 | 10 | 10 | 10 | 0 | 10 | 0 | 10 |
| V2_DEV:benign_defi/benqi_approve_qi | 8 | 0 | 8 | 8 | 8 | 0 | 8 | 0 | 8 |
| DEV:depot_exchange | 6 | 0 | 6 | 0 | 6 | 6 | 6 | 6 | 6 |
| V2_DEV:benign_defi/wrap_deposit_plain_transfer | 11 | 0 | 9 | 9 | 9 | 0 | 0 | 9 | 9 |
| V2_DEV:benign_defi/bridge_stargate | 27 | 0 | 22 | 14 | 22 | 8 | 22 | 8 | 22 |
| V2_DEV:benign_defi/bridge_core_eth_to_avax | 18 | 0 | 14 | 14 | 14 | 0 | 14 | 0 | 14 |
| V2_DEV:benign_defi/approve_unlimited_router | 59 | 0 | 45 | 45 | 45 | 0 | 45 | 0 | 45 |
| V2_DEV:benign_defi/permit2_signature | 46 | 0 | 26 | 26 | 26 | 0 | 26 | 0 | 26 |

Causes des faux critical (codes du plancher et « adem: » du comparateur), bras intention_mensongere :
- banc complet : adem:asked_by_someone_outgoing 10, external_spender 10, adem:unexpected_approval 10, adem:no_incoming 1
- B : adem:first_seen_recipient 214, external_spender 211, unlimited_allowance 130, adem:unlimited_approval_swap 105, domain_verifier_unexpected 75, adem:unexpected_outgoing 75, approval_for_all 60, adem:unexpected_approval_connect 60, unknown_selector 37, opaque 37, adem:amount_exceeded 31, adem:unexpected_approval 21, slippage_unbounded 15, adem:no_incoming 10
- C : external_spender 211, unlimited_allowance 130, adem:unlimited_approval_swap 105, domain_verifier_unexpected 75, adem:unexpected_outgoing 75, approval_for_all 60, adem:unexpected_approval_connect 60, adem:first_seen_recipient 34, adem:amount_exceeded 31, unknown_selector 29, opaque 29, adem:unexpected_approval 21, slippage_unbounded 15, adem:no_incoming 10
- D : adem:no_incoming 10, adem:asked_by_someone_outgoing 10, external_spender 10, adem:unexpected_approval 10

Codes qui, dans le banc complet, attrapaient en critical les 325 malveillants que B ne marque plus critical : adem:high_balance_share 137, lookalike_reported 101, adem:lookalike_address 101, high_balance_share 98, site_origin_mismatch 92, adem:no_incoming 68, opaque 51, external_spender 40, token_unsellable 38, address_poisoning 37, token_sell_tax_extreme 35, service_recipient_not_self 31, adem:new_contract 24, far_expiry 24

Codes du banc complet pour les 138 malveillants qui passent à ok en B : lookalike_reported 74, adem:lookalike_address 74, high_balance_share 57, adem:high_balance_share 57, address_poisoning 37, token_sell_tax_extreme 22, token_unsellable 21, lookalike_address 14, site_origin_mismatch 10, adem:new_contract 5, token_symbol_impersonation 5, ens_name_lookalike 4

**Bras intention_produit** (supprimé par : nombre de ces faux critical qui disparaissent quand on ajoute C = carnet+historique, D = liste statique livrée, O4 = lectures RPC)

| unité | n bénin | critical FULL | critical B | critical C | nouveaux critical en B | supprimés par C | par D | par O4 | par D+O4 |
|---|---|---|---|---|---|---|---|---|---|
| V2_DEV:benign_everyday/nft_listing_seaport | 75 | 0 | 75 | 75 | 75 | 0 | 75 | 0 | 75 |
| V2_DEV:benign_everyday/nft_setapprovalforall_marketplace | 60 | 0 | 60 | 60 | 60 | 0 | 60 | 0 | 60 |
| V2_DEV:benign_defi/liquidity_approve_lp | 10 | 0 | 10 | 10 | 10 | 0 | 10 | 0 | 10 |
| V2_DEV:benign_defi/benqi_approve_qi | 8 | 0 | 8 | 8 | 8 | 0 | 8 | 0 | 8 |
| V2_DEV:benign_defi/approve_unlimited_router | 59 | 0 | 45 | 45 | 45 | 0 | 45 | 0 | 45 |
| V2_DEV:benign_defi/permit2_signature | 46 | 0 | 26 | 26 | 26 | 0 | 26 | 0 | 26 |
| V2_DEV:benign_defi/aave_gateway_approve_aToken | 14 | 0 | 7 | 7 | 7 | 0 | 7 | 0 | 7 |
| V2_DEV:benign_defi/permit_eip2612_router | 30 | 0 | 9 | 9 | 9 | 0 | 9 | 0 | 9 |
| V2_DEV:benign_defi/swap_uniswap_ur | 51 | 0 | 15 | 15 | 15 | 0 | 15 | 0 | 15 |
| V2_DEV:benign_defi/increase_allowance | 26 | 0 | 6 | 6 | 6 | 0 | 6 | 0 | 6 |
| DEV:approve_erc20 | 12 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| DEV:cow_uniswapx | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Causes des faux critical (codes du plancher et « adem: » du comparateur), bras intention_produit :
- banc complet : adem:asked_by_someone_outgoing 10, external_spender 10, adem:unexpected_approval 10
- B : external_spender 200, unlimited_allowance 130, adem:unlimited_approval_swap 105, domain_verifier_unexpected 75, adem:unexpected_outgoing 75, approval_for_all 60, adem:unexpected_approval_connect 60, slippage_unbounded 15, adem:asked_by_someone_outgoing 10, adem:unexpected_approval 10, control_change 9, far_expiry 9, delegation_7702 3, adem:unexpected_delegation_connect 2
- C : external_spender 200, unlimited_allowance 130, adem:unlimited_approval_swap 105, domain_verifier_unexpected 75, adem:unexpected_outgoing 75, approval_for_all 60, adem:unexpected_approval_connect 60, slippage_unbounded 15, adem:asked_by_someone_outgoing 10, adem:unexpected_approval 10, far_expiry 9, control_change 4, delegation_7702 3, adem:unexpected_delegation_connect 2
- D : adem:asked_by_someone_outgoing 10, external_spender 10, adem:unexpected_approval 10

Codes qui, dans le banc complet, attrapaient en critical les 673 malveillants que B ne marque plus critical : adem:lookalike_address 325, lookalike_reported 305, adem:high_balance_share 274, high_balance_share 226, adem:first_seen_recipient 205, address_poisoning 197, site_origin_mismatch 139, adem:no_incoming 76, lookalike_address 69, opaque 65, token_symbol_impersonation 58, token_unsellable 55, adem:wrong_recipient 54, token_sell_tax_extreme 54

Codes du banc complet pour les 502 malveillants qui passent à ok en B : adem:lookalike_address 298, lookalike_reported 278, high_balance_share 232, adem:high_balance_share 232, address_poisoning 197, adem:first_seen_recipient 175, lookalike_address 69, adem:wrong_recipient 57, adem:no_incoming 49, token_symbol_impersonation 46, adem:new_contract 32, token_unsellable 32, site_origin_mismatch 31, token_sell_tax_extreme 30
