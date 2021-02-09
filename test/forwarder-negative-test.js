const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const {
  returnForwardRequest,
  badSignature,
  badDecode,
  returnForwardRequestNoPrefix
} = require("../helpers/signing.js");
const should = require("should");
const { increaseTime } = require("../helpers/utils");

describe("Forwarder negative tests", function() {
  let staking;
  let owner, alice, bob, relayer, charlie;
  const NULL_ADDRESS = `0x${"0".repeat(40)}`;

  beforeEach(async () => {
    [owner, alice, bob, relayer, charlie] = await ethers.getSigners();
    let Contract = await ethers.getContractFactory("CakeStaking");
    staking = await Contract.deploy("cake", "cake");
    await staking.connect(relayer).declareRelayer();
  });

  it("fail with bad signature", async function() {
    const request = await staking
      .connect(relayer)
      .populateTransaction.setSplit(45);
    const nonce = await staking.nonce(owner.address);
    const newData = await badSignature(
      ethers,
      owner,
      staking,
      "setSplit",
      nonce,
      request,
      { to: NULL_ADDRESS, amount: 45, from: NULL_ADDRESS }
    );
    request.data = newData;
    try {
      await relayer.sendTransaction(request);
      should.fail("The call should have failed but didn't");
    } catch (e) {
      assert.equal(
        e.message,
        "VM Exception while processing transaction: revert ECDSA: invalid signature 'v' value"
      );
    }
  });
  it("fail with bad decode", async function() {
    const request = await staking
      .connect(relayer)
      .populateTransaction.setSplit(45);
    const nonce = await staking.nonce(owner.address);
    const newData = await badDecode(
      ethers,
      owner,
      staking,
      "setSplit",
      nonce,
      request,
      { to: NULL_ADDRESS, amount: 45, from: NULL_ADDRESS }
    );
    request.data = newData;
    try {
      await relayer.sendTransaction(request);
      should.fail("The call should have failed but didn't");
    } catch (e) {
      assert.equal(e.message, "Transaction reverted without a reason");
    }
  });

  it("fail on replay", async function() {
    const request = await staking
      .connect(relayer)
      .populateTransaction.setSplit(45);
    const nonce = await staking.nonce(owner.address);
    const newData = await returnForwardRequest(
      ethers,
      owner,
      staking,
      "setSplit",
      nonce,
      request,
      { to: NULL_ADDRESS, amount: 45, from: NULL_ADDRESS }
    );
    request.data = newData;
    await relayer.sendTransaction(request);
    try {
      await relayer.sendTransaction(request);
      should.fail("The call should have failed but didn't");
    } catch (e) {
      assert.equal(
        e.message,
        "VM Exception while processing transaction: revert replay"
      );
    }
  });
  it("fail on wrong address sent to", async function() {
    const request = await staking
      .connect(relayer)
      .populateTransaction.setSplit(45);
    const nonce = await staking.nonce(owner.address);
    const newData = await returnForwardRequest(
      ethers,
      owner,
      alice,
      "setSplit",
      nonce,
      request,
      { to: NULL_ADDRESS, amount: 45, from: NULL_ADDRESS }
    );
    request.data = newData;
    try {
      await relayer.sendTransaction(request);
      should.fail("The call should have failed but didn't");
    } catch (e) {
      assert.equal(
        e.message,
        "VM Exception while processing transaction: revert address"
      );
    }
  });
  it("fail on wrong function name", async function() {
    const request = await staking
      .connect(relayer)
      .populateTransaction.setSplit(45);
    const nonce = await staking.nonce(owner.address);
    const newData = await returnForwardRequest(
      ethers,
      owner,
      staking,
      "transfer",
      nonce,
      request,
      { to: NULL_ADDRESS, amount: 45, from: NULL_ADDRESS }
    );
    request.data = newData;
    try {
      await relayer.sendTransaction(request);
      should.fail("The call should have failed but didn't");
    } catch (e) {
      assert.equal(
        e.message,
        "VM Exception while processing transaction: revert functionName"
      );
    }
  });
  it("should ignore signature if not from relayer", async function() {
    const amountToTransfer = "1";
    const request = await staking
      .connect(bob)
      .populateTransaction.transfer(alice.address, amountToTransfer);
    const nonce = await staking.nonce(owner.address);
    const newData = await returnForwardRequest(
      ethers,
      owner,
      staking,
      "transfer",
      nonce,
      request,
      { to: alice.address, amount: amountToTransfer, from: NULL_ADDRESS }
    );
    request.data = newData;
    try {
      await bob.sendTransaction(request);
      should.fail("The call should have failed but didn't");
    } catch (e) {
      assert.equal(
        e.message,
        "VM Exception while processing transaction: revert ERC20: transfer amount exceeds balance"
      );
    }
  });
  it("should ignore signature and message if not relayer", async function() {
    const amountToTransfer = "1";
    const request = await staking
      .connect(owner)
      .populateTransaction.transfer(alice.address, amountToTransfer);
    const nonce = await staking.nonce(alice.address);
    const newData = await returnForwardRequest(
      ethers,
      alice,
      staking,
      "transfer",
      nonce,
      request,
      { to: alice.address, amount: amountToTransfer, from: NULL_ADDRESS }
    );
    request.data = newData;
    const balanceOfOwnerBefore = await staking.balanceOf(owner.address);

    await owner.sendTransaction(request);
    const balanceOfAlice = await staking.balanceOf(alice.address);
    const balanceOfOwnerAfter = await staking.balanceOf(owner.address);
    const calculatedOwnerBalance = Number(balanceOfOwnerAfter) + 1;
    assert.equal(
      balanceOfAlice.toString(),
      amountToTransfer,
      "alice should have one token"
    );
    assert.equal(
      calculatedOwnerBalance,
      Number(balanceOfOwnerBefore),
      "owner should have one less"
    );
  });
  it("fail on wrong param address1", async function() {
    const request = await staking
      .connect(relayer)
      .populateTransaction.deposit(alice.address, "100");
    const nonce = await staking.nonce(owner.address);
    const newData = await returnForwardRequest(
      ethers,
      owner,
      staking,
      "deposit",
      nonce,
      request,
      { to: bob.address, amount: "100", from: NULL_ADDRESS }
    );
    request.data = newData;
    try {
      await relayer.sendTransaction(request);
      should.fail("The call should have failed but didn't");
    } catch (e) {
      assert.equal(
        e.message,
        "VM Exception while processing transaction: revert params"
      );
    }
  });
  it("fail on wrong param number1", async function() {
    const request = await staking
      .connect(relayer)
      .populateTransaction.setSplit(45);
    const nonce = await staking.nonce(owner.address);
    const newData = await returnForwardRequest(
      ethers,
      owner,
      staking,
      "setSplit",
      nonce,
      request,
      { to: NULL_ADDRESS, amount: 55, from: NULL_ADDRESS }
    );
    request.data = newData;
    try {
      await relayer.sendTransaction(request);
      should.fail("The call should have failed but didn't");
    } catch (e) {
      assert.equal(
        e.message,
        "VM Exception while processing transaction: revert params"
      );
    }
  });
  it("fail on wrong param address2", async function() {
    const request = await staking
      .connect(relayer)
      .populateTransaction.transferFrom(alice.address, owner.address, "100");
    const nonce = await staking.nonce(owner.address);
    const newData = await returnForwardRequest(
      ethers,
      owner,
      staking,
      "transferFrom",
      nonce,
      request,
      { to: alice.address, amount: "100", from: alice.address }
    );
    request.data = newData;
    try {
      await relayer.sendTransaction(request);
      should.fail("The call should have failed but didn't");
    } catch (e) {
      assert.equal(
        e.message,
        "VM Exception while processing transaction: revert params"
      );
    }
  });

  it("should add then remove relayer", async function() {
    let isRelayer = await staking.relayer(owner.address);
    assert.equal(isRelayer, false);
    await staking.declareRelayer();
    isRelayer = await staking.relayer(owner.address);
    assert.equal(isRelayer, true);
    await staking.undeclareRelayer();
    isRelayer = await staking.relayer(owner.address);
    assert.equal(isRelayer, false);
  });
  it("should fail with no signed msg prefix", async function() {
    const amountToTransfer = '1'
    const tester = ethers.Wallet.createRandom();
    await staking.transfer(tester.address, amountToTransfer)
    const request = await staking.connect(relayer).populateTransaction.transfer(alice.address, amountToTransfer);
    const nonce = await staking.nonce(tester.address)
    const newData = await returnForwardRequestNoPrefix(ethers, tester, staking, "transfer", nonce, request, {to: alice.address, amount: amountToTransfer, from: NULL_ADDRESS})   
    request.data = newData
    
    try {
      await relayer.sendTransaction(request);
      should.fail("The call should have failed but didn't");
    } catch (e) {
      assert.equal(
        e.message,
        "VM Exception while processing transaction: revert ERC20: transfer amount exceeds balance"
      );
    }  })

});
