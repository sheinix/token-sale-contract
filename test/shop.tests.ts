import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import exp from "constants"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import { MyERC20, MyERC721, TokenSale } from "../typechain-types"
import { erc721 } from "../typechain-types/@openzeppelin/contracts/token"

const ERC20_TOKEN_RATIO = 5
const NFT_TOKEN_PRICE = 1

describe("NFT Shop", async () => {
    let tokenSaleContract: TokenSale
    let erc20Token: MyERC20
    let erc721Token: MyERC721
    let accounts: SignerWithAddress[]
    let deployer: SignerWithAddress
    let acc1: SignerWithAddress

    beforeEach(async () => {
        // Get Accounts to Interact:
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        acc1 = accounts[1]

        // Deploy ERC20:
        const erc20TokenFactroy = await ethers.getContractFactory("MyERC20")
        const erc721TokenFactroy = await ethers.getContractFactory("MyERC721")
        erc20Token = await erc20TokenFactroy.deploy()
        erc721Token = await erc721TokenFactroy.deploy()
        await erc20Token.deployed()
        await erc721Token.deployed()

        // Deploy TokenSale Contract:
        const tokenSaleContractFractory = await ethers.getContractFactory("TokenSale")
        tokenSaleContract = await tokenSaleContractFractory.deploy(
            ERC20_TOKEN_RATIO,
            NFT_TOKEN_PRICE,
            erc20Token.address,
            erc721Token.address
        )
        await tokenSaleContract.deployed()

        // Grant Mint Role to TokenSale Contract
        const MINTER_ROL_ERC20 = await erc20Token.MINTER_ROLE()
        const MINTER_ROLE_ERC721 = await erc721Token.MINTER_ROLE()
        const grantRoleERC20Tx = await erc20Token.grantRole(
            MINTER_ROL_ERC20,
            tokenSaleContract.address
        )
        await grantRoleERC20Tx.wait()
        const grantRoleERC721Tx = await erc721Token.grantRole(
            MINTER_ROLE_ERC721,
            tokenSaleContract.address
        )
        await grantRoleERC721Tx.wait()
    })

    describe("When the Shop contract is deployed", async () => {
        it("defines the ratio as provided in parameters", async () => {
            const rate = await tokenSaleContract.erc20PurchaseRatio()
            expect(rate).to.eq(ERC20_TOKEN_RATIO)
        })

        it("uses a valid ERC20 as payment token", async () => {
            const paymentTokenAddr = await tokenSaleContract.paymentToken()
            const erc20TokenFactroy = await ethers.getContractFactory("MyERC20")
            const paymentTokenContract = erc20TokenFactroy.attach(paymentTokenAddr)
            const myBalance = await paymentTokenContract.balanceOf(deployer.address)
            expect(myBalance).to.eq(0)
            const totalSupply = await paymentTokenContract.totalSupply()
            expect(totalSupply).to.eq(0)
            expect(paymentTokenAddr).to.eq(erc20Token.address)
        })
    })

    describe("When a user purchase an ERC20 from the Token contract", async () => {
        const amountToBeSentBn = ethers.utils.parseEther("1")
        const amountToBeReceived = amountToBeSentBn.div(ERC20_TOKEN_RATIO)
        let balanceBeforeBn: BigNumber
        let purchaseGasCosts: BigNumber

        beforeEach(async () => {
            balanceBeforeBn = await acc1.getBalance()
            const purchaseTokensTx = await tokenSaleContract
                .connect(acc1)
                .purchaseTokens({ value: amountToBeSentBn })
            const purchaseTokensTxReceipt = await purchaseTokensTx.wait()
            const gasUnitsUsed = purchaseTokensTxReceipt.gasUsed
            const gasPrice = purchaseTokensTxReceipt.effectiveGasPrice
            purchaseGasCosts = gasUnitsUsed.mul(gasPrice)
        })

        it("charges the correct amount of ETH", async () => {
            const balanceAfterBn = await acc1.getBalance()
            const diff = balanceBeforeBn.sub(balanceAfterBn)
            const expectedDiff = amountToBeSentBn.add(purchaseGasCosts)
            expect(expectedDiff).to.equal(diff)
        })

        it("gives the correct amount of tokens", async () => {
            const acc1Balance = await erc20Token.balanceOf(acc1.address)
            expect(acc1Balance).to.eq(amountToBeSentBn.div(ERC20_TOKEN_RATIO))
        })

        it("it increases the balance of ETH in the contract", async () => {
            const contractBalance = await ethers.provider.getBalance(tokenSaleContract.address)
            expect(contractBalance).to.eq(amountToBeSentBn)
        })

        describe("When a user burns an ERC20 at the Token contract", async () => {
            let approveGasCosts: BigNumber
            let burnGasCosts: BigNumber

            beforeEach(async () => {
                const approveTx = await erc20Token
                    .connect(acc1)
                    .approve(tokenSaleContract.address, amountToBeReceived)
                const approveTxReceipt = await approveTx.wait()
                const approveGasUnitsUsed = approveTxReceipt.gasUsed
                const approveGasPrice = approveTxReceipt.effectiveGasPrice
                approveGasCosts = approveGasUnitsUsed.mul(approveGasPrice)
                const burnTokensTx = await tokenSaleContract
                    .connect(acc1)
                    .burnTokens(amountToBeReceived)
                const burnTokensTxReceipt = await burnTokensTx.wait()
                const burnGasUnitsUsed = burnTokensTxReceipt.gasUsed
                const burnGasPrice = burnTokensTxReceipt.effectiveGasPrice
                burnGasCosts = burnGasUnitsUsed.mul(burnGasPrice)
            })
            it("gives the correct amount of ETH", async () => {
                const balanceAfterBn = await acc1.getBalance()
                const diff = balanceBeforeBn.sub(balanceAfterBn)
                console.log(diff)
            })

            it("burns the correct amount of tokens", async () => {
                const acc1Balance = await erc20Token.balanceOf(acc1.address)
                expect(acc1Balance).to.eq(0)
                const totalSupply = await erc20Token.totalSupply()
                expect(totalSupply).to.eq(0)
            })
        })
    })

    describe("When a user purchase a NFT from the Shop contract", async () => {
        it("charges the correct amount of ERC20", async () => {})

        it("updates the owner account correctly", async () => {
            throw new Error("Not implemented")
        })

        it("update the pool account correctly", async () => {
            throw new Error("Not implemented")
        })

        it("favors the pool with the rounding", async () => {
            throw new Error("Not implemented")
        })
    })

    describe("When a user burns their NFT at the Shop contract", async () => {
        it("gives the correct amount of ERC20 tokens", async () => {
            throw new Error("Not implemented")
        })
        it("updates the pool correctly", async () => {
            throw new Error("Not implemented")
        })
    })

    describe("When the owner withdraw from the Shop contract", async () => {
        it("recovers the right amount of ERC20 tokens", async () => {
            throw new Error("Not implemented")
        })

        it("updates the owner account correctly", async () => {
            throw new Error("Not implemented")
        })
    })
})
