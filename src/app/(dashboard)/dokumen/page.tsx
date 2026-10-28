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
import {
  Calendar,
  Clock,
  DoorOpen,
  FileSpreadsheet,
  FileText,
  Printer,
  QrCode,
  Users,
} from "lucide-react"

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
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Administrasi & Cetak Dokumen
        </h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Pusat pencetakan kartu peserta, QR-Code login, serta berita acara daftar hadir ujian CBT.
        </p>
      </div>

      {/* Card Section 1: Kartu Ujian & Akses */}
      <div className="flex flex-col gap-5 rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <QrCode className="size-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground sm:text-lg">
              Kartu Ujian & Kredensial Siswa
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              Mencetak kartu resmi siswa lengkap dengan NISN, username, barcode QR-Code, password default, dan jadwal sesi ujian.
            </p>
          </div>
        </div>

        <form action="/dokumen/kartu" method="get" className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
          <div className="w-full sm:w-60">
            <Select name="kelas">
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Pilih Rombel / Semua Kelas" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {kelasList.map((k) => (
                  <SelectItem key={k} value={k}>
                    Kelas {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="gap-2 h-11 rounded-xl bg-primary px-5 font-semibold text-xs text-primary-foreground shadow-sm hover:bg-primary/90">
            <Printer className="size-4" />
            Buka & Cetak Kartu Peserta
          </Button>
        </form>
      </div>

      {/* Card Section 2: Daftar Hadir Peserta */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground sm:text-lg">
            Daftar Hadir Peserta Ujian
          </h2>
          <p className="text-xs text-muted-foreground">
            Cetak formulir presensi tanda tangan peserta untuk setiap sesi ruangan ujian.
          </p>
        </div>

        {(sessionRows ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/80 bg-card p-12 text-center shadow-xs">
            <FileSpreadsheet className="size-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Belum ada sesi ujian terjadwal.</p>
          </div>
        ) : (
          [...sessionsByTanggal.entries()].map(([tanggal, sessions]) => (
            <div key={tanggal} className="flex flex-col gap-3 rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <Calendar className="size-4 text-primary" />
                <span className="font-bold text-sm text-foreground">{formatTanggal(tanggal)}</span>
              </div>

              <div className="flex flex-col divide-y divide-border/60">
                {(sessions ?? []).map((s) => (
                  <div key={s.id} className="flex flex-col justify-between gap-3 py-3 sm:flex-row sm:items-center">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-primary/10 px-2 py-0.2 font-mono text-xs font-bold text-primary">
                          Sesi {s.sesi_ke}
                        </span>
                        <span className="font-semibold text-xs text-foreground">
                          {examNameById.get(s.exam_id) ?? s.mapel}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DoorOpen className="size-3" />
                          Ruang {s.ruang}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatWaktu(s.waktu_mulai)}
                        </span>
                      </div>
                    </div>

                    <Link href={`/dokumen/daftar-hadir/${s.id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs font-semibold">
                        <Printer className="size-3.5" />
                        Cetak Presensi
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
