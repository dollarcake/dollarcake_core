const returnForwardRequest = async (ethers, signer, staking, functionName, nonce, request) => {
  const coder = new ethers.utils.AbiCoder();
  let message = coder.encode(
    ["address", "uint256", "string"],
    [staking.address, nonce, functionName]
  );

  const messageHash = ethers.utils.keccak256(message);
  const messageHashBytes = ethers.utils.arrayify(messageHash);
  let signedMessage = await signer.signMessage(messageHashBytes);
  message = message.slice(2);
  signedMessage = signedMessage.slice(2);
  const addressId = "48186f5038502e6b9c934Ca4bF36f07dF9E00E16"
  return request.data + message + signedMessage + addressId
};

module.exports= { 
	returnForwardRequest
}