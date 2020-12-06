const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { returnForwardRequest } = require("../helpers/signing.js")

describe("Forwarder contract", function() {
    let staking;
    let owner, alice, bob, relayer, charlie

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
        const newData = await returnForwardRequest(ethers, owner, staking, "transfer", nonce, request)   
        request.data = newData
        await relayer.sendTransaction(request);
        const balanceOfAlice = await staking.balanceOf(alice.address)
        assert.equal(balanceOfAlice.toString(), amountToTransfer, "alice should have one token")
    });
    it("approve", async function() {})
    it("increaseAllowance", async function() {})
    it("decreseAllowance", async function() {})
    it("transferFrom", async function() {})

    it("should deposit then withdraw relayer", async function() {
        const amountToTransfer = '100000000000000000000'
        const request = await staking.connect(relayer).populateTransaction.deposit(alice.address, amountToTransfer);
        const nonce = await staking.nonce(owner.address)
        const newData = await returnForwardRequest(ethers, owner, staking, "deposit", nonce, request)   
        request.data = newData
        await relayer.sendTransaction(request);
        const userStake = await staking.userStake(alice.address, owner.address)
        console.log({userStake:userStake.toString()})
        assert.equal(userStake.toString(), amountToTransfer, "owner should have staked")


        const withdrawRequest = await staking.connect(relayer).populateTransaction.withdraw(alice.address, amountToTransfer);
        const withdrawNonce = await staking.nonce(owner.address)
        const newWithdrawData = await returnForwardRequest(ethers, owner, staking, "withdraw", withdrawNonce, withdrawRequest)   
        withdrawRequest.data = newWithdrawData
        await relayer.sendTransaction(withdrawRequest);
        const newUserStake = await staking.userStake(alice.address, owner.address)
        console.log({userStake:newUserStake.toString()})
        assert.equal(newUserStake.toString(), "0", "owner should have withdrawn")
    });
    it("setSplit", async function() {})

});