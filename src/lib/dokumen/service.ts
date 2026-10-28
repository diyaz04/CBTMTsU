import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import type { AttendanceRow, SessionInfo, StudentCard } from "@/lib/dokumen/types"

// Kartu ujian digabung per siswa (bukan per sesi) — satu siswa bisa ikut
// banyak sesi/mapel berbeda hari, jadwalnya dirangkum jadi satu tabel di
// kartu. Query flat + join manual di JS (konsisten sama pola di modul lain)
// karena tipe Database hasil tulis tangan belum punya Relationships.
export async function getStudentCards(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  kelas?: string
): Promise<StudentCard[]> {
  let query = supabase
    .from("students")
    .select("id, nisn, nama, kelas, username, tanggal_lahir")
    .eq("school_id", schoolId)
    .order("kelas")
    .order("nama")
  if (kelas) query = query.eq("kelas", kelas)
  const { data: students } = await query
  if (!students || students.length === 0) return []

  const studentIds = students.map((s) => s.id)
  const { data: participantRows } = await supabase
    .from("session_students")
    .select("student_id, no_peserta, session_id")
    .in("student_id", studentIds)
  if (!participantRows || participantRows.length === 0) {
    return students.map((s) => ({
      studentId: s.id,
      nisn: s.nisn,
      nama: s.nama,
      kelas: s.kelas,
      username: s.username,
      tanggalLahir: s.tanggal_lahir,
      sessions: [],
    }))
  }

  const sessionIds = [...new Set(participantRows.map((p) => p.session_id))]
  const { data: sessionRows } = await supabase
    .from("exam_sessions")
    .select("id, exam_id, tanggal, sesi_ke, ruang, mapel, waktu_mulai, durasi_menit")
    .in("id", sessionIds)
  const sessionById = new Map((sessionRows ?? []).map((s) => [s.id, s]))

  const sessionsByStudent = new Map<string, StudentCard["sessions"]>()
  for (const p of participantRows) {
    const session = sessionById.get(p.session_id)
    if (!session) continue
    const list = sessionsByStudent.get(p.student_id) ?? []
    list.push({
      tanggal: session.tanggal,
      sesiKe: session.sesi_ke,
      mapel: session.mapel,
      ruang: session.ruang,
      waktuMulai: session.waktu_mulai,
      durasiMenit: session.durasi_menit,
      noPeserta: p.no_peserta,
    })
    sessionsByStudent.set(p.student_id, list)
  }
  for (const list of sessionsByStudent.values()) {
    list.sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.sesiKe - b.sesiKe)
  }

  return students.map((s) => ({
    studentId: s.id,
    nisn: s.nisn,
    nama: s.nama,
    kelas: s.kelas,
    username: s.username,
    tanggalLahir: s.tanggal_lahir,
    sessions: sessionsByStudent.get(s.id) ?? [],
  }))
}

export async function getSessionInfo(
  supabase: SupabaseClient<Database>,
  sessionId: string
): Promise<SessionInfo | null> {
  const { data: session } = await supabase
    .from("exam_sessions")
    .select("id, exam_id, tanggal, sesi_ke, ruang, mapel, waktu_mulai, durasi_menit")
    .eq("id", sessionId)
    .maybeSingle()
  if (!session) return null

  const { data: exam } = await supabase
    .from("exams")
    .select("nama_ujian, paket")
    .eq("id", session.exam_id)
    .maybeSingle()

  return {
    id: session.id,
    examId: session.exam_id,
    namaUjian: exam?.nama_ujian ?? "-",
    paket: exam?.paket ?? "-",
    tanggal: session.tanggal,
    sesiKe: session.sesi_ke,
    mapel: session.mapel,
    ruang: session.ruang,
    waktuMulai: session.waktu_mulai,
    durasiMenit: session.durasi_menit,
  }
}

export async function getSessionAttendance(
  supabase: SupabaseClient<Database>,
  sessionId: string
): Promise<AttendanceRow[]> {
  const { data: participants } = await supabase
    .from("session_students")
    .select("student_id, no_peserta")
    .eq("session_id", sessionId)
    .order("no_peserta")
  if (!participants || participants.length === 0) return []

  const studentIds = participants.map((p) => p.student_id)
  const { data: students } = await supabase.from("students").select("id, nisn, nama, kelas").in("id", studentIds)
  const studentById = new Map((students ?? []).map((s) => [s.id, s]))

  return participants.map((p) => {
    const s = studentById.get(p.student_id)
    return { noPeserta: p.no_peserta, nisn: s?.nisn ?? "-", nama: s?.nama ?? "-", kelas: s?.kelas ?? "-" }
  })
}
