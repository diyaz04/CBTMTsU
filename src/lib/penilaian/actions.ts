"use server"

import { revalidatePath } from "next/cache"
import { requirePenilaianAccess } from "@/lib/penilaian/require-access"

export async function saveEssayGrades(
  attemptId: string,
  sessionId: string,
  grades: { questionId: string; skor: number }[]
) {
  const { userId, admin } = await requirePenilaianAccess()

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
