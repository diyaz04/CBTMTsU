import "server-only"
import * as XLSX from "xlsx"

export interface StudentImportRow {
  baris: number
  nisn: string
  nama: string
  kelas: string
  username: string
  tanggalLahir: string
}

export interface StudentParseError {
  baris: number
  nisn: string
  alasan: string
}

const REQUIRED_COLUMNS = ["nisn", "nama", "kelas", "username", "tanggal lahir"] as const
type RequiredColumn = (typeof REQUIRED_COLUMNS)[number]

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

// Terima cell tanggal lahir dalam beberapa bentuk: Date object (kalau Excel
// nyimpen sebagai date cell beneran), atau teks "DD/MM/YYYY" / "DD-MM-YYYY" /
// "YYYY-MM-DD" (kalau diketik manual sebagai teks). Hasilnya ISO "YYYY-MM-DD".
function parseTanggalLahir(raw: unknown): string | null {
  if (raw instanceof Date) {
    return `${raw.getUTCFullYear()}-${pad2(raw.getUTCMonth() + 1)}-${pad2(raw.getUTCDate())}`
  }
  const text = String(raw ?? "").trim()
  if (!text) return null

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text)
  if (iso) return `${iso[1]}-${pad2(Number(iso[2]))}-${pad2(Number(iso[3]))}`

  const dmy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(text)
  if (dmy) return `${dmy[3]}-${pad2(Number(dmy[2]))}-${pad2(Number(dmy[1]))}`

  return null
}

// Template: No | NISN | Nama | Kelas | Username | Tanggal Lahir (urutan kolom
// bebas, dicocokkan dari nama header, bukan posisi). Password login = tanggal
// lahir format DDMMYYYY, di-generate sistem (lihat src/lib/students/password.ts).
export function parseStudentsExcel(buffer: ArrayBuffer): {
  rows: StudentImportRow[]
  parseErrors: StudentParseError[]
} {
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array", cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false })

  if (raw.length === 0) {
    return { rows: [], parseErrors: [{ baris: 0, nisn: "-", alasan: "File kosong." }] }
  }

  const headerRow = raw[0].map((cell) => String(cell ?? "").trim().toLowerCase())
  const colIndex: Record<RequiredColumn, number> = {} as Record<RequiredColumn, number>
  for (const col of REQUIRED_COLUMNS) {
    colIndex[col] = headerRow.findIndex((h) => h === col || h.includes(col))
  }

  const missing = REQUIRED_COLUMNS.filter((col) => colIndex[col] === -1)
  if (missing.length > 0) {
    return {
      rows: [],
      parseErrors: [{ baris: 1, nisn: "-", alasan: `Kolom wajib tidak ditemukan: ${missing.join(", ")}` }],
    }
  }

  const rows: StudentImportRow[] = []
  const parseErrors: StudentParseError[] = []

  for (let i = 1; i < raw.length; i++) {
    const r = raw[i]
    const baris = i + 1
    const cell = (key: RequiredColumn) => String(r[colIndex[key]] ?? "").trim()

    const nisn = cell("nisn")
    const nama = cell("nama")
    const kelas = cell("kelas")
    const username = cell("username")
    const tanggalLahir = parseTanggalLahir(r[colIndex["tanggal lahir"]])

    if (!nisn || !nama || !kelas || !username || !tanggalLahir) {
      const alasan = !tanggalLahir && nisn && nama && kelas && username
        ? "Format tanggal lahir tidak dikenali (pakai DD/MM/YYYY)."
        : "Ada kolom wajib yang kosong."
      parseErrors.push({ baris, nisn: nisn || "-", alasan })
      continue
    }

    rows.push({ baris, nisn, nama, kelas, username, tanggalLahir })
  }

  return { rows, parseErrors }
}
