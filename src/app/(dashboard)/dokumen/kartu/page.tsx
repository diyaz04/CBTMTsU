import QRCode from "qrcode"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getStudentCards } from "@/lib/dokumen/service"
import { passwordFromTanggalLahir } from "@/lib/students/password"
import { PrintButton } from "@/components/dokumen/print-button"
import { now } from "@/lib/now"

const INSTANSI = "KEMENTERIAN AGAMA KABUPATEN TASIKMALAYA"

function tahunAjaran(nowMs: number): string {
  const d = new Date(nowMs)
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  return m >= 7 ? `${y}/${y + 1}` : `${y - 1}/${y}`
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
    qrByStudent.set(c.studentId, await QRCode.toString(c.nisn, { type: "svg", width: 34, margin: 0 }))
  }
  const tahun = tahunAjaran(now())

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
          <h1 className="text-lg font-bold">Kartu Ujian & Akses{kelas ? ` — ${kelas}` : ""}</h1>
        </div>
        <PrintButton />
      </div>

      {cards.length === 0 && <p className="text-muted-foreground text-sm">Tidak ada siswa.</p>}

      <div className="grid grid-cols-2 gap-2 print:grid-cols-2 print:gap-2">
        {cards.map((card) => {
          const ruangan = [...new Set(card.sessions.map((s) => s.ruang))].join(" / ") || "-"
          return (
            <div
              key={card.studentId}
              className="flex flex-col gap-1 border border-black p-1.5 text-[8.5px] leading-tight break-inside-avoid"
            >
              {/* Kop surat: logo - nama instansi - QR kecil */}
              <div className="flex items-center gap-1 border-b border-black pb-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-sekolah.png" alt="" className="size-7 shrink-0 object-contain" />
                <div className="flex-1 text-center">
                  <p className="font-bold text-[7.5px] uppercase">{INSTANSI}</p>
                  <p className="font-bold text-[9px]">{school?.nama ?? "-"}</p>
                </div>
                <div
                  className="size-7 shrink-0"
                  dangerouslySetInnerHTML={{ __html: qrByStudent.get(card.studentId) ?? "" }}
                />
              </div>

              {/* Judul kartu */}
              <div className="text-center">
                <p className="font-bold uppercase">Kartu Ujian Peserta Ujian Madrasah</p>
                <p className="font-bold">Tahun Pelajaran {tahun}</p>
              </div>

              {/* Data peserta */}
              <div className="grid grid-cols-[62px_7px_1fr] gap-y-0.5">
                <span>Nama</span>
                <span>:</span>
                <span className="font-medium">{card.nama}</span>
                <span>ID Peserta</span>
                <span>:</span>
                <span>{card.nisn}</span>
                <span>Kelas</span>
                <span>:</span>
                <span>Kelas {card.kelas}</span>
                <span>Ruangan</span>
                <span>:</span>
                <span>{ruangan}</span>
                <span>User/Password</span>
                <span>:</span>
                <span>
                  {card.username} / {passwordFromTanggalLahir(card.tanggalLahir)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
