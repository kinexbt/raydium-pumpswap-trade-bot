// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "./OpenMint.sol";
import "./node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./PaymentGateway.sol";

contract OpenMintMarketplace is Ownable {
  using SafeMath for uint256;

  OpenMint private _OpenMint;
  PaymentGateway private _PaymentGateway;
  address payable publisherWallet;

  struct Offer{
    address payable seller;
    address tokenAddress;
    uint256 price;
    uint256 offerId;
    uint256 tokenId;
    bool isSold;
    bool active;
  }

  Offer[] public offers;

  mapping(uint256 => Offer) tokenIdToOffer;

  event artworkAdded(address tokenAddress, address seller, uint256 price, uint256 tokenId, uint256 offerId, bool isSold);
  event artworkSold(address tokenAddress, address buyer, uint256 price, uint256 tokenId, uint256 offerId);
  event priceChanged(address owner, uint256 price, address tokenAddress, uint256 tokenId, uint256 offerId);
  event artworkRemoved(address owner, uint256 tokenId, address tokenAddress);

  constructor(address _OpenMintContractAddress, address _PaymentGatewayAddress, address payable _publisherWallet) {
    _setOpenMintContract(_OpenMintContractAddress);
    _setPaymentGatewayContract(_PaymentGatewayAddress);
    publisherWallet = _publisherWallet;
  }

  function _setPaymentGatewayContract(address _PaymentGatewayAddress) internal onlyOwner{
    _PaymentGateway = PaymentGateway(_PaymentGatewayAddress);
  }

  function _setOpenMintContract(address _OpenMintContractAddress) internal onlyOwner{
    _OpenMint = OpenMint(_OpenMintContractAddress);
  }

  function setOffer(uint256 price, uint256 tokenId, address tokenAddress) public{
    require(_OpenMint.ownerOf(tokenId) == msg.sender, "Only the owner of the artwork is allowed to do this");
    require(_OpenMint.isApprovedForAll(msg.sender, address(this)) == true, "Not approved to sell");
    require(price > 0, "No free art here buddy");
    require(tokenIdToOffer[tokenId].active == false, "Item is already on sale");
    require(tokenIdToOffer[tokenId].isSold == false, "Item already sold");

    uint256 offerId = offers.length;

    Offer memory offer = Offer(payable(msg.sender), tokenAddress, price, offerId, tokenId, false, true);

    tokenIdToOffer[tokenId] = offer;

    offers.push(offer);

    emit artworkAdded(address(_OpenMint), msg.sender, price, tokenId, offerId, false);
  }

  function changePrice(uint256 newPrice, uint256 tokenId, address tokenAddress) public{
    require(offers[tokenIdToOffer[tokenId].offerId].seller == msg.sender, "Must be seller");
    require(newPrice > 0, "No free art here buddy");
    require(offers[tokenIdToOffer[tokenId].offerId].active == true, "Offer must be active");
    require(offers[tokenIdToOffer[tokenId].offerId].isSold == false, "Item already sold");

    offers[tokenIdToOffer[tokenId].offerId].price = newPrice;

    emit priceChanged(msg.sender, newPrice, tokenAddress, tokenId, offers[tokenIdToOffer[tokenId].offerId].offerId);
  }

  function removeOffer(uint256 tokenId, address tokenAddress) public{
    require(offers[tokenIdToOffer[tokenId].offerId].seller == msg.sender, "Must be the seller/owner to remove an offer");

    offers[tokenIdToOffer[tokenId].offerId].active = false;
    delete tokenIdToOffer[tokenId];

    emit artworkRemoved(msg.sender, tokenId, tokenAddress);
  }

  function buyArt(uint256 tokenId, address tokenAddress) public payable{
    Offer memory offer = tokenIdToOffer[tokenId];
    require(offers[offer.offerId].price == msg.value, "Payment must be equal to price of the art");
    require(offers[offer.offerId].seller != msg.sender, "Cannot buy your own artwork");
    require(offers[offer.offerId].active == true, "Offer must be active");

    delete tokenIdToOffer[tokenId];
    offers[offer.offerId].isSold = true;
    offers[offer.offerId].active = false;

    _OpenMint.safeTransferFrom(offer.seller, msg.sender, tokenId);

    _distributeFees(tokenId, offers[offer.offerId].price, offer.seller);

    emit artworkSold(tokenAddress, msg.sender, offers[offer.offerId].price, offers[offer.offerId].tokenId, offers[offer.offerId].offerId);
  }

  function _computeCreatorFee(uint256 price, uint8 royalty) internal pure returns(uint256){
    uint256 creatorFee = price * royalty / 100;
    return creatorFee;
  }

  function _computePublisherFee(uint256 price) internal pure returns(uint256){
    uint256 publisherFee = price * 2 / 100;
    return publisherFee;
  }

  function _distributeFees(uint256 tokenId, uint256 price, address payable seller) internal{
    uint8 creatorRoyalty = _OpenMint.getRoyalty(tokenId);
    uint256 creatorFee = _computeCreatorFee(price, creatorRoyalty);
    uint256 publisherFee = _computePublisherFee(price);
    uint256 payment = uint256(price.sub(creatorFee).sub(publisherFee));

    address payable creator = _OpenMint.getCreator(tokenId);

    _PaymentGateway.sendPayment{value: creatorFee}(creator);
    _PaymentGateway.sendPayment{value: payment}(seller);
    _PaymentGateway.sendPayment{value: publisherFee}(publisherWallet);
  }
}
