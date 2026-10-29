import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ArrowRight, CalendarCheck2, Clock, Layers } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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

      {/* List of Exams */}
      {(exams ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/80 bg-card p-12 text-center shadow-xs">
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
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-12 text-center text-xs font-bold text-muted-foreground">#</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground">NAMA UJIAN</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground">PAKET</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground">SESI</TableHead>
                <TableHead className="w-48 text-right text-xs font-bold text-muted-foreground">AKSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(exams ?? []).map((exam, idx) => {
                const count = sessionCountByExam.get(exam.id) ?? 0
                return (
                  <TableRow key={exam.id} className="transition-colors hover:bg-muted/30">
                    <TableCell className="text-center text-xs font-medium text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-xs text-foreground line-clamp-1">{exam.nama_ujian}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md font-semibold text-[10px] px-2 py-0.2">
                        <Layers className="size-3 mr-1" />
                        {exam.paket}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/ujian/${exam.id}`}>
                        <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs font-semibold">
                          Atur Sesi & Peserta
                          <ArrowRight className="size-3.5" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
