import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AddGroupDialog } from "@/components/soal/add-group-dialog"
import { ImportDocxDialog } from "@/components/soal/import-docx-dialog"
import { GroupList } from "@/components/soal/group-list"
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

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/bank-soal" className="text-muted-foreground text-sm hover:underline">
          ← Bank Soal
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{exam.nama_ujian}</h1>
            <p className="text-muted-foreground text-sm">{exam.paket}</p>
          </div>
          <div className="flex gap-2">
            <ImportDocxDialog examId={exam.id} />
            <AddGroupDialog examId={exam.id} />
          </div>
        </div>
      </div>
      <GroupList examId={exam.id} groups={groups} questionsByGroup={questionsByGroup} />
    </div>
  )
}
