import QRCode from "qrcode"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getStudentCards } from "@/lib/dokumen/service"
import { passwordFromTanggalLahir } from "@/lib/students/password"
import { PrintButton } from "@/components/dokumen/print-button"

function formatTanggal(tanggal: string) {
  return new Date(`${tanggal}T00:00:00`).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

function formatWaktu(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
}

export default async function KartuPage({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string }>
}) {
  const { kelas } = await searchParams
  const user = await getCurrentUser()
  const supabase = await createClient()

  const schoolId = user && user.type === "staff" ? user.schoolId : null
  const { data: school } = schoolId
    ? await supabase.from("schools").select("nama").eq("id", schoolId).maybeSingle()
    : { data: null }

  const cards = schoolId ? await getStudentCards(supabase, schoolId, kelas || undefined) : []
  const qrByStudent = new Map<string, string>()
  for (const c of cards) {
    qrByStudent.set(c.studentId, await QRCode.toString(c.nisn, { type: "svg", width: 90, margin: 0 }))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-lg font-semibold">Kartu Ujian & Akses{kelas ? ` — ${kelas}` : ""}</h1>
        <PrintButton />
      </div>

      {cards.length === 0 && <p className="text-muted-foreground text-sm">Tidak ada siswa.</p>}

      <div className="grid grid-cols-2 gap-4 print:grid-cols-2">
        {cards.map((card) => (
          <div
            key={card.studentId}
            className="flex flex-col gap-2 rounded-lg border border-dashed p-4 text-sm break-inside-avoid"
          >
            <div className="flex items-start justify-between gap-2 border-b pb-2">
              <div>
                <p className="font-semibold">{school?.nama ?? "-"}</p>
                <p className="text-muted-foreground text-xs">Kartu Ujian & Akses</p>
              </div>
              <div
                className="shrink-0"
                dangerouslySetInnerHTML={{ __html: qrByStudent.get(card.studentId) ?? "" }}
              />
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
              <span className="text-muted-foreground">Nama</span>
              <span className="font-medium">: {card.nama}</span>
              <span className="text-muted-foreground">NISN</span>
              <span>: {card.nisn}</span>
              <span className="text-muted-foreground">Kelas</span>
              <span>: {card.kelas}</span>
            </div>

            <div className="flex flex-col gap-1 rounded border bg-muted/30 p-2">
              <p className="text-xs font-medium">Akses Login</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-2">
                <span className="text-muted-foreground">Username</span>
                <span>: {card.username}</span>
                <span className="text-muted-foreground">Password</span>
                <span>: {passwordFromTanggalLahir(card.tanggalLahir)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium">Jadwal Ujian</p>
              {card.sessions.length === 0 && (
                <p className="text-muted-foreground text-xs">Belum ada sesi terjadwal.</p>
              )}
              {card.sessions.length > 0 && (
                <table className="w-full border-separate border-spacing-x-1.5 text-left text-xs">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="font-normal">Tgl</th>
                      <th className="font-normal">Mapel</th>
                      <th className="font-normal">Waktu</th>
                      <th className="font-normal">Ruang</th>
                      <th className="font-normal">No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {card.sessions.map((s, i) => (
                      <tr key={i}>
                        <td className="whitespace-nowrap">{formatTanggal(s.tanggal)}</td>
                        <td>{s.mapel}</td>
                        <td className="whitespace-nowrap">{formatWaktu(s.waktuMulai)}</td>
                        <td>{s.ruang}</td>
                        <td>{s.noPeserta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
