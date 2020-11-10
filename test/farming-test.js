const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Farming contract", function() {
    let accounts;
    let provider = ethers.getDefaultProvider('http://localhost:8545');
    let signer;
    let signer2;
    let contract;
    let erc20contract;

    before(async () => {
        accounts = await ethers.getSigners();
        signer = accounts[0];
        signer2 = accounts[1];

        let Contract = await ethers.getContractFactory("Cake", signer);
        erc20contract = await Contract.deploy();
        await erc20contract.deployed();

        Contract = await ethers.getContractFactory("Farm", signer);
        contract = await Contract.deploy(erc20contract.address);
        await contract.deployed();

        console.log("Erc20 contract address", erc20contract.address);
        console.log("Farm contract address", contract.address);
    });

    it("Check total supply", async function() {
        const tx = await erc20contract.totalSupply();
        const formatted = ethers.utils.formatUnits(tx, 'ether');
        expect(formatted).to.equal("10000000.0");
    });

    it("Check interface total supply", async function() {
        const tx = await contract.checkSupply();
        const formatted = ethers.utils.formatUnits(tx, 'ether');
        expect(formatted).to.equal("10000000.0");
    });

    it("Transfer 100 tokens", async function() {
        const tx = await erc20contract.transfer(signer2.address, ethers.utils.parseUnits('100'));
    });

    it("Check balance of signer", async function() {
        const tx = await erc20contract.balanceOf(signer.address);
        const formatted = ethers.utils.formatUnits(tx, 'ether');
        expect(formatted).to.equal("9999900.0");
    });

    it("Approve for one token", async function() {
        const tx = await erc20contract.approve(contract.address, ethers.utils.parseUnits('10'));
        const result = await tx.wait();
    });

    it("Stake tokens in contract", async function() {
        const tx = await contract.stakeTokens(ethers.utils.parseUnits('10'));
    });

    it("Check balance of signer", async function() {
        const tx = await erc20contract.balanceOf(signer.address);
        const formatted = ethers.utils.formatUnits(tx, 'ether');
        expect(formatted).to.equal("9999890.0");
    });

});