import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
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
  const { data: exams } = await supabase
    .from("exams")
    .select("id, nama_ujian, paket")
    .order("created_at", { ascending: false })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Ujian & Sesi</h1>
      <p className="text-muted-foreground text-sm">
        Pilih ujian buat atur jadwal sesi, ruang, dan peserta. Bank soalnya diatur di menu Bank
        Soal.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Ujian</TableHead>
            <TableHead>Paket</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(exams ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-muted-foreground text-center">
                Belum ada ujian. Buat ujian dulu di menu Bank Soal.
              </TableCell>
            </TableRow>
          )}
          {(exams ?? []).map((exam) => (
            <TableRow key={exam.id}>
              <TableCell>
                <Link href={`/ujian/${exam.id}`} className="font-medium hover:underline">
                  {exam.nama_ujian}
                </Link>
              </TableCell>
              <TableCell>{exam.paket}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
