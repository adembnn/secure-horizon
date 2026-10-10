// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
contract T{ event Transfer(address indexed f,address indexed t,uint v); mapping(address=>uint) public b;
 constructor(){b[msg.sender]=1e24;}
 function transfer(address t,uint v) external returns(bool){b[msg.sender]-=v;b[t]+=v;emit Transfer(msg.sender,t,v);return true;}}
