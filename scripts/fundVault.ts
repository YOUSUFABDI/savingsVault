import { ethers } from "ethers"

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL)

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider)

  const abi = [
    "function fundVault() external payable",
    "function vaultBalance() external view returns (uint256)",
  ]

  const vault = new ethers.Contract(
    process.env.DEPLOYED_ADDRESS || "",
    abi,
    wallet,
  )

  console.log("Funding vault with 0.02 ETH...")
  const tx = await vault.fundVault({ value: ethers.parseEther("0.02") })
  await tx.wait()
  console.log("✅ Vault funded! Tx:", tx.hash)

  const balance = await vault.vaultBalance()
  console.log("Vault balance now:", ethers.formatEther(balance), "ETH")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
