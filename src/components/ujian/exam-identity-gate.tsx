"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar1,
  Clock,
  DoorOpen,
  Hash,
  IdCard,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { pingSessionPresence } from "@/lib/ujian/presence-actions"
import { Button } from "@/components/ui/button"
import { TokenGate } from "@/components/ujian/token-gate"

const PING_INTERVAL_MS = 25_000

export interface ExamIdentityInfo {
  nama: string
  kelas: string
  nisn: string
  noPeserta: string
}

export interface ExamScheduleInfo {
  namaUjian: string
  mapel: string
  sesiKe: number
  ruang: string
  tanggal: string
  waktuMulai: string
  durasiMenit: number
}

function formatTanggal(tanggal: string) {
  return new Date(`${tanggal}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatWaktu(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
}

export function ExamIdentityGate({
  sessionId,
  student,
  schedule,
}: {
  sessionId: string
  student: ExamIdentityInfo
  schedule: ExamScheduleInfo
}) {
  const [step, setStep] = useState<"identity" | "token">("identity")
  const pingingRef = useRef(false)

  useEffect(() => {
    async function ping() {
      if (pingingRef.current) return
      pingingRef.current = true
      try {
        await pingSessionPresence(sessionId)
      } finally {
        pingingRef.current = false
      }
    }
    ping()
    const id = setInterval(ping, PING_INTERVAL_MS)
    return () => clearInterval(id)
  }, [sessionId])

  if (step === "token") {
    return <TokenGate sessionId={sessionId} onBack={() => setStep("identity")} />
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-emerald-950/10 p-4">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-96 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6">
        <div className="flex size-20 items-center justify-center rounded-3xl bg-card p-3 shadow-xl ring-4 ring-primary/20">
          <Image
            src="/logo-sekolah.png"
            alt="Logo Sekolah"
            width={60}
            height={60}
            className="object-contain"
          />
        </div>

        <div className="w-full rounded-3xl border border-border/80 bg-card/95 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col gap-1 p-6 pb-2 text-center">
            <div className="mx-auto mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
              <ShieldCheck className="size-3.5" />
              Konfirmasi Sebelum Masuk Ujian
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Periksa Identitas Kamu
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Pastikan data di bawah ini sudah sesuai dengan dirimu sebelum lanjut memasukkan token.
            </p>
          </div>

          <div className="flex flex-col gap-4 p-6 pt-3">
            {/* Identitas Siswa */}
            <div className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-muted/40 p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <UserRound className="size-3.5 text-primary" />
                Identitas Peserta
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground">Nama Lengkap</p>
                  <p className="truncate text-sm font-bold text-foreground">{student.nama}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground">Kelas</p>
                  <p className="truncate text-sm font-bold text-foreground">{student.kelas}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                    <IdCard className="size-3" />
                    NISN
                  </p>
                  <p className="truncate font-mono text-sm font-bold text-foreground">{student.nisn}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                    <Hash className="size-3" />
                    No. Peserta
                  </p>
                  <p className="truncate font-mono text-sm font-bold text-foreground">{student.noPeserta}</p>
                </div>
              </div>
            </div>

            {/* Detail Ujian */}
            <div className="flex flex-col gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                <BookOpen className="size-3.5" />
                Ujian Yang Akan Dikerjakan
              </p>
              <p className="text-base font-bold text-foreground">{schedule.namaUjian}</p>
              <p className="text-xs text-muted-foreground">{schedule.mapel} · Sesi {schedule.sesiKe}</p>
              <div className="mt-1 grid grid-cols-2 gap-2.5">
                <div className="flex items-center gap-2">
                  <Calendar1 className="size-4 text-primary" />
                  <p className="truncate text-xs font-medium text-foreground">{formatTanggal(schedule.tanggal)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <DoorOpen className="size-4 text-primary" />
                  <p className="truncate text-xs font-medium text-foreground">{schedule.ruang}</p>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  <p className="truncate text-xs font-medium text-foreground">
                    {formatWaktu(schedule.waktuMulai)} · Durasi {schedule.durasiMenit} menit
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setStep("token")}
              className="group h-12 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.99]"
            >
              <span className="flex items-center gap-2">
                Data Saya Benar, Lanjutkan
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>

            <div className="border-t border-border/60 pt-4 text-center">
              <Link
                href="/beranda"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                Bukan Saya, Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
