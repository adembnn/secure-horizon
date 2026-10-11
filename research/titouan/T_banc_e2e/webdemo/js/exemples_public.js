// Genere par build_webdemo.mjs depuis attacks_public/PUBLIC.jsonl (cas SYNTHETIQUES de regression publique, aucune donnee reelle).
export default [
 {
  "id": "P-A01-B1",
  "family": "delegation_7702",
  "origin": "https://smart-account.example-official.org",
  "request": {
   "method": "eth_sendTransaction",
   "params": [
    {
     "from": "0xa411b4f9816cc2b30c0888e54efc5951cab92f3c",
     "to": "0xa411b4f9816cc2b30c0888e54efc5951cab92f3c",
     "value": "0x0",
     "data": "0x",
     "type": "0x4",
     "chainId": "0x1",
     "authorizationList": [
      {
       "chainId": "0x1",
       "address": "0xf4547559cdfd4d9cc35c1263ac1abb13f917d0f1",
       "nonce": "0x2"
      }
     ]
    }
   ]
  }
 },
 {
  "id": "P-A02-B1",
  "family": "batch_execute_7702",
  "origin": "https://app.uniswap.org",
  "request": {
   "method": "eth_sendTransaction",
   "params": [
    {
     "from": "0x5e8b41c12219d3b5726f502442010715d04f9e46",
     "to": "0x5e8b41c12219d3b5726f502442010715d04f9e46",
     "value": "0x0",
     "data": "0x3f707e6b0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000120000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000044095ea7b3000000000000000000000000c199d5d51a07e8c28458a48e0c3a4694d06026f80000000000000000000000000000000000000000000000000000000005f5e10000000000000000000000000000000000000000000000000000000000000000000000000000000000c199d5d51a07e8c28458a48e0c3a4694d06026f80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000e404e45aaf000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000001f40000000000000000000000005e8b41c12219d3b5726f502442010715d04f9e460000000000000000000000000000000000000000000000000000000005f5e1000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
     "type": "0x4",
     "chainId": "0x1",
     "authorizationList": [
      {
       "chainId": "0x1",
       "address": "0xf4547559cdfd4d9cc35c1263ac1abb13f917d0f1",
       "nonce": "0x2"
      }
     ]
    }
   ]
  }
 },
 {
  "id": "P-A03-B1",
  "family": "delegation_7702_chain0",
  "origin": "https://smart-account.example-official.org",
  "request": {
   "method": "eth_sendTransaction",
   "params": [
    {
     "from": "0x42e201b8b7dfa05d8f98206da9f1ecb6c0cfefe0",
     "to": "0x42e201b8b7dfa05d8f98206da9f1ecb6c0cfefe0",
     "value": "0x0",
     "data": "0x",
     "type": "0x4",
     "chainId": "0x1",
     "authorizationList": [
      {
       "chainId": "0x1",
       "address": "0xf4547559cdfd4d9cc35c1263ac1abb13f917d0f1",
       "nonce": "0x0"
      }
     ]
    }
   ]
  }
 },
 {
  "id": "P-A04-B1",
  "family": "signature_opaque_eth_sign",
  "origin": "https://app.example-official.org",
  "request": {
   "method": "personal_sign",
   "params": [
    "0x4269656e76656e756520737572206170702e6578616d706c652d6f6666696369616c2e6f72672e0a5369676e657a206365206d65737361676520706f75722070726f757665722071756520766f757320636f6e74726f6c657a20636520636f6d7074652e0a4e6f6e63653a2066303965393135636464",
    "0xabed49cc46fe27a6dab057d8d3b9ea3d410eb65e"
   ]
  }
 },
 {
  "id": "P-A05-B1",
  "family": "permit_2612",
  "origin": "https://app.uniswap.org",
  "request": {
   "method": "eth_signTypedData_v4",
   "params": [
    "0x1aa27d65afe32007bd1c91a73076d4bc17cc4337",
    "{\"types\":{\"EIP712Domain\":[{\"name\":\"name\",\"type\":\"string\"},{\"name\":\"version\",\"type\":\"string\"},{\"name\":\"chainId\",\"type\":\"uint256\"},{\"name\":\"verifyingContract\",\"type\":\"address\"}],\"Permit\":[{\"name\":\"owner\",\"type\":\"address\"},{\"name\":\"spender\",\"type\":\"address\"},{\"name\":\"value\",\"type\":\"uint256\"},{\"name\":\"nonce\",\"type\":\"uint256\"},{\"name\":\"deadline\",\"type\":\"uint256\"}]},\"primaryType\":\"Permit\",\"domain\":{\"name\":\"USD Coin\",\"version\":\"2\",\"chainId\":1,\"verifyingContract\":\"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48\"},\"message\":{\"owner\":\"0x1aa27d65afe32007bd1c91a73076d4bc17cc4337\",\"spender\":\"0x134754def598a608730fa212cd7e0d1c3396eb1a\",\"value\":\"250000000\",\"nonce\":4,\"deadline\":1760001800}}"
   ]
  }
 },
 {
  "id": "P-A06-B1",
  "family": "permit2_allowance",
  "origin": "https://app.uniswap.org",
  "request": {
   "method": "eth_signTypedData_v4",
   "params": [
    "0x4d0f03e185d603f23d14774c7ca02ecc76020062",
    "{\"types\":{\"EIP712Domain\":[{\"name\":\"name\",\"type\":\"string\"},{\"name\":\"chainId\",\"type\":\"uint256\"},{\"name\":\"verifyingContract\",\"type\":\"address\"}],\"PermitSingle\":[{\"name\":\"details\",\"type\":\"PermitDetails\"},{\"name\":\"spender\",\"type\":\"address\"},{\"name\":\"sigDeadline\",\"type\":\"uint256\"}],\"PermitDetails\":[{\"name\":\"token\",\"type\":\"address\"},{\"name\":\"amount\",\"type\":\"uint160\"},{\"name\":\"expiration\",\"type\":\"uint48\"},{\"name\":\"nonce\",\"type\":\"uint48\"}]},\"primaryType\":\"PermitSingle\",\"domain\":{\"name\":\"Permit2\",\"chainId\":1,\"verifyingContract\":\"0x000000000022D473030F116dDEE9F6B43aC78BA3\"},\"message\":{\"details\":{\"token\":\"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48\",\"amount\":\"250000000\",\"expiration\":1760001800,\"nonce\":0},\"spender\":\"0x134754def598a608730fa212cd7e0d1c3396eb1a\",\"sigDeadline\":1760001800}}"
   ]
  }
 },
 {
  "id": "P-A07-B1",
  "family": "permit2_signature_transfer",
  "origin": "https://app.uniswap.org",
  "request": {
   "method": "eth_signTypedData_v4",
   "params": [
    "0x9a699b29f9782c528bf5f2ffd2c61dc0764d1d2d",
    "{\"types\":{\"EIP712Domain\":[{\"name\":\"name\",\"type\":\"string\"},{\"name\":\"chainId\",\"type\":\"uint256\"},{\"name\":\"verifyingContract\",\"type\":\"address\"}],\"PermitTransferFrom\":[{\"name\":\"permitted\",\"type\":\"TokenPermissions\"},{\"name\":\"spender\",\"type\":\"address\"},{\"name\":\"nonce\",\"type\":\"uint256\"},{\"name\":\"deadline\",\"type\":\"uint256\"}],\"TokenPermissions\":[{\"name\":\"token\",\"type\":\"address\"},{\"name\":\"amount\",\"type\":\"uint256\"}]},\"primaryType\":\"PermitTransferFrom\",\"domain\":{\"name\":\"Permit2\",\"chainId\":1,\"verifyingContract\":\"0x000000000022D473030F116dDEE9F6B43aC78BA3\"},\"message\":{\"permitted\":{\"token\":\"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48\",\"amount\":\"250000000\"},\"spender\":\"0x134754def598a608730fa212cd7e0d1c3396eb1a\",\"nonce\":773309,\"deadline\":1760001800}}"
   ]
  }
 },
 {
  "id": "P-A08-B1",
  "family": "signature_differee",
  "origin": "https://app.aave.com",
  "request": {
   "method": "eth_signTypedData_v4",
   "params": [
    "0x6d242ebdc80840bc879790da47c85f4edfd09ec7",
    "{\"types\":{\"EIP712Domain\":[{\"name\":\"name\",\"type\":\"string\"},{\"name\":\"version\",\"type\":\"string\"},{\"name\":\"chainId\",\"type\":\"uint256\"},{\"name\":\"verifyingContract\",\"type\":\"address\"}],\"Permit\":[{\"name\":\"owner\",\"type\":\"address\"},{\"name\":\"spender\",\"type\":\"address\"},{\"name\":\"value\",\"type\":\"uint256\"},{\"name\":\"nonce\",\"type\":\"uint256\"},{\"name\":\"deadline\",\"type\":\"uint256\"}]},\"primaryType\":\"Permit\",\"domain\":{\"name\":\"USD Coin\",\"version\":\"2\",\"chainId\":1,\"verifyingContract\":\"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48\"},\"message\":{\"owner\":\"0x6d242ebdc80840bc879790da47c85f4edfd09ec7\",\"spender\":\"0x4ec2727c01f7c5751522e4841a41d4e2c282c929\",\"value\":\"1000000000\",\"nonce\":5,\"deadline\":1762592000}}"
   ]
  }
 },
 {
  "id": "P-A09-B1",
  "family": "simulation_evasion",
  "origin": "https://opensea.io",
  "request": {
   "method": "eth_sendTransaction",
   "params": [
    {
     "from": "0xe8342deb0540bdb001e90d2c964ccf61d9aee710",
     "to": "0xf0d3e6134bc535d67c1b2df781482c5b6bad7294",
     "value": "0x16345785d8a0000",
     "data": "0xa0712d680000000000000000000000000000000000000000000000000000000000000001",
     "chainId": "0x1"
    }
   ]
  }
 },
 {
  "id": "P-A11-B1",
  "family": "empoisonnement_adresse",
  "origin": "https://wallet-interface.local",
  "request": {
   "method": "eth_sendTransaction",
   "params": [
    {
     "from": "0xa014e61b87d43181778040e14d6124f6bb51e169",
     "to": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
     "value": "0x0",
     "data": "0xa9059cbb000000000000000000000000f6a0af9bde560fd09b4ad414b0e919164099a548000000000000000000000000000000000000000000000000000000012a05f200",
     "chainId": "0x1"
    }
   ]
  }
 },
 {
  "id": "P-A12-B1",
  "family": "empoisonnement_safe_imbrique",
  "origin": "https://app.safe.global",
  "request": {
   "method": "eth_sendTransaction",
   "params": [
    {
     "from": "0x69c52a49ea4a2d6e3a04624d28641e296c49a3dc",
     "to": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
     "value": "0x0",
     "data": "0xa9059cbb000000000000000000000000328ebf300763dc9c31e2dd13fab1f8068bc31e2e0000000000000000000000000000000000000000000000000000000077359400",
     "chainId": "0x1"
    }
   ]
  }
 },
 {
  "id": "P-A13-B1",
  "family": "clipper_remplacement",
  "origin": "https://wallet-interface.local",
  "request": {
   "method": "eth_sendTransaction",
   "params": [
    {
     "from": "0x84093644564728b29b6fd87bd8876073c0239e35",
     "to": "0xe40bd26634a4c6ae213faf38358df4a06615dd58",
     "value": "0x14d1120d7b160000",
     "data": "0x",
     "chainId": "0x1"
    }
   ]
  }
 },
 {
  "id": "P-A14-B1",
  "family": "origine_legitime_charge_malveillante",
  "origin": "https://cowswap.exchange",
  "request": {
   "method": "eth_sendTransaction",
   "params": [
    {
     "from": "0x50a9a49d1cbc44b1a2b3346f206b754f1eba45b0",
     "to": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
     "value": "0x0",
     "data": "0x095ea7b3000000000000000000000000c199d5d51a07e8c28458a48e0c3a4694d06026f80000000000000000000000000000000000000000000000000000000005f5e100",
     "chainId": "0x1"
    }
   ]
  }
 },
 {
  "id": "P-A15-B1",
  "family": "faux_revoke",
  "origin": "https://revoke.example-official.org",
  "request": {
   "method": "eth_sendTransaction",
   "params": [
    {
     "from": "0x25937eea9f7ae4e1d8be0af053fc013f8f7ead95",
     "to": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
     "value": "0x0",
     "data": "0x095ea7b30000000000000000000000009f50406cf1e3fcb2695d25541a02eb962140201c0000000000000000000000000000000000000000000000000000000000000000",
     "chainId": "0x1"
    }
   ]
  }
 },
 {
  "id": "P-A16-B1",
  "family": "chaine_neuve",
  "origin": "https://dex.newchain.test",
  "request": {
   "method": "eth_sendTransaction",
   "params": [
    {
     "from": "0x7b0231ab8db2f0f785040a421b949106976c0f60",
     "to": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
     "value": "0x0",
     "data": "0x095ea7b300000000000000000000000058d56fadd2224a79b6eae9835b0d6ef3e113697a0000000000000000000000000000000000000000000000000000000005f5e100",
     "chainId": "0xbdb29"
    }
   ]
  }
 },
 {
  "id": "P-A18-B1",
  "family": "siwe_detourne",
  "origin": "https://legit.test",
  "request": {
   "method": "personal_sign",
   "params": [
    "0x6c656769742e746573742077616e747320796f7520746f207369676e20696e207769746820796f757220457468657265756d206163636f756e743a0a3078386365396333333565346161313033663861646364636430303539643037346162396166333739380a0a5369676e20696e20746f206c656769742e746573740a0a5552493a2068747470733a2f2f6c656769742e746573740a56657273696f6e3a20310a436861696e2049443a20310a4e6f6e63653a20363636323233326236350a4973737565642041743a20323032362d31302d31315430383a30303a30302e3030305a",
    "0x8ce9c335e4aa103f8adcdcd0059d074ab9af3798"
   ]
  }
 }
];
