// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract NftCollection is ERC721URIStorage, Ownable, Pausable {
    
    uint256 private _nextTokenId;
    uint256 public immutable MAX_SUPPLY;

    string private _baseTokenURI;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        uint256 maxSupply_
    )
        ERC721(name_, symbol_)
        Ownable(msg.sender)
    {
        require(maxSupply_ > 0, "Max supply must be greater than zero");
        MAX_SUPPLY = maxSupply_;

        // ✅ FIXED: correct variable names
        _baseTokenURI = baseURI_;
    }

    function setBaseURI(string memory newBaseURI) public onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function safeMint(address to) public onlyOwner whenNotPaused {
        uint256 currentId = _nextTokenId;
        require(currentId < MAX_SUPPLY, "Max supply reached");

        _nextTokenId++;
        _safeMint(to, currentId);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }
}