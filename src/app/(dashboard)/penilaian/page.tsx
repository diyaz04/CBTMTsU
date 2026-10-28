import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getSessionGradingSummary } from "@/lib/penilaian/service"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  DoorOpen,
  FileCheck2,
} from "lucide-react"

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

  let totalSubmitted = 0
  let totalGraded = 0
  for (const { summary } of summaries) {
    totalSubmitted += summary.submitted
    totalGraded += summary.graded
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Penilaian & Hasil Ujian
          </h1>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {summaries.length} Sesi
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Periksa lembar jawaban peserta, beri skor esai uraian, dan tinjau rekap nilai ujian.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3.5 rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Award className="size-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Total Lembar Jawaban</p>
            <p className="text-2xl font-extrabold text-foreground">{totalSubmitted} Berkas</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Telah Dinilai / Selesai</p>
            <p className="text-2xl font-extrabold text-foreground">{totalGraded} Berkas</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <FileCheck2 className="size-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Koreksi Esai Tertunda</p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {Math.max(0, totalSubmitted - totalGraded)} Berkas
            </p>
          </div>
        </div>
      </div>

      {/* Sessions Grading List */}
      <div className="flex flex-col gap-3">
        {summaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/80 bg-card p-12 text-center shadow-xs">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Award className="size-7" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Belum Ada Sesi Ujian</h3>
            <p className="max-w-sm text-xs text-muted-foreground">
              Sesi ujian yang telah dilaksanakan akan muncul di sini untuk dinilai.
            </p>
          </div>
        ) : (
          summaries.map(({ session, summary }) => {
            const isFullyGraded = summary.graded === summary.submitted && summary.submitted > 0
            return (
              <Link
                key={session.id}
                href={`/penilaian/${session.id}`}
                className="group flex flex-col justify-between gap-3 rounded-3xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md sm:flex-row sm:items-center"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                      Sesi {session.sesi_ke}
                    </span>
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {examNameById.get(session.exam_id) ?? session.mapel}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-primary" />
                      {formatTanggal(session.tanggal)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <DoorOpen className="size-3.5 text-primary" />
                      {session.ruang}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <div className="flex items-center gap-2">
                    <span className="rounded-xl border border-border bg-muted/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {summary.submitted}/{summary.total} Submit
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold ${
                        isFullyGraded
                          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {isFullyGraded && <CheckCircle2 className="size-3.5" />}
                      {summary.graded}/{summary.submitted} Dinilai
                    </span>
                  </div>

                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
