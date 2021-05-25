const OpenMint = artifacts.require("OpenMint");
const PaymentGateway = artifacts.require("PaymentGateway");
const OpenMintMarketplace = artifacts.require("OpenMintMarketplace");

//first account in truffle becomes payment gateway wallet allowed to withdrawl funds
module.exports = function(deployer, networks, accounts) {
  deployer.deploy(OpenMintMarketplace, OpenMint.address, PaymentGateway.address, accounts[0]);
};   
