# Super Secret ZK Ballot


 This is the final project work of the Encode Club Solidity Bootcamp. The objetive of this project was to make a Ballot contract, that we got from the Solidity documentation examples and worked with during our classes, and implement anonymous voting features on it, using Zero Knowledge Proofs.

 The project used the [Semaphore protocol](https://semaphore.pse.dev/) on the contract and on the off-chain part, to generate anonymous identities and groups, which made the anonymous voting possible.

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v18.17)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))

## Quickstart

To get started, follow the steps below:

1. Clone this repo & install dependencies

```
git clone https://github.com/dutragustavo/super-secret-zkballot.git
cd super-secret-zkballot
yarn install
```

2. Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Ethereum network using Hardhat. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `hardhat.config.ts`.

3. On a second terminal, deploy the test contract:

```
yarn deploy
```

4. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`.


## Contributors
This project was made by the Team 1 of the Encode Club Solidity Bootcamp: 
- [dutra](https://github.com/dutragustavo)
- [Huelder](https://github.com/hueldera)
- [Rubikkz](https://github.com/frosimanuel)
- [Juliano Sales](https://github.com/tzdesing)