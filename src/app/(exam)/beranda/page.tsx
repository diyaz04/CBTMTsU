import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import {
  ArrowRight,
  Award,
  CalendarCheck,
  CheckCircle2,
  Clock,
  DoorOpen,
  Hash,
  LogOut,
  Sparkles,
  AlertCircle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { Button } from "@/components/ui/button"
import { logout } from "@/lib/auth/actions"
import { now } from "@/lib/now"

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

export default async function BerandaPage() {
  const user = await getCurrentUser()
  if (!user || user.type !== "student") redirect("/login")

  const supabase = await createClient()

  const { data: sessionStudents } = await supabase
    .from("session_students")
    .select("id, session_id, no_peserta")
    .eq("student_id", user.id)
  const sessionIds = (sessionStudents ?? []).map((s) => s.session_id)

  const { data: sessionRows } =
    sessionIds.length > 0
      ? await supabase
          .from("exam_sessions")
          .select("id, exam_id, tanggal, sesi_ke, ruang, mapel, waktu_mulai, durasi_menit")
          .in("id", sessionIds)
          .order("tanggal")
          .order("sesi_ke")
      : { data: [] }

  const examIds = [...new Set((sessionRows ?? []).map((s) => s.exam_id))]
  const { data: examRows } =
    examIds.length > 0
      ? await supabase.from("exams").select("id, nama_ujian, tampilkan_nilai").in("id", examIds)
      : { data: [] }
  const examNameById = new Map((examRows ?? []).map((e) => [e.id, e.nama_ujian]))
  const examTampilkanNilaiById = new Map((examRows ?? []).map((e) => [e.id, e.tampilkan_nilai]))

  const sessionStudentIds = (sessionStudents ?? []).map((s) => s.id)
  const { data: attemptRows } =
    sessionStudentIds.length > 0
      ? await supabase
          .from("exam_attempts")
          .select("id, session_student_id, status")
          .in("session_student_id", sessionStudentIds)
      : { data: [] }
  const attemptBySessionStudent = new Map((attemptRows ?? []).map((a) => [a.session_student_id, a]))
  const sessionStudentBySession = new Map((sessionStudents ?? []).map((s) => [s.session_id, s]))

  const doneAttemptIds = (attemptRows ?? [])
    .filter((a) => a.status === "submitted" || a.status === "auto_submitted")
    .map((a) => a.id)
  const { data: scoreRows } =
    doneAttemptIds.length > 0
      ? await supabase.from("scores").select("attempt_id, total").in("attempt_id", doneAttemptIds)
      : { data: [] }
  const nilaiByAttempt = new Map((scoreRows ?? []).map((s) => [s.attempt_id, s.total]))

  const nowMs = now()

  // Calculate summary counts
  let activeExamsCount = 0
  let completedExamsCount = 0

  const processedSessions = (sessionRows ?? []).map((session) => {
    const ss = sessionStudentBySession.get(session.id)
    const attempt = ss ? attemptBySessionStudent.get(ss.id) : undefined
    const attemptStatus = attempt?.status
    const start = new Date(session.waktu_mulai).getTime()
    const end = start + session.durasi_menit * 60_000

    let label: string
    let canEnter = false
    let statusTheme: "active" | "ongoing" | "done" | "upcoming" | "expired" = "upcoming"
    let nilai: number | null = null

    if (attemptStatus === "submitted" || attemptStatus === "auto_submitted") {
      label = "Selesai Dikerjakan"
      statusTheme = "done"
      completedExamsCount++
      if (attempt && examTampilkanNilaiById.get(session.exam_id)) {
        nilai = nilaiByAttempt.get(attempt.id) ?? null
      }
    } else if (nowMs < start) {
      label = "Belum Dimulai"
      statusTheme = "upcoming"
    } else if (nowMs > end && attemptStatus !== "in_progress") {
      label = "Waktu Habis"
      statusTheme = "expired"
    } else {
      label = attemptStatus === "in_progress" ? "Sedang Berlangsung" : "Bisa Dikerjakan"
      statusTheme = attemptStatus === "in_progress" ? "ongoing" : "active"
      canEnter = true
      activeExamsCount++
    }

    return {
      session,
      ss,
      attemptStatus,
      label,
      canEnter,
      statusTheme,
      nilai,
    }
  })

  const initials = user.nama
    ? user.nama
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "SW"

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background pb-16">
      {/* Top Navbar Siswa */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-card/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 p-1.5 ring-1 ring-primary/20">
              <Image
                src="/logo-sekolah.png"
                alt="Logo MTs KH A Wahab Muhsin"
                width={36}
                height={36}
                className="object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-foreground sm:text-base">
                  CBT Siswa
                </span>
                <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">MTs KH A Wahab Muhsin</p>
            </div>
          </div>

          {/* Student Profile Pill & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 rounded-full border border-border/80 bg-muted/50 px-3 py-1 sm:flex">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {initials}
              </div>
              <div className="text-left">
                <p className="max-w-[140px] truncate text-xs font-semibold leading-none">{user.nama}</p>
                <p className="text-[10px] text-muted-foreground">{user.kelas}</p>
              </div>
            </div>

            <form action={logout}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl border-border/80 text-xs font-medium hover:bg-destructive/10 hover:text-destructive"
                title="Keluar dari Portal"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 pt-6 sm:px-6">
        {/* Welcome Greeting Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-emerald-800 to-slate-900 p-6 text-white shadow-lg sm:p-8">
          <div className="pointer-events-none absolute -top-12 -right-12 size-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 size-48 rounded-full bg-emerald-400/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1.5">
              <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-emerald-200 backdrop-blur-md">
                <Sparkles className="size-3.5" />
                Semester Berjalan
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Halo, {user.nama} 👋
              </h1>
              <p className="text-xs text-white/80 sm:text-sm">
                Kelas <strong>{user.kelas}</strong> · Persiapkan diri dan baca doa sebelum memulai ujian.
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 backdrop-blur-md">
                <span className="text-xl font-extrabold text-white">{activeExamsCount}</span>
                <span className="text-[11px] font-medium text-white/70">Ujian Aktif</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 backdrop-blur-md">
                <span className="text-xl font-extrabold text-white">{completedExamsCount}</span>
                <span className="text-[11px] font-medium text-white/70">Selesai</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Daftar Jadwal Ujian
            </h2>
            <p className="text-xs text-muted-foreground">
              Jadwal sesi asesmen yang telah ditentukan untuk rombongan belajar Anda.
            </p>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            {processedSessions.length} Sesi
          </span>
        </div>

        {/* Exam Cards Grid */}
        <div className="flex flex-col gap-4">
          {processedSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/80 bg-card p-12 text-center shadow-xs">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <CalendarCheck className="size-7" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Belum Ada Jadwal Ujian</h3>
              <p className="max-w-md text-xs text-muted-foreground">
                Saat ini belum ada sesi ujian yang ditugaskan untuk akun kamu. Silakan hubungi proktor atau guru jika jadwal sudah diumumkan.
              </p>
            </div>
          ) : (
            processedSessions.map(
              ({ session, ss, canEnter, statusTheme, nilai }) => {
                const isReady = statusTheme === "active"
                const isOngoing = statusTheme === "ongoing"
                const isDone = statusTheme === "done"

                return (
                  <div
                    key={session.id}
                    className={`relative flex flex-col justify-between gap-5 overflow-hidden rounded-3xl border bg-card p-5 shadow-sm transition-all sm:p-6 ${
                      isReady || isOngoing
                        ? "border-primary/40 ring-2 ring-primary/10 shadow-md"
                        : "border-border/80"
                    }`}
                  >
                    {/* Top Row: Title & Badge */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
                            Sesi {session.sesi_ke}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">
                            {session.mapel}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-foreground sm:text-lg">
                          {examNameById.get(session.exam_id) ?? session.mapel}
                        </h3>
                      </div>

                      {/* Status Badges */}
                      <div>
                        {isReady && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                            Bisa Dikerjakan
                          </span>
                        )}
                        {isOngoing && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                            <span className="size-2 animate-ping rounded-full bg-amber-500" />
                            Sedang Berlangsung
                          </span>
                        )}
                        {isDone && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                            <CheckCircle2 className="size-3.5 text-emerald-500" />
                            Selesai
                          </span>
                        )}
                        {statusTheme === "upcoming" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                            <Clock className="size-3.5" />
                            Belum Dimulai
                          </span>
                        )}
                        {statusTheme === "expired" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                            <AlertCircle className="size-3.5" />
                            Waktu Habis
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata Chips */}
                    <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/40 p-3 sm:grid-cols-4 sm:p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-primary shadow-xs">
                          <CalendarCheck className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Tanggal</p>
                          <p className="truncate text-xs font-medium text-foreground">{formatTanggal(session.tanggal)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-primary shadow-xs">
                          <Clock className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Waktu & Durasi</p>
                          <p className="truncate text-xs font-medium text-foreground">
                            {formatWaktu(session.waktu_mulai)} ({session.durasi_menit}m)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-primary shadow-xs">
                          <DoorOpen className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Ruangan</p>
                          <p className="truncate text-xs font-medium text-foreground">{session.ruang}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-primary shadow-xs">
                          <Hash className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">No. Peserta</p>
                          <p className="truncate font-mono text-xs font-bold text-foreground">{ss?.no_peserta ?? "-"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    {canEnter ? (
                      <Link href={`/kerjakan/${session.id}`} className="w-full">
                        <Button
                          className={`group h-12 w-full rounded-2xl text-sm font-semibold shadow-md transition-all hover:shadow-lg active:scale-[0.99] ${
                            isOngoing
                              ? "bg-amber-600 hover:bg-amber-700 text-white"
                              : "bg-primary hover:bg-primary/90 text-primary-foreground"
                          }`}
                        >
                          <span className="flex items-center justify-center gap-2">
                            {isOngoing ? "Lanjutkan Pengerjaan Ujian" : "Masuk Ujian Sekarang"}
                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                          </span>
                        </Button>
                      </Link>
                    ) : isDone ? (
                      nilai !== null ? (
                        <div className="flex items-center justify-between gap-2 rounded-2xl bg-emerald-500/10 py-3 px-4">
                          <span className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="size-4" />
                            Jawaban berhasil dikirim & sudah dinilai
                          </span>
                          <span className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1 text-sm font-extrabold text-white">
                            <Award className="size-4" />
                            {nilai.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 rounded-2xl bg-muted/60 py-3 text-xs font-medium text-muted-foreground">
                          <CheckCircle2 className="size-4 text-emerald-500" />
                          Jawaban ujian telah berhasil dikirimkan ke server.
                        </div>
                      )
                    ) : null}
                  </div>
                )
              }
            )
          )}
        </div>
      </main>
    </div>
  )
}
