"use server"

import { requireSesiAccess } from "@/lib/sesi/require-access"
import { now } from "@/lib/now"

export type MonitoringStatus = "belum_login" | "menunggu_mulai" | "mengerjakan" | "selesai"

export interface MonitoringStudentRow {
  sessionStudentId: string
  nama: string
  kelas: string
  noPeserta: string
  status: MonitoringStatus
  answered: number
  totalSoal: number
  percent: number
  nilai: number | null
  lastSeenAt: string | null
}

export interface MonitoringSessionCard {
  id: string
  examName: string
  mapel: string
  sesiKe: number
  ruang: string
  tanggal: string
  waktuMulai: string
  durasiMenit: number
  isLive: boolean
  students: MonitoringStudentRow[]
}

export interface MonitoringData {
  sessions: MonitoringSessionCard[]
  totals: { belumLogin: number; menunggu: number; mengerjakan: number; selesai: number }
}

type QuestionMeta = { bobot: number; modeKoreksi: string; tipeSoal: string }
type AnswerLite = { question_id: string; selected_option_id: string | null; essay_text: string | null }

// Formula skor otomatis di sini sengaja disamain sama submitAttempt() di
// lib/ujian/actions.ts — ini cuma versi "sementara" buat dipantau sebelum
// siswa submit, bukan sumber nilai final (yang final tetap dari tabel scores).
function computeLiveScore(
  questionIds: string[],
  answers: AnswerLite[],
  questionMetaById: Map<string, QuestionMeta>,
  optionsByQuestion: Map<string, { id: string; bobot: number }[]>
): number {
  const selectedByQuestion = new Map(answers.map((a) => [a.question_id, a.selected_option_id]))
  let total = 0
  for (const qId of questionIds) {
    const meta = questionMetaById.get(qId)
    if (!meta || meta.modeKoreksi !== "A" || meta.tipeSoal !== "multiple-choice") continue
    const selectedId = selectedByQuestion.get(qId)
    if (!selectedId) continue
    const opt = (optionsByQuestion.get(qId) ?? []).find((o) => o.id === selectedId)
    if (!opt) continue
    total += (meta.bobot * opt.bobot) / 100
  }
  return total
}

