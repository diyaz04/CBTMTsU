"use client"

import { useEffect, useRef, useState } from "react"
import {
  Activity,
  Award,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  DoorOpen,
  Hourglass,
  Radio,
  RefreshCw,
  UserX,
} from "lucide-react"
import { now } from "@/lib/now"
import {
  getMonitoringData,
  type MonitoringData,
  type MonitoringSessionCard,
  type MonitoringStatus,
  type MonitoringStudentRow,
} from "@/lib/monitoring/actions"

const POLL_INTERVAL_MS = 7_000

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

function formatRelative(iso: string | null, nowMs: number) {
  if (!iso) return "Belum pernah login"
  const diffMs = nowMs - new Date(iso).getTime()
  if (diffMs < 60_000) return "Baru saja aktif"
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return `Aktif ${mins} menit lalu`
  const hours = Math.floor(mins / 60)
  return `Aktif ${hours} jam lalu`
}

const STATUS_META: Record<MonitoringStatus, { label: string; icon: typeof UserX; className: string }> = {
  belum_login: {
    label: "Belum Login",
    icon: UserX,
    className: "border-border/80 bg-muted/60 text-muted-foreground",
  },
  menunggu_mulai: {
    label: "Login, Belum Mulai",
    icon: Hourglass,
    className: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  mengerjakan: {
    label: "Sedang Mengerjakan",
    icon: Activity,
    className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  selesai: {
    label: "Selesai",
    icon: CheckCircle2,
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
}

function sessionCounts(session: MonitoringSessionCard) {
  const counts = { belum_login: 0, menunggu_mulai: 0, mengerjakan: 0, selesai: 0 }
  for (const s of session.students) counts[s.status]++
  return counts
}

function StudentRow({ student, nowMs }: { student: MonitoringStudentRow; nowMs: number }) {
  const meta = STATUS_META[student.status]
  const Icon = meta.icon
  const showProgress = student.status === "mengerjakan" || student.status === "selesai"

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-border/70 bg-card p-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 rounded-lg bg-muted px-2 py-1 font-mono text-[11px] font-bold text-muted-foreground">
          {student.noPeserta}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{student.nama}</p>
          <p className="truncate text-[11px] text-muted-foreground">{student.kelas}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:shrink-0">
        <span
          className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-bold ${meta.className}`}
        >
          <Icon className={`size-3.5 ${student.status === "mengerjakan" ? "animate-pulse" : ""}`} />
          {meta.label}
        </span>

        {showProgress ? (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${student.percent}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">
              {student.answered}/{student.totalSoal} soal
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground">{formatRelative(student.lastSeenAt, nowMs)}</span>
        )}

        {student.nilai !== null && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary">
            <Award className="size-3.5" />
            {student.nilai.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  )
}

function SessionCard({
  session,
  expanded,
  onToggle,
}: {
  session: MonitoringSessionCard
  expanded: boolean
  onToggle: () => void
}) {
  const counts = sessionCounts(session)
  const total = session.students.length
  const percentSelesai = total > 0 ? (counts.selesai / total) * 100 : 0
  const percentSedang = total > 0 ? (counts.mengerjakan / total) * 100 : 0

  return (
    <div
      className={`flex flex-col gap-4 rounded-3xl border bg-card p-5 shadow-sm transition-all sm:p-6 ${
        session.isLive ? "border-emerald-500/40 ring-2 ring-emerald-500/10 shadow-md" : "border-border/80"
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-foreground sm:text-lg">
              {session.examName} — Sesi {session.sesiKe}
            </h3>
            {session.isLive && (
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
              {formatWaktu(session.waktuMulai)} ({session.durasiMenit} menit)
            </span>
          </div>
        </div>

        <span className="rounded-full bg-muted px-3 py-1 font-mono text-xs font-bold text-foreground">
          {total} Peserta
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted flex">
          <div className="bg-emerald-500 transition-all duration-300" style={{ width: `${percentSelesai}%` }} />
          <div className="bg-amber-500 transition-all duration-300" style={{ width: `${percentSedang}%` }} />
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Progres Pengumpulan: {Math.round(percentSelesai)}%</span>
          <span>{counts.selesai} dari {total} siswa telah submit</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 text-left"
      >
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-muted/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
          <UserX className="size-3.5" />
          {counts.belum_login} Belum Login
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-700 dark:text-sky-400">
          <Hourglass className="size-3.5" />
          {counts.menunggu_mulai} Belum Mulai
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">
          <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
          {counts.mengerjakan} Mengerjakan
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-3.5 text-emerald-500" />
          {counts.selesai} Selesai
        </span>

        <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary">
          {expanded ? "Sembunyikan Daftar" : "Lihat Daftar Siswa"}
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </span>
      </button>

      {expanded && (
        <MonitoringStudentList session={session} />
      )}
    </div>
  )
}

function MonitoringStudentList({ session }: { session: MonitoringSessionCard }) {
  const [nowMs, setNowMs] = useState(() => now())

  useEffect(() => {
    const id = setInterval(() => setNowMs(now()), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col gap-2">
      {session.students.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">Belum ada peserta terdaftar di sesi ini.</p>
      ) : (
        session.students.map((student) => (
          <StudentRow key={student.sessionStudentId} student={student} nowMs={nowMs} />
        ))
      )}
    </div>
  )
}

export function MonitoringDashboard({ initialData }: { initialData: MonitoringData }) {
  const [data, setData] = useState(initialData)
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(initialData.sessions.filter((s) => s.isLive).map((s) => s.id))
  )
  const [pending, setPending] = useState(false)
  const fetchingRef = useRef(false)

  useEffect(() => {
    async function refetch() {
      if (fetchingRef.current) return
      fetchingRef.current = true
      setPending(true)
      try {
        const next = await getMonitoringData()
        setData(next)
      } catch {
        // Diem-diem aja kalau sesi admin kedaluwarsa pas poll jalan —
        // data terakhir yang berhasil tetap ditampilkan, nggak nge-crash UI.
      } finally {
        fetchingRef.current = false
        setPending(false)
      }
    }
    const id = setInterval(refetch, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  function toggle(sessionId: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-6">
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
            Pantau kehadiran, progres pengisian soal, dan nilai live siswa secara langsung per sesi ruangan.
          </p>
        </div>

        <span className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <RefreshCw className={`size-3.5 ${pending ? "animate-spin" : ""}`} />
          Auto-refresh tiap {POLL_INTERVAL_MS / 1000} detik
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-3xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <UserX className="size-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground">Belum Login</p>
            <p className="text-xl font-extrabold text-foreground">{data.totals.belumLogin}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-3xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Hourglass className="size-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground">Login, Belum Mulai</p>
            <p className="text-xl font-extrabold text-foreground">{data.totals.menunggu}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-3xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Activity className="size-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground">Sedang Mengerjakan</p>
            <p className="text-xl font-extrabold text-foreground">{data.totals.mengerjakan}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-3xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground">Selesai</p>
            <p className="text-xl font-extrabold text-foreground">{data.totals.selesai}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {data.sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/80 bg-card p-12 text-center shadow-xs">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Radio className="size-7" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Belum Ada Sesi Ujian</h3>
            <p className="max-w-sm text-xs text-muted-foreground">
              Jadwalkan sesi ujian terlebih dahulu di menu &quot;Jadwal &amp; Sesi&quot; untuk mulai memonitor.
            </p>
          </div>
        ) : (
          data.sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              expanded={expanded.has(session.id)}
              onToggle={() => toggle(session.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
