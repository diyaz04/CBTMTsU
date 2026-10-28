"use server"

import { revalidatePath } from "next/cache"
import { requirePenilaianAccess } from "@/lib/penilaian/require-access"

export async function saveEssayGrades(
  attemptId: string,
  sessionId: string,
  grades: { questionId: string; skor: number }[]
) {
  const { userId, supabase, admin } = await requirePenilaianAccess()

  // Gerbang kepemilikan: "exam_attempts: staff read school" RLS cuma balikin
  // baris kalau attempt ini satu sekolah sama staff yang login (atau dia
  // super_admin). Kalau null, attemptId bukan hak staff ini — tolak sebelum
  // admin client (yang bypass RLS) sempat nulis apa pun.
  const { data: attempt } = await supabase.from("exam_attempts").select("id").eq("id", attemptId).maybeSingle()
  if (!attempt) return { error: "Percobaan ujian tidak ditemukan." }

  for (const g of grades) {
    const { error } = await admin
      .from("answers")
      .update({ skor: g.skor })
      .eq("attempt_id", attemptId)
      .eq("question_id", g.questionId)
    if (error) return { error: error.message }
  }

  const { data: allAnswers } = await admin.from("answers").select("skor").eq("attempt_id", attemptId)
  const nilaiManual = (allAnswers ?? []).reduce((sum, a) => sum + (a.skor ?? 0), 0)

  const { data: score } = await admin.from("scores").select("nilai_auto").eq("attempt_id", attemptId).maybeSingle()
  const nilaiAuto = score?.nilai_auto ?? 0

  const { error: scoreError } = await admin.from("scores").upsert(
    {
      attempt_id: attemptId,
      nilai_auto: nilaiAuto,
      nilai_manual: nilaiManual,
      total: nilaiAuto + nilaiManual,
      dinilai_oleh: userId,
      dinilai_at: new Date().toISOString(),
    },
    { onConflict: "attempt_id" }
  )
  if (scoreError) return { error: scoreError.message }

  revalidatePath(`/penilaian/${sessionId}`)
  return { success: "Nilai berhasil disimpan." }
}
