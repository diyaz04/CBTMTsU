import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AddSessionDialog } from "@/components/sesi/add-session-dialog"
import { SessionList } from "@/components/sesi/session-list"
import type { SessionRow, SessionStudentRow } from "@/lib/sesi/types"
import type { StudentRow } from "@/lib/students/types"

export default async function UjianDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const { examId } = await params
  const supabase = await createClient()

  const { data: exam } = await supabase
    .from("exams")
    .select("id, nama_ujian, paket, school_id")
    .eq("id", examId)
    .maybeSingle()
  if (!exam) notFound()

  const { data: sessionRows } = await supabase
    .from("exam_sessions")
    .select("id, exam_id, tanggal, sesi_ke, ruang, mapel, token, waktu_mulai, durasi_menit")
    .eq("exam_id", examId)
    .order("tanggal")
    .order("sesi_ke")

  const sessions: SessionRow[] = (sessionRows ?? []).map((s) => ({
    id: s.id,
    examId: s.exam_id,
    tanggal: s.tanggal,
    sesiKe: s.sesi_ke,
    ruang: s.ruang,
    mapel: s.mapel,
    token: s.token,
    waktuMulai: s.waktu_mulai,
    durasiMenit: s.durasi_menit,
  }))

  const { data: studentRows } = await supabase
    .from("students")
    .select("id, nisn, nama, kelas, username, tanggal_lahir")
    .eq("school_id", exam.school_id)
    .order("nama")
  const allStudents: StudentRow[] = (studentRows ?? []).map((s) => ({
    id: s.id,
    nisn: s.nisn,
    nama: s.nama,
    kelas: s.kelas,
    username: s.username,
    tanggalLahir: s.tanggal_lahir,
  }))
  const studentById = new Map(allStudents.map((s) => [s.id, s]))

  const sessionIds = sessions.map((s) => s.id)
  const { data: participantRows } =
    sessionIds.length > 0
      ? await supabase
          .from("session_students")
          .select("id, session_id, student_id, no_peserta")
          .in("session_id", sessionIds)
          .order("no_peserta")
      : { data: [] }

  const participantsBySession: Record<string, SessionStudentRow[]> = {}
  for (const row of participantRows ?? []) {
    const student = studentById.get(row.student_id)
    const entry: SessionStudentRow = {
      id: row.id,
      sessionId: row.session_id,
      studentId: row.student_id,
      noPeserta: row.no_peserta,
      nama: student?.nama ?? "-",
      nisn: student?.nisn ?? "-",
      kelas: student?.kelas ?? "-",
    }
    const list = participantsBySession[row.session_id] ?? []
    list.push(entry)
    participantsBySession[row.session_id] = list
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/ujian" className="text-muted-foreground text-sm hover:underline">
          ← Ujian & Sesi
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{exam.nama_ujian}</h1>
            <p className="text-muted-foreground text-sm">{exam.paket}</p>
          </div>
          <AddSessionDialog examId={exam.id} defaultMapel={exam.nama_ujian} />
        </div>
      </div>
      <SessionList
        examId={exam.id}
        sessions={sessions}
        participantsBySession={participantsBySession}
        allStudents={allStudents}
      />
    </div>
  )
}
