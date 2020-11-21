const { assert } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@openzeppelin/test-helpers");
const should = require("should");
const { approveSetup, increaseTime } = require("../helpers/utils")

describe("staking contract", function() {
    let factory;
    let owner, alice, bob, relayer, charlie

    beforeEach(async () => {
		[owner, alice, bob, relayer, charlie] = await ethers.getSigners();
		let Contract = await ethers.getContractFactory("CakeToken")
		token = await Contract.deploy(relayer.address);
        Contract = await ethers.getContractFactory("CakeStaking");
		staking = await Contract.deploy(token.address, relayer.address);
		approve = approveSetup(token, staking)
	});
	//TODO this
	it("should deposit and withdraw alice 50% bob 25% charlie 25% while extra tokens added before bob and charlies deposits to multiple creators", async function() {
		const aliceDeposit = 17.5 * 1e18
		const bobDeposit = 12.5 * 1e18
		await approve(owner, "10000000000000000000000000000")
		await token.transfer(alice.address, aliceDeposit.toString())
		await token.transfer(bob.address, bobDeposit.toString())

		try {
			await staking.deposit(charlie.address, 10)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert minimum first stake"
			)

		}

		await approve(alice, aliceDeposit.toString())
		await staking.connect(alice).deposit(charlie.address, aliceDeposit.toString())
		const creatorStake = await staking.creatorStaked(charlie.address)

		const aliceStake = await staking.userStake(charlie.address, alice.address)
		assert.equal(creatorStake.toString(), aliceDeposit.toString(), "staking contract should have alice deposit")
		assert.equal(aliceStake, aliceDeposit, "alice stake should equal deposit")
		
		await staking.reward([charlie.address], [(aliceDeposit * 2).toString()])
		const creatorStake2 = await staking.creatorStaked(charlie.address)

		await approve(bob, bobDeposit.toString())
		await staking.connect(bob).deposit(charlie.address, bobDeposit.toString())

		const bobStake = await staking.userStake(charlie.address, bob.address)
		const calculatedBobDeposit = bobDeposit / 2
		
		assert.equal(bobStake.toString(), calculatedBobDeposit.toString(), "bob stake should equal deposit")

		try {
			await staking.connect(alice).withdraw(charlie.address, 10)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert wait more time"
			)

		}

		const balanceOfAliceBefore = await token.balanceOf(alice.address)
		const balanceOfBobBefore = await token.balanceOf(bob.address)

		assert.equal(balanceOfAliceBefore.toString(), "0", "alice should have no tokens")
		assert.equal(balanceOfBobBefore.toString(), "0", "bob should have no tokens")

		await increaseTime(ethers)
		await staking.connect(alice).withdraw(charlie.address, aliceStake)
		await staking.connect(bob).withdraw(charlie.address, bobStake)

		const aliceStakeAfter = await staking.userStake(charlie.address, alice.address)
		const balanceOfAliceAfter = await token.balanceOf(alice.address)

		const bobStakeAfter = await staking.userStake(charlie.address, bob.address)
		const balanceOfBobAfter = await token.balanceOf(bob.address)

		const calculatedAlicePayout = aliceDeposit * 2

		assert.equal(aliceStakeAfter.toString(), "0", "alice should have no stake")
		assert.equal(balanceOfAliceAfter, calculatedAlicePayout, "alice should have original amount of tokens")

		assert.equal(bobStakeAfter.toString(), "0", "bob should have no stake")
		assert.equal(balanceOfBobAfter, bobDeposit, "alice should have original amount of tokens")
	})
})