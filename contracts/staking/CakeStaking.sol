//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.0;

import "hardhat/console.sol";
import "../token/CakeToken.sol";
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';

contract CakeStaking {

	using SafeMath for uint256;

    // address public contentCreator;
	// uint256 public contentCreatorPortion;
	// uint256 public stakerPortion;
	// uint256 public totalStaked;
	CakeToken public cakeToken;
	uint256 public timeLock;

	mapping (address => mapping (address => uint256)) public userStake; // user to content 
	mapping (address => uint256) public minWithdrawTime;
	mapping (address => uint256) public stakerSplit;
	mapping (address => uint256) public creatorStaked;
	// mapping (address => uint256) public totalStaked; 

	event Reward(uint256 total, uint256 stakerReward, uint256 contentCreatorReward);
	event SplitUpdated(address contentCreator, uint256 newStakerPortion);

	modifier timePassed() {
		require(now >= minWithdrawTime[msg.sender], "wait more time");
		_;
	}

    constructor(address _contentCreator, address _cakeToken) public {
        // contentCreator = _contentCreator;
		// contentCreatorPortion = 50;
		// stakerPortion = 50;
		cakeToken = CakeToken(_cakeToken); 
		timeLock = 30 days;
    }

    function reward(address _contentCreator, uint256 _amount) public {
		uint256 stakerReward = _amount.mul(stakerSplit[_contentCreator]).div(100);
		uint256 fullPortion = 100;
		uint256 contentCreatorPortion = fullPortion.sub(stakerSplit[_contentCreator]);
		uint256 contentCreatorReward = _amount.mul(contentCreatorPortion).div(100);
		creatorStaked[_contentCreator] = creatorStaked[_contentCreator].add(_amount);
		SafeERC20.safeTransferFrom(cakeToken, msg.sender, address(this), stakerReward);
		SafeERC20.safeTransferFrom(cakeToken, msg.sender, _contentCreator, contentCreatorReward);
		emit Reward(_amount, stakerReward, contentCreatorReward);
    }

    function setSplit(address _contentCreator, uint256 _newStakerPortion) public {
        // TODO only owner or call to a global contract?
		// TODO lock them for x amount of time
		require(_newStakerPortion <= 90 && _newStakerPortion >= 10, "not in bounds");
		stakerSplit[_contentCreator] = _newStakerPortion;
		emit SplitUpdated(_contentCreator, _newStakerPortion);
    }

    function deposit(address _contentCreator, uint256 _amount) public {
        // deposit cake token
		uint256 contractBalance = creatorStaked[_contentCreator];
		SafeERC20.safeTransferFrom(cakeToken, msg.sender, address(this), _amount);
		uint256 payout;
		if (creatorStaked[_contentCreator] == 0) {
			// TODO handle smallest stake maybe better
			require(_amount >= 10 ether, "minimum first stake");
			payout = _amount;
		} else {
			payout = _amount.mul(creatorStaked[_contentCreator]).div(contractBalance);
		}
		userStake[_contentCreator][msg.sender] = userStake[_contentCreator][msg.sender].add(payout);
		creatorStaked[_contentCreator] = creatorStaked[_contentCreator].add(payout);
		minWithdrawTime[msg.sender] = now.add(minWithdrawTime[msg.sender]);

		//TODO add event
        // write into mapping an amount to payout
        // payoutIn / payoutTot = tokenAddedInd / total token (after paying)
    }

    function withdraw(address _contentCreator, uint256 _userStake) public timePassed {
		uint256 contractBalance = creatorStaked[_contentCreator];
		uint256 payout = _userStake.mul(contractBalance).div(creatorStaked[_contentCreator]);
		SafeERC20.safeTransfer(cakeToken, msg.sender, payout);
		userStake[_contentCreator][msg.sender] = userStake[_contentCreator][msg.sender].sub(_userStake);
		creatorStaked[_contentCreator] = creatorStaked[_contentCreator].sub(_userStake);

		//TODO add event

    }
}
