import { useState } from "react"
import type { JsonRpcSigner } from "ethers"
import type { DepositRecord } from "../contract"
import { earlyWithdrawDeposit, withdrawDeposit } from "../contract"
import { Countdown } from "./Countdown"
import {
  formatEth,
  lockDaysFromDuration,
  rewardPercentFromBps,
} from "../utils/format"

type Props = {
  address: string | null
  signer: JsonRpcSigner | null
  deposits: DepositRecord[]
  loading: boolean
  onRefresh: () => void
  onError: (message: string) => void
}

function depositStatus(dep: DepositRecord): "withdrawn" | "ready" | "locked" {
  if (dep.withdrawn) return "withdrawn"
  const now = BigInt(Math.floor(Date.now() / 1000))
  if (now >= dep.unlockTime) return "ready"
  return "locked"
}

export function DepositsDashboard({
  address,
  signer,
  deposits,
  loading,
  onRefresh,
  onError,
}: Props) {
  const [pendingIndex, setPendingIndex] = useState<number | null>(null)

  const active = deposits.filter((d) => !d.withdrawn)

  async function handleWithdraw(index: number) {
    if (!signer) return
    setPendingIndex(index)
    try {
      await withdrawDeposit(signer, index)
      onRefresh()
    } catch (err) {
      onError(err instanceof Error ? err.message : "Withdraw failed")
    } finally {
      setPendingIndex(null)
    }
  }

  async function handleEarlyWithdraw(index: number) {
    if (!signer) return
    setPendingIndex(index)
    try {
      await earlyWithdrawDeposit(signer, index)
      onRefresh()
    } catch (err) {
      onError(err instanceof Error ? err.message : "Early withdraw failed")
    } finally {
      setPendingIndex(null)
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">My deposits</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {address
              ? "Your active and past vault positions"
              : "Connect wallet to view"}
          </p>
        </div>
        {address && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition hover:border-zinc-600 hover:text-white disabled:opacity-50"
          >
            Refresh
          </button>
        )}
      </div>

      {!address ? (
        <p className="mt-8 text-center text-sm text-zinc-500">
          Connect MetaMask to see your deposits
        </p>
      ) : loading && deposits.length === 0 ? (
        <p className="mt-8 text-center text-sm text-zinc-500">
          Loading deposits…
        </p>
      ) : active.length === 0 && deposits.length === 0 ? (
        <p className="mt-8 text-center text-sm text-zinc-500">
          No deposits yet — make your first deposit above
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="pb-3 pr-4 font-medium">#</th>
                <th className="pb-3 pr-4 font-medium">Amount</th>
                <th className="pb-3 pr-4 font-medium">Lock</th>
                <th className="pb-3 pr-4 font-medium">Unlock in</th>
                <th className="pb-3 pr-4 font-medium">Reward</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((dep) => {
                const status = depositStatus(dep)
                if (status === "withdrawn") return null
                const busy = pendingIndex === dep.index
                return (
                  <tr
                    key={dep.index}
                    className="border-b border-zinc-800/80 last:border-0"
                  >
                    <td className="py-4 pr-4 font-mono text-zinc-400">
                      {dep.index}
                    </td>
                    <td className="py-4 pr-4 font-mono text-white">
                      {formatEth(dep.amount)} ETH
                    </td>
                    <td className="py-4 pr-4 text-zinc-300">
                      {lockDaysFromDuration(dep.lockDuration)}d ·{" "}
                      {rewardPercentFromBps(dep.interestRate)}%
                    </td>
                    <td className="py-4 pr-4">
                      <Countdown unlockTimestamp={dep.unlockTime} />
                    </td>
                    <td className="py-4 pr-4 font-mono text-emerald-400">
                      +{formatEth(dep.expectedReward)} ETH
                    </td>
                    <td className="py-4 pr-4">
                      <StatusBadge status={status} />
                    </td>
                    <td className="py-4">
                      {status === "ready" ? (
                        <button
                          type="button"
                          disabled={!signer || busy}
                          onClick={() => void handleWithdraw(dep.index)}
                          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
                        >
                          {busy ? "…" : "Withdraw"}
                        </button>
                      ) : status === "locked" ? (
                        <button
                          type="button"
                          disabled={!signer || busy}
                          onClick={() => void handleEarlyWithdraw(dep.index)}
                          className="rounded-lg border border-amber-600/50 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 cursor-pointer"
                        >
                          {busy ? "…" : "Early withdraw"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {deposits.some((d) => d.withdrawn) && active.length === 0 && (
            <p className="mt-4 text-center text-sm text-zinc-500">
              All deposits have been withdrawn
            </p>
          )}
        </div>
      )}
    </section>
  )
}

function StatusBadge({ status }: { status: "ready" | "locked" | "withdrawn" }) {
  const styles = {
    ready: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
    locked: "bg-zinc-800 text-zinc-400 ring-zinc-700",
    withdrawn: "bg-zinc-800 text-zinc-500 ring-zinc-700",
  }
  const labels = {
    ready: "Ready to withdraw",
    locked: "Locked",
    withdrawn: "Withdrawn",
  }
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}
