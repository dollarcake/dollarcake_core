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

[] add auditing tools

[] documentation 

[] delegate

## Deployed 
Kovan
* cake contract address 0x206245a0Ff813f129004Fa5F2cDD8918A3ADfBF1

Sokol
* cake contract address 0x41824ca1677ffF4c989E5fF8231547e987cCCeB1

* blockexplorer https://blockscout.com/poa/sokol/

* faucet https://faucet.poa.network/



