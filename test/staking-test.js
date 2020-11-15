const { assert } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@openzeppelin/test-helpers");
const should = require("should");
const { approveSetup, increaseTime } = require("../helpers/utils")

describe("staking contract", function() {
    let factory;
    let owner, alice, bob, relayer, approve

    beforeEach(async () => {
		[owner, alice, bob, relayer] = await ethers.getSigners();
		let Contract = await ethers.getContractFactory("CakeToken")
		token = await Contract.deploy(relayer.address);
        Contract = await ethers.getContractFactory("CakeStaking");
		staking = await Contract.deploy(alice.address, token.address);
		approve = approveSetup(token, staking)
	});
	it("properly sets information in constructor", async function() {
		const contentCreator = await staking.contentCreator()
		const contentCreatorPortion = await staking.contentCreatorPortion()
		const stakerPortion = await staking.stakerPortion()
		const cakeToken = await staking.cakeToken()
		const timeLock = await staking.timeLock()

		assert.equal(contentCreator, alice.address)
		assert.equal(contentCreatorPortion, 50)
		assert.equal(stakerPortion, 50)
		assert.equal(cakeToken, token.address)
		assert.equal(timeLock.toString(), time.duration.days(30).toString())
	})
	it("should reward the contract properly", async function() {
		const amountToSend = "1000000000000000000"
		await token.approve(staking.address, amountToSend)
		await staking.reward(amountToSend)
		const balanceOfAlice = await token.balanceOf(alice.address)
		const balanceOfContract = await token.balanceOf(staking.address)
		const calculatedAmount = Number(amountToSend) / 2 
		
		assert.equal(balanceOfAlice.toString(), calculatedAmount.toString(), "alice should have got half the payout")
		assert.equal(balanceOfContract.toString(), calculatedAmount.toString(), "contract should have got half the payout")

	})

	it("should reward the contract properly on 75/25 split", async function() {
		await staking.setSplit(75, 25)

		const contentCreatorPortion = await staking.contentCreatorPortion()
		const stakerPortion = await staking.stakerPortion()

		assert.equal(contentCreatorPortion, 75)
		assert.equal(stakerPortion, 25)

		const amountToSend = "1000000000000000000"
		await token.approve(staking.address, amountToSend)
		await staking.reward(amountToSend)
		const balanceOfAlice = await token.balanceOf(alice.address)
		const balanceOfContract = await token.balanceOf(staking.address)
		const calculatedAmountAlice = Number(amountToSend) * 3 / 4
		const calculatedAmountContract = Number(amountToSend) / 4
		
		assert.equal(balanceOfAlice.toString(), calculatedAmountAlice.toString(), "alice should have got half the payout")
		assert.equal(balanceOfContract.toString(), calculatedAmountContract.toString(), "contract should have got half the payout")
	})
	it("should fail to split _newContentCreatorPortion too high", async function() {
		try {
			await staking.setSplit(91, 9)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert not in bounds"
			)
		}
	})
	it("should fail to split _newContentCreatorPortion too low", async function() {
		try {
			await staking.setSplit(90, 9)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert not in bounds"
			)
		}
	})
	it("should fail to split _newStakerPortion too high", async function() {
		try {
			await staking.setSplit(10, 91)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert not in bounds"
			)
		}
	})
	it("should fail to split _newStakerPortion too low", async function() {
		try {
			await staking.setSplit(90, 9)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert not in bounds"
			)
		}
	})
	it("should fail to split total not 100", async function() {
		try {
			await staking.setSplit(60, 60)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert not in bounds"
			)
		}
	})
	it("should deposit and withdraw alice 75% bob 25%", async function() {
		const aliceDeposit = 17.5 * 1e18
		const bobDeposit = 12.5 * 1e18
		await approve(owner, 10)
		await token.transfer(alice.address, aliceDeposit.toString())
		await token.transfer(bob.address, bobDeposit.toString())

		try {
			await staking.deposit(10)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert minimum first stake"
			)

		}

		await approve(alice, aliceDeposit.toString())
		await staking.connect(alice).deposit(aliceDeposit.toString())

		const aliceStake = await staking.userStake(alice.address)
		assert.equal(aliceStake, aliceDeposit, "alice stake should equal deposit")

		await approve(bob, bobDeposit.toString())
		await staking.connect(bob).deposit(bobDeposit.toString())

		const bobStake = await staking.userStake(bob.address)
		
		assert.equal(bobStake.toString(), bobDeposit.toString(), "bob stake should equal deposit")

		try {
			await staking.connect(alice).withdraw(10)
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
		await staking.connect(alice).withdraw(aliceStake)
		await staking.connect(bob).withdraw(bobStake)

		const aliceStakeAfter = await staking.userStake(alice.address)
		const balanceOfAliceAfter = await token.balanceOf(alice.address)

		const bobStakeAfter = await staking.userStake(bob.address)
		const balanceOfBobAfter = await token.balanceOf(bob.address)

		assert.equal(aliceStakeAfter.toString(), "0", "alice should have no stake")
		assert.equal(balanceOfAliceAfter, aliceDeposit, "alice should have original amount of tokens")

		assert.equal(bobStakeAfter.toString(), "0", "bob should have no stake")
		assert.equal(balanceOfBobAfter, bobDeposit, "alice should have original amount of tokens")
	})

	it("should deposit and withdraw alice 75% bob 25% while extra tokens added before bob deposits", async function() {
		const aliceDeposit = 17.5 * 1e18
		const bobDeposit = 12.5 * 1e18
		await approve(owner, 10)
		await token.transfer(alice.address, aliceDeposit.toString())
		await token.transfer(bob.address, bobDeposit.toString())

		try {
			await staking.deposit(10)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert minimum first stake"
			)

		}

		await approve(alice, aliceDeposit.toString())
		await staking.connect(alice).deposit(aliceDeposit.toString())

		const aliceStake = await staking.userStake(alice.address)
		assert.equal(aliceStake, aliceDeposit, "alice stake should equal deposit")
		
		await token.transfer(staking.address, aliceDeposit.toString())
		await approve(bob, bobDeposit.toString())
		await staking.connect(bob).deposit(bobDeposit.toString())

		const bobStake = await staking.userStake(bob.address)
		const calculatedBobDeposit = bobDeposit / 2
		
		assert.equal(bobStake.toString(), calculatedBobDeposit.toString(), "bob stake should equal deposit")

		try {
			await staking.connect(alice).withdraw(10)
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
		await staking.connect(alice).withdraw(aliceStake)
		await staking.connect(bob).withdraw(bobStake)

		const aliceStakeAfter = await staking.userStake(alice.address)
		const balanceOfAliceAfter = await token.balanceOf(alice.address)

		const bobStakeAfter = await staking.userStake(bob.address)
		const balanceOfBobAfter = await token.balanceOf(bob.address)

		const calculatedAlicePayout = aliceDeposit * 2

		assert.equal(aliceStakeAfter.toString(), "0", "alice should have no stake")
		assert.equal(balanceOfAliceAfter, calculatedAlicePayout, "alice should have original amount of tokens")

		assert.equal(bobStakeAfter.toString(), "0", "bob should have no stake")
		assert.equal(balanceOfBobAfter, bobDeposit, "alice should have original amount of tokens")
	})


})