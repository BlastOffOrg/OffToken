import crypto from 'crypto'
import { abis as itcTokenServiceAbis } from '../abis/interchainTokenService'
import { abis as itcTokenFactoryAbis } from '../abis/interchainTokenFactory'
import { abis as itcTokenAbis } from '../abis/interchainToken'
import { InterfaceAbi, parseEther } from 'ethers'
import { ethers } from 'hardhat'
import { AxelarQueryAPI, Environment, EvmChain, GasToken } from '@axelar-network/axelarjs-sdk'

const interchainTokenServiceContractABI = itcTokenServiceAbis
const interchainTokenFactoryContractABI = itcTokenFactoryAbis
const interchainTokenContractABI = itcTokenAbis

const interchainTokenServiceContractAddress = '0xB5FB4BE02232B1bBA4dC8f81dc24C26980dE9e3C'
const interchainTokenFactoryContractAddress = '0x83a93500d23Fbc3e82B410aD07A6a9F7A0670D66'

async function getSigner() {
  const [signer] = await ethers.getSigners()
  return signer
}

async function getContractInstance(
  contractAddress: string,
  contractABI: InterfaceAbi,
  signer: any
) {
  return new ethers.Contract(contractAddress, contractABI, signer)
}

// Register and deploy a new interchain token to the Fantom testnet
async function registerAndDeploy() {
  // Generate random salt
  const salt = '0x' + crypto.randomBytes(32).toString('hex')

  // Create a new token
  const name = 'OFF'
  const symbol = 'OFF'
  const decimals = 18

  // Intial token supply
  const initialSupply = parseEther('10000000')

  // Get a signer to sign the transaction
  const signer = await getSigner()

  // Create contract instances
  const interchainTokenFactoryContract = await getContractInstance(
    interchainTokenFactoryContractAddress,
    interchainTokenFactoryContractABI,
    signer
  )
  const interchainTokenServiceContract = await getContractInstance(
    interchainTokenServiceContractAddress,
    interchainTokenServiceContractABI,
    signer
  )

  // Generate a unique token ID using the signer's address and salt
  const tokenId = await interchainTokenFactoryContract.interchainTokenId(signer.address, salt)

  // Retrieve new token address
  const tokenAddress = await interchainTokenServiceContract.interchainTokenAddress(tokenId)

  // Retrieve token manager address
  const expectedTokenManagerAddress = await interchainTokenServiceContract.tokenManagerAddress(
    tokenId
  )

  // Deploy new Interchain Token
  const deployTxData = await interchainTokenFactoryContract.deployInterchainToken(
    salt,
    name,
    symbol,
    decimals,
    initialSupply,
    signer.address
  )

  console.log(
    `
    Deployed Token ID: ${tokenId},
    Token Address: ${tokenAddress},
    Transaction Hash: ${deployTxData.hash},
    salt: ${salt},
    Expected Token Manager Address: ${expectedTokenManagerAddress},
       `
  )
}

const api = new AxelarQueryAPI({ environment: Environment.MAINNET })

// Estimate gas costs.
async function gasEstimator() {
  const gas = await api.estimateGasFee(EvmChain.ETHEREUM, EvmChain.BLAST, GasToken.ETH, 700000, 1.1)
  console.log('gas', gas)
  return gas
}

// Deploy to remote chain: Polygon
async function deployToRemoteChain() {
  // Get a signer for authorizing transactions
  const signer = await getSigner()
  // Get contract for remote deployment
  const interchainTokenFactoryContract = await getContractInstance(
    interchainTokenFactoryContractAddress,
    interchainTokenFactoryContractABI,
    signer
  )

  // Estimate gas fees
  const gasAmount = await gasEstimator()

  console.log('gas', gasAmount)

  // Salt value from registerAndDeploy(). Replace with your own
  const salt = '0x64dd14af87bf66ff8421092d43f4d20786514bc9ac98035efcb77854d0e1733a'

  // Initiate transaction
  const txn = await interchainTokenFactoryContract.deployRemoteInterchainToken(
    'Ethereum',
    salt,
    signer.address,
    'blast',
    gasAmount,
    { value: gasAmount }
  )

  console.log(`Transaction Hash: ${txn.hash}`)
}

async function transferTokens() {
  // Get signer
  const signer = await getSigner()

  const interchainToken = await getContractInstance(
    '0xD55eDfc79c0d14084260D16f38BdA75e28AbFb6A', // Update with new token address
    interchainTokenContractABI, // Interchain Token contract ABI
    signer
  )

  // Calculate gas amount
  const gasAmount = await gasEstimator()

  // Initate transfer via token
  const transfer = await interchainToken.interchainTransfer(
    'blast', // Destination chain
    '0x8b736035BbDA71825e0219f5FE4DfB22C35FbDDC', // Update with your own wallet address
    parseEther('1'), // Transfer 25 tokens
    '0x', // Empty data payload
    { value: gasAmount } // Transaction options
  )
  console.log('Transfer Transaction Hash:', transfer.hash)
}

async function main() {
  const functionName = process.env.FUNCTION_NAME
  switch (functionName) {
    case 'registerAndDeploy':
      await registerAndDeploy()
      break
    case 'deployToRemoteChain':
      await deployToRemoteChain()
      break
    case 'transferTokens':
      await transferTokens()
      break

    case 'gasEstimator':
      await gasEstimator()
      break
    default:
      console.error(`Unknown function: ${functionName}`)
      process.exitCode = 1
      return
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
