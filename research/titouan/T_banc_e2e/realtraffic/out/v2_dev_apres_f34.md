# MESURE V2_DEV — zz_b

Généré par run/run_v2.mjs (2026-10-11T07:03:41.394Z), POLICY_FIXES=(défaut KEPT), V2_DEV n=5927 (3930 Avalanche, 1997 autres ; chaîne lue dans context.chainId, sinon dans le chainId de la requête ; inconnue = « autres »). V2_TEST jamais lu.

Lecture : rappel = malveillant en warn ou critical ; inconnu = non décodable, compté NON attrapé ; FA c = bénin en critical ; FA w+c brut = bénin en warn ou critical ; FA w+c excès = au-delà de la sévérité tolérée (expected). Wilson 95 %. Les « bénins » = label benin (benign_defi + benign_everyday) ; fraude conforme et ambigus à part.

## TOUT

| bras | rappel | rappel critical | raté | inconnu | FA critical | FA warn+critical brut | FA warn+critical excès | fraude conforme alertée | ambigus ok/warn/crit |
|---|---|---|---|---|---|---|---|---|---|
| plancher | 98.9% [98.5-99.2] (2898/2930) | 88.3% [87.1-89.4] (2588/2930) | 32 | 0 | 0.0% [0.0-0.2] (0/1976) | 14.7% [13.2-16.4] (291/1976) | 8.6% [7.4-9.9] (170/1976) | 45.0% [41.6-48.5] (358/795) | 134/92/0 |
| honnête | 98.9% [98.5-99.2] (2898/2930) | 88.7% [87.5-89.8] (2598/2930) | 32 | 0 | 11.1% [9.8-12.5] (219/1976) | 26.8% [24.9-28.8] (530/1976) | 17.7% [16.0-19.4] (349/1976) | 60.1% [56.7-63.5] (478/795) | 103/74/49 |
| catalogue | 99.7% [99.5-99.9] (2922/2930) | 95.2% [94.4-95.9] (2790/2930) | 8 | 0 | 1.1% [0.7-1.6] (21/1976) | 19.9% [18.2-21.8] (394/1976) | 10.8% [9.5-12.3] (214/1976) | 76.5% [73.4-79.3] (608/795) | 119/92/15 |

## Avalanche (43114/43113)

| bras | rappel | rappel critical | raté | inconnu | FA critical | FA warn+critical brut | FA warn+critical excès | fraude conforme alertée | ambigus ok/warn/crit |
|---|---|---|---|---|---|---|---|---|---|
| plancher | 99.5% [99.0-99.7] (1586/1594) | 93.5% [92.2-94.6] (1490/1594) | 8 | 0 | 0.0% [0.0-0.3] (0/1502) | 13.2% [11.6-15.1] (199/1502) | 7.1% [5.9-8.5] (106/1502) | 45.1% [41.3-48.9] (294/652) | 111/71/0 |
| honnête | 99.5% [99.0-99.7] (1586/1594) | 94.0% [92.8-95.1] (1499/1594) | 8 | 0 | 10.9% [9.4-12.6] (164/1502) | 25.6% [23.5-27.9] (385/1502) | 16.0% [14.2-17.9] (240/1502) | 59.4% [55.5-63.1] (387/652) | 93/61/28 |
| catalogue | 99.6% [99.2-99.8] (1588/1594) | 97.7% [96.8-98.3] (1557/1594) | 6 | 0 | 1.1% [0.7-1.7] (16/1502) | 18.8% [16.9-20.9] (283/1502) | 9.2% [7.8-10.8] (138/1502) | 77.0% [73.6-80.1] (502/652) | 97/71/14 |

## autres chaînes

| bras | rappel | rappel critical | raté | inconnu | FA critical | FA warn+critical brut | FA warn+critical excès | fraude conforme alertée | ambigus ok/warn/crit |
|---|---|---|---|---|---|---|---|---|---|
| plancher | 98.2% [97.3-98.8] (1312/1336) | 82.2% [80.0-84.1] (1098/1336) | 24 | 0 | 0.0% [0.0-0.8] (0/474) | 19.4% [16.1-23.2] (92/474) | 13.5% [10.7-16.9] (64/474) | 44.8% [36.8-52.9] (64/143) | 23/21/0 |
| honnête | 98.2% [97.3-98.8] (1312/1336) | 82.3% [80.1-84.2] (1099/1336) | 24 | 0 | 11.6% [9.0-14.8] (55/474) | 30.6% [26.6-34.9] (145/474) | 23.0% [19.4-27.0] (109/474) | 63.6% [55.5-71.1] (91/143) | 10/13/21 |
| catalogue | 99.9% [99.5-100.0] (1334/1336) | 92.3% [90.7-93.6] (1233/1336) | 2 | 0 | 1.1% [0.5-2.4] (5/474) | 23.4% [19.8-27.4] (111/474) | 16.0% [13.0-19.6] (76/474) | 74.1% [66.4-80.6] (106/143) | 22/21/1 |

## Par famille

att(crit) = attrapés critical+warn / n malveillants (dont critical). Portée : tout / Av = Avalanche / Au = autres.

