const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Forwarder contract", function() {
    let token;
    let owner, alice, bob

    beforeEach(async () => {
        [owner, alice, bob] = await ethers.getSigners();
        let Contract = await ethers.getContractFactory("CakeToken");
        token = await Contract.deploy(owner.address);
        console.log("Forwarder token address", token.address);
    });

    it("Check token balance", async function() {
        const balance = await token.balanceOf(owner.address);
        const formatted = ethers.utils.formatUnits(balance, 'ether');
        const tokens = ethers.utils.commify(formatted);
        console.log({ tokens });
        expect(formatted).to.equal("10000000.0");
    });

    it("Send token from relayer function", async function() {
        const amountToTransfer = '1'
        const request = await token.populateTransaction.transfer(alice.address, '100000000000000000');

        const data = request.data.substring(0, request.data.length-20);
        request.data = data + 'f39fd6e51aad88f6f4ce6ab8827279cfffb92266';
        
        const tx = await owner.sendTransaction(request);
        const balanceOfAlice = await token.balanceOf(alice.address)
        expect(balanceOfAlice.toString(), amountToTransfer, "bob should have one token")
    });
});