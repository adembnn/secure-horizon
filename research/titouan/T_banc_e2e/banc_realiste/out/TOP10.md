
#### Top 10 par écart en points (n malveillants >= 5)

| # | unité | n malv. | FULL | B | C | écart FULL-B (pts) | perdus | produit-intent FULL/B | rest. C | rest. S_code | rest. S_age | rest. S_tok | rest. S_bal | rest. S_look | rest. S_site | rest. S_sim | rest. S_quote | rest. D | rest. O4 | rest. D_O4 | coût moyen/vérif. (code, âge, jeton, solde) |
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

| # | unité | n malv. | FULL | B | C | écart FULL-B (pts) | perdus | produit-intent FULL/B | rest. C | rest. S_code | rest. S_age | rest. S_tok | rest. S_bal | rest. S_look | rest. S_site | rest. S_sim | rest. S_quote | rest. D | rest. O4 | rest. D_O4 | coût moyen/vérif. (code, âge, jeton, solde) |
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
