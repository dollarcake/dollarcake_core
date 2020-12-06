const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { approveSetup, increaseTime } = require("../helpers/utils")

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

    it.only("Send token from relayer function", async function() {
        const amountToTransfer = '1'
        const request = await staking.connect(relayer).populateTransaction.transfer(alice.address, amountToTransfer);
        const coder = new ethers.utils.AbiCoder( )
        let message = coder.encode(
            ["address", "uint256", "string"], 
            [staking.address, 0, "transfer"]
          );
            const messageHash = ethers.utils.keccak256(message);
            const messageHashBytes = ethers.utils.arrayify(messageHash);
            let signedMessage = await owner.signMessage(messageHashBytes);
            message = message.slice(2)
            signedMessage = signedMessage.slice(2)
            console.log({address: owner.address})
        console.log("message", ethers.utils.arrayify(`0x${message}`).length)
        console.log("signature", ethers.utils.arrayify(`0x${signedMessage}`).length)
        

        const data = request.data
        request.data = data + message + signedMessage;
        const array = ethers.utils.arrayify(request.data)
        console.log("data", array, array.length)
        const total = request.data.length
        console.log(request.data, request.data.length)
        console.log({request})
        console.log("sending")
        const balanceOfAliceBefore = await staking.balanceOf(owner.address)
        console.log({balanceOfAliceBefore: balanceOfAliceBefore.toString()})

        const tx = await relayer.sendTransaction(request);
        // console.log(tx)
        const balanceOfAlice = await staking.balanceOf(alice.address)
        const message1 = await staking.message1()
        const signature1 = await staking.signature1()

        console.log({message1, length: message1.length})
        console.log({signature1, length: signature1.length})

        assert.equal(balanceOfAlice.toString(), amountToTransfer, "alice should have one token")
    });

    // it("stake a token for user", async function() {
    //     const amountToTransfer = '100000000000000000000'
    //     await approve(owner, amountToTransfer)
    //     const request = await staking.connect(relayer).populateTransaction.deposit(bob.address, amountToTransfer);

    //     const data = request.data
    //     request.data = data + 'f39fd6e51aad88f6f4ce6ab8827279cfffb92266';
        
    //     const tx = await relayer.sendTransaction(request);
    // });

});