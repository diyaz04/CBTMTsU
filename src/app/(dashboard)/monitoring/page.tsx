import { createClient } from "@/lib/supabase/server"
import { now } from "@/lib/now"
import { Badge } from "@/components/ui/badge"

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

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Monitoring Ujian</h1>
      <p className="text-muted-foreground text-sm">Status pengerjaan siswa per sesi, reload halaman buat update terbaru.</p>

      <div className="flex flex-col gap-3">
        {(sessionRows ?? []).length === 0 && <p className="text-muted-foreground text-sm">Belum ada sesi ujian.</p>}
        {(sessionRows ?? []).map((session) => {
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

          const nowMs = now()
          const start = new Date(session.waktu_mulai).getTime()
          const end = start + session.durasi_menit * 60_000
          const isLive = nowMs >= start && nowMs <= end

          return (
            <div key={session.id} className="flex flex-col gap-2 rounded-lg border p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {examNameById.get(session.exam_id) ?? session.mapel} — Sesi {session.sesi_ke}
                    </p>
                    {isLive && <Badge>Berlangsung</Badge>}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {formatTanggal(session.tanggal)} · {session.ruang} · {formatWaktu(session.waktu_mulai)} (
                    {session.durasi_menit} menit)
                  </p>
                </div>
                <p className="text-muted-foreground text-sm">{ssIds.length} peserta</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{belumMulai} belum mulai</Badge>
                <Badge variant="default">{sedang} sedang mengerjakan</Badge>
                <Badge variant="secondary">{selesai} selesai</Badge>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
