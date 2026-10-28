import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { getCurrentUser } from "@/lib/auth/get-current-user"

export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.type !== "staff" || !["admin", "super_admin"].includes(user.role)) {
    return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 })
  }

  const header = ["No", "NISN", "Nama", "Kelas", "Username", "Password"]
  const contoh = [1, "1234567890", "Contoh Nama Siswa", "VII-A", "1234567890", "01012012"]
  const sheet = XLSX.utils.aoa_to_sheet([header, contoh])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, "Siswa")

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template_import_siswa.xlsx"',
    },
  })
}
