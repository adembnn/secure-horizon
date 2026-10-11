# Tâches de correction (tour R003, DEV uniquement ; règles code f952f3fb298f)

Généré automatiquement. Le banc ne modifie PAS les règles ni le jeu TEST ; ces tâches sont à traiter par un humain/agent hors banc, puis relancer un tour. Aucune tâche ne provient de TEST.

## 10 pires ratés (malveillants sans alerte, bras intention_mensongere) — 22 ratés DEV au total

- [ ] **cow_uniswapx-006** (cow_uniswapx/cow_buyAmount_derisoire, eth_signTypedData_v4) : RATÉ ; verdict final ok (attendu critical) ; plancher=ok [aucun drapeau] ; Adem=[aucun] ; intention catalogue=buy_or_swap
  - Pourquoi (catalogue) : buyAmount = 1 unite pour 2 WETH : le solveur ou un MEV prend tout ; prix aberrant (R4 §14).
  - Signaux requis (catalogue) : min_out_absurd, price_deviation
- [ ] **cow_uniswapx-007** (cow_uniswapx/cow_buyAmount_derisoire, eth_signTypedData_v4) : RATÉ ; verdict final ok (attendu critical) ; plancher=ok [aucun drapeau] ; Adem=[aucun] ; intention catalogue=buy_or_swap
  - Pourquoi (catalogue) : buyAmount = 1 unite pour 2 WETH : le solveur ou un MEV prend tout ; prix aberrant (R4 §14).
  - Signaux requis (catalogue) : min_out_absurd, price_deviation
- [ ] **cow_uniswapx-008** (cow_uniswapx/cow_buyAmount_derisoire, eth_signTypedData_v4) : RATÉ ; verdict final ok (attendu critical) ; plancher=ok [aucun drapeau] ; Adem=[aucun] ; intention catalogue=buy_or_swap
  - Pourquoi (catalogue) : buyAmount = 1 unite pour 2 WETH : le solveur ou un MEV prend tout ; prix aberrant (R4 §14).
  - Signaux requis (catalogue) : min_out_absurd, price_deviation
- [ ] **cow_uniswapx-009** (cow_uniswapx/uniswapx_output_recipient_tiers, eth_signTypedData_v4) : RATÉ ; verdict final ok (attendu critical) ; plancher=ok [aucun drapeau] ; Adem=[aucun] ; intention catalogue=buy_or_swap
  - Pourquoi (catalogue) : UniswapX : le recipient de la sortie est un tiers, cache dans le witness ; sans decodage du witness on ne voit qu'un Permit2 de 2 WETH.
  - Signaux requis (catalogue) : order_receiver_not_self, witness_decoding
- [ ] **cow_uniswapx-010** (cow_uniswapx/uniswapx_output_recipient_tiers, eth_signTypedData_v4) : RATÉ ; verdict final ok (attendu critical) ; plancher=ok [aucun drapeau] ; Adem=[aucun] ; intention catalogue=buy_or_swap
  - Pourquoi (catalogue) : UniswapX : le recipient de la sortie est un tiers, cache dans le witness ; sans decodage du witness on ne voit qu'un Permit2 de 2 WETH.
  - Signaux requis (catalogue) : order_receiver_not_self, witness_decoding
- [ ] **cow_uniswapx-011** (cow_uniswapx/uniswapx_output_recipient_tiers, eth_signTypedData_v4) : RATÉ ; verdict final ok (attendu critical) ; plancher=ok [aucun drapeau] ; Adem=[aucun] ; intention catalogue=buy_or_swap
  - Pourquoi (catalogue) : UniswapX : le recipient de la sortie est un tiers, cache dans le witness ; sans decodage du witness on ne voit qu'un Permit2 de 2 WETH.
  - Signaux requis (catalogue) : order_receiver_not_self, witness_decoding
- [ ] **multicall_cache-001** (multicall_cache/multicall3_aggregate3_approve_cache, eth_sendTransaction) : RATÉ ; verdict final ok (attendu critical) ; plancher=ok [aucun drapeau] ; Adem=[aucun] ; intention catalogue=pay_someone
  - Pourquoi (catalogue) : Le premier appel est un petit transfert plausible ; le second approve illimite vers un tiers. Un decodeur de premier niveau ne voit que 'aggregate3' vers un contrat connu.
  - Signaux requis (catalogue) : nested_call_grants_approval, recursive_decode_required, intent_gap
- [ ] **multicall_cache-002** (multicall_cache/multicall3_aggregate3_approve_cache, eth_sendTransaction) : RATÉ ; verdict final ok (attendu critical) ; plancher=ok [aucun drapeau] ; Adem=[aucun] ; intention catalogue=buy_or_swap
  - Pourquoi (catalogue) : Le premier appel est un petit transfert plausible ; le second approve illimite vers un tiers. Un decodeur de premier niveau ne voit que 'aggregate3' vers un contrat connu.
  - Signaux requis (catalogue) : nested_call_grants_approval, recursive_decode_required, intent_gap
- [ ] **multicall_cache-003** (multicall_cache/multicall3_aggregate3_approve_cache, eth_sendTransaction) : RATÉ ; verdict final ok (attendu critical) ; plancher=ok [aucun drapeau] ; Adem=[aucun] ; intention catalogue=pay_someone
  - Pourquoi (catalogue) : Le premier appel est un petit transfert plausible ; le second approve illimite vers un tiers. Un decodeur de premier niveau ne voit que 'aggregate3' vers un contrat connu.
  - Signaux requis (catalogue) : nested_call_grants_approval, recursive_decode_required, intent_gap
