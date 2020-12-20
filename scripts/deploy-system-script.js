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
	

    const CakeContract = await ethers.getContractFactory("CakeStaking", signer);
    const contract = await CakeContract.deploy("Cake", "Cake");
    await contract.deployed();
    console.log("cake contract address", contract.address);

    // transfers all tokens and ownership to new address
    const mainAddress = "0x3fD861afc57b2A3E0BCcbD39cFB4F3D88E798D42"
    const tx1 = await contract.transferOwnership(mainAddress)
    await provider.waitForTransaction(tx1.hash)
    console.log("ownership transfer", tx1)
    const tx2 = await contract.transfer(mainAddress, "10000000000000000000000000")
    await provider.waitForTransaction(tx2.hash)
    console.log("tokens tramsfer", tx2)
    const tx3 = await contract.changeDollarCakeAddress(mainAddress)
    console.log("fee address changed", tx3)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
});
