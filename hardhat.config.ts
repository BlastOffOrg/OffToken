import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import * as dotenv from 'dotenv'
dotenv.config({ path: __dirname + '/.env' })

const config: HardhatUserConfig = {
  //solidity: "0.8.19",
  networks: {
    hardhat: { gasPrice: 250_000_000_000 },
    base: {
      url: 'https://go.getblock.io/d87f48410c844ae2b536597ac2cbb749',
      accounts: [process.env.PR_KEY || '']
    },
    basetest: {
      url: 'https://base-goerli.public.blastapi.io',
      accounts: [process.env.PR_KEY || '']
    },
    optest: {
      url: 'https://polygon-mumbai-infura.wallet.coinbase.com?targetName=optimism-goerli',
      accounts: [process.env.PR_KEY || '']
    },
    baobab: {
      url: 'https://public-en-baobab.klaytn.net',
      accounts: [process.env.PR_KEY || '']
    },
    cypress: {
      url: 'https://public-en-cypress.klaytn.net',
      accounts: [process.env.PR_KEY || '']
    },
    sepolia: {
      url: 'https://ethereum-sepolia.publicnode.com',
      accounts: [process.env.PR_KEY || '']
    },
    blastTest: {
      url: 'https://sepolia.blast.io',
      accounts: [process.env.PR_KEY || '']
    },
    fantom: {
      url: 'https://rpc.ankr.com/fantom_testnet',
      chainId: 4002,
      accounts: [process.env.PR_KEY || '']
    },
    mainnet: {
      url: 'https://rpc.ankr.com/eth',
      accounts: [process.env.PR_KEY || '']
    }
  },
  solidity: {
    version: '0.8.20'
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts'
  },
  mocha: {
    timeout: 40000
  },
  etherscan: {
    apiKey: {
      base: process.env.ETHERSCAN_API_KEY || '',
      baseGoerli: process.env.ETHERSCAN_API_KEY || '',
      sepolia: process.env.ETHERSCAN_API_KEY || '',
      blastTest: 'blast_sepolia',
      mainnet: process.env.ETHERSCAN_API_KEY || ''
    },
    customChains: [
      {
        network: 'base',
        chainId: 8453,
        urls: {
          apiURL: 'https://api.basescan.org/api',
          browserURL: 'https://basescan.org/'
        }
      },
      {
        network: 'blastTest',
        chainId: 168587773,
        urls: {
          apiURL: 'https://api.routescan.io/v2/network/testnet/evm/168587773/etherscan',
          browserURL: 'https://testnet.blastscan.io'
        }
      }
    ]
  }

  // etherscan: {
  //   apiKey: process.env.ETHERSCAN_API_KEY || ''
  // }
}

export default config
