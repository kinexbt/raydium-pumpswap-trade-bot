// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./node_modules/@openzeppelin/contracts/utils/Counters.sol";

contract OpenMint is ERC721 {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  constructor () ERC721("OpenMint", "OM"){}

  struct Artwork{
    uint256 id;
    address payable creator;
    address tokenAddress;
    string uri;
    uint8 royalty;
  }

  mapping(uint256 => Artwork) public Artworks;

  function createArtwork(string memory uri, uint8 royalty) public returns(uint256){
    require(royalty > 0, "Royalty cannot be zero or smaller than zero");
    _tokenIds.increment();
    uint256 newArtworkId = _tokenIds.current();
    _safeMint(payable(msg.sender), newArtworkId);

    Artworks[newArtworkId] = Artwork(newArtworkId, payable(msg.sender), address(this), uri, royalty);

    return newArtworkId;
  }

  function tokenURI(uint256 tokenId) public view override returns (string memory) {
    require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

    return Artworks[tokenId].uri;
  }

  function getRoyalty(uint256 tokenId) external virtual view returns(uint8 royalty){
    require(_exists(tokenId), "ERC721Metadata: Royalty query for nonexistent token");

    return Artworks[tokenId].royalty;
  }

  function getCreator(uint256 tokenId) external virtual view returns(address payable creator){
    require(_exists(tokenId), "ERC721Metadata: Creator query for nonexistent token");

    return payable(Artworks[tokenId].creator);
  }
}
