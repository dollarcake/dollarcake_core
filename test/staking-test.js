const chai = require("chai");
const { ethers, waffle } = require("hardhat");
const { time } = require("@openzeppelin/test-helpers");
const should = require("should");
const { increaseTime } = require("../helpers/utils")

chai.use(waffle.solidity);
const { expect, assert } = chai;

describe("staking contract", function() {
	let owner, alice, bob, relayer, charlie, dave
	let fee

    beforeEach(async () => {
		[owner, alice, bob, relayer, charlie, dave] = await ethers.getSigners();
        Contract = await ethers.getContractFactory("CakeStaking");
		staking = await Contract.deploy("cake", "cake");
		fee = await staking.fee()
		fee = fee / 1000
	});

	it("properly sets information in constructor", async function() {
		const timeLock = await staking.timeLock()
		assert.equal(timeLock.toString(), time.duration.days(30).toString())
	})
	it("should reward the contract properly", async function() {
		await staking.changeDollarCakeAddress(dave.address)
		const receivers = [alice.address, bob.address]
		const amountToSend = ["1000000000000000000", "1000000000000000000"]
		const amountToSendMinusFee = Number(amountToSend[1]) * fee
		const dollarCakeFee = Number(amountToSend[1]) * (1 - fee).toFixed(2)
		await expect(staking.reward(receivers, amountToSend)).to.emit(staking, "Reward").withArgs(receivers[1], amountToSend[1], (amountToSendMinusFee / 2).toString(), (amountToSendMinusFee / 2).toString(), dollarCakeFee.toString())

		
		const balanceOfAlice = await staking.balanceOf(alice.address)
		const balanceOfBob = await staking.balanceOf(bob.address)
		const aliceStake = await staking.creatorStaked(alice.address)
		const bobStake = await staking.creatorStaked(bob.address)
		const balanceOfContract = await staking.balanceOf(staking.address)
		const calculatedAmount = Number(amountToSend[0]) / 2 * fee
		const cakeAddressBalance = await staking.balanceOf(dave.address)
		const calculatedCakeAddressBalance = dollarCakeFee * 2
		assert.equal(balanceOfAlice.toString(), calculatedAmount.toString(), "alice should have got half the payout")
		assert.equal(aliceStake.toString(), calculatedAmount.toString(), "contract should have got half the payout")
		assert.equal(balanceOfBob.toString(), calculatedAmount.toString(), "alice should have got half the payout")
		assert.equal(bobStake.toString(), calculatedAmount.toString(), "contract should have got half the payout")
		assert.equal(balanceOfContract.toString(), (calculatedAmount.toString() * 2), "contract should have got half the payout")
		assert.equal(cakeAddressBalance.toString(), calculatedCakeAddressBalance.toString(), "cake address should have got rewarded")
	})
	it("should load test the reward function", async function() {
		const receivers = Array(120).fill(alice.address)
		const amountToSend = Array(120).fill("1000000000000000000")
		await staking.reward(receivers, amountToSend)
	})
	it("should fail to reward mismatch", async function() {
		const receivers = [alice.address, bob.address, alice.address]
		const amounts = ["10", "10"]
		try {
			await staking.reward(receivers, amounts)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert mismatch"
			)

		}
	})
	it("should reward the contract properly on 75/25 split", async function() {
		await staking.turnOffGlobalSplit()
		await expect(staking.connect(alice).setSplit(25)).to.emit(staking, "SplitUpdated").withArgs(alice.address, "25")

		const stakerPortion = await staking.stakerSplit(alice.address)

		assert.equal(stakerPortion, 25)

		const amountToSend = "1000000000000000000"
		await staking.reward([alice.address], [amountToSend])
		const balanceOfAlice = await staking.balanceOf(alice.address)
		const balanceOfContract = await staking.balanceOf(staking.address)
		const calculatedAmountAlice = Number(amountToSend) * 3 / 4 * fee
		const calculatedAmountContract = Number(amountToSend) / 4 * fee
		
		assert.equal(balanceOfAlice.toString(), calculatedAmountAlice.toString(), "alice should have got half the payout")
		assert.equal(balanceOfContract.toString(), calculatedAmountContract.toString(), "contract should have got half the payout")
	})
	
	it("should fail to split _newStakerPortion too high", async function() {
		try {
			await staking.setSplit(91)
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
			await staking.setSplit(9)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert not in bounds"
			)
		}
	})
	it("should fail to split _newStakerPortion during time lock then be allowed after timelock", async function() {
		await staking.turnOffGlobalSplit()
		await staking.connect(alice).setSplit(25)
		const stakerPortion = await staking.stakerSplit(alice.address)
		assert.equal(stakerPortion, 25)

		try {
			await staking.connect(alice).setSplit(40)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert wait more time"
			)
		}

		await increaseTime(ethers)

		await staking.connect(alice).setSplit(40)
		const stakerPortion2 = await staking.stakerSplit(alice.address)
		assert.equal(stakerPortion2, 40)


	})
	it("should reward staking pool only", async function() {
		const receivers = [alice.address, bob.address]
		const amounts = ["10", "10"]

		await expect(staking.rewardStakingPoolOnly(receivers, amounts)).to.emit(staking, "Reward").withArgs(receivers[1], amounts[1], amounts[1], "0", "0")

		const stakingBalance = await staking.balanceOf(staking.address)
		const aliceStakingBalance = await staking.creatorStaked(receivers[0])
		const bobStakingBalance = await staking.creatorStaked(receivers[1])

		assert.equal(stakingBalance.toString(), "20")
		assert.equal(aliceStakingBalance.toString(), amounts[0])
		assert.equal(bobStakingBalance.toString(), amounts[1])

	})
	it("should fail to reward staking pool only mismatch", async function() {
		const receivers = [alice.address, bob.address, alice.address]
		const amounts = ["10", "10"]
		try {
			await staking.rewardStakingPoolOnly(receivers, amounts)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert mismatch"
			)

		}
	})
	it("should deposit and withdraw alice 75% bob 25%", async function() {
		const aliceDeposit = 17.5 * 1e18
		const bobDeposit = 12.5 * 1e18
		await staking.transfer(alice.address, aliceDeposit.toString())
		await staking.transfer(bob.address, bobDeposit.toString())

		try {
			await staking.deposit(charlie.address, 10)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert minimum first stake"
			)

		}

		await expect(staking.connect(alice).deposit(charlie.address, aliceDeposit.toString())).to.emit(staking, "UserDeposit").withArgs(alice.address, charlie.address, aliceDeposit.toString(), aliceDeposit.toString())

		const aliceStake = await staking.userStake(charlie.address, alice.address)
		assert.equal(aliceStake, aliceDeposit, "alice stake should equal deposit")

		await staking.connect(bob).deposit(charlie.address, bobDeposit.toString())

		const bobStake = await staking.userStake(charlie.address, bob.address)
		
		assert.equal(bobStake.toString(), bobDeposit.toString(), "bob stake should equal deposit")

		try {
			await staking.connect(alice).withdraw(charlie.address, 10)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert wait more time"
			)

		}

		const balanceOfAliceBefore = await staking.balanceOf(alice.address)
		const balanceOfBobBefore = await staking.balanceOf(bob.address)

		assert.equal(balanceOfAliceBefore.toString(), "0", "alice should have no tokens")
		assert.equal(balanceOfBobBefore.toString(), "0", "bob should have no tokens")

		await increaseTime(ethers)
		await expect(staking.connect(alice).withdraw(charlie.address, aliceDeposit.toString())).to.emit(staking, "UserWithdrawal").withArgs(alice.address, charlie.address, aliceDeposit.toString(), aliceDeposit.toString())
		await staking.connect(bob).withdraw(charlie.address, bobStake)
		
		try {
			// try to withdraw more than you have
			await staking.connect(alice).withdraw(charlie.address, 10)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert SafeMath: division by zero"
			)
		}

		const aliceStakeAfter = await staking.userStake(charlie.address, alice.address)
		const balanceOfAliceAfter = await staking.balanceOf(alice.address)

		const bobStakeAfter = await staking.userStake(charlie.address, bob.address)
		const balanceOfBobAfter = await staking.balanceOf(bob.address)

		assert.equal(aliceStakeAfter.toString(), "0", "alice should have no stake")
		assert.equal(balanceOfAliceAfter, aliceDeposit, "alice should have original amount of tokens")

		assert.equal(bobStakeAfter.toString(), "0", "bob should have no stake")
		assert.equal(balanceOfBobAfter, bobDeposit, "alice should have original amount of tokens")
	})

	it("should deposit and withdraw alice 75% bob 25% while extra tokens added before bob deposits", async function() {
		const aliceDeposit = 17.5 * 1e18
		const bobDeposit = 12.5 * 1e18
		await staking.transfer(alice.address, aliceDeposit.toString())
		await staking.transfer(bob.address, bobDeposit.toString())

		try {
			await staking.deposit(charlie.address, 10)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert minimum first stake"
			)

		}
		await staking.connect(alice).deposit(charlie.address, aliceDeposit.toString())
		const creatorStake = await staking.creatorStaked(charlie.address)

		const aliceStake = await staking.userStake(charlie.address, alice.address)
		assert.equal(creatorStake.toString(), aliceDeposit.toString(), "staking contract should have alice deposit")
		assert.equal(aliceStake, aliceDeposit, "alice stake should equal deposit")
		
		await staking.reward([charlie.address], [(aliceDeposit * 2).toString()])
		const creatorStake2 = await staking.creatorStaked(charlie.address)

		await staking.connect(bob).deposit(charlie.address, bobDeposit.toString())

		const bobStake = await staking.userStake(charlie.address, bob.address)
		const calculatedBobDeposit = bobDeposit / 2 * fee
		
		assert.equal(bobStake.toString(), "6410256410256410256", "bob stake should equal deposit")

		try {
			await staking.connect(alice).withdraw(charlie.address, 10)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert wait more time"
			)

		}

		const balanceOfAliceBefore = await staking.balanceOf(alice.address)
		const balanceOfBobBefore = await staking.balanceOf(bob.address)

		assert.equal(balanceOfAliceBefore.toString(), "0", "alice should have no tokens")
		assert.equal(balanceOfBobBefore.toString(), "0", "bob should have no tokens")

		await increaseTime(ethers)

		// check to see if staking somewhere else locks alice 
		await staking.transfer(alice.address, aliceDeposit.toString())
		await staking.connect(alice).deposit(dave.address, aliceDeposit.toString())

		const withdrawPayout = await staking.withdrawPayout(charlie.address, aliceStake)
		await staking.connect(alice).withdraw(charlie.address, aliceStake)
		await staking.connect(bob).withdraw(charlie.address, bobStake)

		const aliceStakeAfter = await staking.userStake(charlie.address, alice.address)
		const balanceOfAliceAfter = await staking.balanceOf(alice.address)
		
		const bobStakeAfter = await staking.userStake(charlie.address, bob.address)
		const balanceOfBobAfter = await staking.balanceOf(bob.address)
		const calculatedAlicePayout = aliceDeposit * 2

		assert.equal(aliceStakeAfter.toString(), "0", "alice should have no stake")
		assert.equal(withdrawPayout.toString(), "34125000000000000000", "getter function should work properly")
		assert.equal(balanceOfAliceAfter.toString(), "34125000000000000000", "alice should have original amount of tokens")

		assert.equal(bobStakeAfter.toString(), "0", "bob should have no stake")
		assert.equal(balanceOfBobAfter, bobDeposit, "alice should have original amount of tokens")
	})
})