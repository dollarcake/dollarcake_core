const chai = require("chai");
const { ethers, waffle } = require("hardhat");
const { time } = require("@openzeppelin/test-helpers");
const should = require("should");
const { increaseTime } = require("../helpers/utils")

chai.use(waffle.solidity);
const { expect, assert } = chai;
const NULL_ADDRESS = `0x${"0".repeat(40)}`;

describe("snapshot contract", function() {
	let owner, alice, bob, relayer, charlie, dave, eve
	let fee
	const toTransfer = "100"
	const totalSupply = "10000000000000000000000000"
    beforeEach(async () => {
		[owner, alice, bob, relayer, charlie, dave, eve] = await ethers.getSigners();
        Contract = await ethers.getContractFactory("CakeStaking");
		staking = await Contract.deploy("cake", "cake");
		fee = await staking.fee()
		fee = fee / 1000
	});

	it('should transfer and get snapshot', async () => {
		await staking.snapshot()
		const balanceOfOwnerBefore = await staking.balanceOf(owner.address)
		await staking.transfer(alice.address, toTransfer)
		const balanceOfOAliceAt = await staking.balanceOfAt(alice.address, "1")
		const balanceOfAlice = await staking.balanceOf(alice.address)
		const balanceOfOOwnerAt = await staking.balanceOfAt(owner.address, "1")
		const totalSupplyAt = await staking.totalSupplyAt("1")
		const balanceOfOwner = await staking.balanceOf(owner.address)
		const calculatedBalanceOfOwner = balanceOfOwnerBefore.sub(ethers.BigNumber.from(toTransfer))
		assert.equal(balanceOfAlice.toString(), toTransfer, "alice should have 100 tokens")
		assert.equal(balanceOfOAliceAt.toString(), "0", "alice should have 100 tokens")


		assert.equal(balanceOfOwnerBefore.toString(), balanceOfOOwnerAt.toString(), "owner should have proper snapshot check")
		assert.equal(balanceOfOwner.toString(), calculatedBalanceOfOwner.toString(), "alice should have 100 tokens")
		assert.equal(totalSupplyAt.toString(), totalSupply)

	})
	it('should transferFrom and get snapshot', async () => {
		await staking.snapshot()
		const balanceOfOwnerBefore = await staking.balanceOf(owner.address)
		await staking.approve(alice.address, toTransfer)
		await staking.connect(alice).transferFrom(owner.address, alice.address, toTransfer)
		const balanceOfOAliceAt = await staking.balanceOfAt(alice.address, "1")
		const totalSupplyAt = await staking.totalSupplyAt("1")
		const balanceOfAlice = await staking.balanceOf(alice.address)
		const balanceOfOOwnerAt = await staking.balanceOfAt(owner.address, "1")
		const balanceOfOwner = await staking.balanceOf(owner.address)
		const calculatedBalanceOfOwner = balanceOfOwnerBefore.sub(ethers.BigNumber.from(toTransfer))
		assert.equal(balanceOfAlice.toString(), toTransfer, "alice should have 100 tokens")
		assert.equal(balanceOfOAliceAt.toString(), "0", "alice should have 100 tokens")


		assert.equal(balanceOfOwnerBefore.toString(), balanceOfOOwnerAt.toString(), "owner should have proper snapshot check")
		assert.equal(balanceOfOwner.toString(), calculatedBalanceOfOwner.toString(), "alice should have 100 tokens")
		assert.equal(totalSupplyAt.toString(), totalSupply)
	})
	it('should take a snapshot', async () => {
		const currentSnapshotBefore = await staking.currentSnapshot()
		await staking.snapshot()
		const currentSnapshotAfter = await staking.currentSnapshot()

		assert.equal(currentSnapshotBefore.toString(), "0")
		assert.equal(currentSnapshotAfter.toString(), "1")

	})

    it('should include staked funds and on exit add the interest', async () => {
		const aliceDeposit = 10 * 1e18
		await staking.transfer(alice.address, aliceDeposit.toString())
		const balanceOfAlice = await staking.balanceOf(alice.address)
		await staking.connect(alice).deposit(charlie.address, aliceDeposit.toString())
		await staking.snapshot()
		const balanceOfAliceAt = await staking.balanceOfAt(alice.address, "1")
		assert.equal(balanceOfAlice.toString(), balanceOfAliceAt.toString(), "Alice should still have snapshot")
		await staking.changeFee(1000)
		await staking.reward([charlie.address], [aliceDeposit.toString()])

		await increaseTime(ethers)
		await staking.connect(alice).withdraw(charlie.address, aliceDeposit.toString())
		await staking.snapshot()
		const balanceOfAlice2 = await staking.balanceOf(alice.address)
		const balanceOfAliceAt2 = await staking.balanceOfAt(alice.address, "2")
		assert.equal(balanceOfAliceAt2.toString(), balanceOfAlice2.toString(), "alice should have the same amount as snapshot")

		await staking.connect(alice).deposit(charlie.address, aliceDeposit.toString())
		const balanceOfAliceAt3 = await staking.balanceOfAt(alice.address, "2")

		assert.equal(balanceOfAliceAt3.toString(), balanceOfAlice2.toString(), "alice should have the same amount as snapshot")
		await staking.snapshot()
		await increaseTime(ethers)
		await staking.connect(alice).withdraw(charlie.address, aliceDeposit.toString())
		const balanceOfAliceAt4 = await staking.balanceOfAt(alice.address, "3")
		assert.equal(balanceOfAliceAt4.toString(), balanceOfAlice2.toString(), "alice should have the same amount as snapshot")

	})

	it('should include staked funds and on exit add the interest multiple stakers', async () => {
		const aliceDeposit = 10 * 1e18
		await staking.transfer(alice.address, aliceDeposit.toString())
		await staking.transfer(alice.address, aliceDeposit.toString())
		const balanceOfAlice = await staking.balanceOf(alice.address)
		await staking.connect(alice).deposit(charlie.address, aliceDeposit.toString())
		await staking.connect(alice).deposit(eve.address, aliceDeposit.toString())
		await staking.snapshot()
		const balanceOfAliceAt = await staking.balanceOfAt(alice.address, "1")
		assert.equal(balanceOfAlice.toString(), balanceOfAliceAt.toString(), "Alice should still have snapshot")
		await staking.changeFee(1000)
		await staking.reward([charlie.address], [aliceDeposit.toString()])
		await staking.reward([eve.address], [aliceDeposit.toString()])

		await increaseTime(ethers)
		await staking.connect(alice).withdraw(charlie.address, aliceDeposit.toString())
		await staking.connect(alice).withdraw(eve.address, aliceDeposit.toString())
		await staking.snapshot()
		const balanceOfAlice2 = await staking.balanceOf(alice.address)
		const balanceOfAliceAt2 = await staking.balanceOfAt(alice.address, "2")
		assert.equal(balanceOfAliceAt2.toString(), balanceOfAlice2.toString(), "alice should have the same amount as snapshot")

		await staking.connect(alice).deposit(charlie.address, aliceDeposit.toString())
		await staking.connect(alice).deposit(eve.address, aliceDeposit.toString())
		const balanceOfAlice3 = await staking.balanceOf(alice.address)
		const balanceOfAliceAt3 = await staking.balanceOfAt(alice.address, "2")
		const calculatedBalanceOfAliceAt3 = balanceOfAlice2 - (aliceDeposit * 2)

		assert.equal(balanceOfAlice3.toString(), calculatedBalanceOfAliceAt3.toString(), "alice should have been deducted tokens")
		assert.equal(balanceOfAliceAt3.toString(), balanceOfAlice2.toString(), "alice should have the same amount as snapshot")
		await staking.snapshot()
		await increaseTime(ethers)
		await staking.connect(alice).withdraw(charlie.address, aliceDeposit.toString())
		await staking.connect(alice).withdraw(eve.address, aliceDeposit.toString())
		const balanceOfAliceAt4 = await staking.balanceOfAt(alice.address, "3")
		assert.equal(balanceOfAliceAt4.toString(), balanceOfAlice2.toString(), "alice should have the same amount as snapshot")
	})
	it('should fail snapshot from non owner', async () => {
		try {
			await staking.connect(alice).snapshot()
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert Ownable: caller is not the owner"
			)

		}
	})

	it('should be ok transfering delegated tokens in and out of contract but not to others', async () => {
		try {
			await staking.connect(alice).snapshot()
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert Ownable: caller is not the owner"
			)

		}
	})
	it.only('should delegate and be unable to delegate again then undelegate', async () => {
		await staking.snapshot()
		const balance = await staking.balanceOf(owner.address)
		await staking.delegate(alice.address)
		const delegated = await staking.delegatedFrom(owner.address)
		const delegatedTo = await staking.delegatedTo(alice.address)
		assert.equal(delegated[0], alice.address)
		assert.equal(delegated[1].toString(), balance.toString())
		assert.equal(delegatedTo.toString(), balance.toString())

		
		await staking.connect(alice).delegate(owner.address)
		const delegatedToOwner = await staking.delegatedTo(owner.address)
		assert.equal(delegatedToOwner.toString(), "0", "no delegation to owner")
		try {
			await staking.delegate(alice.address)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert already delegated"
			)

		}

		await staking.undelegate()
		const delegatedAfter = await staking.delegatedFrom(owner.address)
		const delegatedToAfter = await staking.delegatedTo(alice.address)
		assert.equal(delegatedAfter[0], NULL_ADDRESS)
		assert.equal(delegatedAfter[1].toString(), "0")
		assert.equal(delegatedToAfter.toString(), "0")

	})

	it.only('should track delegation after baking', async () => {
		await staking.snapshot()
		const balance = await staking.balanceOf(owner.address)
		await staking.deposit(alice.address, balance)
		await staking.delegate(alice.address)
		const delegated = await staking.delegatedFrom(owner.address)
		const delegatedTo = await staking.delegatedTo(alice.address)
		assert.equal(delegated[0], alice.address)
		assert.equal(delegated[1].toString(), balance.toString())
		assert.equal(delegatedTo.toString(), balance.toString())	
	})
	
	it.only('should track delegation after snapshots and baking', async () => {
	})
	it.only('not allow transfer of delegated tokens', async () => {
	})
})
