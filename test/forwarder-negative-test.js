const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { returnForwardRequest, badSignature, badDecode, noId } = require("../helpers/signing.js")
const should = require("should");
const { increaseTime } = require("../helpers/utils");

describe("Forwarder negative tests", function() {
    let staking;
    let owner, alice, bob, relayer, charlie
    const NULL_ADDRESS = `0x${"0".repeat(40)}`;

    beforeEach(async () => {
		[owner, alice, bob, relayer, charlie] = await ethers.getSigners();
        let Contract = await ethers.getContractFactory("CakeStaking");
        staking = await Contract.deploy("cake", "cake");
	});
	
	it("fail with bad signature", async function() {
		const request = await staking.connect(relayer).populateTransaction.setSplit(45);
        const nonce = await staking.nonce(owner.address)
        const newData = await badSignature(ethers, owner, staking, "setSplit", nonce, request, {to: NULL_ADDRESS, amount: 45, from: NULL_ADDRESS})   
		request.data = newData
		try {
			await relayer.sendTransaction(request);
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert ECDSA: invalid signature 'v' value"
			)
		}
	})
	it("fail with bad decode", async function() {
		const request = await staking.connect(relayer).populateTransaction.setSplit(45);
        const nonce = await staking.nonce(owner.address)
        const newData = await badDecode(ethers, owner, staking, "setSplit", nonce, request, {to: NULL_ADDRESS, amount: 45, from: NULL_ADDRESS})   
		request.data = newData
		try {
			await relayer.sendTransaction(request);
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"Transaction reverted for an unrecognized reason. Please report this to help us improve Hardhat."
			)
		}
	})

	it("fail on replay", async function() {
		const request = await staking.connect(relayer).populateTransaction.setSplit(45);
        const nonce = await staking.nonce(owner.address)
        const newData = await returnForwardRequest(ethers, owner, staking, "setSplit", nonce, request, {to: NULL_ADDRESS, amount: 45, from: NULL_ADDRESS})   
        request.data = newData
		await relayer.sendTransaction(request);
		try {
			await relayer.sendTransaction(request);
			should.fail("The call should have failed but didn't")
		} catch (e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert replay"
			)			
		}
	})
	it("fail on wrong address sent to", async function() {
		const request = await staking.connect(relayer).populateTransaction.setSplit(45);
        const nonce = await staking.nonce(owner.address)
        const newData = await returnForwardRequest(ethers, owner, alice, "setSplit", nonce, request, {to: NULL_ADDRESS, amount: 45, from: NULL_ADDRESS})   
        request.data = newData
		try {
			await relayer.sendTransaction(request);
			should.fail("The call should have failed but didn't")
		} catch (e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert address"
			)			
		}	
	})
	it("fail on wrong function name", async function() {
		const request = await staking.connect(relayer).populateTransaction.setSplit(45);
        const nonce = await staking.nonce(owner.address)
        const newData = await returnForwardRequest(ethers, owner, staking, "transfer", nonce, request, {to: NULL_ADDRESS, amount: 45, from: NULL_ADDRESS})   
        request.data = newData
		try {
			await relayer.sendTransaction(request);
			should.fail("The call should have failed but didn't")
		} catch (e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert functionName"
			)			
		}	
	})
	it("should ignore signature and message if address is not affixed", async function() {
		const amountToTransfer = '1'
        const request = await staking.connect(relayer).populateTransaction.transfer(alice.address, amountToTransfer);
        const nonce = await staking.nonce(owner.address)
        const newData = await noId(ethers, owner, staking, "transfer", nonce, request, {to: alice.address, amount: amountToTransfer, from: NULL_ADDRESS})   
        request.data = newData
		try {
			await relayer.sendTransaction(request);
			should.fail("The call should have failed but didn't")
		} catch (e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert ERC20: transfer amount exceeds balance"
			)			
		}	
	})
	it("should ignore signature and message if address is not affixed 2", async function() {
		const amountToTransfer = '1'
        const request = await staking.connect(owner).populateTransaction.transfer(alice.address, amountToTransfer);
        const nonce = await staking.nonce(alice.address)
        const newData = await noId(ethers, alice, staking, "transfer", nonce, request, {to: alice.address, amount: amountToTransfer, from: NULL_ADDRESS})   
		request.data = newData
		const balanceOfOwnerBefore = await staking.balanceOf(owner.address)

		await owner.sendTransaction(request);
		const balanceOfAlice = await staking.balanceOf(alice.address)
		const balanceOfOwnerAfter = await staking.balanceOf(owner.address)
		const calculatedOwnerBalance = Number(balanceOfOwnerAfter) + 1
		assert.equal(balanceOfAlice.toString(), amountToTransfer, "alice should have one token")
		assert.equal(calculatedOwnerBalance, Number(balanceOfOwnerBefore), "owner should have one less")

	})
})