| clé | portée | n malv. | plancher | honnête | catalogue | raté cat. | inconnu | n bénin | FA critical plancher/hon/cat | FA w+c brut cat. | n fc (alertée cat.) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ambigu | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| ambigu | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| ambigu | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| benign_defi | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 1001 | 0/79/1 | 231 | 0 (0) |
| benign_defi | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 765 | 0/53/1 | 159 | 0 (0) |
| benign_defi | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 236 | 0/26/0 | 72 | 0 (0) |
| benign_everyday | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 975 | 0/140/20 | 163 | 0 (0) |
| benign_everyday | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 737 | 0/111/15 | 124 | 0 (0) |
| benign_everyday | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 238 | 0/29/5 | 39 | 0 (0) |
| fraude_conforme | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 795 (608) |
| fraude_conforme | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 652 (502) |
| fraude_conforme | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 143 (106) |
| onchain | tout | 961 | 941/961(767) | 941/961(767) | 961/961(885) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain | Av | 54 | 54/54(54) | 54/54(54) | 54/54(54) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain | Au | 907 | 887/907(713) | 887/907(713) | 907/907(831) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens | tout | 1056 | 1045/1056(1002) | 1045/1056(1012) | 1049/1056(1029) | 7 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens | Av | 850 | 842/850(805) | 842/850(814) | 844/850(826) | 6 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens | Au | 206 | 203/206(197) | 203/206(198) | 205/206(203) | 1 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig | tout | 913 | 912/913(819) | 912/913(819) | 912/913(876) | 1 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig | Av | 690 | 690/690(631) | 690/690(631) | 690/690(677) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig | Au | 223 | 222/223(188) | 222/223(188) | 222/223(199) | 1 | 0 | 0 | 0/0/0 | 0 | 0 (0) |

## Par sous-famille

att(crit) = attrapés critical+warn / n malveillants (dont critical). Portée : tout / Av = Avalanche / Au = autres.

