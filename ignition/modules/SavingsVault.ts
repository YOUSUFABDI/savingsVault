import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

const SavingsVaultModule = buildModule("SavingsVaultModule", (m) => {
  // Deploy the contract
  const savingsVault = m.contract("SavingsVault")

  return { savingsVault }
})

export default SavingsVaultModule
