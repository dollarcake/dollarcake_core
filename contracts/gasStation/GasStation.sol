//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.11;

import "hardhat/console.sol";
import "../openzeppelin/cryptography/ECDSA.sol";
import "../openzeppelin/math/SafeMath.sol";
import "../control/Global.sol";

contract GasStation is Global {
    using SafeMath for uint256;

    // message length of relayed message
    uint256 constant messageLength = 256;
    // signature length of relayed message
    uint256 constant signatureLength = 65;
    uint256 constant minDataSize = 300;
    // size of id to double check if call is meant to be realyed
    uint256 constant idLength = 20;
    // id, unique address to affix to all relayed messages
    address constant gasStationId =
        address(0x7F390Fb36033fb8d9731B105077976858Ca57668);
    mapping(address => uint256) public nonce;
    mapping(address => bool) public relayer;

    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual {}

    /**
     * @dev Replacement for msg.sender. Returns the actual sender of a transaction: msg.sender for regular transactions,
     * and the end-user for GSN relayed calls (where msg.sender is actually `RelayHub`).
     *
     * IMPORTANT: Contracts derived from {GSNRecipient} should never use `msg.sender`, and use {_msgSender} instead.
     */
    function _msgSender(
        string memory _function,
        address address1,
        uint256 number1,
        address address2
    ) internal virtual returns (address payable) {
        // if there is no data affixed to msg, not a relayer
        if (msg.data.length < minDataSize) {
            return msg.sender;
        }
       
        if (!relayer[msg.sender]) {
            return msg.sender;
        }

        uint256 functionCall =
            msg.data.length.sub(
                messageLength.add(signatureLength).add(idLength)
            );
        bytes memory message = slice(msg.data, functionCall, messageLength);
        bytes memory signature =
            slice(msg.data, functionCall.add(messageLength), signatureLength);

        address payable returnedAddress =
            _getRelayedCallSender(message, signature);
        _preValidate(
            message,
            _function,
            address1,
            number1,
            address2,
            nonce[returnedAddress]
        );
        nonce[returnedAddress] = nonce[returnedAddress].add(1);
        // gas check
        if (relayerFee != 0) {
            // token fee
            _transfer(returnedAddress, msg.sender, relayerFee);
        }
        return returnedAddress;
    }

    /**
     * @dev decompiles message and sends it to be validated
     */
    function _preValidate(
        bytes memory _message,
        string memory _function,
        address _address1,
        uint256 _number1,
        address _address2,
        uint256 _nonce
    ) internal view {
        (
            address cake,
            uint256 userNonce,
            string memory userFunction,
            address userAddress1,
            uint256 userNumber1,
            address userAddress2
        ) =
            abi.decode(
                _message,
                (address, uint256, string, address, uint256, address)
            );
        _validateMessage(
            _function,
            _address1,
            _number1,
            _address2,
            userAddress1,
            userNumber1,
            userAddress2,
            cake,
            _nonce,
            userNonce,
            userFunction
        );
    }

    /**
     * @dev gets an address of the user from signature
     */
    function _getRelayedCallSender(
        bytes memory _message,
        bytes memory _signature
    ) internal pure returns (address payable) {
        bytes32 hash =
            keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    keccak256(_message)
                )
            );
        address returnedAddress = ECDSA.recover(hash, _signature);
        return payable(returnedAddress);
    }

    /**
     * @dev validates message is the same as relayer call, as well as not a replay
     */
    function _validateMessage(
        string memory _function,
        address _address1,
        uint256 _number1,
        address _address2,
        address _userAddress1,
        uint256 userNumber1,
        address _userAddress2,
        address cake,
        uint256 userNonce,
        uint256 _nonce,
        string memory userFunction
    ) internal view {
        require(cake == address(this), "address");
        require(userNonce == _nonce, "replay");
        require(
            keccak256(abi.encodePacked(_function)) ==
                keccak256(abi.encodePacked(userFunction)),
            "functionName"
        );
        require(_address1 == _userAddress1, "params");
        require(_number1 == userNumber1, "params");
        require(_address2 == _userAddress2, "params");
    }

   function declareRelayer() public {
       relayer[msg.sender] = true;
   }

   function undeclareRelayer() public {
       relayer[msg.sender] = false;
   }

    function slice(
        bytes memory _bytes,
        uint256 _start,
        uint256 _length
    ) internal pure returns (bytes memory) {
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
                    let mc := add(
                        add(tempBytes, lengthmod),
                        mul(0x20, iszero(lengthmod))
                    )
                    let end := add(mc, _length)

                    for {
                        // The multiplication in the next line has the same exact purpose
                        // as the one above.
                        let cc := add(
                            add(
                                add(_bytes, lengthmod),
                                mul(0x20, iszero(lengthmod))
                            ),
                            _start
                        )
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