export async function getMonitoringData(): Promise<MonitoringData> {
  const { supabase } = await requireSesiAccess()
  const nowMs = now()

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
    sessionIds.length > 0
      ? await supabase
          .from("session_students")
          .select("id, session_id, student_id, no_peserta, last_seen_at")
          .in("session_id", sessionIds)
      : { data: [] }

  const studentIds = [...new Set((sessionStudents ?? []).map((s) => s.student_id))]
  const { data: studentRows } =
    studentIds.length > 0
      ? await supabase.from("students").select("id, nama, kelas").in("id", studentIds)
      : { data: [] }
  const studentById = new Map((studentRows ?? []).map((s) => [s.id, s]))

  const ssIds = (sessionStudents ?? []).map((s) => s.id)
  const { data: attempts } =
    ssIds.length > 0
      ? await supabase
          .from("exam_attempts")
          .select("id, session_student_id, status, soal_order")
          .in("session_student_id", ssIds)
      : { data: [] }
  const attemptBySS = new Map((attempts ?? []).map((a) => [a.session_student_id, a]))

  const attemptIds = (attempts ?? []).map((a) => a.id)
  const { data: answerRows } =
    attemptIds.length > 0
      ? await supabase
          .from("answers")
          .select("attempt_id, question_id, selected_option_id, essay_text")
          .in("attempt_id", attemptIds)
      : { data: [] }
  const answersByAttempt = new Map<string, AnswerLite[]>()
  for (const a of answerRows ?? []) {
    const list = answersByAttempt.get(a.attempt_id) ?? []
    list.push(a)
    answersByAttempt.set(a.attempt_id, list)
  }

  const { data: scoreRows } =
    attemptIds.length > 0 ? await supabase.from("scores").select("attempt_id, total").in("attempt_id", attemptIds) : { data: [] }
  const scoreByAttempt = new Map((scoreRows ?? []).map((s) => [s.attempt_id, s.total]))

  const allQuestionIds = [...new Set((attempts ?? []).flatMap((a) => (a.soal_order ?? []) as string[]))]
  const { data: questionRows } =
    allQuestionIds.length > 0
      ? await supabase.from("questions").select("id, bobot, mode_koreksi, tipe_soal").in("id", allQuestionIds)
      : { data: [] }
  const questionMetaById = new Map(
    (questionRows ?? []).map((q) => [q.id, { bobot: q.bobot, modeKoreksi: q.mode_koreksi, tipeSoal: q.tipe_soal }])
  )

  const { data: optionRows } =
    allQuestionIds.length > 0
      ? await supabase.from("question_options").select("id, question_id, bobot").in("question_id", allQuestionIds)
      : { data: [] }
  const optionsByQuestion = new Map<string, { id: string; bobot: number }[]>()
  for (const o of optionRows ?? []) {
    const list = optionsByQuestion.get(o.question_id) ?? []
    list.push({ id: o.id, bobot: o.bobot })
    optionsByQuestion.set(o.question_id, list)
  }

  const totals = { belumLogin: 0, menunggu: 0, mengerjakan: 0, selesai: 0 }

  const sessions: MonitoringSessionCard[] = (sessionRows ?? []).map((session) => {
    const start = new Date(session.waktu_mulai).getTime()
    const end = start + session.durasi_menit * 60_000
    const isLive = nowMs >= start && nowMs <= end

    const students: MonitoringStudentRow[] = (sessionStudents ?? [])
      .filter((ss) => ss.session_id === session.id)
      .map((ss) => {
        const studentInfo = studentById.get(ss.student_id)
        const attempt = attemptBySS.get(ss.id)

        let status: MonitoringStatus
        let answered = 0
        let totalSoal = 0
        let nilai: number | null = null

        if (!attempt || attempt.status === "not_started") {
          status = ss.last_seen_at ? "menunggu_mulai" : "belum_login"
        } else {
          const questionIds = (attempt.soal_order ?? []) as string[]
          totalSoal = questionIds.length
          const theseAnswers = answersByAttempt.get(attempt.id) ?? []
          answered = theseAnswers.filter((a) => a.selected_option_id || a.essay_text).length

          if (attempt.status === "in_progress") {
            status = "mengerjakan"
            nilai = computeLiveScore(questionIds, theseAnswers, questionMetaById, optionsByQuestion)
          } else {
            status = "selesai"
            nilai =
              scoreByAttempt.get(attempt.id) ??
              computeLiveScore(questionIds, theseAnswers, questionMetaById, optionsByQuestion)
          }
        }

        return {
          sessionStudentId: ss.id,
          nama: studentInfo?.nama ?? "Tidak diketahui",
          kelas: studentInfo?.kelas ?? "-",
          noPeserta: ss.no_peserta,
          status,
          answered,
          totalSoal,
          percent: totalSoal > 0 ? Math.round((answered / totalSoal) * 100) : 0,
          nilai,
          lastSeenAt: ss.last_seen_at,
        }
      })
      .sort((a, b) => a.noPeserta.localeCompare(b.noPeserta))

    for (const s of students) {
      if (s.status === "belum_login") totals.belumLogin++
      else if (s.status === "menunggu_mulai") totals.menunggu++
      else if (s.status === "mengerjakan") totals.mengerjakan++
      else totals.selesai++
    }

    return {
      id: session.id,
      examName: examNameById.get(session.exam_id) ?? session.mapel,
      mapel: session.mapel,
      sesiKe: session.sesi_ke,
      ruang: session.ruang,
      tanggal: session.tanggal,
      waktuMulai: session.waktu_mulai,
      durasiMenit: session.durasi_menit,
      isLive,
      students,
    }
  })

  return { sessions, totals }
}
