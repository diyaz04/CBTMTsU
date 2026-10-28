import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import type { AttemptGradeData, AttemptListRow, GradeableQuestion, GradingSummary } from "@/lib/penilaian/types"

const DONE_STATUSES = ["submitted", "auto_submitted"] as const

export async function getSessionGradingSummary(
  supabase: SupabaseClient<Database>,
  sessionId: string
): Promise<GradingSummary> {
  const { data: sessionStudents } = await supabase.from("session_students").select("id").eq("session_id", sessionId)
  const ssIds = (sessionStudents ?? []).map((s) => s.id)
  if (ssIds.length === 0) return { total: 0, submitted: 0, graded: 0 }

  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("id, status")
    .in("session_student_id", ssIds)
  const submitted = (attempts ?? []).filter((a) => DONE_STATUSES.includes(a.status as (typeof DONE_STATUSES)[number]))

  const attemptIds = submitted.map((a) => a.id)
  const { data: scores } =
    attemptIds.length > 0 ? await supabase.from("scores").select("attempt_id, dinilai_at").in("attempt_id", attemptIds) : { data: [] }
  const graded = (scores ?? []).filter((s) => s.dinilai_at).length

  return { total: ssIds.length, submitted: submitted.length, graded }
}

export async function getSessionAttempts(
  supabase: SupabaseClient<Database>,
  sessionId: string
): Promise<AttemptListRow[]> {
  const { data: sessionStudents } = await supabase
    .from("session_students")
    .select("id, student_id, no_peserta")
    .eq("session_id", sessionId)
    .order("no_peserta")
  if (!sessionStudents || sessionStudents.length === 0) return []

  const studentIds = sessionStudents.map((s) => s.student_id)
  const { data: students } = await supabase.from("students").select("id, nama, nisn, kelas").in("id", studentIds)
  const studentById = new Map((students ?? []).map((s) => [s.id, s]))

  const ssIds = sessionStudents.map((s) => s.id)
  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("id, session_student_id, status")
    .in("session_student_id", ssIds)
  const attemptBySS = new Map((attempts ?? []).map((a) => [a.session_student_id, a]))

  const attemptIds = (attempts ?? []).map((a) => a.id)
  const { data: scores } =
    attemptIds.length > 0 ? await supabase.from("scores").select("attempt_id, total, dinilai_at").in("attempt_id", attemptIds) : { data: [] }
  const scoreByAttempt = new Map((scores ?? []).map((s) => [s.attempt_id, s]))

  return sessionStudents.map((ss) => {
    const student = studentById.get(ss.student_id)
    const attempt = attemptBySS.get(ss.id)
    const score = attempt ? scoreByAttempt.get(attempt.id) : undefined
    return {
      attemptId: attempt?.id ?? "",
      sessionStudentId: ss.id,
      studentNama: student?.nama ?? "-",
      nisn: student?.nisn ?? "-",
      kelas: student?.kelas ?? "-",
      noPeserta: ss.no_peserta,
      status: attempt?.status ?? "not_started",
      total: score?.total ?? null,
      dinilaiAt: score?.dinilai_at ?? null,
    }
  })
}

// Admin client dipakai buat baca questions/question_options (termasuk kunci
// jawaban) — guru/admin yang udah lolos requirePenilaianAccess boleh lihat
// itu buat nilai, beda sama siswa yang sengaja diblokir RLS (Fase 6).
export async function getAttemptGradeData(
  supabase: SupabaseClient<Database>,
  admin: SupabaseClient<Database>,
  attemptId: string
): Promise<AttemptGradeData | null> {
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("id, status, session_student_id, soal_order")
    .eq("id", attemptId)
    .maybeSingle()
  if (!attempt) return null

  const { data: sessionStudent } = await supabase
    .from("session_students")
    .select("student_id, no_peserta")
    .eq("id", attempt.session_student_id)
    .maybeSingle()
  const { data: student } = sessionStudent
    ? await supabase.from("students").select("nama, nisn, kelas").eq("id", sessionStudent.student_id).maybeSingle()
    : { data: null }

  const { data: score } = await supabase.from("scores").select("nilai_auto, nilai_manual, total").eq("attempt_id", attemptId).maybeSingle()

  const questionIds = (attempt.soal_order ?? []) as string[]
  const { data: questionRows } =
    questionIds.length > 0
      ? await admin.from("questions").select("id, tipe_soal, mode_koreksi, judul, konten, bobot").in("id", questionIds)
      : { data: [] }
  const { data: optionRows } =
    questionIds.length > 0
      ? await admin
          .from("question_options")
          .select("id, question_id, label, teks, bobot, is_correct, urutan")
          .in("question_id", questionIds)
          .order("urutan")
      : { data: [] }
  const { data: answerRows } = await supabase
    .from("answers")
    .select("question_id, selected_option_id, essay_text, skor")
    .eq("attempt_id", attemptId)

  const questionById = new Map((questionRows ?? []).map((q) => [q.id, q]))
  const optionsByQuestion = new Map<string, GradeableQuestion["options"]>()
  for (const o of optionRows ?? []) {
    const list = optionsByQuestion.get(o.question_id) ?? []
    list.push({ id: o.id, label: o.label, teks: o.teks, bobot: o.bobot, isCorrect: o.is_correct })
    optionsByQuestion.set(o.question_id, list)
  }
  const answerByQuestion = new Map((answerRows ?? []).map((a) => [a.question_id, a]))

  const questions: GradeableQuestion[] = questionIds.flatMap((id) => {
    const q = questionById.get(id)
    if (!q) return []
    const answer = answerByQuestion.get(id)
    return [
      {
        id,
        tipeSoal: q.tipe_soal,
        modeKoreksi: q.mode_koreksi,
        judul: q.judul,
        konten: q.konten,
        bobot: q.bobot,
        options: optionsByQuestion.get(id) ?? [],
        selectedOptionId: answer?.selected_option_id ?? null,
        essayText: answer?.essay_text ?? null,
        skor: answer?.skor ?? null,
      },
    ]
  })

  return {
    attemptId: attempt.id,
    studentNama: student?.nama ?? "-",
    nisn: student?.nisn ?? "-",
    kelas: student?.kelas ?? "-",
    noPeserta: sessionStudent?.no_peserta ?? "-",
    status: attempt.status,
    nilaiAuto: score?.nilai_auto ?? 0,
    nilaiManual: score?.nilai_manual ?? 0,
    total: score?.total ?? 0,
    questions,
  }
}
