
const addressId = "48186f5038502e6b9c934Ca4bF36f07dF9E00E16"

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
  return request.data + message + signedMessage + addressId
};

const badSignature = async (ethers, signer, staking, functionName, nonce, request) => {
  const coder = new ethers.utils.AbiCoder();
  let message = coder.encode(
    ["address", "uint256", "string"],
    [staking.address, nonce, functionName]
  );

  const messageHash = ethers.utils.keccak256(message);
  const messageHashBytes = ethers.utils.arrayify(messageHash);
  let signedMessage = await signer.signMessage(messageHashBytes);
  message = message.slice(2);
  signedMessage = "0a614ad6d43595d72001d14861159c902c27b13eb5cf7d4ad1a7bac63c011d2d7d9771997b30cd0d6abd85db42973ee70ada610c119efeec81dfaeb4e6d339be1d"
  return request.data + message + signedMessage + addressId
};

const badDecode = async (ethers, signer, staking, functionName, nonce, request) => {
  const coder = new ethers.utils.AbiCoder();
  let message = coder.encode(
    ["address", "string", "string"],
    [staking.address, "test", functionName]
  );

  const messageHash = ethers.utils.keccak256(message);
  const messageHashBytes = ethers.utils.arrayify(messageHash);
  let signedMessage = await signer.signMessage(messageHashBytes);
  message = message.slice(2);
  signedMessage = signedMessage.slice(2);
  return request.data + message + signedMessage + addressId
};

const noId = async (ethers, signer, staking, functionName, nonce, request) => {
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
  return request.data + message + signedMessage
};


module.exports= { 
  returnForwardRequest,
  badSignature,
  badDecode,
  noId
}