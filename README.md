![Dollarcake](https://dollarcake.com/logo_dark.png)

## Dollarcake Erc-20 and token staking contract

Unit test suite built with Hardhat

- Hardhat [https://hardhat.org/](https://hardhat.org/)

## Installation

You can install required dependencies using:

```sh
# At the project root
npm install
```

## Local Ethereum node

Run full local node for development

```sh
npx hardhat node
```

## Unit tests

Run the all unit tests

```sh
npx hardhat test
```

## Deploy to Kovan

Deploy both the token and token farming contracts

```sh
npx hardhat run scripts/deploy-script.js
```

## TODO 
[x] Factory

[x] Staking contract

[x] Global Only Owner for staking - min inital and time lock (only gets written in on staking)

[x] GSN network currently allows the relayer to make any tx for anyone 

[x] GSN network positive tests

[x] GSN network negative tests

[x] No Npm packages

[x] Solutionize best way to get user earned per reward payout


[x] Add event tests

[x] Add re entrancy guards

[x] loop through reward and pool reward

[x] add pool reward 

[x] token tests

[x] more long form testing

[x] fix timelock issue 

[x] snapshot token

[x] handle being able to track tokens inside the contract and wallet

[x] cpm fee 0-7% globally contrallable 

[x] add params to gas station check

[x] add auditing tools

[x] documentation 

[x] delegate

## Deployed 
Kovan
* cake contract address 0xC1A31B7089a02bb8f2246FAA1b6ea11C85F2E5aD

Sokol
* cake contract address 0x4869adB721792F1ED6b78BF94e2c6f32E394dcd1

* blockexplorer https://blockscout.com/poa/sokol/

* faucet https://faucet.poa.network/



