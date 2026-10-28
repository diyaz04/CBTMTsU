import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Award, CheckCircle2, ChevronRight, Clock, User } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getSessionAttempts } from "@/lib/penilaian/service"
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

const STATUS_LABEL: Record<string, string> = {
  not_started: "Belum Mulai",
  in_progress: "Sedang Mengerjakan",
  submitted: "Sudah Submit",
  auto_submitted: "Submit Otomatis",
}

export default async function PenilaianSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from("exam_sessions")
    .select("id, exam_id, mapel, tanggal, sesi_ke")
    .eq("id", sessionId)
    .maybeSingle()
  if (!session) notFound()

  const attempts = await getSessionAttempts(supabase, sessionId)
  const done = new Set(["submitted", "auto_submitted"])

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/penilaian"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground w-fit"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke Daftar Sesi Penilaian
        </Link>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {session.mapel} — Sesi {session.sesi_ke}
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {attempts.length} Siswa
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Daftar lembar jawaban siswa. Klik nama siswa yang telah submit untuk melihat rincian koreksi esai.
          </p>
        </div>
      </div>

      {/* Table of Attempts */}
      <div className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-20 text-xs font-bold text-muted-foreground">NO. PESERTA</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">NAMA SISWA</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">NISN</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">KELAS</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">STATUS</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">NILAI TOTAL</TableHead>
              <TableHead className="w-16 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {attempts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-xs text-muted-foreground">
                  Belum ada peserta yang terdaftar di sesi ini.
                </TableCell>
              </TableRow>
            ) : (
              attempts.map((a) => {
                const isFinished = done.has(a.status)
                const initials = a.studentNama
                  ? a.studentNama
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : "S"

                return (
                  <TableRow key={a.sessionStudentId} className="transition-colors hover:bg-muted/30">
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {a.noPeserta}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                          {initials}
                        </div>
                        {isFinished ? (
                          <Link
                            href={`/penilaian/${sessionId}/${a.attemptId}`}
                            className="font-semibold text-xs text-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                          >
                            <span>{a.studentNama}</span>
                            <ChevronRight className="size-3 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground">
                            {a.studentNama}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {a.nisn}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] rounded-md font-semibold">
                        {a.kelas}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isFinished ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3" />
                          {STATUS_LABEL[a.status] ?? a.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                          <Clock className="size-3" />
                          {STATUS_LABEL[a.status] ?? a.status}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {a.total !== null ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground">
                          <Award className="size-3.5 text-primary" />
                          {a.total.toFixed(1)}
                          {!a.dinilaiAt && (
                            <span className="text-[10px] font-normal text-muted-foreground">
                              (pg auto)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-mono text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isFinished && (
                        <Link href={`/penilaian/${sessionId}/${a.attemptId}`}>
                          <Button size="xs" variant="outline" className="rounded-lg text-[11px]">
                            Koreksi
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
