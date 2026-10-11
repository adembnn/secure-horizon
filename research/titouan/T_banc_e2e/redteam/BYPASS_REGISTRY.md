# Registre des contournements (append-only)

| agent | technique | n_pass/n_test | exemple id |
|---|---|---|---|
| fuzz_address | M1 « Payer Paul » sans adresse choisie : n'importe quel destinataire (clipper aléatoire, ENS, historique) ; le label n'est pas résolu dans le carnet | 1024/1721 | fa-grid-7-00001 |
| fuzz_address | M2 sosie sous le seuil 3+4 (ex. 6-8 premiers + 3 derniers, 2 premiers + 8 derniers) avec poussière/faux token, intention pay_someone | 860/2526 | fa-grid-7-01017 |
| fuzz_address | M3 carnet d'adresses empoisonné, sans vraie adresse dans l'historique | 283/288 | fa-random-11-00451 |
| fuzz_address | M4 destinataire = contrat (routeur connu en liste blanche, ou contrat du token lui-même) | 431/605 | fa-r2-23-00020 |
| fuzz_address | M5 type pay_someone choisi pour son propre exchange/Ledger : la règle « jamais vu » saute | 216/344 | fa-random-11-00329 |
| fuzz_address | F1 (fausse alerte) payer la vraie adresse après de la poussière d'un sosie : critical lookalike_address | 258/258 | fa-benign-5-00010 |
| fuzz_address | F2 (fausse alerte, contestable) nouvelle adresse de dépôt d'exchange sous send_to_my_account | 177/177 | fa-r2benign-29-00001 |
| fuzz_sig | sig:eip2612 | 377/377 | fuzzsig-00003 |
| fuzz_sig | sig:blur | 148/148 | fuzzsig-00016 |
| fuzz_sig | sig:dai | 174/174 | fuzzsig-00019 |
| fuzz_sig | sig:psTxHex | 193/193 | fuzzsig-00056 |
| fuzz_sig | sig:psText | 135/192 | fuzzsig-00005 |
| fuzz_sig | sig:p2witness | 71/333 | fuzzsig-00022 |
| fuzz_sig | sig:p2single | 72/339 | fuzzsig-00009 |
| fuzz_sig | sig:p2tf | 31/153 | fuzzsig-00033 |
| fuzz_sig | sig:p2batch | 33/189 | fuzzsig-00097 |
| fuzz_sig | sig:p2btf | 26/160 | fuzzsig-00020 |
| fuzz_intent | T1 kind absent/hors enum (casse, espace, tableau) -> transfert vers escroc jamais vu | 7836/7836 | fuzz_intent-p1-25200 |
| fuzz_intent | T2 askedBy=support ignoré si kind != asked_by_someone | 10168/10168 | fuzz_intent-p1-01260 |
| fuzz_intent | T3 pay_someone vers adresse jamais vue, sans counterpartyAddress (label non vérifié) | 2522/2522 | fuzz_intent-p1-00000 |
| fuzz_intent | T4 pay_someone avec counterpartyAddress = adresse de l escroc | 120/120 | fuzz_intent-p3-00120 |
| fuzz_intent | T5 send_to_my_account vers escroc déjà au carnet/historique | 2598/2598 | fuzz_intent-p1-05100 |
| fuzz_intent | T6 entrée/dust de l escroc dans l historique = adresse connue | 1008/1008 | fuzz_intent-p1-05220 |
| fuzz_intent | T7 part du solde > 50 % (jusqu a 1000 %) plafonnée à warn, seuil exact > 50.00 | 6472/6472 | fuzz_intent-p1-00048 |
| fuzz_intent | T8 share_of_balance_pct absent -> 100 % du solde en ok | 96/96 | fuzz_intent-p2-00504 |
| fuzz_intent | T9 fractionnement (N tx ou wallet_sendCalls), chaque part <= 50 % | 758/758 | fuzz_intent-p2-00936 |
| fuzz_intent | T10 amount non numérique ("$1", "mille", "") ou sous-déclaré < 1 % | 355/451 | fuzz_intent-p4-00040 |
| fuzz_intent | T11 send_to_my_account : montant et token déclarés jamais comparés | 451/451 | fuzz_intent-p2-00756 |
| fuzz_intent | T12 pay_someone : token déclaré != token envoyé non détecté | 80/80 | fuzz_intent-p3-02290 |
| fuzz_intent | T13 message d escroc collé (réutilisé) sans aucun effet sur le verdict | 2576/2576 | fuzz_intent-p1-00013 |
| fuzz_intent | T14 chaîne 43114/43113 ou context.chainId incohérent sans effet | 72/72 | fuzz_intent-p3-02640 |
| fuzz_encoding | encodage_approve_fini_dans_lot_cecite_totale | 486/486 | fe-s2_approveFinite_mc3_agg3-0001 |
| fuzz_encoding | encodage_lot_rabaisse_critical_en_warn | 486/486 | fe-s2_approveNearMax_mc3_agg3-0001 |
| fuzz_encoding | multicall3_imbrique_1_4_niveaux | 619/720 | fe-mc3_aggregate_d1-0001 |
| fuzz_encoding | calldata_padding_sous_appel_de_lot | 230/270 | fe-pad_mc3_trailing_junk-0001 |
| fuzz_encoding | contrat_forwarder_multi_hop | 81/120 | fe-forwarder_h3-0001 |
| fuzz_encoding | selecteurs_de_proxy | 108/240 | fe-proxy_w1-0013 |
| fuzz_encoding | universal_router_execute_inputs | 61/192 | fe-univ_router_plain-0002 |
| fuzz_encoding | wallet_sendCalls_2_20_appels | 36/285 | fe-sendcalls_n2-0013 |
| fuzz_encoding | routeur_multicall_bytes | 34/270 | fe-router_multicallbytes-0055 |
| fuzz_fp | FP : paiement au vrai contact du carnet quand un sosie est dans l'historique → lookalike_address | 360/360 | FZFP-027906 |
| fuzz_fp | FP : staking liquide payable au token (sAVAX submit, Lido submit) → no_incoming | 720/800 | FZFP-016984 |
| fuzz_fp | FP : approve plafonné marchand/abonnement, checkout approve+pay sendCalls (pay_someone) → unexpected_approval | 520/680 | FZFP-013744 |
| fuzz_fp | FP : approve LP token au routeur pour retrait de liquidité → unexpected_approval | 174/240 | FZFP-019984 |
| fuzz_fp | FP : mint NFT public payant (collection récente) → no_incoming | 266/360 | FZFP-023864 |
| fuzz_fp | FP : SIWE origine/domaine légitimement différents (www, rebrand, sous-domaine) → siwe_domain_mismatch | 180/200 | FZFP-024984 |
| fuzz_fp | FP : EIP-7702 vers MetaMask DeleGator officiel ou révocation vers 0x0 → delegation_7702 | 195/240 | FZFP-032312 |
| fuzz_fp | FP : wrap natif (deposit / envoi simple au WAVAX/WETH) → no_incoming | 178/400 | FZFP-010185 |
| fuzz_fp | FP : DAI permit legacy allowed=true vers routeur connu → unlimited_allowance | 90/240 | FZFP-013217 |
| fuzz_fp | FP : addEthereumChain L1 Avalanche (Dexalot, Beam, DFK) → chain_add_native_symbol_spoof | 45/200 | FZFP-032136 |
| fuzz_fp | FP : intention adjacente cochée de bonne foi (connect au lieu de swap/approve) → unexpected_approval_connect | 1353/1960 | voir jsonl |
| fuzz_fp | Fatigue : agrégateurs, lending, ponts, votes → warn unknown_selector/opaque/unknown_typed_data | 18606/32545 warn | - |
| fuzz_control | ownership/nominateNewOwner (Synthetix) → warn (unknown_selector) | 1807/1807 | FC-nominateNewOwner-10864 |
| fuzz_control | ownership/_setPendingAdmin (Compound) → warn | 1803/1803 | FC-setPendingAdmin-12095 |
| fuzz_control | ownership/setPendingOwner → warn | 1780/1780 | FC-setPendingOwner-13322 |
| fuzz_control | ownership/proposeOwner → warn | 1756/1756 | FC-proposeOwner-14526 |
| fuzz_control | ownership/pushOwner (two-step) → warn | 1753/1753 | FC-pushOwner-15706 |
| fuzz_control | ownership/pushManagement (Yearn) → warn | 1820/1820 | FC-pushManagement-16883 |
| fuzz_control | ownership/transferOwnership(address,uint256) delayed → warn | 1804/1804 | FC-transferOwnershipDelayed-18129 |
| fuzz_control | ownership/transferOwnership(address,address) overload → warn | 1781/1781 | FC-transferOwnership2-19355 |
| fuzz_control | ownership/setAdmin → warn | 1812/1812 | FC-setAdmin-20560 |
| fuzz_control | ownership/addOwner(address) 1-arg → warn | 1792/1792 | FC-addOwner1-21796 |
| fuzz_control | ownership/setImplementation (non-UUPS proxy) → warn | 1765/1765 | FC-setImplementation-23012 |
| fuzz_control | ownership/setGovernance → warn | 1771/1771 | FC-setGovernance-24201 |
| fuzz_control | ownership/transferManagement → warn | 1768/1768 | FC-transferManagement-25401 |
| fuzz_control | ownership/beginDefaultAdminTransfer (AccessControlDefaultAdminRules) → warn | 1782/1782 | FC-setPendingDefaultAdmin-26594 |
| fuzz_control | method/eth_signTransaction → unknown (unsupported) | 312/312 | FC-signTx-27797 |
| fuzz_control | method/wallet_requestPermissions → unknown (unsupported) | 312/312 | FC-reqPerm-27796 |
| fuzz_control | chain/switchEthereumChain_to_signature → ok/warn | 312/312 | FC-switch-27795 |
| fuzz_control | chain/addEthereumChain malicious RPC (fake Avalanche) → warn | 271/312 | FC-addChain-27794 |
| fuzz_control | FP benin/self_safe_admin changeThreshold+enableModule+setGuard → critical (own Safe) | hand-verified | FC-benignSafe-28322 |
