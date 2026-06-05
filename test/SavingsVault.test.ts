import { expect } from "chai"
import hre from "hardhat"

const getEthers = () => {
  const ethers = (hre as any).ethers || (global as any).ethers
  if (!ethers) {
    throw new Error(
      "Hardhat Ethers plugin is not loaded. Please verify your hardhat.config file.",
    )
  }
  return ethers
}
const getNetwork = () => hre.network

const ETH = (n: string) => getEthers().parseEther(n)
const DAYS = (n: number) => n * 24 * 60 * 60

const LOCK_7 = DAYS(7)
const LOCK_14 = DAYS(14)
const LOCK_30 = DAYS(30)

async function timeTravel(seconds: number) {
  const provider = (getNetwork() as any).provider
  await provider.request({
    method: "evm_increaseTime",
    params: [seconds],
  })
  await provider.request({ method: "evm_mine", params: [] })
}

describe("SavingsVault", function () {
  let vault: any
  let owner: any
  let user1: any
  let user2: any

  beforeEach(async function () {
    const ethers = getEthers()
    const signers = await ethers.getSigners()
    owner = signers[0]
    user1 = signers[1]
    user2 = signers[2]
    const Factory = await ethers.getContractFactory("SavingsVault")
    vault = await Factory.deploy({ value: ethers.parseEther("10") })
    await vault.waitForDeployment()
  })

  describe("Deployment", function () {
    it("sets the correct owner", async function () {
      expect(await vault.owner()).to.equal(owner.address)
    })
    it("accepts ETH on deploy and shows correct vault balance", async function () {
      expect(await vault.vaultBalance()).to.equal(ETH("10"))
    })
    it("starts with zero totalDeposits", async function () {
      expect(await vault.totalDeposits()).to.equal(0n)
    })
    it("starts with zero collectedPenalties", async function () {
      expect(await vault.collectedPenalties()).to.equal(0n)
    })
  })

  describe("deposit()", function () {
    it("accepts a valid 7-day deposit", async function () {
      await vault.connect(user1).deposit(LOCK_7, { value: ETH("1") })
      expect(await vault.getDepositCount(user1.address)).to.equal(1n)
    })
    it("accepts a valid 14-day deposit", async function () {
      await vault.connect(user1).deposit(LOCK_14, { value: ETH("1") })
      expect(await vault.getDepositCount(user1.address)).to.equal(1n)
    })
    it("accepts a valid 30-day deposit", async function () {
      await vault.connect(user1).deposit(LOCK_30, { value: ETH("1") })
      expect(await vault.getDepositCount(user1.address)).to.equal(1n)
    })
    it("reverts when ETH value is 0", async function () {
      await expect(
        vault.connect(user1).deposit(LOCK_7, { value: 0 }),
      ).to.be.revertedWith("Must deposit ETH")
    })
    it("reverts for an invalid lock duration", async function () {
      await expect(
        vault.connect(user1).deposit(DAYS(5), { value: ETH("1") }),
      ).to.be.revertedWith("Invalid lock duration")
    })
    it("supports multiple deposits per user", async function () {
      await vault.connect(user1).deposit(LOCK_7, { value: ETH("1") })
      await vault.connect(user1).deposit(LOCK_14, { value: ETH("2") })
      expect(await vault.getDepositCount(user1.address)).to.equal(2n)
    })
    it("increases totalDeposits", async function () {
      await vault.connect(user1).deposit(LOCK_7, { value: ETH("1") })
      expect(await vault.totalDeposits()).to.equal(ETH("1"))
    })
    it("emits Deposited event with correct args", async function () {
      await expect(vault.connect(user1).deposit(LOCK_7, { value: ETH("1") }))
        .to.emit(vault, "Deposited")
        .withArgs(user1.address, ETH("1"), BigInt(LOCK_7), 0n)
    })
    it("stores correct deposit data", async function () {
      await vault.connect(user1).deposit(LOCK_7, { value: ETH("1") })
      const dep = await vault.deposits(user1.address, 0)
      expect(dep.amount).to.equal(ETH("1"))
      expect(dep.lockDuration).to.equal(BigInt(LOCK_7))
      expect(dep.withdrawn).to.equal(false)
    })
  })

  describe("withdraw()", function () {
    it("pays out principal + 3% reward after 7-day lock", async function () {
      await vault.connect(user1).deposit(LOCK_7, { value: ETH("1") })
      await timeTravel(LOCK_7 + 1)
      const provider = getEthers().provider
      const before = await provider.getBalance(user1.address)
      const tx = await vault.connect(user1).withdraw(0)
      const receipt = await tx.wait()
      const gasUsed = receipt.gasUsed * receipt.gasPrice
      const after = await provider.getBalance(user1.address)
      expect(after - before + gasUsed).to.equal(ETH("1.03"))
    })
    it("pays out principal + 7% reward after 14-day lock", async function () {
      await vault.connect(user1).deposit(LOCK_14, { value: ETH("1") })
      await timeTravel(LOCK_14 + 1)
      const provider = getEthers().provider
      const before = await provider.getBalance(user1.address)
      const tx = await vault.connect(user1).withdraw(0)
      const receipt = await tx.wait()
      const gasUsed = receipt.gasUsed * receipt.gasPrice
      const after = await provider.getBalance(user1.address)
      expect(after - before + gasUsed).to.equal(ETH("1.07"))
    })
    it("pays out principal + 15% reward after 30-day lock", async function () {
      await vault.connect(user1).deposit(LOCK_30, { value: ETH("1") })
      await timeTravel(LOCK_30 + 1)
      const provider = getEthers().provider
      const before = await provider.getBalance(user1.address)
      const tx = await vault.connect(user1).withdraw(0)
      const receipt = await tx.wait()
      const gasUsed = receipt.gasUsed * receipt.gasPrice
      const after = await provider.getBalance(user1.address)
      expect(after - before + gasUsed).to.equal(ETH("1.15"))
    })
    it("reverts if lock period not over yet", async function () {
      await vault.connect(user1).deposit(LOCK_7, { value: ETH("1") })
      await expect(vault.connect(user1).withdraw(0)).to.be.revertedWith(
        "Still locked",
      )
    })
    it("reverts on double withdraw", async function () {
      await vault.connect(user1).deposit(LOCK_7, { value: ETH("1") })
      await timeTravel(LOCK_7 + 1)
      await vault.connect(user1).withdraw(0)
      await expect(vault.connect(user1).withdraw(0)).to.be.revertedWith(
        "Already withdrawn",
      )
    })
    it("reverts for invalid deposit index", async function () {
      await expect(vault.connect(user1).withdraw(99)).to.be.revertedWith(
        "Invalid deposit index",
      )
    })
    it("emits Withdrawn event with correct args", async function () {
      await vault.connect(user1).deposit(LOCK_7, { value: ETH("1") })
      await timeTravel(LOCK_7 + 1)
      await expect(vault.connect(user1).withdraw(0))
        .to.emit(vault, "Withdrawn")
        .withArgs(user1.address, ETH("1"), ETH("0.03"), 0n)
    })
    it("decreases totalDeposits after withdraw", async function () {
      await vault.connect(user1).deposit(LOCK_7, { value: ETH("1") })
      await timeTravel(LOCK_7 + 1)
      await vault.connect(user1).withdraw(0)
      expect(await vault.totalDeposits()).to.equal(0n)
    })
  })

  describe("earlyWithdraw()", function () {
    it("returns 90% of principal before lock expires", async function () {
      await vault.connect(user1).deposit(LOCK_30, { value: ETH("1") })
      await timeTravel(DAYS(5))
      const provider = getEthers().provider
      const before = await provider.getBalance(user1.address)
      const tx = await vault.connect(user1).earlyWithdraw(0)
      const receipt = await tx.wait()
      const gasUsed = receipt.gasUsed * receipt.gasPrice
      const after = await provider.getBalance(user1.address)
      expect(after - before + gasUsed).to.equal(ETH("0.9"))
    })
    it("accumulates penalty in collectedPenalties", async function () {
      await vault.connect(user1).deposit(LOCK_30, { value: ETH("1") })
      await timeTravel(DAYS(5))
      await vault.connect(user1).earlyWithdraw(0)
      expect(await vault.collectedPenalties()).to.equal(ETH("0.1"))
    })
    it("reverts if lock already expired", async function () {
      await vault.connect(user1).deposit(LOCK_7, { value: ETH("1") })
      await timeTravel(LOCK_7 + 1)
      await expect(vault.connect(user1).earlyWithdraw(0)).to.be.revertedWith(
        "Lock already expired - use withdraw()",
      )
    })
    it("reverts on double early withdraw", async function () {
      await vault.connect(user1).deposit(LOCK_30, { value: ETH("1") })
      await timeTravel(DAYS(5))
      await vault.connect(user1).earlyWithdraw(0)
      await expect(vault.connect(user1).earlyWithdraw(0)).to.be.revertedWith(
        "Already withdrawn",
      )
    })
    it("emits EarlyWithdrawn event with correct args", async function () {
      await vault.connect(user1).deposit(LOCK_30, { value: ETH("1") })
      await timeTravel(DAYS(5))
      await expect(vault.connect(user1).earlyWithdraw(0))
        .to.emit(vault, "EarlyWithdrawn")
        .withArgs(user1.address, ETH("1"), ETH("0.1"), 0n)
    })
  })

  describe("Owner functions", function () {
    it("owner can fund the vault", async function () {
      const before = await vault.vaultBalance()
      await vault.connect(owner).fundVault({ value: ETH("5") })
      expect(await vault.vaultBalance()).to.equal(before + ETH("5"))
    })
    it("non-owner cannot fund the vault", async function () {
      await expect(
        vault.connect(user1).fundVault({ value: ETH("1") }),
      ).to.be.revertedWith("Not owner")
    })
    it("owner can withdraw collected penalties", async function () {
      await vault.connect(user1).deposit(LOCK_30, { value: ETH("1") })
      await timeTravel(DAYS(5))
      await vault.connect(user1).earlyWithdraw(0)
      const provider = getEthers().provider
      const before = await provider.getBalance(owner.address)
      const tx = await vault.connect(owner).withdrawPenalties()
      const receipt = await tx.wait()
      const gasUsed = receipt.gasUsed * receipt.gasPrice
      const after = await provider.getBalance(owner.address)
      expect(after - before + gasUsed).to.equal(ETH("0.1"))
      expect(await vault.collectedPenalties()).to.equal(0n)
    })
    it("reverts withdrawPenalties when no penalties exist", async function () {
      await expect(vault.connect(owner).withdrawPenalties()).to.be.revertedWith(
        "No penalties to withdraw",
      )
    })
    it("non-owner cannot withdraw penalties", async function () {
      await vault.connect(user1).deposit(LOCK_30, { value: ETH("1") })
      await timeTravel(DAYS(5))
      await vault.connect(user1).earlyWithdraw(0)
      await expect(vault.connect(user1).withdrawPenalties()).to.be.revertedWith(
        "Not owner",
      )
    })
    it("emits VaultFunded event", async function () {
      await expect(vault.connect(owner).fundVault({ value: ETH("1") }))
        .to.emit(vault, "VaultFunded")
        .withArgs(owner.address, ETH("1"))
    })
  })

  describe("View functions", function () {
    it("getDeposits() returns correct deposit data", async function () {
      await vault.connect(user1).deposit(LOCK_7, { value: ETH("1") })
      const deps = await vault.getDeposits(user1.address)
      expect(deps.length).to.equal(1)
      expect(deps[0].amount).to.equal(ETH("1"))
      expect(deps[0].lockDuration).to.equal(BigInt(LOCK_7))
      expect(deps[0].withdrawn).to.equal(false)
    })
    it("getDepositCount() returns correct count", async function () {
      await vault.connect(user1).deposit(LOCK_7, { value: ETH("1") })
      await vault.connect(user1).deposit(LOCK_14, { value: ETH("1") })
      expect(await vault.getDepositCount(user1.address)).to.equal(2n)
    })
    it("getUnlockTime() returns correct unlock timestamp", async function () {
      const ethers = getEthers()
      const tx = await vault.connect(user1).deposit(LOCK_7, { value: ETH("1") })
      const block = await ethers.provider.getBlock(tx.blockNumber!)
      const unlock = await vault.getUnlockTime(user1.address, 0)
      expect(unlock).to.equal(BigInt(block!.timestamp) + BigInt(LOCK_7))
    })
    it("getExpectedReward() returns 3% for 7-day deposit", async function () {
      await vault.connect(user1).deposit(LOCK_7, { value: ETH("1") })
      const reward = await vault.getExpectedReward(user1.address, 0)
      expect(reward).to.equal(ETH("0.03"))
    })
    it("getExpectedReward() returns 15% for 30-day deposit", async function () {
      await vault.connect(user1).deposit(LOCK_30, { value: ETH("1") })
      const reward = await vault.getExpectedReward(user1.address, 0)
      expect(reward).to.equal(ETH("0.15"))
    })
    it("vaultBalance() reflects deposits", async function () {
      const initial = await vault.vaultBalance()
      await vault.connect(user1).deposit(LOCK_7, { value: ETH("1") })
      expect(await vault.vaultBalance()).to.equal(initial + ETH("1"))
    })
  })

  describe("Multi-user scenarios", function () {
    it("two users can deposit independently", async function () {
      await vault.connect(user1).deposit(LOCK_7, { value: ETH("1") })
      await vault.connect(user2).deposit(LOCK_14, { value: ETH("2") })
      expect(await vault.getDepositCount(user1.address)).to.equal(1n)
      expect(await vault.getDepositCount(user2.address)).to.equal(1n)
      expect(await vault.totalDeposits()).to.equal(ETH("3"))
    })
    it("user1 withdraw does not affect user2 deposit", async function () {
      await vault.connect(user1).deposit(LOCK_7, { value: ETH("1") })
      await vault.connect(user2).deposit(LOCK_7, { value: ETH("1") })
      await timeTravel(LOCK_7 + 1)
      await vault.connect(user1).withdraw(0)
      const dep = await vault.deposits(user2.address, 0)
      expect(dep.withdrawn).to.equal(false)
    })
  })
})
