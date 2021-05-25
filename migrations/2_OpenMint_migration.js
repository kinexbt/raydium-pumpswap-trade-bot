const OpenMint = artifacts.require("OpenMint");

module.exports = function(deployer) {
  deployer.deploy(OpenMint);
};
