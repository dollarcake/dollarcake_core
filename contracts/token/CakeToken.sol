//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.0;

import "hardhat/console.sol";
import "../gasStation/GasStation.sol";

import "./ERC20.sol";

contract CakeToken is ERC20 {
    constructor(address relayHub) public ERC20("Baking", "BAKE", relayHub) {
        _mint(msg.sender, 10000000e18);
    }
}
