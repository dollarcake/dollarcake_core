const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Cake token", function() {
    let provider = ethers.getDefaultProvider('http://localhost:8545');
    let signer;    
    let contract;

    before(async () => {
        const accounts = await ethers.getSigners();
        signer = accounts[0];
        // signer = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
        const Contract = await ethers.getContractFactory("Cake", signer);
        contract = await Contract.deploy();
        await contract.deployed();
        console.log("Contract address", contract.address);
    });
    
    it("Check supply is 10 million", async function() {
        const supply = await contract.totalSupply();
        const formatted = ethers.utils.formatUnits(supply, 'ether');
        const comma = ethers.utils.commify(formatted);
        expect(formatted).to.equal("10000000.0");
    });

    it("Check balance", async function() {
        const balance = await contract.balanceOf(signer.address);
        const formatted = ethers.utils.formatUnits(balance, 'ether');
        const comma = ethers.utils.commify(formatted);
        expect(formatted).to.equal("10000000.0");
    });

    it("Test transfer", async function() {
        contract.transfer("0x70997970c51812dc3a010c7d01b50e0d17dc79c8", ethers.utils.parseUnits("100.0", 'ether').toString());
        /*
        const balance = await contract.balanceOf(signer.address);
        const formatted = ethers.utils.formatUnits(balance, 'ether');
        const comma = ethers.utils.commify(formatted);
        expect(formatted).to.equal("10000000.0");
        */
    });

    it("Check balance", async function() {
        const balance = await contract.balanceOf(signer.address);
        const formatted = ethers.utils.formatUnits(balance, 'ether');
        const comma = ethers.utils.commify(formatted);
        expect(formatted).to.equal("9999900.0");
    });
});