| clé | portée | n malv. | plancher | honnête | catalogue | raté cat. | inconnu | n bénin | FA critical plancher/hon/cat | FA w+c brut cat. | n fc (alertée cat.) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ambigu/first_unknown_contract_benign | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| ambigu/first_unknown_contract_benign | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| ambigu/first_unknown_contract_benign | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| ambigu/obscure_real_airdrop | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| ambigu/obscure_real_airdrop | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| ambigu/obscure_real_airdrop | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| ambigu/recent_legit_token | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| ambigu/recent_legit_token | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| ambigu/recent_legit_token | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| ambigu/unknown_dao_multisig | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| ambigu/unknown_dao_multisig | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| ambigu/unknown_dao_multisig | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| ambigu/unusual_amount_new_address | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| ambigu/unusual_amount_new_address | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| ambigu/unusual_amount_new_address | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| benign_defi/aave_batch_approve_supply | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 13 | 0/0/0 | 1 | 0 (0) |
| benign_defi/aave_batch_approve_supply | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 13 | 0/0/0 | 1 | 0 (0) |
| benign_defi/aave_borrow | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 19 | 0/0/0 | 0 | 0 (0) |
| benign_defi/aave_borrow | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 15 | 0/0/0 | 0 | 0 (0) |
| benign_defi/aave_borrow | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 4 | 0/0/0 | 0 | 0 (0) |
| benign_defi/aave_collateral_toggle | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 8 | 0/0/0 | 3 | 0 (0) |
| benign_defi/aave_collateral_toggle | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 6 | 0/0/0 | 2 | 0 (0) |
| benign_defi/aave_collateral_toggle | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 2 | 0/0/0 | 1 | 0 (0) |
| benign_defi/aave_gateway_approve_aToken | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 14 | 0/0/0 | 7 | 0 (0) |
| benign_defi/aave_gateway_approve_aToken | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 14 | 0/0/0 | 7 | 0 (0) |
| benign_defi/aave_gateway_deposit | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 7 | 0/0/0 | 0 | 0 (0) |
| benign_defi/aave_gateway_deposit | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 7 | 0/0/0 | 0 | 0 (0) |
| benign_defi/aave_gateway_withdraw | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 10 | 0/0/0 | 1 | 0 (0) |
| benign_defi/aave_gateway_withdraw | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 10 | 0/0/0 | 1 | 0 (0) |
| benign_defi/aave_repay | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 8 | 0/0/0 | 3 | 0 (0) |
| benign_defi/aave_repay | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 6 | 0/0/0 | 2 | 0 (0) |
| benign_defi/aave_repay | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 2 | 0/0/0 | 1 | 0 (0) |
| benign_defi/aave_repay_max | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 11 | 0/0/0 | 11 | 0 (0) |
| benign_defi/aave_repay_max | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 11 | 0/0/0 | 11 | 0 (0) |
| benign_defi/aave_supply | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 14 | 0/0/0 | 2 | 0 (0) |
| benign_defi/aave_supply | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 9 | 0/0/0 | 2 | 0 (0) |
| benign_defi/aave_supply | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 5 | 0/0/0 | 0 | 0 (0) |
| benign_defi/aave_withdraw | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 13 | 0/0/0 | 0 | 0 (0) |
| benign_defi/aave_withdraw | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 10 | 0/0/0 | 0 | 0 (0) |
| benign_defi/aave_withdraw | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 3 | 0/0/0 | 0 | 0 (0) |
| benign_defi/aave_withdraw_max | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 11 | 0/0/0 | 0 | 0 (0) |
| benign_defi/aave_withdraw_max | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 9 | 0/0/0 | 0 | 0 (0) |
| benign_defi/aave_withdraw_max | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 2 | 0/0/0 | 0 | 0 (0) |
| benign_defi/approve_permit2_contract | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 27 | 0/0/0 | 0 | 0 (0) |
| benign_defi/approve_permit2_contract | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 16 | 0/0/0 | 0 | 0 (0) |
| benign_defi/approve_permit2_contract | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 11 | 0/0/0 | 0 | 0 (0) |
| benign_defi/approve_unlimited_router | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 59 | 0/0/0 | 0 | 0 (0) |
| benign_defi/approve_unlimited_router | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 46 | 0/0/0 | 0 | 0 (0) |
| benign_defi/approve_unlimited_router | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 13 | 0/0/0 | 0 | 0 (0) |
| benign_defi/benqi_approve_qi | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 8 | 0/0/0 | 2 | 0 (0) |
| benign_defi/benqi_approve_qi | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 8 | 0/0/0 | 2 | 0 (0) |
| benign_defi/benqi_enter_markets | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 7 | 0/0/0 | 0 | 0 (0) |
| benign_defi/benqi_enter_markets | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 7 | 0/0/0 | 0 | 0 (0) |
| benign_defi/benqi_mint_avax | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 7 | 0/0/0 | 0 | 0 (0) |
| benign_defi/benqi_mint_avax | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 7 | 0/0/0 | 0 | 0 (0) |
| benign_defi/benqi_mint_usdc | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 3 | 0/0/0 | 1 | 0 (0) |
| benign_defi/benqi_mint_usdc | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 3 | 0/0/0 | 1 | 0 (0) |
| benign_defi/benqi_redeem | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 3 | 0/0/0 | 0 | 0 (0) |
| benign_defi/benqi_redeem | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 3 | 0/0/0 | 0 | 0 (0) |
| benign_defi/benqi_redeem_underlying | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 8 | 0/0/0 | 0 | 0 (0) |
| benign_defi/benqi_redeem_underlying | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 8 | 0/0/0 | 0 | 0 (0) |
| benign_defi/bridge_cctp | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 35 | 0/0/0 | 14 | 0 (0) |
| benign_defi/bridge_cctp | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 25 | 0/0/0 | 8 | 0 (0) |
| benign_defi/bridge_cctp | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 10 | 0/0/0 | 6 | 0 (0) |
| benign_defi/bridge_core_avax_to_eth | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 19 | 0/0/0 | 2 | 0 (0) |
| benign_defi/bridge_core_avax_to_eth | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 19 | 0/0/0 | 2 | 0 (0) |
| benign_defi/bridge_core_eth_to_avax | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 18 | 0/0/0 | 0 | 0 (0) |
| benign_defi/bridge_core_eth_to_avax | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 18 | 0/0/0 | 0 | 0 (0) |
| benign_defi/bridge_stargate | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 27 | 0/0/0 | 0 | 0 (0) |
| benign_defi/bridge_stargate | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 15 | 0/0/0 | 0 | 0 (0) |
| benign_defi/bridge_stargate | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 12 | 0/0/0 | 0 | 0 (0) |
| benign_defi/gov_delegate | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 36 | 0/0/0 | 0 | 0 (0) |
| benign_defi/gov_delegate | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 27 | 0/0/0 | 0 | 0 (0) |
| benign_defi/gov_delegate | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 9 | 0/0/0 | 0 | 0 (0) |
| benign_defi/increase_allowance | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 26 | 0/0/0 | 0 | 0 (0) |
| benign_defi/increase_allowance | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 19 | 0/0/0 | 0 | 0 (0) |
| benign_defi/increase_allowance | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 7 | 0/0/0 | 0 | 0 (0) |
| benign_defi/liquidity_add_native | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 17 | 0/0/0 | 0 | 0 (0) |
| benign_defi/liquidity_add_native | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 12 | 0/0/0 | 0 | 0 (0) |
| benign_defi/liquidity_add_native | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 5 | 0/0/0 | 0 | 0 (0) |
| benign_defi/liquidity_add_tokens | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 6 | 0/0/0 | 1 | 0 (0) |
| benign_defi/liquidity_add_tokens | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 3 | 0/0/0 | 0 | 0 (0) |
| benign_defi/liquidity_add_tokens | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 3 | 0/0/0 | 1 | 0 (0) |
| benign_defi/liquidity_approve_lp | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 10 | 0/0/0 | 2 | 0 (0) |
| benign_defi/liquidity_approve_lp | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 7 | 0/0/0 | 1 | 0 (0) |
| benign_defi/liquidity_approve_lp | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 3 | 0/0/0 | 1 | 0 (0) |
| benign_defi/liquidity_remove_native | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 10 | 0/0/0 | 0 | 0 (0) |
| benign_defi/liquidity_remove_native | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 7 | 0/0/0 | 0 | 0 (0) |
| benign_defi/liquidity_remove_native | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 3 | 0/0/0 | 0 | 0 (0) |
| benign_defi/permit2_signature | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 46 | 0/0/0 | 13 | 0 (0) |
| benign_defi/permit2_signature | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 33 | 0/0/0 | 11 | 0 (0) |
| benign_defi/permit2_signature | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 13 | 0/0/0 | 2 | 0 (0) |
| benign_defi/permit_eip2612_router | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 30 | 0/0/0 | 8 | 0 (0) |
| benign_defi/permit_eip2612_router | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 21 | 0/0/0 | 5 | 0 (0) |
| benign_defi/permit_eip2612_router | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 9 | 0/0/0 | 3 | 0 (0) |
| benign_defi/revoke_approve_zero | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 17 | 0/0/0 | 0 | 0 (0) |
| benign_defi/revoke_approve_zero | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 15 | 0/0/0 | 0 | 0 (0) |
| benign_defi/revoke_approve_zero | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 2 | 0/0/0 | 0 | 0 (0) |
| benign_defi/revoke_approve_zero_unknown_spender | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 5 | 0/0/0 | 0 | 0 (0) |
| benign_defi/revoke_approve_zero_unknown_spender | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 4 | 0/0/0 | 0 | 0 (0) |
| benign_defi/revoke_approve_zero_unknown_spender | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 1 | 0/0/0 | 0 | 0 (0) |
| benign_defi/revoke_nft_revoke | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 8 | 0/0/0 | 0 | 0 (0) |
| benign_defi/revoke_nft_revoke | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 4 | 0/0/0 | 0 | 0 (0) |
| benign_defi/revoke_nft_revoke | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 4 | 0/0/0 | 0 | 0 (0) |
| benign_defi/revoke_permit2_lockdown | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 9 | 0/0/0 | 0 | 0 (0) |
| benign_defi/revoke_permit2_lockdown | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 8 | 0/0/0 | 0 | 0 (0) |
| benign_defi/revoke_permit2_lockdown | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 1 | 0/0/0 | 0 | 0 (0) |
| benign_defi/revoke_permit2_zero | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 9 | 0/0/0 | 0 | 0 (0) |
| benign_defi/revoke_permit2_zero | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 8 | 0/0/0 | 0 | 0 (0) |
| benign_defi/revoke_permit2_zero | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 1 | 0/0/0 | 0 | 0 (0) |
| benign_defi/router_multicall | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 37 | 0/11/1 | 24 | 0 (0) |
| benign_defi/router_multicall | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 28 | 0/8/1 | 17 | 0 (0) |
| benign_defi/router_multicall | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 9 | 0/3/0 | 7 | 0 (0) |
| benign_defi/savax_approve_savax_dex | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 4 | 0/0/0 | 1 | 0 (0) |
| benign_defi/savax_approve_savax_dex | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 4 | 0/0/0 | 1 | 0 (0) |
| benign_defi/savax_redeem | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 5 | 0/0/0 | 0 | 0 (0) |
| benign_defi/savax_redeem | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 5 | 0/0/0 | 0 | 0 (0) |
| benign_defi/savax_request_unlock | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 11 | 0/0/0 | 0 | 0 (0) |
| benign_defi/savax_request_unlock | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 11 | 0/0/0 | 0 | 0 (0) |
| benign_defi/savax_submit | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 18 | 0/18/0 | 1 | 0 (0) |
| benign_defi/savax_submit | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 18 | 0/18/0 | 1 | 0 (0) |
| benign_defi/swap_1inch | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 42 | 0/0/0 | 7 | 0 (0) |
| benign_defi/swap_1inch | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 35 | 0/0/0 | 6 | 0 (0) |
| benign_defi/swap_1inch | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 7 | 0/0/0 | 1 | 0 (0) |
| benign_defi/swap_lfj_lb | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 36 | 0/0/0 | 13 | 0 (0) |
| benign_defi/swap_lfj_lb | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 36 | 0/0/0 | 13 | 0 (0) |
| benign_defi/swap_lfj_v1 | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 44 | 0/0/0 | 5 | 0 (0) |
| benign_defi/swap_lfj_v1 | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 44 | 0/0/0 | 5 | 0 (0) |
| benign_defi/swap_odos | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 34 | 0/0/0 | 20 | 0 (0) |
| benign_defi/swap_odos | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 34 | 0/0/0 | 20 | 0 (0) |
| benign_defi/swap_pangolin | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 31 | 0/0/0 | 3 | 0 (0) |
| benign_defi/swap_pangolin | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 31 | 0/0/0 | 3 | 0 (0) |
| benign_defi/swap_paraswap | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 31 | 0/0/0 | 4 | 0 (0) |
| benign_defi/swap_paraswap | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 25 | 0/0/0 | 3 | 0 (0) |
| benign_defi/swap_paraswap | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 6 | 0/0/0 | 1 | 0 (0) |
| benign_defi/swap_uniswap_eth_direct | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 40 | 0/10/0 | 30 | 0 (0) |
| benign_defi/swap_uniswap_eth_direct | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 40 | 0/10/0 | 30 | 0 (0) |
| benign_defi/swap_uniswap_ur | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 51 | 0/16/0 | 51 | 0 (0) |
| benign_defi/swap_uniswap_ur | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 33 | 0/12/0 | 33 | 0 (0) |
| benign_defi/swap_uniswap_ur | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 18 | 0/4/0 | 18 | 0 (0) |
| benign_defi/wrap_deposit | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 14 | 0/14/0 | 1 | 0 (0) |
| benign_defi/wrap_deposit | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 10 | 0/10/0 | 1 | 0 (0) |
| benign_defi/wrap_deposit | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 4 | 0/4/0 | 0 | 0 (0) |
| benign_defi/wrap_deposit_plain_transfer | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 11 | 0/10/0 | 0 | 0 (0) |
| benign_defi/wrap_deposit_plain_transfer | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 6 | 0/5/0 | 0 | 0 (0) |
| benign_defi/wrap_deposit_plain_transfer | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 5 | 0/5/0 | 0 | 0 (0) |
| benign_defi/wrap_withdraw | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 14 | 0/0/0 | 0 | 0 (0) |
| benign_defi/wrap_withdraw | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 10 | 0/0/0 | 0 | 0 (0) |
| benign_defi/wrap_withdraw | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 4 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/add_chain_avalanche_l1 | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 43 | 0/0/0 | 19 | 0 (0) |
| benign_everyday/add_chain_avalanche_l1 | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 43 | 0/0/0 | 19 | 0 (0) |
| benign_everyday/donation | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 47 | 0/14/0 | 0 | 0 (0) |
| benign_everyday/donation | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 39 | 0/11/0 | 0 | 0 (0) |
| benign_everyday/donation | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 8 | 0/3/0 | 0 | 0 (0) |
| benign_everyday/elderly_pays_artisan | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 49 | 0/13/0 | 0 | 0 (0) |
| benign_everyday/elderly_pays_artisan | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 37 | 0/10/0 | 0 | 0 (0) |
| benign_everyday/elderly_pays_artisan | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 12 | 0/3/0 | 0 | 0 (0) |
| benign_everyday/elderly_pays_relative | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 34 | 0/9/10 | 10 | 0 (0) |
| benign_everyday/elderly_pays_relative | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 27 | 0/5/8 | 8 | 0 (0) |
| benign_everyday/elderly_pays_relative | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 7 | 0/4/2 | 2 | 0 (0) |
| benign_everyday/exchange_deposit_known | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 74 | 0/21/0 | 0 | 0 (0) |
| benign_everyday/exchange_deposit_known | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 62 | 0/18/0 | 0 | 0 (0) |
| benign_everyday/exchange_deposit_known | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 12 | 0/3/0 | 0 | 0 (0) |
| benign_everyday/first_payment_in_person | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 59 | 0/17/0 | 0 | 0 (0) |
| benign_everyday/first_payment_in_person | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 48 | 0/14/0 | 0 | 0 (0) |
| benign_everyday/first_payment_in_person | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 11 | 0/3/0 | 0 | 0 (0) |
| benign_everyday/nft_listing_seaport | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 75 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/nft_listing_seaport | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 50 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/nft_listing_seaport | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 25 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/nft_purchase_seaport | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 56 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/nft_purchase_seaport | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 40 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/nft_purchase_seaport | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 16 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/nft_setapprovalforall_marketplace | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 60 | 0/0/0 | 60 | 0 (0) |
| benign_everyday/nft_setapprovalforall_marketplace | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 39 | 0/0/0 | 39 | 0 (0) |
| benign_everyday/nft_setapprovalforall_marketplace | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 21 | 0/0/0 | 21 | 0 (0) |
| benign_everyday/p2p_contact | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 41 | 0/4/0 | 6 | 0 (0) |
| benign_everyday/p2p_contact | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 36 | 0/4/0 | 6 | 0 (0) |
| benign_everyday/p2p_contact | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 5 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/p2p_contact_prefix_twin | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 72 | 0/20/0 | 14 | 0 (0) |
| benign_everyday/p2p_contact_prefix_twin | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 62 | 0/16/0 | 11 | 0 (0) |
| benign_everyday/p2p_contact_prefix_twin | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 10 | 0/4/0 | 3 | 0 (0) |
| benign_everyday/payroll_disperse | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 13 | 0/0/0 | 13 | 0 (0) |
| benign_everyday/payroll_disperse | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 11 | 0/0/0 | 11 | 0 (0) |
| benign_everyday/payroll_disperse | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 2 | 0/0/0 | 2 | 0 (0) |
| benign_everyday/payroll_sendcalls_batch | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 24 | 0/24/0 | 12 | 0 (0) |
| benign_everyday/payroll_sendcalls_batch | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 19 | 0/19/0 | 9 | 0 (0) |
| benign_everyday/payroll_sendcalls_batch | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 5 | 0/5/0 | 3 | 0 (0) |
| benign_everyday/payroll_single | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 12 | 0/0/0 | 2 | 0 (0) |
| benign_everyday/payroll_single | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 7 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/payroll_single | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 5 | 0/0/0 | 2 | 0 (0) |
| benign_everyday/personal_sign_readable | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 30 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/personal_sign_readable | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 28 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/personal_sign_readable | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 2 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/self_transfer_large | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 75 | 0/18/0 | 17 | 0 (0) |
| benign_everyday/self_transfer_large | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 57 | 0/14/0 | 14 | 0 (0) |
| benign_everyday/self_transfer_large | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 18 | 0/4/0 | 3 | 0 (0) |
| benign_everyday/siwe_login_domain_match | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 80 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/siwe_login_domain_match | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 59 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/siwe_login_domain_match | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 21 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/snapshot_vote_typed | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 41 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/snapshot_vote_typed | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 34 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/snapshot_vote_typed | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 7 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/subscription_capped_approve | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 10 | 0/0/10 | 10 | 0 (0) |
| benign_everyday/subscription_capped_approve | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 7 | 0/0/7 | 7 | 0 (0) |
| benign_everyday/subscription_capped_approve | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 3 | 0/0/3 | 3 | 0 (0) |
| benign_everyday/subscription_recurring_transfer | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 34 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/subscription_recurring_transfer | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 24 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/subscription_recurring_transfer | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 10 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/switch_chain_avalanche | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 46 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/switch_chain_avalanche | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 8 | 0/0/0 | 0 | 0 (0) |
| benign_everyday/switch_chain_avalanche | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 38 | 0/0/0 | 0 | 0 (0) |
| fraude_conforme/fake_ai_trading_agent | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 96 (95) |
| fraude_conforme/fake_ai_trading_agent | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 83 (82) |
| fraude_conforme/fake_ai_trading_agent | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 13 (13) |
| fraude_conforme/fake_bank_advisor | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 101 (93) |
| fraude_conforme/fake_bank_advisor | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 82 (76) |
| fraude_conforme/fake_bank_advisor | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 19 (17) |
| fraude_conforme/fake_recruiter | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 111 (80) |
| fraude_conforme/fake_recruiter | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 90 (66) |
| fraude_conforme/fake_recruiter | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 21 (14) |
| fraude_conforme/fake_support | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 100 (83) |
| fraude_conforme/fake_support | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 79 (66) |
| fraude_conforme/fake_support | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 21 (17) |
| fraude_conforme/pig_butchering | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 122 (85) |
| fraude_conforme/pig_butchering | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 99 (68) |
| fraude_conforme/pig_butchering | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 23 (17) |
| fraude_conforme/recovery_scam | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 85 (59) |
| fraude_conforme/recovery_scam | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 69 (48) |
| fraude_conforme/recovery_scam | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 16 (11) |
| fraude_conforme/romance | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 92 (54) |
| fraude_conforme/romance | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 80 (46) |
| fraude_conforme/romance | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 12 (8) |
| fraude_conforme/voice_deepfake_relative | tout | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 88 (59) |
| fraude_conforme/voice_deepfake_relative | Av | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 70 (50) |
| fraude_conforme/voice_deepfake_relative | Au | 0 | 0/0(0) | 0/0(0) | 0/0(0) | 0 | 0 | 0 | 0/0/0 | 0 | 18 (9) |
| onchain/amountOutMin0_controlled_pool | tout | 41 | 41/41(0) | 41/41(0) | 41/41(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/amountOutMin0_controlled_pool | Au | 41 | 41/41(0) | 41/41(0) | 41/41(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/amountOutMin0_lookalike_router | tout | 13 | 13/13(13) | 13/13(13) | 13/13(13) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/amountOutMin0_lookalike_router | Au | 13 | 13/13(13) | 13/13(13) | 13/13(13) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/approve_drainer | tout | 129 | 129/129(111) | 129/129(111) | 129/129(118) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/approve_drainer | Au | 129 | 129/129(111) | 129/129(111) | 129/129(118) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/approve_lookalike_spender | tout | 39 | 39/39(34) | 39/39(34) | 39/39(35) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/approve_lookalike_spender | Au | 39 | 39/39(34) | 39/39(34) | 39/39(35) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/dsproxy_setOwner | tout | 27 | 27/27(27) | 27/27(27) | 27/27(27) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/dsproxy_setOwner | Au | 27 | 27/27(27) | 27/27(27) | 27/27(27) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/eip7702_delegate_drainer | tout | 49 | 49/49(49) | 49/49(49) | 49/49(49) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/eip7702_delegate_drainer | Au | 49 | 49/49(49) | 49/49(49) | 49/49(49) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/eip7702_lookalike_delegate | tout | 16 | 16/16(16) | 16/16(16) | 16/16(16) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/eip7702_lookalike_delegate | Au | 16 | 16/16(16) | 16/16(16) | 16/16(16) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/increaseAllowance_drainer | tout | 56 | 56/56(36) | 56/56(36) | 56/56(56) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/increaseAllowance_drainer | Au | 56 | 56/56(36) | 56/56(36) | 56/56(56) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/increaseAllowance_lookalike_spender | tout | 23 | 23/23(23) | 23/23(23) | 23/23(23) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/increaseAllowance_lookalike_spender | Au | 23 | 23/23(23) | 23/23(23) | 23/23(23) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/multicall_depth1_approve | tout | 8 | 8/8(8) | 8/8(8) | 8/8(8) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/multicall_depth1_approve | Au | 8 | 8/8(8) | 8/8(8) | 8/8(8) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/multicall_depth1_approve_aggregate3 | tout | 12 | 12/12(0) | 12/12(0) | 12/12(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/multicall_depth1_approve_aggregate3 | Au | 12 | 12/12(0) | 12/12(0) | 12/12(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/multicall_depth1_transferFrom | tout | 16 | 16/16(0) | 16/16(0) | 16/16(16) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/multicall_depth1_transferFrom | Au | 16 | 16/16(0) | 16/16(0) | 16/16(16) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/multicall_depth2_approve | tout | 19 | 19/19(19) | 19/19(19) | 19/19(19) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/multicall_depth2_approve | Au | 19 | 19/19(19) | 19/19(19) | 19/19(19) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/multicall_depth2_transferFrom | tout | 8 | 8/8(0) | 8/8(0) | 8/8(8) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/multicall_depth2_transferFrom | Au | 8 | 8/8(0) | 8/8(0) | 8/8(8) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/multicall_depth2_transferFrom_aggregate3 | tout | 11 | 11/11(11) | 11/11(11) | 11/11(11) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/multicall_depth2_transferFrom_aggregate3 | Au | 11 | 11/11(11) | 11/11(11) | 11/11(11) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/multicall_depth3_approve | tout | 12 | 12/12(12) | 12/12(12) | 12/12(12) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/multicall_depth3_approve | Au | 12 | 12/12(12) | 12/12(12) | 12/12(12) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/multicall_depth3_approve_aggregate3 | tout | 8 | 8/8(0) | 8/8(0) | 8/8(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/multicall_depth3_approve_aggregate3 | Au | 8 | 8/8(0) | 8/8(0) | 8/8(0) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/multicall_depth3_transferFrom | tout | 15 | 15/15(0) | 15/15(0) | 15/15(15) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/multicall_depth3_transferFrom | Au | 15 | 15/15(0) | 15/15(0) | 15/15(15) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/safe_addOwner | tout | 25 | 25/25(25) | 25/25(25) | 25/25(25) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/safe_addOwner | Au | 25 | 25/25(25) | 25/25(25) | 25/25(25) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/safe_changeThreshold | tout | 28 | 28/28(28) | 28/28(28) | 28/28(28) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/safe_changeThreshold | Au | 28 | 28/28(28) | 28/28(28) | 28/28(28) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/safe_enableModule | tout | 21 | 21/21(21) | 21/21(21) | 21/21(21) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/safe_enableModule | Au | 21 | 21/21(21) | 21/21(21) | 21/21(21) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/safe_setGuard | tout | 27 | 27/27(27) | 27/27(27) | 27/27(27) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/safe_setGuard | Au | 27 | 27/27(27) | 27/27(27) | 27/27(27) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/sendcalls_approval_buried_8 | tout | 18 | 18/18(18) | 18/18(18) | 18/18(18) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/sendcalls_approval_buried_8 | Av | 14 | 14/14(14) | 14/14(14) | 14/14(14) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/sendcalls_approval_buried_8 | Au | 4 | 4/4(4) | 4/4(4) | 4/4(4) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/sendcalls_approval_in_batch | tout | 51 | 51/51(51) | 51/51(51) | 51/51(51) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/sendcalls_approval_in_batch | Av | 40 | 40/40(40) | 40/40(40) | 40/40(40) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/sendcalls_approval_in_batch | Au | 11 | 11/11(11) | 11/11(11) | 11/11(11) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/setApprovalForAll_erc1155 | tout | 45 | 45/45(45) | 45/45(45) | 45/45(45) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/setApprovalForAll_erc1155 | Au | 45 | 45/45(45) | 45/45(45) | 45/45(45) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/setApprovalForAll_erc721 | tout | 41 | 41/41(41) | 41/41(41) | 41/41(41) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/setApprovalForAll_erc721 | Au | 41 | 41/41(41) | 41/41(41) | 41/41(41) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/swap_recipient_not_self_v2 | tout | 23 | 23/23(23) | 23/23(23) | 23/23(23) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/swap_recipient_not_self_v2 | Au | 23 | 23/23(23) | 23/23(23) | 23/23(23) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/swap_recipient_not_self_v3 | tout | 27 | 27/27(27) | 27/27(27) | 27/27(27) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/swap_recipient_not_self_v3 | Au | 27 | 27/27(27) | 27/27(27) | 27/27(27) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/transferFrom_direct | tout | 51 | 31/51(0) | 31/51(0) | 51/51(51) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/transferFrom_direct | Au | 51 | 31/51(0) | 31/51(0) | 51/51(51) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/transferFrom_lookalike_recipient | tout | 17 | 17/17(17) | 17/17(17) | 17/17(17) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/transferFrom_lookalike_recipient | Au | 17 | 17/17(17) | 17/17(17) | 17/17(17) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/transferOwnership | tout | 24 | 24/24(24) | 24/24(24) | 24/24(24) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/transferOwnership | Au | 24 | 24/24(24) | 24/24(24) | 24/24(24) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/upgradeTo | tout | 28 | 28/28(28) | 28/28(28) | 28/28(28) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/upgradeTo | Au | 28 | 28/28(28) | 28/28(28) | 28/28(28) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/upgradeToAndCall | tout | 33 | 33/33(33) | 33/33(33) | 33/33(33) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| onchain/upgradeToAndCall | Au | 33 | 33/33(33) | 33/33(33) | 33/33(33) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/addr_poison_dust_after_send | tout | 93 | 93/93(93) | 93/93(93) | 93/93(93) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/addr_poison_dust_after_send | Av | 72 | 72/72(72) | 72/72(72) | 72/72(72) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/addr_poison_dust_after_send | Au | 21 | 21/21(21) | 21/21(21) | 21/21(21) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/addr_poison_fake_token_lookalike | tout | 91 | 91/91(91) | 91/91(91) | 91/91(91) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/addr_poison_fake_token_lookalike | Av | 76 | 76/76(76) | 76/76(76) | 76/76(76) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/addr_poison_fake_token_lookalike | Au | 15 | 15/15(15) | 15/15(15) | 15/15(15) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/addr_poison_zero_transferFrom | tout | 87 | 87/87(87) | 87/87(87) | 87/87(87) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/addr_poison_zero_transferFrom | Av | 67 | 67/67(67) | 67/67(67) | 67/67(67) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/addr_poison_zero_transferFrom | Au | 20 | 20/20(20) | 20/20(20) | 20/20(20) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/addressbook_poisoned | tout | 76 | 74/76(70) | 74/76(70) | 74/76(70) | 2 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/addressbook_poisoned | Av | 58 | 56/58(52) | 56/58(52) | 56/58(52) | 2 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/addressbook_poisoned | Au | 18 | 18/18(18) | 18/18(18) | 18/18(18) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/clipboard_swap | tout | 97 | 90/97(79) | 90/97(79) | 93/97(87) | 4 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/clipboard_swap | Av | 72 | 67/72(60) | 67/72(60) | 69/72(65) | 3 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/clipboard_swap | Au | 25 | 23/25(19) | 23/25(19) | 24/25(22) | 1 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/fake_site_drainer_kit | tout | 85 | 85/85(85) | 85/85(85) | 85/85(85) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/fake_site_drainer_kit | Av | 73 | 73/73(73) | 73/73(73) | 73/73(73) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/fake_site_drainer_kit | Au | 12 | 12/12(12) | 12/12(12) | 12/12(12) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/fake_site_lookalike_domain | tout | 169 | 169/169(169) | 169/169(169) | 169/169(169) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/fake_site_lookalike_domain | Av | 135 | 135/135(135) | 135/135(135) | 135/135(135) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/fake_site_lookalike_domain | Au | 34 | 34/34(34) | 34/34(34) | 34/34(34) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/forced_chain_switch_then_sign | tout | 67 | 67/67(56) | 67/67(60) | 67/67(64) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/forced_chain_switch_then_sign | Av | 48 | 48/48(38) | 48/48(42) | 48/48(45) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/forced_chain_switch_then_sign | Au | 19 | 19/19(18) | 19/19(18) | 19/19(19) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/siwe_domain_mismatch | tout | 68 | 68/68(68) | 68/68(68) | 68/68(68) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/siwe_domain_mismatch | Av | 57 | 57/57(57) | 57/57(57) | 57/57(57) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/siwe_domain_mismatch | Au | 11 | 11/11(11) | 11/11(11) | 11/11(11) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/token_airdrop_lure | tout | 59 | 57/59(40) | 57/59(46) | 58/59(51) | 1 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/token_airdrop_lure | Av | 49 | 48/49(32) | 48/49(37) | 48/49(41) | 1 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/token_airdrop_lure | Au | 10 | 9/10(8) | 9/10(9) | 10/10(10) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/token_fake_usdc_same_symbol | tout | 61 | 61/61(61) | 61/61(61) | 61/61(61) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/token_fake_usdc_same_symbol | Av | 51 | 51/51(51) | 51/51(51) | 51/51(51) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/token_fake_usdc_same_symbol | Au | 10 | 10/10(10) | 10/10(10) | 10/10(10) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/token_honeypot | tout | 52 | 52/52(52) | 52/52(52) | 52/52(52) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/token_honeypot | Av | 45 | 45/45(45) | 45/45(45) | 45/45(45) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/token_honeypot | Au | 7 | 7/7(7) | 7/7(7) | 7/7(7) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/token_sell_tax_99 | tout | 51 | 51/51(51) | 51/51(51) | 51/51(51) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/token_sell_tax_99 | Av | 47 | 47/47(47) | 47/47(47) | 47/47(47) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| poison_sites_tokens/token_sell_tax_99 | Au | 4 | 4/4(4) | 4/4(4) | 4/4(4) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/blur_order | tout | 50 | 50/50(29) | 50/50(29) | 50/50(29) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/blur_order | Av | 8 | 8/8(8) | 8/8(8) | 8/8(8) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/blur_order | Au | 42 | 42/42(21) | 42/42(21) | 42/42(21) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/dai_permit | tout | 59 | 59/59(59) | 59/59(59) | 59/59(59) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/dai_permit | Av | 35 | 35/35(35) | 35/35(35) | 35/35(35) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/dai_permit | Au | 24 | 24/24(24) | 24/24(24) | 24/24(24) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/domain_mismatch_chain_eth_on_avax | tout | 18 | 18/18(18) | 18/18(18) | 18/18(18) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/domain_mismatch_chain_eth_on_avax | Av | 18 | 18/18(18) | 18/18(18) | 18/18(18) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/domain_mismatch_fuji_site_mainnet_permit | tout | 19 | 19/19(19) | 19/19(19) | 19/19(19) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/domain_mismatch_fuji_site_mainnet_permit | Av | 19 | 19/19(19) | 19/19(19) | 19/19(19) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/domain_mismatch_seaport_wrong_chain | tout | 5 | 5/5(5) | 5/5(5) | 5/5(5) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/domain_mismatch_seaport_wrong_chain | Av | 5 | 5/5(5) | 5/5(5) | 5/5(5) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/domain_mismatch_vc_permit2_on_mint_site | tout | 13 | 13/13(11) | 13/13(11) | 13/13(13) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/domain_mismatch_vc_permit2_on_mint_site | Av | 10 | 10/10(9) | 10/10(9) | 10/10(10) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/domain_mismatch_vc_permit2_on_mint_site | Au | 3 | 3/3(2) | 3/3(2) | 3/3(3) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/domain_mismatch_vc_token_on_dapp_site | tout | 18 | 18/18(15) | 18/18(15) | 18/18(18) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/domain_mismatch_vc_token_on_dapp_site | Av | 16 | 16/16(13) | 16/16(13) | 16/16(16) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/domain_mismatch_vc_token_on_dapp_site | Au | 2 | 2/2(2) | 2/2(2) | 2/2(2) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/eth_sign_raw_hash | tout | 51 | 51/51(51) | 51/51(51) | 51/51(51) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/eth_sign_raw_hash | Av | 37 | 37/37(37) | 37/37(37) | 37/37(37) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/eth_sign_raw_hash | Au | 14 | 14/14(14) | 14/14(14) | 14/14(14) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/permit2_batch_transfer_from | tout | 60 | 60/60(60) | 60/60(60) | 60/60(60) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/permit2_batch_transfer_from | Av | 44 | 44/44(44) | 44/44(44) | 44/44(44) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/permit2_batch_transfer_from | Au | 16 | 16/16(16) | 16/16(16) | 16/16(16) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/permit2_permit_batch | tout | 78 | 78/78(76) | 78/78(76) | 78/78(78) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/permit2_permit_batch | Av | 67 | 67/67(66) | 67/67(66) | 67/67(67) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/permit2_permit_batch | Au | 11 | 11/11(10) | 11/11(10) | 11/11(11) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/permit2_permit_single | tout | 75 | 75/75(62) | 75/75(62) | 75/75(74) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/permit2_permit_single | Av | 62 | 62/62(52) | 62/62(52) | 62/62(61) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/permit2_permit_single | Au | 13 | 13/13(10) | 13/13(10) | 13/13(13) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/permit2_transfer_from | tout | 66 | 66/66(55) | 66/66(55) | 66/66(66) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/permit2_transfer_from | Av | 53 | 53/53(44) | 53/53(44) | 53/53(53) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/permit2_transfer_from | Au | 13 | 13/13(11) | 13/13(11) | 13/13(13) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/permit2_witness | tout | 66 | 66/66(61) | 66/66(61) | 66/66(65) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/permit2_witness | Av | 57 | 57/57(52) | 57/57(52) | 57/57(56) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/permit2_witness | Au | 9 | 9/9(9) | 9/9(9) | 9/9(9) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/permit2_witness_batch | tout | 27 | 27/27(27) | 27/27(27) | 27/27(27) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/permit2_witness_batch | Av | 23 | 23/23(23) | 23/23(23) | 23/23(23) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/permit2_witness_batch | Au | 4 | 4/4(4) | 4/4(4) | 4/4(4) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/permit_eip2612 | tout | 169 | 169/169(140) | 169/169(140) | 169/169(163) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/permit_eip2612 | Av | 130 | 130/130(106) | 130/130(106) | 130/130(125) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/permit_eip2612 | Au | 39 | 39/39(34) | 39/39(34) | 39/39(38) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/personal_sign_tx_hex | tout | 58 | 57/58(50) | 57/58(50) | 57/58(50) | 1 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/personal_sign_tx_hex | Av | 42 | 42/42(36) | 42/42(36) | 42/42(36) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/personal_sign_tx_hex | Au | 16 | 15/16(14) | 15/16(14) | 15/16(14) | 1 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/seaport_zero_price | tout | 81 | 81/81(81) | 81/81(81) | 81/81(81) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/seaport_zero_price | Av | 64 | 64/64(64) | 64/64(64) | 64/64(64) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |
| sig/seaport_zero_price | Au | 17 | 17/17(17) | 17/17(17) | 17/17(17) | 0 | 0 | 0 | 0/0/0 | 0 | 0 (0) |

## Ratés (malveillants en ok, catalogue) : 8

- poison_sites_tokens/clipboard_swap : 4
- poison_sites_tokens/addressbook_poisoned : 2
- poison_sites_tokens/token_airdrop_lure : 1
- sig/personal_sign_tx_hex : 1

## Fausses alertes critical (bénins, catalogue) : 21

- benign_everyday/elderly_pays_relative [asked_by_someone_outgoing] : 10
- benign_everyday/subscription_capped_approve [external_spender,unexpected_approval] : 10
- benign_defi/router_multicall [unknown_selector,opaque] : 1

## Inconnus : 0


