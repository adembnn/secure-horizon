// Local Hardhat node (chainId 43113): deploy a test ERC-20, run monitor.mjs against it, emit 3 transfers.
import { ethers } from 'ethers'; import { readFileSync } from 'fs'; import { spawn } from 'child_process';
const art=JSON.parse(readFileSync('artifacts/contracts/T.sol/T.json'));
const p=new ethers.JsonRpcProvider('http://127.0.0.1:8545',undefined,{staticNetwork:true});
const w=await p.getSigner(0); const c=await new ethers.ContractFactory(art.abi,art.bytecode,w).deploy(); await c.waitForDeployment();
const addr=(await c.getAddress()).toLowerCase(); console.log('deployed',addr);
const m=spawn('node',['../monitor.mjs','local-hardhat','ws://127.0.0.1:8545','8','0',addr],{stdio:'inherit'});
await new Promise(r=>setTimeout(r,2000));
for(let i=0;i<3;i++){ await (await c.transfer('0x000000000000000000000000000000000000dEaD',1000n+BigInt(i))).wait(); await new Promise(r=>setTimeout(r,500)); }
await new Promise(r=>m.on('exit',r));
