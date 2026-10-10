// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
contract Sink { receive() external payable {} }
contract Splitter {
  Sink public sink;
  constructor() { sink = new Sink(); }
  // forwards value internally: 30% to a, 20% to sink contract, rest to b
  function split(address payable a, address payable b) external payable {
    a.transfer(msg.value * 30 / 100);
    (bool ok,) = payable(address(sink)).call{value: msg.value * 20 / 100}("");
    require(ok);
    b.transfer(address(this).balance);
  }
}
