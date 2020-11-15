const { assert } = require("chai");
const { ethers } = require("hardhat");
const {expectEvent} = require("@openzeppelin/test-helpers");

describe("factory contract", function() {
    let factory;
    let owner, alice, bob

    beforeEach(async () => {
        [owner, alice, bob] = await ethers.getSigners();
        let Contract = await ethers.getContractFactory("CakeFactory");
        factory = await Contract.deploy(bob.address, bob.address);
	});
	it("launch a new contract with proper constructors", async function() {
		const tx = await factory.createCakeStaking()
		const stakingContracts = await factory.stakingContracts(0)
		const count = await factory.totalStakingContracts()
		assert.equal(ethers.utils.isAddress(stakingContracts), true, "staking contract should have been logged correctly")
		assert.equal(count, 1, "there should be a staking contract")

		//TODO make calls to check setup of staking
		
	})
})