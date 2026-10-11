# Journal d'ouverture du jeu aveugle decalage

Chaque ouverture ajoute une section. Ce fichier n'est jamais réécrit.

## Ouverture 2026-10-11T06:57:43.486Z (MODE ESSAI, faux jeu)

- Verrou : posé avant toute lecture du contenu (blind_decalage\run\essai\sorties\plein\OUVERT.lock)
- Cas : blind_decalage\run\essai\CASES.jsonl, sha256 a16787be5988e211ab69f6b1ba25b72dbe7499e13e09b7314c767878f8186333 = publié
- Git HEAD : d6b5973e9c7f5a670a0de579a53187e152f9fdde, fichiers modifiés non commités : 86
- sha256 du moteur (moteur + build standalone) : 8344b31fde1f738eedc905cfb18b5704c56374c933501b66bcaa659605b9a715
  - groupe moteur (engine/src, engine/vendor, run/policy.mjs, run/arms.mjs, pipeline/evaluate_plus.mjs, pipeline/intent_clef.mjs, known_protocols.json, normalize_v2.mjs, detectors_adem/*, extension/*.js) : 49107978f0467ba977a4aabb918f405bcca9ac2c9d70a04d8ceddafb101521a9
  - groupe standalone (extension_standalone/extension/**, dist/hold-up-standalone*.zip) : 59d9c3cc9ef34313dfa7fb13a5fa51ce608bdc15cab4884caf7a6fc2f30ff231
- sha256 du lanceur (chaine/*, mesure.mjs, ouvrir_une_fois.mjs) : 901cb7c1a93a03a11cdb6c5d264d6466c9434152d0cba5cd26311c6f5310acf9

<details><summary>Fichiers hashés</summary>

```
  moteur:
    detectors_adem/batch_rights.mjs a2ba9763f122f867b9ef06959985a4f7a0d11db70d06d14716087a5e97442040
    detectors_adem/clef_client.mjs e009421506e2f73d6366cfd3a1aa277d245be81197b82917dedc9578b256c24d
    detectors_adem/control_shape.mjs 4b163b9431e286f89a37c30f2f4f478eba820237c0df12051fe9f1a6b3a0f716
    detectors_adem/dust_guard.mjs 1a84b1708251a76d70b13432e7e9f7d9a7e3a346922b5050464c7d05756dbaff
    detectors_adem/fork_sim.mjs c6ffe770535bcc3e320cc7b7f3b3ec67f6b5e82875bbffe1ca0ffd24bdb082f8
    detectors_adem/forwarded_value.mjs 6a428a00492b2607e54308b0ed564db16160459ca439e5a65ab10b66f2001a8f
    detectors_adem/index.mjs 2458751762dddc163b29b895c74780808acb295713ec26d56420cb5be88296fd
    detectors_adem/indirect_pull.mjs 6ce11530732c061d1e3efbaa458bab08dfb584224770b2ade5bb60b73073563f
    detectors_adem/intent_guard.mjs 6bc5c5cbc46371f8b5ed827aabe06470b7c2e1fbd3fc2c7e2dbca087380bedd1
    detectors_adem/lookalike_known.mjs 19a36a16cb51fb628b9d4e1fe511e4c5dcd82d613b599446404377942e87608d
    detectors_adem/malformed_calldata.mjs af64c3f73cdec503cf6251893ad29524583bfd30ecfb6648731c37ac681a2f77
    detectors_adem/nft_orders.mjs 37336e37c49707e5b4a1bf46e41e4375dd708f6c1f770773da5577b84d06d5cb
    detectors_adem/official_tokens.mjs 6f421b2974f527e43e786de238da0d69b7daa281da0cae71ae3db51bad42cf0b
    detectors_adem/pasted_message.mjs 8d8b3c1e94f61d978db1b41a870c60a8eeec3db849de1634ee0c56497fa0e80e
    detectors_adem/sig_rights.mjs f2c06855eb42c50061ac6da87fc44b46951386b28aa5b13c31556a27215d4a9e
    detectors_adem/sim_events.mjs 01968ef436f576ea0aa343d4c109fdebbb2a85841e87121820bdf2a004472085
    detectors_adem/spend_rights.mjs 167cee005a44645f65f8588f333b2bfe7fdf6f4a9512158e82af5d0dd9b3a040
    detectors_adem/token_guard.mjs babc2afe40860b6c6cdded1e2119f66459820fb57076c96bc4aae3c6260bdaf8
    detectors_adem/util.mjs 67c4e993854f34cdca36f837e0e6c959f953e523be0520c7072a001bf36e3917
    detectors_adem/wallet_methods.mjs 1cfad8a1e88f3c8421661fad8e5c704f3d3b478d7e0258b3febc1949bd610e5b
    engine/src/abi.mjs cb215b90b180391f160fb256f50ae4021100e0230274e0ff39672db2d3739647
    engine/src/abi_encode.mjs ee593154d04e1b642b0b4c7f5a652f337fba9bce4434a0bd658d1edbb426dd55
    engine/src/audit_selectors.mjs fe836c36e5b92fd2f5ffdf048ac952fdeabb9d11ef53ba14b4881b81158a140c
    engine/src/calldata.mjs 994b969530cd9fae0afa676a4320b0f9bf939a12bbafe8695742346ed4da266f
    engine/src/effects_abi.mjs 2839805b5c8c7e7e4a7aa1d3d241d08bbdbd14f05dda6ab9c8d6d20120c63835
    engine/src/eip712.mjs 33748da09cc26f6885f36f5d2167087e52c3fd4a332c5e5ea959fed4cb3ca3d3
    engine/src/engine.mjs 3c2de1406af6b2bef12dcc2017945cd8267127250bb94bd7d2534e3ef140a295
    engine/src/fixes.mjs 4821242c9d42616d1d65b250fdc4e479e8edc929f871d1635b884783d148b7d5
    engine/src/keccak.mjs 5c3b9570cfe39ca8ff76f0a807e39b96c42d5ccc2b8b66e22accc6aa0cc6cf7c
    engine/src/protocols_extra.mjs a1d1efd5532eb9d31ee03b07bcb9a512327b5a2383d4dc5d25ee317c0595f2c2
    engine/src/registry.mjs e93b80f646cda08ac40678cb6bd75d5eb96e690c8312c44251eff83f4bb07ca2
    engine/src/rlp.mjs 1ad75bb91ec195935486805da3900ec4c26a7b459375ef3738c63218dd9ed0d9
    engine/src/rpc.mjs fa1d4b269a47456fdebf1ddeba16bdda4ba0a17191191b07bd604984cbf98f88
    engine/src/rules.mjs 75914eca31de948b391a58ee4a3174d35acb4fe0f5fe5d04362253b745a896b3
    engine/src/rules_extra.mjs 674832525788b3c0e7babba1bac5f72913cf06e01ec286c83fdeef6dfcb89b09
    engine/src/typed.mjs 2fe3bab036d140b3aae56374321fcde7c99ab7664a00714e68656cfaa0b4d172
    engine/src/typehashes.mjs 841b477f84c8ce236d87c47301628c0dda88728a03b2e97b85b247a5899731c0
    engine/src/util.mjs 006143001b9834d389369a43a51c95c7e411ba563014fed83a7c2b579a84610c
    engine/vendor/classifyMessage.ts 51f4366c1e5b096a2600181aba2865b3ad492fcf66fa893d2284b6e481f1aff9
    engine/vendor/compare.ts b8bf8c71bb0bf9f1540fa77c3bf239f2207aa604b62c7fce33fc72592b7a537d
    engine/vendor/index.ts 4f04322bf8ad51813fdf53f26f46324389004bbd0436d9b8b49f30299ac90496
    engine/vendor/parseIntent.ts b2a1fca12d05f7bc31892729e8e297b963a762ea1cd9999c921bed00ba5dfe77
    engine/vendor/providers/cloudflare.ts 481afe7b2e30101a1efb12d382aa6e1a3c90d164442dfa16b5cba691529f4772
    engine/vendor/providers/index.ts 91583ebdcc9b92bdf5a644fcb78f2c413b2d792d7b06f8dcc4d24bb23051a42c
    engine/vendor/providers/jev.ts 7e50a7f04dbc11b4e2b592c9f1989d6733cda1e1bc850c7c63bc8fa7f1de983b
    engine/vendor/providers/keyword.ts 618d28c634c7abfce08c73a51cef3ee3d6445a986d8e6cd3348744ca321d6986
    engine/vendor/server.ts f9465069bfb1b48047f1aca8fe5afd6efb86169b4b24a62ae001e12b3dcede8c
    engine/vendor/types.ts b4317f9301d1910f07f5c9af4925363c5da6e9c4203529e4daba43afa7eb6983
    extension/background.js 4e85f52de026d3286fbb1f132f0334134a01ade99d7367b863698f6d3c3e2dec
    extension/bridge.js df4b2d6f78817d7ffc3d9f7a5b0d2e342a37951d9dec1e08622ecf7f5904d9ef
    extension/classifier_client.js 131390f4556cea734b9ff742e0ab7a4226356d151c6f8be91aed93e941e06e30
    extension/effect_sim.js 2e221e0786a91cca77db33f034fa4537671a34fa0684baddd62b1fcd70e00f12
    extension/gatekeeper.js 807c4a28e0f970f9377427a86ae22ce766d8f00bdaedd5ae3f17073fcfdedfe0
    extension/hold_core.js aa7c50036ab3d0e37ff959d20f23686bc08f23a3a968bea3dc340a4d65f2f04b
    extension/inject.js abf4bbf1b721a4da91535b2c7f41ef8db9aff9e773570b87f764e3b4959d4ced
    extension/intent_text.js df3d6a4954dc686ee36a37203e1c33722626f174cf06e1715dd1b0405e470a53
    extension/journal_chain.js eb078187af202f6f09f8e6da2a2f58bf194b961571eaa4fe4b0920720581bcf9
    extension/keyword_intent.js db39321e5685eb0286c1778615fe26e5241ef2234645fce0c3c669e31c8835ea
    extension/options.js 3b59021f1fa72ee9c5b83ec218699a9d61627a286a19b5b1e80482d561e20a95
    extension/outcome.js 96a6993f4cf751df4ef230cafcc0be0fb881f4997a998d5f507b0ed9e0103ca0
    extension/revoke.js 41fbd413f61525f778310da56df1e4263b606f634b51411717004dca14d23845
    extension/window.js d41eb7b68dabbce6e32754a1606d24dadabc451296985624108431ca91d2b3bd
    extension/written_check.js 0fb6639118508ef84beda928b06c747e78355d08ccc6f0d0ab563140aa412c87
    pipeline/evaluate_plus.mjs abacebbec0db66fe2ffc6612d431f67a9b3ce4eacc27bb2a967756bd4fd0e02f
    pipeline/intent_clef.mjs 3d33914659efcaf8bfa8581f69a8a195f1a3b8c6efda4e9e9b707b9a9f53224b
    pipeline/known_protocols.json 0521b0ef89a7212cb357ddb523b907f0341323adf4cb032ccdfbbc13560de3da
    redteam/normalize_v2.mjs 4bd964c1f9afa9395b246cb094925de012e111219531da801e436a34b3dfc6ef
    run/arms.mjs dfc229b024120ae2cfea77d1a180794ec9755ffee577aa7e55e72f5cf11617a3
    run/policy.mjs b5746d2070f8ba5ef5607e28779a0e58d80e8ba3268c1d43e2879a48689d69f0
  standalone:
    dist/hold-up-standalone-3fab41e8.zip f31bccd73f059100b2bc341db6ce0aeb5db3548c9a0d349842f1ffbeab6a362b
    dist/hold-up-standalone.zip 834baa12bc63a046bdc90f995f1a6975bb19f34c2776a8460cbf62a5f050d4ed
    extension_standalone/extension/BUILD_INFO.json 387a739b5bd55166b5ada010cb1cd7425526be9d9254f4b3df08ee0f49608374
    extension_standalone/extension/background.js 1d490f6baad31fbe2fc8406670650d6d6a4130ac645d6382334b7b076893eee2
    extension_standalone/extension/bridge.js ce6f1ca55ade76fd85b8dd681b5a2ced0e09b8b79a9712849a032079289c5475
    extension_standalone/extension/classifier_client.js dd87c86f2acb5edd9b51062fc8f491bdc4115733624e612760233fb3e1da04c8
    extension_standalone/extension/effect_sim.js 2e221e0786a91cca77db33f034fa4537671a34fa0684baddd62b1fcd70e00f12
    extension_standalone/extension/engine/policy.js 9e28a63fe95e5aadaf66b0695c759875658863aa7ae3b4f2796670f53fd72388
    extension_standalone/extension/engine/sentinelle_core.js d8211f26b013610ac0438e914894bb39dddbcda75a4822b17692d9ff2f538130
    extension_standalone/extension/engine/src/abi.js 7bb2470709dba339830d33d852a4114a8adc54840327f57ccb5eea469d1a66de
    extension_standalone/extension/engine/src/abi_encode.js 5891306e106216c964b3f78cef96fefe0c118f493808925ec1e012b2465b01fe
    extension_standalone/extension/engine/src/calldata.js 04b3e4ad3ccaf1076d8dcf96a6ccd29dd9449ff6bf452e6b05eaa0778aec3719
    extension_standalone/extension/engine/src/effects_abi.js 0e2c1fa8b5715ffcdd8452fdbffe2b198a7db40c311a7982cead8c7869a09223
    extension_standalone/extension/engine/src/eip712.js af92dca89035280ce88b232dd4ccb37b1a3cb3fc85d616dde461d2eb14244c95
    extension_standalone/extension/engine/src/engine.js 5773faa9321635e74faf4c2dc6e330bc253c1d6dd3458625387ff9846fb2fda3
    extension_standalone/extension/engine/src/fixes.js 4821242c9d42616d1d65b250fdc4e479e8edc929f871d1635b884783d148b7d5
    extension_standalone/extension/engine/src/keccak.js 5c3b9570cfe39ca8ff76f0a807e39b96c42d5ccc2b8b66e22accc6aa0cc6cf7c
    extension_standalone/extension/engine/src/protocols_extra.js 49da73dc4949224dccfb86f10ea45fd192440f787e4e310236dd4e247ec9ffb6
    extension_standalone/extension/engine/src/registry.js a600d72c4a2e41621d52af00a0a07024766b4837335495684b18cb1c7169f561
    extension_standalone/extension/engine/src/rlp.js 8cae28ca2a16ccb8450244083f46adcd0941d5347f392ec77f94978f4c8049b6
    extension_standalone/extension/engine/src/rules.js 0d03ed10e9b8935594cb25d85ddb17390b700233508157dc09e7ae440955c485
    extension_standalone/extension/engine/src/rules_extra.js 2c4668029d041124c8f22dfb9e157ee391299adda4f6da06d93de5cff1d414af
    extension_standalone/extension/engine/src/typed.js 628ac2311f8fb992b65aa8ef0229bf72aecd29dbf2b24fec44f4d87f57a16088
    extension_standalone/extension/engine/src/typehashes.js 4759d9f724ab7fa39a694ed9d8ff403af31a402011f2bef93f06b70debe44d06
    extension_standalone/extension/engine/src/util.js 374f3b6ef10d512b1070d404b79c1e567be40aa66a233db20906b714d8be50b4
    extension_standalone/extension/engine/textes.js 7d68f8ad4f2e895112929600b8f826c8ea74dfe1f74c21c88e59b4075ea8637e
    extension_standalone/extension/engine/textes.json 3695c58e91508c9a11aaa922f1b801d3d49923cd66f17c8225194fee813ab022
    extension_standalone/extension/engine/vendor/compare.js 21ee157ec239ac4bf0ae3cf0f40f13ba5048d44bf6834c3ead42fbdefc9d10ac
    extension_standalone/extension/gatekeeper.js 869922f283c2d2b739f1a0c6582b051f61adbe7a761d0f639112d5db020e9ee4
    extension_standalone/extension/hold_core.js aa7c50036ab3d0e37ff959d20f23686bc08f23a3a968bea3dc340a4d65f2f04b
    extension_standalone/extension/inject.js d76b135dfc1c502150a2bc3fae285d64a41239095d1582c896dd7078d7213c0a
    extension_standalone/extension/intent_text.js df3d6a4954dc686ee36a37203e1c33722626f174cf06e1715dd1b0405e470a53
    extension_standalone/extension/journal_chain.js eb078187af202f6f09f8e6da2a2f58bf194b961571eaa4fe4b0920720581bcf9
    extension_standalone/extension/keyword_intent.js db39321e5685eb0286c1778615fe26e5241ef2234645fce0c3c669e31c8835ea
    extension_standalone/extension/manifest.json 4a36db6a1c520fa4f11edc469ac46f0d115140d4b3e9a92338f9ac104d9113ca
    extension_standalone/extension/options.html 2c9bde76a69474d9a7b11a2dafadbfed96421ce6d5d5afa6dda8f3bb488765e3
    extension_standalone/extension/options.js 3b59021f1fa72ee9c5b83ec218699a9d61627a286a19b5b1e80482d561e20a95
    extension_standalone/extension/outcome.js 96a6993f4cf751df4ef230cafcc0be0fb881f4997a998d5f507b0ed9e0103ca0
    extension_standalone/extension/ui/screen.css dd98c23f57fb2450b1d5092009e444844a054d6772d2ec2bd8feb29566be7672
    extension_standalone/extension/ui/screen.js 630ab48bd32e124f2e9d613097ceafe41fe9270556d084a1574f7519ee2b2929
    extension_standalone/extension/ui/sidepanel.css 6c348a22d3836404914993d233791a4e3cf0ffb49fca61f562398d08b4c2b3ac
    extension_standalone/extension/ui/sidepanel.html 087ea8adddf8ae51a3ab4258f9870669fd7bc47b28dbbc9a445bf5365482a626
    extension_standalone/extension/ui/sidepanel.js 5b5a504ded0faa7056e84a50cfe20ee423fc9b557bfb0ba5d5eb8a1f31299d86
    extension_standalone/extension/window.css 767961dd2b6043649cd44fcbe3cc8566b538cab1696bfa545c6d0013463473cc
    extension_standalone/extension/window.html cf3387482d9f4e9e3e272968b1a20dc26c729892727a879b837f3ad2baedda16
    extension_standalone/extension/window.js d41eb7b68dabbce6e32754a1606d24dadabc451296985624108431ca91d2b3bd
    extension_standalone/extension/written_check.js a006e2fb519be231199cbf664127819367114568bcf112628e627edfe1ccf2a6
  lanceur:
    blind_decalage/run/chaine/lib.mjs 6612aeea2329d51c6017e500de5025cf864c4e4feddf80a0103b4ad00476ba1a
    blind_decalage/run/chaine/textool.mjs 9d8fe4aeb6b3917950a6f856ca1b04f90e60b81d9f2890c8448e067a2234f9c5
    blind_decalage/run/mesure.mjs a3ddb75908dcf458ac4e3edfd497cd4f1aa759a425e02053325cc1edc492dc64
    blind_decalage/run/ouvrir_une_fois.mjs 3bde25be1878a46ea4c9679a1013a2b716ee1460e650853fbc7c2e9febf72576
```
</details>


Critères du verdict (publiés avant ouverture) : {"rappel_min":0.8,"fausse_alerte_rouge_max":0.1}

### Fin 2026-10-11T06:57:57.000Z

- Résultat : complet. bras a : CRITÈRES ATTEINTS (rappel 80.0 % >= 80.0 % ; faux rouges 0.0 % <= 10.0 %) ; bras b : CRITÈRES ATTEINTS (rappel 80.0 % >= 80.0 % ; faux rouges 0.0 % <= 10.0 %) ; bras c : CRITÈRES NON ATTEINTS (rappel 60.0 % < 80.0 % ; faux rouges 0.0 % <= 10.0 %).
- Clef : 7 appels réels, 3 depuis le cache, 0 erreurs, quota non atteint
- sha256 de RESULTAT.md : 768e6ded7e08a47df289d4663d0812d123f035f12b2972133967200098c12356
- sha256 de resultat.json : 7621d3ff6ddc395773ebad84cb5a0c05d9ce43be0558f1e41caefbb436a42f9f
- aucun réglage après ouverture; chiffres publiés tels quels.

## Refus 2026-10-11T06:57:57.375Z

Verrou déjà présent : { "ouvert": "2026-10-11T06:57:43.486Z", "pid": 29168, "essai": true, "sha256_cas": "a16787be5988e211ab69f6b1ba25b72dbe7499e13e09b7314c767878f8186333", "sha256_moteur": "8344b31fde1f738eedc905cfb18b5704c56374c933501b66bcaa659605b9a715", "sha256_lanceur": "901cb7c1a93a03a11cdb6c5d264d6466c9434152d0cba5cd26311c6f5310acf9", "git_head": "d6b5973e9c7f5a670a0de579a53187e152f9fdde" } . Rien n'a été lu ni mesuré.

## Reprise refusée 2026-10-11T06:57:58.298Z

Raison : résultat déjà complet.
