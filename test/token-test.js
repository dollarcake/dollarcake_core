const chai = require("chai");
const { ethers, waffle } = require("hardhat");
const { time } = require("@openzeppelin/test-helpers");
const should = require("should");
const { increaseTime } = require("../helpers/utils")
chai.use(waffle.solidity);
const { expect, assert } = chai;

describe("token contract", function() {
    let owner, alice, bob, relayer, charlie, dave
	const decimals = 18
	const amountToTransfer = 10
	const name = "cake"
	const symbol = "cake"

    beforeEach(async () => {
		[owner, alice, bob, relayer, charlie, dave] = await ethers.getSigners();
        Contract = await ethers.getContractFactory("CakeStaking");
        staking = await Contract.deploy(name, symbol);
	});
	it('increase allowance ', async function () {
		await expect(staking.increaseAllowance(charlie.address, 10)).to.emit(staking, "Approval").withArgs(owner.address, charlie.address, "10")
		const allowance = await staking.allowance(
		  owner.address,
		  charlie.address
		)
		assert.equal(allowance.toString(), "10")
	  })
	
	  it('decrease allowance ', async function () {
		await staking.increaseAllowance(charlie.address, 10)
		await expect(staking.decreaseAllowance(charlie.address, 8)).to.emit(staking, "Approval").withArgs(owner.address, charlie.address, "2")
		const allowance = await staking.allowance(
		  owner.address,
		  charlie.address
		)
		assert.equal(allowance, 2)
	  })
	
	  it('returns the total supply of tokens at start', async function () {
		const result = await staking.totalSupply()
		assert.equal(result.toString(), "10000000000000000000000000")
	  })
	
	  it('returns the name of the token', async function () {
		const result = await staking.name()
		assert.equal(result, name)
	  })
	
	  it('returns the symbol', async function () {
		const result = await staking.symbol()
		assert.equal(result, symbol)
	  })
	
	  it('returns the total amount of decimals at start', async function () {
		const result = await staking.decimals()
		assert.equal(result, decimals)
	  })
	  it('transfers', async function () {
		  await expect(staking.transfer(alice.address, amountToTransfer)).to.emit(staking, "Transfer").withArgs(owner.address, alice.address, amountToTransfer)
		  const balanceOfAlice = await staking.balanceOf(alice.address)
		  assert.equal(balanceOfAlice.toString(), amountToTransfer.toString(), "alice should have the proper balance")
	  })
	  it('transfers from', async function () {
		await staking.increaseAllowance(charlie.address, 10)
		await expect(staking.connect(charlie).transferFrom(owner.address, alice.address, amountToTransfer)).to.emit(staking, "Transfer").withArgs(owner.address, alice.address, amountToTransfer)
		const balanceOfAlice = await staking.balanceOf(alice.address)
		assert.equal(balanceOfAlice.toString(), amountToTransfer.toString(), "alice should have the proper balance")
	  })
	  it('fails to transfer no balance', async function () {
		try {
			await staking.connect(charlie).transfer(alice.address, amountToTransfer)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert ERC20: transfer amount exceeds balance"
			)
		}
	  })
	  it('fails to transfer from no allowance', async function () {
		try {
			await staking.connect(charlie).transferFrom(owner.address, alice.address, amountToTransfer)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert ERC20: transfer amount exceeds allowance"
			)
		}
	  })

	  it('demo transfers not allowed', async function () {
		try {
			await staking.connect(alice).transfer(alice.address, amountToTransfer)
			should.fail("The call should have failed but didn't")
		} catch(e) {
			assert.equal(
				e.message, 
				"VM Exception while processing transaction: revert transfer in demo disallowed"
			)
		}
		
	})
	})
