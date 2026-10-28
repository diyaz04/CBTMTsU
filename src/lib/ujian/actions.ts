"use server"

import { revalidatePath } from "next/cache"
import { requireStudentAccess } from "@/lib/ujian/require-access"
import { isValidGlobalToken } from "@/lib/ujian/global-token"
import type { AttemptData, RunnerQuestion } from "@/lib/ujian/types"

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type StartResult = { attemptId: string; error?: undefined } | { error: string; attemptId?: undefined }

// Mulai/lanjutin pengerjaan ujian. Token dicek di sini (bukan cuma UI) karena
// ini server action — satu-satunya pintu masuk yang boleh bikin exam_attempts.
export async function startAttempt(sessionId: string, token: string): Promise<StartResult> {
  const { studentId, supabase, admin } = await requireStudentAccess()

  const { data: sessionStudent } = await supabase
    .from("session_students")
    .select("id")
    .eq("session_id", sessionId)
    .eq("student_id", studentId)
    .maybeSingle()
  if (!sessionStudent) return { error: "Kamu tidak terdaftar di sesi ujian ini." }

  const { data: session } = await admin
    .from("exam_sessions")
    .select("id, exam_id, waktu_mulai, durasi_menit")
    .eq("id", sessionId)
    .maybeSingle()
  if (!session) return { error: "Sesi ujian tidak ditemukan." }

  if (!isValidGlobalToken(token)) return { error: "Token salah atau sudah kedaluwarsa, minta kode terbaru ke pengawas." }

  const now = Date.now()
  const start = new Date(session.waktu_mulai).getTime()
  const end = start + session.durasi_menit * 60_000
  if (now < start) return { error: "Sesi ujian belum dimulai." }

  await admin
    .from("session_students")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", sessionStudent.id)

  const { data: existing } = await supabase
    .from("exam_attempts")
    .select("id, status")
    .eq("session_student_id", sessionStudent.id)
    .maybeSingle()

  if (existing) {
    if (existing.status === "submitted" || existing.status === "auto_submitted") {
      return { error: "Ujian ini sudah kamu selesaikan." }
    }
    if (existing.status === "not_started" && now > end) {
      return { error: "Waktu ujian sudah habis." }
    }
    if (existing.status === "not_started") {
      await supabase
        .from("exam_attempts")
        .update({ status: "in_progress", started_at: new Date().toISOString() })
        .eq("id", existing.id)
    }
    return { attemptId: existing.id }
  }

  if (now > end) return { error: "Waktu ujian sudah habis." }

  const { data: groups } = await admin
    .from("question_groups")
    .select("id")
    .eq("exam_id", session.exam_id)
    .order("urutan")
  const groupIds = (groups ?? []).map((g) => g.id)
  const { data: questions } =
    groupIds.length > 0
      ? await admin.from("questions").select("id").in("group_id", groupIds).order("urutan")
      : { data: [] }
  const soalOrder = shuffle((questions ?? []).map((q) => q.id))

  if (soalOrder.length === 0) return { error: "Ujian ini belum punya soal." }

  const { data: created, error } = await supabase
    .from("exam_attempts")
    .insert({
      session_student_id: sessionStudent.id,
      status: "in_progress",
      started_at: new Date().toISOString(),
      soal_order: soalOrder,
    })
    .select("id")
    .single()
  if (error || !created) return { error: error?.message ?? "Gagal memulai ujian." }

  return { attemptId: created.id }
}

export async function getAttemptData(attemptId: string): Promise<AttemptData | null> {
  const { supabase, admin } = await requireStudentAccess()

  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("id, status, started_at, soal_order, session_student_id")
    .eq("id", attemptId)
    .maybeSingle()
  if (!attempt) return null

  const { data: sessionStudent } = await supabase
    .from("session_students")
    .select("session_id")
    .eq("id", attempt.session_student_id)
    .maybeSingle()
  const { data: session } = sessionStudent
    ? await admin.from("exam_sessions").select("durasi_menit").eq("id", sessionStudent.session_id).maybeSingle()
    : { data: null }

  const questionIds = (attempt.soal_order ?? []) as string[]
  const { data: questionRows } =
    questionIds.length > 0
      ? await admin.from("questions").select("id, tipe_soal, judul, konten, gambar_url, bobot").in("id", questionIds)
      : { data: [] }
  const { data: optionRows } =
    questionIds.length > 0
      ? await admin
          .from("question_options")
          .select("id, question_id, label, teks, urutan")
          .in("question_id", questionIds)
          .order("urutan")
      : { data: [] }

  const questionById = new Map((questionRows ?? []).map((q) => [q.id, q]))
  const optionsByQuestion = new Map<string, RunnerQuestion["options"]>()
  for (const o of optionRows ?? []) {
    const list = optionsByQuestion.get(o.question_id) ?? []
    list.push({ id: o.id, label: o.label, teks: o.teks })
    optionsByQuestion.set(o.question_id, list)
  }

  const questions: RunnerQuestion[] = questionIds.flatMap((id) => {
    const q = questionById.get(id)
    if (!q) return []
    return [
      {
        id,
        tipeSoal: q.tipe_soal,
        judul: q.judul,
        konten: q.konten,
        gambarUrl: q.gambar_url,
        bobot: q.bobot,
        options: optionsByQuestion.get(id) ?? [],
      },
    ]
  })

  const { data: answerRows } = await supabase
    .from("answers")
    .select("question_id, selected_option_id, essay_text")
    .eq("attempt_id", attemptId)
  const answers: AttemptData["answers"] = {}
  for (const a of answerRows ?? []) {
    answers[a.question_id] = {
      optionId: a.selected_option_id ?? undefined,
      essayText: a.essay_text ?? undefined,
    }
  }

  return {
    attemptId: attempt.id,
    status: attempt.status,
    startedAt: attempt.started_at,
    durasiMenit: session?.durasi_menit ?? 0,
    questions,
    answers,
  }
}

