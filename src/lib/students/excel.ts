import "server-only"
import * as XLSX from "xlsx"

export interface StudentImportRow {
  baris: number
  nisn: string
  nama: string
  kelas: string
  username: string
  password: string
}

export interface StudentParseError {
  baris: number
  nisn: string
  alasan: string
}

const REQUIRED_COLUMNS = ["nisn", "nama", "kelas", "username", "password"] as const

// Template: No | NISN | Nama | Kelas | Username | Password (urutan kolom bebas,
// dicocokkan dari nama header, bukan posisi).
export function parseStudentsExcel(buffer: ArrayBuffer): {
  rows: StudentImportRow[]
  parseErrors: StudentParseError[]
} {
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false })

  if (raw.length === 0) {
    return { rows: [], parseErrors: [{ baris: 0, nisn: "-", alasan: "File kosong." }] }
  }

  const headerRow = raw[0].map((cell) => String(cell ?? "").trim().toLowerCase())
  const colIndex: Record<string, number> = {}
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
    const cell = (key: string) => String(r[colIndex[key]] ?? "").trim()

    const nisn = cell("nisn")
    const nama = cell("nama")
    const kelas = cell("kelas")
    const username = cell("username")
    const password = cell("password")

    if (!nisn || !nama || !kelas || !username || !password) {
      parseErrors.push({ baris, nisn: nisn || "-", alasan: "Ada kolom wajib yang kosong." })
      continue
    }

    rows.push({ baris, nisn, nama, kelas, username, password })
  }

  return { rows, parseErrors }
}
