import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { Badge } from "@/components/ui/badge"
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
    examIds.length > 0 ? await supabase.from("exams").select("id, nama_ujian").in("id", examIds) : { data: [] }
  const examNameById = new Map((examRows ?? []).map((e) => [e.id, e.nama_ujian]))

  const sessionStudentIds = (sessionStudents ?? []).map((s) => s.id)
  const { data: attemptRows } =
    sessionStudentIds.length > 0
      ? await supabase.from("exam_attempts").select("session_student_id, status").in("session_student_id", sessionStudentIds)
      : { data: [] }
  const statusBySessionStudent = new Map((attemptRows ?? []).map((a) => [a.session_student_id, a.status]))
  const sessionStudentBySession = new Map((sessionStudents ?? []).map((s) => [s.session_id, s]))

  const nowMs = now()

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Halo, {user.nama}</h1>
          <p className="text-muted-foreground text-sm">{user.kelas}</p>
        </div>
        <form action={logout}>
          <Button type="submit" variant="outline" size="sm">
            Keluar
          </Button>
        </form>
      </div>

      <div className="flex flex-col gap-3">
        {(sessionRows ?? []).length === 0 && (
          <p className="text-muted-foreground text-sm">Belum ada jadwal ujian buat kamu.</p>
        )}
        {(sessionRows ?? []).map((session) => {
          const ss = sessionStudentBySession.get(session.id)
          const attemptStatus = ss ? statusBySessionStudent.get(ss.id) : undefined
          const start = new Date(session.waktu_mulai).getTime()
          const end = start + session.durasi_menit * 60_000

          let label: string
          let canEnter = false
          if (attemptStatus === "submitted" || attemptStatus === "auto_submitted") {
            label = "Selesai"
          } else if (nowMs < start) {
            label = "Belum dimulai"
          } else if (nowMs > end && attemptStatus !== "in_progress") {
            label = "Waktu habis"
          } else {
            label = attemptStatus === "in_progress" ? "Sedang berlangsung" : "Bisa dikerjakan"
            canEnter = true
          }

          return (
            <div key={session.id} className="flex flex-col gap-2 rounded-lg border p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{examNameById.get(session.exam_id) ?? session.mapel}</p>
                  <p className="text-muted-foreground text-sm">
                    {formatTanggal(session.tanggal)} · Sesi {session.sesi_ke} · {session.ruang}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {formatWaktu(session.waktu_mulai)} ({session.durasi_menit} menit) · No. Peserta{" "}
                    {ss?.no_peserta}
                  </p>
                </div>
                <Badge variant={label === "Selesai" ? "secondary" : canEnter ? "default" : "outline"}>
                  {label}
                </Badge>
              </div>
              {canEnter && (
                <Link href={`/kerjakan/${session.id}`}>
                  <Button className="w-full">
                    {attemptStatus === "in_progress" ? "Lanjutkan Ujian" : "Masuk Ujian"}
                  </Button>
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
