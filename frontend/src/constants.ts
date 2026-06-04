export const LOCK_OPTIONS = [
  { days: 7, lockDuration: 7 * 24 * 60 * 60, rewardPercent: 3 },
  { days: 14, lockDuration: 14 * 24 * 60 * 60, rewardPercent: 7 },
  { days: 30, lockDuration: 30 * 24 * 60 * 60, rewardPercent: 15 },
] as const
export type LockOption = (typeof LOCK_OPTIONS)[number]
export const EXPECTED_CHAIN_ID = 11155111n
export const READ_RPC_URL = import.meta.env.VITE_RPC_URL
export const CONTRACT_ADDRESS = import.meta.env.VITE_DEPLOYED_CONTRACT_ADDRESS
