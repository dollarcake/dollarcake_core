const { assert } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@openzeppelin/test-helpers");
const should = require("should");
const {increaseTime } = require("../helpers/utils")

describe("global contract", function() {
    let factory;
    let owner, alice, bob, relayer, charlie
	const toChange = "40"

    beforeEach(async () => {
		[owner, alice, bob, relayer, charlie] = await ethers.getSigners();
        Contract = await ethers.getContractFactory("CakeStaking");
        staking = await Contract.deploy("cake", "cake");
	});
	
	it("should turn off global in control split", async function() {
		const controlSplitBefore = await staking.isControlingSplit()
		await staking.turnOffGlobalSplit()
		const controlSplitAfter = await staking.isControlingSplit()
		assert.equal(!controlSplitBefore, controlSplitAfter)

	})
	it("should fail from non owner turn off global in control split", async function() {
		try {
			await staking.connect(alice).turnOffGlobalSplit()
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert Ownable: caller is not the owner"
			)
		}
	})
	it("should change min initial deposit", async function() {
		await staking.changeMinInitialDeposit(toChange)
		const minInitialDeposit = await staking.minInitialDeposit()
		assert.equal(minInitialDeposit.toString(), toChange)
	})
	it("should fail to change min init deposit from non owner", async function() {
		try {
			await staking.connect(alice).changeMinInitialDeposit(toChange)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert Ownable: caller is not the owner"
			)
		}
	})
	
	it("should change global stake split", async function() {
		await staking.changeGlobalStakeSplit(toChange)
		const globalStakerSplit = await staking.globalStakerSplit()
		assert.equal(globalStakerSplit, toChange)

	})
	it("should fail to change global stake split non owner", async function() {
		try {
			await staking.connect(alice).changeGlobalStakeSplit(toChange)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert Ownable: caller is not the owner"
			)
		}
	})
	it("should change global stake split too low", async function() {
		try {
			await staking.changeGlobalStakeSplit(9)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert not in bounds"
			)
		}
		
	})
	it("should change global stake split too high", async function() {
		try {
			await staking.changeGlobalStakeSplit(91)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert not in bounds"
			)
		}
		
	})
	it("should change time lock", async function() {
		await staking.changeTimeLock(86400)
		const timeLock = await staking.timeLock()
		assert.equal(timeLock, 86400)
	})
	it("should fail to change time lock non owner", async function() {
		try {
			await staking.connect(alice).changeTimeLock(91)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert Ownable: caller is not the owner"
			)
		}
		

	})
	it("should fail to change time lock too low", async function() {
		try {
			await staking.changeTimeLock(91)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert not in bounds"
			)
		}
	})
	it("should change fee", async function() {
		await staking.changeFee(940)
		const fee = await staking.fee()
		assert.equal(fee, 940)
	})
	it("should fail to change fee non owner", async function() {
		try {
			await staking.connect(alice).changeFee(940)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert Ownable: caller is not the owner"
			)
		}
		

	})
	it("should fail to change fee too low", async function() {
		try {
			await staking.changeFee(929)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert not in bounds"
			)
		}
	})
	it("should fail to change fee too high", async function() {
		try {
			await staking.changeFee(1001)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert not in bounds"
			)
		}
	})
	it("should change dollarCake address", async function() {
		await staking.changeDollarCakeAddress(alice.address)
		const dollarCake = await staking.dollarCake()
		assert.equal(dollarCake, alice.address)
	})
	it("should fail to change dollarCake non owner", async function() {
		try {
			await staking.connect(alice).changeDollarCakeAddress(alice.address)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert Ownable: caller is not the owner"
			)
		}
		

	})

	it("should change relayer fee ", async function() {
		const newRelayerFee = "1000000000000000000"
		await staking.changeRelayerFee(newRelayerFee)
		const relayerFee = await staking.relayerFee()
		assert.equal(relayerFee.toString(), newRelayerFee)
	})
	it("should fail to change relayer fee non owner", async function() {
		try {
			await staking.connect(alice).changeRelayerFee("1000000000000000000")
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert Ownable: caller is not the owner"
			)
		}
		

	})
	it("should fail to change dollarCake number out of bounds", async function() {
		try {
			await staking.changeRelayerFee("26000000000000000000")
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert not in bounds"
			)
		}
		

	})
})