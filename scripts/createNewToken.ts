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
  const name = 'New Interchain Token'
  const symbol = 'NIT'
  const decimals = 18

  // Intial token supply
  const initialSupply = parseEther('1000')

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

const api = new AxelarQueryAPI({ environment: Environment.TESTNET })

// Estimate gas costs.
async function gasEstimator() {
  const gas = await api.estimateGasFee(
    EvmChain.SEPOLIA,
    EvmChain.BLAST_SEPOLIA,
    GasToken.ETH,
    700000,
    1.1
  )

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
  const salt = '0x4bc4c3cb44cd2a48c1cd8325969b12bb00cc689c2a3e6189387ce4adca0d548a'

  // Initiate transaction
  const txn = await interchainTokenFactoryContract.deployRemoteInterchainToken(
    'Ethereum Sepolia',
    salt,
    signer.address,
    'Blast Sepolia Testnet',
    Number(gasAmount) * 2,
    { value: Number(gasAmount) * 2 }
  )

  console.log(`Transaction Hash: ${txn.hash}`)
}

async function transferTokens() {
  // Get signer
  const signer = await getSigner()

  const interchainToken = await getContractInstance(
    '0x4D5361D08321d51e3821D7BCe23d711b594767e7', // Update with new token address
    interchainTokenContractABI, // Interchain Token contract ABI
    signer
  )

  // Calculate gas amount
  const gasAmount = await gasEstimator()

  // Initate transfer via token
  const transfer = await interchainToken.interchainTransfer(
    'Polygon', // Destination chain
    '0x2d33B6d215B2aF28e4Ce2b1E02C62e8793750F6C', // Update with your own wallet address
    parseEther('25'), // Transfer 25 tokens
    '0x', // Empty data payload
    { value: gasAmount } // Transaction options
  )
  console.log('Transfer Transaction Hash:', transfer.hash)
}

async function deployTokenManager() {
  // Generate random salt
  const salt = '0x' + crypto.randomBytes(32).toString('hex')

  const signer = await getSigner()
  const interchainTokenServiceContract = await getContractInstance(
    interchainTokenServiceContractAddress,
    interchainTokenServiceContractABI,
    signer
  )

  const gasValue = await gasEstimator()

  const tokenManager = await interchainTokenServiceContract.deployTokenManager(
    salt,
    'Blast Sepolia Testnet', //sepolia
    0,
    '0x000000000000000000000000000000000000000000000000000000000000004000000000000000000000000003bf6e95090fd4cbe1e7bdb2b2228113303c0c5f00000000000000000000000000000000000000000000000000000000000000148b736035bbda71825e0219f5fe4dfb22c35fbddc000000000000000000000000',
    gasValue,
    { value: gasValue }
  )

  console.log('token manager', tokenManager)
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
    case 'deployTokenManager':
      await deployTokenManager()
      break
    case 'gasEstimate':
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
