import { formatEther } from "ethers"

export function formatEth(wei: bigint, decimals = 4): string {
  const eth = formatEther(wei)
  const n = Number(eth)
  if (!Number.isFinite(n)) return eth
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function lockDaysFromDuration(seconds: bigint): number {
  return Number(seconds / 86400n)
}

export function rewardPercentFromBps(bps: bigint): number {
  return Number(bps) / 100
}
