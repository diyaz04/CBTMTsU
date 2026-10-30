import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { requireSesiAccess } from "@/lib/sesi/require-access"
import { getSessionAttempts } from "@/lib/penilaian/service"
import type { AttemptStatus } from "@/types/database"

const STATUS_LABEL: Record<AttemptStatus, string> = {
  not_started: "Belum Mulai",
  in_progress: "Sedang Mengerjakan",
  submitted: "Selesai",
  auto_submitted: "Selesai (Waktu Habis)",
}

function formatTanggal(tanggal: string) {
  return new Date(`${tanggal}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

// Download rekap hasil semua sesi dalam satu ujian jadi satu file Excel —
// dipakai admin/guru/proktor dari halaman "Atur Sesi & Peserta". Nggak
// pakai server action karena butuh ngebalikin file binary + header
// Content-Disposition, bukan JSON.
export async function GET(_req: Request, { params }: { params: Promise<{ examId: string }> }) {
  let access: Awaited<ReturnType<typeof requireSesiAccess>>
  try {
    access = await requireSesiAccess()
  } catch {
    return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 })
  }
  const { schoolId, supabase } = access
  const { examId } = await params

  const { data: exam } = await supabase
    .from("exams")
    .select("id, nama_ujian, paket, school_id")
    .eq("id", examId)
    .maybeSingle()
  if (!exam || exam.school_id !== schoolId) {
    return NextResponse.json({ error: "Ujian tidak ditemukan." }, { status: 404 })
  }

  const { data: sessionRows } = await supabase
    .from("exam_sessions")
    .select("id, sesi_ke, mapel, tanggal, ruang")
    .eq("exam_id", examId)
    .order("tanggal")
    .order("sesi_ke")

  const rows: (string | number)[][] = [
    ["No", "Sesi", "Mata Pelajaran", "Tanggal", "Ruang", "No. Peserta", "NISN", "Nama", "Kelas", "Status", "Nilai"],
  ]

  let no = 1
  for (const session of sessionRows ?? []) {
    const attempts = await getSessionAttempts(supabase, session.id)
    for (const a of attempts) {
      rows.push([
        no++,
        session.sesi_ke,
        session.mapel,
        formatTanggal(session.tanggal),
        session.ruang,
        a.noPeserta,
        a.nisn,
        a.studentNama,
        a.kelas,
        STATUS_LABEL[a.status],
        a.total ?? "",
      ])
    }
  }

  const sheet = XLSX.utils.aoa_to_sheet(rows)
  sheet["!cols"] = [
    { wch: 4 },
    { wch: 6 },
    { wch: 20 },
    { wch: 20 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 28 },
    { wch: 10 },
    { wch: 20 },
    { wch: 8 },
  ]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, "Hasil Ujian")

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer
  const safeName = exam.nama_ujian.replace(/[^a-z0-9]+/gi, "_")

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="hasil_${safeName}.xlsx"`,
    },
  })
}
