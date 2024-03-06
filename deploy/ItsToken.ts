import { ethers, hardhatArguments } from 'hardhat'
import { initConfig, setConfig, updateConfig } from './ultil'

async function main() {
  await initConfig()
  const network = hardhatArguments.network ? hardhatArguments.network : 'dev'

  const itsToken = await ethers.deployContract('ItsToken')

  await itsToken.waitForDeployment()
  console.log(`itsToken with address: ${await itsToken.getAddress()}`)
  setConfig(`${network}.itsToken`, await itsToken.getAddress())
  await updateConfig()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
