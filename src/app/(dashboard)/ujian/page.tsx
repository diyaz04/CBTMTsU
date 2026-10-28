import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ArrowRight, CalendarCheck2, Clock, Layers } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function UjianPage() {
  const supabase = await createClient()

  const [{ data: exams }, { data: sessions }] = await Promise.all([
    supabase
      .from("exams")
      .select("id, nama_ujian, paket")
      .order("created_at", { ascending: false }),
    supabase.from("exam_sessions").select("exam_id"),
  ])

  // Count sessions per exam
  const sessionCountByExam = new Map<string, number>()
  for (const s of sessions ?? []) {
    sessionCountByExam.set(s.exam_id, (sessionCountByExam.get(s.exam_id) ?? 0) + 1)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Jadwal Ujian & Sesi Pelaksanaan
          </h1>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {(exams ?? []).length} Asesmen
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Pilih master ujian untuk mengatur tanggal, ruangan, durasi waktu, dan penugasan peserta.
        </p>
      </div>

      {/* Grid of Exams */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(exams ?? []).length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/80 bg-card p-12 text-center shadow-xs">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CalendarCheck2 className="size-7" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Belum Ada Master Ujian</h3>
            <p className="max-w-sm text-xs text-muted-foreground">
              Buat paket ujian terlebih dahulu di menu Bank Soal sebelum dapat mengatur sesi pelaksanaan.
            </p>
            <Link href="/bank-soal" className="mt-2">
              <Button size="sm" className="rounded-xl">
                Buka Bank Soal
              </Button>
            </Link>
          </div>
        ) : (
          (exams ?? []).map((exam) => {
            const count = sessionCountByExam.get(exam.id) ?? 0
            return (
              <div
                key={exam.id}
                className="group relative flex flex-col justify-between gap-4 rounded-3xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="rounded-md font-semibold text-[10px] px-2 py-0.2">
                      <Layers className="size-3 mr-1" />
                      Paket {exam.paket}
                    </Badge>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        count > 0
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Clock className="size-3" />
                      {count} Sesi
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                    {exam.nama_ujian}
                  </h3>
                </div>

                <div className="border-t border-border/60 pt-3">
                  <Link href={`/ujian/${exam.id}`} className="w-full">
                    <Button
                      variant="outline"
                      className="w-full justify-between rounded-xl text-xs font-semibold group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-transparent transition-all"
                    >
                      <span>Atur Sesi & Peserta</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
