const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Farming contract", function() {
    let accounts;
    let provider = ethers.getDefaultProvider('http://localhost:8545');
    let signer;
    let contract;

    before(async () => {
        accounts = await ethers.getSigners();
        // signer = accounts[0];
        signer = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
        let Contract = await ethers.getContractFactory("Cake", signer);
        contract = await Contract.deploy();
        await contract.deployed();
        console.log("Erc20 contract address", contract.address);
    });

    it("Check Eth balance", async function() {
        const balance = await signer.getBalance();
        const ethereum = ethers.utils.formatUnits(balance, 'ether');
        console.log({ ethereum });
    });

    it("Send 10 Ethereum", async function() {
        const from = await signer.getAddress();
        let nonce = await provider.getTransactionCount(from);

        const request = {
            to: accounts[1].address,
            from,
            nonce,
            value: ethers.utils.parseUnits('10', 'ether'), 
            data: [],
        };
        const tx = await signer.sendTransaction(request);
        const wait = await tx.wait();
    });

    it("Check Eth balance", async function() {
        const balance = await signer.getBalance();
        const ethereum = ethers.utils.formatUnits(balance, 'ether');
        console.log({ ethereum });
    })

    it("Check token balance", async function() {
        const balance = await contract.balanceOf(signer.address);
        const formatted = ethers.utils.formatUnits(balance, 'ether');
        const tokens = ethers.utils.commify(formatted);
        console.log({ tokens });
        expect(formatted).to.equal("10000000.0");
    });

    it("Send 10 Tokens", async function() {
        const from = await signer.getAddress();
        let nonce = await provider.getTransactionCount(from);
        const abi = contract.interface;
        const request = await contract.populateTransaction.transfer(accounts[2].address, ethers.utils.parseUnits('10', 'ether'));
        const tx = await signer.sendTransaction(request);
    });

    it("Send contract function", async function() {
        const request = await contract.populateTransaction.increaseAllowance(accounts[0].address, '100000');
        console.log(request);
        const tx = await signer.sendTransaction(request);
        console.log(tx);
    });

    it("Check token balance", async function() {
        const balance = await contract.balanceOf(signer.address);
        const formatted = ethers.utils.formatUnits(balance, 'ether');
        const tokens = ethers.utils.commify(formatted);
        console.log({ tokens });
        expect(formatted).to.equal("9999990.0");
    });
    
});