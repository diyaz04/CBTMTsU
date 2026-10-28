"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight, KeyRound, Loader2, Lock, ShieldCheck } from "lucide-react"
import { startAttempt } from "@/lib/ujian/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function TokenGate({ sessionId, onBack }: { sessionId: string; onBack?: () => void }) {
  const router = useRouter()
  const [token, setToken] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await startAttempt(sessionId, token.trim().toUpperCase())
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-emerald-950/10 p-4">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-40 left-1/2 size-96 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6">
        {/* School Crest */}
        <div className="flex size-20 items-center justify-center rounded-3xl bg-card p-3 shadow-xl ring-4 ring-primary/20">
          <Image
            src="/logo-sekolah.png"
            alt="Logo Sekolah"
            width={60}
            height={60}
            className="object-contain"
          />
        </div>

        <Card className="w-full rounded-3xl border border-border/80 bg-card/95 shadow-2xl backdrop-blur-md">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
              <ShieldCheck className="size-3.5" />
              Sesi Terproteksi CBT
            </div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Masukkan Token Ujian
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground sm:text-sm">
              Lihat kode terbaru di layar/papan ruang ujian — token ganti otomatis tiap 5 menit.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="token" className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  KODE TOKEN AKSES (6 KARAKTER)
                </Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/70" />
                  <Input
                    id="token"
                    value={token}
                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                    placeholder="CONTOH: 7AT5TJ"
                    maxLength={10}
                    autoFocus
                    required
                    className="h-14 rounded-2xl pl-11 text-center font-mono text-xl font-extrabold tracking-widest text-primary uppercase transition-all focus-visible:ring-2 focus-visible:ring-primary/40"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-center text-xs font-semibold text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={pending || !token.trim()}
                className="group relative h-12 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.99]"
              >
                {pending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Memvalidasi Token...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Mulai Kerjakan Ujian
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Button>

              <div className="flex flex-col items-center gap-2 border-t border-border/60 pt-4 text-center">
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="size-3.5" />
                    Cek Ulang Identitas
                  </button>
                )}
                <Link
                  href="/beranda"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" />
                  Kembali ke Beranda Jadwal
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="size-3 text-emerald-500" />
          Waktu pengerjaan akan mulai berjalan setelah tombol ditekan.
        </p>
      </div>
    </div>
  )
}
