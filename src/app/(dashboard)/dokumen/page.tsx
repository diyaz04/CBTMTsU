import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function formatTanggal(tanggal: string) {
  return new Date(`${tanggal}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatWaktu(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
}

export default async function DokumenPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()

  const { data: studentRows } = await supabase
    .from("students")
    .select("kelas")
    .eq("school_id", (user && user.type === "staff" ? user.schoolId : null) ?? "")
  const kelasList = [...new Set((studentRows ?? []).map((s) => s.kelas))].sort()

  const { data: sessionRows } = await supabase
    .from("exam_sessions")
    .select("id, exam_id, tanggal, sesi_ke, ruang, mapel, waktu_mulai")
    .order("tanggal")
    .order("sesi_ke")

  const examIds = [...new Set((sessionRows ?? []).map((s) => s.exam_id))]
  const { data: examRows } =
    examIds.length > 0 ? await supabase.from("exams").select("id, nama_ujian").in("id", examIds) : { data: [] }
  const examNameById = new Map((examRows ?? []).map((e) => [e.id, e.nama_ujian]))

  const sessionsByTanggal = new Map<string, typeof sessionRows>()
  for (const s of sessionRows ?? []) {
    const list = sessionsByTanggal.get(s.tanggal) ?? []
    list.push(s)
    sessionsByTanggal.set(s.tanggal, list)
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">Dokumen</h1>

      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <div>
          <p className="font-medium">Kartu Ujian & Akses</p>
          <p className="text-muted-foreground text-sm">
            Satu kartu per siswa, berisi jadwal semua sesi yang diikuti + username/password login.
          </p>
        </div>
        <form action="/dokumen/kartu" method="get" className="flex items-end gap-2">
          <div className="flex flex-col gap-2">
            <Select name="kelas">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Semua kelas" />
              </SelectTrigger>
              <SelectContent>
                {kelasList.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit">Cetak Kartu</Button>
        </form>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <p className="font-medium">Daftar Hadir</p>
          <p className="text-muted-foreground text-sm">Satu daftar hadir per sesi ujian.</p>
        </div>
        {(sessionRows ?? []).length === 0 && (
          <p className="text-muted-foreground text-sm">Belum ada sesi ujian terjadwal.</p>
        )}
        {[...sessionsByTanggal.entries()].map(([tanggal, sessions]) => (
          <div key={tanggal} className="flex flex-col gap-2 rounded-lg border p-4">
            <p className="text-sm font-medium">{formatTanggal(tanggal)}</p>
            <div className="flex flex-col gap-1">
              {(sessions ?? []).map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    Sesi {s.sesi_ke} — {examNameById.get(s.exam_id) ?? s.mapel} · {s.ruang} ·{" "}
                    {formatWaktu(s.waktu_mulai)}
                  </span>
                  <Link href={`/dokumen/daftar-hadir/${s.id}`} className="text-sm underline shrink-0">
                    Cetak Daftar Hadir
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
