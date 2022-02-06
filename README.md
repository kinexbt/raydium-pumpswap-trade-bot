# OpenMint

⚠️Some of the Moralis syntax is outdated since this project was built when it first began, a new OpenMint will be built using react-moralis soon⚠️

--The cloud functions will not work with current version of Moralis so instead of `queryResults[i].attributes.<columnName>` use `queryResults[i].get('<columnName>')`--

OpenMint is a [dapp](https://www.investopedia.com/terms/d/decentralized-applications-dapps.asp) that combines aspects of social media platforms and a marketplace. It allows any (Open) user to create (Mint), buy, sell, and transfer ERC-721 tokens, which represent artworks in the form of an image, audio, or video file. It is important to clarify that ownership of the ERC-721 token proves ownership of the artwork it represents. It's similar to owning a deed to a house in that anyone can still see the house, it could appreciate or depreciate in value, but the one who owns the deed owns the house and can sell if they want.

OpenMint utilizes the powerful nature of [Moralis](https://moralis.io/) which takes the place of writing backend infrastructure and allows the dapp to easily populate a database using user input, emitted events in smart contracts, and balances in each user's [MetaMask](https://metamask.io/) wallet.

This version of OpenMint was designed to run on Ethereum but can be configured to run on most other EVM (Ethereum Virtual Machine) compatible chains such as Binance Smart Chain or Polygon (previously Matic Network).

## Features

### File Types
When creating an NFT a user can upload any png, jpeg, gif, webp, mp4, video/webm, mp3, audio/webm, or mpeg file 64 MB or less. If a user would like to upload a file larger than 64 MB see Unlockable Content below.

### Securely Stored Metadata
OpenMint stores and pins the ERC-721 metadata on [IPFS](https://ipfs.io/) using a gateway provided by [Moralis](https://moralis.io/).

### Unlockable Content
Unlockable content is any information that can be described in text format that you want the owner of the NFT you create on OpenMint to have exclusive access to.  This can be anything such as a link to a high-res download since the maximum file size you can upload to IPFS on OpenMint is 64 MB, or it could be a password to a website to unlock a physical product. Your imagination is the limit! 

The description of what the unlockable content contains is typically found under Additional Info which can be found by clicking on an artwork that takes you to the token's page. This information stays with the token and transfers with ownership on sale or when transferred. This information can only be set when creating the NFT and cannot be changed later.

### Search Bar
At the top of every page in the navigation bar, there is a search bar that can be used to find any NFT or user on OpenMint based on either their username, the title they have given to the NFT, or their wallet address. If searching for an NFT the username and wallet address is checked against the creator or current owner, and the title is checked against the title.  If searching for a specific user the username is checked against the current username, and the wallet address is checked against the wallet address used when they connected to OpenMint initially.

### Tipping
Users can send tips in the form of crypto-currency to each other using a Send Tip button found on their profile page.

### Buying
In two clicks a user can own an ERC-721 token, and while not visually shown in their wallet, can be seen in their profile which shows all the ERC-721 tokens they currently own and have created among other categories such as tokens they have for sale, liked, and encouraged to sell.

### Selling
After setting approval for the OpenMint marketplace contract, which is done with a single click, users can sell their ERC-721 tokens to any other OpenMint users.

### Transferring
If the ERC-721 token is not on sale a user can transfer their token to any address they desire. Once the new owner connects their [MetaMask](https://metamask.io/) wallet to OpenMint they can view the token(s) on their profile page.  

Transferring is also how a user can make sure their token can never be owned again. This is done by transferring the token to the equivalent of a zero address. If desired we recommend this one: `0x000000000000000000000000000000000000dead`. By transferring to this address or one similar, others can still view the artwork on OpenMint, but new ownership is not possible since the owner is now an address to which no one has the private keys.

### Royalties
A royalty is a certain percentage of the sale price that is automatically held in an escrow contract when a sale is successful and sits securely until withdrawn by the original creator. It is set during the creation process and cannot be changed due to the nature of a blockchain. At OpenMint we have a minimum of 1% and a maximum of 50% able to be set.

### 2% Sales Fee
Before deployment of the smart contracts, a wallet address (known as publisher wallet in `OpenMintMarketplace.sol`) can be set to receive a hardcoded 2% fee of what the artwork sells for. 

For example, if an artwork is resold for 1 ETH, the royalty is 10%, and the sales fee is 2%. 
 - The seller will receive 0.88 ETH.
 - The creator will receive 0.10 ETH.
 - The publisher wallet will receive 0.02 ETH.

### Likes & Shares
Just like other social media platforms, OpenMint allows users who connect their wallet to like a certain ERC-721 token. These ERC-721 tokens along with user profiles can be shared via a Tweet, a Facebook post, or an email. Facebook posts will not work when hosted locally.

### Following
A user can follow another via the "Follow" button on their profile page. A list of who each user follows and is followed by is on their profile page under "Following" and "Followers" respectively. When a user's wallet is connected, if a user follows another, and if the one they are following has created NFTs on OpenMint, their created work, regardless of who the current owner is, will show up under the Following tab found in the navigation bar at the top of each page.

### Encouragements
If a token is not on sale, but a user would like it to be, a bell button can be clicked and a count is incremented which signifies to the owner that a certain number of people would like that artwork put for sale.  Once the owner puts the artwork for sale this encouragement count is reset.

## Security
### Withdrawal Payment Pattern

OpenMint integrates [OpenZeppelin](https://openzeppelin.com/contracts/) contracts, and a payment gateway contract alongside an escrow contract to keep a user's earned funds secure until they are ready to withdraw to their [MetaMask](https://metamask.io/) wallet. The button to withdraw can be found on the profile page under the bio when a wallet is connected.  If the green button just says "Withdraw" and is unable to be clicked, there is nothing to withdraw. If the button says "Withdraw" followed by a number amount of ETH (Withdraw 1.1234 ETH), then a user can click the button, confirm in the popup modal, and then confirm the transaction in [MetaMask](https://metamask.io/).

## Installation
Here are the steps to run this dapp locally:

Use the package manager [npm](https://www.npmjs.com/) and run:

```
npm install
```
(This will install truffle locally)

Download [Ganache](https://www.trufflesuite.com/ganache) to run a local blockchain.

Once the truffle-config.js file is added to Ganache and the chain is ready to run, get into the OpenMint root directory in your command line and run:
```
truffle migrate
```
After migration, place the correct contract address between the quotation marks of the empty strings assigned to each of the contract address variables, which can be found in the first few lines of these files: `discover.js`, `token.js`, `erc-721.js`, `following.js`, and `profile.js`.

The first address in Ganache will be the publisher wallet, which receives the 2% sale fee on every sale.

Follow the steps in [this video](https://www.youtube.com/watch?v=nUEBAS5r4Og) to connect your MetaMask wallet to your local Ganache blockchain.

Once connected, go to [Moralis](https://moralis.io/) and create an account. Spin up a server that will run on a local eth chain.
When completed, click View Details on the server and copy the application ID and server URL. Paste them into every JavaScript file in the client folder that has an empty slot ready for them found at the top of each file.

In Moralis, click View Details again and go to the Devchain Proxy Server tab and follow the steps depending on your OS.

Copy the entire `cloudFunctions.js` file and paste it into the Cloud Function option on your server in Moralis.

Then install the proper "Sync and Watch Contract Events" found in the Details section on your server for the four events in `OpenMintMarketplace.sol` using the table names "ArtworkForSale", "ArtworkSold", "ArtworkPriceChanged", and "ArtworkRemoved". For help with adding plugins refer to [this video](https://www.youtube.com/watch?v=zn7_AYf_28E&t=819s) starting at 11:00 min.

Once successfully added you can now simulate users interacting with OpenMint locally.

Make sure you are running on a local server, by going into the root folder and running `python3 -m http.server` in the command line and then viewing the site via `localhost:8080/client`

## License

[![MIT License](https://img.shields.io/apm/l/atomic-design-ui.svg?)](https://github.com/Ty-Sir/OpenMint/blob/main/LICENSE)
