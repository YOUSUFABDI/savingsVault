import { BrowserProvider, JsonRpcSigner } from "ethers"
import { useCallback, useEffect, useState } from "react"
import {
  connectWallet as connectWalletContract,
  getBrowserProvider,
} from "../contract"
import { EXPECTED_CHAIN_ID } from "../constants"

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null)
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null)
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [chainId, setChainId] = useState<bigint | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const syncFromProvider = useCallback(async (ethProvider: BrowserProvider) => {
    const accounts = (await ethProvider.send("eth_accounts", [])) as string[]
    const network = await ethProvider.getNetwork()
    setChainId(network.chainId)
    if (accounts.length === 0) {
      setAddress(null)
      setSigner(null)
      return
    }
    const s = await ethProvider.getSigner()
    setSigner(s)
    setAddress(await s.getAddress())
  }, [])

  useEffect(() => {
    if (!window.ethereum) return

    let mounted = true
    let ethProvider: BrowserProvider | null = null

    getBrowserProvider()
      .then((p) => {
        if (!mounted) return
        ethProvider = p
        setProvider(p)
        return syncFromProvider(p)
      })
      .catch(() => {})

    const onAccounts = () => {
      if (ethProvider) void syncFromProvider(ethProvider)
    }
    const onChain = () => {
      if (ethProvider) void syncFromProvider(ethProvider)
    }

    window.ethereum.on?.("accountsChanged", onAccounts)
    window.ethereum.on?.("chainChanged", onChain)

    return () => {
      mounted = false
      window.ethereum?.removeListener?.("accountsChanged", onAccounts)
      window.ethereum?.removeListener?.("chainChanged", onChain)
    }
  }, [syncFromProvider])

  const connect = useCallback(async () => {
    setConnecting(true)
    setError(null)
    try {
      const result = await connectWalletContract()
      const p = await getBrowserProvider()
      setProvider(p)
      setAddress(result.address)
      setSigner(result.signer)
      setChainId(result.chainId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect wallet")
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
    setSigner(null)
    setError(null)
  }, [])

  const wrongNetwork = chainId !== null && chainId !== EXPECTED_CHAIN_ID

  return {
    address,
    signer,
    provider,
    chainId,
    connecting,
    error,
    wrongNetwork,
    connect,
    disconnect,
    setError,
    isConnected: !!address && !!signer,
  }
}
