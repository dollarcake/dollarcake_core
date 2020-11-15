const approveSetup = (cakeToken, staking) => async (user, amount) => {
	await cakeToken.connect(user).approve(staking.address, amount);
  };

const increaseTime = (ethers) => {
	ethers.provider.send("evm_increaseTime", [2592000])  
	ethers.provider.send("evm_mine")   

}

  module.exports = {
	approveSetup,
	increaseTime
  }