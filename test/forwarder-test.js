const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Forwarder contract", function() {
    let accounts;
    let provider = ethers.getDefaultProvider('http://localhost:8545');
    let signer;
    let contract;

    before(async () => {
        accounts = await ethers.getSigners();
        signer = accounts[0];
        // signer = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
        let Contract = await ethers.getContractFactory("Cake", signer);
        contract = await Contract.deploy();
        await contract.deployed();
        console.log("Forwarder contract address", contract.address);
    });

    it("Check token balance", async function() {
        const balance = await contract.balanceOf(signer.address);
        const formatted = ethers.utils.formatUnits(balance, 'ether');
        const tokens = ethers.utils.commify(formatted);
        console.log({ tokens });
        expect(formatted).to.equal("10000000.0");
    });

    it("Send contract function", async function() {
        const request = await contract.populateTransaction.transfer(accounts[2].address, '100000000000000000');

        const data = request.data.substring(0, request.data.length-20);
        request.data = data + 'f39fd6e51aad88f6f4ce6ab8827279cfffb92266';
        
        const tx = await signer.sendTransaction(request);
        console.log(tx);
    });

    it("Check token balance", async function() {
        const balance = await contract.balanceOf(signer.address);
        const formatted = ethers.utils.formatUnits(balance, 'ether');
        const tokens = ethers.utils.commify(formatted);
        console.log({ tokens });
        expect(formatted).to.equal("10000000.0");
    });

});