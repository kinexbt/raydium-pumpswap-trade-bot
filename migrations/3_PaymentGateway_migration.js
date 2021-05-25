const PaymentGateway = artifacts.require("PaymentGateway");

module.exports = function(deployer) {
  deployer.deploy(PaymentGateway);
};
