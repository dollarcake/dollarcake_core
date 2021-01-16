const { assert } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@openzeppelin/test-helpers");
const should = require("should");
const { increaseTime } = require("../helpers/utils")

describe("long form staking contract", function() {
    let factory;
	let owner, alice, bob, relayer, charlie, dave, erin
	let fee

    beforeEach(async () => {
		[owner, alice, bob, relayer, charlie, dave, erin] = await ethers.getSigners();
        Contract = await ethers.getContractFactory("CakeStaking");
		staking = await Contract.deploy("cake", "cake");
		fee = await staking.fee()
		fee = fee / 1000
	});
	it("should deposit and withdraw alice bob dave while extra tokens added before bob and charlies deposits to multiple creators", async function() {
		// roles, stakers, alice bob dave, CC charlie, erin
		const aliceDeposit = 20 * 1e18
		const bobDeposit = 10 * 1e18
		const daveDeposit = 10 * 1e18 

		await staking.transfer(alice.address, (aliceDeposit * 2).toString())
		await staking.transfer(bob.address, (bobDeposit * 2 ).toString())
		await staking.transfer(dave.address, (daveDeposit).toString())

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
		await staking.connect(alice).deposit(erin.address, aliceDeposit.toString())

		const creatorStake = await staking.creatorStaked(charlie.address)
		const creatorStakeErin = await staking.creatorStaked(erin.address)

		const aliceStake = await staking.userStake(charlie.address, alice.address)
		const aliceStakeErin = await staking.userStake(erin.address, alice.address)

		assert.equal(creatorStake.toString(), aliceDeposit.toString(), "staking contract should have alice deposit")
		assert.equal(creatorStakeErin.toString(), aliceDeposit.toString(), "Erin staking contract should have alice deposit")

		assert.equal(aliceStake, aliceDeposit, "alice stake should equal deposit")
		
		await staking.reward([charlie.address], [(aliceDeposit * 2).toString()])

		await staking.connect(bob).deposit(charlie.address, bobDeposit.toString())
		await staking.connect(bob).deposit(erin.address, bobDeposit.toString())
		await staking.reward([erin.address], [(aliceDeposit * 2).toString()])


		await staking.connect(dave).deposit(erin.address, daveDeposit.toString())
		const bobStake = await staking.userStake(charlie.address, bob.address)
		const bobStakeErin = await staking.userStake(erin.address, bob.address)

		const daveStakeErin = await staking.userStake(erin.address, dave.address)
		const daveStakeCharlie = await staking.userStake(charlie.address, dave.address)
		const aliceWithdrawable = await staking.withdrawable([charlie.address, erin.address], alice.address)
		const aliceWithdrawableCharlie = await staking.withdrawPayout(charlie.address, aliceStake)
		const aliceWithdrawableErin = await staking.withdrawPayout(erin.address, aliceStakeErin)

		assert.equal(aliceWithdrawable[0].toString(), aliceWithdrawableCharlie.toString())
		assert.equal(aliceWithdrawable[1].toString(), aliceWithdrawableErin.toString())
		assert.equal(daveStakeCharlie.toString(), "0", "dave should have no stake in charlie")
		assert.equal (daveStakeErin.toString(), "6122448979591836734", "dave should get proportionally less")
		assert.equal(bobStake.toString(), "5128205128205128205", "bob stake should be correct")
		assert.equal(bobStakeErin.toString(), bobDeposit.toString(), "bob stake should equal deposit")

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
		const balanceOfDaveBefore = await staking.balanceOf(dave.address)

		assert.equal(balanceOfAliceBefore.toString(), "0", "alice should have no tokens")
		assert.equal(balanceOfBobBefore.toString(), "0", "bob should have no tokens")
		assert.equal(balanceOfDaveBefore.toString(), "0", "dave should have no tokens")

		await increaseTime(ethers)
		await staking.connect(alice).withdraw(charlie.address, aliceStake)
		await staking.connect(bob).withdraw(charlie.address, bobStake)
		await staking.connect(dave).withdraw(erin.address, daveStakeErin)

		const aliceStakeAfter = await staking.userStake(charlie.address, alice.address)
		const balanceOfAliceAfter = await staking.balanceOf(alice.address)

		const bobStakeAfter = await staking.userStake(charlie.address, bob.address)
		const balanceOfBobAfter = await staking.balanceOf(bob.address)

		const daveStakeAfter = await staking.userStake(erin.address, dave.address)
		const balanceOfDaveAfter = await staking.balanceOf(dave.address)

		// handle calling with no stake
		const aliceWithdrawableAfter = await staking.withdrawable([charlie.address, erin.address], alice.address)
		assert.equal(aliceWithdrawableAfter[0].toString(), "0")
		assert.equal(aliceWithdrawableAfter[1].toString(), aliceWithdrawableErin.toString())

		const calculatedAlicePayout = aliceDeposit + (aliceDeposit * fee)

		assert.equal(aliceStakeAfter.toString(), "0", "alice should have no stake")
		assert.equal(balanceOfAliceAfter.toString(), calculatedAlicePayout.toString(), "alice should have original amount of tokens")

		assert.equal(bobStakeAfter.toString(), "0", "bob should have no stake")
		assert.equal(balanceOfBobAfter, bobDeposit, "alice should have original amount of tokens")

		assert.equal(daveStakeAfter.toString(), "0", "dave should have no stake")
		assert.closeTo(Number(balanceOfDaveAfter), Number(daveDeposit), 1,"dave should have original amount of tokens")
	})
	it("should deposit 10 leave 1 wei and then not screw up math", async function() {
		const deposit = 10 * 1e18
		const deposit2 = ethers.BigNumber.from("1000000000000000000000")
		await staking.transfer(alice.address, deposit.toString())
		await staking.connect(alice).deposit(charlie.address, deposit.toString())
		await increaseTime(ethers)
		await staking.connect(alice).withdraw(charlie.address, (deposit - 10000).toString())
		const creatorStake = await staking.creatorStaked(charlie.address)
		await staking.transfer(alice.address, deposit2)
		await staking.connect(alice).deposit(charlie.address, (deposit2.sub(ethers.BigNumber.from("10000"))))
		const aliceStake = await staking.userStake(charlie.address, alice.address)
		assert.equal(aliceStake.toString(), deposit2.toString())
	})
})