//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.11;

import "hardhat/console.sol";
import "../token/CakeToken.sol";
import "../gasStation/GasStation.sol";
import "../openzeppelin/token/ERC20/SafeERC20.sol";
import "../openzeppelin/math/SafeMath.sol";
import "../openzeppelin/utils/ReentrancyGuard.sol";

/// @title Cake Staking
/// @author Jesse Abramowitz
/// @notice the implementation of Dollar Cake Staking
contract CakeStaking is ReentrancyGuard, CakeToken {
    using SafeMath for uint256;

    mapping(address => mapping(address => uint256)) public userStake; // content creator to user
    mapping(address => mapping(address => uint256)) public minActionTime; // user to content creator to time
    mapping(address => uint256) public stakerSplit; //  Porportion of payout stakers recieve
    mapping(address => uint256) public creatorStaked; // amount of funds stakes for content creator
    mapping(address => uint256) public contentTotalPayout; // amount of payouts for users of a CC

    event Reward(
        address indexed contentCreator,
        uint256 total,
        uint256 stakerReward,
        uint256 contentCreatorReward,
        uint256 dollarCakeFee
    );
    event SplitUpdated(
        address indexed contentCreator,
        uint256 newStakerPortion
    );
    event UserDeposit(
        address indexed user,
        address indexed contentCreator,
        uint256 amountDeposited,
        uint256 payout
    );
    event UserWithdrawal(
        address indexed user,
        address indexed contentCreator,
        uint256 payout,
        uint256 amountReceived
    );

    /**
		Checks that arrays of content creators and amount is the same.
		Checks that a rewarder is not delegating their votes. This prevents an infinite vote share mint exploit
	 */
    modifier rewardModifier(
        address[] memory _contentCreator,
        uint256[] memory _amount
    ) {
        require(_contentCreator.length == _amount.length, "mismatch");
        require(
            delegatedFrom[msg.sender].amount == 0,
            "ERC20: reward from a delegated account"
        );
        _;
    }

    constructor(string memory _name, string memory _symbol)
        public
        CakeToken(_name, _symbol)
    {}

    /// @param _contentCreator an array of content creators to reward
    /// @param _amount an array of amounts to reward
    /// @notice rewards the content creators and bakers of the content creators
    function reward(address[] memory _contentCreator, uint256[] memory _amount)
        public
        nonReentrant
        rewardModifier(_contentCreator, _amount)
    {
        uint256 _stakerSplit = globalStakerSplit;
        for (uint256 i = 0; i < _contentCreator.length; i++) {
            if (!isControlingSplit) {
                _stakerSplit = stakerSplit[_contentCreator[i]] == uint256(0)
                    ? uint256(50)
                    : stakerSplit[_contentCreator[i]];
            }
            uint256 amountMinusFee = _amount[i].mul(fee).div(1000);
            uint256 dollarCakeFee = _amount[i].sub(amountMinusFee);
            uint256 stakerReward = amountMinusFee.mul(_stakerSplit).div(100);
            uint256 contentCreatorReward = amountMinusFee.sub(stakerReward);
            creatorStaked[_contentCreator[i]] = creatorStaked[
                _contentCreator[i]
            ]
                .add(stakerReward);

            _transfer(msg.sender, address(this), stakerReward);
            _transfer(msg.sender, _contentCreator[i], contentCreatorReward);
            _transfer(msg.sender, dollarCake, dollarCakeFee);
            emit Reward(
                _contentCreator[i],
                _amount[i],
                stakerReward,
                contentCreatorReward,
                dollarCakeFee
            );
        }
    }

    /// @param _contentCreator an array of content creators bakers to reward
    /// @param _amount an array of amounts to reward
    /// @notice rewards just the bakers of the content creators
    function rewardStakingPoolOnly(
        address[] memory _contentCreator,
        uint256[] memory _amount
    ) public nonReentrant rewardModifier(_contentCreator, _amount) {
        for (uint256 i = 0; i < _contentCreator.length; i++) {
            creatorStaked[_contentCreator[i]] = creatorStaked[
                _contentCreator[i]
            ]
                .add(_amount[i]);
            _transfer(msg.sender, address(this), _amount[i]);
            emit Reward(_contentCreator[i], _amount[i], _amount[i], 0, 0);
        }
    }

    /// @param _newStakerPortion the porportion of your reward your bakers recieve
    /// @notice sets the porportion of your reward your bakers recieve
    function setSplit(uint256 _newStakerPortion) public nonReentrant {
        require(
            _newStakerPortion <= 90 && _newStakerPortion >= 10,
            "not in bounds"
        );
        address payable sender =
            _msgSender("setSplit", address(0), _newStakerPortion, address(0));
        require(now >= minActionTime[sender][sender], "wait more time");
        stakerSplit[sender] = _newStakerPortion;
        minActionTime[sender][sender] = now.add(timeLock);
        emit SplitUpdated(sender, _newStakerPortion);
    }

    /// @param _contentCreator content creator to baker to
    /// @param _amount amount to bake
    /// @notice bake to a content creator
    function deposit(address _contentCreator, uint256 _amount)
        public
        nonReentrant
    {
        address payable sender =
            _msgSender("deposit", _contentCreator, _amount, address(0));
        uint256 contractBalance = creatorStaked[_contentCreator];
        _transfer(sender, address(this), _amount);
        deposited[sender] = deposited[sender].add(_amount);

        uint256 payout;
        if (contentTotalPayout[_contentCreator] == 0) {
            payout = _amount;
        } else {
            payout = _amount.mul(contentTotalPayout[_contentCreator]).div(
                contractBalance
            );
        }
        userStake[_contentCreator][sender] = userStake[_contentCreator][sender]
            .add(payout);
        contentTotalPayout[_contentCreator] = contentTotalPayout[
            _contentCreator
        ]
            .add(payout);
        creatorStaked[_contentCreator] = creatorStaked[_contentCreator].add(
            _amount
        );
        minActionTime[sender][_contentCreator] = now.add(timeLock);
        emit UserDeposit(sender, _contentCreator, _amount, payout);
        // payoutIn / payoutTot = tokenAddedInd / total token (after paying)
    }

    /// @param _contentCreator content creator to baker to
    /// @param _userStake amount to unstake
    /// @notice unbake from a content creator
    function withdraw(address _contentCreator, uint256 _userStake)
        public
        nonReentrant
    {
        address payable sender =
            _msgSender("withdraw", _contentCreator, _userStake, address(0));
        require(
            now >= minActionTime[sender][_contentCreator],
            "wait more time"
        );
        uint256 payout = withdrawPayout(_contentCreator, _userStake);
        _transfer(address(this), sender, payout);
        deposited[sender] = payout > deposited[sender]
            ? 0
            : deposited[sender].sub(payout);
        userStake[_contentCreator][sender] = userStake[_contentCreator][sender]
            .sub(_userStake);
        
        assert(payout <= creatorStaked[_contentCreator]);
        assert(_userStake <= contentTotalPayout[_contentCreator]);
        
        creatorStaked[_contentCreator] = creatorStaked[_contentCreator].sub(
            payout
        );
        contentTotalPayout[_contentCreator] = contentTotalPayout[
            _contentCreator
        ]
            .sub(_userStake);
        emit UserWithdrawal(sender, _contentCreator, _userStake, payout);
    }

    /// @dev helper function to turn a stake into a token balance
    function withdrawPayout(address _contentCreator, uint256 _userStake)
        public
        view
        returns (uint256)
    {
        return
            _userStake.mul(creatorStaked[_contentCreator]).div(
                contentTotalPayout[_contentCreator]
            );
    }

    /// @dev helper function to turn an array of stakes into a token balance
    function withdrawable(address[] memory _contentCreators, address _user)
        public
        view
        returns (uint256[] memory)
    {
        uint256[] memory withdrawableArray =
            new uint256[](_contentCreators.length);
        for (uint256 i = 0; i < _contentCreators.length; i++) {
            uint256 _userStake = userStake[_contentCreators[i]][_user];
            uint256 _withdrawable =
                contentTotalPayout[_contentCreators[i]] != 0
                    ? withdrawPayout(_contentCreators[i], _userStake)
                    : 0;
            withdrawableArray[i] = _withdrawable;
        }
        return withdrawableArray;
    }
}
