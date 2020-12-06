const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Cake token", function() {
    let provider = ethers.getDefaultProvider('http://localhost:8545');
    let owner, alice, bob;    
    let contract;

    beforeEach(async () => {
        [owner, alice, bob] = await ethers.getSigners();
        let Contract = await ethers.getContractFactory("CakeToken");
        token = await Contract.deploy("cake", "cake");
    });
    
    it("Check supply is 10 million", async function() {
        const supply = await token.totalSupply();
        const formatted = ethers.utils.formatUnits(supply, 'ether');
        const comma = ethers.utils.commify(formatted);
        expect(formatted).to.equal("10000000.0");
    });

    it("Check balance", async function() {
        const balance = await token.balanceOf(owner.address);
        const formatted = ethers.utils.formatUnits(balance, 'ether');
        const comma = ethers.utils.commify(formatted);
        expect(formatted).to.equal("10000000.0");
    });

    it("Test transfer", async function() {
        await token.transfer(alice.address, ethers.utils.parseUnits("100.0", 'ether').toString());
        const balance = await token.balanceOf(owner.address);
        const formatted = ethers.utils.formatUnits(balance, 'ether');
        const comma = ethers.utils.commify(formatted);
        expect(formatted).to.equal("9999900.0");
    });
});
