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
	const toTransfer = "100"
	const totalSupply = "10000000000000000000000000"
    beforeEach(async () => {
		[owner, alice, bob, relayer, charlie, dave] = await ethers.getSigners();
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
})
