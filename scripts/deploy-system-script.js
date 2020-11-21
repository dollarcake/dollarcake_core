// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
require('dotenv').config();

async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile 
	// manually to make sure everything is compiled
	
	const kovanRelayer = "0x8eee665c0f5751a924ee4fc45e0fa7d3102894af"

    let provider = ethers.getDefaultProvider(process.env.PROVIDER);
	signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
	
	// deploy token 
	const TokenContract = await ethers.getContractFactory("CakeToken", signer);
    const token = await TokenContract.deploy(kovanRelayer);
	await token.deployed()
	console.log("token contract address", token.address)

    const CakeContract = await ethers.getContractFactory("CakeStaking", signer);
    const contract = await CakeContract.deploy(token.address, kovanRelayer);
    await contract.deployed();
    console.log("cake contract address", contract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
});
