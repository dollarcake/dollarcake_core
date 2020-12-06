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
        uint256 dataLength = msg.data.length;
        
        if (dataLength < 250) {
            console.log("inside", msg.sender);
            return msg.sender;
        } else {
            uint256 functionCall = dataLength.sub(225);
            bytes memory message = slice(msg.data, functionCall, 160);
            bytes memory signature = slice(msg.data, functionCall.add(160), 65);
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

    function slice(
        bytes memory _bytes,
        uint256 _start,
        uint256 _length
    )
        internal
        pure
        returns (bytes memory)
    {
        require(_length + 31 >= _length, "slice_overflow");
        require(_start + _length >= _start, "slice_overflow");
        require(_bytes.length >= _start + _length, "slice_outOfBounds");

        bytes memory tempBytes;

        assembly {
            switch iszero(_length)
            case 0 {
                // Get a location of some free memory and store it in tempBytes as
                // Solidity does for memory variables.
                tempBytes := mload(0x40)

                // The first word of the slice result is potentially a partial
                // word read from the original array. To read it, we calculate
                // the length of that partial word and start copying that many
                // bytes into the array. The first word we copy will start with
                // data we don't care about, but the last `lengthmod` bytes will
                // land at the beginning of the contents of the new array. When
                // we're done copying, we overwrite the full first word with
                // the actual length of the slice.
                let lengthmod := and(_length, 31)

                // The multiplication in the next line is necessary
                // because when slicing multiples of 32 bytes (lengthmod == 0)
                // the following copy loop was copying the origin's length
                // and then ending prematurely not copying everything it should.
                let mc := add(add(tempBytes, lengthmod), mul(0x20, iszero(lengthmod)))
                let end := add(mc, _length)

                for {
                    // The multiplication in the next line has the same exact purpose
                    // as the one above.
                    let cc := add(add(add(_bytes, lengthmod), mul(0x20, iszero(lengthmod))), _start)
                } lt(mc, end) {
                    mc := add(mc, 0x20)
                    cc := add(cc, 0x20)
                } {
                    mstore(mc, mload(cc))
                }

                mstore(tempBytes, _length)

                //update free-memory pointer
                //allocating the array padded to 32 bytes like the compiler does now
                mstore(0x40, and(add(mc, 31), not(31)))
            }
            //if we want a zero-length slice let's just return a zero-length array
            default {
                tempBytes := mload(0x40)

                mstore(0x40, add(tempBytes, 0x20))
            }
        }

        return tempBytes;
    }

}
