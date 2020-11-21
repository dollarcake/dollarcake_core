//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.0;

import "hardhat/console.sol";
import "../token/CakeToken.sol";
import "../control/Global.sol";
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';

contract CakeStaking is Global {

	using SafeMath for uint256;

	CakeToken public cakeToken;

	mapping (address => mapping (address => uint256)) public userStake; // content creator to user 
	mapping (address => uint256) public minWithdrawTime;
	mapping (address => uint256) public stakerSplit;
	mapping (address => uint256) public creatorStaked; // amount of funds stakes for content creator
	mapping (address => uint256) public contentTotalPayout; // amount of payouts for users of a CC

	event Reward(uint256 total, uint256 stakerReward, uint256 contentCreatorReward);
	event SplitUpdated(address contentCreator, uint256 newStakerPortion);

	modifier timePassed() {
		require(now >= minWithdrawTime[msg.sender], "wait more time");
		_;
	}

    constructor(address _cakeToken) public {
		cakeToken = CakeToken(_cakeToken); 
		timeLock = 30 days;
    }

    function reward(address _contentCreator, uint256 _amount) public {
		uint256 _stakerSplit;
		if (isControlingSplit) {
			_stakerSplit = globalStakerSplit;
		} else {
			_stakerSplit = stakerSplit[_contentCreator] == uint256(0) ? uint256(50) : stakerSplit[_contentCreator];
		}
		uint256 stakerReward = _amount.mul(_stakerSplit).div(100);
		uint256 contentCreatorReward = _amount.sub(stakerReward);
		creatorStaked[_contentCreator] = creatorStaked[_contentCreator].add(stakerReward);
		SafeERC20.safeTransferFrom(cakeToken, msg.sender, address(this), stakerReward);
		SafeERC20.safeTransferFrom(cakeToken, msg.sender, _contentCreator, contentCreatorReward);
		emit Reward(_amount, stakerReward, contentCreatorReward);
    }

    function setSplit(uint256 _newStakerPortion) public {
		// TODO lock them for x amount of time
		require(_newStakerPortion <= 90 && _newStakerPortion >= 10, "not in bounds");
		stakerSplit[msg.sender] = _newStakerPortion;
		emit SplitUpdated(msg.sender, _newStakerPortion);
    }

    function deposit(address _contentCreator, uint256 _amount) public {
        // deposit cake token
		uint256 contractBalance = creatorStaked[_contentCreator];
		SafeERC20.safeTransferFrom(cakeToken, msg.sender, address(this), _amount);
		uint256 payout;
		if (contentTotalPayout[_contentCreator] == 0) {
			require(_amount >= minInitialDeposit, "minimum first stake");
			payout = _amount;
		} else {
			payout = _amount.mul(contentTotalPayout[_contentCreator]).div(contractBalance);
		}
		userStake[_contentCreator][msg.sender] = userStake[_contentCreator][msg.sender].add(payout);
		contentTotalPayout[_contentCreator] = contentTotalPayout[_contentCreator].add(payout); 
		creatorStaked[_contentCreator] = creatorStaked[_contentCreator].add(_amount);
		minWithdrawTime[msg.sender] = now.add(timeLock);

		//TODO add event
        // payoutIn / payoutTot = tokenAddedInd / total token (after paying)
    }

    function withdraw(address _contentCreator, uint256 _userStake) public timePassed {
		uint256 contractBalance = creatorStaked[_contentCreator];
		uint256 payout = _userStake.mul(contractBalance).div(contentTotalPayout[_contentCreator]);
		SafeERC20.safeTransfer(cakeToken, msg.sender, payout);
		userStake[_contentCreator][msg.sender] = userStake[_contentCreator][msg.sender].sub(_userStake);
		creatorStaked[_contentCreator] = creatorStaked[_contentCreator].sub(payout);
		contentTotalPayout[_contentCreator] = contentTotalPayout[_contentCreator].sub(_userStake);

		//TODO add event

    }
}
