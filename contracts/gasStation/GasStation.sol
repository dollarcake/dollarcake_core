//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.0;

import "hardhat/console.sol";
import '@openzeppelin/contracts/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
contract GasStation {
	using SafeMath for uint256;

    uint256 constant messageLength = 160;
    uint256 constant signatureLength = 65;
    uint256 constant minDataSize = 250;
    uint256 constant idLength = 20;
    address constant gasStationId = address(0x48186f5038502e6b9c934Ca4bF36f07dF9E00E16);
    mapping(address => uint256) public nonce;
    /**
     * @dev Replacement for msg.sender. Returns the actual sender of a transaction: msg.sender for regular transactions,
     * and the end-user for GSN relayed calls (where msg.sender is actually `RelayHub`).
     *
     * IMPORTANT: Contracts derived from {GSNRecipient} should never use `msg.sender`, and use {_msgSender} instead.
     */
    function _msgSender(string memory _function) internal virtual returns (address payable) {
        uint256 dataLength = msg.data.length;
        if (dataLength < minDataSize) {
            return msg.sender;
        } 
        
        if (_getAddress() != gasStationId) {
            return msg.sender;
        }

        uint256 functionCall = dataLength.sub(messageLength.add(signatureLength).add(idLength));
        bytes memory message = slice(msg.data, functionCall, messageLength);
        bytes memory signature = slice(msg.data, functionCall.add(messageLength), signatureLength);
        return _getRelayedCallSender(message, signature, _function);
    }

    function _getRelayedCallSender(bytes memory _message, bytes memory _signature, string memory _function)
        internal
        returns (address payable)
    {
        bytes32 hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(_message)));
        address returnedAddress = ECDSA.recover(hash, _signature);
        uint256 currentNonce = nonce[returnedAddress];
        _validateMessage(_message, currentNonce, _function);
        
        nonce[returnedAddress] = nonce[returnedAddress].add(1);
        return payable(returnedAddress);
    }

    function _validateMessage(bytes memory _message, uint256 _nonce, string memory _function) internal view {
        (address cake, uint256 userNonce, string memory userFunction) = abi.decode(_message, (address, uint256, string));
        require(cake == address(this), "address");
        require(userNonce == _nonce, "replay");
        require(
            keccak256(abi.encodePacked(_function)) == keccak256(abi.encodePacked(userFunction)),
            "functionName"
        );       
    }

     function _getAddress()
        private
        pure
        returns (address payable result)
    {
        // We need to read 20 bytes (an address) located at array index msg.data.length - 20. In memory, the array
        // is prefixed with a 32-byte length value, so we first add 32 to get the memory read index. However, doing
        // so would leave the address in the upper 20 bytes of the 32-byte word, which is inconvenient and would
        // require bit shifting. We therefore subtract 12 from the read index so the address lands on the lower 20
        // bytes. This can always be done due to the 32-byte prefix.

        // The final memory read index is msg.data.length - 20 + 32 - 12 = msg.data.length. Using inline assembly is the
        // easiest/most-efficient way to perform this operation.

        // These fields are not accessible from assembly
        bytes memory array = msg.data;
        uint256 index = msg.data.length;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            // Load the 32 bytes word from memory with the address on the lower 20 bytes, and mask those.
            result := and(
                mload(add(array, index)),
                0xffffffffffffffffffffffffffffffffffffffff
            )
        }
        return result;
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
