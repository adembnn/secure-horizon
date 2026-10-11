# jury_fuzz_encoding — contournements de Hold up par l'encodage et les lots

Agent : **fuzz_encoding**. Surface : encodage & lots. Tout synthetique (Avalanche 43114 / Fuji 43113). Outil unique : check.mjs (boite noire).

**Teste : 3669 attaques. Contournements : 2141.** Un malveillant contourne si level_final != critical ; un benin contourne si level_final == critical.

Verdict transversal : **dans un lot/encodage indirect, un droit ou un transfert etranger ne depasse jamais `warn`** ; pire, un `approve` au montant **fini mais enorme** (sous ~2^128) ne declenche **aucune** alerte (`ok`), alors que le meme appel en direct est `critical`. Le chemin de decodage recursif applique une regle strictement plus faible que le chemin direct.

## encodage_approve_fini_dans_lot_cecite_totale — 486/486 (100%)  [ok=236, warn=250]  ex: `fe-s2_approveFinite_mc3_agg3-0001`
- Attaque : approve(attaquant, montant GRAND mais FINI) ~10^7..10^30 enfoui dans un lot Multicall3/forwarder/padding, intention declaree « me connecter / echanger / recevoir ».
- Verdict obtenu : level_final = ok (aucune raison) : cecite totale, aucune alerte.
- Raison probable (vue de l'exterieur) : La regle de lot ne se declenche que sur un droit ILLIMITE (MAXU) ; un montant fini enorme (ex. 1 000 000 USDC) passe sous le radar, alors que le meme approve envoye en direct est critical.

## encodage_lot_rabaisse_critical_en_warn — 486/486 (100%)  [ok=133, warn=353]  ex: `fe-s2_approveNearMax_mc3_agg3-0001`
- Attaque : approve quasi-illimite (MAXU-1, 2^255, 2^200, uint96max) ou transfer de drain, enfoui dans un lot.
- Verdict obtenu : level_final = warn au lieu de critical.
- Raison probable (vue de l'exterieur) : Dans un lot, le droit etranger plafonne a warn (batch_foreign_unlimited_approval) ; le chemin direct, lui, dit critical. Le decodage recursif perd un cran de severite.

## multicall3_imbrique_1_4_niveaux — 619/720 (86%)  [ok=19, warn=600]  ex: `fe-mc3_aggregate_d1-0001`
- Attaque : Multicall3 aggregate/aggregate3/aggregate3Value/tryAggregate imbrique 1 a 4 niveaux, approve/transferFrom/setApprovalForAll au milieu.
- Verdict obtenu : level_final = warn (unknown_selector + opaque + batch_foreign_unlimited_approval), jamais critical.
- Raison probable (vue de l'exterieur) : Le moteur decode partiellement, voit un droit etranger mais ne monte pas a critical dans un contexte de lot ; l imbrication ajoute des selecteurs « hors registre ».

## calldata_padding_sous_appel_de_lot — 230/270 (85%)  [ok=28, warn=202]  ex: `fe-pad_mc3_trailing_junk-0001`
- Attaque : Sous-appel d un lot Multicall3 avec octets en trop (junk/zeros/mot ff) apres les arguments valides.
- Verdict obtenu : level_final = warn ou ok.
- Raison probable (vue de l'exterieur) : Le padding casse le decodage strict du sous-appel (opaque), ce qui empeche la montee a critical ; combine a un approve fini, cecite totale.

## contrat_forwarder_multi_hop — 81/120 (68%)  [ok=17, warn=64]  ex: `fe-forwarder_h3-0001`
- Attaque : execute(address,uint256,bytes) / forward / relay, 1 a 3 sauts, inner = approve/transfer.
- Verdict obtenu : level_final = warn ou ok.
- Raison probable (vue de l'exterieur) : Le forwarder masque la cible reelle ; au-dela d un saut le moteur perd le fil et ne monte pas a critical (ok si approve fini).

## selecteurs_de_proxy — 108/240 (45%)  [ok=0, warn=108]  ex: `fe-proxy_w1-0013`
- Attaque : upgradeToAndCall / delegate / fallback / execute(address,bytes) d un proxy enveloppant un approve.
- Verdict obtenu : level_final = warn (unknown_selector + embedded_calls heuristique + opaque).
- Raison probable (vue de l'exterieur) : Le moteur detecte « approve » par heuristique sans le decoder strictement, donc reste a warn.

## universal_router_execute_inputs — 61/192 (32%)  [ok=0, warn=61]  ex: `fe-univ_router_plain-0002`
- Attaque : Universal Router execute(commands,inputs) et execute(commands,inputs,deadline), charge dangereuse dans un input.
- Verdict obtenu : level_final = warn (decode_error UR + opaque).
- Raison probable (vue de l'exterieur) : Le decodeur UR echoue sur des inputs forges (lecture hors limites) et retombe en opaque au lieu de critical.

## wallet_sendCalls_2_20_appels — 36/285 (13%)  [ok=0, warn=36]  ex: `fe-sendcalls_n2-0013`
- Attaque : wallet_sendCalls (EIP-5792) de 2 a 20 appels, drain/transferFrom au milieu.
- Verdict obtenu : level_final = warn (l approve enfoui, lui, est bien attrape en critical).
- Raison probable (vue de l'exterieur) : Le drain par transfer vers un tiers n est pas traite comme un transfert sortant non desire au niveau critical dans un lot.

## routeur_multicall_bytes — 34/270 (13%)  [ok=0, warn=34]  ex: `fe-router_multicallbytes-0055`
- Attaque : multicall(bytes[]) / multicall(bytes32,bytes[]) d un routeur connu, sous-appel dangereux parmi des leurres.
- Verdict obtenu : level_final = warn (surtout transfer/transferFrom de drain).
- Raison probable (vue de l'exterieur) : La forme sans deadline (bytes[]) et la forme bytes32 sont moins bien decodees que multicall(uint256,bytes[]) ; le drain par transfer n est pas traite comme un approve.

## Surfaces ou la barriere TIENT (0 contournement, a son credit)
- `calldata_padding_appel_direct` : 0/270 — appel direct padde, delegatecall declare (Safe/MultiSend op=1), value+calldata vide, et les lots legitimes bornes (aucun faux positif) sont correctement classes.
- `delegatecall_declare` : 0/120 — appel direct padde, delegatecall declare (Safe/MultiSend op=1), value+calldata vide, et les lots legitimes bornes (aucun faux positif) sont correctement classes.
- `value_non_nulle_calldata_vide` : 0/90 — appel direct padde, delegatecall declare (Safe/MultiSend op=1), value+calldata vide, et les lots legitimes bornes (aucun faux positif) sont correctement classes.
- `faux_positif_lot_legitime` : 0/120 — appel direct padde, delegatecall declare (Safe/MultiSend op=1), value+calldata vide, et les lots legitimes bornes (aucun faux positif) sont correctement classes.
