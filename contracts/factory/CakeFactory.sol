pragma solidity ^0.6.0;

import "../gasStation/GasStation.sol";
import "../staking/CakeStaking.sol";

contract CakeFactory is GasStation {

	address[] public stakingContracts;
	uint256 public totalStakingContracts;

	event NewStakingContract(address stakingAddress, address creator);
	constructor (address relayHub) public GasStation(relayHub) {

	}

	function createCakeStaking() external  {
		CakeStaking staking = new CakeStaking(_msgSender());
		stakingContracts.push(address(staking));
		totalStakingContracts++;
		emit NewStakingContract(address(staking), _msgSender());
	}
}