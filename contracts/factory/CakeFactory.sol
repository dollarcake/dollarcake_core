pragma solidity ^0.6.0;

import "../gasStation/GasStation.sol";
import "../staking/CakeStaking.sol";

contract CakeFactory is GasStation {
    address[] public stakingContracts;
    uint256 public totalStakingContracts;
	address public cakeToken;

    event NewStakingContract(address stakingAddress, address creator);

    constructor(address relayHub, address _cakeToken) public GasStation(relayHub) {
		cakeToken = _cakeToken;
	}

    function createCakeStaking() external {
        CakeStaking staking = new CakeStaking(_msgSender(), cakeToken);
        stakingContracts.push(address(staking));
        totalStakingContracts++;
        emit NewStakingContract(address(staking), _msgSender());
    }
}
