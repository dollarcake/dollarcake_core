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
[] Only minter for GSN and staking 
[x] Global Only Owner for staking - min inital and time lock (only gets written in on staking)
[] GSN network currently allows the relayer to make any tx for anyone
[] Add event tests
[x] Add re entrancy guards 
[x] loop through reward and pool reward
[x] add pool reward 