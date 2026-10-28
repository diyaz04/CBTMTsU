import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getSessionAttendance, getSessionInfo } from "@/lib/dokumen/service"
import { PrintButton } from "@/components/dokumen/print-button"

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

export default async function DaftarHadirPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const user = await getCurrentUser()
  const supabase = await createClient()

  const [session, attendance, school] = await Promise.all([
    getSessionInfo(supabase, sessionId),
    getSessionAttendance(supabase, sessionId),
    user && user.type === "staff"
      ? supabase.from("schools").select("nama").eq("id", user.schoolId ?? "").maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  if (!session) notFound()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <Link
            href="/dokumen"
            className="flex size-8 items-center justify-center rounded-lg border text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="text-lg font-bold">Daftar Hadir Peserta</h1>
        </div>
        <PrintButton />
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <p className="text-center text-base font-semibold">DAFTAR HADIR PESERTA UJIAN</p>
        <div className="mx-auto mt-2 grid grid-cols-[auto_1fr] gap-x-3">
          <span className="text-muted-foreground">Sekolah</span>
          <span>: {school?.data?.nama ?? "-"}</span>
          <span className="text-muted-foreground">Ujian</span>
          <span>
            : {session.namaUjian} — {session.paket}
          </span>
          <span className="text-muted-foreground">Mata Pelajaran</span>
          <span>: {session.mapel}</span>
          <span className="text-muted-foreground">Hari/Tanggal</span>
          <span>: {formatTanggal(session.tanggal)}</span>
          <span className="text-muted-foreground">Sesi / Waktu</span>
          <span>
            : Sesi {session.sesiKe} — {formatWaktu(session.waktuMulai)} ({session.durasiMenit} menit)
          </span>
          <span className="text-muted-foreground">Ruang</span>
          <span>: {session.ruang}</span>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">No</th>
            <th className="border px-2 py-1">No. Peserta</th>
            <th className="border px-2 py-1">NISN</th>
            <th className="border px-2 py-1 text-left">Nama</th>
            <th className="border px-2 py-1">Kelas</th>
            <th className="border px-2 py-1">Tanda Tangan</th>
          </tr>
        </thead>
        <tbody>
          {attendance.length === 0 && (
            <tr>
              <td colSpan={6} className="border px-2 py-4 text-center text-muted-foreground">
                Belum ada peserta terdaftar di sesi ini.
              </td>
            </tr>
          )}
          {attendance.map((a, i) => (
            <tr key={a.nisn + i}>
              <td className="border px-2 py-1 text-center">{i + 1}</td>
              <td className="border px-2 py-1 text-center">{a.noPeserta}</td>
              <td className="border px-2 py-1 text-center">{a.nisn}</td>
              <td className="border px-2 py-1">{a.nama}</td>
              <td className="border px-2 py-1 text-center">{a.kelas}</td>
              <td className="border px-2 py-1"></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8 flex justify-end text-sm">
        <div className="flex flex-col items-center gap-16">
          <p>Pengawas Ruang,</p>
          <p>(.....................................)</p>
        </div>
      </div>
    </div>
  )
}
