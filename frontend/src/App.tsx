import { useCallback, useEffect, useState } from "react"
import { DepositForm } from "./components/DepositForm"
import { DepositsDashboard } from "./components/DepositsDashboard"
import { Header } from "./components/Header"
import { VaultStats } from "./components/VaultStats"
import type { DepositRecord } from "./contract"
import { fetchUserDeposits, getVaultBalance } from "./contract"
import { useWallet } from "./hooks/useWallet"

function App() {
  const wallet = useWallet()
  const [vaultBalance, setVaultBalance] = useState<bigint | null>(null)
  const [deposits, setDeposits] = useState<DepositRecord[]>([])
  const [loadingVault, setLoadingVault] = useState(true)
  const [loadingDeposits, setLoadingDeposits] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const setWalletError = wallet.setError

  const showError = useCallback(
    (message: string) => {
      setWalletError(message)
      setToast(message)
      setTimeout(() => setToast(null), 6000)
    },
    [setWalletError],
  )

  const refresh = useCallback(async () => {
    try {
      setLoadingVault(true)
      const balance = await getVaultBalance()
      setVaultBalance(balance)
    } catch (e) {
      setVaultBalance(null)
      if (e instanceof Error && e.message.includes("No contract")) {
        showError(e.message)
      }
    } finally {
      setLoadingVault(false)
    }

    if (!wallet.address) {
      setDeposits([])
      return
    }

    try {
      setLoadingDeposits(true)
      const list = await fetchUserDeposits(wallet.address)
      setDeposits(list)
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to load deposits")
    } finally {
      setLoadingDeposits(false)
    }
  }, [wallet.address, showError])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const id = setInterval(() => void refresh(), 15_000)
    return () => clearInterval(id)
  }, [refresh])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-zinc-950 to-zinc-950" />

      <div className="relative">
        <Header
          address={wallet.address}
          connecting={wallet.connecting}
          wrongNetwork={wallet.wrongNetwork}
          onConnect={() => void wallet.connect()}
          onDisconnect={wallet.disconnect}
        />

        <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
          {(wallet.error || toast) && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {toast ?? wallet.error}
            </div>
          )}

          <VaultStats balance={vaultBalance} loading={loadingVault} />

          <div className="grid gap-8 lg:grid-cols-2">
            <DepositForm
              signer={wallet.signer}
              onSuccess={() => void refresh()}
              onError={showError}
            />
            <div className="lg:col-span-1">
              <p className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 text-sm leading-relaxed text-zinc-400">
                <strong className="text-emerald-400">How it works:</strong>{" "}
                Deposit ETH and pick a lock (7, 14, or 30 days). After the lock
                ends, withdraw principal plus interest (3%, 7%, or 15%). Need
                funds sooner? Early withdraw returns your deposit minus a 10%
                penalty.
              </p>
            </div>
          </div>

          <DepositsDashboard
            address={wallet.address}
            signer={wallet.signer}
            deposits={deposits}
            loading={loadingDeposits}
            onRefresh={() => void refresh()}
            onError={showError}
          />
        </main>

        <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
          SavingsVault
        </footer>
      </div>
    </div>
  )
}

export default App
