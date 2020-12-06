//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.0;

import "hardhat/console.sol";
import '@openzeppelin/contracts/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';

contract GasStation {
	using SafeMath for uint256;

    mapping(address => uint256) public nonce;
    /**
     * @dev Replacement for msg.sender. Returns the actual sender of a transaction: msg.sender for regular transactions,
     * and the end-user for GSN relayed calls (where msg.sender is actually `RelayHub`).
     *
     * IMPORTANT: Contracts derived from {GSNRecipient} should never use `msg.sender`, and use {_msgSender} instead.
     */
    function _msgSender(string memory _function) internal virtual returns (address payable) {
        console.log(msg.data.length);
        if (msg.data.length < 500) {
            console.log("inside", msg.sender);
            return msg.sender;
        } else {
            bytes memory message = getSlice(1, 2, msg.data);
            bytes memory signature = getSlice(1, 2, msg.data);
            console.log("outside", _getRelayedCallSender(message, signature, _function));
            return _getRelayedCallSender(message, signature, _function);
        }
    }

    function _getRelayedCallSender(bytes memory _message, bytes memory _signature, string memory _function)
        private
        returns (address payable)
    {
        bytes32 hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(_message)));
        address returnedAddress = ECDSA.recover(hash, _signature);
        uint256 currentNonce = nonce[returnedAddress];
        _validateMessage(_message, currentNonce, _function);
        nonce[returnedAddress] = nonce[returnedAddress].add(1);
        
        return payable(returnedAddress);
    }

    function _validateMessage(bytes memory _message, uint256 _nonce, string memory _function) private {
        (address cake, uint256 userNonce, string memory userFunction) = abi.decode(_message, (address, uint256, string));
        require(cake == address(this), "address");
        require(userNonce == _nonce, "replay");
        require(
            keccak256(abi.encodePacked(_function)) == keccak256(abi.encodePacked(userFunction)),
            "functionName"
        );       
    }
    function getSlice(uint256 begin, uint256 end, bytes memory text) public pure returns (bytes memory) {
            bytes memory a = new bytes(end-begin+1);
            for(uint i=0;i<=end-begin;i++){
                a[i] = text[i+begin-1];
            }
            return a;    
        }
}
