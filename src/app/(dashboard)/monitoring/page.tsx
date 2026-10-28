import { createClient } from "@/lib/supabase/server"
import { now } from "@/lib/now"
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  DoorOpen,
  Radio,
  RefreshCw,
  Users,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function formatTanggal(tanggal: string) {
  return new Date(`${tanggal}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatWaktu(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
}

export default async function MonitoringPage() {
  const supabase = await createClient()

  const { data: sessionRows } = await supabase
    .from("exam_sessions")
    .select("id, exam_id, tanggal, sesi_ke, ruang, mapel, waktu_mulai, durasi_menit")
    .order("tanggal", { ascending: false })
    .order("sesi_ke")

  const examIds = [...new Set((sessionRows ?? []).map((s) => s.exam_id))]
  const { data: examRows } =
    examIds.length > 0 ? await supabase.from("exams").select("id, nama_ujian").in("id", examIds) : { data: [] }
  const examNameById = new Map((examRows ?? []).map((e) => [e.id, e.nama_ujian]))

  const sessionIds = (sessionRows ?? []).map((s) => s.id)
  const { data: sessionStudents } =
    sessionIds.length > 0 ? await supabase.from("session_students").select("id, session_id").in("session_id", sessionIds) : { data: [] }
  const ssBySession = new Map<string, string[]>()
  for (const ss of sessionStudents ?? []) {
    const list = ssBySession.get(ss.session_id) ?? []
    list.push(ss.id)
    ssBySession.set(ss.session_id, list)
  }

  const allSSIds = (sessionStudents ?? []).map((s) => s.id)
  const { data: attempts } =
    allSSIds.length > 0 ? await supabase.from("exam_attempts").select("session_student_id, status").in("session_student_id", allSSIds) : { data: [] }
  const statusBySS = new Map((attempts ?? []).map((a) => [a.session_student_id, a.status]))

  const nowMs = now()

  const sessionCards = (sessionRows ?? []).map((session) => {
    const ssIds = ssBySession.get(session.id) ?? []
    let belumMulai = 0
    let sedang = 0
    let selesai = 0
    for (const ssId of ssIds) {
      const status = statusBySS.get(ssId) ?? "not_started"
      if (status === "in_progress") sedang++
      else if (status === "submitted" || status === "auto_submitted") selesai++
      else belumMulai++
    }

    const start = new Date(session.waktu_mulai).getTime()
    const end = start + session.durasi_menit * 60_000
    const isLive = nowMs >= start && nowMs <= end
    const totalPeserta = ssIds.length

    const percentSelesai = totalPeserta > 0 ? (selesai / totalPeserta) * 100 : 0
    const percentSedang = totalPeserta > 0 ? (sedang / totalPeserta) * 100 : 0

    return {
      session,
      isLive,
      totalPeserta,
      belumMulai,
      sedang,
      selesai,
      percentSelesai,
      percentSedang,
    }
  })

  const totalSedang = sessionCards.reduce((sum, c) => sum + c.sedang, 0)
  const totalSelesai = sessionCards.reduce((sum, c) => sum + c.selesai, 0)
  const totalBelum = sessionCards.reduce((sum, c) => sum + c.belumMulai, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Live Pulse */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Monitoring Pelaksanaan Ujian
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="size-2 animate-ping rounded-full bg-emerald-500" />
              Live Active
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Pantau progres kehadiran dan pengerjaan soal siswa secara langsung per sesi ruangan.
          </p>
        </div>

        <Link href="/monitoring">
          <Button variant="outline" size="sm" className="gap-2 rounded-xl text-xs font-semibold">
            <RefreshCw className="size-3.5" />
            Refresh Data
          </Button>
        </Link>
      </div>

      {/* Real-time KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3.5 rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Activity className="size-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Sedang Mengerjakan</p>
            <p className="text-2xl font-extrabold text-foreground">{totalSedang} Siswa</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Selesai / Dikumpulkan</p>
            <p className="text-2xl font-extrabold text-foreground">{totalSelesai} Siswa</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="size-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Belum Memulai</p>
            <p className="text-2xl font-extrabold text-foreground">{totalBelum} Siswa</p>
          </div>
        </div>
      </div>

      {/* Session Cards */}
      <div className="flex flex-col gap-4">
        {sessionCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/80 bg-card p-12 text-center shadow-xs">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Radio className="size-7" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Belum Ada Sesi Ujian</h3>
            <p className="max-w-sm text-xs text-muted-foreground">
              Jadwalkan sesi ujian terlebih dahulu di menu &quot;Jadwal & Sesi&quot; untuk mulai memonitor.
            </p>
          </div>
        ) : (
          sessionCards.map(
            ({
              session,
              isLive,
              totalPeserta,
              belumMulai,
              sedang,
              selesai,
              percentSelesai,
              percentSedang,
            }) => (
              <div
                key={session.id}
                className={`flex flex-col gap-4 rounded-3xl border bg-card p-5 shadow-sm transition-all sm:p-6 ${
                  isLive
                    ? "border-emerald-500/40 ring-2 ring-emerald-500/10 shadow-md"
                    : "border-border/80"
                }`}
              >
                {/* Session Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-foreground sm:text-lg">
                        {examNameById.get(session.exam_id) ?? session.mapel} — Sesi {session.sesi_ke}
                      </h3>
                      {isLive && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <span className="size-1.5 animate-ping rounded-full bg-emerald-500" />
                          Berlangsung Sekarang
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-primary" />
                        {formatTanggal(session.tanggal)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <DoorOpen className="size-3.5 text-primary" />
                        {session.ruang}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-primary" />
                        {formatWaktu(session.waktu_mulai)} ({session.durasi_menit} menit)
                      </span>
                    </div>
                  </div>

                  <span className="rounded-full bg-muted px-3 py-1 font-mono text-xs font-bold text-foreground">
                    {totalPeserta} Peserta
                  </span>
                </div>

                {/* Progress bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted flex">
                    <div
                      className="bg-emerald-500 transition-all duration-300"
                      style={{ width: `${percentSelesai}%` }}
                      title={`Selesai: ${selesai}`}
                    />
                    <div
                      className="bg-amber-500 transition-all duration-300"
                      style={{ width: `${percentSedang}%` }}
                      title={`Sedang Mengerjakan: ${sedang}`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Progres Pengumpulan: {Math.round(percentSelesai)}%</span>
                    <span>
                      {selesai} dari {totalPeserta} siswa telah submit
                    </span>
                  </div>
                </div>

                {/* Status Badges Breakdown */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                    {sedang} Sedang Mengerjakan
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    {selesai} Selesai
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-muted/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {belumMulai} Belum Mulai
                  </span>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  )
}
