import { ethers } from "hardhat";
import * as dotenv from "dotenv"
import {  } from "../typechain-types"
dotenv.config();

const ERC20_TOKEN_RATIO = 5;
const NFT_TOKEN_PRICE = 0.1;

async function main() {
  // const provider = ethers.getDefaultProvider("goerli");
  // const wallet = ethers.Wallet.createRandom();
  // const signer = wallet.connect(provider) ;
  // const tokenSaleContractFactory = new TokenSaleFactory(signer) ;
  // const tokensalecontract = await tokenSaleContractFactory.deploy(ERC20_TOKEN_RATIO, NFT_TOKEN_PRICE, ERC20_CONTRACT_ADDRESS, "0x333555777");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
