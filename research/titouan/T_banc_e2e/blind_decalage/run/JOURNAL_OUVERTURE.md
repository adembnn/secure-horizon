# Journal d'ouverture du jeu aveugle decalage

Chaque ouverture ajoute une section. Ce fichier n'est jamais réécrit.

## Ouverture 2026-10-11T07:10:52.843Z

- Verrou : posé avant toute lecture du contenu (blind_decalage\run\OUVERT.lock)
- Cas : blind_decalage\CASES.jsonl, sha256 ab3dcab945af0a75fab45f05138a8d608886dbcd4d945ab5a47d3c627ee79fd2 = publié
- Git HEAD : 74203dae38e08bcefab17b8fb6308893160a6c1c, fichiers modifiés non commités : 3
- sha256 du moteur (moteur + build standalone) : a5b19d8375014f2859e0372b6b6f6f90ba677b74233ab2720aeb2cae16732dfe
  - groupe moteur (engine/src, engine/vendor, run/policy.mjs, run/arms.mjs, pipeline/evaluate_plus.mjs, pipeline/intent_clef.mjs, known_protocols.json, normalize_v2.mjs, detectors_adem/*, extension/*.js) : be1ca30bca97dc7732c19cb5d3e42303156e24d28d2b9fdb54bfd82ad660da2a
  - groupe standalone (extension_standalone/extension/**, dist/hold-up-standalone*.zip) : 5463f244c45860777abfcaa54c169fed3bc0f5d97ab0c115fd5618eeea15fe75
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
    engine/src/effects_abi.mjs ce0126ecbc6f8fa330178f5fe78b71093e728c85de276b439ff17693ded2c849
    engine/src/eip712.mjs 33748da09cc26f6885f36f5d2167087e52c3fd4a332c5e5ea959fed4cb3ca3d3
    engine/src/engine.mjs 3c2de1406af6b2bef12dcc2017945cd8267127250bb94bd7d2534e3ef140a295
    engine/src/fixes.mjs 4a82d68ed8b560d4377642e129e23062f52395ba7cfffe44663c84f7c312853f
    engine/src/keccak.mjs 5c3b9570cfe39ca8ff76f0a807e39b96c42d5ccc2b8b66e22accc6aa0cc6cf7c
    engine/src/protocols_extra.mjs 466878f7b4b4ee4cab974bc1951f879613fd2eb59a6ad7bc0c406beb4984e9b0
    engine/src/registry.mjs e93b80f646cda08ac40678cb6bd75d5eb96e690c8312c44251eff83f4bb07ca2
    engine/src/rlp.mjs 1ad75bb91ec195935486805da3900ec4c26a7b459375ef3738c63218dd9ed0d9
    engine/src/rpc.mjs fa1d4b269a47456fdebf1ddeba16bdda4ba0a17191191b07bd604984cbf98f88
    engine/src/rules.mjs 75914eca31de948b391a58ee4a3174d35acb4fe0f5fe5d04362253b745a896b3
    engine/src/rules_extra.mjs 1657722aa6767fd4e5049cd9e7c77ca21cc744d93654c77244e41dae9baf41cf
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
    extension/gatekeeper.js 0ba3b57e6eeed2563a608bb839158619ca258f98d6d98e39b0787dc20babd597
    extension/hold_core.js aa7c50036ab3d0e37ff959d20f23686bc08f23a3a968bea3dc340a4d65f2f04b
    extension/inject.js abf4bbf1b721a4da91535b2c7f41ef8db9aff9e773570b87f764e3b4959d4ced
    extension/intent_text.js daed1e2fccaee8612bc4ce3f6a96ee8cc4f8e14e5565dfe912a4d7fcc3e3a8df
    extension/journal_chain.js eb078187af202f6f09f8e6da2a2f58bf194b961571eaa4fe4b0920720581bcf9
    extension/keyword_intent.js db39321e5685eb0286c1778615fe26e5241ef2234645fce0c3c669e31c8835ea
    extension/options.js 3b59021f1fa72ee9c5b83ec218699a9d61627a286a19b5b1e80482d561e20a95
    extension/outcome.js 96a6993f4cf751df4ef230cafcc0be0fb881f4997a998d5f507b0ed9e0103ca0
    extension/revoke.js 41fbd413f61525f778310da56df1e4263b606f634b51411717004dca14d23845
    extension/window.js d41eb7b68dabbce6e32754a1606d24dadabc451296985624108431ca91d2b3bd
    extension/written_check.js 0fb6639118508ef84beda928b06c747e78355d08ccc6f0d0ab563140aa412c87
    pipeline/evaluate_plus.mjs abacebbec0db66fe2ffc6612d431f67a9b3ce4eacc27bb2a967756bd4fd0e02f
    pipeline/intent_clef.mjs e03e3dcf969fdb4146e0c87f0af6caa3ccf0aa3830ec04d46d73970ee28e463a
    pipeline/known_protocols.json 0521b0ef89a7212cb357ddb523b907f0341323adf4cb032ccdfbbc13560de3da
    redteam/normalize_v2.mjs 4bd964c1f9afa9395b246cb094925de012e111219531da801e436a34b3dfc6ef
    run/arms.mjs dfc229b024120ae2cfea77d1a180794ec9755ffee577aa7e55e72f5cf11617a3
    run/policy.mjs 832510f7225b810655835a8519df5072bf1a6ff225d06112759a95a26015f5dc
  standalone:
    dist/hold-up-standalone-3fab41e8.zip f31bccd73f059100b2bc341db6ce0aeb5db3548c9a0d349842f1ffbeab6a362b
    dist/hold-up-standalone.zip 51cd51b525962bc6d2205dd87582fa45dfdc310f083f78fa2eb556916a7433e0
    extension_standalone/extension/BUILD_INFO.json 046b63b57852656b495ab690eb678c47a00299d5f5f402fa1244edf4db80b8e9
    extension_standalone/extension/background.js 1d490f6baad31fbe2fc8406670650d6d6a4130ac645d6382334b7b076893eee2
    extension_standalone/extension/bridge.js df4b2d6f78817d7ffc3d9f7a5b0d2e342a37951d9dec1e08622ecf7f5904d9ef
    extension_standalone/extension/classifier_client.js dd87c86f2acb5edd9b51062fc8f491bdc4115733624e612760233fb3e1da04c8
    extension_standalone/extension/effect_sim.js 2e221e0786a91cca77db33f034fa4537671a34fa0684baddd62b1fcd70e00f12
    extension_standalone/extension/engine/policy.js bcdd5ce9a291c39c39959fca7df89539678f14ed58ee104cced70c1b281d45c7
    extension_standalone/extension/engine/sentinelle_core.js 89b7c1451ed1e8be2289faec7ea1301f4b499049c43c2a3509ca6d7bdf1e44e3
    extension_standalone/extension/engine/src/abi.js 7bb2470709dba339830d33d852a4114a8adc54840327f57ccb5eea469d1a66de
    extension_standalone/extension/engine/src/abi_encode.js 5891306e106216c964b3f78cef96fefe0c118f493808925ec1e012b2465b01fe
    extension_standalone/extension/engine/src/calldata.js 04b3e4ad3ccaf1076d8dcf96a6ccd29dd9449ff6bf452e6b05eaa0778aec3719
    extension_standalone/extension/engine/src/effects_abi.js 28fd1b44af7e0f063131a94485dd7bdc6413c7d980b85d111c6ea5c55dfbb02e
    extension_standalone/extension/engine/src/eip712.js af92dca89035280ce88b232dd4ccb37b1a3cb3fc85d616dde461d2eb14244c95
    extension_standalone/extension/engine/src/engine.js 5773faa9321635e74faf4c2dc6e330bc253c1d6dd3458625387ff9846fb2fda3
    extension_standalone/extension/engine/src/fixes.js 4a82d68ed8b560d4377642e129e23062f52395ba7cfffe44663c84f7c312853f
    extension_standalone/extension/engine/src/keccak.js 5c3b9570cfe39ca8ff76f0a807e39b96c42d5ccc2b8b66e22accc6aa0cc6cf7c
    extension_standalone/extension/engine/src/protocols_extra.js 63df17811f8dc6335c2361c10331ba12e3a42103931ac63b53b3edb1eaf54e5f
    extension_standalone/extension/engine/src/registry.js a600d72c4a2e41621d52af00a0a07024766b4837335495684b18cb1c7169f561
    extension_standalone/extension/engine/src/rlp.js 8cae28ca2a16ccb8450244083f46adcd0941d5347f392ec77f94978f4c8049b6
    extension_standalone/extension/engine/src/rules.js 0d03ed10e9b8935594cb25d85ddb17390b700233508157dc09e7ae440955c485
    extension_standalone/extension/engine/src/rules_extra.js 5d08ada1fd931778ee05974d1562d71fa8cf4f1b1d8cf413b21ffb20a8208255
    extension_standalone/extension/engine/src/typed.js 628ac2311f8fb992b65aa8ef0229bf72aecd29dbf2b24fec44f4d87f57a16088
    extension_standalone/extension/engine/src/typehashes.js 4759d9f724ab7fa39a694ed9d8ff403af31a402011f2bef93f06b70debe44d06
    extension_standalone/extension/engine/src/util.js 374f3b6ef10d512b1070d404b79c1e567be40aa66a233db20906b714d8be50b4
    extension_standalone/extension/engine/textes.js 35099b08940fb561ac0f92f4138b09eba45638ca43f7e83b0814739278bbf8b6
    extension_standalone/extension/engine/textes.json 953886818c11dd78f38f4baa18576abe03b1c68f1634b49c7aad9f81b678391a
    extension_standalone/extension/engine/vendor/compare.js 21ee157ec239ac4bf0ae3cf0f40f13ba5048d44bf6834c3ead42fbdefc9d10ac
    extension_standalone/extension/gatekeeper.js 0ba3b57e6eeed2563a608bb839158619ca258f98d6d98e39b0787dc20babd597
    extension_standalone/extension/hold_core.js aa7c50036ab3d0e37ff959d20f23686bc08f23a3a968bea3dc340a4d65f2f04b
    extension_standalone/extension/inject.js abf4bbf1b721a4da91535b2c7f41ef8db9aff9e773570b87f764e3b4959d4ced
    extension_standalone/extension/intent_text.js daed1e2fccaee8612bc4ce3f6a96ee8cc4f8e14e5565dfe912a4d7fcc3e3a8df
    extension_standalone/extension/journal_chain.js eb078187af202f6f09f8e6da2a2f58bf194b961571eaa4fe4b0920720581bcf9
    extension_standalone/extension/keyword_intent.js db39321e5685eb0286c1778615fe26e5241ef2234645fce0c3c669e31c8835ea
    extension_standalone/extension/manifest.json 4a36db6a1c520fa4f11edc469ac46f0d115140d4b3e9a92338f9ac104d9113ca
    extension_standalone/extension/options.html 2c9bde76a69474d9a7b11a2dafadbfed96421ce6d5d5afa6dda8f3bb488765e3
    extension_standalone/extension/options.js 3b59021f1fa72ee9c5b83ec218699a9d61627a286a19b5b1e80482d561e20a95
    extension_standalone/extension/outcome.js 96a6993f4cf751df4ef230cafcc0be0fb881f4997a998d5f507b0ed9e0103ca0
    extension_standalone/extension/ui/screen.css dd98c23f57fb2450b1d5092009e444844a054d6772d2ec2bd8feb29566be7672
    extension_standalone/extension/ui/screen.js 630ab48bd32e124f2e9d613097ceafe41fe9270556d084a1574f7519ee2b2929
    extension_standalone/extension/ui/sidepanel.css 214fa1147ea544d3f17ab9385f463d8abb89072ba5283ea94e30c26e8507944c
    extension_standalone/extension/ui/sidepanel.html 087ea8adddf8ae51a3ab4258f9870669fd7bc47b28dbbc9a445bf5365482a626
    extension_standalone/extension/ui/sidepanel.js ab9539fc67d9c5abca9d9e511e977a8617b01adb6935756bdb82df16efafa175
    extension_standalone/extension/window.css 767961dd2b6043649cd44fcbe3cc8566b538cab1696bfa545c6d0013463473cc
    extension_standalone/extension/window.html cf3387482d9f4e9e3e272968b1a20dc26c729892727a879b837f3ad2baedda16
    extension_standalone/extension/window.js d41eb7b68dabbce6e32754a1606d24dadabc451296985624108431ca91d2b3bd
    extension_standalone/extension/written_check.js 0fb6639118508ef84beda928b06c747e78355d08ccc6f0d0ab563140aa412c87
  lanceur:
    blind_decalage/run/chaine/lib.mjs 6612aeea2329d51c6017e500de5025cf864c4e4feddf80a0103b4ad00476ba1a
    blind_decalage/run/chaine/textool.mjs 9d8fe4aeb6b3917950a6f856ca1b04f90e60b81d9f2890c8448e067a2234f9c5
    blind_decalage/run/mesure.mjs a3ddb75908dcf458ac4e3edfd497cd4f1aa759a425e02053325cc1edc492dc64
    blind_decalage/run/ouvrir_une_fois.mjs 3bde25be1878a46ea4c9679a1013a2b716ee1460e650853fbc7c2e9febf72576
```
</details>


Critères du verdict (publiés avant ouverture) : {"rappel_min":0.8,"fausse_alerte_rouge_max":0.1}

### Fin 2026-10-11T07:11:24.174Z

- Résultat : complet. bras a : CRITÈRES NON ATTEINTS (rappel 87.3 % >= 80.0 % ; faux rouges 15.0 % > 10.0 %) ; bras b : CRITÈRES NON ATTEINTS (rappel 88.7 % >= 80.0 % ; faux rouges 16.0 % > 10.0 %) ; bras c : CRITÈRES NON ATTEINTS (rappel 64.7 % < 80.0 % ; faux rouges 15.0 % > 10.0 %).
- Clef : 151 appels réels, 99 depuis le cache, 0 erreurs, quota non atteint
- sha256 de RESULTAT.md : a0d97599307b63245c4c4ad92a721fec31bc543863d55fa0de7766c057091fb4
- sha256 de resultat.json : e2fd72191857148490a86fc530e16225314c59c20bbcc2639a14cb387ea2c7f8
- aucun réglage après ouverture; chiffres publiés tels quels.