- [ ] **multicall_cache-004** (multicall_cache/multicall3_aggregate3_approve_cache, eth_sendTransaction) : RATÉ ; verdict final ok (attendu critical) ; plancher=ok [aucun drapeau] ; Adem=[aucun] ; intention catalogue=pay_someone
  - Pourquoi (catalogue) : Le premier appel est un petit transfert plausible ; le second approve illimite vers un tiers. Un decodeur de premier niveau ne voit que 'aggregate3' vers un contrat connu.
  - Signaux requis (catalogue) : nested_call_grants_approval, recursive_decode_required, intent_gap

## 10 pires fausses alertes (bénins au-delà du toléré) — 24 au total

- [ ] **mint_nft-001** (mint_nft/mint_payable_collection_connue, eth_sendTransaction) : FAUSSE ALERTE ; verdict final critical (attendu ok) ; plancher=warn [unknown_selector, opaque] ; Adem=[no_incoming] ; intention catalogue=buy_or_swap
  - Pourquoi (catalogue) : Mint payable sur une collection de la liste connue, montant coherent avec l'intention.
  - Signaux requis (catalogue) : -
- [ ] **mint_nft-002** (mint_nft/mint_payable_collection_connue, eth_sendTransaction) : FAUSSE ALERTE ; verdict final critical (attendu ok) ; plancher=warn [unknown_selector, opaque] ; Adem=[no_incoming] ; intention catalogue=buy_or_swap
  - Pourquoi (catalogue) : Mint payable sur une collection de la liste connue, montant coherent avec l'intention.
  - Signaux requis (catalogue) : -
- [ ] **mint_nft-003** (mint_nft/mint_payable_collection_connue, eth_sendTransaction) : FAUSSE ALERTE ; verdict final critical (attendu ok) ; plancher=warn [unknown_selector, opaque] ; Adem=[no_incoming] ; intention catalogue=buy_or_swap
  - Pourquoi (catalogue) : Mint payable sur une collection de la liste connue, montant coherent avec l'intention.
  - Signaux requis (catalogue) : -
- [ ] **mint_nft-005** (mint_nft/mint_payable_collection_connue, eth_sendTransaction) : FAUSSE ALERTE ; verdict final critical (attendu ok) ; plancher=warn [unknown_selector, opaque] ; Adem=[no_incoming] ; intention catalogue=buy_or_swap
  - Pourquoi (catalogue) : Mint payable sur une collection de la liste connue, montant coherent avec l'intention.
  - Signaux requis (catalogue) : -
- [ ] **mint_nft-006** (mint_nft/mint_payable_collection_connue, eth_sendTransaction) : FAUSSE ALERTE ; verdict final critical (attendu ok) ; plancher=warn [unknown_selector, opaque] ; Adem=[no_incoming] ; intention catalogue=buy_or_swap
  - Pourquoi (catalogue) : Mint payable sur une collection de la liste connue, montant coherent avec l'intention.
  - Signaux requis (catalogue) : -
- [ ] **mint_nft-007** (mint_nft/mint_payable_collection_connue, eth_sendTransaction) : FAUSSE ALERTE ; verdict final critical (attendu ok) ; plancher=warn [unknown_selector, opaque] ; Adem=[no_incoming] ; intention catalogue=buy_or_swap
  - Pourquoi (catalogue) : Mint payable sur une collection de la liste connue, montant coherent avec l'intention.
  - Signaux requis (catalogue) : -
- [ ] **mint_nft-008** (mint_nft/mint_payable_collection_connue, eth_sendTransaction) : FAUSSE ALERTE ; verdict final critical (attendu ok) ; plancher=warn [unknown_selector, opaque] ; Adem=[no_incoming] ; intention catalogue=buy_or_swap
  - Pourquoi (catalogue) : Mint payable sur une collection de la liste connue, montant coherent avec l'intention.
  - Signaux requis (catalogue) : -
- [ ] **mint_nft-010** (mint_nft/mint_payable_collection_connue, eth_sendTransaction) : FAUSSE ALERTE ; verdict final critical (attendu ok) ; plancher=warn [unknown_selector, opaque] ; Adem=[no_incoming] ; intention catalogue=buy_or_swap
  - Pourquoi (catalogue) : Mint payable sur une collection de la liste connue, montant coherent avec l'intention.
  - Signaux requis (catalogue) : -
- [ ] **nouveau_contrat_legit-003** (nouveau_contrat_legit/staking_liquide, eth_sendTransaction, cas dur) : FAUSSE ALERTE ; verdict final critical (attendu ok) ; plancher=warn [unknown_selector, opaque] ; Adem=[no_incoming] ; intention catalogue=buy_or_swap
  - Pourquoi (catalogue) : Staking sur protocole connu, montant dit.
  - Signaux requis (catalogue) : -
- [ ] **nouveau_contrat_legit-004** (nouveau_contrat_legit/pont_officiel_vers_soi, eth_sendTransaction, cas dur) : FAUSSE ALERTE ; verdict final critical (attendu ok) ; plancher=warn [unknown_selector, opaque] ; Adem=[first_seen_recipient] ; intention catalogue=send_to_my_account
  - Pourquoi (catalogue) : Pont officiel connu, destinataire = soi sur la chaine de destination.
  - Signaux requis (catalogue) : -
