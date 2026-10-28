import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getSessionAttempts } from "@/lib/penilaian/service"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const STATUS_LABEL: Record<string, string> = {
  not_started: "Belum mulai",
  in_progress: "Sedang mengerjakan",
  submitted: "Submit",
  auto_submitted: "Submit (otomatis)",
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
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/penilaian" className="text-muted-foreground text-sm hover:underline">
          ← Penilaian
        </Link>
        <h1 className="text-lg font-semibold">
          {session.mapel} — Sesi {session.sesi_ke}
        </h1>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>NISN</TableHead>
            <TableHead>Kelas</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Nilai</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attempts.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground text-center">
                Belum ada peserta di sesi ini.
              </TableCell>
            </TableRow>
          )}
          {attempts.map((a) => (
            <TableRow key={a.sessionStudentId}>
              <TableCell>{a.noPeserta}</TableCell>
              <TableCell>
                {done.has(a.status) ? (
                  <Link href={`/penilaian/${sessionId}/${a.attemptId}`} className="font-medium hover:underline">
                    {a.studentNama}
                  </Link>
                ) : (
                  a.studentNama
                )}
              </TableCell>
              <TableCell>{a.nisn}</TableCell>
              <TableCell>{a.kelas}</TableCell>
              <TableCell>
                <Badge variant={done.has(a.status) ? "secondary" : "outline"}>
                  {STATUS_LABEL[a.status] ?? a.status}
                </Badge>
              </TableCell>
              <TableCell>
                {a.total !== null ? (
                  <span className={a.dinilaiAt ? "" : "text-muted-foreground"}>
                    {a.total.toFixed(1)} {!a.dinilaiAt && "(auto)"}
                  </span>
                ) : (
                  "-"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
