import { createClient } from "@/lib/supabase/server"
import { ExamList } from "@/components/soal/exam-list"
import { AddExamDialog } from "@/components/soal/add-exam-dialog"
import type { ExamRow } from "@/lib/soal/types"

export default async function BankSoalPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("exams")
    .select("id, nama_ujian, paket, created_at")
    .order("created_at", { ascending: false })

  const exams: ExamRow[] = (data ?? []).map((e) => ({
    id: e.id,
    namaUjian: e.nama_ujian,
    paket: e.paket,
    createdAt: e.created_at,
  }))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Bank Soal</h1>
        <AddExamDialog />
      </div>
      <ExamList exams={exams} />
    </div>
  )
}
