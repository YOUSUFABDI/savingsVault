import { useEffect, useState } from "react"

function formatRemaining(seconds: number): string {
  if (seconds <= 0) return "Unlocked"
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const parts: string[] = []
  if (d > 0) parts.push(`${d}d`)
  parts.push(`${h}h`, `${m}m`, `${s}s`)
  return parts.join(" ")
}

type Props = {
  unlockTimestamp: bigint
}

export function Countdown({ unlockTimestamp }: Props) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Number(unlockTimestamp) - Math.floor(Date.now() / 1000)),
  )

  useEffect(() => {
    const tick = () => {
      setRemaining(
        Math.max(0, Number(unlockTimestamp) - Math.floor(Date.now() / 1000)),
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [unlockTimestamp])

  const unlocked = remaining <= 0

  return (
    <span className={unlocked ? "text-emerald-400" : "text-zinc-300"}>
      {formatRemaining(remaining)}
    </span>
  )
}
