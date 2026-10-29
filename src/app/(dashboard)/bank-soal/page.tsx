import { createClient } from "@/lib/supabase/server"
import { ExamList } from "@/components/soal/exam-list"
import { AddExamDialog } from "@/components/soal/add-exam-dialog"
import type { ExamRow } from "@/lib/soal/types"
import { BookOpen, Layers, Sparkles } from "lucide-react"

export default async function BankSoalPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("exams")
    .select("id, nama_ujian, paket, created_at, acak_soal, acak_opsi")
    .order("created_at", { ascending: false })

  const exams: ExamRow[] = (data ?? []).map((e) => ({
    id: e.id,
    namaUjian: e.nama_ujian,
    paket: e.paket,
    createdAt: e.created_at,
    acakSoal: e.acak_soal,
    acakOpsi: e.acak_opsi,
  }))

  const totalPaket = new Set(exams.map((e) => e.paket)).size

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Bank Soal & Asesmen
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {exams.length} Paket Ujian
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Kumpulan master instrumen soal pilihan ganda, esai, dan import file Word DOCX.
          </p>
        </div>

        <AddExamDialog />
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Master Ujian</p>
            <p className="text-xl font-bold text-foreground">{exams.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Layers className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Varian Paket Ujian</p>
            <p className="text-xl font-bold text-foreground">{totalPaket} Paket</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Fitur Import Otomatis</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Mendukung DOCX</p>
          </div>
        </div>
      </div>

      {/* Exam Grid */}
      <ExamList exams={exams} />
    </div>
  )
}
