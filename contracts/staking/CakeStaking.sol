//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.0;

import "hardhat/console.sol";
import "../token/CakeToken.sol";
import "../control/Global.sol";
import "../gasStation/GasStation.sol";
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

contract CakeStaking is Global, ReentrancyGuard, GasStation, CakeToken {

	using SafeMath for uint256;


	mapping (address => mapping (address => uint256)) public userStake; // content creator to user 
	mapping (address => mapping (address => uint256)) public minActionTime; // user to content creator to time
	mapping (address => uint256) public stakerSplit;
	mapping (address => uint256) public creatorStaked; // amount of funds stakes for content creator
	mapping (address => uint256) public contentTotalPayout; // amount of payouts for users of a CC

	event Reward(uint256 total, uint256 stakerReward, uint256 contentCreatorReward);
	event SplitUpdated(address contentCreator, uint256 newStakerPortion);
	event UserDeposit(address indexed user, address indexed contentCreator, uint256 amountDespoited, uint256 payout);
	event UserWithdrawl(address indexed user, address indexed contentCreator, uint256 payout, uint256 amountRecieved);

	modifier timePassed(address _contentCreator) {
		require(now >= minActionTime[_msgSender()][_contentCreator], "wait more time");
		_;
	}

    constructor(string memory _name, string memory _symbol) public CakeToken(_name, _symbol) {
    }

    function reward(address[] memory _contentCreator, uint256[] memory _amount) public nonReentrant {
		require(_contentCreator.length == _amount.length, "mismatch");
		for (uint256 i = 0; i < _contentCreator.length; i++) { 
			uint256 _stakerSplit;
			if (isControlingSplit) {
				_stakerSplit = globalStakerSplit;
			} else {
				_stakerSplit = stakerSplit[_contentCreator[i]] == uint256(0) ? uint256(50) : stakerSplit[_contentCreator[i]];
			}
			uint256 stakerReward = _amount[i].mul(_stakerSplit).div(100);
			uint256 contentCreatorReward = _amount[i].sub(stakerReward);
			creatorStaked[_contentCreator[i]] = creatorStaked[_contentCreator[i]].add(stakerReward);
			// SafeERC20.safeTransferFrom(cakeToken, _msgSender(), address(this), stakerReward);
			_transfer(msg.sender, address(this), stakerReward);
			// SafeERC20.safeTransferFrom(cakeToken, msg.sender, _contentCreator[i], contentCreatorReward);
			_transfer(msg.sender, _contentCreator[i], contentCreatorReward);
			emit Reward(_amount[i], stakerReward, contentCreatorReward);
		}
    }

	function rewardStakingPoolOnly(address[] memory _contentCreator, uint256[] memory _amount) public nonReentrant {
		require(_contentCreator.length == _amount.length, "mismatch");
		for (uint256 i = 0; i < _contentCreator.length; i++) { 
			creatorStaked[_contentCreator[i]] = creatorStaked[_contentCreator[i]].add(_amount[i]);
			_transfer(msg.sender, address(this), _amount[i]);
			// SafeERC20.safeTransferFrom(cakeToken, msg.sender, address(this), _amount[i]);
			emit Reward(_amount[i], _amount[i], 0);
		}
	}

    function setSplit(uint256 _newStakerPortion) public timePassed(msg.sender) nonReentrant {
		require(_newStakerPortion <= 90 && _newStakerPortion >= 10, "not in bounds");
		stakerSplit[msg.sender] = _newStakerPortion;
		minActionTime[msg.sender][msg.sender] = now.add(timeLock);
		emit SplitUpdated(msg.sender, _newStakerPortion);
    }

    function deposit(address _contentCreator, uint256 _amount, bytes memory _message, bytes memory _signature) public nonReentrant {
		address payable sender = _msgSender(_message, _signature);
		uint256 contractBalance = creatorStaked[_contentCreator];
		// SafeERC20.safeTransferFrom(cakeToken, _msgSender(), address(this), _amount);
		_transfer(sender, address(this), _amount);

		uint256 payout;
		if (contentTotalPayout[_contentCreator] == 0) {
			require(_amount >= minInitialDeposit, "minimum first stake");
			payout = _amount;
		} else {
			payout = _amount.mul(contentTotalPayout[_contentCreator]).div(contractBalance);
		}
		userStake[_contentCreator][sender] = userStake[_contentCreator][sender].add(payout);
		contentTotalPayout[_contentCreator] = contentTotalPayout[_contentCreator].add(payout); 
		creatorStaked[_contentCreator] = creatorStaked[_contentCreator].add(_amount);
		minActionTime[sender][_contentCreator] = now.add(timeLock);
		emit UserDeposit(sender, _contentCreator, _amount, payout);
        // payoutIn / payoutTot = tokenAddedInd / total token (after paying)
    }

    function withdraw(address _contentCreator, uint256 _userStake, bytes memory _message, bytes memory _signature) public timePassed(_contentCreator) nonReentrant {
		address payable sender = _msgSender(_message, _signature);
		uint256 payout = withdrawPayout(_contentCreator, _userStake);
		// SafeERC20.safeTransfer(cakeToken, _msgSender(), payout);
		_transfer(address(this), sender, payout);
		userStake[_contentCreator][sender] = userStake[_contentCreator][sender].sub(_userStake);
		creatorStaked[_contentCreator] = creatorStaked[_contentCreator].sub(payout);
		contentTotalPayout[_contentCreator] = contentTotalPayout[_contentCreator].sub(_userStake);
		emit UserWithdrawl(sender, _contentCreator, _userStake, payout);
    }

	function withdrawPayout(address _contentCreator, uint256 _userStake) public view returns (uint256) {
		return _userStake.mul(creatorStaked[_contentCreator]).div(contentTotalPayout[_contentCreator]);
	}
}