export async function saveAnswer(
  attemptId: string,
  questionId: string,
  payload: { optionId?: string; essayText?: string }
) {
  const { supabase } = await requireStudentAccess()

  const { data: attempt } = await supabase.from("exam_attempts").select("status").eq("id", attemptId).maybeSingle()
  if (!attempt) return { error: "Percobaan ujian tidak ditemukan." }
  if (attempt.status !== "in_progress") return { error: "Ujian sudah berakhir, jawaban tidak disimpan." }

  const { error } = await supabase.from("answers").upsert(
    {
      attempt_id: attemptId,
      question_id: questionId,
      selected_option_id: payload.optionId ?? null,
      essay_text: payload.essayText ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "attempt_id,question_id" }
  )
  if (error) return { error: error.message }
  return { success: true }
}

export async function submitAttempt(attemptId: string, auto = false) {
  const { supabase, admin } = await requireStudentAccess()

  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("id, status, soal_order")
    .eq("id", attemptId)
    .maybeSingle()
  if (!attempt) return { error: "Percobaan ujian tidak ditemukan." }
  if (attempt.status === "submitted" || attempt.status === "auto_submitted") {
    return { success: true }
  }

  const questionIds = (attempt.soal_order ?? []) as string[]
  const { data: questionRows } =
    questionIds.length > 0
      ? await admin.from("questions").select("id, tipe_soal, mode_koreksi, bobot").in("id", questionIds)
      : { data: [] }
  const { data: optionRows } =
    questionIds.length > 0
      ? await admin.from("question_options").select("id, question_id, bobot").in("question_id", questionIds)
      : { data: [] }
  const { data: answerRows } = await supabase
    .from("answers")
    .select("question_id, selected_option_id")
    .eq("attempt_id", attemptId)

  const optionsByQuestion = new Map<string, { id: string; bobot: number }[]>()
  for (const o of optionRows ?? []) {
    const list = optionsByQuestion.get(o.question_id) ?? []
    list.push({ id: o.id, bobot: o.bobot })
    optionsByQuestion.set(o.question_id, list)
  }
  const selectedByQuestion = new Map((answerRows ?? []).map((a) => [a.question_id, a.selected_option_id]))

  let nilaiAuto = 0
  for (const q of questionRows ?? []) {
    if (q.mode_koreksi !== "A" || q.tipe_soal !== "multiple-choice") continue
    const selectedId = selectedByQuestion.get(q.id)
    if (!selectedId) continue
    const opt = (optionsByQuestion.get(q.id) ?? []).find((o) => o.id === selectedId)
    if (!opt) continue
    nilaiAuto += (q.bobot * opt.bobot) / 100
  }

  const status = auto ? "auto_submitted" : "submitted"
  const { error: updateError } = await supabase
    .from("exam_attempts")
    .update({ status, submitted_at: new Date().toISOString() })
    .eq("id", attemptId)
  if (updateError) return { error: updateError.message }

  // Insert/update skor lewat admin client — siswa cuma boleh baca skor
  // sendiri (RLS), nulisnya tetap operasi sistem, bukan hak siswa.
  const { error: scoreError } = await admin
    .from("scores")
    .upsert(
      { attempt_id: attemptId, nilai_auto: nilaiAuto, nilai_manual: 0, total: nilaiAuto },
      { onConflict: "attempt_id" }
    )
  if (scoreError) return { error: scoreError.message }

  revalidatePath("/beranda")
  return { success: true }
}
