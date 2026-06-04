import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  JsonRpcSigner,
  formatEther,
  parseEther,
  type InterfaceAbi,
  type Provider,
} from "ethers"
import { CONTRACT_ABI } from "./abi"
import { CONTRACT_ADDRESS, EXPECTED_CHAIN_ID, READ_RPC_URL } from "./constants"

export type DepositRecord = {
  index: number
  amount: bigint
  depositedAt: bigint
  lockDuration: bigint
  interestRate: bigint
  withdrawn: boolean
  unlockTime: bigint
  expectedReward: bigint
}

type RawDeposit = {
  amount: bigint
  depositedAt: bigint
  lockDuration: bigint
  interestRate: bigint
  withdrawn: boolean
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: {
        method: string
        params?: unknown[]
      }) => Promise<unknown>
      on?: (event: string, handler: (...args: unknown[]) => void) => void
      removeListener?: (
        event: string,
        handler: (...args: unknown[]) => void,
      ) => void
    }
  }
}

const abi = CONTRACT_ABI as InterfaceAbi

let readProvider: JsonRpcProvider | null = null

/** Read-only provider — always talks to the Hardhat/local RPC, not MetaMask's chain */
export function getReadProvider(): JsonRpcProvider {
  if (!readProvider) {
    readProvider = new JsonRpcProvider(READ_RPC_URL, Number(EXPECTED_CHAIN_ID))
  }
  return readProvider
}

export function getContract(providerOrSigner: Provider | JsonRpcSigner) {
  return new Contract(CONTRACT_ADDRESS, abi, providerOrSigner)
}

async function assertContractDeployed(provider: Provider): Promise<void> {
  const code = await provider.getCode(CONTRACT_ADDRESS)
  if (code === "0x") {
    throw new Error(
      `No contract at ${CONTRACT_ADDRESS}. Start \`npx hardhat node\`, deploy the contract, then update CONTRACT_ADDRESS in src/abi.ts.`,
    )
  }
}

function calculateReward(amount: bigint, rateBps: bigint): bigint {
  return (amount * rateBps) / 10000n
}

export async function getBrowserProvider(): Promise<BrowserProvider> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed")
  }
  return new BrowserProvider(window.ethereum)
}

export async function connectWallet(): Promise<{
  address: string
  signer: JsonRpcSigner
  chainId: bigint
}> {
  const provider = await getBrowserProvider()
  await provider.send("eth_requestAccounts", [])
  const network = await provider.getNetwork()
  const signer = await provider.getSigner()
  const address = await signer.getAddress()
  return { address, signer, chainId: network.chainId }
}

export async function ensureCorrectChain(): Promise<void> {
  const provider = await getBrowserProvider()
  const network = await provider.getNetwork()
  if (network.chainId !== EXPECTED_CHAIN_ID) {
    throw new Error(
      `Wrong network. Switch MetaMask to Sepolia (chain ID ${EXPECTED_CHAIN_ID}).`,
    )
  }
}

export async function getVaultBalance(
  provider: Provider = getReadProvider(),
): Promise<bigint> {
  await assertContractDeployed(provider)
  const contract = getContract(provider)
  return contract.vaultBalance() as Promise<bigint>
}

/**
 * Loads deposits via getDepositCount + deposits(index).
 * Avoids getDeposits() struct-array decoding issues and empty 0x responses
 * when MetaMask is on a different chain than the deployed contract.
 */
export async function fetchUserDeposits(
  userAddress: string,
  provider: Provider = getReadProvider(),
): Promise<DepositRecord[]> {
  await assertContractDeployed(provider)
  const contract = getContract(provider)

  const count = (await contract.getDepositCount(userAddress)) as bigint
  const records: DepositRecord[] = []

  for (let i = 0; i < Number(count); i++) {
    const dep = (await contract.deposits(userAddress, i)) as RawDeposit
    records.push({
      index: i,
      amount: dep.amount,
      depositedAt: dep.depositedAt,
      lockDuration: dep.lockDuration,
      interestRate: dep.interestRate,
      withdrawn: dep.withdrawn,
      unlockTime: dep.depositedAt + dep.lockDuration,
      expectedReward: calculateReward(dep.amount, dep.interestRate),
    })
  }

  return records
}

export async function depositEth(
  signer: JsonRpcSigner,
  amountEth: string,
  lockDuration: number,
): Promise<void> {
  await ensureCorrectChain()
  const contract = getContract(signer)
  const value = parseEther(amountEth)
  const tx = await contract.deposit(lockDuration, { value })
  await tx.wait()
}

export async function withdrawDeposit(
  signer: JsonRpcSigner,
  depositIndex: number,
): Promise<void> {
  await ensureCorrectChain()
  const contract = getContract(signer)
  const tx = await contract.withdraw(depositIndex)
  await tx.wait()
}

export async function earlyWithdrawDeposit(
  signer: JsonRpcSigner,
  depositIndex: number,
): Promise<void> {
  await ensureCorrectChain()
  const contract = getContract(signer)
  const tx = await contract.earlyWithdraw(depositIndex)
  await tx.wait()
}

export { formatEther, parseEther, CONTRACT_ADDRESS }
