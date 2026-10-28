import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import type { OptionInput } from "@/lib/soal/types"

// Ganti seluruh daftar opsi jawaban punya satu soal: hapus semua opsi lama
// lalu insert ulang. Lebih sederhana daripada diff per-opsi dan jumlah opsi
// per soal kecil (umumnya <10), jadi biayanya nggak signifikan.
export async function replaceQuestionOptions(
  supabase: SupabaseClient<Database>,
  questionId: string,
  options: OptionInput[]
) {
  const { error: deleteError } = await supabase
    .from("question_options")
    .delete()
    .eq("question_id", questionId)
  if (deleteError) return { error: deleteError.message }

  if (options.length === 0) return { error: null }

  const { error: insertError } = await supabase.from("question_options").insert(
    options.map((opt, index) => ({
      question_id: questionId,
      label: opt.label,
      teks: opt.teks,
      bobot: opt.bobot,
      is_correct: opt.isCorrect,
      urutan: index,
    }))
  )
  if (insertError) return { error: insertError.message }

  return { error: null }
}

export async function nextUrutan(
  supabase: SupabaseClient<Database>,
  table: "question_groups" | "questions",
  parentId: string
) {
  const { count } =
    table === "question_groups"
      ? await supabase.from("question_groups").select("id", { count: "exact", head: true }).eq("exam_id", parentId)
      : await supabase.from("questions").select("id", { count: "exact", head: true }).eq("group_id", parentId)
  return count ?? 0
}
