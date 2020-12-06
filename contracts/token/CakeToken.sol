//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.0;

import "hardhat/console.sol";
import "../gasStation/GasStation.sol";

import "./ERC20.sol";

contract CakeToken is ERC20 {
    constructor(string memory _name, string memory _symbol) public ERC20(_name, _symbol) {
        _mint(msg.sender, 10000000 ether);
    }
}
