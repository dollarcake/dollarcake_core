//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.0;

import "hardhat/console.sol";
import '@openzeppelin/contracts/access/Ownable.sol';


contract Global is Ownable {
	
	uint256 public minInitialDeposit;
	uint256 public globalStakerSplit;
	uint256 public timeLock;
	bool public isControlingSplit;

	constructor () public {
		isControlingSplit = true;
		globalStakerSplit = 50;
		minInitialDeposit = 10 ether; 
		timeLock = 30 days;
	}

	function turnOffGlobalSplit() external onlyOwner {
		isControlingSplit = false;
	}

	function changeMinInitialDeposit(uint256 _minInitialDeposit) external onlyOwner {
		minInitialDeposit = _minInitialDeposit;
	}

	function changeGlobalStakeSplit(uint256 _globalStakerSplit) external onlyOwner {
		require(_globalStakerSplit <= 90 && _globalStakerSplit >= 10, "not in bounds");
		globalStakerSplit = _globalStakerSplit;
	}

	function changeTimeLock(uint256 _timeLock) external onlyOwner {
		require(_timeLock >= 1 days, "not in bounds");
		timeLock = _timeLock;
	}

}
