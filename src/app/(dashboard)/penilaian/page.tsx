import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getSessionGradingSummary } from "@/lib/penilaian/service"
import { Badge } from "@/components/ui/badge"

function formatTanggal(tanggal: string) {
  return new Date(`${tanggal}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default async function PenilaianPage() {
  const supabase = await createClient()

  const { data: sessionRows } = await supabase
    .from("exam_sessions")
    .select("id, exam_id, tanggal, sesi_ke, mapel, ruang")
    .order("tanggal", { ascending: false })
    .order("sesi_ke")

  const examIds = [...new Set((sessionRows ?? []).map((s) => s.exam_id))]
  const { data: examRows } =
    examIds.length > 0 ? await supabase.from("exams").select("id, nama_ujian").in("id", examIds) : { data: [] }
  const examNameById = new Map((examRows ?? []).map((e) => [e.id, e.nama_ujian]))

  const summaries = await Promise.all(
    (sessionRows ?? []).map(async (s) => ({ session: s, summary: await getSessionGradingSummary(supabase, s.id) }))
  )

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Penilaian</h1>
      <p className="text-muted-foreground text-sm">
        Pilih sesi buat lihat jawaban siswa & kasih nilai esai. Soal pilihan ganda otomatis ternilai
        saat siswa submit.
      </p>

      <div className="flex flex-col gap-2">
        {summaries.length === 0 && <p className="text-muted-foreground text-sm">Belum ada sesi ujian.</p>}
        {summaries.map(({ session, summary }) => (
          <Link
            key={session.id}
            href={`/penilaian/${session.id}`}
            className="flex items-center justify-between gap-2 rounded-lg border p-4 hover:bg-muted/50"
          >
            <div>
              <p className="font-medium">
                {examNameById.get(session.exam_id) ?? session.mapel} — Sesi {session.sesi_ke}
              </p>
              <p className="text-muted-foreground text-sm">
                {formatTanggal(session.tanggal)} · {session.ruang}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">
                {summary.submitted}/{summary.total} submit
              </Badge>
              <Badge variant={summary.graded === summary.submitted && summary.submitted > 0 ? "secondary" : "default"}>
                {summary.graded}/{summary.submitted} dinilai
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
