pragma solidity ^0.6.0;

import "hardhat/console.sol";

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Farm is ChainlinkClient, Ownable {
    string public name = "Dollarcake Token Farm";
    IERC20 public dappToken;

    address[] public stakers;
    // token > address
    mapping(address => uint256) public stakingBalance;
    mapping(address => uint256) public tokensStaked;
    mapping(address => address) public tokenPriceFeedMapping;

    constructor(address _dappTokenAddress) public {
        dappToken = IERC20(_dappTokenAddress);
    }

    function checkSupply() public view returns (uint256) {
        return dappToken.totalSupply();
    }

    function stakeTokens(uint256 _amount) public {
        updateTokensStaked(msg.sender);
        dappToken.transferFrom(msg.sender, address(this), _amount);
        stakingBalance[msg.sender] = stakingBalance[msg.sender] + _amount;
        if (tokensStaked[msg.sender] == 1) {
            stakers.push(msg.sender);
        }
    }

    // Unstaking Tokens (Withdraw)
    function unstakeTokens(address token) public {
        // Fetch staking balance
        uint256 balance = stakingBalance[msg.sender];
        require(balance > 0, "staking balance cannot be 0");
        IERC20(token).transfer(msg.sender, balance);
        stakingBalance[msg.sender] = 0;
        tokensStaked[msg.sender] = tokensStaked[msg.sender] - 1;
    }

    function updateTokensStaked(address user) internal {
        if (stakingBalance[user] <= 0) {
            tokensStaked[user] = tokensStaked[user] + 1;
        }
    }
}
