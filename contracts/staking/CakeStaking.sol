//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.0;

import "hardhat/console.sol";
import "../token/CakeToken.sol";
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';

contract CakeStaking {

	using SafeMath for uint256;

    address public contentCreator;
	uint256 public contentCreatorPortion;
	uint256 public stakerPortion;
	uint256 public totalStaked;
	CakeToken public cakeToken;
	uint256 public timeLock;

	mapping (address => uint256) public userStake;
	mapping (address => uint256) public lastDeposit;

	event Reward(uint256 total, uint256 stakerReward, uint256 contentCreatorReward);
	event SplitUpdated(uint256 newContentCreatorPortion, uint256 newStakerPortion);

	modifier timePassed() {
		uint256 timeDifference = now.sub(lastDeposit[msg.sender]);
		require(timeDifference >= timeLock, "wait more time");
		_;
	}

    constructor(address _contentCreator, address _cakeToken) public {
        contentCreator = _contentCreator;
		contentCreatorPortion = 50;
		stakerPortion = 50;
		cakeToken = CakeToken(_cakeToken); 
		timeLock = 30 days;
        //set Info about staking contract
    }

    function reward(uint256 _amount) public {
		uint256 stakerReward = _amount.mul(stakerPortion).div(100);
		uint256 contentCreatorReward = _amount.mul(contentCreatorPortion).div(100);
		SafeERC20.safeTransferFrom(cakeToken, msg.sender, address(this), stakerReward);
		SafeERC20.safeTransferFrom(cakeToken, msg.sender, contentCreator, contentCreatorReward);
		emit Reward(_amount, stakerReward, contentCreatorReward);
    }

    function setSplit(uint256 _newContentCreatorPortion, uint256 _newStakerPortion) public {
        // TODO only owner or call to a global contract?
		// TODO lock them for x amount of time
		require(_newContentCreatorPortion <= 90 && _newContentCreatorPortion >= 10, "not in bounds");
		require(_newStakerPortion <= 90 && _newStakerPortion >= 10, "not in bounds");
		require(_newContentCreatorPortion.add(_newStakerPortion) == 100, "not in bounds");
		contentCreatorPortion = _newContentCreatorPortion;
		stakerPortion = _newStakerPortion;
		emit SplitUpdated(_newContentCreatorPortion, _newStakerPortion);
    }

    function deposit(uint256 _amount) public {
        // deposit cake token
		uint256 contractBalance = cakeToken.balanceOf(address(this));
		SafeERC20.safeTransferFrom(cakeToken, msg.sender, address(this), _amount);
		uint256 payout;
		if (totalStaked == 0) {
			require(_amount >= 10 ether, "minimum first stake");
			payout = _amount;
		} else {
			payout = _amount.mul(totalStaked).div(contractBalance);
		}
		userStake[msg.sender] = userStake[msg.sender].add(payout);
		totalStaked = totalStaked.add(payout);
		lastDeposit[msg.sender] = now;
        // write into mapping an amount to payout
        // payoutIn / payoutTot = tokenAddedInd / total token (after paying)
    }

    function withdraw(uint256 _amount) public timePassed {
		uint256 contractBalance = cakeToken.balanceOf(address(this));
		uint256 payout = _amount.mul(contractBalance).div(totalStaked);
		SafeERC20.safeTransfer(cakeToken, msg.sender, payout);
		userStake[msg.sender] = userStake[msg.sender].sub(_amount);
		totalStaked = totalStaked.sub(_amount);
    }
}
