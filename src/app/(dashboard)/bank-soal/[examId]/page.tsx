import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, BookOpen, FileText, Layers, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { AddGroupDialog } from "@/components/soal/add-group-dialog"
import { ImportDocxDialog } from "@/components/soal/import-docx-dialog"
import { GroupList } from "@/components/soal/group-list"
import { Badge } from "@/components/ui/badge"
import type { GroupRow, QuestionRow } from "@/lib/soal/types"

export default async function BankSoalDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const { examId } = await params
  const supabase = await createClient()

  const { data: exam } = await supabase
    .from("exams")
    .select("id, nama_ujian, paket")
    .eq("id", examId)
    .maybeSingle()
  if (!exam) notFound()

  const { data: groupRows } = await supabase
    .from("question_groups")
    .select("id, exam_id, kode_grup, nama_grup, deskripsi, bobot_grup, urutan")
    .eq("exam_id", examId)
    .order("urutan")

  const groups: GroupRow[] = (groupRows ?? []).map((g) => ({
    id: g.id,
    examId: g.exam_id,
    kodeGrup: g.kode_grup,
    namaGrup: g.nama_grup,
    deskripsi: g.deskripsi,
    bobotGrup: g.bobot_grup,
    urutan: g.urutan,
  }))

  const groupIds = groups.map((g) => g.id)
  const { data: questionRows } =
    groupIds.length > 0
      ? await supabase
          .from("questions")
          .select("id, group_id, tipe_soal, judul, mode_koreksi, bobot, konten, gambar_url, urutan")
          .in("group_id", groupIds)
          .order("urutan")
      : { data: [] }

  const questionIds = (questionRows ?? []).map((q) => q.id)
  const { data: optionRows } =
    questionIds.length > 0
      ? await supabase
          .from("question_options")
          .select("id, question_id, label, teks, bobot, is_correct, urutan")
          .in("question_id", questionIds)
          .order("urutan")
      : { data: [] }

  const optionsByQuestion = new Map<string, QuestionRow["options"]>()
  for (const o of optionRows ?? []) {
    const list = optionsByQuestion.get(o.question_id) ?? []
    list.push({ id: o.id, label: o.label, teks: o.teks, bobot: o.bobot, isCorrect: o.is_correct, urutan: o.urutan })
    optionsByQuestion.set(o.question_id, list)
  }

  const questionsByGroup: Record<string, QuestionRow[]> = {}
  for (const q of questionRows ?? []) {
    const row: QuestionRow = {
      id: q.id,
      groupId: q.group_id,
      tipeSoal: q.tipe_soal,
      judul: q.judul,
      modeKoreksi: q.mode_koreksi,
      bobot: q.bobot,
      konten: q.konten,
      gambarUrl: q.gambar_url,
      urutan: q.urutan,
      options: optionsByQuestion.get(q.id) ?? [],
    }
    const list = questionsByGroup[q.group_id] ?? []
    list.push(row)
    questionsByGroup[q.group_id] = list
  }

  const totalQuestions = (questionRows ?? []).length

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/bank-soal"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground w-fit"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke Bank Soal
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {exam.nama_ujian}
              </h1>
              <Badge variant="secondary" className="rounded-lg font-semibold text-xs px-2.5 py-0.5">
                <Layers className="size-3 mr-1" />
                Paket {exam.paket}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Total {groups.length} Grup Kompetensi · {totalQuestions} Butir Soal Terdaftar
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <ImportDocxDialog examId={exam.id} />
            <AddGroupDialog examId={exam.id} />
          </div>
        </div>
      </div>

      {/* Groups & Questions List */}
      <GroupList examId={exam.id} groups={groups} questionsByGroup={questionsByGroup} />
    </div>
  )
}
