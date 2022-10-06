// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IMyERC20 is IERC20 {
    function mint(address to, uint256 amount) external;
    function burnFrom(address to, uint256 amount) external;
}

interface IMyERC721 is IERC721 {
    function safeMint(address to, uint256 tokenId) external;
    function burn(uint256 tokenId) external;
}

contract TokenSale is Ownable {
    /// @notice Purhase ratio betwen Sale ERC20 and Ether
    uint256 public erc20PurchaseRatio;
    uint256 public tokenPrice;
    IMyERC20 public paymentToken;
    IMyERC721 public nftContract;
    uint256 public adminPool;
    uint256 public publicPool;

    constructor(uint256 _ratio, uint256 _tokenPrice, address _paymentToken, address _nftContract) {
        erc20PurchaseRatio = _ratio;
        paymentToken = IMyERC20(_paymentToken);
        tokenPrice = _tokenPrice;
        nftContract = IMyERC721(_nftContract);
    }

    function purchaseTokens() public payable {
        uint256 etherReceived = msg.value;
        uint256 tokensToBeEarned = etherReceived / erc20PurchaseRatio;
        paymentToken.mint(msg.sender, tokensToBeEarned);
    }

    function burnTokens(uint256 amount) public {
        paymentToken.burnFrom(msg.sender, amount);
        uint256 ethToBeReturned = amount * erc20PurchaseRatio;
        payable(msg.sender).transfer(ethToBeReturned);
    }

    function purchaseNFT(uint256 tokenId) public {
        paymentToken.transferFrom(msg.sender, address(this), tokenPrice);
        nftContract.safeMint(msg.sender, tokenId);
        uint256 charge = tokenPrice / 2;
        adminPool += charge;
        publicPool += tokenPrice - charge;
    }

    function burnNFT(uint256 tokenId) public {
        nftContract.burn(tokenId);
        paymentToken.transfer(msg.sender, tokenPrice / 2);
    }

    function withdraw(uint256 amount) public onlyOwner {
        require(amount <= adminPool);
        adminPool -= amount;
        paymentToken.transfer(msg.sender, amount);        
    }
}