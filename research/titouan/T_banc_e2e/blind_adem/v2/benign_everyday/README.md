# benign_everyday : transferts, NFT et connexions bénins difficiles (SYNTHÉTIQUE)
Génération : `node gen.mjs` (graine fixe 0x5eC0E, sortie identique à chaque exécution) ; contrôle : `node validate.mjs`.
1 420 cas, tous `label: benin`, 1 067 `hard` (75 %), 1 094 `ok` et 326 `warn`. Split : 975 DEV / 445 TEST (sha256(id) mod 10 < 3 → TEST). Chaînes : 43114 (63 %), 1 (22 %), 43113 (12 %), quelques L2 comme chaîne de départ d'un switch.
Sous-familles : p2p_contact (58), p2p_contact_prefix_twin (102, 2 ou 3 caractères de préfixe communs, aucun suffixe commun), exchange_deposit_known (110), self_transfer_large (110), elderly_pays_artisan/relative (63/47), first_payment_in_person (90, toujours warn).
NFT : nft_listing_seaport (110, Seaport 1.6 OrderComponents à prix proche du plancher), nft_setapprovalforall_marketplace (90), nft_purchase_seaport (90, fulfillBasicOrder et sélecteur 0x00000000).
Connexions : siwe_login_domain_match (110), personal_sign_readable (43), snapshot_vote_typed (57), switch_chain_avalanche (70), add_chain_avalanche_l1 (70, C-Chain, Fuji, DFK, Beam, Dexalot).
Paiements : donation (70), subscription_recurring_transfer (47), subscription_capped_approve (13), payroll_single/disperse/sendcalls_batch (17/19/34).
Le `warn` n'apparaît que sur des cas `hard`, avec une justification dans `severity_justification`. `imitates` nomme le motif d'attaque que le cas imite.
Approximations (439 cas, champ `approximation`) : adresses Seaport 1.6, conduit et frais OpenSea, Blur, LooksRare et Disperse citées de mémoire ; déploiement Avalanche supposé à la même adresse ; collections Avalanche, Joepegs, contacts et exchanges dérivés de la graine ; RPC des L1 et version Snapshot (0.1.4) de mémoire. Le sélecteur 0x00000000 est vérifié dans validate.mjs.
Doublons : la clé de requête exacte est unique, sauf pour wallet_switch/addEthereumChain (très peu de paramètres possibles), où la clé ajoute l'origine et le compte.
