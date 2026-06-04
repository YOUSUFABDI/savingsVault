import { formatEth } from "../utils/format"

type Props = {
  balance: bigint | null
  loading: boolean
}

export function VaultStats({ balance, loading }: Props) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 shadow-lg shadow-black/20">
      <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
        Vault balance
      </p>
      <p className="mt-2 font-mono text-3xl font-semibold text-emerald-400 sm:text-4xl">
        {loading ? "…" : balance !== null ? `${formatEth(balance)} ETH` : "—"}
      </p>
      <p className="mt-2 text-sm text-zinc-500">
        Total ETH held in the smart contract
      </p>
    </section>
  )
}
