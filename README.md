# OpenMint

OpenMint is a dapp where any (open) user can create (mint), buy, sell, and transfer ERC-721 tokens using any png, jpeg, gif, webp, mp4, video/webm, mp3, audio/webm, or mpeg file 64MB or less.  OpenMint utilizes the powerful nature of [Moralis](https://moralis.io/) which takes the place of writing backend infrastructure and allows the dapp to easily populate a database based off of user input, events in smart contracts, and balances in the user's [MetaMask](https://metamask.io/) wallet.

## Features

### Securely Stored Metadata
OpenMint stores and pins the ERC-721 metadata on IPFS using a gateway provided by [Moralis](https://moralis.io/).

### Unlockable Content
Unlockable content is any information that can be described in text format you want the owner of the NFT you make to have exclusive access to.  This can be anything from a link to a high-res download since the max we offer is 64 MB, or it could be a password to a website to unlock a physical product. Your imagination is the limit. The description of what the unlockable content contains is typically found under `Additional Info` on the token's page. This information stays with the token and transfers with ownership on sale and transfer. This information can only be set when creating the NFT and cannot be changed later.
### Tipping
Users can send tips in form of crypto-currency to each other using a `Send Tip` button found on their profile page.
### Buying
In two clicks a user can own an ERC-721 token, and while not visually shown in their wallet, can be seen in their profile which shows all the artwork they currently own and have minted among other things.

### Selling
After setting approval to the OpenMint marketplace contract, which is done with a single click, users can sell their ERC-721 tokens to any other OpenMint users.

### Transferring
If the ERC-721 token is not on sale a user can transfer their token to any address they desire and once the new owner signs the `Moralis Authentication` in their [MetaMask](https://metamask.io/) wallet they can view the token on OpenMint.  Transferring is also how a user can destroy their token so no one can ever own it again. This is done by transferring the token to the equivalent of a zero address, if desired we recommend this one: `0x000000000000000000000000000000000000dead`. By transferring to this address or one similar, others can still view the artwork on OpenMint, but new ownership is forever gone.

### Royalties
A royalty is a certain percentage of the sale price that is automatically held in an escrow contract and sits securely until withdrawn by the original creator when the sale is successful. It is set during the creation process and cannot be changed due to the nature of a blockchain. At OpenMint we have a minimum of 1% and maximum of 50% able to be set.

### Likes & Shares
Just like (haha) any other social media platform, OpenMint allows authenticated users to like a certain ERC-721 token. These tokens and user profiles can be shared via a Tweet, a Facebook post, or an email.

### Encouragements
If a token is not on sale, but a user would like it to be, a bell button can be clicked and count is incremented which alerts the owner that a certain number of people would like that artwork put for sale.  Once put on sale this encouragement count is reset.

## Security
### Withdrawal Payment Pattern

OpenMint integrates [OpenZeppelin](https://openzeppelin.com/contracts/) contracts to minimize any unnecessary bugs or attackers that try to exploit any `transfer` calls.  OpenMint uses a payment gateway contract alongside an escrow contract to keep individual earned funds secure until the user is ready to withdraw to their [MetaMask](https://metamask.io/) wallet.

## Installation
Here are the steps to run this dapp locally:

Use the package manager [npm](https://www.npmjs.com/) to install Truffle.

```
npm install -g truffle
```

Download [Ganache](https://www.trufflesuite.com/ganache) to run a local blockchain.

Once the truffle-config.js file is added to Ganache and the chain is ready to run, get into the OpenMint root directory file in your command line and run:
```
truffle migrate
```
Place the correct contract address in the proper empty variable spot in `discover.js`, `token.js`, `erc-721.js`, and `profile.js` found in the first few lines.

The first address in Ganache will be the publisher wallet and receive the 2% sale fee on every sale.

Follow the steps in [this video](https://www.youtube.com/watch?v=nUEBAS5r4Og) to connect your MetaMask wallet to your local Ganache blockchain.

Once connected, go to [Moralis](https://moralis.io/) and create an account. Spin up a server that will run on a local eth chain.
When completed, click view details and copy the application ID and server URL and in every js file in the client folder paste the ID and URL in the correct variable found at the top of each file.

In Moralis, click view deatils again and go to the Devchain Proxy Server tab and follow the steps based on your OS.

Copy the whole `cloudFunctions.js` file and paste it into the cloud function option on your server in Moralis. Then install the proper "Sync and Watch Contract Events" plugins under plugins for the four events listed in `OpenMintMarketplace.sol` using the table names "ArtworkForSale", "ArtworkSold", "ArtworkPriceChanged", and "ArtworkRemoved". For help with adding plugins refer to [this video](https://www.youtube.com/watch?v=zn7_AYf_28E&t=819s) starting at 11:00 min.

Once successfully added you can now simulate users interacting with OpenMint locally!

## License
[MIT](https://choosealicense.com/licenses/mit/)
