import { useState, type FormEvent } from "react"
import type { JsonRpcSigner } from "ethers"
import { LOCK_OPTIONS } from "../constants"
import { depositEth } from "../contract"

type Props = {
  signer: JsonRpcSigner | null
  onSuccess: () => void
  onError: (message: string) => void
}

export function DepositForm({ signer, onSuccess, onError }: Props) {
  const [amount, setAmount] = useState("")
  const [lockDuration, setLockDuration] = useState(LOCK_OPTIONS[0].lockDuration)
  const [submitting, setSubmitting] = useState(false)

  const selected = LOCK_OPTIONS.find((o) => o.lockDuration === lockDuration)!

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!signer) {
      onError("Connect your wallet first")
      return
    }
    const trimmed = amount.trim()
    if (!trimmed || Number(trimmed) <= 0) {
      onError("Enter a valid ETH amount")
      return
    }
    setSubmitting(true)
    try {
      await depositEth(signer, trimmed, lockDuration)
      setAmount("")
      onSuccess()
    } catch (err) {
      onError(err instanceof Error ? err.message : "Deposit failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="text-lg font-semibold text-white">Deposit ETH</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Choose a lock period and earn interest at maturity
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-zinc-400"
          >
            Amount (ETH)
          </label>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            placeholder="0.1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!signer || submitting}
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 font-mono text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-zinc-400">
            Lock period
          </span>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {LOCK_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                type="button"
                disabled={!signer || submitting}
                onClick={() => setLockDuration(opt.lockDuration)}
                className={`rounded-lg border px-3 py-3 text-left transition disabled:opacity-50 cursor-pointer ${
                  lockDuration === opt.lockDuration
                    ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/50"
                    : "border-zinc-700 bg-zinc-950 hover:border-zinc-600"
                }`}
              >
                <span className="block font-semibold text-white">
                  {opt.days} days
                </span>
                <span className="text-sm text-emerald-400">
                  {opt.rewardPercent}% reward
                </span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-zinc-500">
          Expected reward at maturity:{" "}
          <span className="text-emerald-400">{selected.rewardPercent}%</span> of
          deposit · Early exit costs a 10% penalty
        </p>

        <button
          type="submit"
          disabled={!signer || submitting}
          className="w-full rounded-lg bg-emerald-500 py-3 font-medium text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {!signer
            ? "Connect wallet to deposit"
            : submitting
            ? "Confirm in MetaMask…"
            : "Deposit"}
        </button>
      </form>
    </section>
  )
}
