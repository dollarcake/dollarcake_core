//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract Cake is ERC20 {
    constructor() public ERC20("Baking", "BAKE") {
        _mint(msg.sender, 10000000e18);
    }
}
