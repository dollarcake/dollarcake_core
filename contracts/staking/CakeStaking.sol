//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.0;

import "hardhat/console.sol";
import '../gasStation/GasStation.sol';


contract CakeStaking {

	address public contentCreator;

    constructor(address _contentCreator) public  {
		contentCreator = _contentCreator;
		//set Info about staking contract
    }

	function pay() public {
		// allow content creator to set the split?
		// split funds between content creator and users
	}

	function setSplit() public {
		// only owner or call to a global contract
		// lock them for x amount of time 
		// require statment 
	}

	function deposit() public {
		// deposit cake token 
		// write into mapping an amount to payout
		// payoutIn / payoutTot = tokenAddedInd / total token (after paying)
	}

	function withdraw() public {
		// withdraw cake token plus reward
		// check to make sure past min staking time
		// remove from mapping 
	}


}
