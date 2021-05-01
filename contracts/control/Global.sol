//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.11;

import "hardhat/console.sol";
import "../openzeppelin/access/Ownable.sol";

contract Global is Ownable {
    uint256 public minInitialDeposit;
    uint256 public globalStakerSplit;
    uint256 public timeLock;
    uint256 public contentCreatorFee;
    uint256 public stakerFee;
    address public dollarCake;
    // this can only be fliped one way and allows CC to control their own split
    bool public isControlingSplit;
    uint256 public relayerFee;

    constructor() public {
        isControlingSplit = true;
        globalStakerSplit = 50;
        minInitialDeposit = 10 ether;
        timeLock = 30 days;
        dollarCake = msg.sender;
        contentCreatorFee = 950;
        stakerFee = 950;
    }

    function turnOffGlobalSplit() external onlyOwner {
        isControlingSplit = false;
    }

    function changeMinInitialDeposit(uint256 _minInitialDeposit)
        external
        onlyOwner
    {
        minInitialDeposit = _minInitialDeposit;
    }

    function changeGlobalStakeSplit(uint256 _globalStakerSplit)
        external
        onlyOwner
    {
        // can eiter be 10 or 90% of rewards
        require(
            _globalStakerSplit <= 90 && _globalStakerSplit >= 10,
            "not in bounds"
        );
        globalStakerSplit = _globalStakerSplit;
    }

    function changeTimeLock(uint256 _timeLock) external onlyOwner {
        require(_timeLock >= 1 hours && _timeLock <= 52 weeks, "not in bounds");
        timeLock = _timeLock;
    }

    function changeContentCreatorFee(uint256 _contentCreatorFee)
        external
        onlyOwner
    {
        // can either be 0-7% contentCreatorFee
        require(
            _contentCreatorFee <= 1000 && _contentCreatorFee >= 500,
            "not in bounds"
        );
        contentCreatorFee = _contentCreatorFee;
    }

    function changeStakerFee(uint256 _stakerFee) external onlyOwner {
        // can either be 0-7% StakerFee
        require(_stakerFee <= 1000 && _stakerFee >= 500, "not in bounds");
        stakerFee = _stakerFee;
    }

    function changeDollarCakeAddress(address _dollarCake) external onlyOwner {
        dollarCake = _dollarCake;
    }

    function changeRelayerFee(uint256 _relayerFee) external onlyOwner {
        require(_relayerFee <= 25 ether, "not in bounds");
        relayerFee = _relayerFee;
    }
}
