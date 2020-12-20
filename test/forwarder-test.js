const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { returnForwardRequest } = require("../helpers/signing.js")
const { increaseTime } = require("../helpers/utils")

describe("Forwarder contract", function() {
    let staking;
    let owner, alice, bob, relayer, charlie
    const NULL_ADDRESS = `0x${"0".repeat(40)}`;

    beforeEach(async () => {
		[owner, alice, bob, relayer, charlie] = await ethers.getSigners();
        let Contract = await ethers.getContractFactory("CakeStaking");
        staking = await Contract.deploy("cake", "cake");
	});
    it("Check token balance", async function() {
        const balance = await staking.balanceOf(owner.address);
        const formatted = ethers.utils.formatUnits(balance, 'ether');
        const tokens = ethers.utils.commify(formatted);
        expect(formatted).to.equal("10000000.0");
    });

    it("Send token from relayer function", async function() {
        const amountToTransfer = '1'
        const request = await staking.connect(relayer).populateTransaction.transfer(alice.address, amountToTransfer);
        const nonce = await staking.nonce(owner.address)
        const newData = await returnForwardRequest(ethers, owner, staking, "transfer", nonce, request, {to: alice.address, amount: amountToTransfer, from: NULL_ADDRESS})   
        request.data = newData
        await relayer.sendTransaction(request);
        const balanceOfAlice = await staking.balanceOf(alice.address)
        assert.equal(balanceOfAlice.toString(), amountToTransfer, "alice should have one token")
    });
    it("increase and decrease allowance", async function() {
        const amountToTransfer = '100000000000000000000'
        const request = await staking.connect(relayer).populateTransaction.increaseAllowance(alice.address, amountToTransfer);
        const nonce = await staking.nonce(owner.address)
        const newData = await returnForwardRequest(ethers, owner, staking, "increaseAllowance", nonce, request, {to: alice.address, amount: amountToTransfer, from: NULL_ADDRESS})   
        request.data = newData
        await relayer.sendTransaction(request);
        const allowanceOfAlice = await staking.allowance(owner.address, alice.address)
        assert.equal(allowanceOfAlice.toString(), amountToTransfer, "alice should have proper allowance")


        const decreaseRequest = await staking.connect(relayer).populateTransaction.decreaseAllowance(alice.address, amountToTransfer);
        const decreaseNonce = await staking.nonce(owner.address)
        const decreaseNewData = await returnForwardRequest(ethers, owner, staking, "decreaseAllowance", decreaseNonce, decreaseRequest, {to: alice.address, amount: amountToTransfer, from: NULL_ADDRESS})   
        decreaseRequest.data = decreaseNewData
        await relayer.sendTransaction(decreaseRequest);
        const allowanceOfAliceAfter = await staking.allowance(owner.address, alice.address)
        assert.equal(allowanceOfAliceAfter.toString(), "0", "alice should have proper allowance")

        
    })
    it("approve and transferFrom", async function() {
        const amountToTransfer = '100000000000000000000'
        const request = await staking.connect(relayer).populateTransaction.approve(alice.address, amountToTransfer);
        const nonce = await staking.nonce(owner.address)
        const newData = await returnForwardRequest(ethers, owner, staking, "approve", nonce, request, {to: alice.address, amount: amountToTransfer, from: NULL_ADDRESS})   
        request.data = newData
        await relayer.sendTransaction(request);
        const allowanceOfAlice = await staking.allowance(owner.address, alice.address)
        assert.equal(allowanceOfAlice.toString(), amountToTransfer, "alice should have proper allowance")

        const transferFromRequest = await staking.connect(relayer).populateTransaction.transferFrom(owner.address, alice.address, amountToTransfer);
        const transferFromNonce = await staking.nonce(alice.address)
        const transferFromNewData = await returnForwardRequest(ethers, alice, staking, "transferFrom", transferFromNonce, transferFromRequest, {to: alice.address, amount: amountToTransfer, from: owner.address})   
        transferFromRequest.data = transferFromNewData
        await relayer.sendTransaction(transferFromRequest);
        const balanceOfAlice = await staking.balanceOf(alice.address)
        assert.equal(balanceOfAlice.toString(), amountToTransfer, "alice should have proper balance")
    })

    it("should deposit then withdraw relayer", async function() {
        const amountToTransfer = '100000000000000000000'
        const request = await staking.connect(relayer).populateTransaction.deposit(alice.address, amountToTransfer);
        const nonce = await staking.nonce(owner.address)
        const newData = await returnForwardRequest(ethers, owner, staking, "deposit", nonce, request, {to: alice.address, amount: amountToTransfer, from: NULL_ADDRESS})   
        request.data = newData
        await relayer.sendTransaction(request);
        const userStake = await staking.userStake(alice.address, owner.address)
        assert.equal(userStake.toString(), amountToTransfer, "owner should have staked")
        

        const withdrawRequest = await staking.connect(relayer).populateTransaction.withdraw(alice.address, amountToTransfer);
        const withdrawNonce = await staking.nonce(owner.address)
        const newWithdrawData = await returnForwardRequest(ethers, owner, staking, "withdraw", withdrawNonce, withdrawRequest, {to: alice.address, amount: amountToTransfer, from: NULL_ADDRESS})   
        withdrawRequest.data = newWithdrawData
        try {
            await relayer.sendTransaction(withdrawRequest);
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert wait more time"
			)

        }
        await increaseTime(ethers)
        await relayer.sendTransaction(withdrawRequest);
        const newUserStake = await staking.userStake(alice.address, owner.address)
        assert.equal(newUserStake.toString(), "0", "owner should have withdrawn")
    });
    it("setSplit", async function() {
        const request = await staking.connect(relayer).populateTransaction.setSplit(45);
        const nonce = await staking.nonce(owner.address)
        const newData = await returnForwardRequest(ethers, owner, staking, "setSplit", nonce, request, {to: NULL_ADDRESS, amount: 45, from: NULL_ADDRESS})   
        request.data = newData
        await relayer.sendTransaction(request);
        const stakerSplit = await staking.stakerSplit(owner.address)
        assert.equal(stakerSplit.toString(), "45", "new split should be set")

        try {
			await staking.setSplit(50)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert wait more time"
			)

        }
    })

});