"use client"

import { useEffect, useRef, useState } from "react"
import { DoorOpen, RefreshCw, Users } from "lucide-react"
import { getGlobalTokenState, type GlobalTokenState } from "@/lib/ujian/token-live-actions"

function formatCountdown(ms: number) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export function TokenLiveDisplay({ initialState }: { initialState: GlobalTokenState }) {
  const [state, setState] = useState(initialState)
  const [remainingMs, setRemainingMs] = useState(initialState.msUntilNextRotation)
  const fetchingRef = useRef(false)

  async function refetch() {
    if (fetchingRef.current) return
    fetchingRef.current = true
    try {
      const next = await getGlobalTokenState()
      setState(next)
      setRemainingMs(next.msUntilNextRotation)
    } finally {
      fetchingRef.current = false
    }
  }

  useEffect(() => {
    const id = setInterval(() => {
      setRemainingMs((prev) => {
        const next = prev - 1000
        if (next <= 500) {
          refetch()
          return 0
        }
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const percent = Math.max(0, Math.min(100, (remainingMs / (5 * 60_000)) * 100))

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center gap-8 bg-gradient-to-br from-primary/10 via-background to-accent/20 p-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Token Akses Ujian — Berlaku Sekarang
        </p>
        <p className="text-xs text-muted-foreground">Umumkan kode ini ke seluruh peserta di ruang ujian</p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-[2.5rem] border bg-card px-10 py-10 shadow-xl sm:px-16 sm:py-12">
        <div className="font-mono text-6xl font-extrabold tracking-[0.3em] text-primary sm:text-8xl">
          {state.token}
        </div>
        <div className="flex w-full max-w-xs flex-col gap-1.5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-linear"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
            <RefreshCw className="size-3.5" />
            Ganti lagi dalam {formatCountdown(remainingMs)}
          </p>
        </div>
      </div>

      <div className="flex w-full max-w-2xl flex-col gap-3">
        <p className="text-sm font-semibold text-foreground">
          Berlaku buat {state.activeSessions.length} sesi yang sedang aktif
        </p>
        {state.activeSessions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nggak ada sesi ujian yang sedang berlangsung saat ini.
          </p>
        )}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {state.activeSessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-2 rounded-2xl border bg-card px-4 py-2.5 text-left text-sm shadow-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {s.mapel} — Sesi {s.sesiKe}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <DoorOpen className="size-3.5" />
                  {s.ruang}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                <Users className="size-3.5" />
                {s.pesertaCount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
