import { shortenAddress } from "../utils/format"

type Props = {
  address: string | null
  connecting: boolean
  wrongNetwork: boolean
  onConnect: () => void
  onDisconnect: () => void
}

export function Header({
  address,
  connecting,
  wrongNetwork,
  onConnect,
  onDisconnect,
}: Props) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/40">
            <span className="text-lg font-bold text-emerald-400">SV</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
              SavingsVault
            </h1>
            <p className="text-xs text-zinc-500">Lock ETH · Earn yield</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {wrongNetwork && (
            <span className="hidden text-xs text-amber-400 sm:inline">
              Wrong network — switch MetaMask to Sepolia
            </span>
          )}
          {address ? (
            <>
              <span className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-emerald-300">
                {shortenAddress(address)}
              </span>
              <button
                type="button"
                onClick={onDisconnect}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 transition hover:border-zinc-600 hover:text-white"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              disabled={connecting}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
